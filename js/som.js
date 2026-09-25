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

  function ruido(duracao, volume) {
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
    src.start();
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

  return { destravar, tocar, alternar, contexto };
})();
