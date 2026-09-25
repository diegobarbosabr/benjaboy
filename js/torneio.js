// Fase 4 · Meia-Noite: torneio de perguntas no escuro contra a turma.
// Quem erra ou demora perde uma lanterna; sem lanterna, a Sombra pega.
// Vence o último que sobrar. Sem ajuda nenhuma: aqui o desafio é de verdade.
BB.torneio = (function () {
  const U = BB.util, S = BB.som, M = BB.musica, K = BB.conteudo;
  const LANTERNAS = 3;
  const HORA_DA_SOMBRA = 13;      // desta rodada em diante, errar elimina na hora
  const MAX_RODADAS = 20;
  const DURACAO_PEGO = 3.2;
  const PAUSA_AJUDA = 0.58, ESPERA_AJUDA = 5, DURACAO_RESGATE = 3;   // Melifulina
  const INTRO_REGRAS = 3.5, INTRO_MELIFULINA = 4.5;                   // abertura em duas partes
  const TEMPOS = [25, 20, 16];    // segundos para responder em cada faixa
  const MATERIAS = ['mat', 'port', 'logica'];
  const NOMES_MATERIA = { mat: 'MATEMÁTICA', port: 'PORTUGUÊS', logica: 'RACIOCÍNIO' };

  // Cada amigo tem um ponto forte (nunca um defeito). A aparência é genérica.
  const AMIGOS = [
    { nome: 'Freitas', forte: 'rapido', ap: { estilo: 'bone', pele: '#d9a07a', cabelo: '#2b1b12', camisa: '#b91c1c', bone: '#1d4ed8' } },
    { nome: 'João Miguel', forte: 'mat', ap: { estilo: 'cacheado', pele: '#8d5a3b', cabelo: '#1c1410', camisa: '#15803d' } },
    { nome: 'João Pedro', forte: 'port', ap: { estilo: 'curto', pele: '#f2c6a5', cabelo: '#d4a24c', camisa: '#7c3aed' } },
    { nome: 'Artur', forte: 'logica', ap: { estilo: 'topete', pele: '#e8b48f', cabelo: '#5a3316', camisa: '#0e7490' } },
    { nome: 'Francisco', forte: 'todos', ap: { estilo: 'liso', pele: '#c68a5e', cabelo: '#3b2314', camisa: '#ea580c' } },
  ];
  const TURMA = ['Benjaboy'].concat(AMIGOS.map(a => a.nome));

  // ---------- Perguntas ----------
  function faixaDa(rodada) { return rodada <= 4 ? 0 : rodada <= 9 ? 1 : 2; }

  // Converte uma pergunta das outras fases (portas) para o quiz (opções).
  function doJogo(q, materia) {
    const base = { id: q.id, materia, opcoes: q.portas.filter(p => p !== null), certo: q.certo, resposta: q.treinar || q.resposta };
    if (q.antes !== undefined) return Object.assign(base, { lacuna: { antes: q.antes, depois: q.depois } });
    if (q.titulo) return Object.assign(base, { enunciado: q.pergunta, sub: 'Substantivo próprio ou comum?' });
    return Object.assign(base, { enunciado: q.pergunta + ' = ?' });
  }

  function erradasPerto(certo, candidatos, quantas) {
    const erradas = [];
    for (const n of U.embaralhar(candidatos)) {
      if (n >= 0 && n !== certo && !erradas.includes(n)) erradas.push(n);
      if (erradas.length === quantas) break;
    }
    return erradas;
  }

  function numerica(id, enunciado, certo, candidatos, resposta, sub) {
    const opcoes = U.embaralhar([certo].concat(erradasPerto(certo, candidatos, 2))).map(String);
    return { id, materia: 'logica', enunciado, sub, opcoes, certo: String(certo), resposta };
  }

  function sequencia(f) {
    if (f === 2) {
      const r = U.sortear([2, 3]), a = r === 3 ? 1 : U.inteiro(1, 3);
      const termos = [0, 1, 2, 3].map(i => a * Math.pow(r, i)), certo = a * Math.pow(r, 4);
      const ultimo = termos[3], soma = ultimo + (ultimo - termos[2]);
      return numerica('l:seq', termos.join(', ') + ', ?', certo, [soma, certo + r, certo - r, certo + 1],
        termos.join(', ') + ', ' + certo + ': sempre vezes ' + r, 'Que número vem depois?');
    }
    const passo = f === 0 ? U.sortear([2, 5, 10]) : U.sortear([3, 4, 6]);
    const desce = f === 1 && Math.random() < 0.35;
    const a = desce ? U.inteiro(30, 50) : U.inteiro(1, 10);
    const termos = [0, 1, 2, 3].map(i => a + (desce ? -1 : 1) * i * passo);
    const certo = a + (desce ? -1 : 1) * 4 * passo;
    return numerica('l:seq', termos.join(', ') + ', ?', certo, [certo + passo, certo - passo, certo + 1, certo - 1],
      termos.join(', ') + ', ' + certo + ': ' + (desce ? 'menos ' : 'mais ') + passo + ' a cada vez', 'Que número vem depois?');
  }

  // Qual não combina: três de um grupo e um intruso. Nenhum grupo tem duas
  // leituras (nada de três ímpares e um par quando o grupo é outra coisa), e
  // cada intruso aparece uma vez só, porque ele é o id da pergunta.
  const INTRUSOS = [
    [0, ['GATO', 'CACHORRO', 'CAVALO'], 'MESA', 'os outros são animais'],
    [0, ['BANANA', 'MAÇÃ', 'UVA'], 'CADEIRA', 'os outros são frutas'],
    [0, ['AZUL', 'VERDE', 'AMARELO'], 'PANELA', 'os outros são cores'],
    [0, ['LÁPIS', 'CADERNO', 'BORRACHA'], 'GIRAFA', 'os outros são material escolar'],
    [0, ['CARRO', 'ÔNIBUS', 'BICICLETA'], 'SAPATO', 'os outros são meios de transporte'],
    [0, ['VIOLÃO', 'PIANO', 'BATERIA'], 'TOMATE', 'os outros são instrumentos musicais'],
    [0, ['FUTEBOL', 'VÔLEI', 'BASQUETE'], 'GELADEIRA', 'os outros são esportes'],
    [0, ['CAMISA', 'CALÇA', 'BERMUDA'], 'BANANA', 'os outros são roupas'],
    [0, ['LEITE', 'SUCO', 'ÁGUA'], 'PEDRA', 'os outros são bebidas'],
    [0, ['CAMA', 'SOFÁ', 'ARMÁRIO'], 'MACACO', 'os outros são móveis'],
    [0, ['PATO', 'GALINHA', 'PAPAGAIO'], 'CACHORRO', 'os outros são aves'],
    [0, ['SOL', 'LUA', 'ESTRELA'], 'MELANCIA', 'os outros ficam no céu'],
    [0, ['ARROZ', 'FEIJÃO', 'MACARRÃO'], 'TESOURA', 'os outros são comida'],
    [0, ['GARFO', 'FACA', 'COLHER'], 'PNEU', 'os outros são talheres'],
    [0, ['CHUVA', 'VENTO', 'NEVE'], 'LIVRO', 'os outros são coisas do clima'],
    [0, ['UM', 'DOIS', 'TRÊS'], 'AZUL', 'os outros são números'],
    [0, ['NARIZ', 'BOCA', 'OLHO'], 'MARTELO', 'os outros são partes do rosto'],
    [0, ['AVIÃO', 'FOGUETE', 'PIPA'], 'NAVIO', 'os outros voam; o navio anda na água'],
    [0, ['BOLA', 'PIÃO', 'IOIÔ'], 'BRÓCOLIS', 'os outros são brinquedos'],
    [0, ['MÉDICO', 'BOMBEIRO', 'PROFESSOR'], 'JACARÉ', 'os outros são profissões'],
    [0, ['PORTA', 'JANELA', 'TELHADO'], 'NUVEM', 'os outros são partes da casa'],
    [0, ['MARGARIDA', 'GIRASSOL', 'TULIPA'], 'MINHOCA', 'os outros são flores'],
    [1, ['JANEIRO', 'MARÇO', 'JULHO'], 'DOMINGO', 'os outros são meses do ano'],
    [1, ['DOIS', 'QUATRO', 'SEIS'], 'CINCO', 'os outros são números pares'],
    [1, ['TRÊS', 'CINCO', 'SETE'], 'OITO', 'os outros são números ímpares'],
    [1, ['QUADRADO', 'TRIÂNGULO', 'CÍRCULO'], 'CENOURA', 'os outros são formas'],
    [1, ['TUBARÃO', 'BALEIA', 'GOLFINHO'], 'CAMELO', 'os outros vivem no mar'],
    [1, ['VERÃO', 'INVERNO', 'OUTONO'], 'NOITE', 'os outros são estações do ano'],
    [1, ['CORAÇÃO', 'PULMÃO', 'ESTÔMAGO'], 'CAMISA', 'os outros são partes do corpo'],
    [1, ['SEGUNDA', 'QUARTA', 'SEXTA'], 'ABRIL', 'os outros são dias da semana'],
    [1, ['BRASIL', 'JAPÃO', 'ITÁLIA'], 'PARIS', 'os outros são países; Paris é cidade'],
    [1, ['DEZ', 'VINTE', 'TRINTA'], 'QUINZE', 'os outros vão de 10 em 10'],
    [1, ['CORRER', 'PULAR', 'NADAR'], 'ESCADA', 'os outros são ações'],
    [1, ['FELIZ', 'TRISTE', 'BRAVO'], 'JANELA', 'os outros são sentimentos'],
    [1, ['VACA', 'CABRA', 'OVELHA'], 'LEÃO', 'os outros comem capim; o leão come carne'],
    [1, ['CENOURA', 'ALFACE', 'BATATA'], 'SORVETE', 'os outros vêm da horta'],
    [1, ['GELO', 'NEVE', 'PICOLÉ'], 'FOGO', 'os outros são gelados'],
    [1, ['SOL', 'FOGO', 'FORNO'], 'GELO', 'os outros são quentes'],
    [1, ['MANHÃ', 'TARDE', 'NOITE'], 'SEMANA', 'os outros são partes do dia'],
    [1, ['CARRO', 'MOTO', 'CAMINHÃO'], 'BARCO', 'os outros andam na rua; o barco, na água'],
    [1, ['GOLEIRO', 'ZAGUEIRO', 'ATACANTE'], 'PILOTO', 'os outros são posições no futebol'],
    [1, ['MAR', 'RIO', 'LAGO'], 'MONTANHA', 'os outros são de água'],
    [1, ['SOMA', 'SUBTRAÇÃO', 'DIVISÃO'], 'TRIÂNGULO', 'os outros são contas'],
    [2, ['LEÃO', 'TIGRE', 'ONÇA'], 'VACA', 'os outros são felinos'],
    [2, ['MARTE', 'VÊNUS', 'SATURNO'], 'LUA', 'os outros são planetas; a Lua é satélite'],
    [2, ['QUATRO', 'OITO', 'DOZE'], 'DEZ', 'os outros estão na tabuada do 4'],
    [2, ['CINCO', 'DEZ', 'QUINZE'], 'DOZE', 'os outros estão na tabuada do 5'],
    [2, ['TRÊS', 'SEIS', 'NOVE'], 'QUATRO', 'os outros estão na tabuada do 3'],
    [2, ['ONZE', 'TREZE', 'QUINZE'], 'DEZESSEIS', 'os outros são ímpares'],
    [2, ['PARDAL', 'CORUJA', 'PINGUIM'], 'MORCEGO', 'os outros são aves; o morcego é mamífero'],
    [2, ['BALEIA', 'GOLFINHO', 'FOCA'], 'TUBARÃO', 'os outros são mamíferos; o tubarão é peixe'],
    [2, ['HORA', 'MINUTO', 'SEGUNDO'], 'METRO', 'os outros medem tempo'],
    [2, ['METRO', 'QUILÔMETRO', 'CENTÍMETRO'], 'LITRO', 'os outros medem distância'],
    [2, ['TRIÂNGULO', 'QUADRADO', 'RETÂNGULO'], 'CÍRCULO', 'os outros têm lados retos'],
    [2, ['ÁFRICA', 'EUROPA', 'ÁSIA'], 'BRASIL', 'os outros são continentes; o Brasil é país'],
    [2, ['POLEGAR', 'INDICADOR', 'MÍNIMO'], 'JOELHO', 'os outros são dedos da mão'],
    [2, ['GIRAFA', 'ZEBRA', 'ELEFANTE'], 'CANGURU', 'os outros vivem na África'],
    [2, ['PRIMEIRO', 'SEGUNDO', 'TERCEIRO'], 'TRÊS', 'os outros dizem a posição na fila'],
    [2, ['FUTEBOL', 'HANDEBOL', 'BASQUETE'], 'NATAÇÃO', 'os outros são jogados com bola'],
    [2, ['LÁPIS', 'CANETA', 'GIZ'], 'RÉGUA', 'os outros servem para escrever'],
  ];

  // Número que falta no meio da sequência: 2, 4, ?, 8, 10.
  function faltando(f) {
    let termos, regra;
    if (f === 2 && Math.random() < 0.4) {
      const r = U.sortear([2, 3]), a = r === 3 ? 1 : U.inteiro(1, 3);   // nada de 243
      termos = [0, 1, 2, 3, 4].map(i => a * Math.pow(r, i));
      regra = 'sempre vezes ' + r;
    } else {
      const passo = f === 0 ? U.sortear([2, 5, 10]) : f === 1 ? U.sortear([3, 4, 6]) : U.sortear([7, 8, 9, 11]);
      const desce = f > 0 && Math.random() < 0.35;
      const a = desce ? U.inteiro(4 * passo + 1, 4 * passo + 15) : U.inteiro(1, 10);
      termos = [0, 1, 2, 3, 4].map(i => a + (desce ? -1 : 1) * i * passo);
      regra = (desce ? 'menos ' : 'mais ') + passo + ' a cada vez';
    }
    const k = U.inteiro(1, 3), certo = termos[k];
    const enunciado = termos.map((n, i) => i === k ? '?' : n).join(', ');
    return numerica('l:falta', enunciado, certo, [certo + 1, certo - 1, certo + 2, certo - 2, certo + 10, certo - 10],
      termos.join(', ') + ': ' + regra, 'Qual número está faltando?');
  }

  // Relógio: horas cheias nas faixas 0 e 1, meia hora na faixa 2.
  function horas(f) {
    // Espaço que não quebra: "2 horas" nunca fica partido em duas linhas.
    const nome = n => n + (n === 1 ? '\u00a0hora' : '\u00a0horas');
    if (f < 2) {
      const volta = f === 1 && Math.random() < 0.5;
      const d = U.inteiro(2, f === 0 ? 3 : 5);
      const agora = volta ? U.inteiro(d + 1, 12) : U.inteiro(2, 12 - d);
      const certo = volta ? agora - d : agora + d;
      const erradas = erradasPerto(certo, [certo + 1, certo - 1, certo + 2, certo - 2].filter(n => n >= 1 && n <= 12), 2);
      return { id: 'l:hora', materia: 'logica',
        enunciado: 'Agora são ' + nome(agora) + '. ' + (volta ? 'Que horas eram ' + nome(d) + ' atrás?' : 'Que horas serão daqui a ' + nome(d) + '?'),
        opcoes: U.embaralhar([certo].concat(erradas)).map(nome), certo: nome(certo),
        resposta: agora + (volta ? ' − ' : ' + ') + d + ' = ' + nome(certo) };
    }
    const relogio = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    const agora = U.inteiro(1, 8) * 60 + U.sortear([0, 30]);
    const [d, texto] = U.sortear([[30, 'meia\u00a0hora'], [90, '1\u00a0hora\u00a0e\u00a0meia'], [150, '2\u00a0horas\u00a0e\u00a0meia']]);
    const certo = agora + d;
    const erradas = erradasPerto(certo, [certo + 30, certo - 30, certo + 60, certo - 60].filter(m => m > agora), 2);
    return { id: 'l:hora', materia: 'logica',
      enunciado: (agora < 120 ? 'Agora é ' : 'Agora são ') + relogio(agora) + '. Que horas serão daqui a ' + texto + '?',
      opcoes: U.embaralhar([certo].concat(erradas)).map(relogio), certo: relogio(certo),
      resposta: relogio(agora) + ' + ' + texto + ' = ' + relogio(certo) };
  }

  // Dias da semana: ontem e amanhã, depois anteontem e depois de amanhã.
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function semana(f) {
    const [passo, quando] = U.sortear([
      [[1, 'será amanhã'], [-1, 'foi ontem']],
      [[2, 'será depois de amanhã'], [-2, 'foi anteontem'], [1, 'será amanhã']],
      [[3, 'será daqui a 3 dias'], [-3, 'foi há 3 dias'], [7, 'será daqui a uma semana'], [2, 'será depois de amanhã']],
    ][f]);
    const hoje = U.inteiro(0, 6), dia = n => DIAS[((n % 7) + 7) % 7];
    const certo = dia(hoje + passo);
    const erradas = U.embaralhar([dia(hoje + passo + 1), dia(hoje + passo - 1), dia(hoje - passo)])
      .filter(d => d !== certo).filter((d, i, l) => l.indexOf(d) === i).slice(0, 2);
    const caminho = passo === 7 ? 'uma semana depois, é ' + certo + ' de novo'
      : [0, 1, 2, 3].slice(0, Math.abs(passo) + 1).map(i => dia(hoje + Math.sign(passo) * i)).join(' → ');
    return { id: 'l:dia', materia: 'logica', enunciado: 'Hoje é ' + DIAS[hoje] + '. Que dia ' + quando + '?',
      opcoes: U.embaralhar([certo].concat(erradas)).map(d => d.toUpperCase()), certo: certo.toUpperCase(), resposta: caminho };
  }

  // Fatos do dia a dia, com os erros mais comuns como opção.
  const FATOS = [
    [0, 'Quantos dias tem uma semana?', 7, [5, 6, 8], 'uma semana tem 7 dias'],
    [0, 'Quantos meses tem um ano?', 12, [10, 11, 13], 'um ano tem 12 meses'],
    [0, 'Quantos dedos temos nas duas mãos?', 10, [8, 5, 12], 'são 5 em cada mão: 10'],
    [0, 'Quantos lados tem um triângulo?', 3, [4, 2, 5], 'o triângulo tem 3 lados'],
    [0, 'Quantos lados tem um quadrado?', 4, [3, 5, 6], 'o quadrado tem 4 lados'],
    [0, 'Quantas patas tem uma aranha?', 8, [6, 4, 10], 'a aranha tem 8 patas'],
    [0, 'Quantas estações tem o ano?', 4, [3, 2, 5], 'verão, outono, inverno e primavera'],
    [1, 'Quantas horas tem um dia?', 24, [12, 20, 30], 'um dia tem 24 horas'],
    [1, 'Quantos minutos tem uma hora?', 60, [100, 30, 50], 'uma hora tem 60 minutos'],
    [1, 'Quantos segundos tem um minuto?', 60, [100, 30, 10], 'um minuto tem 60 segundos'],
    [1, 'Quantos minutos tem meia hora?', 30, [50, 20, 15], 'meia hora tem 30 minutos'],
    [1, 'Uma dúzia de ovos tem quantos ovos?', 12, [10, 6, 20], 'uma dúzia é 12'],
    [1, 'Quantas cores tem o arco-íris?', 7, [5, 6, 8], 'o arco-íris tem 7 cores'],
    [1, 'Quantas patas tem um inseto?', 6, [8, 4, 10], 'todo inseto tem 6 patas'],
    [1, 'Quantos jogadores de um time ficam em campo no futebol?', 11, [10, 12, 9], 'cada time tem 11 em campo'],
    [1, 'Quantas vogais tem o alfabeto?', 5, [6, 4, 7], 'A, E, I, O, U: 5 vogais'],
    [2, 'Quantos anos tem uma década?', 10, [100, 12, 20], 'uma década tem 10 anos'],
    [2, 'Quantos anos tem um século?', 100, [10, 1000, 50], 'um século tem 100 anos'],
    [2, 'Quantos dias tem um ano?', 365, [360, 300, 350], 'um ano tem 365 dias'],
    [2, 'Quantos planetas tem o Sistema Solar?', 8, [9, 7, 10], 'são 8 planetas'],
    [2, 'Quantos meses tem um semestre?', 6, [4, 12, 3], 'um semestre é meio ano: 6 meses'],
    [2, 'Quantos dias tem uma quinzena?', 15, [14, 10, 20], 'uma quinzena tem 15 dias'],
    [2, 'Meia dúzia é quanto?', 6, [5, 12, 3], 'metade de 12 é 6'],
    [2, 'Quantos centímetros tem um metro?', 100, [10, 1000, 50], 'um metro tem 100 centímetros'],
    [2, 'Quantas letras tem o alfabeto?', 26, [23, 24, 25], 'de A a Z são 26 letras'],
  ];

  function fato(f) {
    const [, enunciado, certo, erradas, porque] = U.sortear(FATOS.filter(x => x[0] <= f && x[0] >= Math.max(0, f - 1)));
    return numerica('l:fato:' + enunciado, enunciado, certo, erradas, porque);
  }

  function intruso(f) {
    const [, grupo, fora, porque] = U.sortear(INTRUSOS.filter(i => i[0] <= f && i[0] >= Math.max(0, f - 1)));
    return { id: 'l:fora:' + fora, materia: 'logica', enunciado: 'Qual não combina?', opcoes: U.embaralhar(grupo.concat([fora])),
      certo: fora, resposta: fora + ': ' + porque };
  }

  function probleminha(f) {
    const nome = U.sortear(TURMA), coisas = U.sortear(['pilhas', 'lanternas', 'figurinhas', 'balas', 'bolinhas de gude']);
    if (f < 2) {
      const a = U.inteiro(4, 12), b = U.inteiro(1, a - 1), c = U.inteiro(2, 8), certo = a - b + c;
      return numerica('l:prob', nome + ' tinha ' + a + ' ' + coisas + ', deu ' + b + ' e ganhou ' + c + '. Com quantas ficou?',
        certo, [a - b, a + b + c, certo + 1, certo - 1], a + ' − ' + b + ' + ' + c + ' = ' + certo);
    }
    const n = U.inteiro(2, 5), m = U.inteiro(3, 9), certo = n * m;
    return numerica('l:prob', nome + ' tem ' + n + ' caixas com ' + m + ' ' + coisas + ' em cada. Quantas ' + coisas + ' ao todo?',
      certo, [n + m, certo + m, certo - m, certo + 1], n + ' × ' + m + ' = ' + certo);
  }

  // Ordem de chegada com três da turma. Nada de comparar altura ou outra
  // coisa do corpo de crianças de verdade: chegar antes é neutro.
  function ordem() {
    const [a, b, c] = U.embaralhar(TURMA).slice(0, 3);
    const primeiro = Math.random() < 0.5;
    const certo = primeiro ? a : c;
    return { id: 'l:ordem', materia: 'logica', enunciado: a + ' chegou antes de ' + b + '. ' + b + ' chegou antes de ' + c + '.',
      sub: primeiro ? 'Quem chegou primeiro?' : 'Quem chegou por último?', opcoes: U.embaralhar([a, b, c]), certo,
      resposta: 'Ordem: ' + a + ', ' + b + ', ' + c + '. ' + (primeiro ? 'Primeiro' : 'Por último') + ': ' + certo };
  }

  function perguntaDe(materia, f) {
    if (materia === 'mat') {
      if (f === 0) {
        if (Math.random() < 0.5) return doJogo(K.criarConta('+', U.inteiro(3, 12), U.inteiro(2, 9)), 'mat');
        const a = U.inteiro(8, 18);
        return doJogo(K.criarConta('-', a, U.inteiro(2, Math.min(9, a - 1))), 'mat');
      }
      const tabelas = f === 1 ? [2, 3, 4, 5, 10] : [6, 7, 8, 9];
      return doJogo(K.criarMat(U.sortear(tabelas), U.inteiro(f === 1 ? 2 : 3, 9)), 'mat');
    }
    if (materia === 'port') {
      if (f >= 1 && Math.random() < 0.4) {
        const lista = Math.random() < 0.5 ? K.SUBSTANTIVOS.proprio.map(p => p[0]) : K.SUBSTANTIVOS.comum;
        return doJogo(K.criarSubst(U.sortear(lista)), 'port');
      }
      const familia = U.sortear(K.FAMILIAS);
      return doJogo(K.criarPort(U.sortear(K.PALAVRAS[familia][f === 2 ? 'dificil' : 'facil'])), 'port');
    }
    // O "qual não combina" tem o maior banco, por isso entra duas vezes.
    const tipos = [sequencia, faltando, intruso, intruso, horas, semana, fato];
    if (f >= 1) tipos.push(probleminha);
    if (f === 2) tipos.push(ordem);
    return U.sortear(tipos)(f);
  }

  // ---------- Torneio ----------
  let t = null;

  function jogador(nome, extra) {
    return Object.assign({ nome, lanternas: LANTERNAS, vivo: true, resposta: null, quando: null, decidiu: null,
      certo: null, tempoTotal: 0, pegoNa: null }, extra);
  }

  function iniciar(mensagem) {
    t = {
      estado: 'intro', tempo: INTRO_REGRAS + INTRO_MELIFULINA, rodada: 0, limite: 0, pergunta: null, mensagem,
      ajuda: true, aguardandoAjuda: null, resgate: 0, salvoNa: null,
      jogadores: [jogador('Benjaboy', { voce: true })].concat(AMIGOS.map(a => jogador(a.nome, { forte: a.forte, ap: a.ap }))),
      fila: [], pego: null, acertos: 0, total: 0, erros: [], posicaoFinal: 0, fimEm: 0, piscar: 0, horaDaSombra: false,
    };
    return t;
  }

  function vivos() { return t.jogadores.filter(j => j.vivo); }
  function voce() { return t.jogadores[0]; }

  // Chance de acerto de cada amigo: cai com a dificuldade e sobe no ponto forte.
  function chance(j, materia, f) {
    let p = [0.9, 0.8, 0.68][f];
    if (j.forte === materia) p += 0.1;
    if (j.forte === 'todos') p += 0.04;
    if (j.forte === 'rapido') p -= 0.03;
    return Math.min(0.97, p);
  }

  function proximaRodada() {
    t.rodada++;
    const f = faixaDa(t.rodada), materia = MATERIAS[(t.rodada - 1) % 3];
    t.pergunta = perguntaDe(materia, f);
    t.pergunta.nomeMateria = NOMES_MATERIA[materia];
    t.limite = TEMPOS[f];
    t.tempo = t.limite;
    t.espera = null;
    t.ultimoTique = null;
    t.horaDaSombra = t.rodada >= HORA_DA_SOMBRA;
    t.jogadores.forEach(j => {
      j.resposta = null;
      j.certo = null;
      if (!j.vivo || j.voce) return;
      const acerta = Math.random() < chance(j, materia, f);
      const erradas = t.pergunta.opcoes.filter(o => o !== t.pergunta.certo);
      j.decidiu = acerta ? t.pergunta.certo : U.sortear(erradas);
      const rapidez = j.forte === 'rapido' ? U.aleatorio(0.15, 0.4) : U.aleatorio(0.3, 0.85) * (j.forte === materia ? 0.8 : 1);
      j.quando = t.limite * rapidez;
    });
    t.estado = 'pergunta';
    S.tocar('rodada');
  }

  // i é a opção escolhida; -1 é pegar uma sombra vazia (isca), que conta como erro.
  function responder(i) {
    if (!t || t.estado !== 'pergunta') return false;
    const v = voce();
    if (!v.vivo || v.resposta !== null || i < -1 || i >= t.pergunta.opcoes.length) return false;
    v.resposta = i === -1 ? '…' : t.pergunta.opcoes[i];
    v.tempoTotal += t.limite - t.tempo;
    t.espera = 0.9;   // os amigos que faltam respondem no susto e a rodada revela
    S.tocar('resposta');
    return true;
  }

  function revelar() {
    const q = t.pergunta;
    t.jogadores.forEach(j => {
      if (!j.vivo) return;
      if (!j.voce && j.resposta === null) { j.resposta = j.decidiu; j.tempoTotal += Math.min(j.quando, t.limite); }
      j.certo = j.resposta === q.certo;
      if (!j.certo) j.lanternas = t.horaDaSombra ? 0 : j.lanternas - 1;
    });
    const v = voce();
    if (v.vivo) {
      t.total++;
      K.registrar(q, v.certo);
      if (v.certo) t.acertos++;
      else t.erros.push({ id: q.id + ':' + t.rodada, resposta: q.resposta });
      S.tocar(v.certo ? 'acerto' : 'erro');
    }
    t.estado = 'revelar';
    t.tempo = 2.4;
  }

  function depoisDaRevelacao() {
    t.jogadores.forEach(j => {
      if (j.vivo && j.lanternas <= 0) {
        j.vivo = false;
        j.pegoNa = t.rodada;
        t.fila.push(j);
      }
    });
    proximoPego();
  }

  function proximoPego() {
    t.pego = t.fila.shift() || null;
    if (t.pego) {
      // Tempo da cena do monstro: sobe, abre a boca, come, ri e desce.
      t.estado = 'pego';
      t.tempo = DURACAO_PEGO;
      t.aguardandoAjuda = null;
      t.resgate = 0;
      S.tocar('rosnado');
      return;
    }
    if (!conferirFim()) proximaRodada();
  }

  // Melifulina: uma vez por torneio, quando o Fedorento vem comer o Benjaboy,
  // ele pode chamá-la. Ela late, o Fedorento foge e ele volta com 1 lanterna.
  function pedirAjuda() {
    if (!t || t.estado !== 'pego' || !t.pego || !t.pego.voce || !t.ajuda || !(t.aguardandoAjuda > 0)) return false;
    t.ajuda = false;
    t.aguardandoAjuda = 0;
    t.resgate = DURACAO_RESGATE;   // o latido toca quando ela chega (BB.noite)
    return true;
  }

  function salvo() {
    const v = voce();
    v.vivo = true;
    v.lanternas = 1;
    v.pegoNa = null;
    t.resgate = 0;
    t.salvoNa = t.rodada;
    proximoPego();
  }

  // Toque na abertura: pula das regras para a Melifulina, e dela para a rodada.
  function pularIntro() {
    if (!t || t.estado !== 'intro') return;
    t.tempo = t.tempo > INTRO_MELIFULINA ? INTRO_MELIFULINA : 0;
  }

  // Posição de quem ainda está vivo no fim: mais lanternas, depois quem
  // respondeu mais rápido no total.
  function conferirFim() {
    const v = voce(), restam = vivos();
    let pos = 0;
    if (!v.vivo) pos = 1 + restam.length;
    else if (restam.length === 1) pos = 1;
    else if (t.rodada >= MAX_RODADAS) {
      const ordem = restam.slice().sort((a, b) => b.lanternas - a.lanternas || a.tempoTotal - b.tempoTotal);
      pos = ordem.indexOf(v) + 1;
    }
    if (!pos) return false;
    t.posicaoFinal = pos;
    t.estado = 'fim';
    t.fimEm = 2.2;
    M.parar();
    S.tocar(pos === 1 ? 'chegada' : 'pego');
    return true;
  }

  function atualizar(dt) {
    if (!t) return;
    dt = Math.min(dt, 0.05);
    t.piscar = Math.max(0, t.piscar - dt);
    if (t.estado === 'intro') {
      t.tempo -= dt;
      if (t.tempo <= 0) proximaRodada();
    } else if (t.estado === 'pergunta') {
      t.tempo -= dt;
      const passou = t.limite - t.tempo;
      t.jogadores.forEach(j => {
        if (j.vivo && !j.voce && j.resposta === null && passou >= j.quando) {
          j.resposta = j.decidiu;
          j.tempoTotal += j.quando;
        }
      });
      const falta = Math.ceil(t.tempo);
      if (t.tempo <= 3 && falta > 0 && falta !== t.ultimoTique) { t.ultimoTique = falta; S.tocar('tique'); }
      if (t.espera !== null) {
        t.espera -= dt;
        if (t.espera <= 0) revelar();
      } else if (!voce().vivo && t.jogadores.every(j => !j.vivo || j.voce || j.resposta !== null)) {
        revelar();
      } else if (t.tempo <= 0) {
        if (voce().vivo && voce().resposta === null) voce().tempoTotal += t.limite;
        revelar();
      }
    } else if (t.estado === 'revelar') {
      t.tempo -= dt;
      if (t.tempo <= 0) depoisDaRevelacao();
    } else if (t.estado === 'pego') {
      if (t.resgate > 0) {
        t.resgate -= dt;
        if (t.resgate <= 0) salvo();
        return;
      }
      // Vai comer o Benjaboy e a ajuda ainda existe: o Fedorento para de boca
      // aberta e espera ele decidir se chama a Melifulina.
      if (t.pego.voce && t.ajuda && t.aguardandoAjuda === null && DURACAO_PEGO - t.tempo >= PAUSA_AJUDA) {
        t.aguardandoAjuda = ESPERA_AJUDA;
      }
      if (t.aguardandoAjuda > 0) {
        t.aguardandoAjuda = Math.max(0, t.aguardandoAjuda - dt);
        return;
      }
      t.tempo -= dt;
      if (t.tempo <= 0) proximoPego();
    } else if (t.estado === 'fim') {
      t.fimEm -= dt;
    }
  }

  return {
    LANTERNAS, HORA_DA_SOMBRA, MAX_RODADAS, DURACAO_PEGO, DURACAO_RESGATE, ESPERA_AJUDA, INTRO_MELIFULINA, AMIGOS, TURMA, INTRUSOS, FATOS,
    iniciar, atualizar, responder, pedirAjuda, pularIntro, perguntaDe, faixaDa,
    get estado() { return t; },
  };
})();
