// Desenhos em canvas: o Benjaboy (de frente e correndo de costas), os bots,
// as portas, os obstáculos e a chegada.
BB.desenho = (function () {
  const FONTE = 'system-ui, Roboto, "Segoe UI", Arial, sans-serif';
  const C = {
    contorno: '#2b1b12',
    pele: '#f2c6a5', peleSombra: '#dfa785',
    cabelo: '#8a5528', cabeloClaro: '#c08a4a', cabeloEscuro: '#5a3316',
    olho: '#4a2d16',
    camisa: '#22306b', camisaClara: '#3a4ea8',
    short: '#1c1c2e', tenis: '#ffffff', sola: '#ff3d7f',
    porta: '#ffd23f', portaTexto: '#1a0b3d', certa: '#3ddc84', errada: '#ff4d4d',
    poste: '#5b2bd9', viga: '#7c4dff', rosa: '#ff3d7f',
  };

  function fonte(px) { return '900 ' + Math.max(8, Math.round(px)) + 'px ' + FONTE; }

  function caixa(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function elipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  function coracao(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.4, y - s * 0.95, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.4, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  // Pontas da franja caída para o lado, como na foto (frações do raio).
  const FRANJA = [
    [1.02, 0.12], [0.86, -0.34], [0.7, -0.02], [0.52, -0.42], [0.3, -0.06],
    [0.12, -0.44], [-0.12, -0.02], [-0.26, -0.42], [-0.52, 0.04], [-0.62, -0.36],
    [-0.9, 0.18], [-1.06, 0.2],
  ];

  // Benjaboy de frente, do peito para cima. (cx, cy) é o centro da cabeça.
  function retrato(ctx, cx, cy, r, expressao) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.contorno;
    const linha = Math.max(1.5, r * 0.05);
    ctx.lineWidth = linha;

    ctx.fillStyle = C.peleSombra;
    caixa(ctx, -0.3 * r, 0.7 * r, 0.6 * r, 0.5 * r, 0.1 * r);
    ctx.fill();

    // Moletom e gola
    ctx.fillStyle = C.camisa;
    ctx.beginPath();
    ctx.moveTo(-1.45 * r, 2.5 * r);
    ctx.bezierCurveTo(-1.4 * r, 1.3 * r, -0.75 * r, 1.04 * r, 0, 1.04 * r);
    ctx.bezierCurveTo(0.75 * r, 1.04 * r, 1.4 * r, 1.3 * r, 1.45 * r, 2.5 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.camisaClara;
    ctx.beginPath();
    ctx.moveTo(-0.52 * r, 1.08 * r);
    ctx.quadraticCurveTo(0, 1.55 * r, 0.52 * r, 1.08 * r);
    ctx.lineTo(0.34 * r, 1.02 * r);
    ctx.quadraticCurveTo(0, 1.32 * r, -0.34 * r, 1.02 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Volume do cabelo atrás da cabeça
    ctx.fillStyle = C.cabeloEscuro;
    elipse(ctx, 0, -0.1 * r, 1.14 * r, 1.08 * r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.pele;
    [-1, 1].forEach(l => {
      elipse(ctx, l * 0.95 * r, 0.24 * r, 0.16 * r, 0.22 * r);
      ctx.fill();
      ctx.stroke();
    });
    elipse(ctx, 0, 0.1 * r, 0.94 * r, 0.98 * r);
    ctx.fill();
    ctx.stroke();

    // Olhos meio fechados por cima e sobrancelha firme: confiante, não fofo.
    [-1, 1].forEach(l => {
      const ex = l * 0.36 * r, ey = 0.24 * r;
      ctx.fillStyle = '#fff';
      elipse(ctx, ex, ey, 0.16 * r, 0.11 * r);
      ctx.fill();
      ctx.fillStyle = C.olho;
      ctx.beginPath();
      ctx.arc(ex + 0.02 * r, ey + 0.01 * r, 0.085 * r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0f08';
      ctx.beginPath();
      ctx.arc(ex + 0.02 * r, ey + 0.01 * r, 0.045 * r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 0.05 * r, ey - 0.03 * r, 0.022 * r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = linha * 1.1;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 0.17 * r, 0.12 * r, 0, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.strokeStyle = C.cabeloEscuro;
      ctx.lineWidth = linha * 1.3;
      ctx.beginPath();
      ctx.moveTo(ex + l * 0.17 * r, ey - 0.16 * r);
      ctx.quadraticCurveTo(ex + l * 0.02 * r, ey - 0.27 * r, ex - l * 0.14 * r, ey - 0.19 * r);
      ctx.stroke();
      ctx.strokeStyle = C.contorno;
    });

    ctx.lineWidth = linha * 0.8;
    ctx.beginPath();
    ctx.arc(0, 0.44 * r, 0.07 * r, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.lineWidth = linha;
    if (expressao === 'feliz') {
      ctx.fillStyle = '#7a1f2b';
      ctx.beginPath();
      ctx.moveTo(-0.28 * r, 0.6 * r);
      ctx.quadraticCurveTo(0, 0.98 * r, 0.3 * r, 0.58 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-0.2 * r, 0.63 * r);
      ctx.lineTo(0.23 * r, 0.61 * r);
      ctx.lineTo(0.19 * r, 0.68 * r);
      ctx.lineTo(-0.16 * r, 0.7 * r);
      ctx.closePath();
      ctx.fill();
    } else if (expressao === 'ops') {
      ctx.fillStyle = '#7a1f2b';
      elipse(ctx, 0.02 * r, 0.7 * r, 0.09 * r, 0.11 * r);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-0.22 * r, 0.68 * r);
      ctx.quadraticCurveTo(0.02 * r, 0.76 * r, 0.26 * r, 0.6 * r);
      ctx.stroke();
    }

    // Franja por cima da testa
    ctx.fillStyle = C.cabelo;
    ctx.beginPath();
    ctx.moveTo(-1.06 * r, 0.2 * r);
    ctx.bezierCurveTo(-1.2 * r, -0.9 * r, -0.5 * r, -1.2 * r, 0.05 * r, -1.18 * r);
    ctx.bezierCurveTo(0.7 * r, -1.16 * r, 1.2 * r, -0.8 * r, 1.02 * r, 0.12 * r);
    for (let i = 1; i < FRANJA.length; i++) {
      const [px, py] = FRANJA[i - 1], [qx, qy] = FRANJA[i];
      ctx.quadraticCurveTo(((px + qx) / 2 + 0.06) * r, ((py + qy) / 2 - 0.1) * r, qx * r, qy * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = C.cabeloClaro;
    ctx.lineWidth = linha * 1.2;
    [[-0.72, -0.5, -0.25, -0.95, 0.3, -0.92], [-0.2, -0.3, 0.2, -0.78, 0.72, -0.72], [0.36, -0.28, 0.62, -0.62, 0.92, -0.42]]
      .forEach(([a, b, c, d, e, f]) => {
        ctx.beginPath();
        ctx.moveTo(a * r, b * r);
        ctx.quadraticCurveTo(c * r, d * r, e * r, f * r);
        ctx.stroke();
      });
    ctx.restore();
  }

  // Corredor visto de costas. (x, y) é o ponto no chão; h é a altura em px.
  // o = { capacete: cor do bot (sem ela, é o Benjaboy), cor, numero, rot, tonto }
  function corredor(ctx, x, y, h, fase, o) {
    const u = h / 100;
    const passo = Math.sin(fase);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    elipse(ctx, 0, 0, 22 * u, 6 * u);
    ctx.fill();
    ctx.translate(0, -Math.abs(passo) * 3 * u);
    if (o.rot) {
      ctx.translate(0, -45 * u);
      ctx.rotate(o.rot);
      ctx.translate(0, 45 * u);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.contorno;
    const linha = Math.max(1, 2.2 * u);
    ctx.lineWidth = linha;
    const cor = o.cor || C.camisa;

    [-1, 1].forEach(l => {
      const ergue = Math.max(0, l * passo) * 10 * u;
      const px = l * 8 * u;
      ctx.fillStyle = C.pele;
      caixa(ctx, px - 4 * u, -30 * u, 8 * u, 24 * u - ergue, 3 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.tenis;
      caixa(ctx, px - 6 * u, -9 * u - ergue, 12 * u, 9 * u, 3 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.sola;
      ctx.fillRect(px - 5 * u, -3.5 * u - ergue, 10 * u, 2.5 * u);
    });
    ctx.fillStyle = C.short;
    caixa(ctx, -15 * u, -40 * u, 30 * u, 14 * u, 4 * u);
    ctx.fill();
    ctx.stroke();

    // Braços balançam ao contrário das pernas.
    [-1, 1].forEach(l => {
      const sx = l * 16 * u, sy = -66 * u;
      const hx = sx + l * 4 * u, hy = sy + 24 * u - Math.max(0, -l * passo) * 9 * u;
      ctx.lineWidth = 9 * u;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.strokeStyle = cor;
      ctx.lineWidth = 5.5 * u;
      ctx.stroke();
      ctx.strokeStyle = C.contorno;
      ctx.lineWidth = linha;
      ctx.fillStyle = C.pele;
      ctx.beginPath();
      ctx.arc(hx, hy, 4.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = cor;
    caixa(ctx, -17 * u, -72 * u, 34 * u, 36 * u, 8 * u);
    ctx.fill();
    ctx.stroke();
    if (o.numero) {
      ctx.fillStyle = '#fff';
      ctx.font = fonte(17 * u);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.numero, 0, -53 * u);
    }

    cabecaDeCostas(ctx, u, -86, o);
    if (o.tonto) tontura(ctx, u, fase, -86);
    ctx.restore();
  }

  // Cabeça vista de costas: capacete do bot ou o cabelo do Benjaboy.
  // cy é o centro da cabeça, em unidades u.
  function cabecaDeCostas(ctx, u, cy, o) {
    const Y = v => (cy + v) * u;
    if (o.capacete) {
      ctx.fillStyle = o.capacete;
      ctx.beginPath();
      ctx.arc(0, Y(0), 16 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(-3 * u, Y(-18), 6 * u, 36 * u);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-20 * u, Y(10), 40 * u, 8 * u);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(0, Y(0), 16 * u, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = C.pele;
    [-1, 1].forEach(l => {
      elipse(ctx, l * 15 * u, Y(3), 4 * u, 6 * u);
      ctx.fill();
      ctx.stroke();
    });
    // Nuca coberta pelo cabelo bagunçado
    ctx.fillStyle = C.cabelo;
    ctx.beginPath();
    ctx.arc(0, Y(-1), 15.5 * u, Math.PI * 0.95, Math.PI * 2.05);
    [[14, 8], [9, 13], [5, 9], [0, 15], [-5, 9], [-9, 14], [-14, 8]].forEach(([px, py]) => ctx.lineTo(px * u, Y(py)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = C.cabeloClaro;
    ctx.lineWidth = 2.5 * u;
    ctx.beginPath();
    ctx.moveTo(-8 * u, Y(-11));
    ctx.quadraticCurveTo(-2 * u, Y(-4), -4 * u, Y(6));
    ctx.moveTo(6 * u, Y(-12));
    ctx.quadraticCurveTo(10 * u, Y(-4), 7 * u, Y(5));
    ctx.stroke();
  }

  function tontura(ctx, u, fase, cy) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5 * u;
    for (let i = 0; i < 3; i++) {
      const a = fase * 0.6 + i * 2.1;
      const sx = Math.cos(a) * 24 * u, sy = (cy - 10) * u + Math.sin(a) * 7 * u;
      ctx.beginPath();
      ctx.moveTo(sx - 4 * u, sy);
      ctx.lineTo(sx + 4 * u, sy);
      ctx.moveTo(sx, sy - 4 * u);
      ctx.lineTo(sx, sy + 4 * u);
      ctx.stroke();
    }
  }

  // Kart visto de trás. (x, y) é o chão; h é a altura em px (kart + piloto).
  // o = { capacete: cor do bot (sem ela, é o Benjaboy), numero, rot, tonto }
  function kart(ctx, x, y, h, fase, o) {
    const u = h / 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    elipse(ctx, 0, 0, 38 * u, 8 * u);
    ctx.fill();
    ctx.translate(0, -Math.abs(Math.sin(fase * 2)) * 1.5 * u);
    if (o.rot) {
      ctx.translate(0, -30 * u);
      ctx.rotate(o.rot);
      ctx.translate(0, 30 * u);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.contorno;
    const linha = Math.max(1, 2.2 * u);
    ctx.lineWidth = linha;
    const lataria = o.capacete || '#ffd23f';

    // Rodas da frente (mais longe, menores)
    ctx.fillStyle = '#1b1b24';
    [-1, 1].forEach(l => {
      caixa(ctx, l * 26 * u - 6 * u, -58 * u, 12 * u, 14 * u, 3 * u);
      ctx.fill();
      ctx.stroke();
    });
    // Assoalho em trapézio, da traseira larga para a frente estreita
    ctx.fillStyle = lataria;
    ctx.beginPath();
    ctx.moveTo(-30 * u, -8 * u);
    ctx.lineTo(-20 * u, -56 * u);
    ctx.lineTo(20 * u, -56 * u);
    ctx.lineTo(30 * u, -8 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Piloto: roupa, e a cabeça por cima
    ctx.fillStyle = o.capacete ? '#f1f1f1' : C.camisa;
    caixa(ctx, -14 * u, -64 * u, 28 * u, 30 * u, 8 * u);
    ctx.fill();
    ctx.stroke();
    // Motor atrás do banco e para-choque
    ctx.fillStyle = '#6b7280';
    caixa(ctx, -11 * u, -36 * u, 22 * u, 16 * u, 3 * u);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#26262f';
    caixa(ctx, -30 * u, -16 * u, 60 * u, 9 * u, 4 * u);
    ctx.fill();
    ctx.stroke();
    if (o.numero) {
      ctx.fillStyle = '#ffd23f';
      ctx.font = fonte(8 * u);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.numero, 0, -11.2 * u);
    }
    // Rodas de trás, com o sulco girando
    [-1, 1].forEach(l => {
      const rx = l * 33 * u;
      ctx.fillStyle = '#1b1b24';
      caixa(ctx, rx - 8 * u, -26 * u, 16 * u, 26 * u, 4 * u);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2 * u;
      for (let k = 0; k < 3; k++) {
        const sy = -24 * u + (((fase * 6 + k * 8) % 24) * u);
        ctx.beginPath();
        ctx.moveTo(rx - 6 * u, sy);
        ctx.lineTo(rx + 6 * u, sy);
        ctx.stroke();
      }
      ctx.strokeStyle = C.contorno;
      ctx.lineWidth = linha;
    });
    cabecaDeCostas(ctx, u, -74, o);
    if (o.tonto) tontura(ctx, u, fase, -74);
    ctx.restore();
  }

  // Caixas de resposta do kart, flutuando sobre cada pista.
  function caixas(ctx, x0, y, larg, rotulos, estados, t) {
    const L = larg / 3, lado = L * 0.62;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const est = estados[i];
      if (est === 'aberta' || rotulos[i] === null) continue;
      const cx = x0 + i * L + L / 2;
      const dx = est === 'errada' ? Math.sin(t * 60) * L * 0.03 : 0;
      const topo = y - lado * 1.25 + Math.sin(t * 4 + i) * L * 0.03;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      elipse(ctx, cx, y, lado * 0.45, lado * 0.12);
      ctx.fill();
      ctx.fillStyle = est === 'errada' ? C.errada : est === 'certa' ? C.certa : '#ff9f1c';
      ctx.strokeStyle = C.contorno;
      ctx.lineWidth = Math.max(1.5, L * 0.03);
      caixa(ctx, cx - lado / 2 + dx, topo, lado, lado, lado * 0.18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      caixa(ctx, cx - lado * 0.4 + dx, topo + lado * 0.08, lado * 0.8, lado * 0.2, lado * 0.1);
      ctx.fill();
      ctx.fillStyle = C.portaTexto;
      const tam = lado * 0.5;
      ctx.font = fonte(tam);
      const w = ctx.measureText(rotulos[i]).width;
      if (w > lado * 0.84) ctx.font = fonte(tam * lado * 0.84 / w);
      ctx.fillText(rotulos[i], cx + dx, topo + lado * 0.56);
    }
    ctx.restore();
  }

  // Bola de gosma voando para a frente, com rastro.
  function gosma(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = 'rgba(124, 252, 0, 0.35)';
    elipse(ctx, x, y + r * 1.6, r * 0.7, r * 1.4);
    ctx.fill();
    ctx.fillStyle = '#7cfc00';
    ctx.strokeStyle = '#1f5f00';
    ctx.lineWidth = Math.max(1.5, r * 0.15);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Portal com três portas. estados[i]: 'normal' | 'aberta' | 'errada' | 'certa'.
  // Rótulo null é parede listrada (pergunta de duas opções).
  function portal(ctx, x0, y, larg, rotulos, estados, t) {
    const L = larg / 3, H = L * 0.62;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, L * 0.03);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const est = estados[i];
      if (est === 'aberta') continue;
      const dx = est === 'errada' ? Math.sin(t * 60) * L * 0.03 : 0;
      const px = x0 + i * L + L * 0.07 + dx, pw = L * 0.86;
      if (rotulos[i] === null) {
        ctx.save();
        caixa(ctx, px, y - H, pw, H, L * 0.06);
        ctx.clip();
        ctx.fillStyle = '#fff';
        ctx.fillRect(px, y - H, pw, H);
        ctx.fillStyle = C.errada;
        for (let k = -H; k < pw + H; k += L * 0.22) {
          ctx.beginPath();
          ctx.moveTo(px + k, y);
          ctx.lineTo(px + k + L * 0.11, y);
          ctx.lineTo(px + k + L * 0.11 + H, y - H);
          ctx.lineTo(px + k + H, y - H);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        caixa(ctx, px, y - H, pw, H, L * 0.06);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = est === 'errada' ? C.errada : est === 'certa' ? C.certa : C.porta;
      caixa(ctx, px, y - H, pw, H, L * 0.06);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.portaTexto;
      const rotulo = rotulos[i];
      let tam = L * 0.36;
      ctx.font = fonte(tam);
      const w = ctx.measureText(rotulo).width;
      if (w > pw * 0.86) ctx.font = fonte(tam * pw * 0.86 / w);
      ctx.fillText(rotulo, px + pw / 2, y - H / 2 + L * 0.01);
    }
    ctx.fillStyle = C.poste;
    for (let i = 0; i <= 3; i++) {
      caixa(ctx, x0 + i * L - L * 0.05, y - H - L * 0.12, L * 0.1, H + L * 0.12, L * 0.03);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = C.viga;
    caixa(ctx, x0 - L * 0.1, y - H - L * 0.24, larg + L * 0.2, L * 0.15, L * 0.05);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Bloco de espuma. (x, y) é o centro da base.
  function bloco(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, w * 0.03);
    ctx.fillStyle = C.rosa;
    caixa(ctx, x - w / 2, y - h, w, h, w * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff8fb5';
    caixa(ctx, x - w / 2, y - h, w, h * 0.3, w * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * w * 0.28 - w * 0.05, y - h * 0.62, w * 0.1, h * 0.5);
    ctx.restore();
  }

  // Linha de chegada com a faixa da mensagem.
  function chegada(ctx, x0, y, larg, texto) {
    ctx.save();
    const n = 12, q = larg / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff';
        ctx.fillRect(x0 + i * q, y - (j + 1) * q * 0.7, q, q * 0.7);
      }
    }
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, larg * 0.008);
    const alto = larg * 0.5, fh = larg * 0.17;
    ctx.fillStyle = C.poste;
    [x0 - larg * 0.07, x0 + larg * 1.02].forEach(px => {
      caixa(ctx, px, y - alto, larg * 0.05, alto, larg * 0.015);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = C.rosa;
    caixa(ctx, x0 - larg * 0.09, y - alto - fh * 0.3, larg * 1.18, fh, fh * 0.25);
    ctx.fill();
    ctx.stroke();
    const cy = y - alto - fh * 0.3 + fh / 2;
    let tam = fh * 0.46;
    ctx.font = fonte(tam);
    const maximo = larg * 0.95;
    const w = ctx.measureText(texto).width + tam * 1.3;
    if (w > maximo) {
      tam *= maximo / w;
      ctx.font = fonte(tam);
    }
    const total = ctx.measureText(texto).width + tam * 1.3;
    const inicio = x0 + larg / 2 - total / 2;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, inicio, cy + tam * 0.04);
    coracao(ctx, inicio + total - tam * 0.45, cy, tam * 0.9);
    ctx.restore();
  }

  return { C, FONTE, fonte, caixa, elipse, coracao, retrato, corredor, kart, caixas, gosma, portal, bloco, chegada };
})();
