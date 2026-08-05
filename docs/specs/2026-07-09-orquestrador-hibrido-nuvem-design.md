# Orquestrador híbrido nuvem/local — design

**Data:** 2026-07-09
**Branch alvo:** `feat/orquestrador-hibrido-nuvem`
**Status:** aprovado (brainstorming) → pronto p/ plano de implementação

## 1. Contexto e motivação

Hoje o orquestrador clínico (Qwen, served-name `orquestrador`) roda **local no vLLM**
(`VLLM_BASE=127.0.0.1:8000`) e chega a ocupar **~16 GB de VRAM** na RTX 5090 (32 GB). Esse é
o maior consumidor isolado de VRAM e impede rodar o MedGemma-27B FP8 (~30 GB REAIS — ver correção) com folga para
Whisper, RAG e trabalho paralelo.

A arquitetura já **desacopla inferência de execução de ferramentas**: em `gateway/loop.ts`,
`vllmChat()` é o **único** ponto que fala com o modelo; `gateway/tools.ts::executor()` executa
RAG e MedGemma localmente. Mover a inferência do orquestrador para a nuvem é, portanto, quase
uma troca de endpoint — sem tocar em RAG, MedGemma ou guard.

**Restrição dura:** o app pode carregar **PHI** (contexto de paciente, imagem clínica). O
invariante do código é *"zero egress de PHI"* (`loop.ts`, `tools.ts`). Um orquestrador na nuvem
veria a pergunta do usuário, a evidência RAG e os achados do MedGemma — logo **não pode**
receber PHI. Tiers gratuitos (Groq/OpenRouter) retêm/treinam com o input → incompatíveis com PHI.

## 2. Objetivo e critérios de sucesso

Colocar o orquestrador na nuvem **para o tráfego não-sensível**, mantendo PHI/imagem **100%
local**, liberando VRAM para o MedGemma-27B.

Sucesso =
1. Requisições **sem PHI/imagem** são atendidas pelo orquestrador de nuvem (`gpt-oss-120b`).
2. Requisições **com PHI, imagem, ou toggle "caso de paciente"** NUNCA saem da LAN — invariante
   testado (o endpoint de nuvem não é chamado).
3. Falha/indisponibilidade da nuvem → **fail-safe para o orquestrador local**, sem derrubar o loop.
4. Guard de idioma (PT-BR) e citação continua rodando na síntese final, venha de onde vier.
5. Fase B: MedGemma-27B FP8 rodando com VRAM total ≤ ~26/32 GB.

**Não-objetivos (YAGNI):** gateway de redação/anonimização (direção descartada); BioMistral
como 3º especialista (só se sobrar VRAM, fora do escopo); provedor ZDR pago (opção futura para
o corpus, não bloqueia).

## 3. Arquitetura — roteamento

Uma decisão determinística **antes** do loop MASS escolhe o destino do orquestrador:

```
pickOrchestrator(input) →
  se input.hasImage            → LOCAL   (imagem = PHI por definição; nuvem-texto nem processa)
  se input.patientCase (toggle)→ LOCAL   (médico declarou caso de paciente)
  se detectPHI(input.text)     → LOCAL   (rede de segurança determinística)
  se !CLOUD_ORCH_BASE          → LOCAL   (nuvem não configurada)
  senão                        → NUVEM
```

**Fail-safe absoluto:** qualquer exceção em `detectPHI` → tratar como PHI (LOCAL). Nunca o
contrário. Erro/timeout/429 da nuvem em runtime → **rebaixa para LOCAL** e continua o loop.

`detectPHI(text)` — regex conservador para identificadores BR e contexto de paciente:
- CPF, CNS (cartão SUS 15 díg.), RG, telefone, datas de nascimento;
- termos de contexto: `meu paciente`, `paciente de`, `sr(a)\.`, `prontuário`, `leito`, `admitid`.
Objetivo: pegar o esquecimento do toggle sem jogar todo tráfego para local (o toggle é o sinal
primário; o detector é a rede). Sinais fracos (nome próprio solto) NÃO disparam — falso-positivo
excessivo mataria o ganho de VRAM/nuvem.

## 3.1 Triagem médica (bloqueio) + pipeline clínico determinístico

**Regra de escopo:** o chat é EXCLUSIVO para perguntas médicas/de saúde — evita consumo de API por
outros motivos. Toda query passa por **triagem determinística LOCAL** antes de qualquer consulta paga:
- `triageMedical(text)` — 1 chamada barata ao **modelo local** (nunca à nuvem, p/ não gastar API com
  não-médico) classificando `médica? sim/não`. O filtro `looksClinical` roda antes como atalho barato.
