# Política de Privacidade — GuiaMed AMPLE

**Última atualização:** 20 de junho de 2026 · **Versão:** 1

Esta Política de Privacidade descreve como o **GuiaMed AMPLE** ("aplicativo",
"nós") trata os dados pessoais dos seus usuários, em conformidade com a Lei nº
13.709/2018 (Lei Geral de Proteção de Dados Pessoais — "LGPD").

Ao criar uma conta e utilizar o aplicativo, você declara ter lido e compreendido
esta Política.

---

## 1. Quem é o controlador dos dados

O controlador é **Pocus Umuarama LTDA** (nome fantasia "Pocus Umuarama"),
inscrita no CNPJ sob o nº **62.838.665/0001-26**, com sede na Rua Maria Lopes
Tosta, 1806, Conjunto Residencial Portal das Águas, Umuarama/PR — CEP 87504-740.

Aplicativo: **GuiaMed AMPLE** — disponível em https://guia.pocusumuarama.com.br

## 2. Encarregado pelo Tratamento de Dados (DPO)

Em atendimento ao art. 41 da LGPD, o Encarregado (Data Protection Officer) é:

- **Nome:** Lucas Henrique Costa Flavio
- **E-mail de contato do titular:** pocusumuarama@gmail.com
- **Telefone (resposta mais rápida):** (44) 99937-7643

Use este canal para exercer seus direitos (Seção 8) ou esclarecer dúvidas sobre
o tratamento dos seus dados.

## 3. Quais dados coletamos

O aplicativo destina-se a **profissionais e estudantes da área da saúde**. No
cadastro e no uso, coletamos:

**Dados de identificação e cadastro:**
- Nome completo, e-mail e senha (a senha é armazenada de forma irreversível pelo
  provedor de autenticação — nunca temos acesso à senha em texto).
- **CPF** — utilizado apenas para validar a unicidade e a legitimidade do
  cadastro. **O CPF nunca é armazenado em texto puro:** guardamos apenas um
  *hash* criptográfico (HMAC-SHA256) e uma versão mascarada (ex.: `123.***.***-00`).
- Telefone/WhatsApp, cidade e país de residência.

**Dados profissionais:**
- Profissão, especialidade e registro no conselho de classe (tipo, número e UF,
  ex.: CRM). Para estudantes: instituição de ensino e período.

**Registro de consentimento:**
- Data/hora do aceite desta Política e dos Termos de Uso e a versão aceita.

**Conteúdo gerado por você:**
- Sugestões de posologia que você opte por compartilhar com a comunidade
  (associadas à sua conta), modelos de receita e cabeçalho de receituário
  (estes últimos salvos **apenas no seu navegador**).

**Dados técnicos:**
- Para fins antiabuso no cadastro, registramos um *hash* do endereço IP (nunca o
  IP em texto), retido por tempo limitado.

> **Dados de pacientes:** o gerador de receituário funciona **localmente no seu
> dispositivo**. Nome e idade do paciente **não são enviados nem armazenados** em
> nossos servidores — a receita é montada e impressa no seu navegador.

## 4. Dados que NÃO tratamos como "sensíveis" do titular

O aplicativo trata dados de **identificação e qualificação profissional** do
usuário, e **não coleta dados de saúde do próprio usuário**. Caso, no futuro,
passe a tratar dados de saúde de terceiros (pacientes), esta Política será
atualizada e serão adotadas as salvaguardas adicionais exigidas pelo art. 11 da
LGPD.

## 5. Para que usamos os dados e com qual base legal

