(() => {
  "use strict";

  const TRACK = 1000;
  const STORAGE_KEY = "etb-highscores";
  const MUTE_KEY = "etb-muted";
  const STALL_SEC = 0.4;
  const ADRENALINE_WORDS = 5;
  const ADRENALINE_SEC = 3;
  const ADRENALINE_MULT = 1.8;

  const PASSAGES = [
    "CONTAINMENT BREACH // SECTOR 7. Experiment-09 has left the observation pit. All non-essential staff initiate Protocol Ash. Do not attempt visual contact. The entity hunts by vibration and breath.",
    "ESCAPE LOG 14: The corridor lights are failing in sequence. I can hear it scraping the bulkheads behind me. Keep moving. Keep typing. The blast door will not wait for hesitation.",
    "WARNING: Hydraulic clamps on Gate Theta are already cycling. Estimated seal in minutes, not hours. Sprint the last kilometer. If you stall, it closes the gap.",
    "SUBJECT NOTES: Experiment-09 presents as a living shadow with clustered red optics and razor horns. Tendrils sample the air. It accelerates when prey stops making progress.",
    "TERMINAL 3B: Override accepted. Emergency lighting only. Steam vents along the service pipes are still live. Floor plates 88 through 94 are unstable. Stay on the center line.",
    "VOICE IN THE COMM: Do not look back. Looking back is how the last three teams were taken. Eyes on the door. Hands on the keys. Breath in four, out in two.",
    "PROTOCOL FRAGMENT: Five clean words charge the adrenaline injector. Dump it when the gauge spikes. Three seconds of turbo. After that you are meat again unless you keep the streak.",
    "SECURITY CAM 09: Shape occupies the west hall. Distance unknown. Heat signature negative. Audio shows a low rumble that rises as it nears. If the rumble fills the room, you are already lost.",
    "MEDBAY SCRATCH: Typo equals stall. Stall equals teeth. Correct the letter and run. Accuracy is not vanity here. Accuracy is distance.",
    "FINAL DIRECTIVE: Cross the threshold before the slab drops. If the door hits zero you are sealed in with it. If it reaches you first, the logs end here. Type. Sprint. Escape.",
    "AUX POWER: Coolant lines ruptured near junction 12. The air tastes like copper and ozone. Keep your visor sealed. The entity does not need air. You do.",
    "LAST OPERATOR: I made it to 860 meters. The door was a slit of amber light. Then I missed a word and the rumble ate the hallway. Do better than I did.",
  ];

  const DIFFICULTIES = {
    scout: {
      id: "scout",
      name: "Scout",
      targetWpm: 35,
      doorTime: 90,
      startGap: 150,
      monsterPace: 1.18,
      closeAccel: 1.04,
    },
    operative: {
      id: "operative",
      name: "Operative",
      targetWpm: 50,
      doorTime: 70,
      startGap: 100,
      monsterPace: 1.04,
      closeAccel: 1.1,
    },
    nightmare: {
      id: "nightmare",
      name: "Nightmare",
      targetWpm: 70,
      doorTime: 55,
      startGap: 62,
      monsterPace: 0.93,
      closeAccel: 1.22,
    },
  };

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
      return {
        scout: Array.isArray(data.scout) ? data.scout : [],
        operative: Array.isArray(data.operative) ? data.operative : [],
        nightmare: Array.isArray(data.nightmare) ? data.nightmare : [],
      };
    } catch {
      return { scout: [], operative: [], nightmare: [] };
    }
  }

  function saveScores(scores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }

  function addScore(entry) {
    const scores = loadScores();
    const list = scores[entry.difficulty] || [];
    list.push(entry);
    list.sort((a, b) => {
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

    startAmbience() {
      this.ensure();
      if (!this.ctx || this.sirenNodes) return;
      const t = this.ctx.currentTime;

      const siren = this.ctx.createOscillator();
      const sirenLfo = this.ctx.createOscillator();
      const sirenGain = this.ctx.createGain();
      const lfoGain = this.ctx.createGain();
      siren.type = "sine";
      siren.frequency.value = 420;
      sirenLfo.type = "sine";
      sirenLfo.frequency.value = 0.28;
      lfoGain.gain.value = 90;
      sirenGain.gain.value = 0.025;
      sirenLfo.connect(lfoGain);
      lfoGain.connect(siren.frequency);
      siren.connect(sirenGain);
      sirenGain.connect(this.master);
      siren.start(t);
      sirenLfo.start(t);
      this.sirenNodes = { siren, sirenLfo, sirenGain };

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

    updateRumble(proximity) {
      if (!this.rumbleNodes || !this.ctx) return;
      const g = 0.001 + proximity * 0.12;
      this.rumbleNodes.rumbleGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.08);
      this.rumbleNodes.rumble.frequency.setTargetAtTime(38 + proximity * 28, this.ctx.currentTime, 0.1);
    },

    stopAmbience() {
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

  function tokenize(text) {
    return text.trim().split(/\s+/).filter(Boolean);
  }

  function createTyping() {
    return {
      bag: [],
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
      dirty: [0],

      refillBag() {
        this.bag = PASSAGES.map((_, i) => i);
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      },

      pushWords(list) {
        list.forEach((word) => {
          this.words.push(word);
          this.states.push(Array(word.length).fill(""));
          this.extras.push("");
        });
      },

      appendPassage() {
        if (this.bag.length === 0) this.refillBag();
        this.pushWords(tokenize(PASSAGES[this.bag.pop()]));
      },

      ensureWords() {
        while (this.words.length - this.wordIndex < 48) this.appendPassage();
      },

      start() {
        this.bag = [];
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
        this.startedAt = performance.now();
        this.ensureWords();
        this.dirty = [0];
      },

      elapsedMin() {
        return Math.max(1 / 60, (performance.now() - this.startedAt) / 60000);
      },

      wpm() {
        return (this.correctKeys / 5) / this.elapsedMin();
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
        this.stallLeft = STALL_SEC;
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
        if (this.letterIndex < this.currentWord().length) this.penalize();
        return this.finishWord();
      },

      backspace() {
        const i = this.wordIndex;
        if (this.extras[i]) {
          this.extras[i] = this.extras[i].slice(0, -1);
          this.markDirty(i);
          this.errored = this.wordHasError(i);
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
      const target = line >= 1 ? (line - 1) * lh : 0;
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

  function createRace(diff) {
    const targetCps = (diff.targetWpm * 5) / 60;
    const finishTime = diff.doorTime * 0.82;
    const targetSpeed = TRACK / finishTime;
    const monsterBase = TRACK / (diff.doorTime * diff.monsterPace);

    return {
      diff,
      targetCps,
      targetSpeed,
      monsterBase,
      player: 0,
      monster: -diff.startGap,
      speed: 0,
      doorOpen: 1,
      elapsed: 0,
      result: null,

      update(dt, typing, now) {
        if (this.result) return;

        this.elapsed += dt;
        this.doorOpen = clamp(1 - this.elapsed / this.diff.doorTime, 0, 1);

        const cps = typing.recentCps(now);
        let desired = (cps / this.targetCps) * this.targetSpeed;
        desired = clamp(desired, 0, this.targetSpeed * 2.2);

        if (typing.stallLeft > 0) desired = this.targetSpeed * 0.02;
        if (typing.boostLeft > 0) desired *= ADRENALINE_MULT;

        const follow = typing.stallLeft > 0 ? 16 : 6.8;
        this.speed = lerp(this.speed, desired, 1 - Math.exp(-follow * dt));
        this.player += this.speed * dt;

        const gap = this.player - this.monster;
        let mSpeed = this.monsterBase;
        if (gap > 240) mSpeed *= 1.16;
        else if (gap > 160) mSpeed *= 1.06;
        if (gap < 70) mSpeed *= this.diff.closeAccel;
        if (this.speed < this.targetSpeed * 0.25) mSpeed *= 1.05;
        this.monster += mSpeed * dt;

        if (this.player >= TRACK && this.doorOpen > 0) {
          this.player = TRACK;
          this.result = "win";
        } else if (this.monster >= this.player) {
          this.monster = this.player;
          this.result = "lose-catch";
        } else if (this.doorOpen <= 0 && this.player < TRACK) {
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

    spawnDust(x, y, boost) {
      this.dust.push({
        x,
        y,
        vx: -40 - Math.random() * 50 - (boost ? 40 : 0),
        vy: -8 + Math.random() * 16,
        life: 1,
        size: 2 + Math.random() * 3,
      });
    },

    draw(race, typing, dt) {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      this.scroll += Math.max(18, race.speed) * dt * 0.55;

      const gap = race.player - race.monster;
      const prox = clamp(1 - gap / 180, 0, 1);
      this.shake = lerp(this.shake, prox * 8, 0.15);
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      const unit = clamp(h / 380, 0.85, 1.45);

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

      const playerX = w * 0.58;
      const playerY = horizon + 6;
      const t = clamp(gap / 260, 0, 1);
      const monsterX = lerp(playerX - 50 * unit, 86 * unit, t);
      const monsterScale = lerp(1.45, 0.88, t) * unit;

      this.drawMonster(ctx, monsterX, playerY + 8, monsterScale, prox);
      this.drawPlayer(ctx, playerX, playerY, race.speed, typing.boostLeft > 0, unit);
      this.drawDoor(ctx, w, h, horizon, race.doorOpen);
      this.updateParticles(ctx, dt);
      if (typing.boostLeft > 0) this.drawSpeedLines(ctx, w, h);

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

    drawPlayer(ctx, x, y, speed, boost, unit) {
      const cadence = 0.55 + clamp(speed / 16, 0, 2.6);
      const t = performance.now() / 1000;
      const swing = Math.sin(t * cadence * 10);
      const bob = Math.abs(Math.sin(t * cadence * 10)) * 4 * unit;

      if (speed > 1.5 && Math.random() < 0.45) this.spawnDust(x - 14 * unit, y + 62 * unit, boost);

      ctx.save();
      ctx.translate(x, y + bob);
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
        ctx.fillStyle = `rgba(170, 160, 140, ${p.life * 0.45})`;
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
    input: $("hidden-input"),
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
    resDiff: $("res-diff"),
    resRecord: $("result-record"),
  };

  const Game = {
    state: "start",
    typing: createTyping(),
    race: null,
    raf: 0,
    lastTs: 0,
    hudAcc: 0,

    boot() {
      Renderer.init(els.canvas);
      WordsView.mount();
      this.renderScores();
      this.syncMuteButtons();

      document.getElementById("difficulty-grid").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-diff]");
        if (!btn) return;
        this.start(btn.dataset.diff);
      });

      els.muteStart.addEventListener("click", () => this.toggleMute());
      els.muteGame.addEventListener("click", () => this.toggleMute());
      els.again.addEventListener("click", () => this.toStart());

      els.input.addEventListener("keydown", (e) => this.onKey(e));
      els.input.addEventListener("input", () => this.onTextInput());
      els.input.addEventListener("blur", () => {
        if (this.state === "playing") {
          setTimeout(() => els.input.focus(), 0);
        }
      });
      document.getElementById("typing-panel").addEventListener("mousedown", () => {
        if (this.state === "playing") els.input.focus();
      });

      window.addEventListener("resize", () => {
        Renderer.resize();
        if (this.state === "playing") WordsView.sync(this.typing, true);
      });
      window.addEventListener("keydown", (e) => {
        if (this.state !== "start") return;
        const map = { 1: "scout", 2: "operative", 3: "nightmare" };
        if (map[e.key]) this.start(map[e.key]);
      });
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
      els.scores.innerHTML = Object.keys(DIFFICULTIES).map((key) => {
        const d = DIFFICULTIES[key];
        const rows = scores[key] || [];
        const items = rows.length
          ? rows.map((r) => `<li>${r.escaped ? "ESC" : "FAIL"} ${r.wpm.toFixed(0)} WPM · ${r.accuracy.toFixed(0)}%</li>`).join("")
          : "<li>No runs yet</li>";
        return `<div class="score-col"><h3>${d.name}</h3><ol>${items}</ol></div>`;
      }).join("");
    },

    start(diffId) {
      const diff = DIFFICULTIES[diffId];
      if (!diff) return;
      AudioSystem.resume();
      AudioSystem.stopAmbience();
      AudioSystem.startAmbience();

      this.typing.start();
      this.race = createRace(diff);
      this.state = "playing";
      this.lastTs = 0;
      this.hudAcc = 0;
      Renderer.steam = [];
      Renderer.dust = [];
      Renderer.shake = 0;
      Renderer.scroll = 0;

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
      els.input.focus();
      els.hint.textContent = "Type to run · Space next word · Backspace corrects · Shift boosts";

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
      WordsView.sync(this.typing);
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
      this.applyKey(e.key);
    },

    onTextInput() {
      const val = els.input.value;
      els.input.value = "";
      if (this.state !== "playing" || !val) return;
      for (const ch of val) this.applyKey(ch);
    },

    updateHud() {
      const t = this.typing;
      const r = this.race;
      els.wpm.textContent = Math.round(t.wpm());
      els.acc.textContent = `${Math.round(t.accuracy())}%`;
      els.streak.textContent = String(t.streak);
      els.dist.textContent = `${Math.floor(clamp(r.player, 0, TRACK))}m`;
      els.door.textContent = `${Math.round(r.doorOpen * 100)}%`;

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

      const mapMin = -180;
      const mapSpan = TRACK - mapMin;
      const mapPct = (pos) => `${clamp((pos - mapMin) / mapSpan, 0, 1) * 100}%`;
      els.mapPlayer.style.left = mapPct(r.player);
      els.mapMonster.style.left = mapPct(r.monster);
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

      const gap = this.race.player - this.race.monster;
      AudioSystem.updateRumble(clamp(1 - gap / 200, 0, 1));

      this.hudAcc += dt;
      if (this.hudAcc > 0.08) {
        this.hudAcc = 0;
        this.updateHud();
      }

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

      const escaped = result === "win";
      const entry = {
        difficulty: this.race.diff.id,
        wpm: this.typing.wpm(),
        accuracy: this.typing.accuracy(),
        time: this.race.elapsed,
        escaped,
        at: Date.now(),
      };
      const { rank } = addScore(entry);

      els.resultPanel.classList.toggle("win", escaped);
      els.resultPanel.classList.toggle("lose", !escaped);
      els.resEye.textContent = escaped ? "GATE THETA // OPEN" : "SIGNAL LOST";
      els.resTitle.textContent = escaped ? "EXTRACTED" : result === "lose-door" ? "DOOR SEALED" : "CAUGHT";
      els.resCopy.textContent = escaped
        ? "You crossed the threshold as the clamps bit down. Experiment-09 hits the far side of the slab. You are out."
        : result === "lose-door"
          ? "The blast door sealed with you still in the corridor. The rumble is the last thing on the tape."
          : "Experiment-09 closed the gap. The logs end in static and a wet impact.";
      els.resWpm.textContent = Math.round(entry.wpm);
      els.resAcc.textContent = `${Math.round(entry.accuracy)}%`;
      els.resTime.textContent = formatTime(entry.time);
      els.resDiff.textContent = this.race.diff.name;
      els.resRecord.textContent = rank > 0 && rank <= 5
        ? `Logged as #${rank} on the ${this.race.diff.name} board.`
        : "Run recorded. Not a top-five mark.";

      els.result.hidden = false;
    },
  };

  window.__ETB = Game;
  Game.boot();
})();
