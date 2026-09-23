// Utilitários compartilhados: sorteio e dados salvos no aparelho.
window.BB = window.BB || {};

BB.util = (function () {
  function aleatorio(min, max) { return min + Math.random() * (max - min); }
  function inteiro(min, max) { return Math.floor(aleatorio(min, max + 1)); }
  function sortear(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function embaralhar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // O navegador pode bloquear ou apagar o armazenamento; o jogo funciona sem ele.
  const CHAVE = 'benjaboy:v1';
  const dados = { som: true, recordes: {}, itens: {}, msg: 0 };
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo === 'object') {
      if (typeof salvo.som === 'boolean') dados.som = salvo.som;
      if (salvo.recordes && typeof salvo.recordes === 'object') dados.recordes = salvo.recordes;
      if (salvo.itens && typeof salvo.itens === 'object') dados.itens = salvo.itens;
      if (Number.isInteger(salvo.msg)) dados.msg = salvo.msg;
    }
  } catch (e) { /* segue com o padrão */ }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* segue sem salvar */ }
  }

  return { aleatorio, inteiro, sortear, limitar, embaralhar, dados, salvar };
})();
