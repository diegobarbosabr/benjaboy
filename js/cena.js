// Desenha a corrida e o painel de cima, com a pergunta e as opções alinhadas
// às pistas.
BB.cena = (function () {
  const D = BB.desenho, R = BB.corrida, U = BB.util;
  const ALTURA_CORREDOR = 72, ALTURA_KART = 80;   // em unidades do mundo
  const VISTA_A_FRENTE = 520;     // quanto da pista aparece à frente do jogador
  let W = 0, H = 0, dpr = 1, esc = 1, x0 = 0, py = 0, hudH = 0;

  function medir(canvas) {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    hudH = U.limitar(H * 0.2, 128, 170);
    py = H * 0.84;
    esc = Math.min((W - 24) / R.LARG, (py - hudH) / VISTA_A_FRENTE);
    x0 = (W - R.LARG * esc) / 2;
  }

  function sx(x) { return x0 + x * esc; }
  function sy(y, cam) { return py - (y - cam) * esc; }
  function faixaDo(x) { return U.limitar(Math.floor(x / R.FAIXA), 0, 2); }

  // No kart a pista é de asfalto, com grama dos lados.
  function fundo(ctx, kart) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, kart ? '#14532d' : '#3c0d7a');
    g.addColorStop(1, kart ? '#15803d' : '#7b1fa2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function pista(ctx, cam, kart) {
    const topo = cam + py / esc + 60, base = cam - (H - py) / esc - 60;
    const xa = sx(0), xb = sx(R.LARG);
    ctx.fillStyle = kart ? '#3b3f4c' : '#efeaff';
    ctx.fillRect(xa, 0, xb - xa, H);
    ctx.fillStyle = kart ? '#343845' : '#e2d9ff';
    for (let y = Math.floor(base / 200) * 200; y < topo; y += 200) {
      const a = sy(y + 100, cam);
      ctx.fillRect(xa, a, xb - xa, 100 * esc);
    }
    // Divisórias tracejadas, presas ao chão para mostrar o movimento.
    ctx.fillStyle = kart ? 'rgba(255, 255, 255, 0.7)' : 'rgba(91, 43, 217, 0.3)';
    for (let y = Math.floor(base / 60) * 60; y < topo; y += 60) {
      [1, 2].forEach(i => ctx.fillRect(sx(i * R.FAIXA) - 1.5 * esc, sy(y + 30, cam), 3 * esc, 30 * esc));
    }
    // Zebras nas bordas
    const zw = 9 * esc;
    for (let y = Math.floor(base / 40) * 40; y < topo; y += 40) {
      const k = Math.round(y / 40);
      ctx.fillStyle = ((k % 2) + 2) % 2 === 0 ? (kart ? '#e63946' : '#ff3d7f') : '#ffffff';
      const a = sy(y + 40, cam);
      ctx.fillRect(xa - zw, a, zw, 40 * esc);
      ctx.fillRect(xb, a, zw, 40 * esc);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(xa, sy(0, cam) - 5 * esc, xb - xa, 10 * esc);
  }

  function corredor(ctx, r, cam, o, kart) {
    const x = sx(r.x), y = sy(r.y, cam), h = (kart ? ALTURA_KART : ALTURA_CORREDOR) * esc;
    if (r.jogador) {
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.9)';
      ctx.lineWidth = 3;
      D.elipse(ctx, x, y, (kart ? 40 : 26) * esc, 8 * esc);
      ctx.stroke();
    }
    o.rot = r.tonto > 0 ? r.girar : 0;
    o.tonto = r.tonto > 0;
    (kart ? D.kart : D.corredor)(ctx, x, y, h, r.fase, o);
    if (r.nome) {
      ctx.font = D.fonte(Math.max(9, 10 * esc));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = kart ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 11, 61, 0.55)';
      ctx.fillText(r.nome, x, y - h * 1.18);
    }
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

    // Colocação e barra de progresso com todos os corredores
    const pos = R.posicaoAtual();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd23f';
    ctx.font = D.fonte(26);
    ctx.fillText(pos + 'º', 14, 32);
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cam = c.cameraY;
    fundo(ctx, c.kart);
    pista(ctx, cam, c.kart);

    // Do mais longe para o mais perto, para cada coisa tapar o que está atrás.
    const itens = [];
    const visivel = y => { const s = sy(y, cam); return s > hudH - 260 && s < H + 160; };
    const respostas = c.kart ? D.caixas : D.portal;
    c.portas.forEach((p, i) => {
      if (visivel(p.y)) itens.push({ y: p.y, f: () => respostas(ctx, sx(0), sy(p.y, cam), R.LARG * esc, c.perguntas[i].portas, p.estados, t) });
    });
    c.tiros.forEach(tr => {
      if (visivel(tr.y)) itens.push({ y: tr.y, f: () => D.gosma(ctx, sx(tr.x), sy(tr.y, cam) - 18 * esc, 9 * esc) });
    });
    c.obstaculos.forEach(o => {
      if (!visivel(o.y)) return;
      if (o.tipo === 'bloco') {
        itens.push({ y: o.y, f: () => D.bloco(ctx, sx(R.blocoX(o)), sy(o.y, cam), R.FAIXA * 0.9 * esc, 46 * esc) });
      } else {
        itens.push({ y: o.y, f: () => o.faixas.forEach(fx => D.bloco(ctx, sx(fx * R.FAIXA + R.FAIXA / 2), sy(o.y, cam), R.FAIXA * 0.94 * esc, 40 * esc)) });
      }
    });
    if (visivel(c.chegadaY)) itens.push({ y: c.chegadaY, f: () => D.chegada(ctx, sx(0), sy(c.chegadaY, cam), R.LARG * esc, c.mensagem) });
    c.bots.forEach(b => {
      if (visivel(b.y)) itens.push({ y: b.y, f: () => corredor(ctx, b, cam, { capacete: b.cor, cor: b.cor }, c.kart) });
    });
    itens.push({ y: c.jogador.y - 0.01, f: () => corredor(ctx, c.jogador, cam, { numero: 'B' }, c.kart) });
    itens.sort((a, b) => b.y - a.y);
    itens.forEach(i => i.f());

    particulas(ctx, c, cam);
    hud(ctx, c);
    avisos(ctx, c);
    if (c.estado === 'contagem') contagem(ctx, c);
  }

  return { medir, desenhar };
})();
