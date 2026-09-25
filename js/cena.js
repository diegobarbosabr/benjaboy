// Desenha a corrida e o painel de cima, com a pergunta e as opções alinhadas
// às pistas.
BB.cena = (function () {
  const D = BB.desenho, R = BB.corrida, U = BB.util;
  const VISTA_A_FRENTE = 520;     // quanto da pista aparece à frente do jogador
  let W = 0, H = 0, dpr = 1, esc = 1, x0 = 0, py = 0, hudH = 0;

  function medir(canvas) {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    // Janela minimizada ou escondida pode medir zero: nunca deixa a escala
    // ficar negativa.
    W = Math.max(200, window.innerWidth);
    H = Math.max(300, window.innerHeight);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    hudH = U.limitar(H * 0.2, 128, 170);
    py = H * 0.84;
    esc = Math.max(0.2, Math.min((W - 24) / R.LARG, (py - hudH) / VISTA_A_FRENTE));
    x0 = (W - R.LARG * esc) / 2;
  }

  function sx(x) { return x0 + x * esc; }
  function sy(y, cam) { return py - (y - cam) * esc; }
  function faixaDo(x) { return U.limitar(Math.floor(x / R.FAIXA), 0, 2); }

  // Cada fase tem seu cenário: arena roxa (a pé), neve (snowboard) e estrada (kart).
  const CENARIOS = {
    arena: { ceu: ['#3c0d7a', '#7b1fa2'], chao: '#efeaff', faixa: '#e2d9ff', linha: 'rgba(91, 43, 217, 0.3)',
      zebra: '#ff3d7f', nome: 'rgba(26, 11, 61, 0.55)', altura: 72, anel: 26, desenho: 'corredor' },
    neve: { ceu: ['#bfdbfe', '#eff6ff'], chao: '#f8fbff', faixa: '#e8f1fc', linha: 'rgba(96, 165, 250, 0.35)',
      zebra: '#1d4ed8', nome: 'rgba(30, 58, 138, 0.6)', altura: 76, anel: 36, desenho: 'snowboard' },
    kart: { ceu: ['#14532d', '#15803d'], chao: '#3b3f4c', faixa: '#343845', linha: 'rgba(255, 255, 255, 0.7)',
      zebra: '#e63946', nome: 'rgba(255, 255, 255, 0.7)', altura: 80, anel: 40, desenho: 'kart' },
  };

  function fundo(ctx, cen, cam) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, cen.ceu[0]);
    g.addColorStop(1, cen.ceu[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (cen !== CENARIOS.neve) return;
    // Pinheiros dos dois lados, presos ao chão: passam por ele na descida.
    const topo = cam + py / esc + 100, base = cam - (H - py) / esc - 100;
    for (let k = Math.floor(base / 170); k * 170 < topo; k++) {
      const acaso = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1;
      const lado = k % 2 === 0 ? -1 : 1;
      const x = lado < 0 ? sx(-22 - acaso * 14) : sx(R.LARG + 22 + acaso * 14);
      D.pinheiro(ctx, x, sy(k * 170, cam), (58 + acaso * 20) * esc);
    }
  }

  function pista(ctx, cam, cen) {
    const topo = cam + py / esc + 60, base = cam - (H - py) / esc - 60;
    const xa = sx(0), xb = sx(R.LARG);
    ctx.fillStyle = cen.chao;
    ctx.fillRect(xa, 0, xb - xa, H);
    ctx.fillStyle = cen.faixa;
    for (let y = Math.floor(base / 200) * 200; y < topo; y += 200) {
      const a = sy(y + 100, cam);
      ctx.fillRect(xa, a, xb - xa, 100 * esc);
    }
    // Divisórias tracejadas, presas ao chão para mostrar o movimento.
    ctx.fillStyle = cen.linha;
    for (let y = Math.floor(base / 60) * 60; y < topo; y += 60) {
      [1, 2].forEach(i => ctx.fillRect(sx(i * R.FAIXA) - 1.5 * esc, sy(y + 30, cam), 3 * esc, 30 * esc));
    }
    // Zebras nas bordas
    const zw = 9 * esc;
    for (let y = Math.floor(base / 40) * 40; y < topo; y += 40) {
      const k = Math.round(y / 40);
      ctx.fillStyle = ((k % 2) + 2) % 2 === 0 ? cen.zebra : '#ffffff';
      const a = sy(y + 40, cam);
      ctx.fillRect(xa - zw, a, zw, 40 * esc);
      ctx.fillRect(xb, a, zw, 40 * esc);
    }
    ctx.fillStyle = cen === CENARIOS.neve ? '#1d4ed8' : '#ffffff';
    ctx.fillRect(xa, sy(0, cam) - 5 * esc, xb - xa, 10 * esc);
  }

  function corredor(ctx, r, cam, o, cen) {
    const x = sx(r.x), y = sy(r.y, cam), h = cen.altura * esc;
    if (r.jogador) {
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.9)';
      ctx.lineWidth = 3;
      D.elipse(ctx, x, y, cen.anel * esc, 8 * esc);
      ctx.stroke();
      if (r.boost > 0 && r.tonto === 0) turbo(ctx, x, y, cen);
    }
    o.rot = r.tonto > 0 ? r.girar : 0;
    o.tonto = r.tonto > 0;
    D[cen.desenho](ctx, x, y, h, r.fase, o);
    if (r.nome) {
      ctx.font = D.fonte(Math.max(9, 10 * esc));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = cen.nome;
      ctx.fillText(r.nome, x, y - h * 1.18);
    }
  }

  // Rastro do turbo atrás dele: fogo no kart, neve levantando na prancha,
  // riscos de velocidade a pé.
  function turbo(ctx, x, y, cen) {
    const t = performance.now() / 1000;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 11 * esc, fase = (t * 6 + i * 0.37) % 1;
      const y0 = y + (4 + fase * 30) * esc, comp = (18 + (i % 2) * 10) * esc * (1 - fase * 0.5);
      ctx.strokeStyle = cen === CENARIOS.kart ? (i % 2 ? '#fb923c' : '#fde047')
        : cen === CENARIOS.neve ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 210, 63, 0.85)';
      ctx.globalAlpha = 1 - fase;
      ctx.lineWidth = (cen === CENARIOS.kart ? 5 : 3.5) * esc;
      ctx.beginPath();
      ctx.moveTo(x + dx, y0);
      ctx.lineTo(x + dx * 1.3, y0 + comp);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Obstáculo de acordo com o cenário: mesma regra, cara diferente.
  function obstaculo(ctx, o, cam, cen) {
    const y = sy(o.y, cam);
    if (o.tipo === 'barra') {
      D.rolo(ctx, sx(R.barraX(o)), y, 2 * R.FAIXA * esc, 34 * esc, o.fase);
      return;
    }
    if (o.tipo === 'bloco') {
      const x = sx(R.blocoX(o));
      if (cen === CENARIOS.neve) D.bolaDeNeve(ctx, x, y, 36 * esc, o.fase * 3);
      else if (cen === CENARIOS.kart) D.tambor(ctx, x, y, 60 * esc, 64 * esc);
      else D.bloco(ctx, x, y, R.FAIXA * 0.9 * esc, 46 * esc);
      return;
    }
    o.faixas.forEach(f => {
      const x = sx(f * R.FAIXA + R.FAIXA / 2);
      if (cen === CENARIOS.neve) D.pinheiro(ctx, x, y, 84 * esc);
      else if (cen === CENARIOS.kart) D.pneus(ctx, x, y, R.FAIXA * 0.8 * esc);
      else D.bloco(ctx, x, y, R.FAIXA * 0.94 * esc, 40 * esc);
    });
  }

  function particulas(ctx, c, cam) {
    c.particulas.forEach(p => {
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y, cam));
      ctx.rotate(p.giro);
      ctx.globalAlpha = Math.min(1, p.t * 2);
      ctx.fillStyle = p.cor;
      const t = p.tam * esc;
      ctx.fillRect(-t / 2, -t / 4, t, t / 2);
      ctx.restore();
    });
  }

  function lacuna(ctx, q, cx, cy, tam) {
    ctx.font = D.fonte(tam);
    let wa = ctx.measureText(q.antes).width, wd = ctx.measureText(q.depois).width;
    let total = wa + wd + tam * 1.6;
    if (total > W - 28) {
      tam *= (W - 28) / total;
      ctx.font = D.fonte(tam);
      wa = ctx.measureText(q.antes).width;
      wd = ctx.measureText(q.depois).width;
      total = wa + wd + tam * 1.6;
    }
    let x = cx - total / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(q.antes, x, cy);
    x += wa + tam * 0.15;
    ctx.fillStyle = '#ffd23f';
    D.caixa(ctx, x, cy - tam * 0.58, tam * 1.3, tam * 1.1, tam * 0.2);
    ctx.fill();
    ctx.fillStyle = '#1a0b3d';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + tam * 0.65, cy);
    x += tam * 1.45;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(q.depois, x, cy);
  }

  function hud(ctx, c) {
    ctx.fillStyle = '#1a0b3d';
    ctx.fillRect(0, 0, W, hudH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, hudH - 2, W, 2);
    ctx.textBaseline = 'middle';

    // Colocação (pisca verde e cresce quando ele ultrapassa) e barra de
    // progresso com todos os corredores
    const pos = R.posicaoAtual();
    const brilho = c.destaquePos / 0.7;
    ctx.textAlign = 'left';
    ctx.fillStyle = brilho > 0 ? '#3ddc84' : '#ffd23f';
    ctx.font = D.fonte(26 * (1 + 0.35 * brilho));
    ctx.fillText(pos + 'º', 14, 32);
    ctx.font = D.fonte(26);
    const wPos = ctx.measureText(pos + 'º').width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = D.fonte(13);
    ctx.fillText('de 6', 20 + wPos, 35);
    const bx = 96, bw = Math.max(40, W - bx - 68), by = 32;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    D.caixa(ctx, bx, by - 5, bw, 10, 5);
    ctx.fill();
    const prog = r => U.limitar(r.y / c.chegadaY, 0, 1);
    c.bots.forEach(b => {
      ctx.fillStyle = b.cor;
      ctx.beginPath();
      ctx.arc(bx + bw * prog(b), by, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#1a0b3d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx + bw * prog(c.jogador), by, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const linhaQ = 58 + (hudH - 58) * 0.3, linhaO = hudH - 28;
    const k = c.jogador.portaAtual;
    ctx.textAlign = 'center';
    if (k >= c.perguntas.length) {
      ctx.fillStyle = '#fff';
      ctx.font = D.fonte(28);
      ctx.fillText(c.jogador.chegou !== null ? 'CHEGOU!' : 'RETA FINAL!', W / 2, (linhaQ + linhaO) / 2);
      return;
    }
    const q = c.perguntas[k];
    const tamQ = Math.min(34, W * 0.085);
    ctx.fillStyle = '#fff';
    ctx.font = D.fonte(tamQ);
    if (q.fase === 'mat') ctx.fillText(q.pergunta + ' = ?', W / 2, linhaQ);
    else if (q.antes !== undefined) lacuna(ctx, q, W / 2, linhaQ, tamQ);
    else {
      const w = ctx.measureText(q.pergunta).width;
      if (w > W - 28) ctx.font = D.fonte(tamQ * (W - 28) / w);
      ctx.fillText(q.pergunta, W / 2, linhaQ);
    }
    if (q.repeticao) {
      const ty = linhaQ - tamQ * 0.8;
      ctx.fillStyle = '#ff3d7f';
      D.caixa(ctx, W / 2 - 34, ty - 8, 68, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = D.fonte(10);
      ctx.fillText('DE NOVO', W / 2, ty + 0.5);
    }

    const minha = faixaDo(c.jogador.alvoX);
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const cx = sx(i * R.FAIXA + R.FAIXA / 2), w = R.FAIXA * esc * 0.86, h = 38;
      const rotulo = q.portas[i];
      if (rotulo === null) {
        ctx.fillStyle = 'rgba(255, 77, 77, 0.35)';
        D.caixa(ctx, cx - w / 2, linhaO - h / 2, w, h, 10);
        ctx.fill();
        if (i === minha) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = D.fonte(20);
        ctx.fillText('✕', cx, linhaO + 1);
        continue;
      }
      ctx.fillStyle = i === minha ? '#ffd23f' : 'rgba(255, 255, 255, 0.14)';
      D.caixa(ctx, cx - w / 2, linhaO - h / 2, w, h, 10);
      ctx.fill();
      ctx.fillStyle = i === minha ? '#1a0b3d' : '#fff';
      ctx.font = D.fonte(22);
      const tw = ctx.measureText(rotulo).width;
      if (tw > w * 0.88) ctx.font = D.fonte(22 * w * 0.88 / tw);
      ctx.fillText(rotulo, cx, linhaO + 1);
    }
  }

  function avisos(ctx, c) {
    c.avisos.forEach(a => {
      const prog = 1 - a.t / a.total;
      const zoom = prog < 0.12 ? 0.6 + (prog / 0.12) * 0.4 : 1;
      ctx.save();
      ctx.globalAlpha = a.t < 0.3 ? a.t / 0.3 : 1;
      ctx.translate(W / 2, a.grande ? hudH + (py - hudH) * 0.42 : hudH + (py - hudH) * 0.2);
      ctx.scale(zoom, zoom);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (a.grande) {
        const titulo = a.titulo || 'O CERTO É';
        let tam = 28, tamT = 13;
        ctx.font = D.fonte(tam);
        const w = ctx.measureText(a.texto).width;
        if (w > W - 64) { tam *= (W - 64) / w; ctx.font = D.fonte(tam); }
        const wTexto = ctx.measureText(a.texto).width;
        ctx.font = D.fonte(tamT);
        const wt = ctx.measureText(titulo).width;
        if (wt > W - 64) { tamT *= (W - 64) / wt; ctx.font = D.fonte(tamT); }
        const larg = Math.min(W - 24, Math.max(wTexto, ctx.measureText(titulo).width) + 40);
        ctx.fillStyle = a.cor;
        D.caixa(ctx, -larg / 2, -34, larg, 76, 16);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(titulo, 0, -16);
        ctx.fillStyle = '#fff';
        ctx.font = D.fonte(tam);
        ctx.fillText(a.texto, 0, 14);
      } else {
        ctx.font = D.fonte(44);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#1a0b3d';
        ctx.strokeText(a.texto, 0, 0);
        ctx.fillStyle = a.cor;
        ctx.fillText(a.texto, 0, 0);
      }
      ctx.restore();
    });
  }

  function contagem(ctx, c) {
    const n = Math.ceil(c.contagem);
    if (n < 1 || n > 3) return;
    const f = c.contagem - Math.floor(c.contagem);
    ctx.save();
    ctx.translate(W / 2, hudH + (py - hudH) * 0.4);
    ctx.scale(0.8 + f * 0.5, 0.8 + f * 0.5);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = D.fonte(96);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#1a0b3d';
    ctx.strokeText(String(n), 0, 0);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(String(n), 0, 0);
    ctx.restore();
  }

  function desenhar(ctx, t) {
    const c = R.estado;
    if (!c) return;
    const cen = CENARIOS[c.tema];
    // Bateu ou errou: a tela treme um pouquinho (o painel de cima, não).
    const tremor = c.tremor * 14;
    ctx.setTransform(dpr, 0, 0, dpr, dpr * (Math.random() - 0.5) * tremor, dpr * (Math.random() - 0.5) * tremor);
    const cam = c.cameraY;
    fundo(ctx, cen, cam);
    pista(ctx, cam, cen);

    // Do mais longe para o mais perto, para cada coisa tapar o que está atrás.
    const itens = [];
    const visivel = y => { const s = sy(y, cam); return s > hudH - 260 && s < H + 160; };
    const respostas = c.kart ? D.caixas : D.portal;
    const paleta = D.PALETAS[c.tema];
    c.portas.forEach((p, i) => {
      if (visivel(p.y)) itens.push({ y: p.y, f: () => respostas(ctx, sx(0), sy(p.y, cam), R.LARG * esc, c.perguntas[i].portas, p.estados, t, paleta) });
    });
    c.tiros.forEach(tr => {
      if (visivel(tr.y)) itens.push({ y: tr.y, f: () => D.gosma(ctx, sx(tr.x), sy(tr.y, cam) - 18 * esc, 9 * esc) });
    });
    c.obstaculos.forEach(o => {
      if (!o.destruido && visivel(o.y)) itens.push({ y: o.y, f: () => obstaculo(ctx, o, cam, cen) });
    });
    if (visivel(c.chegadaY)) itens.push({ y: c.chegadaY, f: () => D.chegada(ctx, sx(0), sy(c.chegadaY, cam), R.LARG * esc, c.mensagem) });
    c.bots.forEach(b => {
      if (visivel(b.y)) itens.push({ y: b.y, f: () => corredor(ctx, b, cam, { capacete: b.cor, cor: b.cor }, cen) });
    });
    itens.push({ y: c.jogador.y - 0.01, f: () => corredor(ctx, c.jogador, cam, { numero: 'B' }, cen) });
    itens.sort((a, b) => b.y - a.y);
    itens.forEach(i => i.f());

    particulas(ctx, c, cam);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hud(ctx, c);
    avisos(ctx, c);
    if (c.estado === 'contagem') contagem(ctx, c);
  }

  return { medir, desenhar };
})();
