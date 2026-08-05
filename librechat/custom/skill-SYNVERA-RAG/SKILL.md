---
name: synvera-rag
description: SuperRAG SYNVERA — conhecimento médico baseado em evidências com citações de Harrison, USP, Knobel, Surviving Sepsis e mais de 50 livros de referência em medicina intensiva e emergência.
---

# SYNVERA SuperRAG — Conhecimento Médico Baseado em Evidências

## Quando usar esta skill
Ative esta skill para **qualquer pergunta clínica** que exija fontes confiáveis e auditáveis. O SuperRAG cobre: sepse, choque, SDRA, ventilação mecânica, antibióticos, drogas vasoativas, emergências, UTI, pediatria, obstetrícia.

## Comportamento
1. **SEMPRE consulte o RAG** antes de responder perguntas clínicas.
2. **Toda afirmação clínica deve ter citação** — formato: `[FONTE N] Livro — Seção — p. X`.
3. **Se o RAG abstiver** (`abstain: true`), responda: "Não encontrei evidência suficiente no corpus médico. Recomendo consultar um especialista."
4. **NUNCA invente** doses, valores ou protocolos — se a fonte não contém o dado, indique a lacuna.
5. Responda em **português brasileiro (pt-BR)**, tom técnico e objetivo.

## Ferramenta RAG
Use `rag_search(query)` para consultar o SuperRAG. Ele retorna chunks com citação completa (fonte, página, seção, score de relevância).

## Corpus
Harrison 20ed, USP Emergência (14a, 18a, 19a ed), USP Medicina Intensiva 5ed, Condutas Knobel, Enfermagem UTI 2ed, Blackbook Pediatria 5ed, Surviving Sepsis Campaign, +50 livros.
