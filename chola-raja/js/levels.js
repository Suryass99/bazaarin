/* ============================================================
   levels.js - the actual shape of the game.

   THIS IS THE FILE TO EDIT if you want to change the game.
   Everything is plain numbers, so you can move a spike or add a
   guard without touching any of the engine code.

   How to read a level:
     w, h        how wide and how tall the level is, in pixels
     spawn       [x, y] where the prince starts (y = the floor he stands on)
     solids      [x, y, width, height, kind]  ground and walls you cannot pass
                 kind is 'earth' (mud and grass) or 'stone' (cut blocks)
     oneway      [x, y, width]   wooden planks you can jump up through
     spikes      [x, y, width]   always-out floor spikes. They kill.
     traps       [x, y, seconds, offset]  spikes that pop in and out on a timer
     barrels     [x, y]          smash them with the blade
     ropes       [x, y, length]  anchor point at the top
     gates       [x, y, height]  a portcullis, closed until a lever is pulled
     levers      [x, y, gateNumber, secondsOpen]
     pickups     [x, y, 'heart' | 'sword']
     enemies     [x, y, type, patrolRange, dropsSword]
                 types: 'guard', 'spearman', 'captain'
     boss        [x, y]          Vimal, only in the last level
     cage        [x, y]          where Kundavai is held
     torches     [x, y]
     decor       ['statue'|'inscription'|'kolam'|'gopuram', ...numbers]
     signs       [x, 'text that pops up when you walk past']
     dialogue    [x, [[speaker, line], ...]]
     checkpoints [x, y]          where you come back to if you die
     exit        [x, y]          the door to the next level

   All the y values are "the floor level", and things stand ON that line.
   ============================================================ */
