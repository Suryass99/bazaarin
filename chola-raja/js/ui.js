/* ============================================================
   ui.js - everything drawn on top of the world: the hearts, the
   menus, the touch buttons, the level cards and the pause screen.
   ============================================================ */
(function () {
  var UI = {};

  var GOLD = '#e8c887', CREAM = '#f6ecd2', INK = '#1a1208';

  /* ---------- reusable bits ---------- */

  UI.panel = function (ctx, x, y, w, h, alpha) {
    ctx.fillStyle = 'rgba(18,12,8,' + (alpha === undefined ? 0.82 : alpha) + ')';
    CR.Art.roundRect(ctx, x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(232,200,135,0.5)';
    ctx.lineWidth = 1;
    CR.Art.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 4); ctx.stroke();
  };

  // A menu row. Returns its rectangle so the game can test clicks against it.
  UI.menuItem = function (ctx, label, y, selected, hint) {
    var w = 190, x = CR.VIEW_W / 2 - w / 2, h = 22;
    if (selected) {
      ctx.fillStyle = 'rgba(232,200,135,0.16)';
      CR.Art.roundRect(ctx, x, y, w, h, 4); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
      CR.Art.roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 4); ctx.stroke();
    }
    CR.Art.text(ctx, label, CR.VIEW_W / 2, y + 15, {
      align: 'center', font: CR.Art.FONT_SUB, color: selected ? '#fff4d8' : GOLD
    });
    if (hint) {
      CR.Art.text(ctx, hint, CR.VIEW_W / 2 + w / 2 + 8, y + 14, {
        align: 'left', font: CR.Art.FONT_SMALL, color: 'rgba(232,200,135,0.55)'
      });
    }
    return CR.rect(x, y, w, h);
  };

  /* ---------- title screen ---------- */
  UI.drawTitle = function (ctx, game, t) {
    // a slow-moving version of the level 1 backdrop, purely for looks
    CR.Art.drawBackdrop(ctx, game.titleBackdrop, t * 12, 0);
    ctx.fillStyle = 'rgba(10,8,14,0.30)';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);

    // the prince, standing at the left, waiting
    CR.Art.drawPerson(ctx, {
      x: 48, y: CR.VIEW_H - 14, height: 42, anim: 'idle', t: t, facing: 1,
      colors: CR.Art.HERO, weapon: 'sword', crown: true
    });

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = CR.Art.FONT_TITLE;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText('CHOLA RAJA', CR.VIEW_W / 2 + 2, 50);
    var g = ctx.createLinearGradient(0, 22, 0, 54);
    g.addColorStop(0, '#ffe9a8'); g.addColorStop(1, '#c98a2a');
    ctx.fillStyle = g;
    ctx.fillText('CHOLA RAJA', CR.VIEW_W / 2, 48);
    ctx.restore();

    CR.Art.text(ctx, 'The Rescue of Kundavai', CR.VIEW_W / 2, 64, {
      align: 'center', font: CR.Art.FONT_SUB, color: GOLD
    });
    CR.Art.kolam(ctx, CR.VIEW_W / 2, 76, 8, 'rgba(232,200,135,0.5)');

    var rects = [];
    var y = 92;
    for (var i = 0; i < game.menu.items.length; i++) {
      rects.push(UI.menuItem(ctx, game.menu.items[i].label, y, game.menu.index === i, game.menu.items[i].hint));
      y += 25;
    }

    CR.Art.text(ctx, CR.Input.mode === 'touch' ? 'Tap an option' : 'Arrow keys to choose, SPACE to pick  -  M mutes',
      CR.VIEW_W / 2, CR.VIEW_H - 8, { align: 'center', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.6)' });

    return rects;
  };

  /* ---------- how to play ---------- */
  UI.drawControls = function (ctx, game) {
    ctx.fillStyle = 'rgba(10,8,14,0.9)';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
    CR.Art.text(ctx, 'HOW TO PLAY', CR.VIEW_W / 2, 30, { align: 'center', font: CR.Art.FONT_SUB, color: GOLD });

    var keyRows = [
      ['LEFT  RIGHT', 'walk'],
      ['UP', 'jump  -  press it again at a wall to run up the wall'],
      ['DOWN', 'crawl through low gaps'],
      ['SPACE', 'catch a rope, climb a ledge, pull a lever, open a door'],
      ['Z  /  J  /  CTRL', 'swing your blade'],
      ['ESC  /  P', 'pause    -    M mute']
    ];
    var touchRows = [
      ['LEFT THUMB', 'the stick: left and right to walk, push up to jump, pull down to crawl'],
      ['JUMP', 'jump  -  tap it again at a wall to run up the wall'],
      ['SWORD', 'swing your blade'],
      ['GRAB', 'catch a rope, climb a ledge, pull a lever, open a door']
    ];
    var rows = CR.Input.mode === 'touch' ? touchRows : keyRows;

    var y = 48;
    for (var i = 0; i < rows.length; i++) {
      CR.Art.text(ctx, rows[i][0], 128, y, { align: 'right', font: CR.Art.FONT_UI, color: '#fff0c8' });
      CR.Art.text(ctx, rows[i][1], 138, y, { align: 'left', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.78)' });
      y += 15;
    }

    CR.Art.text(ctx, 'Guards raise their weapon before they strike. That is your moment.',
      CR.VIEW_W / 2, y + 10, { align: 'center', font: CR.Art.FONT_SMALL, color: GOLD });
    CR.Art.text(ctx, 'A long fall kills. Spikes kill. Everything else costs one heart.',
      CR.VIEW_W / 2, y + 22, { align: 'center', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.7)' });

    CR.Art.text(ctx, 'press SPACE to go back', CR.VIEW_W / 2, CR.VIEW_H - 8,
      { align: 'center', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.55)' });
  };

  /* ---------- the heads-up display ---------- */
  UI.drawHUD = function (ctx, game) {
    var p = game.player;

    // hearts
    for (var i = 0; i < p.maxHearts; i++) {
      var x = 8 + i * 12, y = 8;
      if (i < p.hearts) CR.World.drawHeart(ctx, x, y, 9, '#d94a4a');
      else {
        ctx.globalAlpha = 0.32;
        CR.World.drawHeart(ctx, x, y, 9, '#4a3038');
        ctx.globalAlpha = 1;
      }
    }

    // which blade you are carrying
    ctx.save();
    ctx.translate(CR.VIEW_W - 20, 26);
    ctx.scale(0.85, 0.85);
    ctx.rotate(0.4);
    CR.Art.drawWeapon(ctx, p.weapon, CR.Art.HERO);
    ctx.restore();

    CR.Art.text(ctx, game.level.subtitle.toUpperCase(), CR.VIEW_W - 34, 14,
      { align: 'right', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.7)' });

    if (game.muted) {
      CR.Art.text(ctx, 'MUTED', 8, CR.VIEW_H - 8, { font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.45)' });
    }
  };

  /* ---------- a sign, a banner, a line of dialogue ---------- */
  UI.drawSign = function (ctx, text, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    var lines = CR.Art.wrap(ctx, text, 300, CR.Art.FONT_SMALL);
    var h = 12 + lines.length * 11;
    UI.panel(ctx, CR.VIEW_W / 2 - 168, 30, 336, h);
    for (var i = 0; i < lines.length; i++) {
      CR.Art.text(ctx, lines[i], CR.VIEW_W / 2, 45 + i * 11, {
        align: 'center', font: CR.Art.FONT_SMALL, color: CREAM
      });
    }
    ctx.restore();
  };

  UI.drawBanner = function (ctx, text, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    UI.panel(ctx, CR.VIEW_W / 2 - 160, CR.VIEW_H - 54, 320, 22);
    CR.Art.text(ctx, text, CR.VIEW_W / 2, CR.VIEW_H - 39, {
      align: 'center', font: CR.Art.FONT_SMALL, color: GOLD
    });
    ctx.restore();
  };

  UI.drawDialogue = function (ctx, line) {
    UI.panel(ctx, 20, CR.VIEW_H - 58, CR.VIEW_W - 40, 44, 0.9);
    CR.Art.text(ctx, line[0], 30, CR.VIEW_H - 44, { font: CR.Art.FONT_UI, color: GOLD });
    var lines = CR.Art.wrap(ctx, line[1], CR.VIEW_W - 64, CR.Art.FONT_BODY);
    for (var i = 0; i < lines.length; i++) {
      CR.Art.text(ctx, lines[i], 30, CR.VIEW_H - 31 + i * 11, { font: CR.Art.FONT_BODY, color: CREAM });
    }
    CR.Art.text(ctx, 'SPACE', CR.VIEW_W - 30, CR.VIEW_H - 20,
      { align: 'right', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.5)' });
  };

  /* ---------- level card, shown for a moment at the start ---------- */
  UI.drawLevelCard = function (ctx, level, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(8,6,10,0.72)';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
    CR.Art.text(ctx, level.subtitle.toUpperCase(), CR.VIEW_W / 2, CR.VIEW_H / 2 - 16,
      { align: 'center', font: CR.Art.FONT_SMALL, color: GOLD });
    CR.Art.text(ctx, level.name, CR.VIEW_W / 2, CR.VIEW_H / 2 + 8,
      { align: 'center', font: CR.Art.FONT_SUB, color: CREAM });
    CR.Art.kolam(ctx, CR.VIEW_W / 2, CR.VIEW_H / 2 + 26, 10, 'rgba(232,200,135,0.45)');
    ctx.restore();
  };

  /* ---------- pause ---------- */
  UI.drawPause = function (ctx, game) {
    ctx.fillStyle = 'rgba(8,6,10,0.75)';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
    CR.Art.text(ctx, 'PAUSED', CR.VIEW_W / 2, 70, { align: 'center', font: CR.Art.FONT_SUB, color: GOLD });
    var rects = [];
    var y = 100;
    for (var i = 0; i < game.pauseMenu.items.length; i++) {
      rects.push(UI.menuItem(ctx, game.pauseMenu.items[i].label, y, game.pauseMenu.index === i));
      y += 26;
    }
    return rects;
  };

  /* ---------- death ---------- */
  UI.drawGameOver = function (ctx, game, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30,4,6,0.62)';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
    CR.Art.text(ctx, 'AYYO!', CR.VIEW_W / 2, CR.VIEW_H / 2 - 10,
      { align: 'center', font: CR.Art.FONT_SUB, color: '#ff9c8a' });
    CR.Art.text(ctx, game.deathMessage, CR.VIEW_W / 2, CR.VIEW_H / 2 + 10,
      { align: 'center', font: CR.Art.FONT_SMALL, color: CREAM });
    if (alpha > 0.85) {
      CR.Art.text(ctx, CR.Input.mode === 'touch' ? 'tap to try again' : 'SPACE to try again',
        CR.VIEW_W / 2, CR.VIEW_H / 2 + 32, { align: 'center', font: CR.Art.FONT_SMALL, color: 'rgba(246,236,210,0.7)' });
    }
    ctx.restore();
  };

  /* ---------- credits ---------- */
  UI.drawCredits = function (ctx, t) {
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
    var dim = 'rgba(246,236,210,0.6)';
    var lines = [
      ['CHOLA RAJA', CR.Art.FONT_SUB, GOLD],
      ['The Rescue of Kundavai', CR.Art.FONT_SMALL, CREAM],
      ['', null, null],
      ['Prince Rajaraja Chola', CR.Art.FONT_SMALL, CREAM],
      ['Princess Kundavai, his sister', CR.Art.FONT_SMALL, CREAM],
      ['King Parantaka Chola, their father', CR.Art.FONT_SMALL, CREAM],
      ['Vimal, who should have known better', CR.Art.FONT_SMALL, CREAM],
      ['', null, null],
      ['Every drawing here is made of maths.', CR.Art.FONT_SMALL, dim],
      ['So is every note of the music.', CR.Art.FONT_SMALL, dim],
      ['Nothing was downloaded to make it.', CR.Art.FONT_SMALL, dim],
      ['', null, null],
      ['Vimal is invented. The Cholas were not.', CR.Art.FONT_SMALL, 'rgba(246,236,210,0.45)'],
      ['', null, null],
      ['Created by Surya', CR.Art.FONT_SMALL, GOLD]
    ];
    var y = 26;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i][0]) {
        CR.Art.text(ctx, lines[i][0], CR.VIEW_W / 2, y, { align: 'center', font: lines[i][1], color: lines[i][2] });
      }
      y += 12.5;
    }
    CR.Art.kolam(ctx, CR.VIEW_W / 2, y + 8, 11, 'rgba(232,200,135,0.4)');
    CR.Art.text(ctx, 'SPACE to return to the title', CR.VIEW_W / 2, CR.VIEW_H - 8,
      { align: 'center', font: CR.Art.FONT_SMALL, color: GOLD });
  };

  /* ---------- on-screen controls for phones ---------- */
  UI.drawTouch = function (ctx) {
    if (CR.Input.mode !== 'touch') return;
    var L = CR.Input.layout;
    ctx.save();
    ctx.globalAlpha = 0.24;

    // the stick
    ctx.strokeStyle = CREAM; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(L.stick.x, L.stick.y, L.stick.r, 0, Math.PI * 2); ctx.stroke();
    var knobX = L.stick.x, knobY = L.stick.y;
    if (CR.Input._stick) {
      var dx = CR.clamp(CR.Input._stick.x - L.stick.x, -L.stick.r, L.stick.r);
      var dy = CR.clamp(CR.Input._stick.y - L.stick.y, -L.stick.r, L.stick.r);
      knobX += dx; knobY += dy;
      ctx.globalAlpha = 0.42;
    }
    ctx.fillStyle = CREAM;
    ctx.beginPath(); ctx.arc(knobX, knobY, 10, 0, Math.PI * 2); ctx.fill();

    // buttons
    function btn(c, label, held, size) {
      ctx.globalAlpha = held ? 0.55 : 0.24;
      ctx.fillStyle = held ? GOLD : 'rgba(246,236,210,0.22)';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = CREAM; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = held ? 0.95 : 0.7;
      CR.Art.text(ctx, label, c.x, c.y + 2.5, {
        align: 'center', font: size || CR.Art.FONT_SMALL, color: INK, shadow: false
      });
    }
    btn(L.jump, 'JUMP', CR.Input.jump);
    btn(L.attack, 'SWORD', CR.Input.attack);
    btn(L.grab, 'GRAB', CR.Input.grab);
    ctx.restore();
  };

  CR.UI = UI;
})();
