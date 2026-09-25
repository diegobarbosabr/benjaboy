// Fase 4 · Meia-Noite, a Caça-Sombras: tudo escuro, a lanterna segue o dedo.
// As sombras descem na direção do Benjaboy, cada uma levando uma resposta
// que só aparece na luz. Primeiro ilumina, depois toca para prender. A regra do
// torneio (rodadas, lanternas, amigos, eliminação) fica em BB.torneio.
BB.noite = (function () {
  const D = BB.desenho, T = BB.torneio, U = BB.util;
  const RAIO_SOMBRA = 30, TEMPO_REVELAR = 0.25;
  const CURTOS = { 'João Miguel': 'J. Miguel', 'João Pedro': 'J. Pedro' };
  let W = 0, H = 0, dpr = 1, topoCampo = 0, baseCampo = 0, raioLuz = 80;
  let luz = { x: 0, y: 0 }, sombras = [], rodadaMontada = -1, particulas = [], congelado = 0, estadoAntes = '';
  let pegoVisto = null, deixas = {}, grrAbertura = false;   // quem o monstro está comendo e os sons já tocados
  // Peças que não mudam ficam prontas em telas de rascunho: redesenhar tudo a
  // cada quadro pesava demais no celular (16 ms por quadro, no computador).
  let camadaFundo = null, mascara = null, halo = null, figuraBenja = null;
  const rostos = new Map();

  function rascunho(larg, alt, desenho) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(larg * dpr));
    c.height = Math.max(1, Math.round(alt * dpr));
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenho(x);
    return c;
  }

  function prepararPecas() {
    camadaFundo = rascunho(W, H, ctx => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#05050d');
      g.addColorStop(0.4, '#14122b');
      g.addColorStop(1, '#1b1733');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0a0918';
      for (let k = 0; k < 9; k++) {
        const x = (k + 0.5) * W / 9, alto = 26 + (k * 37 % 22);
        ctx.beginPath();
        ctx.moveTo(x - 16, topoCampo + 12);
        ctx.lineTo(x, topoCampo + 12 - alto);
        ctx.lineTo(x + 16, topoCampo + 12);
        ctx.closePath();
        ctx.fill();
      }
    });
    // Furo de luz: amarelado no meio, escuro na borda.
    const R = raioLuz;
    mascara = rascunho(2 * R, 2 * R, ctx => {
      const quente = ctx.createRadialGradient(R, R, 0, R, R, R);
      quente.addColorStop(0, 'rgba(253, 224, 71, 0.12)');
      quente.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = quente;
      ctx.fillRect(0, 0, 2 * R, 2 * R);
      const g = ctx.createRadialGradient(R, R, R * 0.2, R, R, R);
      g.addColorStop(0, 'rgba(0, 0, 0, 0)');
      g.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0.86)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2 * R, 2 * R);
    });
    halo = rascunho(24, 24, ctx => {
      const g = ctx.createRadialGradient(12, 12, 1, 12, 12, 12);
      g.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
      g.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 24, 24);
    });
    figuraBenja = rascunho(90, 90, ctx => D.corredor(ctx, 45, 84, 72, 0, { numero: 'B' }));
    rostos.clear();
  }

  function rosto(i, j, r) {
    const chave = i + '|' + r;
    if (!rostos.has(chave)) {
      rostos.set(chave, rascunho(2 * r, 2 * r, ctx => {
        ctx.beginPath();
        ctx.arc(r, r, r, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b3a';
        ctx.fill();
        ctx.clip();
        D.retrato(ctx, r, r - r * 0.08, r * 0.6, 'normal', j.ap);
      }));
    }
    return rostos.get(chave);
  }

  function medir(canvas) {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(200, window.innerWidth);
    H = Math.max(300, window.innerHeight);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    topoCampo = 214;
    baseCampo = H - 130;
    raioLuz = Math.min(W * 0.24, 92);
    if (!luz.x) luz = { x: W / 2, y: (topoCampo + baseCampo) / 2 };
    prepararPecas();
  }

  function iniciar() {
    sombras = [];
    particulas = [];
    rodadaMontada = -1;
    estadoAntes = '';
    grrAbertura = false;
    pegoVisto = null;
    luz = { x: W / 2, y: (topoCampo + baseCampo) / 2 };
  }

  // ---------- Toque ----------
  function mirar(x, y) {
    luz = { x: U.limitar(x, 0, W), y: U.limitar(y, topoCampo, H - 40) };
  }

  // Botão de chamar a Melifulina, embaixo do Fedorento e acima do Benjaboy.
  function botaoAjuda() { return { x: 24, y: H - 206, w: W - 48, h: 62 }; }

  // Toque numa sombra já iluminada prende a sombra; numa ainda escura, só
  // leva a luz até ela. Assim não dá para pegar sem ler.
  function tocar(x, y) {
    const t = T.estado;
    if (t && t.estado === 'intro') { T.pularIntro(); return; }
    if (t && t.estado === 'pego' && t.aguardandoAjuda > 0) {
      const b = botaoAjuda();
      if (x >= b.x && x <= b.x + b.w && y >= b.y - 20 && y <= b.y + b.h + 20) T.pedirAjuda();
      return;
    }
    mirar(x, y);
    if (!t || t.estado !== 'pergunta' || !t.jogadores[0].vivo || t.jogadores[0].resposta !== null) return;
    const alvo = sombras.find(sb => !sb.presa && Math.hypot(sb.x - x, sb.y - y) < RAIO_SOMBRA * 1.4);
    if (!alvo || !alvo.revelada) return;
    alvo.presa = true;
    T.responder(alvo.i);
    explodir(alvo.x, alvo.y, alvo.valor === t.pergunta.certo ? '#fde047' : '#f87171');
  }

  // ---------- Rodada ----------
  function montarRodada(t) {
    const q = t.pergunta, f = T.faixaDa(t.rodada);
    const iscas = f === 0 || (f === 1 && q.opcoes.length >= 4) ? 0 : 1;
    const itens = q.opcoes.map((valor, i) => ({ valor, i }));
    for (let k = 0; k < iscas; k++) itens.push({ valor: '…', i: -1 });
    const n = itens.length, largura = W - 70;
    sombras = U.embaralhar(itens).map((it, k) => Object.assign(it, {
      x0: 35 + largura * (k + 0.5) / n, balanco: U.aleatorio(8, 20), fase: Math.random() * 6, vel: U.aleatorio(0.6, 1.1),
      // Vizinhas descem desencontradas, para as respostas não se sobreporem.
      atraso: (k % 2) * 0.12 + U.aleatorio(0, 0.06), luzAcumulada: 0, revelada: false, presa: false, x: 0, y: 0,
    }));
    rodadaMontada = t.rodada;
  }

  function posicionar(t, s) {
    let prog = 0;
    if (t.estado === 'pergunta') prog = congelado = 1 - t.tempo / t.limite;
    else if (t.estado === 'revelar') prog = congelado;
    sombras.forEach(sb => {
      const p = U.limitar((prog - sb.atraso) / (1 - sb.atraso), 0, 1);
      sb.y = topoCampo + 40 + p * (baseCampo - topoCampo - 40);
      sb.x = U.limitar(sb.x0 + Math.sin(s * sb.vel + sb.fase) * sb.balanco, 34, W - 34);
    });
  }

  function atualizar(dt, s) {
    const t = T.estado;
    if (!t) return;
    if (t.estado === 'pergunta' && t.rodada !== rodadaMontada) montarRodada(t);
    if (t.estado !== 'pergunta' && t.estado !== 'revelar') sombras = [];
    posicionar(t, s);
    if (t.estado === 'pergunta') {
      sombras.forEach(sb => {
        if (Math.hypot(sb.x - luz.x, sb.y - luz.y) < raioLuz * 0.85) {
          sb.luzAcumulada += dt;
          if (sb.luzAcumulada >= TEMPO_REVELAR) sb.revelada = true;
        }
      });
    }
    if (t.estado === 'revelar' && estadoAntes !== 'revelar' && t.jogadores[0].certo === false) {
      particulas.push({ tremor: true, t: 0.4 });
    }
    // Sons das cenas na hora certa: rosnado na abertura e enquanto espera a
    // Melifulina, latido quando ela chega, "nhac" e risadinha quando come.
    const som = BB.som;
    if (t.estado === 'intro' && t.tempo > T.INTRO_MELIFULINA && !grrAbertura) { grrAbertura = true; som.tocar('rosnado'); }
    if (t.estado === 'pego' && t.pego) {
      if (pegoVisto !== t.pego) { pegoVisto = t.pego; deixas = { grr: s }; }
      if (t.resgate > 0) {
        if (T.DURACAO_RESGATE - t.resgate >= 0.5 && !deixas.latido) { deixas.latido = true; som.tocar('latido'); }
      } else if (t.aguardandoAjuda > 0) {
        if (s - deixas.grr >= 1.8) { deixas.grr = s; som.tocar('rosnado'); }
      } else {
        const e = T.DURACAO_PEGO - t.tempo;
        if (e >= 1.3 && !deixas.nhac) { deixas.nhac = true; som.tocar('nhac'); }
        if (e >= 1.6 && !deixas.risada) { deixas.risada = true; som.tocar('risada'); }
      }
    } else {
      pegoVisto = null;
    }
    estadoAntes = t.estado;
    particulas.forEach(p => {
      p.t -= dt;
      if (!p.tremor) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
    });
    particulas = particulas.filter(p => p.t > 0);
  }

  function explodir(x, y, cor) {
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, v = U.aleatorio(60, 220);
      particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: U.aleatorio(0.4, 0.8), cor, tam: U.aleatorio(3, 6) });
    }
  }

  // ---------- Desenho ----------
  function fundo(ctx, s) {
    ctx.drawImage(camadaFundo, 0, 0, W, H);
    // Neblina rasteira passando devagar
    for (let i = 0; i < 4; i++) {
      const nx = ((s * (10 + i * 6) + i * 150) % (W + 320)) - 160;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
      D.elipse(ctx, nx, topoCampo + 80 + i * (baseCampo - topoCampo) / 4, 190, 30);
      ctx.fill();
    }
  }

  // Corpo de fumaça escura que se mexe; o rótulo com a resposta aparece na luz.
  function corpoSombra(ctx, sb, s, t) {
    const r = RAIO_SOMBRA;
    ctx.fillStyle = sb.presa ? 'rgba(15, 12, 32, 0.35)' : 'rgba(15, 12, 32, 0.92)';
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + s * 0.8 + sb.fase;
      ctx.beginPath();
      ctx.arc(sb.x + Math.cos(a) * r * 0.35, sb.y + Math.sin(a) * r * 0.3, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    const mostrar = sb.revelada || t.estado === 'revelar';
    if (!mostrar) return;
    const certa = t.estado === 'revelar' && sb.valor === t.pergunta.certo;
    const texto = String(sb.valor);
    let tam = 17;
    ctx.font = D.fonte(tam);
    let w = ctx.measureText(texto).width;
    if (w > 104) { tam *= 104 / w; ctx.font = D.fonte(tam); w = 104; }
    ctx.fillStyle = certa ? '#3ddc84' : sb.presa ? '#f87171' : 'rgba(241, 245, 249, 0.95)';
    D.caixa(ctx, sb.x - w / 2 - 8, sb.y + 4, w + 16, tam + 12, 8);
    ctx.fill();
    ctx.fillStyle = '#0b0a18';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, sb.x, sb.y + 10 + tam / 2);
  }

  function olhosSombra(ctx, sb, s) {
    if (sb.presa) return;
    const piscando = ((s + sb.fase) % 3.7) < 0.12;
    [-1, 1].forEach(l => {
      const ox = sb.x + l * 9, oy = sb.y - 8;
      ctx.drawImage(halo, ox - 12, oy - 12, 24, 24);
      ctx.fillStyle = '#fca5a5';
      D.elipse(ctx, ox, oy, 5, piscando ? 0.8 : 2.6);
      ctx.fill();
    });
  }

  // Escuridão com um furo de luz onde está o dedo.
  // Escuro em volta (quatro retângulos) e o furo de luz pronto por cima.
  function escuridao(ctx) {
    const R = raioLuz, x0 = luz.x - R, y0 = luz.y - R, topoE = topoCampo - 30;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.86)';
    if (y0 > topoE) ctx.fillRect(0, topoE, W, y0 - topoE);
    ctx.fillRect(0, y0 + 2 * R, W, H - (y0 + 2 * R));
    const lado = Math.max(y0, topoE), altLado = y0 + 2 * R - lado;
    ctx.fillRect(0, lado, Math.max(0, x0), altLado);
    ctx.fillRect(x0 + 2 * R, lado, W - (x0 + 2 * R), altLado);
    ctx.drawImage(mascara, x0, y0, 2 * R, 2 * R);
  }

  // O Benjaboy de costas, embaixo, com o facho da lanterna até a luz.
  function benjaboy(ctx, s) {
    const mao = { x: W / 2 + 16, y: H - 64 };
    const dx = luz.x - mao.x, dy = luz.y - mao.y, d = Math.hypot(dx, dy) || 1;
    const px = -dy / d * raioLuz * 0.8, py = dx / d * raioLuz * 0.8;
    const facho = ctx.createLinearGradient(mao.x, mao.y, luz.x, luz.y);
    facho.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
    facho.addColorStop(1, 'rgba(253, 224, 71, 0.05)');
    ctx.fillStyle = facho;
    ctx.beginPath();
    ctx.moveTo(mao.x, mao.y);
    ctx.lineTo(luz.x + px, luz.y + py);
    ctx.lineTo(luz.x - px, luz.y - py);
    ctx.closePath();
    ctx.fill();
    ctx.drawImage(figuraBenja, W / 2 - 45, H - 96, 90, 90);
  }

  // Placar da turma: rostinhos, lanternas e acertou/errou.
  function turma(ctx, t) {
    const r = Math.min(17, W / 24), y = 160;
    t.jogadores.forEach((j, i) => {
      const x = W * (i + 0.5) / 6;
      const sendoPego = t.estado === 'pego' && t.pego === j;
      // Enquanto o rostinho voa para a boca do monstro, o lugar fica vazio.
      const voando = sendoPego && T.DURACAO_PEGO - t.tempo >= 0.6;
      if (!voando) ctx.drawImage(rosto(i, j, r), x - r, y - r, 2 * r, 2 * r);
      if (!j.vivo) {
        ctx.fillStyle = 'rgba(0, 0, 0, ' + (sendoPego && !voando ? 0 : 0.82) + ')';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      let anel = j.voce ? '#ffd23f' : 'rgba(255, 255, 255, 0.35)';
      const mostraResultado = t.estado === 'revelar' && j.certo !== null && (j.vivo || j.pegoNa === t.rodada);
      if (mostraResultado) anel = j.certo ? '#3ddc84' : '#ff4d4d';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = anel;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      if (t.estado === 'pergunta' && j.vivo && !j.voce && j.resposta !== null) {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x + r * 0.8, y - r * 0.8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = D.fonte(Math.min(10, W / 38));
      ctx.fillStyle = j.vivo || sendoPego ? (j.voce ? '#ffd23f' : '#e2e8f0') : '#64748b';
      ctx.fillText(j.voce ? 'Você' : (CURTOS[j.nome] || j.nome), x, y + r + 9);
      if (j.vivo || sendoPego) {
        for (let k = 0; k < T.LANTERNAS; k++) {
          ctx.fillStyle = k < j.lanternas ? '#fde047' : '#2f2f45';
          ctx.beginPath();
          ctx.arc(x + (k - 1) * 8, y + r + 20, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = D.fonte(8);
        ctx.fillText('PEGO', x, y + r + 20);
      }
    });
  }

  // Quebra o texto em linhas que caibam na largura.
  function linhas(ctx, texto, largura) {
    const palavras = texto.split(' '), saida = [];
    let atual = '';
    palavras.forEach(p => {
      const teste = atual ? atual + ' ' + p : p;
      if (ctx.measureText(teste).width > largura && atual) { saida.push(atual); atual = p; } else atual = teste;
    });
    if (atual) saida.push(atual);
    return saida;
  }

  function pergunta(ctx, t) {
    const q = t.pergunta;
    if (!q || (t.estado !== 'pergunta' && t.estado !== 'revelar')) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cy = 94;
    if (q.lacuna) {
      const tam = Math.min(30, W / 12);
      ctx.font = D.fonte(tam);
      const wa = ctx.measureText(q.lacuna.antes).width, wd = ctx.measureText(q.lacuna.depois).width;
      const caixaW = tam * 1.2, total = wa + caixaW + wd + 8;
      let x = W / 2 - total / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(q.lacuna.antes, x, cy);
      x += wa + 4;
      ctx.fillStyle = '#ffd23f';
      D.caixa(ctx, x, cy - tam * 0.55, caixaW, tam * 1.1, 6);
      ctx.fill();
      ctx.fillStyle = '#1a0b3d';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + caixaW / 2, cy);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(q.lacuna.depois, x + caixaW + 4, cy);
      ctx.textAlign = 'center';
    } else {
      let tam = q.enunciado.length > 22 ? Math.min(17, W / 21) : Math.min(30, W / 12);
      ctx.font = D.fonte(tam);
      const ls = linhas(ctx, q.enunciado, W - 32).slice(0, 3);
      ctx.fillStyle = '#fff';
      ls.forEach((l, i) => ctx.fillText(l, W / 2, cy + (i - (ls.length - 1) / 2) * (tam + 4)));
    }
    // Na revelação, a linha de ajuda vira a explicação da resposta.
    let sub = q.sub || (q.lacuna ? 'Qual letra completa a palavra?' : 'Ache a sombra com a resposta!');
    let corSub = '#cbd5e1';
    if (t.estado === 'revelar') {
      sub = q.resposta;
      corSub = t.jogadores[0].certo ? '#86efac' : '#fca5a5';
    }
    let tamSub = 13;
    ctx.font = D.fonte(tamSub);
    const w = ctx.measureText(sub).width;
    if (w > W - 24) { tamSub *= (W - 24) / w; ctx.font = D.fonte(tamSub); }
    ctx.fillStyle = corSub;
    ctx.fillText(sub, W / 2, 128);
  }

  // A cena do monstro, em tempos: sobe (0–0,5 s), abre a boca (0,5–0,8),
  // o rostinho voa até a boca (0,6–1,3), NHAC (1,3), mastiga rindo
  // (1,45–2,7) e desce de volta (2,7–3,2).
  const suave = k => 1 - Math.pow(1 - U.limitar(k, 0, 1), 3);

  function monstroComBrilho(ctx, x, y, s, boca, mastiga, medo, tempo) {
    const brilho = ctx.createRadialGradient(x, y, 20 * s, x, y, 150 * s);
    brilho.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
    brilho.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = brilho;
    ctx.fillRect(x - 150 * s, y - 150 * s, 300 * s, 300 * s);
    D.monstro(ctx, x, y, s, boca, mastiga, medo, tempo);
  }

  function cenaDoMonstro(ctx, t, tempo) {
    if (t.resgate > 0) return cenaDoResgate(ctx, t, tempo);
    const e = T.DURACAO_PEGO - t.tempo, i = t.jogadores.indexOf(t.pego);
    const s = Math.min(W / 360, 1.1), meio = (topoCampo + baseCampo) / 2 + 30, fundoY = H + 120 * s;
    let y = meio;
    if (e < 0.5) y = fundoY + (meio - fundoY) * suave(e / 0.5);
    if (e > 2.7) y = meio + (fundoY - meio) * suave((e - 2.7) / 0.5);
    let boca = 0, mastiga = 0, x = W / 2;
    if (e >= 0.5 && e < 1.3) boca = U.limitar((e - 0.5) / 0.3, 0, 1);
    if (e >= 1.45 && e < 2.7) {
      mastiga = Math.abs(Math.sin((e - 1.45) * 14));
      boca = 0.12 * mastiga;
      x += Math.sin(e * 40) * 2;   // treme de rir
    }
    const esperando = t.aguardandoAjuda > 0;
    if (esperando) boca = 0.85 + Math.sin(tempo * 3) * 0.15;
    monstroComBrilho(ctx, x, y, s, boca, mastiga, false, tempo);
    if (esperando) {
      faixa(ctx, 'O FEDORENTO VAI TE COMER!', '#fca5a5', topoCampo + 36);
      botaoMelifulina(ctx, t, tempo);
    }

    // O rostinho de quem perdeu voa do placar até a boca
    if (e >= 0.6 && e < 1.3) {
      const k = suave((e - 0.6) / 0.7);
      const r0 = Math.min(17, W / 24), ox = W * (i + 0.5) / 6, oy = 160;
      const fx = ox + (x - ox) * k, fy = oy + (y + 12 * s - oy) * k - Math.sin(k * Math.PI) * 40;
      const r = r0 * (1 + Math.sin(k * Math.PI) * 0.8) * (1 - k * 0.5);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(k * Math.PI * 2);
      ctx.drawImage(rosto(i, t.pego, r0), -r, -r, 2 * r, 2 * r);
      ctx.restore();
    }
    if (e >= 1.3 && e < 2.9) {
      const nome = t.pego.voce ? 'VOCÊ' : 'O ' + t.pego.nome.toUpperCase();
      faixa(ctx, 'NHAC! O FEDORENTO COMEU ' + nome + '!', '#fde047', topoCampo + 36);
      if (e >= 1.6) faixa(ctx, 'he-he-he...', '#c4b5fd', y + 95 * s, 16);
    }
  }

  // Botão grande de chamar a Melifulina, com o tempo que falta para decidir.
  function botaoMelifulina(ctx, t, tempo) {
    const b = botaoAjuda(), pulso = 1 + Math.sin(tempo * 8) * 0.02;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.scale(pulso, pulso);
    ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    D.caixa(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fill();
    ctx.stroke();
    D.melifulina(ctx, b.x + 36, b.y + b.h - 6, 0.55, Math.sin(tempo * 10) > 0, tempo);
    ctx.fillStyle = '#9d174d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let tam = Math.min(18, W / 20);
    ctx.font = D.fonte(tam);
    const texto = 'AU! CHAMAR A MELIFULINA';
    const w = ctx.measureText(texto).width, cabe = b.w - 84;
    if (w > cabe) { tam *= cabe / w; ctx.font = D.fonte(tam); }
    ctx.fillText(texto, b.x + 72, b.y + b.h / 2 - 4);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(b.x + 72, b.y + b.h - 14, cabe, 5);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(b.x + 72, b.y + b.h - 14, cabe * U.limitar(t.aguardandoAjuda / T.ESPERA_AJUDA, 0, 1), 5);
    ctx.restore();
  }

  // A Melifulina chega correndo, late, e o Fedorento morre de medo e foge.
  function cenaDoResgate(ctx, t, tempo) {
    const k = T.DURACAO_RESGATE - t.resgate;
    const s = Math.min(W / 360, 1.1), meio = (topoCampo + baseCampo) / 2 + 30;
    let x = W / 2 + (k > 0.5 && k < 1.6 ? Math.sin(tempo * 50) * 3 : 0), y = meio, esc = s;
    if (k >= 1.6) {
      const f = suave((k - 1.6) / 1.2);
      y = meio + (topoCampo - 260 - meio) * f;
      esc = s * (1 - 0.5 * f);
    }
    monstroComBrilho(ctx, x, y, esc, 0, 0, k >= 0.45, tempo);
    // Melifulina correndo até perto do Benjaboy e latindo
    const alvoX = W / 2 - 92, chao = H - 14;
    const mx = -60 + (alvoX + 60) * suave(k / 0.5);
    const latindo = k > 0.5 && Math.floor(k * 6) % 2 === 0;
    const pulo = k > 0.5 ? Math.abs(Math.sin(k * 18)) * 6 : Math.abs(Math.sin(k * 30)) * 4;
    D.melifulina(ctx, mx, chao - pulo, 1, latindo, tempo);
    [0.55, 0.8, 1.05].forEach((t0, n) => {
      const idade = k - t0;
      if (idade < 0 || idade > 0.9) return;
      ctx.globalAlpha = 1 - idade / 0.9;
      faixa(ctx, 'AU!', '#ffffff', chao - 110 - idade * 60 - n * 6, 22 - n * 2, mx + 20 + n * 26);
      ctx.globalAlpha = 1;
    });
    if (k >= 1.6) {
      faixa(ctx, 'A MELIFULINA ESPANTOU O FEDORENTO!', '#f9a8d4', topoCampo + 36);
      faixa(ctx, '+1 lanterna para você', '#fde047', topoCampo + 66, 15);
    }
  }

  function faixa(ctx, texto, cor, y, tamanho, x) {
    x = x === undefined ? W / 2 : x;
    let tam = tamanho || Math.min(20, W / 17);
    ctx.font = D.fonte(tam);
    const w = ctx.measureText(texto).width;
    if (w > W - 28) { tam *= (W - 28) / w; ctx.font = D.fonte(tam); }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#05050d';
    ctx.strokeText(texto, x, y);
    ctx.fillStyle = cor;
    ctx.fillText(texto, x, y);
  }

  // Ícone da Melifulina no topo: acesa enquanto a ajuda ainda pode ser usada.
  function iconeMelifulina(ctx, t) {
    const x = W - 82, y = 28, r = 17;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = t.ajuda ? '#fce7f3' : '#334155';
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = t.ajuda ? 1 : 0.35;
    D.melifulina(ctx, x, y + 38, 0.55, false, 0);
    ctx.restore();
    ctx.lineWidth = 2;
    ctx.strokeStyle = t.ajuda ? '#ec4899' : '#475569';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Segunda parte da abertura: a Melifulina se apresenta.
  function apresentacaoMelifulina(ctx, tempo) {
    const chao = baseCampo - 10;
    D.melifulina(ctx, W / 2, chao, 1.7, Math.sin(tempo * 5) > 0.6, tempo);
    const ls = ['Meu nome é Melifulina.', 'Eu sou uma cadelinha.', 'Você pode me pedir ajuda, se quiser,', 'para espantar o Fedorento.', 'Mas só uma vez!'];
    const topoBalao = topoCampo + 22, altura = ls.length * 22 + 24;
    ctx.fillStyle = '#ffffff';
    D.caixa(ctx, 18, topoBalao, W - 36, altura, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 12, topoBalao + altura);
    ctx.lineTo(W / 2, topoBalao + altura + 16);
    ctx.lineTo(W / 2 + 12, topoBalao + altura);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ls.forEach((l, n) => {
      let tam = n < 2 ? Math.min(17, W / 21) : Math.min(14, W / 26);
      ctx.font = D.fonte(tam);
      const w = ctx.measureText(l).width;
      if (w > W - 60) { tam *= (W - 60) / w; ctx.font = D.fonte(tam); }
      ctx.fillStyle = n < 2 ? '#9d174d' : '#334155';
      ctx.fillText(l, W / 2, topoBalao + 22 + n * 22);
    });
    faixa(ctx, 'toque para começar', '#cbd5e1', H - 24, 13);
  }

  function rodape(ctx, texto, cor) {
    ctx.font = D.fonte(20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#05050d';
    ctx.strokeText(texto, W / 2, H - 104);
    ctx.fillStyle = cor;
    ctx.fillText(texto, W / 2, H - 104);
  }

  function topo(ctx, t) {
    ctx.fillStyle = 'rgba(5, 5, 13, 0.9)';
    ctx.fillRect(0, 0, W, 138);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = D.fonte(12);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.fillText('MEIA-NOITE', 14, 18);
    if (t.rodada) {
      ctx.font = D.fonte(16);
      ctx.fillStyle = t.horaDaSombra ? '#f87171' : '#ffd23f';
      ctx.fillText('RODADA ' + t.rodada + (t.horaDaSombra ? ' · HORA DA SOMBRA' : ''), 14, 38);
    }
    iconeMelifulina(ctx, t);
    if (t.pergunta && t.estado === 'pergunta') {
      const frac = U.limitar(t.tempo / t.limite, 0, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(14, 54, W - 80, 5);
      ctx.fillStyle = t.tempo <= 3 ? '#f87171' : '#fde047';
      ctx.fillRect(14, 54, (W - 80) * frac, 5);
    }
  }

  function mensagem(ctx, ls, cor, desce) {
    const alturaLinha = 24, y0 = (topoCampo + baseCampo) / 2 - (ls.length - 1) * alturaLinha / 2 + (desce || 0);
    ctx.fillStyle = 'rgba(5, 5, 13, 0.72)';
    D.caixa(ctx, 12, y0 - 30, W - 24, ls.length * alturaLinha + 36, 14);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ls.forEach((l, i) => {
      let tam = i === 0 ? Math.min(22, W / 16) : Math.min(14, W / 27);
      ctx.font = D.fonte(tam);
      const w = ctx.measureText(l).width;
      if (w > W - 44) { tam *= (W - 44) / w; ctx.font = D.fonte(tam); }
      ctx.fillStyle = i === 0 ? cor : 'rgba(226, 232, 240, 0.92)';
      ctx.fillText(l, W / 2, y0 + i * alturaLinha);
    });
  }

  function desenhar(ctx, s) {
    const t = T.estado;
    if (!t) return;
    const tremendo = particulas.some(p => p.tremor);
    const d = tremendo ? 6 : 0;
    ctx.setTransform(dpr, 0, 0, dpr, dpr * (Math.random() - 0.5) * d, dpr * (Math.random() - 0.5) * d);
    fundo(ctx, s);
    sombras.forEach(sb => corpoSombra(ctx, sb, s, t));
    escuridao(ctx);
    sombras.forEach(sb => olhosSombra(ctx, sb, s));
    // Na revelação a resposta certa aparece mesmo fora da luz.
    if (t.estado === 'revelar') sombras.filter(sb => sb.valor === t.pergunta.certo).forEach(sb => corpoSombra(ctx, sb, s, t));
    benjaboy(ctx, s);
    if (t.estado === 'pego' && t.pego) cenaDoMonstro(ctx, t, s);
    particulas.forEach(p => {
      if (p.tremor) return;
      ctx.globalAlpha = U.limitar(p.t * 2, 0, 1);
      ctx.fillStyle = p.cor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    topo(ctx, t);
    pergunta(ctx, t);
    turma(ctx, t);

    if (t.estado === 'intro' && t.tempo > T.INTRO_MELIFULINA) {
      monstroComBrilho(ctx, W / 2, topoCampo + 120, Math.min(W / 360, 1.1) * 0.62, 0, 0, false, s);
      mensagem(ctx, ['O FEDORENTO DESAFIA A TURMA', 'Arraste o dedo para iluminar as sombras.', 'Toque na que leva a resposta certa!',
        'Errou ou deixou chegar: perde uma lanterna.', 'Sem lanterna, vira lanche do Fedorento!'], '#f87171', 60);
    } else if (t.estado === 'intro') {
      apresentacaoMelifulina(ctx, s);
    } else if (t.estado === 'fim') {
      mensagem(ctx, t.posicaoFinal === 1 ? ['VOCÊ VENCEU A SOMBRA!'] : ['FIM DO TORNEIO'], t.posicaoFinal === 1 ? '#3ddc84' : '#f87171');
    } else if (t.estado === 'revelar' && t.jogadores[0].certo === false) {
      rodape(ctx, t.jogadores[0].resposta === null ? 'A SOMBRA CHEGOU!' : 'ERA OUTRA!', '#f87171');
    } else if (t.estado === 'revelar' && t.jogadores[0].certo) {
      rodape(ctx, 'PRESA!', '#3ddc84');
    }
  }

  return { medir, iniciar, atualizar, desenhar, mirar, tocar, get sombras() { return sombras; } };
})();
