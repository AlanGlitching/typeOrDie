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
      const sliding = this.slideT > 0;
      const slideK = clamp(this.slideT, 0, 1);

      if (speed > 0.8 && Math.random() < 0.28 + lean * 0.35) {
        this.spawnDust(x - 14 * unit, y + 62 * unit, boost, Math.random() < 0.35);
      }

      ctx.save();
      ctx.translate(x, y + bob + (sliding ? 10 * slideK * unit : 0));
      ctx.rotate(lean * 0.2 + (sliding ? 0.55 * slideK : 0));
      ctx.scale(unit, unit);

      if (typing.streak >= 10) {
        const ghosts = [
          { dx: -18, dy: 2, color: "rgba(255, 40, 70, 0.22)" },
          { dx: -28, dy: -1, color: "rgba(0, 255, 220, 0.18)" },
          { dx: -38, dy: 3, color: "rgba(120, 160, 255, 0.12)" },
        ];
        ghosts.forEach((g) => {
          ctx.fillStyle = g.color;
          ctx.beginPath();
          ctx.roundRect(-11 + g.dx, 2 + g.dy, 26, 30, 5);
          ctx.fill();
          ctx.fillRect(-8 + g.dx, -16 + g.dy, 24, 18);
        });
      }

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

      document.addEventListener("pointerdown", () => {
        if (this.state !== "playing") return;
        requestAnimationFrame(() => this.focusInput());
      });

      window.addEventListener("keydown", (e) => this.onFlowKey(e), true);

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
      if (result === "ok" || result === "err" || result === "extra" || result === "boost") {
        AudioSystem.ensureMusic();
      }
      if (result === "ok" || result === "boost") AudioSystem.click();
      else if (result === "err" || result === "extra") AudioSystem.buzz();
      if (result === "ok") this.race.nudge(true);
      else if (result === "err" || result === "extra") this.race.nudge(false);
      if (key === " " && result === "ok") {
        Renderer.spawnWordBurst(Renderer.lastPlayerX, Renderer.lastPlayerY + 58);
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
