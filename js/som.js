// Efeitos sonoros sintetizados na hora: nada para baixar.
BB.som = (function () {
  const U = BB.util;
  let ctx = null;

  // O navegador só libera áudio depois de um toque: chamar dentro de um toque.
  function destravar() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  }

  function tom(freq, inicio, duracao, tipo, volume, freqFinal) {
    const t0 = ctx.currentTime + inicio;
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, t0 + duracao);
    ganho.gain.setValueAtTime(0.0001, t0);
    ganho.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
    osc.connect(ganho);
    ganho.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duracao + 0.02);
  }

  function ruido(duracao, volume, inicio) {
    const n = Math.floor(ctx.sampleRate * duracao);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    const ganho = ctx.createGain();
    ganho.gain.value = volume;
    src.buffer = buf;
    src.connect(ganho);
    ganho.connect(ctx.destination);
    src.start(ctx.currentTime + (inicio || 0));
  }

  // Sílaba de voz sintetizada ("he"): serra passando por um filtro de vogal.
  function vogal(freq, inicio, duracao, volume) {
    const t0 = ctx.currentTime + inicio;
    const osc = ctx.createOscillator(), filtro = ctx.createBiquadFilter(), ganho = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.1, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.88, t0 + duracao);
    filtro.type = 'bandpass';
    filtro.frequency.value = 1150;
    filtro.Q.value = 2.2;
    ganho.gain.setValueAtTime(0.0001, t0);
    ganho.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
    osc.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duracao + 0.02);
  }

  // Vozes dos personagens, montadas em qualquer contexto de áudio (o do jogo
  // ou um de teste): o latido da Melifulina e o rosnado do Fedorento.
  const curvasAsperas = new WeakMap();
  function aspereza(ac) {
    if (!curvasAsperas.has(ac)) {
      const n = 512, curva = new Float32Array(n);
      for (let i = 0; i < n; i++) curva[i] = Math.tanh((i / (n - 1) * 2 - 1) * 3);
      curvasAsperas.set(ac, curva);
    }
    const ws = ac.createWaveShaper();
    ws.curve = curvasAsperas.get(ac);
    return ws;
  }

  function sopro(ac, saida, t0, dur, freq, volume) {
    const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource(), filtro = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf;
    filtro.type = 'bandpass';
    filtro.frequency.value = freq;
    filtro.Q.value = 1.2;
    g.gain.value = volume;
    src.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    src.start(t0);
  }

  // Latido de cachorro pequeno ("au!"): estalo de ar, voz que sobe e desce
  // rápido e dois formantes deslizando de "a" para "u".
  function latirEm(ac, saida, t0, altura) {
    const dur = 0.17;
    const voz = ac.createOscillator();
    voz.type = 'sawtooth';
    voz.frequency.setValueAtTime(430 * altura, t0);
    voz.frequency.exponentialRampToValueAtTime(880 * altura, t0 + 0.03);
    voz.frequency.exponentialRampToValueAtTime(480 * altura, t0 + dur);
    const rouco = aspereza(ac);
    voz.connect(rouco);
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.9, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.4, t0 + 0.07);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    env.connect(saida);
    [[1050, 520, 5], [1750, 950, 6]].forEach(([de, para, q]) => {
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = q;
      f.frequency.setValueAtTime(de, t0);
      f.frequency.exponentialRampToValueAtTime(para, t0 + dur);
      rouco.connect(f);
      f.connect(env);
    });
    voz.start(t0);
    voz.stop(t0 + dur + 0.02);
    sopro(ac, saida, t0, 0.05, 2400, 0.08);
  }

  // Rosnado "grrr": voz grave e trêmula (o tremido rápido faz o "rrr"),
  // abafada. Mais vilão de desenho que bicho bravo.
  function rosnarEm(ac, saida, t0, dur) {
    const voz = ac.createOscillator();
    voz.type = 'sawtooth';
    voz.frequency.setValueAtTime(118, t0);
    voz.frequency.linearRampToValueAtTime(128, t0 + dur * 0.4);
    voz.frequency.linearRampToValueAtTime(96, t0 + dur);
    const tremido = ac.createOscillator(), fundo = ac.createGain(), vca = ac.createGain();
    tremido.frequency.value = 26;
    fundo.gain.value = 0.5;
    vca.gain.value = 0.5;
    tremido.connect(fundo);
    fundo.connect(vca.gain);
    const abafa = ac.createBiquadFilter();
    abafa.type = 'lowpass';
    abafa.frequency.value = 900;
    const garganta = ac.createBiquadFilter();
    garganta.type = 'peaking';
    garganta.frequency.value = 420;
    garganta.Q.value = 2;
    garganta.gain.value = 9;
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.35, t0 + 0.06);
    env.gain.setValueAtTime(0.35, t0 + dur - 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    voz.connect(vca);
    vca.connect(abafa);
    abafa.connect(garganta);
    garganta.connect(env);
    env.connect(saida);
    voz.start(t0);
    tremido.start(t0);
    voz.stop(t0 + dur + 0.02);
    tremido.stop(t0 + dur + 0.02);
  }

  const efeitos = {
    pista() { tom(520, 0, 0.06, 'square', 0.04); },
    acerto() {
      tom(660, 0, 0.09, 'square', 0.09);
      tom(880, 0.08, 0.09, 'square', 0.09);
      tom(1320, 0.16, 0.16, 'square', 0.09);
    },
    erro() { ruido(0.18, 0.22); tom(300, 0.02, 0.35, 'sawtooth', 0.1, 90); },
    batida() { ruido(0.14, 0.2); tom(180, 0, 0.18, 'triangle', 0.14, 70); },
    combo() {
      tom(880, 0, 0.07, 'square', 0.09);
      tom(1175, 0.06, 0.07, 'square', 0.09);
      tom(1568, 0.12, 0.16, 'square', 0.09);
    },
    ultrapassa() { tom(500, 0, 0.14, 'triangle', 0.08, 1200); },
    rodada() { tom(660, 0, 0.12, 'triangle', 0.06); tom(990, 0.1, 0.2, 'triangle', 0.05); },
    resposta() { tom(900, 0, 0.05, 'square', 0.05); },
    tique() { tom(1200, 0, 0.04, 'square', 0.05); },
    // O monstro sobe da neblina ("blup-blup"), come ("nhac" e mastigadas) e ri
    // um "he-he-he" de vilão bobo, mais engraçado que assustador.
    pego() { tom(170, 0, 0.18, 'sine', 0.14, 340); tom(210, 0.17, 0.22, 'sine', 0.12, 470); },
    nhac() {
      ruido(0.1, 0.25);
      tom(160, 0, 0.1, 'square', 0.1, 70);
      ruido(0.06, 0.12, 0.3);
      ruido(0.06, 0.12, 0.55);
    },
    // "Au! au! au!" da Melifulina, cada um num tom um pouco diferente.
    latido() {
      [0, 0.22, 0.46].forEach((d, i) => latirEm(ctx, ctx.destination, ctx.currentTime + d, [1, 1.07, 0.95][i]));
    },
    rosnado() { rosnarEm(ctx, ctx.destination, ctx.currentTime, 0.9); },
    risada() {
      [0, 0.13, 0.26, 0.39, 0.55].forEach((t0, i) => vogal(390 - i * 26, t0, i === 4 ? 0.22 : 0.1, 0.4));
    },
    tiro() { ruido(0.12, 0.1); tom(820, 0, 0.16, 'triangle', 0.09, 260); },
    splat() { ruido(0.22, 0.24); tom(220, 0, 0.22, 'sine', 0.14, 60); },
    contagem() { tom(440, 0, 0.15, 'square', 0.08); },
    largada() { tom(880, 0, 0.35, 'square', 0.1); },
    chegada() {
      [523, 659, 784, 1047].forEach((f, i) => tom(f, i * 0.12, 0.22, 'square', 0.08));
      tom(1047, 0.5, 0.6, 'triangle', 0.12);
    },
  };

  function tocar(nome) {
    if (!U.dados.som || !ctx || ctx.state !== 'running') return;
    try { efeitos[nome](); } catch (e) { /* som é enfeite: nunca derruba o jogo */ }
  }

  function alternar() {
    U.dados.som = !U.dados.som;
    U.salvar();
    if (U.dados.som) destravar();
    else BB.musica.parar();
    return U.dados.som;
  }

  function contexto() { return ctx; }

  return { destravar, tocar, alternar, contexto, vozes: { latirEm, rosnarEm } };
})();
