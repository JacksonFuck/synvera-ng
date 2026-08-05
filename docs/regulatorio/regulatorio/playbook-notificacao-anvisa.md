# Playbook DIY — Notificação do GuiaMed AMPLE na ANVISA (SaMD)

> Plano de ação para **fazer você mesmo** a notificação, sem consultoria. Baseado em
> pesquisa verificada em fontes oficiais (ANVISA/Datalegis), junho/2026. Onde houver
> "⚠️ CONFIRMAR", use os canais gratuitos da ANVISA (Parte 6) — não chute.

**Detentor:** Pocus Umuarama LTDA — CNPJ 62.838.665/0001-26 (ME/EPP)
**Responsável técnico:** Dr. Eder Abelha Flavio — CRM-PR 42907 · RQE 37954
**Produto:** GuiaMed AMPLE — app web de apoio à decisão clínica

---

## ⚠️ Achado-chave: seu app é provavelmente CLASSE II (não Classe I)

Pela **Regra 11 do Anexo II da RDC 751/2022**, software que "presta informações
utilizadas para a tomada de decisões com fins terapêuticos ou de diagnóstico" é
**Classe II por padrão**. Calculadora de dose e scores fazem exatamente isso.

- **Não muda o caminho:** Classe I **e** II vão pelo mesmo rito (**Notificação**) e
  o **mesmo código de assunto (80272)**. Muda apenas a documentação de classificação
  e o valor da taxa.
- **Risco a evitar:** notificar como Classe I quando é II é **causa expressa de
  cancelamento** (RDC 751/2022, art. 41). Documente como **Classe II**.
- Só sobe para III/IV (que exigiria **Registro**, não notificação) se a decisão do
  software pudesse causar **morte ou dano grave/irreversível** de forma autônoma —
  não é o caso (é apoio com confirmação do profissional). ⚠️ CONFIRMAR a classe
  final com a GGTPS antes de protocolar.

> Ação: atualizar a classe nos documentos do dossiê para **Classe II** (a destinação
> de uso e o índice já apontam "I ou II" — fixe em II salvo orientação contrária).

---

## Visão geral — 3 fases

```
FASE A: Regularizar a EMPRESA  →  FASE B: Dossiê + Classe  →  FASE C: Peticionar
(licença VISA, AFE, CNAE,          (você já tem 80% pronto)    (Solicita, 80272,
 RT, e-CNPJ, porte)                                             GRU, DOU)
```
**A FASE A é a mais longa** (envolve a Vigilância Sanitária local e a AFE). Comece por ela.

---

## FASE A — Regularização da empresa (pré-requisitos)

### A1. CNAE (com a contabilidade)
O contrato social precisa cobrir a atividade de **fabricante de produto para saúde**
(não só "TI"). CNAEs candidatos: desenvolvimento de software **6201-5/01 / 6202-3/00 /
6203-1/00** + atividade fabril de produto para saúde família **3250-7**.

**CNAEs atuais da Pocus Umuarama LTDA (a confirmar/atualizar):**
- Principal: **85.99-6-04** — Treinamento em desenvolvimento profissional e gerencial
- 63.19-4-00 — Portais, provedores de conteúdo e serviços de informação na internet
- 62.01-5-01 — Desenvolvimento de programas de computador sob encomenda
- 85.99-6-99 — Outras atividades de ensino não especificadas

> ⚠️ **GAP provável:** nenhum dos CNAEs atuais é de **fabricante de produto para
> saúde** (família 3250-7). Eles descrevem um negócio de **educação + conteúdo na
> internet** — adequado para operar o app como plataforma educativa, mas a AFE de
> SaMD exige a atividade de fabricante de dispositivo médico. Provável necessidade
> de **adicionar** o CNAE 3250-7 (+ 6202-3/00 ou 6203-1/00 para software-produto).
> Alternativa estratégica: avaliar com a GGTPS se o app, do jeito que é apresentado
> (forte componente educativo), pode ter escopo SaMD reduzido. **Decisão da
> empresa/contabilidade.**

→ ⚠️ CONFIRMAR em 3 frentes (gratuitas): **contabilidade** (qual CNAE de fabricante
adicionar), **VISA de Umuarama-PR** (aceitação do licenciamento) e **ANVISA
(Fala.BR / gquip@anvisa.gov.br)** (enquadramento e atividade esperada).

### A2. Licença/Alvará Sanitário (VISA de Umuarama-PR)
Exigida inclusive para software médico, e o **relatório de inspeção da VISA é o que
instrui a AFE**. Procure a Vigilância Sanitária municipal de Umuarama → cadastro do
estabelecimento → inspeção → emissão da licença.
→ ⚠️ CONFIRMAR na VISA-PR se há licenciamento simplificado para o seu CNAE (em geral
fabricante de produto para saúde **não** é baixo risco).

