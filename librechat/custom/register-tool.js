#!/usr/bin/env node
/**
 * Registra a ferramenta synvera_rag no LibreChat, em tempo de build.
 *
 * Por que um script e não um COPY dos arquivos inteiros: copiar sobrescreveria
 * silenciosamente qualquer mudança do upstream, e a ferramenta some sem aviso —
 * que é exatamente o modo de falha que motivou versionar isto (ela vivia só na
 * camada gravável do container). Aqui, se a âncora esperada não existir, o build
 * FALHA e alguém olha.
 *
 * `patch` não está na imagem (node slim), e manipular o manifest via JSON.parse
 * garante JSON válido de saída — coisa que um patch de linha não garante.
 */
const fs = require('fs');

const TOOLS = '/app/api/app/clients/tools';
const die = (msg) => { console.error(`[synvera] ERRO: ${msg}`); process.exit(1); };

// ── index.js: require + export ──────────────────────────────────────────────
const idxPath = `${TOOLS}/index.js`;
let idx = fs.readFileSync(idxPath, 'utf8');

if (idx.includes('SynveraRAG')) {
  console.log('[synvera] index.js já registrado, nada a fazer');
} else {
  // Âncora: o bloco de requires das ferramentas structured/.
  const reqAnchor = /^(const \w+ = require\('\.\/structured\/[^']+'\);)$/m;
  if (!reqAnchor.test(idx)) die(`nenhum require de ./structured/ em ${idxPath} — layout do upstream mudou`);
  idx = idx.replace(reqAnchor, `$1\nconst SynveraRAG = require('./structured/SynveraRAG');`);

  // Âncora: o objeto de exports (module.exports = { ... }).
  const expAnchor = /(module\.exports\s*=\s*\{)/;
  if (!expAnchor.test(idx)) die(`module.exports não encontrado em ${idxPath} — layout do upstream mudou`);
  idx = idx.replace(expAnchor, `$1\n  SynveraRAG,`);

  fs.writeFileSync(idxPath, idx);
  console.log('[synvera] index.js: require + export inseridos');
}

// ── manifest.json: entrada do plugin ────────────────────────────────────────
const manPath = `${TOOLS}/manifest.json`;
const manifest = JSON.parse(fs.readFileSync(manPath, 'utf8'));
if (!Array.isArray(manifest)) die(`${manPath} não é um array — formato do upstream mudou`);

if (manifest.some((t) => t.pluginKey === 'synvera_rag')) {
  console.log('[synvera] manifest.json já registrado, nada a fazer');
} else {
  manifest.push({
    name: 'SynveraRAG',
    pluginKey: 'synvera_rag',
    description:
      'Super-RAG Synvera — busca conhecimento médico baseado em evidências. ' +
      'Citações com fonte, página e seção. 100% local, zero egress de dados.',
    icon: 'https://img.icons8.com/color/48/stethoscope.png',
    authConfig: [],
  });
  fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[synvera] manifest.json: plugin registrado (${manifest.length} ferramentas)`);
}