| Finalidade | Dados | Base legal (LGPD) |
|---|---|---|
| Criar e manter sua conta; autenticar o acesso | Cadastro, e-mail, senha | Execução de contrato (art. 7º, V) |
| Validar a legitimidade do cadastro e evitar duplicidade/fraude | CPF (hash), registro de conselho | Legítimo interesse (art. 7º, IX) |
| Antiabuso (limitar tentativas de cadastro) | Hash do IP | Legítimo interesse (art. 7º, IX) |
| Disponibilizar e melhorar funcionalidades (quiz, posologias da comunidade) | Conteúdo contribuído, uso | Execução de contrato / legítimo interesse |
| Cumprir obrigações legais e regulatórias | Conforme aplicável | Obrigação legal (art. 7º, II) |
| Registrar o consentimento | Data/hora e versão aceitas | Cumprimento legal / comprovação |

## 6. Compartilhamento e operadores (sub-processadores)

Não vendemos seus dados. Compartilhamos o estritamente necessário com prestadores
que atuam como **operadores**, sob contrato:

- **Supabase** — infraestrutura de banco de dados e autenticação. Hospedagem na
  região **São Paulo, Brasil (sa-east-1)**.
- **Vercel** — hospedagem e entrega do aplicativo web.
- **Supabase (serviço de e-mail transacional)** — envio de e-mails de
  confirmação de cadastro e recuperação de senha.
- **Serviço de IA (Google Gemini)** e **serviço de *embeddings*** — utilizados
  para funcionalidades internas (geração/curadoria de conteúdo). **Não enviamos
  dados pessoais de cadastro a esses serviços** — apenas conteúdo clínico/textual
  da própria ferramenta.

Poderemos divulgar dados quando exigido por lei, ordem judicial ou autoridade
competente.

## 7. Transferência internacional

Os dados de cadastro são hospedados **no Brasil** (Supabase, região São Paulo).
Caso algum operador venha a processar dados fora do país, isso ocorrerá apenas com
as garantias previstas no art. 33 da LGPD.

## 8. Seus direitos como titular (art. 18 da LGPD)

Você pode, a qualquer tempo e gratuitamente, solicitar: confirmação da existência
de tratamento; acesso aos dados; correção de dados incompletos/desatualizados;
anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade;
informação sobre compartilhamentos; e revogação do consentimento.

Para exercer seus direitos, contate o Encarregado (Seção 2). Poderemos solicitar
informações para confirmar sua identidade antes de atender ao pedido.

## 9. Retenção e eliminação

Mantemos os dados enquanto sua conta estiver ativa e pelo tempo necessário às
finalidades desta Política e ao cumprimento de obrigações legais. Encerrada a
conta, os dados são eliminados ou anonimizados em prazo razoável, ressalvada a
guarda mínima exigida por lei. O *hash* do endereço IP usado para antiabuso é
retido por período curto (atualmente, alguns dias) e então descartado.

## 10. Segurança

Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
controle de acesso por linha (RLS) no banco; armazenamento do CPF apenas como
*hash* com segredo dedicado (nunca em texto); criptografia em trânsito (HTTPS/HSTS);
e princípio do menor privilégio nos acessos administrativos.

Nenhum sistema é 100% imune. Em caso de incidente de segurança relevante,
adotaremos as providências e comunicações exigidas pela LGPD e pela ANPD.

## 11. Cookies e armazenamento local

Utilizamos armazenamento local do navegador (*localStorage*) para manter sua
sessão, o aceite do aviso médico e preferências (ex.: cabeçalho do receituário).
Não utilizamos cookies de rastreamento publicitário nem ferramentas de analytics
de terceiros.

## 12. Crianças e adolescentes

O aplicativo destina-se a profissionais e estudantes da saúde maiores de 18 anos.
Não coletamos intencionalmente dados de menores.

## 13. Alterações nesta Política

Podemos atualizar esta Política. Mudanças relevantes serão comunicadas e, quando
exigido, solicitaremos novo aceite. A versão vigente é identificada no topo deste
documento.

## 14. Contato

Dúvidas sobre esta Política ou sobre seus dados: **pocusumuarama@gmail.com** ·
(44) 99937-7643 · Instagram [@pocusumuarama](https://instagram.com/pocusumuarama).

Foro: comarca de Umuarama/PR. Lei aplicável: legislação brasileira.
