(() => {
  "use strict";

  const TRACK = 1000;
  const STORAGE_KEY = "etb-highscores";
  const MUTE_KEY = "etb-muted";
  const SETTINGS_KEY = "etb-settings";
  const STALL_SEC = 0.4;
  const ADRENALINE_WORDS = 5;
  const ADRENALINE_SEC = 3;
  const ADRENALINE_MULT = 1.28;
  const MUSIC_BPM = 134;
  const MUSIC_STEP = 60 / MUSIC_BPM / 4;

  const HORROR_SETS = [
    [
      "Containment sector four has suffered a critical failure and the primary blast gates are sliding shut.",
      "Security cameras confirm Experiment-09 has broken through the observation glass and is entering the main corridor.",
      "Run toward the beacon lights at the far end of the hall before the perimeter seal becomes permanent.",
    ],
    [
      "Do not stop to gather equipment because all remaining power is being diverted to the hydraulic escape door.",
      "Emergency protocols require manual terminal overrides to unlock the outer bulkhead before the countdown reaches zero.",
      "Keep both hands on the keys and do not look away from the corridor until the last hatch opens.",
    ],
    [
      "The shadow creature tracks vibrations across the steel floor, so keep your stride steady and move fast.",
      "You can hear heavy footfalls echoing through the ventilation shafts directly behind you.",
      "Do not look back until you have crossed the painted safety line at the blast door.",
    ],
    [
      "Warning: secondary oxygen vents are venting toxic gas and atmospheric pressure is dropping rapidly.",
      "Seal your visor and follow the yellow markers through the compromised airlock.",
      "The lower decks will flood in ninety seconds if the override sequence is not accepted.",
    ],
    [
      "Central intelligence reports that the specimen has learned to force open sealed doors.",
      "All automated turrets are offline, and the remaining staff have already evacuated the west wing.",
      "You are the last operator still logged into the containment terminal.",
    ],
    [
      "Reactor coolant is failing, and the corridor lights flicker with every impact against the bulkhead.",
      "Divert remaining power from the research labs to the outer gate actuators immediately.",
      "If the door stalls at forty percent, you will have to crawl beneath the hydraulic ram.",
    ],
    [
      "This is a repeating distress call from containment: Experiment-09 is loose and closing on the exit route.",
      "Any surviving personnel must abandon their stations and sprint for the surface elevator.",
      "The elevator will lock after one ascent, so do not wait for anyone behind you.",
    ],
    [
      "Motion sensors along the north corridor have gone dark in sequence, one after another.",
      "The last camera still online shows a tall shape moving faster than a sprinting human.",
      "Update your route toward service tunnel seven before the creature reaches the junction.",
    ],
    [
      "The blast door timer has entered its final cycle and will not accept a remote delay.",
      "Type the override sequence exactly as displayed or the gate will seal with you inside.",
      "Heat signatures suggest the specimen is less than sixty meters from your current position.",
    ],
    [
      "Keep the visor sealed because the air beyond the inner hatch is no longer breathable.",
      "Steam is pouring from the ruptured pipes, and the floor is slick with coolant.",
      "Reach the beacon at the far bulkhead and confirm the lock from the other side.",
    ],
    [
      "Facility log: the observation glass in sector two shattered at 04:12 and was not an accident.",
      "The specimen paused at the broken frame, then dropped into the hallway without a sound.",
      "Security advises a straight sprint to airlock C and no stops at supply cabinets.",
    ],
    [
      "System warning: hydraulic pressure in the escape door has fallen below the safe threshold.",
      "Pump residual charge from the backup cells before the ram loses its last meter of travel.",
      "If the amber strobes go dark, the lock is already committed and cannot be reversed.",
    ],
  ];

  const NATURAL_PASSAGES = [
    "The morning light spilled across the wooden table and warmed the quiet kitchen.",
    "She packed a small bag, locked the door, and walked toward the waiting train.",
    "Rivers carve the land slowly, but they never forget the shortest path downhill.",
    "A good plan is useless if you never take the first careful step forward.",
    "The library was silent except for the turning of pages and the rain on the windows.",
    "He counted the stars until the horizon paled and the city lights went out.",
    "Practice does not make perfect, but it does make the next attempt a little cleaner.",
    "Winter arrived early that year, covering the fields in a thin, glittering frost.",
    "They built the bridge not for themselves, but for whoever would come after.",
    "Curiosity is a kind of courage that asks questions even when the answers sting.",
    "The old radio crackled, then found a clear station playing a song from years ago.",
    "Maps are only useful if you are willing to leave the place you already know.",
    "Coffee cooled beside the notebook while the writer searched for a better sentence.",
    "Children ran through the garden, leaving a trail of laughter and trampled grass.",
    "Time is generous to those who work steadily and cruel to those who wait for luck.",
    "The sea does not argue with the shore; it simply returns, again and again.",
    "Kindness costs little, yet it can change the shape of an entire afternoon.",
    "He learned to listen before he learned to speak, and that made all the difference.",
    "Mountains look immovable until you watch them through a lifetime of weather.",
    "The simplest tools still require a steady hand and a patient mind.",
    "Evening settled over the harbor as the last boat tied itself to the dock.",
    "A clear explanation is often the difference between panic and a workable plan.",
    "She traced the route with her finger, then closed the atlas and started walking.",
    "Thunder rolled across the valley, but the travelers kept their pace on the ridge.",
    "Memory is a lantern: it does not remove the dark, but it lets you see the next few steps.",
    "The baker opened the shutters, dusted the counter, and waited for the first customers.",
    "Good questions travel farther than clever answers, and they last a lot longer too.",
    "He folded the letter twice, slipped it into his coat, and stepped into the cold air.",
    "The path through the pines was narrow, but it led to a wide and quiet lake.",
    "Some days are for building, and some days are for keeping what you have already made.",
  ];

  const CODE_LINES = [
    "if (breachLevel > 3) return lock.seal(outerGate);",
    "const status = await core.getOverride('bulkhead');",
    "while (doorOpen > 0) pump.divert(remainingPower);",
    "try { hatch.unlock(); } catch (err) { return false; }",
    "userId = session.authToken;",
    "setOverride(true);",
    "if (err) return;",
    "const gateLock = sensors[0].read();",
    "for (let i = 0; i < vents.length; i += 1) vents[i].close();",
    "system.purgeCoolant(coreTemp);",
    "hashKey === authToken && seal.engage();",
    "await delay(countdown);",
  ];

  const DIFFICULTIES = {
    recruit: {
      id: "recruit",
      name: "Recruit",
      tag: "Casual",
      targetWpm: 40,
      monsterWpm: 44,
      doorTime: 96,
      startGap: 180,
      closeAccel: 1.08,
      stall: 0.28,
      gapCatchup: 1.08,
    },
    scout: {
      id: "scout",
      name: "Scout",
      tag: "Standard",
      targetWpm: 55,
      monsterWpm: 62,
      doorTime: 68,
      startGap: 175,
      closeAccel: 1.12,
      stall: 0.38,
      doorAccelFinal: true,
      gapCatchup: 1.1,
      huntDrive: 1.04,
    },
    operative: {
      id: "operative",
      name: "Operative",
      tag: "Challenging",
      targetWpm: 75,
      monsterWpm: 84,
      doorTime: 50,
      startGap: 170,
      closeAccel: 1.18,
      stall: 0.5,
      doorAccelFinal: true,
      gapCatchup: 1.12,
      huntDrive: 1.06,
      wakeSec: 1.15,
    },
    nightmare: {
      id: "nightmare",
      name: "Nightmare",
      tag: "Hardcore",
      targetWpm: 95,
      monsterWpm: 108,
      doorTime: 40,
      startGap: 165,
      closeAccel: 1.24,
      stall: 0.7,
      doorAccelFinal: true,
      gapCatchup: 1.14,
      huntDrive: 1.08,
      wakeSec: 1.0,
      wakeRate: 0.55,
    },
    apex: {
      id: "apex",
      name: "Apex Predator",
      tag: "Insane",
      targetWpm: 100,
      monsterWpm: 82,
      doorTime: 36,
      startGap: 160,
      closeAccel: 1.28,
      stall: 1,
      adaptive: true,
      adaptiveMult: 1.08,
      doorAccelFinal: true,
      gapCatchup: 1.16,
      huntDrive: 1.05,
      wakeSec: 0.9,
      wakeRate: 0.6,
    },
  };

  const DOOR_SCALE = { relaxed: 1.6, standard: 1, blitz: 0.62 };

  const defaultSettings = () => ({
    lastPreset: "scout",
    endless: false,
    labOpen: false,
    lab: {
      monsterWpm: 50,
      monsterOff: false,
      distance: "1000",
      door: "standard",
      stall: 0.3,
      textMode: "standard",
      punctuation: true,
    },
  });

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      const base = defaultSettings();
      if (!raw || typeof raw !== "object") return base;
      return {
        ...base,
        ...raw,
        lab: { ...base.lab, ...(raw.lab || {}) },
      };
    } catch {
      return defaultSettings();
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  const $ = (id) => document.getElementById(id);

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function formatTime(sec) {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const r = (s % 60).toFixed(1);
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  }

  function formatXp(n) {
    return Math.max(0, Math.floor(Number(n) || 0)).toLocaleString("en-US");
  }

  function loadScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const empty = {
        recruit: [], scout: [], operative: [], nightmare: [], apex: [],
        endless: [], custom: [],
      };
      Object.keys(empty).forEach((k) => {
        empty[k] = Array.isArray(data[k]) ? data[k] : [];
      });
      return empty;
    } catch {
      return {
        recruit: [], scout: [], operative: [], nightmare: [], apex: [],
        endless: [], custom: [],
      };
    }
  }

  function saveScores(scores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    if (typeof SaveStore !== "undefined") SaveStore.persist();
  }

  function addScore(entry) {
    const scores = loadScores();
    const list = scores[entry.difficulty] || (scores[entry.difficulty] = []);
    list.push(entry);
    list.sort((a, b) => {
      if (entry.difficulty === "endless" || a.endless || b.endless) {
        return (b.distance || 0) - (a.distance || 0);
      }
      if (a.escaped !== b.escaped) return a.escaped ? -1 : 1;
      return b.wpm - a.wpm;
    });
    scores[entry.difficulty] = list.slice(0, 5);
    saveScores(scores);
    const rank = scores[entry.difficulty].findIndex((s) => s.at === entry.at) + 1;
    return { scores, rank };
  }

  const CREDITS_KEY = "typing_credits";
  const COSMETICS_KEY = "etb-cosmetics";
  const SAVE_KEY = "ETB_SAVE_DATA";
  const SAVE_PREFIX = "ETB-v1-";
  const PULL_COST = 500;
  const TEN_COST = 4500;
  const DUP_REFUND = 150;
  const STREAK_TOASTS = [
    { at: 10, bonus: 10, text: "10 STREAK: FOCUS (+10 ⬡)" },
    { at: 20, bonus: 25, text: "20 STREAK: ON FIRE (+25 ⬡)" },
    { at: 30, bonus: 50, text: "30 STREAK: OVERDRIVE (+50 ⬡)" },
    { at: 50, bonus: 100, text: "50 STREAK: UNTOUCHABLE (+100 ⬡)" },
  ];

  const CATALOG = {
    runner: [
      { id: "cyan", model: "cyan", name: "Protocol Operator", rarity: "common", visor: "#7dffb0", visorHi: "#b8fff0", body: "#1b2733", trim: "#2c3b4c", limbs: "#c5d0dc", accent: "#3dffd0", swatch: "linear-gradient(90deg,#1b2733,#7dffb0)" },
      { id: "hazard", model: "hazard", name: "Hazmat Bruiser", rarity: "common", visor: "#ff9a32", visorHi: "#ffd19a", body: "#2a1c12", trim: "#4a2e18", limbs: "#e8b070", accent: "#ffb020", swatch: "linear-gradient(90deg,#2a1c12,#ff9a32)" },
      { id: "steel", model: "steel", name: "Plate Walker", rarity: "common", visor: "#c5d0dc", visorHi: "#eef3f8", body: "#3a424c", trim: "#5a6570", limbs: "#9aa8b8", accent: "#8b97a8", swatch: "linear-gradient(90deg,#3a424c,#c5d0dc)" },
      { id: "emerald", model: "emerald", name: "Emerald Phantom", rarity: "rare", visor: "#39ff88", visorHi: "#c8ffe0", body: "#082418", trim: "#145c3a", limbs: "#7dffb0", accent: "#5dff8a", swatch: "linear-gradient(90deg,#082418,#39ff88)" },
      { id: "violet", model: "violet", name: "Neon Courier", rarity: "rare", visor: "#d07aff", visorHi: "#f0d0ff", body: "#241434", trim: "#4a2870", limbs: "#c9a0ff", accent: "#ff4bd8", swatch: "linear-gradient(90deg,#241434,#d07aff)" },
      { id: "glitch", model: "glitch", name: "Neon Glitch", rarity: "legendary", fx: "rgb-wave", visor: "#ff4bd8", visorHi: "#7dfff6", body: "#120818", trim: "#3a2048", limbs: "#e8e8ff", accent: "#3dffd0", swatch: "linear-gradient(90deg,#ff4bd8,#3dffd0,#ffd24a)" },
      { id: "gold", model: "gold", name: "Gold Protocol", rarity: "legendary", visor: "#ffd24a", visorHi: "#fff4c2", body: "#2a210c", trim: "#6a5418", limbs: "#ffe08a", accent: "#ffd24a", swatch: "linear-gradient(90deg,#2a210c,#ffd24a)" },
      { id: "neon-hazard", model: "neonHazard", name: "Neon Hazard", rarity: "exclusive", visor: "#d6ff00", visorHi: "#fff8a8", body: "#101208", trim: "#ff3b8a", limbs: "#c8ff4a", accent: "#ff3b8a", swatch: "linear-gradient(90deg,#101208,#d6ff00,#ff3b8a)" },
    ],
    monster: [
      { id: "ink", model: "ink", name: "Shadow Ink", rarity: "common", body: "#14080c", mid: "#2a1016", horn: "#3a161c", tent: [18, 0, 10], eye: [255, 24, 36], glow: "#ff2030", swatch: "linear-gradient(90deg,#14080c,#ff2030)" },
      { id: "crimson", model: "crimson", name: "Crimson Carnage", rarity: "common", body: "#3a0808", mid: "#5a1010", horn: "#7a1818", tent: [90, 0, 8], eye: [255, 80, 40], glow: "#ff4020", swatch: "linear-gradient(90deg,#3a0808,#ff4020)" },
      { id: "ash", model: "ash", name: "Ash Stalker", rarity: "common", body: "#2a2218", mid: "#4a3824", horn: "#6a5030", tent: [70, 50, 20], eye: [255, 160, 40], glow: "#ff9a32", swatch: "linear-gradient(90deg,#2a2218,#ff9a32)" },
      { id: "toxic", model: "toxic", name: "Spore Hive", rarity: "rare", body: "#0a2a12", mid: "#145c28", horn: "#1a7a38", tent: [20, 90, 30], eye: [80, 255, 90], glow: "#39ff88", swatch: "linear-gradient(90deg,#0a2a12,#39ff88)" },
      { id: "frost", model: "frost", name: "Rime Colossus", rarity: "rare", body: "#0a1a2a", mid: "#163450", horn: "#8ec8e8", tent: [40, 90, 140], eye: [180, 240, 255], glow: "#7dd3fc", swatch: "linear-gradient(90deg,#0a1a2a,#7dd3fc)" },
      { id: "static", model: "static", name: "Static Wraith", rarity: "rare", body: "#0c1020", mid: "#1c2848", horn: "#7d9cff", tent: [80, 120, 255], eye: [180, 220, 255], glow: "#7d9cff", swatch: "linear-gradient(90deg,#0c1020,#7d9cff)" },
      { id: "void", model: "void", name: "Void Singularity", rarity: "legendary", fx: "event-horizon", body: "#050308", mid: "#1a0a28", horn: "#4a2080", tent: [40, 10, 70], eye: [240, 220, 255], glow: "#c084fc", swatch: "linear-gradient(90deg,#050308,#c084fc)" },
      { id: "leviathan", model: "leviathan", name: "Helix Leviathan", rarity: "legendary", body: "#081018", mid: "#123040", horn: "#3dffd0", tent: [20, 80, 90], eye: [61, 255, 208], glow: "#3dffd0", swatch: "linear-gradient(90deg,#081018,#3dffd0)" },
    ],
    sector: [
      { id: "industrial", model: "industrial", name: "Sublevel Industrial", rarity: "common", sky0: "#121821", sky1: "#243044", wallA: "#3a4658", wallB: "#303a4a", innerA: "#2a3342", innerB: "#242c38", rivet: "#8b97a8", stripe: "#c9a227", ceil: "#1c232d", beam: "#4a5668", pipe: "#6d7c90", pipeHi: "#9aabbf", light: [255, 48, 58], beamLight: [255, 210, 80], floor0: "#3a332c", floor1: "#241f1c", floor2: "#100e10", lane: "rgba(255,196,70,0.35)", laneFill: "rgba(255,196,70,0.12)", swatch: "linear-gradient(90deg,#303a4a,#c9a227)" },
      { id: "subway", model: "subway", name: "Abandoned Subway", rarity: "common", sky0: "#0e1014", sky1: "#1c1e26", wallA: "#3a3a42", wallB: "#2c2c34", innerA: "#d8c9a4", innerB: "#c4b48c", rivet: "#8a8a92", stripe: "#f0c400", ceil: "#18181c", beam: "#4a4a52", pipe: "#6a6a70", pipeHi: "#b0b0b8", light: [255, 196, 40], beamLight: [255, 220, 120], floor0: "#2e2e28", floor1: "#1c1c18", floor2: "#0c0c0c", lane: "rgba(240,196,0,0.45)", laneFill: "rgba(240,196,0,0.14)", swatch: "linear-gradient(90deg,#2c2c34,#f0c400)" },
      { id: "archive", model: "archive", name: "Flooded Archive", rarity: "common", sky0: "#101820", sky1: "#1a2834", wallA: "#2a3844", wallB: "#203038", innerA: "#3a4a40", innerB: "#2a3834", rivet: "#8aa0a8", stripe: "#7dd3fc", ceil: "#141c22", beam: "#3a4a54", pipe: "#4a6a70", pipeHi: "#8ab0b8", light: [120, 200, 220], beamLight: [180, 230, 255], floor0: "#1a2830", floor1: "#122028", floor2: "#081018", lane: "rgba(125,211,252,0.4)", laneFill: "rgba(125,211,252,0.12)", swatch: "linear-gradient(90deg,#1a2834,#7dd3fc)" },
      { id: "biodome", model: "biodome", name: "Overgrown Bio-Dome", rarity: "rare", vines: true, sky0: "#102018", sky1: "#1c3a28", wallA: "#2a4a32", wallB: "#203828", innerA: "#184028", innerB: "#14281c", rivet: "#7aa878", stripe: "#5dff8a", ceil: "#102018", beam: "#2a5a38", pipe: "#4a7860", pipeHi: "#8fd4a8", light: [80, 255, 120], beamLight: [180, 255, 160], floor0: "#2a3a24", floor1: "#182418", floor2: "#0a120c", lane: "rgba(93,255,138,0.35)", laneFill: "rgba(93,255,138,0.12)", swatch: "linear-gradient(90deg,#203828,#5dff8a)" },
      { id: "underpass", model: "underpass", name: "Neon City Underpass", rarity: "rare", sky0: "#14081c", sky1: "#2a1040", wallA: "#2a1838", wallB: "#1c1028", innerA: "#241430", innerB: "#180c22", rivet: "#c084fc", stripe: "#ff4bd8", ceil: "#100818", beam: "#3a2060", pipe: "#6a40a0", pipeHi: "#d07aff", light: [255, 60, 200], beamLight: [80, 255, 255], floor0: "#221428", floor1: "#140c1c", floor2: "#08040e", lane: "rgba(0,255,220,0.4)", laneFill: "rgba(255,75,216,0.14)", swatch: "linear-gradient(90deg,#1c1028,#ff4bd8,#3dffd0)" },
      { id: "foundry", model: "foundry", name: "Magma Foundry", rarity: "rare", sky0: "#1a0c08", sky1: "#3a180c", wallA: "#3a2014", wallB: "#2a140c", innerA: "#4a2410", innerB: "#30180c", rivet: "#ff9a32", stripe: "#ff5a20", ceil: "#140808", beam: "#5a2814", pipe: "#8a4020", pipeHi: "#ffb060", light: [255, 80, 30], beamLight: [255, 180, 60], floor0: "#3a1810", floor1: "#24100c", floor2: "#100808", lane: "rgba(255,90,32,0.5)", laneFill: "rgba(255,90,32,0.16)", swatch: "linear-gradient(90deg,#2a140c,#ff5a20)" },
      { id: "quantum", model: "quantum", name: "Hyper-Speed Quantum Warp", rarity: "legendary", warp: true, sky0: "#080414", sky1: "#1a0830", wallA: "#241048", wallB: "#180830", innerA: "#2a1458", innerB: "#140828", rivet: "#c084fc", stripe: "#7d5cff", ceil: "#0c0618", beam: "#3a1880", pipe: "#5a30a8", pipeHi: "#d0b0ff", light: [160, 80, 255], beamLight: [200, 140, 255], floor0: "#1a0c30", floor1: "#100824", floor2: "#060310", lane: "rgba(160,80,255,0.5)", laneFill: "rgba(125,92,255,0.16)", swatch: "linear-gradient(90deg,#080414,#7d5cff,#3dffd0)" },
      { id: "eclipse", model: "eclipse", name: "Solar Eclipse Vault", rarity: "legendary", sky0: "#08060a", sky1: "#1a1010", wallA: "#241818", wallB: "#180c0c", innerA: "#2a1410", innerB: "#1c0c0c", rivet: "#ffd24a", stripe: "#ffb020", ceil: "#0c0808", beam: "#3a2010", pipe: "#6a4018", pipeHi: "#ffd24a", light: [255, 210, 74], beamLight: [255, 120, 40], floor0: "#1c1010", floor1: "#120808", floor2: "#080404", lane: "rgba(255,210,74,0.45)", laneFill: "rgba(255,80,30,0.14)", swatch: "linear-gradient(90deg,#08060a,#ffd24a,#ff5a20)" },
    ],
  };

  const Cosmetics = {
    credits: 0,
    owned: { runner: ["cyan"], monster: ["ink"], sector: ["industrial"] },
    equipped: { runner: "cyan", monster: "ink", sector: "industrial" },
    display: 0,
    anim: 0,

    load() {
      const n = Number(localStorage.getItem(CREDITS_KEY));
      this.credits = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
      this.display = this.credits;
      try {
        const raw = JSON.parse(localStorage.getItem(COSMETICS_KEY) || "null");
        if (raw && typeof raw === "object") {
          this.owned = {
            runner: Array.isArray(raw.owned?.runner) ? raw.owned.runner : ["cyan"],
            monster: Array.isArray(raw.owned?.monster) ? raw.owned.monster : ["ink"],
            sector: Array.isArray(raw.owned?.sector) ? raw.owned.sector : ["industrial"],
          };
          this.equipped = {
            runner: raw.equipped?.runner || "cyan",
            monster: raw.equipped?.monster || "ink",
            sector: raw.equipped?.sector || "industrial",
          };
        }
      } catch { /* keep defaults */ }
      ["runner", "monster", "sector"].forEach((slot) => {
        const fallback = slot === "runner" ? "cyan" : slot === "monster" ? "ink" : "industrial";
        if (!this.owned[slot].includes(fallback)) this.owned[slot].unshift(fallback);
        if (!this.find(slot, this.equipped[slot])) this.equipped[slot] = fallback;
        if (!this.owned[slot].includes(this.equipped[slot])) this.equipped[slot] = fallback;
      });
      this.save();
    },

    save() {
      localStorage.setItem(CREDITS_KEY, String(this.credits));
      localStorage.setItem(COSMETICS_KEY, JSON.stringify({
        owned: this.owned,
        equipped: this.equipped,
      }));
      localStorage.setItem("equippedRunnerSkin", this.equipped.runner);
      localStorage.setItem("equippedMonsterSkin", this.equipped.monster);
      localStorage.setItem("equippedBackground", this.equipped.sector);
      if (typeof SaveStore !== "undefined") SaveStore.persist();
    },

    find(slot, id) {
      return (CATALOG[slot] || []).find((item) => item.id === id) || null;
    },

    list(slot) {
      return CATALOG[slot] || [];
    },

    runner() {
      return this.find("runner", this.equipped.runner) || CATALOG.runner[0];
    },

    monster() {
      return this.find("monster", this.equipped.monster) || CATALOG.monster[0];
    },

    sector() {
      return this.find("sector", this.equipped.sector) || CATALOG.sector[0];
    },

    owns(slot, id) {
      return this.owned[slot].includes(id);
    },

    addCredits(amount) {
      const from = this.credits;
      this.credits = Math.max(0, this.credits + Math.floor(amount));
      this.save();
      this.animate(from, this.credits);
      return this.credits;
    },

    spend(amount) {
      if (this.credits < amount) return false;
      const from = this.credits;
      this.credits -= amount;
      this.save();
      this.animate(from, this.credits);
      return true;
    },

    animate(from, to) {
      cancelAnimationFrame(this.anim);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 620);
        const eased = 1 - Math.pow(1 - t, 3);
        this.display = Math.round(from + (to - from) * eased);
        this.paint();
        if (t < 1) this.anim = requestAnimationFrame(tick);
      };
      this.anim = requestAnimationFrame(tick);
    },

    paint() {
      const text = String(this.display);
      ["start-credits", "market-credits", "stat-credits"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      });
      this.syncPullButtons();
      if (typeof Progress !== "undefined") Progress.paintHud();
    },

    syncPullButtons() {
      const free = typeof Progress !== "undefined" ? Progress.freePulls : 0;
      document.querySelectorAll("[data-pull]").forEach((btn) => {
        const count = Number(btn.dataset.pull);
        const cost = count === 10 ? TEN_COST : PULL_COST;
        const locked = count === 1 ? (this.credits < cost && free <= 0) : this.credits < cost;
        btn.disabled = locked;
        btn.setAttribute("aria-disabled", locked ? "true" : "false");
        if (count === 1 && free > 0) {
          btn.title = `Free spin available (${free})`;
        } else {
          btn.title = locked ? `Need ${cost} Credits` : `Decrypt for ${cost} Credits`;
        }
      });
      const freeEl = document.getElementById("market-free");
      if (freeEl) freeEl.textContent = free > 0 ? `${free} free spin${free === 1 ? "" : "s"} ready` : "0 free spins";
    },

    streakBonus(maxStreak) {
      const n = Math.max(0, Math.floor(maxStreak || 0));
      if (n >= 50) return 100;
      if (n >= 30) return 50;
      if (n >= 20) return 25;
      if (n >= 10) return 10;
      return 0;
    },

    rewardFor(distance, track, escaped, maxStreak) {
      let base;
      let pct;
      if (escaped) {
        base = 100;
        pct = 100;
      } else {
        const len = Number.isFinite(track) && track > 0 ? track : TRACK;
        const ratio = Math.max(0, distance || 0) / len;
        pct = Math.min(100, Math.max(0, Math.floor(100 * ratio)));
        base = Math.min(100, Math.max(0, Math.floor(100 * ratio)));
      }
      const streak = this.streakBonus(maxStreak);
      return {
        base,
        streak,
        total: base + streak,
        escaped: !!escaped,
        pct,
        maxStreak: Math.max(0, Math.floor(maxStreak || 0)),
        label: escaped
          ? `Escape Cleared: +${base} Credits`
          : `Mission Reward: +${base} Credits (${pct}% Completion)`,
      };
    },

    roll(slot) {
      const pool = this.list(slot).filter((item) => item.rarity !== "exclusive");
      const r = Math.random();
      const rarity = r < 0.6 ? "common" : r < 0.9 ? "rare" : "legendary";
      const band = pool.filter((item) => item.rarity === rarity);
      const pick = (band.length ? band : pool)[Math.floor(Math.random() * (band.length || pool.length))];
      const dup = this.owns(slot, pick.id);
      if (!dup) {
        this.owned[slot].push(pick.id);
        this.save();
      } else {
        this.addCredits(DUP_REFUND);
      }
      return { item: pick, slot, dup };
    },

    equip(slot, id) {
      if (!this.owns(slot, id) || !this.find(slot, id)) return false;
      this.equipped[slot] = id;
      this.save();
      return true;
    },
  };

  const PROGRESS_KEY = "etb-progress";
  const DEFAULT_TITLE = "Unclassified";
  const MILESTONE_TITLES = {
    5: "Security Class II",
    10: "Special Operative",
    15: "Airlock Breaker",
    20: "Apex Ghost",
    25: "Sector Marshal",
    30: "Breach Sovereign",
    35: "Void Warden",
    40: "Protocol Zero",
    45: "Event Horizon",
    50: "Omega Clearance",
  };
  const RANK_CHIP_IDS = [
    { lv: "start-level", title: "start-title", fill: "start-xp-fill", tip: "start-xp-tip", chip: "start-rank", xp: "start-xp-text" },
    { lv: "hud-level", title: "hud-title", fill: "hud-xp-fill", tip: "hud-xp-tip", chip: "hud-rank", xp: "hud-xp-text" },
    { lv: "market-level", title: "market-title", fill: "market-xp-fill", tip: "market-xp-tip", chip: "market-rank", xp: "market-xp-text" },
  ];

  const Progress = {
    totalXp: 0,
    title: DEFAULT_TITLE,
    titles: [DEFAULT_TITLE],
    freePulls: 0,
    rewardedLevel: 1,
    milestones: [],

    xpToNext(level) {
      const lv = Math.max(1, Math.floor(level || 1));
      return Math.floor(300 * Math.pow(1.15, lv - 1) + (lv * 100));
    },

    derive(totalXp) {
      let xp = Math.max(0, Math.floor(totalXp || 0));
      let level = 1;
      while (xp >= this.xpToNext(level) && level < 999) {
        xp -= this.xpToNext(level);
        level += 1;
      }
      const need = this.xpToNext(level);
      return { level, into: xp, need, pct: need > 0 ? xp / need : 1 };
    },

    snapshot() {
      const d = this.derive(this.totalXp);
      return {
        totalXp: this.totalXp,
        level: d.level,
        into: d.into,
        need: d.need,
        pct: d.pct,
        title: this.title,
        freePulls: this.freePulls,
        milestones: [...this.milestones],
        label: `LV. ${d.level} — ${formatXp(d.into)} / ${formatXp(d.need)} XP`,
        short: `${formatXp(d.into)} / ${formatXp(d.need)} XP`,
      };
    },

    xpFor(distance, accuracy, maxStreak, netWpm, keyCount) {
      const dist = Math.floor(Math.max(0, distance || 0) / 10);
      const typed = Math.max(0, Math.floor(keyCount || 0)) > 0;
      const acc = typed ? Math.max(0, Math.round(clamp(accuracy || 0, 0, 100))) : 0;
      const streak = Math.max(0, Math.floor(maxStreak || 0)) * 2;
      const wpm = Math.max(0, Math.floor(netWpm || 0));
      return { dist, acc, streak, wpm, total: dist + acc + streak + wpm };
    },

    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
        if (raw && typeof raw === "object") {
          this.totalXp = Math.max(0, Math.floor(Number(raw.totalXp) || 0));
          this.titles = Array.isArray(raw.titles) && raw.titles.length ? raw.titles : [DEFAULT_TITLE];
          this.title = raw.title && this.titles.includes(raw.title) ? raw.title : this.titles[this.titles.length - 1];
          this.freePulls = Math.max(0, Math.floor(Number(raw.freePulls) || 0));
          this.rewardedLevel = Math.max(1, Math.floor(Number(raw.rewardedLevel) || 1));
          this.milestones = Array.isArray(raw.milestones)
            ? raw.milestones.map((n) => Math.floor(n)).filter((n) => n > 0)
            : [];
        }
      } catch { /* defaults */ }
      if (!this.titles.includes(DEFAULT_TITLE)) this.titles.unshift(DEFAULT_TITLE);
      const now = this.derive(this.totalXp).level;
      this.rewardedLevel = now;
      this.save();
      this.paintHud();
    },

    save() {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        totalXp: this.totalXp,
        level: this.derive(this.totalXp).level,
        title: this.title,
        titles: this.titles,
        freePulls: this.freePulls,
        rewardedLevel: this.rewardedLevel,
        milestones: this.milestones,
      }));
      if (typeof SaveStore !== "undefined") SaveStore.persist();
    },

    addTitle(name) {
      if (!name) return;
      if (!this.titles.includes(name)) this.titles.push(name);
      this.title = name;
    },

    milestoneTitle(level) {
      if (MILESTONE_TITLES[level]) return MILESTONE_TITLES[level];
      const tier = Math.floor(level / 5);
      return `Clearance Class ${tier}`;
    },

    rewardForLevel(level) {
      const rewards = [];
      if (level > 0 && level % 5 === 0) {
        this.freePulls += 1;
        const name = this.milestoneTitle(level);
        this.addTitle(name);
        if (!this.milestones.includes(level)) this.milestones.push(level);
        rewards.push("+500 Credits", "1 Free Gacha Pull", `Title unlocked: "${name}"`);
        if (level === 15 && !Cosmetics.owns("runner", "neon-hazard")) {
          Cosmetics.owned.runner.push("neon-hazard");
          Cosmetics.save();
          rewards.push('Runner skin unlocked: "Neon Hazard"');
        }
        return { level, credits: 500, rewards, milestone: true, title: name };
      }
      rewards.push("+50 Credits", "Rank advanced");
      return { level, credits: 50, rewards, milestone: false };
    },

    addXp(amount) {
      const gained = Math.max(0, Math.floor(amount || 0));
      const before = this.snapshot();
      this.totalXp += gained;
      const after = this.snapshot();
      const grants = [];
      let extraCredits = 0;
      for (let lv = before.level + 1; lv <= after.level; lv++) {
        const grant = this.rewardForLevel(lv);
        extraCredits += grant.credits;
        grants.push(grant);
      }
      this.rewardedLevel = after.level;
      this.save();
      if (extraCredits) Cosmetics.addCredits(extraCredits);
      this.paintHud();
      return { before, after, grants, extraCredits, gained };
    },

    paintHud() {
      const snap = this.snapshot();
      const pct = `${Math.round(snap.pct * 1000) / 10}%`;
      RANK_CHIP_IDS.forEach((ids) => {
        const lv = document.getElementById(ids.lv);
        const title = document.getElementById(ids.title);
        const fill = document.getElementById(ids.fill);
        const tip = document.getElementById(ids.tip);
        const chip = document.getElementById(ids.chip);
        if (lv) lv.textContent = `LV. ${snap.level}`;
        if (title) title.textContent = snap.title;
        if (fill) fill.style.width = pct;
        const xpEl = document.getElementById(ids.xp);
        if (xpEl) xpEl.textContent = snap.short;
        if (tip) tip.textContent = snap.label;
        if (chip) {
          chip.title = snap.label;
          chip.setAttribute("aria-label", `${snap.label}, ${snap.title}`);
        }
      });
      Cosmetics.syncPullButtons();
    },
  };

  const SaveStore = {
    records: { bestWpm: 0, maxStreak: 0, longestEndless: 0 },
    writing: false,
    ready: false,

    snapshot() {
      const snap = Progress.snapshot();
      return {
        version: 1,
        level: snap.level,
        totalXp: Progress.totalXp,
        credits: Cosmetics.credits,
        unlockedSkins: {
          runner: [...Cosmetics.owned.runner],
          monster: [...Cosmetics.owned.monster],
          sector: [...Cosmetics.owned.sector],
        },
        equipped: { ...Cosmetics.equipped },
        title: Progress.title,
        titles: [...Progress.titles],
        freePulls: Progress.freePulls,
        rewardedLevel: Progress.rewardedLevel,
        milestones: [...Progress.milestones],
        records: { ...this.records },
        scores: loadScores(),
        savedAt: Date.now(),
      };
    },

    persist() {
      if (this.writing || !this.ready) return;
      this.writing = true;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.snapshot()));
      } catch { /* quota */ }
      finally { this.writing = false; }
    },

    encode(data) {
      const json = JSON.stringify(data || this.snapshot());
      const bytes = unescape(encodeURIComponent(json));
      return SAVE_PREFIX + btoa(bytes);
    },

    decode(text) {
      let raw = String(text || "").trim();
      if (raw.startsWith(SAVE_PREFIX)) raw = raw.slice(SAVE_PREFIX.length);
      const json = decodeURIComponent(escape(atob(raw)));
      return JSON.parse(json);
    },

    validate(data) {
      if (!data || typeof data !== "object") return false;
      if (!Number.isFinite(Number(data.level))) return false;
      if (!Number.isFinite(Number(data.credits))) return false;
      return !!(data.unlockedSkins && typeof data.unlockedSkins === "object");
    },

    xpFloorFor(level) {
      const target = Math.max(1, Math.floor(level || 1));
      let xp = 0;
      for (let lv = 1; lv < target; lv++) xp += Progress.xpToNext(lv);
      return xp;
    },

    apply(data, persistAfter) {
      const skins = data.unlockedSkins || data.owned || {};
      Cosmetics.credits = Math.max(0, Math.floor(Number(data.credits) || 0));
      Cosmetics.display = Cosmetics.credits;
      Cosmetics.owned = {
        runner: Array.isArray(skins.runner) ? skins.runner.slice() : ["cyan"],
        monster: Array.isArray(skins.monster) ? skins.monster.slice() : ["ink"],
        sector: Array.isArray(skins.sector) ? skins.sector.slice() : ["industrial"],
      };
      const eq = data.equipped || {};
      Cosmetics.equipped = {
        runner: eq.runner || "cyan",
        monster: eq.monster || "ink",
        sector: eq.sector || "industrial",
      };
      ["runner", "monster", "sector"].forEach((slot) => {
        const fallback = slot === "runner" ? "cyan" : slot === "monster" ? "ink" : "industrial";
        if (!Cosmetics.owned[slot].includes(fallback)) Cosmetics.owned[slot].unshift(fallback);
        if (!Cosmetics.find(slot, Cosmetics.equipped[slot])) Cosmetics.equipped[slot] = fallback;
        if (!Cosmetics.owned[slot].includes(Cosmetics.equipped[slot])) Cosmetics.equipped[slot] = fallback;
      });

      let totalXp = Math.max(0, Math.floor(Number(data.totalXp) || 0));
      const levelHint = Math.max(1, Math.floor(Number(data.level) || 1));
      if (!Number(data.totalXp) && levelHint > 1) totalXp = this.xpFloorFor(levelHint);
      Progress.totalXp = totalXp;
      Progress.titles = Array.isArray(data.titles) && data.titles.length ? data.titles.slice() : [DEFAULT_TITLE];
      if (!Progress.titles.includes(DEFAULT_TITLE)) Progress.titles.unshift(DEFAULT_TITLE);
      Progress.title = data.title && Progress.titles.includes(data.title)
        ? data.title
        : Progress.titles[Progress.titles.length - 1];
      Progress.freePulls = Math.max(0, Math.floor(Number(data.freePulls) || 0));
      Progress.milestones = Array.isArray(data.milestones)
        ? data.milestones.map((n) => Math.floor(n)).filter((n) => n > 0)
        : [];
      Progress.rewardedLevel = Progress.derive(Progress.totalXp).level;

      const rec = data.records || {};
      this.records = {
        bestWpm: Math.max(0, Number(rec.bestWpm) || 0),
        maxStreak: Math.max(0, Math.floor(Number(rec.maxStreak) || 0)),
        longestEndless: Math.max(0, Number(rec.longestEndless) || 0),
      };

      if (data.scores && typeof data.scores === "object") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.scores));
      }

      this.ready = true;
      if (persistAfter !== false) {
        Cosmetics.save();
        Progress.save();
      }
      Cosmetics.paint();
      Progress.paintHud();
      if (typeof Game !== "undefined" && Game.renderLocker) {
        Game.renderLocker();
        Game.renderScores();
      }
      return Progress.snapshot().level;
    },

    migrateLegacy() {
      const credits = Number(localStorage.getItem(CREDITS_KEY));
      let owned;
      let equipped;
      try {
        const raw = JSON.parse(localStorage.getItem(COSMETICS_KEY) || "null");
        if (raw && typeof raw === "object") {
          owned = raw.owned;
          equipped = raw.equipped;
        }
      } catch { /* ignore */ }
      let progress = {};
      try {
        progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}") || {};
      } catch { progress = {}; }
      const scores = loadScores();
      let bestWpm = 0;
      let longestEndless = 0;
      Object.values(scores).forEach((rows) => {
        (rows || []).forEach((s) => {
          bestWpm = Math.max(bestWpm, Number(s.wpm) || 0);
          if (s.endless) longestEndless = Math.max(longestEndless, Number(s.distance) || 0);
        });
      });
      const derivedLevel = Progress.derive(progress.totalXp || 0).level;
      return {
        version: 1,
        level: progress.level || derivedLevel || 1,
        totalXp: progress.totalXp || 0,
        credits: Number.isFinite(credits) && credits >= 0 ? Math.floor(credits) : 0,
        unlockedSkins: owned || { runner: ["cyan"], monster: ["ink"], sector: ["industrial"] },
        equipped: equipped || { runner: "cyan", monster: "ink", sector: "industrial" },
        title: progress.title,
        titles: progress.titles,
        freePulls: progress.freePulls,
        rewardedLevel: progress.rewardedLevel,
        milestones: progress.milestones,
        records: { bestWpm, maxStreak: 0, longestEndless },
        scores,
      };
    },

    boot() {
      let data = null;
      try {
        data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      } catch { data = null; }
      if (!this.validate(data)) data = this.migrateLegacy();
      this.apply(data, false);
      this.ready = true;
      Cosmetics.save();
      Progress.save();
    },

    noteRun(entry, maxStreak) {
      const wpm = Math.max(0, Number(entry.wpm) || 0);
      const streak = Math.max(0, Math.floor(maxStreak || 0));
      const dist = Math.max(0, Number(entry.distance) || 0);
      if (wpm > this.records.bestWpm) this.records.bestWpm = wpm;
      if (streak > this.records.maxStreak) this.records.maxStreak = streak;
      if (entry.endless && dist > this.records.longestEndless) this.records.longestEndless = dist;
      this.persist();
    },

    toast(message, kind) {
      const el = document.getElementById("app-toast");
      if (!el) return;
      el.hidden = false;
      el.className = `app-toast ${kind || ""}`;
      el.textContent = message;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
    },

    download() {
      const data = this.snapshot();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "escape_the_breach_save.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
      this.toast("Backup file downloaded.");
    },

    copyCode() {
      const code = this.encode();
      const out = document.getElementById("save-code-out");
      if (out) out.value = code;
      const done = () => this.toast("Save code copied to clipboard!");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => {
          if (out) {
            out.focus();
            out.select();
            document.execCommand("copy");
          }
          done();
        });
        return;
      }
      if (out) {
        out.focus();
        out.select();
        document.execCommand("copy");
      }
      done();
    },

    importObject(data) {
      if (!this.validate(data)) {
        this.toast("Invalid save data", "error");
        return false;
      }
      const level = this.apply(data, true);
      this.refreshExport();
      this.toast(`Data restored! Level ${level} loaded.`);
      return true;
    },

    importCode(text) {
      try {
        return this.importObject(this.decode(text));
      } catch {
        this.toast("Invalid save data", "error");
        return false;
      }
    },

    importFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ""));
          this.importObject(data);
        } catch {
          this.toast("Invalid save data", "error");
        }
      };
      reader.onerror = () => this.toast("Invalid save data", "error");
      reader.readAsText(file);
    },

    reset() {
      const input = document.getElementById("reset-confirm");
      if (!input || input.value.trim() !== "RESET") {
        this.toast("Type RESET to confirm.", "error");
        return;
      }
      input.value = "";
      this.records = { bestWpm: 0, maxStreak: 0, longestEndless: 0 };
      Cosmetics.credits = 0;
      Cosmetics.display = 0;
      Cosmetics.owned = { runner: ["cyan"], monster: ["ink"], sector: ["industrial"] };
      Cosmetics.equipped = { runner: "cyan", monster: "ink", sector: "industrial" };
      Progress.totalXp = 0;
      Progress.title = DEFAULT_TITLE;
      Progress.titles = [DEFAULT_TITLE];
      Progress.freePulls = 0;
      Progress.milestones = [];
      Progress.rewardedLevel = 1;
      localStorage.removeItem(STORAGE_KEY);
      Cosmetics.save();
      Progress.save();
      Cosmetics.paint();
      Progress.paintHud();
      if (typeof Game !== "undefined") {
        Game.renderLocker();
        Game.renderScores();
      }
      this.refreshExport();
      this.toast("All progress erased.");
    },

    refreshExport() {
      const out = document.getElementById("save-code-out");
      if (out) out.value = this.encode();
    },
  };

  /* ------------------------------------------------------------------ */
  /* Audio                                                               */
  /* ------------------------------------------------------------------ */

  const AudioSystem = {
    ctx: null,
    master: null,
    muted: localStorage.getItem(MUTE_KEY) === "1",
    sirenNodes: null,
    rumbleNodes: null,
    music: null,

    ensure() {
      if (this.ctx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      try {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        this.master = null;
      }
    },

    resume() {
      this.ensure();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },

    setMuted(muted) {
      this.muted = muted;
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
      if (this.master) this.master.gain.value = muted ? 0 : 0.32;
    },

    toggle() {
      this.setMuted(!this.muted);
      return this.muted;
    },

    beep(freq, dur, type, vol, slide) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },

    noise(dur, vol, hp) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = hp;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      src.start(t);
    },

    click() {
      this.beep(2100 + Math.random() * 400, 0.018, "square", 0.09);
      this.noise(0.012, 0.04, 1800);
    },

    buzz() {
      this.beep(90, 0.14, "sawtooth", 0.16, 55);
    },

    noiseBuffer() {
      if (this._noise && this.ctx) return this._noise;
      if (!this.ctx) return null;
      const len = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this._noise = buffer;
      return buffer;
    },

    startAmbience() {
      this.ensure();
      if (!this.ctx) return;
      this.stopAmbience(true);
      const t = this.ctx.currentTime;

      const rumble = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumble.type = "sine";
      rumble.frequency.value = 42;
      rumbleGain.gain.value = 0.001;
      rumble.connect(rumbleGain);
      rumbleGain.connect(this.master);
      rumble.start(t);
      this.rumbleNodes = { rumble, rumbleGain };
    },

    startMusic() {
      if (!this.ctx || this.music) return;
      const t = this.ctx.currentTime;
      const bus = this.ctx.createGain();
      bus.gain.setValueAtTime(0.0001, t);
      bus.gain.exponentialRampToValueAtTime(0.58, t + 0.22);
      bus.connect(this.master);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = "lowpass";
      bassFilter.frequency.setValueAtTime(500, t);
      bassFilter.Q.setValueAtTime(9.4, t);

      const bassGain = this.ctx.createGain();
      bassGain.gain.value = 0.0001;
      bassFilter.connect(bassGain);
      bassGain.connect(bus);

      const bassA = this.ctx.createOscillator();
      const bassB = this.ctx.createOscillator();
      bassA.type = "sawtooth";
      bassB.type = "sawtooth";
      bassA.frequency.setValueAtTime(73.42, t);
      bassB.frequency.setValueAtTime(73.42, t);
      bassB.detune.setValueAtTime(7, t);
      bassA.connect(bassFilter);
      bassB.connect(bassFilter);
      bassA.start(t);
      bassB.start(t);

      const warnGain = this.ctx.createGain();
      warnGain.gain.value = 0.0001;
      warnGain.connect(bus);

      const siren = this.ctx.createOscillator();
      const sirenB = this.ctx.createOscillator();
      const sirenLfo = this.ctx.createOscillator();
      const sirenMod = this.ctx.createGain();
      siren.type = "sine";
      sirenB.type = "triangle";
      siren.frequency.setValueAtTime(488, t);
      sirenB.frequency.setValueAtTime(732, t);
      sirenLfo.type = "sine";
      sirenLfo.frequency.setValueAtTime(1.7, t);
      sirenMod.gain.value = 92;
      sirenLfo.connect(sirenMod);
      sirenMod.connect(siren.frequency);
      siren.connect(warnGain);
      sirenB.connect(warnGain);
      siren.start(t);
      sirenB.start(t);
      sirenLfo.start(t);

      this.music = {
        bus,
        bassFilter,
        bassGain,
        bassA,
        bassB,
        warnGain,
        siren,
        sirenB,
        sirenLfo,
        sirenMod,
        step: 0,
        nextTime: t + 0.02,
        boosting: false,
        gap: 999,
        notes: [
          73.42, 73.42, 87.31, 98.00, 116.54,
          73.42, 87.31, 98.00, 73.42, 73.42,
          87.31, 98.00, 116.54, 116.54, 87.31, 73.42,
        ],
      };
      this.scheduleMusic();
    },

    ensureMusic() {
      this.resume();
      if (!this.music) this.startMusic();
    },

    scheduleMusic() {
      if (!this.ctx || !this.music) return;
      const horizon = this.ctx.currentTime + 0.22;
      while (this.music && this.music.nextTime < horizon) {
        this.playMusicStep(this.music.step, this.music.nextTime);
        this.music.nextTime += MUSIC_STEP;
        this.music.step = (this.music.step + 1) % 16;
      }
    },

    playMusicStep(step, when) {
      const m = this.music;
      if (!m || !this.ctx) return;
      const boost = m.boosting;

      if (step % 4 === 0) this.synthKick(when);
      if (step === 4 || step === 12) this.synthSnare(when);

      const hatVel = 0.018 + ((step * 5 + 3) % 8) * 0.0042 + (step % 4 === 2 ? 0.01 : 0);
      this.synthHat(when, hatVel);
      if (boost) this.synthHat(when + MUSIC_STEP * 0.5, hatVel * 0.72);

      const note = m.notes[step];
      const freq = boost ? note * 1.05946 : note;
      m.bassA.frequency.setValueAtTime(freq, when);
      m.bassB.frequency.setValueAtTime(freq, when);
      const accent = step % 4 === 0 ? 0.22 : 0.15;
      m.bassGain.gain.cancelScheduledValues(when);
      m.bassGain.gain.setValueAtTime(accent, when);
      m.bassGain.gain.exponentialRampToValueAtTime(0.07, when + MUSIC_STEP * 0.85);
    },

    synthKick(when) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(168, when);
      osc.frequency.exponentialRampToValueAtTime(38, when + 0.1);
      g.gain.setValueAtTime(0.78, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
      osc.connect(g);
      g.connect(this.music.bus);
      osc.start(when);
      osc.stop(when + 0.22);

      const click = this.ctx.createBufferSource();
      click.buffer = this.noiseBuffer();
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1400;
      const cg = this.ctx.createGain();
      cg.gain.setValueAtTime(0.12, when);
      cg.gain.exponentialRampToValueAtTime(0.001, when + 0.025);
      click.connect(hp);
      hp.connect(cg);
      cg.connect(this.music.bus);
      click.start(when);
      click.stop(when + 0.03);
    },

    synthSnare(when) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2100;
      bp.Q.value = 0.75;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.24, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.13);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.music.bus);
      src.start(when);
      src.stop(when + 0.15);

      const tone = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(188, when);
      tone.frequency.exponentialRampToValueAtTime(108, when + 0.08);
      tg.gain.setValueAtTime(0.07, when);
      tg.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
      tone.connect(tg);
      tg.connect(this.music.bus);
      tone.start(when);
      tone.stop(when + 0.1);
    },

    synthHat(when, vol) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7800;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.028);
      src.connect(hp);
      hp.connect(g);
      g.connect(this.music.bus);
      src.start(when);
      src.stop(when + 0.04);
    },

    updateRumble(proximity) {
      if (!this.rumbleNodes || !this.ctx) return;
      const g = 0.001 + proximity * 0.12;
      this.rumbleNodes.rumbleGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.08);
      this.rumbleNodes.rumble.frequency.setTargetAtTime(38 + proximity * 28, this.ctx.currentTime, 0.1);
    },

    updateMusic(gap, remaining, boosting) {
      this.scheduleMusic();
      if (!this.music || !this.ctx) return;
      this.music.boosting = !!boosting;
      this.music.gap = gap;
      const now = this.ctx.currentTime;
      const close = clamp(1 - gap / 50, 0, 1);
      const cutoff = gap > 100 ? 500 : 500 + close * 2500;
      this.music.bassFilter.frequency.setTargetAtTime(cutoff, now, 0.09);
      this.music.bassFilter.Q.setTargetAtTime(8.6 + close * 4.2, now, 0.12);
      const warn = gap < 20 ? clamp((20 - gap) / 20, 0, 1) * 0.045 : 0.0001;
      this.music.warnGain.gain.setTargetAtTime(Math.max(0.0001, warn), now, 0.08);
      this.music.bassA.detune.setTargetAtTime(boosting ? 85 : 0, now, 0.05);
      this.music.bassB.detune.setTargetAtTime(boosting ? 102 : 7, now, 0.05);
    },

    teardownMusic(handle) {
      if (!handle) return;
      ["bassA", "bassB", "siren", "sirenB", "sirenLfo"].forEach((key) => {
        try { handle[key].stop(); } catch { /* already stopped */ }
        try { handle[key].disconnect(); } catch { /* */ }
      });
      ["bassFilter", "bassGain", "warnGain", "sirenMod", "bus"].forEach((key) => {
        try { handle[key].disconnect(); } catch { /* */ }
      });
    },

    stopMusic(immediate) {
      if (!this.music || !this.ctx) {
        this.music = null;
        return;
      }
      const handle = this.music;
      this.music = null;
      const t = this.ctx.currentTime;
      try {
        handle.bus.gain.cancelScheduledValues(t);
        handle.bus.gain.setValueAtTime(Math.max(0.0001, handle.bus.gain.value), t);
        if (immediate) handle.bus.gain.setValueAtTime(0.0001, t);
        else handle.bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      } catch { /* */ }
      const delay = immediate ? 0 : 450;
      setTimeout(() => this.teardownMusic(handle), delay);
    },

    stopAmbience(immediate) {
      const stop = (nodes) => {
        if (!nodes) return;
        Object.values(nodes).forEach((n) => {
          try {
            if (n.stop) n.stop();
            if (n.disconnect) n.disconnect();
          } catch {
            /* already stopped */
          }
        });
      };
      this.stopMusic(immediate);
      stop(this.sirenNodes);
      stop(this.rumbleNodes);
      this.sirenNodes = null;
      this.rumbleNodes = null;
    },

    slam() {
      this.beep(140, 0.55, "sawtooth", 0.28, 28);
      this.noise(0.4, 0.22, 120);
    },

    victory() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.28, "triangle", 0.14), i * 140);
      });
    },

    gachaTick(i) {
      this.beep(1400 + (i % 7) * 90, 0.03, "square", 0.05);
    },

    gachaCharge() {
      this.beep(180, 0.4, "sine", 0.12, 420);
      this.noise(0.16, 0.05, 600);
    },

    gachaTierUp(tier) {
      if (tier === "rare") {
        this.beep(392, 0.16, "triangle", 0.12);
        this.beep(523, 0.2, "sine", 0.1);
        this.noise(0.12, 0.06, 900);
        return;
      }
      this.beep(80, 0.38, "sawtooth", 0.22, 40);
      this.beep(523, 0.18, "triangle", 0.12);
      this.beep(784, 0.24, "sine", 0.14);
      this.noise(0.22, 0.1, 400);
    },

    gachaReveal(rarity) {
      const legendary = rarity === "legendary" || rarity === true;
      const rare = rarity === "rare";
      this.beep(70, 0.32, "sine", 0.26, 38);
      if (legendary) {
        this.beep(880, 0.28, "triangle", 0.16);
        this.noise(0.28, 0.14, 180);
        [1046, 1318, 1568, 2093].forEach((f, i) => {
          setTimeout(() => this.beep(f, 0.24, "square", 0.1), 80 + i * 90);
        });
        return;
      }
      if (rare) {
        this.beep(659, 0.22, "triangle", 0.14);
        [784, 988].forEach((f, i) => {
          setTimeout(() => this.beep(f, 0.16, "sine", 0.1), 70 + i * 80);
        });
        return;
      }
      this.beep(520, 0.18, "triangle", 0.12);
    },

    streakChime(at) {
      this.ensure();
      const roots = { 10: 523, 20: 659, 30: 784, 50: 1046 };
      const root = roots[at] || 523;
      [0, 4, 7, 12].forEach((semi, i) => {
        const freq = root * Math.pow(2, semi / 12);
        setTimeout(() => this.beep(freq, 0.11 + i * 0.03, "sine", 0.055 + i * 0.012), i * 52);
      });
    },

    levelUp() {
      this.ensure();
      const notes = [392, 523, 659, 784, 1046, 1318];
      notes.forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.16, "triangle", 0.11), i * 68);
      });
      setTimeout(() => this.beep(1568, 0.42, "sine", 0.14), 430);
      this.noise(0.18, 0.08, 900);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Typing                                                              */
  /* ------------------------------------------------------------------ */

  const TextGen = {
    mode: "mix",
    punctuation: true,
    recent: [],
    setIndex: -1,
    lineIndex: 0,
    lastNatural: "",
    lastCode: "",
    mixPreferHorror: true,

    reset() {
      this.recent = [];
      this.setIndex = -1;
      this.lineIndex = 0;
      this.lastNatural = "";
      this.lastCode = "";
      this.mixPreferHorror = Math.random() < 0.6;
    },

    remember(sentence) {
      this.recent.push(sentence);
      if (this.recent.length > 14) this.recent.shift();
    },

    tokenize(sentence) {
      return String(sentence || "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
    },

    styleWord(word) {
      if (!word) return "";
      if (this.mode === "code") {
        return this.punctuation ? word : word.replace(/[^a-zA-Z0-9]/g, "") || word;
      }
      if (!this.punctuation) {
        return word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      }
      return word;
    },

    wordsFrom(sentences) {
      const out = [];
      sentences.forEach((sentence) => {
        this.tokenize(sentence).forEach((raw) => {
          const word = this.styleWord(raw);
          if (word) out.push(word);
        });
      });
      return out;
    },

    pickFrom(list, avoid) {
      const fresh = list.filter((item) => item && item !== avoid && !this.recent.includes(item));
      const pool = fresh.length ? fresh : list.filter((item) => item && item !== avoid);
      const src = pool.length ? pool : list;
      return src[Math.floor(Math.random() * src.length)] || list[0];
    },

    nextHorrorSet() {
      const choices = HORROR_SETS.map((_, i) => i).filter((i) => i !== this.setIndex);
      this.setIndex = choices[Math.floor(Math.random() * choices.length)];
      this.lineIndex = 0;
    },

    nextHorrorSentence() {
      if (this.setIndex < 0 || this.lineIndex >= HORROR_SETS[this.setIndex].length) {
        this.nextHorrorSet();
      }
      const sentence = HORROR_SETS[this.setIndex][this.lineIndex];
      this.lineIndex += 1;
      this.remember(sentence);
      return sentence;
    },

    nextNaturalSentence() {
      const sentence = this.pickFrom(NATURAL_PASSAGES, this.lastNatural);
      this.lastNatural = sentence;
      this.remember(sentence);
      return sentence;
    },

    nextCodeLine() {
      const sentence = this.pickFrom(CODE_LINES, this.lastCode);
      this.lastCode = sentence;
      this.remember(sentence);
      return sentence;
    },

    nextSentence() {
      if (this.mode === "code") return this.nextCodeLine();
      if (this.mode === "standard") return this.nextNaturalSentence();
      if (this.mode === "lore") return this.nextHorrorSentence();
      if (this.setIndex >= 0 && this.lineIndex < HORROR_SETS[this.setIndex].length) {
        return this.nextHorrorSentence();
      }
      return Math.random() < 0.58 ? this.nextHorrorSentence() : this.nextNaturalSentence();
    },

    takeSentences(count) {
      const n = Math.max(1, count);
      const out = [];
      for (let i = 0; i < n; i++) out.push(this.nextSentence());
      return out.filter(Boolean);
    },

    seedWords() {
      const count = Math.random() < 0.55 ? 3 : 2;
      if (this.mode === "code" || this.mode === "standard") {
        return this.wordsFrom(this.takeSentences(count));
      }
      const useHorror = this.mode === "lore" || Math.random() < 0.62;
      if (useHorror) {
        this.nextHorrorSet();
        const set = HORROR_SETS[this.setIndex];
        const n = Math.min(count, set.length);
        const chunk = [];
        for (let i = 0; i < n; i++) chunk.push(this.nextHorrorSentence());
        return this.wordsFrom(chunk);
      }
      return this.wordsFrom(Array.from({ length: count }, () => this.nextNaturalSentence()));
    },

    appendSentence() {
      return this.wordsFrom(this.takeSentences(1));
    },
  };

  function createTyping() {
    return {
      words: [],
      states: [],
      extras: [],
      wordIndex: 0,
      letterIndex: 0,
      errored: false,
      totalKeys: 0,
      correctKeys: 0,
      recent: [],
      streak: 0,
      maxStreak: 0,
      wpmLog: [],
      adrenaline: 0,
      boostLeft: 0,
      stallLeft: 0,
      startedAt: 0,
      stallSec: STALL_SEC,
      dirty: [0],

      armTimer() {
        if (!this.startedAt) this.startedAt = performance.now();
      },

      elapsedSeconds() {
        if (!this.startedAt) return 0;
        return (performance.now() - this.startedAt) / 1000;
      },

      uncorrectedErrors() {
        let n = 0;
        const last = Math.min(this.wordIndex, this.states.length - 1);
        for (let i = 0; i <= last; i++) {
          for (const s of this.states[i] || []) {
            if (s === "incorrect" || s === "missed") n += 1;
          }
          n += (this.extras[i] || "").length;
        }
        return n;
      },

      pushWords(list) {
        list.forEach((word) => {
          if (!word) return;
          this.words.push(word);
          this.states.push(Array(word.length).fill(""));
          this.extras.push("");
        });
      },

      ensureWords() {
        while (this.words.length - this.wordIndex < 12) {
          this.pushWords(TextGen.appendSentence());
        }
      },

      start(opts) {
        const options = opts || {};
        TextGen.mode = options.textMode || "mix";
        TextGen.punctuation = options.punctuation !== false;
        TextGen.reset();
        this.words = [];
        this.states = [];
        this.extras = [];
        this.wordIndex = 0;
        this.letterIndex = 0;
        this.errored = false;
        this.totalKeys = 0;
        this.correctKeys = 0;
        this.recent = [];
        this.streak = 0;
        this.maxStreak = 0;
        this.wpmLog = [];
        this.adrenaline = 0;
        this.boostLeft = 0;
        this.stallLeft = 0;
        this.startedAt = 0;
        this.stallSec = options.stall != null ? options.stall : STALL_SEC;
        this.pushWords(TextGen.seedWords());
        this.ensureWords();
        this.dirty = [0];
      },

      elapsedMin(minSeconds) {
        const sec = Math.max(this.elapsedSeconds(), minSeconds || 0);
        return sec / 60;
      },

      rawWpm() {
        const minutes = this.elapsedMin(1);
        if (!this.startedAt) return 0;
        return (this.totalKeys / 5) / minutes;
      },

      wpm() {
        const minutes = this.elapsedMin(1);
        if (!this.startedAt) return 0;
        return Math.max(0, (this.correctKeys / 5) - this.uncorrectedErrors()) / minutes;
      },

      liveWpm() {
        if (!this.startedAt || this.elapsedSeconds() < 1) return null;
        const minutes = this.elapsedSeconds() / 60;
        return Math.max(0, (this.correctKeys / 5) - this.uncorrectedErrors()) / minutes;
      },

      accuracy() {
        if (this.totalKeys === 0) return 100;
        return (this.correctKeys / this.totalKeys) * 100;
      },

      recentCps(now) {
        const cut = now - 2000;
        this.recent = this.recent.filter((t) => t > cut);
        return this.recent.length / 2;
      },

      burstCps(now) {
        const cut = now - 380;
        return this.recent.filter((t) => t > cut).length / 0.38;
      },

      markDirty(i) {
        if (!this.dirty.includes(i)) this.dirty.push(i);
      },

      currentWord() {
        return this.words[this.wordIndex] || "";
      },

      wordHasError(i) {
        const extras = this.extras[i] || "";
        return extras.length > 0 || (this.states[i] || []).some((s) => s === "incorrect" || s === "missed");
      },

      activateBoost() {
        this.boostLeft = ADRENALINE_SEC;
        this.adrenaline = ADRENALINE_WORDS;
      },

      penalize() {
        this.errored = true;
        this.streak = 0;
        if (this.boostLeft <= 0) this.adrenaline = 0;
        this.stallLeft = this.stallSec;
      },

      finishWord() {
        const i = this.wordIndex;
        const word = this.words[i];
        if (this.letterIndex < word.length) {
          for (let li = this.letterIndex; li < word.length; li++) this.states[i][li] = "missed";
        }
        const clean = !this.wordHasError(i) && this.letterIndex >= word.length;
        if (clean) {
          this.streak += 1;
          if (this.streak > this.maxStreak) this.maxStreak = this.streak;
          if (this.boostLeft <= 0) {
            this.adrenaline += 1;
            if (this.adrenaline >= ADRENALINE_WORDS) this.activateBoost();
          }
        } else {
          this.streak = 0;
          if (this.boostLeft <= 0) this.adrenaline = 0;
        }
        this.markDirty(i);
        this.wordIndex += 1;
        this.letterIndex = 0;
        this.errored = !clean;
        this.ensureWords();
        this.markDirty(this.wordIndex);
        return clean ? "ok" : "err";
      },

      handleKey(key, now) {
        if (key === "Shift") {
          if (this.adrenaline >= ADRENALINE_WORDS && this.boostLeft <= 0) {
            this.activateBoost();
            return "boost";
          }
          return null;
        }
        if (key === "Backspace") return this.backspace();
        if (key === " ") return this.space();
        if (key.length !== 1) return null;
        return this.typeChar(key, now);
      },

      typeChar(key, now) {
        const word = this.currentWord();
        if (!word) return null;
        this.armTimer();
        const i = this.wordIndex;
        this.totalKeys += 1;

        if (this.letterIndex >= word.length) {
          if (this.extras[i].length >= 12) return "extra";
          this.extras[i] += key;
          this.markDirty(i);
          this.penalize();
          return "extra";
        }

        if (key === word[this.letterIndex]) {
          this.states[i][this.letterIndex] = "correct";
          this.correctKeys += 1;
          this.recent.push(now);
          this.errored = false;
          this.stallLeft = 0;
        } else {
          this.states[i][this.letterIndex] = "incorrect";
          this.penalize();
        }
        this.letterIndex += 1;
        this.markDirty(i);
        return this.errored ? "err" : "ok";
      },

      space() {
        if (this.letterIndex === 0 && !(this.extras[this.wordIndex] || "")) return null;
        this.armTimer();
        if (this.letterIndex < this.currentWord().length) this.penalize();
        return this.finishWord();
      },

      backspace() {
        const i = this.wordIndex;
        if (this.extras[i]) {
          this.extras[i] = this.extras[i].slice(0, -1);
          this.markDirty(i);
          this.errored = this.wordHasError(i);
          if (!this.errored) this.stallLeft = 0;
          return "back";
        }
        if (this.letterIndex > 0) {
          this.letterIndex -= 1;
          const wasCorrect = this.states[i][this.letterIndex] === "correct";
          if (wasCorrect) this.correctKeys = Math.max(0, this.correctKeys - 1);
          this.states[i][this.letterIndex] = "";
          this.totalKeys = Math.max(0, this.totalKeys - 1);
          this.markDirty(i);
          this.errored = this.wordHasError(i);
          if (!this.errored) this.stallLeft = 0;
          return "back";
        }
        if (i === 0) return "back";
        const prev = i - 1;
        if (!this.wordHasError(prev)) return "back";
        this.wordIndex = prev;
        this.letterIndex = this.words[prev].length;
        this.states[prev] = this.states[prev].map((s) => (s === "missed" ? "" : s));
        while (
          this.letterIndex > 0 &&
          !this.states[prev][this.letterIndex - 1]
        ) {
          this.letterIndex -= 1;
        }
        this.errored = this.wordHasError(prev);
        if (!this.errored) this.stallLeft = 0;
        this.markDirty(prev);
        this.markDirty(i);
        return "back";
      },

      tick(dt) {
        if (this.stallLeft > 0) this.stallLeft = Math.max(0, this.stallLeft - dt);
        if (this.boostLeft > 0) {
          this.boostLeft = Math.max(0, this.boostLeft - dt);
          if (this.boostLeft <= 0) this.adrenaline = 0;
        }
      },
    };
  }

  const WordsView = {
    scrollY: 0,
    idleTimer: 0,

    mount() {
      this.container = $("words-container");
      this.list = $("words");
      this.caret = $("caret");
    },

    rebuild(typing) {
      this.list.replaceChildren();
      typing.words.forEach((word, wi) => {
        this.list.appendChild(this.makeWord(word, typing.states[wi], typing.extras[wi]));
      });
      this.scrollY = 0;
      this.list.style.transform = "translateY(0)";
      this.container.classList.remove("scrolled");
      this.sync(typing, true);
    },

    makeWord(word, states, extras) {
      const wrap = document.createElement("span");
      wrap.className = "word";
      for (let i = 0; i < word.length; i++) {
        wrap.appendChild(this.makeLetter(word[i], states[i]));
      }
      for (const ch of extras || "") {
        wrap.appendChild(this.makeLetter(ch, "extra"));
      }
      return wrap;
    },

    makeLetter(ch, state) {
      const el = document.createElement("span");
      el.className = "letter";
      if (state && state !== "") el.classList.add(state === "missed" ? "incorrect" : state);
      el.textContent = ch;
      return el;
    },

    appendNewWords(typing) {
      while (this.list.children.length < typing.words.length) {
        const i = this.list.children.length;
        this.list.appendChild(this.makeWord(typing.words[i], typing.states[i], typing.extras[i]));
      }
    },

    paintWord(typing, i) {
      const wordEl = this.list.children[i];
      if (!wordEl) return;
      const next = this.makeWord(typing.words[i], typing.states[i], typing.extras[i]);
      wordEl.replaceWith(next);
    },

    lineHeight() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--line-h");
      const n = parseFloat(raw);
      return Number.isFinite(n) && n > 0 ? n : 42;
    },

    visibleLines() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--visible-lines");
      const n = parseInt(raw, 10);
      return n === 2 ? 2 : 3;
    },

    sync(typing, instant) {
      this.appendNewWords(typing);
      const dirty = typing.dirty.splice(0);
      dirty.forEach((i) => this.paintWord(typing, i));

      const wordEl = this.list.children[typing.wordIndex];
      if (!wordEl) return;
      const letters = wordEl.querySelectorAll(".letter");
      const extras = typing.extras[typing.wordIndex] || "";
      let anchor = letters[0];
      let after = false;
      if (extras.length && letters.length) {
        anchor = letters[letters.length - 1];
        after = true;
      } else if (typing.letterIndex > 0 && typing.letterIndex >= (typing.words[typing.wordIndex] || "").length) {
        anchor = letters[Math.max(0, typing.letterIndex - 1)] || letters[letters.length - 1];
        after = true;
      } else if (letters[typing.letterIndex]) {
        anchor = letters[typing.letterIndex];
      }

      if (!anchor) return;
      const x = anchor.offsetLeft + (after ? anchor.offsetWidth : 0);
      const y = anchor.offsetTop;
      const lh = this.lineHeight();
      const line = Math.round(y / lh);
      const shown = this.visibleLines();
      const target = shown <= 2 ? line * lh : (line >= 1 ? (line - 1) * lh : 0);
      if (instant) {
        this.caret.style.transition = "none";
        this.list.style.transition = "none";
      }
      this.scrollY = target;
      this.list.style.transform = `translateY(-${target}px)`;
      this.container.classList.toggle("scrolled", target > 0);
      this.caret.style.left = `${x}px`;
      this.caret.style.top = `${y - target}px`;
      if (instant) {
        void this.list.offsetWidth;
        this.caret.style.removeProperty("transition");
        this.list.style.removeProperty("transition");
      }

      this.caret.classList.remove("idle");
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.caret.classList.add("idle"), 520);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Race                                                                */
  /* ------------------------------------------------------------------ */

  function createRace(cfg) {
    const track = cfg.endless ? Infinity : (cfg.track || TRACK);
    const refTrack = Number.isFinite(track) ? track : 1000;
    const refTime = cfg.doorTime > 0 ? cfg.doorTime * 0.82 : 80;
    const targetCps = (cfg.targetWpm * 5) / 60;
    const targetSpeed = refTrack / refTime;

    return {
      diff: cfg,
      track,
      targetCps,
      targetSpeed,
      peakWpm: 0,
      player: 0,
      monster: cfg.monsterOff ? -4000 : -Math.max(160, cfg.startGap || 160),
      speed: 0,
      doorOpen: 1,
      elapsed: 0,
      result: null,
      lastAccelMark: 0,
      footKick: false,
      doorSecondsLeft: 99,

      nudge(ok) {
        if (!ok) {
          this.speed *= 0.52;
          return;
        }
        this.speed += this.targetSpeed * 0.2;
        this.speed = clamp(this.speed, this.targetSpeed * 0.3, this.targetSpeed * 1.9);
        this.player += Math.max(0.5, this.targetSpeed * 0.014);
        this.footKick = true;
      },

      huntWpm(typing) {
        const live = typing.liveWpm();
        if (live != null && live > this.peakWpm) this.peakWpm = live;
        let wpm = cfg.monsterWpm;
        if (cfg.adaptive) wpm = Math.max(wpm, this.peakWpm * (cfg.adaptiveMult || 1.05));
        if (cfg.endless) wpm += Math.floor(this.player / 100) * 4;
        return wpm;
      },

      update(dt, typing, now) {
        if (this.result) return;
        this.elapsed += dt;

        if (cfg.doorOff || !cfg.doorTime) {
          this.doorOpen = 1;
          this.doorSecondsLeft = 99;
        } else {
          let rate = 1 / cfg.doorTime;
          if (cfg.doorAccelFinal && Number.isFinite(this.track) && this.player > this.track - 300) {
            rate *= 2.15;
          }
          this.doorOpen = clamp(this.doorOpen - rate * dt, 0, 1);
          this.doorSecondsLeft = this.doorOpen / Math.max(rate, 0.0001);
        }

        const cps = typing.recentCps(now);
        let desired = (cps / this.targetCps) * this.targetSpeed;
        desired = clamp(desired, 0, this.targetSpeed * 1.85);
        if (typing.boostLeft > 0) desired *= ADRENALINE_MULT;
        if (typing.stallLeft > 0) {
          this.speed *= Math.exp(-3.1 * dt);
        } else {
          const follow = 12;
          this.speed = lerp(this.speed, Math.max(desired, this.speed * 0.48), 1 - Math.exp(-follow * dt));
        }
        this.player += this.speed * dt;

        if (!cfg.monsterOff) {
          const hunt = this.huntWpm(typing);
          let mSpeed = this.targetSpeed * (hunt / Math.max(cfg.targetWpm, 1)) * 1.04;
          let wake = 0;
          const wakeHold = cfg.wakeSec != null ? cfg.wakeSec : 1.3;
          const wakeRate = cfg.wakeRate != null ? cfg.wakeRate : 0.5;
          if (typing.startedAt) {
            const age = (now - typing.startedAt) / 1000;
            if (age < wakeHold) wake = wakeRate;
            else if (age < wakeHold + 0.55) wake = lerp(wakeRate, 1, (age - wakeHold) / 0.55);
            else wake = 1;
          }
          mSpeed *= wake;
          if (cfg.huntDrive) mSpeed *= cfg.huntDrive;
          const gap = this.player - this.monster;
          if (gap > 230) mSpeed *= cfg.gapCatchup || 1.1;
          else if (gap < 80 && wake >= 1) mSpeed *= cfg.closeAccel || 1;
          this.monster += mSpeed * dt;
        }

        const finite = Number.isFinite(this.track);
        if (finite && this.player >= this.track && this.doorOpen > 0) {
          this.player = this.track;
          this.result = "win";
        } else if (!cfg.monsterOff && this.monster >= this.player) {
          this.monster = this.player;
          this.result = "lose-catch";
        } else if (!cfg.doorOff && this.doorOpen <= 0 && (!finite || this.player < this.track)) {
          this.doorOpen = 0;
          this.result = "lose-door";
        }
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Renderer                                                            */
  /* ------------------------------------------------------------------ */

  const Renderer = {
    canvas: null,
    ctx: null,
    w: 1,
    h: 1,
    scroll: 0,
    steam: [],
    dust: [],
    shake: 0,
    playerBias: 0.38,
    stompClock: 0,
    shakeX: 0,
    shakeY: 0,
    camZoom: 1,
    lastPlayerX: 0,
    lastPlayerY: 0,
    slideT: 0,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      if (this.ctx && !this.ctx.roundRect) {
        this.ctx.roundRect = function roundRect(x, y, w, h, r) {
          const rad = typeof r === "number" ? r : 0;
          this.moveTo(x + rad, y);
          this.arcTo(x + w, y, x + w, y + h, rad);
          this.arcTo(x + w, y + h, x, y + h, rad);
          this.arcTo(x, y + h, x, y, rad);
          this.arcTo(x, y, x + w, y, rad);
        };
      }
      this.resize();
    },

    resize() {
      const wrap = this.canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth || 800;
      const h = wrap.clientHeight || 360;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = w;
      this.h = h;
    },

    spawnSteam(x, y) {
      this.steam.push({
        x,
        y,
        vx: -20 - Math.random() * 30,
        vy: -18 - Math.random() * 24,
        life: 1,
        size: 6 + Math.random() * 10,
      });
    },

    spawnWordBurst(x, y) {
      const n = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 70 + Math.random() * 140;
        this.dust.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          life: 1,
          size: 2 + Math.random() * 2.4,
          spark: true,
          neon: true,
          hue: Math.random() < 0.5 ? "cyan" : "red",
        });
      }
    },

    spawnDust(x, y, boost, spark) {
      this.dust.push({
        x,
        y,
        vx: -40 - Math.random() * 50 - (boost ? 40 : 0) - (spark ? 20 : 0),
        vy: -8 + Math.random() * 16 - (spark ? 22 : 0),
        life: 1,
        size: (spark ? 1.4 : 2) + Math.random() * 3,
        spark: !!spark,
      });
    },

    draw(race, typing, dt) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      this.scroll += Math.max(0, race.speed) * dt * 1.55;

      const gap = race.player - race.monster;
      const prox = clamp(1 - gap / 180, 0, 1);
      const remain = Number.isFinite(race.track) ? race.track - race.player : 9999;
      const sliding = this.slideT > 0;
      const stride = 1.7 + clamp((30 - gap) / 30, 0, 1) * 2.4;
      this.stompClock += dt * stride;
      let stomp = false;
      if (this.stompClock >= 1) {
        this.stompClock -= 1;
        stomp = true;
      }
      if (!race.diff.monsterOff && gap < 30 && stomp) {
        this.shakeX = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2);
        this.shakeY = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2);
      }
      this.shakeX = lerp(this.shakeX, 0, 1 - Math.exp(-16 * dt));
      this.shakeY = lerp(this.shakeY, 0, 1 - Math.exp(-16 * dt));
      const sx = this.shakeX;
      const sy = this.shakeY;
      const unit = clamp(h / 380, 0.85, 1.45);
      const pace = clamp(race.speed / Math.max(race.targetSpeed, 8), 0, 1);
      const targetBias = typing.stallLeft > 0 ? 0.35 : 0.35 + pace * 0.2;
      const biasFollow = typing.stallLeft > 0 ? 3.2 : 6.5;
      this.playerBias = lerp(this.playerBias, sliding ? 0.62 : targetBias, 1 - Math.exp(-biasFollow * dt));
      const zoomGoal = remain < 60 && remain > -4 && Number.isFinite(race.track) ? 1 + 0.08 * clamp(1 - remain / 60, 0, 1) : 1;
      this.camZoom = lerp(this.camZoom, sliding ? 1.12 : zoomGoal, 1 - Math.exp(-4.5 * dt));

      ctx.save();
      ctx.translate(w * 0.68, h * 0.52);
      ctx.scale(this.camZoom, this.camZoom);
      ctx.translate(-w * 0.68, -h * 0.52);
      ctx.translate(sx, sy);

      const horizon = h * 0.54;
      const theme = Cosmetics.sector();
      this.theme = theme;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, theme.sky0);
      sky.addColorStop(1, theme.sky1);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizon);

      this.drawSector(ctx, w, h, horizon, typing);

      const playerX = w * this.playerBias;
      const playerY = horizon + 6;
      this.lastPlayerX = playerX;
      this.lastPlayerY = playerY;
      const t = clamp(gap / 175, 0, 1);
      const monsterX = lerp(playerX - 36 * unit, -90 * unit, t);
      const monsterScale = lerp(1.45, 0.72, t) * unit;

      this.drawMonster(ctx, monsterX, playerY + 8, monsterScale, prox);
      this.drawPlayer(ctx, playerX, playerY, race, typing, unit);
      if (race.footKick) {
        this.spawnDust(playerX - 12 * unit, playerY + 62 * unit, typing.boostLeft > 0, false);
        this.spawnDust(playerX - 4 * unit, playerY + 58 * unit, typing.boostLeft > 0, true);
        this.spawnDust(playerX - 18 * unit, playerY + 64 * unit, typing.boostLeft > 0, true);
        race.footKick = false;
      }
      if (!race.diff.doorOff && !race.diff.endless) {
        this.drawDoor(ctx, w, h, horizon, race.doorOpen, sliding);
      }
      this.updateParticles(ctx, dt);
      if (typing.boostLeft > 0 || race.speed > race.targetSpeed * 0.28) this.drawSpeedLines(ctx, w, h);

      ctx.restore();

      const vig = ctx.createRadialGradient(w * 0.55, h * 0.48, h * 0.18, w * 0.5, h * 0.5, h * 0.82);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(0,0,0,${0.28 + prox * 0.22})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      if (prox > 0.5) {
        ctx.fillStyle = `rgba(120, 0, 10, ${(prox - 0.5) * 0.2})`;
        ctx.fillRect(0, 0, w, h);
      }
    },

    hexA(hex, a) {
      if (!hex || hex[0] !== "#") return hex;
      const raw = hex.length === 4
        ? hex.slice(1).split("").map((c) => parseInt(c + c, 16))
        : [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((s) => parseInt(s, 16));
      return `rgba(${raw[0]},${raw[1]},${raw[2]},${a})`;
    },

    oval(ctx, x, y, rx, ry, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    },

    drawSector(ctx, w, h, horizon, typing) {
      const th = this.theme || Cosmetics.sector();
      const model = th.model || th.id;
      const boost = typing.boostLeft > 0;
      if (model === "subway") this.drawSubway(ctx, w, h, horizon, th, boost);
      else if (model === "archive") this.drawArchive(ctx, w, h, horizon, th, boost);
      else if (model === "biodome") this.drawBiodome(ctx, w, h, horizon, th, boost);
      else if (model === "underpass") this.drawUnderpass(ctx, w, h, horizon, th, boost);
      else if (model === "foundry") this.drawFoundry(ctx, w, h, horizon, th, boost);
      else if (model === "quantum") this.drawQuantum(ctx, w, h, horizon, th, boost);
      else if (model === "eclipse") this.drawEclipse(ctx, w, h, horizon, th, boost);
      else this.drawIndustrial(ctx, w, h, horizon, th, boost);
    },

    drawIndustrial(ctx, w, h, horizon, th, boost) {
      const panelW = 110;
      const offset = this.scroll * 0.4 % panelW;
      for (let x = -panelW; x < w + panelW; x += panelW) {
        const px = Math.round(x - offset);
        const alt = Math.floor((x + this.scroll * 0.4) / panelW) % 2 === 0;
        ctx.fillStyle = alt ? th.wallA : th.wallB;
        ctx.fillRect(px, 0, panelW - 5, horizon);
        ctx.fillStyle = alt ? th.innerA : th.innerB;
        ctx.fillRect(px + 8, 14, panelW - 22, horizon - 32);
        ctx.strokeStyle = "rgba(180, 200, 220, 0.18)";
        ctx.strokeRect(px + 8.5, 14.5, panelW - 23, horizon - 33);
        ctx.fillStyle = th.rivet;
        [[px + 14, 20], [px + panelW - 24, 20], [px + 14, horizon - 22], [px + panelW - 24, horizon - 22]]
          .forEach(([rx, ry]) => { ctx.beginPath(); ctx.arc(rx, ry, 2.2, 0, Math.PI * 2); ctx.fill(); });
        for (let s = 0; s < 5; s++) {
          ctx.fillStyle = s % 2 ? "#111318" : th.stripe;
          ctx.fillRect(px + 16 + s * 14, horizon - 30, 14, 7);
        }
        const chainX = px + 28;
        ctx.strokeStyle = "rgba(160,170,180,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(chainX, 10);
        ctx.lineTo(chainX + Math.sin(this.scroll * 0.02 + px) * 4, horizon * 0.42);
        ctx.stroke();
        this.oval(ctx, chainX + Math.sin(this.scroll * 0.02 + px) * 4, horizon * 0.42, 5, 7, "#3a424c");
      }
      ctx.fillStyle = th.ceil;
      ctx.fillRect(0, 0, w, 10);
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 140) - this.scroll * 0.25) % (w + 140) - 20;
        ctx.fillStyle = th.beam;
        ctx.fillRect(bx, 0, 16, horizon * 0.2);
      }
      this.drawPipes(ctx, w, horizon, boost, th);
      this.drawWorkLights(ctx, w, horizon, th);
      this.drawPerspectiveFloor(ctx, w, h, horizon, th, 42, 1.25);
      if (Math.random() < (boost ? 0.22 : 0.1)) this.spawnSteam(40 + Math.random() * (w * 0.7), horizon * 0.24);
    },

    drawSubway(ctx, w, h, horizon, th, boost) {
      const tile = 22;
      const off = this.scroll * 0.35 % tile;
      for (let x = -tile; x < w + tile; x += tile) {
        for (let y = 8; y < horizon - 8; y += tile) {
          const gx = x - off;
          const shade = ((Math.floor((x + this.scroll * 0.35) / tile) + Math.floor(y / tile)) % 2) === 0;
          ctx.fillStyle = shade ? th.innerA : th.innerB;
          ctx.fillRect(gx, y, tile - 1.5, tile - 1.5);
        }
      }
      ctx.fillStyle = th.ceil;
      ctx.fillRect(0, 0, w, 18);
      const signX = ((this.scroll * -0.35) % 280) + 40;
      ctx.fillStyle = "#111318";
      ctx.fillRect(signX, 22, 118, 28);
      ctx.fillStyle = th.stripe;
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText("SECTOR 7", signX + 12, 40);
      for (let i = 0; i < 5; i++) {
        const bx = ((i * 220) - this.scroll * 0.4) % (w + 220);
        ctx.fillStyle = "#1a1c22";
        ctx.fillRect(bx, horizon - 38, 54, 18);
        ctx.fillStyle = "#2a2c34";
        ctx.fillRect(bx + 4, horizon - 36, 46, 6);
      }
      this.drawWorkLights(ctx, w, horizon, th);
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, th.floor0);
      floor.addColorStop(1, th.floor2);
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);
      const sleeper = 36;
      const sOff = this.scroll * 1.6 % sleeper;
      for (let i = 0; i < 28; i++) {
        const yRel = (i * sleeper - sOff) / Math.max(1, h - horizon);
        if (yRel < 0) continue;
        const y = horizon + Math.pow(yRel, 1.2) * (h - horizon);
        const spread = 18 + yRel * 90;
        ctx.fillStyle = "#3a3228";
        ctx.fillRect(w * 0.5 - spread, y, spread * 2, 5 + yRel * 6);
      }
      ctx.strokeStyle = "#8a9098";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, horizon);
      ctx.lineTo(w * 0.28, h);
      ctx.moveTo(w * 0.58, horizon);
      ctx.lineTo(w * 0.72, h);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,196,40,${0.35 + Math.sin(performance.now() / 180) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizon);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
      if (Math.random() < (boost ? 0.18 : 0.06)) {
        this.dust.push({
          x: w * 0.5 + (Math.random() * 40 - 20), y: horizon + 20, vx: -80, vy: -10,
          life: 1, size: 1.6, spark: true, kind: "spark",
        });
      }
    },

    drawBiodome(ctx, w, h, horizon, th, boost) {
      const sky = ctx.createRadialGradient(w * 0.5, horizon * 0.2, 20, w * 0.5, horizon, w);
      sky.addColorStop(0, "#1c4a30");
      sky.addColorStop(1, th.sky0);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizon);
      ctx.strokeStyle = "rgba(180,255,210,0.18)";
      ctx.lineWidth = 3;
      for (let i = -2; i < 8; i++) {
        const cx = ((i * 160) - this.scroll * 0.2) % (w + 200) - 40;
        ctx.beginPath();
        ctx.moveTo(cx, horizon);
        ctx.quadraticCurveTo(cx + 80, 8, cx + 160, horizon);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const vx = ((i * 130) - this.scroll * 0.28) % (w + 130) - 20;
        const sway = Math.sin(performance.now() / 700 + i) * 10;
        ctx.strokeStyle = "rgba(60,160,80,0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vx + 20, 4);
        ctx.bezierCurveTo(vx + sway, horizon * 0.35, vx + 30 - sway, horizon * 0.7, vx + sway, horizon);
        ctx.stroke();
        ctx.fillStyle = "rgba(80,200,90,0.45)";
        for (let L = 0; L < 5; L++) {
          const ly = 20 + L * (horizon / 6);
          ctx.beginPath();
          ctx.ellipse(vx + sway * 0.4 + (L % 2 ? 10 : -8), ly, 8, 4, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      this.drawWorkLights(ctx, w, horizon, th);
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, th.floor0);
      floor.addColorStop(1, th.floor2);
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);
      for (let i = 0; i < 8; i++) {
        const mx = ((i * 150) - this.scroll * 0.9) % (w + 150);
        const my = horizon + 18 + (i % 3) * 16;
        this.oval(ctx, mx, my, 7, 4, "#3a2010");
        this.oval(ctx, mx, my - 6, 9, 7, i % 2 ? "#39ff88" : "#7dffb0");
        ctx.fillStyle = "rgba(57,255,136,0.35)";
        ctx.beginPath();
        ctx.arc(mx, my - 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.random() < (boost ? 0.3 : 0.14)) {
        this.steam.push({
          x: 30 + Math.random() * w, y: horizon * 0.4, vx: -8, vy: -12,
          life: 1, size: 3 + Math.random() * 4, kind: "spore",
        });
      }
    },

    drawUnderpass(ctx, w, h, horizon, th, boost) {
      ctx.fillStyle = th.wallB;
      ctx.fillRect(0, 0, w, horizon);
      for (let i = 0; i < 6; i++) {
        const sx = ((i * 210) - this.scroll * 0.45) % (w + 210) - 30;
        const colors = ["#ff4bd8", "#3dffd0", "#c084fc", "#ffb020"];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(sx, 18 + (i % 3) * 16, 72 + (i % 2) * 20, 16);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#06040a";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(["開", "NEON", "夜", "OPEN"][i % 4], sx + 8, 30 + (i % 3) * 16);
      }
      for (let i = 0; i < 10; i++) {
        const gx = ((i * 90) - this.scroll * 0.2) % (w + 90);
        ctx.fillStyle = `rgba(${80 + i * 8},40,120,0.22)`;
        ctx.fillRect(gx, horizon * 0.35, 18, horizon * 0.5);
      }
      this.drawWorkLights(ctx, w, horizon, th);
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, th.floor0);
      floor.addColorStop(0.4, th.floor1);
      floor.addColorStop(1, th.floor2);
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.scale(1, -0.35);
      ctx.translate(0, -horizon * 2 - 40);
      for (let i = 0; i < 4; i++) {
        const sx = ((i * 210) - this.scroll * 0.45) % (w + 210);
        ctx.fillStyle = ["#ff4bd8", "#3dffd0", "#c084fc"][i % 3];
        ctx.fillRect(sx, 18, 80, 14);
      }
      ctx.restore();
      for (let i = 0; i < 18; i++) {
        const rx = (this.scroll * 18 + i * 73) % (w + 40);
        const ry = (i * 37 + this.scroll * 4) % horizon;
        ctx.strokeStyle = "rgba(180,200,255,0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 16);
        ctx.stroke();
      }
      if (Math.random() < 0.4) {
        this.steam.push({
          x: Math.random() * w, y: 8, vx: -30, vy: 90,
          life: 0.7, size: 1.2, kind: "rain",
        });
      }
    },

    drawQuantum(ctx, w, h, horizon, th, boost) {
      ctx.fillStyle = th.sky0;
      ctx.fillRect(0, 0, w, horizon);
      for (let i = 0; i < 16; i++) {
        const a = performance.now() / 800 + i;
        const cx = (Math.sin(a * 0.7 + i) * 0.4 + 0.5) * w;
        const cy = (Math.cos(a * 0.5 + i * 0.4) * 0.3 + 0.35) * horizon;
        ctx.strokeStyle = `rgba(160,80,255,${0.15 + (i % 3) * 0.08})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + (i % 5) * 10, a, a + 1.8);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const bx = ((i * 140) - this.scroll * 1.8) % (w + 140) - 20;
        const by = 20 + (i % 4) * 28 + Math.sin(performance.now() / 400 + i) * 8;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(performance.now() / 900 + i);
        ctx.fillStyle = i % 2 ? "rgba(125,92,255,0.55)" : "rgba(61,255,208,0.4)";
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(160, 80, 255, 0.22)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const y = (i / 14) * h;
        const x = (this.scroll * 14 + i * 61) % (w + 120) - 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 70 - (i % 4) * 20, y + 3);
        ctx.stroke();
      }
      this.drawPerspectiveFloor(ctx, w, h, horizon, th, 28, 2.4);
      for (let i = 0; i < 10; i++) {
        const hx = ((i * 70) - this.scroll * 2.2) % (w + 70);
        const hy = horizon + 20 + (i % 3) * 22;
        ctx.strokeStyle = "rgba(160,80,255,0.45)";
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const ang = (Math.PI / 3) * s;
          const px = hx + Math.cos(ang) * 10;
          const py = hy + Math.sin(ang) * 6;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    },

    drawArchive(ctx, w, h, horizon, th, boost) {
      ctx.fillStyle = th.sky0;
      ctx.fillRect(0, 0, w, horizon);
      for (let i = 0; i < 8; i++) {
        const sx = ((i * 120) - this.scroll * 0.3) % (w + 120) - 20;
        ctx.fillStyle = i % 2 ? th.wallA : th.wallB;
        ctx.fillRect(sx, 16, 48, horizon - 24);
        for (let row = 0; row < 5; row++) {
          ctx.fillStyle = row % 2 ? "#3a2a18" : "#4a3824";
          ctx.fillRect(sx + 4, 24 + row * 18, 40, 4);
          ctx.fillStyle = ["#7dd3fc", "#c4b48c", "#8aa0a8"][row % 3];
          ctx.fillRect(sx + 6, 28 + row * 18, 12 + (row % 3) * 6, 10);
        }
      }
      this.drawWorkLights(ctx, w, horizon, th);
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, "rgba(80,140,160,0.35)");
      floor.addColorStop(0.35, th.floor1);
      floor.addColorStop(1, th.floor2);
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.fillStyle = "rgba(125,211,252,0.12)";
      ctx.fillRect(0, horizon, w, 16);
      if (Math.random() < (boost ? 0.28 : 0.12)) {
        this.steam.push({
          x: 20 + Math.random() * w, y: 10, vx: -8, vy: 40,
          life: 0.8, size: 1.4, kind: "rain",
        });
      }
    },

    drawFoundry(ctx, w, h, horizon, th, boost) {
      ctx.fillStyle = th.sky0;
      ctx.fillRect(0, 0, w, horizon);
      for (let i = 0; i < 6; i++) {
        const vx = ((i * 180) - this.scroll * 0.35) % (w + 180);
        ctx.fillStyle = th.wallA;
        ctx.fillRect(vx, 8, 28, horizon - 16);
        const pulse = 0.4 + Math.sin(performance.now() / 200 + i) * 0.3;
        ctx.fillStyle = `rgba(255,80,30,${pulse})`;
        ctx.fillRect(vx + 6, horizon * 0.3, 16, horizon * 0.45);
      }
      this.drawWorkLights(ctx, w, horizon, th);
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, "#5a2010");
      floor.addColorStop(0.4, th.floor1);
      floor.addColorStop(1, th.floor2);
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);
      const laneOff = this.scroll * 1.6 % 50;
      for (let i = 0; i < 16; i++) {
        const yRel = (i * 50 - laneOff) / Math.max(1, h - horizon);
        if (yRel < 0) continue;
        const y = horizon + Math.pow(yRel, 1.2) * (h - horizon);
        ctx.strokeStyle = `rgba(255,90,32,${0.2 + yRel * 0.5})`;
        ctx.lineWidth = 4 + yRel * 6;
        ctx.beginPath();
        ctx.moveTo(w * 0.35, y);
        ctx.lineTo(w * 0.65, y);
        ctx.stroke();
      }
      if (Math.random() < (boost ? 0.35 : 0.16)) {
        this.dust.push({
          x: w * 0.5 + (Math.random() * 80 - 40), y: horizon + 8,
          vx: -40, vy: -30 - Math.random() * 40,
          life: 1, size: 1.8, spark: true, hue: "red", neon: true,
        });
      }
    },

    drawEclipse(ctx, w, h, horizon, th, boost) {
      ctx.fillStyle = "#060408";
      ctx.fillRect(0, 0, w, horizon);
      const cx = w * 0.62;
      const cy = horizon * 0.38;
      const corona = 0.55 + Math.sin(performance.now() / 600) * 0.12;
      ctx.fillStyle = `rgba(255,120,40,${0.16 * corona})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,210,74,${0.35 * corona})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16 + performance.now() / 4000;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28);
        ctx.lineTo(cx + Math.cos(a) * (58 + (i % 3) * 10), cy + Math.sin(a) * (58 + (i % 3) * 10));
        ctx.stroke();
      }
      ctx.fillStyle = "#ffd24a";
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#08060a";
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 2, 22, 0, Math.PI * 2);
      ctx.fill();
      this.drawPerspectiveFloor(ctx, w, h, horizon, th, 36, 1.4);
    },

    drawPipes(ctx, w, horizon, boost, th) {
      const y1 = horizon * 0.24;
      const y2 = horizon * 0.38;
      ctx.fillStyle = th.pipe;
      ctx.fillRect(0, y1, w, 14);
      ctx.fillRect(0, y2, w, 11);
      ctx.fillStyle = th.pipeHi;
      ctx.fillRect(0, y1 + 3, w, 4);
      ctx.fillStyle = th.innerB;
      ctx.fillRect(0, y1 + 12, w, 2);
      for (let i = 0; i < 6; i++) {
        const vx = ((i * 190) - this.scroll * 0.45) % (w + 190);
        ctx.fillStyle = th.pipeHi;
        ctx.fillRect(vx, y1 - 6, 16, 26);
        ctx.fillStyle = "#d7e1ec";
        ctx.beginPath();
        ctx.arc(vx + 8, y1 + 7, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    drawWorkLights(ctx, w, horizon, th) {
      const spacing = 150;
      const offset = this.scroll * 0.6 % spacing;
      const flicker = 0.6 + Math.random() * 0.4;
      const pulse = 0.72 + Math.sin(performance.now() / 160) * 0.28;
      const [lr, lg, lb] = th.light;
      const [br, bg, bb] = th.beamLight;
      for (let x = -40; x < w + 40; x += spacing) {
        const px = x - offset;
        const glow = flicker * pulse;
        ctx.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${0.2 * glow})`;
        ctx.beginPath();
        ctx.ellipse(px, 34, 52, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${0.9 * glow})`;
        ctx.fillRect(px - 12, 10, 24, 9);
        ctx.fillStyle = `rgba(${br}, ${bg}, ${bb}, ${0.12 * glow})`;
        ctx.fillRect(px - 18, 20, 36, horizon - 28);
      }
    },

    drawPerspectiveFloor(ctx, w, h, horizon, th, tile, speed) {
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, th.floor0);
      floor.addColorStop(0.35, th.floor1);
      floor.addColorStop(1, th.floor2);
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.strokeStyle = th.lane;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.stroke();
      ctx.lineWidth = 1;
      const vpX = w * 0.7;
      for (let i = -10; i <= 12; i++) {
        ctx.strokeStyle = i === 0 ? th.lane : "rgba(210, 220, 235, 0.16)";
        ctx.beginPath();
        ctx.moveTo(vpX + i * 16, horizon);
        ctx.lineTo(vpX + i * 86, h + 10);
        ctx.stroke();
      }
      const off = this.scroll * speed % tile;
      for (let i = 0; i < 24; i++) {
        const yRel = (i * tile - off) / Math.max(1, h - horizon);
        if (yRel < 0) continue;
        const y = horizon + Math.pow(yRel, 1.28) * (h - horizon);
        ctx.strokeStyle = th.warp
          ? `rgba(160, 80, 255, ${0.12 + yRel * 0.35})`
          : `rgba(220, 230, 245, ${0.08 + yRel * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.fillStyle = th.laneFill;
      ctx.beginPath();
      ctx.moveTo(vpX - 10, horizon);
      ctx.lineTo(vpX - 70, h);
      ctx.lineTo(vpX + 70, h);
      ctx.lineTo(vpX + 10, horizon);
      ctx.closePath();
      ctx.fill();
    },

    drawPlayer(ctx, x, y, race, typing, unit) {
      const speed = race.speed;
      const boost = typing.boostLeft > 0;
      const skin = Cosmetics.runner();
      const model = skin.model || skin.id;
      const cadence = 0.4 + typing.burstCps(performance.now()) * 1.15 + clamp(speed / 12, 0, 2.4);
      const t = performance.now() / 1000;
      let swing = Math.sin(t * cadence * 10);
      let bob = Math.abs(Math.sin(t * cadence * 10)) * (2.2 + clamp(speed * 0.18, 0, 5)) * unit;
      let lean = clamp(speed / Math.max(race.targetSpeed, 8), 0, 1.45);
      if (model === "emerald") {
        swing = Math.sin(t * 3) * 0.4;
        bob = Math.sin(t * 2.2) * 7 * unit;
        lean = 0.15;
      } else if (model === "steel") {
        swing = Math.sin(t * cadence * 6);
        bob = Math.abs(Math.sin(t * cadence * 6)) * (4.4 + speed * 0.2) * unit;
        lean *= 0.45;
      } else if (model === "glitch") {
        swing = Math.sin(t * cadence * 18);
        bob += (Math.random() < 0.12 ? (Math.random() * 10 - 5) : 0) * unit;
        lean = 0.35;
      } else if (model === "hazard" || model === "neonHazard") {
        swing = Math.sin(t * cadence * 8);
        bob *= 1.15;
        lean *= 0.7;
      } else if (model === "violet") {
        lean = Math.max(lean, 0.85);
      }
      const sliding = this.slideT > 0;
      const slideK = clamp(this.slideT, 0, 1);
      const hovering = model === "emerald";
      if (!hovering && speed > 0.8 && Math.random() < 0.28 + lean * 0.35) {
        this.spawnDust(x - 14 * unit, y + 62 * unit, boost, Math.random() < 0.35);
      }

      ctx.save();
      ctx.translate(x, y + bob + (sliding ? 10 * slideK * unit : 0));
      ctx.rotate(lean * 0.2 + (sliding ? 0.55 * slideK : 0));
      ctx.scale(unit, unit);

      if (typing.streak >= 10) {
        [[-18, 2, "rgba(255, 40, 70, 0.22)"], [-28, -1, "rgba(0, 255, 220, 0.18)"], [-38, 3, "rgba(120, 160, 255, 0.12)"]]
          .forEach(([dx, dy, color]) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(-11 + dx, 2 + dy, 26, 30, 5);
            ctx.fill();
          });
      }

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(0, hovering ? 58 : 66, hovering ? 16 : 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (boost) {
        const trail = ctx.createLinearGradient(-70, 20, 10, 20);
        trail.addColorStop(0, "rgba(61,255,208,0)");
        trail.addColorStop(1, this.hexA(skin.visor, 0.28));
        ctx.fillStyle = trail;
        ctx.fillRect(-74, 8, 78, 44);
      }

      const pose = { swing, boost, t, sliding, slideK };
      const fn = this.drawRunnerModel[model] || this.drawRunnerModel.cyan;
      fn.call(this, ctx, pose, skin);
      ctx.restore();
    },

    drawRunnerModel: {
      cyan(ctx, pose, skin) {
        this.strokeLimbs(ctx, pose, skin, 5);
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.roundRect(-11, 2, 26, 30, 5);
        ctx.fill();
        ctx.fillStyle = skin.trim;
        ctx.fillRect(-9, 8, 22, 8);
        ctx.fillStyle = skin.accent;
        ctx.fillRect(12, 6, 6, 10);
        ctx.strokeStyle = skin.limbs;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -16);
        ctx.lineTo(8, -28);
        ctx.stroke();
        this.oval(ctx, 8, -30, 2.4, 2.4, skin.visor);
        this.drawVisorHelm(ctx, skin, pose.boost);
      },
      hazard(ctx, pose, skin) {
        const { swing } = pose;
        ctx.fillStyle = "#2a1c12";
        ctx.beginPath();
        ctx.roundRect(-16, 8, 10, 22, 3);
        ctx.fill();
        ctx.strokeStyle = skin.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 28);
        ctx.quadraticCurveTo(-22, 40, -8, 18);
        ctx.stroke();
        ctx.strokeStyle = skin.limbs;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(2, 30);
        ctx.lineTo(12 + swing * 8, 50);
        ctx.lineTo(8 + swing * 6, 66);
        ctx.moveTo(2, 30);
        ctx.lineTo(-6 - swing * 8, 50);
        ctx.lineTo(0 - swing * 6, 66);
        ctx.stroke();
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.roundRect(-14, 0, 30, 34, 4);
        ctx.fill();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? "#111318" : skin.accent;
          ctx.fillRect(-12 + i * 7, 10, 7, 8);
        }
        ctx.fillStyle = skin.visor;
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.lineTo(16, -6);
        ctx.lineTo(10, -20);
        ctx.lineTo(-6, -20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#04151a";
        ctx.fillRect(-4, -14, 14, 5);
      },
      steel(ctx, pose, skin) {
        const { swing } = pose;
        ctx.fillStyle = skin.limbs;
        ctx.fillRect(4 + swing * 4, 32, 10, 18);
        ctx.fillRect(-10 - swing * 4, 32, 10, 18);
        ctx.fillStyle = skin.trim;
        ctx.fillRect(3 + swing * 4, 48, 12, 16);
        ctx.fillRect(-11 - swing * 4, 48, 12, 16);
        ctx.fillStyle = skin.body;
        ctx.fillRect(-16, -2, 34, 36);
        ctx.fillStyle = skin.trim;
        ctx.fillRect(-22, 2, 10, 16);
        ctx.fillRect(14, 2, 10, 16);
        ctx.fillStyle = skin.visor;
        ctx.fillRect(-8, -14, 22, 12);
        ctx.fillStyle = "#0a1014";
        ctx.fillRect(-4, -10, 14, 4);
        ctx.fillStyle = this.hexA(skin.visor, 0.35 + Math.sin(pose.t * 8) * 0.2);
        ctx.fillRect(-20, 6, 6, 6);
        ctx.fillRect(16, 6, 6, 6);
      },
      emerald(ctx, pose, skin) {
        const sway = pose.swing * 8;
        ctx.fillStyle = this.hexA(skin.visor, 0.18);
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.bezierCurveTo(-28 + sway, 30, -20, 70, 2, 62);
        ctx.bezierCurveTo(24, 70, 20 - sway, 28, 10, 8);
        ctx.fill();
        for (let i = 0; i < 5; i++) {
          this.oval(ctx, -10 - i * 7 + Math.sin(pose.t * 3 + i) * 4, 20 + i * 8, 2.2, 2.2, this.hexA(skin.accent, 0.55));
        }
        ctx.fillStyle = this.hexA(skin.body, 0.82);
        ctx.beginPath();
        ctx.moveTo(2, -22);
        ctx.lineTo(-16, 8);
        ctx.lineTo(18, 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = skin.visor;
        ctx.shadowColor = skin.visor;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(4, -6, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = skin.visorHi;
        ctx.fillRect(-2, -8, 10, 3);
        ctx.globalAlpha = 1;
      },
      violet(ctx, pose, skin) {
        const { swing } = pose;
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-22, 48);
        ctx.lineTo(8, 50);
        ctx.lineTo(16, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = skin.limbs;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(2, 24);
        ctx.lineTo(18 + swing * 6, 40);
        ctx.lineTo(26 + swing * 8, 28);
        ctx.moveTo(0, 26);
        ctx.lineTo(-4 - swing * 4, 50);
        ctx.lineTo(10, 64);
        ctx.stroke();
        ctx.fillStyle = skin.trim;
        ctx.fillRect(-10, 4, 22, 10);
        ctx.fillStyle = skin.visor;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(18, -4);
        ctx.lineTo(14, -22);
        ctx.lineTo(-2, -18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = skin.accent;
        ctx.fillRect(6, -26, 3, 10);
        ctx.strokeStyle = this.hexA(skin.accent, 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 64);
        ctx.lineTo(28, 70);
        ctx.stroke();
      },
      glitch(ctx, pose, skin) {
        const layers = [
          { dx: -4, dy: 2, color: "#ff4bd8", a: 0.45 },
          { dx: 4, dy: -2, color: "#3dffd0", a: 0.45 },
          { dx: 0, dy: 0, color: skin.limbs, a: 1 },
        ];
        layers.forEach((layer) => {
          ctx.save();
          ctx.globalAlpha = layer.a;
          ctx.translate(layer.dx + Math.sin(pose.t * 40) * (layer.dx ? 1.5 : 0), layer.dy);
          ctx.fillStyle = layer.color;
          for (let i = 0; i < 8; i++) {
            ctx.fillRect(-10 + (i % 3) * 8, -16 + Math.floor(i / 3) * 12, 7, 10);
          }
          ctx.fillRect(-6, 20, 8, 18 + pose.swing * 4);
          ctx.fillRect(4, 22, 8, 16 - pose.swing * 4);
          ctx.restore();
        });
        const hue = (performance.now() / 8) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 62%)`;
        ctx.fillRect(-4, -10, 16, 6);
      },
      gold(ctx, pose, skin) {
        ctx.fillStyle = this.hexA(skin.visor, 0.35);
        ctx.beginPath();
        ctx.moveTo(-4, 8);
        ctx.quadraticCurveTo(-30, 40, -8, 68);
        ctx.lineTo(12, 36);
        ctx.closePath();
        ctx.fill();
        this.strokeLimbs(ctx, pose, skin, 5);
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.roundRect(-12, 0, 28, 32, 6);
        ctx.fill();
        ctx.strokeStyle = skin.visor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, 6, 24, 8);
        ctx.beginPath();
        ctx.arc(2, -22, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = skin.visor;
        ctx.beginPath();
        ctx.moveTo(2, -32);
        ctx.lineTo(-8, -16);
        ctx.lineTo(12, -16);
        ctx.closePath();
        ctx.fill();
        this.drawVisorHelm(ctx, skin, true);
      },
      neonHazard(ctx, pose, skin) {
        const { swing, t } = pose;
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.roundRect(-20, 4, 12, 26, 4);
        ctx.fill();
        ctx.strokeStyle = skin.trim;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-14, 28);
        ctx.quadraticCurveTo(-6, 40, 4, 16);
        ctx.stroke();
        ctx.strokeStyle = skin.limbs;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(2, 30);
        ctx.lineTo(10 + swing * 7, 52);
        ctx.lineTo(6, 66);
        ctx.moveTo(0, 30);
        ctx.lineTo(-8 - swing * 7, 52);
        ctx.lineTo(-2, 66);
        ctx.stroke();
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.roundRect(-13, 0, 28, 34, 8);
        ctx.fill();
        ctx.fillStyle = Math.sin(t * 10) > 0 ? skin.visor : skin.trim;
        ctx.fillRect(-10, 8, 5, 5);
        ctx.fillRect(8, 8, 5, 5);
        ctx.fillStyle = skin.visor;
        ctx.beginPath();
        ctx.ellipse(2, -10, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#041510";
        ctx.fillRect(-8, -12, 20, 5);
        ctx.fillStyle = skin.visorHi;
        ctx.fillRect(-6, -11, 16, 2);
      },
    },

    strokeLimbs(ctx, pose, skin, width) {
      const { swing, boost } = pose;
      ctx.strokeStyle = boost ? skin.visor : skin.limbs;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(2, 28);
      ctx.lineTo(10 + swing * 12, 48);
      ctx.lineTo(4 + swing * 8, 66);
      ctx.moveTo(2, 28);
      ctx.lineTo(-8 - swing * 12, 48);
      ctx.lineTo(2 - swing * 8, 66);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2, 12);
      ctx.lineTo(-16 - swing * 10, 30);
      ctx.moveTo(8, 12);
      ctx.lineTo(22 + swing * 10, 28);
      ctx.stroke();
    },

    drawVisorHelm(ctx, skin, glow) {
      ctx.fillStyle = skin.visor;
      ctx.shadowColor = skin.visor;
      ctx.shadowBlur = glow ? 16 : 8;
      ctx.beginPath();
      ctx.roundRect(-8, -16, 24, 18, 6);
      ctx.fill();
      ctx.fillStyle = "#04151a";
      ctx.shadowBlur = 0;
      ctx.fillRect(2, -10, 13, 6);
      ctx.fillStyle = skin.visorHi;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(3, -9, 11, 3);
      ctx.globalAlpha = 1;
    },

    drawMonster(ctx, x, y, scale, prox) {
      const t = performance.now() / 1000;
      const skin = Cosmetics.monster();
      const model = skin.model || skin.id;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = `rgba(20, 0, 4, ${0.35 + prox * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(0, 58, model === "void" ? 50 : 86, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      const fn = this.drawMonsterModel[model] || this.drawMonsterModel.ink;
      fn.call(this, ctx, t, skin, prox);
      ctx.restore();
    },

    drawMonsterModel: {
      ink(ctx, t, skin) {
        const [tr, tg, tb] = skin.tent;
        for (let i = 0; i < 9; i++) {
          const a = t * (1.4 + i * 0.17) + i * 0.7;
          const tx = -28 - i * 9 + Math.sin(a) * 22;
          const ty = 16 + Math.cos(a * 1.35) * 28;
          ctx.strokeStyle = `rgba(${tr + i * 6}, ${tg}, ${tb + i}, 0.92)`;
          ctx.lineWidth = 9 - i * 0.55;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-4, 16);
          ctx.quadraticCurveTo(tx - 10, ty - 18, tx - 48, ty + 22);
          ctx.stroke();
        }
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.moveTo(-10, -18);
        ctx.bezierCurveTo(-52, 4, -40, 62, 8, 70);
        ctx.bezierCurveTo(40, 60, 36, 6, 14, -16);
        ctx.closePath();
        ctx.fill();
        this.oval(ctx, 4, 18, 18, 16, skin.mid);
        ctx.fillStyle = skin.horn;
        ctx.beginPath();
        ctx.moveTo(-8, -16);
        ctx.lineTo(-24, -46);
        ctx.lineTo(4, -20);
        ctx.moveTo(12, -14);
        ctx.lineTo(30, -48);
        ctx.lineTo(18, -12);
        ctx.fill();
        this.clusterEyes(ctx, t, skin, [[4, 8, 5.2], [-10, 14, 3.6], [16, 16, 3], [-2, 22, 2.4], [10, 2, 2.8], [8, 18, 2]]);
      },
      crimson(ctx, t, skin) {
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(-36, 28);
        ctx.lineTo(-20, 62);
        ctx.lineTo(22, 58);
        ctx.lineTo(28, 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = skin.horn;
        [[-18, 8, -48, -8], [16, 6, 46, -12], [-6, 24, -40, 40], [18, 26, 44, 38]].forEach(([x1, y1, x2, y2], i) => {
          const jab = Math.sin(t * 5 + i) * 6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2 + jab, y2);
          ctx.lineTo(x1 + 6, y1 + 8);
          ctx.fill();
        });
        ctx.fillStyle = skin.mid;
        ctx.beginPath();
        ctx.moveTo(-4, 8);
        ctx.lineTo(-16, 22);
        ctx.lineTo(4, 20);
        ctx.lineTo(18, 24);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this.hexA(skin.glow, 0.7);
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const dy = 30 + i * 8 + Math.sin(t * 6 + i) * 3;
          ctx.beginPath();
          ctx.moveTo(4, 20);
          ctx.lineTo(0, dy);
          ctx.stroke();
        }
        this.clusterEyes(ctx, t, skin, [[2, 0, 4], [12, 6, 3], [-8, 4, 2.6]]);
      },
      toxic(ctx, t, skin) {
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.ellipse(4, 22, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        this.oval(ctx, 18, 36, 16, 12, skin.mid);
        for (let i = 0; i < 4; i++) {
          const pulse = 0.7 + Math.sin(t * 4 + i) * 0.3;
          this.oval(ctx, 12 + i * 5, 34 + (i % 2) * 4, 3.5 * pulse, 3.5 * pulse, skin.glow);
        }
        ctx.strokeStyle = skin.horn;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const side = i < 3 ? -1 : 1;
          const idx = i % 3;
          const lift = Math.sin(t * 6 + i) * 10;
          ctx.beginPath();
          ctx.moveTo(side * 10, 20);
          ctx.lineTo(side * (24 + idx * 8), 28 + idx * 10 + lift);
          ctx.lineTo(side * (20 + idx * 8), 48 + idx * 6);
          ctx.stroke();
        }
        ctx.fillStyle = skin.horn;
        ctx.beginPath();
        ctx.moveTo(-2, 4);
        ctx.lineTo(-14, -10 + Math.sin(t * 8) * 3);
        ctx.lineTo(2, 10);
        ctx.moveTo(10, 4);
        ctx.lineTo(22, -8 + Math.cos(t * 8) * 3);
        ctx.lineTo(6, 10);
        ctx.fill();
        this.clusterEyes(ctx, t, skin, [[0, 10, 3.4], [10, 12, 3.4]]);
        if (Math.random() < 0.08) {
          Renderer.steam.push({
            x: Renderer.lastPlayerX - 80, y: Renderer.lastPlayerY + 20,
            vx: -10, vy: -20, life: 1, size: 4, kind: "spore",
          });
        }
      },
      frost(ctx, t, skin) {
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(-28, 8);
        ctx.lineTo(-18, 56);
        ctx.lineTo(20, 54);
        ctx.lineTo(26, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = skin.horn;
        ctx.lineWidth = 3;
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const a = t * 1.2 + i * 1.25;
          const rx = Math.cos(a) * (34 + i * 3);
          const ry = Math.sin(a) * 16 + 10;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(a);
          ctx.fillStyle = skin.horn;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(6, 8);
          ctx.lineTo(-6, 8);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = this.hexA(skin.glow, 0.25);
        ctx.beginPath();
        ctx.ellipse(8, 8, 18, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        this.clusterEyes(ctx, t, skin, [[-4, 4, 3], [10, 2, 3.6]]);
      },
      void(ctx, t, skin) {
        for (let i = 0; i < 12; i++) {
          const a = t * 2.2 + i * 0.52;
          const rr = 16 + (i % 5) * 8 + Math.sin(a) * 6;
          ctx.strokeStyle = `rgba(192, 132, 252, ${0.16 + (i % 3) * 0.08})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(2, 16, rr, a, a + 1.5);
          ctx.stroke();
        }
        const g = ctx.createRadialGradient(2, 16, 2, 2, 16, 22);
        g.addColorStop(0, "#000");
        g.addColorStop(0.7, skin.mid);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(2, 16, 22, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 7; i++) {
          const a = t * 1.6 + i * 0.9;
          ctx.fillStyle = skin.glow;
          ctx.beginPath();
          ctx.moveTo(2 + Math.cos(a) * 28, 16 + Math.sin(a) * 16);
          ctx.lineTo(2 + Math.cos(a + 0.2) * 36, 16 + Math.sin(a + 0.2) * 22);
          ctx.lineTo(2 + Math.cos(a - 0.15) * 34, 16 + Math.sin(a - 0.15) * 20);
          ctx.fill();
        }
        this.clusterEyes(ctx, t, skin, [[-6, 12, 2.2], [10, 14, 2.4], [2, 6, 1.8]]);
      },
      ash(ctx, t, skin) {
        for (let i = 0; i < 6; i++) {
          this.oval(ctx, -18 - i * 8 + Math.sin(t * 2 + i) * 4, 20 + i * 5, 10 - i, 6, this.hexA(skin.mid, 0.28));
        }
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.quadraticCurveTo(-30, 20, -16, 56);
        ctx.lineTo(20, 54);
        ctx.quadraticCurveTo(28, 18, 10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = skin.horn;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-22, -16);
        ctx.lineTo(0, 8);
        ctx.moveTo(10, -2);
        ctx.lineTo(24, -18);
        ctx.lineTo(8, 8);
        ctx.fill();
        this.clusterEyes(ctx, t, skin, [[-2, 10, 3.2], [10, 8, 3]]);
      },
      static(ctx, t, skin) {
        ctx.strokeStyle = this.hexA(skin.glow, 0.55 + Math.sin(t * 20) * 0.3);
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const jx = (Math.random() - 0.5) * 16;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(-10 + jx, 12 + i * 6);
          ctx.lineTo(8 - jx, 20 + i * 5);
          ctx.lineTo(-6 + jx, 48);
          ctx.stroke();
        }
        ctx.fillStyle = skin.body;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-16, 10);
        ctx.lineTo(-6, 58);
        ctx.lineTo(12, 54);
        ctx.lineTo(18, 8);
        ctx.closePath();
        ctx.fill();
        this.clusterEyes(ctx, t, skin, [[-2, 4, 3.6], [10, 6, 2.4]]);
      },
      leviathan(ctx, t, skin) {
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = i === 1 ? skin.horn : skin.body;
          ctx.lineWidth = 14 - i * 3;
          ctx.beginPath();
          for (let s = 0; s < 18; s++) {
            const a = t * 1.4 + s * 0.35 + i * 0.8;
            const px = -40 + s * 6;
            const py = 20 + Math.sin(a) * (16 + i * 6);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.fillStyle = skin.mid;
        ctx.beginPath();
        ctx.ellipse(16, 10, 18, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = skin.horn;
        ctx.beginPath();
        ctx.moveTo(28, 2);
        ctx.lineTo(46, -8);
        ctx.lineTo(30, 12);
        ctx.fill();
        this.clusterEyes(ctx, t, skin, [[20, 6, 4], [12, 10, 2.6]]);
      },
    },

    clusterEyes(ctx, t, skin, eyes) {
      const [er, eg, eb] = skin.eye;
      eyes.forEach(([ex, ey, r], i) => {
        const pulse = 0.7 + Math.sin(t * 7 + i) * 0.3;
        ctx.fillStyle = `rgba(${er}, ${Math.min(255, eg + i * 8)}, ${eb}, ${0.95 * pulse})`;
        ctx.shadowColor = skin.glow;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    },

    drawDoor(ctx, w, h, horizon, open, sliding) {
      const closed = 1 - open;
      const doorW = Math.max(86, w * 0.11);
      const x = w - doorW - 14;
      const fullH = h * 0.96;
      const drop = Math.max(18, fullH * closed);

      ctx.fillStyle = "rgba(255, 176, 32, 0.1)";
      ctx.fillRect(x - 16, 0, doorW + 32, h);

      const glow = ctx.createLinearGradient(x, 0, x + doorW, 0);
      glow.addColorStop(0, "rgba(255, 176, 32, 0)");
      glow.addColorStop(0.5, `rgba(255, 210, 90, ${0.16 + open * 0.28})`);
      glow.addColorStop(1, "rgba(255, 176, 32, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x + 8, drop, doorW - 16, h - drop);

      ctx.fillStyle = "#4b5563";
      ctx.fillRect(x, 0, doorW, drop);
      ctx.fillStyle = "#2d333c";
      for (let i = 0; i < drop; i += 16) ctx.fillRect(x + 8, i + 4, doorW - 16, 9);
      ctx.fillStyle = open < 0.28 ? "#ff3b4e" : "#ffb020";
      ctx.fillRect(x, drop - 5, doorW, 7);

      ctx.fillStyle = "#6b7380";
      ctx.fillRect(x - 12, 0, 12, h);
      ctx.fillRect(x + doorW, 0, 12, h);
      for (let y = 8; y < h; y += 22) {
        ctx.fillStyle = y % 44 === 8 ? "#ffb020" : "#111318";
        ctx.fillRect(x - 10, y, 8, 10);
        ctx.fillRect(x + doorW + 2, y, 8, 10);
      }

      ctx.fillStyle = "#ffb020";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText("GATE", x + 14, 28);

      if (Math.random() < (sliding ? 0.55 : 0.12)) this.spawnSteam(x + 16, drop);
      if (sliding) {
        for (let i = 0; i < 3; i++) {
          this.dust.push({
            x: x + 10 + Math.random() * (doorW - 20),
            y: drop + 4,
            vx: -80 - Math.random() * 90,
            vy: 20 + Math.random() * 40,
            life: 1,
            size: 1.6 + Math.random() * 2,
            spark: true,
            neon: true,
          });
        }
      }
      if (Math.sin(performance.now() / 130) > 0) {
        ctx.fillStyle = "#ff3b4e";
        ctx.fillRect(x + 16, 36, 12, 12);
        ctx.fillRect(x + doorW - 28, 36, 12, 12);
      }
    },

    updateParticles(ctx, dt) {
      this.steam = this.steam.filter((p) => {
        p.life -= dt * (p.kind === "rain" ? 1.6 : 0.7);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind !== "rain") p.size += dt * 8;
        if (p.life <= 0) return false;
        if (p.kind === "spore") ctx.fillStyle = `rgba(93, 255, 136, ${p.life * 0.45})`;
        else if (p.kind === "rain") ctx.fillStyle = `rgba(180, 210, 255, ${p.life * 0.4})`;
        else ctx.fillStyle = `rgba(200, 210, 220, ${p.life * 0.18})`;
        ctx.beginPath();
        if (p.kind === "rain") {
          ctx.fillRect(p.x, p.y, 1.2, 10);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        return true;
      });
      this.dust = this.dust.filter((p) => {
        p.life -= dt * 1.8;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) return false;
        ctx.fillStyle = p.neon
          ? (p.hue === "red" ? `rgba(255, 70, 120, ${p.life * 0.85})` : `rgba(0, 255, 210, ${p.life * 0.9})`)
          : p.spark
            ? `rgba(255, 210, 120, ${p.life * 0.85})`
            : `rgba(170, 160, 140, ${p.life * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
    },

    drawSpeedLines(ctx, w, h) {
      const th = this.theme || Cosmetics.sector();
      const model = th.model || th.id;
      ctx.strokeStyle = model === "quantum"
        ? "rgba(160, 80, 255, 0.28)"
        : model === "underpass"
          ? "rgba(255, 75, 216, 0.22)"
          : model === "biodome"
            ? "rgba(93, 255, 138, 0.18)"
            : "rgba(61, 255, 208, 0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const y = (i / 18) * h;
        const len = 40 + (i % 5) * 18;
        const x = (this.scroll * 8 + i * 73) % (w + 80) - 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len, y + 4);
        ctx.stroke();
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* Game / UI                                                           */
  /* ------------------------------------------------------------------ */

  const els = {
    start: $("start-screen"),
    game: $("game-view"),
    result: $("result-modal"),
    resultPanel: document.querySelector(".result-panel"),
    scores: $("high-scores"),
    input: $("mobile-input"),
    canvas: $("game-canvas"),
    wpm: $("stat-wpm"),
    acc: $("stat-acc"),
    streak: $("stat-streak"),
    dist: $("stat-dist"),
    door: $("stat-door"),
    adFill: $("ad-fill"),
    adTrack: $("ad-track"),
    adStatus: $("ad-status"),
    mapPlayer: $("map-player"),
    mapMonster: $("map-monster"),
    mapDoor: $("map-door"),
    mapGap: $("map-gap"),
    hint: $("focus-hint"),
    muteStart: $("btn-mute-start"),
    muteGame: $("btn-mute-game"),
    again: $("btn-again"),
    resTitle: $("result-title"),
    resCopy: $("result-copy"),
    resEye: $("result-eyebrow"),
    resWpm: $("res-wpm"),
    resRaw: $("res-raw"),
    resAcc: $("res-acc"),
    resTime: $("res-time"),
    resStreak: $("res-streak"),
    resDist: $("res-dist"),
    spark: $("wpm-spark"),
    vignette: $("horror-vignette"),
    slideBanner: $("slide-banner"),
    resSettings: $("res-settings"),
    resRecord: $("result-record"),
    resCredits: $("res-credits"),
    resBaseCredits: $("res-base-credits"),
    resStreakBonus: $("res-streak-bonus"),
    resTotalCredits: $("res-total-credits"),
    streakToast: $("streak-toast"),
    resXpDist: $("res-xp-dist"),
    resXpAcc: $("res-xp-acc"),
    resXpStreak: $("res-xp-streak"),
    resXpWpm: $("res-xp-wpm"),
    resXpTotal: $("res-xp-total"),
    resXpFill: $("res-xp-fill"),
    resXpMeta: $("res-xp-meta"),
    resXpTrack: $("res-xp-track"),
    levelup: $("levelup-overlay"),
    levelupStage: $("levelup-stage"),
    levelupBurst: $("levelup-burst"),
    levelupKicker: $("levelup-kicker"),
    levelupBanner: $("levelup-banner"),
    levelupFree: $("levelup-free"),
    levelupNum: $("levelup-num"),
    levelupRange: $("levelup-range"),
    levelupRewards: $("levelup-rewards"),
    levelupAck: $("btn-levelup-ack"),
    vaultBtn: $("btn-vault"),
    resultVault: $("btn-result-vault"),
    dataVaultBtn: $("btn-data-vault"),
    dataVaultFoot: $("btn-data-vault-foot"),
    dataVaultHud: $("btn-data-vault-hud"),
    resultData: $("btn-result-data"),
    dataVault: $("data-vault-modal"),
    dataVaultClose: $("btn-data-close"),
    saveDownload: $("btn-save-download"),
    saveCopy: $("btn-save-copy"),
    saveUpload: $("btn-save-upload"),
    saveFile: $("save-file-input"),
    saveApply: $("btn-save-apply"),
    saveReset: $("btn-save-reset"),
    saveCodeIn: $("save-code-in"),
    market: $("market-modal"),
    marketClose: $("btn-market-close"),
    tabVault: $("tab-vault"),
    tabLocker: $("tab-locker"),
    vaultView: $("vault-view"),
    lockerView: $("locker-view"),
    gachaOverlay: $("gacha-overlay"),
    gachaVfx: $("gacha-vfx"),
    gachaCharge: $("gacha-charge"),
    gachaOrb: $("gacha-orb"),
    gachaChargeLabel: $("gacha-charge-label"),
    gachaTierHint: $("gacha-tier-hint"),
    gachaReel: $("gacha-reel"),
    gachaCard: $("gacha-card"),
    gachaRarity: $("gacha-rarity"),
    gachaSwatch: $("gacha-swatch"),
    gachaName: $("gacha-name"),
    gachaSlot: $("gacha-slot"),
    gachaDup: $("gacha-dup"),
    gachaMulti: $("gacha-multi"),
    equipNow: $("btn-equip-now"),
    gachaDone: $("btn-gacha-done"),
    endlessBtn: $("btn-endless"),
    labBtn: $("btn-lab"),
    labPanel: $("lab-panel"),
    labStart: $("btn-lab-start"),
    labMonster: $("lab-monster"),
    labMonsterVal: $("lab-monster-val"),
    labMonsterOff: $("lab-monster-off"),
    labDistance: $("lab-distance"),
    labDoor: $("lab-door"),
    labStall: $("lab-stall"),
    labStallVal: $("lab-stall-val"),
    labText: $("lab-text"),
    labPunct: $("lab-punct"),
  };

  function isTouchDevice() {
    return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  }

  const Game = {
    state: "start",
    typing: createTyping(),
    race: null,
    settings: loadSettings(),
    raf: 0,
    lastTs: 0,
    hudAcc: 0,
    handledByKey: false,
    tabArmed: false,
    runCfg: null,
    sampleAcc: 0,
    sliding: false,

    boot() {
      Renderer.init(els.canvas);
      WordsView.mount();
      this.applySettingsToForm();
      Cosmetics.load();
      Progress.load();
      SaveStore.boot();
      Cosmetics.paint();
      this.renderScores();
      this.syncMuteButtons();
      this.syncViewport();

      document.getElementById("difficulty-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-diff]");
        if (!btn) return;
        this.settings.lastPreset = btn.dataset.diff;
        saveSettings(this.settings);
        this.start(this.configFromPreset(btn.dataset.diff));
      });

      els.endlessBtn.addEventListener("click", () => {
        this.settings.endless = !this.settings.endless;
        saveSettings(this.settings);
        this.syncModeButtons();
      });
      els.labBtn.addEventListener("click", () => {
        this.settings.labOpen = !this.settings.labOpen;
        saveSettings(this.settings);
        this.syncModeButtons();
      });
      els.labStart.addEventListener("click", () => {
        this.collectLab();
        saveSettings(this.settings);
        this.start(this.configFromLab());
      });
      ["labMonster", "labMonsterOff", "labDistance", "labDoor", "labStall", "labText", "labPunct"].forEach((key) => {
        els[key].addEventListener("input", () => {
          this.collectLab();
          this.syncLabLabels();
          saveSettings(this.settings);
        });
      });
      els.labDistance.addEventListener("change", () => {
        if (els.labDistance.value === "endless") els.labDoor.value = "off";
        this.collectLab();
        saveSettings(this.settings);
      });

      els.muteStart.addEventListener("click", () => this.toggleMute());
      els.muteGame.addEventListener("click", () => this.toggleMute());
      els.again.addEventListener("click", () => this.toStart());
      els.vaultBtn.addEventListener("click", () => this.openMarket("vault"));
      els.resultVault.addEventListener("click", () => this.openMarket("vault"));
      els.marketClose.addEventListener("click", () => this.closeMarket());
      const openVault = () => this.openDataVault();
      if (els.dataVaultBtn) els.dataVaultBtn.addEventListener("click", openVault);
      if (els.dataVaultFoot) els.dataVaultFoot.addEventListener("click", openVault);
      if (els.dataVaultHud) els.dataVaultHud.addEventListener("click", openVault);
      if (els.resultData) els.resultData.addEventListener("click", openVault);
      if (els.dataVaultClose) els.dataVaultClose.addEventListener("click", () => this.closeDataVault());
      if (els.saveDownload) els.saveDownload.addEventListener("click", () => SaveStore.download());
      if (els.saveCopy) els.saveCopy.addEventListener("click", () => SaveStore.copyCode());
      if (els.saveUpload) els.saveUpload.addEventListener("click", () => els.saveFile && els.saveFile.click());
      if (els.saveFile) els.saveFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        SaveStore.importFile(file);
      });
      if (els.saveApply) els.saveApply.addEventListener("click", () => {
        SaveStore.importCode(els.saveCodeIn ? els.saveCodeIn.value : "");
      });
      if (els.saveReset) els.saveReset.addEventListener("click", () => SaveStore.reset());
      els.tabVault.addEventListener("click", () => this.showMarketTab("vault"));
      els.tabLocker.addEventListener("click", () => this.showMarketTab("locker"));
      els.vaultView.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-pull]");
        if (!btn || btn.disabled) return;
        const card = btn.closest("[data-banner]");
        if (!card) return;
        this.pullBanner(card.dataset.banner, Number(btn.dataset.pull));
      });
      els.equipNow.addEventListener("click", () => this.equipGacha());
      els.gachaDone.addEventListener("click", () => this.closeGacha());
      if (els.levelupAck) els.levelupAck.addEventListener("click", () => this.closeLevelUp());
      document.querySelectorAll(".rank-chip").forEach((chip) => {
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          chip.classList.toggle("show-tip");
          setTimeout(() => chip.classList.remove("show-tip"), 2200);
        });
      });
      ["runner", "monster", "sector"].forEach((slot) => {
        document.getElementById(`locker-${slot}`).addEventListener("click", (e) => {
          const item = e.target.closest("[data-id]");
          if (!item || item.classList.contains("locked")) return;
          Cosmetics.equip(slot, item.dataset.id);
          this.renderLocker();
        });
      });

      els.input.addEventListener("keydown", (e) => this.onKey(e));
      els.input.addEventListener("beforeinput", (e) => this.onBeforeInput(e));
      els.input.addEventListener("input", (e) => this.onTextInput(e));
      els.input.addEventListener("blur", () => this.onInputBlur());

      const focusInput = (e) => {
        if (this.state !== "playing") return;
        this.focusInput();
        if (e) e.preventDefault();
      };
      document.getElementById("typing-panel").addEventListener("pointerdown", focusInput);
      document.getElementById("words-container").addEventListener("pointerdown", focusInput);
      document.getElementById("canvas-wrap").addEventListener("pointerdown", focusInput);

      els.game.addEventListener("touchmove", (e) => {
        if (this.state === "playing") e.preventDefault();
      }, { passive: false });

      const onViewport = () => {
        this.syncViewport();
        Renderer.resize();
        if (this.state === "playing") WordsView.sync(this.typing, true);
      };
      window.addEventListener("resize", onViewport);
      window.visualViewport?.addEventListener("resize", onViewport);
      window.visualViewport?.addEventListener("scroll", onViewport);

      document.addEventListener("pointerdown", () => {
        if (this.state !== "playing") return;
        requestAnimationFrame(() => this.focusInput());
      });

      window.addEventListener("keydown", (e) => this.onFlowKey(e), true);

      window.addEventListener("keydown", (e) => {
        if (this.state !== "start") return;
        if (!els.market.hidden || !els.gachaOverlay.hidden || (els.dataVault && !els.dataVault.hidden)) return;
        const map = { 1: "recruit", 2: "scout", 3: "operative", 4: "nightmare", 5: "apex" };
        if (map[e.key]) this.start(this.configFromPreset(map[e.key]));
      });
    },

    applySettingsToForm() {
      const lab = this.settings.lab;
      els.labMonster.value = lab.monsterWpm;
      els.labMonsterOff.checked = lab.monsterOff;
      els.labDistance.value = lab.distance;
      els.labDoor.value = lab.door;
      els.labStall.value = lab.stall;
      els.labText.value = lab.textMode;
      els.labPunct.checked = lab.punctuation;
      this.syncLabLabels();
      this.syncModeButtons();
      this.markPreset(this.settings.lastPreset);
    },

    syncLabLabels() {
      els.labMonsterVal.textContent = els.labMonsterOff.checked
        ? "OFF"
        : `${els.labMonster.value} WPM`;
      els.labStallVal.textContent = `${Number(els.labStall.value).toFixed(1)}s`;
    },

    syncModeButtons() {
      els.endlessBtn.setAttribute("aria-pressed", this.settings.endless ? "true" : "false");
      els.labBtn.setAttribute("aria-pressed", this.settings.labOpen ? "true" : "false");
      els.labBtn.setAttribute("aria-expanded", this.settings.labOpen ? "true" : "false");
      els.labPanel.hidden = !this.settings.labOpen;
    },

    markPreset(id) {
      document.querySelectorAll("[data-diff]").forEach((btn) => {
        btn.classList.toggle("selected", btn.dataset.diff === id);
      });
    },

    collectLab() {
      this.settings.lab = {
        monsterWpm: Number(els.labMonster.value),
        monsterOff: els.labMonsterOff.checked,
        distance: els.labDistance.value,
        door: els.labDoor.value,
        stall: Number(els.labStall.value),
        textMode: els.labText.value,
        punctuation: els.labPunct.checked,
      };
    },

    configFromPreset(id) {
      const base = DIFFICULTIES[id];
      if (!base) return null;
      this.markPreset(id);
      this.settings.lastPreset = id;
      saveSettings(this.settings);
      return {
        ...base,
        track: TRACK,
        endless: this.settings.endless,
        doorOff: this.settings.endless,
        doorTime: this.settings.endless ? 0 : base.doorTime,
        textMode: "mix",
        punctuation: true,
        scoreKey: this.settings.endless ? "endless" : id,
      };
    },

    configFromLab() {
      const lab = this.settings.lab;
      const endless = lab.distance === "endless";
      const track = endless ? Infinity : Number(lab.distance);
      const doorOff = lab.door === "off" || endless;
      const scale = DOOR_SCALE[lab.door] || 1;
      const ref = Number.isFinite(track) ? track : 1000;
      return {
        id: "custom",
        name: "Laboratory",
        tag: "Custom",
        targetWpm: lab.monsterOff ? 50 : Math.max(30, lab.monsterWpm),
        monsterWpm: lab.monsterWpm,
        monsterOff: lab.monsterOff,
        startGap: 190,
        closeAccel: 1.08,
        stall: lab.stall,
        track,
        endless,
        doorOff,
        doorTime: doorOff ? 0 : (ref / 1000) * 80 * scale,
        doorAccelFinal: lab.door === "blitz",
        textMode: lab.textMode,
        punctuation: lab.punctuation,
        scoreKey: endless ? "endless" : "custom",
      };
    },

    syncViewport() {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-h", `${Math.round(h)}px`);
    },

    focusInput() {
      els.input.focus({ preventScroll: true });
      els.hint.classList.remove("touch-needed");
      if (!this.tabArmed) {
        els.hint.textContent = isTouchDevice()
          ? "Tap the text to keep the keyboard open"
          : "Press Tab + Enter to restart";
      }
    },

    onInputBlur() {
      if (this.state !== "playing") return;
      if (isTouchDevice()) {
        els.hint.classList.add("touch-needed");
        els.hint.textContent = "Tap here to open keyboard";
        return;
      }
      setTimeout(() => {
        if (this.state === "playing") els.input.focus({ preventScroll: true });
      }, 0);
    },

    onFlowKey(e) {
      if (els.dataVault && !els.dataVault.hidden) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.closeDataVault();
        }
        return;
      }
      if (els.levelup && !els.levelup.hidden) {
        if (e.key === "Escape" || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          this.closeLevelUp();
        }
        return;
      }
      if (!els.gachaOverlay.hidden) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.closeGacha();
        }
        return;
      }
      if (!els.market.hidden) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.closeMarket();
        }
        return;
      }
      const inRun = this.state === "playing";
      const inResult = this.state === "victory" || this.state === "defeat";
      if (!inRun && !inResult) return;
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        this.armRestart();
        return;
      }
      if (e.key === "Enter" && this.tabArmed) {
        e.preventDefault();
        e.stopPropagation();
        this.retryRun();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.retryRun();
      }
    },

    armRestart() {
      this.tabArmed = true;
      if (els.hint) {
        els.hint.classList.add("restart-armed");
        els.hint.textContent = isTouchDevice()
          ? "Tap the text to keep the keyboard open"
          : "Press Enter to confirm restart";
      }
      clearTimeout(this.tabTimer);
      this.tabTimer = setTimeout(() => {
        this.tabArmed = false;
        if (els.hint) {
          els.hint.classList.remove("restart-armed");
          if (this.state === "playing") {
            els.hint.textContent = isTouchDevice()
              ? "Tap the text to keep the keyboard open"
              : "Press Tab + Enter to restart";
          }
        }
      }, 1400);
    },

    retryRun() {
      this.tabArmed = false;
      clearTimeout(this.tabTimer);
      if (els.hint) els.hint.classList.remove("restart-armed");
      if (!this.runCfg) {
        this.toStart();
        return;
      }
      this.start(this.runCfg);
    },

    openMarket(tab) {
      if (els.dataVault) els.dataVault.hidden = true;
      els.result.hidden = true;
      els.start.hidden = true;
      els.game.hidden = true;
      els.market.hidden = false;
      Cosmetics.paint();
      this.showMarketTab(tab || "vault");
      this.renderLocker();
    },

    closeMarket() {
      els.gachaOverlay.hidden = true;
      els.market.hidden = true;
      if (this.state === "victory" || this.state === "defeat") {
        els.result.hidden = false;
      } else {
        els.start.hidden = false;
        this.state = "start";
      }
      Cosmetics.paint();
    },

    openDataVault() {
      if (this.state === "playing") {
        SaveStore.toast("Finish the run to open Data Vault.");
        return;
      }
      els.gachaOverlay.hidden = true;
      els.market.hidden = true;
      els.start.hidden = true;
      els.game.hidden = true;
      els.result.hidden = true;
      if (els.dataVault) els.dataVault.hidden = false;
      SaveStore.refreshExport();
    },

    closeDataVault() {
      if (els.dataVault) els.dataVault.hidden = true;
      if (this.state === "victory" || this.state === "defeat") {
        els.result.hidden = false;
      } else {
        els.start.hidden = false;
        this.state = "start";
      }
      Cosmetics.paint();
      Progress.paintHud();
    },

    showMarketTab(tab) {
      const vault = tab !== "locker";
      els.tabVault.setAttribute("aria-selected", vault ? "true" : "false");
      els.tabLocker.setAttribute("aria-selected", vault ? "false" : "true");
      els.vaultView.hidden = !vault;
      els.lockerView.hidden = vault;
      if (!vault) this.renderLocker();
    },

    renderLocker() {
      ["runner", "monster", "sector"].forEach((slot) => {
        const host = document.getElementById(`locker-${slot}`);
        if (!host) return;
        host.replaceChildren();
        Cosmetics.list(slot).forEach((item) => {
          const owned = Cosmetics.owns(slot, item.id);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = `locker-item ${item.rarity}${owned ? "" : " locked"}${Cosmetics.equipped[slot] === item.id ? " equipped" : ""}`;
          btn.dataset.id = item.id;
          btn.innerHTML = `<div class="skin-preview slot-${slot} model-${item.model || item.id}" aria-hidden="true"></div><span class="name">${item.name}</span><span class="rarity">${item.rarity.toUpperCase()}${owned ? "" : item.id === "neon-hazard" ? " // LV. 15" : " // LOCKED"}</span>`;
          host.appendChild(btn);
        });
      });
    },

    pullBanner(slot, count) {
      if (this.pulling) return;
      const cost = count === 10 ? TEN_COST : PULL_COST;
      const useFree = count === 1 && Progress.freePulls > 0;
      if (!useFree && Cosmetics.credits < cost) {
        this.clearGachaFx();
        els.gachaOverlay.hidden = false;
        els.gachaReel.hidden = true;
        if (els.gachaCharge) els.gachaCharge.hidden = true;
        els.gachaCard.hidden = false;
        els.gachaMulti.hidden = true;
        els.gachaCard.className = "gacha-card";
        els.gachaRarity.textContent = "DENIED";
        els.gachaName.textContent = "Insufficient Credits";
        els.gachaSlot.textContent = `Need ${cost} CR`;
        els.gachaDup.hidden = true;
        els.equipNow.hidden = true;
        return;
      }
      AudioSystem.resume();
      if (useFree) {
        Progress.freePulls -= 1;
        Progress.save();
        Progress.paintHud();
      } else {
        Cosmetics.spend(cost);
      }
      this.pulling = true;
      this.lastPulls = [];
      const n = count === 10 ? 10 : 1;
      for (let i = 0; i < n; i++) this.lastPulls.push(Cosmetics.roll(slot));
      this.playGacha(slot);
    },

    playGacha(slot) {
      this.clearGachaFx();
      els.gachaOverlay.hidden = false;
      els.gachaOverlay.className = "scanning";
      if (els.gachaCharge) els.gachaCharge.hidden = true;
      els.gachaReel.hidden = false;
      els.gachaCard.hidden = true;
      els.gachaMulti.hidden = true;
      els.equipNow.hidden = false;
      const names = Cosmetics.list(slot).filter((item) => item.rarity !== "exclusive").map((item) => item.name);
      const featured = this.bestPull(this.lastPulls);
      const rarity = featured?.item.rarity || "common";
      const spinMs = rarity === "legendary" ? 1100 : rarity === "rare" ? 900 : 700;
      const start = performance.now();
      const spin = (now) => {
        const t = now - start;
        const idx = Math.floor(t / 70) % names.length;
        els.gachaReel.textContent = names[idx] || "DECRYPTING…";
        if (Math.floor(t / 70) !== Math.floor((t - 16) / 70)) AudioSystem.gachaTick(idx);
        if (t < spinMs) {
          this.gachaTimer = requestAnimationFrame(spin);
          return;
        }
        this.startGachaCharge(rarity);
      };
      this.gachaTimer = requestAnimationFrame(spin);
    },

    bestPull(pulls) {
      const list = pulls || [];
      const rank = { common: 0, rare: 1, legendary: 2, exclusive: 3 };
      return [...list].sort((a, b) => (rank[b.item.rarity] || 0) - (rank[a.item.rarity] || 0) || (a.dup - b.dup))[0] || list[0];
    },

    scheduleGacha(fn, ms) {
      const id = setTimeout(fn, ms);
      (this.gachaWaits || (this.gachaWaits = [])).push(id);
      return id;
    },

    clearGachaFx() {
      cancelAnimationFrame(this.gachaTimer);
      (this.gachaWaits || []).forEach((id) => clearTimeout(id));
      this.gachaWaits = [];
      if (els.gachaVfx) els.gachaVfx.replaceChildren();
      if (els.gachaOverlay) els.gachaOverlay.className = "";
    },

    startGachaCharge(rarity) {
      els.gachaReel.hidden = true;
      if (els.gachaCharge) els.gachaCharge.hidden = false;
      this.setGachaTier("common", "SIGNAL LOCK…", "STABLE");
      AudioSystem.gachaCharge();
      if (rarity === "rare" || rarity === "legendary") {
        this.scheduleGacha(() => {
          this.setGachaTier("rare", "ANOMALY DETECTED", "RARE SIGNAL");
          AudioSystem.gachaTierUp("rare");
        }, 420);
      }
      if (rarity === "legendary") {
        this.scheduleGacha(() => {
          this.setGachaTier("legendary", "CONTAINMENT BREACH", "LEGENDARY");
          AudioSystem.gachaTierUp("legendary");
        }, 1180);
      }
      const burstAt = rarity === "legendary" ? 2050 : rarity === "rare" ? 1180 : 500;
      this.scheduleGacha(() => this.burstGacha(rarity), burstAt);
    },

    setGachaTier(tier, label, hint) {
      if (els.gachaOrb) els.gachaOrb.className = `gacha-orb tier-${tier}`;
      if (els.gachaOverlay) els.gachaOverlay.className = `charging tier-${tier}`;
      if (els.gachaChargeLabel) els.gachaChargeLabel.textContent = label;
      if (els.gachaTierHint) els.gachaTierHint.textContent = hint;
    },

    burstGacha(rarity) {
      if (els.gachaOverlay) els.gachaOverlay.className = `bursting tier-${rarity}`;
      this.spawnGachaVfx(rarity);
      AudioSystem.gachaReveal(rarity);
      const wait = rarity === "legendary" ? 720 : rarity === "rare" ? 380 : 180;
      this.scheduleGacha(() => this.revealGacha(), wait);
    },

    spawnGachaVfx(rarity) {
      const host = els.gachaVfx;
      if (!host) return;
      host.replaceChildren();
      const n = rarity === "legendary" ? 40 : rarity === "rare" ? 22 : 10;
      for (let i = 0; i < n; i++) {
        const spark = document.createElement("span");
        spark.className = `gacha-spark ${rarity}`;
        spark.style.setProperty("--a", `${(360 / n) * i}deg`);
        spark.style.setProperty("--d", `${70 + (i % 7) * 16}px`);
        spark.style.animationDelay = `${(i % 8) * 18}ms`;
        host.appendChild(spark);
      }
    },

    revealGacha() {
      this.pulling = false;
      if (els.gachaCharge) els.gachaCharge.hidden = true;
      const pulls = this.lastPulls || [];
      const featured = this.bestPull(pulls);
      this.pendingEquip = featured;
      els.gachaReel.hidden = true;
      if (els.gachaOverlay) {
        els.gachaOverlay.className = `revealed tier-${featured?.item.rarity || "common"}`;
      }
      if (pulls.length > 1) {
        els.gachaCard.hidden = true;
        els.gachaMulti.hidden = false;
        els.gachaMulti.replaceChildren();
        pulls.forEach((pull, i) => {
          const mini = document.createElement("button");
          mini.type = "button";
          mini.className = `gacha-mini ${pull.item.rarity}`;
          mini.style.animationDelay = `${i * 55}ms`;
          mini.innerHTML = `<div class="skin-preview slot-${pull.slot} model-${pull.item.model || pull.item.id}"></div><span class="mini-rarity">${pull.item.rarity.toUpperCase()}</span>${pull.item.name}${pull.dup ? "<br>DUP +150" : ""}`;
          mini.addEventListener("click", () => {
            this.pendingEquip = pull;
            this.showGachaCard(pull);
          });
          els.gachaMulti.appendChild(mini);
        });
        this.showGachaCard(featured);
        return;
      }
      els.gachaMulti.hidden = true;
      this.showGachaCard(featured);
    },

    showGachaCard(pull) {
      if (!pull) return;
      els.gachaCard.hidden = false;
      els.gachaCard.className = `gacha-card ${pull.item.rarity} pop-in`;
      els.gachaRarity.textContent = pull.item.rarity.toUpperCase();
      els.gachaRarity.className = `gacha-rarity ${pull.item.rarity}`;
      els.gachaName.textContent = pull.item.name;
      els.gachaSlot.textContent = pull.slot.toUpperCase();
      els.gachaSwatch.className = `gacha-swatch skin-preview slot-${pull.slot} model-${pull.item.model || pull.item.id}`;
      els.gachaSwatch.style.background = "";
      els.gachaDup.hidden = !pull.dup;
      els.equipNow.hidden = !!pull.dup;
    },

    equipGacha() {
      const pull = this.pendingEquip;
      if (pull && !pull.dup) Cosmetics.equip(pull.slot, pull.item.id);
      this.closeGacha();
      this.renderLocker();
    },

    closeGacha() {
      this.clearGachaFx();
      this.pulling = false;
      els.gachaOverlay.hidden = true;
      if (els.gachaCharge) els.gachaCharge.hidden = true;
      Cosmetics.paint();
      this.renderLocker();
    },

    maybeStreakToast() {
      const n = this.typing.streak;
      const tier = STREAK_TOASTS.find((item) => item.at === n);
      if (!tier) return;
      this.showStreakToast(tier);
    },

    showStreakToast(tier) {
      const el = els.streakToast;
      if (!el) return;
      AudioSystem.resume();
      AudioSystem.streakChime(tier.at);
      el.hidden = false;
      el.setAttribute("aria-hidden", "false");
      el.textContent = tier.text;
      el.className = `streak-toast tier-${tier.at}`;
      const caret = document.getElementById("caret");
      const panel = document.getElementById("typing-panel");
      if (caret && panel) {
        const cr = caret.getBoundingClientRect();
        const pr = panel.getBoundingClientRect();
        const left = clamp(cr.left - pr.left - 24, 8, Math.max(8, pr.width - 260));
        const top = clamp(cr.top - pr.top - 36, 6, Math.max(6, pr.height - 40));
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      }
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
      }, 1400);
    },

    paintRewardBreakdown(reward) {
      if (els.resBaseCredits) {
        els.resBaseCredits.textContent = `+${reward.base} Credits`;
      }
      if (els.resStreakBonus) {
        els.resStreakBonus.textContent = reward.streak
          ? `+${reward.streak} Credits (${reward.maxStreak} streak)`
          : "+0 Credits";
      }
      if (els.resTotalCredits) {
        els.resTotalCredits.textContent = "+0 Credits";
        this.animateRewardTotal(reward.total);
      }
      if (els.resCredits) {
        els.resCredits.textContent = `${reward.label}  ·  ${reward.base} + ${reward.streak}  //  BAL ${Cosmetics.credits}`;
      }
    },

    animateRewardTotal(total) {
      cancelAnimationFrame(this.rewardAnim);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 780);
        const eased = 1 - Math.pow(1 - t, 3);
        const n = Math.round(total * eased);
        if (els.resTotalCredits) els.resTotalCredits.textContent = `+${n} Credits`;
        if (t < 1) this.rewardAnim = requestAnimationFrame(tick);
      };
      this.rewardAnim = requestAnimationFrame(tick);
    },

    paintXpBreakdown(xp, before, after) {
      if (els.resXpDist) els.resXpDist.textContent = `+${xp.dist}`;
      if (els.resXpAcc) els.resXpAcc.textContent = `+${xp.acc}`;
      if (els.resXpStreak) els.resXpStreak.textContent = `+${xp.streak}`;
      if (els.resXpWpm) els.resXpWpm.textContent = `+${xp.wpm}`;
      if (els.resXpTotal) els.resXpTotal.textContent = "+0";
      if (els.resXpFill) els.resXpFill.style.width = `${Math.round(before.pct * 1000) / 10}%`;
      if (els.resXpMeta) els.resXpMeta.textContent = before.label;
      if (els.resXpTrack) els.resXpTrack.title = before.label;
      this.animateXpBar(xp, before, after);
    },

    animateXpBar(xp, before, after) {
      cancelAnimationFrame(this.xpAnim);
      const start = performance.now();
      const duration = after.level > before.level ? 1100 : 820;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        if (els.resXpTotal) els.resXpTotal.textContent = `+${Math.round(xp.total * eased)}`;
        if (after.level > before.level) {
          const fill = t < 0.45
            ? before.pct + (1 - before.pct) * (t / 0.45)
            : after.pct * ((t - 0.45) / 0.55);
          if (els.resXpFill) els.resXpFill.style.width = `${Math.round(clamp(fill, 0, 1) * 1000) / 10}%`;
          const lv = t < 0.45 ? before.level : after.level;
          const into = t < 0.45 ? Math.round(before.into + (before.need - before.into) * (t / 0.45)) : after.into;
          const need = t < 0.45 ? before.need : after.need;
          if (els.resXpMeta) els.resXpMeta.textContent = `LV. ${lv} — ${formatXp(Math.min(into, need))} / ${formatXp(need)} XP`;
        } else {
          const into = Math.round(before.into + (after.into - before.into) * eased);
          if (els.resXpFill) els.resXpFill.style.width = `${Math.round((into / after.need) * 1000) / 10}%`;
          if (els.resXpMeta) els.resXpMeta.textContent = `LV. ${after.level} — ${formatXp(into)} / ${formatXp(after.need)} XP`;
        }
        if (t < 1) this.xpAnim = requestAnimationFrame(tick);
      };
      this.xpAnim = requestAnimationFrame(tick);
    },

    showLevelUp(grants, beforeLevel) {
      if (!els.levelup || !grants.length) return;
      const last = grants[grants.length - 1];
      const first = grants[0];
      const milestones = grants.filter((g) => g.milestone);
      const major = milestones[milestones.length - 1] || null;
      els.levelupNum.textContent = `LV. ${last.level}`;
      if (els.levelupStage) els.levelupStage.classList.toggle("milestone", !!major);
      if (els.levelupKicker) {
        els.levelupKicker.textContent = major
          ? `MAJOR MILESTONE REACHED: LEVEL ${major.level}`
          : "CLEARANCE UPGRADED";
      }
      if (els.levelupBanner) {
        els.levelupBanner.hidden = !major;
        if (major) els.levelupBanner.textContent = `MAJOR MILESTONE REACHED: LEVEL ${major.level}`;
      }
      if (els.levelupFree) {
        els.levelupFree.hidden = !major;
        if (major) {
          const pulls = milestones.length;
          const creds = milestones.reduce((sum, g) => sum + g.credits, 0);
          els.levelupFree.textContent = pulls === 1
            ? "+500 CREDITS (1 FREE GACHA PULL) UNLOCKED!"
            : `+${formatXp(creds)} CREDITS (${pulls} FREE GACHA PULLS) UNLOCKED!`;
        }
      }
      if (els.levelupRange) {
        els.levelupRange.textContent = grants.length > 1
          ? `LV. ${beforeLevel} → LV. ${last.level}`
          : `LV. ${first.level - 1} → LV. ${first.level}`;
      }
      if (els.levelupRewards) {
        els.levelupRewards.replaceChildren();
        grants.forEach((grant) => {
          grant.rewards.forEach((line) => {
            const li = document.createElement("li");
            li.textContent = `LV. ${grant.level} · ${line}`;
            els.levelupRewards.appendChild(li);
          });
        });
      }
      if (els.levelupBurst) {
        els.levelupBurst.replaceChildren();
        for (let i = 0; i < 20; i++) {
          const spark = document.createElement("span");
          spark.style.setProperty("--a", `${(360 / 20) * i}deg`);
          spark.style.setProperty("--d", `${48 + (i % 5) * 14}px`);
          els.levelupBurst.appendChild(spark);
        }
      }
      els.levelup.hidden = false;
      AudioSystem.resume();
      AudioSystem.levelUp();
    },

    closeLevelUp() {
      if (els.levelup) els.levelup.hidden = true;
      Progress.paintHud();
      this.renderLocker();
    },

    toggleMute() {
      AudioSystem.resume();
      AudioSystem.toggle();
      this.syncMuteButtons();
      if (this.state === "playing") this.focusInput();
    },

    syncMuteButtons() {
      const label = AudioSystem.muted ? "Audio: Off" : "Audio: On";
      els.muteStart.textContent = label;
      els.muteGame.textContent = label;
    },

    renderScores() {
      const scores = loadScores();
      const blocks = [
        ...Object.keys(DIFFICULTIES).map((key) => ({ key, name: DIFFICULTIES[key].name })),
        { key: "endless", name: "Endless" },
        { key: "custom", name: "Laboratory" },
      ];
      els.scores.innerHTML = blocks.map(({ key, name }) => {
        const rows = scores[key] || [];
        const items = rows.length
          ? rows.map((r) => {
            if (key === "endless" || r.endless) {
              return `<li>${Math.round(r.distance || 0)}m · ${r.wpm.toFixed(0)} WPM</li>`;
            }
            return `<li>${r.escaped ? "ESC" : "FAIL"} ${r.wpm.toFixed(0)} WPM · ${r.accuracy.toFixed(0)}%</li>`;
          }).join("")
          : "<li>No runs yet</li>";
        return `<div class="score-col"><h3>${name}</h3><ol>${items}</ol></div>`;
      }).join("");
    },

    start(cfg) {
      if (!cfg) return;
      this.runCfg = cfg;
      this.tabArmed = false;
      this.sliding = false;
      this.sampleAcc = 0;
      Renderer.slideT = 0;
      Renderer.camZoom = 1;
      Renderer.shakeX = 0;
      Renderer.shakeY = 0;
      Renderer.stompClock = 0;
      if (els.slideBanner) els.slideBanner.hidden = true;
      if (els.vignette) {
        els.vignette.style.setProperty("--vig", "0");
        els.vignette.classList.remove("pulse");
      }
      document.getElementById("canvas-wrap").classList.remove("sliding");
      AudioSystem.resume();
      AudioSystem.stopAmbience();
      AudioSystem.startAmbience();

      this.typing.start(cfg);
      this.race = createRace(cfg);
      this.state = "playing";
      this.lastTs = 0;
      this.hudAcc = 0;
      Renderer.steam = [];
      Renderer.dust = [];
      Renderer.shake = 0;
      Renderer.scroll = 0;
      Renderer.playerBias = 0.38;
      document.getElementById("canvas-wrap").classList.remove("sprinting");

      els.start.hidden = true;
      els.result.hidden = true;
      els.game.hidden = false;
      if (els.streakToast) {
        els.streakToast.hidden = true;
        els.streakToast.className = "streak-toast";
      }
      if (els.levelup) els.levelup.hidden = true;
      clearTimeout(this.levelupTimer);
      this.levelupTimer = 0;
      WordsView.rebuild(this.typing);
      this.updateHud();
      requestAnimationFrame(() => {
        Renderer.resize();
        WordsView.sync(this.typing, true);
      });
      els.input.value = "";
      this.focusInput();

      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame((t) => this.loop(t));
    },

    toStart() {
      this.state = "start";
      cancelAnimationFrame(this.raf);
      AudioSystem.stopAmbience();
      AudioSystem.updateRumble(0);
      els.game.hidden = true;
      els.result.hidden = true;
      els.start.hidden = false;
      if (els.streakToast) els.streakToast.hidden = true;
      if (els.levelup) els.levelup.hidden = true;
      clearTimeout(this.levelupTimer);
      this.levelupTimer = 0;
      this.renderScores();
      Cosmetics.paint();
    },

    applyKey(key) {
      const result = this.typing.handleKey(key, performance.now());
      if (!result) return false;
      if (result === "ok" || result === "err" || result === "extra" || result === "boost") {
        AudioSystem.ensureMusic();
      }
      if (result === "ok" || result === "boost") AudioSystem.click();
      else if (result === "err" || result === "extra") AudioSystem.buzz();
      if (result === "ok") this.race.nudge(true);
      else if (result === "err" || result === "extra") this.race.nudge(false);
      if (key === " " && result === "ok") {
        Renderer.spawnWordBurst(Renderer.lastPlayerX, Renderer.lastPlayerY + 58);
        this.maybeStreakToast();
      }
      WordsView.sync(this.typing);
      this.updateHud();
      return true;
    },

    onKey(e) {
      if (this.state !== "playing") return;
      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tracked = e.key === "Backspace" || e.key === " " || e.key === "Shift" || e.key.length === 1;
      if (!tracked) return;
      e.preventDefault();
      this.handledByKey = true;
      this.applyKey(e.key);
      els.input.value = "";
      requestAnimationFrame(() => { this.handledByKey = false; });
    },

    onBeforeInput(e) {
      if (this.state !== "playing" || this.handledByKey) return;
      const type = e.inputType || "";
      if (type === "deleteContentBackward" || type === "deleteContentForward") {
        e.preventDefault();
        this.applyKey("Backspace");
        els.input.value = "";
        return;
      }
      if (type === "insertLineBreak" || type === "insertParagraph") {
        e.preventDefault();
        this.applyKey(" ");
        els.input.value = "";
        return;
      }
      if (type === "insertText" && e.data) {
        e.preventDefault();
        for (const ch of e.data) this.applyKey(ch === "\n" ? " " : ch);
        els.input.value = "";
      }
    },

    onTextInput(e) {
      const val = els.input.value;
      els.input.value = "";
      if (this.state !== "playing") return;
      if (this.handledByKey) {
        this.handledByKey = false;
        return;
      }
      if (e && e.inputType === "deleteContentBackward") {
        this.applyKey("Backspace");
        return;
      }
      if (!val) return;
      for (const ch of val) this.applyKey(ch === "\n" ? " " : ch);
    },

    updateHud() {
      const t = this.typing;
      const r = this.race;
      const live = t.liveWpm();
      els.wpm.textContent = live == null ? "--" : String(Math.round(live));
      els.acc.textContent = `${Math.round(t.accuracy())}%`;
      els.streak.textContent = String(t.streak);
      els.streak.classList.toggle("hot", t.streak >= 10 && t.streak < 20);
      els.streak.classList.toggle("fire", t.streak >= 20 && t.streak < 30);
      els.streak.classList.toggle("overdrive", t.streak >= 30 && t.streak < 50);
      els.streak.classList.toggle("flow", t.streak >= 50);
      els.dist.textContent = `${Math.floor(Math.max(0, r.player))}m`;
      els.door.textContent = r.diff.endless
        ? "ENDLESS"
        : r.diff.doorOff
          ? "OFF"
          : `${Math.round(r.doorOpen * 100)}%`;
      Cosmetics.paint();

      const fill = t.boostLeft > 0
        ? (t.boostLeft / ADRENALINE_SEC) * 100
        : (t.adrenaline / ADRENALINE_WORDS) * 100;
      els.adFill.style.width = `${fill}%`;
      els.adTrack.classList.toggle("ready", t.adrenaline >= ADRENALINE_WORDS && t.boostLeft <= 0);
      els.adTrack.classList.toggle("boost", t.boostLeft > 0);
      els.adStatus.textContent = t.boostLeft > 0
        ? `BOOST ${t.boostLeft.toFixed(1)}s`
        : t.adrenaline >= ADRENALINE_WORDS
          ? "SHIFT / AUTO"
          : `${t.adrenaline}/${ADRENALINE_WORDS} WORDS`;

      const mapMin = r.diff.endless ? Math.max(0, r.player - 750) : -220;
      const mapSpan = r.diff.endless ? 1000 : (Number.isFinite(r.track) ? r.track : TRACK) - mapMin;
      const mapPct = (pos) => `${clamp((pos - mapMin) / Math.max(mapSpan, 1), 0, 1) * 100}%`;
      els.mapPlayer.style.left = mapPct(r.player);
      els.mapMonster.style.left = mapPct(r.monster);
      els.mapDoor.style.display = r.diff.doorOff || r.diff.endless ? "none" : "block";
      els.mapDoor.style.left = "100%";
      els.mapGap.textContent = `GAP ${Math.max(0, Math.round(r.player - r.monster))}m`;
    },

    loop(ts) {
      if (this.state !== "playing") return;
      if (!this.lastTs) this.lastTs = ts;
      const dt = clamp((ts - this.lastTs) / 1000, 0, 0.05);
      this.lastTs = ts;

      if (this.sliding) {
        Renderer.slideT = clamp(Renderer.slideT + dt / 0.5, 0, 1);
        Renderer.draw(this.race, this.typing, dt);
        if (Renderer.slideT >= 1) {
          this.sliding = false;
          if (els.slideBanner) els.slideBanner.hidden = true;
          document.getElementById("canvas-wrap").classList.remove("sliding");
          this.finish("win");
          return;
        }
        this.raf = requestAnimationFrame((t) => this.loop(t));
        return;
      }

      this.typing.tick(dt);
      this.race.update(dt, this.typing, ts);
      Renderer.draw(this.race, this.typing, dt);
      document.getElementById("canvas-wrap").classList.toggle(
        "sprinting",
        this.race.speed > this.race.targetSpeed * 0.22
      );

      const gap = this.race.player - this.race.monster;
      const proximity = clamp(1 - gap / 200, 0, 1);
      AudioSystem.updateRumble(proximity);
      const remain = Number.isFinite(this.race.track) ? this.race.track - this.race.player : 9999;
      AudioSystem.updateMusic(gap, remain, this.typing.boostLeft > 0);

      if (els.vignette) {
        const vig = gap < 40 ? clamp((40 - gap) / 40, 0, 1) : 0;
        els.vignette.style.setProperty("--vig", String(vig));
        els.vignette.classList.toggle("pulse", vig > 0 && gap < 15);
      }

      if (this.typing.startedAt) {
        this.sampleAcc += dt;
        if (this.sampleAcc >= 0.35) {
          this.sampleAcc = 0;
          const instant = (this.typing.recentCps(ts) * 60) / 5;
          this.typing.wpmLog.push(instant);
        }
      }

      this.updateHud();

      if (this.race.result === "win" && this.race.doorSecondsLeft < 2 && !this.race.diff.doorOff && !this.race.diff.endless) {
        this.race.result = null;
        this.sliding = true;
        Renderer.slideT = 0.001;
        if (els.slideBanner) els.slideBanner.hidden = false;
        document.getElementById("canvas-wrap").classList.add("sliding");
        this.raf = requestAnimationFrame((t) => this.loop(t));
        return;
      }

      if (this.race.result) {
        this.finish(this.race.result);
        return;
      }
      this.raf = requestAnimationFrame((t) => this.loop(t));
    },

    drawSparkline(samples) {
      const canvas = els.spark;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(8, 12, 18, 0.9)";
      ctx.fillRect(0, 0, w, h);
      const data = samples && samples.length ? samples : [0];
      const max = Math.max(20, ...data);
      const point = (i) => {
        const x = data.length === 1 ? 4 : (i / (data.length - 1)) * (w - 8) + 4;
        const y = h - 6 - (clamp(data[i], 0, max) / max) * (h - 14);
        return [x, y];
      };
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = (h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.beginPath();
      data.forEach((_, i) => {
        const [x, y] = point(i);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      const last = point(data.length - 1);
      ctx.lineTo(last[0], h - 6);
      ctx.lineTo(4, h - 6);
      ctx.closePath();
      ctx.fillStyle = "rgba(61, 255, 208, 0.12)";
      ctx.fill();
      ctx.beginPath();
      data.forEach((_, i) => {
        const [x, y] = point(i);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#3dffd0";
      ctx.lineWidth = 2;
      ctx.stroke();
    },

    finish(result) {
      if (this.state === "victory" || this.state === "defeat") return;
      this.state = result === "win" ? "victory" : "defeat";
      cancelAnimationFrame(this.raf);
      AudioSystem.stopAmbience();
      if (result === "win") AudioSystem.victory();
      else AudioSystem.slam();

      const cfg = this.race.diff;
      const escaped = result === "win";
      const entry = {
        difficulty: cfg.scoreKey || cfg.id,
        wpm: this.typing.wpm(),
        accuracy: this.typing.accuracy(),
        time: this.race.elapsed,
        distance: this.race.player,
        endless: !!cfg.endless,
        escaped,
        at: Date.now(),
      };
      const { rank } = addScore(entry);

      els.resultPanel.classList.toggle("win", escaped);
      els.resultPanel.classList.toggle("lose", !escaped);
      els.resEye.textContent = cfg.endless
        ? "SURVIVAL LOG"
        : escaped ? "GATE THETA // OPEN" : "SIGNAL LOST";
      els.resTitle.textContent = cfg.endless
        ? "RUN ENDED"
        : escaped ? "EXTRACTED" : result === "lose-door" ? "DOOR SEALED" : "CAUGHT";
      els.resCopy.textContent = cfg.endless
        ? `You lasted ${Math.round(this.race.player)}m before the hunt closed. Distance is the only score that matters out here.`
        : escaped
          ? "You crossed the threshold as the clamps bit down. Experiment-09 hits the far side of the slab. You are out."
          : result === "lose-door"
            ? "The blast door sealed with you still in the corridor. The rumble is the last thing on the tape."
            : "Experiment-09 closed the gap. The logs end in static and a wet impact.";
      els.resWpm.textContent = String(Math.round(this.typing.wpm()));
      els.resRaw.textContent = String(Math.round(this.typing.rawWpm()));
      els.resAcc.textContent = `${Math.round(entry.accuracy)}%`;
      els.resTime.textContent = formatTime(entry.time);
      els.resStreak.textContent = String(this.typing.maxStreak);
      els.resDist.textContent = `${Math.round(this.race.player)}m`;
      this.drawSparkline(this.typing.wpmLog);
      const trackLen = Number.isFinite(this.race.track) ? this.race.track : TRACK;
      const reward = Cosmetics.rewardFor(entry.distance, trackLen, escaped, this.typing.maxStreak);
      Cosmetics.addCredits(reward.total);
      const xp = Progress.xpFor(entry.distance, entry.accuracy, this.typing.maxStreak, this.typing.wpm(), this.typing.totalKeys);
      const progress = Progress.addXp(xp.total);
      SaveStore.noteRun(entry, this.typing.maxStreak);
      this.paintRewardBreakdown(reward);
      this.paintXpBreakdown(xp, progress.before, progress.after);
      clearTimeout(this.levelupTimer);
      this.levelupTimer = 0;
      if (progress.grants.length) {
        this.levelupTimer = setTimeout(() => this.showLevelUp(progress.grants, progress.before.level), 1050);
      }
      const hunt = cfg.monsterOff ? "hunt off" : `${cfg.monsterWpm} WPM hunt`;
      const door = cfg.doorOff || cfg.endless ? "door off" : `${Math.round(cfg.doorTime)}s door`;
      els.resSettings.textContent = `${cfg.name}${cfg.endless ? " · Endless" : ""} · ${hunt} · ${door} · stall ${cfg.stall.toFixed(1)}s · ${cfg.textMode || "mix"} text`;
      els.resRecord.textContent = rank > 0 && rank <= 5
        ? `Logged as #${rank} on the ${cfg.endless ? "Endless" : cfg.name} board.`
        : "Run recorded. Not a top-five mark.";

      els.result.hidden = false;
    },
  };

  window.__ETB = Game;
  Game.cosmetics = Cosmetics;
  Game.progress = Progress;
  Game.saveStore = SaveStore;
  Game.boot();
})();
