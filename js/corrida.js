// A corrida: pista de três pistas, portas com respostas, obstáculos e bots.
// Unidades do mundo: a pista tem 300 de largura; "y" cresce para a frente.
BB.corrida = (function () {
  const U = BB.util, S = BB.som, M = BB.musica, K = BB.conteudo;

  const LARG = 300, FAIXA = 100;
  const ESPACO = 1400;         // distância entre portas
  const PRIMEIRA = 900;        // posição da primeira porta
  const VEL_INI = 220, VEL_FIM = 290;
  const TEMPO_ERRO = 1.1, TEMPO_BATIDA = 0.7;
  const MUNICAO = 3, VEL_TIRO = 760, TEMPO_GOSMA = 1.2;   // fase do kart
  const TEMAS = { mat: 'arena', port: 'neve', kart: 'kart' };
  const BOTS = [
    { nome: 'TURBO', cor: '#e63946' }, { nome: 'NITRO', cor: '#f77f00' },
    { nome: 'FAÍSCA', cor: '#2a9d8f' }, { nome: 'TROVÃO', cor: '#8338ec' },
    { nome: 'BLITZ', cor: '#118ab2' },
  ];

  let c = null;   // estado da corrida atual

  function centroFaixa(i) { return i * FAIXA + FAIXA / 2; }
  function faixaDe(x) { return U.limitar(Math.floor(x / FAIXA), 0, 2); }

  function novoCorredor(x, y, extra) {
    return Object.assign({ x, y, alvoX: x, vel: 0, tonto: 0, girar: 0, boost: 0, turbo: 1.28,
      fase: Math.random() * 6, chegou: null, portaAtual: 0, obstAtual: 0 }, extra);
  }

  // Obstáculos entre as portas: um no começo, dois no fim, cada vez mais
  // difíceis. A barra (rolo de duas pistas) só existe na arena.
  function gerarObstaculos(tema) {
    const lista = [];
    for (let i = 0; i < K.PORTAS - 1; i++) {
      const base = PRIMEIRA + i * ESPACO;
      const posicoes = i < 3 ? [600] : i < 7 && i % 2 === 0 ? [600] : [420, 880];
      posicoes.forEach((d, n) => {
        const tipos = tema === 'arena' && i >= 3 ? ['bloco', 'muro', 'barra'] : ['bloco', 'muro'];
        const tipo = tipos[(i + n) % tipos.length];
        const o = { tipo, y: base + d, fase: Math.random() * 6 };
        if (tipo === 'bloco') o.vel = 1.3 + i * 0.07;
        if (tipo === 'barra') o.vel = 0.9 + i * 0.05;
        if (tipo === 'muro') {
          const livres = i >= 5 ? [U.inteiro(0, 2)] : U.embaralhar([0, 1, 2]).slice(0, 2);
          o.faixas = [0, 1, 2].filter(f => !livres.includes(f));
        }
        lista.push(o);
      });
    }
    return lista;
  }

  function iniciar(fase, mensagem) {
    const perguntas = K.montarCorrida(fase);
    const portas = perguntas.map((q, i) => ({ y: PRIMEIRA + i * ESPACO, estados: ['normal', 'normal', 'normal'] }));
    const tema = TEMAS[fase];
    // Ele larga em último, atrás do pelotão: a graça é ultrapassar.
    const jogador = novoCorredor(centroFaixa(1), -220, { jogador: true, gosma: fase === 'kart' ? 1 : 0 });
    const lugares = U.embaralhar([180, 80, -60, -150, -240]);
    const bots = BOTS.map((b, i) => novoCorredor(centroFaixa([0, 1, 2, 0, 2][i]), i < 3 ? 0 : -110,
      { nome: b.nome, cor: b.cor, habilidade: U.aleatorio(0.62, 0.82), ritmo: U.aleatorio(0.9, 0.97), lugar: lugares[i] }));
    c = {
      fase, tema, mensagem, perguntas, portas, obstaculos: gerarObstaculos(tema), jogador, bots,
      kart: fase === 'kart', tiros: [],
      chegadaY: PRIMEIRA + (K.PORTAS - 1) * ESPACO + 1000,
      estado: 'contagem', relogio: 0, contagem: 3.4, cameraY: -400,
      acertos: 0, erros: [], avisos: [], particulas: [], chegados: 0, posicaoFinal: 0,
      combo: 0, maxCombo: 0, posVista: 6, ultimaUltrapassagem: -9, destaquePos: 0, tremor: 0,
    };
    return c;
  }

  // ---------- Entrada ----------
  function mover(direcao) {
    if (!c || c.estado !== 'correndo') return;
    const j = c.jogador;
    if (j.chegou !== null || j.tonto > 0) return;
    const nova = U.limitar(faixaDe(j.alvoX) + direcao, 0, 2);
    if (centroFaixa(nova) !== j.alvoX) {
      j.alvoX = centroFaixa(nova);
      S.tocar('pista');
    }
  }

  // Kart: a gosma sai reto na pista dele e acerta o primeiro rival ou
  // obstáculo que aparecer pela frente.
  function atirar() {
    if (!c || !c.kart || c.estado !== 'correndo') return false;
    const j = c.jogador;
    if (j.gosma <= 0 || j.tonto > 0 || j.chegou !== null) return false;
    j.gosma--;
    c.tiros.push({ x: centroFaixa(faixaDe(j.alvoX)), y: j.y + 40, t: 1.3 });
    S.tocar('tiro');
    return true;
  }

  // ---------- Simulação ----------
  function velocidadeBase(r) {
    const progresso = U.limitar(r.y / c.chegadaY, 0, 1);
    return VEL_INI + (VEL_FIM - VEL_INI) * progresso;
  }

  // Pelotão: cada rival tem um lugar preferido em volta do Benjaboy (dois logo
  // à frente, para ele sempre ter quem caçar, e três na cola). Quem fica para
  // trás desse lugar vem buscar; quem passa demais espera. Nas duas últimas
  // portas ninguém espera e quem vem de trás só acelera um pouco: continua
  // disputado, mas ganha quem acertou mais.
  function elastico(r) {
    const retaFinal = c.jogador.portaAtual >= K.PORTAS - 2;
    const dif = r.y - (c.jogador.y + r.lugar);
    if (dif < -60) return 1 + Math.min(retaFinal ? 0.25 : 0.8, (-dif - 60) / 250);
    if (dif > 200 && !retaFinal) return 1 - Math.min(0.4, (dif - 200) / 400);
    return 1;
  }

  function tropecar(r, tempo, recuo) {
    r.tonto = tempo;
    r.vel = 0;
    r.boost = 0;
    r.y -= recuo || 40;
    if (r.jogador) c.tremor = 0.3;
  }

  function blocoX(o) { return LARG / 2 + Math.sin(o.fase) * (LARG / 2 - FAIXA / 2); }
  function barraX(o) { return LARG / 2 + Math.sin(o.fase) * FAIXA / 2; }

  // Para onde o corredor escapa depois de bater: a pista livre do muro, o lado
  // oposto ao da barra, ou a pista mais longe do bloco.
  function fugaDe(o) {
    if (o.tipo === 'muro') return [0, 1, 2].find(f => !o.faixas.includes(f));
    if (o.tipo === 'barra') return barraX(o) < LARG / 2 ? 2 : 0;
    const b = faixaDe(blocoX(o));
    if (b === 0) return 2;
    if (b === 2) return 0;
    return Math.random() < 0.5 ? 0 : 2;
  }

  function bateu(o, x) {
    if (o.destruido) return false;
    if (o.tipo === 'bloco') return Math.abs(x - blocoX(o)) < FAIXA * 0.75;
    if (o.tipo === 'barra') return Math.abs(x - barraX(o)) < FAIXA;
    return o.faixas.includes(faixaDe(x));
  }

  function passarPorta(r, k) {
    const porta = c.portas[k], q = c.perguntas[k];
    const faixa = faixaDe(r.x);
    const rotulo = q.portas[faixa];
    let acertou;
    if (r.jogador) {
      acertou = rotulo === q.certo;
      K.registrar(q, acertou);
      if (acertou) {
        c.acertos++;
        c.combo++;
        c.maxCombo = Math.max(c.maxCombo, c.combo);
        porta.estados[faixa] = 'aberta';
        // Acertos seguidos: turbo mais forte e mais longo.
        r.boost = Math.min(2.4, 1.1 + 0.3 * c.combo);
        r.turbo = Math.min(1.5, 1.22 + 0.06 * c.combo);
        if (c.kart) r.gosma = Math.min(MUNICAO, r.gosma + 1);
        estilhacos(r.x, porta.y);
        if (c.combo >= 2) aviso('COMBO x' + c.combo + '!', '#ffd23f', 1.2);
        else aviso('BOA!', '#3ddc84', 1.1);
        S.tocar(c.combo >= 2 ? 'combo' : 'acerto');
      } else {
        c.combo = 0;
        porta.estados[faixa] = 'errada';
        const certa = q.portas.indexOf(q.certo);
        porta.estados[certa] = 'certa';
        c.erros.push(q);
        // Depois do tombo ele atravessa a porta certa: o acerto fica na memória.
        r.alvoX = centroFaixa(certa);
        tropecar(r, TEMPO_ERRO, 60);
        aviso(q.resposta, '#ff4d4d', q.titulo ? 3 : 2.2, true, q.titulo);
        S.tocar('erro');
        K.agendarRepeticao(c.perguntas, k);
      }
    } else {
      acertou = Math.random() < r.habilidade;
      if (acertou) r.boost = 1.2; else tropecar(r, TEMPO_ERRO);
    }
  }

  function atualizarCorredor(r, dt) {
    r.fase += dt * (r.vel / 22);
    // Na neve a prancha faz a curva mais macia.
    const curva = r.tonto > 0 ? 4 : c.tema === 'neve' ? 8 : 12;
    r.x += (r.alvoX - r.x) * Math.min(1, dt * curva);
    if (r.tonto > 0) {
      r.tonto -= dt;
      r.girar += dt * 9;
      if (r.tonto <= 0) { r.tonto = 0; r.girar = 0; }
      return;
    }
    if (r.chegou !== null && r.jogador) {
      r.vel = Math.max(0, r.vel - 260 * dt);   // freia depois da chegada
    } else {
      let alvo = velocidadeBase(r) * (r.ritmo || 1) * (r.boost > 0 ? r.turbo : 1);
      if (!r.jogador) alvo *= elastico(r);
      r.vel += (alvo - r.vel) * Math.min(1, dt * 2.5);
    }
    r.boost = Math.max(0, r.boost - dt);

    const antes = r.y;
    r.y += r.vel * dt;

    if (!r.jogador && r.chegou === null) planejarBot(r, dt);

    while (r.portaAtual < K.PORTAS && antes < c.portas[r.portaAtual].y && r.y >= c.portas[r.portaAtual].y) {
      passarPorta(r, r.portaAtual);
      r.portaAtual++;
      if (r.tonto > 0) return;
    }
    while (r.obstAtual < c.obstaculos.length && r.y >= c.obstaculos[r.obstAtual].y) {
      const o = c.obstaculos[r.obstAtual];
      r.obstAtual++;
      if (antes < o.y && bateu(o, r.x)) {
        r.alvoX = centroFaixa(fugaDe(o));
        tropecar(r, TEMPO_BATIDA);
        if (r.jogador) { aviso('OPS!', '#ffd23f', 0.8); S.tocar('batida'); }
        return;
      }
    }
    if (r.chegou === null && r.y >= c.chegadaY) {
      r.chegou = c.relogio;
      c.chegados++;
      if (r.jogador) {
        c.posicaoFinal = c.chegados;
        c.estado = 'chegou';
        c.fimEm = 2.6;
        confete();
        M.parar();
        S.tocar('chegada');
      }
    }
  }

  // Bots desviam do obstáculo com a chance da habilidade; fora disso, trocam
  // de pista de vez em quando.
  function planejarBot(r, dt) {
    const o = c.obstaculos[r.obstAtual];
    if (o && o.y - r.y < 300) {
      if (r.planejou !== r.obstAtual) {
        r.planejou = r.obstAtual;
        if (!o.destruido && Math.random() < r.habilidade) r.alvoX = centroFaixa(fugaDe(o));
      }
      return;
    }
    // Com gosma no ar ninguém troca de pista à toa: mirou certo, acerta.
    if (c.tiros.length) return;
    if (Math.random() < dt * 0.35) r.alvoX = centroFaixa(U.inteiro(0, 2));
  }

  function atualizar(dt) {
    if (!c) return;
    dt = Math.min(dt, 0.05);
    c.relogio += dt;
    if (c.estado === 'contagem') {
      const antes = Math.ceil(c.contagem);
      c.contagem -= dt;
      const agora = Math.ceil(c.contagem);
      if (agora !== antes && agora > 0 && agora <= 3) S.tocar('contagem');
      if (c.contagem <= 0) {
        c.estado = 'correndo';
        S.tocar('largada');
        M.iniciar(c.fase);
        aviso('JÁ!', '#ffd23f', 0.8);
      }
    } else {
      c.obstaculos.forEach(o => { if (o.vel) o.fase += dt * o.vel; });
      atualizarCorredor(c.jogador, dt);
      c.bots.forEach(b => atualizarCorredor(b, dt));
      atualizarTiros(dt);
      conferirUltrapassagem();
      if (c.estado === 'chegou') {
        c.fimEm -= dt;
        if (c.fimEm <= 0) c.estado = 'fim';
      }
    }
    c.destaquePos = Math.max(0, c.destaquePos - dt);
    c.tremor = Math.max(0, c.tremor - dt);
    c.cameraY += (c.jogador.y - c.cameraY) * Math.min(1, dt * 6);
    c.avisos.forEach(a => { a.t -= dt; });
    c.avisos = c.avisos.filter(a => a.t > 0);
    c.particulas.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 400 * dt; p.t -= dt; p.giro += dt * 8;
    });
    c.particulas = c.particulas.filter(p => p.t > 0);
  }

  // Ganhou posição: o número pisca no painel e, sem outro aviso na tela,
  // aparece "ULTRAPASSOU!" (no máximo um por segundo, para não virar ruído).
  function conferirUltrapassagem() {
    if (c.jogador.chegou !== null) return;
    const pos = posicaoAtual();
    if (pos < c.posVista && c.relogio - c.ultimaUltrapassagem > 1) {
      c.ultimaUltrapassagem = c.relogio;
      c.destaquePos = 0.7;
      if (!c.avisos.some(a => !a.grande)) aviso('ULTRAPASSOU!', '#2de2e6', 0.8);
      S.tocar('ultrapassa');
    }
    c.posVista = pos;
  }

  function acertaObstaculo(o, x) {
    if (o.destruido || o.tipo === 'barra') return false;
    if (o.tipo === 'bloco') return Math.abs(x - blocoX(o)) < FAIXA * 0.6;
    return o.faixas.includes(faixaDe(x));
  }

  function atualizarTiros(dt) {
    c.tiros.forEach(tr => {
      tr.y += VEL_TIRO * dt;
      tr.t -= dt;
      const perto = alvoY => tr.y >= alvoY - 10 && tr.y <= alvoY + 40;
      const bot = c.bots.find(b => b.tonto === 0 && b.chegou === null && Math.abs(b.x - tr.x) < FAIXA * 0.45 && perto(b.y));
      const obst = c.obstaculos.find(o => perto(o.y) && acertaObstaculo(o, tr.x));
      if (!bot && !obst) return;
      tr.t = 0;
      if (bot && (!obst || bot.y <= obst.y)) {
        tropecar(bot, TEMPO_GOSMA);
        gosmada(bot.x, bot.y);
        aviso('PEGOU!', '#3ddc84', 0.9);
      } else {
        // Muro perde só a pista atingida; bloco some inteiro.
        if (obst.tipo === 'muro') {
          obst.faixas = obst.faixas.filter(f => f !== faixaDe(tr.x));
          if (!obst.faixas.length) obst.destruido = true;
        } else {
          obst.destruido = true;
        }
        gosmada(tr.x, obst.y);
        aviso('BUM!', '#7cfc00', 0.8);
      }
      S.tocar('splat');
    });
    c.tiros = c.tiros.filter(tr => tr.t > 0);
  }

  function posicaoAtual() {
    if (c.jogador.chegou !== null) return c.posicaoFinal;
    return 1 + c.bots.filter(b => b.chegou !== null || b.y > c.jogador.y).length;
  }

  // ---------- Efeitos ----------
  function aviso(texto, cor, duracao, grande, titulo) {
    c.avisos = c.avisos.filter(a => a.grande !== !!grande);
    c.avisos.push({ texto, cor, t: duracao, total: duracao, grande: !!grande, titulo });
  }

  function estilhacos(x, y) {
    for (let i = 0; i < 14; i++) {
      c.particulas.push({ x: x + U.aleatorio(-40, 40), y, vx: U.aleatorio(-120, 120), vy: U.aleatorio(80, 260),
        t: 0.8, cor: '#ffd23f', tam: U.aleatorio(6, 12), giro: 0 });
    }
  }

  function gosmada(x, y) {
    for (let i = 0; i < 16; i++) {
      c.particulas.push({ x: x + U.aleatorio(-20, 20), y: y + U.aleatorio(0, 30), vx: U.aleatorio(-160, 160),
        vy: U.aleatorio(60, 240), t: 0.7, cor: U.sortear(['#7CFC00', '#3ddc84', '#b8ff5a']), tam: U.aleatorio(6, 11), giro: 0 });
    }
  }

  function confete() {
    const cores = ['#ffd23f', '#ff3d7f', '#3ddc84', '#2de2e6', '#ffffff'];
    for (let i = 0; i < 70; i++) {
      c.particulas.push({ x: U.aleatorio(0, LARG), y: c.chegadaY + U.aleatorio(0, 200), vx: U.aleatorio(-80, 80),
        vy: U.aleatorio(150, 420), t: U.aleatorio(1.6, 2.6), cor: U.sortear(cores), tam: U.aleatorio(5, 10), giro: 0 });
    }
  }

  return {
    LARG, FAIXA, MUNICAO, iniciar, atualizar, mover, atirar, posicaoAtual, blocoX, barraX,
    get estado() { return c; },
  };
})();
