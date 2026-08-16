/* ============================================================
   art.js - every pixel you see is drawn here, by code.

   There is not a single image file in this project. Characters are
   little jointed puppets (a head, a body, two arms, two legs) whose
   joints are rotated by maths each frame, and the scenery is built
   from paths - hills, palm trees, gopuram towers, fort walls.

   Why do it this way? No downloads, no licences, nothing to load,
   and it stays razor sharp on a big screen and tiny on a phone.
   ============================================================ */
(function () {
  var Art = {};

  /* ---------- colour palettes ----------
     One palette per level. Changing these six-or-so colours changes
     the entire mood of a level, which is the cheapest art trick there is. */
  Art.PALETTES = {
    grove: {                       // Level 1 - morning, green, hopeful
      skyTop: '#2e6f7a', skyBot: '#8fc38a',
      sun: '#ffeab0',
      far: '#4c7f6d', mid: '#356152', near: '#1f3f36',
      groundTop: '#5d8a44', groundFace: '#3c5a2c', groundDeep: '#25391c',
      stone: '#7d8a6a', stoneDark: '#525d44',
      accent: '#e0b040', haze: 'rgba(180,220,190,0.20)'
    },
    fort: {                        // Level 2 - late afternoon, sand and stone
      skyTop: '#4a3358', skyBot: '#e29a52',
      sun: '#ffd79a',
      far: '#9a6b46', mid: '#734c33', near: '#42291c',
      groundTop: '#b98b57', groundFace: '#8a6238', groundDeep: '#513920',
      stone: '#9a8462', stoneDark: '#5f513a',
      accent: '#f0c460', haze: 'rgba(240,190,130,0.18)'
    },
    hall: {                        // Level 3 - inside the Pandya palace, night, firelight
      skyTop: '#0a0a14', skyBot: '#1a1220',
      sun: '#ffb347',
      far: '#241a2b', mid: '#191222', near: '#0d0912',
      groundTop: '#3a2c3f', groundFace: '#241a28', groundDeep: '#120c16',
      stone: '#43354a', stoneDark: '#241b29',
      accent: '#ff9a3c', haze: 'rgba(255,140,50,0.10)'
    }
  };

  /* ---------- character colours ---------- */
  var SKIN = '#9c6440', SKIN_DARK = '#7a4b2e';
  var HAIR = '#1b1310';

  Art.HERO = {
    skin: SKIN, skinDark: SKIN_DARK, hair: HAIR,
    cloth: '#f2e6c9',     // white-gold dhoti
    sash: '#b4302a',      // Chola red
    gold: '#e8bd4c',
    trim: '#8c1f1a'
  };

  Art.GUARD = {
    skin: SKIN, skinDark: SKIN_DARK, hair: HAIR,
    cloth: '#2f6b63',     // Pandya teal
    sash: '#1d443f',
    gold: '#c9a24a',
    metal: '#9aa3ac',
    trim: '#123330'
  };

  // The Chola king's own men - ochre and cream, tiger colours
  Art.CHOLA = {
    skin: SKIN, skinDark: SKIN_DARK, hair: HAIR,
    cloth: '#e8dcc0', sash: '#a8451e', gold: '#d8b24e', metal: '#a8b0b8', trim: '#7a2f14'
  };

  Art.CAPTAIN = {
    skin: SKIN, skinDark: SKIN_DARK, hair: HAIR,
    cloth: '#4a3f78', sash: '#2b2450', gold: '#d8b24e', metal: '#b9c2cb', trim: '#1d1836'
  };

  Art.BOSS = {
    skin: '#8a5230', skinDark: '#6a3c22', hair: '#140e0b',
    cloth: '#5c1f2a', sash: '#38101a', gold: '#d9a441', metal: '#8d949c', trim: '#240a10'
  };

  Art.PRINCESS = {
    skin: '#a56c46', skinDark: '#83502f', hair: '#160f0c',
    cloth: '#c8447a', sash: '#8e2452', gold: '#f0cd66'
  };

  /* ---------- small drawing helpers ---------- */

  function limb(ctx, x, y, l1, l2, a1, a2, w, colA, colB) {
    // a1 is the angle of the upper part, a2 of the lower part.
    // 0 radians points straight down, positive turns forwards.
    var kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
    var ex = kx + Math.sin(a2) * l2, ey = ky + Math.cos(a2) * l2;
    ctx.lineCap = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = colA;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.strokeStyle = colB || colA;
    ctx.lineWidth = w * 0.86;
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(ex, ey); ctx.stroke();
    return { x: ex, y: ey, kx: kx, ky: ky };
  }

  // a small bare foot at the end of a leg, pointing the way the shin points
  function foot(ctx, end, angle, col) {
    ctx.save();
    ctx.translate(end.x, end.y);
    ctx.rotate(angle * 0.35);
    ctx.fillStyle = col;
    Art.roundRect(ctx, -1.4, -0.9, 4.4, 2.2, 1.1);
    ctx.fill();
    ctx.restore();
  }

  function ellipse(ctx, x, y, rx, ry, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  Art.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /* ============================================================
     THE HUMAN PUPPET
     Everything is drawn relative to (0,0) = the ground between the feet.
     Up is negative y. h = how tall this person is in pixels.
     ============================================================ */
  Art.drawPerson = function (ctx, opts) {
    var col = opts.colors || Art.HERO;
    /* A "tint" paints the whole figure in one colour. We use it to stamp a
       soft dark copy just behind each fighter, which lifts them off the
       scenery without needing an outline around every shape. */
    if (opts.tint) {
      col = { skin: opts.tint, skinDark: opts.tint, hair: opts.tint, cloth: opts.tint,
              sash: opts.tint, gold: opts.tint, metal: opts.tint, trim: opts.tint };
    }
    var h = opts.height || 30;
    var t = opts.t || 0;             // animation clock, in seconds
    var anim = opts.anim || 'idle';
    var face = opts.facing || 1;
    var weapon = opts.weapon || 'none';   // none | dagger | sword | spear | club
    var s = h / 30;                  // scale everything off a 30px-tall reference

    ctx.save();
    ctx.translate(opts.x, opts.y);
    ctx.scale(face * s, s);          // flipping x makes them face the other way

    // default pose numbers, then each animation bends them
    var hipY = -13, chestY = -22, headY = -26.5;
    var lean = 0, bob = 0;
    var armA = [0, 0], armB = [0, 0];      // [back arm, front arm] upper/lower angles
    var legA = [0, 0], legB = [0, 0];
    var swordAngle = -0.5, crouch = 0;

    if (anim === 'idle') {
      bob = Math.sin(t * 2.2) * 0.35;
      armA = [0.18, 0.30]; armB = [-0.18, -0.05];
      legA = [0.06, 0.08]; legB = [-0.06, -0.02];
      lean = 0.02;
    } else if (anim === 'walk' || anim === 'run') {
      var sp = anim === 'run' ? 11 : 7.2;
      var amp = anim === 'run' ? 1.05 : 0.62;
      var ph = t * sp;
      bob = Math.abs(Math.sin(ph)) * (anim === 'run' ? -1.1 : -0.6);
      legA = [Math.sin(ph) * amp, Math.sin(ph) * amp + Math.max(0, Math.sin(ph)) * 0.5];
      legB = [Math.sin(ph + Math.PI) * amp, Math.sin(ph + Math.PI) * amp + Math.max(0, Math.sin(ph + Math.PI)) * 0.5];
      armA = [Math.sin(ph + Math.PI) * amp * 0.8, Math.sin(ph + Math.PI) * amp * 0.8 - 0.35];
      armB = [Math.sin(ph) * amp * 0.8, Math.sin(ph) * amp * 0.8 - 0.35];
      lean = anim === 'run' ? 0.22 : 0.08;
    } else if (anim === 'jump') {
      legA = [0.7, 1.15]; legB = [-0.35, -0.15];
      armA = [-1.3, -1.7]; armB = [-1.0, -1.5];
      lean = 0.12;
    } else if (anim === 'fall') {
      legA = [0.45, 0.8]; legB = [-0.5, -0.3];
      armA = [-2.1, -2.4]; armB = [-1.9, -2.2];
      lean = -0.05;
    } else if (anim === 'crawl') {
      crouch = 9; hipY = -5; chestY = -9.5; headY = -12;
      var cp = t * 6;
      legA = [1.35 + Math.sin(cp) * 0.35, 2.2]; legB = [1.35 + Math.sin(cp + Math.PI) * 0.35, 2.2];
      armA = [1.5 + Math.sin(cp + Math.PI) * 0.4, 2.1]; armB = [1.5 + Math.sin(cp) * 0.4, 2.1];
      lean = 1.15;
    } else if (anim === 'attack') {
      // p goes 0 -> 1 across the swing
      var p = CR.clamp(opts.attackP || 0, 0, 1);
      var swing = p < 0.32 ? -1.5 + p * 1.2 : CR.lerp(-1.1, 1.5, (p - 0.32) / 0.68);
      armB = [swing, swing + 0.35];
      armA = [0.5, 0.9];
      swordAngle = swing + 0.25;
      lean = 0.12 + p * 0.18;
      legA = [0.55, 0.75]; legB = [-0.5, -0.2];
    } else if (anim === 'hurt') {
      lean = -0.4;
      armA = [-0.9, -1.4]; armB = [-1.1, -1.6];
      legA = [0.3, 0.5]; legB = [-0.5, -0.7];
    } else if (anim === 'dead') {
      ctx.rotate(-1.45);
      ctx.translate(-2, -3);
      lean = 0;
      armA = [1.4, 1.6]; armB = [1.1, 1.4];
      legA = [1.2, 1.5]; legB = [1.4, 1.7];
    } else if (anim === 'hang') {
      armA = [-2.85, -2.95]; armB = [-2.85, -2.95];
      legA = [0.12, 0.35]; legB = [-0.1, 0.1];
      hipY = -12;
    } else if (anim === 'wallrun') {
      var wp = t * 14;
      legA = [Math.sin(wp) * 1.1 + 0.4, Math.sin(wp) * 1.1 + 1.0];
      legB = [Math.sin(wp + Math.PI) * 1.1 + 0.4, Math.sin(wp + Math.PI) * 1.1 + 1.0];
      armA = [-2.4, -2.7]; armB = [-2.6, -2.9];
      lean = 0.35;
    } else if (anim === 'swing') {
      armA = [-2.9, -3.0]; armB = [-2.9, -3.0];
      legA = [0.5, 0.9]; legB = [0.15, 0.4];
      lean = 0.1;
    } else if (anim === 'cheer') {
      var cy = Math.sin(t * 5) * 1.4;
      bob = cy;
      armA = [-2.7, -3.0]; armB = [-2.7, -3.0];
      legA = [0.1, 0.2]; legB = [-0.1, -0.2];
    } else if (anim === 'sleep') {
      // slumped against the wall, chin on chest
      hipY = -7; chestY = -14; headY = -18.5;
      armA = [1.9, 2.4]; armB = [1.6, 2.2];
      legA = [1.35, 2.3]; legB = [1.15, 2.2];
      lean = 0.45 + Math.sin(t * 1.3) * 0.05;
    }

    hipY += bob; chestY += bob; headY += bob;
    ctx.rotate(lean * 0.35);

    var lw = 3.6;

    /* --- back arm and back leg first, in shadow, so they sit behind --- */
    var backFoot = limb(ctx, 0, hipY, 6.5, 6.5, legA[0], legA[1], lw, col.skinDark, col.skinDark);
    foot(ctx, backFoot, legA[1], col.skinDark);
    var backHand = limb(ctx, 0, chestY + 1, 5.5, 5.5, armA[0], armA[1], lw * 0.82, col.skinDark, col.skinDark);

    /* --- torso --- */
    ctx.save();
    ctx.translate(0, chestY);
    ctx.rotate(lean * 0.5);
    ctx.fillStyle = col.skin;
    Art.roundRect(ctx, -4.4, -1.5, 8.8, (hipY - chestY) + 3.5, 3);
    ctx.fill();
    // a hint of shading down the back edge
    ctx.fillStyle = col.skinDark;
    Art.roundRect(ctx, -4.4, -1.5, 2.4, (hipY - chestY) + 3.5, 2.4);
    ctx.fill();
    // sash across the chest
    ctx.strokeStyle = col.sash;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-3.4, 1.2); ctx.lineTo(3.4, 5.4); ctx.stroke();
    ctx.restore();

    /* --- dhoti (the wrapped cloth) --- */
    ctx.fillStyle = col.cloth;
    ctx.beginPath();
    ctx.moveTo(-4.8, hipY - 1.5);
    ctx.lineTo(4.8, hipY - 1.5);
    ctx.lineTo(4.0 + (anim === 'crawl' ? 2 : 0), hipY + 7.5);
    ctx.lineTo(-4.0, hipY + 7.0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = col.gold;
    ctx.fillRect(-4.8, hipY - 1.9, 9.6, 1.4);   // gold waistband

    /* --- head --- */
    ctx.save();
    ctx.translate(0, headY);
    ctx.rotate(lean * 0.3);
    // neck
    ctx.fillStyle = col.skinDark;
    ctx.fillRect(-1.4, 1.5, 2.8, 3);
    ellipse(ctx, 0.3, 0, 3.7, 4.0, col.skin);
    // hair, tied in a knot at the back like the period sculptures
    ctx.fillStyle = col.hair;
    ctx.beginPath();
    ctx.ellipse(-0.2, -1.2, 3.8, 3.2, 0, Math.PI * 0.95, Math.PI * 2.15);
    ctx.fill();
    ellipse(ctx, -3.0, -1.4, 1.9, 1.9, col.hair);
    // eye and brow
    ctx.fillStyle = '#14100e';
    ctx.fillRect(1.7, -0.7, 1.1, 1.2);
    ctx.fillRect(1.3, -2.0, 2.0, 0.7);
    if (opts.crown) {
      ctx.fillStyle = col.gold;
      ctx.beginPath();
      ctx.moveTo(-2.8, -2.6); ctx.lineTo(2.8, -2.6); ctx.lineTo(2.2, -4.6);
      ctx.lineTo(1.0, -3.4); ctx.lineTo(0, -5.2); ctx.lineTo(-1.0, -3.4); ctx.lineTo(-2.2, -4.6);
      ctx.closePath(); ctx.fill();
    }
    if (opts.helmet) {
      ctx.fillStyle = col.metal || '#9aa3ac';
      ctx.beginPath();
      ctx.ellipse(0, -1.6, 3.6, 3.0, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3.6, -1.9, 7.2, 1.0);
      if (opts.plume) {
        ctx.fillStyle = col.sash;
        ctx.beginPath();
        ctx.moveTo(0, -4.4); ctx.quadraticCurveTo(-1.5, -8.5, -3.5, -9.5);
        ctx.quadraticCurveTo(-1.2, -7.2, -1.0, -4.4);
        ctx.closePath(); ctx.fill();
      }
    }
    if (opts.moustache) {
      ctx.strokeStyle = col.hair;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0.6, 1.4); ctx.quadraticCurveTo(2.6, 1.0, 3.4, 2.2);
      ctx.stroke();
    }
    ctx.restore();

    /* --- front leg and front arm, on top --- */
    var frontFoot = limb(ctx, 0, hipY, 6.5, 6.5, legB[0], legB[1], lw, col.skin, col.skin);
    foot(ctx, frontFoot, legB[1], col.skinDark);
    var hand = limb(ctx, 0, chestY + 1, 5.5, 5.5, armB[0], armB[1], lw * 0.82, col.skin, col.skin);

    /* --- what they are holding ----------
       A resting weapon sits at a fixed angle rather than following the
       arm, otherwise a spear ends up pointing at the floor. */
    if (weapon !== 'none') {
      var rest = weapon === 'spear' ? -0.10 : 0.55;
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(anim === 'attack' ? swordAngle : rest);
      Art.drawWeapon(ctx, weapon, col, opts.tint);
      ctx.restore();
    }

    if (opts.shield) {
      ctx.save();
      ctx.translate(backHand.x, backHand.y);
      Art.drawShield(ctx, col, opts.tint);
      ctx.restore();
    }

    ctx.restore();
  };

  Art.drawWeapon = function (ctx, weapon, col, tint) {
    col = col || Art.HERO;
    var grip  = tint || '#6b4a2a';
    var blade = tint || '#e3e9ef';
    var gold  = tint || col.gold || '#d8b24e';
    var wood  = tint || '#7a5230';
    var dark  = tint || '#4a2f1a';
    var shine = tint || 'rgba(255,255,255,0.65)';

    if (weapon === 'dagger') {
      ctx.fillStyle = grip; ctx.fillRect(-0.7, -1.5, 1.4, 3);
      ctx.fillStyle = blade;
      ctx.beginPath();
      ctx.moveTo(-1.0, -1.5); ctx.lineTo(1.0, -1.5); ctx.lineTo(0.5, -8.5);
      ctx.lineTo(0, -9.5); ctx.lineTo(-0.5, -8.5);
      ctx.closePath(); ctx.fill();
    } else if (weapon === 'sword') {
      ctx.fillStyle = grip; ctx.fillRect(-0.8, -1.5, 1.6, 3.5);
      ctx.fillStyle = gold; ctx.fillRect(-2.6, -2.6, 5.2, 1.4);          // crossguard
      ctx.fillStyle = blade;
      ctx.beginPath();
      ctx.moveTo(-1.2, -2.6); ctx.lineTo(1.2, -2.6); ctx.lineTo(0.9, -14);
      ctx.lineTo(0, -16); ctx.lineTo(-0.9, -14);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shine; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.lineTo(0, -14); ctx.stroke();
    } else if (weapon === 'spear') {
      ctx.fillStyle = grip; ctx.fillRect(-0.6, -12, 1.2, 20);
      ctx.fillStyle = blade;
      ctx.beginPath();
      ctx.moveTo(-1.4, -12); ctx.lineTo(1.4, -12); ctx.lineTo(0, -17);
      ctx.closePath(); ctx.fill();
    } else if (weapon === 'club') {
      ctx.fillStyle = grip; ctx.fillRect(-0.9, -6, 1.8, 8);
      ctx.fillStyle = wood;
      Art.roundRect(ctx, -2.6, -14, 5.2, 9, 2.4);
      ctx.fill();
      ctx.fillStyle = dark;
      for (var i = 0; i < 3; i++) ctx.fillRect(-2.6, -12.5 + i * 2.8, 5.2, 0.9);
    }
  };

  // Pandya soldiers carry the twin-carp emblem of their kingdom.
  Art.drawShield = function (ctx, col, tint) {
    if (tint) col = { metal: tint, gold: tint };
    ctx.fillStyle = col.metal || '#9aa3ac';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.6, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = col.gold || '#c9a24a'; ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = col.gold || '#c9a24a';
    for (var i = 0; i < 2; i++) {
      var yy = -1.3 + i * 2.6;
      ctx.beginPath();
      ctx.moveTo(-1.6, yy); ctx.quadraticCurveTo(0, yy - 1.1, 1.6, yy);
      ctx.quadraticCurveTo(0, yy + 1.1, -1.6, yy);
      ctx.fill();
    }
  };

  /* The captive princess, seen inside the cage in the last level. */
  Art.drawPrincess = function (ctx, x, y, t, freed, h) {
    var col = Art.PRINCESS;
    ctx.save();
    ctx.translate(x, y);
    var s = (h || 30) / 30 * 0.95;
    ctx.scale(s, s);
    // sari
    ctx.fillStyle = col.cloth;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(3.2, -17); ctx.lineTo(-3.2, -17);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = col.gold;
    ctx.fillRect(-5, -2, 10, 1.4);
    ctx.fillRect(-3.4, -17, 6.8, 1.2);
    // arms
    ctx.strokeStyle = col.skin; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    var a = freed ? -2.5 + Math.sin(t * 5) * 0.3 : -0.4;
    ctx.beginPath(); ctx.moveTo(-2.5, -19); ctx.lineTo(-2.5 + Math.sin(a) * 7, -19 + Math.cos(a) * 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.5, -19); ctx.lineTo(2.5 + Math.sin(-a) * 7, -19 + Math.cos(-a) * 7); ctx.stroke();
    // torso + head
    ctx.fillStyle = col.skin;
    Art.roundRect(ctx, -3.2, -22, 6.4, 6, 2.2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -25.5, 3.2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col.hair;
    ctx.beginPath(); ctx.ellipse(0, -26.4, 3.3, 3.0, 0, Math.PI * 0.9, Math.PI * 2.2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -21.5, 2.0, 4.6, 0, 0, Math.PI * 2); ctx.fill();   // long plait
    ctx.fillStyle = col.gold;
    ctx.beginPath(); ctx.arc(0, -28.6, 1.4, Math.PI, 0); ctx.fill();
    ctx.restore();
  };

  /* ============================================================
     SCENERY
     ============================================================ */

  // A gopuram - the stepped temple gateway tower you see all over Tamil Nadu.
  Art.gopuram = function (ctx, x, baseY, w, h, col, detail) {
    var tiers = 6;
    ctx.fillStyle = col;
    for (var i = 0; i < tiers; i++) {
      var f = i / tiers;
      var tw = w * (1 - f * 0.45);
      var ty = baseY - (h / tiers) * (i + 1);
      var th = h / tiers;
      ctx.fillRect(x - tw / 2, ty, tw, th * 0.92);
      if (detail) {
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.fillRect(x - tw / 2, ty + th * 0.72, tw, th * 0.2);
        ctx.fillStyle = col;
      }
    }
    // the barrel-shaped crown on top
    ctx.beginPath();
    ctx.ellipse(x, baseY - h, w * 0.30, h * 0.075, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // the finials
    for (var k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.arc(x + k * w * 0.2, baseY - h - h * 0.055, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  Art.palm = function (ctx, x, baseY, h, col) {
    ctx.strokeStyle = col; ctx.lineWidth = h * 0.055; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + h * 0.09, baseY - h * 0.55, x + h * 0.14, baseY - h);
    ctx.stroke();
    var tipX = x + h * 0.14, tipY = baseY - h;
    ctx.lineWidth = h * 0.035;
    for (var i = 0; i < 7; i++) {
      var a = -2.55 + i * 0.53;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo(tipX + Math.cos(a) * h * 0.22, tipY + Math.sin(a) * h * 0.22,
                           tipX + Math.cos(a) * h * 0.34, tipY + Math.sin(a) * h * 0.34 + h * 0.08);
      ctx.stroke();
    }
  };

  Art.banyan = function (ctx, x, baseY, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x - h * 0.05, baseY - h * 0.6, h * 0.1, h * 0.6);
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * h * 0.22, baseY - h * 0.68 + Math.sin(a) * h * 0.12,
                  h * 0.22, h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // the hanging roots a banyan is known for
    ctx.strokeStyle = col; ctx.lineWidth = h * 0.012;
    for (var j = 0; j < 5; j++) {
      var rx = x - h * 0.28 + j * h * 0.14;
      ctx.beginPath(); ctx.moveTo(rx, baseY - h * 0.6); ctx.lineTo(rx + h * 0.02, baseY - h * 0.2); ctx.stroke();
    }
  };

  Art.fortWall = function (ctx, x, baseY, w, h, col, colDark) {
    ctx.fillStyle = col;
    ctx.fillRect(x, baseY - h, w, h);
    ctx.fillStyle = colDark;
    // battlements along the top
    for (var i = 0; i < w; i += 12) ctx.fillRect(x + i, baseY - h - 5, 7, 5);
    // stone courses
    for (var y = baseY - h + 6; y < baseY; y += 7) ctx.fillRect(x, y, w, 1);
  };

  /* Decorative inscription marks. These are ornamental strokes in the
     spirit of a stone inscription - deliberately not real letters, so we
     never carve nonsense into a wall. */
  Art.inscription = function (ctx, x, y, w, rows, col, seed) {
    var rnd = CR.rng(seed || 7);
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.6;
    ctx.lineCap = 'round';
    for (var r = 0; r < rows; r++) {
      var cx = x, cy = y + r * 5;
      while (cx < x + w - 3) {
        var gw = 2 + rnd() * 2;
        ctx.beginPath();
        ctx.arc(cx + gw / 2, cy, gw / 2, Math.PI * (0.15 + rnd() * 0.4), Math.PI * (1.3 + rnd() * 0.6));
        ctx.stroke();
        if (rnd() > 0.5) {
          ctx.beginPath(); ctx.moveTo(cx + gw / 2, cy - 1.6); ctx.lineTo(cx + gw / 2, cy + 1.6); ctx.stroke();
        }
        cx += gw + 1.4;
      }
    }
  };

  // A kolam: the looping rice-flour pattern drawn on Tamil doorsteps.
  Art.kolam = function (ctx, x, y, r, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.6;
    for (var i = 0; i < 4; i++) {
      var a = i / 4 * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.5, r * 0.28, a, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, r * 0.16, 0, Math.PI * 2); ctx.stroke();
  };

  // A dancing-figure statue in a wall niche - a nod to Chola bronzes.
  Art.statue = function (ctx, x, baseY, h, col, glow) {
    ctx.save();
    ctx.translate(x, baseY);
    var s = h / 30;
    ctx.scale(s, s);
    ctx.fillStyle = glow || col;
    // ring of fire
    ctx.strokeStyle = glow || col;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.stroke();
    // the figure: one leg raised, four arms
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(-2, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-2, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(4, -9); ctx.lineTo(7, -12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-9, -17); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(6, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -19); ctx.lineTo(-8, -24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -19); ctx.lineTo(5, -26); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(-2, -24, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  /* A burning torch. flicker is a number that wobbles over time. */
  Art.torch = function (ctx, x, y, t, palette) {
    ctx.fillStyle = '#4a3320';
    ctx.fillRect(x - 1, y, 2, 9);
    ctx.fillStyle = '#2a2118';
    Art.roundRect(ctx, x - 2.6, y - 3, 5.2, 4, 1.4); ctx.fill();
    var f = 1 + Math.sin(t * 11 + x) * 0.18 + Math.sin(t * 23 + x * 2) * 0.09;
    var g = ctx.createRadialGradient(x, y - 5, 0, x, y - 5, 11 * f);
    g.addColorStop(0, 'rgba(255,220,140,0.85)');
    g.addColorStop(0.4, 'rgba(255,150,50,0.35)');
    g.addColorStop(1, 'rgba(255,110,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y - 5, 11 * f, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf6a';
    ctx.beginPath();
    ctx.moveTo(x - 1.8, y - 2.5);
    ctx.quadraticCurveTo(x - 0.6, y - 6 * f, x, y - 8.5 * f);
    ctx.quadraticCurveTo(x + 0.8, y - 6 * f, x + 1.8, y - 2.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff2c0';
    ctx.beginPath();
    ctx.moveTo(x - 0.9, y - 2.5);
    ctx.quadraticCurveTo(x, y - 4.5 * f, x, y - 5.6 * f);
    ctx.quadraticCurveTo(x + 0.5, y - 4.5 * f, x + 0.9, y - 2.5);
    ctx.closePath(); ctx.fill();
  };

  /* ============================================================
     PARALLAX BACKDROPS
     Each layer is painted once into an off-screen picture, then that
     picture is repeated across the screen at a different speed. Distant
     layers move slowly, near ones move fast - that is what makes it
     feel deep.
     ============================================================ */
  var LAYER_W = 480, LAYER_H = 270;   // each strip is painted at this size, then squeezed to fit the view

  function makeLayer(w, h, paint) {
    var c = document.createElement('canvas');
    var s = 2;                       // draw the strip at 2x so it stays sharp
    c.width = w * s; c.height = h * s;
    var g = c.getContext('2d');
    g.scale(s, s);
    paint(g, w, h);
    return c;
  }

  Art.buildBackdrop = function (paletteName, seed) {
    var P = Art.PALETTES[paletteName];
    var rnd = CR.rng(seed || 1234);
    var layers = [];

    if (paletteName === 'hall') {
      // Level 3 is indoors: no sky at all, just a deep dark hall.
      layers.push({ speed: 0, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
        var grad = g.createLinearGradient(0, 0, 0, LAYER_H);
        grad.addColorStop(0, '#070510');
        grad.addColorStop(0.6, '#140d1c');
        grad.addColorStop(1, '#0b0712');
        g.fillStyle = grad;
        g.fillRect(0, 0, LAYER_W, LAYER_H);
      })});
      // rows of pillars instead of hills
      layers.push({ speed: 0.15, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
        g.fillStyle = P.far;
        for (var x = 10; x < LAYER_W; x += 78) {
          g.fillRect(x, 40, 20, 200);
          g.fillRect(x - 4, 34, 28, 8);
          g.fillRect(x - 3, 232, 26, 8);
        }
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(0, 0, LAYER_W, 40);
      })});
      layers.push({ speed: 0.42, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
        g.fillStyle = P.mid;
        for (var x = 40; x < LAYER_W; x += 120) {
          g.fillRect(x, 20, 30, 230);
          g.fillRect(x - 7, 12, 44, 12);
          Art.inscription(g, x + 3, 70, 24, 5, 'rgba(255,160,80,0.20)', x * 7 + 3);
        }
        // arched openings between the pillars
        g.strokeStyle = 'rgba(255,150,60,0.10)';
        g.lineWidth = 3;
        for (var a = 100; a < LAYER_W; a += 120) {
          g.beginPath(); g.arc(a, 90, 30, Math.PI, 0); g.stroke();
        }
      })});
      return { layers: layers, palette: P, name: paletteName };
    }

    // ---- sky + sun ----
    layers.push({ speed: 0, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      var grad = g.createLinearGradient(0, 0, 0, LAYER_H);
      grad.addColorStop(0, P.skyTop);
      grad.addColorStop(1, P.skyBot);
      g.fillStyle = grad;
      g.fillRect(0, 0, LAYER_W, LAYER_H);
      var sg = g.createRadialGradient(360, 62, 2, 360, 62, 60);
      sg.addColorStop(0, P.sun);
      sg.addColorStop(1, 'rgba(255,220,150,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(360, 62, 60, 0, Math.PI * 2); g.fill();
      // a few soft clouds
      g.fillStyle = 'rgba(255,255,255,0.13)';
      for (var i = 0; i < 5; i++) {
        var cx = rnd() * LAYER_W, cy = 24 + rnd() * 60;
        for (var k = 0; k < 4; k++) {
          g.beginPath();
          g.ellipse(cx + k * 11 - 16, cy + Math.sin(k) * 3, 15 - k * 1.5, 5, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    })});

    // ---- far hills + a distant gopuram ----
    layers.push({ speed: 0.14, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      g.fillStyle = P.far;
      g.beginPath();
      g.moveTo(0, 200);
      for (var x = 0; x <= LAYER_W; x += 24) {
        g.lineTo(x, 168 + Math.sin(x * 0.017 + 1.2) * 22 + Math.sin(x * 0.041) * 9);
      }
      g.lineTo(LAYER_W, LAYER_H); g.lineTo(0, LAYER_H);
      g.closePath(); g.fill();
      Art.gopuram(g, 118, 178, 40, 78, P.far, false);
      Art.gopuram(g, 336, 182, 30, 56, P.far, false);
    })});

    // ---- middle band: trees or walls ----
    layers.push({ speed: 0.34, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      if (paletteName === 'grove') {
        for (var i = 0; i < 9; i++) {
          var x = 12 + i * 54 + rnd() * 18;
          if (rnd() > 0.55) Art.banyan(g, x, 214, 58 + rnd() * 22, P.mid);
          else Art.palm(g, x, 214, 62 + rnd() * 26, P.mid);
        }
      } else {
        Art.fortWall(g, 0, 216, LAYER_W, 62, P.mid, P.near);
        for (var t = 0; t < 4; t++) {
          var tx = 40 + t * 120;
          g.fillStyle = P.mid;
          g.fillRect(tx, 130, 34, 86);
          g.fillStyle = P.near;
          for (var b = 0; b < 34; b += 11) g.fillRect(tx + b, 124, 6, 6);
        }
      }
      g.fillStyle = P.haze;
      g.fillRect(0, 0, LAYER_W, LAYER_H);
    })});

    // ---- near band, just behind the action ----
    layers.push({ speed: 0.62, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      g.fillStyle = P.near;
      if (paletteName === 'grove') {
        for (var i = 0; i < 6; i++) Art.palm(g, i * 88 + 20, 250, 46 + rnd() * 18, P.near);
        g.beginPath();
        g.moveTo(0, 246);
        for (var x = 0; x <= LAYER_W; x += 16) g.lineTo(x, 240 + Math.sin(x * 0.06) * 5);
        g.lineTo(LAYER_W, LAYER_H); g.lineTo(0, LAYER_H);
        g.closePath(); g.fill();
      } else {
        for (var d = 0; d < LAYER_W; d += 60) {
          g.beginPath();
          g.moveTo(d, LAYER_H);
          g.quadraticCurveTo(d + 30, 232, d + 60, LAYER_H);
          g.closePath(); g.fill();
        }
      }
    })});

    return { layers: layers, palette: P, name: paletteName };
  };

  Art.drawBackdrop = function (ctx, backdrop, camX, camY) {
    for (var i = 0; i < backdrop.layers.length; i++) {
      var L = backdrop.layers[i];
      var off = -(camX * L.speed) % LAYER_W;
      if (off > 0) off -= LAYER_W;
      var y = -camY * L.speed * 0.25;
      for (var x = off; x < CR.VIEW_W; x += LAYER_W) {
        ctx.drawImage(L.img, x, y, LAYER_W, CR.VIEW_H);
      }
    }
  };

  /* ---------- text ----------
     The canvas is drawn at a higher internal resolution than 480x270,
     so ordinary canvas text comes out crisp instead of blocky. */
  Art.FONT_UI = '600 9px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  Art.FONT_SMALL = '600 7.5px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  Art.FONT_BODY = '500 9px Georgia, "Times New Roman", serif';
  Art.FONT_TITLE = '700 34px Georgia, "Times New Roman", serif';
  Art.FONT_SUB = '600 11px Georgia, "Times New Roman", serif';

  Art.text = function (ctx, str, x, y, opts) {
    opts = opts || {};
    ctx.font = opts.font || Art.FONT_UI;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    if (opts.shadow !== false) {
      ctx.fillStyle = opts.shadowColor || 'rgba(0,0,0,0.65)';
      ctx.fillText(str, x + (opts.shadowOff || 1), y + (opts.shadowOff || 1));
    }
    ctx.fillStyle = opts.color || '#f4e6c4';
    ctx.fillText(str, x, y);
  };

  // Break a long sentence into lines that fit inside maxW.
  Art.wrap = function (ctx, str, maxW, font) {
    ctx.font = font || Art.FONT_BODY;
    var words = str.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  CR.Art = Art;
})();
