// Música de fundo da corrida: temas originais, sintetizados na hora e tocados
// baixinho. A fase 1 tem pegada punk rock; a fase 2, clima de festa.
BB.musica = (function () {
  const U = BB.util;
  const VOLUME = 0.08;
  const SEMITOM = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function freq(nota, oitava) {
    return 440 * Math.pow(2, (SEMITOM[nota] + (oitava - 4) * 12 - 9) / 12);
  }

  // Ruído e curva de distorção são criados uma vez por contexto de áudio.
  const ruidos = new WeakMap(), curvas = new WeakMap();

  function ruido(ac) {
    if (!ruidos.has(ac)) {
      const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ruidos.set(ac, buf);
    }
    return ruidos.get(ac);
  }

  function distorcao(ac) {
    if (!curvas.has(ac)) {
      const n = 1024, curva = new Float32Array(n);
      for (let i = 0; i < n; i++) curva[i] = Math.tanh((i / (n - 1) * 2 - 1) * 4);
      curvas.set(ac, curva);
    }
    const ws = ac.createWaveShaper();
    ws.curve = curvas.get(ac);
    return ws;
  }

  function envelope(ac, saida, t, pico, dur) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(saida);
    return g;
  }

  function filtro(ac, tipo, f, destino) {
    const b = ac.createBiquadFilter();
    b.type = tipo;
    b.frequency.value = f;
    b.connect(destino);
    return b;
  }

  function osc(ac, tipo, f, t, dur, destino) {
    const o = ac.createOscillator();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    o.connect(destino);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function batida(ac, saida, t, dur, tipo, f, pico) {
    const src = ac.createBufferSource();
    src.buffer = ruido(ac);
    src.connect(filtro(ac, tipo, f, envelope(ac, saida, t, pico, dur)));
    src.start(t, Math.random() * 0.5, dur + 0.02);
  }

  const I = {
    // Power chord (tônica, quinta e oitava) com distorção, como guitarra.
    guitarra(ac, saida, t, nota, dur, forte) {
      const dist = distorcao(ac);
      dist.connect(filtro(ac, 'lowpass', 2000, envelope(ac, saida, t, forte ? 0.5 : 0.3, dur)));
      const f = freq(nota, 3);
      [f, f * 1.4983, f * 2].forEach(x => osc(ac, 'sawtooth', x, t, dur, dist));
    },
    baixo(ac, saida, t, nota, dur, oitava) {
      osc(ac, 'triangle', freq(nota, oitava || 2), t, dur, envelope(ac, saida, t, 0.7, dur));
    },
    // Tríade maior curtinha, como metais de banda.
    metais(ac, saida, t, nota, dur) {
      const f = freq(nota, 4);
      const destino = filtro(ac, 'lowpass', 2400, envelope(ac, saida, t, 0.22, dur));
      [f, f * 1.2599, f * 1.4983].forEach(x => osc(ac, 'square', x, t, dur, destino));
    },
    bumbo(ac, saida, t) {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      o.connect(envelope(ac, saida, t, 0.6, 0.16));
      o.start(t);
      o.stop(t + 0.18);
    },
    caixa(ac, saida, t) {
      batida(ac, saida, t, 0.13, 'bandpass', 1800, 0.6);
      osc(ac, 'triangle', 190, t, 0.08, envelope(ac, saida, t, 0.35, 0.08));
    },
    chimbal(ac, saida, t, forte) { batida(ac, saida, t, 0.04, 'highpass', 7000, forte ? 0.25 : 0.14); },
    palma(ac, saida, t) { batida(ac, saida, t, 0.11, 'bandpass', 1200, 0.55); },
    sino(ac, saida, t) {
      const destino = filtro(ac, 'bandpass', 1000, envelope(ac, saida, t, 0.25, 0.22));
      [562, 845].forEach(x => osc(ac, 'square', x, t, 0.22, destino));
    },
  };

  // Cada tema: uma letra por colcheia com a tônica do acorde, em 4 compassos.
  const TEMAS = {
    mat: {
      bpm: 160,
      raizes: 'EEEEEEEE' + 'EEEEEEEE' + 'GGGGAAAA' + 'EEEEDDAA',
      tocar(ac, saida, p, t, d) {
        const nota = this.raizes[p], b = p % 8;
        const troca = p === 0 || nota !== this.raizes[p - 1];
        I.guitarra(ac, saida, t, nota, troca ? d * 1.8 : d * 0.7, troca);
        I.baixo(ac, saida, t, nota, d * 0.9);
        if (b === 0 || b === 4 || (p >= 24 && b === 3)) I.bumbo(ac, saida, t);
        if (b === 2 || b === 6 || p >= 30) I.caixa(ac, saida, t);
        I.chimbal(ac, saida, t, b % 2 === 0);
      },
    },
    port: {
      bpm: 124,
      raizes: 'CCCCCCCC' + 'FFFFFFFF' + 'GGGGGGGG' + 'CCCCGGGG',
      tocar(ac, saida, p, t, d) {
        const nota = this.raizes[p], b = p % 8;
        if (b % 2 === 0) {
          I.bumbo(ac, saida, t);
          I.baixo(ac, saida, t, nota, d * 0.9, b === 2 || b === 6 ? 3 : 2);
        } else {
          I.metais(ac, saida, t, nota, d * 0.6);
          I.chimbal(ac, saida, t, false);
        }
        if (b === 2 || b === 6) I.palma(ac, saida, t);
        if (p === 15 || p === 31) I.sino(ac, saida, t);
      },
    },
  };

  let bus = null, relogio = null, tema = null, passo = 0, proximo = 0, pedido = 0;

  function agendar() {
    const ac = BB.som.contexto();
    if (!ac || !bus) return;
    const d = 60 / tema.bpm / 2;
    // Se o celular atrasou o relógio, recomeça do agora em vez de despejar notas velhas.
    if (proximo < ac.currentTime - 0.1) proximo = ac.currentTime + 0.02;
    while (proximo < ac.currentTime + 0.15) {
      try { tema.tocar(ac, bus, passo, proximo, d); } catch (e) { /* uma nota a menos, nunca o jogo parado */ }
      passo = (passo + 1) % tema.raizes.length;
      proximo += d;
    }
  }

  function iniciar(nome) {
    parar();
    const ac = BB.som.contexto();
    if (!U.dados.som || !ac || !TEMAS[nome]) return;
    if (ac.state === 'running') {
      comecar(ac, nome);
      return;
    }
    // Áudio suspenso (voltou de outro app): espera destravar, a menos que
    // alguém tenha mandado parar nesse meio-tempo.
    const meu = pedido;
    ac.resume().then(() => { if (meu === pedido && ac.state === 'running') comecar(ac, nome); }).catch(() => {});
  }

  function comecar(ac, nome) {
    tema = TEMAS[nome];
    bus = ac.createGain();
    bus.gain.value = VOLUME;
    bus.connect(ac.destination);
    passo = 0;
    proximo = ac.currentTime + 0.06;
    agendar();
    relogio = setInterval(agendar, 25);
  }

  function parar() {
    pedido++;
    if (relogio) {
      clearInterval(relogio);
      relogio = null;
    }
    if (bus) {
      const ac = BB.som.contexto(), velho = bus;
      velho.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03);
      setTimeout(() => { try { velho.disconnect(); } catch (e) { /* já desligado */ } }, 400);
      bus = null;
    }
  }

  function tocando() { return bus !== null; }

  return { iniciar, parar, tocando, TEMAS, VOLUME };
})();
