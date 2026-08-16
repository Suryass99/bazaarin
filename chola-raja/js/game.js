/* ============================================================
   game.js - the conductor.

   It owns the canvas, the main loop, and the "what screen are we on"
   question: title, comic, playing, paused, dead, finished.
   ============================================================ */
(function () {

  var canvas = document.getElementById('screen');
  var ctx = canvas.getContext('2d');

  var game = {
    state: 'title',           // title | controls | intro | card | play | dialogue | paused | dead | clear | ending | credits
    t: 0,
    levelIndex: 0,
    level: null,
    player: null,
    enemies: [],
    boss: null,
    deaths: {},
    assist: false,
    assistNoFallDeath: false,
    muted: false,
    checkpoint: null,
    fade: 0,
    quality: 2
  };

  /* ---------- fitting the game to the screen ----------
     The game is designed in a 480x270 box. We draw it into a canvas
     that is a whole number of times bigger, so it stays crisp on a
     laptop and still fits a phone held sideways. */
  function resize() {
    var winW = window.innerWidth, winH = window.innerHeight;
    var scale = Math.min(winW / CR.VIEW_W, winH / CR.VIEW_H);
    var cssW = Math.floor(CR.VIEW_W * scale);
    var cssH = Math.floor(CR.VIEW_H * scale);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var q = CR.clamp(Math.ceil(scale * dpr), 1, 3);
    game.quality = q;

    canvas.width = CR.VIEW_W * q;
    canvas.height = CR.VIEW_H * q;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.imageSmoothingEnabled = true;

    // a phone held upright cannot show a landscape game
    var portrait = winH > winW && Math.min(winW, winH) < 560;
    document.body.classList.toggle('portrait', portrait);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });

  /* ---------- menus ---------- */
  function buildTitleMenu() {
    var save = CR.loadSave();
    var items = [{ label: 'START A NEW GAME', action: 'new' }];
    if (save && save.level > 0) {
      items.push({ label: 'CONTINUE', action: 'continue', hint: 'level ' + (save.level + 1) });
    }
    items.push({ label: 'HOW TO PLAY', action: 'controls' });
    items.push({ label: game.muted ? 'SOUND: OFF' : 'SOUND: ON', action: 'sound' });
    game.menu = { items: items, index: 0, rects: [] };
  }

  game.pauseMenu = {
    index: 0,
    items: [
      { label: 'RESUME', action: 'resume' },
      { label: 'RESTART THIS LEVEL', action: 'restart' },
      { label: 'SOUND ON / OFF', action: 'sound' },
      { label: 'QUIT TO TITLE', action: 'quit' }
    ]
  };

  /* ---------- messages on screen ---------- */
  game.banner = function (text) { game.bannerText = text; game.bannerT = 3.2; };
  game.showSign = function (text) { game.signText = text; game.signT = 4.4; };

  /* ---------- starting and loading ---------- */
  game.startLevel = function (index, fromCheckpoint) {
    game.levelIndex = index;
    var def = CR.LEVELS[index];
    game.level = def;

    CR.World.reset(def);

    var spawn = fromCheckpoint && game.checkpoint ? game.checkpoint : def.spawn;
    game.player = new CR.Player(spawn[0], spawn[1] - 28);
    game.player.maxHearts = def.hearts;
    game.player.hearts = def.hearts;
    game.player.weapon = def.startWeapon;
    if (!fromCheckpoint) game.checkpoint = def.spawn.slice();
    game.player.invuln = 1.0;      // a breath of safety on landing, so you never respawn onto a spike

    // the guards
    game.enemies = [];
    for (var i = 0; i < (def.enemies || []).length; i++) {
      var e = def.enemies[i];
      game.enemies.push(new CR.Enemy(e[0], e[1], e[2], { patrol: e[3] || 0, dropsSword: e[4] || false }));
    }
    game.boss = null;
    if (def.boss) {
      game.boss = new CR.Enemy(def.boss[0], def.boss[1], 'boss', {});
      game.boss.state = 'idle';
      game.boss.asleep = true;      // he only wakes when you reach him
    }

    game.dialogues = (def.dialogue || []).map(function (d) { return { x: d[0], lines: d[1], done: false }; });
    game.activeDialogue = null;
    game.dialogueIndex = 0;
    game.dialogueT = 0;

    // difficulty assist: if this level has already beaten you a few times,
    // the guards get a little slower and you get an extra heart
    var d = game.deaths[def.id] || 0;
    game.assist = d >= 3;
    if (game.assist) {
      game.player.maxHearts = def.hearts + 1;
      game.player.hearts = def.hearts + 1;
    }

    CR.World.updateCamera(0, game.player, true);
    CR.Audio.playMusic(def.music);

    game.state = 'card';
    game.cardT = 2.2;
    game.bannerT = 0; game.signT = 0;
    game.fade = 1;

    CR.writeSave({ level: index, deaths: game.deaths });
  };

  game.onPlayerDied = function (cause) {
    var id = game.level.id;
    game.deaths[id] = (game.deaths[id] || 0) + 1;
    game.deathMessage =
      cause === 'fall' ? 'That was a long way down.' :
      cause === 'spike' ? 'The spikes do not miss.' :
      cause === 'pit' ? 'Gone into the dark.' :
      'The Pandya guard was faster.';
    game.state = 'dead';
    game.deadT = 0;
    CR.writeSave({ level: game.levelIndex, deaths: game.deaths });
  };

  game.onEnemyKilled = function (enemy) {
    if (enemy === game.boss) {
      CR.Audio.playMusic('victory');
      game.banner('VIMAL IS DOWN — free your sister');
      if (CR.World.cage) CR.World.cage.open = false;   // still locked, you must open it
    }
  };

  game.respawn = function () {
    var def = game.level;
    var d = game.deaths[def.id] || 0;
    game.assist = d >= 3;
    game.startLevel(game.levelIndex, true);
    if (game.assist) game.banner('The path softens a little. Take your time.');
  };

  game.nextLevel = function () {
    if (game.levelIndex + 1 < CR.LEVELS.length) {
      game.checkpoint = null;
      game.startLevel(game.levelIndex + 1, false);
    } else {
      game.state = 'ending';
      game.pageIndex = 0;
      game.pageT = 0;
      CR.Audio.playMusic('victory');
    }
  };

  /* ---------- the per-frame update ---------- */
  function update(dt) {
    game.t += dt;
    CR.Audio.update();

    if (game.bannerT > 0) game.bannerT -= dt;
    if (game.signT > 0) game.signT -= dt;
    if (game.fade > 0) game.fade = Math.max(0, game.fade - dt * 1.6);

    var In = CR.Input;

    if (In.mutePressed) toggleSound();

    switch (game.state) {
      case 'title':      updateTitle(dt); break;
      case 'controls':   if (In.confirmPressed || In.pointer.clicked) { game.state = 'title'; } break;
      case 'intro':      updatePages(dt, CR.Story.INTRO, function () { game.startLevel(0, false); }); break;
      case 'ending':     updatePages(dt, CR.Story.ENDING, function () { game.state = 'credits'; }); break;
      case 'credits':    if (In.confirmPressed || In.pointer.clicked) { CR.clearSave(); buildTitleMenu(); game.state = 'title'; CR.Audio.playMusic('menu'); } break;
      case 'card':
        game.cardT -= dt;
        updatePlay(dt, true);
        if (game.cardT <= 0) game.state = 'play';
        break;
      case 'play':       updatePlay(dt, false); break;
      case 'dialogue':   updateDialogue(dt); break;
      case 'paused':     updatePause(dt); break;
      case 'dead':
        game.deadT += dt;
        updatePlay(dt, true);
        if (game.deadT > 1.3 && (In.confirmPressed || In.pointer.clicked)) game.respawn();
        break;
      case 'clear':
        game.clearT -= dt;
        updatePlay(dt, true);
        if (game.clearT <= 0) game.nextLevel();
        break;
    }
  }

  function toggleSound() {
    game.muted = !game.muted;
    CR.Audio.setMuted(game.muted);
    var s = CR.loadSettings();
    s.muted = game.muted;
    CR.writeSettings(s);
    if (game.state === 'title') buildTitleMenu();
  }

  function updateTitle(dt) {
    var In = CR.Input, m = game.menu;

    if (In.upPressed) { m.index = (m.index + m.items.length - 1) % m.items.length; CR.Audio.sfx.menu(); }
    if (In.down && !game._downHeld) { m.index = (m.index + 1) % m.items.length; CR.Audio.sfx.menu(); }
    game._downHeld = In.down;

    var chosen = -1;
    if (In.confirmPressed) chosen = m.index;

    // tapping or clicking a row picks it directly
    if (In.pointer.clicked && m.rects) {
      for (var i = 0; i < m.rects.length; i++) {
        if (CR.pointIn(In.pointer.x, In.pointer.y, m.rects[i])) { chosen = i; m.index = i; }
      }
    }

    if (chosen >= 0) {
      CR.Audio.start();
      CR.Audio.setMuted(game.muted);
      var act = m.items[chosen].action;
      CR.Audio.sfx.menu();
      if (act === 'new') {
        CR.clearSave();
        game.deaths = {};
        game.checkpoint = null;
        game.state = 'intro';
        game.pageIndex = 0; game.pageT = 0;
        CR.Audio.playMusic('intro');
      } else if (act === 'continue') {
        var save = CR.loadSave();
        game.deaths = save.deaths || {};
        game.checkpoint = null;
        game.startLevel(CR.clamp(save.level, 0, CR.LEVELS.length - 1), false);
      } else if (act === 'controls') {
        game.state = 'controls';
      } else if (act === 'sound') {
        toggleSound();
      }
    }
  }

  // used by both the opening comic and the ending comic
  function updatePages(dt, pages, done) {
    game.pageT += dt;
    var In = CR.Input;
    if (game.pageT > 10 || In.confirmPressed || In.attackPressed || In.pointer.clicked) {
      game.pageIndex++;
      game.pageT = 0;
      CR.Audio.sfx.page();
      if (game.pageIndex >= pages.length) done();
    }
  }

  function updatePause(dt) {
    var In = CR.Input, m = game.pauseMenu;
    if (In.upPressed) { m.index = (m.index + m.items.length - 1) % m.items.length; CR.Audio.sfx.menu(); }
    if (In.down && !game._downHeld) { m.index = (m.index + 1) % m.items.length; CR.Audio.sfx.menu(); }
    game._downHeld = In.down;

    var chosen = -1;
    if (In.confirmPressed) chosen = m.index;
    if (In.pointer.clicked && game.pauseRects) {
      for (var i = 0; i < game.pauseRects.length; i++) {
        if (CR.pointIn(In.pointer.x, In.pointer.y, game.pauseRects[i])) { chosen = i; m.index = i; }
      }
    }
    if (In.pausePressed) { game.state = 'play'; return; }

    if (chosen >= 0) {
      var act = m.items[chosen].action;
      CR.Audio.sfx.menu();
      if (act === 'resume') game.state = 'play';
      else if (act === 'restart') { game.checkpoint = null; game.startLevel(game.levelIndex, false); }
      else if (act === 'sound') toggleSound();
      else if (act === 'quit') { buildTitleMenu(); game.state = 'title'; CR.Audio.playMusic('menu'); }
    }
  }

  function updateDialogue(dt) {
    game.dialogueT += dt;
    var In = CR.Input;
    if (game.dialogueT > 0.4 && (In.confirmPressed || In.attackPressed || In.pointer.clicked || game.dialogueT > 4.2)) {
      game.dialogueIndex++;
      game.dialogueT = 0;
      if (game.dialogueIndex >= game.activeDialogue.lines.length) {
        game.activeDialogue = null;
        game.state = 'play';
        if (game.boss) {
          game.boss.asleep = false;
          game.boss.say('VIMAL', 1.2);
          CR.Audio.sfx.roar();
          CR.Audio.playMusic(game.level.bossMusic || 'boss');
        }
      }
    }
    // keep the world breathing behind the text box
    CR.World.update(dt, game.player);
    CR.World.updateCamera(dt, game.player);
  }

  /* ---------- the actual game ---------- */
  function updatePlay(dt, frozen) {
    var In = CR.Input;
    var p = game.player;

    if (!frozen && In.pausePressed) {
      game.state = 'paused';
      game.pauseMenu.index = 0;
      return;
    }

    if (!frozen) p.update(dt, game);
    CR.World.update(dt, p);

    // --- guards ---
    var slots = { taken: 0, max: 3 };
    for (var i = 0; i < game.enemies.length; i++) {
      if (game.enemies[i].engaged && game.enemies[i].state !== 'dead') slots.taken++;
    }
    for (i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (!frozen) e.update(dt, game, p, slots);
      // your blade
      if (!frozen) hitCheck(p, e);
    }
    if (game.boss && !game.boss.asleep) {
      if (!frozen) game.boss.update(dt, game, p, { taken: 0, max: 9 });
      if (!frozen) hitCheck(p, game.boss);
    }

    if (!frozen) {
      breakBarrels(p);
      checkSigns(p);
      checkDialogue(p);
      checkCheckpoints(p);
      checkInteractions(p);
    }

    CR.World.updateCamera(dt, p, false);
  }

  function hitCheck(p, e) {
    if (e.state === 'dead') return;
    var ab = p.attackBox();
    if (!ab || p.attackHit) return;
    if (CR.overlap(ab, e.box())) {
      p.attackHit = true;
      // a guard who is already swinging parries nothing - but one you catch
      // mid wind-up gets the full hit
      e.takeHit(p.damage(), p.centerX(), game);
      CR.Audio.sfx.clang();
    }
  }

  function breakBarrels(p) {
    var ab = p.attackBox();
    for (var i = 0; i < CR.World.barrels.length; i++) {
      var b = CR.World.barrels[i];
      if (b.broken) continue;
      var br = CR.rect(b.x, b.y, 14, 18);
      var smashed = (ab && CR.overlap(ab, br));
      // landing on top of one also does the job
      if (!smashed && p.vy > 180 && CR.overlap(CR.rect(p.x, p.y + p.h - 2, p.w, 6), br)) smashed = true;
      if (smashed) {
        b.broken = 1;
        CR.Audio.sfx.barrel();
        CR.World.puff(b.x + 7, b.y + 8, 12, '#7a5230', 130);
        p.attackHit = true;
      }
    }
  }

  function checkSigns(p) {
    for (var i = 0; i < CR.World.signs.length; i++) {
      var s = CR.World.signs[i];
      if (s.shown) continue;
      if (Math.abs(p.centerX() - s.x) < 46) { s.shown = true; game.showSign(s.text); }
    }
  }

  function checkDialogue(p) {
    for (var i = 0; i < game.dialogues.length; i++) {
      var d = game.dialogues[i];
      if (d.done) continue;
      if (p.centerX() > d.x) {
        d.done = true;
        game.activeDialogue = d;
        game.dialogueIndex = 0;
        game.dialogueT = 0;
        game.state = 'dialogue';
        return;
      }
    }
  }

  function checkCheckpoints(p) {
    for (var i = 0; i < CR.World.checkpoints.length; i++) {
      var c = CR.World.checkpoints[i];
      if (p.centerX() > c[0] && (!game.checkpoint || c[0] > game.checkpoint[0])) {
        game.checkpoint = [c[0], c[1]];
      }
    }
  }

  /* Pressing UP: pull a lever, open the door, unlock the cage. */
  function checkInteractions(p) {
    var W = CR.World;
    var i;

    for (i = 0; i < W.levers.length; i++) {
      var lv = W.levers[i];
      if (Math.abs(p.centerX() - lv.x) < 14 && Math.abs(p.centerY() - lv.y) < 24) {
        if (CR.Input.upPressed) {
          var g = W.gates[lv.gate];
          if (g) { g.timer = lv.secs; CR.Audio.sfx.lever(); CR.Audio.sfx.gate(); game.banner('The gate is up. GO.'); }
        }
      }
    }

    if (W.exit) {
      W.exit.open = true;
      if (Math.abs(p.centerX() - (W.exit.x + 11)) < 16 && Math.abs((p.y + p.h) - W.exit.y) < 22) {
        if (CR.Input.upPressed) {
          game.state = 'clear';
          game.clearT = 1.8;
          game.checkpoint = null;
          CR.Audio.sfx.gate();
          CR.writeSave({ level: Math.min(game.levelIndex + 1, CR.LEVELS.length - 1), deaths: game.deaths });
        }
      }
    }

    if (W.cage && game.boss && game.boss.state === 'dead' && !W.cage.open) {
      if (Math.abs(p.centerX() - (W.cage.x + 16)) < 22 && Math.abs((p.y + p.h) - W.cage.y) < 26) {
        if (CR.Input.upPressed) {
          W.cage.open = true;
          CR.Audio.sfx.pickup();
          CR.Audio.sfx.cheer();
          game.banner('KUNDAVAI IS FREE');
          game.state = 'clear';
          game.clearT = 2.6;
        }
      }
    }

    // the boss wakes up if you walk into his hall without the conversation
    if (game.boss && game.boss.asleep && p.centerX() > game.boss.centerX() - 150) {
      game.boss.asleep = false;
      CR.Audio.playMusic(game.level.bossMusic || 'boss');
    }
  }

  /* ---------- drawing ---------- */
  function draw() {
    ctx.clearRect(0, 0, CR.VIEW_W, CR.VIEW_H);

    if (game.state === 'title') {
      game.menu.rects = CR.UI.drawTitle(ctx, game, game.t);
      drawFade();
      return;
    }
    if (game.state === 'controls') { CR.UI.drawControls(ctx, game); return; }
    if (game.state === 'intro') {
      CR.Story.drawPage(ctx, CR.Story.INTRO[Math.min(game.pageIndex, CR.Story.INTRO.length - 1)], game.t, CR.clamp(game.pageT / 10, 0, 1));
      return;
    }
    if (game.state === 'ending') {
      CR.Story.drawPage(ctx, CR.Story.ENDING[Math.min(game.pageIndex, CR.Story.ENDING.length - 1)], game.t, CR.clamp(game.pageT / 10, 0, 1));
      return;
    }
    if (game.state === 'credits') { CR.UI.drawCredits(ctx, game.t); return; }

    // --- the world ---
    var cam = CR.World.camOffset();
    CR.World.drawBack(ctx, cam);
    CR.World.drawTerrain(ctx, cam);
    CR.World.drawProps(ctx, cam, game.t);

    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e.x + 40 < cam.x || e.x - 40 > cam.x + CR.VIEW_W) continue;
      e.draw(ctx, cam);
    }
    if (game.boss) game.boss.draw(ctx, cam);
    game.player.draw(ctx, cam);

    CR.World.drawAtmosphere(ctx, cam);

    // --- the layer on top ---
    CR.UI.drawHUD(ctx, game);
    CR.UI.drawTouch(ctx);

    if (game.signT > 0) CR.UI.drawSign(ctx, game.signText, CR.clamp(game.signT, 0, 1));
    if (game.bannerT > 0) CR.UI.drawBanner(ctx, game.bannerText, CR.clamp(game.bannerT, 0, 1));

    if (game.state === 'card') CR.UI.drawLevelCard(ctx, game.level, CR.clamp(game.cardT / 1.2, 0, 1));
    if (game.state === 'dialogue' && game.activeDialogue) {
      CR.UI.drawDialogue(ctx, game.activeDialogue.lines[Math.min(game.dialogueIndex, game.activeDialogue.lines.length - 1)]);
    }
    if (game.state === 'dead') CR.UI.drawGameOver(ctx, game, CR.clamp(game.deadT, 0, 1));
    if (game.state === 'paused') game.pauseRects = CR.UI.drawPause(ctx, game);
    if (game.state === 'clear') {
      ctx.fillStyle = 'rgba(6,5,10,' + CR.clamp(1 - game.clearT / 1.8, 0, 1) * 0.9 + ')';
      ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
      CR.Art.text(ctx, 'LEVEL CLEAR', CR.VIEW_W / 2, CR.VIEW_H / 2,
        { align: 'center', font: CR.Art.FONT_SUB, color: '#ffe9a8' });
    }
    drawFade();
  }

  function drawFade() {
    if (game.fade <= 0) return;
    ctx.fillStyle = 'rgba(0,0,0,' + game.fade + ')';
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
  }

  /* ---------- the loop ---------- */
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;      // after a stall, take one small step, not one huge one

    CR.Input.poll();
    update(dt);
    draw();
    CR.Input.endFrame();
  }

  /* ---------- boot ---------- */
  function boot() {
    var settings = CR.loadSettings();
    game.muted = settings.muted;

    CR.Input.init(canvas);
    resize();

    game.titleBackdrop = CR.Art.buildBackdrop('grove', 4242);
    buildTitleMenu();
    game.deathMessage = '';
    game.bannerText = ''; game.bannerT = 0;
    game.signText = ''; game.signT = 0;

    // the first click or key press is what lets the browser make sound
    function wake() {
      CR.Audio.start();
      CR.Audio.setMuted(game.muted);
      CR.Audio.playMusic('menu');
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    }
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);

    requestAnimationFrame(frame);
  }

  /* One frame, on demand. Only used while testing the game from the
     outside - the real game is driven by requestAnimationFrame above. */
  game.step = function (dt) {
    CR.Input.poll();
    update(dt || 1 / 60);
    draw();
    CR.Input.endFrame();
  };

  CR.game = game;
  boot();
})();
