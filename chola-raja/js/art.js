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
  /* The ground colours are deliberately much brighter than the scenery
     colours behind them. Distance drains colour and contrast - that is
     how your eye reads depth - so everything the prince can actually
     stand on is painted light and edged in near-black, and everything
     he cannot is pushed back towards the colour of the sky. */
  Art.PALETTES = {
    grove: {                       // Level 1 - morning, green, hopeful
      skyTop: '#1d5a68', skyMid: '#4d8f8a', skyBot: '#c9d9a0',
      sun: '#fff0c0',
      far: '#43706a', mid: '#2c5049', near: '#14312c',
      groundTop: '#84b95a', groundFace: '#4e7433', groundDeep: '#2a3d1e',
      stone: '#a9b08c', stoneDark: '#5d6647',
      edge: 'rgba(8,14,8,0.62)',
      accent: '#e0b040', haze: 'rgba(190,225,205,0.26)'
    },
    fort: {                        // Level 2 - late afternoon, sand and stone
      skyTop: '#3c2b52', skyMid: '#8e5a54', skyBot: '#eeb26a',
      sun: '#ffe3ae',
      far: '#8a6a55', mid: '#5c4032', near: '#2e1d14',
      groundTop: '#dcae70', groundFace: '#a2743f', groundDeep: '#553a1d',
      stone: '#c4a878', stoneDark: '#6b5637',
      edge: 'rgba(20,10,4,0.62)',
      accent: '#f0c460', haze: 'rgba(240,190,130,0.24)'
    },
    hall: {                        // Level 3 - inside the Pandya palace, night, firelight
      skyTop: '#07050e', skyMid: '#120c1a', skyBot: '#1c1424',
      sun: '#ffb347',
      far: '#1d1526', mid: '#140e1c', near: '#0a0710',
      groundTop: '#5f4a63', groundFace: '#34263a', groundDeep: '#160f1c',
      stone: '#584566', stoneDark: '#291e30',
      edge: 'rgba(0,0,0,0.7)',
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
     THE FACE

     Drawn in its own little space with the head centre at 0,0, always
     looking to the right (drawPerson flips the whole figure when he
     turns around). Everyone gets a jaw, an eye, a brow, a nose and a
     mouth - it is only a few pixels each, but it is the difference
     between a person and a bean.
     ============================================================ */

  // which expression suits what the body is doing
  function faceFor(anim, override) {
    if (override) return override;
    if (anim === 'attack') return 'grim';
    if (anim === 'hurt') return 'pain';
    if (anim === 'dead') return 'out';
    if (anim === 'cheer') return 'smile';
    if (anim === 'crawl' || anim === 'wallrun' || anim === 'hang') return 'grim';
    return 'neutral';
  }

  Art.drawHead = function (ctx, col, o) {
    o = o || {};
    var face = o.face || 'neutral';
    var angry = face === 'grim' || face === 'pain';
    var strong = o.jaw === 'strong';

    var chinX = strong ? 1.2 : 0.8;
    var chinY = strong ? 4.3 : 3.8;
    var jawW = strong ? 3.7 : 3.3;

    /* --- hair that falls behind the head, drawn first --- */
    if (o.hair === 'long') {
      ctx.fillStyle = col.hair;
      ctx.beginPath();
      ctx.moveTo(-1.8, -3.2);
      ctx.quadraticCurveTo(-4.8, -1.2, -4.5, 3.0);
      ctx.quadraticCurveTo(-4.2, 6.4, -2.4, 7.2);
      ctx.lineTo(-0.8, 6.4);
      ctx.quadraticCurveTo(-2.6, 4.2, -2.2, -0.8);
      ctx.closePath(); ctx.fill();
    } else if (o.hair === 'braid') {
      ctx.fillStyle = col.hair;
      ctx.beginPath();
      ctx.ellipse(-1.6, 4.6, 1.9, 4.8, 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    /* --- the head, drawn as a profile ---
       One path from the crown, down over the brow, out along the nose,
       past the lips to the chin and back round the jaw. Putting the nose
       in the outline is what makes it read as a face instead of a ball
       with an eye painted on it. */
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.moveTo(-3.3, -2.5);
    ctx.quadraticCurveTo(-1.6, -4.6, 1.0, -4.1);      // crown
    ctx.quadraticCurveTo(2.6, -3.7, 2.9, -2.2);       // forehead
    ctx.lineTo(3.15, -1.2);                           // brow ridge
    ctx.lineTo(3.15, -0.5);                           // bridge of the nose
    ctx.lineTo(4.35, 0.85);                           // tip of the nose
    ctx.lineTo(3.1, 1.15);                            // underneath it
    ctx.quadraticCurveTo(3.5, 1.6, 3.35, 1.95);       // upper lip
    ctx.quadraticCurveTo(3.0, 2.2, 3.3, 2.6);         // lower lip
    ctx.quadraticCurveTo(3.5, 3.1, chinX + 0.5, chinY - 0.2);   // chin
    ctx.quadraticCurveTo(chinX - 1.6, chinY + 0.3, -1.6, chinY - 0.7);
    ctx.quadraticCurveTo(-jawW - 0.2, chinY - 1.8, -jawW - 0.3, 0.4);  // jaw to ear
    ctx.quadraticCurveTo(-4.1, -1.3, -3.3, -2.5);     // back of the skull
    ctx.closePath();
    ctx.fill();

    // the shaded plane under the cheekbone - this is what reads as a jawline
    ctx.fillStyle = col.skinDark;
    ctx.globalAlpha = strong ? 0.55 : 0.35;
    ctx.beginPath();
    ctx.moveTo(-jawW * 0.9, 0.4);
    ctx.quadraticCurveTo(-1.0, chinY * 0.9, chinX - 1.4, chinY - 0.2);
    ctx.lineTo(chinX - 2.2, chinY - 1.2);
    ctx.quadraticCurveTo(-1.6, chinY * 0.6, -jawW * 0.85, -0.4);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // a shave that is a few days old
    if (o.stubble || o.beard) {
      ctx.fillStyle = col.hair;
      ctx.globalAlpha = o.beard ? 0.75 : 0.3;
      ctx.beginPath();
      ctx.moveTo(-2.8, 0.9);
      ctx.quadraticCurveTo(-2.2, chinY * 0.95, chinX - 1.5, chinY - 0.1);
      ctx.lineTo(chinX + 0.6, chinY - 0.4);
      ctx.quadraticCurveTo(jawW * 0.95, 2.0, jawW - 0.2, 0.5);
      ctx.quadraticCurveTo(1.4, 2.2, -2.8, 0.9);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ear
    ctx.fillStyle = col.skinDark;
    ctx.beginPath();
    ctx.ellipse(-2.4, 0.2, 0.75, 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    /* --- eye: an almond, not a saucer --- */
    if (face === 'out') {
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(1.5, -0.5); ctx.lineTo(2.7, -0.5); ctx.stroke();
    } else {
      ctx.fillStyle = '#e8dcca';
      ctx.beginPath();
      ctx.moveTo(1.5, -0.35);
      ctx.quadraticCurveTo(2.15, -1.0, 2.8, -0.4);
      ctx.quadraticCurveTo(2.15, 0.2, 1.5, -0.35);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#14100c';
      ctx.beginPath(); ctx.arc(2.35, -0.38, 0.38, 0, Math.PI * 2); ctx.fill();
      // lash line along the top lid
      ctx.strokeStyle = '#241a14'; ctx.lineWidth = 0.32;
      ctx.beginPath();
      ctx.moveTo(1.45, -0.4); ctx.quadraticCurveTo(2.15, -1.05, 2.85, -0.45);
      ctx.stroke();
    }

    /* --- brow --- */
    ctx.strokeStyle = col.hair;
    ctx.lineWidth = 0.62;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (angry) { ctx.moveTo(0.9, -2.0); ctx.lineTo(2.95, -1.35); }
    else { ctx.moveTo(1.0, -1.75); ctx.lineTo(2.95, -1.75); }
    ctx.stroke();

    // a crease down the side of the nose gives the profile some depth
    ctx.strokeStyle = col.skinDark;
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(2.9, -0.4); ctx.quadraticCurveTo(3.3, 0.6, 3.0, 1.1);
    ctx.stroke();

    /* --- mouth --- */
    if (face === 'pain') {
      ctx.fillStyle = '#3d1410';
      ctx.beginPath();
      ctx.ellipse(2.7, 2.0, 0.58, 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#4d2418';
      ctx.lineWidth = 0.42;
      ctx.beginPath();
      if (face === 'smile') { ctx.moveTo(2.0, 1.85); ctx.quadraticCurveTo(2.7, 2.6, 3.25, 1.95); }
      else if (face === 'grim') { ctx.lineWidth = 0.55; ctx.moveTo(2.0, 2.25); ctx.quadraticCurveTo(2.7, 1.85, 3.25, 2.2); }
      else if (face === 'out') { ctx.moveTo(2.1, 2.15); ctx.lineTo(3.2, 2.2); }
      else { ctx.moveTo(2.1, 2.05); ctx.quadraticCurveTo(2.7, 2.25, 3.25, 2.0); }
      ctx.stroke();
    }

    if (o.moustache) {
      ctx.strokeStyle = col.hair;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(1.2, 1.75); ctx.quadraticCurveTo(2.9, 1.5, 4.0, 2.3);
      ctx.stroke();
    }

    /* --- hair on top --- */
    ctx.fillStyle = col.hair;
    if (o.hair === 'knot') {
      ctx.beginPath();
      ctx.ellipse(-0.2, -1.4, 3.7, 3.1, 0, Math.PI * 0.98, Math.PI * 2.12);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-3.0, -1.6, 1.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.hair === 'long') {
      ctx.beginPath();
      ctx.ellipse(-0.2, -1.6, 3.8, 3.2, 0, Math.PI * 0.95, Math.PI * 2.18);
      ctx.fill();
      // a fringe swept across the forehead
      ctx.beginPath();
      ctx.moveTo(-3.4, -2.2);
      ctx.quadraticCurveTo(0.6, -5.2, 3.6, -2.4);
      ctx.quadraticCurveTo(1.2, -2.9, -1.0, -1.6);
      ctx.closePath(); ctx.fill();
    } else if (o.hair === 'braid') {
      ctx.beginPath();
      ctx.ellipse(-0.1, -1.5, 3.7, 3.1, 0, Math.PI * 0.92, Math.PI * 2.14);
      ctx.fill();
    }

    if (o.crown) {
      ctx.fillStyle = col.gold;
      ctx.beginPath();
      ctx.moveTo(-2.8, -3.0); ctx.lineTo(2.8, -3.0); ctx.lineTo(2.2, -5.0);
      ctx.lineTo(1.0, -3.8); ctx.lineTo(0, -5.6); ctx.lineTo(-1.0, -3.8); ctx.lineTo(-2.2, -5.0);
      ctx.closePath(); ctx.fill();
    }
    if (o.helmet) {
      ctx.fillStyle = col.metal || '#9aa3ac';
      ctx.beginPath();
      ctx.ellipse(0, -1.8, 3.7, 3.1, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3.7, -2.1, 7.4, 1.0);
      if (o.plume) {
        ctx.fillStyle = col.sash;
        ctx.beginPath();
        ctx.moveTo(0, -4.6); ctx.quadraticCurveTo(-1.5, -8.7, -3.5, -9.7);
        ctx.quadraticCurveTo(-1.2, -7.4, -1.0, -4.6);
        ctx.closePath(); ctx.fill();
      }
    }
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
    } else if (anim === 'ride') {
      // sitting a horse: thighs forward, knees bent, hands on the reins
      hipY = -10; chestY = -19; headY = -23.5;
      legA = [1.25, -0.35]; legB = [1.35, -0.25];
      armA = [0.9, 0.55]; armB = [1.0, 0.6];
      lean = 0.12;
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
    Art.drawHead(ctx, col, {
      hair: opts.hair || 'knot',
      jaw: opts.jaw || 'normal',
      beard: opts.beard,
      stubble: opts.stubble,
      moustache: opts.moustache,
      crown: opts.crown,
      helmet: opts.helmet,
      plume: opts.plume,
      face: faceFor(anim, opts.face)
    });
    ctx.restore();

    /* --- front leg and front arm, on top --- */
    var frontFoot = limb(ctx, 0, hipY, 6.5, 6.5, legB[0], legB[1], lw, col.skin, col.skin);
    foot(ctx, frontFoot, legB[1], col.skinDark);
    var hand = limb(ctx, 0, chestY + 1, 5.5, 5.5, armB[0], armB[1], lw * 0.82, col.skin, col.skin);

    /* --- what they are holding ----------
       A resting weapon sits at a fixed angle rather than following the
       arm, otherwise a spear ends up pointing at the floor. */
    if (weapon !== 'none') {
      var rest = weapon === 'spear' ? -0.10 : (weapon === 'club' ? -0.62 : 0.55);
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
      Art.roundRect(ctx, -2.3, -13, 4.6, 8, 2.1);
      ctx.fill();
      ctx.fillStyle = dark;
      for (var i = 0; i < 3; i++) ctx.fillRect(-2.3, -11.6 + i * 2.5, 4.6, 0.8);
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

  /* The captive princess. `mood` overrides her expression - she is not
     always calm about what is happening to her. */
  Art.drawPrincess = function (ctx, x, y, t, freed, h, mood) {
    var col = Art.PRINCESS;
    var opts_face = mood;
    ctx.save();
    ctx.translate(x, y);
    var s = (h || 30) / 30 * 0.95;
    ctx.scale(s, s);
    // sari, with pleats down the front and a gold border at the hem
    ctx.fillStyle = col.cloth;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(3.2, -17); ctx.lineTo(-3.2, -17);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col.sash; ctx.lineWidth = 0.4;
    for (var pl = -2.5; pl <= 2.5; pl += 1.7) {
      ctx.beginPath(); ctx.moveTo(pl * 1.5, -1); ctx.lineTo(pl, -16); ctx.stroke();
    }
    ctx.fillStyle = col.gold;
    ctx.fillRect(-5, -2, 10, 1.4);
    ctx.fillRect(-3.4, -17, 6.8, 1.2);
    // the pallu, thrown over one shoulder
    ctx.fillStyle = col.sash;
    ctx.beginPath();
    ctx.moveTo(-3.4, -21.5);
    ctx.quadraticCurveTo(-5.6, -14, -4.4, -6);
    ctx.lineTo(-2.4, -6.5);
    ctx.quadraticCurveTo(-3.4, -14, -1.6, -21);
    ctx.closePath(); ctx.fill();
    // arms
    ctx.strokeStyle = col.skin; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    var a = freed ? -2.5 + Math.sin(t * 5) * 0.3 : -0.4;
    ctx.beginPath(); ctx.moveTo(-2.5, -19); ctx.lineTo(-2.5 + Math.sin(a) * 7, -19 + Math.cos(a) * 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.5, -19); ctx.lineTo(2.5 + Math.sin(-a) * 7, -19 + Math.cos(-a) * 7); ctx.stroke();
    // torso
    ctx.fillStyle = col.skin;
    Art.roundRect(ctx, -3.2, -22, 6.4, 6, 2.2); ctx.fill();

    // head - same face everyone else gets, with a plait and a bindi
    ctx.save();
    ctx.translate(0.4, -25.6);
    ctx.scale(0.94, 0.94);
    Art.drawHead(ctx, col, {
      hair: 'braid',
      jaw: 'normal',
      face: freed ? 'smile' : (opts_face || 'neutral')
    });
    ctx.fillStyle = '#b4302a';
    ctx.beginPath(); ctx.arc(1.0, -2.6, 0.5, 0, Math.PI * 2); ctx.fill();   // bindi
    ctx.fillStyle = col.gold;
    ctx.beginPath(); ctx.arc(-2.3, 1.4, 0.7, 0, Math.PI * 2); ctx.fill();   // earring
    ctx.beginPath(); ctx.arc(0, -3.4, 1.5, Math.PI, 0); ctx.fill();         // hair ornament
    ctx.restore();
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

    /* ---- sky ----
       Three stops rather than two, with a bright band sitting on the
       horizon. Real skies are lightest where they meet the land, and
       that one detail does more for realism than any amount of detail. */
    layers.push({ speed: 0, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      var grad = g.createLinearGradient(0, 0, 0, 215);
      grad.addColorStop(0, P.skyTop);
      grad.addColorStop(0.55, P.skyMid || P.skyTop);
      grad.addColorStop(1, P.skyBot);
      g.fillStyle = grad;
      g.fillRect(0, 0, LAYER_W, LAYER_H);

      // the sun, low and hazy
      var sunY = paletteName === 'fort' ? 150 : 74;
      var sg = g.createRadialGradient(352, sunY, 2, 352, sunY, 78);
      sg.addColorStop(0, P.sun);
      sg.addColorStop(0.25, 'rgba(255,225,165,0.45)');
      sg.addColorStop(1, 'rgba(255,220,150,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(352, sunY, 78, 0, Math.PI * 2); g.fill();

      // layered cloud banks, thin and stretched near the horizon
      for (var i = 0; i < 7; i++) {
        var cx = rnd() * LAYER_W, cy = 18 + rnd() * 96;
        var flat = 1 - cy / 200;
        g.fillStyle = 'rgba(255,255,255,' + (0.05 + flat * 0.10).toFixed(3) + ')';
        for (var k = 0; k < 6; k++) {
          g.beginPath();
          g.ellipse(cx + k * 13 - 30, cy + Math.sin(k * 1.3) * 2.5,
                    17 - Math.abs(k - 2.5) * 2.4, 3.4 + flat * 2.6, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    })});

    /* ---- the furthest ridge: almost the colour of the sky ---- */
    layers.push({ speed: 0.07, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      g.globalAlpha = 0.5;
      g.fillStyle = P.far;
      g.beginPath();
      g.moveTo(0, LAYER_H);
      for (var x = 0; x <= LAYER_W; x += 18) {
        g.lineTo(x, 150 + Math.sin(x * 0.011 + 2.1) * 26 + Math.sin(x * 0.033) * 7);
      }
      g.lineTo(LAYER_W, LAYER_H);
      g.closePath(); g.fill();
      g.globalAlpha = 1;
    })});

    /* ---- second ridge, with the temple towers on it ---- */
    layers.push({ speed: 0.15, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      g.globalAlpha = 0.82;
      g.fillStyle = P.far;
      g.beginPath();
      g.moveTo(0, LAYER_H);
      for (var x = 0; x <= LAYER_W; x += 20) {
        g.lineTo(x, 176 + Math.sin(x * 0.017 + 1.2) * 20 + Math.sin(x * 0.045) * 8);
      }
      g.lineTo(LAYER_W, LAYER_H);
      g.closePath(); g.fill();
      Art.gopuram(g, 118, 180, 40, 80, P.far, false);
      Art.gopuram(g, 336, 184, 30, 58, P.far, false);
      g.globalAlpha = 1;
      // haze pooling at the foot of the hills
      var hz = g.createLinearGradient(0, 150, 0, 215);
      hz.addColorStop(0, 'rgba(255,255,255,0)');
      hz.addColorStop(1, P.haze);
      g.fillStyle = hz;
      g.fillRect(0, 150, LAYER_W, 70);
    })});

    /* ---- middle band: the tree line, or the fort wall ---- */
    layers.push({ speed: 0.34, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      if (paletteName === 'grove') {
        // a dense wall of canopy behind the individual trees
        g.fillStyle = P.mid;
        g.globalAlpha = 0.75;
        for (var b = -10; b < LAYER_W + 20; b += 26) {
          g.beginPath();
          g.ellipse(b, 206, 22, 13 + (b % 3) * 3, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.globalAlpha = 1;
        for (var i = 0; i < 11; i++) {
          var x = 6 + i * 45 + rnd() * 16;
          if (rnd() > 0.55) Art.banyan(g, x, 218, 56 + rnd() * 26, P.mid);
          else Art.palm(g, x, 218, 60 + rnd() * 30, P.mid);
        }
      } else {
        Art.fortWall(g, 0, 218, LAYER_W, 66, P.mid, P.near);
        for (var t = 0; t < 4; t++) {
          var tx = 40 + t * 120;
          g.fillStyle = P.mid;
          g.fillRect(tx, 128, 34, 90);
          g.fillStyle = P.near;
          for (var bb = 0; bb < 34; bb += 11) g.fillRect(tx + bb, 122, 6, 6);
          // arrow slits
          g.fillStyle = 'rgba(0,0,0,0.45)';
          g.fillRect(tx + 15, 146, 3, 12);
          g.fillRect(tx + 15, 172, 3, 12);
        }
      }
      g.fillStyle = P.haze;
      g.fillRect(0, 0, LAYER_W, LAYER_H);
    })});

    /* ---- near band: dark, and close enough to be almost a silhouette ---- */
    layers.push({ speed: 0.62, y: 0, img: makeLayer(LAYER_W, LAYER_H, function (g) {
      g.fillStyle = P.near;
      if (paletteName === 'grove') {
        for (var i = 0; i < 7; i++) Art.palm(g, i * 74 + 14, 256, 48 + rnd() * 22, P.near);
        g.beginPath();
        g.moveTo(0, 250);
        for (var x = 0; x <= LAYER_W; x += 12) {
          g.lineTo(x, 242 + Math.sin(x * 0.06) * 5 + Math.sin(x * 0.17) * 2);
        }
        g.lineTo(LAYER_W, LAYER_H); g.lineTo(0, LAYER_H);
        g.closePath(); g.fill();
        // grass along the crest
        g.strokeStyle = P.near; g.lineWidth = 1;
        for (var gx = 0; gx < LAYER_W; gx += 4) {
          var gy = 242 + Math.sin(gx * 0.06) * 5;
          g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 1.5, gy - 4 - (gx % 5)); g.stroke();
        }
      } else {
        for (var d = 0; d < LAYER_W; d += 60) {
          g.beginPath();
          g.moveTo(d, LAYER_H);
          g.quadraticCurveTo(d + 30, 234, d + 60, LAYER_H);
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
