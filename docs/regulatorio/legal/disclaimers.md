# Disclaimers do app — textos para revisão jurídica/médica — issue #13

O **código** dos disclaimers já está pronto e em produção: gate de aceite no 1º
acesso (com versionamento e re-aceite quando o texto muda) e banners contextuais por
módulo. Falta a **validação formal do texto** (jurídico + responsável técnico médico).
Fonte dos textos: `src/components/MedicalDisclaimer.tsx` (`DISCLAIMER_VERSION = '2'`).

## 1. Aviso global (gate de aceite no 1º acesso) — `DISCLAIMER_FULL`
> Este aplicativo é uma ferramenta de apoio à decisão clínica, de caráter educativo e
> referencial, para uso por profissionais de saúde habilitados. O conteúdo (cálculos,
> doses, condutas e modelos de receita) pode conter imprecisões e não substitui o
> julgamento clínico, a avaliação individual do paciente, nem as fontes oficiais
> (bula, diretrizes e protocolos vigentes). As sugestões são instrumentos auxiliares: a
> decisão sobre diagnóstico, prescrição, posologia e conduta é integralmente do
> profissional, que valida, edita ou rejeita qualquer sugestão, sob supervisão e
> responsabilidade pessoal e exclusiva dele (Res. CFM nº 2.454/2026). O aplicativo não
> realiza atos de telemedicina (Res. CFM nº 2.314/2022): não há teleconsulta,
> teleorientação, teletriagem ou telediagnóstico, nenhum paciente é atendido a
> distância e não se estabelece relação médico-paciente por meio da plataforma.

## 2. Banner curto (módulos clínicos) — `DISCLAIMER_SHORT`
> Apoio à decisão clínica (educativo). Pode conter imprecisões — confira sempre o
> contexto, a bula e as diretrizes. Responsabilidade exclusiva do profissional.

## 3. Receituário — `DISCLAIMER_PRESCRIBER`
> Esta ferramenta apenas formata e imprime a prescrição. A indicação, a dose, a
> posologia e a responsabilidade legal pela receita são exclusivas do médico
> prescritor, conforme seu julgamento clínico.

## Cobertura por módulo (aba → disclaimer hoje)
| Aba | Disclaimer |
|---|---|
| IOT, Ventilação, Infusão, RCP, ATB, Tóxico, Calc, **Doenças** | `DISCLAIMER_SHORT` |
| Receita | `DISCLAIMER_PRESCRIBER` |
| POCUS, Quiz, Biblioteca | (sem banner — conteúdo de referência/educativo) |

## Proposta: texto específico da aba Doenças (alto risco) — PARA REVISÃO
A aba Doenças traz condutas/doses de emergência curadas de fontes + diretrizes.
Sugere-se um banner um pouco mais explícito que o `DISCLAIMER_SHORT` genérico:

> **Conteúdo de referência, não protocolo institucional.** Fichas educativas
> resumidas de fontes (USP/ABRAMEDE) e diretrizes; podem conter imprecisões e ficar
> desatualizadas. Confirme doses, limiares e condutas na fonte primária e nos
> protocolos do seu serviço. A decisão é do profissional.

> Implementação (se aprovado): criar `DISCLAIMER_DOENCAS` em `MedicalDisclaimer.tsx`
> e usar no item `doencas` do `AppShell.tsx`. Incrementar `DISCLAIMER_VERSION` apenas
> se o texto do **gate global** mudar (o re-aceite é disparado por essa versão).

## Checklist de revisão (jurídico + RT médico)
- [ ] Validar o texto global (apoio à decisão, não-telemedicina, Res. CFM citadas).
- [ ] Validar `DISCLAIMER_SHORT` e `DISCLAIMER_PRESCRIBER`.
- [ ] Decidir sobre o texto específico da aba Doenças (acima) e aplicá-lo.
- [ ] Confirmar que módulos de alto risco têm banner (cobertura acima).
- [ ] Registrar responsável técnico médico (relaciona-se a #14) e versão aprovada.
