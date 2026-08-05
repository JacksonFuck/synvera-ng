# Conformidade regulatória — levantamento consolidado e GAPS para publicação

> Documento consolidado a partir de pesquisa verificada em fontes oficiais
> (gov.br/anvisa, datalegis, sistemas.cfm.org.br, gov.br/anpd, planalto, DOU),
> **junho de 2026**. **Não substitui** consultoria de Assuntos Regulatórios e
> parecer jurídico — é o mapa para conduzir essas contratações com precisão.
> Supera, no que conflitar, o `anvisa-samd-roteiro.md` (mantido como introdução).

**Detentor:** Pocus Umuarama LTDA — CNPJ 62.838.665/0001-26
**Responsável técnico (conteúdo clínico):** Dr. Eder Abelha Flavio — CRM-PR 42907 ·
RQE 37954 (Medicina de Emergência)

---

## 0. Veredito

O lançamento depende de **três frentes**: (1) **ANVISA/SaMD** — a mais longa,
exige regularizar a empresa + notificar o produto; (2) **conformidade ético-legal
do conteúdo** — disclaimers CFM (incl. a nova resolução de IA), validação clínica
e ajustes no receituário; (3) **proteção de dados / consumidor** — em grande parte
já encaminhada, com flexibilizações de **pequeno porte**. Nenhum gap é
intransponível; vários são de **código** (eu faço) e vários são **externos**
(consultoria/registro/advogado).

---

## 1. Correções ao roteiro inicial (verificadas)

| No roteiro eu disse… | Correto (verificado) |
|---|---|
| Antimicrobianos: RDC 20/2011 | **RDC 471/2021** (revogou a 20/2011); mantém 2 vias + retenção |
| RT talvez precise ser engenheiro | **RDC 16/2014, art. 2º**: RT é profissional habilitado no conselho pertinente — **pode ser médico (CRM)**. Não há reserva de engenharia |
| CBPF/BPF na RDC 665/2022 por classe | A **exigência por classe** está na **RDC 751/2022 (arts. 13-14)** + RDC 687/2022. III/IV → CBPF; **I/II → só declaração de BPF**. A 665/2022 traz os *requisitos* de BPF |
| "Educativo" é exclusão expressa de SaMD | Não é inciso de exclusão; software educativo/de exibição fica fora por **não atender à definição** de dispositivo médico (fundamentação diferente) |
| (geral) IA sem norma | **ANVISA**: sem norma final de IA (só minuta). **CFM**: **nova Resolução 2.454/2026** sobre IA/apoio à decisão (vacatio até ~ago/2026) — relevante para nós |
| ISO 14971 | Versão vigente **ABNT NBR ISO 14971:2020** |

⚠️ **Limite Classe I × II:** não assuma que "app só para médico" é Classe I.
**Gerar prescrição** e **calcular dose com função fisiológica** podem caracterizar
**Classe II**. O enquadramento depende da **destinação de uso declarada**.

---

## 2. Normas vigentes por órgão (verificadas em jun/2026)

### 2.1 ANVISA — Dispositivo Médico / SaMD
| Norma | Objeto | Status |
|---|---|---|
| **RDC 657/2022** | Regularização de SaMD; framework de risco | Vigente (minuta de revisão p/ IA em consulta) |
| **RDC 751/2022** | Classificação I-IV, notificação/registro, rotulagem/IFU, BPF por classe | Vigente (alt. RDC 884/2024 — UDI) |
| **RDC 848/2024** | Requisitos essenciais de segurança/desempenho + **cibersegurança** | Vigente (revogou a 546/2021) |
| **RDC 665/2022** | Requisitos de BPF | Vigente |
| **RDC 687/2022** | Certificado de BPF (CBPF) — classes III/IV | Vigente |
| **RDC 16/2014** | AFE/AE de empresas (define o RT) | Vigente (alt. 860/2024, 1.015/2026) |
| **RDC 67/2009 + 551/2021** | **Tecnovigilância** (pós-mercado) via **Notivisa** | Vigente |
| **Lei 9.782/1999** | Cria ANVISA e a **TFVS** | Vigente |
| Normas técnicas | **ISO 14971:2020** (risco), **IEC 62304** (ciclo de vida SW), **IEC 62366-1:2022** (usabilidade) | Referenciadas pela RDC 657 |

