# Plano de Resposta a Incidentes de Segurança com Dados Pessoais

> Documento **interno** de conformidade (LGPD art. 48; Res. CD/ANPD nº 15/2024;
> flexibilizações de pequeno porte da Res. CD/ANPD nº 2/2022). Define como
> detectar, conter, avaliar, comunicar e registrar incidentes. **Não publicado aos
> usuários.** Revisar anualmente ou após cada incidente.

- **Controlador:** Pocus Umuarama LTDA — CNPJ 62.838.665/0001-26
- **Encarregado (DPO) / responsável pela resposta:** Lucas Henrique Costa Flavio —
  pocusumuarama@gmail.com · (44) 99937-7643
- **Apoio técnico:** [PREENCHER: responsável técnico de TI / desenvolvedor]
- **Última atualização:** 20 de junho de 2026 · **Versão:** 1

---

## 1. O que é um incidente

Evento de segurança que possa acarretar acesso não autorizado, perda, alteração,
divulgação ou destruição de dados pessoais — acidental ou ilícito. Exemplos no
contexto do GuiaMed AMPLE:

- Vazamento/exposição da base do Supabase (ex.: chave `service_role` comprometida,
  falha de RLS, exportação indevida).
- Exposição de `cpf_hash`/dados de cadastro.
- Comprometimento de conta de administrador.
- Acesso indevido às Edge Functions / segredos (CPF_PEPPER, tokens do Vault).
- Vazamento por operador (Supabase/Vercel) comunicado por eles.

## 2. Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| **Encarregado (DPO)** | Lucas Henrique Costa Flavio | Conduz a resposta; decide sobre comunicação à ANPD/titulares; registra o incidente |
| **Apoio técnico** | [PREENCHER] | Contém, investiga, coleta evidências, corrige |
| **Sócio/administrador** | Dr. Eder Abelha Flavio | Decisões de negócio e jurídicas |

## 3. Fluxo de resposta

### Passo 1 — Detecção e registro (imediato)
Qualquer pessoa que perceba um incidente comunica o Encarregado **imediatamente**
(e-mail/telefone acima). Abrir um registro com: data/hora da detecção, quem
detectou, descrição, sistemas afetados.

### Passo 2 — Contenção (até horas)
- Revogar/rotacionar credenciais comprometidas (service_role key, CPF_PEPPER,
  tokens do Vault, senhas de admin).
- Bloquear o vetor (ex.: desabilitar função, revogar sessão, fechar exposição).
- Preservar evidências (logs, prints, horários) antes de corrigir.

### Passo 3 — Avaliação de risco
Determinar **categorias e volume** de dados afetados e o **risco aos titulares**.
Gatilho de comunicação (Res. 15/2024, art. 5º): incidente que possa acarretar
**risco relevante** aos direitos e liberdades dos titulares. Considerar: havia
dado sensível? (no app, **não** — CPF é comum e fica em hash); houve exposição de
dado que permita fraude/dano? qual a abrangência?

> Mitigante do app: CPF só em **hash**; sem dados de paciente; banco no Brasil.
> Isso tende a **reduzir** a classificação de risco — mas a avaliação é caso a caso.

### Passo 4 — Comunicação (se risco relevante)
**Prazo (pequeno porte): até 6 dias úteis** a contar do conhecimento de que o
incidente afetou dados pessoais (Res. 15/2024 art. 6º §8º / art. 9º §6º — dobro do
prazo geral de 3 dias úteis).

1. **ANPD** — pelo canal/formulário oficial (gov.br/anpd). Conteúdo mínimo:
   natureza do incidente, dados/titulares afetados (categorias e número), medidas
   adotadas, riscos e medidas de mitigação, dados de contato do Encarregado.
2. **Titulares afetados** — quando houver risco relevante: comunicação clara, em
   linguagem acessível, com a natureza do incidente, os dados envolvidos, os
   riscos e as medidas/recomendações (ex.: trocar senha).

### Passo 5 — Correção e recuperação
Aplicar a correção definitiva, restaurar a operação segura, validar que o vetor
foi fechado.

### Passo 6 — Registro e revisão pós-incidente
Documentar o incidente completo (linha do tempo, causa-raiz, dados afetados,
comunicações feitas, correções). Atualizar controles para evitar recorrência.
Guardar o registro (comprovação à ANPD).

## 4. Modelo de comunicação ao titular (rascunho)

> Assunto: Comunicado de incidente de segurança — GuiaMed AMPLE
>
> Prezado(a), identificamos em [data] um incidente de segurança que pode ter
> afetado os seguintes dados da sua conta: [categorias]. Já adotamos as seguintes
> medidas: [contenção/correção]. Recomendamos que você [ex.: redefina sua senha].
> Para dúvidas, contate nosso Encarregado: pocusumuarama@gmail.com. A Autoridade
> Nacional de Proteção de Dados (ANPD) foi/ não foi comunicada, conforme a avaliação
> de risco. Pocus Umuarama LTDA.

## 5. Contatos de operadores (para acionar/confirmar vazamento)

- **Supabase:** suporte/segurança da conta do projeto `aqzdqolvcayrmwptjtiw`.
- **Vercel:** suporte da conta de hospedagem.
- [PREENCHER: outros, se houver.]

## 6. Checklist rápido (em incidente)

- [ ] Encarregado avisado
- [ ] Credenciais comprometidas rotacionadas
- [ ] Vetor contido / evidências preservadas
- [ ] Dados e titulares afetados mapeados
- [ ] Risco relevante? (sim/não)
- [ ] Se sim: ANPD comunicada (≤ 6 dias úteis) e titulares comunicados
- [ ] Correção aplicada e validada
- [ ] Incidente registrado e revisão pós-incidente feita
