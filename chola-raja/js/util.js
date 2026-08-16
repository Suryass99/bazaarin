/* ============================================================
   util.js - small helpers every other file uses.
   CR is our single global object ("Chola Raja"). Every file hangs
   its stuff off CR so we never pollute the page with 50 globals.
   ============================================================ */
window.CR = window.CR || {};

CR.VIEW_W = 400;   // the game is drawn in a 400x225 box and then scaled up.
CR.VIEW_H = 225;   // small numbers = old-school chunky look + fast on phones.

/* --- numbers ------------------------------------------------ */

// keep a number inside a range: clamp(5, 0, 3) -> 3
CR.clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };

// blend from a to b. t=0 gives a, t=1 gives b, 0.5 gives halfway.
CR.lerp = function (a, b, t) { return a + (b - a) * t; };

// move "a" towards "b" but never by more than "step" (no overshooting).
CR.approach = function (a, b, step) {
  if (a < b) return Math.min(a + step, b);
  return Math.max(a - step, b);
};

CR.sign = function (v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); };

/* A seeded random number generator.
   Normal Math.random() gives different results every reload, which would make
   the scenery jump around. Seeding it means "random but always the same". */
CR.rng = function (seed) {
  var s = seed >>> 0 || 1;
  return function () {
    // xorshift32 - a classic tiny random generator
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
};

/* --- rectangles ---------------------------------------------
   Everything solid in this game is a rectangle: {x, y, w, h}.
   x,y is the TOP-LEFT corner. y grows downwards (screen style). */

CR.rect = function (x, y, w, h) { return { x: x, y: y, w: w, h: h }; };

// do two rectangles overlap at all?
CR.overlap = function (a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
};

// is a point inside a rectangle?
CR.pointIn = function (px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
};

// straight-line distance between two points
CR.dist = function (ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
};

/* --- timing -------------------------------------------------
   A Timer counts down in seconds. Handy for "invulnerable for 1.2s",
   "attack lasts 0.14s" and so on. */
CR.Timer = function () {
  return {
    t: 0,
    set: function (secs) { this.t = secs; },
    tick: function (dt) { if (this.t > 0) { this.t -= dt; if (this.t < 0) this.t = 0; } },
    get active() { return this.t > 0; }
  };
};

/* --- saving -------------------------------------------------
   The save file is one small blob in the browser's localStorage.
   No server, no account, nothing leaves the device. */
CR.SAVE_KEY = 'cholaraja.save.v1';

CR.loadSave = function () {
  try {
    var raw = localStorage.getItem(CR.SAVE_KEY);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (typeof s.level !== 'number') return null;
    return s;
  } catch (e) { return null; }
};

CR.writeSave = function (data) {
  try { localStorage.setItem(CR.SAVE_KEY, JSON.stringify(data)); } catch (e) {}
};

CR.clearSave = function () {
  try { localStorage.removeItem(CR.SAVE_KEY); } catch (e) {}
};

/* --- settings (mute, control scheme) ------------------------ */
CR.SETTINGS_KEY = 'cholaraja.settings.v1';

CR.loadSettings = function () {
  try {
    var s = JSON.parse(localStorage.getItem(CR.SETTINGS_KEY) || '{}');
    return { muted: !!s.muted, scheme: s.scheme || 'auto' };
  } catch (e) { return { muted: false, scheme: 'auto' }; }
};

CR.writeSettings = function (s) {
  try { localStorage.setItem(CR.SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
};
