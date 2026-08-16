/* ============================================================
   enemies.js - the Pandya soldiers, their captain, and Vimal.

   Every soldier runs the same little brain:
     wait -> spot the prince -> shout -> close in -> wind up -> strike
   The wind-up is the important part. A guard always telegraphs his
   swing before it lands, so a death is always your fault, never a
   surprise. That is what makes a fight feel fair.
   ============================================================ */
(function () {

  var TYPES = {
    guard: {
      hp: 2, w: 12, h: 28, height: 29, speed: 46, sight: 132,
      reach: 17, wind: 0.55, active: 0.16, recover: 0.55,
      colors: 'GUARD', weapon: 'sword', helmet: true, shield: true, plume: false
    },
    spearman: {
      hp: 2, w: 12, h: 28, height: 29, speed: 38, sight: 150,
      reach: 26, wind: 0.68, active: 0.18, recover: 0.62,
      colors: 'GUARD', weapon: 'spear', helmet: true, shield: false, plume: false
    },
    captain: {
      hp: 5, w: 13, h: 29, height: 31, speed: 62, sight: 165,
      reach: 20, wind: 0.42, active: 0.16, recover: 0.40,
      colors: 'CAPTAIN', weapon: 'sword', helmet: true, shield: true, plume: true
    },
    boss: {
      hp: 20, w: 22, h: 44, height: 47, speed: 40, sight: 300,
      reach: 30, wind: 0.85, active: 0.22, recover: 0.85,
      colors: 'BOSS', weapon: 'club', helmet: false, shield: false, moustache: true
    }
  };

  function Enemy(x, y, type, opts) {
    var T = TYPES[type] || TYPES.guard;
    this.type = type;
    this.T = T;
    this.x = x; this.y = y - T.h;
    this.w = T.w; this.h = T.h;
    this.vx = 0; this.vy = 0;
    this.facing = -1;
    this.hp = T.hp;
    this.maxHp = T.hp;
    this.state = 'idle';       // idle | alert | chase | wind | strike | recover | hurt | dead
    this.timer = 0;
    this.animT = Math.random() * 3;
    this.onGround = false;
    this.homeX = x;
    this.patrol = opts && opts.patrol ? opts.patrol : 0;
    this.dropsSword = !!(opts && opts.dropsSword);
    this.bark = null; this.barkT = 0;
    this.hitFlash = 0;
    this.deadT = 0;
    this.engaged = false;
    this.shockwaves = [];
    this.slamCount = 0;
  }

  Enemy.prototype.box = function () { return CR.rect(this.x, this.y, this.w, this.h); };
  Enemy.prototype.centerX = function () { return this.x + this.w / 2; };
  Enemy.prototype.centerY = function () { return this.y + this.h / 2; };

  Enemy.prototype.say = function (t, s) { this.bark = t; this.barkT = s || 1.2; };

  Enemy.prototype.hitBox = function () {
    if (this.state !== 'strike') return null;
    var r = this.T.reach;
    var x = this.facing > 0 ? this.x + this.w - 3 : this.x - r + 3;
    return CR.rect(x, this.y + 4, r, this.h - 8);
  };

  Enemy.prototype.takeHit = function (dmg, fromX, game) {
    if (this.state === 'dead') return;
    this.hp -= dmg;
    this.hitFlash = 0.16;
    CR.World.camera.shake = 0.45;
    CR.World.puff(this.centerX(), this.centerY(), 5, '#a33', 70);

    if (this.hp <= 0) {
      this.state = 'dead';
      this.deadT = 0;
      this.vx = (this.centerX() < fromX ? -1 : 1) * 60;
      this.vy = -110;
      CR.Audio.sfx.guardDie();
      if (this.dropsSword) {
        CR.World.pickups.push({ x: this.centerX() - 5, y: this.y + this.h - 16, kind: 'sword', taken: false, bob: 0 });
      }
      game.onEnemyKilled(this);
    } else {
      this.state = 'hurt';
      this.timer = 0.28;
      this.vx = (this.centerX() < fromX ? -1 : 1) * 70;
      CR.Audio.sfx.hitFlesh();
    }
  };

  /* ---------- brain + body ---------- */
  Enemy.prototype.update = function (dt, game, player, slots) {
    var W = CR.World;
    this.animT += dt;
    if (this.barkT > 0) { this.barkT -= dt; if (this.barkT <= 0) this.bark = null; }
    if (this.hitFlash > 0) this.hitFlash -= dt;

    if (this.state === 'dead') {
      this.deadT += dt;
      this.vy = Math.min(this.vy + 640 * dt, 340);
      var rd = W.moveBox(this, this.vx * dt, this.vy * dt);
      if (rd.onGround) { this.vy = 0; this.vx *= 0.8; }
      return;
    }

    // how far away is the prince, and is he roughly on my level?
    var dx = player.centerX() - this.centerX();
    var dy = Math.abs(player.centerY() - this.centerY());
    var adx = Math.abs(dx);
    var canSee = adx < this.T.sight && dy < 44 && !player.dead;

    // the assist makes guards a little slower to swing if you keep dying
    var windMul = game.assist ? 1.35 : 1;
    var recoverMul = game.assist ? 1.3 : 1;

    switch (this.state) {
      case 'idle':
        this.vx = 0;
        if (this.patrol > 0) {
          // pace back and forth in front of your post
          var target = this.homeX + Math.sin(this.animT * 0.6) * this.patrol;
          this.vx = CR.clamp((target - this.x) * 2, -22, 22);
          if (Math.abs(this.vx) > 3) this.facing = CR.sign(this.vx);
        }
        if (canSee) {
          this.state = 'alert';
          this.timer = 0.45;
          this.facing = CR.sign(dx) || this.facing;
          this.say('Yaar angae?!', 1.3);
          CR.Audio.sfx.alert();
        }
        break;

      case 'alert':
        this.vx = 0;
        this.timer -= dt;
        if (this.timer <= 0) this.state = 'chase';
        break;

      case 'chase':
        // only a few soldiers crowd the prince at once - the rest hold back,
        // so a platform never turns into an unfair pile-on
        if (!this.engaged && slots.taken >= slots.max && adx > this.T.reach + 6) {
          this.vx = CR.approach(this.vx, 0, 300 * dt);
          break;
        }
        this.engaged = true;
        this.facing = CR.sign(dx) || this.facing;

        if (adx <= this.T.reach - 3 && dy < 30) {
          this.state = 'wind';
          this.timer = this.T.wind * windMul;
          this.vx = 0;
        } else {
          var sp = this.T.speed * (this.type === 'boss' ? 1 : 1);
          this.vx = CR.approach(this.vx, this.facing * sp, 400 * dt);
          // never walk off a cliff
          var ahead = CR.rect(this.x + this.facing * 8, this.y + this.h, 4, 6);
          if (this.onGround && !W.blocked(ahead)) this.vx = 0;
          if (!canSee && adx > this.T.sight * 1.4) { this.state = 'idle'; this.engaged = false; }
        }
        break;

      case 'wind':
        this.vx = CR.approach(this.vx, 0, 500 * dt);
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'strike';
          this.timer = this.T.active;
          this.hasHit = false;
          if (this.type === 'boss') { CR.Audio.sfx.slam(); this.spawnShockwave(); }
          else CR.Audio.sfx.swing();
        }
        break;

      case 'strike':
        this.timer -= dt;
        if (this.type === 'boss') this.vx = 0;
        else this.vx = this.facing * 40;
        var hb = this.hitBox();
        if (hb && !this.hasHit && CR.overlap(hb, player.box())) {
          this.hasHit = true;
          player.hurt(game, this.centerX(), this.type === 'boss' ? 2 : 1);
        }
        if (this.timer <= 0) { this.state = 'recover'; this.timer = this.T.recover * recoverMul; }
        break;

      case 'recover':
        this.vx = CR.approach(this.vx, 0, 400 * dt);
        this.timer -= dt;
        if (this.timer <= 0) this.state = canSee ? 'chase' : 'idle';
        break;

      case 'hurt':
        this.timer -= dt;
        this.vx = CR.approach(this.vx, 0, 260 * dt);
        if (this.timer <= 0) { this.state = 'chase'; this.engaged = true; }
        break;
    }

    // gravity and movement
    this.vy = Math.min(this.vy + 640 * dt, 340);
    var res = W.moveBox(this, this.vx * dt, this.vy * dt);
    if (res.hitX) this.vx = 0;
    if (res.onGround) { this.vy = 0; this.onGround = true; }
    else this.onGround = W.groundBelow(this, 2);

    // the boss sends a wave of force along the floor when he slams
    for (var i = this.shockwaves.length - 1; i >= 0; i--) {
      var s = this.shockwaves[i];
      s.x += s.dir * 150 * dt;
      s.life -= dt;
      if (!s.hit && CR.overlap(CR.rect(s.x - 7, s.y - 14, 14, 14), player.box())) {
        s.hit = true;
        if (!player.onGround) { /* jumping over it is the answer */ }
        else player.hurt(game, s.x, 1);
      }
      if (s.life <= 0) this.shockwaves.splice(i, 1);
    }
  };

  Enemy.prototype.spawnShockwave = function () {
    this.slamCount++;
    CR.World.camera.shake = 1.4;
    CR.World.puff(this.centerX(), this.y + this.h, 10, '#6a5030', 140);
    this.shockwaves.push({ x: this.centerX() - 10, y: this.y + this.h, dir: -1, life: 1.5, hit: false });
    this.shockwaves.push({ x: this.centerX() + 10, y: this.y + this.h, dir: 1, life: 1.5, hit: false });
  };

  /* ---------- drawing ---------- */
  Enemy.prototype.draw = function (ctx, cam) {
    var sx = this.centerX() - cam.x;
    var sy = this.y + this.h - cam.y;
    var T = this.T;
    var colors = CR.Art[T.colors];

    var anim = 'idle';
    if (this.state === 'dead') anim = 'dead';
    else if (this.state === 'hurt') anim = 'hurt';
    else if (this.state === 'wind') anim = 'attack';
    else if (this.state === 'strike' || this.state === 'recover') anim = 'attack';
    else if (Math.abs(this.vx) > 10) anim = Math.abs(this.vx) > 55 ? 'run' : 'walk';

    // during a wind-up the arm holds back; during the strike it sweeps through
    var p = 0;
    if (this.state === 'wind') p = 0.30 * (1 - this.timer / (T.wind || 0.5));
    else if (this.state === 'strike') p = 0.32 + 0.5 * (1 - this.timer / T.active);
    else if (this.state === 'recover') p = 0.86 + 0.14 * (1 - this.timer / T.recover);

    // shadow
    if (this.state !== 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 1, this.w * 0.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    if (this.state === 'dead') ctx.globalAlpha = Math.max(0, 1 - Math.max(0, this.deadT - 1.6) / 1.2);
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9;
    }

    var pose = {
      x: sx, y: sy,
      height: T.height,
      anim: anim, t: this.animT, facing: this.facing,
      weapon: T.weapon, colors: colors,
      helmet: T.helmet, shield: T.shield, plume: T.plume, moustache: T.moustache,
      attackP: p
    };
    pose.tint = 'rgba(8,5,4,0.3)';
    pose.x = sx + 1.8; pose.y = sy + 0.6;
    CR.Art.drawPerson(ctx, pose);
    pose.tint = null;
    pose.x = sx; pose.y = sy;
    // a white flash on the frame a hit lands, so you feel the contact
    if (this.hitFlash > 0.02) pose.tint = 'rgba(255,240,230,0.92)';
    CR.Art.drawPerson(ctx, pose);
    if (this.hitFlash > 0) ctx.restore();
    ctx.restore();

    // a red glint just before the blade lands - your cue to move
    if (this.state === 'wind') {
      var warn = 0.4 + Math.sin(this.animT * 30) * 0.3;
      ctx.fillStyle = 'rgba(255,80,60,' + warn + ')';
      ctx.beginPath();
      ctx.arc(sx + this.facing * (T.reach * 0.6), sy - this.h * 0.75, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // shockwaves
    for (var i = 0; i < this.shockwaves.length; i++) {
      var s = this.shockwaves[i];
      var wx = s.x - cam.x, wy = s.y - cam.y;
      ctx.strokeStyle = 'rgba(255,170,80,' + Math.max(0, s.life) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx, wy - 12);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,200,120,0.5)';
      ctx.fillRect(wx - 2, wy - 3, 4, 3);
    }

    if (this.bark) {
      CR.Art.text(ctx, this.bark, sx, sy - T.height - 6, {
        align: 'center', font: CR.Art.FONT_SMALL, color: '#ffd0a0'
      });
    }

    // boss health bar, drawn above his head
    if (this.type === 'boss' && this.state !== 'dead') {
      var bw = 46;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(sx - bw / 2 - 1, sy - T.height - 13, bw + 2, 5);
      ctx.fillStyle = '#a8323c';
      ctx.fillRect(sx - bw / 2, sy - T.height - 12, bw * (this.hp / this.maxHp), 3);
    }
  };

  Enemy.TYPES = TYPES;
  CR.Enemy = Enemy;
})();
