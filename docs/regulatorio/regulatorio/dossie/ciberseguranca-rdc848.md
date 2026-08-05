# Segurança e Cibersegurança — GuiaMed AMPLE (RDC 848/2024)

> Modelo pré-preenchido com os controles efetivamente implementados (confirmados em
> revisão de segurança). Revisar e assinar (RT).

**Produto:** GuiaMed AMPLE (SaMD) · **Versão:** [PREENCHER] · **Data:** [PREENCHER]

## 1. Princípios

Segurança proporcional ao risco, defesa em profundidade, menor privilégio,
minimização de dados e segurança desde a concepção. O produto **não trata dados de
paciente** e armazena dados de cadastro com forte minimização.

## 2. Arquitetura de segurança

- **Autorização ancorada no banco (RLS):** todas as tabelas com Row Level Security
  habilitada; o controle de acesso é validado no servidor (não apenas no front).
- **Anti-escalonamento de privilégio:** trigger impede usuário não-admin de alterar
  papel/aprovação/colunas privilegiadas; função `is_admin` em schema não exposto.
- **Edge Functions autenticadas:** verificação de assinatura do JWT no gateway
  (`verify_jwt`) e comparação em tempo constante do token de serviço
  (`isServiceRole`) — não confia em claim não verificado.
- **Segredos:** a `service_role key` **nunca** está no front (apenas a chave
  pública/anon, por design). Segredos em variáveis de ambiente/Vault.

## 3. Proteção de dados pessoais (alinhado à LGPD)

- **CPF** armazenado **apenas como hash (HMAC-SHA256 + pepper dedicado)** e versão
  mascarada — nunca em texto puro; não entra em logs/backups de auth.
- Criação de usuário via service role para manter o CPF fora de
  `auth.users.raw_user_meta_data`.
- Validação **server-side autoritativa** no cadastro (CPF, telefone, senha, etc.).
- **Rate limit** no cadastro por hash do IP (anti-abuso), com retenção curta.
- **Trilha de auditoria** append-only para ações administrativas.

## 4. Segurança da aplicação web

- **HTTPS/HSTS** obrigatórios (`Strict-Transport-Security` com preload).
- **Content Security Policy (CSP)** restritiva: `script-src 'self'`,
  `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`,
  `connect-src` limitado ao backend.
- Cabeçalhos: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy` restritiva.
- **Sem XSS:** nenhum uso de `dangerouslySetInnerHTML`/`eval`; dados de
  usuário/comunidade renderizados como texto (auto-escapado).
- **Sem SSRF:** funções de servidor só acessam domínios fixos (não controlados pelo
  usuário).
- **Política de senha:** mínimo de 10 caracteres com letras e números (app +
  servidor), alinhada ao provedor de autenticação.

## 5. Gestão de dependências (SOUP)

- Dependências de produção mínimas e atuais (ver `ciclo-de-vida-iec62304.md`).
- `npm audit` periódico; última verificação sem vulnerabilidades em produção.

## 6. Hospedagem e dados em repouso/trânsito

- Banco e autenticação no **Supabase, região São Paulo/Brasil**; criptografia em
  trânsito (TLS).
- Sem persistência de dados de paciente.

## 7. Resposta a incidentes

Procedimento de detecção, contenção, avaliação de risco e comunicação à ANPD e aos
titulares em até 6 dias úteis (pequeno porte) descrito em
`../../lgpd/plano-resposta-incidentes.md`.

## 8. Itens a confirmar / pendências

- [ ] Confirmar a retenção de **logs de acesso** (Marco Civil — 6 meses) no provedor.
- [ ] Habilitar proteção contra senhas vazadas (HaveIBeenPwned) — recurso de plano
      pago do provedor; reavaliar em upgrade.
- [ ] Revisão periódica de segurança e atualização deste documento.

**Aprovação do RT:** ____________________ · Data: __/__/____
