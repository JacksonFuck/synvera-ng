# Roteiro — Enquadramento e regularização do GuiaMed AMPLE na ANVISA (SaMD)

> 📌 **Versão verificada:** ver `conformidade-consolidado.md` (pesquisa em fontes
> oficiais, jun/2026), que corrige alguns números deste roteiro inicial (ex.:
> antimicrobianos = RDC 471/2021; RT pode ser médico; CBPF está na RDC 751/2022).

> ⚠️ **Não é consultoria regulatória.** Este é um roteiro educativo para orientar
> as conversas com um consultor de Assuntos Regulatórios. A classificação e a
> regularização formais são de responsabilidade do detentor e exigem apoio
> profissional especializado. As normas citadas devem ser conferidas na versão
> vigente no site da ANVISA.

**Detentor:** Pocus Umuarama LTDA — CNPJ 62.838.665/0001-26
**Responsável técnico pelo conteúdo clínico:** Dr. Eder Abelha Flavio — CRM-PR
42907 · RQE 37954 (Medicina de Emergência)

---

## Conceito: o que é SaMD

**SaMD** (*Software as a Medical Device* / "software como dispositivo médico") é
software destinado a uma ou mais finalidades médicas **sem ser parte de um
equipamento**. No Brasil, o tema é regido principalmente por:

- **RDC 657/2022** — regras específicas para SaMD (o que é/não é, e o framework de
  risco baseado no IMDRF).
- **RDC 751/2022** — classificação de risco de dispositivos médicos (Classes I a IV)
  e requisitos de rotulagem/instruções de uso.
- **RDC 665/2022** — Boas Práticas de Fabricação (aplicável conforme a classe).
- Normas de notificação/registro e de tecnovigilância (pós-mercado).

---

## Passo 1 — Escrever a "destinação de uso" (intended use)

É o passo mais importante: **o texto da destinação de uso determina o
enquadramento e a classe.** Precisa ser formal e preciso. Exemplos de eixos de
decisão:

- "Ferramenta de **apoio à decisão** que **informa** o profissional" (mais leve)
  vs. "ferramenta que **dirige/determina** a conduta" (mais pesado).
- Público: exclusivamente **profissionais de saúde** (como é o caso) — relevante.

> 💡 A forma de redigir muda a classe. Vale isolar claramente o que é **referência
> educativa** do que é **cálculo aplicado a um paciente**.

## Passo 2 — Verificar se É SaMD (enquadramento)

A RDC 657/2022 traz **exclusões** — software que normalmente **não** é SaMD:
finalidade administrativa; bem-estar/estilo de vida sem finalidade médica; que
apenas **armazena, transmite ou exibe** dados; e material **puramente educativo/
bibliográfico**.

Aplicando ao GuiaMed AMPLE (análise preliminar, a confirmar):

| Módulo | Tendência de enquadramento |
|---|---|
| Biblioteca, guias, quiz, referências | Tende a ficar **FORA** (educativo/referência) |
| Calculadoras de dose (IOT, sedação, pediátrica, eletrólitos, ventilação) | Tende a entrar **DENTRO** (gera um valor que orienta conduta sobre paciente) |
| Apoio à decisão com recomendações (scores, condutas) | **Provável SaMD** |
| Receituário (apenas formata/imprime) | Provavelmente **FORA**, se não decide a conduta |

## Passo 3 — Classificar o risco (Classes I a IV)

O framework combina dois eixos (IMDRF / RDC 657):

1. **Estado da condição de saúde:** crítico · sério · não-sério.
2. **Significância da informação para a decisão:** tratar/diagnosticar · **dirigir**
   o manejo · **informar** o manejo.

O cruzamento define a classe. Em geral, **apps de apoio à decisão/calculadora**
ficam em **Classe I ou II**. Uma calculadora de dose para situação crítica
(emergência) que "informa/dirige" o manejo tende a **Classe II**.

## Passo 4 — Caminho regulatório: Notificação vs Registro

