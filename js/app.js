// Liga tudo: telas, toques, laço do jogo e recordes.
(function () {
  const U = BB.util, S = BB.som, M = BB.musica, K = BB.conteudo, R = BB.corrida, CENA = BB.cena, D = BB.desenho;
  const T = BB.torneio, NOITE = BB.noite;
  const $ = id => document.getElementById(id);
  const tela = $('tela');
  const ctx = tela.getContext('2d');
  const telas = { menu: $('menu'), resultado: $('resultado'), pausa: $('pausa') };
  const CORACAO = '<svg class="coracao" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  let fase = null, rodando = false, pausado = false, ultimo = performance.now(), municaoVista = -1;

  // nome null = corrida na tela, sem painel por cima.
  function mostrar(nome) {
    Object.keys(telas).forEach(k => telas[k].classList.toggle('escondido', k !== nome));
    $('bt-pausa').classList.toggle('escondido', nome !== null);
    $('bt-som').classList.toggle('escondido', nome === null);
    $('bt-atirar').classList.toggle('escondido', nome !== null || fase !== 'kart');
  }

  // A Meia-Noite é a caça às sombras; as outras três fases são corridas.
  function ehNoite() { return fase === 'noite'; }
  function estadoAtual() { return ehNoite() ? T.estado : R.estado; }

  // Botão ATIRAR mostra a munição em bolinhas; só redesenha quando muda.
  function atualizarMunicao() {
    const n = R.estado ? R.estado.jogador.gosma : 0;
    if (n === municaoVista) return;
    municaoVista = n;
    $('bt-atirar').classList.toggle('vazio', n === 0);
    $('bt-atirar').querySelectorAll('.municao i').forEach((bola, i) => bola.classList.toggle('cheia', i < n));
  }

  function retrato(canvas, expressao) {
    const tam = canvas.clientWidth || 190;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(tam * dpr);
    canvas.height = Math.round(tam * dpr);
    const c2 = canvas.getContext('2d');
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, tam, tam);
    c2.save();
    c2.beginPath();
    c2.arc(tam / 2, tam / 2, tam / 2 - 3, 0, Math.PI * 2);
    c2.fillStyle = '#ffd23f';
    c2.fill();
    c2.clip();
    D.retrato(c2, tam / 2, tam * 0.44, tam * 0.27, expressao);
    c2.restore();
    c2.lineWidth = 4;
    c2.strokeStyle = '#ffffff';
    c2.beginPath();
    c2.arc(tam / 2, tam / 2, tam / 2 - 3, 0, Math.PI * 2);
    c2.stroke();
  }

  function textoRecorde(r) {
    return r ? 'Recorde: ' + r.pos + 'º lugar · ' + r.acertos + '/' + (r.total || K.PORTAS) : '';
  }

  function abrirMenu() {
    M.parar();
    rodando = false;
    pausado = false;
    $('rec-mat').textContent = textoRecorde(U.dados.recordes.mat);
    $('rec-port').textContent = textoRecorde(U.dados.recordes.port);
    $('rec-kart').textContent = textoRecorde(U.dados.recordes.kart);
    $('rec-noite').textContent = textoRecorde(U.dados.recordes.noite);
    mostrar('menu');
    retrato($('retrato-menu'), 'normal');
  }

  function comecar(qual) {
    M.parar();
    S.destravar();
    fase = qual;
    if (ehNoite()) {
      T.iniciar(K.proximaMensagem());
      NOITE.medir(tela);
      NOITE.iniciar();
      M.iniciar('noite');
    } else {
      R.iniciar(fase, K.proximaMensagem());
      CENA.medir(tela);
    }
    rodando = true;
    pausado = false;
    ultimo = performance.now();
    municaoVista = -1;
    atualizarMunicao();
    mostrar(null);
  }

  function melhorQue(novo, antigo) {
    if (!antigo) return true;
    if (novo.pos !== antigo.pos) return novo.pos < antigo.pos;
    return novo.acertos > antigo.acertos;
  }

  function terminar() {
    M.parar();
    rodando = false;
    const c = estadoAtual();
    const pos = c.posicaoFinal;
    const total = c.total || K.PORTAS;
    const novo = { pos, acertos: c.acertos, total };
    const recorde = melhorQue(novo, U.dados.recordes[fase]);
    if (recorde) {
      U.dados.recordes[fase] = novo;
      U.salvar();
    }
    $('res-pos').textContent = pos === 1 ? '1º LUGAR!' : pos + 'º LUGAR';
    $('bt-denovo').textContent = ehNoite() ? 'JOGAR DE NOVO' : 'CORRER DE NOVO';
    $('res-premio').classList.toggle('escondido', pos !== 1);
    $('res-acertos').textContent = 'Acertou ' + c.acertos + ' de ' + total;
    $('res-recorde').classList.toggle('escondido', !recorde);
    $('res-msg').textContent = c.mensagem + ' ';
    $('res-msg').insertAdjacentHTML('beforeend', CORACAO);

    const vistos = new Set();
    const erros = c.erros.filter(q => !vistos.has(q.id) && vistos.add(q.id));
    const caixa = $('res-treinar');
    caixa.replaceChildren();
    if (erros.length) {
      const titulo = document.createElement('h2');
      titulo.textContent = 'PRA TREINAR';
      const lista = document.createElement('ul');
      erros.forEach(q => {
        const li = document.createElement('li');
        li.textContent = q.treinar || q.resposta;
        lista.appendChild(li);
      });
      caixa.append(titulo, lista);
    }
    caixa.classList.toggle('escondido', !erros.length);
    mostrar('resultado');
    retrato($('retrato-res'), pos <= 3 ? 'feliz' : 'normal');
  }

  function pausar() {
    if (!rodando || pausado) return;
    pausado = true;
    M.parar();
    mostrar('pausa');
  }

  function continuar() {
    pausado = false;
    ultimo = performance.now();
    if (ehNoite() ? T.estado.estado !== 'fim' : R.estado.estado === 'correndo') M.iniciar(fase);
    mostrar(null);
  }

  // O próximo quadro é agendado antes de tudo: um erro num quadro nunca
  // congela o jogo.
  function quadro(agora) {
    requestAnimationFrame(quadro);
    const dt = (agora - ultimo) / 1000;
    ultimo = agora;
    if (!rodando || pausado) return;
    try {
      if (ehNoite()) {
        T.atualizar(dt);
        NOITE.atualizar(Math.min(dt, 0.05), agora / 1000);
        NOITE.desenhar(ctx, agora / 1000);
        if (T.estado.estado === 'fim' && T.estado.fimEm <= 0) terminar();
        return;
      }
      R.atualizar(dt);
      CENA.desenhar(ctx, agora / 1000);
      if (fase === 'kart') atualizarMunicao();
      if (R.estado.estado === 'fim') terminar();
    } catch (e) {
      if (!quadro.avisou) { quadro.avisou = true; console.error(e); }
    }
  }

  // ---------- Entrada ----------
  tela.addEventListener('pointerdown', e => {
    if (!rodando || pausado) return;
    e.preventDefault();
    if (ehNoite()) NOITE.tocar(e.clientX, e.clientY);
    else R.mover(e.clientX < window.innerWidth / 2 ? -1 : 1);
  });
  // Meia-Noite: a lanterna segue o dedo (ou o mouse, no computador).
  tela.addEventListener('pointermove', e => {
    if (rodando && !pausado && ehNoite()) NOITE.mirar(e.clientX, e.clientY);
  });
  tela.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => {
    if (!rodando || pausado) return;
    if (ehNoite()) {
      if (e.key >= '1' && e.key <= '4') T.responder(Number(e.key) - 1);
      if (e.key === 'm') T.pedirAjuda();
      if (e.key === ' ') T.pularIntro();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') R.mover(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') R.mover(1);
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      R.atirar();
    }
  });
  $('bt-atirar').addEventListener('pointerdown', e => {
    e.preventDefault();
    if (rodando && !pausado) R.atirar();
  });

  document.querySelectorAll('.fase').forEach(b => b.addEventListener('click', () => comecar(b.dataset.fase)));
  $('bt-denovo').addEventListener('click', () => comecar(fase));
  $('bt-menu').addEventListener('click', abrirMenu);
  $('bt-pausa').addEventListener('click', pausar);
  $('bt-continuar').addEventListener('click', () => { S.destravar(); continuar(); });
  $('bt-sair').addEventListener('click', abrirMenu);

  function iconeSom() {
    $('ic-som-on').classList.toggle('escondido', !U.dados.som);
    $('ic-som-off').classList.toggle('escondido', U.dados.som);
  }
  $('bt-som').addEventListener('click', () => { S.alternar(); iconeSom(); });

  // Saiu do app (notificação, trocou de janela): a corrida espera por ele.
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
  window.addEventListener('resize', () => {
    // Deitou o celular no meio da corrida: pausa por baixo do aviso de virar.
    if (window.innerWidth > window.innerHeight && window.innerHeight <= 500) pausar();
    if (ehNoite()) NOITE.medir(tela); else CENA.medir(tela);
    if (!telas.menu.classList.contains('escondido')) retrato($('retrato-menu'), 'normal');
  });

  CENA.medir(tela);
  iconeSom();
  abrirMenu();
  requestAnimationFrame(quadro);
})();
