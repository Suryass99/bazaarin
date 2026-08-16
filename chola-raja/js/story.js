/* ============================================================
   story.js - the comic book pages.

   The story is told as a page-turner: each page paints itself, holds
   for ten seconds, then turns on its own. Nobody has to click anything,
   which is what you asked for - but pressing a key skips ahead for
   anyone who has already read it.
   ============================================================ */
(function () {
  var S = {};
  // Comic pages are drawn in their own fixed 480x270 space, then scaled
  // into whatever room the panel has. That keeps the layouts stable.
  var PAGE_W = 480, PAGE_H = 270;


  var NIGHT = { sky1: '#0b1026', sky2: '#1d2140', stone: '#2a2c44', stoneLit: '#3b3d5c', warm: '#ffb347' };
  var DAY   = { sky1: '#3f6f8a', sky2: '#d8b06a', stone: '#6b5a44', stoneLit: '#8d795c', warm: '#ffd88a' };

  /* ---------- shared scene furniture ---------- */

  function sky(ctx, c1, c2) {
    var g = ctx.createLinearGradient(0, 0, 0, PAGE_H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
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
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (var i = 0; i < 40; i++) {
      ctx.fillRect(rnd() * PAGE_W, rnd() * 120, 1, 1);
    }
  }

  // The Chola palace: a long wall, a gopuram gate, lamps burning.
  function palace(ctx, col, baseY, t, lamps) {
    ctx.fillStyle = col.stone;
    ctx.fillRect(0, baseY - 60, PAGE_W, 60 + (PAGE_H - baseY));
    ctx.fillStyle = col.stoneLit;
    for (var i = 0; i < PAGE_W; i += 22) ctx.fillRect(i, baseY - 66, 13, 7);
    CR.Art.gopuram(ctx, 118, baseY - 60, 62, 108, col.stone, true);
    CR.Art.gopuram(ctx, 372, baseY - 60, 48, 82, col.stone, true);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(228, baseY - 46, 34, 46);          // the gateway
    if (lamps) {
      for (var k = 0; k < 5; k++) CR.Art.torch(ctx, 30 + k * 108, baseY - 22, t);
    }
    CR.Art.inscription(ctx, 24, baseY - 34, 70, 3, 'rgba(255,255,255,0.14)', 11);
  }

  function ground(ctx, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(0, y, PAGE_W, PAGE_H - y);
  }

  // A Chola guard, upright and awake.
  function guard(ctx, x, y, t, face, anim, h) {
    CR.Art.drawPerson(ctx, {
      x: x, y: y, height: h || 46, anim: anim || 'idle', t: t, facing: face || 1,
      colors: CR.Art.CHOLA, weapon: 'spear', helmet: true
    });
  }

  // a sleeping guard, complete with the snoring letters
  function sleeper(ctx, x, y, t, face) {
    // the spear he has dropped
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(face * 6, 0); ctx.lineTo(face * 26, -6); ctx.stroke();
    ctx.restore();
    CR.Art.drawPerson(ctx, {
      x: x, y: y, height: 46, anim: 'sleep', t: t, facing: face || 1,
      colors: CR.Art.CHOLA, weapon: 'none', helmet: true
    });
    var n = Math.floor(t * 1.2) % 3;
    for (var i = 0; i <= n; i++) {
      CR.Art.text(ctx, 'z', x + face * (10 + i * 7), y - 32 - i * 8,
        { font: CR.Art.FONT_UI, color: 'rgba(255,255,255,0.85)' });
    }
  }

  function horse(ctx, x, y, s, col, t, running) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    var dark = '#1a1210';
    ctx.fillStyle = col;
    // barrel of the body
    CR.Art.roundRect(ctx, -20, -30, 40, 17, 7); ctx.fill();
    // neck, rising forward
    ctx.save();
    ctx.translate(16, -28);
    ctx.rotate(-0.5);
    ctx.fillStyle = col;
    CR.Art.roundRect(ctx, -5, -16, 10, 20, 4); ctx.fill();
    ctx.restore();
    // head
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(26, -44, 8, 4.6, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(22, -49); ctx.lineTo(24, -54); ctx.lineTo(26, -48); ctx.fill();
    // mane and tail
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(12, -44); ctx.lineTo(20, -46); ctx.lineTo(14, -28); ctx.lineTo(8, -30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(-30, -22); ctx.lineTo(-20, -18); ctx.fill();
    // legs
    ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    var ph = running ? t * 13 : 0;
    for (var i = 0; i < 4; i++) {
      var lx = -14 + (i % 2) * 28;
      var a = running ? Math.sin(ph + i * 1.6) * 0.75 : (i % 2 ? 0.18 : -0.18);
      var kx = lx + Math.sin(a) * 8, ky = -14 + Math.cos(a) * 8;
      ctx.beginPath();
      ctx.moveTo(lx, -14);
      ctx.lineTo(kx, ky);
      ctx.lineTo(kx + Math.sin(a * 0.3) * 6, ky + Math.cos(a * 0.3) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Vimal: heavy, loud, and not nearly as clever as he thinks
  function vimal(ctx, x, y, anim, t, facing, carrying, h) {
    h = h || 70;
    CR.Art.drawPerson(ctx, {
      x: x, y: y, height: h, anim: anim, t: t, facing: facing,
      colors: CR.Art.BOSS, weapon: carrying ? 'none' : 'club', moustache: true
    });
    if (carrying) {
      ctx.save();
      ctx.translate(x - facing * h * 0.13, y - h * 0.88);
      ctx.rotate(facing * 0.5);
      ctx.scale(h / 61, h / 61);
      CR.Art.drawPrincess(ctx, 0, 10, t, false);
      ctx.restore();
    }
  }

  function speech(ctx, x, y, text, flip) {
    ctx.font = CR.Art.FONT_SMALL;
    var w = ctx.measureText(text).width + 10;
    var h = 13;
    ctx.fillStyle = 'rgba(252,246,228,0.95)';
    CR.Art.roundRect(ctx, x - w / 2, y - h, w, h, 5); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + (flip ? 5 : -5), y);
    ctx.lineTo(x + (flip ? -2 : 2), y + 6);
    ctx.lineTo(x + (flip ? -5 : 5), y);
    ctx.fill();
    CR.Art.text(ctx, text, x, y - 3.5, { align: 'center', font: CR.Art.FONT_SMALL, color: '#2a1c10', shadow: false });
  }

  /* ---------- the pages ---------- */

  S.INTRO = [
    {
      caption: 'Cholapuram, a thousand years ago. A warm night, a full moon, and every single guard fast asleep.',
      draw: function (ctx, t) {
        sky(ctx, NIGHT.sky1, NIGHT.sky2);
        stars(ctx, 3);
        moon(ctx, 398, 44, 13);
        palace(ctx, NIGHT, 210, t, true);
        ground(ctx, 236, '#141826');
        sleeper(ctx, 150, 236, t, 1);
        sleeper(ctx, 196, 236, t + 1.7, -1);
        sleeper(ctx, 300, 236, t + 0.8, 1);
      }
    },
    {
      caption: 'Over the wall came Vimal of the Pandya court - a very large man with a very quiet opinion of himself.',
      draw: function (ctx, t) {
        sky(ctx, NIGHT.sky1, NIGHT.sky2);
        stars(ctx, 9);
        moon(ctx, 60, 40, 11);
        palace(ctx, NIGHT, 220, t, true);
        ground(ctx, 246, '#141826');
        vimal(ctx, 232, 246, 'walk', t * 0.35, 1, false);
        speech(ctx, 300, 178, 'Tip... toe... tip...', false);
        sleeper(ctx, 96, 246, t, 1);
        sleeper(ctx, 400, 246, t + 1.1, -1);
      }
    },
    {
      caption: 'He took Princess Kundavai, sister of Prince Rajaraja, straight out of her own courtyard.',
      draw: function (ctx, t) {
        sky(ctx, NIGHT.sky1, NIGHT.sky2);
        stars(ctx, 21);
        palace(ctx, NIGHT, 214, t, true);
        ground(ctx, 240, '#141826');
        vimal(ctx, 170, 240, 'run', t, 1, true);
        speech(ctx, 118, 158, 'Ayyo! Somebody!', true);
        horse(ctx, 350, 240, 1.05, '#3b2c22', t, false);
        CR.Art.kolam(ctx, 60, 236, 12, 'rgba(255,255,255,0.2)');
      }
    },
    {
      caption: 'By the time anyone woke up, there was nothing left to see but dust and a very smug silhouette.',
      draw: function (ctx, t) {
        sky(ctx, NIGHT.sky1, NIGHT.sky2);
        stars(ctx, 33);
        moon(ctx, 404, 52, 12);
        palace(ctx, NIGHT, 208, t, true);
        ground(ctx, 234, '#141826');
        guard(ctx, 84, 234, t, 1, 'cheer', 50);
        guard(ctx, 132, 234, t + 1, 1, 'idle', 48);
        speech(ctx, 112, 172, 'She is GONE!', false);
        // Vimal, already small in the distance
        horse(ctx, 402, 226, 0.62, '#2c211a', t, true);
        vimal(ctx, 398, 202, 'idle', t, 1, true, 40);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        for (var i = 0; i < 9; i++) ctx.fillRect(290 + i * 13, 226 - (i % 3), 9, 2);
      }
    },
    {
      caption: 'King Parantaka Chola was woken with the news. He did not take it calmly.',
      draw: function (ctx, t) {
        sky(ctx, '#20182c', '#3a2a30');
        // throne room
        ctx.fillStyle = '#2c2230';
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
        ctx.fillStyle = '#3a2c3c';
        for (var x = 20; x < PAGE_W; x += 96) ctx.fillRect(x, 40, 22, 180);
        ground(ctx, 220, '#241b26');
        for (var k = 0; k < 4; k++) CR.Art.torch(ctx, 46 + k * 128, 208, t);
        // throne
        ctx.fillStyle = '#6a4a1c';
        CR.Art.roundRect(ctx, 74, 140, 66, 82, 8); ctx.fill();
        ctx.fillStyle = '#d8b24e';
        ctx.fillRect(74, 134, 66, 8);
        CR.Art.kolam(ctx, 107, 176, 15, 'rgba(255,220,140,0.25)');
        // the king is on his feet, not on his throne
        CR.Art.drawPerson(ctx, { x: 190, y: 222, height: 64, anim: 'cheer', t: t, facing: 1, colors: CR.Art.CHOLA, weapon: 'none', crown: true, moustache: true });
        speech(ctx, 262, 118, 'You were ASLEEP?!', false);
        guard(ctx, 320, 222, t, -1, 'hurt', 52);
        guard(ctx, 372, 222, t + 1, -1, 'hurt', 50);
      }
    },
    {
      caption: 'Prince Rajaraja made one promise: "I will bring my sister home." Then he took a chariot south, alone.',
      draw: function (ctx, t) {
        sky(ctx, '#3a3050', '#c98a54');
        var sg = ctx.createRadialGradient(70, 150, 4, 70, 150, 90);
        sg.addColorStop(0, 'rgba(255,220,150,0.8)');
        sg.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(70, 150, 90, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3d3245';
        ctx.beginPath();
        ctx.moveTo(0, 200);
        for (var x = 0; x <= PAGE_W; x += 20) ctx.lineTo(x, 176 + Math.sin(x * 0.02) * 16);
        ctx.lineTo(PAGE_W, PAGE_H); ctx.lineTo(0, PAGE_H); ctx.fill();
        CR.Art.gopuram(ctx, 400, 196, 40, 74, '#3d3245', false);
        ground(ctx, 224, '#6a4f34');
        horse(ctx, 130, 224, 1.35, '#2e2018', t, true);
        // chariot
        ctx.fillStyle = '#7a5230';
        CR.Art.roundRect(ctx, 196, 168, 62, 34, 5); ctx.fill();
        ctx.fillStyle = '#d8b24e';
        ctx.fillRect(196, 166, 62, 5);
        ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(226, 210, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(196, 186); ctx.lineTo(150, 190); ctx.stroke();
        CR.Art.drawPerson(ctx, { x: 232, y: 170, height: 54, anim: 'idle', t: t, facing: -1, colors: CR.Art.HERO, weapon: 'dagger', crown: true });
        speech(ctx, 316, 116, 'I will bring her home.', true);
      }
    }
  ];

  S.ENDING = [
    {
      caption: 'Vimal went down like a sack of temple rice, and the lamps of the hall shook with him.',
      draw: function (ctx, t) {
        ctx.fillStyle = '#140e1c'; ctx.fillRect(0, 0, PAGE_W, PAGE_H);
        ctx.fillStyle = '#241a28';
        for (var x = 10; x < PAGE_W; x += 92) ctx.fillRect(x, 20, 24, 200);
        ground(ctx, 218, '#2a1f2e');
        for (var k = 0; k < 4; k++) CR.Art.torch(ctx, 54 + k * 122, 206, t);
        vimal(ctx, 330, 218, 'dead', t, -1, false);
        CR.Art.drawPerson(ctx, { x: 172, y: 218, height: 56, anim: 'idle', t: t, facing: 1, colors: CR.Art.HERO, weapon: 'sword', crown: true });
        speech(ctx, 140, 138, 'Kundavai!', true);
      }
    },
    {
      caption: 'The lock gave way. She had been waiting three days, and she had a great deal to say about it.',
      draw: function (ctx, t) {
        ctx.fillStyle = '#181022'; ctx.fillRect(0, 0, PAGE_W, PAGE_H);
        ground(ctx, 214, '#2a1f2e');
        for (var k = 0; k < 3; k++) CR.Art.torch(ctx, 70 + k * 160, 202, t);
        // the broken cage door, swung open
        ctx.strokeStyle = '#8e959e'; ctx.lineWidth = 2.4;
        for (var b = 0; b <= 44; b += 8.8) {
          ctx.beginPath(); ctx.moveTo(300 + b, 214); ctx.lineTo(318 + b, 118); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(300, 214); ctx.lineTo(344, 214); ctx.stroke();
        CR.Art.drawPrincess(ctx, 236, 214, t, true, 54);
        CR.Art.drawPerson(ctx, { x: 168, y: 214, height: 56, anim: 'idle', t: t, facing: 1, colors: CR.Art.HERO, weapon: 'sword', crown: true });
        speech(ctx, 268, 132, 'Took you long enough!', false);
      }
    },
    {
      caption: 'They rode home to Cholapuram at first light. The guards, it is said, never slept on duty again.',
      draw: function (ctx, t) {
        sky(ctx, DAY.sky1, DAY.sky2);
        var sg = ctx.createRadialGradient(410, 60, 4, 410, 60, 80);
        sg.addColorStop(0, 'rgba(255,240,180,0.9)');
        sg.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(410, 60, 80, 0, Math.PI * 2); ctx.fill();
        palace(ctx, DAY, 206, t, false);
        ground(ctx, 232, '#8a6a44');
        CR.Art.drawPerson(ctx, { x: 152, y: 232, height: 58, anim: 'cheer', t: t + 0.4, facing: 1, colors: CR.Art.HERO, weapon: 'sword', crown: true });
        CR.Art.drawPrincess(ctx, 206, 232, t, true, 54);
        CR.Art.drawPerson(ctx, { x: 262, y: 232, height: 60, anim: 'cheer', t: t, facing: -1, colors: CR.Art.CHOLA, weapon: 'none', crown: true, moustache: true });
        for (var i = 0; i < 4; i++) {
          CR.Art.drawPerson(ctx, {
            x: 318 + i * 42, y: 232, height: 46, anim: 'cheer', t: t + i * 0.6,
            facing: -1, colors: CR.Art.CHOLA, weapon: 'none', helmet: true
          });
        }
        // flower petals
        var rnd = CR.rng(77);
        for (var p = 0; p < 26; p++) {
          var px = rnd() * PAGE_W;
          var py = ((rnd() * 300) + t * 30) % 240;
          ctx.fillStyle = p % 2 ? 'rgba(255,180,200,0.85)' : 'rgba(255,225,140,0.85)';
          ctx.fillRect(px, py, 2, 2);
        }
        CR.Art.kolam(ctx, 90, 228, 14, 'rgba(255,255,255,0.35)');
      }
    }
  ];

  /* Draws one page: the picture, a hand-drawn frame, and the caption. */
  S.drawPage = function (ctx, page, t, progress) {
    var panelW = CR.VIEW_W - 16, panelH = CR.VIEW_H - 58;
    ctx.save();
    ctx.beginPath();
    ctx.rect(8, 8, panelW, panelH);
    ctx.clip();
    ctx.translate(8, 8);
    ctx.scale(panelW / PAGE_W, panelH / PAGE_H);
    page.draw(ctx, t);
    ctx.restore();

    // paper background behind the caption
    ctx.fillStyle = '#f2e4c2';
    ctx.fillRect(0, CR.VIEW_H - 50, CR.VIEW_W, 50);
    ctx.fillStyle = '#d8c69c';
    ctx.fillRect(0, CR.VIEW_H - 50, CR.VIEW_W, 1.5);

    // the frame around the picture
    ctx.strokeStyle = '#2a1c10';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(8, 8, panelW, panelH);

    var lines = CR.Art.wrap(ctx, page.caption, CR.VIEW_W - 36, CR.Art.FONT_BODY);
    var ty = CR.VIEW_H - 34 - (lines.length - 1) * 6;
    for (var i = 0; i < lines.length; i++) {
      CR.Art.text(ctx, lines[i], CR.VIEW_W / 2, ty + i * 12, {
        align: 'center', font: CR.Art.FONT_BODY, color: '#3a2a18', shadow: false
      });
    }

    // the page-turn timer, drawn as a thin line filling up
    ctx.fillStyle = 'rgba(58,42,24,0.25)';
    ctx.fillRect(0, CR.VIEW_H - 3, CR.VIEW_W, 3);
    ctx.fillStyle = '#8c5a2a';
    ctx.fillRect(0, CR.VIEW_H - 3, CR.VIEW_W * progress, 3);
  };

  CR.Story = S;
})();
