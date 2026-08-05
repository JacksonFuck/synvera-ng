# Registro das Operações de Tratamento de Dados Pessoais (ROPA)

> Documento **interno** de conformidade (LGPD art. 37; formato simplificado de
> agente de pequeno porte — Res. CD/ANPD nº 2/2022, art. 9º). **Não é publicado
> aos usuários.** Deve ser mantido atualizado pelo Encarregado e apresentado à
> ANPD se solicitado. Revisar a cada mudança no tratamento.

- **Controlador:** Pocus Umuarama LTDA — CNPJ 62.838.665/0001-26 — Rua Maria Lopes
  Tosta, 1806, Conjunto Residencial Portal das Águas, Umuarama/PR — CEP 87504-740.
- **Encarregado (DPO):** Lucas Henrique Costa Flavio — pocusumuarama@gmail.com ·
  (44) 99937-7643.
- **Porte:** agente de tratamento de **pequeno porte** (Res. ANPD 2/2022).
- **Aplicativo:** GuiaMed AMPLE — https://guia.pocusumuarama.com.br
- **Última atualização:** 20 de junho de 2026 · **Versão:** 1

---

## Operação 1 — Cadastro e autenticação de usuários

| Item | Descrição |
|---|---|
| **Finalidade** | Criar e manter a conta; autenticar o acesso; validar a legitimidade do cadastro profissional |
| **Titulares** | Profissionais e estudantes da área da saúde, maiores de 18 anos |
| **Dados pessoais** | Nome, e-mail, senha (armazenada como hash pelo provedor de auth), telefone, cidade, país, profissão, especialidade, registro de conselho (tipo/nº/UF), dados de estudante (instituição/período) |
| **Dado de atenção** | **CPF** — armazenado **apenas como hash (HMAC-SHA256 + segredo) e versão mascarada**; nunca em texto puro. Classificação: dado pessoal **comum** (não sensível) |
| **Base legal** | Execução de contrato (art. 7º, V) para conta/autenticação; legítimo interesse (art. 7º, IX) para validação de CPF/conselho e prevenção a fraude/duplicidade |
| **Operadores** | Supabase (banco + autenticação), região **São Paulo/Brasil (sa-east-1)**; provedor de e-mail transacional (Supabase) para confirmação/recuperação |
| **Compartilhamento** | Nenhum com terceiros para fins próprios; apenas operadores acima |
| **Transferência internacional** | **Não** (dados hospedados no Brasil) |
| **Retenção** | Enquanto a conta estiver ativa; após encerramento, eliminação/anonimização em prazo razoável, salvo guarda legal |
| **Segurança** | RLS por linha; hash de CPF com segredo dedicado; HTTPS/HSTS; menor privilégio; trigger anti-escalonamento de privilégio; auditoria de ações administrativas |

## Operação 2 — Registro de consentimento

| Item | Descrição |
|---|---|
| **Finalidade** | Comprovar o aceite da Política de Privacidade e dos Termos de Uso |
| **Dados** | `terms_accepted_at` (data/hora) e `privacy_version` (versão aceita), vinculados ao usuário |
| **Base legal** | Cumprimento de obrigação legal/regulatória; comprovação do consentimento (art. 8º, §1º) |
| **Operador / retenção / segurança** | Supabase (Brasil); retido enquanto a conta existir; mesmas medidas da Operação 1 |

## Operação 3 — Antiabuso do cadastro (rate limit)

| Item | Descrição |
|---|---|
| **Finalidade** | Limitar tentativas de cadastro por origem; evitar criação massiva de contas e flood de e-mails |
| **Dados** | **Hash do endereço IP** (HMAC + segredo) — nunca o IP em texto |
| **Base legal** | Legítimo interesse (art. 7º, IX) — segurança e prevenção a abuso |
| **Operador / retenção** | Supabase (Brasil, schema `private`, inacessível via API pública); retenção curta (dias), com limpeza automática |

## Operação 4 — Conteúdo da comunidade (posologias)

| Item | Descrição |
|---|---|
| **Finalidade** | Permitir que médicos compartilhem sugestões de posologia para curadoria e uso por outros profissionais |
| **Dados** | Conteúdo contribuído (texto de posologia) atribuível ao usuário contribuinte; contagem de uso |
| **Base legal** | Execução de contrato / legítimo interesse |
| **Compartilhamento** | Exibição a outros usuários (após curadoria), de forma agregada/anônima quando possível |
| **Operador / segurança** | Supabase (Brasil); escrita só via funções com checagem de autorização |

## Operação 5 — Quiz / progresso de estudo

| Item | Descrição |
|---|---|
| **Finalidade** | Registrar respostas para repetição espaçada (aprendizado) |
| **Dados** | Respostas do quiz vinculadas ao usuário |
| **Base legal** | Execução de contrato (funcionalidade do app) |
| **Operador / retenção** | Supabase (Brasil); enquanto a conta existir |

## Operação 6 — Auditoria administrativa

| Item | Descrição |
|---|---|
| **Finalidade** | Registrar ações administrativas (mudança de papel/aprovação, importação de usuários) para segurança e responsabilização |
| **Dados** | Identificação do administrador, ação, detalhes, data/hora |
| **Base legal** | Legítimo interesse / cumprimento de obrigação (segurança) |
| **Operador / segurança** | Supabase (Brasil); tabela append-only, leitura só por admin |

## Operação 7 — Logs de acesso à aplicação

| Item | Descrição |
|---|---|
| **Finalidade** | Cumprir o Marco Civil da Internet (Lei 12.965/2014, art. 15) |
| **Dados** | Registros de acesso (data/hora) gerados pela infraestrutura |
| **Base legal** | Cumprimento de obrigação legal (art. 7º, II) |
| **Retenção** | **6 meses**, sob sigilo |
| **Pendência operacional** | Confirmar onde os logs de acesso são retidos (Supabase/Vercel) e por quanto tempo; ajustar para 6 meses se necessário |

---

## Direitos dos titulares (canal)

Titulares exercem os direitos do art. 18 (acesso, correção, eliminação,
portabilidade, informação, revogação de consentimento) pelo canal do Encarregado:
**pocusumuarama@gmail.com**. Prazo de resposta: o da LGPD, **em dobro** por se
tratar de pequeno porte (Res. ANPD 2/2022, art. 14).

## Observações de pequeno porte (flexibilizações aplicadas)

- ROPA em **formato simplificado** (esta tabela).
- **Sem** indicação formal de Encarregado obrigatória; ainda assim foi nomeado e o
  canal do titular está publicado.
- **Prazos em dobro** para atender titular/ANPD e para comunicar incidentes.
