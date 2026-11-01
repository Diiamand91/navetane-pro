/*
 * NAVÉTANE PRO — serveur de jeu en ligne
 * Statique (le jeu) + WebSocket (salons) — aucune dépendance, Node 18+.
 *
 *   node server.js            → http://localhost:3000
 *   PORT=8080 node server.js  → autre port
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

/* ------------------------------- statique ------------------------------- */
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const HIDE = /(^|\/)(server\.js|package-lock\.json|README\.md|\.env|\.git)(\/|$)/i;
  if (HIDE.test(p)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.webmanifest') ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(buf);
  });
});

/* ------------------------------ WebSocket ------------------------------- */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const accept = key => crypto.createHash('sha1').update(key + GUID).digest('base64');

class Conn {
  constructor(socket) {
    this.socket = socket;
    this.buf = Buffer.alloc(0);
    this.room = null;
    this.role = null;
    this.club = null;
    this.alive = true;
  }
  send(obj) {
    if (!this.alive) return;
    const payload = Buffer.from(JSON.stringify(obj), 'utf8');
    const len = payload.length;
    let head;
    if (len < 126) { head = Buffer.from([0x81, len]); }
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
    try { this.socket.write(Buffer.concat([head, payload])); } catch (e) { this.alive = false; }
  }
  pong(payload) {
    const head = Buffer.from([0x8a, payload.length]);
    try { this.socket.write(Buffer.concat([head, payload])); } catch (e) {}
  }
  destroy() {
    this.alive = false;
    try { this.socket.destroy(); } catch (e) {}
  }
}

function readFrames(conn, chunk) {
  conn.buf = Buffer.concat([conn.buf, chunk]);
  for (;;) {
    const b = conn.buf;
    if (b.length < 2) return;
    const op = b[0] & 0x0f;
    const masked = (b[1] & 0x80) !== 0;
    let len = b[1] & 0x7f;
    let off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    const maskLen = masked ? 4 : 0;
    if (b.length < off + maskLen + len) return;
    let payload = b.subarray(off + maskLen, off + maskLen + len);
    if (masked) {
      const mask = b.subarray(off, off + maskLen);
      const out = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
      payload = out;
    }
    conn.buf = b.subarray(off + maskLen + len);
    if (op === 0x8) { drop(conn); return; }
    if (op === 0x9) { conn.pong(Buffer.from(payload)); continue; }
    if (op === 0x1) { onMessage(conn, payload.toString('utf8')); if (!conn.alive) return; }
    if (op === 0xa) continue;
  }
}

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const res = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Accept: ' + accept(key)
  ].join('\r\n') + '\r\n\r\n';
  socket.write(res);
  socket.setNoDelay(true);
  const conn = new Conn(socket);
  socket.on('data', c => { try { readFrames(conn, c); } catch (e) { drop(conn); } });
  socket.on('error', () => drop(conn));
  socket.on('close', () => drop(conn));
});

/* -------------------------------- salons -------------------------------- */
const rooms = new Map();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sans I, O, 0, 1

function newCode() {
  let c = '';
  for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return rooms.has(c) ? newCode() : c;
}

function roomState(room, to) {
  return {
    t: 'room',
    code: room.code,
    you: to === room.host ? 'host' : 'guest',
    hostClub: room.hostClub,
    guestClub: room.guestClub,
    guest: !!room.guest,
    started: room.started
  };
}

function broadcast(room) {
  if (room.host) room.host.send(roomState(room, room.host));
  if (room.guest) room.guest.send(roomState(room, room.guest));
}

function leaveRoom(conn) {
  const room = conn.room;
  if (!room) return;
  const peer = conn === room.host ? room.guest : room.host;
  if (peer && peer.alive) {
    peer.room = null; peer.role = null;
    peer.send({ t: 'peerGone' });
  }
  rooms.delete(room.code);
  conn.room = null; conn.role = null;
}

function drop(conn) {
  if (!conn.alive && !conn.room) return;
  leaveRoom(conn);
  conn.alive = false;
  conn.destroy();
}

function onMessage(conn, raw) {
  let m;
  try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m.t !== 'string') return;

  switch (m.t) {
    case 'create': {
      leaveRoom(conn);
      const code = newCode();
      const room = { code, host: conn, guest: null, hostClub: m.club || null, guestClub: null, started: false };
      rooms.set(code, room);
      conn.room = room; conn.role = 'host'; conn.club = m.club;
      conn.send(roomState(room, conn));
      break;
    }

    case 'join': {
      const code = String(m.code || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) return conn.send({ t: 'err', msg: 'Salon introuvable. Vérifie le code.' });
      if (room.guest) return conn.send({ t: 'err', msg: 'Ce salon est complet.' });
      if (room.host === conn) return conn.send({ t: 'err', msg: 'Tu es déjà dans ce salon.' });
      if (m.club && m.club === room.hostClub)
        return conn.send({ t: 'err', msg: 'Ton ami joue déjà ce club : choisis-en un autre.' });
      leaveRoom(conn);
      room.guest = conn; room.guestClub = m.club || null; room.started = false;
      conn.room = room; conn.role = 'guest'; conn.club = m.club;
      broadcast(room);
      break;
    }

    case 'club': {
      const room = conn.room; if (!room) return;
      if (conn === room.host) room.hostClub = m.club;
      else room.guestClub = m.club;
      conn.club = m.club;
      broadcast(room);
      break;
    }

    case 'start': {
      const room = conn.room; if (!room || conn !== room.host) return;
      if (!room.guest || !room.hostClub || !room.guestClub) return;
      if (room.hostClub === room.guestClub) return conn.send({ t: 'err', msg: 'Les deux joueurs ont le même club.' });
      room.started = true;
      room.host.send({ t: 'start', hostClub: room.hostClub, guestClub: room.guestClub });
      room.guest.send({ t: 'start', hostClub: room.hostClub, guestClub: room.guestClub });
      break;
    }

    case 's': {   // instantané de l'hôte → invité
      const room = conn.room;
      if (room && conn === room.host && room.guest) room.guest.send(m);
      break;
    }

    case 'in': {  // entrée de l'invité → hôte
      const room = conn.room;
      if (room && conn === room.guest && room.host) room.host.send(m);
      break;
    }

    case 'bye':
      leaveRoom(conn);
      break;
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NAVÉTANE PRO en ligne : http://localhost:${PORT}  (salons WebSocket actifs)`);
});
