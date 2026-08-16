/* ============================================================
   input.js - keyboard, mouse and touch, boiled down to a handful
   of true/false flags the rest of the game can read.

   Keyboard:  Arrows / WASD move, Space jump, Shift run,
              Z (or J / Ctrl / F) attack, Esc or P pause, M mute.
   Touch:     joystick bottom-left, JUMP and SWORD buttons bottom-right.
   ============================================================ */
(function () {
  var I = {
    // held-down state, read freely every frame
    left: false, right: false, up: false, down: false,
    jump: false, run: false, attack: false,

    // "was it pressed THIS frame" - true for exactly one frame
    jumpPressed: false, attackPressed: false, upPressed: false,
    pausePressed: false, anyPressed: false, mutePressed: false,

    mode: 'key',            // 'key' or 'touch' - whichever was used last
    pointer: { x: 0, y: 0, down: false, clicked: false },
    touches: [],            // live touch points, in 480x270 game coordinates

    _prev: {}, _keys: {}, _canvas: null,
    _stick: null            // active joystick touch, if any
  };

  // Which physical keys map to which game action.
  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump',
    ShiftLeft: 'run', ShiftRight: 'run',
    KeyZ: 'attack', KeyJ: 'attack', ControlLeft: 'attack', KeyF: 'attack',
    Enter: 'confirm', NumpadEnter: 'confirm',
    Escape: 'pause', KeyP: 'pause',
    KeyM: 'mute'
  };

  /* Turn a real browser pixel position into a position inside our
     480x270 game picture, so a tap on a button lands where it looks. */
  I.toGame = function (clientX, clientY) {
    var d = CR.display;
    if (d && d.turned) {
      /* The picture is rotated a quarter turn, so a finger has to be
         rotated back the same amount before we can say where it landed.
         A quarter turn clockwise sends (u,v) to (-v,u), so going back
         from the screen: u = dy, v = -dx. */
      var dx = clientX - d.cx, dy = clientY - d.cy;
      return {
        x: (dy + d.cssW / 2) / d.cssW * CR.VIEW_W,
        y: (-dx + d.cssH / 2) / d.cssH * CR.VIEW_H
      };
    }
    var r = I._canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / r.width * CR.VIEW_W,
      y: (clientY - r.top) / r.height * CR.VIEW_H
    };
  };

  /* --- on-screen touch button layout (also used by ui.js to draw them) --- */
  /* Everything is tucked into the two bottom corners, well clear of the
     middle of the screen where the fighting happens. */
  I.layout = {
    stick:  { x: 44, y: CR.VIEW_H - 43, r: 28 },   // joystick home position + radius
    jump:   { x: CR.VIEW_W - 34, y: CR.VIEW_H - 29, r: 21 },
    attack: { x: CR.VIEW_W - 82, y: CR.VIEW_H - 47, r: 21 },
    run:    { x: CR.VIEW_W - 28, y: CR.VIEW_H - 77, r: 15 }
  };

  function inCircle(p, c, pad) {
    var dx = p.x - c.x, dy = p.y - c.y;
    return dx * dx + dy * dy <= (c.r + (pad || 10)) * (c.r + (pad || 10));
  }

  I.init = function (canvas) {
    I._canvas = canvas;

    /* ---------- keyboard ---------- */
    window.addEventListener('keydown', function (e) {
      var act = KEYMAP[e.code];
      // stop the page scrolling when arrows or space are used
      if (act || e.code === 'Space') e.preventDefault();
      if (!act) return;
      I.mode = 'key';
      I._keys[act] = true;
    });

    window.addEventListener('keyup', function (e) {
      var act = KEYMAP[e.code];
      if (act) I._keys[act] = false;
    });

    // if the player alt-tabs away, drop every key so we don't run forever
    window.addEventListener('blur', function () { I._keys = {}; I._stick = null; I.touches = []; });

    /* ---------- mouse (menus only) ---------- */
    canvas.addEventListener('mousemove', function (e) {
      var p = I.toGame(e.clientX, e.clientY);
      I.pointer.x = p.x; I.pointer.y = p.y;
    });
    canvas.addEventListener('mousedown', function (e) {
      var p = I.toGame(e.clientX, e.clientY);
      I.pointer.x = p.x; I.pointer.y = p.y;
      I.pointer.down = true; I.pointer.clicked = true;
      I.mode = 'key';
    });
    window.addEventListener('mouseup', function () { I.pointer.down = false; });

    /* ---------- touch ---------- */
    function readTouches(e) {
      I.mode = 'touch';
      I.touches = [];
      for (var i = 0; i < e.touches.length; i++) {
        var t = e.touches[i];
        var p = I.toGame(t.clientX, t.clientY);
        p.id = t.identifier;
        I.touches.push(p);
      }
    }

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      readTouches(e);
      // a fresh touch also counts as a menu click, wherever it landed
      if (I.touches.length) {
        I.pointer.x = I.touches[I.touches.length - 1].x;
        I.pointer.y = I.touches[I.touches.length - 1].y;
        I.pointer.clicked = true;
        I.pointer.down = true;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); readTouches(e); }, { passive: false });
    canvas.addEventListener('touchend', function (e) { e.preventDefault(); readTouches(e); I.pointer.down = I.touches.length > 0; }, { passive: false });
    canvas.addEventListener('touchcancel', function (e) { e.preventDefault(); readTouches(e); I.pointer.down = false; }, { passive: false });
  };

  /* Called once at the top of every frame: turns raw keys and touches
     into the tidy flags above, and works out what was newly pressed. */
  I.poll = function () {
    var prev = I._prev;
    var s = { left: false, right: false, up: false, down: false, jump: false, run: false, attack: false, pause: false, mute: false, confirm: false };

    // keyboard contribution
    for (var k in I._keys) if (I._keys[k]) s[k] = true;

    // touch contribution
    if (I.mode === 'touch') {
      var L = I.layout, stick = null;
      for (var i = 0; i < I.touches.length; i++) {
        var t = I.touches[i];
        if (t.x < CR.VIEW_W * 0.5) {
          // left half of the screen drives the joystick
          if (!stick) stick = t;
        } else if (inCircle(t, L.jump)) {
          s.jump = true;
        } else if (inCircle(t, L.attack)) {
          s.attack = true;
        } else if (inCircle(t, L.run)) {
          s.run = true;
        } else {
          // any other tap on the right half swings the sword
          s.attack = true;
        }
      }
      I._stick = stick;
      if (stick) {
        var dx = stick.x - L.stick.x, dy = stick.y - L.stick.y;
        var dead = 8;
        if (dx < -dead) s.left = true;
        if (dx > dead) s.right = true;
        if (dy < -dead * 1.4) { s.up = true; s.jump = true; }   // push up = jump
        if (dy > dead * 1.4) s.down = true;                     // pull down = crawl
        if (Math.abs(dx) > 22) s.run = true;                    // push far = run
      }
    }

    I.left = s.left; I.right = s.right; I.up = s.up; I.down = s.down;
    I.jump = s.jump; I.run = s.run; I.attack = s.attack;

    I.jumpPressed   = s.jump    && !prev.jump;
    I.attackPressed = s.attack  && !prev.attack;
    I.upPressed     = s.up      && !prev.up;
    I.pausePressed  = s.pause   && !prev.pause;
    I.mutePressed   = s.mute    && !prev.mute;
    I.confirmPressed = (s.confirm && !prev.confirm) || (s.jump && !prev.jump);
    I.anyPressed = I.confirmPressed || I.attackPressed || I.pointer.clicked;

    I._prev = s;
  };

  // Called at the END of a frame - clears one-shot flags like clicks.
  I.endFrame = function () { I.pointer.clicked = false; };

  // True when the device is a touch device (used to pick default controls).
  I.isTouchDevice = function () {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  };

  CR.Input = I;
})();
