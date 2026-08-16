/* ============================================================
   story.js - the comic book.

   Laid out the way a printed comic is: pages divided into panels with
   heavy black borders, a yellow caption box in the corner of the panel,
   speech balloons with tails, halftone dots for shading, and sound
   words painted across the action. Marvel's furniture, an Indian voice.

   Each page holds for ten seconds and turns itself. Pressing anything
   turns it early.
   ============================================================ */
(function () {
  var S = {};

  // Pages are composed in a fixed 480x270 space and scaled into whatever
  // room the screen has, so the layouts never shift about.
  var PAGE_W = 480, PAGE_H = 270;

  var NIGHT = { sky1: '#0b1026', sky2: '#1d2140', stone: '#2a2c44', stoneLit: '#3b3d5c' };
  var DAY   = { sky1: '#3f6f8a', sky2: '#d8b06a', stone: '#6b5a44', stoneLit: '#8d795c' };

  var INK = '#140f0a';
  var PAPER = '#f2e4c2';

  /* ---------- printed-page texture ---------- */
  var halftoneTile = null;
  function halftone(ctx, x, y, w, h, alpha) {
    if (!halftoneTile) {
      halftoneTile = document.createElement('canvas');
      halftoneTile.width = 8; halftoneTile.height = 8;
      var g = halftoneTile.getContext('2d');
      g.fillStyle = '#000';
      g.beginPath(); g.arc(2, 2, 1.15, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(6, 6, 1.15, 0, Math.PI * 2); g.fill();
    }
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.16 : alpha;
    var pat = ctx.createPattern(halftoneTile, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  /* ---------- shared scene furniture ---------- */

  function sky(ctx, c1, c2) {
    var g = ctx.createLinearGradient(0, 0, 0, PAGE_H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(-PAGE_W, -PAGE_H, PAGE_W * 3, PAGE_H * 3);
  }

  function moon(ctx, x, y, r) {
    var g = ctx.createRadialGradient(x, y, 1, x, y, r * 4);
    g.addColorStop(0, 'rgba(255,250,220,0.55)');
    g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fdf6d8';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function stars(ctx, seed) {
    var rnd = CR.rng(seed);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (var i = 0; i < 46; i++) ctx.fillRect(rnd() * PAGE_W, rnd() * 130, 1.2, 1.2);
  }

  function palace(ctx, col, baseY, t, lamps) {
    ctx.fillStyle = col.stone;
    ctx.fillRect(-200, baseY - 60, PAGE_W + 400, 60 + (PAGE_H - baseY) + 200);
    ctx.fillStyle = col.stoneLit;
    for (var i = -200; i < PAGE_W + 200; i += 22) ctx.fillRect(i, baseY - 66, 13, 7);
    CR.Art.gopuram(ctx, 118, baseY - 60, 62, 108, col.stone, true);
    CR.Art.gopuram(ctx, 372, baseY - 60, 48, 82, col.stone, true);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(228, baseY - 46, 34, 46);
    if (lamps) for (var k = 0; k < 5; k++) CR.Art.torch(ctx, 30 + k * 108, baseY - 22, t);
    CR.Art.inscription(ctx, 24, baseY - 34, 70, 3, 'rgba(255,255,255,0.16)', 11);
  }

  function ground(ctx, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(-200, y, PAGE_W + 400, PAGE_H - y + 200);
  }

  function guard(ctx, x, y, t, face, anim, h) {
    CR.Art.drawPerson(ctx, {
      x: x, y: y, height: h || 52, anim: anim || 'idle', t: t, facing: face || 1,
      colors: CR.Art.CHOLA, weapon: 'spear', helmet: true
    });
  }

  function sleeper(ctx, x, y, t, face) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(face * 6, 0); ctx.lineTo(face * 28, -7); ctx.stroke();
    ctx.restore();
    CR.Art.drawPerson(ctx, {
      x: x, y: y, height: 50, anim: 'sleep', t: t, facing: face || 1,
      colors: CR.Art.CHOLA, weapon: 'none', helmet: true, face: 'out'
    });
    var n = Math.floor(t * 1.2) % 3;
    for (var i = 0; i <= n; i++) {
      CR.Art.text(ctx, 'z', x + face * (11 + i * 7), y - 34 - i * 8,
        { font: CR.Art.FONT_UI, color: 'rgba(255,255,255,0.9)' });
    }
  }

  function horse(ctx, x, y, s, col, t, running) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    var dark = '#1a1210';
    ctx.fillStyle = col;
    CR.Art.roundRect(ctx, -20, -30, 40, 17, 7); ctx.fill();
    ctx.save();
    ctx.translate(16, -28); ctx.rotate(-0.5);
    ctx.fillStyle = col;
    CR.Art.roundRect(ctx, -5, -16, 10, 20, 4); ctx.fill();
    ctx.restore();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(26, -44, 8, 4.6, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(22, -49); ctx.lineTo(24, -54); ctx.lineTo(26, -48); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -44); ctx.lineTo(20, -46); ctx.lineTo(14, -28); ctx.lineTo(8, -30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(-30, -22); ctx.lineTo(-20, -18); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    var ph = running ? t * 13 : 0;
    for (var i = 0; i < 4; i++) {
      var lx = -14 + (i % 2) * 28;
      var a = running ? Math.sin(ph + i * 1.6) * 0.75 : (i % 2 ? 0.18 : -0.18);
      var kx = lx + Math.sin(a) * 8, ky = -14 + Math.cos(a) * 8;
      ctx.beginPath();
      ctx.moveTo(lx, -14); ctx.lineTo(kx, ky);
      ctx.lineTo(kx + Math.sin(a * 0.3) * 6, ky + Math.cos(a * 0.3) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Vimal: tall, long-haired, a few days unshaven, jaw like a doorframe.
  function vimal(ctx, x, y, anim, t, facing, carrying, h, face) {
    h = h || 78;
    CR.Art.drawPerson(ctx, {
      x: x, y: y, height: h, anim: anim, t: t, facing: facing,
      colors: CR.Art.BOSS, weapon: carrying ? 'none' : 'club',
      hair: 'long', jaw: 'strong', stubble: true, face: face
    });
    if (carrying) {
      ctx.save();
      ctx.translate(x - facing * h * 0.14, y - h * 0.86);
      ctx.rotate(facing * 0.55);
      CR.Art.drawPrincess(ctx, 0, 10, t, false, h * 0.62, 'pain');
      ctx.restore();
    }
  }

  /* ---------- balloons, captions, sound ---------- */

  function balloon(ctx, x, y, text, flip, shout) {
    var font = shout ? '700 9px "Trebuchet MS", sans-serif' : CR.Art.FONT_SMALL;
    ctx.font = font;
    var w = ctx.measureText(text).width + 12;
    var h = 15;
    ctx.fillStyle = '#fdf8ec';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    if (shout) {
      // a jagged shout balloon
      ctx.beginPath();
      var pts = 16;
      for (var i = 0; i < pts; i++) {
        var a = (i / pts) * Math.PI * 2;
        var rr = (i % 2 ? 0.78 : 1.05);
        var px = x + Math.cos(a) * (w / 2) * rr;
        var py = y - h / 2 + Math.sin(a) * (h * 0.85) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      CR.Art.roundRect(ctx, x - w / 2, y - h, w, h, 6);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + (flip ? 6 : -6), y - 1);
      ctx.lineTo(x + (flip ? -3 : 3), y + 7);
      ctx.lineTo(x + (flip ? -6 : 6), y - 1);
      ctx.closePath();
      ctx.fillStyle = '#fdf8ec'; ctx.fill();
      ctx.stroke();
    }
    CR.Art.text(ctx, text, x, y - 4.5, { align: 'center', font: font, color: INK, shadow: false });
  }

  // the yellow narration box comics put in the corner of a panel
  function captionBox(ctx, px, py, pw, text) {
    var lines = CR.Art.wrap(ctx, text, pw - 22, CR.Art.FONT_SMALL);
    var h = 7 + lines.length * 9;
    var w = pw - 12;
    ctx.fillStyle = '#f2d67a';
    ctx.fillRect(px + 6, py + 6, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.1;
    ctx.strokeRect(px + 6, py + 6, w, h);
    for (var i = 0; i < lines.length; i++) {
      CR.Art.text(ctx, lines[i], px + 12, py + 16 + i * 9,
        { font: CR.Art.FONT_SMALL, color: '#2a1c08', shadow: false });
    }
  }

  // KA-POW, but in Tamil
  function soundWord(ctx, x, y, text, angle, size, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || -0.18);
    ctx.font = '700 ' + (size || 20) + 'px "Trebuchet MS", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = col || '#ffd24a';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  /* ============================================================
     THE PAGES

     A page is a list of panels. Each panel picks a spot in the scene
     to look at (focus) and how close to stand (zoom), so the same
     scene code can give a wide shot and a close-up.
     ============================================================ */

  function nightPalace(baseY, groundY, lamps) {
    return function (ctx, t) {
      sky(ctx, NIGHT.sky1, NIGHT.sky2);
      stars(ctx, 3);
      palace(ctx, NIGHT, baseY, t, lamps !== false);
      ground(ctx, groundY, '#141826');
    };
  }

  S.INTRO = [
    // ---- 1 ----
    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [240, 150], zoom: 1,
      caption: 'CHOLAPURAM. A thousand years ago. A warm night, a full moon - and every last guard on the wall fast asleep.',
      draw: function (ctx, t) {
        nightPalace(210, 236, true)(ctx, t);
        moon(ctx, 398, 44, 13);
        sleeper(ctx, 150, 236, t, 1);
        sleeper(ctx, 212, 236, t + 1.7, -1);
        sleeper(ctx, 330, 236, t + 0.8, 1);
      },
      balloons: [[212, 172, 'zzz...', false, false]]
    }]},

    // ---- 2: wide, then a close-up of the man himself ----
    { panels: [
      { x: 8, y: 8, w: 300, h: 254, focus: [200, 150], zoom: 1,
        caption: 'Over the wall came VIMAL of the Pandya court. A very large man, with a very high opinion of himself.',
        draw: function (ctx, t) {
          nightPalace(216, 244, true)(ctx, t);
          moon(ctx, 60, 40, 11);
          vimal(ctx, 214, 244, 'walk', t * 0.35, 1, false, 82);
          sleeper(ctx, 92, 244, t, 1);
        },
        balloons: [[214, 120, 'Tip... toe... tip...', false, false]],
        sound: null
      },
      { x: 316, y: 8, w: 156, h: 254, focus: [216, 188], zoom: 2.5,
        caption: null,
        draw: function (ctx, t) {
          sky(ctx, '#141a34', '#242a4a');
          vimal(ctx, 214, 244, 'idle', t * 0.35, 1, false, 82, 'smile');
        }
      }
    ]},

    // ---- 3: the abduction ----
    { panels: [
      { x: 8, y: 8, w: 464, h: 150, focus: [230, 176], zoom: 1.28,
        caption: 'He took Princess KUNDAVAI out of her own courtyard. She did not go quietly.',
        draw: function (ctx, t) {
          nightPalace(214, 240, true)(ctx, t);
          vimal(ctx, 200, 240, 'run', t, 1, true, 82);
          CR.Art.kolam(ctx, 90, 236, 12, 'rgba(255,255,255,0.22)');
        },
        balloons: [[132, 52, 'VIDU! LET ME GO!', true, true]]
      },
      { x: 8, y: 164, w: 464, h: 98, focus: [300, 210], zoom: 1.0,
        caption: null,
        draw: function (ctx, t) {
          nightPalace(214, 240, false)(ctx, t);
          horse(ctx, 300, 246, 1.15, '#3b2c22', t, true);
          vimal(ctx, 296, 214, 'ride', t, 1, true, 56);
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          for (var i = 0; i < 14; i++) ctx.fillRect(120 + i * 13, 242 - (i % 3) * 3, 9, 2);
        },
        sound: ['THUD-THUD-THUD', 200, 200, -0.12, 18]
      }
    ]},

    // ---- 4: the wake-up ----
    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [200, 150], zoom: 1,
      caption: 'By the time anyone opened an eye, there was nothing to see but dust.',
      draw: function (ctx, t) {
        nightPalace(208, 234, true)(ctx, t);
        moon(ctx, 404, 52, 12);
        guard(ctx, 96, 234, t, 1, 'cheer', 54);
        guard(ctx, 150, 234, t + 1, 1, 'hurt', 52);
        horse(ctx, 424, 226, 0.55, '#2c211a', t, true);
        vimal(ctx, 421, 210, 'ride', t, 1, true, 36);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (var i = 0; i < 10; i++) ctx.fillRect(300 + i * 13, 228 - (i % 3), 9, 2);
      },
      balloons: [[128, 138, 'SHE IS GONE!', false, true]]
    }]},

    // ---- 5: the king ----
    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [240, 150], zoom: 1,
      caption: 'King PARANTAKA CHOLA was woken with the news. He did not take it calmly.',
      draw: function (ctx, t) {
        ctx.fillStyle = '#2c2230'; ctx.fillRect(-200, -200, 900, 700);
        ctx.fillStyle = '#3a2c3c';
        for (var x = 20; x < PAGE_W; x += 96) ctx.fillRect(x, 40, 22, 182);
        ground(ctx, 222, '#241b26');
        for (var k = 0; k < 4; k++) CR.Art.torch(ctx, 46 + k * 128, 210, t);
        ctx.fillStyle = '#6a4a1c';
        CR.Art.roundRect(ctx, 74, 140, 66, 82, 8); ctx.fill();
        ctx.fillStyle = '#d8b24e'; ctx.fillRect(74, 134, 66, 8);
        CR.Art.kolam(ctx, 107, 176, 15, 'rgba(255,220,140,0.25)');
        CR.Art.drawPerson(ctx, { x: 190, y: 222, height: 66, anim: 'cheer', t: t, facing: 1,
          colors: CR.Art.CHOLA, weapon: 'none', crown: true, moustache: true, face: 'grim' });
        guard(ctx, 330, 222, t, -1, 'hurt', 54);
        guard(ctx, 386, 222, t + 1, -1, 'hurt', 52);
      },
      balloons: [[268, 100, 'YOU WERE ASLEEP?!', false, true]]
    }]},

    // ---- 6: the king sends his son ----
    { panels: [
      { x: 8, y: 8, w: 232, h: 254, focus: [203, 186], zoom: 1.45,
        caption: 'He went straight to his son.',
        draw: function (ctx, t) {
          ctx.fillStyle = '#2c2230'; ctx.fillRect(-200, -200, 900, 700);
          ctx.fillStyle = '#3a2c3c';
          for (var x = 40; x < PAGE_W; x += 110) ctx.fillRect(x, 30, 24, 194);
          ground(ctx, 224, '#241b26');
          CR.Art.torch(ctx, 66, 212, t);
          CR.Art.torch(ctx, 320, 212, t);
          CR.Art.drawPerson(ctx, { x: 150, y: 224, height: 66, anim: 'idle', t: t, facing: 1,
            colors: CR.Art.CHOLA, weapon: 'none', crown: true, moustache: true, face: 'grim' });
          CR.Art.drawPerson(ctx, { x: 256, y: 224, height: 64, anim: 'idle', t: t, facing: -1,
            colors: CR.Art.HERO, weapon: 'sword', crown: true, face: 'grim' });
        },
        balloons: [[126, 66, 'Bring your sister home.', false, false]]
      },
      { x: 248, y: 8, w: 224, h: 254, focus: [254, 188], zoom: 2.1,
        caption: null,
        draw: function (ctx, t) {
          ctx.fillStyle = '#241b26'; ctx.fillRect(-200, -200, 900, 700);
          CR.Art.torch(ctx, 320, 212, t);
          CR.Art.drawPerson(ctx, { x: 256, y: 224, height: 64, anim: 'idle', t: t, facing: -1,
            colors: CR.Art.HERO, weapon: 'sword', crown: true, face: 'grim' });
        },
        balloons: [[112, 46, 'Or I do not come back.', true, false]]
      }
    ]},

    // ---- 7: the ride south ----
    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [240, 150], zoom: 1,
      caption: 'Before first light he took a chariot south, alone, towards Madurai and the Pandya king.',
      draw: function (ctx, t) {
        sky(ctx, '#3a3050', '#c98a54');
        var sg = ctx.createRadialGradient(70, 150, 4, 70, 150, 90);
        sg.addColorStop(0, 'rgba(255,220,150,0.85)');
        sg.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(70, 150, 90, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3d3245';
        ctx.beginPath();
        ctx.moveTo(-100, 200);
        for (var x = -100; x <= PAGE_W + 100; x += 20) ctx.lineTo(x, 176 + Math.sin(x * 0.02) * 16);
        ctx.lineTo(PAGE_W + 100, PAGE_H + 100); ctx.lineTo(-100, PAGE_H + 100); ctx.fill();
        CR.Art.gopuram(ctx, 400, 196, 40, 74, '#3d3245', false);
        ground(ctx, 224, '#6a4f34');
        horse(ctx, 118, 226, 1.3, '#2e2018', t, true);
        ctx.fillStyle = '#7a5230';
        CR.Art.roundRect(ctx, 196, 168, 62, 34, 5); ctx.fill();
        ctx.fillStyle = '#d8b24e'; ctx.fillRect(196, 166, 62, 5);
        ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(226, 210, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(196, 186); ctx.lineTo(150, 190); ctx.stroke();
        CR.Art.drawPerson(ctx, { x: 232, y: 170, height: 56, anim: 'idle', t: t, facing: -1,
          colors: CR.Art.HERO, weapon: 'dagger', crown: true, face: 'grim' });
      },
      sound: ['HYAAAH!', 330, 90, -0.14, 24]
    }]}
  ];

  S.ENDING = [
    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [240, 150], zoom: 1,
      caption: 'Vimal went down like a sack of temple rice, and every lamp in the hall shook with him.',
      draw: function (ctx, t) {
        ctx.fillStyle = '#140e1c'; ctx.fillRect(-200, -200, 900, 700);
        ctx.fillStyle = '#241a28';
        for (var x = 10; x < PAGE_W; x += 92) ctx.fillRect(x, 20, 24, 200);
        ground(ctx, 218, '#2a1f2e');
        for (var k = 0; k < 4; k++) CR.Art.torch(ctx, 54 + k * 122, 206, t);
        vimal(ctx, 340, 218, 'dead', t, -1, false, 78);
        CR.Art.drawPerson(ctx, { x: 168, y: 218, height: 58, anim: 'idle', t: t, facing: 1,
          colors: CR.Art.HERO, weapon: 'sword', crown: true, face: 'grim' });
      },
      balloons: [[128, 96, 'KUNDAVAI!', true, true]],
      sound: ['DHAAM!', 336, 120, 0.16, 22]
    }]},

    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [240, 150], zoom: 1,
      caption: 'The lock gave way. She had been in there three days, and she had a great deal to say about it.',
      draw: function (ctx, t) {
        ctx.fillStyle = '#181022'; ctx.fillRect(-200, -200, 900, 700);
        ground(ctx, 214, '#2a1f2e');
        for (var k = 0; k < 3; k++) CR.Art.torch(ctx, 70 + k * 160, 202, t);
        ctx.strokeStyle = '#8e959e'; ctx.lineWidth = 2.4;
        for (var b = 0; b <= 44; b += 8.8) {
          ctx.beginPath(); ctx.moveTo(300 + b, 214); ctx.lineTo(318 + b, 118); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(300, 214); ctx.lineTo(344, 214); ctx.stroke();
        CR.Art.drawPrincess(ctx, 240, 214, t, true, 56);
        CR.Art.drawPerson(ctx, { x: 170, y: 214, height: 58, anim: 'idle', t: t, facing: 1,
          colors: CR.Art.HERO, weapon: 'sword', crown: true, face: 'smile' });
      },
      balloons: [[272, 92, 'Took you long enough!', false, false]]
    }]},

    { panels: [{
      x: 8, y: 8, w: 464, h: 254, focus: [240, 150], zoom: 1,
      caption: 'They rode home to Cholapuram at first light. The guards, it is said, never slept on duty again.',
      draw: function (ctx, t) {
        sky(ctx, DAY.sky1, DAY.sky2);
        var sg = ctx.createRadialGradient(410, 60, 4, 410, 60, 80);
        sg.addColorStop(0, 'rgba(255,240,180,0.9)');
        sg.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(410, 60, 80, 0, Math.PI * 2); ctx.fill();
        palace(ctx, DAY, 206, t, false);
        ground(ctx, 232, '#8a6a44');
        CR.Art.drawPerson(ctx, { x: 152, y: 232, height: 58, anim: 'cheer', t: t + 0.4, facing: 1,
          colors: CR.Art.HERO, weapon: 'sword', crown: true, face: 'smile' });
        CR.Art.drawPrincess(ctx, 206, 232, t, true, 56);
        CR.Art.drawPerson(ctx, { x: 262, y: 232, height: 60, anim: 'cheer', t: t, facing: -1,
          colors: CR.Art.CHOLA, weapon: 'none', crown: true, moustache: true, face: 'smile' });
        for (var i = 0; i < 4; i++) guard(ctx, 318 + i * 42, 232, t + i * 0.6, -1, 'cheer', 48);
        var rnd = CR.rng(77);
        for (var p = 0; p < 30; p++) {
          var px = rnd() * PAGE_W, py = ((rnd() * 300) + t * 30) % 240;
          ctx.fillStyle = p % 2 ? 'rgba(255,180,200,0.9)' : 'rgba(255,225,140,0.9)';
          ctx.fillRect(px, py, 2.2, 2.2);
        }
        CR.Art.kolam(ctx, 90, 228, 14, 'rgba(255,255,255,0.4)');
      },
      sound: ['VETRI!', 380, 116, -0.1, 22]
    }]}
  ];

  /* ---------- drawing one page ---------- */
  S.drawPage = function (ctx, page, t, progress) {
    // scale the 480x270 page into whatever the screen gives us
    var sx = CR.VIEW_W / PAGE_W, sy = (CR.VIEW_H - 12) / PAGE_H;
    ctx.save();
    ctx.scale(sx, sy);

    // the paper the panels sit on
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    for (var i = 0; i < page.panels.length; i++) {
      var pn = page.panels[i];

      ctx.save();
      ctx.beginPath();
      ctx.rect(pn.x, pn.y, pn.w, pn.h);
      ctx.clip();

      // point the "camera" at this panel's subject
      var zoom = pn.zoom || 1;
      var fx = pn.focus ? pn.focus[0] : PAGE_W / 2;
      var fy = pn.focus ? pn.focus[1] : PAGE_H / 2;
      ctx.save();
      ctx.translate(pn.x + pn.w / 2, pn.y + pn.h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-fx, -fy);
      pn.draw(ctx, t);
      ctx.restore();

      // printed shading
      halftone(ctx, pn.x, pn.y, pn.w, pn.h, 0.13);

      if (pn.sound) soundWord(ctx, pn.sound[1], pn.sound[2], pn.sound[0], pn.sound[3], pn.sound[4]);
      if (pn.caption) captionBox(ctx, pn.x, pn.y, pn.w, pn.caption);
      // balloon positions are measured from the panel's own corner, so a
      // balloon can never wander outside the frame it belongs to
      if (pn.balloons) {
        for (var b = 0; b < pn.balloons.length; b++) {
          var bl = pn.balloons[b];
          balloon(ctx, pn.x + bl[0], pn.y + bl[1], bl[2], bl[3], bl[4]);
        }
      }
      ctx.restore();

      // the heavy panel border
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeRect(pn.x, pn.y, pn.w, pn.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pn.x + 2, pn.y + 2, pn.w - 4, pn.h - 4);
    }

    ctx.restore();

    // the page-turn timer along the bottom edge
    ctx.fillStyle = 'rgba(20,15,10,0.9)';
    ctx.fillRect(0, CR.VIEW_H - 12, CR.VIEW_W, 12);
    ctx.fillStyle = 'rgba(242,214,122,0.25)';
    ctx.fillRect(0, CR.VIEW_H - 12, CR.VIEW_W, 12);
    ctx.fillStyle = '#f2d67a';
    ctx.fillRect(0, CR.VIEW_H - 12, CR.VIEW_W * progress, 12);
    CR.Art.text(ctx, 'press any key to turn the page', CR.VIEW_W / 2, CR.VIEW_H - 3.5, {
      align: 'center', font: CR.Art.FONT_SMALL, color: 'rgba(40,28,10,0.75)', shadow: false
    });
  };

  CR.Story = S;
})();
