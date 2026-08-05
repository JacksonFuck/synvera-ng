# Atropina (pré-medicação IOT) — teto de dose — issue #14 — ✅ RESOLVIDO

> **RESOLVIDO em 2026-06-24** (Eder Abelha): decidido **aplicar teto de 0,5 mg**,
> coerente com o texto exibido. Ajuste aplicado no código (PR #115). Histórico
> da decisão preservado abaixo.

## Onde
`src/data/premedications.ts` — item `id: 'atropina'` (pré-medicação para intubação).

## Comportamento atual (no código)
- Fórmula: `dose = max(0,01 mg/kg × peso, 0,1 mg)` — `kind: 'perKgFloor'`, `floor: 0,1`.
- **Há piso (0,1 mg) mas NÃO há teto.** O próprio código tem comentário sinalizando:
  > "o texto cita 'máximo 0.5mg adulto', mas o código NÃO aplica esse teto. Sinalizar à revisão médica: aplicar teto de 0.5mg?"
- O campo `obs` exibido ao usuário diz: *"Dose: 0,01 mg/kg (mínimo 0,1 mg, máximo 0,5 mg adulto)."* — ou seja, o **texto promete um teto que o cálculo não aplica.**

### Efeito prático (exemplos)
| Peso | Dose atual (sem teto) | Com teto 0,5 mg |
|---|---|---|
| 7 kg | 0,1 mg (piso) | 0,1 mg |
| 30 kg | 0,3 mg | 0,3 mg |
| 50 kg | 0,5 mg | 0,5 mg |
| 70 kg | **0,7 mg** | 0,5 mg |
| 100 kg | **1,0 mg** | 0,5 mg |

## Decisão tomada (médico)
- [x] **Aplicar teto?** SIM
- [x] **Valor do teto:** 0,5 mg (conforme o texto exibido), sem diferenciar adulto/criança.
- [x] **Piso de 0,1 mg** confirmado (evita bradicardia paradoxal — consensual).

> Observação: esta é a pré-medicação de IOT. A indicação no app já restringe o uso
> ("raramente necessário; bradicardia < 60 bpm, succinilcolina em criança ou 2ª dose").

## Ajuste de código — ✅ APLICADO (PR #115)
1. ✅ Tipo estendido em `src/data/premedications.ts`:
   `| { kind: 'perKgFloor'; perKg: number; floor: number; ceiling?: number }`
2. ✅ Teto aplicado em `src/domain/iot.ts` (`calcPremedDose`):
   `if (premed.dose.ceiling != null) dose = Math.min(dose, premed.dose.ceiling)`
3. ✅ Item `atropina` com `ceiling: 0.5`; comentário de pendência removido.
4. ✅ Testes em `iot-extended.test.ts` cobrindo o teto (70 kg → 0,5 mg) e o caso
   entre piso e teto (30 kg → 0,3 mg).

Decisão por: **Eder Abelha**  ·  Data: **2026-06-24**
