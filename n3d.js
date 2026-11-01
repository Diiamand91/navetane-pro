/* =====================================================================
   N3D — moteur de rendu 3D de NAVÉTANE PRO
   Reçoit la simulation existante (state.players / state.ball) et l'affiche
   en 3D avec une caméra TV. Aucune logique de jeu ici : rendu uniquement.
   ===================================================================== */
const N3D = (() => {
  const SX = 105 / 888;             // sim px -> mètres (longueur)
  const SZ = 68 / 480;              // sim px -> mètres (largeur)
  const PITCH_L = 105, PITCH_W = 68;

  let renderer = null, scene = null, camera = null, canvas3 = null;
  let ready = false, failed = false;
  let players3 = [], ball3 = null, ballShadow = null;
  let camState = { x: 0, y: 13.5, z: 40, tx: 0, tz: -2.5, fov: 37 };
  let lastFc = null;
  const _axis = new THREE.Vector3(), _quat = new THREE.Quaternion();

  const mx = (sx) => (sx - 500) * SX;          // x sim -> X monde
  const mz = (sy) => (sy - 332) * SZ;          // y sim -> Z monde

  /* ---------- textures procédurales (aucun fichier externe) ---------- */
  function makePitchTexture() {
    const W = 2048, H = 1330;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    // pelouse : bandes de tonte
    const bands = 16;
    for (let i = 0; i < bands; i++) {
      g.fillStyle = i % 2 ? '#2c6f41' : '#27643b';
      g.fillRect(0, i * H / bands, W, H / bands + 1);
    }
    // vignettage doux
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(255,255,255,0.03)');
    vg.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);

    // lignes (le tracé respecte les proportions 105 x 68)
    const m = 28;                                  // marge extérieure
    const pxW = W - m * 2, pxH = H - m * 2;
    const u = pxW / PITCH_L;                       // 1 m en px
    g.strokeStyle = 'rgba(255,255,255,0.80)';
    g.lineWidth = 3.0; g.lineJoin = 'round';
    g.strokeRect(m, m, pxW, pxH);
    // ligne médiane + rond central
    g.beginPath(); g.moveTo(W / 2, m); g.lineTo(W / 2, m + pxH); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 9.15 * u, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 3.2, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    // surfaces de réparation (16,5 m) et buts (5,5 m)
    const boxD = 16.5 * u, boxW = 40.32 * u, gaD = 5.5 * u, gaW = 18.32 * u;
    const penR = 11 * u;
    [[m, 1], [m + pxW, -1]].forEach(([bx, dir]) => {
      g.strokeRect(bx, H / 2 - boxW / 2, dir * boxD, boxW);
      g.strokeRect(bx, H / 2 - gaW / 2, dir * gaD, gaW);
      g.beginPath(); g.arc(bx + dir * penR, H / 2, 3.2, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      // arc de surface
      g.beginPath();
      const a0 = dir > 0 ? -0.93 : Math.PI - 0.93, a1 = dir > 0 ? 0.93 : Math.PI + 0.93;
      g.arc(bx + dir * penR, H / 2, 9.15 * u, a0, a1);
      g.stroke();
    });
    // coins
    [[m, m, 1, 1], [m + pxW, m, -1, 1], [m, m + pxH, 1, -1], [m + pxW, m + pxH, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      g.beginPath(); g.arc(cx, cy, 1.2 * u, 0, Math.PI * 2); g.stroke();
    });
    return c;
  }

  function makeCrowdTexture(base) {
    const W = 512, H = 128;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = base || '#243244'; g.fillRect(0, 0, W, H);
    const cols = ['#e8eefc', '#ffcf5c', '#25d366', '#4f8cff', '#ff5c7a', '#f5f5f5'];
    for (let y = 8; y < H; y += 11) {
      for (let x = 4; x < W; x += 9) {
        if (Math.random() < 0.72) {
          g.fillStyle = cols[(Math.random() * cols.length) | 0];
          g.globalAlpha = 0.30 + Math.random() * 0.55;
          g.fillRect(x + Math.random() * 2, y + Math.random() * 2, 4, 4);
        }
      }
    }
    g.globalAlpha = 1;
    // ombrage du toit (haut) et mur de béton (bas) : la texture sert sur toute la hauteur
    const shade = g.createLinearGradient(0, 0, 0, H * 0.42);
    shade.addColorStop(0, 'rgba(0,0,0,0.62)');
    shade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = shade; g.fillRect(0, 0, W, H * 0.42);
    g.fillStyle = '#2b3546'; g.fillRect(0, H * 0.845, W, H * 0.155);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, H * 0.845, W, 2);
    return c;
  }

  function makeAdTexture() {
    const W = 1024, H = 64;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, W, 0);
    grd.addColorStop(0, '#0a1220'); grd.addColorStop(0.5, '#132038'); grd.addColorStop(1, '#0a1220');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.font = '900 26px Segoe UI, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const words = ['NAVÉTANE PRO', 'LE FOOTBALL DES QUARTIERS', 'ASC · NAVÉTANES 2026', 'LA GLOIRE DES ASC'];
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? '#ffcf5c' : '#cfe0ff';
      g.fillText(words[i], W * (i + 0.5) / 4, H / 2 + 1);
    }
    return c;
  }

  /* ---------- ballon : pentagones noirs sur fond blanc ---------- */
  function makeBallTexture() {
    const W = 256, H = 128;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#f7f9fc'; g.fillRect(0, 0, W, H);
    const penta = (cx, cy, r, rot) => {
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = rot + i * Math.PI / 4;
        const rr = i % 2 ? r * 0.62 : r;
        const x = cx + Math.cos(a) * rr * 1.35, y = cy + Math.sin(a) * rr;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fill();
    };
    g.fillStyle = '#1b2430';
    for (let i = 0; i < 5; i++) {
      penta(26 + i * 52, 34, 11, 0.3);
      penta(52 + i * 52, 92, 11, 0.9);
    }
    g.strokeStyle = 'rgba(120,140,170,0.35)'; g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * 46, 0); g.lineTo(i * 46 + 22, H); g.stroke(); }
    return c;
  }

  /* ---------- maillot : numéro devant et derrière ---------- */
  const shirtCache = {};
  function makeShirtTexture(color, num, dark) {
    const key = color + '|' + num + '|' + (dark ? 1 : 0);
    if (shirtCache[key]) return shirtCache[key];
    const W = 256, H = 128;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const col = '#' + color.toString(16).padStart(6, '0');
    g.fillStyle = col; g.fillRect(0, 0, W, H);
    // liseré d'épaule
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, 0, W, 9);
    g.fillStyle = 'rgba(0,0,0,0.20)'; g.fillRect(0, H - 10, W, 10);
    const ink = dark ? '#f4f7ff' : '#12161d';
    g.fillStyle = ink;
    g.font = 'bold 52px -apple-system, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const label = String(num == null ? '' : num);
    [W * 0.25, W * 0.75].forEach(x => g.fillText(label, x, H * 0.46));
    shirtCache[key] = c;
    return c;
  }

  function tex(canvas, repeatX, repeatY) {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 4;
    if (repeatX || repeatY) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX || 1, repeatY || 1); }
    return t;
  }

  /* ---------- construction de la scène ---------- */
  const SKINS = [0x8d5a3b, 0x6b3f22, 0xa9714a, 0x4e2c15, 0x7d4a2b, 0x3d2210];
  /* les couleurs de club peuvent être des nombres ou des chaînes CSS */
  const toNum = (c) => {
    if (typeof c === 'number' && isFinite(c)) return c;
    const v = parseInt(String(c || '').replace('#', ''), 16);
    return isFinite(v) ? v : 0x1b6ef3;
  };
  const HAIRS = [0x14100c, 0x1b1310, 0x241a12, 0x0d0b09, 0x2e2318, 0x0a0908];

  function buildStadium() {
    // sol autour (asphalte / piste)
    const outer = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_L + 36, PITCH_W + 40),
      new THREE.MeshLambertMaterial({ color: 0x1d3a2a })
    );
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; scene.add(outer);

    // pelouse + tracés
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_L, PITCH_W),
      new THREE.MeshLambertMaterial({ map: tex(makePitchTexture()) })
    );
    pitch.rotation.x = -Math.PI / 2; scene.add(pitch);

    // filet (texture de grille réutilisée pour les 2 buts)
    const netCanvas = document.createElement('canvas'); netCanvas.width = netCanvas.height = 128;
    const ng = netCanvas.getContext('2d');
    ng.clearRect(0, 0, 128, 128);
    ng.strokeStyle = 'rgba(232,240,255,0.9)'; ng.lineWidth = 1.6;
    for (let i = 0; i <= 128; i += 9) {
      ng.beginPath(); ng.moveTo(i, 0); ng.lineTo(i, 128); ng.stroke();
      ng.beginPath(); ng.moveTo(0, i); ng.lineTo(128, i); ng.stroke();
    }
    const netTex = tex(netCanvas, 3, 1);
    // buts
    [-1, 1].forEach(side => {
      const g = new THREE.Group();
      const postMat = new THREE.MeshLambertMaterial({ color: 0xf2f6ff });
      const postGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.44, 8);
      [-3.66, 3.66].forEach(z => {
        const p = new THREE.Mesh(postGeo, postMat);
        p.position.set(0, 1.22, z); g.add(p);
      });
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 7.32, 8), postMat);
      bar.rotation.x = Math.PI / 2; bar.position.set(0, 2.44, 0); g.add(bar);
      // filet : grille fine transparente
      const netMat = new THREE.MeshBasicMaterial({ map: netTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
      const back = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44), netMat);
      back.position.set(side * 2.0, 1.22, 0); back.rotation.y = Math.PI / 2; g.add(back);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 7.32), netMat);
      top.position.set(side * 1.0, 2.44, 0); top.rotation.x = -Math.PI / 2; g.add(top);
      [-3.66, 3.66].forEach(z => {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.44), netMat);
        s.position.set(side * 1.0, 1.22, z); g.add(s);
      });
      g.position.set(side * (PITCH_L / 2 + 0.1), 0, 0);
      scene.add(g);
    });

    // panneaux publicitaires (LED)
    const adTex = tex(makeAdTexture(), 4, 1);
    const adMat = new THREE.MeshBasicMaterial({ map: adTex });
    [[0, -PITCH_W / 2 - 2.5, 0]].forEach(([x, z]) => {
      const ad = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_L, 1.1), adMat);
      ad.position.set(x, 0.55, z);
      if (z < 0) ad.rotation.y = Math.PI;
      scene.add(ad);
    });

    // tribunes : 4 blocs inclinés avec texture de foule
    const crowdA = tex(makeCrowdTexture('#243244'), 6, 1);
    const crowdB = tex(makeCrowdTexture('#22303f'), 6, 1);
    const mkStand = (w, x, z, rotY, t) => {
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(w, 13, 18),
        [new THREE.MeshLambertMaterial({ color: 0x121a2a }),
         new THREE.MeshLambertMaterial({ color: 0x121a2a }),
         new THREE.MeshLambertMaterial({ color: 0x0d1522 }),
         new THREE.MeshLambertMaterial({ color: 0x0d1522 }),
         new THREE.MeshLambertMaterial({ map: t }),
         new THREE.MeshLambertMaterial({ color: 0x121a2a })]
      );
      stand.position.set(x, 6.0, z); stand.rotation.y = rotY;
      stand.rotation.x = 0.10;
      scene.add(stand);
    };
    mkStand(PITCH_L + 30, 0, -PITCH_W / 2 - 11, 0, crowdA);
    mkStand(PITCH_L + 30, 0, PITCH_W / 2 + 34, Math.PI, crowdB);
    mkStand(PITCH_W + 30, -PITCH_L / 2 - 21, 0, Math.PI / 2, crowdA);
    mkStand(PITCH_W + 30, PITCH_L / 2 + 21, 0, -Math.PI / 2, crowdB);

    // éclairage
    scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
    scene.add(new THREE.HemisphereLight(0x9fbcff, 0x14240f, 0.45));
    const sun = new THREE.DirectionalLight(0xfff4e0, 0.95);
    sun.position.set(-35, 70, 30);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb0ff, 0.22);
    fill.position.set(45, 25, -55);
    scene.add(fill);
    // ciel nocturne dégradé
    const skyGeo = new THREE.SphereGeometry(320, 16, 12);
    const skyCv = document.createElement('canvas'); skyCv.width = 8; skyCv.height = 128;
    const sg = skyCv.getContext('2d');
    const grad = sg.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#050a14'); grad.addColorStop(0.62, '#0a1322'); grad.addColorStop(1, '#0d1b2b');
    sg.fillStyle = grad; sg.fillRect(0, 0, 8, 128);
    scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: tex(skyCv), side: THREE.BackSide, fog: false, depthWrite: false })));
  }

  /* ---------- joueur 3D (silhouette humaine, semi-réaliste) ---------- */
  function buildPlayer(colors) {
    const g = new THREE.Group();
    const body = new THREE.Group();          // pivot du corps : plongeon, célébration…
    g.add(body); g.userData.body = body;
    const skin = new THREE.MeshLambertMaterial({ color: colors.skin });
    const shirtTex = makeShirtTexture(colors.shirt, colors.num, colors.darkNum);
    const shirt = new THREE.MeshLambertMaterial({ map: tex(shirtTex) });
    const shorts = new THREE.MeshLambertMaterial({ color: colors.shorts });
    const sock = new THREE.MeshLambertMaterial({ color: colors.sock });
    const hair = new THREE.MeshLambertMaterial({ color: colors.hair || 0x1a1410 });

    // torse (léger trapèze)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.25, 0.62, 12), shirt);
    torso.position.y = 1.16; body.add(torso);
    // épaules
    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.255, 10, 8), shirt);
    shoulders.position.y = 1.44; shoulders.scale.set(1, 0.72, 0.92); body.add(shoulders);
    // cheveux
    const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.142, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
    hairM.position.y = 1.645; hairM.scale.set(1, 1.05, 1); body.add(hairM);
    // tête + cou
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), skin);
    head.position.y = 1.62; head.scale.set(1, 1.12, 1); body.add(head);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8), skin);
    neck.position.y = 1.51; body.add(neck);
    // bassin
    const hip = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.26, 10), shorts);
    hip.position.y = 0.82; body.add(hip);

    const limbs = { legs: [], arms: [] };
    [-1, 1].forEach(side => {
      // cuisse
      const thigh = new THREE.Group(); thigh.position.set(0, 0.80, side * 0.085);
      const thighM = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.085, 0.42, 8), shorts);
      thighM.position.y = -0.21; thigh.add(thighM);
      // jambe
      const shin = new THREE.Group(); shin.position.y = -0.42;
      const shinM = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.062, 0.40, 8), sock);
      shinM.position.y = -0.20; shin.add(shinM);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.10), new THREE.MeshLambertMaterial({ color: 0x11160f }));
      foot.position.set(0.05, -0.40, 0); shin.add(foot);
      thigh.add(shin);
      body.add(thigh);
      limbs.legs.push({ thigh, shin });

      // bras
      const arm = new THREE.Group(); arm.position.set(0, 1.40, side * 0.245);
      const armM = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.05, 0.52, 8), shirt);
      armM.position.y = -0.26; arm.add(armM);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.16, 8), shirt);
      sleeve.position.y = -0.06; arm.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin);
      hand.position.y = -0.55; arm.add(hand);
      body.add(arm);
      limbs.arms.push(arm);
    });

    g.traverse(o => { if (o.isMesh) o.castShadow = false; });
    g.userData.limbs = limbs;
    g.userData.torso = torso;
    return g;
  }

  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    rg.addColorStop(0, 'rgba(0,0,0,0.55)');
    rg.addColorStop(0.6, 'rgba(0,0,0,0.22)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  function makeShadow(size) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2; m.position.y = 0.02;
    return m;
  }

  /* ---------- API ---------- */
  function init(canvas) {
    if (ready || failed) return ready;
    try {
      canvas3 = canvas;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x060a12, 1);
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x060a12, 120, 260);
      camera = new THREE.PerspectiveCamera(37, 16 / 9, 0.3, 700);
      buildStadium();

      // ballon
      ball3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 18, 14),
        new THREE.MeshLambertMaterial({ map: tex(makeBallTexture()) })
      );
      ball3.position.y = 0.12;
      scene.add(ball3);
      ballShadow = makeShadow(0.7); scene.add(ballShadow);

      ready = true;
      resize();
      return true;
    } catch (e) {
      failed = true;
      console.warn('N3D indisponible :', e && e.message);
      return false;
    }
  }

  function resize() {
    if (!renderer) return;
    const el = renderer.domElement;
    const w = el.clientWidth || 960, h = el.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lastFc = null;
  }

  /* recrée les joueurs si les équipes changent */
  function syncPlayers(players, teams) {
    const sig = players.length + '|' + (teams ? teams.map(t => t.id + t.c1).join(',') : '');
    if (sig === N3D._sig) return;
    N3D._sig = sig;
    players3.forEach(o => scene.remove(o.grp));
    players3 = [];
    players.forEach((p, i) => {
      const team = teams[p.team] || teams[0];
      const shirtColor = p.ref ? 0x1a1f27 : toNum(p.isGK ? (team.gkC || 0xf2c31a) : (team.c1 || 0x1b6ef3));
      const lum = ((shirtColor >> 16 & 255) * 0.299 + (shirtColor >> 8 & 255) * 0.587 + (shirtColor & 255) * 0.114) / 255;
      const col = {
        shirt: shirtColor,
        num: p.num,
        darkNum: lum < 0.55,
        shorts: p.isGK ? 0x1a2233 : 0x0e1520,
        sock: p.isGK ? 0x1a2233 : toNum(team.c1 || 0x1b6ef3),
        skin: SKINS[(i * 7 + (p.num || 0)) % SKINS.length],
        hair: HAIRS[(i * 3 + (p.num || 0)) % HAIRS.length]
      };
      const grp = buildPlayer(col);
      grp.add(makeShadow(1.05));
      scene.add(grp);
      players3.push({ grp, p, phase: Math.random() * 6.28 });
    });
  }

  /* ---------- caméra TV ----------
     Régie broadcast : la caméra reste en tribune, glisse sur la longueur avec
     le ballon, et un zoom automatique garde les joueurs à taille lisible. */
  const CAM_BACK = 34;        // recul par rapport au ballon (m)
  const CAM_HEIGHT = 13.5;    // hauteur en tribune (m)
  const CAM_HALF_H = 12;      // demi-hauteur de champ visé au niveau du ballon (m)

  function updateCamera(dt, ballPos) {
    const bx = ballPos.x, bz = ballPos.z;
    const k = 1 - Math.pow(0.0008, dt);           // amorti indépendant du framerate

    const wantX = Math.max(-30, Math.min(30, bx * 0.55));
    const wantZ = Math.max(37, Math.min(60, bz + CAM_BACK));
    camState.x += (wantX - camState.x) * k;
    camState.z += (wantZ - camState.z) * k;
    camState.y += (CAM_HEIGHT - camState.y) * k * 0.7;
    camState.tx += (bx * 0.94 - camState.tx) * k * 1.15;
    camState.tz += (bz * 0.90 - 2.5 - camState.tz) * k * 1.15;

    camera.position.set(camState.x, camState.y, camState.z);
    camera.lookAt(camState.tx, 1.1, camState.tz);

    // zoom "téléobjectif" : plus l'action est loin, plus on resserre
    const dist = Math.hypot(camState.x - camState.tx, camState.y, camState.z - camState.tz);
    let fov = 2 * Math.atan(CAM_HALF_H / Math.max(8, dist)) * 180 / Math.PI;
    fov = Math.max(21, Math.min(56, fov));
    if (Math.abs(camera.fov - fov) > 0.02) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }
  }

  function draw(dt, state) {
    if (!ready || !state) return false;
    const players = state.players || [];
    const b = state.ball || { x: 500, y: 332, z: 0, vx: 0, vy: 0 };
    if (renderer.domElement.clientWidth !== lastFc) { lastFc = renderer.domElement.clientWidth; resize(); }
    syncPlayers(players, state.teams || [{ id: 'x', c1: 0x1b6ef3 }, { id: 'y', c1: 0xe2223b }]);
    const ballPos = { x: mx(b.x), z: mz(b.y) };
    ball3.position.set(ballPos.x, 0.115 + (b.z || 0) * SX, ballPos.z);
    const bvx = (b.vx || 0) * SX, bvz = (b.vy || 0) * SZ;
    const bsp = Math.hypot(bvx, bvz);
    if (bsp > 0.15) {
      // axe de rotation = vertical x direction de déplacement
      _axis.set(bvz, 0, -bvx).normalize();
      _quat.setFromAxisAngle(_axis, (bsp * dt) / 0.115);
      ball3.quaternion.premultiply(_quat);
    }
    ballShadow.position.set(ballPos.x, 0.03, ballPos.z);
    const sh = Math.max(0.25, 1 - (b.z || 0) * 0.004);
    ballShadow.scale.setScalar(sh);

    players3.forEach(o => {
      const p = o.p;
      const X = mx(p.x), Z = mz(p.y);
      o.grp.position.set(X, 0, Z);
      // orientation : vers son déplacement, sinon vers le ballon
      const sp = Math.hypot(p.vx || 0, p.vy || 0);
      let ang;
      if (sp > 0.12) ang = Math.atan2(p.vy, p.vx);
      else ang = Math.atan2(b.y - p.y, b.x - p.x);
      o.grp.rotation.y = -ang + Math.PI / 2;

      const L = o.grp.userData.limbs;
      const body = o.grp.userData.body;
      body.rotation.set(0, 0, 0);
      body.position.set(0, 0, 0);
      L.arms[0].rotation.set(0, 0, 0); L.arms[1].rotation.set(0, 0, 0);

      const diving = (p.diveT || 0) > 0;
      const celebrating = state.phase === 'goal' && state.kickoffTeam === 1 - p.team;

      if (diving) {
        // ---------- plongeon du gardien ----------
        const k = 1 - p.diveT / 26;                 // 0 → 1
        const e = Math.sin(Math.min(1, k * 1.5) * Math.PI / 2);
        const dir = p.diveDir || 1;
        body.rotation.z = -dir * 1.35 * e;
        body.position.y = 0.32 * Math.sin(Math.min(1, k * 1.9) * Math.PI);
        L.arms[0].rotation.z = 1.5 * e * dir;
        L.arms[1].rotation.z = 1.25 * e * dir;
        L.arms[0].rotation.x = -0.5 * e;
        L.legs[0].thigh.rotation.x = 0.25 * e;
        L.legs[1].thigh.rotation.x = -0.15 * e;
        L.legs[0].shin.rotation.x = 0.4 * e;
        L.legs[1].shin.rotation.x = 0.2 * e;
      } else if (celebrating) {
        // ---------- célébration de but ----------
        const t = state.clock * 6 + o.phase;
        body.position.y = Math.abs(Math.sin(t)) * 0.28;
        L.arms[0].rotation.x = -2.55 + Math.sin(t * 1.3) * 0.25;
        L.arms[1].rotation.x = -2.55 - Math.sin(t * 1.3) * 0.25;
        L.legs[0].thigh.rotation.x = Math.sin(t) * 0.25;
        L.legs[1].thigh.rotation.x = -Math.sin(t) * 0.25;
        L.legs[0].shin.rotation.x = 0; L.legs[1].shin.rotation.x = 0;
        L.arms[0].rotation.z = 0.35; L.arms[1].rotation.z = -0.35;
      } else if ((p.tackleT || 0) > 0) {
        // ---------- tacle glissé ----------
        const k = 1 - p.tackleT / 16;
        const e = Math.sin(Math.min(1, k * 1.25) * Math.PI / 2);
        body.rotation.x = 0.95 * e;                 // buste vers l'avant
        body.position.y = -0.42 * e;                // on se baisse
        L.legs[0].thigh.rotation.x = -1.25 * e;     // jambe tendue vers le ballon
        L.legs[0].shin.rotation.x = 0.15 * e;
        L.legs[1].thigh.rotation.x = 0.55 * e;      // jambe d'appui repliée
        L.legs[1].shin.rotation.x = 1.1 * e;
        L.arms[0].rotation.x = 0.9 * e;
        L.arms[1].rotation.x = -0.5 * e;
        L.arms[0].rotation.z = 0.6 * e;
        L.arms[1].rotation.z = -0.45 * e;
      } else {
        // ---------- course / frappe ----------
        const speed = Math.min(1.6, sp / 2.2);
        o.phase += dt * (0.14 + speed * 0.55);
        const sw = Math.sin(o.phase) * (0.30 + speed * 0.38);
        if (p.kickAnim > 0) {
          // frappe : jambe d'appui + jambe qui fouette
          const kk = Math.min(1, p.kickAnim / 16);
          const swing = Math.sin(kk * Math.PI) * 1.15;
          const kickLeg = (p.aim || 0) > 0 ? 0 : 1;
          L.legs[kickLeg].thigh.rotation.x = -swing;
          L.legs[kickLeg].shin.rotation.x = swing * 0.55;
          L.legs[1 - kickLeg].thigh.rotation.x = 0.28;
          L.legs[1 - kickLeg].shin.rotation.x = 0.12;
          L.arms[0].rotation.x = swing * 0.5;
          L.arms[1].rotation.x = -swing * 0.35;
        } else {
          L.legs[0].thigh.rotation.x = sw;
          L.legs[1].thigh.rotation.x = -sw;
          L.legs[0].shin.rotation.x = Math.max(0, -sw) * 1.35;
          L.legs[1].shin.rotation.x = Math.max(0, sw) * 1.35;
          L.arms[0].rotation.x = -sw * 0.55;
          L.arms[1].rotation.x = sw * 0.55;
        }
        if (p.isGK) {
          // gardien : gants sortis, jambes fléchies
          L.arms[0].rotation.z = 0.62; L.arms[1].rotation.z = -0.62;
          L.arms[0].rotation.x -= 0.35; L.arms[1].rotation.x -= 0.35;
          body.position.y = -0.06;
        } else if (state.phase === 'play' && p.kickAnim <= 0) {
          body.position.y = Math.abs(Math.sin(o.phase)) * 0.02 * speed;
        }
        o.grp.userData.torso.rotation.x = speed * 0.16;
      }
    });

    updateCamera(dt, ballPos);
    renderer.render(scene, camera);
    return true;
  }

  /* qualité adaptative : si l'appareil rame, on baisse la résolution de rendu */
  function setQuality(level) {
    if (!renderer) return;
    renderer.setPixelRatio(level <= 0 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    resize();
  }

  return {
    init, resize, draw, setQuality,
    get info() { return renderer ? { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, texs: renderer.info.memory.textures, progs: renderer.info.programs ? renderer.info.programs.length : 0 } : null; },
    get ready() { return ready; },
    get failed() { return failed; },
    _sig: null
  };
})();