### A3. AFE — Autorização de Funcionamento (ANVISA) — **é exigida**
Não há dispensa por ser software nem por ser Classe I (a única dispensa é software
"in house" de serviço de saúde, não comercializado — não é o seu caso).
- Sistema: **Solicita** → https://solicita.anvisa.gov.br/solicita/
- **Assunto: 861 – AFE concessão produtos para saúde – fabricante**
- Documento-chave: **relatório de inspeção da VISA** (A2). Demais itens no checklist
  do assunto dentro do Solicita.
- Prazo médio ~30 dias.
- Portal AFE: https://www.gov.br/anvisa/pt-br/setorregulado/autorizacao-de-funcionamento-afe-ou-ae

### A4. Responsável Técnico (RT)
A RDC 16/2014 define RT como profissional habilitado pelo conselho da atividade —
**não nomeia engenheiro**; um **médico (CRM-PR) pode ser RT**. O RT é vinculado à
empresa no peticionamento da AFE, com comprovação de registro no conselho.
→ ⚠️ CONFIRMAR via Fala.BR/GGTPS que o **CRM-PR é aceito** como conselho do RT para
fabricante de SaMD (a norma não cita "médico" nominalmente).

### A5. e-CNPJ + Cadastro Anvisa + gov.br
- **e-CNPJ ICP-Brasil** ativo (assina os peticionamentos).
- **Cadastro Anvisa** da empresa (novas empresas, desde 14/04/2026):
  https://cadastro.anvisa.gov.br/
- Conta **gov.br** + designar gestor de segurança da empresa.

### A6. Porte da empresa (desconto da taxa — NÃO esquecer)
Atualize o porte **ME** (faturamento até R$ 360 mil → **95% de desconto na TFVS**) ou
**EPP** (até R$ 4,8 mi → **90%**) no Cadastro Anvisa, com **Certidão Simplificada
atualizada da Junta Comercial do PR**, **ANTES de gerar a GRU**.
> ⚠️ Sem porte comprovado, a taxa sai cheia (Grupo I, 0% desconto) e **não há
> reembolso**. Janela de atualização anual: 2/jan a 30/abr.

---

## FASE B — Dossiê técnico e classificação (você já tem quase tudo)

Mantenha **arquivado e disponível para fiscalização** (na notificação, não se anexa
o dossiê inteiro — fica em poder da empresa). Já criados em `docs/regulatorio/dossie/`:

| Item | Documento | Status |
|---|---|---|
| Destinação de uso | `destinacao-de-uso.md` | ✅ pronto (fixar Classe II) |
| Classificação de risco (Regra 11) | `dossie/00-indice.md` | ✅ documentar Classe II |
| Gestão de risco (ISO 14971) | `dossie/gestao-de-risco-iso14971.md` | ✅ modelo — RT assina |
| Ciclo de vida (IEC 62304) | `dossie/ciclo-de-vida-iec62304.md` | ✅ modelo — RT assina |
| Usabilidade (IEC 62366-1) | `dossie/usabilidade-iec62366.md` | ✅ modelo — RT assina |
| Rotulagem e IFU (RDC 751) | `dossie/instrucoes-de-uso-ifu.md` | ✅ modelo — RT assina |
| Cibersegurança (RDC 848/2024) | `dossie/ciberseguranca-rdc848.md` | ✅ modelo — RT assina |
| Validação clínica (evidência) | `docs/clinico/` | ⏳ você valida as 161 posologias |

**Pendências da Fase B (você):**
1. Validar as 161 posologias (checklist entregue) + resolver a atropina.
2. Finalizar os `[PREENCHER]` (versão, datas) e **assinar** o dossiê como RT.
3. ⚠️ CONFIRMAR as **edições vigentes** das normas ABNT (ISO 14971 / IEC 62304 /
   IEC 62366-1) no catálogo ABNT (são pagas): https://www.abntcatalogo.com.br
4. Cumprir a **RDC 665/2022 (SGQ/BPF)** nos itens cabíveis — o **certificado (CBPF)**
   é dispensado para Classe I/II, mas o cumprimento deve estar documentado.

---

## FASE C — Peticionar a notificação (o ato em si)

