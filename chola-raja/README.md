# Chola Raja — The Rescue of Kundavai

A 2D side-view action platformer. Prince Rajaraja Chola breaks into the Pandya
fort to bring his sister Kundavai home. Three levels, one boss, one ending.

Built to run in any modern browser, offline, on a phone or a laptop.

---

## Playing it

**On a computer**

| Key | What it does |
|---|---|
| ← → | walk |
| SHIFT | run — hold it and you jump much further |
| SPACE | jump. Press it *again* while touching a wall to run **up** the wall |
| Z (or J, or CTRL) | swing your blade |
| ↓ | crawl through low gaps |
| ↑ | climb a ledge you are hanging from, catch a rope, pull a lever, open a door |
| ESC or P | pause · M mutes |

**On a phone** — hold it sideways. A stick appears bottom-left (push up to jump,
pull down to crawl) and JUMP / SWORD / RUN buttons bottom-right.

**The rules that matter**

- A long fall kills you. Spikes kill you. Everything else costs one heart.
- Guards *always* lift their weapon before they strike. That pause is your turn.
- You start Level 1 with a small dagger. The captain at the end of Level 1
  drops a proper sword — longer reach, kills a guard in one hit.
- Checkpoints are scattered through each level. Dying sends you back to the
  last one, never to the start of the game.
- Die three times on the same level and the game quietly helps: the guards
  swing slower and you get an extra heart.

---

## Running it while you work on it

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File chola-raja/.devserver.ps1 -Port 8020
```

or use the `chola-raja` launch configuration in `.claude/launch.json`.
Either way, open <http://localhost:8020>.

You can also just double-click `index.html` — there is no build step to run
and nothing to install. Every file is plain JavaScript loaded with a
`<script>` tag.

To produce the one-file version:

```bash
sh chola-raja/build.sh
```

That writes `dist/chola-raja.html` — the entire game, art, music and all, in a
single file you can email or open offline.

---

## What is in each file

| File | What lives there |
|---|---|
| `js/util.js` | maths helpers, rectangles, the save file |
| `js/input.js` | keyboard, mouse and touch, boiled down to a few true/false flags |
| `js/audio.js` | **all** the music and sound, generated from scratch with Web Audio |
| `js/art.js` | **all** the drawing: the jointed character puppet, scenery, palettes |
| `js/world.js` | solid ground, traps, ropes, gates, the camera |
| `js/player.js` | everything the prince can do |
| `js/enemies.js` | guard, spearman, captain and Vimal |
| `js/levels.js` | **the level layouts — this is the file to edit** |
| `js/story.js` | the comic-book intro and ending |
| `js/ui.js` | hearts, menus, pause, touch buttons |
| `js/game.js` | the main loop and which screen we are on |

### There are no asset files

No images, no sprite sheets, no `.mp3`. Every character is a small jointed
puppet whose limbs are rotated by maths each frame, every fort and gopuram is
a shape drawn with code, and every note of the music is synthesised live in
the browser using **Mayamalavagowla**, an old South Indian raga.

That means: nothing to download, no licences to track, no copyright risk, the
whole game is about 160 KB, and it stays sharp on any screen size.

---

## Changing the game

Open `js/levels.js`. It is nothing but numbers, and the comment at the top
explains every field. Want an extra guard in Level 2? Add a line:

```js
enemies: [
  [1450, 270, 'spearman', 0],
  [1500, 270, 'guard', 20],     // <- a new one, patrolling 20px either way
]
```

Move a spike, widen a gap, change how long a gate stays open — it is all in
that one file. The engine files never need to be touched to build new levels.

---

## The history, and what is invented

Rajaraja Chola, his sister Kundavai and their father Parantaka Chola II were
real people of the 10th century Chola empire. The Pandyas were a real rival
kingdom — their soldiers here carry the twin-fish emblem, as the Pandyas did.

**Vimal, the kidnapping, and the whole plot are invented.** No real person is
portrayed as a villain. The wall carvings in the game are decorative marks in
the spirit of a stone inscription, not real Tamil text, so that nothing
nonsensical is carved into a wall.
