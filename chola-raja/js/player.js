/* ============================================================
   player.js - Prince Rajaraja Chola himself.

   Everything the prince can do lives here: walking, running, jumping,
   crawling, running up walls, hanging off ledges, swinging on ropes,
   and swinging his blade.

   The movement is "physics driven": we never teleport him to a tile.
   We give him a speed, gravity pulls him down, and the world stops him
   when he bumps into something.
   ============================================================ */
(function () {

  // ---- the numbers that decide how the game feels ----
  var GRAVITY      = 640;     // pixels per second, per second
  /* One speed, no run button. A steady jog that clears every gap in the
     game, so nobody ever loses a jump because they forgot to hold a key. */
  var MOVE_SPEED   = 100;
  var ACCEL_GROUND = 700;
  var ACCEL_AIR    = 360;
  var FRICTION     = 800;
  var JUMP_VEL     = -216;
  var MAX_FALL     = 340;
  var FATAL_FALL   = 322;     // land faster than this and it is over (about a 4-body drop)
  var COYOTE       = 0.10;    // grace period to still jump after leaving a ledge
  var JUMP_BUFFER  = 0.12;    // pressing jump slightly early still works

  var STAND_H = 28, CRAWL_H = 13, BODY_W = 12;

  /* Both blades take one point off a guard. The sword is not a bigger
     number, it is a better weapon: it reaches further and recovers
     quicker, so you can hit from outside a spear and swing again sooner. */
  var WEAPONS = {
    dagger: { reach: 13, dmg: 1, wind: 0.10, active: 0.13, recover: 0.20 },
    sword:  { reach: 22, dmg: 1, wind: 0.08, active: 0.15, recover: 0.11 }
  };

  function Player(x, y) {
    this.x = x; this.y = y;
    this.w = BODY_W; this.h = STAND_H;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.anim = 'idle';
    this.animT = 0;

    this.maxHearts = 4;
    this.hearts = 4;
    this.weapon = 'dagger';

    this.invuln = 0;
    this.hurtT = 0;
    this.dead = false;
    this.deadT = 0;

    this.coyote = 0;
    this.jumpBuf = 0;
    this.crawling = false;

    this.attackT = 0;         // counts up while a swing is happening
    this.attackDur = 0;
    this.attackHit = false;

    this.wallDir = 0;
    this.wallRunT = 0;
    this.wallRunUsed = false;

    this.hanging = false;
    this.hangY = 0;

    this.rope = null;
    this.ropeCooldown = 0;

    this.bark = null;         // little speech bubble above his head
    this.barkT = 0;
    this.stepT = 0;
    this.landVy = 0;
  }

  Player.prototype.say = function (text, secs) {
    this.bark = text;
    this.barkT = secs || 1.1;
  };

  Player.prototype.box = function () {
    return CR.rect(this.x, this.y, this.w, this.h);
  };

  Player.prototype.centerX = function () { return this.x + this.w / 2; };
  Player.prototype.centerY = function () { return this.y + this.h / 2; };

  /* ---------- the main per-frame update ---------- */
  Player.prototype.update = function (dt, game) {
    var In = CR.Input;
    var W = CR.World;

    this.animT += dt;
    if (this.barkT > 0) { this.barkT -= dt; if (this.barkT <= 0) this.bark = null; }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.ropeCooldown > 0) this.ropeCooldown -= dt;

    if (this.dead) {
      this.deadT += dt;
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
      W.moveBox(this, 0, this.vy * dt);
      this.anim = 'dead';
      return;
    }

    if (this.hurtT > 0) {
      // knocked back and unable to act for a moment
      this.hurtT -= dt;
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
      var rh = W.moveBox(this, this.vx * dt, this.vy * dt);
      if (rh.hitX) this.vx = 0;
      if (rh.onGround) { this.vy = 0; this.onGround = true; this.vx *= 0.6; }
      this.anim = 'hurt';
      return;
    }

    /* ---------- rope swinging ---------- */
    if (this.rope) { this.updateRope(dt, game); return; }

    /* ---------- hanging from a ledge ---------- */
    if (this.hanging) {
      this.vx = 0; this.vy = 0;
      this.anim = 'hang';
      if (In.grabPressed || In.upPressed) {
        // climb up onto the ledge
        this.hanging = false;
        this.y = this.hangY - this.h - 0.5;
        this.x += this.facing * 6;
        if (W.blocked(this.box())) { this.x -= this.facing * 6; this.y = this.hangY - this.h - 0.5; }
        this.vy = -40;
        this.onGround = false;
        CR.Audio.sfx.step();
      } else if (In.down) {
        this.hanging = false;
        this.vy = 20;
      }
      return;
    }

    /* ---------- decide how fast he wants to go ---------- */
    var wantDir = (In.right ? 1 : 0) - (In.left ? 1 : 0);

    // crawling: hold down on the ground, or squeeze into a low gap
    var wantCrawl = In.down && this.onGround;
    if (this.crawling && !wantCrawl) {
      // only stand back up if there is room above
      var standBox = CR.rect(this.x, this.y + this.h - STAND_H, this.w, STAND_H);
      if (!W.blocked(standBox)) {
        this.y = this.y + this.h - STAND_H;
        this.h = STAND_H;
        this.crawling = false;
      }
    } else if (!this.crawling && wantCrawl) {
      this.y = this.y + this.h - CRAWL_H;
      this.h = CRAWL_H;
      this.crawling = true;
    }

    var topSpeed = this.crawling ? 36 : MOVE_SPEED;
    if (game.assist) topSpeed *= 1.0;   // difficulty assist never slows the player

    var accel = this.onGround ? ACCEL_GROUND : ACCEL_AIR;
    if (this.attackT > 0 && this.onGround) accel *= 0.25;   // planting your feet to swing

    if (wantDir !== 0) {
      this.vx = CR.approach(this.vx, wantDir * topSpeed, accel * dt);
      if (this.attackT <= 0) this.facing = wantDir;
    } else if (this.onGround) {
      this.vx = CR.approach(this.vx, 0, FRICTION * dt);
    } else {
      this.vx = CR.approach(this.vx, 0, 80 * dt);
    }

    /* ---------- jumping ---------- */
    if (In.jumpPressed) this.jumpBuf = JUMP_BUFFER;
    if (this.jumpBuf > 0) this.jumpBuf -= dt;
    if (this.coyote > 0) this.coyote -= dt;

    if (this.jumpBuf > 0 && (this.onGround || this.coyote > 0) && !this.crawling) {
      this.vy = JUMP_VEL;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.wallRunUsed = false;
      CR.Audio.sfx.jump();
    }

    /* ---------- wall run and wall jump ----------
       Hold towards a wall in mid air and press jump: he runs a short way
       straight up it, exactly like the 3D Prince of Persia games. */
    var touchingWall = 0;
    if (!this.onGround && !this.crawling) {
      if (wantDir !== 0) {
        var probe = CR.rect(this.x + wantDir * 2, this.y + 3, this.w, this.h - 6);
        if (W.blocked(probe)) touchingWall = wantDir;
      }
    }
    this.wallDir = touchingWall;

    if (this.wallRunT > 0) {
      this.wallRunT -= dt;
      this.vy = -142;
      this.anim = 'wallrun';
      if (touchingWall === 0) this.wallRunT = 0;
      if (In.jumpPressed) {
        this.wallRunT = 0;
        this.vy = JUMP_VEL * 0.92;
        this.vx = -this.facing * 120;
        CR.Audio.sfx.jump();
      }
    } else if (touchingWall !== 0) {
      if (this.jumpBuf > 0 && !this.wallRunUsed && this.vy > -60) {
        this.wallRunT = 0.30;
        this.wallRunUsed = true;
        this.jumpBuf = 0;
        this.vy = -142;
        CR.Audio.sfx.step();
      } else if (this.vy > 30) {
        this.vy = Math.min(this.vy, 70);      // slide down the wall slowly
      }
    }

    /* ---------- grabbing a rope ---------- */
    if (this.ropeCooldown <= 0 && In.grab) {
      for (var i = 0; i < W.ropes.length; i++) {
        var rp = W.ropes[i];
        var ex = rp.x + Math.sin(rp.a) * rp.len;
        var ey = rp.y + Math.cos(rp.a) * rp.len;
        // his hands count as well as his middle - catching a rope should
        // feel generous, not like threading a needle
        if (CR.dist(this.centerX(), this.centerY(), ex, ey) < 24 ||
            CR.dist(this.centerX(), this.y + 5, ex, ey) < 24) {
          this.grabRope(rp);
          return;
        }
      }
    }

    /* ---------- swinging the blade ---------- */
    var wp = WEAPONS[this.weapon];
    if (this.attackT > 0) {
      this.attackT += dt;
      if (this.attackT >= this.attackDur) { this.attackT = 0; this.attackHit = false; }
    } else if (In.attackPressed && !this.crawling) {
      this.attackT = 0.0001;
      this.attackDur = wp.wind + wp.active + wp.recover;
      this.attackHit = false;
      CR.Audio.sfx.swing();
    }

    /* ---------- gravity and actually moving ---------- */
    if (this.wallRunT <= 0) {
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
    }

    var wasAir = !this.onGround;
    var fallSpeed = this.vy;
    var res = W.moveBox(this, this.vx * dt, this.vy * dt);

    if (res.hitX) this.vx = 0;
    if (res.ceiling) this.vy = 0;

    if (res.onGround) {
      if (wasAir) {
        this.landVy = fallSpeed;
        if (fallSpeed >= FATAL_FALL && !game.assistNoFallDeath) {
          this.die(game, 'fall');
          return;
        }
        if (fallSpeed > 120) {
          CR.Audio.sfx.land();
          CR.World.puff(this.centerX(), this.y + this.h, 4, '#c8b48a', 50);
        }
      }
      this.vy = 0;
      this.onGround = true;
      this.coyote = COYOTE;
      this.wallRunUsed = false;
    } else {
      if (this.onGround) this.coyote = COYOTE;
      this.onGround = W.groundBelow(this, 2);
      if (this.onGround) this.vy = Math.max(this.vy, 0);
    }

    /* ---------- ledge grab ----------
       While falling, if his hands are level with the top of a wall he is
       facing, he catches it. This is the move that makes the platforming
       feel forgiving instead of cruel. */
    if (!this.onGround && this.vy > 20 && !this.crawling && this.wallRunT <= 0) {
      var handX = this.x + (this.facing > 0 ? this.w + 1 : -1);
      var probeTop = CR.rect(handX - 1, this.y + 2, 3, 4);
      var probeAbove = CR.rect(handX - 1, this.y - 8, 3, 9);
      var grabbed = W.solidOverlap(probeTop);
      if (grabbed && !W.solidOverlap(probeAbove) && Math.abs(grabbed.y - (this.y + 4)) < 6) {
        this.hanging = true;
        this.hangY = grabbed.y;
        this.y = grabbed.y - 4;
        this.vy = 0; this.vx = 0;
        CR.Audio.sfx.step();
      }
    }

    /* ---------- footstep ticks ---------- */
    if (this.onGround && Math.abs(this.vx) > 20) {
      this.stepT -= dt * Math.abs(this.vx) / 60;
      if (this.stepT <= 0) { this.stepT = 0.34; CR.Audio.sfx.step(); }
    }

    /* ---------- work out which animation to show ---------- */
    if (this.attackT > 0) this.anim = 'attack';
    else if (this.wallRunT > 0) this.anim = 'wallrun';
    else if (this.crawling) this.anim = (Math.abs(this.vx) > 4 ? 'crawl' : 'crawl');
    else if (!this.onGround) this.anim = this.vy < -20 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > MOVE_SPEED * 0.55) this.anim = 'run';
    else if (Math.abs(this.vx) > 6) this.anim = 'walk';
    else this.anim = 'idle';

    /* ---------- fell off the bottom of the world ---------- */
    if (this.y > CR.World.h + 20) this.die(game, 'pit');

    this.checkHazards(game);
    this.checkPickups(game);
  };

  /* ---------- rope ---------- */
  Player.prototype.grabRope = function (rp) {
    this.rope = rp;
    rp.rider = this;
    // start the swing from wherever he was already moving
    rp.va = CR.clamp(this.vx / rp.len * 0.9, -3, 3);
    this.vy = 0;
    this.say('Aah!', 0.5);
    CR.Audio.sfx.step();
  };

  Player.prototype.updateRope = function (dt, game) {
    var In = CR.Input;
    var rp = this.rope;

    // a pendulum: gravity pulls the far end back towards straight down
    var pump = (In.right ? 1 : 0) - (In.left ? 1 : 0);
    rp.va += -Math.sin(rp.a) * 7.0 * dt;
    rp.va += pump * 2.4 * dt;
    rp.va *= 0.998;
    rp.a += rp.va * dt;
    rp.a = CR.clamp(rp.a, -1.5, 1.5);

    var ex = rp.x + Math.sin(rp.a) * rp.len;
    var ey = rp.y + Math.cos(rp.a) * rp.len;
    this.x = ex - this.w / 2;
    this.y = ey - 4;
    this.facing = rp.va > 0 ? 1 : -1;
    this.anim = 'swing';

    if (CR.Input.jumpPressed || CR.Input.down) {
      // let go: fling him along the direction the rope was travelling
      var tangential = rp.va * rp.len;
      this.vx = Math.cos(rp.a) * tangential;
      this.vy = -Math.sin(rp.a) * tangential - 90;
      rp.rider = null;
      this.rope = null;
      this.ropeCooldown = 0.45;
      this.onGround = false;
      CR.Audio.sfx.jump();
    }
    this.checkHazards(game);
  };

  /* ---------- spikes, traps, pits ---------- */
  Player.prototype.checkHazards = function (game) {
    if (this.dead || this.invuln > 0) return;
    var W = CR.World, b = this.box(), i;

    for (i = 0; i < W.spikes.length; i++) {
      var sp = W.spikes[i];
      if (CR.overlap(b, CR.rect(sp.x, sp.y - 7, sp.w, 8))) { this.die(game, 'spike'); return; }
    }
    for (i = 0; i < W.traps.length; i++) {
      var tr = W.traps[i];
      if (tr.out < 0.45) continue;
      if (CR.overlap(b, CR.rect(tr.x, tr.y - 8 * tr.out, 16, 8 * tr.out))) { this.die(game, 'spike'); return; }
    }
  };

  Player.prototype.checkPickups = function (game) {
    var W = CR.World, b = this.box();
    for (var i = 0; i < W.pickups.length; i++) {
      var pk = W.pickups[i];
      if (pk.taken) continue;
      if (!CR.overlap(b, CR.rect(pk.x - 2, pk.y - 4, 14, 18))) continue;
      pk.taken = true;
      if (pk.kind === 'sword') {
        this.weapon = 'sword';
        CR.Audio.sfx.pickup();
        game.banner('THE CAPTAIN’S SWORD IS YOURS — longer reach, twice the bite');
        this.say('Nandri!', 1.4);
      } else {
        this.hearts = Math.min(this.maxHearts, this.hearts + 1);
        CR.Audio.sfx.heart();
      }
    }
  };

  /* ---------- taking a hit ---------- */
  Player.prototype.hurt = function (game, fromX, amount) {
    if (this.invuln > 0 || this.dead) return false;
    this.hearts -= (amount || 1);
    this.invuln = 1.25;
    this.hurtT = 0.36;
    var away = this.centerX() < fromX ? -1 : 1;
    this.vx = away * 110;
    this.vy = -105;
    this.onGround = false;
    CR.World.camera.shake = 0.8;
    CR.World.blood(this.centerX(), this.centerY() - 2, 8, away);

    if (this.hearts <= 0) { this.die(game, 'blade'); return true; }
    CR.Audio.sfx.hurt();
    this.say('Ayyo!', 0.9);
    return true;
  };

  Player.prototype.die = function (game, cause) {
    if (this.dead) return;
    this.dead = true;
    this.deadT = 0;
    this.hearts = 0;
    this.rope = null;
    this.hanging = false;
    this.crawling = false;
    this.attackT = 0;
    this.hurtT = 0;

    if (cause === 'spike') {
      // impaled: he drops onto them rather than standing on them
      this.vy = 40;
      this.vx = -this.facing * 20;
      CR.World.blood(this.centerX(), this.y + this.h - 4, 18, -this.facing);
    } else if (cause === 'blade') {
      this.vy = -70;
      this.vx = -this.facing * 40;
      CR.World.blood(this.centerX(), this.centerY(), 16, -this.facing);
    } else {
      this.vy = -70;
    }

    CR.World.camera.shake = 1;
    CR.Audio.sfx.ayyo();
    game.onPlayerDied(cause);
  };

  /* ---------- the sword hitbox ----------
     Only live during the middle slice of the swing. */
  Player.prototype.attackBox = function () {
    if (this.attackT <= 0) return null;
    var wp = WEAPONS[this.weapon];
    if (this.attackT < wp.wind || this.attackT > wp.wind + wp.active) return null;
    var reach = wp.reach;
    var x = this.facing > 0 ? this.x + this.w - 2 : this.x - reach + 2;
    return CR.rect(x, this.y + 3, reach, this.h - 8);
  };

  Player.prototype.damage = function () { return WEAPONS[this.weapon].dmg; };

  Player.prototype.attackPhase = function () {
    if (this.attackT <= 0) return 0;
    return this.attackT / this.attackDur;
  };

  /* ---------- drawing ---------- */
  Player.prototype.draw = function (ctx, cam) {
    var sx = this.x + this.w / 2 - cam.x;
    var sy = this.y + this.h - cam.y;

    // blink while invulnerable so you can see the hit registered
    if (this.invuln > 0 && !this.dead && Math.floor(this.invuln * 18) % 2 === 0) return;

    // soft shadow on the ground
    if (!this.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 1, 7, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    var pose = {
      x: sx, y: sy,
      height: 30,
      anim: this.anim,
      t: this.animT,
      facing: this.facing,
      weapon: this.weapon,
      colors: CR.Art.HERO,
      crown: true,
      attackP: this.attackPhase()
    };
    // a dark copy just behind him, so he never disappears into the scenery
    pose.tint = 'rgba(8,5,4,0.3)';
    pose.x = sx + 1.8; pose.y = sy + 0.6;
    CR.Art.drawPerson(ctx, pose);
    pose.tint = null;
    pose.x = sx; pose.y = sy;
    CR.Art.drawPerson(ctx, pose);

    if (this.bark) {
      CR.Art.text(ctx, this.bark, sx, sy - 36, { align: 'center', font: CR.Art.FONT_SMALL, color: '#ffe9a8' });
    }
  };

  CR.Player = Player;
})();
