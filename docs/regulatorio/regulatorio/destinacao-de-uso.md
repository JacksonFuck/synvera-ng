# Destinação de Uso (Intended Use) — GuiaMed AMPLE

> Documento-base para o enquadramento regulatório (ANVISA/SaMD). A redação aqui é
> deliberadamente precisa porque **o texto da destinação de uso determina o
> enquadramento e a classe de risco**. Deve ser revisado com a consultoria de
> Assuntos Regulatórios antes de uso oficial.

## 1. Identificação

- **Produto:** GuiaMed AMPLE (aplicativo web / PWA)
- **Versão:** [PREENCHER a versão a notificar]
- **Detentor/desenvolvedor:** Pocus Umuarama LTDA — CNPJ 62.838.665/0001-26
- **Responsável técnico (conteúdo clínico):** Dr. Eder Abelha Flavio — CRM-PR
  42907 · RQE 37954 (Medicina de Emergência)
- **Disponível em:** https://guia.pocusumuarama.com.br

## 2. Destinação de uso (declaração)

O GuiaMed AMPLE é um **software de apoio à decisão clínica**, de uso por
**profissionais de saúde habilitados**, destinado a **fornecer informações de
referência e cálculos auxiliares** que **informam** — sem determinar ou substituir
— o julgamento clínico do profissional no cuidado de pacientes.

O aplicativo **não realiza diagnóstico autônomo**, **não toma decisões clínicas em
nome do profissional**, **não controla ou comanda qualquer equipamento médico** e
**não estabelece relação médico-paciente nem constitui ato de telemedicina**.

## 3. Usuário pretendido

Exclusivamente **profissionais de saúde habilitados** (médicos e demais profissões
da saúde) e **estudantes da área**, maiores de 18 anos. Não se destina ao público
leigo nem ao autocuidado por pacientes.

## 4. Ambiente de uso

Uso profissional em qualquer ambiente assistencial ou de estudo, em navegador web
/ dispositivo pessoal do profissional. Não integra prontuário, não persiste dados
de pacientes em servidor.

## 5. Funcionalidades e natureza de cada uma

| Módulo | Natureza | Significância da informação |
|---|---|---|
| Biblioteca, guias, POCUS, quiz | **Referência educativa** | Material educativo — tende a ficar **fora** do escopo SaMD |
| Calculadoras clínicas (renal, eletrólitos, ventilação) | Apoio à decisão | **Informa** o manejo (fornece um valor de referência) |
| Cálculos de dose (IOT/indução, sedação/infusão, pediátrica) | Apoio à decisão | **Informa** o manejo; o profissional confirma e aplica |
| Antibióticos (ATB), toxicologia, RCP | Referência + apoio | **Informa** o manejo |
| Receituário | **Ferramenta de formatação/impressão** | Não decide conduta; apenas organiza e imprime para assinatura |

> O posicionamento de todas as funções é de **"informar o manejo"** — o profissional
> sempre revisa, confirma e é o responsável pela conduta. Nenhuma função "trata,
> diagnostica ou dirige" automaticamente.

## 6. População e condições

Pacientes adultos e pediátricos sob cuidado de um profissional habilitado, em
qualquer condição clínica em que o profissional julgue útil consultar referência
ou cálculo auxiliar. As condições incluem situações críticas (emergência), mas a
informação fornecida é sempre **auxiliar e confirmável** pelo profissional.

## 7. Princípio de funcionamento

O aplicativo aplica fórmulas e parâmetros consolidados (ancorados em fontes como
FTN/MS, RENAME, bulas e diretrizes de sociedades) a valores inseridos pelo
profissional (ex.: peso, idade, creatinina), retornando um resultado de
referência que o profissional avalia criticamente antes de qualquer conduta.

## 8. Limitações e contraindicações de uso

- Não substitui o julgamento clínico, a avaliação individual do paciente nem as
  fontes oficiais (bula/diretrizes).
- Não deve ser a única base para qualquer decisão clínica.
- O conteúdo pode conter imprecisões; o profissional deve conferir antes de usar.
- Não gera receituário de medicamentos de controle especial (Portaria 344/98) e
  alerta que antimicrobianos exigem receituário próprio.
- Não se destina a uso por leigos/pacientes.

## 9. Advertências (rotulagem / IFU)

As advertências do produto (já implementadas como disclaimers no aplicativo)
integram a rotulagem/Instruções de Uso: aviso de apoio à decisão, responsabilidade
exclusiva do profissional, e responsabilidade do prescritor no receituário.

## 10. Classificação proposta (a confirmar com a GGTPS/ANVISA)

Pela **Regra 11 do Anexo II da RDC 751/2022**, software que presta informações para
decisão terapêutica/diagnóstica é, por padrão, **Classe II**. Calculadora de dose e
scores se enquadram nessa regra. Portanto a classificação adotada é **Classe II**,
com caminho de **Notificação** (não Registro). A confirmação final cabe à área
técnica da ANVISA (GGTPS) — ver `playbook-notificacao-anvisa.md`.

> Estratégia: manter os módulos de **referência/educativos** claramente separados e
> rotulados como tais (tendem a ficar fora do escopo SaMD), concentrando o
> enquadramento nas funções de **cálculo/apoio** — todas posicionadas como
> "informam o manejo", o que favorece a classe mais baixa.
