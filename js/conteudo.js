// Conteúdo das fases: tabuada gerada e conferida por código, palavras de
// ortografia e as mensagens do papai.
BB.conteudo = (function () {
  const U = BB.util;
  const PORTAS = 12;

  const MENSAGENS = ['PAPAI TE AMA', 'PAPAI TÁ COM SAUDADES'];

  // Cada faixa vale para 4 portas seguidas: a corrida começa fácil e sobe.
  const FAIXAS_MAT = [
    { tabelas: [2, 3, 5, 10], de: 2, ate: 9 },
    { tabelas: [4, 6, 9], de: 2, ate: 9 },
    { tabelas: [6, 7, 8, 9], de: 6, ate: 9 },
  ];

  // A lacuna fica entre colchetes. Em nenhuma palavra a troca de letra forma
  // outra palavra de verdade — "louça" ficou de fora por causa de "lousa",
  // "poço" por causa de "posso".
  const PALAVRAS = {
    s: {
      facil: [
        'CABE[Ç]A', 'MA[Ç]Ã', 'PÁ[SS]ARO', 'PE[SS]OA', 'A[SS]IM', 'PALHA[Ç]O',
        'FOR[Ç]A', 'ON[Ç]A', 'UR[S]O', 'BOL[S]A', 'PEDA[Ç]O', 'LI[Ç]ÃO',
        'PRA[Ç]A', 'CAL[Ç]A',
      ],
      dificil: [
        'A[Ç]ÚCAR', 'VA[SS]OURA', 'PÊ[SS]EGO', 'PROFE[SS]ORA', 'CAN[S]ADO',
        'CONVER[S]A', 'DESCAN[S]O', 'PEN[S]AR', 'ESPA[Ç]O', 'ALMO[Ç]O',
        'PREGUI[Ç]A', 'PESCO[Ç]O', 'CORA[Ç]ÃO', 'MI[SS]ÃO', 'SO[SS]EGO',
        'PA[SS]EIO', 'PUL[S]EIRA', 'A[SS]USTADO', 'DAN[Ç]A', 'CARRO[Ç]A',
      ],
    },
    x: {
      facil: [
        '[X]ÍCARA', 'PEI[X]E', 'CAI[X]A', 'LI[X]O', '[CH]OCOLATE', '[CH]INELO',
        'CA[CH]ORRO', 'MO[CH]ILA', '[CH]UTE', 'BRU[X]A', 'RO[X]O', '[CH]APÉU',
      ],
      dificil: [
        'ME[X]ER', 'DEI[X]AR', 'PU[X]AR', 'ABACA[X]I', 'LAGARTI[X]A', 'AMEI[X]A',
        'FAI[X]A', '[X]ADREZ', 'SALSI[CH]A', 'BOLA[CH]A', 'FE[CH]AR',
        'MA[CH]UCADO', '[CH]UVEIRO', '[CH]ICLETE', '[CH]EIRO',
      ],
    },
  };

  const OPCOES = { s: ['S', 'SS', 'Ç'], x: ['X', 'CH'] };

  function inverter(n) { return Number(String(n).split('').reverse().join('')); }

  function criarMat(a, b) {
    const certo = a * b;
    // Primeiro os erros típicos (a tabuada vizinha), depois erros de conta.
    const perto = U.embaralhar([a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b]);
    const longe = U.embaralhar([certo + 1, certo - 1, certo + 10, certo - 10, inverter(certo)]);
    const erradas = [];
    for (const n of perto.concat(longe)) {
      if (n > 1 && n <= 100 && n !== certo && !erradas.includes(n)) erradas.push(n);
      if (erradas.length === 2) break;
    }
    const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
    return {
      id: 'm:' + Math.min(a, b) + 'x' + Math.max(a, b),
      fase: 'mat',
      pergunta: x + ' × ' + y,
      portas: U.embaralhar([certo].concat(erradas).map(String)),
      certo: String(certo),
      resposta: x + ' × ' + y + ' = ' + certo,
    };
  }

  function criarPort(marcada) {
    const m = /^(.*)\[(.+)\](.*)$/.exec(marcada);
    const antes = m[1], certo = m[2], depois = m[3];
    const familia = OPCOES.x.includes(certo) ? 'x' : 's';
    // X ou CH tem só duas portas; a terceira pista vira uma parede.
    const portas = familia === 's' ? OPCOES.s.slice() : OPCOES.x.concat([null]);
    return {
      id: 'p:' + marcada,
      fase: 'port',
      antes,
      depois,
      pergunta: antes + '_' + depois,
      portas: U.embaralhar(portas),
      certo,
      resposta: antes + certo + depois + ', com ' + certo,
    };
  }

  function existe(id) {
    if (id.startsWith('m:')) return /^m:\d+x\d+$/.test(id);
    const marcada = id.slice(2);
    return ['s', 'x'].some(f => PALAVRAS[f].facil.includes(marcada) || PALAVRAS[f].dificil.includes(marcada));
  }

  function recriar(id) {
    if (id.startsWith('m:')) {
      const [a, b] = id.slice(2).split('x').map(Number);
      return criarMat(a, b);
    }
    return criarPort(id.slice(2));
  }

  // O que ele errou ganha peso; cada acerto tira um pouco. Com peso, volta.
  function registrar(q, acertou) {
    const itens = U.dados.itens;
    const s = itens[q.id] || (itens[q.id] = { peso: 0, acertos: 0, erros: 0 });
    if (acertou) { s.acertos++; s.peso = Math.max(0, s.peso - 1); }
    else { s.erros++; s.peso += 2; }
    U.salvar();
  }

  function paraRevisar(fase) {
    const prefixo = fase === 'mat' ? 'm:' : 'p:';
    return Object.keys(U.dados.itens)
      .filter(id => id.startsWith(prefixo) && U.dados.itens[id].peso > 0 && existe(id))
      .sort((x, y) => U.dados.itens[y].peso - U.dados.itens[x].peso)
      .slice(0, 3);
  }

  function metade(nivel) {
    const s = U.embaralhar(PALAVRAS.s[nivel]).slice(0, 4);
    const x = U.embaralhar(PALAVRAS.x[nivel]).slice(0, 2);
    return U.embaralhar(s.concat(x)).map(criarPort);
  }

  function montarCorrida(fase) {
    let lista = [];
    if (fase === 'mat') {
      const usados = new Set();
      for (let i = 0; i < PORTAS; i++) {
        const faixa = FAIXAS_MAT[Math.floor(i / 4)];
        let q, tentativas = 0;
        do {
          q = criarMat(U.sortear(faixa.tabelas), U.inteiro(faixa.de, faixa.ate));
        } while (usados.has(q.id) && ++tentativas < 40);
        usados.add(q.id);
        lista.push(q);
      }
    } else {
      lista = metade('facil').concat(metade('dificil'));
    }
    // Revisão das corridas anteriores nas portas 3, 7 e 11.
    const vagas = [2, 6, 10];
    paraRevisar(fase).forEach((id, i) => {
      if (!lista.some(q => q.id === id)) lista[vagas[i]] = recriar(id);
    });
    return lista;
  }

  // Errou na porta k: a mesma pergunta volta três portas depois.
  function agendarRepeticao(lista, k) {
    const alvo = k + 3;
    if (alvo >= lista.length || lista[alvo].repeticao) return;
    lista[alvo] = Object.assign(recriar(lista[k].id), { repeticao: true });
  }

  function proximaMensagem() {
    const i = U.dados.msg % MENSAGENS.length;
    U.dados.msg = i + 1;
    U.salvar();
    return MENSAGENS[i];
  }

  return {
    PORTAS, PALAVRAS, FAIXAS_MAT, MENSAGENS,
    criarMat, criarPort, montarCorrida, agendarRepeticao, registrar, proximaMensagem,
  };
})();