### 2.2 CFM / Receituário
| Norma | Objeto | Status |
|---|---|---|
| **Res. CFM 2.454/2026** | **IA / apoio à decisão clínica na medicina** | Publicada; **vacatio 180 dias** (eficácia ~ago/2026) |
| **Res. CFM 2.314/2022** | Telemedicina | **Vigente** (não revogada) |
| **Res. CFM 2.299/2021** | Prescrição/documentos eletrônicos; **ICP-Brasil NGS2** | Vigente |
| **Res. CFM 2.381/2024** | Dados obrigatórios dos documentos médicos | Vigente |
| **CEM — Res. CFM 2.217/2018** | Responsabilidade **pessoal** do médico; prescrição é ato privativo | Vigente |
| **RDC ANVISA 471/2021** | **Antimicrobianos**: 2 vias + retenção | Vigente (revogou 20/2011) |
| **Portaria SVS/MS 344/1998** | Controle especial (controlados) | Vigente (alt. RDC 1.000/2025; listas RDC 1.011/2026) |
| **RDC 1.000/2025 + 1.028/2026** | Receituários controlados eletrônicos; **SNCR** (prazo 30/09/2026) | Vigente |

### 2.3 Proteção de dados / consumidor / outros
| Norma | Objeto | Aplicação ao caso |
|---|---|---|
| **LGPD 13.709/2018** | Proteção de dados | Aplica integralmente; **CPF = dado comum** (não sensível) |
| **Res. CD/ANPD 2/2022** | Agente de **pequeno porte** | **Dispensa DPO**, ROPA simplificado, prazos em dobro |
| **Res. CD/ANPD 15/2024** | Incidentes | Notificar em **6 dias úteis** (pequeno porte) se risco relevante |
| **Res. CD/ANPD 18/2024** | Encarregado | Publicar **canal do titular** (já temos o DPO nomeado) |
| **Res. CD/ANPD 19/2024** | **Transferência internacional** | Crítico **só se hospedar fora do BR** |
| **Marco Civil 12.965/2014** | Logs de acesso **6 meses**; Termos/Política | Aplica (provedor PJ com fins econômicos) |
| **CDC 8.078/1990 art. 49 + Decreto 7.962/2013** | E-commerce; arrependimento 7 dias | **Só quando houver cobrança** |
| **LC 116/2003 (item 1.05)** | ISS sobre SaaS → **NFS-e** | **Só quando houver cobrança** |
| **LBI 13.146/2015 art. 63** | **Acessibilidade digital** (WCAG/NBR 17225) | Aplica a empresa com sede no BR |

---

## 3. Caminho ANVISA mais provável (Classe I/II → Notificação)

1. **Destinação de uso** formal (ver `destinacao-de-uso.md`) — define a classe.
2. **Regularizar a empresa:** Licença/Alvará Sanitário (VISA municipal) → **AFE**
   (RDC 16/2014) → **RT** habilitado (você, CRM-PR 42907) → **e-CNPJ ICP-Brasil** →
   CNAE de software médico.
3. **Dossiê técnico:** ISO 14971:2020, IEC 62304, IEC 62366-1, RDC 848/2024
   (segurança/desempenho + cibersegurança), rotulagem/IFU (RDC 751). Classe I/II →
   **declaração de BPF** (sem CBPF).
4. **Peticionamento Eletrônico (Solicita/gov.br)** + pagar **TFVS** (com porte
   ME/EPP) → **Notificação** (sem análise prévia, efeito quase imediato).
5. **Pós-mercado:** tecnovigilância (RDC 67/2009 + 551/2021) via **Notivisa**.

---

## 4. GAP LIST consolidada (priorizada)

Legenda: 🔴 bloqueia publicação · 🟠 bloqueia venda (cobrança) · 🔵 código (eu faço) ·
🟢 já pronto.

### A. ANVISA / SaMD — 🔴 (frente mais longa)
1. 🔴 **Enquadramento + classe** confirmados por consultoria (a partir da destinação de uso).
2. 🔴 **Regularização da empresa:** Licença Sanitária + **AFE** + RT + e-CNPJ + CNAE.
3. 🔴 **Dossiê técnico** (ISO 14971 / IEC 62304 / IEC 62366-1 / RDC 848 / IFU) + **declaração de BPF**.
4. 🔴 **Notificação** do produto + **TFVS**.
5. 🔴 **Plano de tecnovigilância** + cadastro **Notivisa**.
6. 🔵 **Triagem função-a-função** (o que é SaMD vs educativo) — posso ajudar a documentar e a separar os módulos no app/IFU.