- **Não-médica → BLOQUEIO:** recusa fixa em PT-BR ("Este assistente responde apenas a perguntas
  clínicas/de saúde."). Não chama nuvem, RAG nem MedGemma.
- **Médica → segue** para o roteador PHI (§3) e o pipeline abaixo.

**Pipeline clínico determinístico** (substitui o loop agêntico p/ queries clínicas — RAG e MedGemma
são SEMPRE consultados; não é decisão do modelo):
1. **RAG** (evidence-pack) — local. [já existe]
2. **MedGemma consult #1** — parecer do especialista sobre a pergunta (+ evidência RAG + imagem se
   houver) — local, OBRIGATÓRIO. [novo]
3. **Orquestrador sintetiza** rascunho PT-BR usando evidência RAG + parecer do MedGemma.
4. **MedGemma re-avaliação #2** — revisa o rascunho contra evidência/parecer: confirma, corrige ou
   sinaliza risco. NÃO escreve a resposta final (English-only). [novo]
5. **Orquestrador aplica** a re-avaliação e entrega a resposta final PT-BR → guard → UI.

**Papéis separados (decisão):** o MedGemma NÃO vira orquestrador — é especialista/verificador, não
tool-caller; English-only quebraria a entrega PT-BR e o guard; se orquestrasse local, o leg de nuvem
(ganho de VRAM/custo) perderia sentido; e auto-verificação é fraca — a re-avaliação só vale porque o
verificador é independente de quem redigiu.

**Custo/latência (aceito):** query clínica = triagem local + RAG + **2× MedGemma-27B** + orquestrador.
As duas passadas 27B sequenciais na 5090 são o gargalo; a re-avaliação pode ser só-texto (sem
re-enviar imagem) p/ reduzir. Não-médicas custam só a triagem local.

## 4. Componentes e interfaces

### 4.1 `gateway/router.ts` (novo)
```ts
export interface OrchTarget {
  base: string          // ex.: https://api.groq.com/openai/v1  |  http://127.0.0.1:8000
  apiKey?: string       // Bearer p/ nuvem; ausente no local
  model: string         // openai/gpt-oss-120b  |  'orquestrador'
  bodyExtras: Record<string, unknown> // params específicos do modelo (ver 4.2)
  local: boolean        // p/ log/teste
}
export function detectPHI(text: string): boolean
export function pickOrchestrator(input: {
  hasImage: boolean; patientCase: boolean; text: string
}): OrchTarget
export async function triageMedical(text: string): Promise<boolean> // classificação médica LOCAL (§3.1); false → bloqueio
```

`runMass` (§4.2) passa a implementar o **pipeline clínico determinístico** do §3.1 para queries
clínicas: triagem → RAG → MedGemma#1 → síntese → MedGemma#2 (re-avaliação) → finalização PT-BR.
As duas consultas MedGemma reusam `medgemmaConsult` (`tools.ts`), forçadas pelo servidor (não pelo modelo).
- Alvo LOCAL: `{ base: LOCAL_ORCH_BASE, model: LOCAL_ORCH_MODEL, bodyExtras: { chat_template_kwargs: { enable_thinking: true } }, local: true }`
- Alvo NUVEM: `{ base: CLOUD_ORCH_BASE, apiKey: CLOUD_ORCH_API_KEY, model: CLOUD_ORCH_MODEL, bodyExtras: { thinking: { type: 'enabled' } }, local: false }` (DeepSeek: `thinking` no corpo raiz — LIGADO)

### 4.2 `gateway/loop.ts` (modificar `vllmChat` + `runMass`)
- `vllmChat(messages, target, maxTokens?)`: usa `target.base`/`target.model`, injeta
  `Authorization: Bearer ${apiKey}` se houver, e espalha `target.bodyExtras` no corpo.
  Remover o `chat_template_kwargs` hard-coded (agora vem do `bodyExtras` — Qwen-específico só no
  alvo local; enviar esse kwarg à Groq quebra/é ignorado).
- `runMass(messages, ctx)`: `ctx` ganha `{ hasImage, patientCase }`. No início, resolve
  `target = pickOrchestrator(...)`. No laço, se `!target.local` e `vllmChat` lançar, **flipa
  `target` para o LOCAL e refaz a iteração** (fallback runtime). RAG-prefetch e execução de
  tools permanecem locais e inalterados.

