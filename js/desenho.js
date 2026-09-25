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

  // f > 0 clareia a cor, f < 0 escurece.
  function ajustarCor(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const canal = s => {
      const v = (n >> s) & 255;
      return Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f));
    };
    return 'rgb(' + canal(16) + ',' + canal(8) + ',' + canal(0) + ')';
  }

  const CORES_BENJA = {
    pele: C.pele, sombra: C.peleSombra, camisa: C.camisa, gola: C.camisaClara,
    cabelo: C.cabelo, escuro: C.cabeloEscuro, claro: C.cabeloClaro,
  };

  function coresDe(ap) {
    if (!ap) return CORES_BENJA;
    return {
      pele: ap.pele, sombra: ajustarCor(ap.pele, -0.12), camisa: ap.camisa, gola: ajustarCor(ap.camisa, 0.25),
      cabelo: ap.cabelo, escuro: ajustarCor(ap.cabelo, -0.3), claro: ajustarCor(ap.cabelo, 0.25),
    };
  }

  // Cabelo atrás da cabeça, de acordo com o penteado.
  function cabeloAtras(ctx, r, estilo, cor) {
    ctx.fillStyle = cor.escuro;
    if (estilo === 'cacheado') {
      for (let a = 150; a <= 390; a += 20) {
        const rad = a * Math.PI / 180;
        ctx.beginPath();
        ctx.arc(Math.cos(rad) * r, -0.1 * r + Math.sin(rad) * r, 0.3 * r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      return;
    }
    const forma = { franja: [-0.1, 1.14, 1.08], curto: [-0.12, 1.0, 1.0], bone: [-0.05, 1.0, 0.95], topete: [-0.12, 1.05, 1.02], liso: [0.05, 1.12, 1.18] }[estilo];
    elipse(ctx, 0, forma[0] * r, forma[1] * r, forma[2] * r);
    ctx.fill();
    ctx.stroke();
  }

  // Cabelo (ou boné) por cima da testa, para os amigos da Meia-Noite.
  function cabeloFrente(ctx, r, estilo, cor, ap) {
    ctx.fillStyle = cor.cabelo;
    const touca = hairline => {
      ctx.beginPath();
      ctx.moveTo(-0.95 * r, -0.05 * r);
      ctx.bezierCurveTo(-1.0 * r, -0.95 * r, -0.45 * r, -1.14 * r, 0, -1.14 * r);
      ctx.bezierCurveTo(0.45 * r, -1.14 * r, 1.0 * r, -0.95 * r, 0.95 * r, -0.05 * r);
      ctx.lineTo(0.85 * r, hairline * r);
      ctx.quadraticCurveTo(0, (hairline - 0.18) * r, -0.85 * r, hairline * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    if (estilo === 'curto') touca(-0.38);
    else if (estilo === 'cacheado') {
      touca(-0.42);
      for (let x = -0.72; x <= 0.73; x += 0.36) {
        ctx.beginPath();
        ctx.arc(x * r, (-0.92 + Math.abs(x) * 0.35) * r, 0.26 * r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (estilo === 'topete') {
      touca(-0.34);
      ctx.beginPath();
      ctx.moveTo(-0.5 * r, -0.62 * r);
      ctx.bezierCurveTo(-0.45 * r, -1.55 * r, 0.65 * r, -1.55 * r, 0.72 * r, -0.72 * r);
      ctx.quadraticCurveTo(0.2 * r, -0.95 * r, -0.5 * r, -0.62 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (estilo === 'liso') {
      ctx.beginPath();
      ctx.moveTo(-1.0 * r, 0.3 * r);
      ctx.bezierCurveTo(-1.15 * r, -1.0 * r, 0.9 * r, -1.25 * r, 1.0 * r, 0.3 * r);
      ctx.lineTo(0.9 * r, -0.08 * r);
      ctx.quadraticCurveTo(0.3 * r, -0.52 * r, -0.62 * r, -0.2 * r);
      ctx.quadraticCurveTo(-0.82 * r, 0.02 * r, -1.0 * r, 0.3 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (estilo === 'bone') {
      ctx.fillStyle = ap.bone;
      ctx.beginPath();
      ctx.moveTo(-1.0 * r, -0.3 * r);
      ctx.bezierCurveTo(-1.0 * r, -1.3 * r, 1.0 * r, -1.3 * r, 1.0 * r, -0.3 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ajustarCor(ap.bone, -0.25);
      elipse(ctx, 0.1 * r, -0.3 * r, 1.12 * r, 0.2 * r);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      caixa(ctx, -0.22 * r, -0.95 * r, 0.44 * r, 0.3 * r, 0.08 * r);
      ctx.fill();
    }
  }

  // Rosto de frente, do peito para cima. (cx, cy) é o centro da cabeça. Sem
  // `ap` é o Benjaboy; com `ap` ({ estilo, pele, cabelo, camisa, bone }) é um
  // amigo da turma.
  function retrato(ctx, cx, cy, r, expressao, ap) {
    const cor = coresDe(ap), estilo = ap ? ap.estilo : 'franja';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.contorno;
    const linha = Math.max(1.5, r * 0.05);
    ctx.lineWidth = linha;

    ctx.fillStyle = cor.sombra;
    caixa(ctx, -0.3 * r, 0.7 * r, 0.6 * r, 0.5 * r, 0.1 * r);
    ctx.fill();

    // Moletom e gola
    ctx.fillStyle = cor.camisa;
    ctx.beginPath();
    ctx.moveTo(-1.45 * r, 2.5 * r);
    ctx.bezierCurveTo(-1.4 * r, 1.3 * r, -0.75 * r, 1.04 * r, 0, 1.04 * r);
    ctx.bezierCurveTo(0.75 * r, 1.04 * r, 1.4 * r, 1.3 * r, 1.45 * r, 2.5 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = cor.gola;
    ctx.beginPath();
    ctx.moveTo(-0.52 * r, 1.08 * r);
    ctx.quadraticCurveTo(0, 1.55 * r, 0.52 * r, 1.08 * r);
    ctx.lineTo(0.34 * r, 1.02 * r);
    ctx.quadraticCurveTo(0, 1.32 * r, -0.34 * r, 1.02 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Volume do cabelo atrás da cabeça
    cabeloAtras(ctx, r, estilo, cor);

    ctx.fillStyle = cor.pele;
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
      ctx.strokeStyle = cor.escuro;
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

    if (estilo !== 'franja') {
      cabeloFrente(ctx, r, estilo, cor, ap);
      ctx.restore();
      return;
    }

    // Franja por cima da testa
    ctx.fillStyle = cor.cabelo;
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
    ctx.strokeStyle = cor.claro;
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

  // Cores do portal em cada cenário.
  const PALETAS = {
    arena: { poste: '#5b2bd9', viga: '#7c4dff', porta: '#ffd23f' },
    neve: { poste: '#1d4ed8', viga: '#60a5fa', porta: '#dbeafe' },
  };

  // Portal com três portas. estados[i]: 'normal' | 'aberta' | 'errada' | 'certa'.
  // Rótulo null é parede listrada (pergunta de duas opções).
  function portal(ctx, x0, y, larg, rotulos, estados, t, paleta) {
    paleta = paleta || PALETAS.arena;
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
      ctx.fillStyle = est === 'errada' ? C.errada : est === 'certa' ? C.certa : paleta.porta;
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
    ctx.fillStyle = paleta.poste;
    for (let i = 0; i <= 3; i++) {
      caixa(ctx, x0 + i * L - L * 0.05, y - H - L * 0.12, L * 0.1, H + L * 0.12, L * 0.03);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = paleta.viga;
    caixa(ctx, x0 - L * 0.1, y - H - L * 0.24, larg + L * 0.2, L * 0.15, L * 0.05);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Snowboarder visto de trás, balançando na prancha. (x, y) é o chão.
  function snowboard(ctx, x, y, h, fase, o) {
    const u = h / 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    [-1, 1].forEach(l => {
      elipse(ctx, l * 24 * u, 5 * u, 10 * u, 4 * u);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(30, 64, 175, 0.18)';
    elipse(ctx, 0, 0, 34 * u, 7 * u);
    ctx.fill();
    if (o.rot) {
      ctx.translate(0, -40 * u);
      ctx.rotate(o.rot);
      ctx.translate(0, 40 * u);
    }
    ctx.rotate(Math.sin(fase * 0.35) * 0.12);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const linha = Math.max(1, 2.2 * u);
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = linha;

    ctx.fillStyle = o.capacete ? '#f1f1f1' : '#ffd23f';
    caixa(ctx, -32 * u, -8 * u, 64 * u, 9 * u, 4.5 * u);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = o.capacete || '#ff3d7f';
    ctx.fillRect(-20 * u, -5.5 * u, 40 * u, 3 * u);

    // Pernas flexionadas e botas
    [-1, 1].forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l * 6 * u, -38 * u);
      ctx.lineTo(l * 15 * u, -24 * u);
      ctx.lineTo(l * 12 * u, -10 * u);
      ctx.lineWidth = 10 * u;
      ctx.strokeStyle = C.contorno;
      ctx.stroke();
      ctx.lineWidth = 7 * u;
      ctx.strokeStyle = '#1f2937';
      ctx.stroke();
      ctx.lineWidth = linha;
      ctx.strokeStyle = C.contorno;
      ctx.fillStyle = '#374151';
      caixa(ctx, l * 12 * u - 6 * u, -13 * u, 12 * u, 6 * u, 2 * u);
      ctx.fill();
      ctx.stroke();
    });

    // Braços abertos para equilibrar
    const jaqueta = o.capacete ? o.cor : C.camisa;
    [-1, 1].forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l * 14 * u, -62 * u);
      ctx.lineTo(l * 34 * u, -52 * u);
      ctx.lineWidth = 9 * u;
      ctx.strokeStyle = C.contorno;
      ctx.stroke();
      ctx.lineWidth = 6 * u;
      ctx.strokeStyle = jaqueta;
      ctx.stroke();
      ctx.lineWidth = linha;
      ctx.strokeStyle = C.contorno;
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(l * 35 * u, -52 * u, 4.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = jaqueta;
    caixa(ctx, -16 * u, -70 * u, 32 * u, 34 * u, 8 * u);
    ctx.fill();
    ctx.stroke();
    if (o.numero) {
      ctx.fillStyle = '#fff';
      ctx.font = fonte(15 * u);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.numero, 0, -52 * u);
    }
    cabecaDeCostas(ctx, u, -82, o);
    if (o.tonto) tontura(ctx, u, fase, -82);
    ctx.restore();
  }

  // Pinheiro com neve na ponta. (x, y) é a base do tronco; s é a altura.
  function pinheiro(ctx, x, y, s) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.2, s * 0.02);
    ctx.fillStyle = 'rgba(30, 64, 175, 0.15)';
    elipse(ctx, x, y, s * 0.3, s * 0.07);
    ctx.fill();
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x - s * 0.05, y - s * 0.16, s * 0.1, s * 0.16);
    ctx.strokeRect(x - s * 0.05, y - s * 0.16, s * 0.1, s * 0.16);
    [[0.14, 0.34, 0.4], [0.38, 0.27, 0.36], [0.6, 0.2, 0.36]].forEach(([base, meia, alt]) => {
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(x - meia * s, y - base * s);
      ctx.lineTo(x + meia * s, y - base * s);
      ctx.lineTo(x, y - (base + alt) * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.08, y - s * 0.84);
    ctx.lineTo(x + s * 0.08, y - s * 0.84);
    ctx.lineTo(x, y - s * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Bola de neve rolando. (x, y) é o chão; giro mostra a rolagem.
  function bolaDeNeve(ctx, x, y, r, giro) {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 64, 175, 0.18)';
    elipse(ctx, x, y, r * 0.9, r * 0.22);
    ctx.fill();
    const cy = y - r;
    const g = ctx.createRadialGradient(x - r * 0.35, cy - r * 0.35, r * 0.1, x, cy, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = g;
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.7)';
    ctx.lineWidth = Math.max(1, r * 0.05);
    for (let i = 0; i < 3; i++) {
      const a = giro + i * 2.1;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Rolo listrado que gira e desliza cobrindo duas pistas (arena).
  function rolo(ctx, cx, y, w, h, fase) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    elipse(ctx, cx, y, w * 0.5, h * 0.25);
    ctx.fill();
    const x = cx - w / 2, topo = y - h;
    caixa(ctx, x, topo, w, h, h / 2);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ff3d7f';
    ctx.fillRect(x, topo, w, h);
    ctx.fillStyle = '#ffd23f';
    const passo = h * 1.2, desloca = ((fase * h * 2) % passo + passo) % passo;
    for (let k = -h - passo + desloca; k < w + h; k += passo) {
      ctx.beginPath();
      ctx.moveTo(x + k, topo + h);
      ctx.lineTo(x + k + passo / 2, topo + h);
      ctx.lineTo(x + k + passo / 2 + h, topo);
      ctx.lineTo(x + k + h, topo);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x, topo + h * 0.12, w, h * 0.18);
    ctx.restore();
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, h * 0.08);
    caixa(ctx, x, topo, w, h, h / 2);
    ctx.stroke();
    ctx.restore();
  }

  // Tambor vermelho deslizando (kart).
  function tambor(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    elipse(ctx, x, y, w * 0.55, w * 0.14);
    ctx.fill();
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, w * 0.04);
    ctx.fillStyle = '#dc2626';
    caixa(ctx, x - w / 2, y - h, w, h, w * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7f1d1d';
    [0.3, 0.7].forEach(f => ctx.fillRect(x - w / 2, y - h * f - h * 0.05, w, h * 0.1));
    ctx.fillStyle = '#fca5a5';
    elipse(ctx, x, y - h, w * 0.5, w * 0.14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Barreira de pneus empilhados (kart).
  function pneus(ctx, x, y, w) {
    ctx.save();
    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = Math.max(1.5, w * 0.03);
    const h = w * 0.26;
    for (let i = 0; i < 3; i++) {
      const topo = y - (i + 1) * h;
      ctx.fillStyle = '#1f2937';
      caixa(ctx, x - w / 2, topo, w, h, h * 0.45);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = i === 1 ? '#ffffff' : '#4b5563';
      caixa(ctx, x - w * 0.34, topo + h * 0.3, w * 0.68, h * 0.4, h * 0.2);
      ctx.fill();
    }
    ctx.restore();
  }

  // O Fedorento, monstro da Meia-Noite: bobalhão, não assustador. (x, y) é o
  // centro do corpo; s é a escala; boca vai de 0 (fechada, sorrisão) a 1
  // (escancarada); mastiga amassa o corpo; medo (0 ou 1) é a cara de susto
  // quando a Melifulina late; tempo mexe as linhas de fedor.
  function monstro(ctx, x, y, s, boca, mastiga, medo, tempo) {
    const roxo = '#6d28d9';
    tempo = tempo || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 + mastiga * 0.05, 1 - mastiga * 0.05);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Linhas de fedor, verdes e onduladas, subindo da cabeça
    ctx.strokeStyle = 'rgba(132, 204, 22, 0.8)';
    ctx.lineWidth = 3 * s;
    [-28, 0, 28].forEach((dx, k) => {
      const onda = Math.sin(tempo * 4 + k * 2) * 6 * s;
      ctx.beginPath();
      ctx.moveTo(dx * s, -92 * s);
      ctx.quadraticCurveTo(dx * s + 10 * s + onda, -106 * s, dx * s, -118 * s);
      ctx.quadraticCurveTo(dx * s - 10 * s - onda, -130 * s, dx * s, -142 * s);
      ctx.stroke();
    });

    ctx.strokeStyle = C.contorno;
    ctx.lineWidth = 3 * s;
    // Orelhas de morcego, pontudas, com o miolo rosado
    [-1, 1].forEach(l => {
      ctx.fillStyle = roxo;
      ctx.beginPath();
      ctx.moveTo(l * 22 * s, -66 * s);
      ctx.quadraticCurveTo(l * 50 * s, -96 * s, l * 76 * s, -118 * s);
      ctx.quadraticCurveTo(l * 80 * s, -78 * s, l * 72 * s, -38 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(l * 36 * s, -64 * s);
      ctx.quadraticCurveTo(l * 54 * s, -86 * s, l * 68 * s, -100 * s);
      ctx.quadraticCurveTo(l * 70 * s, -74 * s, l * 64 * s, -50 * s);
      ctx.closePath();
      ctx.fill();
    });

    // Corpo de gosma com a barra ondulada
    ctx.fillStyle = roxo;
    ctx.beginPath();
    ctx.moveTo(-80 * s, 50 * s);
    ctx.bezierCurveTo(-96 * s, -40 * s, -50 * s, -76 * s, 0, -76 * s);
    ctx.bezierCurveTo(50 * s, -76 * s, 96 * s, -40 * s, 80 * s, 50 * s);
    [40, 0, -40, -80].forEach((bx, i) => ctx.quadraticCurveTo((bx + 20) * s, (i % 2 ? 70 : 72) * s, bx * s, (i === 3 ? 50 : 52) * s));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(167, 139, 250, 0.35)';
    elipse(ctx, 0, 22 * s, 50 * s, 30 * s);
    ctx.fill();

    // Olhos de malandro, um maior que o outro, com a pálpebra meio baixa.
    // Com medo, arregalados e com a pupila pequenininha.
    [[-26, -32, 16], [24, -36, 21]].forEach(([ex, ey, r]) => {
      ex *= s; ey *= s; r *= s;
      ctx.fillStyle = '#ffffff';
      elipse(ctx, ex, ey, r, r);
      ctx.fill();
      if (medo) {
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex, ey, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        elipse(ctx, ex, ey, r, r);
        ctx.stroke();
        return;
      }
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ex + r * 0.1, ey + r * 0.22, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(ex + r * 0.12, ey + r * 0.26, r * 0.27, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      elipse(ctx, ex, ey, r, r);
      ctx.clip();
      ctx.fillStyle = roxo;
      ctx.fillRect(ex - r, ey - r, 2 * r, r * 0.75);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(ex - r, ey - r * 0.25);
      ctx.lineTo(ex + r, ey - r * 0.25);
      ctx.stroke();
      elipse(ctx, ex, ey, r, r);
      ctx.stroke();
    });

    if (medo) {
      // Boquinha de "ó!" e uma gota de suor
      ctx.fillStyle = '#4c0519';
      elipse(ctx, 0, 16 * s, 10 * s, 13 * s);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(62 * s, -20 * s);
      ctx.quadraticCurveTo(70 * s, -4 * s, 62 * s, 2 * s);
      ctx.quadraticCurveTo(54 * s, -4 * s, 62 * s, -20 * s);
      ctx.fill();
    } else if (boca > 0.05) {
      // Bocona aberta, com língua e dentes arredondados
      const rx = 44 * s, ry = (6 + boca * 26) * s, by = 12 * s;
      ctx.fillStyle = '#4c0519';
      elipse(ctx, 0, by, rx, ry);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fb7185';
      elipse(ctx, 0, by + ry * 0.55, rx * 0.5, ry * 0.35);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      [-22, 0, 22].forEach(dx => {
        caixa(ctx, dx * s - 6 * s, by - ry + 1 * s, 12 * s, 10 * s * Math.min(1, boca * 2), 3 * s);
        ctx.fill();
      });
    } else {
      // Sorrisão fechado com dois dentões
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(-40 * s, 8 * s);
      ctx.quadraticCurveTo(0, 36 * s, 40 * s, 8 * s);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2 * s;
      [-13, 3].forEach(dx => {
        caixa(ctx, dx * s, 19 * s, 11 * s, 12 * s, 3 * s);
        ctx.fill();
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  // Melifulina, a cadelinha maltês branca que espanta o Fedorento. (x, y) é
  // o chão entre as patinhas; latindo abre a boca; tempo abana o rabo.
  function melifulina(ctx, x, y, s, latindo, tempo) {
    tempo = tempo || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Pelo de nuvem: primeiro o contorno cinza de todas as bolinhas, depois o
    // branco por cima, para ficar um contorno só em volta do bicho.
    const rabo = [34 + Math.sin(tempo * 14) * 4, -34, 11];
    const corpo = [[-18, -18, 17], [0, -14, 19], [18, -18, 17], [-8, -30, 15], [12, -30, 15], rabo];
    const cabeca = [[0, -58, 21], [-14, -52, 14], [14, -52, 14], [0, -74, 13]];
    const bolinhas = corpo.concat(cabeca);
    ctx.fillStyle = '#cbd5e1';
    bolinhas.forEach(([bx, by, r]) => { ctx.beginPath(); ctx.arc(bx * s, by * s, (r + 2) * s, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff';
    bolinhas.forEach(([bx, by, r]) => { ctx.beginPath(); ctx.arc(bx * s, by * s, r * s, 0, Math.PI * 2); ctx.fill(); });
    // Patinhas
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5 * s;
    [-16, -5, 6, 17].forEach(px => { elipse(ctx, px * s, -2 * s, 5 * s, 4 * s); ctx.fill(); ctx.stroke(); });
    // Orelhas compridas e caídas, cor de creme
    ctx.fillStyle = '#f5ede0';
    [-1, 1].forEach(l => {
      ctx.save();
      ctx.translate(l * 20 * s, -52 * s);
      ctx.rotate(l * 0.18);
      elipse(ctx, 0, 0, 8 * s, 17 * s);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    // Olhinhos pretos com brilho, focinho e boca
    [-8, 8].forEach(ox => {
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(ox * s, -60 * s, 3.4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ox * s + 1.1 * s, -61.2 * s, 1.1 * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#111827';
    elipse(ctx, 0, -51 * s, 4.2 * s, 3.2 * s);
    ctx.fill();
    if (latindo) {
      ctx.fillStyle = '#9f1239';
      elipse(ctx, 0, -43 * s, 5 * s, 5 * s);
      ctx.fill();
      ctx.fillStyle = '#fb7185';
      elipse(ctx, 0, -40.5 * s, 3 * s, 2.2 * s);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-4 * s, -46 * s);
      ctx.quadraticCurveTo(0, -43 * s, 4 * s, -46 * s);
      ctx.stroke();
    }
    // Lacinho rosa no topete
    ctx.fillStyle = '#ec4899';
    [-1, 1].forEach(l => {
      ctx.beginPath();
      ctx.moveTo(0, -82 * s);
      ctx.lineTo(l * 11 * s, -88 * s);
      ctx.lineTo(l * 11 * s, -76 * s);
      ctx.closePath();
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(0, -82 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
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

  return {
    C, FONTE, PALETAS, fonte, caixa, elipse, coracao, retrato, corredor, kart, snowboard, caixas, gosma,
    portal, bloco, rolo, pinheiro, bolaDeNeve, tambor, pneus, chegada, monstro, melifulina,
  };
})();
