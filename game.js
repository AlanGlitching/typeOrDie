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

  const LEX = {
    nouns: [
      "terminal", "containment", "airlock", "reactor", "specimen", "protocol",
      "shadow", "bulkhead", "corridor", "override", "sensor", "core", "breach",
      "perimeter", "generator", "hatch", "visor", "clamp", "siren", "coolant",
    ],
    verbs: [
      "collapse", "override", "shatter", "escape", "terminate", "isolate",
      "activate", "bypass", "unseal", "accelerate", "rupture", "stabilize",
      "divert", "disable", "seal", "purge", "evacuate",
    ],
    adjectives: [
      "critical", "hostile", "hydraulic", "compromised", "unstable", "rapidly",
      "emergency", "synthetic", "lethal", "autonomous", "seismic", "manual",
      "failing", "locked", "burning",
    ],
    connectors: [
      "before it catches",
      "lock the gates",
      "divert power to thrusters",
      "pressure drops to zero",
      "movement detected in quadrant four",
      "do not look back",
      "keep the visor sealed",
      "sprint for the blast door",
    ],
  };

  const COMMON_WORDS = [
    "the", "of", "to", "and", "a", "in", "is", "it", "you", "that", "he", "was",
    "for", "on", "are", "with", "as", "his", "they", "be", "at", "one", "have",
    "this", "from", "or", "had", "by", "but", "some", "what", "there", "we",
    "can", "out", "other", "were", "all", "your", "when", "up", "use", "word",
    "how", "said", "each", "she", "which", "do", "their", "time", "if", "will",
    "way", "about", "many", "then", "them", "write", "would", "like", "so",
    "these", "her", "long", "make", "thing", "see", "him", "two", "has", "look",
    "more", "day", "could", "go", "come", "did", "number", "sound", "no", "most",
    "who", "over", "know", "water", "than", "call", "first", "people", "may",
    "down", "side", "been", "now", "find", "any", "new", "work", "part", "take",
    "get", "place", "made", "live", "where", "after", "back", "little", "only",
    "round", "man", "year", "came", "show", "every", "good", "me", "give", "our",
    "under", "name", "very", "through", "just", "form", "great", "think", "say",
    "help", "low", "line", "turn", "cause", "much", "mean", "before", "move",
    "right", "old", "too", "same", "tell", "does", "set", "three", "want", "air",
    "well", "also", "play", "small", "end", "put", "home", "read", "hand", "large",
    "spell", "add", "even", "land", "here", "must", "big", "high", "such", "follow",
    "act", "why", "ask", "change", "went", "light", "kind", "off", "need", "house",
    "try", "us", "again", "point", "world", "near", "build", "self", "earth",
    "father", "head", "stand", "own", "page", "should", "found", "answer", "school",
    "grow", "study", "still", "learn", "plant", "cover", "food", "sun", "four",
    "between", "state", "keep", "eye", "never", "last", "let", "thought", "city",
    "tree", "cross", "farm", "hard", "start", "might", "story", "saw", "far", "sea",
    "draw", "left", "late", "run", "while", "press", "close", "night", "real",
    "life", "few", "north", "book", "carry", "took", "science", "eat", "room",
    "friend", "began", "idea", "stop", "once", "base", "hear", "cut", "sure",
    "watch", "color", "face", "wood", "main", "enough", "open", "seem", "next",
    "always", "those", "both", "paper", "together", "got", "group", "often",
    "important", "until", "children", "feet", "car", "mile", "walk", "white",
    "begin", "example", "music", "mark", "letter", "river", "care", "second", "rain",
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

  /* ------------------------------------------------------------------ */
  /* Audio                                                               */
  /* ------------------------------------------------------------------ */

  const AudioSystem = {
    ctx: null,
    master: null,
    muted: localStorage.getItem(MUTE_KEY) === "1",
    sirenNodes: null,
    rumbleNodes: null,

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

      this.startMusic();
    },

    startMusic() {
      if (!this.ctx || this.music) return;
      const t = this.ctx.currentTime;
      const bus = this.ctx.createGain();
      bus.gain.setValueAtTime(0.0001, t);
      bus.gain.exponentialRampToValueAtTime(0.55, t + 0.18);
      bus.connect(this.master);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = "lowpass";
      bassFilter.frequency.setValueAtTime(600, t);
      bassFilter.Q.setValueAtTime(7.2, t);

      const bassGain = this.ctx.createGain();
      bassGain.gain.value = 0.16;
      bassFilter.connect(bassGain);
      bassGain.connect(bus);

      const bassA = this.ctx.createOscillator();
      const bassB = this.ctx.createOscillator();
      bassA.type = "sawtooth";
      bassB.type = "sawtooth";
      bassA.frequency.setValueAtTime(73.42, t);
      bassB.frequency.setValueAtTime(73.42, t);
      bassB.detune.setValueAtTime(8, t);
      bassA.connect(bassFilter);
      bassB.connect(bassFilter);
      bassA.start(t);
      bassB.start(t);

      const warnGain = this.ctx.createGain();
      warnGain.gain.value = 0.0001;
      warnGain.connect(bus);

      this.music = {
        bus,
        bassFilter,
        bassGain,
        bassA,
        bassB,
        warnGain,
        step: 0,
        nextTime: t + 0.04,
        boosting: false,
        intensity: 0,
        notes: [73.42, 87.31, 98.0, 116.54],
      };
      this.scheduleMusic();
    },

    scheduleMusic() {
      if (!this.ctx || !this.music) return;
      const stepSec = 60 / 136 / 4;
      const horizon = this.ctx.currentTime + 0.14;
      while (this.music && this.music.nextTime < horizon) {
        this.playMusicStep(this.music.step, this.music.nextTime);
        this.music.nextTime += stepSec;
        this.music.step = (this.music.step + 1) % 16;
      }
    },

    playMusicStep(step, when) {
      const m = this.music;
      if (!m || !this.ctx) return;
      const boost = m.boosting;

      if (step % 4 === 0) this.synthKick(when);
      if (step === 4 || step === 12) this.synthSnare(when);
      this.synthHat(when, step % 2 === 0 ? 0.045 : 0.028);
      if (boost) this.synthHat(when + (60 / 136 / 8), 0.03);

      if (step % 4 === 0) {
        const note = m.notes[(step / 4) | 0];
        const freq = boost ? note * 1.059 : note;
        m.bassA.frequency.setTargetAtTime(freq, when, 0.012);
        m.bassB.frequency.setTargetAtTime(freq, when, 0.012);
        m.bassGain.gain.setValueAtTime(0.2, when);
        m.bassGain.gain.exponentialRampToValueAtTime(0.13, when + 0.18);
      }

      if (m.intensity > 0.48 && (step === 0 || step === 8)) {
        this.synthWarn(when, m.intensity);
      }
    },

    synthKick(when) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(148, when);
      osc.frequency.exponentialRampToValueAtTime(42, when + 0.11);
      g.gain.setValueAtTime(0.62, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
      osc.connect(g);
      g.connect(this.music.bus);
      osc.start(when);
      osc.stop(when + 0.22);
    },

    synthSnare(when) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.9;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.music.bus);
      src.start(when);
      src.stop(when + 0.14);

      const tone = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(196, when);
      tone.frequency.exponentialRampToValueAtTime(110, when + 0.07);
      tg.gain.setValueAtTime(0.08, when);
      tg.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
      tone.connect(tg);
      tg.connect(this.music.bus);
      tone.start(when);
      tone.stop(when + 0.09);
    },

    synthHat(when, vol) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7200;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.03);
      src.connect(hp);
      hp.connect(g);
      g.connect(this.music.bus);
      src.start(when);
      src.stop(when + 0.04);
    },

    synthWarn(when, intensity) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(466, when);
      osc.frequency.linearRampToValueAtTime(622, when + 0.16);
      const vol = 0.012 + intensity * 0.05;
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
      osc.connect(g);
      g.connect(this.music.warnGain);
      osc.start(when);
      osc.stop(when + 0.22);
    },

    updateRumble(proximity) {
      if (!this.rumbleNodes || !this.ctx) return;
      const g = 0.001 + proximity * 0.12;
      this.rumbleNodes.rumbleGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.08);
      this.rumbleNodes.rumble.frequency.setTargetAtTime(38 + proximity * 28, this.ctx.currentTime, 0.1);
    },

    updateMusic(proximity, remaining, boosting) {
      this.scheduleMusic();
      if (!this.music || !this.ctx) return;
      const late = remaining <= 200 ? clamp(1 - remaining / 200, 0, 1) : 0;
      const intensity = clamp(Math.max(proximity, late), 0, 1);
      this.music.intensity = intensity;
      this.music.boosting = !!boosting;
      const cutoff = 600 + intensity * 2900;
      const now = this.ctx.currentTime;
      this.music.bassFilter.frequency.setTargetAtTime(cutoff, now, 0.08);
      this.music.bassFilter.Q.setTargetAtTime(7.2 + intensity * 3.4, now, 0.1);
      const warn = intensity > 0.42 ? (intensity - 0.42) * 0.22 : 0.0001;
      this.music.warnGain.gain.setTargetAtTime(Math.max(0.0001, warn), now, 0.1);
      this.music.bassA.detune.setTargetAtTime(boosting ? 70 : 0, now, 0.05);
      this.music.bassB.detune.setTargetAtTime(boosting ? 86 : 8, now, 0.05);
    },

    teardownMusic(handle) {
      if (!handle) return;
      ["bassA", "bassB"].forEach((key) => {
        try { handle[key].stop(); } catch { /* already stopped */ }
        try { handle[key].disconnect(); } catch { /* */ }
      });
      ["bassFilter", "bassGain", "warnGain", "bus"].forEach((key) => {
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
        else handle.bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      } catch { /* */ }
      const delay = immediate ? 0 : 240;
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
  };

  /* ------------------------------------------------------------------ */
  /* Typing                                                              */
  /* ------------------------------------------------------------------ */

  const TextGen = {
    pick(list, used) {
      const pool = list.filter((w) => w && !used.has(w));
      const src = pool.length ? pool : list;
      const word = src[Math.floor(Math.random() * src.length)];
      if (word) used.add(word);
      return word || "system";
    },

    cap(text) {
      const s = String(text || "").trim();
      if (!s) return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
    },

    bare(word) {
      return String(word || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    },

    thematicSentence() {
      const used = new Set();
      const n = () => this.pick(LEX.nouns, used);
      const v = () => this.pick(LEX.verbs, used);
      const a = () => this.pick(LEX.adjectives, used);
      const c = () => this.pick(LEX.connectors, used);
      const builders = [
        () => `Warning: the ${n()} is ${a()}, ${v()} the ${n()} immediately.`,
        () => `Emergency protocol engaged as ${n()} begins to ${v()} in the lower ${n()}.`,
        () => `Override the ${a()} ${n()} and run toward the final ${n()}.`,
        () => `The ${a()} ${n()} will ${v()} ${c()}.`,
        () => `${this.cap(v())} the ${n()} before the ${a()} ${n()} can ${v()}.`,
        () => `Sensors report a ${a()} ${n()} near the ${n()}, ${c()}.`,
        () => `Do not ${v()} the ${n()}. ${this.cap(c())}.`,
        () => `Manual ${n()} failed. ${this.cap(v())} the ${a()} ${n()} now.`,
        () => `A ${a()} shadow crosses the ${n()} as the ${n()} starts to ${v()}.`,
        () => `${this.cap(n())} status is ${a()}. ${this.cap(v())} power and ${c()}.`,
        () => `Keep moving through the ${a()} ${n()} while the ${n()} continues to ${v()}.`,
        () => `If the ${n()} cannot ${v()}, ${c()}.`,
      ];
      return builders[Math.floor(Math.random() * builders.length)]();
    },

    commonSentence() {
      const len = 8 + Math.floor(Math.random() * 7);
      const words = [];
      let last = "";
      for (let i = 0; i < len; i++) {
        let next = "";
        for (let t = 0; t < 10; t++) {
          next = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
          if (next && next !== last) break;
        }
        if (!next || next === last) continue;
        words.push(next);
        last = next;
      }
      if (words.length < 4) words.push("the", "next", "move", "now");
      words[0] = this.cap(words[0]);
      words[words.length - 1] += ".";
      return words.join(" ");
    },

    tokenize(sentence) {
      return String(sentence || "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
    },

    codeSentence() {
      const tokens = [
        "if(err)", "return;", "lock.seal();", "x=42;", "arr[0]", "foo.bar",
        "#ff0033", "while(true)", "catch(e)", "n+=1;", "authToken", "getStatus()",
        "setOverride", "coreTemp", "userId", "breachMap", "===", "=>{ }",
        "purgeCoolant()", "hashKey", "sysRef", "gateLock", "null", "true",
        "const", "let", "await", "try{", "}finally", "0x7f", "idx++",
      ];
      const len = 6 + Math.floor(Math.random() * 5);
      const out = [];
      let last = "";
      for (let i = 0; i < len; i++) {
        let next = tokens[Math.floor(Math.random() * tokens.length)];
        if (next === last) continue;
        out.push(next);
        last = next;
      }
      return out.join(" ");
    },

    nextSentence() {
      if (this.mode === "code") return this.codeSentence();
      if (this.mode === "lore") return this.thematicSentence();
      if (this.mode === "standard") return this.commonSentence();
      return Math.random() < 0.68 ? this.thematicSentence() : this.commonSentence();
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

    generate(count, previous) {
      const out = [];
      let last = this.bare(previous);
      let guard = 0;
      while (out.length < count && guard < count * 8) {
        guard += 1;
        const chunk = this.tokenize(this.nextSentence());
        for (const raw of chunk) {
          const word = this.styleWord(raw);
          if (!word) continue;
          const key = this.bare(word);
          if (!key || key === last) continue;
          out.push(word);
          last = key;
          if (out.length >= count) break;
        }
      }
      return out;
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
        while (this.words.length - this.wordIndex < 40) {
          const last = this.words[this.words.length - 1] || "";
          this.pushWords(TextGen.generate(18, last));
        }
      },

      start(opts) {
        const options = opts || {};
        TextGen.mode = options.textMode || "mix";
        TextGen.punctuation = options.punctuation !== false;
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
        this.adrenaline = 0;
        this.boostLeft = 0;
        this.stallLeft = 0;
        this.startedAt = 0;
        this.stallSec = options.stall != null ? options.stall : STALL_SEC;
        this.pushWords(TextGen.generate(45, ""));
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
        } else {
          let rate = 1 / cfg.doorTime;
          if (cfg.doorAccelFinal && Number.isFinite(this.track) && this.player > this.track - 300) {
            rate *= 2.15;
          }
          this.doorOpen = clamp(this.doorOpen - rate * dt, 0, 1);
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
      this.shake = lerp(this.shake, prox * 8, 0.15);
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      const unit = clamp(h / 380, 0.85, 1.45);
      const pace = clamp(race.speed / Math.max(race.targetSpeed, 8), 0, 1);
      const targetBias = typing.stallLeft > 0 ? 0.35 : 0.35 + pace * 0.2;
      const biasFollow = typing.stallLeft > 0 ? 3.2 : 6.5;
      this.playerBias = lerp(this.playerBias, targetBias, 1 - Math.exp(-biasFollow * dt));

      ctx.save();
      ctx.translate(sx, sy);

      const horizon = h * 0.54;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#121821");
      sky.addColorStop(1, "#243044");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizon);

      this.drawWalls(ctx, w, horizon);
      this.drawPipes(ctx, w, horizon, typing.boostLeft > 0);
      this.drawLights(ctx, w, horizon);
      this.drawFloor(ctx, w, h, horizon);

      const playerX = w * this.playerBias;
      const playerY = horizon + 6;
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
        this.drawDoor(ctx, w, h, horizon, race.doorOpen);
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

    drawWalls(ctx, w, horizon) {
      const panelW = 110;
      const offset = this.scroll * 0.4 % panelW;
      for (let x = -panelW; x < w + panelW; x += panelW) {
        const px = Math.round(x - offset);
        const alt = Math.floor((x + this.scroll * 0.4) / panelW) % 2 === 0;
        ctx.fillStyle = alt ? "#3a4658" : "#303a4a";
        ctx.fillRect(px, 0, panelW - 5, horizon);
        ctx.fillStyle = alt ? "#2a3342" : "#242c38";
        ctx.fillRect(px + 8, 14, panelW - 22, horizon - 32);
        ctx.strokeStyle = "rgba(180, 200, 220, 0.18)";
        ctx.strokeRect(px + 8.5, 14.5, panelW - 23, horizon - 33);
        ctx.fillStyle = "#8b97a8";
        [[px + 14, 20], [px + panelW - 24, 20], [px + 14, horizon - 22], [px + panelW - 24, horizon - 22]]
          .forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
            ctx.fill();
          });
        ctx.fillStyle = "#c9a227";
        ctx.fillRect(px + 18, horizon - 28, panelW - 42, 5);
        ctx.fillStyle = "#1b1f24";
        ctx.fillRect(px + 18, horizon - 26, 10, 5);
        ctx.fillRect(px + 38, horizon - 26, 10, 5);
      }

      ctx.fillStyle = "#1c232d";
      ctx.fillRect(0, 0, w, 10);
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 140) - this.scroll * 0.25) % (w + 140) - 20;
        ctx.fillStyle = "#4a5668";
        ctx.fillRect(bx, 0, 16, horizon * 0.2);
      }
    },

    drawPipes(ctx, w, horizon, boost) {
      const y1 = horizon * 0.24;
      const y2 = horizon * 0.38;
      ctx.fillStyle = "#6d7c90";
      ctx.fillRect(0, y1, w, 14);
      ctx.fillRect(0, y2, w, 11);
      ctx.fillStyle = "#9aabbf";
      ctx.fillRect(0, y1 + 3, w, 4);
      ctx.fillStyle = "#4e5b6c";
      ctx.fillRect(0, y1 + 12, w, 2);
      for (let i = 0; i < 6; i++) {
        const vx = ((i * 190) - this.scroll * 0.45) % (w + 190);
        ctx.fillStyle = "#8b9aab";
        ctx.fillRect(vx, y1 - 6, 16, 26);
        ctx.fillStyle = "#d7e1ec";
        ctx.beginPath();
        ctx.arc(vx + 8, y1 + 7, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.random() < (boost ? 0.22 : 0.1)) {
        this.spawnSteam(40 + Math.random() * (w * 0.7), y1);
      }
    },

    drawLights(ctx, w, horizon) {
      const spacing = 150;
      const offset = this.scroll * 0.6 % spacing;
      const flicker = 0.6 + Math.random() * 0.4;
      const pulse = 0.72 + Math.sin(performance.now() / 160) * 0.28;
      for (let x = -40; x < w + 40; x += spacing) {
        const px = x - offset;
        const glow = flicker * pulse;
        ctx.fillStyle = `rgba(255, 48, 58, ${0.2 * glow})`;
        ctx.beginPath();
        ctx.ellipse(px, 34, 52, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 72, 72, ${0.9 * glow})`;
        ctx.fillRect(px - 12, 10, 24, 9);
        ctx.fillStyle = `rgba(255, 210, 80, ${0.12 * glow})`;
        ctx.fillRect(px - 18, 20, 36, horizon - 28);
      }
    },

    drawFloor(ctx, w, h, horizon) {
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, "#3a332c");
      floor.addColorStop(0.35, "#241f1c");
      floor.addColorStop(1, "#100e10");
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);

      ctx.strokeStyle = "rgba(255, 196, 70, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.stroke();
      ctx.lineWidth = 1;

      const vpX = w * 0.7;
      for (let i = -10; i <= 12; i++) {
        ctx.strokeStyle = i === 0 ? "rgba(255, 196, 70, 0.28)" : "rgba(210, 220, 235, 0.16)";
        ctx.beginPath();
        ctx.moveTo(vpX + i * 16, horizon);
        ctx.lineTo(vpX + i * 86, h + 10);
        ctx.stroke();
      }

      const tile = 42;
      const off = this.scroll * 1.25 % tile;
      for (let i = 0; i < 20; i++) {
        const yRel = (i * tile - off) / Math.max(1, h - horizon);
        if (yRel < 0) continue;
        const y = horizon + Math.pow(yRel, 1.28) * (h - horizon);
        ctx.strokeStyle = `rgba(220, 230, 245, ${0.08 + yRel * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255, 196, 70, 0.12)";
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
      const cadence = 0.4 + typing.burstCps(performance.now()) * 1.15 + clamp(speed / 12, 0, 2.4);
      const t = performance.now() / 1000;
      const swing = Math.sin(t * cadence * 10);
      const bob = Math.abs(Math.sin(t * cadence * 10)) * (2.2 + clamp(speed * 0.18, 0, 5)) * unit;
      const lean = clamp(speed / Math.max(race.targetSpeed, 8), 0, 1.45);

      if (speed > 0.8 && Math.random() < 0.28 + lean * 0.35) {
        this.spawnDust(x - 14 * unit, y + 62 * unit, boost, Math.random() < 0.35);
      }

      ctx.save();
      ctx.translate(x, y + bob);
      ctx.rotate(lean * 0.2);
      ctx.scale(unit, unit);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 66, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (boost) {
        const trail = ctx.createLinearGradient(-70, 20, 10, 20);
        trail.addColorStop(0, "rgba(61,255,208,0)");
        trail.addColorStop(1, "rgba(61,255,208,0.28)");
        ctx.fillStyle = trail;
        ctx.fillRect(-74, 8, 78, 44);
      }

      ctx.strokeStyle = boost ? "#3dffd0" : "#c5d0dc";
      ctx.lineWidth = 5;
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

      ctx.fillStyle = "#1b2733";
      ctx.beginPath();
      ctx.roundRect(-11, 2, 26, 30, 5);
      ctx.fill();
      ctx.fillStyle = "#2c3b4c";
      ctx.fillRect(-9, 8, 22, 8);

      ctx.fillStyle = boost ? "#3dffd0" : "#7dffb0";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(-8, -16, 24, 18, 6);
      ctx.fill();
      ctx.fillStyle = "#04151a";
      ctx.shadowBlur = 0;
      ctx.fillRect(2, -10, 13, 6);
      ctx.fillStyle = boost ? "#b8fff0" : "#9effc8";
      ctx.globalAlpha = 0.85;
      ctx.fillRect(3, -9, 11, 3);
      ctx.globalAlpha = 1;

      ctx.restore();
    },

    drawMonster(ctx, x, y, scale, prox) {
      const t = performance.now() / 1000;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      ctx.fillStyle = `rgba(20, 0, 4, ${0.35 + prox * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(0, 58, 86, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 9; i++) {
        const a = t * (1.4 + i * 0.17) + i * 0.7;
        const tx = -28 - i * 9 + Math.sin(a) * 22;
        const ty = 16 + Math.cos(a * 1.35) * 28;
        ctx.strokeStyle = `rgba(${18 + i * 6}, 0, ${10 + i}, 0.92)`;
        ctx.lineWidth = 9 - i * 0.55;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-4, 16);
        ctx.quadraticCurveTo(tx - 10, ty - 18, tx - 48, ty + 22);
        ctx.stroke();
      }

      ctx.fillStyle = "#14080c";
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.bezierCurveTo(-52, 4, -40, 62, 8, 70);
      ctx.bezierCurveTo(40, 60, 36, 6, 14, -16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2a1016";
      ctx.beginPath();
      ctx.ellipse(4, 18, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3a161c";
      ctx.beginPath();
      ctx.moveTo(-8, -16);
      ctx.lineTo(-24, -46);
      ctx.lineTo(4, -20);
      ctx.moveTo(12, -14);
      ctx.lineTo(30, -48);
      ctx.lineTo(18, -12);
      ctx.fill();
      ctx.strokeStyle = "#6a3038";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -32);
      ctx.lineTo(-8, -18);
      ctx.moveTo(20, -34);
      ctx.lineTo(14, -16);
      ctx.stroke();

      const eyes = [
        [4, 8, 5.2], [-10, 14, 3.6], [16, 16, 3], [-2, 22, 2.4], [10, 2, 2.8], [8, 18, 2],
      ];
      eyes.forEach(([ex, ey, r], i) => {
        const pulse = 0.7 + Math.sin(t * 7 + i) * 0.3;
        ctx.fillStyle = `rgba(255, ${24 + i * 12}, 36, ${0.95 * pulse})`;
        ctx.shadowColor = "#ff2030";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.restore();
    },

    drawDoor(ctx, w, h, horizon, open) {
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

      if (Math.random() < 0.12) this.spawnSteam(x + 16, drop);
      if (Math.sin(performance.now() / 130) > 0) {
        ctx.fillStyle = "#ff3b4e";
        ctx.fillRect(x + 16, 36, 12, 12);
        ctx.fillRect(x + doorW - 28, 36, 12, 12);
      }
    },

    updateParticles(ctx, dt) {
      this.steam = this.steam.filter((p) => {
        p.life -= dt * 0.7;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size += dt * 8;
        if (p.life <= 0) return false;
        ctx.fillStyle = `rgba(200, 210, 220, ${p.life * 0.18})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      this.dust = this.dust.filter((p) => {
        p.life -= dt * 1.8;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) return false;
        ctx.fillStyle = p.spark
          ? `rgba(255, 210, 120, ${p.life * 0.85})`
          : `rgba(170, 160, 140, ${p.life * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
    },

    drawSpeedLines(ctx, w, h) {
      ctx.strokeStyle = "rgba(61, 255, 208, 0.18)";
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
    resAcc: $("res-acc"),
    resTime: $("res-time"),
    resDist: $("res-dist"),
    resSettings: $("res-settings"),
    resRecord: $("result-record"),
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

    boot() {
      Renderer.init(els.canvas);
      WordsView.mount();
      this.applySettingsToForm();
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

      window.addEventListener("keydown", (e) => {
        if (this.state !== "start") return;
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
      els.hint.textContent = isTouchDevice()
        ? "Tap the text to keep the keyboard open"
        : "Type to run · Space next word · Backspace corrects · Shift boosts";
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

    toggleMute() {
      AudioSystem.resume();
      AudioSystem.toggle();
      this.syncMuteButtons();
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
      this.renderScores();
    },

    applyKey(key) {
      const result = this.typing.handleKey(key, performance.now());
      if (!result) return false;
      if (result === "ok" || result === "boost") AudioSystem.click();
      else if (result === "err" || result === "extra") AudioSystem.buzz();
      if (result === "ok") this.race.nudge(true);
      else if (result === "err" || result === "extra") this.race.nudge(false);
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
      els.dist.textContent = `${Math.floor(Math.max(0, r.player))}m`;
      els.door.textContent = r.diff.endless
        ? "ENDLESS"
        : r.diff.doorOff
          ? "OFF"
          : `${Math.round(r.doorOpen * 100)}%`;

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
      AudioSystem.updateMusic(proximity, remain, this.typing.boostLeft > 0);

      this.updateHud();

      if (this.race.result) {
        this.finish(this.race.result);
        return;
      }
      this.raf = requestAnimationFrame((t) => this.loop(t));
    },

    finish(result) {
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
      els.resWpm.textContent = Math.round(entry.wpm);
      els.resAcc.textContent = `${Math.round(entry.accuracy)}%`;
      els.resTime.textContent = formatTime(entry.time);
      els.resDist.textContent = `${Math.round(this.race.player)}m`;
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
  Game.boot();
})();