### 4.3 `gateway/handler.ts` (modificar)
- Lê `patient_case: boolean` do body → `ctx.patientCase`.
- Calcula `hasImage` varrendo `messages` por parte `image_url`/`image_b64` → `ctx.hasImage`.
- Health: reporta destino ativo (local/nuvem) sem vazar a key.

### 4.4 `gateway/tools.ts` (Fase B — inverter `MEDGEMMA_SYSTEM`)
Hoje força PT-BR no MedGemma. Com o 27B **English-only**, isso degrada o raciocínio clínico.
Inverter: permitir que o especialista responda em **inglês** (língua forte → melhor acurácia); a
síntese PT-BR fica com o orquestrador. **Adicionar ao `MASS_SYSTEM_PROMPT`** cláusula: *"achados
do especialista podem vir em inglês; integre-os preservando dose, unidade e negação ao pé da
letra, e entregue em PT-BR."* (Fase A mantém MedGemma como está.)

### 4.5 `.env` / `.env.example`
```
# --- Orquestrador nuvem (leg NÃO-PHI) ---
CLOUD_ORCH_BASE=https://api.deepseek.com
CLOUD_ORCH_API_KEY=
CLOUD_ORCH_MODEL=deepseek-v4-flash
CLOUD_ORCH_THINKING=enabled    # reasoning LIGADO nos dois orquestradores (decisão do usuário)
# --- Orquestrador local (leg PHI) ---
LOCAL_ORCH_BASE=http://127.0.0.1:8000   # default = VLLM_BASE (compat)
LOCAL_ORCH_MODEL=orquestrador
# kill-switch: força tudo local (ex.: incidente de privacidade)
ROUTE_FORCE_LOCAL=false
```

## 5. Fluxo de dados

- **Caminho nuvem (genérico):** query → RAG-prefetch local → orquestrador nuvem sintetiza →
  guard → UI. Egressa: pergunta genérica + trechos do corpus RAG. (Ressalva: o corpus é IP;
  opção futura de ZDR nesse leg — não bloqueia.)
- **Caminho local (PHI/imagem):** query → RAG-prefetch local → orquestrador local (Qwen3.5-2B)
  → `medgemma_consult` local (imagem na LAN) → síntese local → guard → UI. **Zero egress.**

## 6. Modelos e VRAM (faseado)

| Componente | Fase A (up hoje) | Fase B (otimizado) |
|---|---|---|
| Orquestrador nuvem | `deepseek-v4-flash` (DeepSeek) | idem |
| Orquestrador local (PHI) | modelo atual em `:8000` | **Qwen3.5-2B** (`enable_thinking:true` — ver risco de loop §12), ~2-4 GB |
| Especialista | MedGemma atual em `:8001` | **MedGemma-27B FP8** (19 GB) + 4B-nvfp4 p/ imagem |
| Whisper | atual | int8, ~2 GB |
| RAG BGE-M3 | GPU | **CPU** (libera ~2.3 GB) |
| VRAM total | libera ~16 GB (orq→nuvem) | ~25/32 GB, folga ~7 GB |

> **CORREÇÃO (2026-07-09, pós-deploy):** o MedGemma-27B-FP8 são **~30 GB reais** (não 19 — o `du`
> do dir engana; o `index.json` declara 29.9 GB) e **NÃO cabe em 32 GB** com voz+orquestrador. Todo
> 27B em 4-bit (bnb-NF4, GGUF-Q4) que caberia **sacrifica/não-valida a torre de visão** ou exige stack
> fora do vLLM. **Config real que roda:** MedGemma-**4B**-FP8 :8001 (GMU 0.30) + Qwen3.5-**4B**-NVFP4
> :8000 (GMU 0.30, compressed-tensors) + voz ≈ 26/32. O Qwen-9B-FP8 estoura o KV (GMU 0.40 → KV negativo).

Modelos já em disco: `~/models/medgemma-27b-it-FP8-Dynamic` (metadados, shards faltando), 4B-nvfp4 (5 G). **A baixar:**
Qwen3.5-2B (Fase B). Card avisa que o 2B entra em loop no modo thinking — mitigado por
`enable_thinking:false`, que o loop já usa.

## 7. Provedor de nuvem

