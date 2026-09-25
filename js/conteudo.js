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

  // Substantivo próprio ou comum. Em caixa alta não dá para ver a maiúscula,
  // então nenhuma palavra pode ter as duas leituras: ficaram de fora "Recife"
  // (recife), "Salvador", "Natal", "Amazonas" (amazonas), "Argentina"
  // (argentina) e "rio" (Rio).
  const SUBSTANTIVOS = {
    proprio: [
      ['Brasil', 'um país'], ['Portugal', 'um país'], ['Japão', 'um país'],
      ['Itália', 'um país'], ['Canadá', 'um país'], ['França', 'um país'],
      ['Paris', 'uma cidade'], ['Manaus', 'uma cidade'], ['Curitiba', 'uma cidade'],
      ['Londres', 'uma cidade'], ['Brasília', 'uma cidade'], ['Goiânia', 'uma cidade'],
      ['Pedro', 'uma pessoa'], ['Ana', 'uma pessoa'], ['Lucas', 'uma pessoa'], ['Mariana', 'uma pessoa'],
      ['Marte', 'um planeta'], ['Saturno', 'um planeta'], ['Júpiter', 'um planeta'],
      ['África', 'um continente'], ['Europa', 'um continente'],
    ],
    comum: [
      'cidade', 'país', 'planeta', 'menino', 'menina', 'cachorro', 'gato', 'escola', 'professora',
      'livro', 'bola', 'time', 'flor', 'carro', 'amigo', 'casa', 'mar', 'praia',
    ],
  };

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

  // Fase do kart: contas simples. As multiplicações usam só as tabuadas mais
  // fáceis e têm o mesmo id da tabuada, então o erro no kart volta lá também.
  const KART = {
    soma: { de: 2, ate: 10 },
    subtracao: { de: 6, ate: 18, tiraAte: 9 },
    tabelas: [2, 3, 5, 10],
    fatores: { de: 2, ate: 9 },
  };

  function criarConta(op, a, b) {
    const certo = op === '+' ? a + b : a - b;
    const simbolo = op === '+' ? '+' : '−';
    // Erros típicos: errar por 1 ou 2; na subtração, às vezes, somar no lugar.
    const candidatos = U.embaralhar([certo + 1, certo - 1, certo + 2, certo - 2]);
    if (op === '-' && Math.random() < 0.5) candidatos.unshift(a + b);
    candidatos.push(certo + 10);
    const erradas = [];
    for (const n of candidatos) {
      if (n >= 0 && n !== certo && !erradas.includes(n)) erradas.push(n);
      if (erradas.length === 2) break;
    }
    return {
      id: 'k:' + a + op + b,
      fase: 'mat',
      pergunta: a + ' ' + simbolo + ' ' + b,
      portas: U.embaralhar([certo].concat(erradas).map(String)),
      certo: String(certo),
      resposta: a + ' ' + simbolo + ' ' + b + ' = ' + certo,
    };
  }

  function contaKart(tipo) {
    if (tipo === '+') return criarConta('+', U.inteiro(KART.soma.de, KART.soma.ate), U.inteiro(KART.soma.de, KART.soma.ate));
    if (tipo === '-') {
      const a = U.inteiro(KART.subtracao.de, KART.subtracao.ate);
      return criarConta('-', a, U.inteiro(2, Math.min(KART.subtracao.tiraAte, a - 1)));
    }
    return criarMat(U.sortear(KART.tabelas), U.inteiro(KART.fatores.de, KART.fatores.ate));
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

  // A palavra aparece em caixa alta; no aviso e na lista "pra treinar" ela vem
  // escrita do jeito certo, com ou sem maiúscula, e com o porquê.
  function criarSubst(palavra) {
    const proprio = SUBSTANTIVOS.proprio.find(p => p[0] === palavra);
    const classe = proprio ? 'próprio' : 'comum';
    const porque = proprio ? 'nome de ' + proprio[1] : 'vale para qualquer ' + palavra;
    return {
      id: 'p:s:' + palavra,
      fase: 'port',
      pergunta: palavra.toUpperCase(),
      portas: U.embaralhar(['PRÓPRIO', 'COMUM', null]),
      certo: classe.toUpperCase(),
      titulo: (proprio ? 'é ' + porque : porque).toUpperCase(),
      resposta: '“' + palavra + '” é ' + classe,
      treinar: '“' + palavra + '” é ' + classe + ': ' + porque,
    };
  }

  function existe(id) {
    if (id.startsWith('m:')) return /^m:\d+x\d+$/.test(id);
    if (id.startsWith('k:')) return /^k:\d+[+-]\d+$/.test(id);
    if (id.startsWith('p:s:')) {
      const palavra = id.slice(4);
      return SUBSTANTIVOS.comum.includes(palavra) || SUBSTANTIVOS.proprio.some(p => p[0] === palavra);
    }
    const marcada = id.slice(2);
    return ['s', 'x'].some(f => PALAVRAS[f].facil.includes(marcada) || PALAVRAS[f].dificil.includes(marcada));
  }

  function recriar(id) {
    if (id.startsWith('m:')) {
      const [a, b] = id.slice(2).split('x').map(Number);
      return criarMat(a, b);
    }
    if (id.startsWith('k:')) {
      const [, a, op, b] = /^k:(\d+)([+-])(\d+)$/.exec(id);
      return criarConta(op, Number(a), Number(b));
    }
    if (id.startsWith('p:s:')) return criarSubst(id.slice(4));
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
    const prefixo = { mat: 'm:', port: 'p:', kart: 'k:' }[fase];
    return Object.keys(U.dados.itens)
      .filter(id => id.startsWith(prefixo) && U.dados.itens[id].peso > 0 && existe(id))
      .sort((x, y) => U.dados.itens[y].peso - U.dados.itens[x].peso)
      .slice(0, 3);
  }

  // Meia corrida de português: 2 de S/SS/Ç, 2 de X/CH e 2 de substantivo
  // (um próprio e um comum, para não dar para chutar sempre o mesmo).
  function metade(nivel, substantivos) {
    const s = U.embaralhar(PALAVRAS.s[nivel]).slice(0, 2);
    const x = U.embaralhar(PALAVRAS.x[nivel]).slice(0, 2);
    return U.embaralhar(s.concat(x).map(criarPort).concat(substantivos.map(criarSubst)));
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
    } else if (fase === 'kart') {
      // 4 de cada conta, misturadas.
      const usados = new Set();
      lista = U.embaralhar(['+', '+', '+', '+', '-', '-', '-', '-', 'x', 'x', 'x', 'x']).map(tipo => {
        let q, tentativas = 0;
        do { q = contaKart(tipo); } while (usados.has(q.id) && ++tentativas < 40);
        usados.add(q.id);
        return q;
      });
    } else {
      const proprios = U.embaralhar(SUBSTANTIVOS.proprio).slice(0, 2).map(p => p[0]);
      const comuns = U.embaralhar(SUBSTANTIVOS.comum).slice(0, 2);
      lista = metade('facil', [proprios[0], comuns[0]]).concat(metade('dificil', [proprios[1], comuns[1]]));
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
    PORTAS, PALAVRAS, SUBSTANTIVOS, FAIXAS_MAT, KART, MENSAGENS,
    criarMat, criarConta, criarPort, criarSubst, montarCorrida, agendarRepeticao, registrar, proximaMensagem,
  };
})();