- **Classe I e II → NOTIFICAÇÃO** (peticionamento eletrônico, mais simples,
  vigência indeterminada; fiscalização é posterior).
- **Classe III e IV → REGISTRO** (dossiê técnico completo, análise prévia, mais
  caro e demorado).

> Se confirmado Classe I/II, o caminho é **Notificação** — bem mais viável.

## Passo 5 — Regularizar a EMPRESA (pré-requisitos)

Antes de notificar o produto, a Pocus Umuarama LTDA precisa, em geral:

1. **Licença/Alvará Sanitário** da Vigilância Sanitária municipal/estadual.
2. **AFE — Autorização de Funcionamento** na ANVISA (para a atividade com
   dispositivos médicos; há isenções por classe/atividade — confirmar).
3. **Responsável(is) Técnico(s):** você (Dr. Eder, CRM-PR 42907) é o **responsável
   clínico** pelo conteúdo. **Atenção:** para dispositivo médico o RT formal pode
   precisar de formação técnica (ex.: engenharia) — confirme com a consultoria se
   um médico pode ser o RT do SaMD ou se é preciso um RT técnico **somado** ao
   responsável clínico.
4. **CNAE compatível** no contrato social (desenvolvimento de software médico /
   equipamentos médicos).
5. **Certificado digital** e cadastro no peticionamento eletrônico da ANVISA.

## Passo 6 — Montar a documentação técnica

Mesmo na notificação, mantenha o dossiê (exigível em fiscalização):

- Destinação de uso + classificação de risco **justificada**.
- **Gerenciamento de risco** — ISO 14971.
- **Ciclo de vida do software** — IEC 62304.
- **Usabilidade / fatores humanos** — IEC 62366.
- **Rotulagem e Instruções de Uso (IFU)** conforme RDC 751/2022 — indicação,
  contraindicações, advertências e os **disclaimers** (já implementados no app).
- **Validação/evidência clínica** proporcional ao risco (aqui entra a sua revisão
  clínica das posologias/condutas como responsável técnico).
- Identificação da empresa e do RT.

## Passo 7 — Peticionar

- Pagar a **TFVS** (Taxa de Fiscalização de Vigilância Sanitária) — varia por classe
  e **porte da empresa** (há redução para ME/EPP/pequeno porte).
- Submeter a **notificação** (Classe I/II) pelo peticionamento eletrônico.
- Notificação: publicação relativamente rápida. Registro (III/IV): meses.

## Passo 8 — Pós-mercado (obrigações contínuas)

- **Tecnovigilância:** notificar eventos adversos/queixas técnicas.
- **Controle de alterações:** mudanças significativas no software podem exigir nova
  notificação/atualização.
- Manter **rotulagem e IFU** atualizadas e o dossiê acessível.

---

## Resumo do caminho mais provável

1. **Consultor de Assuntos Regulatórios** confirma o **enquadramento** e a **classe**
   (provável I/II) a partir da destinação de uso escrita.
2. **Regularizar a empresa:** licença sanitária + AFE (se aplicável) + RT + CNAE.
3. **Montar o dossiê técnico** (gestão de risco, IFU, rotulagem, validação clínica).
4. **Peticionar a notificação** + pagar a TFVS.
5. Manter **tecnovigilância** e controle de alterações.

## O que você (Dr. Eder) já tem a favor

- **Responsável técnico clínico definido** (você) com RQE em Emergência.
- **Disclaimers e isenção de responsabilidade** já implementados no app.
- **Não há persistência de dados de paciente** (receituário stateless) — reduz risco
  e escopo de dados.
- Posicionamento como **apoio à decisão para profissionais** (não diagnóstico
  autônomo) — favorece classe baixa.

## Próximas ações sugeridas

1. Escrever formalmente a **destinação de uso** (posso ajudar a redigir uma minuta).
2. Contratar **consultoria regulatória** para confirmar enquadramento/classe.
3. Verificar a regularização da empresa junto à **Vigilância Sanitária local**.
4. Concluir a **validação clínica** das posologias/condutas (issue #2/#14) — é parte
   da evidência técnica.
