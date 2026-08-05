# Validação clínica das posologias — metodologia e checklist

> Pré-requisito regulatório e clínico (issues #2 e #14). A validação é a evidência
> clínica que sustenta o conteúdo do app perante a ANVISA (dossiê técnico) e a
> responsabilidade técnica.

**Responsável técnico:** Dr. Eder Abelha Flavio — CRM-PR 42907 · RQE 37954
(Medicina de Emergência).

**Escopo:** 161 posologias-padrão de uso ambulatorial em `src/data/prescriptionDrugs.ts`
(36 classes terapêuticas) + 16 receitas-modelo por patologia em
`prescriptionTemplates.ts`. **Não** inclui controlados (Portaria 344/98).

**Planilha de trabalho:** `docs/clinico/checklist-validacao-posologias.csv`
(161 linhas, uma por medicamento; abra no Excel/Google Sheets e preencha).

---

## Como usar a planilha

Para cada uma das 161 linhas, o revisor preenche:

| Coluna | O que preencher |
|---|---|
| **Validado (OK/Ajustar)** | `OK` se a posologia está correta como está; `Ajustar` se precisa mudar. |
| **Ajuste sugerido** | Se "Ajustar": a posologia corrigida (dose, via, intervalo, duração, teto). |
| **Fonte sugerida (CONFIRMAR)** | Já vem **pré-preenchida com a fonte autoritativa provável por classe** (ex.: anti-hipertensivo → Diretriz SBC + bula). É uma **sugestão de onde consultar**, não uma citação confirmada: o revisor abre a fonte, confere a posologia e, se confirmar, mantém; se usar outra fonte, substitui. **Nunca** trate o valor pré-preenchido como validação. |
| **Revisor** | Iniciais do médico revisor. |
| **Data** | Data da validação. |

Ao final, os "Ajustar" viram alterações em `prescriptionDrugs.ts` (eu aplico as
edições que você listar), e a planilha preenchida fica arquivada como evidência.

## Critérios de validação (o que conferir em cada item)

Para cada medicamento, confirmar contra a fonte:

1. **Dose** — quantidade por tomada adequada à indicação ambulatorial usual.
2. **Via** — via de administração correta (VO, tópica, oftálmica, etc.).
3. **Intervalo** — frequência (ex.: 8/8h, 12/12h) correta.
4. **Duração** — duração do tratamento adequada (especialmente antibióticos).
5. **Dose máxima / teto** — presença do teto quando relevante (ex.: paracetamol
   máx. 4 g/dia já consta; verificar os demais).
6. **Quantidade a dispensar** — coerente com posologia × duração.
7. **Apresentação** — forma farmacêutica e concentração existentes no mercado (BR).
8. **Advertências críticas** — quando couber, nota de cautela (gestação, função
   renal/hepática, faixa etária, interações relevantes).

## Pontos de atenção já identificados (priorizar)

- **Classe Antibiótico (17 itens) + Antiviral (4) + Antifúngico (4+2):** são
  **antimicrobianos** — além da validação de dose, lembrar que exigem Receita de
  Antimicrobiano (o app já exibe o aviso; ver issue #25/M7). Conferir duração com
  rigor (a duração errada de ATB é o erro mais comum e mais relevante).
- **Pediátrico / dose por peso:** os itens em gotas (ex.: "1 gota/kg") e a
  calculadora pediátrica (`PediatricCalc`) merecem conferência específica de teto
  por peso.
- **Atropina (pendência herdada):** a calculadora de pré-medicação de IOT usa piso
  de 0,1 mg **sem teto** — conferir contra a bula/diretriz e definir o teto. (Não
  está na lista das 161, mas é a pendência clínica registrada; resolver junto.)
- **Anti-hipertensivos, antidiabéticos, hipolipemiantes:** uso contínuo — conferir
  posologia de manutenção e a sinalização de "uso contínuo".

## Metodologia de evidência (para o dossiê ANVISA)

- Hierarquia de fontes: **diretriz de sociedade médica brasileira** > **bula ANVISA
  (vigente)** > **Formulário Terapêutico Nacional (FTN/MS) / RENAME** > prática
  usual referenciada.
- Registrar a fonte de cada item na planilha.
- Versionar o resultado: ao concluir, marcar no `REVISAO-MEDICA.md` a data, o
  responsável (RT) e a versão dos dados validados.
- Revalidar periodicamente (ex.: anual) ou quando a fonte mudar.

## Fluxo sugerido

1. Revisar por **classe** (a planilha já vem agrupada): comece pelas de maior risco
   (antimicrobianos, anti-hipertensivos, antidiabéticos).
2. Marcar OK/Ajustar e a fonte de cada item.
3. Enviar de volta a planilha com os "Ajustar" → eu aplico as correções no código.
4. Resolver a pendência da atropina.
5. Atualizar `REVISAO-MEDICA.md` com data/responsável/versão.
