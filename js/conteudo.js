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
    // G ou J: só antes de E e I, onde as duas soam igual. Fora "viagem"
    // (viajem), "berinjela" e "canjica" (têm grafia antiga com G) e "laje".
    g: {
      facil: [
        '[G]ELO', '[G]ENTE', '[G]IRAFA', '[G]IBI', '[G]IZ', 'MÁ[G]ICO', 'TI[G]ELA',
        'HO[J]E', '[J]EITO', '[J]IPE', '[J]ILÓ', '[J]IBOIA', 'SU[J]EIRA', 'BEI[J]INHO',
      ],
      dificil: [
        '[G]ELADEIRA', 'RELÓ[G]IO', 'COLÉ[G]IO', 'GARA[G]EM', 'IMA[G]EM', 'FERRU[G]EM',
        '[G]INÁSTICA', '[G]IRASSOL', '[G]EADA', 'FU[G]IR', 'VA[G]EM',
        'MA[J]ESTADE', 'OB[J]ETO', 'PRO[J]ETO', 'SU[J]EITO', 'GOR[J]ETA', 'LARAN[J]EIRA', 'CERE[J]EIRA',
      ],
    },
    // R ou RR. Fora os pares que viram outra palavra: caro/carro, muro/murro,
    // moro/morro, era/erra, fera/ferra, tora/torra, carinho/carrinho...
    r: {
      facil: [
        'TE[RR]A', 'GA[RR]AFA', 'BA[RR]IGA', 'A[RR]OZ', 'BO[RR]ACHA', 'CO[RR]IDA', 'TO[RR]E',
        'PI[R]ATA', 'BA[R]ATA', 'CO[R]UJA', 'PA[R]EDE', 'TESOU[R]A',
        '[R]ODA', '[R]OUPA', '[R]ISADA',
      ],
      dificil: [
        'MACA[RR]ÃO', 'SO[RR]ISO', 'TO[RR]ADA', 'CHU[RR]ASCO', 'BA[RR]ACA', 'BEZE[RR]O',
        'FE[RR]ADURA', 'TE[RR]EMOTO', 'CO[RR]EIO', 'SE[RR]OTE', 'CA[RR]OSSEL',
        'CA[R]ECA', 'TARTA[R]UGA', 'CADEI[R]A',
        'HON[R]A', 'GEN[R]O', 'EN[R]OLADO', 'EN[R]EDO',
      ],
    },
    // M ou N antes de consoante: antes de P e B é sempre M.
    m: {
      facil: [
        'CA[M]PO', 'SA[M]BA', 'TA[M]BOR', 'PO[M]BO', 'TE[M]PO', 'LI[M]PO', 'BA[M]BU',
        'CA[N]TO', 'MU[N]DO', 'PO[N]TE', 'DE[N]TE', 'VE[N]TO', 'TI[N]TA', 'O[N]DA',
      ],
      dificil: [
        'BO[M]BEIRO', 'LÂ[M]PADA', 'SE[M]PRE', 'CA[M]PEÃO', 'U[M]BIGO', 'SO[M]BRA', 'LE[M]BRAR',
        'CA[M]BALHOTA', 'CO[M]PUTADOR', 'E[M]PADA',
        'ELEFA[N]TE', 'PRESE[N]TE', 'BRA[N]CO', 'LO[N]GE', 'INVE[N]TAR', 'CE[N]TRO', 'LA[N]TERNA',
      ],
    },
  };

  const OPCOES = { s: ['S', 'SS', 'Ç'], x: ['X', 'CH'], g: ['G', 'J'], r: ['R', 'RR'], m: ['M', 'N'] };
  const FAMILIAS = Object.keys(OPCOES);

  function familiaDe(marcada) {
    return FAMILIAS.find(f => PALAVRAS[f].facil.includes(marcada) || PALAVRAS[f].dificil.includes(marcada)) || null;
  }

  // A regrinha que aparece junto da resposta, quando existe uma regra simples.
  function regraDe(familia, antes, certo, depois) {
    if (familia === 'm') return /^[PB]/.test(depois) ? 'antes de P e B, é M' : 'antes de ' + depois[0] + ', é N';
    if (familia !== 'r') return null;
    if (!antes) return 'no começo da palavra, é um R só';
    if (/[NLS]$/.test(antes)) return 'depois de ' + antes.slice(-1) + ', é um R só';
    return certo === 'RR' ? 'entre vogais, som forte é RR' : 'entre vogais, som fraco é R';
  }

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
    const familia = familiaDe(marcada);
    // Quando só há duas letras, a terceira pista vira uma parede.
    const portas = OPCOES[familia].length === 3 ? OPCOES[familia].slice() : OPCOES[familia].concat([null]);
    const resposta = antes + certo + depois + ', com ' + certo;
    const regra = regraDe(familia, antes, certo, depois);
    const q = { id: 'p:' + marcada, fase: 'port', antes, depois, pergunta: antes + '_' + depois,
      portas: U.embaralhar(portas), certo, resposta };
    // A regra vai no alto do aviso de erro e na lista "pra treinar".
    if (regra) Object.assign(q, { titulo: regra.toUpperCase(), treinar: resposta + ': ' + regra });
    return q;
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
    return familiaDe(id.slice(2)) !== null;
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

  // Meia corrida de português: 4 palavras de 4 regras diferentes e 2 de
  // substantivo (um próprio e um comum, para não dar para chutar sempre o mesmo).
  function metade(nivel, familias, substantivos) {
    const palavras = familias.map(f => U.sortear(PALAVRAS[f][nivel]));
    return U.embaralhar(palavras.map(criarPort).concat(substantivos.map(criarSubst)));
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
      // A regra que fica de fora na primeira metade entra com certeza na segunda.
      const ordem = U.embaralhar(FAMILIAS);
      const segunda = [ordem[4]].concat(U.embaralhar(ordem.slice(0, 4)).slice(0, 3));
      lista = metade('facil', ordem.slice(0, 4), [proprios[0], comuns[0]])
        .concat(metade('dificil', segunda, [proprios[1], comuns[1]]));
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
    PORTAS, PALAVRAS, FAMILIAS, SUBSTANTIVOS, FAIXAS_MAT, KART, MENSAGENS,
    criarMat, criarConta, criarPort, criarSubst, montarCorrida, agendarRepeticao, registrar, proximaMensagem,
  };
})();
