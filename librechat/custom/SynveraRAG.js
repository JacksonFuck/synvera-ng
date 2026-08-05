const { z } = require('zod');
const { tool } = require('@librechat/agents/langchain/tools');

function createSynveraRAGTool(fields = {}) {
  const baseUrl = fields.baseUrl ?? 'http://host.docker.internal:8099';
  const kwargs = fields?.kwargs ?? {};

  return tool(
    async (input) => {
      const { query, max_chunks } = input;

      try {
        // Usa o endpoint /rag/evidence-pack para resposta com confiança e abstenção
        const response = await fetch(`${baseUrl}/rag/evidence-pack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            max_chunks: max_chunks || 5,
            ...kwargs,
          }),
        });

        const json = await response.json();

        if (json.abstain) {
          return 'SuperRAG: Nenhuma evidência médica encontrada para esta consulta. Não responda — recuse educadamente.';
        }

        // Formata os chunks como citações
        const chunks = (json.chunks || []).map((c, i) =>
          `[${i+1}] ${c.text?.slice(0, 600) || ''}\n   📚 ${c.citation_label || 'sem fonte'}`
        ).join('\n\n');

        const meta = `Confiança: ${(json.confidence_precheck * 100).toFixed(0)}% | Chunks: ${json.supporting_chunks || 0}`;
        return `${meta}\n\n${chunks}`;
      } catch (e) {
        return `Erro ao consultar SuperRAG: ${e.message}`;
      }
    },
    {
      name: 'rag_search',
      description:
        'Busca conhecimento médico baseado em evidências no SuperRAG SYNVERA. Use para QUALQUER pergunta clínica que exija fontes confiáveis. O RAG retorna citações com fonte, página e seção do livro de referência (Harrison, USP, Knobel, Surviving Sepsis, etc). Se o RAG abstiver (abstain: true), RECUSE responder.',
      schema: z.object({
        query: z.string().min(3).describe('A pergunta clínica em português. Seja específico.'),
        max_chunks: z.number().min(1).max(8).optional().describe('Número de trechos de evidência. Default 5.'),
      }),
    },
  );
}

module.exports = { createSynveraRAGTool };