**DeepSeek `deepseek-v4-flash`** (escolha atual — testar barato primeiro). `base_url=
https://api.deepseek.com`, **OpenAI-compatible**, tool-calling suportado, thinking mode **LIGADO**
(`thinking:{type:'enabled'}`, decisão do usuário — melhor planejamento; custa mais tokens/latência). `deepseek-chat`/`deepseek-reasoner` depreciam em
2026-07-24 → usar `deepseek-v4-flash`. OpenAI-compat → só env, sem código. Alternativas por env se
decepcionar: `deepseek-v4-pro`, ou Groq `gpt-oss-120b`.

## 8. Invariantes de segurança (testados)

1. **PHI/imagem/toggle → nuvem NUNCA chamada.** Teste espelha o padrão existente
   ("não-premium → vLLM nunca chamado"): spy no fetch da nuvem, asserção de não-chamada.
2. `detectPHI` lança → tratado como PHI (local).
3. `ROUTE_FORCE_LOCAL=true` → tudo local (kill-switch de incidente).
4. Guard roda na síntese final independente do destino.

## 9. Modos de falha e fallback

| Falha | Comportamento |
|---|---|
| Nuvem 429/5xx/timeout | rebaixa para LOCAL na iteração, continua o loop |
| `CLOUD_ORCH_BASE` vazio | tudo local (comportamento atual) |
| `detectPHI` erro | local (fail-safe) |
| Local indisponível no fallback | erro atual do loop (`vLLM error`) — sem regressão |

## 10. Testes (verificam intenção)

- `gateway/router.test.ts`: imagem→local; toggle→local; texto-PHI (CPF, "meu paciente")→local;
  genérico→nuvem; `detectPHI` em dúvida→local; `ROUTE_FORCE_LOCAL`→local.
- `gateway/loop.test.ts` (estender): invariante "PHI → CLOUD_ORCH_BASE não chamado"; fallback
  nuvem-caiu→local não derruba o loop; `bodyExtras` corretos por alvo.
- Sem regressão nos testes existentes de handler/guard/prompt.

## 11. Rollout faseado

- **Fase A — up hoje (mínima, destrava VRAM):** `router.ts` + `vllmChat(target)` +
  `runMass(ctx)` + `handler.ts` (toggle/hasImage) + `.env` + testes. Nuvem `deepseek-v4-flash` (thinking on),
  fallback local. **Não depende de baixar Qwen3.5-2B nem do 27B** — usa o que está em `:8000`/`:8001`.
  UI: adicionar toggle "caso de paciente" (envia `patient_case`); se ainda não houver, detector +
  `hasImage` já protegem — toggle entra em seguida.
- **Fase B — otimização VRAM:** trocar local→Qwen3.5-2B; subir MedGemma→27B-FP8; BGE→CPU;
  Whisper int8; inverter `MEDGEMMA_SYSTEM` p/ inglês + cláusula de síntese PT-BR fiel.

## 12. Riscos abertos

- **PT-BR do deepseek-v4-flash:** validar em casos reais; DeepSeek é bom multilíngue, mas testar.
- **Jurisdição (China):** o leg de nuvem envia trechos do corpus RAG a servidores DeepSeek (China).
  PHI já é barrado pelo roteador; p/ IP do corpus / residência de dados em produção, considerar
  provedor ZDR/ocidental. Aceitável na fase de teste barato.
- **Thinking mode LIGADO (nuvem + local):** melhora planejamento; custa mais tokens/latência.
  No DeepSeek, o `reasoning_content` de turns com tool-call DEVE voltar à API — o loop já reenvia o
  `msg` inteiro, então preserva. Considerar subir o timeout do `vllmChat` (120s pode apertar).
- **⚠️ Qwen3.5-2B + thinking (Fase B):** o card AVISA que o 2B entra em LOOP de pensamento e pode
  não terminar a geração — com thinking ON isso é RISCO REAL de travar o loop MASS. Mitigar: cap de
  `max_tokens` + timeout duro; se recorrer, thinking OFF só no 2B ou trocar por local maior. Fase A
  (modelo atual em :8000) não corre esse risco.
- **Qualidade da síntese no caminho-PHI:** Qwen3.5-2B é 2B; o raciocínio pesado fica no
  MedGemma-27B, o 2B só orquestra+traduz. Validar fidelidade de dose/unidade/negação.
- **Detector de PHI:** recall imperfeito por design; o toggle é o sinal primário. Fail-safe cobre.
- **Free tier TPM:** só validação; produção exige tier pago.