### C1. Login
Acesse o **Solicita** (https://solicita.anvisa.gov.br/solicita/) via **gov.br** +
Cadastro Anvisa, e selecione a empresa.
Passo a passo oficial: https://www.gov.br/anvisa/pt-br/sistemas/peticionamento/arquivos/passo-a-passo-peticionamento

### C2. Assunto
Selecione **80272 – EQUIPAMENTO – Notificação de Software Médico Classe I ou II**
(um único código cobre I e II).
(Alteração futura: **80271**.) Tabela de códigos:
https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/produtos-para-a-saude/formularios-1/codigos-de-assuntos-peticionamento.pdf

### C3. Formulário + anexos
- Baixe e preencha o **Formulário para Notificação de Software (RDCs 751 e 657/22)**:
  https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/produtos-para-a-saude/formularios-1/formulario-para-notificacao-de-software-rdcs-751-e-657-22.docx
- Anexe **todos os itens do checklist vinculado ao 80272** dentro do Solicita
  (itens não aplicáveis → anexar arquivo justificando). ⚠️ CONFIRMAR no checklist do
  Solicita + Manual GQUIP o que **anexar** vs. apenas **arquivar**.

### C4. Taxa (GRU)
**Gere a GRU dentro do Solicita** (o valor do assunto 80272 já sai calculado por
assunto + porte) e pague via **PagTesouro** em até 30 dias.
> ⚠️ CONFIRMAR o valor exato — o Anexo I da RDC 857/2024 não traz linha "notificação"
> nominal; o valor aparece ao gerar a GRU. Como **ME** você paga ~5% do base; **EPP**
> ~10%. (LTDA não é isenta; o desconto é o de porte.)

### C5. Protocolo e DOU
- Após o pagamento, o **protocolo é automático** e o número sai em **até 30 dias**.
- A concessão é **publicada no DOU** e fica em https://consultas.anvisa.gov.br/
- **Só comercialize APÓS a publicação no DOU** — protocolar não basta.

---

## Parte 6 — Canais gratuitos da ANVISA (para confirmar tudo sem consultoria)

| Recurso | Link / contato |
|---|---|
| **Perguntas & Respostas RDC 657/2022 (SaMD)** — leitura obrigatória | https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/software-como-dispositivo-medico-perguntas-e-respostas |
| **Manual GQUIP** (regularização de equip. médico e SaMD) | https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/produtos-para-a-saude/manuais/manual-regularizacao-gquip/view |
| P&R RDC 751/2022 (classificação) | https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/produtos-para-a-saude/manuais/perguntas-respostas-rdc-751-de-2022 |
| E-mail técnico GQUIP | **gquip@anvisa.gov.br** |
| Central de Atendimento ANVISA | **0800 642 9782** |
| Ouvidoria / Fala.BR (dúvidas formais) | https://falabr.cgu.gov.br |
| Cursos gratuitos (AVA-Visa, com certificado) | https://aprendizagem.anvisa.gov.br |
| Sistemas: Solicita / Cadastro Anvisa / Consultas | solicita.anvisa.gov.br · cadastro.anvisa.gov.br · consultas.anvisa.gov.br |

---

## Pegadinhas (erros de quem faz sozinho)

1. Notificar como **Classe I** quando é **II** → cancelamento. Documente Classe II.
2. Confundir **notificação** (I/II) com **registro** (III/IV).
3. Peticionar o produto **sem AFE/RT** prontos → resolva a empresa primeiro.
4. **CNAE** só de "TI", sem fabricante de produto para saúde → trava na AFE/VISA.
5. **Não comprovar o porte antes da GRU** → paga taxa cheia, sem reembolso.
6. **Falhas documentais** (formulário incompleto, assinatura inválida, IFU/rotulagem
   incompleta) → principal motivo de exigência/indeferimento.
7. **Comercializar antes da publicação no DOU**.
8. Ignorar **cibersegurança (RDC 848/2024)** num app web com dados clínicos.

---

## ✅ Checklist de pré-requisitos (empresa)

- [ ] CNAE cobre "fabricante de produto para saúde" (3250-7) — ⚠️ **os CNAEs atuais (85.99 educação, 63.19 conteúdo, 62.01 software sob encomenda) NÃO cobrem**; provável necessidade de adicionar (contabilidade + Junta + VISA)
- [ ] Licença/Alvará Sanitário (VISA de Umuarama-PR) + relatório de inspeção
- [ ] AFE concedida (assunto **861**, fabricante)
- [ ] RT definido (Dr. Eder, CRM-PR) + registro no conselho — CRM aceito? (⚠️ confirmar)
- [ ] e-CNPJ ICP-Brasil ativo
- [ ] Cadastro Anvisa + conta gov.br + gestor de segurança
- [ ] **Porte ME/EPP atualizado** (Certidão Simplificada) antes da GRU
- [ ] RDC 665/2022 (SGQ) documentado
- [ ] Dossiê arquivado e **assinado pelo RT**
- [ ] Classe de risco = **II** documentada (Regra 11)

## ✅ Checklist de execução (notificação)

- [ ] Login no Solicita (gov.br + Cadastro Anvisa)
- [ ] Assunto **80272**
- [ ] Formulário de Notificação de Software preenchido
- [ ] Anexos do checklist do 80272 (justificar não aplicáveis)
- [ ] GRU gerada (valor já com desconto de porte) e paga em ≤ 30 dias
- [ ] Protocolo automático
- [ ] Publicação no DOU (consultas.anvisa.gov.br)
- [ ] Comercializar **só após** o DOU

---

## Itens a confirmar (use a Parte 6)

1. **Valor em R$ da TFVS do assunto 80272** → gerar a GRU no Solicita ou gquip@anvisa.gov.br.
2. **CRM aceito como RT** de fabricante de SaMD → Fala.BR/GGTPS.
3. **Itens de rotulagem/IFU a anexar vs. arquivar** → checklist do 80272 + Manual GQUIP.
4. **Edições vigentes** ISO 14971 / IEC 62304 / IEC 62366-1 → catálogo ABNT.
5. **Classe de risco final** do app → GGTPS (piso Classe II).
6. **Artigo de cibersegurança** da RDC 848/2024 → texto integral no Datalegis.
