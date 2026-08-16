/* ============================================================
   world.js - the level made real: solid ground, moving traps,
   the camera, and everything that is painted behind the actors.

   A level is just lists of rectangles and props (see levels.js).
   This file turns those lists into something you can stand on.
   ============================================================ */
(function () {
  var World = {};

  World.solids = [];
  World.oneway = [];
  World.bucket = {};       // solids sorted into columns, so collision stays fast
  var BUCKET = 128;

  World.reset = function (def) {
    World.def = def;
    World.w = def.w;
    World.h = def.h;
    World.solids = [];
    World.oneway = [];
    World.bucket = {};
    World.time = 0;

    var i;
    for (i = 0; i < (def.solids || []).length; i++) {
      var s = def.solids[i];
      World.addSolid(CR.rect(s[0], s[1], s[2], s[3]), s[4] || 'earth');
    }
    for (i = 0; i < (def.oneway || []).length; i++) {
      var o = def.oneway[i];
      World.oneway.push(CR.rect(o[0], o[1], o[2], 4));
    }

    /* ---- hazards and props ---- */
    World.spikes = [];
    for (i = 0; i < (def.spikes || []).length; i++) {
      var sp = def.spikes[i];
      World.spikes.push({ x: sp[0], y: sp[1], w: sp[2] });
    }

    // Retracting spike traps: they pop out of the floor on a timer, exactly
    // like the ones you have to sprint between in Prince of Persia.
    World.traps = [];
    for (i = 0; i < (def.traps || []).length; i++) {
      var tr = def.traps[i];
      World.traps.push({ x: tr[0], y: tr[1], period: tr[2] || 2.2, phase: tr[3] || 0, out: 0 });
    }

    World.barrels = [];
    for (i = 0; i < (def.barrels || []).length; i++) {
      World.barrels.push({ x: def.barrels[i][0], y: def.barrels[i][1], hp: 1, broken: 0, bits: null });
    }

    World.ropes = [];
    for (i = 0; i < (def.ropes || []).length; i++) {
      var rp = def.ropes[i];
      World.ropes.push({ x: rp[0], y: rp[1], len: rp[2] || 42, a: 0.5, va: 0, rider: null });
    }

    World.gates = [];
    for (i = 0; i < (def.gates || []).length; i++) {
      var gt = def.gates[i];
      World.gates.push({ x: gt[0], y: gt[1], h: gt[2], open: 0, timer: 0 });
    }

    World.levers = [];
    for (i = 0; i < (def.levers || []).length; i++) {
      var lv = def.levers[i];
      World.levers.push({ x: lv[0], y: lv[1], gate: lv[2], secs: lv[3] || 7, pulled: 0 });
    }

    World.pickups = [];
    for (i = 0; i < (def.pickups || []).length; i++) {
      var pk = def.pickups[i];
      World.pickups.push({ x: pk[0], y: pk[1], kind: pk[2], taken: false, bob: Math.random() * 6 });
    }

    World.torches = (def.torches || []).slice();
    World.decor = (def.decor || []).slice();
    World.signs = (def.signs || []).map(function (s) { return { x: s[0], text: s[1], shown: false }; });
    World.checkpoints = (def.checkpoints || []).slice();
    World.exit = def.exit ? { x: def.exit[0], y: def.exit[1], open: false } : null;
    World.cage = def.cage ? { x: def.cage[0], y: def.cage[1], open: false } : null;

    World.backdrop = CR.Art.buildBackdrop(def.palette, def.id * 977 + 13);
    World.palette = CR.Art.PALETTES[def.palette];

    World.camera = { x: 0, y: 0, shake: 0 };
    World.particles = [];
  };

  World.addSolid = function (r, kind) {
    r.kind = kind || 'earth';
    World.solids.push(r);
    var b0 = Math.floor(r.x / BUCKET), b1 = Math.floor((r.x + r.w) / BUCKET);
    for (var b = b0; b <= b1; b++) {
      (World.bucket[b] = World.bucket[b] || []).push(r);
    }
  };

  // Every solid rectangle that could possibly touch this area.
  World.nearby = function (r) {
    var out = [], seen = {};
    var b0 = Math.floor((r.x - 2) / BUCKET), b1 = Math.floor((r.x + r.w + 2) / BUCKET);
    for (var b = b0; b <= b1; b++) {
      var list = World.bucket[b];
      if (!list) continue;
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        if (seen[s.x + ':' + s.y + ':' + s.w]) continue;
        seen[s.x + ':' + s.y + ':' + s.w] = 1;
        out.push(s);
      }
    }
    return out;
  };

  World.solidOverlap = function (r) {
    var list = World.nearby(r);
    for (var i = 0; i < list.length; i++) if (CR.overlap(r, list[i])) return list[i];
    return null;
  };

  // Closed gates count as walls too.
  World.gateBlocking = function (r) {
    for (var i = 0; i < World.gates.length; i++) {
      var g = World.gates[i];
      if (g.open >= 0.98) continue;
      var gr = CR.rect(g.x, g.y + g.h * g.open, 8, g.h * (1 - g.open));
      if (CR.overlap(r, gr)) return gr;
    }
    return null;
  };

  World.blocked = function (r) {
    return World.solidOverlap(r) || World.gateBlocking(r);
  };

  /* Move a box through the world, stopping when it hits something.
     We move in small steps so nothing can tunnel through a thin wall
     at high speed, and we handle x and y separately so sliding along
     a floor or wall feels natural. */
  World.moveBox = function (box, dx, dy, opts) {
    opts = opts || {};
    var res = { hitX: false, hitY: false, onGround: false, ceiling: false };
    var steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 5));
    var sx = dx / steps, sy = dy / steps;

    for (var s = 0; s < steps; s++) {
      // --- horizontal ---
      if (sx !== 0) {
        box.x += sx;
        var hit = World.blocked(box);
        if (hit) {
          box.x = sx > 0 ? hit.x - box.w - 0.001 : hit.x + hit.w + 0.001;
          res.hitX = true;
          sx = 0;
        }
      }
      // --- vertical ---
      if (sy !== 0) {
        var prevBottom = box.y + box.h;
        box.y += sy;
        var hitY = World.blocked(box);
        if (!hitY && sy > 0 && !opts.ignoreOneway) {
          // one-way platforms: only solid when you are landing on top of them
          for (var i = 0; i < World.oneway.length; i++) {
            var p = World.oneway[i];
            if (CR.overlap(box, p) && prevBottom <= p.y + 1.5) { hitY = p; break; }
          }
        }
        if (hitY) {
          if (sy > 0) { box.y = hitY.y - box.h - 0.001; res.onGround = true; }
          else { box.y = hitY.y + hitY.h + 0.001; res.ceiling = true; }
          res.hitY = true;
          sy = 0;
        }
      }
      if (sx === 0 && sy === 0) break;
    }
    return res;
  };

  // Is there ground directly under this box?
  World.groundBelow = function (box, reach) {
    var probe = CR.rect(box.x + 1, box.y + box.h, box.w - 2, reach || 2);
    if (World.blocked(probe)) return true;
    for (var i = 0; i < World.oneway.length; i++) {
      var p = World.oneway[i];
      if (CR.overlap(probe, p) && box.y + box.h <= p.y + 2) return true;
    }
    return false;
  };

  /* ---------- update ---------- */
  World.update = function (dt, player) {
    World.time += dt;

    // spike traps breathe in and out
    for (var i = 0; i < World.traps.length; i++) {
      var tr = World.traps[i];
      var ph = ((World.time + tr.phase) % tr.period) / tr.period;
      // out for the first 40% of the cycle, with a fast snap up
      var target = ph < 0.36 ? 1 : 0;
      var wasOut = tr.out;
      tr.out = CR.approach(tr.out, target, dt * (target ? 9 : 3.5));
      if (wasOut < 0.5 && tr.out >= 0.5) CR.Audio.sfx.spike();
    }

    // gates slide back down when their timer runs out
    for (i = 0; i < World.gates.length; i++) {
      var g = World.gates[i];
      if (g.timer > 0) {
        g.timer -= dt;
        g.open = CR.approach(g.open, 1, dt * 1.6);
      } else {
        g.open = CR.approach(g.open, 0, dt * 1.2);
      }
    }

    // levers reset with their gate
    for (i = 0; i < World.levers.length; i++) {
      var lv = World.levers[i];
      var gg = World.gates[lv.gate];
      lv.pulled = gg && gg.timer > 0 ? 1 : 0;
    }

    // ropes swing like a pendulum
    for (i = 0; i < World.ropes.length; i++) {
      var rp = World.ropes[i];
      if (rp.rider) continue;                 // the player drives it while holding on
      rp.va += -Math.sin(rp.a) * 5.2 * dt;
      rp.va *= 0.995;
      rp.a += rp.va * dt;
    }

    // barrel debris
    for (i = World.particles.length - 1; i >= 0; i--) {
      var p = World.particles[i];
      p.vy += 460 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      p.rot += p.vr * dt;
      if (p.life <= 0) World.particles.splice(i, 1);
    }

    if (World.camera.shake > 0) World.camera.shake = Math.max(0, World.camera.shake - dt * 3);
  };

  World.puff = function (x, y, n, col, spread) {
    for (var i = 0; i < n; i++) {
      World.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * (spread || 90),
        vy: -Math.random() * 110 - 20,
        life: 0.4 + Math.random() * 0.5,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
        size: 1 + Math.random() * 2.4,
        col: col || '#8a6a3a'
      });
    }
  };

  /* ---------- camera ----------
     Old Prince of Persia keeps you a little back from the middle so you can
     see what is coming. We do the same: the camera aims ahead of the way
     you are facing, and eases towards that spot instead of snapping. */
  World.updateCamera = function (dt, player, snap) {
    var cam = World.camera;
    var targetX = player.x + player.w / 2 + player.facing * 40 - CR.VIEW_W / 2;
    var targetY = (player.y + player.h) - CR.VIEW_H * 0.74;

    targetX = CR.clamp(targetX, 0, Math.max(0, World.w - CR.VIEW_W));
    targetY = CR.clamp(targetY, 0, Math.max(0, World.h - CR.VIEW_H));

    if (snap) { cam.x = targetX; cam.y = targetY; return; }
    cam.x = CR.lerp(cam.x, targetX, Math.min(1, dt * 3.2));
    cam.y = CR.lerp(cam.y, targetY, Math.min(1, dt * 4.5));
  };

  World.camOffset = function () {
    var cam = World.camera;
    var sx = 0, sy = 0;
    if (cam.shake > 0) {
      sx = (Math.random() - 0.5) * cam.shake * 5;
      sy = (Math.random() - 0.5) * cam.shake * 5;
    }
    return { x: Math.round(cam.x + sx), y: Math.round(cam.y + sy) };
  };

  /* ============================================================
     DRAWING THE WORLD
     ============================================================ */

  World.drawBack = function (ctx, cam) {
    CR.Art.drawBackdrop(ctx, World.backdrop, cam.x, cam.y);
  };

  function visible(cam, x, w) {
    return x + w > cam.x - 20 && x < cam.x + CR.VIEW_W + 20;
  }

  World.drawTerrain = function (ctx, cam) {
    var P = World.palette;
    var i;

    // --- decor that sits behind the ground: statues, inscriptions ---
    for (i = 0; i < World.decor.length; i++) {
      var d = World.decor[i];
      if (!visible(cam, d[1] - 30, 60)) continue;
      ctx.save();
      ctx.translate(-cam.x, -cam.y);
      if (d[0] === 'statue') CR.Art.statue(ctx, d[1], d[2], d[3] || 34, P.stoneDark, P.accent);
      else if (d[0] === 'inscription') CR.Art.inscription(ctx, d[1], d[2], d[3] || 40, d[4] || 4, 'rgba(255,255,255,0.16)', d[1] | 0);
      else if (d[0] === 'kolam') CR.Art.kolam(ctx, d[1], d[2], d[3] || 8, 'rgba(255,255,255,0.22)');
      else if (d[0] === 'gopuram') CR.Art.gopuram(ctx, d[1], d[2], d[3] || 50, d[4] || 90, P.stoneDark, true);
      ctx.restore();
    }

    // --- solid ground and walls ---
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    for (i = 0; i < World.solids.length; i++) {
      var s = World.solids[i];
      if (!visible(cam, s.x, s.w)) continue;

      if (s.kind === 'stone') {
        ctx.fillStyle = P.stone;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = P.stoneDark;
        for (var y = s.y + 6; y < s.y + s.h; y += 8) ctx.fillRect(s.x, y, s.w, 1.2);
        for (var x = s.x + 10; x < s.x + s.w; x += 20) ctx.fillRect(x, s.y, 1.2, s.h);
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.fillRect(s.x, s.y, s.w, 1.6);
      } else {
        ctx.fillStyle = P.groundDeep;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = P.groundFace;
        ctx.fillRect(s.x, s.y, s.w, Math.min(s.h, 14));
        ctx.fillStyle = P.groundTop;
        ctx.fillRect(s.x, s.y, s.w, 4);
        // scruffy edge so it does not read as a plain box
        ctx.fillStyle = P.groundTop;
        for (var gx = s.x; gx < s.x + s.w; gx += 6) {
          var bump = ((gx * 37) % 11) / 11;
          ctx.fillRect(gx, s.y - (bump > 0.6 ? 1.5 : 0), 6, 2);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (var dy = s.y + 18; dy < s.y + s.h; dy += 12) ctx.fillRect(s.x, dy, s.w, 1);
      }
    }

    // --- one-way wooden platforms ---
    for (i = 0; i < World.oneway.length; i++) {
      var p = World.oneway[i];
      if (!visible(cam, p.x, p.w)) continue;
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(p.x, p.y, p.w, 4);
      ctx.fillStyle = '#8a6338';
      ctx.fillRect(p.x, p.y, p.w, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (var px = p.x + 5; px < p.x + p.w; px += 12) ctx.fillRect(px, p.y, 1, 4);
    }
    ctx.restore();
  };

  World.drawProps = function (ctx, cam, t) {
    var P = World.palette;
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    var i;

    // --- static spikes ---
    for (i = 0; i < World.spikes.length; i++) {
      var sp = World.spikes[i];
      if (!visible(cam, sp.x, sp.w)) continue;
      drawSpikeRow(ctx, sp.x, sp.y, sp.w, 1);
    }

    // --- retracting spike traps ---
    for (i = 0; i < World.traps.length; i++) {
      var tr = World.traps[i];
      if (!visible(cam, tr.x, 16)) continue;
      ctx.fillStyle = '#2a2620';
      ctx.fillRect(tr.x, tr.y - 1, 16, 3);
      if (tr.out > 0.02) drawSpikeRow(ctx, tr.x, tr.y, 16, tr.out);
    }

    // --- gates ---
    for (i = 0; i < World.gates.length; i++) {
      var g = World.gates[i];
      if (!visible(cam, g.x, 10)) continue;
      var top = g.y + g.h * g.open;
      ctx.fillStyle = '#5a5f66';
      ctx.fillRect(g.x, top, 8, g.h * (1 - g.open));
      ctx.fillStyle = '#3d4147';
      for (var by = top + 4; by < g.y + g.h; by += 7) ctx.fillRect(g.x, by, 8, 1.4);
      ctx.fillStyle = '#7a808a';
      ctx.fillRect(g.x - 1, g.y - 3, 10, 3);
      // spiked bottom edge
      ctx.fillStyle = '#8e959e';
      for (var sx = 0; sx < 8; sx += 2.6) {
        ctx.beginPath();
        ctx.moveTo(g.x + sx, g.y + g.h);
        ctx.lineTo(g.x + sx + 1.3, g.y + g.h + 2.6);
        ctx.lineTo(g.x + sx + 2.6, g.y + g.h);
        ctx.closePath(); ctx.fill();
      }
    }

    // --- levers ---
    for (i = 0; i < World.levers.length; i++) {
      var lv = World.levers[i];
      if (!visible(cam, lv.x, 8)) continue;
      ctx.fillStyle = '#4a4038';
      ctx.fillRect(lv.x - 2, lv.y - 2, 5, 12);
      ctx.strokeStyle = lv.pulled ? '#c0563a' : '#d8b24e';
      ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lv.x + 0.5, lv.y);
      ctx.lineTo(lv.x + 0.5 + (lv.pulled ? 5 : -5), lv.y - 7);
      ctx.stroke();
      if (!lv.pulled) {
        var pulse = 0.5 + Math.sin(t * 5) * 0.3;
        ctx.fillStyle = 'rgba(255,220,120,' + (pulse * 0.4) + ')';
        ctx.beginPath(); ctx.arc(lv.x + 0.5, lv.y - 3, 7, 0, Math.PI * 2); ctx.fill();
      }
    }

    // --- ropes ---
    for (i = 0; i < World.ropes.length; i++) {
      var rp = World.ropes[i];
      if (!visible(cam, rp.x - 40, 80)) continue;
      var ex = rp.x + Math.sin(rp.a) * rp.len;
      var ey = rp.y + Math.cos(rp.a) * rp.len;
      ctx.strokeStyle = '#8a6a40';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(rp.x, rp.y);
      ctx.quadraticCurveTo((rp.x + ex) / 2 + Math.sin(rp.a) * 2, (rp.y + ey) / 2, ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#6b4a2a';
      ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a4038';
      ctx.fillRect(rp.x - 4, rp.y - 3, 8, 3);
    }

    // --- barrels ---
    for (i = 0; i < World.barrels.length; i++) {
      var b = World.barrels[i];
      if (b.broken || !visible(cam, b.x, 14)) continue;
      ctx.fillStyle = '#7a5230';
      CR.Art.roundRect(ctx, b.x, b.y, 14, 18, 3); ctx.fill();
      ctx.fillStyle = '#5c3d22';
      ctx.fillRect(b.x, b.y + 4, 14, 2);
      ctx.fillRect(b.x, b.y + 12, 14, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(b.x + 2, b.y + 1, 3, 16);
    }

    // --- pickups ---
    for (i = 0; i < World.pickups.length; i++) {
      var pk = World.pickups[i];
      if (pk.taken || !visible(cam, pk.x, 16)) continue;
      var by = pk.y + Math.sin(t * 3 + pk.bob) * 2;
      var glow = ctx.createRadialGradient(pk.x + 5, by, 0, pk.x + 5, by, 14);
      glow.addColorStop(0, 'rgba(255,230,150,0.45)');
      glow.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(pk.x + 5, by, 14, 0, Math.PI * 2); ctx.fill();
      if (pk.kind === 'sword') {
        ctx.save();
        ctx.translate(pk.x + 5, by + 8);
        ctx.rotate(-0.35);
        CR.Art.drawWeapon(ctx, 'sword', CR.Art.HERO);
        ctx.restore();
      } else {
        drawHeart(ctx, pk.x + 1, by, 9, '#d94a4a');
      }
    }

    // --- torches ---
    for (i = 0; i < World.torches.length; i++) {
      var tc = World.torches[i];
      if (!visible(cam, tc[0] - 12, 24)) continue;
      CR.Art.torch(ctx, tc[0], tc[1], t, P);
    }

    // --- the door out of the level ---
    if (World.exit && visible(cam, World.exit.x - 4, 30)) {
      var e = World.exit;
      ctx.fillStyle = '#241a12';
      CR.Art.roundRect(ctx, e.x, e.y - 34, 22, 34, 10); ctx.fill();
      ctx.fillStyle = e.open ? '#ffcf6a' : '#3c2a1c';
      CR.Art.roundRect(ctx, e.x + 2.5, e.y - 31, 17, 31, 8); ctx.fill();
      if (e.open) {
        var eg = ctx.createRadialGradient(e.x + 11, e.y - 16, 1, e.x + 11, e.y - 16, 26);
        eg.addColorStop(0, 'rgba(255,215,130,0.55)');
        eg.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.arc(e.x + 11, e.y - 16, 26, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = '#6b5334'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(e.x + 4, e.y - 16); ctx.lineTo(e.x + 18, e.y - 16); ctx.stroke();
        ctx.fillStyle = '#c9a24a';
        ctx.beginPath(); ctx.arc(e.x + 11, e.y - 16, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      CR.Art.kolam(ctx, e.x + 11, e.y + 5, 7, 'rgba(255,255,255,0.25)');
    }

    // --- the cage in the last level ---
    if (World.cage && visible(cam, World.cage.x - 10, 50)) {
      var c = World.cage;
      CR.Art.drawPrincess(ctx, c.x + 16, c.y, t, c.open);
      if (!c.open) {
        ctx.strokeStyle = '#8e959e';
        ctx.lineWidth = 1.6;
        for (var bx = 0; bx <= 32; bx += 5.4) {
          ctx.beginPath(); ctx.moveTo(c.x + bx, c.y - 44); ctx.lineTo(c.x + bx, c.y); ctx.stroke();
        }
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(c.x - 2, c.y - 44); ctx.lineTo(c.x + 34, c.y - 44); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.x - 2, c.y); ctx.lineTo(c.x + 34, c.y); ctx.stroke();
        ctx.fillStyle = '#d8b24e';
        ctx.beginPath(); ctx.arc(c.x + 16, c.y - 20, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }

    // --- debris ---
    for (i = 0; i < World.particles.length; i++) {
      var pt = World.particles[i];
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rot);
      ctx.globalAlpha = Math.min(1, pt.life * 2.2);
      ctx.fillStyle = pt.col;
      ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  // A warm dark vignette, plus firelight in the palace level.
  World.drawAtmosphere = function (ctx, cam) {
    var P = World.palette;
    if (World.def.palette === 'hall') {
      ctx.fillStyle = 'rgba(6,4,10,0.55)';
      ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
      // punch light back in around each torch
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < World.torches.length; i++) {
        var tc = World.torches[i];
        var sx = tc[0] - cam.x, sy = tc[1] - cam.y - 5;
        if (sx < -60 || sx > CR.VIEW_W + 60) continue;
        var g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 62);
        g.addColorStop(0, 'rgba(255,170,70,0.30)');
        g.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sx, sy, 62, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    var v = ctx.createRadialGradient(CR.VIEW_W / 2, CR.VIEW_H / 2, CR.VIEW_H * 0.35,
                                     CR.VIEW_W / 2, CR.VIEW_H / 2, CR.VIEW_W * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, CR.VIEW_W, CR.VIEW_H);
  };

  function drawSpikeRow(ctx, x, y, w, out) {
    var hgt = 8 * out;
    ctx.fillStyle = '#b9c2cb';
    for (var i = 0; i < w; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + 2, y - hgt);
      ctx.lineTo(x + i + 4, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (var j = 0; j < w; j += 4) ctx.fillRect(x + j + 1.6, y - hgt, 0.7, hgt);
  }

  function drawHeart(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x + s / 2, y + s);
    ctx.bezierCurveTo(x - s * 0.35, y + s * 0.45, x + s * 0.12, y - s * 0.28, x + s / 2, y + s * 0.22);
    ctx.bezierCurveTo(x + s * 0.88, y - s * 0.28, x + s * 1.35, y + s * 0.45, x + s / 2, y + s);
    ctx.fill();
  }
  World.drawHeart = drawHeart;

  CR.World = World;
})();