(function () {

  var L1 = {
    id: 1,
    name: 'The Groves of Vellaru',
    subtitle: 'Level One',
    palette: 'grove',
    music: 'level1',
    hearts: 4,
    startWeapon: 'dagger',
    w: 2500, h: 360,
    spawn: [30, 300],

    solids: [
      [0, 300, 520, 100],
      [566, 300, 254, 100],
      [820, 270, 280, 130, 'stone'],
      [1152, 270, 198, 130, 'stone'],
      [1470, 280, 1030, 120],
      // the little pillar the rope hangs from
      [1390, 170, 40, 22, 'stone']
    ],

    oneway: [
      [1240, 226, 60]
    ],

    spikes: [
      [644, 300, 26]
    ],

    traps: [
      [1640, 280, 2.6, 0.0],
      [1700, 280, 2.6, 0.0]
    ],

    barrels: [
      [340, 282], [420, 282], [600, 282], [1800, 262]
    ],

    ropes: [
      [1410, 190, 68]
    ],

    gates: [
      [1780, 236, 44]
    ],

    levers: [
      [1560, 268, 0, 6]
    ],

    pickups: [
      [1256, 208, 'heart']
    ],

    enemies: [
      [900, 270, 'guard', 20],
      [1010, 270, 'guard', 0],
      [1230, 270, 'guard', 24],
      [1495, 280, 'guard', 0],
      [1545, 280, 'spearman', 0],
      [1950, 280, 'guard', 26],
      [2050, 280, 'guard', 0],
      [2140, 280, 'captain', 0, true]     // the last man standing drops his sword
    ],

    torches: [
      [1770, 268], [1830, 268]
    ],

    decor: [
      ['gopuram', 300, 300, 46, 92],
      ['statue', 1180, 270, 30],
      ['inscription', 860, 300, 60, 3],
      ['kolam', 200, 296, 9],
      ['kolam', 1600, 276, 9]
    ],

    signs: [
      [46, 'ARROW KEYS to walk    SHIFT to run'],
      [210, 'SPACE to jump'],
      [312, 'Z to swing your dagger - smash those barrels'],
      [592, 'Spikes. Take a run-up and jump clean over'],
      [842, 'A Pandya guard. He lifts his blade before he swings - strike him then'],
      [1160, 'Grab a ledge as you fall, then press UP to pull yourself over'],
      [1362, 'Jump, press UP to catch the rope. Arrows to swing, SPACE to let go'],
      [1500, 'Pull the lever with UP - then run. The gate does not wait'],
      [2250, 'The door. Press UP to go through']
    ],

    dialogue: [],

    checkpoints: [
      [566, 300], [1152, 270], [1470, 280], [1890, 280]
    ],

    exit: [2380, 280]
  };

  var L2 = {
    id: 2,
    name: 'The Ramparts of Madurai',
    subtitle: 'Level Two',
    palette: 'fort',
    music: 'level2',
    hearts: 5,
    startWeapon: 'sword',
    w: 3000, h: 380,
    spawn: [30, 320],

    solids: [
      [0, 320, 420, 100],
      [470, 320, 230, 100],
      [700, 252, 290, 168, 'stone'],        // the wall you have to run up, and the walk beyond it
      [1040, 252, 180, 168, 'stone'],
      [1340, 270, 720, 150, 'stone'],       // the long walk, including the drain floor
      [1620, 206, 180, 46, 'stone'],        // the slab overhead: only a crawl fits under it
      [2300, 180, 300, 240, 'stone'],
      [2596, 240, 72, 20, 'stone'],         // a ledge so the drop off the rampart is survivable
      [2600, 300, 400, 120],
      [1260, 148, 40, 22, 'stone']          // rope anchor block
    ],

    oneway: [
      [2080, 252, 52],
      [2162, 224, 52],
      [2244, 198, 52]
    ],

    spikes: [
      [430, 320, 26]
    ],

    traps: [
      [1080, 252, 1.8, 0.0],
      [1120, 252, 1.8, 0.6],
      [1160, 252, 1.8, 1.2],
      [2440, 180, 1.6, 0.0],
      [2480, 180, 1.6, 0.8]
    ],

    barrels: [
      [520, 302], [560, 302], [1400, 252], [1900, 252], [2660, 282]
    ],

    ropes: [
      [1280, 168, 74]
    ],

    gates: [
      [2545, 136, 44]
    ],

    levers: [
      [2330, 168, 0, 6]
    ],

    pickups: [
      [1360, 240, 'heart'],
      [2620, 268, 'heart']
    ],

    enemies: [
      [260, 320, 'guard', 30],
      [380, 320, 'spearman', 0],
      [800, 252, 'guard', 0],
      [900, 252, 'guard', 24],
      [1450, 270, 'spearman', 0],
      [1900, 270, 'guard', 26],
      [1990, 270, 'guard', 0],
      [2400, 180, 'guard', 0],
      [2500, 180, 'spearman', 0],
      [2700, 300, 'guard', 22],
      [2780, 300, 'guard', 0],
      [2850, 300, 'spearman', 0]
    ],

    torches: [
      [520, 300], [905, 232], [1420, 250], [1860, 250], [2350, 160], [2750, 280]
    ],

    decor: [
      ['gopuram', 1000, 252, 40, 78],
      ['statue', 1980, 270, 30],
      ['inscription', 740, 300, 70, 4],
      ['inscription', 2320, 230, 60, 3],
      ['kolam', 2900, 296, 9]
    ],

    signs: [
      [46, 'The outer rampart of Madurai. They know you are coming'],
      [660, 'Too high to jump. Run at the wall and press SPACE again to run UP it'],
      [1230, 'Swing across. Look at how far the rope reaches before you leap'],
      [1580, 'Hold DOWN to crawl through the drain'],
      [2320, 'Pull it, then sprint. Two sets of spikes between you and the gate'],
      [2900, 'The inner door. Press UP']
    ],

    dialogue: [],

    checkpoints: [
      [470, 320], [730, 252], [1340, 270], [1830, 270], [2300, 180], [2600, 300]
    ],

    exit: [2900, 300]
  };

  var L3 = {
    id: 3,
    name: 'The Hall of Lamps',
    subtitle: 'Level Three - the last',
    palette: 'hall',
    music: 'level3',
    bossMusic: 'boss',
    hearts: 6,
    startWeapon: 'sword',
    w: 2400, h: 380,
    spawn: [30, 320],

    solids: [
      [0, 320, 545, 100, 'stone'],
      [600, 320, 280, 100, 'stone'],
      [930, 320, 200, 100, 'stone'],
      [1250, 300, 570, 120, 'stone'],       // the long hall, including the crawl
      [1520, 236, 140, 46, 'stone'],        // the slab overhead: crawl or turn back
      [1820, 230, 30, 190, 'stone'],        // the wall up into the boss hall
      [1850, 230, 550, 190, 'stone'],       // the boss hall floor
      [1170, 176, 40, 22, 'stone']          // rope anchor block
    ],

    oneway: [],

    spikes: [
    ],

    traps: [
      [690, 320, 1.9, 0.0],
      [740, 320, 1.9, 0.65],
      [790, 320, 1.9, 1.3],
      [1330, 300, 2.4, 0.0],
      [1380, 300, 2.4, 0.0]
    ],

    barrels: [
      [200, 302], [960, 302], [1720, 282]
    ],

    ropes: [
      [1190, 196, 80]
    ],

    gates: [],
    levers: [],

    pickups: [
      [1690, 270, 'heart'],
      [1880, 200, 'heart']
    ],

    enemies: [
      [300, 320, 'guard', 24],
      [430, 320, 'spearman', 0],
      [1000, 320, 'guard', 0],
      [1320, 300, 'guard', 0],
      [1440, 300, 'spearman', 0],
      [1760, 300, 'guard', 0],
      [1950, 230, 'guard', 20],
      [2010, 230, 'captain', 0]
    ],

    boss: [2150, 230],
    cage: [2290, 230],

    torches: [
      [120, 300], [340, 300], [660, 300], [860, 300], [1080, 280],
      [1300, 280], [1470, 280], [1780, 280], [1900, 210], [2050, 210],
      [2200, 210], [2340, 210]
    ],

    decor: [
      ['statue', 420, 320, 34],
      ['statue', 1180, 300, 32],
      ['statue', 2360, 230, 36],
      ['inscription', 140, 260, 70, 4],
      ['inscription', 1880, 180, 80, 4],
      ['kolam', 250, 316, 9],
      ['kolam', 2270, 226, 10]
    ],

    signs: [
      [46, 'The Hall of Lamps. Somewhere past these fires, Kundavai'],
      [900, 'The lamps are lit for a feast. Nobody here is celebrating'],
      [1480, 'Hold DOWN. Crawl'],
      [1790, 'Run the wall. He is up there']
    ],

    dialogue: [
      [1900, [
        ['VIMAL', 'You climbed my walls, boy? In the dark?'],
        ['RAJARAJA', 'I would do anything for my family.'],
        ['VIMAL', 'Then bleed for them.']
      ]]
    ],

    checkpoints: [
      [610, 320], [930, 320], [1250, 300], [1680, 300], [1870, 230]
    ],

    exit: null
  };

  CR.LEVELS = [L1, L2, L3];
})();