### B. CFM / conteúdo clínico
7. 🔴 **Validação clínica das 161 posologias** por você (RT) — checklist já entregue (`docs/clinico/`). Inclui a **pendência da atropina**.
8. 🔵 **Disclaimers da CFM 2.454/2026 (IA/apoio à decisão):** decisão final do médico, supervisão humana, sem comunicação autônoma ao paciente, responsabilidade pessoal. **Posso adicionar ao disclaimer/Termos.**
9. 🔵 **Disclaimer "não é telemedicina"** (CFM 2.314/2022) explícito. **Posso adicionar.**
10. 🔵 **Receituário — antimicrobianos em 2 vias** (RDC 471/2021): hoje imprime 1 via. **Posso implementar opção de 2 vias.**
11. 🔵 **Validade por classe** no receituário (antimicrobiano 10 dias; comum conforme tratamento) em vez de genérico. **Posso implementar.**
12. 🔵 **Dados obrigatórios completos** na receita (DCB/genérico, concentração, forma, posologia, quantidade em algarismos, CRM/UF + endereço/telefone do emitente). **Posso reforçar.**
13. 🟢 Imprimir para **assinatura manuscrita** → **dispensa** ICP-Brasil, SNCR e RNDS. Mantido — é a rota mais simples.
14. 🟢 **Controlados** já fora do escopo (catálogo não inclui Portaria 344/98).

### C. LGPD / dados
15. 🟢 **Política de Privacidade + Termos** publicados (já feito).
16. 🟢 **Encarregado/DPO** nomeado (você indicou o Lucas) + canal do titular publicado.
17. 🔵 **Registro de operações (ROPA) simplificado** — posso gerar um modelo preenchido.
18. 🔵 **Plano de resposta a incidentes** (notificar ANPD/titulares em 6 dias úteis) — posso redigir um procedimento.
19. 🟢 **Transferência internacional:** **mitigado** — o banco (Supabase) está na região **São Paulo/Brasil (sa-east-1)**. Confirmar que e-mail/sub-processadores também não exportam dados; o DPA com Vercel (hospedagem do front estático) deve referenciar cláusulas-padrão se houver tratamento fora do BR.
20. 🔵 **Logs de acesso por 6 meses** (Marco Civil art. 15) — verificar se Supabase/Vercel retêm e por quanto; pode exigir configuração.

### D. Acessibilidade — 🔵
21. 🔵 **Acessibilidade WCAG 2.2 / NBR 17225** (LBI art. 63) — auditar e corrigir contraste, labels, navegação por teclado, foco. **Posso fazer uma auditoria e correções no app.**

### E. Venda (quando houver cobrança) — 🟠
22. 🟠 **Informações do fornecedor** (Decreto 7.962 art. 2º): razão social, CNPJ, endereço, contato, preço total — já temos os dados; falta a tela de checkout.
23. 🟠 **Sumário do contrato + confirmação + direito de arrependimento 7 dias** (CDC art. 49) com cancelamento facilitado.
24. 🟠 **Inscrição municipal + NFS-e** (ISS) para a assinatura.

---

## 5. O que já joga a favor

- **Banco hospedado no Brasil** (Supabase sa-east-1) → reduz drasticamente o risco de transferência internacional.
- **Sem persistência de dados de paciente** (receituário stateless) → fora do regime de dados sensíveis e reduz escopo SaMD/LGPD.
- **Pequeno porte** (LGPD) → dispensa DPO formal, ROPA simplificado, prazos em dobro.
- **Disclaimers + consentimento + Política/Termos** já implementados e publicados.
- **RT clínico definido** (você) com RQE em Emergência.
- **Impressão para assinatura manuscrita** → dispensa ICP-Brasil/SNCR/RNDS.

---

## 6. Próximas ações sugeridas (ordem)

1. **Código (eu faço agora, se você quiser):** disclaimers CFM 2.454/2026 + "não é telemedicina"; receituário em 2 vias p/ antimicrobiano + validade por classe; ROPA + plano de incidentes; auditoria de acessibilidade.
2. **Você (RT):** validar as 161 posologias (checklist entregue) + atropina.
3. **Contratar consultoria de Assuntos Regulatórios** → enquadramento/classe + dossiê + notificação ANVISA.
4. **Regularizar a empresa** na VISA local + AFE.
5. **Advogado:** revisar Política/Termos e, quando for cobrar, montar checkout/CDC + NFS-e.
