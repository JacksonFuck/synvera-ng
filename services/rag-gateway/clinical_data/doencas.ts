/**
 * MÓDULO DOENÇAS — fichas clínicas curadas por tema.
 * Revisão médica PARCIAL: Eder Abelha (2026-06-24) validou 59 das 104 fichas
 * (ver docs/clinico/checklist-validacao-doencas.xlsx).
 * REVISÃO MÉDICA OBRIGATÓRIA ainda para 45 fichas: 11 dos lotes #88/#90; 12 da
 * expansão "PS crítico" (#89/#95/#96, checklist linhas 71–82); 12 da expansão
 * "GI/Hepáticas (#91) + Metabólicas/Eletrolíticas (#93)"; 6 da expansão
 * "Renais/Urológicas + Reumatológicas (#97)"; e 4 da expansão
 * "Hematológicas/Oncológicas (#94)" — as três últimas ainda não no checklist.
 *
 * Cada ficha é uma curadoria CONCISA (não o capítulo inteiro) com foco em
 * fisiopatologia, exames a solicitar e diagnóstico diferencial. Fonte:
 * "Medicina de Emergência: Abordagem Prática" (USP/HC-FMUSP, 19ª ed., 2025),
 * via skill `medemerg-ref` — o campo `capitulo` aponta o capítulo de origem.
 * Confirme sempre condutas e doses na fonte primária antes do uso clínico.
 */

/** Bloco "título + itens" reutilizado em exames e condutas. */
export interface Grupo {
  titulo: string
  itens: string[]
}

export interface Doenca {
  id: string
  nome: string
  /** Seção/área para agrupar na lista (ex.: "Infecciosas"). */
  secao: string
  /** Termos alternativos/siglas para a busca (ex.: ["choque séptico"]). */
  sinonimos?: string[]
  /** Código(s) CID-10 (DATASUS, versão 2008). ⚠️ Revisão médica pendente. */
  cid10?: string[]
  /** Capítulo de origem no livro USP (medemerg-ref). Dispensável quando `fonte` é informado (fichas baseadas em diretriz). */
  capitulo?: number
  /** Sobrescreve a linha de fonte (ex.: fichas curadas só do ABRAMEDE ou de diretriz). */
  fonte?: string
  resumo: string
  fisiopatologia: string[]
  exames: Grupo[]
  diagnosticoDiferencial: string[]
  conduta: Grupo[]
  /** Pontos em que diretrizes mais recentes atualizam/divergem do livro-fonte. */
  atualizacoes?: { diretriz: string; texto: string }[]
}

export const DOENCAS: Doenca[] = [
  {
    id: 'sepse',
    nome: 'Sepse e choque séptico',
    secao: 'Infecciosas',
    cid10: ['A41.9'],
    sinonimos: ['choque séptico', 'SOFA', 'qSOFA', 'infecção grave', 'SIRS'],
    capitulo: 9,
    resumo:
      'Disfunção orgânica ameaçadora à vida por resposta inflamatória desregulada do hospedeiro a uma infecção. Reconhecida quando, na presença de infecção suspeita/confirmada, há elevação aguda ≥ 2 pontos no SOFA. Choque séptico = necessidade de vasopressor para PAM ≥ 65 mmHg + lactato > 2 mmol/L (18 mg/dL) após reposição volêmica adequada.',
    fisiopatologia: [
      'A infecção desencadeia a imunidade inata (macrófagos reconhecem componentes microbianos), liberando mediadores pró-inflamatórios (TNF-α, IL-1) e ativando complemento e cascata de coagulação.',
      'A sepse ocorre quando essa liberação excede o ambiente local, gerando resposta inflamatória sistêmica autossustentável que afeta órgãos à distância do foco.',
      'A lesão celular resulta de isquemia tecidual (oferta de O₂ insuficiente para a demanda do tecido inflamado) e lesão citopática (disfunção mitocondrial e apoptose), podendo evoluir com CIVD (microtromboses e hemorragias).',
      'Foco mais comum: pulmão (~63%); seguem-se abdome, corrente sanguínea, trato urinário, pele, cateteres e SNC.',
    ],
    exames: [
      {
        titulo: 'Para todos',
        itens: [
          'Hemoculturas (≥ 2 sítios / ≥ 4 amostras aeróbias e anaeróbias) antes do antibiótico, sem atrasar a 1ª dose (≤ 45 min)',
          'Lactato (repetir 2–4 h se > 2 mmol/L)',
          'POCUS para etiologia, disfunção miocárdica e guia de volume',
        ],
      },
      {
        titulo: 'Elucidação do foco (dirigido pela suspeita)',
        itens: [
          'Pneumonia: RX de tórax (PA e perfil); considerar TC, cultura de escarro/aspirado',
          'Abdome: US e/ou TC de abdome (preferir com contraste)',
          'ITU: urina 1 e urocultura',
          'Cateter: cultura de ponta de cateter + hemocultura',
          'Meningite: celularidade e cultura do liquor',
          'Artrite séptica: celularidade e cultura de artrocentese',
          'Endocardite: hemoculturas + ecocardiograma (Duke modificado)',
        ],
      },
      {
        titulo: 'Avaliação de disfunção orgânica (SOFA)',
        itens: [
          'Gasometria arterial (respiratório)',
          'Bilirrubina total (hepático)',
          'Creatinina e débito urinário (renal)',
          'Plaquetas (hematológico)',
          'Lactato (metabólico) e Glasgow (neurológico)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Choque de outras etiologias (cardiogênico, hipovolêmico/hemorrágico, obstrutivo, anafilático)',
      'Causas não infecciosas de SIRS: pancreatite aguda, grande queimado, politrauma, pós-operatório',
      'Tempestade tireotóxica e outras emergências endócrinas',
      'Intoxicações e síndromes por drogas (ex.: síndrome serotoninérgica, anticolinérgica)',
      'Embolia pulmonar e outras causas de hipotensão + disfunção orgânica',
    ],
    conduta: [
      {
        titulo: 'Estabilização',
        itens: [
          'ABCDE; O₂ com alvo SpO₂ ≥ 94%',
          'IOT/VM se rebaixamento sem proteção de via aérea, hipoxemia refratária ou esforço importante',
          'Acesso venoso periférico imediato — não atrasar volume/ATB/vasopressor à espera de CVC',
        ],
      },
      {
        titulo: 'Antibioticoterapia',
        itens: [
          'Choque séptico ou sepse muito provável: iniciar em ≤ 1 h',
          'Possível sepse sem choque: iniciar em ≤ 3 h (após avaliação rápida das causas)',
          'Empírico de amplo espectro, direcionado ao foco; descalonar após cultura/sensibilidade',
          'Risco de MRSA: vancomicina ou linezolida. Risco de MDR: 2 drogas contra Gram-negativos',
        ],
      },
      {
        titulo: 'Ressuscitação volêmica',
        itens: [
          'Cristaloide balanceado 30 mL/kg iniciado em ≤ 1 h e concluído nas primeiras 3 h, em bolus (ex.: 500 mL)',
          'Reavaliar fluidorresponsividade antes de cada bolus (elevação passiva das pernas; congestão pulmonar)',
          'Evitar soluções de amido; lactato seriado 2–4 h como alvo de ressuscitação',
        ],
      },
      {
        titulo: 'Vasopressor e inotrópico',
        itens: [
          'Noradrenalina é a 1ª escolha; alvo PAM ≥ 65 mmHg (80–85 em hipertenso crônico)',
          'Iniciar precocemente, ainda durante a reposição; pode ser feita em acesso periférico calibroso',
          'Vasopressina até 0,04 U/min quando NA em 0,25–0,5 µg/kg/min',
          'Dobutamina se disfunção miocárdica/baixo débito',
        ],
      },
      {
        titulo: 'Suporte',
        itens: [
          'Corticoide: hidrocortisona 200 mg/dia (ex.: 50 mg IV 6/6 h) no choque séptico com necessidade contínua de vasopressor apesar de volume adequado',
          'Transfusão se Hb ≤ 7 g/dL (exceto isquemia ativa/hemorragia)',
          'Controle glicêmico 140–180 mg/dL; profilaxia de TEV; ventilação protetora',
          'Na IOT, evitar drogas cardiodepressoras (midazolam, fentanil, propofol) — preferir cetamina/etomidato',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Surviving Sepsis Campaign 2026',
        texto:
          'Corticoide é sugerido (recomendação fraca) no choque séptico dependente de vasopressor — gatilho menos restritivo que "apenas refratário".',
      },
      {
        diretriz: 'Surviving Sepsis Campaign 2026',
        texto:
          'Os 30 mL/kg seguem como alvo inicial condicional — após o bólus, a SSC 2026 recomenda individualizar fluidos (estratégia liberal vs. restritiva por fatores do paciente) e prevê de-ressuscitação (remoção de fluido com diurético após estabilização). Noradrenalina permanece 1ª linha, mas rebaixada a recomendação condicional; a infusão prolongada de betalactâmico passou a recomendação. O limiar 0,25–0,5 µg/kg/min para iniciar vasopressina é prática da fonte, não fixado pela diretriz.',
      },
    ],
  },
  {
    id: 'intoxicacao-exogena',
    nome: 'Intoxicação exógena — abordagem inicial',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T65.9'],
    sinonimos: ['intoxicação', 'envenenamento', 'overdose', 'toxidrome', 'síndrome tóxica'],
    capitulo: 102,
    resumo:
      'Causa comum no DE, com gravidade variável e exposição por várias vias (oral, cutânea, inalatória, mucosa, IV). Todo paciente, mesmo oligossintomático, deve ser tratado como potencialmente grave (risco de deterioração tardia). Manejo inicial: estabilização (ABCDE), hipótese da síndrome tóxica e tratamento (descontaminação, eliminação e antídotos quando indicados).',
    fisiopatologia: [
      'A gravidade depende do tipo de contato, duração, dose/quantidade e letalidade da substância.',
      'Os achados clínicos agrupam o paciente em síndromes tóxicas (toxidromes): não apontam o agente exato, mas o associam a uma classe farmacológica e orientam condutas/antídotos.',
      'Cada toxidrome decorre de um mecanismo: hiperatividade simpática (simpaticomimética), bloqueio muscarínico (anticolinérgica), inibição da acetilcolinesterase (colinérgica), ativação GABA (sedativo-hipnótica), agonismo opioide mu (opioide) e excesso serotoninérgico (serotoninérgica).',
      'Algumas toxinas causam acidose metabólica com ânion-gap aumentado; nos álcoois tóxicos (metanol, etilenoglicol) há elevação precoce do gap osmolar antes da acidose.',
    ],
    exames: [
      {
        titulo: 'Rotina recomendada',
        itens: [
          'Glicemia capilar',
          'Hemograma completo',
          'Eletrólitos (Na, K) e função renal',
          'Função hepática',
          'Urina 1 e screening toxicológico urinário',
          'Teste de gravidez, quando apropriado',
          'Gasometria arterial (se suspeita de acidose) e lactato',
        ],
      },
      {
        titulo: 'Cálculos metabólicos',
        itens: [
          'Ânion-gap (acidose metabólica)',
          'Gap osmolar em suspeita de álcoois tóxicos (metanol, etilenoglicol)',
        ],
      },
      {
        titulo: 'ECG',
        itens: [
          'Sobretudo em taqui/bradicardia ou agente cardiotóxico que prolonga QRS/QT (ex.: tricíclicos, antipsicóticos)',
        ],
      },
      {
        titulo: 'Dosagens séricas específicas (quando aplicável)',
        itens: [
          'Paracetamol, salicilato, lítio, digoxina',
          'Metanol/etilenoglicol, etanol',
          'Carbamazepina, fenitoína, fenobarbital, ácido valproico, teofilina',
          'Carboxi-hemoglobina (CO), cianeto, meta-hemoglobina',
          'Ferro, metotrexato, paraquat',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Simpaticomimética (cocaína, anfetaminas, cafeína): agitação, midríase, HAS, taquicardia, hipertermia, diaforese',
      'Anticolinérgica (tricíclicos, anti-histamínicos, antipsicóticos, atropina): agitação, hipertermia, midríase, pele/mucosas secas, QT/QRS alargados',
      'Colinérgica (organofosforados, carbamatos/chumbinho): miose, sialorreia, broncorreia, diaforese, diarreia, fasciculações',
      'Sedativo-hipnótica (etanol, barbitúricos, benzodiazepínicos): sedação, depressão respiratória',
      'Opioide (morfina, fentanil, metadona): rebaixamento + miose + bradipneia',
      'Serotoninérgica (ISRS, IMAO, tricíclicos): alteração do estado mental, hipertermia, hiper-reflexia, clônus, diaforese',
      'TCE como causa de estado mental alterado quando há evidência de trauma',
      'Acidose com ânion-gap/gap osmolar elevados: metanol, etilenoglicol, álcool isopropílico, cetoacidose alcoólica, acidose lática',
    ],
    conduta: [
      {
        titulo: 'Estabilização e suporte',
        itens: [
          'Tratar todo intoxicado como potencialmente grave; segurança da equipe (paramentação) pelo risco de contaminação',
          'ABCDE concomitante à avaliação; IOT se bradipneia/queda do volume-minuto ou via aérea desprotegida (Glasgow < 8 isolado não é critério)',
          'Glicemia capilar em toda alteração de consciência; reverter hipoglicemia com dextrose',
          'Hipotensão: cristaloide 10–20 mL/kg evitando sobrecarga; se refratária, vasoativo precoce ou antídoto específico',
          'Monitorização + ECG; observar ≥ 6 h (manifestações tardias); acionar CEATOX; avaliação psiquiátrica antes da alta se ingesta proposital',
        ],
      },
      {
        titulo: 'Descontaminação',
        itens: [
          'Cutânea: despir e lavar a pele com água abundante. Ocular: anestésico tópico + lavagem com SF e avaliação oftalmológica',
          'Carvão ativado, sobretudo na 1ª h (benefício decai após; uso não rotineiro): 25–100 g adulto / 0,5–1 g/kg criança; contraindicado em cáusticos, álcoois, cianeto, lítio, metais e via aérea desprotegida',
          'Lavagem gástrica só até 1 h, via aérea protegida, não corrosivos; NÃO induzir êmese (ipeca contraindicado)',
          'Lavagem intestinal (polietilenoglicol) para não adsorvidos pelo carvão (lítio, ferro, chumbo) e body-packers',
        ],
      },
      {
        titulo: 'Medidas de eliminação',
        itens: [
          'Carvão multidose: alta recirculação êntero-hepática (carbamazepina, dapsona, fenobarbital, quinina, teofilina)',
          'Alcalinização urinária (bicarbonato): salicilatos, metotrexato, fenobarbital — alvo pH urinário > 7,5; monitorar K⁺',
          'Hemodiálise: lítio, fenobarbital, salicilatos, valproato, metanol/etilenoglicol, teofilina',
          'Emulsão lipídica IV: toxicidade por anestésico local (ex.: bupivacaína)',
        ],
      },
      {
        titulo: 'Antídotos',
        itens: [
          'Maioria tratada só com suporte; antídoto em casos selecionados, podendo ser empírico diante de forte suspeita',
          'Paracetamol → NAC; opioide → naloxona; organofosforado → atropina',
          'Benzodiazepínico: suporte; flumazenil NÃO empírico (risco de convulsão/arritmia em coingesta, abstinência em uso crônico) — priorizar naloxona se depressão respiratória',
          'Betabloqueador → glucagon/insulina alta dose; BCC → cálcio + insulina; metanol/etilenoglicol → fomepizol/etanol',
          'Meta-hemoglobinemia → azul de metileno; cianeto → hidroxicobalamina; digoxina → anticorpo antidigoxina',
        ],
      },
      {
        titulo: 'PCR / cardiotoxicidade (TOX-ACLS)',
        itens: [
          'QRS largo (> 120 ms) ou hipotensão por bloqueador de canal de sódio (tricíclicos, cocaína): bicarbonato de sódio 1–2 mEq/kg em bolus, repetir conforme QRS',
          'Antiarrítmico: preferir lidocaína à amiodarona na cardiotoxicidade por tricíclicos/cocaína',
          'Betabloqueador/BCC: gluconato de cálcio + insulina em altas doses; glucagon (BB)',
          'Anestésico local / cardiotóxico lipofílico refratário: emulsão lipídica 20% 1,5 mL/kg',
          'Na PCR: naloxona 2 mg (opioide), hidroxicobalamina 10 g (cianeto); considerar RCP prolongada e antídoto intra-PCR conforme suspeita',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AHA 2023 (Poisoning Focused Update)',
        texto:
          'Flumazenil não deve ser usado empiricamente na overdose por BZD (contraindicado em coingesta pró-convulsivante/QRS alargado, dependência, epilepsia); priorizar naloxona na depressão respiratória.',
      },
      {
        diretriz: 'AACT/EAPCCT (carvão ativado, reafirmado 2024)',
        texto:
          'Carvão ativado idealmente até 1 h da ingesta, sem uso rotineiro; além de 1 h apenas em casos selecionados (liberação prolongada, anticolinérgicos, grande quantidade).',
      },
    ],
  },
  {
    id: 'anafilaxia',
    nome: 'Anafilaxia',
    secao: 'Choque e anafilaxia',
    cid10: ['T78.2'],
    sinonimos: ['choque anafilático', 'reação alérgica', 'adrenalina', 'angioedema', 'urticária'],
    capitulo: 12,
    resumo:
      'Reação de hipersensibilidade sistêmica grave, de início rápido, com acometimento de via aérea, respiração e/ou circulação — geralmente (não sempre) com sinais cutâneo-mucosos. Diagnóstico clínico (critérios OMS 2021): início agudo com pele/mucosa + comprometimento respiratório ou queda de PA; OU ≥ 2 sistemas após alérgeno provável; OU queda de PA após alérgeno conhecido.',
    fisiopatologia: [
      'Degranulação de mastócitos/basófilos, classicamente IgE-mediada (hipersensibilidade tipo I), liberando histamina e triptase.',
      'Histamina age em H1 (bronco/vasoconstrição) e H2 (vasodilatação, ↑ permeabilidade); leucotrienos, prostaglandinas e PAF ampliam broncoconstrição, vasodilatação e extravasamento.',
      'Reação anafilactoide é clinicamente idêntica mas não IgE-mediada (ex.: contraste, opioides, exercício, álcool).',
    ],
    exames: [
      {
        titulo: 'Diagnóstico é clínico',
        itens: [
          'Baseado nos critérios; história e exame em geral bastam. Exames servem a casos duvidosos/diferenciais.',
        ],
      },
      {
        titulo: 'Quando úteis',
        itens: [
          'Triptase sérica: colher 15 min–3 h (até 6 h) do início; valor normal não exclui',
          'Histamina plasmática: colher 5–60 min (metabolismo rápido)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Asma/broncoespasmo de outras causas',
      'Síncope; ansiedade/hiperventilação',
      'Urticária aguda ou angioedema (hereditário, por iECA)',
      'Causas cardiovasculares (IAM, TEP) e neurológicas (convulsão, AVC)',
      'Escombroide (histamina de peixe), síndrome carcinoide, mastocitose',
      'Choque de outras etiologias',
    ],
    conduta: [
      {
        titulo: 'Primeira linha',
        itens: [
          'Remover o agente; monitorização, decúbito com elevação de MMII (gestante em DLE); acesso calibroso; O₂ alto fluxo',
          'Adrenalina IM imediata no vasto lateral (mais importante) — 0,01 mg/kg: 0,5 mg adulto/>12 anos; 0,3 mg dos 6–12 anos (≥25 kg); 0,15 mg dos 6 m–6 anos; 0,1–0,15 mg < 6 meses',
          'Repetir adrenalina IM até 2x a cada 5–15 min conforme resposta',
          'Hipotensão: cristaloide 1–2 L (adulto) ou 10–20 mL/kg (criança)',
        ],
      },
      {
        titulo: 'Adjuvantes (2ª linha)',
        itens: [
          'Anti-H1 (difenidramina) e anti-H2: só sintomas cutâneos; corticoide só ajuda broncoespasmo/refratário (não previne bifásica)',
          'Broncoespasmo: β2 inalatório ± ipratrópio; grave: MgSO₄ 1–2 g EV',
          'Em uso de betabloqueador com má resposta: glucagon 1–5 mg EV',
        ],
      },
      {
        titulo: 'Refratária / observação',
        itens: [
          'Sem resposta à IM: adrenalina EV (bolus 0,1 mg) e infusão contínua titulada com monitorização',
          'Choque refratário: outros vasopressores e volume; casos extremos: azul de metileno, ECMO',
          'Observar ≥ 4 h (6–8 h se grave/betabloqueado/reação tardia prévia); risco de reação bifásica (~5%, até 72 h)',
          'Na alta: prescrever adrenalina autoinjetável, plano de ação e encaminhamento à imunoalergia',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AAAAI/ACAAI/JTF 2023; WAO 2020',
        texto:
          'Corticoide e anti-histamínico NÃO são de rotina e não previnem reação bifásica — não devem atrasar a adrenalina. Observação de ~1 h pode bastar em caso leve sem fatores de risco (manter 6–8 h se grave). Preferir anti-H1 de 2ª geração à difenidramina.',
      },
    ],
  },
  {
    id: 'sca-ssst',
    nome: 'Síndrome coronariana aguda SEM supra (AI/IAMSSST)',
    secao: 'Cardiovasculares',
    cid10: ['I20.0', 'I21.4'],
    sinonimos: ['SCA', 'angina instável', 'IAMSSST', 'NSTEMI', 'dor torácica', 'infarto', 'GRACE'],
    capitulo: 30,
    resumo:
      'Engloba angina instável e IAM sem supra de ST. Diagnóstico por clínica de isquemia + ECG (sem supra persistente) + troponina (IAM = elevação/queda acima do percentil 99 com evidência de isquemia). Risco estratificado por GRACE e TIMI, que definem o momento da estratégia invasiva.',
    fisiopatologia: [
      'Instabilização de placa por ruptura, erosão (predomina no IAMSSST) ou nódulo calcificado, expondo superfície trombogênica.',
      'Trombose suboclusiva/com colaterais, sem oclusão transmural; na angina instável há isquemia sem necrose.',
      'IAM tipo 2: desequilíbrio oferta/demanda por condição subjacente (sepse, FA, anemia, hipóxia, crise hipertensiva), sem trombose primária.',
    ],
    exames: [
      {
        titulo: 'ECG (≤ 10 min da admissão)',
        itens: [
          'Infra de ST ≥ 0,05 mV em ≥ 2 derivações contíguas e/ou alterações de T; desnível dinâmico de ST é o mais específico',
          'Supra em aVR + infra difuso (≥ 6 derivações): doença de tronco/triarterial',
          'ECG normal não exclui SCA',
        ],
      },
      {
        titulo: 'Marcadores e imagem',
        itens: [
          'Troponina de alta sensibilidade (algoritmos de 1 h/2 h); precisa de ≥ 2 h da dor para elevar',
          'Função renal (risco e ajuste de antitrombóticos)',
          'Eco à beira-leito (disfunção/hipocinesia segmentar; diferenciais); angio-TC de coronárias exclui DAC em risco baixo/intermediário',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'MINOCA (espasmo, embolia, dissecção, disfunção microvascular)',
      'Miocardite/pericardite; takotsubo',
      'Embolia pulmonar; dissecção de aorta',
      'Taquiarritmias; sepse; insuficiência renal',
      'Espasmo esofágico',
    ],
    conduta: [
      {
        titulo: 'Medidas iniciais / antitrombótico',
        itens: [
          'MOVE: monitor, O₂ se SpO₂ < 90%, acesso venoso, ECG ≤ 10 min',
          'AAS 300 mg VO (depois 100 mg/dia); contraindicado só em alergia ou suspeita de dissecção',
          '2º antiagregante após conhecer a anatomia (prasugrel ou ticagrelor; clopidogrel se alto risco de sangramento)',
          'Anticoagulação (risco intermediário/alto): enoxaparina 1 mg/kg SC 12/12 h, HNF ou fondaparinux',
        ],
      },
      {
        titulo: 'Anti-isquêmico',
        itens: [
          'Nitrato SL → EV; contraindicado com inibidor de PDE-5 recente ou infarto de VD',
          'Betabloqueador (alvo FC ~60); evitar em risco de choque, BAV, broncoespasmo, cocaína',
          'Analgesia: preferir dipirona/paracetamol (morfina associada a piores desfechos)',
        ],
      },
      {
        titulo: 'Estratificação / invasiva',
        itens: [
          'Muito alto risco (cateterismo < 2 h): instabilidade, choque, dor refratária, arritmia grave, IC',
          'Alto risco (< 24 h): troponina compatível com IAM, alterações dinâmicas de ST/T, GRACE > 140',
          'Baixo risco: estratégia conservadora; todo IAM confirmado deve ser internado e estratificado',
          'Adjuvantes: estatina alta potência, iECA se disfunção/IC/HAS/DM, espironolactona se FEVE ≤ 40%',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (Tratado, 2024)',
        texto:
          'Enquadra a SCA como "com/sem oclusão coronária aguda (OCA/NOCA)" no lugar de STEMI/NSTEMI: ~25–30% das oclusões agudas (OMI) NÃO têm supra e têm pior prognóstico — valorizar ECG seriado e equivalentes. Estratifica por GRACE/TIMI (alto risco GRACE ≥ 130) e HEART/EDACS para alta segura.',
      },
      {
        diretriz: 'ESC 2023 (SCA) / ACC-AHA 2025',
        texto:
          'A invasiva de rotina em < 24 h no alto risco passou a ser IIa (não obrigatória). Pré-tratamento com inibidor de P2Y12 pode ser considerado quando a invasiva for tardia (> 24 h) ou indisponível. Preferir prasugrel/ticagrelor ao clopidogrel na ICP.',
      },
    ],
  },
  {
    id: 'iamcsst',
    nome: 'IAM com supra de ST (IAMCSST)',
    secao: 'Cardiovasculares',
    cid10: ['I21.3'],
    sinonimos: ['IAM', 'STEMI', 'infarto', 'SCA', 'supra de ST', 'reperfusão', 'trombólise'],
    capitulo: 31,
    resumo:
      'Diagnóstico clínico + ECG, feito em ≤ 10 min da chegada e SEM depender de troponina para iniciar tratamento. A angioplastia primária é superior à fibrinólise; quanto mais precoce a reperfusão, maior a área de miocárdio recuperada.',
    fisiopatologia: [
      'Desestabilização de placa (ruptura ~70%, erosão ~25%, nódulo calcificado ~5%) com trombose oclusiva.',
      'Oclusão completa se expressa como supra de ST; após 2–3 h surgem áreas necróticas no território.',
      'Reperfusão < 20 min → recuperação completa; 2–4 h → parcial (stunning); após horas → infarto consolidado.',
    ],
    exames: [
      {
        titulo: 'ECG (analisar ≤ 10 min)',
        itens: [
          'Supra: ponto J ≥ 1 mm em 2 derivações contíguas; V2–V3: ≥ 1,5 mm (mulher), ≥ 2 mm (homem >40a), ≥ 2,5 mm (homem <40a)',
          'Posteriores V7–V9: basta 0,5 mm (pesquisar se infra de V1–V3 com T positiva)',
          'Territórios: DA (anterior, V1–V6); circunflexa (lateral, DI/aVL); CD (inferior, DII/DIII/aVF)',
          'Equivalentes de oclusão → reperfusão imediata (cateterismo; ou fibrinólise se ICP indisponível): Sgarbossa-Smith (BRE), De Winter, Aslanger',
        ],
      },
      {
        titulo: 'Marcadores e imagem',
        itens: [
          'Troponina positiva em 2–3 h (NÃO aguardar para tratar)',
          'RX de tórax (IC; alargamento de mediastino → dissecção)',
          'Eco à beira-leito: função/mobilidade segmentar, complicações mecânicas, insuficiência mitral',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pericardite/miocardite (infra de PR, supra difuso)',
      'Repolarização precoce; aneurisma ventricular/infarto antigo',
      'BRE; ritmo de marca-passo; Brugada',
      'Hipercalemia; takotsubo; vasoespasmo (Prinzmetal)',
      'Hipotermia (onda de Osborn); dissecção de aorta',
    ],
    conduta: [
      {
        titulo: 'Reperfusão',
        itens: [
          'ICP primária se tempo porta-balão < 120 min; senão, fibrinólise local (porta-agulha alvo 30 min; benefício até 12 h do início da dor) se sem contraindicação',
          'Fibrinolítico: tenecteplase em bolus por peso (metade da dose se > 75 anos) ou alteplase',
          'Contraindicações absolutas à fibrinólise: qualquer hemorragia intracraniana prévia, AVC isquêmico < 3 meses, neoplasia/MAV intracraniana, TCE ou cirurgia de SNC < 3 meses, dissecção de aorta, sangramento ativo/diátese hemorrágica',
          'Critérios de reperfusão 60–90 min: queda ≥ 50% do supra, estabilidade e alívio da dor; falha → ICP de resgate',
          'Após fibrinólise com sucesso: cineangiocoronariografia em 3–24 h',
        ],
      },
      {
        titulo: 'Antitrombótico',
        itens: [
          'AAS 300 mg VO mastigado (depois 100 mg/dia)',
          'ICP: preferir prasugrel (60 mg → 10 mg/dia; contraindicado em AVC/AIT prévio, ≥ 75 anos ou < 60 kg — usar ticagrelor); alternativas ticagrelor ou clopidogrel 600 mg',
          'Fibrinólise: clopidogrel — ataque 300 mg se < 75 anos; ≥ 75 anos só manutenção 75 mg',
          'Enoxaparina pós-fibrinólise: 30 mg EV bolus + 1 mg/kg SC 12/12 h (sem bolus e 0,75 mg/kg se > 75 anos)',
        ],
      },
      {
        titulo: 'Adjuvantes',
        itens: [
          'O₂ só se SaO₂ < 90%; nitrato para dor/PA/IC (contraindicado em hipotensão, IAM de VD, inibidor de PDE-5)',
          'Betabloqueador VO após estabilidade (evitar agudo em grande infarto com risco de choque)',
          'iECA (maior benefício se FEVE < 40%/grande infarto) e estatina alta potência (atorvastatina 40 mg)',
          'Choque cardiogênico (6–7%): ICP, suporte mecânico; atenção a complicações mecânicas (3–7 dias)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (Tratado, 2024)',
        texto:
          'Paradigma OCA/NOCA (oclusão coronária aguda) em vez de IAMCSST: a indicação de reperfusão decorre da oclusão (com ou sem supra), não só do supra. Equivalentes de oclusão (De Winter, Sgarbossa-Smith, Aslanger, distorção terminal do QRS, T hiperaguda) também podem ser fibrinolisados se ICP indisponível. Estratificar por Killip; mnemônico "4 As" (AAS, anti-ADP, anticoagulação, abrir a artéria).',
      },
      {
        diretriz: 'ESC 2023 (SCA) / COMPLETE',
        texto:
          'Em multiarteriais SEM choque, recomenda-se revascularização completa das lesões não-culpadas (rotineira, na mesma internação) — não apenas no choque cardiogênico. ICP primária: preferir acesso radial e stent farmacológico.',
      },
    ],
  },
  {
    id: 'avc-isquemico',
    nome: 'AVC isquêmico agudo',
    secao: 'Neurológicas',
    cid10: ['I63.9'],
    sinonimos: ['AVCi', 'AVC', 'derrame', 'NIHSS', 'trombólise', 'trombectomia', 'alteplase'],
    capitulo: 54,
    resumo:
      'Déficit neurológico focal súbito por redução do aporte sanguíneo encefálico. "Tempo é cérebro" (~1,9 milhão de neurônios/min): o atendimento segue ABC, cálculo do NIHSS e definição rápida da reperfusão (trombólise EV e/ou trombectomia mecânica).',
    fisiopatologia: [
      'Forma-se um core de infarto irreversível e uma penumbra isquêmica adjacente, recuperável se reperfundida.',
      'A área de infarto avança sobre a penumbra com o tempo, reduzindo a chance de recuperação funcional.',
      'Mecanismos diversos (aterosclerose de grandes artérias, embolia cardioaórtica, oclusão de pequenas artérias); hipotensão piora a penumbra.',
    ],
    exames: [
      {
        titulo: 'Neuroimagem (obrigatória antes de reperfundir)',
        itens: [
          'TC de crânio sem contraste: exclui hemorragia/diferenciais (pode ser normal na fase aguda)',
          'ASPECTS (0–10) quantifica isquemia precoce na ACM; RM (DWI) é mais sensível precocemente',
          'Angio-TC/angio-RM de vasos para candidatos a trombectomia (não atrasar a trombólise)',
        ],
      },
      {
        titulo: 'Antes da trombólise / suporte',
        itens: [
          'Glicemia capilar em todos; coagulograma/plaquetas se uso de anticoagulante nas últimas 48 h',
          'Troponina e ECG; hemograma, ureia/creatinina, eletrólitos (não atrasar o trombolítico)',
          'PA em 2 membros (assimetria → dissecção); calcular e registrar NIHSS',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hipoglicemia (sempre checar glicemia)',
      'Crise epiléptica (paralisia de Todd); aura de enxaqueca',
      'Síncope; transtorno conversivo',
      'Encefalopatia de Wernicke; hematoma subdural; tumor cerebral',
      '20–25% das suspeitas não se confirmam (stroke mimics)',
    ],
    conduta: [
      {
        titulo: 'Geral / suporte',
        itens: [
          'ABC; IOT se Glasgow ≤ 8 ou risco de aspiração; SatO₂ > 94% (não suplementar se ≥ 95% em ar ambiente)',
          'PA: candidato a reperfusão < 185×110 antes e ≤ 180×105 por 24 h; sem reperfusão só tratar se ≥ 220×120 (reduzir ~15%)',
          'Glicemia: corrigir hipoglicemia (< 60) e hiperglicemia extrema; evitar controle intensivo; tratar febre; rastrear disfagia; profilaxia de TVP com compressão pneumática',
          'AAS 160–300 mg em até 48 h (após 24 h da trombólise e TC de controle)',
        ],
      },
      {
        titulo: 'Trombólise EV (alteplase)',
        itens: [
          'Até 4,5 h do último momento assintomático; meta admissão-agulha ≤ 60 min',
          'Dose: alteplase 0,9 mg/kg (máx 90 mg) — 10% em bolus, restante em 60 min',
          'Tenecteplase 0,25 mg/kg (máx 25 mg) em bolus único é alternativa/preferência (sobretudo se elegível a trombectomia/oclusão de grande vaso) — ver Atualizações',
          'Contraindicações: hemorragia, AVCi/cirurgia SNC < 3 meses, plaquetas < 100.000, INR > 1,7, PA ≥ 185×110 não controlada',
          'Após: PA < 180×105 por 24 h; vigiar transformação hemorrágica e angioedema orolingual',
        ],
      },
      {
        titulo: 'Trombectomia mecânica',
        itens: [
          'Até 24 h; não exclui a trombólise (elegíveis devem receber o trombolítico)',
          '< 6 h: Rankin 0–1, oclusão de carótida/M1, NIHSS ≥ 6, ASPECTS ≥ 6',
          '6–16 h: critérios DEFUSE-3; 6–24 h: critérios DAWN (imagem de penumbra)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AHA/ASA 2026',
        texto:
          'Tenecteplase 0,25 mg/kg (máx 25 mg, bolus único) é Classe 1 — igual/preferível à alteplase em < 4,5 h e preferível na oclusão de grande vaso (FDA mar/2025; no Brasil, off-label/em aprovação para AVC).',
      },
      {
        diretriz: 'AHA/ASA 2026',
        texto:
          'Trombectomia passou a ser indicada também em grande core / ASPECTS baixo (~3–5) por oclusão de ACI/M1 em centros habilitados — o limiar ASPECTS ≥ 6 ficou restritivo. Desaconselha-se controle glicêmico intensivo (80–130).',
      },
    ],
  },
  {
    id: 'tep',
    nome: 'Tromboembolismo pulmonar (TEP)',
    secao: 'Respiratórias',
    cid10: ['I26.9'],
    sinonimos: ['TEP', 'embolia pulmonar', 'TEV', 'Wells', 'D-dímero', 'PESI'],
    capitulo: 46,
    resumo:
      'Obstrução da artéria pulmonar/ramos por êmbolos (espectro do TEV com a TVP). A gravidade depende da hemodinâmica (instáveis: letalidade até 45%). Abordagem lógica: probabilidade pré-teste (Wells/Genebra) → teste diagnóstico → estratificação de risco (PESI, VD, biomarcadores) → tratamento.',
    fisiopatologia: [
      'Tríade de Virchow (lesão endotelial, estase, hipercoagulabilidade); êmbolos de veias ilíacas/femorais/poplíteas.',
      'Maior carga embólica ↑ resistência vascular pulmonar → dilatação/disfunção de VD (↑ troponina/BNP), ↓ pré-carga do VE, choque.',
      'Hipoxemia por distúrbio V/Q; vasoconstrição hipóxica e mediadores perpetuam o quadro.',
    ],
    exames: [
      {
        titulo: 'Probabilidade pré-teste',
        itens: [
          'Escores de Wells ou Genebra (improvável vs. provável)',
          'PERC em baixo risco: 8 itens negativos encerram a investigação (probabilidade < 2%)',
        ],
      },
      {
        titulo: 'Diagnóstico',
        itens: [
          'D-dímero (ELISA) para excluir em probabilidade baixa/intermediária; corte ajustado por idade (>50a: idade×10); algoritmo YEARS',
          'Angio-TC de tórax: exame de escolha em alta probabilidade ou D-dímero positivo (S/E > 90%)',
          'Cintilografia V/Q se contraste contraindicado (gestante, DRC, anafilaxia); POCUS de MMII/eco',
        ],
      },
      {
        titulo: 'Estratificação',
        itens: [
          'Troponina e BNP/NT-proBNP; eco/TC para disfunção de VD; escore PESI (risco de morte em 30 dias)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Síndrome coronariana aguda',
      'Pneumonia; broncoespasmo',
      'Pneumotórax; tamponamento cardíaco',
      'Disfunção ventricular esquerda',
      'Dissecção de aorta',
    ],
    conduta: [
      {
        titulo: 'Anticoagulação',
        itens: [
          'Esteio do tratamento; em probabilidade > 20%, anticoagular empiricamente (alta: 1ª dose antes da confirmação)',
          'Enoxaparina (HBPM) 1,5 mg/kg SC 1x/dia ou 1 mg/kg 12/12 h (ClCr < 30: 1 mg/kg 1x/dia); HNF se instabilidade, DRC grave, extremos de peso/idade',
          'Fondaparinux SC 1x/dia; DOAC (rivaroxabana 15 mg 12/12 h × 21 d → 20 mg/dia; apixabana 10 mg 12/12 h × 7 d → 5 mg 12/12 h)',
          'Tempo: 3 meses se fator transitório; estendido em não provocado/recorrente ou neoplasia ativa',
        ],
      },
      {
        titulo: 'TEP de alto risco (reperfusão)',
        itens: [
          'Trombólise no TEP maciço/hipotensão (PAS < 90); considerar no submaciço com deterioração',
          'Agentes: rtPA 100 mg EV em 2 h (ou 0,6 mg/kg em 15 min); tenecteplase por peso',
          'Contraindicações absolutas: hemorragia intracraniana prévia, AVC isquêmico < 3 meses, neoplasia/MAV intracraniana, dissecção de aorta, TCE recente, sangramento ativo (no alto risco com instabilidade, podem ser relativizadas)',
          'Maior benefício < 48 h (janela até 14 d); na PCR por TEP suspeito, trombolisar e manter RCP ≥ 60 min',
          'Falha/contraindicação: trombólise por cateter, embolectomia; filtro de VCI se anticoagulação contraindicada',
        ],
      },
      {
        titulo: 'Suporte hemodinâmico/respiratório',
        itens: [
          'Cristaloide com cautela (bolus ≤ 500 mL em alíquotas) — excesso piora o VD',
          'Noradrenalina para hipotensão; dobutamina se baixo débito; ECMO VA em refratários',
          'O₂ se SaO₂ < 90%; cautela com IOT (indutor cardioestável, evitar apneia/acidose)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC 2019 / CHEST (ACCP) 2021',
        texto:
          'DOAC são 1ª linha no paciente estável elegível (sobre VKA e HBPM); HBPM/HNF reservadas a instabilidade, DRC grave, extremos de peso, SAF ou gestação. Rivaroxabana/apixabana são orais desde o início; dabigatrana/edoxabana exigem 5–10 dias de heparina prévia.',
      },
      {
        diretriz: 'ESC 2019 / ASH 2020',
        texto:
          'Alta precoce / tratamento ambulatorial é apropriado no baixo risco (PESI classe I–II ou critérios HESTIA). Em TEV associado a câncer, preferir Xa oral à HBPM (exceção: malignidade luminal de TGI).',
      },
    ],
  },
  {
    id: 'cad-ehh',
    nome: 'Cetoacidose diabética e estado hiperosmolar (CAD/EHH)',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E14.1', 'E14.0'],
    sinonimos: ['CAD', 'EHH', 'cetoacidose', 'hiperglicemia', 'diabetes', 'estado hiperosmolar'],
    capitulo: 91,
    resumo:
      'Complicações agudas das hiperglicemias por hipoinsulinemia. CAD: glicemia > 200, pH < 7,3 e cetonemia/cetonúria positivas. EHH: glicemia > 600, osmolaridade efetiva > 300 mOsm/kg (ou total > 320) e pH > 7,3.',
    fisiopatologia: [
      'CAD: deficiência relativa/absoluta de insulina; EHH: deficiência apenas relativa, suficiente para suprimir glucagon (sem cetoácidos).',
      'Insulina baixa + hormônios contrarreguladores ↑ gliconeogênese/glicogenólise → hiperglicemia, diurese osmótica, desidratação, ↑ osmolaridade.',
      'Na CAD, a queda de insulina libera a β-oxidação hepática de ácidos graxos, gerando cetoácidos e acidose; no EHH a desidratação é muito mais intensa.',
    ],
    exames: [
      {
        titulo: 'Glicemia e cetonas',
        itens: [
          'Glicemia inicial e capilar 1/1 h',
          'Cetonemia (β-hidroxibutirato preferível) ou cetonúria; risco de fita urinária falso-negativa em sepse',
        ],
      },
      {
        titulo: 'Gasometria e ânion-gap',
        itens: [
          'Gasometria (arterial e depois venosa, repetir 4/4 h); pH/HCO₃ definem gravidade da CAD',
          'Ânion-gap aumentado na CAD (> 10–12); < 12 no EHH',
        ],
      },
      {
        titulo: 'Eletrólitos e função renal',
        itens: [
          'K⁺ em 2 h e depois 4/4 h (K total baixo, mas sérico pode subir pela acidose)',
          'Na corrigido = Na + 1,6 × [(glicemia − 100)/100]; osmolaridade efetiva = 2×Na + glicemia/18',
          'Ureia/creatinina; hemograma, urina 1, ECG, RX de tórax (precipitante)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Cetoacidose alcoólica (cetoácidos sem hiperglicemia)',
      'Cetoacidose euglicêmica por inibidores de SGLT2',
      'Acidose lática e outras acidoses de ânion-gap',
      'Outras causas de rebaixamento se osmolaridade < 320 (hipoglicemia, etc.)',
    ],
    conduta: [
      {
        titulo: 'Volume',
        itens: [
          'NaCl 0,9% 1.000–1.500 mL na 1ª hora (no EHH, vários litros); depois 250–500 mL/h',
          'NaCl 0,45% se Na corrigido normal/alto; manter 0,9% se < 135',
          'Glicemia 250–300 mg/dL: associar glicose 5–10% à salina',
        ],
      },
      {
        titulo: 'Insulina',
        itens: [
          'Iniciar com a hidratação, EXCETO se K < 3,3 mEq/L (repor K antes)',
          'Bomba EV: bolus 0,1 U/kg + 0,1 U/kg/h (ou 0,14 U/kg/h sem bolus)',
          'Alvo de queda 50–70 mg/dL/h; manter basal de quem já usava',
        ],
      },
      {
        titulo: 'Potássio / resolução',
        itens: [
          'K < 3,3: repor e adiar insulina; K 3,3–5,0: 25 mEq por litro; K > 5: só repor quando < 5',
          'Bicarbonato apenas se pH ≤ 6,9; fósforo só em casos selecionados',
          'Resolver com ≥ 2 de 3: pH > 7,3, ânion-gap ≤ 12, HCO₃ ≥ 18 (ou β-OHB < 0,6); sobrepor insulina SC ≥ 1 h antes de desligar a bomba',
          'Corrigir o precipitante; CAD/EHH são pró-trombóticos → profilaxia de TEV',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Consenso ADA/EASD 2024 (crises hiperglicêmicas)',
        texto:
          'Diagnóstico de CAD: glicemia ≥ 200 (ou DM conhecido) + β-hidroxibutirato ≥ 3,0 mmol/L (ou cetonúria ≥ 2+) + pH < 7,3 OU HCO₃ < 18. O ânion-gap deixou de ser critério diagnóstico (mantido como apoio).',
      },
      {
        diretriz: 'Consenso ADA/EASD 2024',
        texto:
          'Gravidade e resolução passam a se basear no β-OHB (grave se > 6 mmol/L; resolução com β-OHB < 0,6). Na CAD euglicêmica por SGLT2 a glicemia pode ser < 200–250 — dosar cetona mesmo sem hiperglicemia franca.',
      },
    ],
  },
  {
    id: 'choque',
    nome: 'Choque',
    secao: 'Choque e anafilaxia',
    cid10: ['R57.9'],
    sinonimos: [
      'hipoperfusão',
      'distributivo',
      'cardiogênico',
      'hipovolêmico',
      'obstrutivo',
      'RUSH',
      'lactato',
      'vasopressor',
    ],
    capitulo: 8,
    resumo:
      'Expressão clínica da hipoperfusão/hipóxia tecidual por desequilíbrio entre oferta (DO₂) e consumo (VO₂) de O₂. Hipotensão é frequente mas não obrigatória (PAS < 90 / PAM < 70, hiperlactatemia, sinais nas 3 janelas de perfusão). Quatro mecanismos — distributivo, cardiogênico, hipovolêmico, obstrutivo — muitas vezes combinados; tratar imediatamente, em paralelo à correção da causa.',
    fisiopatologia: [
      'DO₂ depende sobretudo de hemoglobina, saturação e débito cardíaco; abaixo do DO₂ crítico a extração periférica não compensa e inicia-se metabolismo anaeróbico com hiperlactatemia.',
      'Distributivo: queda da resistência vascular (DC inicialmente alto). Cardiogênico, hipovolêmico e obstrutivo cursam com baixo DC.',
      'Hipoperfusão mantida gera resposta inflamatória e lesão microvascular, perpetuando disfunção orgânica até SDMOS.',
    ],
    exames: [
      {
        titulo: 'Perfusão (clínica)',
        itens: [
          '3 janelas: pele (fria/livedo, TEC > 2–3 s), rim (débito < 0,5 mL/kg/h) e SNC (estado mental)',
          'TEC > 3 s e mottling score correlacionam-se com pior perfusão/mortalidade',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'Lactato (> 2 mmol/L típico; > 4 = gravidade) e clearance seriado',
          'Gasometria/base excess; marcadores conforme suspeita (troponina/BNP no cardiogênico)',
        ],
      },
      {
        titulo: 'POCUS / protocolo RUSH',
        itens: [
          'Pericárdio (tamponamento), VD (dilatação → TEP/IAM de VD), VE (função/contratilidade), VCI (pré-carga)',
          'FAST (líquido livre/hemorragia), tórax (pneumotórax, hemotórax), aorta (> 5 cm → AAA roto)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Distinguir pelos perfis: hipovolêmico/cardiogênico/obstrutivo → DC baixo, RVS alta; distributivo → RVS baixa, DC alto (precoce)',
      'Distributivo: séptico (mais comum), anafilático, neurogênico, crise adrenal',
      'Obstrutivo: TEP, pneumotórax hipertensivo, tamponamento',
      'Cardiogênico: IAM extenso/de VD, arritmia, complicação mecânica/valvar',
      'Hipovolêmico: hemorrágico (trauma) vs não hemorrágico (perdas GI/renais)',
    ],
    conduta: [
      {
        titulo: 'Abordagem geral',
        itens: [
          'Tratar já, em paralelo à correção da causa (hemostasia, ICP na SCA, trombólise no TEP, ATB/foco na sepse)',
          'Pré-carga: cristaloide balanceado em alíquotas (250–500 mL) reavaliando fluidotolerância (elevação passiva das pernas)',
          'Noradrenalina é o vasopressor de 1ª linha (exceto anafilático → adrenalina); pode iniciar em acesso periférico calibroso, precocemente',
          'Alvo PAM 65 mmHg ajustado pela perfusão (janelas + lactato); transfundir se Hb < 7 (no hemorrágico, guiar pela hipotensão)',
          'Otimizar hemodinâmica antes da IOT; indutor cardioestável (etomidato/cetamina)',
        ],
      },
      {
        titulo: 'Por tipo de choque',
        itens: [
          'Hemorrágico: hemocomponentes 1:1:1, ácido tranexâmico ≤ 3 h, hipotensão permissiva (exceto TCE)',
          'Séptico: ATB + foco, cristaloide, NA; vasopressina como 2ª droga; dobutamina se disfunção miocárdica',
          'Cardiogênico: dobutamina; reduzir pós-carga só se PAS ≥ 90; suporte mecânico; tratar a causa (evitar adrenalina)',
          'Obstrutivo: TEP → anticoagular/trombolisar; tamponamento → pericardiocentese; pneumotórax hipertensivo → drenagem',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (Tratado, 2024)',
        texto:
          'Descreve um 5º mecanismo além dos quatro clássicos: choque citopático/mitocondrial (intoxicação por CO, cianeto, H₂S, meta-hemoglobinemia). Úteis à beira-leito: índice de choque (FC/PAS > 0,9 = pior prognóstico) e push-dose pressors como ponte. Considera o cristaloide balanceado plausível, mas sem superioridade comprovada sobre o SF na reanimação inicial.',
      },
      {
        diretriz: 'Surviving Sepsis 2021/2026',
        texto:
          'Noradrenalina permanece 1ª linha; cristaloides balanceados sugeridos sobre SF 0,9%; ressuscitação guiada por perfusão (tempo de enchimento capilar + lactato) em vez de normalizar o lactato a qualquer custo. Vasopressor por acesso periférico calibroso é seguro.',
      },
    ],
  },
  {
    id: 'crise-hipertensiva',
    nome: 'Emergência e urgência hipertensiva',
    secao: 'Cardiovasculares',
    cid10: ['I10'],
    sinonimos: [
      'crise hipertensiva',
      'emergência hipertensiva',
      'urgência hipertensiva',
      'pseudocrise',
      'pico hipertensivo',
      'PA alta',
    ],
    capitulo: 36,
    resumo:
      'Emergência hipertensiva (EH): PA muito elevada (tipicamente > 180/120) com lesão de órgão-alvo aguda → controle EV titulável e internação. Urgência (UH): PA elevada sintomática SEM lesão de órgão-alvo, em geral sem tratamento agudo no PS. Pseudocrise (dor, pânico, estresse): tratar a causa, não a PA. Redução excessiva causa hipoperfusão — controle gradual e por cenário.',
    fisiopatologia: [
      'Gatilho abrupto sobre HAS preexistente → estresse mecânico, lesão endotelial, ativação de coagulação/SRAA e isquemia tecidual.',
      'Falha da autorregulação: ao ultrapassar o limiar, surgem vasodilatação, extravasamento e edema (ex.: edema cerebral na encefalopatia).',
      'Achado de necrose fibrinoide arteriolar; maior chance de HAS secundária. Crise adrenérgica (cocaína, feocromocitoma, retirada de clonidina) por excesso de catecolaminas.',
    ],
    exames: [
      {
        titulo: 'Rotina na suspeita de EH',
        itens: [
          'Hemograma, ureia/creatinina, eletrólitos, urina 1',
          'Hemólise microangiopática: LDH, haptoglobina, bilirrubina, esquizócitos',
          'Na urgência hipertensiva, exames em geral não são necessários',
        ],
      },
      {
        titulo: 'Dirigidos por cenário',
        itens: [
          'Troponina (SCA), BNP (EAP/IC), D-dímero (dissecção), ECG',
          'Fundoscopia (retinopatia Keith-Wagener) — pode estar ausente em > 30%',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'RX de tórax (congestão, alargamento de mediastino)',
          'TC/RM de crânio (AVE/HSA, edema da encefalopatia); angio-TC de aorta (dissecção)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pseudocrise: PA reativa a dor/estresse/pânico — tratar a causa, não anti-hipertensivo',
      'Urgência hipertensiva: PA muito alta sintomática SEM lesão de órgão-alvo',
      'EH: confirmar lesão de órgão-alvo aguda (encefalopatia, AVE, SCA, EAP, dissecção, eclâmpsia, LRA)',
      'Pré-eclâmpsia/eclâmpsia: única EH potencialmente assintomática — considerar gestação',
    ],
    conduta: [
      {
        titulo: 'Princípios e metas',
        itens: [
          'Fármacos EV tituláveis de meia-vida curta; toda EH interna (em geral UTI)',
          'Regra geral (sem cenário específico): reduzir a PAM ~10–20% na 1ª h (não exceder 25% no 1º dia), depois < 160/110 nas 23 h seguintes; normalizar em 24–48 h',
          'Drogas EV citadas: nitroprussiato, nitroglicerina, labetalol, esmolol, metoprolol, hidralazina',
        ],
      },
      {
        titulo: 'Por cenário',
        itens: [
          'AVCi: < 185/110 se for trombolisar (< 180/105 após); se não, só tratar se > 220/120',
          'AVC hemorrágico: PAS-alvo ~130–140; HSA: PAS < 160',
          'Dissecção de aorta: FC < 60 e PAS 100–120 — betabloqueador EV ANTES do vasodilatador',
          'EAP/SCAPE: nitroglicerina (alta dose) + furosemida + VNI; evitar hidralazina/betabloqueador',
          'SCA: nitroglicerina + betabloqueador; evitar nitroprussiato e hidralazina',
          'Eclâmpsia: labetalol ou hidralazina + sulfato de magnésio; considerar parto',
          'Crise adrenérgica/cocaína/feocromocitoma: benzodiazepínico, fentolamina/nitroprussiato — NUNCA betabloqueador isolado',
        ],
      },
      {
        titulo: 'Urgência / pseudocrise',
        itens: [
          'Maioria das urgências NÃO requer medicação no PS; ambiente calmo já reduz a PA',
          'Reintroduzir/ajustar anti-hipertensivo VO e garantir retorno ambulatorial precoce',
          'Evitar nifedipina (sobretudo sublingual) — queda rápida pode causar AVE',
          'Pseudocrise: repouso, analgésico, ansiolítico — tratar a causa',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACC/AHA 2025; ESC/ESH 2023',
        texto:
          'Não tratar HAS grave assintomática (sem lesão de órgão-alvo) com anti-hipertensivo EV/“se necessário”. A ESC/ESH 2023 abandona o termo “urgência hipertensiva” e cita labetalol e nicardipina (e clevidipina) como agentes seguros de escolha. AVC hemorrágico: alvo PAS 130 a < 140 mantido por ~7 dias.',
      },
      {
        diretriz: 'Prática atual',
        texto:
          'Onde disponíveis, preferir clevidipina/nicardipina e nitroglicerina ao nitroprussiato (risco de tiocianato e roubo coronário).',
      },
    ],
  },
  {
    id: 'asma',
    nome: 'Asma — exacerbação',
    secao: 'Respiratórias',
    cid10: ['J45.9', 'J46'],
    sinonimos: ['asma', 'broncoespasmo', 'crise asmática', 'sibilância', 'bombinha'],
    capitulo: 42,
    resumo:
      'Exacerbação é diagnóstico clínico de gravidade. Base: broncodilatador inalatório (β2 de curta + ipratrópio) + corticoide sistêmico precoce em quase todos; sulfato de magnésio na crise grave/refratária. Tórax silente, rebaixamento, bradicardia e incapacidade de falar indicam parada iminente e IOT imediata.',
    fisiopatologia: [
      'Inflamação crônica das vias aéreas (resposta Th2/IgE) com hiper-reatividade da musculatura lisa, edema e hipersecreção.',
      'Resposta precoce (1–2 h) e tardia (3–12 h, ~50%) por mastócitos, linfócitos T e eosinófilos; inflamação crônica leva a remodelamento.',
      'Infecções virais precipitam ~80% das crises; também aeroalérgenos, AAS, betabloqueadores, DRGE, exercício.',
    ],
    exames: [
      {
        titulo: 'Gravidade (clínica)',
        itens: [
          'Diagnóstico de exacerbação é clínico; exames avaliam gravidade/complicações',
          'Sinais de gravidade: FR > 30, FC > 120, musculatura acessória, frases incompletas',
          'Parada iminente: alteração de consciência, tórax silente, bradicardia, cianose',
        ],
      },
      {
        titulo: 'Oximetria / função',
        itens: [
          'SatO₂ em todos; PFE (peak-flow) ou VEF1 é a melhor medida objetiva (não fazer se IRpA iminente)',
          'PFE/VEF1 ≤ 50% do previsto = grave; reavaliar de hora em hora',
        ],
      },
      {
        titulo: 'Gasometria / imagem',
        itens: [
          'Gasometria se desconforto importante ou VEF1/PFE < 50%; PaCO₂ > 45 sugere UTI',
          'RX de tórax NÃO rotineiro (só se suspeita de pneumonia/pneumotórax/internação)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Obstrução de via aérea superior (estridor) e disfunção de pregas vocais',
      'Insuficiência cardíaca descompensada (B3, crepitações)',
      'Corpo estranho/doença endobrônquica (sibilo localizado)',
      'Embolia pulmonar, DPOC, anafilaxia (diferencial crítico no grave indiferenciado)',
    ],
    conduta: [
      {
        titulo: 'Primeira linha',
        itens: [
          'O₂ só se hipoxêmico (menor fluxo possível)',
          'β2 de curta (salbutamol): 4–8 puffs com espaçador ou nebulização 2,5–5 mg a cada 20 min na 1ª h',
          'Ipratrópio associado ao β2 na crise grave (500 µg/nebulização na 1ª h)',
          'Corticoide sistêmico precoce (≤ 1 h) em quase todos: prednisona 40–60 mg VO/dia, 5–7 dias (EV se vômito/crise muito grave)',
        ],
      },
      {
        titulo: 'Crise grave / refratária',
        itens: [
          'Sulfato de magnésio 2 g EV em 20 min (dose única) na crise grave sem resposta',
          'Evitar metilxantinas (aminofilina/teofilina) — sem benefício e mais eventos adversos',
          'Adrenalina IM só se anafilaxia/angioedema associado',
        ],
      },
      {
        titulo: 'Suporte / gravidade',
        itens: [
          'VNI: trial curto possível em cooperativo sem indicação de IOT imediata (não sedar para acoplar)',
          'IOT se parada iminente; sequência rápida com cetamina; tubo calibroso; hipercapnia permissiva',
          'UTI: piora apesar do tratamento, sonolência/tórax silente, PaCO₂ > 45',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'GINA 2026',
        texto:
          'Alvo de O₂ no DE é SpO₂ 93–95% em adultos/adolescentes (evitar hiperóxia) — mais específico que o “> 92%” do capítulo. O reliever anti-inflamatório (ICS-formoterol) é preferido ao SABA isolado na estratégia de manutenção.',
      },
    ],
  },
  {
    id: 'dpoc',
    nome: 'DPOC — exacerbação',
    secao: 'Respiratórias',
    cid10: ['J44.1'],
    sinonimos: [
      'DPOC',
      'enfisema',
      'bronquite crônica',
      'exacerbação',
      'Anthonisen',
      'descompensação',
    ],
    capitulo: 43,
    resumo:
      'Exacerbação = piora dos sintomas cardinais (dispneia, volume e/ou purulência do escarro) nos últimos 14 dias, em geral por infecção (~70%), poluentes, broncoespasmo ou TEP. Base: broncodilatadores de curta (SABA + SAMA), corticoide sistêmico, O₂ controlado (alvo SpO₂ 88–92%), antibiótico por critérios de Anthonisen e VNI precoce na insuficiência respiratória hipercápnica.',
    fisiopatologia: [
      'Obstrução fixa ao fluxo aéreo por enfisema e/ou bronquite crônica, com inflamação, estresse oxidativo e desbalanço protease-antiprotease.',
      'Hiperinsuflação com disfunção diafragmática; alteração de trocas com hipoxemia/hipercapnia; tardiamente hipertensão pulmonar e cor pulmonale.',
      'Exacerbação ~70% infecciosa (rinovírus; pneumococo, H. influenzae, M. catarrhalis; Pseudomonas em doença estrutural); ~30% por poluentes/broncoespasmo/TEP (~6%).',
    ],
    exames: [
      {
        titulo: 'Imagem',
        itens: [
          'RX de tórax em todos no DE (altera conduta em ~20%: consolidação, pneumotórax, congestão)',
          'TC se dúvida diagnóstica ou suspeita de TEP',
        ],
      },
      {
        titulo: 'Gasometria arterial',
        itens: [
          'Se internação, suspeita de acidose respiratória ou previsão de suporte ventilatório',
          'IRpA: PaO₂ < 60 e/ou PaCO₂ > 50; grave: PaO₂ < 50, PaCO₂ > 70, pH < 7,3',
        ],
      },
      {
        titulo: 'ECG e laboratório',
        itens: [
          'ECG (p pulmonale, taquicardia atrial multifocal); troponina se isquemia; BNP no diferencial com IC',
          'Hemograma, eletrólitos (hipocalemia por broncodilatador), função renal se internação',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Insuficiência cardíaca descompensada (congestão, BNP elevado)',
      'Tromboembolismo pulmonar (dor torácica, alcalose sem retenção de CO₂)',
      'Pneumonia; pneumotórax',
      'Asma / overlap asma-DPOC; bronquiectasias, TB',
    ],
    conduta: [
      {
        titulo: 'Primeira linha',
        itens: [
          'SABA (salbutamol/fenoterol) + SAMA (ipratrópio) inalatórios combinados, repetidos a cada 15–20 min e espaçando conforme melhora',
          'Corticoide sistêmico em todos: prednisona 40 mg VO/dia por 5 dias (EV se grave)',
          'O₂ controlado: alvo SpO₂ 88–92% (preferir máscara de Venturi); menor fluxo possível, mesmo com leve hipercapnia',
          'Sulfato de magnésio 2 g EV na crise grave sem resposta; evitar metilxantinas',
        ],
      },
      {
        titulo: 'Suporte ventilatório',
        itens: [
          'VNI é 1ª linha na IRpA hipercápnica (reduz mortalidade e IOT): pH < 7,35 com PaCO₂ > 45, dispneia com musculatura acessória ou hipoxemia refratária',
          'IOT se rebaixamento, pausas respiratórias, instabilidade, secreção/aspiração ou falha/contraindicação à VNI',
        ],
      },
      {
        titulo: 'Antibiótico',
        itens: [
          'Critérios de Anthonisen: 3 sintomas cardinais, ou 2 se um for purulência, ou sempre que houver suporte ventilatório',
          'Sem risco de Pseudomonas: amoxicilina-clavulanato, cefalosporina de 2ª geração ou quinolona',
          'Risco de Pseudomonas (VEF1 < 30%, corticoide crônico, doença estrutural): quinolona respiratória/combinação. Duração 5–7 dias',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'GOLD 2026',
        texto:
          'O capítulo segue alinhado à GOLD 2026 no manejo de emergência: SpO₂ 88–92%, corticoide ≤ 5 dias, antibiótico por critérios de Anthonisen e VNI como 1ª modalidade na IRpA hipercápnica. (A mudança da GOLD 2026 — LABA/LAMA inicial em quem teve ≥ 1 exacerbação moderada/grave no ano — é de manejo crônico/alta, não da emergência.)',
      },
    ],
  },
  {
    id: 'fibrilacao-atrial',
    nome: 'Fibrilação atrial',
    secao: 'Cardiovasculares',
    cid10: ['I48'],
    sinonimos: ['FA', 'arritmia', 'CHA2DS2-VASc', 'cardioversão', 'anticoagulação', 'flutter'],
    capitulo: 32,
    resumo:
      'Arritmia sustentada mais comum no DE: QRS irregularmente irregular, sem onda P. Decisões centrais: prevenir tromboembolismo (anticoagulação por escore) e controlar sintomas (frequência ou ritmo). Instabilidade claramente secundária à FA → cardioversão elétrica imediata.',
    fisiopatologia: [
      'Ativação atrial desordenada com perda da contração; em disfunção de VE pode descompensar a IC.',
      'Frequentemente precipitada por causa aguda: sepse/infecção, IAM, TEP, tireotoxicose, distúrbios eletrolíticos, álcool ("holiday heart"), DPOC.',
      'Estase no apêndice atrial esquerdo favorece trombo → risco de AVC ~5×.',
    ],
    exames: [
      {
        titulo: 'ECG',
        itens: ['RR irregularmente irregular, sem onda P, ondas "f"; avaliar pré-excitação (WPW)'],
      },
      {
        titulo: 'Laboratório / imagem',
        itens: [
          'Eletrólitos (K, Mg), função renal (anticoagulação), TSH, troponina se isquemia',
          'ECO (átrio esquerdo, função, valvopatia); ECO transesofágico p/ excluir trombo antes de cardioverter',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Flutter atrial (mesmo risco embólico)',
      'TSV por reentrada (QRS estreito regular)',
      'Taquicardia atrial multifocal (≥ 3 morfologias de P; DPOC)',
      'FA pré-excitada (WPW) simulando QRS largo',
    ],
    conduta: [
      {
        titulo: 'Instável',
        itens: [
          'Cardioversão elétrica sincronizada imediata se instabilidade secundária à FA (120–200 J)',
          'WPW + FA instável: cardioversão; NÃO usar digoxina, betabloqueador, BCC ou amiodarona (risco de FV)',
        ],
      },
      {
        titulo: 'Controle de frequência',
        itens: [
          'Alvo FC < 110 bpm; 1ª linha betabloqueador ou BCC não diidro (diltiazem/verapamil)',
          'BCC contraindicado se FE < 40%; disfunção de VE: amiodarona EV (ou digoxina)',
          'Tratar a causa precipitante (sepse, anemia, hipoxemia, tireotoxicose)',
        ],
      },
      {
        titulo: 'Controle de ritmo / cardioversão',
        itens: [
          'FA < 48 h (USP usa janela mais conservadora de 24 h): cardioversão possível (elétrica ou química) — amiodarona se cardiopatia; propafenona/flecainida se coração estrutural normal',
          'FA ≥ 48 h ou indeterminada: anticoagular 3 semanas OU ECO transesofágico excluindo trombo antes',
          'Manter anticoagulação ≥ 4 semanas após a cardioversão',
        ],
      },
      {
        titulo: 'Anticoagulação',
        itens: [
          'Estratificar por CHA₂DS₂-VASc; DOAC é 1ª escolha (varfarina INR 2–3 se estenose mitral mod/grave ou prótese mecânica)',
          'AAS/clopidogrel NÃO previnem AVC na FA',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC 2024 / ACC-AHA 2023',
        texto:
          'Mnemônico evolui de ABC para CARE (Comorbidades, Anticoagulação, Reduzir sintomas, rEavaliação). A USP adota CHA₂DS₂-VA (sem o componente sexo) com anticoagulação a partir de escore ≥ 1.',
      },
    ],
  },
  {
    id: 'taquiarritmias',
    nome: 'Taquiarritmias (TSV e TV)',
    secao: 'Cardiovasculares',
    cid10: ['I47.1', 'I47.2'],
    sinonimos: [
      'taquicardia',
      'TSV',
      'TPSV',
      'TV',
      'taquicardia ventricular',
      'adenosina',
      'torsades',
    ],
    capitulo: 33,
    resumo:
      'FC > 100 bpm. Abordagem por QRS (estreito ≤ 120 ms ≈ supraventricular; largo > 120 ms = tratar como TV) e regularidade. Conduta guiada pela estabilidade: instabilidade (5 "D") → cardioversão/desfibrilação imediata. TSV estável: manobra vagal → adenosina.',
    fisiopatologia: [
      'Reentrada (início/término abruptos, RR regular — TRN, TAV, flutter): reverte com vagal/adenosina se o nó AV faz parte do circuito.',
      'Automatismo aumentado (foco ectópico; eletrólitos, adrenérgico) e atividade deflagrada (torsades; hipoK/hipoMg, QT longo).',
      'QRS largo = origem ventricular, via anômala (antidrômica) ou aberrância.',
    ],
    exames: [
      {
        titulo: 'ECG 12 derivações',
        itens: [
          'Sistematizar: FC > 100? QRS estreito vs largo? RR regular vs irregular? Há P/ondas F?',
          'QRS muito largo (> 200 ms) com FC baixa → causa tóxico-metabólica (hipercalemia, tricíclicos)',
        ],
      },
      {
        titulo: 'Laboratório / POCUS',
        itens: [
          'K, Mg, Ca; TSH; troponina só se suspeita de SCA (não de rotina na TSV)',
          'POCUS: função do VE, VCI, VD (TEP), derrame pericárdico',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'QRS estreito regular: TRN, TAV, flutter, taquicardia atrial, sinusal',
      'QRS estreito irregular: FA, flutter de condução variável, taquicardia atrial multifocal',
      'QRS largo: TV (≥ 90% se cardiopatia/IAM prévio), TSV com aberrância, TAV antidrômica',
      'História de cardiopatia e dissociação AV favorecem TV',
    ],
    conduta: [
      {
        titulo: 'Instável (qualquer taquiarritmia)',
        itens: [
          'Cardioversão elétrica sincronizada (TSV/flutter 50–100 J; TV monomórfica 100 J, escalonar)',
          'TV polimórfica/torsades instável: desfibrilação (choque não sincronizado); torsades + MgSO₄ 2 g EV',
          'Adenosina, betabloqueador e BCC contraindicados/ineficazes no instável',
        ],
      },
      {
        titulo: 'QRS estreito (estável)',
        itens: [
          'TSV: manobra vagal — Valsalva modificada (REVERT) → adenosina 6 mg EV em bolus rápido (repetir 12 mg)',
          '2ª linha (sem cardiopatia): verapamil/diltiazem EV ou betabloqueador',
          'Taquicardia sinusal/atrial: tratar a causa, corrigir eletrólitos; controle de FC',
          'FA/flutter no WPW: cardioversão 200 J; contraindicados adenosina/BB/BCC/digital/amiodarona',
        ],
      },
      {
        titulo: 'QRS largo / TV',
        itens: [
          'Tratar como TV; sala de emergência, monitor, desfibrilador próximo',
          'TV estável: preferir cardioversão; ou amiodarona 150 mg em 10 min + manutenção (evitar se QT longo); alternativa lidocaína',
          'Torsades: MgSO₄ 2 g EV; corrigir K/Mg, suspender drogas que prolongam QT; acelerar FC se refratário',
          'Tóxico-metabólico: hipercalemia → cálcio EV; tricíclicos → bicarbonato 1–2 mEq/kg (amiodarona contraindicada)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'REVERT (2015) / PROCAMIO',
        texto:
          'Valsalva modificada (esforço a 45° + elevação passiva das pernas) eleva a reversão da TSV de 17% para 43%. Procainamida supera amiodarona na TV estável, mas é indisponível no Brasil (amiodarona permanece de escolha). Adenosina em seringa única diluída tem maior conversão na 1ª dose.',
      },
    ],
  },
  {
    id: 'bradicardia',
    nome: 'Bradicardia e bloqueios AV',
    secao: 'Cardiovasculares',
    cid10: ['I44.2', 'I49.5'],
    sinonimos: [
      'bradicardia',
      'BAV',
      'bloqueio atrioventricular',
      'atropina',
      'marca-passo',
      'BAVT',
    ],
    capitulo: 34,
    resumo:
      'FC baixa (< 50–60 bpm) com repercussão hemodinâmica = sintomática. ECG de 12 derivações é o exame inicial. Foco: identificar instabilidade e causas reversíveis. BAV infra-hissianos (Mobitz II, BAVT, avançado) são mais graves, respondem mal à atropina e exigem marca-passo.',
    fisiopatologia: [
      'Quanto mais distal ao nó sinusal a lesão, mais baixo o escape; supra-hissiano (alto) vs infra-hissiano (baixo).',
      'BAVT: dissociação P-QRS; QRS estreito (escape 40–60) se nodal, QRS largo (< 40, instável) se His-Purkinje.',
      'BAV no IAM inferior: reflexo vagal (Bezold-Jarisch), responde a atropina e costuma reverter; IAM anterior indica necrose do sistema de condução (pior).',
    ],
    exames: [
      {
        titulo: 'ECG e inicial',
        itens: [
          'ECG 12 derivações; monitorização, acesso venoso, sinais vitais, SatO₂; POCUS (congestão/VCI)',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'K, Mg, função renal, gasometria; troponina, TSH; níveis de digoxina/antiarrítmicos; toxicológico',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Atleta / tônus vagal (pós-prandial, micção, hipersensibilidade do seio carotídeo)',
      'Drogas: betabloqueador, BCC, digoxina, amiodarona, clonidina',
      'Hipercalemia, hipotireoidismo, hipotermia, hipoxemia',
      'Hipertensão intracraniana (Cushing: bradicardia + HAS); IAM inferior; doença do nó/Chagas',
    ],
    conduta: [
      {
        titulo: 'Instável',
        itens: [
          'Atropina 0,5–1 mg IV, repetir a cada 3–5 min até 3 mg (1ª droga; não usar em transplantado; BAV infranodal não responde)',
          'Marca-passo transcutâneo após sedação/analgesia (ponte); confirmar captura mecânica pelo pulso',
          'Marca-passo transvenoso a seguir (jugular interna direita)',
        ],
      },
      {
        titulo: 'Drogas',
        itens: [
          'Adrenalina 2–10 µg/min (ou 0,05–0,5 µg/kg/min); dopamina 5–20 µg/kg/min',
          'Dobutamina se disfunção ventricular; aminofilina no BAV do IAM inferior',
        ],
      },
      {
        titulo: 'Causas reversíveis',
        itens: [
          'BCC: gluconato/cloreto de cálcio EV; betabloqueador: glucagon 3–10 mg EV; ambos: insulina alta dose euglicêmica',
          'Digoxina: anticorpo Fab antidigoxina; corrigir hipercalemia, hipoxemia, hipotermia; reperfusão no IAM',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACC/AHA/HRS 2018 (bradicardia)',
        texto:
          'Base dos fluxogramas: atropina → dopamina/adrenalina → marca-passo. O ABRAMEDE adota FC < 50 bpm como limiar, dobutamina como droga de eleição na bradicardia instável com disfunção ventricular, e pás do marca-passo em posição anteroposterior (melhor captura).',
      },
    ],
  },
  {
    id: 'ic-aguda',
    nome: 'Insuficiência cardíaca aguda / EAP',
    secao: 'Cardiovasculares',
    cid10: ['I50.1'],
    sinonimos: [
      'ICA',
      'edema agudo de pulmão',
      'EAP',
      'congestão',
      'Stevenson',
      'SCAPE',
      'descompensação',
    ],
    capitulo: 35,
    resumo:
      'Descompensação cardíaca com congestão e/ou baixo débito (80% agudização de IC conhecida). Manejo guiado pelo perfil de Stevenson (quente/frio × úmido/seco) e pela PA. Pilares: suporte respiratório (VNI/CPAP), diurético de alça, vasodilatador e, no choque, inotrópico/vasopressor (noradrenalina). Tratar o precipitante.',
    fisiopatologia: [
      'Aumento das pressões de enchimento → congestão pulmonar/sistêmica; em fases avançadas, queda do débito e má perfusão.',
      'Formas: IC crônica agudizada, EAP, IC direita isolada e choque cardiogênico; FE reduzida, levemente reduzida ou preservada.',
      'Precipitantes (CHAMPI): má aderência, infecção, arritmia (FA), SCA/isquemia, crise hipertensiva, TEP, valvopatia.',
    ],
    exames: [
      {
        titulo: 'Peptídeos natriuréticos',
        itens: [
          'BNP < 100 torna IC improvável; > 500 quase diagnóstico. NT-proBNP por idade (≥ 450/900/1800)',
          'Sacubitril eleva BNP (não o NT-proBNP); FA eleva ambos',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'ECO/POCUS: função, linhas B (BLUE), VCI, derrame; RX (cardiomegalia, congestão)',
          'ECG (isquemia, arritmia); troponina, lactato, função renal e eletrólitos',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Exacerbação de DPOC/asma',
      'Tromboembolismo pulmonar; pneumonia',
      'Pneumotórax; dissecção de aorta',
      'Pericardite/tamponamento',
    ],
    conduta: [
      {
        titulo: 'Geral / perfis',
        itens: [
          'Classificar por perfusão (quente/frio) e volemia (úmido/seco); tratar o precipitante (CHAMPI)',
          'O₂ só se hipoxêmico (alvo ~90%); evitar hiperóxia',
          'Betabloqueador: manter se boa perfusão; reduzir se hipoperfusão; suspender no choque',
        ],
      },
      {
        titulo: 'Congestão (úmido)',
        itens: [
          'CPAP/VNI precoce (reduz pré/pós-carga e risco de IOT)',
          'Furosemida EV: 20–40 mg se virgem, ou ~2,5× a dose VO habitual; reavaliar resposta e dobrar a dose se inadequada',
          'Vasodilatador EV se congestão hipertensiva (nitroglicerina; nitroprussiato se HAS sem isquemia)',
          'SCAPE (EAP hipertensivo): priorizar vasodilatação + diurético; reduzir ≥ 25% da PA nas primeiras horas',
        ],
      },
      {
        titulo: 'Baixo débito (frio)',
        itens: [
          'Inotrópico: dobutamina 2,5–20 µg/kg/min (cautela se hipotenso); alternativas milrinona/levosimendana',
          'Choque com hipotensão: noradrenalina (preferível), PAM-alvo 65; desmamar assim que possível',
          'Perfil frio-seco: hipovolemia — expansão cautelosa; choque cardiogênico: revascularização e suporte mecânico (BIA/Impella/ECMO)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC 2021 / AHA-ACC-HFSA 2022; EMPULSE/ADVOR',
        texto:
          'Noradrenalina é o vasopressor preferido no choque cardiogênico. Resistência diurética: associar tiazídico/acetazolamida (ADVOR). Iniciar iSGLT2 (ex.: empagliflozina) após compensação reduz morte/reinternação (EMPULSE).',
      },
    ],
  },
  {
    id: 'avc-hemorragico',
    nome: 'AVC hemorrágico (hemorragia intracerebral)',
    secao: 'Neurológicas',
    cid10: ['I61.9'],
    sinonimos: [
      'AVCh',
      'hemorragia intracerebral',
      'HIP',
      'derrame hemorrágico',
      'hematoma intraparenquimatoso',
    ],
    capitulo: 56,
    resumo:
      'Sangramento não traumático no parênquima (10–25% dos AVC). HAS é a principal causa; angiopatia amiloide nas hemorragias lobares do idoso. Deterioração precoce por expansão do hematoma. TC é o exame de escolha. Bases: suporte intensivo, controle precoce da PA, reversão de coagulopatia e manejo da PIC, com avaliação neurocirúrgica.',
    fisiopatologia: [
      'Arteriopatia hipertensiva (microaneurismas de Charcot-Bouchard) → hemorragias profundas (gânglios da base, tálamo, ponte, cerebelo).',
      'Angiopatia amiloide → hemorragias lobares em > 55 anos.',
      'Expansão do hematoma é precoce (~26% em 1 h) e piora o prognóstico; maior risco sob anticoagulação. Extensão intraventricular = pior.',
    ],
    exames: [
      {
        titulo: 'Neuroimagem',
        itens: [
          'TC sem contraste (padrão-ouro); TC seriada p/ expansão; volume pela fórmula A×B×C/2',
          'Angio-TC se causa secundária (lobar < 70a, fossa posterior); "spot sign" = sangramento ativo',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'Hemograma, coagulograma, função renal/hepática, glicemia, troponina, toxicológico; ECG',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'AVC isquêmico com transformação hemorrágica',
      'Trombose venosa cerebral; MAV/fístula dural',
      'Neoplasia; hematoma subdural',
      'Hemorragia subaracnóidea',
    ],
    conduta: [
      {
        titulo: 'Controle de PA',
        itens: [
          'Iniciar em ≤ 2 h; PAS 150–220 → reduzir para ~140 (USP: 130–139); evitar < 120–130',
          'PAS > 220: droga EV titulável (nitroprussiato), alvo 140–160',
          'Bundle INTERACT3: PA + glicemia + temperatura + reversão de coagulopatia melhora desfecho',
        ],
      },
      {
        titulo: 'Reversão de anticoagulação',
        itens: [
          'Varfarina: complexo protrombínico (CCP) 1ª escolha + vitamina K EV (alvo INR < 1,3–1,5)',
          'Dabigatrana → idarucizumabe; inibidores do fator Xa → andexanet alfa ou CCP',
          'Heparina → protamina; antiagregante: NÃO transfundir plaquetas de rotina (PATCH); ácido tranexâmico não rotineiro',
        ],
      },
      {
        titulo: 'PIC e neurocirurgia',
        itens: [
          'Monitorar PIC se Glasgow 3–8/herniação; manter PIC < 20, PPC 50–70; cabeceira 30°, salina hipertônica/manitol; NÃO usar corticoide',
          'Anticonvulsivante só se crise documentada (profilaxia aumenta mortalidade)',
          'Cirurgia: hemorragia cerebelar > 15 mL (ou > 3 cm) com deterioração/compressão de tronco/hidrocefalia → evacuar',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AHA/ASA 2022; INTERACT3 2023; ANNEXA-I 2024',
        texto:
          'Controle precoce da PA (< 140 seguro) + bundle (INTERACT3) melhoram desfecho. CCP supera PFC na reversão da varfarina (INCH). Andexanet alfa para hemorragia por inibidores do fator Xa tem maior hemostasia, mas ↑ eventos trombóticos.',
      },
    ],
  },
  {
    id: 'hsa',
    nome: 'Hemorragia subaracnóidea',
    secao: 'Neurológicas',
    cid10: ['I60.9'],
    sinonimos: [
      'HSA',
      'aneurisma',
      'cefaleia thunderclap',
      'cefaleia sentinela',
      'Hunt-Hess',
      'nimodipino',
    ],
    capitulo: 55,
    resumo:
      'Sangue no espaço subaracnóideo (50% dos AVC hemorrágicos); 80–85% por ruptura de aneurisma. Apresenta-se como cefaleia súbita e gravíssima ("pior da vida"), podendo haver cefaleia sentinela prévia. TC sem contraste é o 1º exame; se negativa/duvidosa, punção lombar. Manejo: PA, nimodipino, prevenção de ressangramento e isquemia tardia, e tratamento precoce do aneurisma.',
    fisiopatologia: [
      'Ruptura de aneurisma sacular é a principal causa; HSA perimesencefálica (10–20%) tem bom prognóstico.',
      'Fatores: tabagismo (o mais importante evitável), HAS, etilismo, história familiar; doença renal policística, Marfan, Ehlers-Danlos.',
      'Vasoespasmo (3–14 dias) por produtos da degradação do sangue; melhor preditor é a quantidade de sangue na TC inicial.',
    ],
    exames: [
      {
        titulo: 'TC e punção lombar',
        itens: [
          'TC sem contraste: sensibilidade > 95% na 1ª h, ~92% em 24 h; negativa < 6 h praticamente exclui em baixa probabilidade',
          'Punção lombar se TC negativa/duvidosa: hemácias que não clareiam do 1º ao 4º tubo + xantocromia (após ~12 h)',
        ],
      },
      {
        titulo: 'Etiológico',
        itens: [
          'Angiografia digital (escolha) ou angio-TC; laboratório, ECG; escalas Hunt-Hess/Fisher',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Enxaqueca / cefaleia tensional (principal fonte de erro)',
      'Hemorragia intraparenquimatosa; trombose venosa cerebral',
      'Meningoencefalite; apoplexia hipofisária',
      'Hidrocefalia aguda',
    ],
    conduta: [
      {
        titulo: 'Inicial / PA',
        itens: [
          'IOT se Glasgow ≤ 8, PIC elevada ou instabilidade; monitorização',
          'PA antes de tratar o aneurisma: PAS < 160 (labetalol/nicardipina/enalapril; evitar nitroprussiato/nitroglicerina)',
          'Euglicemia (70–180), normotermia (≤ 37,8 °C), analgesia; PIC < 20, PPC 60–70, cabeceira 30°',
        ],
      },
      {
        titulo: 'Prevenção de vasoespasmo / ressangramento',
        itens: [
          'Nimodipino 60 mg VO/SNE 4/4 h por 21 dias (reduz isquemia tardia)',
          'Euvolemia (não hipervolemia); profilaxia do ressangramento = tratar o aneurisma precocemente; ácido tranexâmico não rotineiro (ULTRA)',
          'Isquemia tardia: induzir hipertensão com noradrenalina; refratária → milrinona/endovascular',
        ],
      },
      {
        titulo: 'Definitivo',
        itens: [
          'Clipagem ou tratamento endovascular do aneurisma em ≤ 24 h',
          'Hidrocefalia sintomática: drenagem ventricular externa; tratar hiponatremia (SIADH vs perdedora de sal)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AHA/ASA 2023; regra de Ottawa para HSA',
        texto:
          'Redução discreta da PA (PAS < 160) evitando hipotensão; intervenção no aneurisma em ≤ 24 h. Regra de Ottawa (sensibilidade 100%) ajuda a decidir investigação na cefaleia sem déficit. Estratégia transfusional restritiva (Hb ≤ 8) é adequada.',
      },
    ],
  },
  {
    id: 'estado-mal-epileptico',
    nome: 'Estado de mal epiléptico',
    secao: 'Neurológicas',
    cid10: ['G41.9'],
    sinonimos: [
      'EME',
      'crise convulsiva',
      'status epilepticus',
      'convulsão',
      'benzodiazepínico',
      'epilepsia',
    ],
    capitulo: 59,
    resumo:
      'Emergência neurológica: crise contínua > 5 min OU ≥ 2 crises sem recuperação da consciência entre elas. Refratário quando persiste após benzodiazepínico + anticonvulsivante. Manejo imediato e simultâneo ao suporte (ABC, glicemia capilar, monitorização) — nenhum exame deve atrasar o tratamento. Tratar apenas crises em curso.',
    fisiopatologia: [
      'Descargas corticais por desequilíbrio excitação (glutamato)/inibição (GABA), com falha dos mecanismos de término.',
      'Após 5 min ininterruptos dificilmente cessa espontaneamente; > 30 min sem retorno ao basal → risco de lesão permanente.',
      'Causas em adultos: lesão estrutural ou tóxico-metabólica; suspensão/má aderência a anticonvulsivante; pós-PCR (mioclônico, pior prognóstico).',
    ],
    exames: [
      {
        titulo: 'À beira-leito e laboratório',
        itens: [
          'Glicemia capilar em todos; monitorização; lactato (útil em perda de consciência não presenciada)',
          'Na, K, Ca, Mg, função renal/hepática, nível de anticonvulsivante, β-HCG',
        ],
      },
      {
        titulo: 'Imagem / EEG',
        itens: [
          'TC de crânio em todos; RM quando possível; punção lombar se suspeita de infecção',
          'EEG: EME não convulsivo, refratário ou rebaixamento prolongado',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Crise não epiléptica psicogênica',
      'Encefalopatia; AVE basilar',
      'Síncope / causas cardiogênicas',
      'Distúrbios do movimento; aura de enxaqueca',
    ],
    conduta: [
      {
        titulo: '1ª linha (benzodiazepínico)',
        itens: [
          'Diazepam 10 mg EV; OU midazolam 10 mg IM/intranasal se sem acesso (não atrasar)',
          'Tratar hipoglicemia: tiamina 100 mg + glicose EV',
          'Se a crise já cessou, não administrar benzodiazepínico',
        ],
      },
      {
        titulo: '2ª linha (anticonvulsivante IV)',
        itens: [
          'Levetiracetam 60 mg/kg (máx 4.500 mg) — escolha pela segurança/menos interação',
          'Fenitoína 20 mg/kg (diluir só em SF, 50 mg/min) ou valproato 40 mg/kg; acionar neurologista',
        ],
      },
      {
        titulo: 'EME refratário',
        itens: [
          'Persiste 5–10 min após benzo + anticonvulsivante → IOT + sedação contínua (midazolam, propofol ou fenobarbital)',
          'Cetamina se sedativo em dose máxima; suporte hemodinâmico (PAM > 65); EEG contínuo; manter ~24 h sem crises',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (Tratado, 2024) / USP 2025',
        texto:
          'Midazolam 10 mg IM é 1ª linha válida quando não há acesso venoso (sem atrasar). Levetiracetam é o anticonvulsivante de escolha pelo perfil de segurança; fenitoína reservada a crises recorrentes/EME não convulsivo.',
      },
    ],
  },
  {
    id: 'meningite',
    nome: 'Meningite e encefalite',
    secao: 'Neurológicas',
    cid10: ['G03.9', 'G04.9'],
    sinonimos: [
      'meningite',
      'encefalite',
      'meningococo',
      'pneumococo',
      'líquor',
      'dexametasona',
      'aciclovir',
    ],
    capitulo: 57,
    resumo:
      'Inflamação das meninges (meningite) ou do parênquima (encefalite). No PS importam a meningite bacteriana (pneumococo, meningococo, Listeria) e a encefalite por HSV-1. Antibiótico empírico e/ou aciclovir são emergências — iniciar à suspeita, idealmente em ≤ 3 h, ANTES da punção lombar se houver atraso. Tríade (febre, rigidez de nuca, alteração mental) em ~41%.',
    fisiopatologia: [
      'Disseminação hematogênica (colonização → bacteremia → invasão) ou por contiguidade (otite/sinusite, trauma, neurocirurgia).',
      'Cascata inflamatória → edema, ↑ PIC, ↓ perfusão, isquemia e lesão neuronal.',
      'Encefalite por HSV-1: tropismo por lobos temporais/frontais; meningococcemia com púrpura/petéquias.',
    ],
    exames: [
      {
        titulo: 'Líquor',
        itens: [
          'Bacteriana: pressão alta, > 1.000 céls (neutrófilos), glicose < 40, proteína alta, Gram +',
          'Viral: linfocitário, glicose normal, proteína < 200; encefalite herpética: PCR HSV',
          'Celularidade normal NÃO afasta infecção; colher hemoculturas',
        ],
      },
      {
        titulo: 'TC antes da PL (se)',
        itens: [
          'Glasgow < 13, déficit focal, crise nova, papiledema, imunossupressão, > 60 anos',
          'Nunca atrasar o antibiótico por TC/PL; RM é mais sensível na encefalite herpética',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Meningite viral vs bacteriana vs tuberculosa vs fúngica (criptococo)',
      'Encefalite autoimune/paraneoplásica',
      'Abscesso cerebral (PL contraindicada), neurossífilis, neurotoxoplasmose',
      'HSA; rigidez de nuca por outras causas',
    ],
    conduta: [
      {
        titulo: 'Empírico imediato',
        itens: [
          'Ceftriaxona 2 g EV 12/12 h + vancomicina 15–20 mg/kg (resistência do pneumococo no Brasil)',
          'Dexametasona 10 mg EV 6/6 h, antes/junto ou até 4 h após o antibiótico (suspender se descartado pneumococo)',
          'Aciclovir 10 mg/kg EV 8/8 h se encefalite herpética não puder ser descartada',
        ],
      },
      {
        titulo: 'Ajuste por agente / idade',
        itens: [
          'Risco de Listeria (> 50 anos, imunodeprimido): acrescentar ampicilina 2 g EV 4/4 h',
          'Imunocomprometido: cefepime ou meropenem; neonato: ampicilina + cefotaxima',
          'Quimioprofilaxia de contatos (meningococo/H. influenzae): rifampicina (alt. ceftriaxona/cipro) — não no pneumococo',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'USP 2025 / ABRAMEDE 2024',
        texto:
          'Empírico passou a ceftriaxona + vancomicina pela resistência crescente do pneumococo (~20%). Dexametasona precoce reduz perda auditiva/mortalidade na pneumocócica. Aciclovir empírico se encefalite viral não descartável nas primeiras 6 h (tratamento precoce reduz mortalidade).',
      },
    ],
  },
  {
    id: 'hipoglicemia',
    nome: 'Hipoglicemia',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E16.2'],
    sinonimos: [
      'hipoglicemia',
      'glicose baixa',
      'Whipple',
      'glucagon',
      'sulfonilureia',
      'insulina',
    ],
    capitulo: 90,
    resumo:
      'Tríade de Whipple: glicemia baixa (< 70 mg/dL no diabético; < 45 no não diabético) + sintomas adrenérgicos/neuroglicopênicos + alívio após correção. Principal causa em adultos é medicamentosa (insulina, sulfonilureia). Idosos, betabloqueados e diabéticos de longa data podem não ter sintomas de alarme. Correção precoce é essencial.',
    fisiopatologia: [
      'Defesa contrarregulatória: ↓ insulina → ↑ glucagon → ↑ epinefrina (cortisol/GH secundários).',
      'Sintomas autonômicos ~55–60 mg/dL; neuroglicopênicos < 54; coma/convulsão em níveis menores.',
      'No diabético a contrarregulação está prejudicada; episódios repetidos reduzem o limiar de percepção.',
    ],
    exames: [
      {
        titulo: 'Confirmação',
        itens: [
          'Glicemia capilar imediata em rebaixamento/déficit focal/sintomas; confirmar com glicemia venosa',
          'Não diabético/sem causa: cortisol, peptídeo C, insulina; suspeita factícia → dosar sulfonilureia',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Medicamentosa (insulina, sulfonilureia/meglitinida), álcool',
      'Doente grave: sepse, falência hepática/renal, desnutrição',
      'Insuficiência adrenal e deficiências hormonais',
      'Hiperinsulinismo endógeno (insulinoma, pós-bariátrica); factícia',
    ],
    conduta: [
      {
        titulo: 'Tratamento agudo',
        itens: [
          'Parar insulina (bomba/EV); consciente: 15–20 g de carboidrato rápido VO, repetir em 10–15 min se persistir < 70',
          'Rebaixado/convulsão: glicose EV 15–25 g (preferir 10–25% à de 50%); sem acesso → glucagon IM 1–2 mg (fugaz)',
          'Etilista/desnutrido/hepatopata: tiamina 100–300 mg junto à glicose',
        ],
      },
      {
        titulo: 'Por causa / refratária',
        itens: [
          'Intoxicação por sulfonilureia → octreotida (inibe secreção de insulina)',
          'Insulinoma: cirurgia; corticoide só na insuficiência adrenal',
        ],
      },
      {
        titulo: 'Após correção',
        itens: [
          'Glicemia > 70 e assintomático: oferecer carboidrato de ação prolongada',
          'Hipoglicemia por sulfonilureia/insulina de longa ação ou DRC: observar 12–24 h com glicemia seriada',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (Tratado, 2024)',
        texto:
          'Estratifica no diabético: nível 1 (< 70 e > 54, intervir), nível 2 (< 54, imediato), nível 3 (evento severo). Glicose EV 25 g em 15 min, preferindo concentrações 10–25% à de 50%. Reforça a insuficiência autonômica associada à hipoglicemia e o risco arritmogênico.',
      },
    ],
  },
  {
    id: 'disturbios-potassio',
    nome: 'Distúrbios do potássio (hiper/hipocalemia)',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E87.5', 'E87.6'],
    sinonimos: ['hipercalemia', 'hipocalemia', 'potássio', 'K', 'arritmia', 'BRASH'],
    capitulo: 86,
    resumo:
      'Emergências pelo risco de arritmia e paralisia. Hipercalemia: K > 5,0–5,5 (grave ≥ 6,5 ou com alteração de ECG/sintomas); hipocalemia: K < 3,5 (grave < 2,5). Solicitar ECG em ambas; sempre dosar/repor magnésio quando associado.',
    fisiopatologia: [
      'K é cátion intracelular (bomba Na/K-ATPase); define a excitabilidade neuromuscular/cardíaca.',
      'Hipercalemia eleva o potencial de repouso, lentifica a condução e alarga o QRS; hipocalemia atrasa a repolarização (onda U, ↑ QT).',
      'Insulina e β2 promovem entrada celular de K; hipomagnesemia torna a hipocalemia refratária.',
    ],
    exames: [
      {
        titulo: 'ECG / monitorização',
        itens: [
          'Hipercalemia: T apiculada → ↑ QRS, ↓/perda de P → onda sinusoidal (ECG normal não exclui)',
          'Hipocalemia (geralmente K < 2,7): T achatada/invertida, infra de ST, onda U, ↑ QT, arritmias',
          'Síndrome BRASH (bradicardia + IRA + bloqueador do nó AV + choque + hipercalemia)',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'K, Na, Mg, Ca, glicose, função renal, gasometria; afastar pseudo-hipercalemia (hemólise)',
          'Causas: hiper — IRA, IECA/BRA/poupadores, lise celular, acidose; hipo — vômitos/diarreia, diuréticos, shift',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hipercalemia: disfunção renal, drogas, lise celular/rabdomiólise, hipoaldosteronismo, pseudo-hipercalemia',
      'Hipocalemia: perdas GI/renais (diuréticos), shift (insulina, β2, alcalose), hipomagnesemia',
    ],
    conduta: [
      {
        titulo: 'Hipercalemia — estabilizar / shift / remover',
        itens: [
          'Estabilizar (se ECG alterado/K ≥ 6,5): gluconato de cálcio 10% 10 mL EV em 3–5 min (não reduz K; repetir se persistir alteração)',
          'Shift: insulina regular 10 UI + glicose 25 g EV (monitorar glicemia); salbutamol 10–20 mg nebulizado; bicarbonato só se acidose',
          'Remover: furosemida se função renal preservada; resina (poliestirenossulfonato/patiromer/ciclossilicato); hemodiálise se grave/refratária/renal',
        ],
      },
      {
        titulo: 'Hipocalemia — reposição',
        itens: [
          'VO preferível na leve: KCl 40–100 mEq/dia; EV se < 2,5, sintomática ou TGI não funcionante',
          'EV: 10–20 mEq/h, diluir em SF (não glicose); concentração máx 80 mEq/L (periférica) / 120 mEq/L (central); > 10 mEq/h em veia central + monitor',
          'Repor magnésio sempre que associado (hipocalemia refratária à reposição isolada de K)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ERC 2021 / ABRAMEDE',
        texto:
          'Síndrome BRASH tratada com cálcio + shift + depuração (epinefrina se refratário). Novas resinas (patiromer, ciclossilicato de zircônio) têm menos efeitos adversos que o poliestirenossulfonato, mas são para fora do manejo agudo.',
      },
    ],
  },
  {
    id: 'disturbios-sodio',
    nome: 'Distúrbios do sódio (hipo/hipernatremia)',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E87.0', 'E87.1'],
    sinonimos: [
      'hiponatremia',
      'hipernatremia',
      'sódio',
      'SIADH',
      'salina hipertônica',
      'desmielinização',
    ],
    capitulo: 83,
    resumo:
      'Hiponatremia (Na < 135) é mais comum que hipernatremia (Na > 145). A gravidade depende da velocidade de instalação e dos sintomas neurológicos, não só do valor. Avaliar a volemia (hipo/eu/hipervolemia) define etiologia e conduta. Riscos-chave: desmielinização osmótica (correção rápida da hiponatremia) e edema cerebral (correção rápida da hipernatremia crônica).',
    fisiopatologia: [
      'Hiponatremia hipotônica: excesso de água por ADH não suprimido → edema cerebral; adaptação cerebral (osmólitos) leva ~48 h.',
      'Hipernatremia: quase sempre perda de água (só ocorre com sede/acesso prejudicados); sempre hipertônica.',
      'Correção rápida demais: hiponatremia → desmielinização; hipernatremia crônica → edema cerebral.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Na seriado, K, função renal, glicemia (excluir hiponatremia hipertônica), osmolaridade sérica; avaliar volemia',
          'Hiponatremia: Na e osmolaridade urinários (SIADH: Osm urin > 100, euvolemia, Na urin > 30, ácido úrico baixo)',
          'Hipernatremia: osmolaridade urinária (< 300 → diabetes insipidus)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hiponatremia hipovolêmica (perdas GI/renais, perdedora de sal); euvolêmica (SIADH, polidipsia, hipotireoidismo); hipervolêmica (IC, cirrose, nefrótica)',
      'Pseudo-hiponatremia (hiperlipidemia/paraproteína) e hipertônica (hiperglicemia/manitol) — não são verdadeiras',
      'Hipernatremia: perdas de água, diabetes insipidus (central/nefrogênico), sobrecarga de sódio',
    ],
    conduta: [
      {
        titulo: 'Hiponatremia sintomática grave',
        itens: [
          'Sintomas graves (convulsão, coma): salina 3% 100–150 mL EV em 10–20 min, repetir até 3× checando Na',
          'Alvo: elevar Na 4–6 mEq/L na 1ª–2ª h para controlar sintomas',
          'Limite: NÃO ultrapassar 8–10 mEq/L em 24 h (6–8 se alto risco: etilista, desnutrido, Na ≤ 120); risco de desmielinização',
          'Hipercorreção: glicose 5% ± desmopressina',
        ],
      },
      {
        titulo: 'Hiponatremia leve/moderada ou crônica',
        itens: [
          'Tratar a causa, suspender medicações (tiazídicos); SIADH: restrição hídrica < 1 L + sal VO',
          'Hipervolêmica (IC/cirrose): restrição hídrica + diurético de alça',
        ],
      },
      {
        titulo: 'Hipernatremia',
        itens: [
          'Se choque/hipovolemia: expandir com isotônico até estabilizar (não atrasar)',
          'Repor déficit de água livre (SG 5% ou salina 0,45%); correção lenta na crônica (≤ 0,5 mEq/L/h, 8–10/24 h; piso ~6/dia)',
          'Diabetes insipidus central: desmopressina; nefrogênico: corrigir causa + tiazídico',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'SALSA 2021 / coortes 2023',
        texto:
          'Bolus intermitente e infusão contínua de salina 3% têm supercorreção semelhante (SALSA). Estudos recentes mostram desmielinização rara (~0,05%) e desfechos melhores com correção de 8–10 mEq/L/dia que < 6 — questionando o dogma da correção ultralenta (manter < 10/dia).',
      },
    ],
  },
  {
    id: 'crise-tireotoxica',
    nome: 'Crise tireotóxica (tempestade tireoidiana)',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E05.5'],
    sinonimos: [
      'tempestade tireoidiana',
      'tireotoxicose',
      'hipertireoidismo',
      'Burch-Wartofsky',
      'Graves',
    ],
    capitulo: 92,
    resumo:
      'Exacerbação do hipertireoidismo com descompensação multissistêmica e risco de morte (mortalidade 8–25%). Graves é a principal etiologia e infecção o gatilho mais comum. Febre, taquicardia, disfunção do SNC e sintomas GI. Diagnóstico clínico (escore de Burch-Wartofsky). Manejo em UTI: betabloqueador, tionamida, iodeto (após a tionamida), corticoide, suporte e tratamento do gatilho.',
    fisiopatologia: [
      'Tireotoxicose não tratada + fator precipitante (infecção, cirurgia, trauma, suspensão de tionamida, IAM).',
      '↑ fração livre de T3/T4 e resposta exagerada ao estímulo catecolaminérgico (resposta dramática a betabloqueador).',
      'Níveis de T3/T4 NÃO diferenciam crise de hipertireoidismo compensado — o diagnóstico é clínico.',
    ],
    exames: [
      {
        titulo: 'Hormonal',
        itens: [
          'TSH indetectável, T3/T4 livres ↑; TRAb (etiologia); cintilografia se dúvida (ex.: amiodarona)',
        ],
      },
      {
        titulo: 'Complicações / foco',
        itens: [
          'Hemograma (leucocitose mesmo sem infecção), transaminases/bilirrubina (pior prognóstico), glicemia, eletrólitos',
          'ECG (FA/taquiarritmia); culturas e RX para foco infeccioso',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Sepse; feocromocitoma',
      'Síndrome serotoninérgica / neuroléptica maligna; hipertermia maligna',
      'Intoxicação simpaticomimética; heat stroke',
      'Abstinência (álcool/BZD); encefalopatia hipertensiva',
    ],
    conduta: [
      {
        titulo: 'Sequência do tratamento',
        itens: [
          '1) Betabloqueador: propranolol 0,5–1 mg EV (ou 40–80 mg VO) / esmolol em infusão; alvo FC 60–80 (também inibe T4→T3)',
          '2) Tionamida: PTU ataque 600–1.000 mg → 200–300 mg 4–6/6 h (inibe conversão), ou metimazol 20 mg 4–8/8 h',
          '3) Iodeto APÓS a tionamida (≥ 1 h): Lugol/iodeto de potássio; lítio se alergia ao iodo',
          '4) Corticoide: hidrocortisona 100 mg EV 8/8 h (reduz conversão T4→T3 e cobre insuficiência adrenal)',
        ],
      },
      {
        titulo: 'Suporte e gatilho',
        itens: [
          'UTI; reposição volêmica (exceto ICC congestiva); antitérmico (dipirona/paracetamol; EVITAR salicilato)',
          'Tratar o precipitante (infecção); refratário: plasmaférese, colestiramina',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (Tratado, 2024)',
        texto:
          'Evidência recente sugere que o iodo pode ser dado simultaneamente à tionamida (a espera de 1 h da ATA não foi corroborada). Burch-Wartofsky > 45 sugestivo, 25–44 zona de transição. Sem contraindicação a amiodarona para FA desde que a tionamida já administrada.',
      },
    ],
  },
  {
    id: 'insuficiencia-adrenal',
    nome: 'Insuficiência adrenal / crise adrenal',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E27.2'],
    sinonimos: ['crise adrenal', 'Addison', 'hidrocortisona', 'cortisol', 'choque refratário'],
    capitulo: 93,
    resumo:
      'Deficiência de glicocorticoides (± mineralocorticoides na forma primária). A crise adrenal é emergência: hipotensão/choque distributivo que não responde a volume nem vasopressor, podendo cursar com hiponatremia, hipercalemia e hipoglicemia. Na suspeita, colher cortisol e iniciar hidrocortisona imediatamente — exames não devem atrasar o tratamento.',
    fisiopatologia: [
      'Primária (adrenalite autoimune, TB) com hiperpigmentação e perda de aldosterona; secundária/terciária (hipófise/hipotálamo) sem hiperpigmentação, aldosterona preservada.',
      'Causa mais comum no geral: suspensão abrupta de corticoide exógeno (supressão do eixo, até ~1 ano).',
      'Cortisol é essencial à resposta ao estresse; gatilhos (infecção, cirurgia, trauma) precipitam a crise.',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Hiponatremia (~90%), hipercalemia (~2/3), hipoglicemia (~67%); função renal pré-renal',
          'Cortisol basal (8–9 h): ≤ 5 confirma, > 18 exclui; ACTH; teste da cortrosina se intermediário (não aprovado no Brasil)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Sepse / choque distributivo (principal diferencial)',
      'Choque hipovolêmico; embolia pulmonar',
      'IC / IAM; abdome agudo cirúrgico',
    ],
    conduta: [
      {
        titulo: 'Crise adrenal (imediato)',
        itens: [
          'Hidrocortisona 100 mg EV imediata, depois 50 mg 6/6 h (ou 100 mg 6/6 h) — não atrasar por exames',
          'Cristaloide 1–3 L; glicose se hipoglicemia; vasopressor (noradrenalina) se choque refratário',
          'Se hidrocortisona indisponível: dexametasona 4 mg EV 12/12 h (não interfere na dosagem de cortisol)',
        ],
      },
      {
        titulo: 'Suporte e investigação',
        itens: [
          'Buscar e tratar o precipitante (infecção, desidratação, cirurgia, IAM, suspensão de corticoide)',
          'Internação (UTI se refratário); usuário crônico de corticoide: dose de estresse em intercorrências',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESE/Endocrine Society 2024; ABRAMEDE',
        texto:
          'Considerar crise adrenal em hipotensão que não responde a volume/vasopressor com hiponatremia/hipercalemia ou hipoglicemia refratária — especialmente em uso prolongado de corticoide, HIV, TB. Hidrocortisona 100 mg EV é o corticoide de escolha; cortrosina não é aprovada no Brasil (alternativa: teste de tolerância à insulina).',
      },
    ],
  },
  {
    id: 'pac',
    nome: 'Pneumonia adquirida na comunidade (PAC)',
    secao: 'Respiratórias',
    cid10: ['J18.9'],
    sinonimos: ['PAC', 'pneumonia', 'CURB-65', 'PSI', 'pneumococo', 'consolidação'],
    capitulo: 44,
    resumo:
      'Infecção aguda do trato respiratório inferior fora do hospital. Diagnóstico clínico (tosse, dispneia, febre, taquipneia, estertores) + infiltrado novo na imagem. Pneumococo é o agente mais prevalente. A estratificação (CURB-65/PSI; IDSA-ATS e SMART-COP para UTI) define o local de tratamento e a antibioticoterapia empírica.',
    fisiopatologia: [
      'Microaspiração de secreção orofaríngea colonizada com quebra das defesas → infecção alveolar.',
      'Acúmulo de leucócitos/líquido no alvéolo → hipoxemia; em surtos, vírus podem ser a principal causa.',
      'Agentes: pneumococo, H. influenzae, atípicos (Mycoplasma, Legionella) e vírus; ~50% sem etiologia definida.',
    ],
    exames: [
      {
        titulo: 'Imagem',
        itens: [
          'RX de tórax em todos (infiltrado novo + clínica); US de tórax tem maior sensibilidade que a RX',
          'TC só se dúvida diagnóstica ou má resposta',
        ],
      },
      {
        titulo: 'Laboratório / etiológico',
        itens: [
          'Internação/> 50 anos/comorbidade: hemograma, função renal, eletrólitos, PCR, lactato; oximetria/gasometria',
          'Etiológico (hemocultura, cultura/Gram de escarro, antígeno urinário) só em internado/PAC grave/falha — não no ambulatorial',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Insuficiência cardíaca / congestão',
      'Tromboembolismo pulmonar com infarto; pneumonite por aspiração',
      'Neoplasia pulmonar; DPOC exacerbada',
      'Gripe e pneumonias virais; TB',
    ],
    conduta: [
      {
        titulo: 'Gravidade / local de tratamento',
        itens: [
          'CURB-65 (confusão, ureia > 43–50, FR ≥ 30, PA < 90/≤ 60, idade ≥ 65): 0–1 ambulatorial, 2 considerar internação, ≥ 3 internar',
          'PSI/PORT (valoriza comorbidades) — preferido por ATS/IDSA; CRB-65 onde não há laboratório',
          'UTI: 1 critério maior (vasopressor/VM) ou ≥ 3 menores (IDSA-ATS); SMART-COP ≥ 3 como alternativa',
        ],
      },
      {
        titulo: 'Antibiótico empírico',
        itens: [
          'Ambulatorial sem comorbidade: amoxicilina (ou macrolídeo/doxiciclina); quinolona não é 1ª escolha no Brasil (mascara TB)',
          'Ambulatorial com comorbidade: amoxicilina-clavulanato + macrolídeo, OU quinolona respiratória',
          'Internado: betalactâmico EV (ceftriaxona) + macrolídeo, OU quinolona respiratória',
          'UTI: betalactâmico + macrolídeo (preferencial) ou + quinolona; anti-Pseudomonas/MRSA só com fator de risco',
        ],
      },
      {
        titulo: 'Suporte',
        itens: [
          'O₂ alvo SatO₂ ≥ 90–92%; corticoide (hidrocortisona 200 mg/dia) na PAC grave em UTI (CAPE COD) — não na PAC não grave',
          'Tempo de ATB: 5 dias (não grave) a 7 (grave) se afebril/estável; trocar EV→VO com melhora',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ATS/IDSA 2019; CAPE COD 2023 / SCCM-ESICM 2024',
        texto:
          'Abandono do conceito de "pneumonia associada a cuidados de saúde"; sem cobertura anti-Pseudomonas/MRSA de rotina. Hidrocortisona 200 mg/dia nas primeiras 24 h reduz mortalidade na PAC grave em UTI (recomendação forte 2024).',
      },
    ],
  },
  {
    id: 'hda',
    nome: 'Hemorragia digestiva alta',
    secao: 'Gastrointestinais',
    cid10: ['K92.2'],
    sinonimos: ['HDA', 'hematêmese', 'melena', 'úlcera péptica', 'varizes', 'Blatchford'],
    capitulo: 75,
    resumo:
      'Sangramento proximal ao ligamento de Treitz: hematêmese, borra de café, melena (mais comum) ou hematoquezia (~11%). Dividir em não varicosa (úlcera péptica é a principal) e varicosa (cirrose/hipertensão portal — pior prognóstico). Conduta: estabilizar antes de investigar, transfusão restritiva, IBP IV na suspeita péptica, e na varicosa vasoconstritor + antibiótico. EDA é exame e tratamento, idealmente < 24 h (< 12 h se varizes/instabilidade).',
    fisiopatologia: [
      'Úlcera péptica (H. pylori, AINE/AAS, estresse) é a principal causa não varicosa; esofagite erosiva é a 2ª.',
      'Varizes gastroesofágicas decorrem da hipertensão portal (gradiente > 10 mmHg); mortalidade ~15–30% (pior em Child C).',
      'Outras: Mallory-Weiss, lesões vasculares (Dieulafoy, angiodisplasia); ~10–15% sem etiologia definida.',
    ],
    exames: [
      {
        titulo: 'Endoscopia (EDA)',
        itens: [
          'Exame de escolha (diagnóstico e tratamento); < 24 h após estabilizar (< 12 h se instabilidade/varizes)',
          'EDA < 6 h não melhora desfechos; classificação de Forrest estratifica risco de ressangramento',
        ],
      },
      {
        titulo: 'Laboratório / escores',
        itens: [
          'Hemograma seriado, coagulograma (INR), função renal/hepática, tipagem',
          'Glasgow-Blatchford (pré-endoscópico; 0–1 permite ambulatorial) e Rockall (pós)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hemorragia digestiva baixa (principal diferencial)',
      'Hematoquezia pode ser HDA maciça; melena pode vir do delgado',
      'Fezes escuras por ferro/bismuto (não é sangramento)',
      'Hemobilia, hemosuccus pancreaticus',
    ],
    conduta: [
      {
        titulo: 'Ressuscitação inicial',
        itens: [
          'Dois acessos calibrosos, cristaloide (evitar > 3 L nas primeiras 6 h); transfusão restritiva alvo Hb > 7 (> 9 em cardiopata/doença cardiovascular)',
          'IBP IV na suspeita péptica: omeprazol/pantoprazol 80 mg bolus + infusão',
          'Eritromicina 250 mg EV ~30–90 min antes da EDA (procinético); NÃO usar ácido tranexâmico (HALT-IT)',
        ],
      },
      {
        titulo: 'Suspeita de varizes',
        itens: [
          'Vasoconstritor precoce: terlipressina 2 mg EV bolus → 2 mg 4/4 h até 5 dias (ou octreotida/somatostatina)',
          'Antibiótico em todo cirrótico com HDA (reduz mortalidade): ceftriaxona 1 g 12/12 h por 7 dias',
          'Após estabilizar: ligadura elástica; balão de Sengstaken como ponte; TIPS se refratário',
        ],
      },
      {
        titulo: 'Endoscopia',
        itens: [
          'Úlcera de alto risco (Forrest Ia–IIb): terapia dupla (adrenalina + clipe/térmico)',
          'Falha endoscópica: reabordagem, embolização angiográfica ou cirurgia',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Consenso 2019 (Barkun) / ESGE-ACG 2021; HALT-IT 2020',
        texto:
          'Limiar transfusional restritivo (Hb 7–8). Glasgow-Blatchford ≤ 1 permite manejo ambulatorial. Clipes preferidos em sangramento agudo. Ácido tranexâmico não reduz mortalidade e aumenta tromboembolismo (HALT-IT) — não recomendado.',
      },
    ],
  },
  {
    id: 'pancreatite',
    nome: 'Pancreatite aguda',
    secao: 'Gastrointestinais',
    cid10: ['K85.9'],
    sinonimos: ['pancreatite', 'lipase', 'BISAP', 'Atlanta', 'CPRE', 'dor em barra'],
    capitulo: 77,
    resumo:
      'Inflamação aguda do pâncreas por autodigestão. Causas: litíase biliar e álcool (> 80%). Maioria leve; formas graves cursam com falência orgânica. Diagnóstico: 2 de 3 (dor típica, lipase/amilase ≥ 3×, imagem). Tratamento é de suporte: hidratação moderada por metas, analgesia e nutrição precoce.',
    fisiopatologia: [
      'Ativação precoce de enzimas dentro da glândula → autodigestão e inflamação.',
      'Cálculo obstrui a ampola (causa mais comum); álcool aumenta a síntese enzimática; hipertrigliceridemia (> 1.000) lesa o pâncreas.',
      'Liberação de citocinas → SIRS, podendo evoluir para disfunção de múltiplos órgãos.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico (2 de 3)',
        itens: [
          'Dor epigástrica intensa irradiando para o dorso (em barra)',
          'Lipase (ou amilase) ≥ 3× o limite superior; lipase é mais específica e dura mais',
          'Imagem (3º critério): achados característicos de pancreatite em TC/RM (não o US)',
          'US de abdome em todos para etiologia (litíase/coledocolitíase); TC só se dúvida diagnóstica, necrose ou deterioração (ideal após 72 h)',
        ],
      },
      {
        titulo: 'Gravidade / etiologia',
        itens: [
          'BISAP (ureia, alteração mental, SIRS, idade > 60, derrame pleural); Atlanta 2012 (leve/moderada/grave)',
          'Escores de gravidade (Calculadoras): Ranson (admissão + 48 h), APACHE II (admissão, repetível), BISAP — ver aba Calculadoras',
          'ALT > 3× sugere etiologia biliar; triglicérides, cálcio; PCR > 150 após 48 h marca gravidade',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Úlcera péptica / perfuração de víscera',
      'Colecistite/colangite, coledocolitíase',
      'Isquemia mesentérica; obstrução intestinal',
      'SCA (epigastralgia)',
    ],
    conduta: [
      {
        titulo: 'Suporte inicial',
        itens: [
          'Hidratação MODERADA com Ringer lactato, guiada por metas (5–10 mL/kg/h se hipovolemia); evitar hiper-hidratação (WATERFALL)',
          'Metas: diurese 0,5–1 mL/kg/h, PAM 65–85, FC < 120, Ht 35–44%',
          'Analgesia escalonada (dipirona/paracetamol → opioide); nutrição oral pobre em gordura em ≤ 24 h (enteral por sonda se não tolerar)',
        ],
      },
      {
        titulo: 'Específico',
        itens: [
          'CPRE precoce (< 24 h) só se colangite/coledocolitíase associada — não de rotina na PA biliar',
          'Antibiótico NÃO profilático; só na necrose infectada (guiado por cultura)',
          'Colecistectomia na mesma internação na PA biliar leve; UTI na PA grave',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AGA 2024; WATERFALL (NEJM 2022)',
        texto:
          'Ressuscitação moderada por metas (não agressiva): a estratégia agressiva aumentou sobrecarga sem reduzir progressão para forma grave (WATERFALL, interrompido precocemente). Realimentação oral em ≤ 24 h; colecistectomia na mesma internação.',
      },
    ],
  },
  {
    id: 'dengue',
    nome: 'Dengue',
    secao: 'Infecciosas',
    cid10: ['A90', 'A91'],
    sinonimos: ['dengue', 'arbovirose', 'Aedes', 'sinais de alarme', 'prova do laço', 'NS1'],
    capitulo: 51,
    resumo:
      'Arbovirose mais comum no Brasil (Flavivirus, 4 sorotipos; vetor Aedes aegypti). Três fases: febril, crítica (defervescência no 3º–7º dia, com risco de extravasamento plasmático, choque e hemorragia) e de recuperação. Manejo por estratificação em grupos A–D, identificação de sinais de alarme/gravidade e hidratação escalonada por grupo. Notificação compulsória na suspeita.',
    fisiopatologia: [
      'Segunda infecção por sorotipo diferente é o principal fator de gravidade (amplificação dependente de anticorpos).',
      'Aumento da permeabilidade capilar (sem lesão endotelial) → hemoconcentração e choque; supressão medular → leucopenia/plaquetopenia.',
      'Defervescência (3º–7º dia) marca a fase crítica — instalação rápida, óbito possível em 12–24 h.',
    ],
    exames: [
      {
        titulo: 'Inespecíficos',
        itens: [
          'Hemograma: leucopenia precoce, plaquetopenia (< 100.000 = gravidade); hematócrito (↑ ≥ 20% = extravasamento)',
          'Transaminases (AST > ALT), albumina (queda = gravidade), coagulograma nos graves',
        ],
      },
      {
        titulo: 'Específicos / prova do laço',
        itens: [
          'Até 4º–5º dia: NS1 ou RT-PCR; a partir do 6º: sorologia IgM/IgG (reação cruzada com zika)',
          'Prova do laço: manguito na média da PA por 5 min; ≥ petéquias = positiva (classifica para grupo B)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Outras arboviroses: chikungunya (artralgia intensa), zika (exantema pruriginoso), febre amarela (icterícia)',
      'Leptospirose, malária',
      'Doenças exantemáticas (rubéola, sarampo, enteroviroses)',
      'Formas graves: meningococcemia, sepse, febres hemorrágicas',
    ],
    conduta: [
      {
        titulo: 'Estadiamento (grupos A–D) e sinais de alarme',
        itens: [
          'A: sem sinais de alarme/comorbidade, laço negativo. B: laço positivo/sangramento de pele/comorbidade/condição especial',
          'C: com sinais de alarme. D: choque, sangramento grave ou disfunção orgânica grave (UTI)',
          'Sinais de alarme: vômitos persistentes, dor abdominal intensa, acúmulo de líquidos, lipotimia, hepatomegalia dolorosa, letargia, sangramento de mucosas, ↑ Ht',
          'EVITAR AINE, AAS e corticoide; antitérmico com dipirona/paracetamol',
        ],
      },
      {
        titulo: 'Hidratação por grupo',
        itens: [
          'A: VO 60 mL/kg/dia (1/3 com SRO). B: VO como A; se intolerância, IV 2–4 mL/kg/h; 1º Ht em 2–4 h',
          'C: SF/Ringer 10 mL/kg na 1ª h, reavaliar Ht (até 2×); internação ≥ 48 h; depois manutenção',
          'D (UTI): expansão rápida 20 mL/kg em até 20 min, reavaliar a cada 15–30 min, repetir até 3×; vasoativo se necessário',
        ],
      },
      {
        titulo: 'Dengue grave',
        itens: [
          'Choque: pressão de pulso ≤ 20 mmHg é sinal inicial; refratário com Ht ↑ → albumina/coloide',
          'Ht em queda com choque → investigar hemorragia: transfundir hemácias; plasma/crioprecipitado se coagulopatia',
          'Plaquetas só se sangramento não controlado; reconhecimento precoce reduz mortalidade para < 1%',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'MS 2024 (6ª ed.) / ABRAMEDE-JBMEDE 2024',
        texto:
          'Classificação em grupos A–D com hidratação escalonada (C: 10 mL/kg/h; D: 20 mL/kg em ≤ 20 min) e manejo do choque refratário com albumina/hemoderivados. Duas vacinas no Brasil: Dengvaxia (só para quem já teve dengue) e Qdenga.',
      },
    ],
  },
  {
    id: 'disseccao-aorta',
    nome: 'Dissecção aguda de aorta',
    secao: 'Cardiovasculares',
    cid10: ['I71.0'],
    sinonimos: [
      'dissecção de aorta',
      'síndrome aórtica aguda',
      'Stanford',
      'aneurisma dissecante',
      'dor torácica',
    ],
    capitulo: 37,
    resumo:
      'Laceração da íntima com luz falsa; alta mortalidade (25–30%). Stanford A (aorta ascendente, ~62%) é cirúrgico de emergência; Stanford B (não acomete ascendente) é clínico (cirurgia se complicado). Suspeitar: fator de risco + dor torácica/dorsal súbita, dilacerante, migratória. Tratar a FC/PA antes de confirmar.',
    fisiopatologia: [
      'Degeneração da camada média (HAS, idade, Marfan) + laceração da íntima → luz falsa que progride.',
      'Forças pulsáteis (dP/dt) e HAS enfraquecem a parede; má-perfusão de ramos (coronária, cerebral, renal, mesentérica, membros).',
      'Ruptura para pericárdio (tamponamento) ou pleura; insuficiência aórtica aguda na tipo A.',
    ],
    exames: [
      {
        titulo: 'Estratificação e laboratório',
        itens: [
          'Escore ADD-RS + D-dímero: ADD-RS 0–1 com D-dímero < 500 praticamente exclui (ADvISED)',
          'ECG (pode ser normal; afastar SCA); troponina, função renal, lactato',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'Angio-TC de aorta = padrão-ouro no estável (flap intimal, luz falsa)',
          'ETE no instável (à beira-leito); POCUS para tamponamento/insuficiência aórtica; RX (alargamento de mediastino)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Síndrome coronariana aguda / IAM',
      'Tromboembolismo pulmonar',
      'Pericardite / tamponamento',
      'Ruptura esofágica; pneumotórax',
    ],
    conduta: [
      {
        titulo: 'Controle de FC/PA',
        itens: [
          'Metas: FC ~60 bpm e PAS 100–120 mmHg; iniciar antes da confirmação',
          'Betabloqueador ANTES do vasodilatador (evita taquicardia reflexa): esmolol (bolus 500 µg/kg + 50–200 µg/kg/min) ou metoprolol EV',
          'Após FC controlada: nitroprussiato 0,5–3 µg/kg/min; analgesia com opioide',
          'Hipotensão/deterioração → POCUS p/ tamponamento (pericardiocentese controlada se confirmado)',
        ],
      },
      {
        titulo: 'Definitivo',
        itens: [
          'Stanford A: cirurgia de emergência (mortalidade ~1–2%/hora)',
          'Stanford B: clínico; cirurgia/endovascular se complicado (ruptura, má-perfusão, dor/HAS refratárias, progressão)',
          'Internação em UTI, manejo multidisciplinar',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACC/AHA 2022; ADvISED 2018',
        texto:
          'ADD-RS + D-dímero é a estratégia de descarte validada (falha ~0,3%). Labetalol/nicardipina são alternativas; manejo igual para hematoma intramural e úlcera penetrante com aorta ascendente acometida.',
      },
    ],
  },
  {
    id: 'pericardite-tamponamento',
    nome: 'Pericardite aguda e tamponamento',
    secao: 'Cardiovasculares',
    cid10: ['I30.9', 'I31.9'],
    sinonimos: [
      'pericardite',
      'tamponamento cardíaco',
      'derrame pericárdico',
      'Beck',
      'pericardiocentese',
      'colchicina',
    ],
    capitulo: 38,
    resumo:
      'Pericardite: inflamação do pericárdio (viral/idiopática; TB em países em desenvolvimento) — diagnóstico por ≥ 2 de 4 critérios. Tratamento: AINE + colchicina. Tamponamento: hipotensão, turgência jugular, bulhas abafadas (tríade de Beck) + pulso paradoxal → pericardiocentese.',
    fisiopatologia: [
      'Inflamação dos folhetos pericárdicos; até 80% idiopática; miopericardite em ~15% (eleva troponina).',
      'Tamponamento: o líquido excede a distensibilidade pericárdica → ↑ pressão intrapericárdica restringe o enchimento; importa a velocidade, não o volume.',
      'Pulso paradoxal: queda da PAS > 10 mmHg na inspiração.',
    ],
    exames: [
      {
        titulo: 'Critérios (≥ 2 de 4) e ECG',
        itens: [
          'Dor pleurítica que melhora sentado/inclinado; atrito pericárdico; supra de ST difuso côncavo + infra de PR; derrame novo',
          'Tamponamento no ECG: taquicardia, baixa voltagem, alternância elétrica',
        ],
      },
      {
        titulo: 'Eco / laboratório',
        itens: [
          'ECO/POCUS: derrame; tamponamento = colabamento de AD/VD na diástole, VCI pletórica, variação respiratória do influxo',
          'Troponina (se miopericardite), PCR (monitorar/duração)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'IAM/isquemia (supra restrito ao território, com imagem em espelho)',
      'Dissecção de aorta; TEP',
      'Pneumotórax hipertensivo (diferencial do tamponamento no trauma)',
      'Costocondrite, refluxo',
    ],
    conduta: [
      {
        titulo: 'Pericardite',
        itens: [
          'AINE: ibuprofeno 600–800 mg 8/8 h (ou AAS 750–1.000 mg 8/8 h se coronariopata) por 1–2 semanas',
          'Colchicina em todos: 0,5 mg/dia (< 70 kg) ou 0,5 mg 12/12 h (≥ 70 kg) por 3 meses (reduz recorrência)',
          'Corticoide só na recorrência (2ª/3ª linha); restrição de esporte ≥ 3 meses',
        ],
      },
      {
        titulo: 'Tamponamento',
        itens: [
          'Pericardiocentese é a medida definitiva (guiada por eco/POCUS)',
          'Temporário: expansão volêmica, vasopressor; EVITAR ventilação com pressão positiva',
          'Hemopericárdio coagulado/trauma/dissecção: drenagem cirúrgica/janela',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC 2015 (doenças do pericárdio)',
        texto:
          'Diagnóstico por ≥ 2 de 4 critérios; pericardiocentese guiada por US (não às cegas). Inibidores de IL-1 (rilonacept/anakinra) na pericardite recorrente.',
      },
    ],
  },
  {
    id: 'tvp',
    nome: 'Trombose venosa profunda (TVP)',
    secao: 'Cardiovasculares',
    cid10: ['I80.2'],
    sinonimos: ['TVP', 'trombose', 'TEV', 'Wells', 'D-dímero', 'doppler', 'anticoagulação'],
    capitulo: 40,
    resumo:
      'Trombo em veia profunda (85–90% em MMII); proximal (poplítea/femoral/ilíaca) tem maior risco de TEP. Diagnóstico: probabilidade pré-teste (Wells) + D-dímero + US com compressão (exame de escolha). Anticoagulação é a base; a maioria trata ambulatorialmente.',
    fisiopatologia: [
      'Tríade de Virchow (estase, lesão endotelial, hipercoagulabilidade); inicia nas valvas venosas.',
      'Fatores: idade, neoplasia, imobilização, cirurgia, TEV prévio, cateter, estrogênio, gravidez, trombofilias.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Escore de Wells para TVP (baixa/intermediária/alta)',
          'D-dímero (ELISA): negativo afasta em baixa/moderada probabilidade; corte ajustado por idade (> 50a: idade×10)',
          'US doppler com compressão (S 96%): ausência de compressibilidade = positivo; POCUS de 3 pontos (femoral comum, femoral, poplítea)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Lesão/espasmo muscular (principal); insuficiência venosa crônica',
      'Cisto de Baker; celulite; linfedema',
      'Tromboflebite superficial',
    ],
    conduta: [
      {
        titulo: 'Anticoagulação',
        itens: [
          'Indicada na TVP proximal e na distal sintomática/com risco de extensão',
          'DOAC 1ª escolha: rivaroxabana 15 mg 12/12 h × 21 d → 20 mg/dia; apixabana 10 mg 12/12 h × 7 d → 5 mg 12/12 h (orais desde o início)',
          'Enoxaparina 1 mg/kg 12/12 h ou 1,5 mg/kg 1x/dia (preferir em gestante/câncer); HNF se DRC grave (ClCr < 15)',
        ],
      },
      {
        titulo: 'Tempo / considerações',
        itens: [
          '3 meses se provocada por fator transitório; estendido se não provocada/recorrente; ≥ 6 meses (ou indefinido) em neoplasia',
          'TVP distal de baixo risco: vigilância com US seriado por 2 semanas, sem anticoagular',
          'Filtro de VCI se anticoagulação contraindicada; trombólise só em membro ameaçado (flegmasia)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACCP/CHEST 2021; ASH 2020',
        texto:
          'DOAC preferível a VKA; maioria tratada ambulatorialmente; meias elásticas não recomendadas de rotina. Em TEV-câncer, preferir Xa oral (exceção: malignidade luminal de TGI → apixabana/HBPM).',
      },
    ],
  },
  {
    id: 'pneumotorax',
    nome: 'Pneumotórax',
    secao: 'Respiratórias',
    cid10: ['J93.9'],
    sinonimos: [
      'pneumotórax',
      'pneumotórax hipertensivo',
      'colapso pulmonar',
      'dreno de tórax',
      'lung sliding',
    ],
    capitulo: 47,
    resumo:
      'Ar no espaço pleural: espontâneo primário (jovem longilíneo tabagista), secundário (DPOC é a principal), iatrogênico ou traumático. Dispneia súbita + dor pleurítica. O pneumotórax HIPERTENSIVO é emergência (choque obstrutivo) — diagnóstico clínico e descompressão imediata, SEM aguardar imagem.',
    fisiopatologia: [
      'Entrada de ar colapsa o pulmão ipsilateral; primário por ruptura de bleb subpleural.',
      'Hipertensivo: válvula unidirecional ↑ pressão intratorácica → desvio de mediastino, ↓ retorno venoso → choque obstrutivo/PCR.',
    ],
    exames: [
      {
        titulo: 'Imagem',
        itens: [
          'RX de tórax (linha pleural, perda de trama vascular periférica) — não aguardar no hipertensivo',
          'POCUS (S > 95%): perda do lung sliding e das linhas B; lung point é patognomônico; TC = padrão-ouro (reservar ao estável)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Tromboembolismo pulmonar; pneumonia',
      'Pericardite; derrame pleural',
      'Síndrome coronariana aguda',
    ],
    conduta: [
      {
        titulo: 'Hipertensivo (emergência)',
        itens: [
          'Diagnóstico clínico — descompressão imediata: punção de alívio com agulha calibrosa (14–16 G, ≥ 5 cm)',
          'Local (ATLS atual): 5º EIC na linha axilar anterior (ou 2º EIC hemiclavicular)',
          "Definitivo: drenagem tubular em selo d'água (5º EIC linha axilar média)",
        ],
      },
      {
        titulo: 'Espontâneo',
        itens: [
          'Conservador possível se minimamente sintomático (BTS 2023), independente do tamanho; O₂ suplementar acelera reabsorção',
          'Sintomático/grande: aspiração com cateter ou dreno (pigtail 10–14 Fr em pneumotórax simples)',
          'Drenar se VM com pressão positiva, viagem aérea ou DPOC; esvaziar devagar (edema de reexpansão); não clampear o dreno',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'BTS 2023; ATLS',
        texto:
          'Tratamento conservador pode ser considerado em qualquer pneumotórax minimamente sintomático (antes drenava-se > 2 cm). Punção de alívio no 5º EIC linha axilar anterior. Evitar voo por 7–14 dias após resolução.',
      },
    ],
  },
  {
    id: 'derrame-pleural',
    nome: 'Derrame pleural',
    secao: 'Respiratórias',
    cid10: ['J90'],
    sinonimos: ['derrame pleural', 'toracocentese', 'Light', 'empiema', 'exsudato', 'transudato'],
    capitulo: 45,
    resumo:
      'Acúmulo de líquido no espaço pleural. 1º passo: diferenciar transudato × exsudato pelos critérios de Light. IC é a principal causa de transudato; pneumonia, neoplasia e TB entre os exsudatos. Derrame parapneumônico complicado e empiema exigem drenagem.',
    fisiopatologia: [
      'Transudato: fatores sistêmicos (↑ pressão hidrostática na IC, ↓ oncótica, hidrotórax hepático).',
      'Exsudato: fatores locais (inflamação/neoplasia com extravasamento capilar ou ↓ drenagem linfática).',
    ],
    exames: [
      {
        titulo: 'Toracocentese / análise',
        itens: [
          'Indicada em derrame novo/inexplicado > 1 cm (dispensável em IC clara)',
          'Critérios de Light (exsudato se ≥ 1): proteína LP/soro > 0,5; LDH LP/soro > 0,6; LDH do LP > 2/3 do limite superior sérico',
          'Aspecto/análise: neutrofílico (agudo/parapneumônico), linfocítico (TB/neoplasia); pH < 7,2 + glicose < 60 e ADA > 35–40 (TB)',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'RX (obliteração do seio); US quantifica/guia a punção e vê septações; TC se difícil diagnóstico',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Transudato: IC (principal), cirrose, síndrome nefrótica, hidrotórax hepático',
      'Exsudato: parapneumônico/empiema, neoplasia, TB, TEP, pancreatite',
      'Hemotórax (Ht do LP > 50% do sérico); quilotórax (triglicérides > 110)',
    ],
    conduta: [
      {
        titulo: 'Conduta',
        itens: [
          'Tratar a causa de base; transudato de IC responde a diurético',
          'Toracocentese de alívio se insuficiência respiratória (não retirar > 1.500 mL de uma vez)',
        ],
      },
      {
        titulo: 'Drenagem',
        itens: [
          'Parapneumônico complicado/empiema (pus, pH < 7,2, glicose < 60, Gram/cultura +, loculação) → dreno torácico',
          'ATB cobrindo pneumococo + anaeróbios; fibrinolítico (t-PA + DNase) se loculado; videotoracoscopia se refratário',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'BTS 2023 (RAPID score)',
        texto:
          'No derrame parapneumônico, o escore RAPID (ureia, idade, purulência, fonte da infecção, albumina) estratifica o risco. Critérios de Light permanecem padrão (erro de classificação até 25% — usar gradiente de albumina na IC sob diurético).',
      },
    ],
  },
  {
    id: 'colecistite-colangite',
    nome: 'Colecistite e colangite (emergências biliares)',
    secao: 'Gastrointestinais',
    cid10: ['K81.0', 'K83.0'],
    sinonimos: ['colecistite', 'colangite', 'Murphy', 'Charcot', 'Tóquio', 'CPRE', 'vesícula'],
    capitulo: 78,
    resumo:
      'Colecistite: inflamação da vesícula por obstrução do cístico (cálculo em 90–95%) — dor em HD, Murphy, febre; manejo por Tóquio (TG18): ATB + colecistectomia precoce. Colangite: infecção das vias biliares por obstrução — tríade de Charcot (febre, icterícia, dor em HD); emergência → ATB amplo espectro + descompressão biliar (CPRE) urgente.',
    fisiopatologia: [
      'Colecistite: obstrução do cístico → distensão, congestão, necrose, fase supurativa; infecção bacteriana secundária (E. coli, Klebsiella, Enterococcus).',
      'Colangite: coledocolitíase → ↑ pressão intraductal e translocação bacteriana ascendente.',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Colecistite: leucocitose, PCR; bilirrubina/FA normais ou pouco elevadas',
          'Colangite: padrão colestático (FA/GGT ↑, BT > 4), leucocitose; hemoculturas + em ~70%',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'US é o exame inicial: colecistite (parede ≥ 4–5 mm, líquido pericolecístico, Murphy ecográfico); colangite (ductos dilatados)',
          'TC (complicações); cintilografia HIDA se US negativo; CPRM/CPRE para via biliar',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Cólica biliar; coledocolitíase',
      'Pancreatite aguda; úlcera péptica perfurada',
      'Hepatite/abscesso hepático; pielonefrite; IAM (inferior)',
      'Colecistite alitiásica (UTI, sepse, trauma, NPT)',
    ],
    conduta: [
      {
        titulo: 'Colecistite',
        itens: [
          'Jejum, volume, analgesia; ATB IV (cefalosporina de 3ª/piperacilina-tazobactam ± metronidazol), por gravidade (TG18 I/II/III)',
          'Colecistectomia videolaparoscópica precoce (ideal < 72 h dos sintomas)',
          'Alto risco/choque: colecistostomia percutânea + ATB; colecistectomia eletiva após estabilizar',
        ],
      },
      {
        titulo: 'Colangite',
        itens: [
          'Emergência: ATB amplo espectro (ceftriaxona + metronidazol, ou piperacilina-tazobactam) + ressuscitação',
          'Descompressão biliar por CPRE é a escolha (urgente nos graves; não adiar por sepse) — sucesso > 90%',
          'Atraso > 24–48 h após falha clínica aumenta muito a mortalidade',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Tokyo Guidelines 2018; WSES 2020',
        texto:
          'TG18 define diagnóstico/gravidade (I/II/III). WSES favorece colecistectomia laparoscópica precoce mesmo em alto risco (menos complicações que a colecistostomia), exceto choque séptico/contraindicação.',
      },
    ],
  },
  {
    id: 'apendicite',
    nome: 'Apendicite aguda',
    secao: 'Gastrointestinais',
    cid10: ['K35.9'],
    sinonimos: [
      'apendicite',
      'McBurney',
      'Blumberg',
      'Alvarado',
      'abdome agudo',
      'fossa ilíaca direita',
    ],
    capitulo: 79,
    resumo:
      'Inflamação do apêndice por obstrução luminal — emergência cirúrgica abdominal mais comum. Quadro clássico (50–60%): dor migratória do periumbilical para a fossa ilíaca direita, anorexia, febre baixa, irritação peritoneal. Apendicectomia (laparoscópica) é o padrão-ouro; ATB isolado é alternativa em casos selecionados não complicados.',
    fisiopatologia: [
      'Obstrução (hiperplasia linfoide em jovens; fecalito em adultos) → distensão, isquemia, necrose, perfuração.',
      'Dor visceral periumbilical inicial migra para a FID ao inflamar o peritônio; infecção polimicrobiana.',
    ],
    exames: [
      {
        titulo: 'Clínica / escores',
        itens: [
          'McBurney, Blumberg, Rovsing, psoas (retrocecal), obturador (pélvica); β-HCG na mulher fértil',
          'Escore de Alvarado (0–10): < 4 baixa; 5–8 intermediária (imagem); ≥ 7–9 alta (cirurgia)',
        ],
      },
      {
        titulo: 'Laboratório / imagem',
        itens: [
          'Leucocitose com desvio; PCR; leucócitos > 20.000 sugerem complicada',
          'US (1ª escolha em criança/gestante: apêndice não compressível, parede > 6 mm); TC (S/E > 90%); RM na gestante se US inconclusivo',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Mulheres: torção anexial, DIP, gravidez ectópica, endometriose',
      'Adenite mesentérica, diverticulite de Meckel, intussuscepção (criança)',
      'Diverticulite, neoplasia de cólon (idoso); doença de Crohn',
      'ITU',
    ],
    conduta: [
      {
        titulo: 'Conduta',
        itens: [
          'Suporte: analgesia, antiemético, hidratação, jejum',
          'ATB após diagnóstico, cobrindo Gram-negativos + anaeróbios (ceftriaxona + metronidazol); profilaxia pré-operatória',
          'Apendicectomia laparoscópica é o padrão-ouro; não complicada em até 24 h não aumenta perfuração',
          'Complicada (perfuração/abscesso): manter ATB 5–7 dias (carbapenêmico/piperacilina-tazobactam)',
        ],
      },
      {
        titulo: 'Manejo não operatório',
        itens: [
          'Alternativa em não complicada selecionada, sem apendicólito (ou contraindicação cirúrgica)',
          'Recidiva em até ~40% em 5 anos; NÃO indicar na gestação',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'WSES Jerusalém 2020',
        texto:
          'ATB isolado é alternativa segura na apendicite não complicada selecionada e sem apendicólito; não recomendado na gravidez. Apendicectomia laparoscópica é a de escolha (menos infecção/internação).',
      },
    ],
  },
  {
    id: 'lra',
    nome: 'Lesão renal aguda',
    secao: 'Renais/Urológicas',
    cid10: ['N17.9'],
    sinonimos: ['LRA', 'IRA', 'KDIGO', 'NTA', 'oligúria', 'diálise', 'AEIOU'],
    capitulo: 80,
    resumo:
      'Queda abrupta da função renal (KDIGO: creatinina ↑ ≥ 0,3 mg/dL em 48 h, ou ↑ ≥ 1,5× a basal, ou débito urinário < 0,5 mL/kg/h por > 6 h). Classifica-se em pré-renal (~55–70%), intrínseca (NTA é a mais comum) e pós-renal (obstrução). Tratar a causa, otimizar volemia, suspender nefrotóxicos e tratar complicações letais.',
    fisiopatologia: [
      'Pré-renal: hipoperfusão sem dano (reversível); se prolongada vira NTA isquêmica.',
      'Intrínseca: NTA (isquemia/nefrotoxinas — contraste, aminoglicosídeo, rabdomiólise, lise tumoral), NIA por fármacos, glomerulonefrite.',
      'Pós-renal: obstrução (próstata, cálculo, tumor, bexigoma); sepse é o gatilho mais comum em internados.',
    ],
    exames: [
      {
        titulo: 'Laboratório / urina',
        itens: [
          'Creatinina/ureia (relação > 40 sugere pré-renal), eletrólitos (K, Ca, P), gasometria',
          'Urina 1 com sedimento: cilindros granulosos (NTA), hemáticos (GN), leucocitários/eosinofilúria (NIA)',
          'FeNa < 1% (pré-renal) vs > 2% (NTA); FeUr ≤ 35% útil em uso de diurético',
        ],
      },
      {
        titulo: 'Imagem / ECG',
        itens: [
          'US/POCUS renal: descarta pós-renal (hidronefrose, bexigoma) e avalia volemia',
          'ECG p/ repercussão da hipercalemia',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pré-renal: hipovolemia, IC, cirrose/hepatorrenal, sepse, AINE/IECA/BRA',
      'Intrínseca: NTA, glomerulonefrite, NIA, vascular',
      'Pós-renal: obstrução (hidronefrose ao US)',
    ],
    conduta: [
      {
        titulo: 'Geral',
        itens: [
          'Tratar a causa; otimizar volemia com cristaloide balanceado (KDIGO: cristaloide, não coloide)',
          'Suspender nefrotóxicos (contraste, AINE, aminoglicosídeo); ajustar doses; evitar dopamina renal (KDIGO 1A contra)',
          'Diurético de alça só na sobrecarga volêmica (não muda mortalidade); tratar hipercalemia (cálcio, glicoinsulina, β2, resina/diálise)',
        ],
      },
      {
        titulo: 'Diálise de urgência (AEIOU)',
        itens: [
          'Acidose refratária (pH < 7,1); Eletrólitos (hipercalemia refratária > 6,5)',
          'Intoxicação dialisável (lítio, salicilato, metanol, etilenoglicol, valproato)',
          'Overload (sobrecarga) refratária; Uremia com complicações (encefalopatia, pericardite); CRRT se instável',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'KDIGO 2012; ABRAMEDE/USP',
        texto:
          'Biomarcadores precoces (NGAL, cistatina-C, TIMP-2/IGFBP7) e teste de estresse com furosemida predizem progressão. Início precoce de diálise não reduz mortalidade. Seguimento com nefrologista em ≤ 90 dias reduz mortalidade.',
      },
    ],
  },
  {
    id: 'hdb',
    nome: 'Hemorragia digestiva baixa',
    secao: 'Gastrointestinais',
    cid10: ['K92.2'],
    sinonimos: [
      'HDB',
      'hematoquezia',
      'diverticular',
      'angiodisplasia',
      'colonoscopia',
      'sangramento',
    ],
    fonte: 'Tratado de Medicina de Emergência ABRAMEDE (Manole, 1ª ed., 2024), cap. 94',
    resumo:
      'Sangramento distal ao ligamento de Treitz, em geral hematoquezia (fazer toque retal). Causa mais frequente: diverticulose (até ~55%); angiodisplasia no idoso, hemorroidas no jovem. Sangramento maciço com instabilidade exige excluir HDA. Colonoscopia é o exame de escolha no estável; angio-TC no instável com sangramento ativo.',
    fisiopatologia: [
      'Vascular/anatômico (diverticulose, angiodisplasia) → sangramento volumoso e indolor; inflamatório → dor + diarreia.',
      'Cólon direito tende a sangue escuro/oculto; esquerdo, vermelho-vivo. Fatores: AINE/AAS, DRC, idade.',
    ],
    exames: [
      {
        titulo: 'Laboratório / inicial',
        itens: [
          'Hemograma (Hb cai após > 48 h), coagulograma, função hepática, lactato, ureia seriada',
          'RX de abdome p/ excluir perfuração antes dos demais exames',
        ],
      },
      {
        titulo: 'Diagnóstico por estabilidade',
        itens: [
          'Estável: colonoscopia (escolha — diagnóstico e tratamento)',
          'Instável com sangramento ativo: angio-TC (detecta a partir de 0,3 mL/min) → angiografia terapêutica',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hemorragia digestiva alta maciça (pode dar hematoquezia) — excluir com EDA se necessário',
      'Diverticulose; colite (infecciosa/isquêmica); doença inflamatória intestinal',
      'Anorretais (hemorroidas, fissura); neoplasia; angiodisplasia; pós-polipectomia',
    ],
    conduta: [
      {
        titulo: 'Ressuscitação',
        itens: [
          'Toque retal; acesso calibroso, cristaloide (Ringer 500 mL em 30 min; até 20 mL/kg); noradrenalina se refratário',
          'Transfundir se Hb < 7 g/dL (individualizar na hemorragia maciça); NÃO usar ácido tranexâmico (HALT-IT)',
          'Reverter anticoagulação (varfarina: vit K + CCP); não transfundir plaquetas se contagem normal',
        ],
      },
      {
        titulo: 'Diagnóstico / tratamento',
        itens: [
          'Estável de baixo risco (Oakland ≤ 8): investigação ambulatorial',
          'Tratamento: colonoscópico (estável) ou angiográfico (instável); cirurgia em hematoquejia maciça refratária',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE 2024 / BSG (Oakland) 2019',
        texto:
          'Colonoscopia no estável e angio-TC no instável; transfusão se Hb < 7. Escore de Oakland ≤ 8 permite alta para investigação ambulatorial. Ácido tranexâmico contraindicado.',
      },
    ],
  },
  {
    id: 'itu',
    nome: 'ITU e pielonefrite',
    secao: 'Infecciosas',
    cid10: ['N39.0', 'N10'],
    sinonimos: ['cistite', 'pielonefrite', 'infecção urinária', 'urocultura', 'bacteriúria'],
    capitulo: 50,
    resumo:
      'ITU é a presença de patógenos no trato urinário (urina normalmente estéril), classificada por sítio (cistite=bexiga, pielonefrite=rim) e em não complicada (cistite/pielonefrite esporádica em mulher não gestante, sem alteração estrutural/funcional ou comorbidade) vs complicada. Diagnóstico de ITU exige sintomas + bacteriúria; não se trata urinálise isolada em assintomático, exceto grupos específicos. E. coli causa 75-95% dos casos. ITU não complicada é diagnóstico clínico e dispensa exames; cistite na mulher trata-se por ~3 dias, homem ≥7 dias, pielonefrite 10-14 dias. ITU em homem é considerada complicada pelo risco de alteração estrutural/prostática. Não usar fluoroquinolona como 1ª escolha na cistite.',
    fisiopatologia: [
      'Uropatógenos da flora fecal/vaginal colonizam o introito e a região periuretral e ascendem pela uretra à bexiga e daí, pelos ureteres, aos rins; via hematogênica/linfática é rara (pacientes debilitados/imunossuprimidos)',
      'Uropatógenos com adesinas/fíbrias/pili aderem e invadem o urotélio',
      'Predisposição feminina por uretra curta (~4 cm) próxima de áreas vulvar/perianal; homem tem uretra longa (~20 cm) com uretra prostática; menor distância uretra-ânus aumenta risco',
      'Obstrução de qualquer etiologia (ex.: litíase) causa estase urinária e aumenta o risco',
      'E. coli é o agente predominante (75-95%); outros: S. saprophyticus, Enterococcus, Klebsiella, Proteus, Enterobacter; em hospitalizados/sondados surgem cepas resistentes (Pseudomonas, Morganella, enterococos) e Candida; preocupação com E. coli produtora de betalactamase (ESBL)',
      'Fatores de risco: atividade sexual, novo parceiro, diafragma/espermicida (aumenta colonização por E. coli), DM, idosos, lesão medular, sonda vesical de demora, imunossupressão, gestação, ITU prévia; higiene íntima/micção não aumentam risco',
      'Sonda vesical de demora: incidência de bacteriúria ~5%/dia; sonda intermitente tem risco menor',
      'A partir dos ~50 anos no homem, hipertrofia prostática gera obstrução e eleva a incidência',
    ],
    exames: [
      {
        titulo: 'Quando NÃO solicitar / abordagem clínica',
        itens: [
          'ITU/cistite não complicada na mulher: diagnóstico clínico, exames complementares dispensáveis',
          'Sintomas típicos (disúria, urgência, polaciúria, dor suprapúbica) sem corrimento vaginal: tratar com base nos sintomas',
          'Mulher com sintomas característicos sem descarga vaginal pode ser tratada como cistite sem outros exames',
        ],
      },
      {
        titulo: 'Urina tipo 1 / EAS (sedimento, fita)',
        itens: [
          'Coleta de jato médio após higiene (descartar 1º jato na mulher); predomínio de células epiteliais sugere contaminação',
          'Sondagem só p/ coleta se mulher incapaz de amostra limpa (ex.: menstruação) ou homem com retenção urinária',
          'Esterase leucocitária (neutrófilos): sensível; Nitrito (Gram-negativos com nitrato-redutase): específico (>90%) quando presente, mas sensibilidade ~50% — ausência não exclui ITU; falso-negativo com Enterococcus, Pseudomonas, S. saprophyticus',
          'Piúria (>10 leucócitos/mm³ ou /mL) é praticamente universal na cistite e pielonefrite; ausência sugere fortemente diagnóstico alternativo não infeccioso',
          'Hematúria aumenta a probabilidade de ITU (ocorre em ~25-50% das cistites)',
          'Piúria tem menor correlação com ITU em pacientes sondados; piúria pode haver em 30-35% das bacteriúrias assintomáticas (não tratar)',
        ],
      },
      {
        titulo: 'Urocultura com antibiograma',
        itens: [
          'Exame confirmatório/definitivo, colher antes do antibiótico; ≥10^5 UFC/mL positiva (~95% de probabilidade); ≥10^4 UFC/mL sugestiva (~50%); em mulher muito sintomática considerar a partir de 10²',
          'Indicada em: pielonefrite/suspeita, gestante, homem adulto, criança, imunossuprimido, DM, idoso/risco de bacteriemia, falha terapêutica, sintomas >4-6 (ou >7) dias, ITU recorrente/complicada, alterações urológicas, instrumentação recente, uso recente de ATB, hospitalização recente, sepse/aspecto toxêmico',
          'Homem com suspeita de prostatite aguda: cultura de secreção prostática',
        ],
      },
      {
        titulo: 'Imagem (US / TC)',
        itens: [
          'Não indicada em ITU não complicada ambulatorial em paciente hígido',
          'Indicar em: ausência de melhora em 24-48 h, febre persistente >72 h (ou >3-5 dias), choque séptico, suspeita de obstrução, pielonefrite com pH urinário >7, piora da função renal (TFG <40 mL/min), suspeita de complicação (abscesso, ureterolitíase, pielonefrite enfisematosa)',
          'US: baixo custo, sem radiação, operador-dependente; avalia obstrução, abscesso intrarrenal/perinéfrico, resíduo pós-miccional',
          'TC: alta sensibilidade para abscesso/obstrução/inflamação; sem contraste para cálculo/hemorragia/obstrução; com contraste se alteração de perfusão renal',
          'Hemocultura, função renal, hemograma e eletrólitos quando pielonefrite indica internação',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Uretrite (Chlamydia, Neisseria gonorrhoeae, Herpes simplex) — IST; suspeitar com novo/múltiplos parceiros, corrimento, disúria sem polaciúria, início gradual',
      'Vaginite (Candida, Trichomonas) — disúria externa, corrimento, prurido, odor; piúria rara',
      'Cistite intersticial (lembrar em idosos)',
      'Atrofia/vaginite atrófica por deficiência estrogênica (disúria sem infecção em mulher idosa)',
      'Prostatismo/HPB (sintomas urinários sem infecção no homem); prostatite bacteriana aguda',
      'Cálculo/obstrução urinária, irritação química, trauma, neoplasia, malformações, causas psicogênicas',
      'Piúria estéril (leucocitúria sem crescimento) — diverticulite, apendicite, pielonefrite crônica',
      'Corrimento vaginal afasta ITU / aponta uretrite ou vaginite',
    ],
    conduta: [
      {
        titulo: 'Cistite não complicada',
        itens: [
          'Tratamento empírico de 1ª linha: Nitrofurantoína 100 mg 6/6 h por 5 dias (ou 12/12 h por 5 dias); SMX-TMP 160/800 mg 12/12 h por 3 dias; Fosfomicina 3 g dose única (menor eficácia, evitar se risco de pielonefrite)',
          'SMX-TMP como droga de escolha se resistência regional <20% (ABRAMEDE também cita SMX-TMP 160/800 mg dose única)',
          'Dose única de ATB tem taxa de recorrência inaceitável — não recomendada (USP)',
          'Não usar fluoroquinolona como 1ª linha; reservar a quem falhou/contraindica as demais',
          '2ª linha (betalactâmicos): Amoxicilina-clavulanato 500/125 mg 12/12 h por 3-7 (até 5-7) dias; Cefalexina 250-500 mg 6-12/12 h; Cefadroxila 500 mg / 250 mg 6/6 h 3-7 dias; (amoxicilina isolada não deve ser usada)',
          'Outras opções USP: Norfloxacina 400 mg 12/12 h 3 dias; Ácido nalidíxico 500 mg 6/6 h 3 dias; pivmecilinam 200 mg 8/8 h 3-7 dias (pouco disponível)',
          'Quinolonas (ciproflox 250 mg 12/12 h ou levoflox 250 mg) como última opção',
          'Fenazopiridina como analgésico tópico urinário p/ disúria',
          'Eficácia do esquema de 3 dias >90%; se houver resolução, dispensa controle; se não melhorar, fazer urina 1 + urocultura e guiar pelo antibiograma',
          'Se suspeita de clamídia/gonorreia associada, tratar empiricamente ambos (ceftriaxona 250 mg IM + azitromicina 1 g; ou doxiciclina 100 mg 12/12 h por 7 dias)',
        ],
      },
      {
        titulo: 'Pielonefrite',
        itens: [
          'Clínica: febre (~90%), calafrio, dor em flanco, sinal de Giordano/dor costovertebral, náuseas/vômitos; ~80% têm sintomas de cistite; bacteremia em 10-50%',
          'Sempre colher urina 1 + urocultura com antibiograma',
          'Pielonefrite aguda não complicada — opções (USP): Ciprofloxacina 400 mg IV ou 500 mg VO 12/12 h; Ceftriaxona 1-2 g IM/IV 1x/dia; Aminoglicosídeo dose única diária (amicacina 15 mg/kg ou gentamicina 5 mg/kg)',
          'Duração 7-14 dias (estudos sugerem não haver benefício além de 7 dias); USP cita 10-14 dias como referência geral',
          'Náuseas/vômitos: hidratação EV 10-30 mL/kg com cristaloide isotônico + antiemético',
          'Pielonefrite ambulatorial/sem internação (ABRAMEDE): Ciprofloxacina 500 mg 12/12 h 5-7 dias; Levofloxacina 750 mg 24/24 h 5-7 dias; SMX-TMP 160/800 mg 12/12 h 10-14 dias',
          'Pielonefrite com necessidade de internação (ABRAMEDE): Ceftriaxona 1 g 24/24 h; Cefepima 1-2 g 12/12 h; Piperacilina-tazobactam 3,375 g 6/6 h; Aztreonam 1 g 8-12/12 h; Ciprofloxacina 400 mg 12/12 h; Levofloxacina 500 mg 24/24 h',
          'Nitrofurantoína e fosfomicina NÃO atingem níveis teciduais/séricos adequados — ineficazes na pielonefrite',
          'Converter parenteral→oral após melhora clínica e ≥24-48 h afebril; se febre >72 h (3-5 dias) ou sem melhora em 24-48 h, fazer imagem para abscesso/complicação',
          'Abscesso: ATB 14-28 dias + considerar drenagem; pielonefrite enfisematosa pode exigir nefrectomia; urolitíase obstrutiva com sepse = desobstrução cirúrgica de emergência',
          'Internar se: toxicidade (febre, taquicardia, hipotensão, vômito), incapacidade de VO, 3º trimestre, falha ambulatorial, obstrução/anomalia urológica, comorbidades graves; choque séptico = UTI; pielonefrite não complicada em geral pode ser ambulatorial após 1ª dose EV no PS',
        ],
      },
      {
        titulo: 'Situações especiais',
        itens: [
          'Gestante: colher EAS + urocultura; tratar bacteriúria assintomática (de rotina) e cistite; empírico com fosfomicina ou betalactâmicos (cefadroxila, cefalexina, amoxicilina); quinolonas contraindicadas; nitrofurantoína evitar em deficiência de G6PD e no fim da gestação; SMX-TMP evitar no 1º trimestre; pielonefrite pode manifestar só com sintomas baixos; 3º trimestre com pielonefrite = internar',
          'Homem: ITU considerada complicada; cistite associada a HPB — fazer urina 1 + urocultura + avaliação prostática; tratar ≥7 dias; suspeita de prostatite (febre, calafrios, dor pélvica/perineal, sintomas obstrutivos, toque retal com edema/sensibilidade): ciprofloxacina 500 mg 12/12 h, levofloxacina 750 mg 24/24 h ou SMX-TMP por ≥7 dias (14-28 dias se prostatite)',
          'Sondado/cateter vesical: trocar a sonda; bacteriúria persistente 48 h após retirada indica tratar; criticamente doente com ITU presuntiva = ATB imediato; duração 7-14 dias guiada por cultura; sem cocos Gram+ no Gram → ceftriaxona 2 g/dia ou ciprofloxacina 400 mg EV 12/12 h; Pseudomonas → ceftazidima 2 g 8/8 h ± aminoglicosídeo; enterococo → ampicilina/vancomicina ± aminoglicosídeo; estafilococo coagulase-negativo → vancomicina 1 g 12/12 h; remoção do cateter resolve ~40% das candidúrias',
          'Bacteriúria assintomática: tratar só gestantes, neutropênicos, transplantados (controverso), pré-operatório de cirurgia urológica/prótese; piúria não indica tratar',
          'Urossepse/choque séptico: foco mais comum de choque séptico (mortalidade 10-20%); internação, ATB parenteral, ressuscitação; desobstrução de emergência se obstrução; UTI no choque',
          'Candidúria: tratar só sintomáticos ou grupos de risco (neutropênico, transplantado, pré-op urológico, muito baixo peso); trocar sonda; fluconazol 200-400 mg/dia 7-14 dias ou anfotericina B 0,3 mg/kg/dia; investigar obstrução com imagem',
          'HIV/AIDS: quinolonas são a classe de escolha (resistência aumentada a SMX-TMP pelo uso na profilaxia de pneumocistose), salvo antibiograma',
          'Idoso: apresentação atípica/oligossintomática; alta prevalência de bacteriúria assintomática — urocultura positiva não obriga tratamento; ser conservador',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'USP/HC-FMUSP — Medicina de Emergência: Abordagem Prática, 19ª ed. (2025)',
        texto:
          'Cistite na mulher tratada por 3 dias (dose única não recomendada por recorrência); SMX-TMP de escolha se resistência regional <20%; pielonefrite 7-14 dias, sem benefício além de 7 dias; primeira dose EV de ATB no PS para pielonefrite; pivmecilinam citado como nova opção em cistite (pouco disponível no Brasil).',
      },
      {
        diretriz: 'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 1ª ed., 2024)',
        texto:
          'Classificação CDC/IDSA/ESCMID; ITU não complicada deve ser tratada com fosfomicina, nitrofurantoína ou SMX-TMP, sem fluoroquinolona de 1ª escolha; ITU no homem considerada complicada com investigação estrutural/prostática; nitrofurantoína e fosfomicina ineficazes em pielonefrite; tabelas separadas de pielonefrite ambulatorial e internada; baseado em EAU 2023 e UpToDate 2023-2024.',
      },
    ],
  },
  {
    id: 'celulite-erisipela',
    nome: 'Celulite e erisipela',
    secao: 'Infecciosas',
    cid10: ['L03.9', 'A46'],
    sinonimos: ['erisipela', 'fasceíte necrotizante', 'infecção de pele', 'LRINEC', 'partes moles'],
    capitulo: 53,
    resumo:
      'Erisipela e celulite são infecções cutâneas que surgem da entrada bacteriana por quebra de barreira cutânea, mais comuns em membros inferiores. A erisipela (celulite superficial) acomete derme e rede linfática superficial, com bordas bem definidas/elevadas, linha de demarcação nítida e sintomas sistêmicos mais pronunciados (febre, calafrios), tipicamente por Streptococcus pyogenes (beta-hemolítico do grupo A). A celulite é mais profunda (derme profunda e tecido subcutâneo/hipoderme), bordas mal definidas, curso mais indolente, podendo ser purulenta, tipicamente por Staphylococcus aureus. O diagnóstico é essencialmente clínico. A prioridade do emergencista é reconhecer sinais de gravidade e suspeitar de infecção necrotizante (fasceíte necrotizante), emergência cirúrgica de alta letalidade.',
    fisiopatologia: [
      'Entrada de bactéria por solução de continuidade/quebra da barreira cutânea (estrato córneo): queimaduras, mordeduras/picadas, escoriações, cirurgia prévia, úlceras vasculares, tinea pedis, trauma local',
      'Erisipela: inflamação aguda da derme com comprometimento da rede linfática superficial; lesão eleva-se acima da pele com linha de demarcação clara',
      'Celulite: acomete derme profunda e gordura subcutânea, podendo cursar com necrose; infecção aparentemente purulenta',
      'Fatores de risco: insuficiência venosa (mais frequente), linfedema (fator predisponente e complicação), doença vascular periférica, diabetes, obesidade, tinea pedis, úlceras de MMII, trauma local, picadas de inseto',
      'Erisipela recorrente por persistência de linfedema pode evoluir para fibrose e elefantíase',
      'Fasceíte necrotizante: infecção inicia na fáscia superficial, com trombose de pequenos vasos e necrose que se alastra às fáscias profundas; músculo costuma ser poupado (bom suprimento sanguíneo); a má perfusão local dificulta a penetração de antibióticos',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Geralmente não necessários (diagnóstico clínico); reservar a casos com indicação de internação',
          'Leucocitose (especificidade ~84,5%, sensibilidade ~43%) e PCR elevada (sensibilidade ~67%, especificidade ~94,8%) — PCR é melhor indicador de infecção bacteriana; PCR normal não exclui infecção',
          'Função renal e eletrólitos se considerada internação',
        ],
      },
      {
        titulo: 'Microbiologia',
        itens: [
          'Hemoculturas positivas em <4% — reservar para sintomas de sepse e febre (>38°C)',
          'Culturas de biópsia/aspirado de pele apenas em casos selecionados/duvidosos (imunossuprimidos, grandes queimados, bacteremia/sepse)',
          'Erisipela facial/celulite resistente: cultura e antibiograma das secreções',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'Úteis se suspeita de abscesso subjacente, fasceíte necrotizante ou diagnóstico incerto',
          'Ultrassonografia: detecta coleções/abscessos e orienta drenagem; Doppler só para TVP se fatores de risco',
          'TC: pode excluir osteomielite; mostra edema de fáscias e gás intermuscular na fasceíte',
          'RM: útil na suspeita de fasceíte necrotizante (espessamento de fáscias profundas, hipersinal em T2)',
        ],
      },
      {
        titulo: 'Suspeita de fasceíte necrotizante (sinais de alarme)',
        itens: [
          'Suspeitar com: edema tenso, necrose da pele, crepitação, parestesias, leucócitos >14.000/mm³',
          'Escore LRINEC auxilia: <5 baixo risco, 5-7 risco moderado, ≥8 alto risco; em alto risco/forte suspeita NÃO aplicar o escore — encaminhar para debridamento cirúrgico',
          'Marcadores: PCR muito elevada precocemente, leucocitose, hiponatremia (Na<135), enzimas musculares elevadas; hemoculturas positivas em >60%',
          'Exploração cirúrgica é o padrão diagnóstico',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Dermatite de estase (causa mais comum de confusão; ~28% diagnosticados incorretamente como celulite)',
      'Trombose venosa profunda e tromboflebite',
      'Angioedema',
      'Herpes-zóster',
      'Dermatite de contato em fase inicial',
      'Urticária',
      'Picada de inseto (hipersensibilidade)',
      'Erupção medicamentosa fixa, eritema nodoso, eritema migratório',
      'Fasceíte necrotizante (pode mimetizar celulite/erisipela) — manter limiar baixo de suspeição',
    ],
    conduta: [
      {
        titulo: 'Medidas gerais',
        itens: [
          'Repouso, elevação do membro afetado, analgesia, compressas frias',
          'Marcar a área de celulite e reavaliar diariamente progressão/regressão para aferir resposta',
          'Decisão-chave: necessidade de internação para antibiótico parenteral (classificação de Eron I-IV: I oral/ambulatorial; II oral ou IV; III IV/internação por toxicidade sistêmica; IV sepse grave ou fasceíte — IV com possível debridamento)',
        ],
      },
      {
        titulo: 'Antibiótico',
        itens: [
          'Ambulatorial (quadros leves, VO): cefalosporina de 1ª geração, clindamicina, amoxicilina/clavulanato e tetraciclinas; maior gravidade pode associar ciprofloxacina + clindamicina (USP). ABRAMEDE (MMII, VO): cefalexina 500 mg 4x/dia 10d; amoxicilina 500 mg 3x/dia 10d; azitromicina 500 mg 1x/dia 5d',
          'Internado (parenteral): oxacilina 1-2 g a cada 4-6h (evitar <6 g/dia); se suspeita de erisipela, cefalosporina (cefazolina ou ceftriaxone 2 g/dia) ou penicilina cristalina EV. ABRAMEDE: cefazolina 1 g IV 6/6h, penicilina G cristalina 5.000.000 UI IV 4x/dia, clindamicina 300-600 mg IV 3x/dia',
          'Cobertura: erisipela visa Streptococcus; celulite visa S. aureus + estreptococos',
          'Duração: em geral 5 dias (USP), individualizar conforme resposta; considerar troca para VO se afebril por 48h, regressão da área marcada e queda da PCR',
          'MRSA: considerar em pacientes sem resposta — vancomicina (também linezolida, daptomicina); fatores para cobrir MRSA incluem hospitalização recente, instituição de longa permanência, cirurgia recente, hemodiálise, colonização/infecção prévia por MRSA, HIV, uso de drogas injetáveis, antibiótico nos últimos 6 meses, prisioneiros',
        ],
      },
      {
        titulo: 'Sinais de alarme / fasceíte necrotizante',
        itens: [
          'Suspeitar quando: dor intensa e desproporcional aos achados, edema tenso/além do eritema, necrose ou alteração de cor da pele (azul-acinzentada), bolhas hemorrágicas, crepitação, parestesias/anestesia local, eritema sem margens nítidas, toxicidade sistêmica/sepse',
          'Sinais clássicos (bolhas hemorrágicas, crepitação, necrose) são tardios (≥5 dias) — manter limiar de suspeição BAIXO; paciente pode parecer bem até fase avançada',
          'Considerar também: leucócitos >14.000/mm³, hiponatremia, enzimas musculares elevadas, PCR muito elevada',
          'Conduta: EMERGÊNCIA CIRÚRGICA — debridamento precoce e agressivo (padrão diagnóstico e terapêutico); reabordagens até tecido saudável; UTI',
          'Antibioticoterapia de amplo espectro em TODOS os casos: carbapenêmico ou betalactâmico/inibidor de betalactamase + clindamicina (clindamicina inibe produção de toxinas estreptocócicas — recomendada pela IDSA); associar vancomicina (cobertura MRSA) em graves; descalonar conforme cultura',
          'Adjuvantes: imunoglobulina (1 g/kg no 1º dia, 0,5 g/kg no 2º e 3º dias); oxigenoterapia hiperbárica de utilidade discutível, não de rotina',
          'Mortalidade 20-40% mesmo com tratamento cirúrgico',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'IDSA 2014 (Stevens et al., Clin Infect Dis 2014)',
        texto:
          'Diretriz de referência para diagnóstico e manejo de infecções de pele e partes moles; classificação de Eron para definir via de antibiótico/internação; recomenda clindamicina nas infecções necrotizantes por inibir a produção de toxinas estreptocócicas.',
      },
      {
        diretriz: 'WSES/SIS-E 2018 (Sartelli et al., World J Emerg Surg 2018)',
        texto: 'Consenso para manejo de infecções de pele e partes moles, incluindo necrotizantes.',
      },
      {
        diretriz: 'Lancet 2022 (Hua et al., Necrotizing soft-tissue infections)',
        texto:
          'Revisão das infecções necrotizantes de partes moles, reforçando diagnóstico precoce e debridamento cirúrgico imediato.',
      },
      {
        diretriz: 'ABRAMEDE 2024',
        texto:
          'Erisipela associada a S. pyogenes (bordas definidas, MMII, sintomas sistêmicos) vs celulite a S. aureus (bordas mal definidas, mais profunda); classifica celulite em leve/moderada/grave; suspeitar de fasceíte necrosante em necrose, parestesia, edema tenso e leucócitos >14.000/mm³; em crianças <3 anos considerar Haemophilus influenzae tipo B.',
      },
    ],
  },
  {
    id: 'leptospirose',
    nome: 'Leptospirose',
    secao: 'Infecciosas',
    cid10: ['A27.9'],
    sinonimos: ['Weil', 'espiroqueta', 'leptospira', 'MAT'],
    capitulo: 52,
    resumo:
      'Zoonose febril aguda sistêmica causada por espiroquetas do gênero Leptospira (Leptospira interrogans; sorotipo icterohaemorrhagiae nas formas graves), endêmica no Brasil e epidêmica em períodos de chuva/enchentes. Transmissão acidental por contato de pele lesada, mucosas ou conjuntiva com água/solo contaminados por urina de animais infectados (roedores são o principal reservatório). Exposição ocupacional, acidental (enchentes/desastres) e recreacional. Maioria dos casos é leve e autolimitada; cerca de 5-10% evoluem para forma grave (síndrome/doença de Weil). Letalidade no Brasil em torno de 9%.',
    fisiopatologia: [
      'Após penetrar pela pele/mucosa, a leptospira atinge a corrente sanguínea e dissemina-se por múltiplos órgãos (fígado, rins, músculo, pulmão)',
      'Vasculite com destruição endotelial é responsável pelas principais manifestações da doença',
      'Fígado: disfunção hepatocelular com queda da síntese de fatores de coagulação e albumina; icterícia resulta de lesão vascular, em geral sem necrose hepatocelular',
      'Rim: dano tubular por imunocomplexos, hipoxemia e efeito tóxico direto, com nefrite intersticial e necrose tubular (LRA); comum hipocalemia por perda tubular de potássio',
      'Músculo: miosite com mialgia intensa (panturrilhas/lombar) e elevação de CPK, podendo evoluir com rabdomiólise',
      'Resposta imune libera grandes quantidades de citocinas',
      'Doença classicamente bifásica: fase aguda/septicêmica (5-14 dias) seguida de fase imune (produção de IgM, excreção urinária da leptospira); menos de 50% dos pacientes apresentam as duas fases',
    ],
    exames: [
      {
        titulo: 'Inespecíficos / laboratoriais gerais',
        itens: [
          'Hemograma: leucopenia ou leucocitose leve; leucocitose >13 mil associada a pior prognóstico; plaquetopenia (<100 mil/mm³) nas formas graves',
          'VHS e marcadores inflamatórios aumentados',
          'CPK (enzima muscular) elevada em >50% dos casos, indicando comprometimento muscular/rabdomiólise',
          'Transaminases (ALT/AST) elevadas, geralmente <200 U/L; falência hepática é rara',
          'Bilirrubina total/frações elevadas (predomínio de bilirrubina conjugada; pode ultrapassar 20 mg/dL); fosfatase alcalina elevada',
          'Ureia e creatinina (LRA, em geral não oligúrica na fase inicial)',
          'Distúrbios eletrolíticos: hipocalemia comum (aumenta chance diagnóstica); hiponatremia comum nas formas graves; hipercalemia é mau prognóstico',
          'Urina tipo 1: proteinúria, piúria (estéril) e hematúria microscópica',
          'Líquor (meningite asséptica): pleocitose linfocítica, proteínas discretamente elevadas, glicose normal',
          'Radiografia de tórax nos casos graves: infiltrado alveolar (bases/periferia) por hemorragia alveolar',
        ],
      },
      {
        titulo: 'Específicos / confirmatórios',
        itens: [
          'ELISA-IgM: anticorpos detectáveis a partir do 5º dia de sintomas; teste precoce e sensível',
          'Microaglutinação (MAT): teste de referência (padrão-ouro OMS); positivo com título ≥1:100; soroconversão ou aumento de 4x em amostras pareadas (14-60 dias); título único ≥800 confirma',
          'PCR: positivo precocemente, na fase de bacteremia (1ª semana), antes dos anticorpos IgM; não identifica o sorovar',
          'Hemocultura/cultura (meio de Fletcher/EMJH): padrão de referência por isolamento, porém pouco prático (incubação longa, baixa sensibilidade ~50%)',
          'Sorologia negativa antes do 7º dia não descarta o caso: repetir coleta a partir do 7º dia',
          'Critério clínico-epidemiológico quando exame específico indisponível: febre + alteração hepática, renal ou vascular + história epidemiológica compatível',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Dengue (principal; leucocitose com desvio à esquerda ajuda a diferenciar da leucopenia da dengue)',
      'Chikungunya (febre com artralgia intensa)',
      'Malária (descartar com gota espessa em área endêmica)',
      'Influenza/síndromes gripais',
      'Riquetsioses',
      'Doença de Chagas aguda',
      'Forma anictérica: HIV agudo, febre tifoide, encefalites, mononucleose, brucelose',
      'Forma ictérica/tardia: hepatites virais, febre amarela, hantavirose, malária grave, sepse, pneumonia, pielonefrite, endocardite, colangite/colecistite',
    ],
    conduta: [
      {
        titulo: 'Antibiótico',
        itens: [
          'Iniciar precocemente (idealmente nos primeiros 5 dias), mesmo sem confirmação diagnóstica; em casos graves não aguardar confirmação',
          'Leve / fase precoce (ambulatorial): doxiciclina 100 mg VO 12/12h por 5-7 dias (escolha nas formas anictéricas); ou amoxicilina 500 mg VO 8/8h por 5-7 dias; crianças amoxicilina 50 mg/kg/dia VO 8/8h',
          'Doxiciclina contraindicada em crianças <9 anos, gestantes, nefropatas e hepatopatas',
          'Grave / fase tardia (hospitalar, IV): penicilina G cristalina 1,5 milhão UI IV 6/6h (1.500.000-2.000.000 U); ou ceftriaxona 1-2 g IV 1x/dia; ou cefotaxima 1 g IV 6/6h; ou ampicilina 1 g IV 6/6h; alternativa azitromicina 500 mg IV 1x/dia; mínimo 7 dias (7-10 dias)',
          'Pode ocorrer reação de Jarisch-Herxheimer',
        ],
      },
      {
        titulo: 'Suporte (forma grave)',
        itens: [
          'Hospitalização imediata; UTI se instabilidade hemodinâmica, comprometimento respiratório, rebaixamento de consciência ou disfunção orgânica',
          'Reposição volêmica com cristaloides individualizada (risco de extravasamento/edema agudo de pulmão por dano endotelial); restaurar perfusão orgânica',
          'Lesão renal aguda: diálise precoce; diálise diária associada a menor mortalidade que em dias alternados',
          'Hemorragia alveolar/SDRA: suporte ventilatório (CPAP ou IOT) com estratégia protetora — PEEP alto (>15 cmH2O) e baixo volume corrente (~6 mL/kg)',
          'Drogas vasoativas, transfusão de hemoderivados conforme necessário',
          'Evitar nefrotóxicos, hepatotóxicos, anticoagulantes e antiplaquetários, especialmente em manifestações hemorrágicas',
          'Corticosteroides e plasmaférese sem evidência robusta para uso de rotina',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'MS 2014 (Manual de Diagnóstico e Manejo Clínico) + Nota Técnica MS nº 16/2024 (conduta vigente)',
        texto:
          'MAT é o teste de preferência/padrão-ouro; confirmação por soroconversão, aumento de 4x em amostras pareadas (14-60 dias) ou título único ≥800. Sorologia negativa antes do 7º dia não exclui o caso — repetir após o 7º dia. Critério clínico-epidemiológico válido quando não há exame específico.',
      },
      {
        diretriz: 'ABRAMEDE (Manole, 2024; recomendação RS 2024)',
        texto:
          'Quimioprofilaxia apenas para alto risco (lacerações de pele com exposição contínua a água de enchente, submersão ou ingestão de água potencialmente contaminada); sem evidência sólida de benefício em desfechos relevantes para uso amplo.',
      },
    ],
  },
  {
    id: 'sincope',
    nome: 'Síncope',
    secao: 'Cardiovasculares',
    cid10: ['R55'],
    sinonimos: ['desmaio', 'síncope vasovagal', 'Canadian Syncope', 'perda de consciência'],
    capitulo: 21,
    resumo:
      'Síncope é perda transitória da consciência e do tônus postural por hipoperfusão cerebral global (ou do tronco/sistema reticular ativador ascendente), com recuperação rápida, espontânea e completa sem intervenção. Exige ~6–10 s de interrupção do fluxo cerebral ou queda da PAS >60 mmHg. Representa 1–3% das visitas ao DE; mecanismos: reflexa/neuromediada (vasovagal, situacional, seio carotídeo), hipotensão ortostática e cardiogênica. Vasovagal/ortostática têm bom prognóstico; a cardíaca dobra o risco de morte e exige investigação/internação. Objetivo no DE: identificar pacientes de alto risco. Diagnóstico é clínico (anamnese + exame físico + ECG); escores auxiliam, mas não substituem o julgamento.',
    fisiopatologia: [
      'Hipoperfusão cerebral transitória de ambos os hemisférios ou do tronco encefálico (sistema reticular ativador ascendente)',
      'Necessários ~6–10 s de interrupção do fluxo, ou queda da PAS em geral >60 mmHg, ou redução da perfusão em 35–50%',
      'Mecanismos: queda da resistência vascular periférica (vasodepressora), redução da FC (cardioinibitória) ou misto',
      'Reflexa/neuromediada: gatilho ativa autonômico → vasodilatação e/ou bradicardia (vasovagal, situacional, seio carotídeo)',
      'Ortostática: falha simpática eferente crônica → vasoconstrição deficiente ao ortostatismo',
      'Cardiogênica: redução do débito cardíaco por arritmia (bradi/taqui) ou doença estrutural (estenose aórtica, CMH, TEP, IAM)',
    ],
    exames: [
      {
        titulo: 'ECG de 12 derivações (obrigatório em todos)',
        itens: [
          'ECG em TODOS os pacientes — simples, não invasivo, central na estratificação (diagnóstico em apenas 2–9% dos casos)',
          'Achados de risco: TV não sustentada; bloqueio bi/trifascicular; QRS ≥130 ms',
          'Bradicardia sinusal <50 bpm ou bloqueio SA sem droga; BAV Mobitz II / BAVT; pausa >3 s',
          'QTc prolongado ou curto; pré-excitação (PR <120 ms, onda delta — WPW)',
          'Padrão de Brugada (supra ST V1–V3 com BRD); displasia arritmogênica de VD (onda épsilon); CMH',
        ],
      },
      {
        titulo: 'Monitorização e exames cardíacos dirigidos',
        itens: [
          'Monitorização cardíaca contínua no DE para pacientes de alto risco; achados de alarme: FC <30 bpm, pausa >2–3 s, Mobitz II/BAVT, TV',
          'Ecocardiograma se doença cardíaca conhecida, ECG anormal ou múltiplos fatores de risco (não rotineiro)',
          'Teste de esforço se síncope/pré-síncope ao esforço; tilt-test e EEF apenas fora do DE/casos selecionados',
          'Massagem do seio carotídeo (monitorizada) se suspeita de hipersensibilidade; contraindicada em estenose carotídea, AVC/AIT <3 meses, TV/FV prévia',
        ],
      },
      {
        titulo: 'Laboratório e imagem (seletivos, não de rotina)',
        itens: [
          'Hemograma/hematócrito se suspeita de sangramento/anemia (Ht <30% = maior risco)',
          'Eletrólitos em pacientes criticamente doentes; glicemia se estado mental alterado; β-hCG em mulher em idade fértil',
          'Troponina (isquemia) e BNP/NT-proBNP (IC) como marcadores de risco de eventos adversos',
          'TC de crânio só se trauma ou causa neurológica/cefaleia súbita; angio-TC de tórax se suspeita de TEP; EEG só se suspeita de convulsão; radiografia de tórax não rotineira',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Tipos de síncope: reflexa/vasovagal (pródromo autonômico, gatilho emocional/ortostático/situacional, jovem, sem cardiopatia) vs ortostática (ao levantar-se, queda PAS ≥20/diastólica ≥10 mmHg ou PAS <90 em 3 min; diagnóstico de exclusão) vs cardíaca (em decúbito/esforço, pródromo breve ou ausente, palpitação súbita, cardiopatia estrutural, ECG anormal)',
      'Mimics: convulsão (mordedura lateral da língua, fase tônico-clônica, desvio cefálico/postura atípica, olhos abertos, confusão pós-ictal prolongada, incontinência), hipoglicemia, hipoxemia',
      'Outros: pseudossíncope psicogênica (múltiplos episódios/dia), cataplexia, AIT vertebrobasilar, HSA (cefaleia súbita + déficit focal), intoxicação, queda mecânica',
    ],
    conduta: [
      {
        titulo: 'Estratificação de risco / red flags',
        itens: [
          'Alto risco: síncope ao esforço ou em decúbito; pródromo ausente/breve ou palpitação súbita seguida de síncope; cardiopatia estrutural/isquêmica, FE reduzida, arritmia prévia',
          'Idade >60 anos, sexo masculino, história familiar de morte súbita; dor torácica, dispneia, dor abdominal ou cefaleia nova associadas',
          'ECG anormal; sintomas-alarme: dor torácica (IAM, dissecção, TEP, estenose aórtica), palpitações (arritmia), dispneia (TEP, IC)',
          'Baixo risco: gatilho vasovagal/situacional típico, episódios recorrentes similares, só em pé/mudança postural, ECG e exame normais, sem cardiopatia',
          'Escores: San Francisco (SFSR — IC, ECG anormal, Ht <30%, dispneia, PAS <90; ≥1 critério = risco); OESIL (ECG anormal, doença CV, idade ≥65, sem pródromo; 0–1 baixo risco, 2 moderado, 3–4 alto — ≥2 pontos indica internação); Canadian Syncope Risk Score (muito baixo a muito alto; médio/alto exige investigação); EGSYS (≥3 = provável cardíaca)',
        ],
      },
      {
        titulo: 'Conduta / disposição',
        itens: [
          'Tratamento orientado pelo diagnóstico; síncope cardíaca tratada antes da alta (marca-passo/CDI, antiarrítmico, tratar a arritmia/estrutura)',
          'Vasovagal: educação, evitar gatilhos, manobras de contrapressão; ortostática: hidratação, sal, levantar devagar, suspender droga causadora, contrapressão',
          'Tempo de observação no DE com Canadian Score: ~2 h se baixo risco, ~6 h se médio/alto risco',
          'Internar: causa de alto risco confirmada (cardíaca, TEP, hipertensão pulmonar, insuficiência vertebrobasilar, dissecção) ou condições médicas preocupantes; UTI se potencialmente grave',
          'Baixo risco / vasovagal-ortostática-medicamentosa: alta com investigação ambulatorial (Holter, monitor de eventos, ILR, tilt-test fora do DE)',
          'Síncopes de repetição: seguimento ambulatorial independentemente da etiologia; afastar de ocupações de risco (motorista, piloto) até avaliação do especialista',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC 2018 (Brignole et al.)',
        texto:
          'ECG em todos os pacientes; estratificação de risco em alto/baixo risco; lista de achados de ECG arrítmicos (bradicardia <40 bpm, pausas >3 s, Mobitz II, BAVT, bloqueio bifascicular, TV/TSV, QT longo/curto, falha de MP/CDI). Base dos fluxogramas de manejo da síncope reflexa por idade/fenótipo.',
      },
      {
        diretriz: 'ACC/AHA/HRS 2017 (Shen et al.)',
        texto:
          'Acrescenta categoria de risco intermediário: alto risco interna, intermediário fica em observação/seguimento precoce, baixo risco recebe alta com avaliação mínima.',
      },
      {
        diretriz:
          'Canadian Syncope Risk Score (Thiruganasambandamoorthy, validação JAMA Intern Med 2020 / Circulation 2019)',
        texto:
          'Prediz eventos adversos em 30 dias (≥16 anos, ≤24 h do episódio); muito baixo risco ~0,3% vs alto risco até 51,3%. Define tempo de monitorização no DE (2 h baixo risco, 6 h médio/alto).',
      },
      {
        diretriz: 'ABRAMEDE 2024 / Albassam JAMA 2019',
        texto:
          'Revisão sistemática da acurácia clínica para síncope cardíaca: EGSYS ≥3, escore vasovagal/Calgary < –2, idade >35 anos, FA/flutter, cardiopatia estrutural e ECG anormal aumentam probabilidade de etiologia cardíaca. Sensibilidade/especificidade dos escores: OESIL 97%/73%, EGSYS 92%/69%, CSRS 97,8%/44,3%, San Francisco 86%/46%.',
      },
    ],
  },
  {
    id: 'cefaleia',
    nome: 'Cefaleia',
    secao: 'Neurológicas',
    cid10: ['R51', 'G44.1'],
    sinonimos: ['enxaqueca', 'migrânea', 'thunderclap', 'cefaleia em salvas', 'dor de cabeça'],
    capitulo: 27,
    resumo:
      'Cefaleia é uma das queixas mais comuns no pronto atendimento (cerca de 4,5% das consultas no Brasil; 4o motivo mais frequente). Dividida em primárias (dor é a própria doença, por disfunção da modulação sensitiva — enxaqueca/migrânea é a mais comum no PA, tensional a mais prevalente na população) e secundárias (sintoma de doença detectável, de gravidade variável). O passo inicial mais importante é diferenciar primária vs secundária e reconhecer sinais de alarme à anamnese e ao exame neurológico, que indicam investigação complementar. A intensidade da dor isoladamente NÃO prediz gravidade; o padrão de instalação (súbito/thunderclap) é o dado mais relevante. Tratamento sintomático deve ser iniciado em paralelo à investigação. Cefaleias primárias bem estabelecidas e sem sinais de alarme não exigem exames, mesmo com dor intensa.',
    fisiopatologia: [
      'Encéfalo é indolor; a dor vem de estruturas sensíveis: meninges, vasos arteriais/venosos, bainhas de nervos cranianos, complexo trigeminal e estruturas extracranianas (couro cabeludo, musculatura, ossos, dentes, olhos, seios)',
      'Mecanismos: tração, estiramento da dura-máter/vasos, distensão/relaxamento vascular, inflamação, irritação; dor pode ser nociceptiva ou neuropática',
      'Enxaqueca: teoria vascular abandonada — hoje vista como disfunção multicêntrica da modulação sensitiva (hipotálamo, tálamo, córtex occipital, sistema trigêmino-cervical), com depressão alastrante cortical e inflamação neurogênica',
      'Ativação trigeminal libera neuropeptídeos (substância P, CGRP); CGRP desencadeia crise e sumatriptana reduz seus níveis',
      'Aura: percepção consciente da onda de despolarização cortical',
      'Cefaleia tensional: sensibilização das vias da dor no SNC/SNP, com fatores musculares (pontos-gatilho, aumento de sensibilidade muscular)',
      'Cefaleias trigêmino-autonômicas: disfunção hipotalâmica e do sistema trigeminovascular, possível componente circadiano',
    ],
    exames: [
      {
        titulo: 'Sinais de alarme (red flags)',
        itens: [
          'Padrão: mudança evidente em cefaleia preexistente, piora progressiva ou refratária ao tratamento',
          'Início: súbito/thunderclap (pico em segundos), primeiro episódio de cefaleia intensa — até prova em contrário, considerar secundária (HSA, aneurisma, HIP, TVC, dissecção)',
          'Sistêmicos: febre, toxemia, rash, rigidez nucal, emagrecimento, doenças reumatológicas, imunossupressão, neoplasia',
          'Idade: início após os 40 anos (USP) / 50 anos (arterite de células gigantes, neoplasia)',
          'Neurológicos: déficit focal, papiledema, rebaixamento do nível de consciência, convulsão',
          'Deflagrada por esforço físico, atividade sexual ou manobra de Valsalva (HSA, SVAR)',
          'Mudança com posição corporal (hipo/hipertensão liquórica)',
          'Gestação/puerpério (TVC, dissecção, emergência hipertensiva)',
          'História de traumatismo craniano (hematoma subdural/epidural, HSA)',
          'Comorbidades HIV/neoplasia ou imunossupressão (infecções oportunistas, metástase)',
          "Sinais 'verdes' (favorecem primária): dor recorrente desde a infância, dias livres entre crises, relação menstrual, história familiar do mesmo fenótipo, início/fim há mais de uma semana",
        ],
      },
      {
        titulo: 'Quando investigar (TC/PL)',
        itens: [
          'Exames indicados quando há sinais de alarme ou cefaleia recente sem critérios para primária',
          'Primeiro exame: TC de crânio SEM contraste — rápida, disponível, alta sensibilidade para hemorragia/tumor (98% para HSA nas primeiras 12 h)',
          'Punção lombar na suspeita de HSA com TC normal/não diagnóstica — maior especificidade (xantocromia) ~12 h após o início da dor; sensibilidade do liquor próxima de 100% nas primeiras horas',
          'PL na suspeita de meningite/encefalite (após afastar efeito expansivo/hipertensão intracraniana na imagem) e para aferir pressão de abertura na suspeita de pseudotumor cerebral (>250 mmH2O)',
          'Regra de HSA (Ottawa): ≥15 anos, cefaleia nova não traumática com pico máximo em 1 h — investigar se idade ≥40, dor/rigidez cervical, perda de consciência presenciada, início no esforço, dor em trovoada ou flexão cervical limitada ao exame',
          'Estudo de vasos (angio-TC/angio-RM/arteriografia) na suspeita de dissecção cervical/intracraniana, aneurisma, SVAR; venografia (TC ou RM) na suspeita de TVC',
          'RM como exame inicial em casos selecionados (gestantes com red flags, neoplasia conhecida, sinais de HIC, dor trigeminal, imunossuprimidos, hipotensão liquórica)',
          'POCUS da bainha do nervo óptico: sinais indiretos de hipertensão intracraniana, alternativa à fundoscopia',
          'Laboratório conforme suspeita: VHS (e biópsia de artéria temporal) na arterite de células gigantes em idosos; sorologias/HIV nas neuroinfecções',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Primárias: enxaqueca/migrânea (mais comum no PA), cefaleia tipo tensão (mais prevalente na população), cefaleias trigêmino-autonômicas (cefaleia em salvas, hemicrania paroxística), neuralgias cranianas (trigêmeo)',
      'Secundárias graves: hemorragia subaracnóidea (HSA) por aneurisma — cefaleia súbita intensa em ~97%',
      'Trombose venosa cerebral (TVC) — cefaleia como principal/único sintoma em até 89%; risco em gestação/puerpério/trombofilia',
      'Hemorragia intraparenquimatosa (HIP) e AVC isquêmico',
      'Dissecção arterial cervical/intracraniana (causa comum de AVC em jovens; síndrome de Horner parcial na carotídea)',
      'Síndrome da vasoconstrição cerebral reversível (SVAR) — thunderclap recorrente',
      'Hipertensão intracraniana / pseudotumor cerebri; hipotensão liquórica espontânea',
      'Meningite/encefalite e outras neuroinfecções; arterite de células gigantes; emergência hipertensiva; glaucoma agudo de ângulo fechado',
      'Cefaleia por IVAS (secundária mais comum no PA)',
    ],
    conduta: [
      {
        titulo: 'Tratamento da crise',
        itens: [
          'Geral: iniciar tratamento sintomático em paralelo à investigação; ambiente calmo e com pouca luz; hidratação/expansão volêmica (gastroparesia, vômitos, poliúria); preferir via parenteral. Evitar opioides',
          'enxaqueca leve-moderada: analgésicos comuns — dipirona 500-2000 mg IV/VO, paracetamol 500-750 mg VO; AINH (cetoprofeno 100 mg IV/IM, diclofenaco 75 mg IM, cetorolaco 30-60 mg IV ou 30 mg IM, naproxeno 500 mg VO)',
          'enxaqueca moderada-grave: triptano (sumatriptana 6 mg SC, repetir após 2 h se necessário; ou 50-200 mg VO; zolmitriptana 2,5-5 mg; rizatriptana 5-10 mg; naratriptana 2,5-5 mg) — contraindicados em doença arterial/HAS mal controlada; associar AINH',
          'enxaqueca com náusea/vômito: bloqueadores dopaminérgicos — metoclopramida 10 mg VO/IV/IM (IV lenta, risco extrapiramidal), clorpromazina 10-25 mg IV (monitorizar QT), prometazina 25 mg IM, haloperidol 2,5-5 mg IM/IV; dimenidrato 30 mg; evitar ondansetrona como antimigranoso (ABRAMEDE)',
          'enxaqueca prolongada/refratária: prevenção de recidiva com dexametasona 4 mg IV (USP: 10 mg não superior a 4 mg); 2a linha valproato de sódio 1000 mg IV, sulfato de magnésio 2000 mg IV (melhor na com aura); bloqueio anestésico dos nervos occipital maior/menor com lidocaína; considerar internação',
          'tensional: analgésicos comuns (dipirona, paracetamol) ou AINH (cetoprofeno, ibuprofeno, nimesulida); modificações de estilo de vida; encaminhamento se frequente/crônica',
          'cluster (cefaleia em salvas): oxigênio 100% por máscara não reinalante 10-12 L/min por 10-20 min, sentado; sumatriptana 6 mg SC (oral pouco eficaz) ou 20 mg spray nasal; refratários: lidocaína intranasal 4-10% ipsilateral (bloqueio esfenopalatino indireto). Ponte com corticoide e profilaxia (verapamil/galcanezumabe)',
          'hemicrania paroxística: responde completa e absolutamente à indometacina (ABRAMEDE)',
          'neuralgia do trigêmeo: 1a linha carbamazepina; também oxcarbazepina, fenitoína, baclofeno, lamotrigina; refratários para avaliação cirúrgica',
          'Após alta: cefaleia primária controlada e sem red flags recebe alta com analgesia otimizada e encaminhamento ambulatorial; orientar risco de cronificação e abuso de analgésicos; considerar profilaxia se crises recorrentes/incapacitantes ou >3 dias de dor/mês por >3 meses',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ICHD-3 (International Classification of Headache Disorders, 3a ed., 2018)',
        texto:
          'Base de classificação e critérios diagnósticos de enxaqueca (com e sem aura), cefaleia tipo tensão e cefaleia em salvas; divide cefaleias em primárias, secundárias e neuropatias/dores faciais.',
      },
      {
        diretriz: 'Friedman et al., Neurology 2023',
        texto:
          'Ensaio comparando dexametasona 4 mg vs 10 mg IV na enxaqueca moderada-grave não mostrou benefício adicional da dose alta; dose recomendada para prevenção de recidiva é 4 mg IV (USP).',
      },
      {
        diretriz: 'Ottawa Subarachnoid Hemorrhage Rule (ABRAMEDE)',
        texto:
          'Regra validada 100% sensível para HSA em ≥15 anos com cefaleia nova não traumática com pico em até 1 h; investigar se presente qualquer critério (idade ≥40, dor/rigidez cervical, perda de consciência presenciada, início no esforço, dor em trovoada, flexão cervical limitada).',
      },
      {
        diretriz: 'Green flags / Pohl et al., Headache 2021 (USP)',
        texto:
          "'Sinais verdes' aumentam a probabilidade pré-teste de cefaleia primária e, na ausência de red flags, dispensam investigação complementar.",
      },
      {
        diretriz:
          'Protocolo Nacional para diagnóstico e manejo das cefaleias nas unidades de urgência do Brasil — ABN/SBCe, 2018',
        texto:
          'Diretriz nacional de manejo; desencoraja uso de opioides na enxaqueca pelo risco de cefaleia por abuso de analgésicos e baixa eficácia.',
      },
    ],
  },
  {
    id: 'vertigem',
    nome: 'Vertigem e tontura',
    secao: 'Neurológicas',
    cid10: ['R42', 'H81.9'],
    sinonimos: ['tontura', 'HINTS', 'VPPB', 'labirintite', 'Epley', 'Dix-Hallpike'],
    capitulo: 60,
    resumo:
      "Vertigem é a percepção ilusória de movimento na ausência de movimento verdadeiro; é queixa comum no DE (2,1-3,6% das visitas/ano) e é o sintoma mais associado a diagnóstico errado de AVC, podendo o paciente ter NIHSS zero. A abordagem moderna abandona a definição do 'tipo de tontura' (até 50% dos pacientes mudam o descritor após ~6 min) e adota o modelo 'Time and Trigger' (duração e desencadeante), classificando em síndrome vestibular aguda (SVA), vertigem episódica espontânea (e-EVS), vertigem episódica desencadeada (t-EVS) e vertigem secundária. Na SVA contínua (dias a semanas, sintomático na consulta) o diferencial-chave é neurite vestibular (periférica) vs AVC de fossa posterior (central), distinguidos pelo HINTS — mais sensível que a neuroimagem precoce. TC de crânio NÃO exclui causa central (baixa sensibilidade para fossa posterior; gera falsa segurança e aumenta permanência no DE em até 77 min).",
    fisiopatologia: [
      'Equilíbrio depende da integração dos sistemas vestibular, visual e proprioceptivo; incompatibilidade entre dois dos três sistemas gera vertigem',
      'Aparelho vestibular (ouvido interno, osso temporal): 3 canais semicirculares (aceleração angular/rotacional) e órgãos otolíticos — utrículo e sáculo (aceleração linear e orientação à gravidade), com otoconias/cristais de carbonato de cálcio',
      'Impulsos seguem pelo NC VIII aos núcleos vestibulares do tronco e cerebelo; conexões autonômicas explicam náusea/vômito/sudorese e o reflexo vestíbulo-ocular (VOR) mantém o olhar com a cabeça em movimento',
      'Nistagmo surge quando a informação vestibular fica desequilibrada; por convenção a direção é dada pela fase rápida. Nistagmo periférico (ex.: neurite) bate sempre para o lado bom e não inverte; vertical puro ou que muda de direção sugere causa central',
      'VPPB: otoconias deslocadas do utrículo caem nos canais semicirculares (mais comum o posterior), estimulando erroneamente os receptores e gerando vertigem posicional breve',
      'Causas centrais derivam de isquemia da circulação posterior (insuficiência vertebrobasilar) que supre bulbo, ponte, mesencéfalo e cerebelo (artérias PICA/ACPI e AICA/ACAI)',
    ],
    exames: [
      {
        titulo: 'HINTS / HINTS plus (aplicar na SVA COM nistagmo)',
        itens: [
          'Head Impulse (VOR): gira-se rápido a cabeça com olhos fixos no alvo; VOR NORMAL (sem sacada de correção) sugere causa CENTRAL — na periférica o VOR está alterado (sacada corretiva, em geral para o lado lesado). Atenção: pode ser falsamente normal em infarto de AICA/labiríntico',
          'Nystagmus: pedir para olhar para os lados, cima e baixo; periférico é unidirecional (não muda de direção); nistagmo vertical puro ou que muda de direção conforme o olhar = central',
          'Test of Skew: cobertura/descobertura alternada dos olhos; desalinhamento vertical (refixação) = central; refixação diagonal é achado preocupante',
          "HINTS 'maligno' = ≥1 dos 3 achados centrais (VOR normal, nistagmo que muda de direção, skew presente): sensibilidade ~96-100% para lesão central; estudo 2021 com emergencistas: S 96,7%, E 67,4%, VPN 98,9%",
          'HINTS plus = HINTS + audição (esfregar de dedos/finger rubbing): QUALQUER perda auditiva sugere lesão central; S 99,2% e E 97% — superior a TC e RM',
        ],
      },
      {
        titulo: 'Manobras posicionais (Dix-Hallpike) e STANDING (SVA SEM nistagmo)',
        itens: [
          'Dix-Hallpike: senta-se o paciente, gira a cabeça 45° para o lado testado e deita-se rápido com a cabeça pendente ~20° abaixo da maca; aguardar ~30 s (latência 3-10 s, raramente até 30 s)',
          'Nistagmo típico de VPPB do canal posterior: latência, componentes vertical e rotatório/torsional (batendo para a orelha de baixo), padrão crescendo-decrescendo, duração <1 min e fatigabilidade',
          'Realizar para ambos os lados; se nistagmo for atípico (vertical espontâneo, persistente, sinais focais), suspeitar de VPPB de canal horizontal/anterior ou vertigem posicional CENTRAL (CPPV) — encaminhar neurologista',
          'Supine Roll Test: diagnóstico de VPPB de canal horizontal (vira-se a cabeça em plano horizontal para cada lado observando nistagmo geotrópico/apogeotrópico)',
          'STANDING (SponTAneous Nystagmus, Direction, head Impulse, standiNG): para pacientes sem nistagmo; avalia nistagmo espontâneo→direção→VOR→manobras posicionais→marcha; desequilíbrio grave (incapaz de ficar de pé/caminhar) sugere causa central',
        ],
      },
      {
        titulo: 'Avaliação complementar / neuroimagem',
        itens: [
          'Maioria dos casos é diagnosticada por anamnese e exame físico, sem laboratório/imagem',
          'Laboratório guiado pela suspeita de causa secundária: hemograma (anemia/sangramento), eletrólitos e função renal (desidratação/distúrbio metabólico), ECG (arritmia/pré-síncope); glicemia',
          'Escore ABCD2 estratifica risco de AVC na vertigem: AVC final em 1% se ABCD2 ≤3 vs 8,1% se 4-7',
          'TC de crânio NÃO recomendada de rotina para diferenciar central x periférico (baixa sensibilidade p/ fossa posterior); útil só para excluir hemorragia em candidatos a reperfusão/trombólise',
          'RM com difusão é falso-negativa em ~12-13,3% nas primeiras 48 h e pode ser menos sensível que o HINTS+; na SVA com HINTS central/duvidoso, solicitar RM (difusão + angiorressonância), idealmente 48-72 h após início',
          'Na e-EVS com suspeita de AIT: angio-TC/angio-RM de crânio e cervical para circulação posterior (GRACE-3)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'SVA / episódio único prolongado: neurite vestibular (periférica) vs AVC de fossa posterior (central)',
      'Periférica: VPPB (mais comum, episódios de segundos a ≤1 min desencadeados por movimento cefálico), neurite vestibular, doença de Ménière (vertigem de minutos-horas + sintomas cocleares: hipoacusia, zumbido, plenitude aural), labirintite e infarto labiríntico (com sintomas auditivos), Ramsay-Hunt, fístula perilinfática, neuroma acústico, cinetose',
      'Central: AVC isquêmico/hemorrágico de fossa posterior, insuficiência vertebrobasilar/AIT, migrânea vestibular, esclerose múltipla, neoplasia, infecção (encefalite/meningite/abscesso), CPPV (vertigem central paroxística posicional mimetizando VPPB)',
      'Red flags de causa central: diplopia, disartria, disfagia, disfonia, dismetria, disestesia; déficit focal; nistagmo vertical puro ou que muda de direção; VOR normal; skew presente; perda auditiva (no HINTS plus); desequilíbrio grave (não fica de pé); fatores de risco — idoso, sexo masculino, HAS, diabetes, coronariopatia, AVC prévio, fibrilação atrial',
      'Causas secundárias/não vestibulares: hipotensão postural/ortostática (queda PAS >20 ou PAD >10 mmHg), arritmias, anemia, hipovolemia/desidratação, hipoglicemia, infecção, hemorragia digestiva, medicações, síndromes aórtica/coronariana aguda, TEP',
    ],
    conduta: [
      {
        titulo: 'VPPB (canal posterior)',
        itens: [
          'Diagnóstico por Dix-Hallpike; tratar o lado afetado com manobra de reposicionamento (autolimitada, mas manobra acelera resolução — NNT 3)',
          'Manobra de Epley (canal posterior): paciente sentado, cabeça 45° para o lado afetado; deita com cabeça pendente ~20° abaixo da horizontal, mantém 30 s até cessar nistagmo/vertigem; gira a cabeça 45° para o lado oposto, 30 s; vira todo o corpo para esse lado (olhando ao chão), 30 s; senta o paciente com a cabeça inclinada ~30° para frente. Pode repetir (USP: realizar 2x)',
          'Manobra de Semont (alternativa, USP): cabeça rodada 45° para o lado oposto à orelha afetada; deita sobre a orelha afetada por 1 min; joga o corpo rapidamente para o outro lado mantendo a cabeça, aguarda 2 min e senta',
          'VPPB de canal horizontal: manobra de Lempert, Gufoni ou supine roll (alguns respondem ao Epley)',
          'Não há benefício em restrição posicional da cabeça após a manobra; encaminhar a especialista e reavaliar ambulatorialmente em 1-7 dias',
          'Antieméticos podem ser dados antes da manobra para reduzir náusea',
        ],
      },
      {
        titulo: 'Neurite vestibular (SVA periférica)',
        itens: [
          'Doença monofásica, bom prognóstico (vertigem melhora em dias, equilíbrio em dias-semanas)',
          'Encaminhar à reabilitação vestibular',
          'Corticoide é decisão compartilhada (GRACE-3), considerar se dentro de 72 h do início: prednisona 60-80 mg 1x/dia por 5-7 dias (evidência de longo prazo insuficiente)',
          'Sintomáticos restritos aos primeiros 2-3 dias (supressores vestibulares retardam a compensação central)',
          '10-15% evoluem com VPPB de canal posterior ipsilateral',
        ],
      },
      {
        titulo: 'Sintomático / quando investigar central',
        itens: [
          'Supressores vestibulares: anti-histamínicos H1 — meclizina 25 mg 8/8 ou 6/6 h; dimenidrinato 50 mg 8/8 ou 6/6 h (EV/IM/VO/SL); difenidramina 50 mg 6/6 h. Limitar uso a ≤3 dias (USP: 2-3 dias); efeito colateral comum: sedação',
          'Antieméticos: ondansetrona 4-8 mg 8/8 h; metoclopramida 10 mg 8/8 h',
          'Benzodiazepínicos (2ª linha, só se falha dos anti-histamínicos; não prescrever para uso domiciliar): lorazepam 1-2 mg; diazepam 2,5-5 mg',
          "Investigar/manejar como AVC agudo (central) se: HINTS maligno/duvidoso, déficit focal, sinais de circulação posterior (os 'D's'), desequilíbrio grave, fatores de risco vascular ou início recente — acionar fluxo AVC/AIT e neurologia",
          'Ménière: alívio com dimenidrinato/meclizina; profilaxia (evidência fraca) com betaistina, dieta hipossódica ou diuréticos. Migrânea vestibular: antivertiginoso na crise + tratamento/profilaxia de enxaqueca',
          'Pacientes sem critério de internação: referenciar a otorrinolaringologista/neurologista e à atenção primária; suspeita de causa central: internar e seguir fluxo institucional',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'GRACE-3 (SAEM, 2023)',
        texto:
          'Diretriz da Sociedade Americana de Medicina de Emergência para tontura/SVA: HINTS é mais sensível que a neuroimagem precoce; TC de crânio não tem espaço para diagnóstico etiológico de SVA (baixa sensibilidade p/ fossa posterior). Em neurite vestibular, corticoide é decisão compartilhada se ≤72 h (prednisona 60-80 mg/dia por 5-7 dias). RM com difusão/angio na SVA com HINTS central ou duvidoso, preferencialmente após 48-72 h; angio-TC/RM de crânio e cervical na e-EVS com suspeita de AIT.',
      },
      {
        diretriz: 'USP/HC-FMUSP, 19ª ed. (2025)',
        texto:
          "Aplicar HINTS preferencialmente em paciente com nistagmo; HINTS 'maligno' (≥1 achado central) com S 96-100% e HINTS plus (com audição — qualquer perda sugere central) S 99,2% / E 97%. Para SVA sem nistagmo usar o algoritmo STANDING e avaliar marcha/equilíbrio. Escore ABCD2 estratifica risco de vertigem central por AVC (1% se ≤3 vs 8,1% se 4-7).",
      },
      {
        diretriz: 'ABRAMEDE (Manole, 1ª ed., 2024)',
        texto:
          "Adota o modelo 'Time and Trigger' (duração e desencadeante) em vez da definição do tipo de tontura, classificando em vertigem secundária, SVA, vertigem episódica espontânea (e-EVS: AIT vs migrânea vestibular) e desencadeada (t-EVS: VPPB via Dix-Hallpike/Epley vs hipotensão ortostática). Reforça HINTS plus, baixa utilidade da TC e indicações de neuroimagem por síndrome conforme GRACE-3.",
      },
    ],
  },
  {
    id: 'anemia-falciforme',
    nome: 'Doença falciforme — crises agudas',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['D57.0', 'D57.1'],
    sinonimos: [
      'anemia falciforme',
      'crise vaso-oclusiva',
      'síndrome torácica aguda',
      'HbS',
      'priapismo',
    ],
    capitulo: 95,
    resumo:
      'Doença falciforme é hemoglobinopatia hereditária (mutação no códon 6 da β-globina, HbS) que, quando desoxigenada, polimeriza e falciza as hemácias, causando hemólise crônica e vaso-oclusão. As complicações agudas que levam à emergência incluem crise vaso-oclusiva (mais comum), síndrome torácica aguda (emergência, 2ª causa de morte/internação), AVC, sequestro esplênico/hepático, priapismo e infecções por germes encapsulados (asplenia funcional). Pilares do manejo: analgesia precoce (alvo <30 min, opioides potentes se dor >=8), hidratação criteriosa, oxigênio se hipoxemia e indicação adequada de transfusão/exsanguíneo (eritrocitoaférese com alvo HbS <30%).',
    fisiopatologia: [
      'Mutação no códon 6 da β-globina (valina por glutamina) forma HbS instável; quando desoxigenada (hipoxemia, acidose), polimeriza e falciza as hemácias',
      'Falcização é inicialmente reversível com reoxigenação, tornando-se irreversível com repetição e dano de membrana; HbF não polimeriza e reduz falcização',
      'Vaso-oclusão decorre de polimerização + inflamação endotelial, aumento de adesividade das hemácias, queda de óxido nítrico e ativação da coagulação',
      'Hemoglobina livre da hemólise causa disfunção endotelial, lesão vascular e hipertensão pulmonar',
      'STA: ciclo vicioso hipóxia -> polimerização de HbS -> vaso-oclusão -> alteração de fluxo pulmonar -> hipóxia; precipitada por infecção, embolia gordurosa, infarto pulmonar, hiper-hidratação, microatelectasias',
      'Asplenia/autoesplenectomia funcional predispõe a infecções graves por germes encapsulados (S. pneumoniae, H. influenzae, Salmonella)',
    ],
    exames: [
      {
        titulo: 'Gerais / hemólise crônica',
        itens: [
          'Hemograma: anemia (Hb 6-9 g/dL), leucocitose (12.000-15.000), reticulocitose (10-25%)',
          'LDH e bilirrubina indireta elevadas, haptoglobina baixa (hemólise)',
          'Esfregaço: hemácias falciformes, corpos de Howell-Jolly, células-alvo (hipoesplenismo)',
          'Eletroforese de hemoglobina confirma o diagnóstico (HbS 85-98%)',
        ],
      },
      {
        titulo: 'Síndrome torácica aguda',
        itens: [
          'Radiografia de tórax com infiltrado novo (obrigatório para o diagnóstico)',
          'Gasometria arterial (oximetria subestima saturação na DF)',
          'Hemoculturas, hemograma, reticulócitos, provas de hemólise',
        ],
      },
      {
        titulo: 'AVC',
        itens: [
          'Doppler transcraniano: fluxos >200 cm/s indicam terapia transfusional',
          'Neuroimagem conforme indicação (TC/RM)',
        ],
      },
      {
        titulo: 'Priapismo',
        itens: [
          'Gasometria do sangue do corpo cavernoso (agulha 19-21G, 3-5 mL) se ereção >4 h',
          'Isquêmico (baixo fluxo): sangue escuro, PO2 <30 mmHg, PCO2 >60 mmHg, pH <7,25',
        ],
      },
      {
        titulo: 'Sequestro esplênico',
        itens: [
          'Queda >2 g/dL de Hb, plaquetopenia, reticulocitose, dor/esplenomegalia em flanco esquerdo',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Crise vaso-oclusiva (álgica)',
      'Síndrome torácica aguda',
      'AVC isquêmico/hemorrágico (e trombose do seio sagital)',
      'Sequestro esplênico e sequestro hepático agudos',
      'Priapismo isquêmico (baixo fluxo)',
      'Crise aplástica (aplasia de série vermelha, parvovírus B19; reticulócitos <1%)',
      'Infecções por encapsulados (sepse/pneumonia/meningite); osteomielite (Salmonella) e artrite séptica',
      'Complicações hepatobiliares (colecistite, colestase intra-hepática aguda)',
    ],
    conduta: [
      {
        titulo: 'Crise vaso-oclusiva',
        itens: [
          'Analgesia precoce, alvo <30 min da chegada; avaliar dor pela autoavaliação (escala 1-10); vias nasal/SC se anteciparem analgesia',
          'Dor >=8: opioide potente — morfina 0,10-0,15 mg/kg EV, repetir 0,05 mg/kg (20-25% da dose) a cada 20-30 min até controle (reavaliar a cada 15-30 min)',
          'Dose subanestésica de cetamina (0,3 mg/kg EV; intranasal 0,25 mg/kg; infusão 0,1-0,3 mg/kg/h) na dor refratária a opioide; PCA supervisionada',
          'Dor leve: AINE (cetorolaco) com cautela / evitar se disfunção renal; tramadol/codeína/dipirona — AINE sem benefício na dor grave',
          'Hidratação 30-50 mL/kg/24 h (Ringer-lactato preferível); se hipovolêmico, SF ou RL 500-1.000 mL; evitar hiper-hidratação e SF 0,45%; cautela em adultos',
          'Oxigênio só se SatO2 <90-95% ou PaO2 <60 mmHg (não usar em VOC não complicada sem hipoxemia)',
          'Espirometria de incentivo previne STA (reduz risco relativo ~90%); identificar e tratar infecção precipitante; tratar febre >38,5°C',
          'Não usar corticosteroides (rebote de dor), benzodiazepínicos com altos opioides, magnésio, antiagregantes nem transfusão de rotina na VOC não complicada',
        ],
      },
      {
        titulo: 'Síndrome torácica aguda (emergência)',
        itens: [
          'Antibiótico EV empírico precoce: cefalosporina de 3ª/4ª geração (ceftriaxone 2 g/dia ou cefotaxime 1-2 g 8/8 h) + macrolídeo (azitromicina 500 mg ou claritromicina 500 mg 12/12 h) para Mycoplasma/Chlamydia; cefotaxime se crise hemolítica',
          'Suporte respiratório: O2 se SatO2 <92% (alvo >=95%), ventilação com pressão positiva se indicado; broncodilatador 4/4-6/6 h (hiper-reatividade >60%)',
          'Hidratação e analgesia como na VOC (≈1,5x manutenção); espirometria de incentivo; profilaxia de TVP',
          'Transfusão simples (alvo Hb >=10 g/dL) se queda da Hb basal; casos leves podem não transfundir se Hb basal >9 g/dL e queda <1 g/dL',
          'Eritrocitoaférese / transfusão de troca com alvo HbS <30% nos casos graves/refratários (multilobar, O2 >=4 L/min, piora clínica); internação, idealmente UTI',
        ],
      },
      {
        titulo: 'Outras (sequestro, AVC, priapismo, infecção)',
        itens: [
          'Sequestro esplênico: reanimação com fluidos se hipovolemia; transfusão parcimoniosa (dose ~50% menor, evitar Hb >8 g/dL por hiperviscosidade); hematologista; hidroxiureia para prevenir recorrência',
          'AVC isquêmico: priorizar imediatamente troca de massa eritrocitária/eritrocitoaférese (alvo HbS <30% e Hb 8-10 g/dL); a doença falciforme NÃO contraindica a trombólise EV — é pouco estudada nessa população, mas pode ser tentada (sem atrasar a eritrocitoaférese); AAS 100-300 mg/dia no isquêmico; minimizar hiperventilação; cirurgia no hemorrágico',
          'Priapismo (isquêmico = emergência): hidratação/analgesia; aspiração do corpo cavernoso + fenilefrina (100-500 mcg/mL, 0,5-1 mL, até 3x) se <4 h; urologista se >4 h; eritrocitoaférese (alvo Hb >10,5 g/dL) se >12 h; transfusão isolada não resolve',
          'Infecção (asplenia funcional): alto risco por encapsulados; febre >38,5°C indica considerar antibiótico; internar criança com febre >39,5°C; cobertura para S. pneumoniae; vacinação (pneumococo, H. influenzae) e ATB profilático',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ASH 2020 (American Society of Hematology, manejo da dor)',
        texto:
          'Protocolos institucionais padronizados para iniciar analgesia rapidamente (triagem <15 min, porta-agulha <30 min reduzem complicações, evolução para STA e tempo de internação); sugere cetamina subanestésica e PCA; AINE por 3-7 dias se sem proteinúria/úlcera péptica; não usar glicocorticoides na dor aguda (encurta internação mas aumenta readmissão e causa rebote).',
      },
      {
        diretriz: 'ABRAMEDE (Tratado de Medicina de Emergência, Manole 2024)',
        texto:
          'Hidratação apenas para corrigir desidratação — hidratação além disso ou SF 0,45% não são indicadas e podem aumentar complicações; antiagregantes (prasugrel/ticagrelor) e magnésio sem benefício comprovado; oxigênio só na hipoxemia.',
      },
      {
        diretriz: 'USP/HC-FMUSP (Medicina de Emergência: Abordagem Prática, 19ª ed., 2025)',
        texto:
          'Espirometria de incentivo reduz risco de STA (~90%); critérios diagnósticos formais de STA (infiltrado novo + >=1 sinal: dor torácica, T>38,5°C, taquipneia, tosse, sibilância, queda >=2% SatO2 ou PaO2<60); alvo de SaO2 94-98%; AVC falciforme: trombólise EV não é contraindicada pela DF (pouco estudada, pode ser tentada) — priorizar eritrocitoaférese.',
      },
    ],
  },
  {
    id: 'neutropenia-febril',
    nome: 'Neutropenia febril',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['D70'],
    sinonimos: ['MASCC', 'CISNE', 'febre neutropênica', 'quimioterapia'],
    capitulo: 96,
    resumo:
      'Neutropenia febril é febre em paciente com neutrófilos < 500/µL (ou < 1.000/µL com previsão de queda) — emergência oncológica de alta morbimortalidade (mortalidade até 11%). Febre: temperatura oral ≥ 38,3 °C única ou ≥ 38,0 °C sustentada por ≥ 1 h (axilar > 37,8 °C; ≥ 37,8 °C no Brasil pela ABRAMEDE). Risco máximo entre o 10º–20º dia pós-quimioterapia (nadir 5–21 dias). Toda febre em nadir, ou sinais de infecção mesmo sem febre, deve ser conduzida como neutropenia febril. Antibiótico empírico antipseudomonas de amplo espectro deve ser administrado em ≤ 1 h da chegada ao DE (IDSA/ASCO 2018).',
    fisiopatologia: [
      'Quimioterapia citotóxica deprime a medula óssea e a imunidade inata (prejuízo à fagocitose e a mediadores inflamatórios)',
      'Lesão da barreira mucosa gastrointestinal favorece translocação bacteriana (enterobactérias)',
      'Quebra de barreira cutânea por cateteres de longa permanência',
      '85–90% das infecções documentadas são bacterianas (80% de flora endógena); só 20–30% têm sítio documentado',
      'Historicamente predomínio de Gram-negativos; aumento de Gram-positivos (cateteres, quinolonas profiláticas); no Brasil predominam Gram-negativos (E. coli, Klebsiella, Enterobacter, Pseudomonas)',
      'Neutropenia profunda ≤ 100/µL associa-se a maior taxa de infecção',
      'Infecção fúngica em neutropenia prolongada > 7 dias: Candida (após 2ª semana), Aspergillus/Fusarium (após 3ª semana)',
      'Neutropenia funcional: número normal de neutrófilos com defeito qualitativo (fagocitose/quimiotaxia)',
    ],
    exames: [
      {
        titulo: 'Iniciais (IDSA)',
        itens: [
          'Hemograma com contagem de neutrófilos',
          'Ureia, creatinina, eletrólitos',
          'Transaminases, bilirrubina total e frações',
          'Lactato sérico',
          'Hemoculturas: ≥ 2 amostras simultâneas, periférica e de cada via de cateter venoso central, antes do antibiótico',
          'Urocultura ou cultura de outros sítios se clinicamente indicado',
          'Radiografia de tórax',
        ],
      },
      {
        titulo: 'Conforme suspeita',
        itens: [
          'TC de tórax se sintomas respiratórios e radiografia não conclusiva',
          'Swab nasal para vírus respiratórios; toxina A/B de C. difficile se diarreia',
          'LCR se suspeita de infecção do SNC (atenção a plaquetopenia < 50.000/µL)',
          'Lavado broncoalveolar se infiltrado pulmonar',
          'Galactomanana e 1,3-beta-D-glucana se suspeita fúngica',
          'PCR e procalcitonina não são obrigatórios',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Causas não infecciosas de febre: medicações e hemoderivados',
      'Enterocolite neutropênica (dor em quadrante inferior direito)',
      'Colite por Clostridioides difficile',
      'Infecção relacionada a cateter (tunelite/infecção de bolsa)',
      'Infecção fúngica invasiva (Candida, Aspergillus, Fusarium)',
      'Neutropenia funcional sem infecção documentada',
    ],
    conduta: [
      {
        titulo: 'Antibiótico empírico (≤ 1 h)',
        itens: [
          'Administrar a 1ª dose de antimicrobiano antipseudomonas de amplo espectro em ≤ 1 h da chegada ao DE (IDSA/ASCO 2018)',
          'Conduzir como neutropenia febril se hemograma demorar > 30 min ou diante da suspeita',
          'Alto risco — monoterapia IV: cefepime 2 g IV 8/8 h; piperacilina-tazobactam 4,5 g IV 8/8 h; meropenem 1 g IV 8/8 h; imipenem-cilastatina 500 mg IV 6/6 h (ABRAMEDE: cefepime 2 g 12/12 h ou piperacilina-tazobactam 4,5 g 6/6 h; preferir esquema combinado se instabilidade/MDR)',
          'Baixo risco — VO: ciprofloxacino 750 mg 12/12 h + amoxicilina-clavulanato 500/125 mg 8/8 h (ABRAMEDE: amox-clavulanato 500/125 mg 8/8 h + ciprofloxacino 500 mg 8/8 h); não usar quinolona oral se já em profilaxia com quinolona',
          'Se suspeita de colite neutropênica/C. difficile: associar metronidazol 500 mg VO 8/8 h ou vancomicina 125 mg VO 6/6 h (ABRAMEDE)',
        ],
      },
      {
        titulo: 'Risco (MASCC) / escalonamento',
        itens: [
          'Estratificar risco: alto risco = MASCC < 21 (neutropenia profunda ≤ 100/µL e prolongada > 7 dias, hipotensão, pneumonia, disfunção orgânica) → internação e antibiótico parenteral; baixo risco = MASCC ≥ 21',
          'Baixo risco pelo MASCC deve ser reavaliado pelo CISNE; CISNE classe 1–2 são candidatos a tratamento ambulatorial (IDSA/ASCO 2018); ambulatorial exige acesso ao hospital em ≤ 1 h, responsável 24 h, retorno em 48–72 h se febre',
          'vancomicina se: instabilidade hemodinâmica/choque séptico, suspeita de infecção relacionada a cateter, infecção de pele e partes moles, pneumonia, mucosite, colonização por germe sensível só a vancomicina ou MRSA, cultura prévia de Gram-positivo, profilaxia com quinolona; suspender após 48 h se nenhum Gram-positivo identificado',
          'antifúngico se: febre persistente após 4–7 dias de antibiótico de amplo espectro com neutropenia esperada > 7 dias e sem foco identificado; instabilidade após esquema inicial adequado; TC de tórax/seios sugestiva; cultura fúngica ou biomarcador (galactomanana/1,3-BDG) positivo — esquemas: voriconazol, anfotericina B lipossomal 3–5 mg/kg/dia, micafungina ou caspofungina',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'IDSA/ASCO 2018',
        texto:
          'Primeira dose de antimicrobiano empírico de amplo espectro em ≤ 1 h da chegada ao DE; estratificar baixo risco pelo MASCC e refinar com CISNE — CISNE 1–2 elegíveis a tratamento ambulatorial; monoterapia com betalactâmico antipseudomonas com eficácia semelhante à combinação.',
      },
      {
        diretriz: 'ABRAMEDE 2024',
        texto:
          'Define febre como temperatura ≥ 37,8 °C no Brasil e neutropenia como < 500/mm³ (ou < 1.000 com queda prevista); recomenda MASCC (≥ 21 baixo risco, ≤ 20 alto risco) complementado pelo CISNE; preferir esquema combinado em instabilidade, infecção polimicrobiana ou alta endemicidade de multirresistentes; iniciar antifúngico se febre persiste 4–7 dias.',
      },
    ],
  },
  {
    id: 'emergencias-oncologicas',
    nome: 'Emergências oncológicas',
    secao: 'Hematológicas/Oncológicas',
    sinonimos: [
      'lise tumoral',
      'compressão medular',
      'veia cava superior',
      'hipercalcemia',
      'Cairo-Bishop',
    ],
    capitulo: 100,
    resumo:
      'As emergências oncológicas abrangem manifestação inicial de neoplasia, progressão de doença conhecida ou efeito do tratamento. A condição clínica prévia, o prognóstico e os objetivos do cuidado devem ser avaliados na admissão. Destacam-se a síndrome de lise tumoral (distúrbios hidroeletrolíticos por destruição maciça de células malignas; tratada com hidratação e redução do ácido úrico), a compressão medular aguda (emergência tempo-dependente, com risco de déficit motor permanente), a síndrome da veia cava superior (obstrução do fluxo da VCS, em geral sem indicação cirúrgica de emergência) e a hipercalcemia da malignidade.',
    fisiopatologia: [
      'Lise tumoral: destruição rápida de grande número de células malignas libera conteúdo intracelular na circulação (potássio, fosfato e ácidos nucleicos), gerando hiperuricemia, hiperfosfatemia, hipocalcemia e hipercalemia.',
      'Ácido úrico (da metabolização dos ácidos nucleicos: purinas > hipoxantina > xantina > ácido úrico) cristaliza nos túbulos renais (pH ácido) causando lesão renal; há também vasoconstrição renal e estado inflamatório/SIRS.',
      'Hiperfosfatemia (fósforo intracelular liberado) precipita fosfato de cálcio nos túbulos (pH alcalino), causando lesão renal e hipocalcemia por consumo; hipercalemia é alteração precoce e grave (estresse oxidativo e lise celular).',
      'SLT mais relacionada a linfomas de alto grau (Burkitt) e leucemias agudas; início 12-72 h após tratamento, podendo ser espontânea em tumores de alto volume/rápida replicação.',
      'Compressão medular: metástases hematogênicas para corpos vertebrais comprimem a medula (em geral anterior); fase inicial com estase venosa e edema vasogênico (reversível), depois lesão hipóxico-isquêmica e edema citotóxico (irreversível). 60% torácica, 30% lombossacra, 10% cervical.',
      'Veia cava superior: obstrução parcial/total do fluxo da VCS (compressão extrínseca por massa mediastinal é a causa mais comum, ou trombose por cateteres), elevando a pressão venosa no segmento superior, com edema cefálico/cervical/MMSS, podendo causar edema laríngeo, faríngeo e cerebral.',
    ],
    exames: [
      {
        titulo: 'Síndrome de lise tumoral',
        itens: [
          'Achados laboratoriais: hiperuricemia, hiperfosfatemia, hipocalcemia, hipercalemia; também creatinina/função renal e DHL.',
          'Diagnóstico pelos critérios de Cairo-Bishop.',
          'USG de rins e vias urinárias + ECG completam a propedêutica inicial (ABRAMEDE).',
        ],
      },
      {
        titulo: 'Veia cava superior',
        itens: [
          'Diagnóstico clínico-radiológico; radiografia de tórax alterada em 84%.',
          'TC de tórax com contraste EV é o exame de escolha (colaterais: sensibilidade 97%, especificidade 92%); mostra local e diferencia compressão extrínseca de trombose.',
          'RM (alternativa em alérgicos/acesso difícil), USG com Doppler, cavografia (padrão-ouro p/ trombose, pré-stent).',
          'Em malignidade, diagnóstico histológico é essencial (biópsia).',
        ],
      },
      {
        titulo: 'Compressão medular',
        itens: [
          'RM da coluna é o exame de escolha (com gadolínio: sensibilidade 93%, especificidade 98%); imagear TODA a coluna (metástases múltiplas em ~1/3).',
          'TC: lesões ósseas/colapso vertebral, mas não detecta bem a compressão; mielo-TC se contraindicação à RM.',
          'Avaliar instabilidade pela escala SINS (≤6 estável; 7-12 potencialmente instável; 13-18 instável).',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Síndrome de lise tumoral',
      'Síndrome da veia cava superior',
      'Síndrome de compressão medular aguda',
      'Hipertensão intracraniana induzida por neoplasia',
      'Hipercalcemia da malignidade',
      'Síndrome de hiperviscosidade',
      'Tamponamento pericárdico / derrame pleural',
      'Neutropenia febril e toxicidades do tratamento',
      'DDx da SLT: toxicidade à quimioterapia, SIRS/sepse, desidratação, IRA pré/renal/pós-renal (ABRAMEDE)',
    ],
    conduta: [
      {
        titulo: 'Síndrome de lise tumoral',
        itens: [
          'Prevenção é a melhor forma de manejo; medidas conforme estratificação de risco (Cairo-Bishop).',
          'Hidratação EV com solução isotônica (salina ou Ringer lactato), ~3 L/dia, alvo de débito urinário ~2 mL/kg/h (ou 80-100 mL/m2/h); ABRAMEDE: >100 mL/m2/h. Cautela em DRC/cardiopata e oligúria/uropatia obstrutiva.',
          'Alcalinização urinária com bicarbonato NÃO indicada de rotina (só se acidose metabólica estabelecida).',
          'Risco intermediário: alopurinol (inibidor da xantina oxidase) 200-400 mg/m2/dia (máx 800 mg/dia), iniciado 24-48 h antes e mantido até 7 dias após indução; ajustar na disfunção renal. ABRAMEDE: 100 mg/m2 a cada 8 h (máx 800 mg/dia).',
          'Alto risco: rasburicase (urato-oxidase recombinante; converte ácido úrico em alantoína) 0,15-0,2 mg/kg/dia em 30 min (ou dose única de 3 mg); contraindicada na deficiência de G6PD; doses adicionais se ácido úrico >5 mg/dL.',
          'Baixo risco com apenas um exame alterado: não iniciar profilaxia.',
          'SLT estabelecida: hidratação venosa, correção dos DHE (NÃO tratar hipocalcemia assintomática), rasburicase 0,2 mg/kg, e hemodiálise quando indicada.',
          'Manejo dos DHE: hipercalemia (gluconato de cálcio, glicoinsulina, diuréticos de alça, bicarbonato, resinas, hemodiálise); hiperfosfatemia (restrição dietética, quelantes, hemodiálise); diálise se anúria, hipercalemia refratária, hipocalcemia sintomática, produto Ca x P ≥ 70 ou IRA progressiva.',
        ],
      },
      {
        titulo: 'Compressão medular',
        itens: [
          'Emergência tempo-dependente: idealmente intervir em 12-24 h; déficit motor >48 h tem prognóstico funcional ruim. Avaliação neurocirúrgica precoce.',
          'Corticoterapia ao diagnóstico: dexametasona 10 mg EV seguida de 4 mg 6/6 h com desmame posterior (reduz edema vasogênico). Doses altas, p. ex. 96 mg/dia, sem benefício e com mais efeitos adversos.',
          'Radioterapia: para coluna estável e tumor radiossensível (linfoma, mieloma, seminoma respondem bem); útil em não candidatos a cirurgia. Dose única para paliação de dor, esquemas fracionados para controle.',
          'Cirurgia: indicada em instabilidade, tumor radiorresistente com acometimento grave, necessidade de diagnóstico histológico, causa hemorrágica/fratura vertebral ou progressão durante RT.',
          'Suporte: profilaxia de TVP, vigilância de retenção urinária e constipação.',
        ],
      },
      {
        titulo: 'VCS / hipercalcemia',
        itens: [
          'VCS: tratamento depende da gravidade e do tipo histológico; a maioria não requer cirurgia de emergência. Medidas gerais: elevação da cabeceira e O2 suplementar.',
          'VCS com sintomas ameaçadores à vida (estridor, desconforto respiratório, sintomas neurológicos/coma): emergência - avaliar via aérea/edema cerebral; stent endovascular é o tratamento de escolha (alívio em >90%, não atrapalha diagnóstico histológico).',
          'VCS sem risco de vida: tratar conforme diagnóstico oncológico (quimioterapia eficaz em linfoma e pequenas células; radioterapia em tumores radiossensíveis, evitar antes da biópsia). Anticoagular se trombose sem risco proibitivo de sangramento; stent de emergência se estenose com trombo.',
          'VCS: glicocorticoides (dexametasona 4 mg 6/6 h) comumente prescritos mas sem evidência forte; podem reduzir carga em linfomas/timomas mas prejudicam a biópsia (evitar até obter histologia). Diuréticos controversos.',
          'Hipercalcemia da malignidade: listada como principal emergência oncológica metabólica; o capítulo não detalha condutas específicas para hipercalcemia.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'USP/HC-FMUSP — Medicina de Emergência: Abordagem Prática, 19ª ed. (2025)',
        texto:
          'SLT diagnosticada pelos critérios de Cairo-Bishop; alopurinol 200-400 mg/m2/dia no risco intermediário e rasburicase 0,15-0,2 mg/kg/dia no alto risco (dose única de 3 mg como opção); contraindicada na deficiência de G6PD; não tratar hipocalcemia assintomática; alcalinização urinária sem evidência suficiente; diálise se produto Ca x P ≥ 70, hipercalemia refratária ou anúria.',
      },
      {
        diretriz: 'USP/HC-FMUSP, 19ª ed. (2025) — compressão medular e VCS',
        texto:
          'Compressão medular: dexametasona 10 mg EV + 4 mg 6/6 h (doses altas 96 mg/dia sem benefício); RT em coluna estável/tumor radiossensível, cirurgia se instabilidade (SINS) ou radiorresistência; intervir em 12-24 h. VCS: stent endovascular como tratamento de escolha nos casos ameaçadores à vida; glicocorticoides e diuréticos sem evidência robusta.',
      },
      {
        diretriz: 'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 1ª ed., 2024)',
        texto:
          'Síndrome de lise tumoral: critérios laboratoriais de Cairo-Bishop (ácido úrico ≥8, K ≥6, fósforo ≥4,5, cálcio ≤7 mg/dL ou variação de 25% do basal); hidratação EV isotônica com alvo de débito urinário >100 mL/m2/h; alopurinol 100 mg/m2 a cada 8 h (máx 800 mg/dia) no menor risco; rasburicase com hiper-hidratação no alto/moderado risco (evitar na deficiência de G6PD); alcalinização urinária não rotineira; monitorização laboratorial a cada 4-6 h em UTI nos pacientes de alto risco.',
      },
    ],
  },
  {
    id: 'acidentes-peconhentos',
    nome: 'Acidentes peçonhentos',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T63.9'],
    sinonimos: [
      'ofidismo',
      'escorpião',
      'aranha',
      'jararaca',
      'cascavel',
      'soro antiveneno',
      'botrópico',
    ],
    capitulo: 107,
    resumo:
      'Acidentes peçonhentos no Brasil têm maioria escorpiônica (~59%), seguida de aranhas (~13%) e ofídios (~9,5%); letalidade geral baixa, maior no ofidismo crotálico e laquético. A base do tratamento é a soroterapia antiveneno específica, gênero-específica, definida por diagnóstico presumível (história, exame físico, efeitos do veneno) e classificação de gravidade. Para ofidismo botrópico e crotálico o tempo ótimo do soro é ~6 horas. Ofídicos: Bothrops/jararaca (>80%, quadro local intenso e coagulopatia), Crotalus/cascavel (~9-10%, neurotóxico/miotóxico/coagulante, IRA), Lachesis/surucucu (raro, local exuberante + síndrome vagal) e Micrurus/coral (raro, neurotóxico puro). Escorpionismo por Tityus (T. serrulatus o mais grave) e araneísmo por Loxosceles (necrose/placa marmórea), Phoneutria (dor) e Latrodectus (neurológico; sem soro no Brasil).',
    fisiopatologia: [
      'Bothrops: veneno com metaloproteinases, serino-proteases e fosfolipases A2 — ações proteolítica (dor/edema/flictenas/necrose local), coagulante (consumo de fibrinogênio/plaquetas) e hemorrágica (lesão endotelial); pode haver IRA pré-renal por sequestro de líquido e nefrotoxicidade',
      'Bothrops filhotes (<30-35 cm): predomínio da fração coagulante com edema local discreto/ausente',
      'Crotalus: crotoxina (fosfolipase A2 + crotapotina, ~65% do veneno) — ação neurotóxica (bloqueio pré-sináptico, fácies miastênica), miotóxica (rabdomiólise/mioglobinúria), coagulante e nefrotóxica; IRA é a principal causa de morbimortalidade',
      'Lachesis: ação proteolítica, coagulante/desfibrinante, hemorrágica e neurotóxica vagal (peptídeo potenciador de bradicinina) — síndrome vagal com hipotensão/bradicardia/diarreia',
      'Micrurus: three-finger toxins (pós-sinápticas, ligam receptores colinérgicos) e fosfolipases A2 (pré-sinápticas) — neurotoxicidade pura, sem coagulopatia ou rabdomiólise relevante; risco de paralisia respiratória',
      'Tityus: veneno atua em canais de sódio/potássio/cálcio, liberação maciça de catecolaminas e acetilcolina — predispõe a arritmias, convulsões, edema agudo de pulmão (cardiogênico e não cardiogênico) e lesão direta de cardiomiócitos',
      'Loxosceles: fosfolipase D/esfingomielinase D, ativação do complemento e enzimas proteolíticas — necrose cutânea (placa marmórea) e, raramente, forma cutâneo-visceral com hemólise intravascular, IRA e CIVD',
      'Phoneutria: ação neurotóxica em canais iônicos, liberação de catecolaminas e acetilcolina — dor local intensa, raras manifestações autonômicas',
      'Latrodectus: alfa-latrotoxina libera neurotransmissores (acetilcolina, catecolaminas) — síndrome neurológica com dor, contraturas, diaforese, fácies latrodectísmica',
    ],
    exames: [
      {
        titulo: 'Iniciais gerais (ofidismo)',
        itens: [
          'Hemograma',
          'TP, TTPA e fibrinogênio (fibrinogênio é o mais precoce/sensível)',
          'Creatinina, ureia, eletrólitos',
          'Urina de rotina',
          'Repetir coagulograma/exames com 2, 6 e 12 h se inicialmente normais',
        ],
      },
      {
        titulo: 'Crotálico (adicionar)',
        itens: [
          'CK/CPK total, LDH, TGO/AST e TGP (atividade miotóxica)',
          'Acompanhar CK, função renal e débito urinário (CK pico em até 48 h)',
          'CK e IRA alteram-se tardiamente (6-12 h) — não usar como critério para soro',
        ],
      },
      {
        titulo: 'Laquético (adicionar)',
        itens: [
          'ECG seriado (bradicardia, alterações de ST/T, BAV)',
          'CPK, função renal, ionograma; PoCUS/FAST se sangramento ou avaliação do membro',
        ],
      },
      {
        titulo: 'Elapídico',
        itens: [
          'Sem exames específicos; gasometria arterial é o mais importante se repercussão respiratória',
          'Coagulograma, função renal e CPK não fazem parte da avaliação',
        ],
      },
      {
        titulo: 'Escorpiônico',
        itens: [
          'Hemograma, glicemia (hiperglicemia), Na/K (hipocalemia), amilase, CK, ECG',
          'Casos graves: troponina (valor prognóstico) e ecocardiograma/PoCUS (hipocinesia de VE, congestão)',
          'Caso leve: diagnóstico clínico, sem necessidade de laboratório',
        ],
      },
      {
        titulo: 'Aracnídico',
        itens: [
          'Phoneutria/Latrodectus: exames inespecíficos, não necessários ao diagnóstico',
          'Loxosceles cutâneo: leucocitose, CK, LDH, AST',
          'Loxosceles cutâneo-visceral: anemia/hemólise (queda de Hb/haptoglobina, BI aumentada, reticulócitos), plaquetopenia, coagulograma, urina (hemoglobinúria), função renal',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Botrópico x laquético: ambos com quadro local exuberante; laquético tem síndrome vagal precoce (vômitos, diarreia, hipotensão, bradicardia)',
      'Crotálico x elapídico: ambos neurotóxicos; no crotálico há rabdomiólise e coagulopatia e a insuficiência respiratória é rara/tardia; no elapídico a insuficiência respiratória é a principal complicação, sem coagulopatia/rabdomiólise',
      'Coral verdadeira (Micrurus) x corais falsas (não peçonhentas): observar 12 h; se assintomático, provável coral falsa ou dry bite',
      'Serpentes não peçonhentas (Philodryas/cobra-cipó, Clelia/muçurana, Dipsas): apenas trauma/edema local, sem soro',
      'Manipulação da lesão (garrote, sucção, cortes) pode mimetizar quadro local botrópico',
      'Escorpionismo grave x intoxicação por carbamato ("chumbinho"), cetoacidose diabética e sepse (síndrome colinérgica e hiperglicemia comuns)',
      'Loxoscelismo x celulite/lesões necróticas infectadas (necrose seca x úmida/secretiva)',
      'Latrodectismo x escorpionismo, organofosforados, estricnina, tétano, hipocalcemia, abstinência alcoólica, pré-eclâmpsia',
    ],
    conduta: [
      {
        titulo: 'Ofídico (por gênero)',
        itens: [
          'Bothrops: soro antibotrópico (SAB) EV em 10-30 min; na falta usar SABC ou SABL. Nº de ampolas por gravidade — leve (local discreto/ausente, sem sistêmico): 3; moderado (local evidente): 6; grave (equimose/bolha/necrose ou sistêmico): 12. Edema graduado por segmentos do membro (≤1 leve, ≤2 moderado, >2 grave). Em filhotes a coagulopatia define a dose. Se coagulograma alterado >24 h pós-soro, repetir 2 ampolas. Atentar para síndrome compartimental/fasciotomia',
          'Crotalus: soro anticrotálico (SAC) EV; na falta SABC. Gravidade pela neurotoxicidade — leve: 5; moderado: 10; grave (ptose completa sempre grave): 20. Hidratação venosa vigorosa precoce, alvo de débito urinário 2-3 mL/kg/h; considerar diálise se IRA/restrição de volume; não alcalinizar urina (ABRAMEDE)',
          'Lachesis (surucucu): todo acidente é grave — 10 a 20 ampolas de soro antibotrópico-laquético (SABL/SAL) EV (única apresentação disponível no Brasil é o antibotrópico-laquético). Suporte hemodinâmico com volume, atropina (manifestações vagais) e inotrópicos; monitorizar por 72 h (hipotensão tardia, hemorragia digestiva, trombose mesentérica, AVC)',
          'Micrurus (coral): todo acidente com empeçonhamento é grave — 5 a 10 ampolas de soro antielapídico (SAE) EV ao menor sinal de neurotoxicidade (ABRAMEDE: 10 ampolas). Vigilância respiratória e intubação precoce; evitar succinilcolina na sequência rápida. Se soro indisponível e insuficiência respiratória: anticolinesterásico — neostigmina (USP: 0,05 mg/kg crianças, máx 2-5 mg adulto, precedida de atropina, repetir a cada 4 h) ou fisostigmina 0,5 mg EV (ABRAMEDE), com atropina para sinais muscarínicos',
        ],
      },
      {
        titulo: 'Escorpião/aranha',
        itens: [
          'Escorpião (Tityus) leve: apenas analgesia (dipirona/paracetamol ± opioide), bloqueio/anestesia local, compressas mornas; observação (crianças até 12 h, adultos até 6 h); não usar soro',
          'Escorpião moderado: 2 a 3 ampolas de soro antiescorpiônico (ou antiaracnídico) + sintomáticos; observar ≥24 h',
          'Escorpião grave: 4 a 6 ampolas de soro + UTI; restringir volume (risco de EAP); dobutamina (2-10 µg/kg/min) se choque cardiogênico, milrinona como alternativa; furosemida na congestão cardiogênica (não no EAP não cardiogênico); PoCUS para guiar terapia',
          'Phoneutria (armadeira) leve (~90-95%): analgesia simples/opioide e bloqueio anestésico local com lidocaína sem vasoconstritor; observar 4-6 h. Moderado: 5 ampolas de soro antiaracnídico + sintomáticos. Grave (raro): 10 ampolas + suporte',
          'Loxosceles (marrom): lesão incaracterística/sem identificação — sintomático. Lesão típica >3 cm — 5 ampolas de soro antiaracnídico/antiloxoscélico (janela ~36-72 h, controversa). Forma cutâneo-visceral/hemólise — 10 ampolas (em qualquer momento). Corticoide adjuvante: prednisona 1 mg/kg/dia (40-60 mg adulto) por 5-7 dias; desbridamento após delimitação da necrose; hidratação alvo 1-2 mL/kg/h se sistêmico',
          'Latrodectus (viúva-negra): sem soro produzido/distribuído no Brasil — tratamento de suporte: analgésicos/opioides, benzodiazepínicos para espasmos; MS ainda orienta gluconato de cálcio em situações selecionadas (evidência fraca); se soro disponível, 1-2 ampolas IM',
        ],
      },
      {
        titulo: 'Geral/suporte',
        itens: [
          'Levar o paciente ao soro (ou o soro ao paciente); identificar/fotografar o animal a distância segura — diagnóstico presumível costuma bastar',
          'Lavar a picada com água e sabão, remover joias, imobilizar/elevar o membro; manter deitado e aquecido',
          'NÃO fazer: torniquete, incisão, sucção, ruptura de bolhas, sutura, gelo local (atrasam transporte e podem piorar lesão)',
          'Sala de emergência, monitorização, acesso calibroso, hidratação, analgesia e antieméticos; jejum pelo risco de anafilaxia ao soro',
          'Evitar AINEs (nefrotoxicidade/sangramento) e anti-histamínicos/sedativos (mascaram neurotoxicidade)',
          'Profilaxia antitetânica; antibiótico não de rotina (ponderar em botrópico — opções: amoxicilina-clavulanato, ceftriaxona, ciprofloxacina, gentamicina)',
          'Soro EV preferencial, sem diluição ou diluído 1:2/1:5, em 10-30 min sob monitorização; manter adrenalina e material de intubação à beira do leito',
          'Coagulopatia de consumo do veneno só responde ao soro — plasma/crioprecipitado não indicados isoladamente',
          'Reação anafilática ao soro: suspender, adrenalina 0,3-0,5 mg IM/SC (0,01 mg/kg crianças), volume, via aérea; reiniciar após melhora. Doença do soro (1-4 semanas): anti-histamínico/AINE; grave — prednisona 60 mg em desmame',
          'Notificação compulsória no SINAN',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'MS 2024 (Manual 2ª ed. — vigente) / MS 2017 (CGDT/SVS)',
        texto:
          'Soroterapia botrópica por gravidade — leve 3, moderado 6, grave 12 ampolas, com classificação dinâmica do edema por segmentos do membro e reavaliação seriada. A 2ª ed. (2024) é a versão vigente — confirmar a classificação de gravidade e o nº de ampolas nela antes do uso.',
      },
      {
        diretriz: 'MS 2001 (Manual de acidentes por animais peçonhentos)',
        texto:
          'Base das classificações de gravidade e doses de soro para crotálico (5/10/20), laquético (10/20), escorpiônico (2-3 / 4-6 ampolas) e aracnídico (Phoneutria, Loxosceles, Latrodectus).',
      },
      {
        diretriz: 'ABRAMEDE 2024',
        texto:
          'Soro antiofídico é gênero-específico; aplicar de forma precoce porém baseada em critérios clínicos/laboratoriais e identificação — soroterapia desnecessária é deletéria. No Brasil só há antibotrópico-laquético para surucucu e não há soro antilatrodectus. Reforça PoCUS no escorpionismo e laquético, evitar succinilcolina no elapídico e bloqueador não despolarizante (rocurônio) no crotálico com rabdomiólise.',
      },
      {
        diretriz: 'USP/HC-FMUSP 2025 (19ª ed.)',
        texto:
          'Tempo ótimo do soro botrópico/crotálico ~6 h; pré-medicação com adrenalina não recomendada no contexto brasileiro; soro antilatrodectus não distribuído no país desde meados dos anos 2000.',
      },
    ],
  },
  {
    id: 'gravidez-ectopica',
    nome: 'Gravidez ectópica',
    secao: 'Gineco-obstétricas',
    cid10: ['O00.9'],
    sinonimos: ['ectópica', 'prenhez tubária', 'β-hCG', 'metotrexato'],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 109; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Implantação e desenvolvimento do blastocisto fora da cavidade uterina (~90-95% nas tubas, principalmente região ampular). É a principal causa de mortalidade materna no 1º trimestre. Suspeitar em toda mulher em idade fértil com atraso menstrual ou β-hCG positivo associado a sangramento vaginal e/ou dor abdominal. A tríade clássica (atraso menstrual + dor abdominal + sangramento) ocorre em apenas 50-60% dos casos, mas quase todas têm ao menos um sintoma. O risco maior é a gestação ectópica rota, que leva a choque hipovolêmico e óbito em curto espaço de tempo.',
    fisiopatologia: [
      'Implantação ovular fora da cavidade uterina: ~90-95% tubária (principalmente ampular); mais raros: ovariana (<3%), cervical, abdominal, em cicatriz de cesárea (~1% cada) e intersticial (2-4%).',
      'Mecanismo principal: dificuldade no transporte do óvulo pela tuba uterina até a cavidade do útero.',
      'Gestação heterotópica (tópica + ectópica simultâneas) é rara, mas em aumento com reprodução assistida.',
      'Dor abdominal por distensão tubária (aumento de fluxo sanguíneo local) ou por rotura; dor no ombro por irritação diafragmática do hemoperitônio.',
      'Sangramento vaginal decorrente da descamação endometrial pela produção irregular de hCG.',
      'Fatores de risco: doença inflamatória pélvica (risco 2-7,5x), cirurgia tubária prévia, gestação ectópica prévia, concepção em uso de DIU, idade materna > 35 anos, reprodução assistida, anormalidade anatômica tubária, tabagismo.',
    ],
    exames: [
      {
        titulo: 'β-hCG (dosagem seriada)',
        itens: [
          'Na ectópica, o β-hCG tende a ser menor que na gestação tópica e não se eleva da mesma forma.',
          'Na tópica espera-se duplicação em ~48h; ausência de elevação de pelo menos 66% em 48h sugere ectópica ou gestação tópica não evolutiva (USP/FEBRASGO: elevação < 35% em 48h também sugere ectópica/inviável; > 35% sugere intrauterina viável).',
          'Não usar dosagem única — sempre seriar, geralmente a cada 48h.',
        ],
      },
      {
        titulo: 'Zona discriminatória + USG transvaginal',
        itens: [
          'USG transvaginal é preferencial (sensibilidade 54-92%); abdominal alternativa.',
          'Zona discriminatória (FEBRASGO/USP): β-hCG > 2.000 mUI/mL — espera-se ver saco gestacional tópico à USGTV; ausência é muito sugestiva de ectópica (atentar p/ gestação múltipla inicial).',
          'ABRAMEDE: saco tópico esperado à USGTV com β-hCG 1.500-2.000 mUI/mL; à USG abdominal com 6.000-6.500 mUI/mL.',
          'Diagnóstico de certeza: saco gestacional fora da cavidade uterina. Sinais sugestivos: líquido livre na pelve, massa pélvica complexa, anel tubário (imagem paraovariana).',
        ],
      },
      {
        titulo: 'Outros / instabilidade',
        itens: [
          'Progesterona sérica < 10 ng/mL associa-se a gestação não evolutiva (não disponível rotineiramente; valor normal não exclui).',
          'Paciente instável: USG à beira do leito / FAST — se positivo (líquido livre), mesmo sem massa anexial, apoia ectópica rota e aciona protocolo cirúrgico imediato.',
          'Tipagem sanguínea para toda gestante com sangramento.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Rotura de cisto ovariano (β-hCG negativo).',
      'Ameaça de abortamento / abortamento incompleto (sangramento maior, dor rítmica e mediana, volume uterino maior).',
      'Salpingite (β-hCG negativo; massa anexial bilateral palpável, sem sangramento vaginal).',
      'Afecções gastrintestinais, ex.: apendicite (β-hCG negativo, náuseas/vômitos/diarreia).',
      'Métodos invasivos (curetagem, laparoscopia diagnóstica/terapêutica) reservados à minoria dos casos.',
    ],
    conduta: [
      {
        titulo: 'Conduta expectante',
        itens: [
          'Critérios: ectópica íntegra ≤ 4 cm, sem atividade cardíaca, β-hCG ≤ 5.000 mUI/mL, estabilidade hemodinâmica e líquido livre limitado à pelve.',
          'Maior chance de sucesso com β-hCG < 1.000 mUI/mL.',
          'Acompanhamento semanal até negativação; espera-se queda > 15%/semana — se não ocorrer, indica tratamento medicamentoso ou cirúrgico.',
          'Risco de rotura tubária com possível necessidade de cirurgia de emergência.',
        ],
      },
      {
        titulo: 'Metotrexato (medicamentoso)',
        itens: [
          'Mesmos critérios da conduta expectante; ABRAMEDE: massa < 4 cm, sem BCF, β-hCG < 5.000, estabilidade, sem rotura, acompanhamento possível (USP: massa anexial < 3,5 cm e β-hCG < 5.000).',
          'Contraindicações: disfunção hematológica, renal ou hepática, imunossupressão, amamentação, recidiva na mesma tuba, impossibilidade de acompanhamento.',
          'Dose única IM de 50 mg/m²; também esquemas de dose dupla ou múltiplas doses conforme β-hCG, local de implantação e protocolo do serviço.',
          'Taxa de sucesso ~70-95% (maior com β-hCG mais baixo); espera-se queda do β-hCG ≥ 15% entre o 4º e o 7º dia, com seguimento semanal até negativação.',
          'Decisão deve ser tomada pelo especialista junto à paciente.',
        ],
      },
      {
        titulo: 'Cirúrgico',
        itens: [
          'Conduta definitiva padrão da ectópica.',
          'Conservador: salpingostomia ou ressecção parcial; radical: salpingectomia — preferencialmente por laparoscopia.',
          'Indicado se rotura, ou íntegra com contraindicação ao tratamento clínico.',
          'Instabilidade hemodinâmica: ressuscitação volêmica com hemoderivados + manejo cirúrgico imediato.',
        ],
      },
      {
        titulo: 'Imunoprofilaxia anti-D (se Rh negativo)',
        itens: [
          'Aplicar imunoglobulina anti-D em até 72h.',
          'Antes de 12 semanas / 1º trimestre: 50 µg (mcg) IM (dose plena de 300 µg também aceitável); após o 1º trimestre: 300 µg.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'FEBRASGO (citada por USP/HC-FMUSP, 2025)',
        texto:
          'Diagnóstico baseado em β-hCG seriado com valor discriminatório de > 2.000 mUI/mL; ausência de gestação intrauterina à USG acima desse valor é muito sugestiva de ectópica. Com β-hCG < 2.000, repetir em 48h: elevação < 35% sugere ectópica/inviável, > 35% sugere intrauterina viável. Tratamento com metotrexato permitido em paciente estável com massa anexial < 3,5 cm e β-hCG < 5.000 mUI/mL.',
      },
      {
        diretriz: 'ABRAMEDE (Manole, 2024)',
        texto:
          'Critérios para conduta expectante ou medicamentosa: massa tubária < 4 cm, ausência de atividade cardíaca embrionária, β-hCG < 5.000 mUI/mL, estabilidade hemodinâmica, ausência de rotura e possibilidade de acompanhamento. Metotrexato 50 mg/m² IM (dose única, dupla ou múltipla).',
      },
    ],
  },
  {
    id: 'abortamento',
    nome: 'Abortamento e sangramento do 1º trimestre',
    secao: 'Gineco-obstétricas',
    cid10: ['O03.9', 'O20.0'],
    sinonimos: [
      'aborto',
      'ameaça de abortamento',
      'abortamento incompleto',
      'misoprostol',
      'AMIU',
      'mola',
    ],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 109; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Sangramento vaginal ocorre em 7-25% das gestações no 1º trimestre (USP: ~20% até 20 semanas), e o abortamento (interrupção antes de 20-22 semanas, ou concepto <500 g) é a causa mais comum. Toda mulher em idade fértil com atraso menstrual/β-hCG positivo e sangramento ou dor abdominal exige excluir gestação ectópica (causa de morte materna no 1º trimestre) e doença trofoblástica. A classificação do abortamento depende de USG transvaginal, estado do óstio cervical (impérvio/pérvio) e eliminação de tecidos. Toda gestante com sangramento deve ter tipagem sanguínea; Rh negativo recebe imunoglobulina anti-D.',
    fisiopatologia: [
      'Abortamento: interrupção gestacional antes de 20-22 semanas (peso fetal <500 g / comprimento <16,5 cm); ~50% dos abortos espontâneos ocorrem até a 8ª semana, principalmente por anomalias cromossômicas. Precoce até 12 sem 6 dias (80% dos casos), tardio a partir da 13ª semana.',
      'Fatores de risco: idade materna avançada (~17% acima de 35 anos, até 33% acima de 40), obesidade, diabetes, distúrbios tireoidianos, infecções, trombofilias; álcool, tabaco (+30%) e cocaína; trauma.',
      'Ameaça de abortamento: sangramento em pequena quantidade +/- cólica, colo IMPÉRVIO (fechado); USG com saco gestacional regular, BCF >100 bpm e descolamento ovular <40% do saco; gestação ainda viável.',
      'Aborto inevitável/em curso: dor intensa em hipogástrio e sangramento (pode ser profuso, com repercussão hemodinâmica); colo DILATADO, podendo haver membranas/embrião no canal.',
      'Abortamento incompleto: eliminação parcial do concepto com restos ovulares retidos; colo pérvio (aberto); USG com conteúdo intrauterino amorfo/heterogêneo e endométrio >15 mm. Forma mais frequente após a 10ª semana.',
      'Aborto completo: concepto totalmente expelido; sangramento e dor em resolução, colo fechado, sem repercussão hemodinâmica; USG com endométrio <=15 mm e mínimo líquido livre.',
      'Aborto retido: concepto sem vitalidade retido em cavidade, colo fechado; regressão de sintomas gravídicos, útero menor que o esperado; USG sem atividade cardíaca. Pode ser assintomático.',
      "Aborto infectado/séptico: infecção intrauterina (aborto inseguro); sangramento escuro 'lavado de carne' com odor fétido, febre, dor; agentes aeróbios e anaeróbios (estreptococos, E. coli, enterococos, Peptostreptococcus, Bacteroides fragilis, Clostridium). Pode evoluir para sepse/peritonite.",
    ],
    exames: [
      {
        titulo: 'β-hCG',
        itens: [
          'Confirma gestação; em gestação tópica viável duplica em ~2 dias / eleva >35-66% em 48 h.',
          'Dosagem seriada (cada 48 h) — falta de elevação adequada sugere ectópica ou gestação inviável.',
          'Valor discriminatório >2.000 mUI/mL (FEBRASGO/USG transvaginal): ausência de saco gestacional tópico nesse nível sugere ectópica; ~6.000-6.500 mUI/mL para USG abdominal.',
          'Em DTG/mola: β-hCG muito elevado (>200.000 sugere mola completa).',
        ],
      },
      {
        titulo: 'Ultrassonografia transvaginal (padrão)',
        itens: [
          'Define o tipo de abortamento e localiza o saco gestacional (tópico x ectópico).',
          'Em instável: USG à beira do leito / FAST — líquido livre apoia ectópica rota e aciona cirurgia.',
          "DTG: padrão 'flocos de neve'/'cacho de uva', placenta espessada hiperecoica com cistos.",
        ],
      },
      {
        titulo: 'Tipagem sanguínea e Rh',
        itens: [
          'Indicada para TODA gestante com sangramento vaginal no DE.',
          'Rh negativo recebe imunoglobulina anti-D em até 72 h.',
        ],
      },
      {
        titulo: 'No aborto infectado/séptico',
        itens: [
          'Hemograma (leucocitose), hemocultura; USG pode mostrar abscesso em fundo de saco de Douglas.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Gestação ectópica: implantação fora da cavidade uterina (~90-95% tubária); atraso menstrual + dor abdominal + sangramento; β-hCG menor e com elevação inadequada; suspeitar de rotura em dor intensa com defesa/irritação peritoneal e choque — FAST positivo aciona cirurgia.',
      "Doença trofoblástica gestacional / mola hidatiforme: sangramento escuro, útero maior que o esperado para a IG, β-hCG muito elevado, vômitos/hiperêmese, pré-eclâmpsia <20 semanas, sinais de hipertireoidismo; USG 'flocos de neve'.",
      'Rotura de cisto ovariano (β-hCG negativo), salpingite, apendicite/afecções gastrintestinais.',
    ],
    conduta: [
      {
        titulo: 'Ameaça de abortamento',
        itens: [
          'Conduta expectante: nenhum tratamento reduz o risco de evolução.',
          'Analgésicos e orientação; abstinência sexual durante o sangramento.',
          'Alta com retorno precoce ao obstetra e orientação para retornar se piora do sangramento/dor.',
          'Não indicados: hCG, progesterona de rotina, relaxantes, vitaminas, repouso no leito.',
        ],
      },
      {
        titulo: 'Aborto inevitável / incompleto / retido — esvaziamento uterino',
        itens: [
          'IG <12 semanas: misoprostol OU aspiração manual intrauterina (AMIU)/vacuoaspiração.',
          'IG >12 semanas: misoprostol para expulsão do feto, seguido de curetagem uterina.',
          'Incompleto: esvaziamento cirúrgico (curetagem ou AMIU) pelo obstetra.',
          'Retido <12 sem: pode-se aguardar início espontâneo (em geral até 3 semanas), misoprostol ou AMIU.',
          'Definição entre medicamentoso (misoprostol) e cirúrgico (curetagem/AMIU) cabe ao obstetra com a paciente. (Doses específicas de misoprostol não detalhadas nas fontes.)',
        ],
      },
      {
        titulo: 'Aborto completo',
        itens: [
          'Conduta expectante: analgésicos e vigilância da hemorragia.',
          'Enviar material eliminado para histopatológico (salvo partes fetais óbvias).',
          'Reavaliar em até 2 semanas (risco de tecido retido ou ectópica não identificada).',
        ],
      },
      {
        titulo: 'Aborto infectado / séptico',
        itens: [
          'Antibioticoterapia de largo espectro precoce + hemocultura; manejo de sepse se séptica.',
          'Esquemas: clindamicina 900 mg IV 8/8h + gentamicina 3-5 mg/kg/dia IV (USP); ou cefoxitina 2 g IV 6/6h + doxiciclina 100 mg VO 12/12h.',
          'ABRAMEDE: clindamicina + gentamicina ou metronidazol + gentamicina; ampliar com ampicilina/penicilina G nos graves (ampicilina 1-2 g IV, gentamicina 1,5 mg/kg, ceftriaxona 1-2 g, metronidazol 500 mg, clindamicina 600 mg).',
          'Esvaziamento (curetagem/AMIU) com avaliação do especialista; laparotomia/histerectomia se perfuração uterina ou quadro grave.',
        ],
      },
      {
        titulo: 'Imunoglobulina anti-D (Rh negativo)',
        itens: [
          '1º trimestre / <12 semanas: 50 µg (mcg) IM (dose plena de 300 µg também aceitável).',
          'Após o 1º trimestre / >12 semanas: 300 µg IM.',
          'Administrar em até 72 h para prevenir aloimunização (eritroblastose fetal).',
        ],
      },
      {
        titulo: 'Suporte e instabilidade',
        itens: [
          'Avaliar sinais de choque hipovolêmico; dois acessos venosos calibrosos, cristaloides e hemoderivados se necessário.',
          'No aborto inevitável/incompleto com hemorragia profusa: suporte hemodinâmico + esvaziamento urgente.',
          'Encaminhamento ao obstetra; na mola/DTG: internação, estabilização, β-hCG e correção de distúrbios (anemia, DHE, tireotoxicose, hipertensão), seguido de esvaziamento por aspiração.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'FEBRASGO — β-hCG discriminatório',
        texto:
          'Valor discriminatório de β-hCG >2.000 mUI/mL: ausência de gestação intrauterina ao USG é muito sugestiva de ectópica. Se β-hCG <2.000, repetir em 48 h — elevação <35% indica alta probabilidade de ectópica/gestação inviável; >35% sugere gravidez intrauterina viável.',
      },
      {
        diretriz: 'Imunoglobulina anti-Rh (USP/ABRAMEDE)',
        texto:
          'Profilaxia em até 72 h para toda gestante Rh negativo com sangramento: 50 µg IM no 1º trimestre e 300 µg IM após o 1º trimestre.',
      },
      {
        diretriz: 'Manejo do abortamento incompleto/retido (USP)',
        texto:
          'Pode ser medicamentoso (misoprostol) ou cirúrgico (curetagem ou AMIU); a escolha deve ser definida pelo obstetra em conjunto com a paciente.',
      },
    ],
  },
  {
    id: 'hemorragia-2a-metade',
    nome: 'Hemorragia da 2ª metade da gestação (DPP e placenta prévia)',
    secao: 'Gineco-obstétricas',
    cid10: ['O44.1', 'O45.9'],
    sinonimos: [
      'DPP',
      'descolamento prematuro de placenta',
      'placenta prévia',
      'sangramento obstétrico',
      'vasa prévia',
    ],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 109; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Sangramento na 2ª metade da gestação (após ~20 semanas) ocorre em cerca de 4% das gestações e, antes da viabilidade fetal (<24 sem), tem até 1/3 de chance de aborto/óbito fetal. As duas principais causas são o descolamento prematuro de placenta (DPP) e a placenta prévia (PP); rotura uterina e vasa prévia são diferenciais. A distinção é clínica: DPP cursa com dor abdominal aguda/lancinante, hipertonia uterina, sangramento escuro (em pequena quantidade ou oculto) e sofrimento fetal; PP cursa com sangramento vermelho-vivo INDOLOR e autolimitado, sem repercussão hemodinâmica esperada. Na suspeita de PP NÃO realizar toque vaginal nem exame especular (risco de hemorragia grave) — diagnóstico por USG. O diagnóstico de DPP é clínico e a USG normal não o exclui. Conduta inicial do emergencista: estabilização materna, monitorização materno-fetal contínua, coleta de hemograma/coagulograma/tipagem, profilaxia anti-D se Rh negativo e acionamento precoce do obstetra.',
    fisiopatologia: [
      'Placenta prévia (PP): inserção da placenta no segmento uterino inferior, recobrindo total/parcialmente o óstio interno do colo (ou até 2 cm dele — inserção baixa). O segmento inferior é menos vascularizado e suas contrações são menos eficazes, de modo que a hemorragia (por separação placentária na dilatação cervical próxima ao parto) pode persistir. Fatores de risco: idade materna avançada, multiparidade, gemelaridade, cesarianas e curetagens prévias, tabagismo e cocaína.',
      'Acretismo placentário: placenta aderida de forma anormal ao útero, podendo invadir miométrio/serosa/órgãos adjacentes; após tentativa de separação, hemorragia importante com risco de CIVD e morte materna. Risco aumentado por cesárea prévia.',
      'Descolamento prematuro de placenta (DPP): separação abrupta da placenta normoinserida da decídua basal, antes da expulsão fetal e acima de 20 semanas, com sangramento e hematoma na interface placenta-parede uterina. A perda de superfície de troca leva à hipóxia fetal e o sangramento materno volumoso pode evoluir para CIVD.',
      'No DPP o sangramento pode ser oculto (até 20% dos casos): o sangue não se exterioriza, acumulando-se entre placenta e útero (com aumento progressivo da altura uterina) ou extravasando para a serosa — útero de Couvelaire, em que pode não haver palpação fetal. A quantidade de sangramento vaginal NÃO se correlaciona com o volume sanguíneo perdido.',
      'Fatores de risco para DPP: DPP prévio (o mais importante, aumenta 10-15x), síndromes hipertensivas (mais associadas a quadros graves), trauma abdominal contuso, trombofilias, tabagismo, cocaína, gestação múltipla, polidrâmnio, rotura prematura de membranas e anormalidades uterinas.',
      'Vasa prévia: vasos fetais das membranas (inserção velamentosa do cordão) cruzam o segmento inferior à frente da apresentação; a rotura, em geral após ruptura das membranas, causa sangramento de origem fetal com bradicardia/sofrimento fetal rápido e mortalidade fetal de até 50% se não diagnosticada no pré-natal.',
    ],
    exames: [
      {
        titulo: 'Laboratório (toda gestante com sangramento)',
        itens: [
          'Tipagem sanguínea (Rh) — indicar imunoglobulina anti-D (anti-Rh) se Rh negativo: 300 µg IM se sangramento após o 1º trimestre',
          'Hemograma com plaquetas e nível de hemoglobina',
          'Coagulograma: fibrinogênio, INR e TTPA',
          'Fibrinogênio é o exame com melhor correlação com a gravidade do sangramento, CIVD e necessidade de hemotransfusão no DPP: <200 tem VPP para hemorragia pós-parto; >400 tem valor preditivo negativo para CIVD',
          'Interpretar achados de CIVD com cautela na gestação (há aumento fisiológico de fatores de coagulação e plaquetopenia leve basal)',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'USG é a melhor ferramenta para PP (visualizar placenta e óstio interno do colo); a via transvaginal é padrão-ouro, segura e não aumenta o risco de sangramento — fazer se a via abdominal não visualizar bem as estruturas',
          'No DPP o diagnóstico é CLÍNICO: a USG é específica mas pouco sensível (principal achado: hematoma retroplacentário, VPP ~80%); o hematoma agudo tem ecogenicidade igual à da placenta. USG normal NÃO exclui DPP e não deve retardar o tratamento',
          'Vasa prévia: USG transvaginal com Doppler colorido (diagnóstico idealmente pré-natal)',
        ],
      },
      {
        titulo: 'Avaliação fetal e materna',
        itens: [
          'Monitorização materno-fetal contínua; cardiotocografia para detectar sofrimento fetal (desacelerações, bradicardia ou taquicardia persistentes)',
          'Monitorização materna multiparamétrica: FC, pulso, PA, enchimento capilar, FR, nível de consciência e diurese (alvo 30 mL/h)',
          'Atenção: a gestante no 3º trimestre tolera perdas de até ~30% da volemia com pouca repercussão da PAS; sinais de choque são tardios (ainda mais em hipertensas crônicas) — Shock Index (FC/PAS) >0,9 é sensível para choque',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Placenta prévia: sangramento vermelho-vivo, INDOLOR, intermitente e habitualmente de pequeno volume; tônus uterino normal; sem repercussão hemodinâmica esperada; NÃO fazer toque vaginal/especular',
      'Descolamento prematuro de placenta: dor abdominal aguda/lancinante, hipertonia uterina, sangramento escuro (em pequena quantidade ou oculto) e sofrimento fetal; diagnóstico clínico',
      'Rotura uterina: diferencial do DPP',
      'Vasa prévia: sangramento vaginal indolor importante após ruptura das membranas, com bradicardia/sofrimento fetal de evolução rápida (origem fetal do sangue)',
      'Trabalho de parto (pode ser o evento inicial em ~20% dos DPP)',
      'Coagulopatias',
    ],
    conduta: [
      {
        titulo: 'Estabilização hemodinâmica (comum a DPP e PP)',
        itens: [
          'Abordagem do paciente grave; internação e monitorização materno-fetal contínua; manter SatO2 >94% (O2 suplementar se necessário)',
          'Dois acessos venosos periféricos de maior calibre; infusão de cristaloides',
          'Transfusão: iniciar se perda estimada entre 500 e 1.000 mL; acionar protocolo de transfusão maciça se perda >1.500 mL ou >4 concentrados de hemácias',
          'Anti-D (imunoglobulina anti-Rh) se Rh negativo, para evitar aloimunização materna',
          'Acionar precocemente o obstetra/equipe cirúrgica; nenhuma paciente recebe alta antes de avaliação obstétrica',
        ],
      },
      {
        titulo: 'Placenta prévia',
        itens: [
          'NÃO realizar toque vaginal nem exame especular antes da USG (risco de hemorragia grave)',
          'Internação para monitorização e avaliação da estabilidade; expansão volêmica se necessário',
          'Conduta expectante se estabilidade hemodinâmica, hemorragia não intensa e IG <37 semanas (repouso relativo)',
          'Corticosteroide para maturação pulmonar fetal pode ser considerado entre 25 e 34 semanas; não há evidência suficiente para tocólise',
          'Interrupção da gestação (cesárea) se IG ≥37 semanas ou hemorragia intensa; cesárea eletiva no termo. Sangramento intraoperatório: ocitocina, pontos hemostáticos, embolização de artérias uterinas/ilíaca interna e histerectomia nos casos refratários (histerectomia total no acretismo)',
        ],
      },
      {
        titulo: 'Descolamento prematuro de placenta',
        itens: [
          'Diagnóstico clínico → acionar equipe cirúrgica e resolver a gestação de modo imediato; a USG não deve retardar o tratamento',
          'Suporte clínico e hemodinâmico com monitorização materno-fetal contínua',
          'Via de parto definida entre emergencista e obstetra: se paciente estável e feto viável, parto pela via mais rápida; se houver cervicodilatação, amniotomia (reduz pressão intra-amniótica e a entrada de fatores de coagulação na circulação materna); se instabilidade materna, cesárea',
          'Anti-D se mãe Rh negativo',
        ],
      },
      {
        titulo: 'Manejo da CIVD / coagulopatia',
        itens: [
          'CIVD ocorre quando há >50% de separação placentária (presente em ~10% dos quadros com óbito fetal); fibrinogênio é o melhor marcador de gravidade',
          'Reposição de produtos de coagulação além de cristaloides e hemácias conforme indicado; buscar ativamente petéquias, equimoses e sinais clínicos de coagulopatia',
          'Resolução imediata da gestação é parte do controle do sangramento/coagulopatia',
        ],
      },
      {
        titulo: 'Vasa prévia',
        itens: [
          'Estabilização hemodinâmica se necessário e encaminhamento URGENTE ao obstetra para cesárea o mais rápido possível',
          'Evitar parto vaginal (agrava a rotura, a exsanguinação e a hipóxia fetal)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'FEBRASGO / USP (HC-FMUSP, 19ª ed., 2025)',
        texto:
          'Toda gestante com sangramento na 2ª metade da gestação deve ter hemograma, coagulograma e tipagem coletados e receber imunoglobulina anti-Rh se Rh negativo e ainda não tiver feito a profilaxia de 28 semanas. Na placenta prévia, o toque/especular estão contraindicados antes da USG, e a via transvaginal é segura para o diagnóstico.',
      },
      {
        diretriz: 'ABRAMEDE (Tratado de Medicina de Emergência, 1ª ed., 2024)',
        texto:
          'No DPP o diagnóstico é clínico (tríade: sangramento abrupto 78%, dor/dor lombar 66%, hipertonia 34%); a USG normal não exclui o diagnóstico. O fibrinogênio é o melhor preditor de gravidade, CIVD e necessidade transfusional. Corticoide para maturação pulmonar na PP entre 25-34 semanas; tocólise sem evidência suficiente.',
      },
    ],
  },
  {
    id: 'hemorragia-pos-parto',
    nome: 'Hemorragia pós-parto',
    secao: 'Gineco-obstétricas',
    cid10: ['O72.1'],
    sinonimos: ['HPP', 'atonia uterina', '4 T', 'uterotônico', 'ácido tranexâmico', 'ocitocina'],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 112; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      "Hemorragia pós-parto (HPP): sangramento >1.000 mL (ABRAMEDE) — ou >500 mL em parto normal (USP) — ou volumes menores associados a sinais de hipovolemia, em até 24 h após o parto. É a principal causa de morte materna e de histerectomia periparto no mundo. Atonia uterina responde por 70-80% dos casos. Quedas hematimétricas são tardias e alterações hemodinâmicas surgem após perda de 20-30% da volemia (1.500-2.000 mL); puérperas descompensam tardiamente. Conceito de 'hora de ouro': controlar o sítio hemorrágico precocemente. Nenhum exame é necessário para iniciar o tratamento.",
    fisiopatologia: [
      'Mnemônico dos 4 T para as etiologias: TÔNUS — atonia uterina (70-80% dos casos); TRAUMA — lacerações de canal de parto (mais comuns com fórceps/vácuo, mas também em parto não instrumentalizado), traumas cirúrgicos da cesárea e inversão uterina; TECIDO — retenção/restos placentários ou placentação anormal (placenta prévia, acreta, percreta); TROMBINA — coagulopatias, uso de anticoagulante, plaquetopenia, síndrome HELLP.',
      'Fatores de risco: sobredistensão uterina (gestação múltipla, macrossomia fetal, polidrâmnio), alterações placentárias (prévia, acretismo, DPP), coagulopatias, plaquetopenia, uso de anticoagulante, anemia materna e parto cesáreo.',
      'CIVD deve ser suspeitada precocemente (ex.: sangramento além do normal em sítios de acesso venoso); confirmada por coagulograma e fibrinogênio sérico, mas o tratamento não deve aguardar exames.',
    ],
    exames: [
      {
        titulo: 'Estimativa de perda sanguínea',
        itens: [
          'Diagnóstico clínico; parâmetros visuais/numéricos auxiliam (aspecto e peso das compressas: 1 g ≈ 1 mL de sangue).',
          'Quedas hematimétricas são tardias; repercussão hemodinâmica só após perda de 20-30% da volemia (1.500-2.000 mL).',
          'Shock Index (FC/PAS): >0,9 alta sensibilidade para choque; >1,4 alta correlação com necessidade de transfusão; >1,7 elevada especificidade para transfusão maciça.',
        ],
      },
      {
        titulo: 'Exame físico e laboratório',
        itens: [
          'Exame físico cuidadoso: flagrar lacerações de canal, hematoma, sinais de ruptura ou inversão uterina.',
          'Curagem manual + palpação uterina bimanual + USG à beira do leito: confirmam restos placentários, eversão e atonia.',
          'Coletar hemograma, coagulograma, fibrinogênio e tipagem sanguínea; nenhum exame é necessário para iniciar o tratamento.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Atonia uterina (tônus) — causa mais comum',
      'Lacerações de canal de parto / trauma cirúrgico (trauma)',
      'Inversão uterina (trauma)',
      'Retenção de restos placentários / placentação anormal — prévia, acreta, percreta (tecido)',
      'Coagulopatia / CIVD / síndrome HELLP (trombina)',
    ],
    conduta: [
      {
        titulo: 'Suporte inicial e medidas gerais',
        itens: [
          'Acionar equipe cirúrgica e o banco de sangue precocemente; ressuscitação volêmica com cristaloides.',
          'Profilaxia universal: 10 UI de ocitocina IM imediatamente após o parto (3ª fase).',
          'Iniciar hemoderivados precocemente quando indicado; considerar protocolo de transfusão maciça, sobretudo se Shock Index >1,4.',
        ],
      },
      {
        titulo: 'Ácido tranexâmico (TXA)',
        itens: [
          '1 g IV diluído em 100 mL de SF, infusão em 10-20 min (1 mL/min), o mais precoce possível e em até 3 h após o parto.',
          'Eficácia cai ~10% a cada 15 min de atraso; repetir 1 g se sangramento persistir após 30 min ou recidiva em até 24 h.',
          'Contraindicado em evento tromboembólico na gestação, histórico de coagulopatia, CIVD ativa ou hipersensibilidade.',
        ],
      },
      {
        titulo: 'Uterotônicos na atonia (escalonar)',
        itens: [
          'Ocitocina: 10 UI IM, ou 20-40 UI EV diluída em 1.000 mL de SF 0,9% em 60 min (infusão rápida causa hipotensão); início de ação EV ~1 min.',
          'Metilergometrina/ergometrina: 0,2 mg IM se sem resposta; pode repetir após 20 min; início 2-3 min; CONTRAINDICADA em hipertensas.',
          'Misoprostol (última linha): 800-1.000 mcg via retal, ou 600 mcg sublingual (ABRAMEDE) / 400 mcg sublingual (USP); início tardio ~30 min; evitar via intravaginal (removida pelo sangramento).',
          'Carbetocina: não consta nas fontes consultadas.',
        ],
      },
      {
        titulo: 'Medidas mecânicas e específicas',
        itens: [
          'Massagem do fundo uterino (globo de segurança de Pinard) com progressão imediata para massagem uterina bimanual — alta efetividade na hemostasia.',
          'Revisão do canal de parto com hemostasia e sutura de lacerações.',
          'Retenção de tecidos: curagem/curetagem uterina e limpeza da cavidade com compressa estéril.',
          'Inversão uterina: reposicionar o fundo (polegar contra os 4 dedos), empurrando até a posição anatômica.',
        ],
      },
      {
        titulo: 'Refratariedade — medidas invasivas/cirúrgicas',
        itens: [
          'Atonia sem resposta medicamentosa: balão de tamponamento intrauterino (BIU).',
          'Sutura de B-Lynch.',
          'Ligadura das artérias uterinas.',
          'Histerectomia em caso de HPP refratária.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'OMS / FEBRASGO (Alves et al., 2024)',
        texto:
          'Toda gestante deve receber 10 UI de ocitocina imediatamente após o parto; em suspeita de HPP, seguir com 1 g de TXA (diluído em 100 mL de SF, 1 mL/min) independentemente da etiologia, o mais precoce possível e em até 3 h — eficácia diminui ~10% a cada 15 min de atraso.',
      },
      {
        diretriz: 'USP/HC-FMUSP — Shock Index',
        texto:
          'Em puérperas, que descompensam tardiamente, o Shock Index (FC/PAS) >1,4 tem elevada correlação com necessidade de suporte transfusional e deve disparar a consideração de protocolo de transfusão maciça.',
      },
    ],
  },
  {
    id: 'pre-eclampsia',
    nome: 'Pré-eclâmpsia, eclâmpsia e síndrome HELLP',
    secao: 'Gineco-obstétricas',
    cid10: ['O14.9', 'O15.9'],
    sinonimos: [
      'pré-eclâmpsia',
      'eclâmpsia',
      'HELLP',
      'sulfato de magnésio',
      'DHEG',
      'hipertensão gestacional',
    ],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 110; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Síndromes hipertensivas da gestação englobam hipertensão gestacional, pré-eclâmpsia (PE), eclâmpsia e síndrome HELLP. Hipertensão na gestação = PA >=140 e/ou >=90 mmHg, após 20 semanas, em prévia normotensa. Pré-eclâmpsia = hipertensão após 20 semanas + proteinúria significativa OU lesão de órgão-alvo. Eclâmpsia = crise convulsiva tônico-clônica sobreposta à PE (da 20a semana até ~4-6 semanas pós-parto). HELLP = microangiopatia trombótica com Hemólise, Elevação de enzimas hepáticas e Plaquetopenia (5-10% das PE). A única cura é a resolução da gestação (saída da placenta). Pilares do manejo: controle da PA grave (PA >=160 e/ou >=110), profilaxia/tratamento de convulsão com sulfato de magnésio e definição do momento do parto conforme gravidade e idade gestacional. Configuram 10-15% das mortes maternas diretas no mundo (OMS).',
    fisiopatologia: [
      'Doença sistêmica multifatorial cujo eixo central é o acometimento vascular: vasoespasmo, isquemia e trombose levando a lesões de órgão-alvo.',
      'Placentação anormal: falha na remodelação das artérias espirais e invasão trofoblástica defeituosa -> artérias espirais permanecem estreitas -> hipoperfusão/hipóxia placentária.',
      'Isquemia placentária estimula liberação de fatores solúveis -> disfunção endotelial sistêmica materna e liberação de mediadores vasoativos -> vasoconstrição periférica.',
      'Desequilíbrio entre tromboxano e prostaciclinas favorece eventos trombóticos e hemólise microangiopática (trombocitopenia).',
      'Lesão de órgãos: necrose hepatocelular e edema por vasoespasmo/isquemia (disfunção hepática); má perfusão renal com queda da filtração glomerular (proteinúria, IRA); SNC com trombose, hemorragia microvascular, edema e hiperemia focal.',
      'A saída da placenta no pós-parto leva a melhora da PA, reforçando a placenta como fator determinante.',
    ],
    exames: [
      {
        titulo: 'Confirmação de hipertensão / proteinúria',
        itens: [
          'PA >=140 e/ou >=90 mmHg (não grave); PA >=160 e/ou >=110 mmHg confirmada em 2 ocasiões com intervalo de 15 min (grave).',
          'Proteinúria significativa: >=300 mg em urina de 24h.',
          'Relação proteína/creatinina (proteinúria/creatininúria) >=0,3 (mg/mg) em amostra isolada.',
          'Fita reagente (dipstick): pelo menos 1+ de proteína (positiva ~30 mg/dL) onde não há outros recursos.',
        ],
      },
      {
        titulo: 'Pesquisa de lesão de órgão-alvo / critérios de gravidade',
        itens: [
          'Plaquetas <100.000 (plaquetopenia).',
          'Creatinina >=1,1 mg/dL ou o dobro da basal; oligúria <500 mL/24h.',
          'Elevação de transaminases (AST/ALT) >=2x o limite superior da normalidade.',
          'Edema agudo de pulmão; sintomas visuais ou neurológicos; dor torácica.',
          'PE grave: PA >=160/110, iminência de eclâmpsia (cefaleia, dor epigástrica, distúrbios visuais), edema pulmonar, disfunção renal/hepática/hematológica.',
        ],
      },
      {
        titulo: 'Critérios laboratoriais da síndrome HELLP',
        itens: [
          'Hemólise: esquizócitos/equinócitos no sangue periférico e/ou DHL >600 U/L e/ou bilirrubina indireta >1,2 mg/dL.',
          'Enzimas hepáticas: elevação de AST e ALT acima de 2x o limite superior da normalidade.',
          'Plaquetopenia: plaquetas <100.000.',
          'Coagulograma (TP, TTPA, fibrinogênio) tipicamente normal na HELLP não complicada; vigiar CIVD.',
          'Dor em hipocôndrio direito/epigástrio sugere hematoma hepático subcapsular (risco de rotura) -> indicação de cesárea imediata.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Epilepsia / crise convulsiva de outras causas',
      'Acidente vascular cerebral e trombose venosa cerebral',
      'Encefalopatia hipertensiva',
      'Doenças infecciosas do SNC (meningite, encefalite)',
      'Púrpura trombocitopênica trombótica (PTT) e síndrome hemolítico-urêmica',
      'Intoxicações exógenas / abstinência',
      'Causas metabólicas: hipoglicemia, hipocalcemia, hiponatremia',
      'Gestação molar (se convulsão/PE antes de 20 semanas)',
    ],
    conduta: [
      {
        titulo: 'Sulfato de magnésio (MgSO4) - profilaxia e tratamento da convulsão',
        itens: [
          'Indicado em crise hipertensiva (PA >=160/100-110), pré-eclâmpsia grave e eclâmpsia; manter até 24h após o parto.',
          'Ataque (ambos esquemas): 4 g EV (bolus) lento, em 15-30 min (diluir 8 mL de MgSO4 50% em 12 mL de AD/SF = 4 g/20 mL).',
          'Esquema de Zuspan (EV exclusivo): manutenção 1 g/h EV em bomba de infusão contínua (diluir 10 mL de MgSO4 50% em 490 mL SF = 1 g/100 mL, a 100 mL/h).',
          'Esquema de Pritchard (EV + IM): ataque 4 g EV + 10 g IM (5 g em cada nádega); manutenção 5 g IM profundo a cada 4 horas.',
          'Insuficiência renal: reduzir ataque para 2 g EV e dosar magnésio sérico antes de aumentar a dose (excreção renal).',
        ],
      },
      {
        titulo: 'Monitorização e toxicidade do magnésio (antídoto)',
        itens: [
          'Reavaliar a cada 1h: reflexo patelar, frequência respiratória e diurese (deve ser >25 mL/h).',
          'Sinais de intoxicação: perda/abolição de reflexos, depressão respiratória; suspender a infusão e dosar magnesemia.',
          'Se Mg >8 mEq/L (9,6 mg/dL): manter suspenso e repetir níveis a cada 2h; reiniciar em menor dose quando Mg <7 mEq/L (8,4 mg/dL).',
          'Antídoto: gluconato de cálcio 1 g EV lento (em 2-4 min) na depressão respiratória; até 3 g se PCR ou comprometimento hemodinâmico grave.',
          'Função renal normal e sem sinais de toxicidade não exigem dosagem sérica de rotina.',
        ],
      },
      {
        titulo: 'Anti-hipertensivos na crise (PA >=160/110)',
        itens: [
          'Iniciar quando PA >=160/110 persistente >15 min; meta de redução inicial da PAM em ~20% (PAS 140-150, PAD 90-100), evitando quedas bruscas.',
          'Nifedipino (1a escolha FEBRASGO): 10 mg VO, repetir a cada 30 min se necessário; dose máxima 30 mg.',
          'Hidralazina: 5 mg EV, repetir 5-10 mg a cada 20 min; dose máxima 30 mg (maior risco de hipotensão materna e bradicardia fetal).',
          'Labetalol: 20 mg EV em bolus; se necessário 40 mg em 10 min e até duas doses de 80 mg a cada 10 min, até máximo de 220 mg. Evitar em asmáticas e ICC.',
          'Nitroprussiato de sódio: 0,25 até máximo 4 microg/kg/min EV contínuo, não usar por mais de 4 horas (refratários).',
          'Cautela com fluidos (risco de sobrecarga e edema agudo de pulmão).',
        ],
      },
      {
        titulo: 'Eclâmpsia (crise convulsiva) e refratariedade',
        itens: [
          'Monitorização contínua + MgSO4 (ataque 4 g EV e manutenção); tratar a PA e indicar parto de urgência.',
          'Reposição de fatores de coagulação e plaquetas se coagulopatia.',
          'Se convulsão persistir após o magnésio: lorazepam 2-4 mg EV (pode repetir 1x após 10-15 min); fenitoína 15-20 mg/kg EV (pode repetir 10 mg/kg após 20 min); ou levetiracetam 20-60 mg/kg (pode repetir em 12h).',
          'Benzodiazepínico reservado a estado de mal convulsivo.',
        ],
      },
      {
        titulo: 'Corticoide (maturação pulmonar / HELLP)',
        itens: [
          'Maturação pulmonar fetal entre IG >=24 e <34 semanas: betametasona 12 mg IM a cada 24h por 48h OU dexametasona 6 mg IM a cada 12h por 48h.',
          'Na HELLP: vigiar hematoma hepático subcapsular (dor em HCD/epigástrio) -> cesárea imediata; atento a CIVD e reposição de fatores.',
        ],
      },
      {
        titulo: 'Resolução da gestação e referenciamento',
        itens: [
          'Cura só ocorre com a retirada da placenta; decisão equilibra gravidade materna x idade gestacional.',
          'PE sem deterioração: aguardar o termo, com resolução orientada por volta de 37 semanas.',
          'PE grave / eclâmpsia / HELLP / deterioração clínica: indicar resolução (parto), de urgência na eclâmpsia.',
          'Toda PE deve ser hospitalizada (independente da gravidade), mantida em monitorização multiparamétrica e cardiofetal durante uso de MgSO4 e referenciada a serviço obstétrico terciário.',
          'Avaliação pelo obstetra para definição da via de parto (vaginal ou cesárea).',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'FEBRASGO - Pré-eclâmpsia (Série Orientações e Recomendações, N.8, 2017)',
        texto:
          'Droga de escolha para crise hipertensiva é a nifedipina oral; hidralazina é alternativa (maior risco de hipotensão materna e bradicardia fetal); nitroprussiato apenas em refratários, sem ultrapassar 4 microg/kg/min e por até 4 horas.',
      },
      {
        diretriz: 'OMS / ABRAMEDE',
        texto:
          'Sulfato de magnésio é superior a benzodiazepínicos e fenitoína na profilaxia de convulsões na PE grave/eclâmpsia; manter por até 24h após o parto. As síndromes hipertensivas respondem por 10-15% das mortes maternas diretas no mundo.',
      },
    ],
  },
  {
    id: 'emergencias-parto',
    nome: 'Emergências do trabalho de parto',
    secao: 'Gineco-obstétricas',
    sinonimos: [
      'parto',
      'distócia de ombro',
      'prolapso de cordão',
      'McRoberts',
      'parto pélvico',
      'parto precipitado',
    ],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 111; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Gestante em trabalho de parto pode chegar ao PS sem serviço de obstetrícia. O emergencista deve reconhecer o período expulsivo iminente, prestar assistência ao parto cefálico quando a transferência for inviável e estar preparado para as três emergências intraparto que ameaçam o binômio: distócia de ombro, prolapso de cordão umbilical e parto pélvico. Trabalho de parto = contrações rítmicas de 30-60 s, 2-3 a cada 10 min, com intensidade progressiva e dilatação cervical. Sinais de parto iminente (não tentar conter): puxo involuntário/sensação de evacuação, dilatação total (10 cm) e coroação/visualização do polo cefálico no introito. Reconheça também a apresentação pélvica e o cordão à frente da apresentação. O passo inicial em toda gestante de risco é solicitar ajuda do obstetra; a melhor assistência ao feto decorre da melhor assistência à gestante.',
    fisiopatologia: [
      'Período expulsivo (2ª fase): inicia-se com dilatação total do colo (10 cm) e termina com o desprendimento fetal; contrações intensas e frequentes com descida progressiva e necessidade natural de puxo. A maioria dos partos no PS é de apresentação cefálica.',
      'Distócia de ombro: ausência de desprendimento biacromial após o desprendimento cefálico por impactação do ombro anterior na sínfise púbica materna; fatores de risco — macrossomia fetal, diabetes e obesidade materna, período expulsivo prolongado (não previsível antes do TP). Sinal da tartaruga: o polo cefálico progride e recua entre contração e intervalo, face fetal pletórica e corpo não desprende após ~1 minuto. Risco materno (laceração, hemorragia) e fetal (lesão de plexo braquial, fratura de clavícula/úmero, hipoxemia, encefalopatia, óbito).',
      'Prolapso de cordão umbilical: a apresentação fetal não ocupa completamente o canal de parto e o cordão se posiciona à frente dela (procidência) ou lateralmente (laterocidência), com compressão e obstrução do fluxo uteroplacentário — emergência obstétrica com risco elevado de óbito fetal.',
      'Parto pélvico: nádegas/pernas não exercem efeito mecânico suficiente sobre o colo, dificultando dilatação e acomodação da cabeça; intervenção/tração precoce causa deflexão da cabeça e piora os desfechos. Incidência ~3-4% a termo, maior em pré-termo. RN de parto pélvico têm maior chance de necessitar de reanimação neonatal.',
    ],
    exames: [
      {
        titulo: 'Avaliação obstétrica à beira-leito',
        itens: [
          'História obstétrica e cartão de pré-natal: DUM, idade gestacional, paridade, intercorrências; estimar IG pela altura uterina se cartão/DUM ausentes (na cicatriz umbilical ≈ 20 sem; acima disso, AU em cm ≈ IG em semanas).',
          'Caracterizar contrações: duração, frequência e intensidade (diferenciar de Braxton-Hicks — não ritmadas, sem progressão, sem dilatação).',
          'Manobras de Leopold para situação e apresentação fetal (cefálica, pélvica ou córmica).',
          'Toque vaginal: dilatação, apresentação, integridade da bolsa; identificar coroação (parto iminente), partes fetais anômalas ou cordão à frente da apresentação. No pré-hospitalar evita-se o toque — observa-se genitália externa e saída de líquido/sangue.',
          'Escore de Malinas para decisão de transporte: < 5 remoção segura; 5-7 ponderar conforme distância; > 7 evitar remoção (parto provável a caminho).',
        ],
      },
      {
        titulo: 'Vitalidade fetal',
        itens: [
          'Ausculta intermitente do BCF (Doppler fetal/USG) sobre o dorso fetal; diferenciar do pulso materno. Normal 110-160 bpm.',
          'Frequência da ausculta: fase latente a cada 1 h; fase ativa a cada 15 min; período expulsivo a cada 5 min.',
          'Sinais de sofrimento fetal: bradicardia (< 100-110 bpm), perda de variabilidade, desacelerações tardias (insuficiência uteroplacentária) ou variáveis persistentes (compressão de cordão).',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Contrações de Braxton-Hicks (treinamento) vs. trabalho de parto verdadeiro.',
      'Dor abdominal por outras causas obstétricas: descolamento prematuro de placenta (dor lancinante, hipertonia uterina, sangramento escuro) e placenta prévia (sangramento vivo, indolor — não fazer toque/especular).',
      'Iminência de eclâmpsia/eclâmpsia em gestante com cefaleia, dor epigástrica, alterações visuais e PA elevada.',
      'Sangramento da segunda metade da gestação; afastar também causas não obstétricas de dor (apendicite, colecistite) — evitar viés de ancoragem.',
      'Sinais de alarme intraparto: prolapso/visualização de cordão, apresentação anômala (pélvica/córmica), sinal da tartaruga (distócia de ombro), bradicardia fetal abrupta, líquido meconial/sanguinolento, hemorragia.',
    ],
    conduta: [
      {
        titulo: 'Assistência ao parto cefálico no PS',
        itens: [
          'Identificar estágio do TP e avaliar transferência (Malinas); se período expulsivo iminente, preparar a equipe e o material: luvas estéreis, máscara, 2 pinças hemostáticas, tesoura, toalhas, material de sutura e equipamento de reanimação neonatal/berço aquecido.',
          'Posição confortável/litotomia; orientar sincronia de puxo na contração e relaxamento no intervalo.',
          'Na expulsão da cabeça: manobra de proteção do períneo com leve pressão occipital para evitar expulsão rápida e lacerações.',
          'Após sair a cabeça, palpar pescoço; se circular de cordão, passá-lo sobre a cabeça. Desprender ombro anterior (leve tração para baixo) e depois o posterior (tração para cima).',
          'Avaliar RN: se vias aéreas pérvias, respiração, tônus e cor adequados — aquecer e contato pele a pele, clampear o cordão após cessar a pulsação; se precisar de reanimação, clampear imediatamente.',
          'Após o nascimento: ocitocina 10 UI IM para profilaxia de hemorragia; aguardar dequitação espontânea (~30 min, tração leve do cordão, sem massagem para acelerar — risco de inversão); revisar canal de parto. Episiotomia não é rotineira — apenas casos selecionados (distócia de ombro, parto pélvico, macrossomia).',
        ],
      },
      {
        titulo: 'Distócia de ombro — sequência (mnemônico ALEERTA)',
        itens: [
          'A — Ajuda: chamar equipe e avisar a paciente. NÃO fazer tração excessiva no polo cefálico nem compressão do fundo uterino.',
          'L — Levantar as pernas: manobra de McRoberts (hiperflexão e abdução das coxas) para retificar a lordose lombar e ampliar o estreito pélvico.',
          'E — Externa: pressão suprapúbica (Rubin I) direcionada à região posteroinferior para desimpactar o ombro anterior da sínfise.',
          'E — Episiotomia ampla e esvaziamento vesical, para permitir as manobras internas.',
          'R — Retirar o braço posterior: manobra de Jacquemier (deslizar o antebraço posterior pela face anterior do tórax fetal), reduzindo o diâmetro biacromial.',
          'T — Toque/manobras internas de rotação: Rubin II (rotação pela escápula posterior, levando o feto de anteroposterior a oblíquo), Woods (acrescenta pressão na clavícula anterior) e Woods reversa (rotação em sentido inverso).',
          'A — Alterar a posição: genupeitoral / quatro apoios. Em ambiente hospitalar/anestesia pode-se tentar fratura intencional da clavícula anterior ou manobra de Zavanelli (relaxamento uterino + reposição cefálica e cesárea).',
        ],
      },
      {
        titulo: 'Prolapso de cordão umbilical',
        itens: [
          'Diagnóstico: cordão visível na vagina/introito, palpação de cordão pulsátil (bolsa íntegra) ou bradicardia fetal abrupta após rotura da bolsa.',
          'Elevar imediatamente a apresentação fetal com os dedos (indicador e médio) pelo toque vaginal para evitar compressão do cordão; manter a manobra até a resolução do parto.',
          'Posicionar a paciente em Trendelenburg, genupeitoral ou decúbito lateral contrário ao prolapso; sondagem vesical com enchimento de ~500-700 mL de salina para ajudar a manter a apresentação elevada.',
          'Orientar a mãe a NÃO fazer força nas contrações; considerar tocólise para inibir contrações. Manter o cordão umidificado e dentro da vagina, sem manipulação que cause espasmo.',
          'É indicação de cesárea de urgência. Se cesárea indisponível, tentar redução delicada do cordão para o útero e, se viável feto, ultimar o parto vaginal o mais rápido possível; se óbito/inviabilidade fetal, parto por via vaginal.',
        ],
      },
      {
        titulo: 'Parto pélvico (nota breve)',
        itens: [
          'Ambiente ideal é hospitalar; se atendido em período expulsivo, manejar de forma expectante — NÃO tracionar partes fetais (risco de deflexão da cabeça).',
          'Incentivar o esforço materno nas contrações; pode-se aplicar leve contrapressão sobre o polo pélvico para coordenar o desprendimento.',
          'Após exteriorização até a cicatriz umbilical: auxiliar a rotação do dorso fetal para anterior (voltado ao púbis); manobras de liberação dos membros (rotação 90°/180°) e manobra de Mauriceau/Bracht para o desprendimento cefálico (manter a cabeça fletida).',
          'Posição genupeitoral/quatro apoios pode facilitar. Preparar equipe e material de reanimação neonatal — maior chance de o RN precisar de reanimação.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Escore de Malinas (ABRAMEDE/USP)',
        texto:
          'Estima o tempo até o parto para decidir transporte: < 5 remoção segura; 5-7 ponderar conforme distância; > 7 evitar remoção (parto iminente) — se remover, levar médico e material de assistência ao parto.',
      },
      {
        diretriz: 'Episiotomia (ABRAMEDE)',
        texto:
          'Não é mais recomendada de rotina (risco de dor, hemorragia e infecção); reservada a casos selecionados como distócia de ombro, parto pélvico e macrossomia, com incisão mediolateral próxima ao momento do parto — evitar incisão na linha média posterior pelo risco de lesão do esfíncter anal.',
      },
      {
        diretriz: 'ACLS 2025 (USP) — contexto de PCR materna',
        texto:
          'Atualizações do ACLS 2025 deixaram de recomendar a lateralização uterina à esquerda, com foco em compressões eficazes; a regra dos 4 minutos para indicar a histerotomia de reanimação também saiu do protocolo, passando a indicação a ser individualizada.',
      },
    ],
  },
  {
    id: 'infeccao-puerperal',
    nome: 'Infecção puerperal e sepse obstétrica',
    secao: 'Gineco-obstétricas',
    cid10: ['O85'],
    sinonimos: ['endometrite puerperal', 'febre puerperal', 'sepse obstétrica', 'aborto séptico'],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 112; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Infecção puerperal / sepse obstétrica. Febre puerperal: temperatura >38°C após as primeiras 24h pós-parto (duração 2-10 dias) ou >39°C nas primeiras 24h. Sepse puerperal: temperatura >38°C desde a rotura das membranas até 42 dias pós-parto, com dor pélvica, corrimento anormal ou atraso na involução uterina. A endometrite puerperal (EP) é a apresentação mais comum, decorre da ascensão de microrganismos da vagina/colo para a cavidade uterina após rotura de membranas e costuma ser polimicrobiana. A sepse é uma das cinco principais causas de morte materna (10-15% dos óbitos puerperais; maior causa de óbito pós-abortamento). EP é ~10x mais frequente após parto cesáreo do que vaginal. Conduta-chave: antibioticoterapia empírica de amplo espectro, EV, precoce, sem aguardar culturas.',
    fisiopatologia: [
      'Endometrite: ascensão de microrganismos da vagina e colo uterino para a cavidade uterina (habitualmente asséptica) após a rotura das membranas; inflamação endometrial (microabscessos e invasão neutrofílica) no sítio de implantação placentária, na episiotomia/laceração ou na cicatriz de cesariana.',
      'Infecção tipicamente polimicrobiana (aeróbios e anaeróbios do trato genitourinário).',
      'Agentes: aeróbios (Streptococcus dos grupos A e B, Staphylococcus aureus e epidermidis, E. coli, Klebsiella, Enterococcus, Proteus, Gardnerella); anaeróbios (Peptostreptococcus, Peptococcus, Bacteroides, Prevotella, Clostridium); facultativos/outros (Mycoplasma, Neisseria gonorrhoeae, Chlamydia).',
      'Endometrite por Streptococcus do grupo A pode cursar com diarreia e evoluir para sepse, síndrome do choque tóxico ou fasciíte necrotizante.',
      'Fatores de risco maternos: parto cesáreo (~10x), comorbidades (diabetes, anemia), imunodeficiência, obesidade, infecção vaginal não tratada, idade avançada, pré-natal precário, higiene precária, tabagismo.',
      'Fatores intra/pós-parto: parto vaginal instrumentalizado, amniorrexe ou trabalho de parto prolongado, toques vaginais frequentes, manipulação/exploração uterina, retenção placentária, corioamnionite, hematoma/hemorragia pós-parto, lacerações.',
    ],
    exames: [
      {
        titulo: 'Laboratório / sepse',
        itens: [
          'Hemograma (leucocitose reforça suspeita, embora inespecífica), provas inflamatórias (PCR, VHS), eletrólitos.',
          'Hemocultura — colher antes do antibiótico, mas sem atrasá-lo (crescimento positivo em apenas ~3% das febris no puerpério).',
          'Componentes do SOFA para pesquisa de disfunções orgânicas.',
          'Urina 1 e urocultura; avaliação microscópica da secreção vaginal (diagnósticos diferenciais).',
        ],
      },
      {
        titulo: 'Imagem e culturas',
        itens: [
          'Exames de imagem são pouco específicos na EP (aumento da cavidade uterina, líquido/gás endometrial também ocorrem no puerpério fisiológico).',
          'Cultura endometrial ou de colo NÃO indicada (alta contaminação, resultado tardio, não altera o tratamento).',
          'Radiografia de tórax se suspeita de pneumonia.',
          'Se não responsiva à terapia inicial: investigar abscesso pélvico e tromboflebite pélvica séptica.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pielonefrite',
      'Apendicite',
      'Pneumonia',
      'Doença inflamatória pélvica (DIP) — relação estreita com EP',
      'Abscesso pélvico (não resposta ao tratamento inicial)',
      'Tromboflebite pélvica séptica (incidência ~1/3.000 partos)',
      'Mastite / abscesso mamário',
      'Sepse / choque séptico de outro foco',
    ],
    conduta: [
      {
        titulo: 'Endometrite puerperal — internação e antibiótico EV precoce',
        itens: [
          'Internar pacientes com dor abdominal, febre >38°C e FC >90 bpm; antibioticoterapia de amplo espectro, EV, precoce, por no mínimo 24-48h após o último pico febril.',
          'Esquema FEBRASGO 1: ampicilina-sulbactam 3 g EV 6/6h + gentamicina 180-240 mg 1x/dia (ou amicacina 1 g 1x/dia).',
          'Esquema FEBRASGO 2: clindamicina 600 mg EV 6/6h (ou metronidazol 500 mg EV 8/8h) + gentamicina 180-240 mg 1x/dia (ou amicacina 1 g 1x/dia).',
          'Atenção: aminoglicosídeos — risco de nefro e ototoxicidade; gentamicina também hepatotoxicidade.',
          'Hemocultura não deve atrasar o antibiótico empírico; seus resultados podem orientar ajuste e duração posteriormente.',
          'Notificar imediatamente a pediatria se patógeno identificado, para atenção ao recém-nascido.',
        ],
      },
      {
        titulo: 'Não resposta ao tratamento inicial',
        itens: [
          'Reavaliar: investigar abscesso pélvico, tromboflebite pélvica séptica e necessidade de ajuste do antibiótico.',
          'Tromboflebite pélvica séptica: teste terapêutico com heparina não fracionada (ataque 5.000 UI, seguido de 700-2.000 UI/h conforme TTPA); atenção a sangramento e trombocitopenia.',
        ],
      },
      {
        titulo: 'Sepse na gestante/puérpera — particularidades',
        itens: [
          'Abordagem do paciente grave; lembrar que a melhor assistência materna garante a melhor assistência fetal.',
          'Antibiótico de amplo espectro precoce (não atrasar por culturas) é prioritário; sepse é uma das principais causas de morte materna.',
          'Sinais de choque são tardios na gestante/puérpera (tolera perda de até ~30% da volemia); usar o Shock Index (FC/PAS): >0,9 sensível para choque, >1,4 alta correlação com necessidade transfusional no puerpério.',
          'Posicionar em decúbito lateral esquerdo para evitar compressão da veia cava pelo útero gravídico; cautela com fluidos se pré-eclâmpsia associada (risco de edema agudo de pulmão).',
        ],
      },
      {
        titulo: 'Sepse / infecção pós-abortamento (aborto séptico)',
        itens: [
          'Colher hemocultura e iniciar antibiótico de largo espectro precoce, com cobertura para clamídia, gonococo, estreptococos, Gram-negativos e anaeróbios.',
          'Opção 1: cefoxitina 2 g EV 6/6h + doxiciclina 100 mg VO 12/12h.',
          'Opção 2: clindamicina 900 mg EV 8/8h + gentamicina 3-5 mg/kg EV 1x/dia, por 10-14 dias.',
          'Avaliação obstétrica para definir momento ideal da curetagem/esvaziamento uterino.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'FEBRASGO (endometrite puerperal)',
        texto:
          'Dois esquemas empíricos iniciais: ampicilina-sulbactam + gentamicina/amicacina, OU clindamicina/metronidazol + gentamicina/amicacina; EV, por pelo menos 24-48h após o último pico febril.',
      },
      {
        diretriz: 'Karsnitz / ABRAMEDE (definições de febre e sepse puerperal)',
        texto:
          'Febre puerperal: >38°C após 24h pós-parto (2-10 dias) ou >39°C nas primeiras 24h. Sepse puerperal: >38°C da rotura das membranas até 42 dias, com dor pélvica, corrimento anormal ou atraso na involução uterina. EP ~10x mais frequente após cesárea.',
      },
      {
        diretriz: 'CDC (DIP) / ABRAMEDE',
        texto:
          'VHS/PCR elevados, leucorreia anormal, leucocitose na secreção vaginal, temperatura >38°C e/ou crescimento de N. gonorrhoeae ou C. trachomatis aumentam a especificidade diagnóstica da DIP, condição relacionada à EP.',
      },
    ],
  },
  {
    id: 'dor-pelvica-torcao',
    nome: 'Dor pélvica aguda: torção anexial e cisto ovariano roto',
    secao: 'Gineco-obstétricas',
    cid10: ['N83.5', 'N83.2'],
    sinonimos: [
      'torção ovariana',
      'torção anexial',
      'cisto ovariano roto',
      'hemoperitônio',
      'dor pélvica',
    ],
    capitulo: 114,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 106; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 114',
    resumo:
      'Dor pélvica aguda (<3 meses) é queixa feminina frequente no PS, com diagnóstico diferencial amplo (ginecológico e não ginecológico). A prioridade é identificar emergências cirúrgicas com sangramento intracavitário (gravidez ectópica rota, cisto ovariano hemático roto com hemoperitônio) e urgências que ameaçam a fertilidade (torção anexial/ovariana e DIP). β-hCG é obrigatório em toda mulher em idade reprodutiva, e a ultrassonografia abdominal/transvaginal é o exame de imagem de primeira escolha. A torção anexial é a torção do ovário e de parte da trompa ao redor do pedículo vascular, com comprometimento vascular parcial ou completo — emergência cirúrgica tempo-dependente pelo risco de perda do anexo e infertilidade. O cisto ovariano roto pode ser simples (manejo conservador) ou hemorrágico (risco de hemoperitônio e instabilidade).',
    fisiopatologia: [
      'Torção anexial: torção do ovário e de parte da trompa uterina ao redor do pedículo vascular, levando a comprometimento vascular parcial ou completo (isquemia tempo-dependente).',
      'Fator de risco principal da torção: lesão ovariana subjacente (cisto ou tumor) que aumenta o volume/peso do anexo; pode ocorrer sem patologia ovariana por hipermobilidade do ovário.',
      'Primeiro trimestre de gravidez é período de risco aumentado de torção ovariana (cerca de 25% de todos os casos de torção).',
      'Cistos ovarianos são achado comum na pré-menopausa e geralmente não causam dor intensa, exceto se sofrerem hemorragia ou ruptura.',
      'Cisto roto/hemorrágico: o aumento da vascularização ovariana na fase lútea favorece hemorragia ou ruptura; a ruptura de cisto hemático pode evoluir com hemoperitônio e choque hemorrágico.',
      'Mittelschmerz: dor unilateral fisiológica na ovulação por ruptura do folículo, autolimitada em poucas horas, às vezes com pequena quantidade de líquido livre na pelve — não requer atenção médica significativa.',
    ],
    exames: [
      {
        titulo: 'β-hCG e laboratório',
        itens: [
          'β-hCG (qualitativo ou quantitativo) SEMPRE em mulher em idade reprodutiva — o estado de gravidez é a determinação mais importante.',
          'Hemograma, proteína C reativa (PCR) e exame de urina (urina 1).',
          'Reserva de hemoderivados e tipagem sanguínea se suspeita de sangramento/hemoperitônio.',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'Ultrassonografia transvaginal e transabdominal: primeira escolha na dor pélvica de causa ginecológica.',
          'Torção anexial: ultrassonografia com Doppler é a modalidade de escolha na emergência (avalia fluxo no pedículo).',
          'Cisto roto: USG/TC identificam o cisto; cistos simples são hipointensos em T1 e hiperintensos em T2; cisto hemorrágico tem alta intensidade em T1 e sinal intermediário/baixo em T2 (RM).',
          'TC de abdome e pelve com contraste venoso: nos achados ultrassonográficos inconclusivos ou quando há dúvida diagnóstica (ex.: diferencial com apendicite).',
          'FAST na sala vermelha em paciente hemodinamicamente instável, para identificar líquido livre (hemoperitônio).',
          'Líquido livre >1,5 mL no fundo de saco ou em local diferente do fundo de saco indica investigação adicional com TC.',
          'RM da pelve: opção em gestantes, crianças e suspeita de gravidez, ou quando US/TC são inconclusivas.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Gravidez ectópica (rota: cavum vazio, massa extrauterina, hemoperitônio, choque) — excluir com β-hCG e USG transvaginal; saco gestacional deve ser visível com β-hCG >1.500 mIU/mL.',
      'Doença inflamatória pélvica (DIP) — dor à mobilização do colo, sensibilidade uterina/anexial; risco à fertilidade.',
      'Cisto ovariano roto (simples vs hemorrágico) e Mittelschmerz (fisiológico).',
      'Degeneração ou torção de mioma uterino.',
      'Endometriose (dor tipicamente cíclica).',
      'Apendicite aguda — diferencial importante com torção/afecção anexial à direita (US sensibilidade 75-90% vs TC 87-98%).',
      'Causas urológicas: cálculo (ureterolitíase), pielonefrite, cistite.',
      'Outras GI: diverticulite, ileíte (Crohn), apendagite epiploica; e causas vasculares (aneurisma de aorta/ilíaca, trombose).',
      'Pós-menopausa: considerar neoplasias malignas de ovário e útero.',
    ],
    conduta: [
      {
        titulo: 'Avaliação inicial e estabilização',
        itens: [
          'Avaliar estabilidade hemodinâmica (pulso, PA sistólica, FR) — prioridade no atendimento.',
          'Solicitar β-hCG, hemograma, PCR, urina; exame ginecológico bimanual (mobilização do colo, sensibilidade uterina/anexial).',
          'Analgesia adequada conforme escala da OMS (degrau 1: dipirona/paracetamol/AINE; degrau 2: opioide fraco; degrau 3: opioide forte).',
          'Em instabilidade hemodinâmica: FAST; se positivo, hemoperitônio é indicação de cirurgia de emergência.',
        ],
      },
      {
        titulo: 'Torção anexial / torção de cisto de ovário',
        itens: [
          'Após diagnóstico clínico e/ou de imagem (USG com Doppler), encaminhar para tratamento cirúrgico de URGÊNCIA.',
          'Emergência tempo-dependente — o objetivo é preservar o anexo e evitar infertilidade.',
          'Acionar equipe cirúrgica/ginecológica precocemente; não retardar a conduta aguardando confirmação completa.',
        ],
      },
      {
        titulo: 'Cisto ovariano roto',
        itens: [
          'Cisto roto com líquido livre na cavidade abdominal: encaminhar para avaliação da cirurgia de emergência (pode estar com sangramento por ruptura).',
          'Priorizar coleta de sangue e reserva de hemoderivados.',
          'Em choque hipovolêmico: iniciar protocolo de ressuscitação volêmica e acionar cirurgia de emergência.',
          'Paciente estável com cisto simples roto: manejo conservador com analgesia e observação.',
        ],
      },
      {
        titulo: 'Encaminhamento e diferenciais cirúrgicos',
        itens: [
          'Gravidez ectópica com líquido livre: avaliar como possível ruptura — cirurgia de emergência, reserva de hemoderivados.',
          'Apendicite confirmada: acionar cirurgia geral; pode-se iniciar amoxicilina-clavulanato 1 g IV no PS.',
          'Hérnia inguinal/femoral estrangulada ou obstrução intestinal: encaminhar à cirurgia de emergência.',
          'DIP: encaminhar à ginecologia/cirurgia; iniciar terapia presuntiva em mulher sexualmente ativa com sensibilidade cervical, uterina ou anexial ao toque.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE 2024 (cap. Dor pélvica ginecológica)',
        texto:
          'USG com Doppler é a modalidade de imagem de escolha na emergência para torção ovariana. Torção anexial e torção de cisto de ovário têm indicação de tratamento cirúrgico de urgência pelo risco de infertilidade. Em instabilidade hemodinâmica, FAST positivo (hemoperitônio) é indicação de cirurgia de emergência; priorizar reserva de hemoderivados e ressuscitação volêmica.',
      },
      {
        diretriz: 'USP/HC-FMUSP 2025 (cap. 114 — Emergências ginecológicas)',
        texto:
          'A USG transvaginal é a imagem de primeira linha na dor pélvica; ajuda a confirmar ou afastar diferenciais como gravidez ectópica, torção ovariana e cisto de ovário hemorrágico. Teste de gravidez deve sempre integrar a avaliação da mulher em idade fértil; TC de abdome quando diagnósticos cirúrgicos (ex.: apendicite) não puderem ser excluídos.',
      },
    ],
  },
  {
    id: 'dip',
    nome: 'Doença inflamatória pélvica (DIP)',
    secao: 'Gineco-obstétricas',
    cid10: ['N73.9'],
    sinonimos: ['DIP', 'DIPA', 'salpingite', 'abscesso tubo-ovariano', 'clamídia', 'gonococo'],
    capitulo: 114,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 106; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 114',
    resumo:
      'Doença inflamatória pélvica aguda (DIP/DIPA): infecção ascendente do trato genital superior (endometrite, salpingite, ooforite, parametrite, abscesso tubo-ovariano, peritonite pélvica). É a infecção grave mais comum em mulheres sexualmente ativas de 16-25 anos. Etiologia polimicrobiana — N. gonorrhoeae e C. trachomatis são os agentes mais associados, com anaeróbios e outros. Diagnóstico clínico com limiar baixo: iniciar tratamento empírico em mulher sexualmente ativa com dor pélvica + sensibilidade uterina, anexial ou à mobilização cervical (sensibilidade >95%). Principal causa de morte é a ruptura de abscesso tubo-ovariano (mortalidade 5-10%). Sequelas: infertilidade, gravidez ectópica e dor pélvica crônica.',
    fisiopatologia: [
      'Infecção sexualmente transmissível ascendente, geralmente por via vaginal, que envolve endométrio, trompas, ovários e peritônio. Espectro: endometrite, salpingite, miometrite, parametrite, ooforite, abscesso tubo-ovariano; pode estender-se a periapendicite, peritonite pélvica e peri-hepatite (síndrome de Fitz-Hugh-Curtis).',
      'Agentes: etiologia polimicrobiana. N. gonorrhoeae e C. trachomatis são os mais frequentemente identificados; participam também anaeróbios e outros microrganismos da flora vaginal.',
      'Fatores de risco: múltiplas parcerias sexuais (4+ em 6 meses: risco 3-4x), história de IST ou DIP, DIP prévia (25% de recorrência), duchas vaginais, abuso sexual, idade 15-25 anos e vulnerabilidade socioeconômica.',
      'DIU: o risco de DIP é cerca de 6x maior nos primeiros 20-30 dias após a inserção (sobretudo com vaginite/cervicite não tratada); após esse período a incidência iguala a da população geral.',
      'Quadro frequentemente leve, oligossintomático ou subclínico (até ~60% dos casos), o que retarda o diagnóstico — a duração dos sintomas é fator de risco independente para infertilidade.',
    ],
    exames: [
      {
        titulo: 'Avaliação clínica',
        itens: [
          'β-hCG obrigatório em toda mulher em idade fértil (afastar gravidez/ectópica).',
          'Exame ginecológico bimanual e especular: dor à mobilização cervical, sensibilidade uterina e anexial; pesquisar corrimento purulento e massa pélvica (alerta para abscesso tubo-ovariano).',
          'Hipersensibilidade anexial isolada tem sensibilidade ~95%; febre + sensibilidade anexial + VHS elevado são preditores independentes de endometrite.',
        ],
      },
      {
        titulo: 'Critérios diagnósticos (USP/MS)',
        itens: [
          'Diagnóstico: 3 critérios MAIORES + 1 MENOR; ou 1 critério ELABORADO.',
          'Maiores: dor à palpação anexial; dor à mobilização do colo uterino; dor pélvica/hipogástrica.',
          'Menores: febre; secreção genital purulenta; massa pélvica; leucocitose; elevação de PCR ou VHS; documentação de infecção por Chlamydia ou Neisseria.',
          'Elaborados: endometrite à histologia; imagem mostrando abscesso tubo-ovariano; documentação laparoscópica/laparotômica de DIPA.',
        ],
      },
      {
        titulo: 'Critérios CDC (ABRAMEDE)',
        itens: [
          'Iniciar terapia presuntiva em mulher sexualmente ativa com dor pélvica inexplicável + ≥1 dos critérios mínimos: sensibilidade uterina, anexial OU cervical ao toque (sensibilidade >95%).',
          'Critérios adicionais (apoiam, não obrigatórios): febre >38,3°C; corrimento vaginal anormal; leucócitos na microscopia do fluido vaginal; VHS elevado; PCR elevado; infecção cervical por N. gonorrhoeae ou C. trachomatis.',
        ],
      },
      {
        titulo: 'Laboratório e imagem',
        itens: [
          'Hemograma, PCR, VHS; urina 1 (positivo não exclui DIP — leucocitúria por inflamação pélvica contígua).',
          'Microscopia da secreção vaginal; PCR para C. trachomatis e N. gonorrhoeae; sorologias HIV e sífilis.',
          'USG pélvica/transvaginal: indicada se piora ou ausência de melhora em 48-72h, ou suspeita de abscesso tubo-ovariano/gravidade. Achados: espessamento tubário >5 mm com líquido, líquido livre pélvico, massas anexiais complexas (abscesso).',
          'TC de abdome se apendicite ou outro diagnóstico cirúrgico não puder ser excluído. RM mais sensível/específica (S 95%, E 89%), mas geralmente desnecessária.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Gravidez ectópica',
      'Cisto ovariano roto/hemorrágico e torção ovariana',
      'Cervicite',
      'Endometriose',
      'Aborto espontâneo ou séptico',
      'Apendicite aguda',
      'Diverticulite',
      'Colecistite / gastroenterite',
      'Pielonefrite e cólica renal (ureterolitíase)',
      'Outras IST (herpes, sífilis, HPV)',
    ],
    conduta: [
      {
        titulo: 'Medidas gerais',
        itens: [
          'Limiar baixo para iniciar tratamento empírico — diagnóstico e tratamento precoces reduzem risco de infertilidade.',
          'Analgesia (AINEs são muito eficazes na dor pélvica), antitérmico e reposição volêmica em caso de náuseas/vômitos, desidratação ou toxemia.',
          'Antibioticoterapia empírica de amplo espectro cobrindo gonococo, clamídia e anaeróbios.',
          'Tratar a(s) parceria(s) sexual(is) e rastrear/tratar outras IST. Abstinência sexual até 1 semana após o término do tratamento.',
          'Reavaliar em 72h (ambulatorial: idealmente reavaliar em 72h após início dos antibióticos VO, se possível em serviço de ginecologia).',
        ],
      },
      {
        titulo: 'Esquema ambulatorial (DIP leve a moderada)',
        itens: [
          '1ª opção: Ceftriaxona 500 mg IM dose única + Doxiciclina 100 mg VO 12/12h por 14 dias + Metronidazol 250 mg, 2 cp, VO 12/12h por 14 dias.',
          '2ª opção: Cefotaxima 500 mg IM dose única + Doxiciclina 100 mg VO 12/12h por 14 dias + Metronidazol 250 mg, 2 cp, VO 12/12h por 14 dias.',
          'Doxiciclina é contraindicada na gravidez. O metronidazol pode ser descontinuado/omitido em casos leves a moderados conforme avaliação (menor relevância da cobertura anaeróbia em casos não graves).',
          'Orientar não usar álcool durante e por 24h após o metronidazol (efeito dissulfiram/antabuse).',
        ],
      },
      {
        titulo: 'Esquema hospitalar (parenteral)',
        itens: [
          '1ª opção: Ceftriaxona 1 g IV 1x/dia por 14 dias + Doxiciclina 100 mg VO 12/12h por 14 dias + Metronidazol 400 mg IV 12/12h.',
          '2ª opção: Clindamicina 900 mg IV 8/8h (3x/dia) por 14 dias + Gentamicina 3-5 mg/kg/dia IV ou IM por 14 dias (pode ser fracionada em 2-3x/dia).',
          '3ª opção: Ampicilina/sulbactam 3 g IV 6/6h (4x/dia) por 14 dias + Doxiciclina 100 mg VO 12/12h por 14 dias.',
          'Via parenteral pode ser suspensa 24h após cessarem os sintomas, mantendo a antibioticoterapia VO até completar 14 dias.',
        ],
      },
      {
        titulo: 'Critérios de internação',
        itens: [
          'Ausência de melhora clínica em 72h de tratamento ambulatorial.',
          'Pacientes gravemente doentes: febre alta (>39°C), náuseas/vômitos incoercíveis, hipotensão, dor abdominal de difícil controle.',
          'Impossibilidade de uso ou tolerância de medicação oral.',
          'Gravidez ou suspeita de gravidez.',
          'Presença de abscesso tubo-ovariano.',
          'Suspeita de condição cirúrgica ou impossibilidade de afastar diagnóstico diferencial (ex.: apendicite); indicação de tratamento cirúrgico.',
        ],
      },
      {
        titulo: 'Abscesso tubo-ovariano',
        itens: [
          'Principal causa de morte na DIP (ruptura: mortalidade 5-10%); relatado em até 1/3 das internadas.',
          '60-80% resolvem só com antibióticos. Manter terapia VO com clindamicina 600 mg VO 4x/dia OU metronidazol + doxiciclina (cobertura anaeróbia) por 14 dias.',
          'Sem melhora em 72h: reavaliar para drenagem percutânea guiada por TC/US, drenagem laparoscópica, colpotomia posterior (culdoscopia) ou cirurgia.',
          'Abscessos ≥9 cm têm maior probabilidade de necessitar cirurgia. Pessoas vivendo com HIV têm maior risco de abscesso tubo-ovariano.',
        ],
      },
      {
        titulo: 'DIU',
        itens: [
          'CDC: não há evidência para recomendar a remoção do DIU antes do tratamento — o dispositivo geralmente não é a fonte da infecção. Recomendação é manter o DIU.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'CDC (Workowski et al., STI Treatment Guidelines)',
        texto:
          'Terapia presuntiva para DIP em mulher sexualmente ativa com dor pélvica inexplicável + ≥1 critério mínimo (sensibilidade uterina, anexial ou cervical ao toque), sensibilidade >95%. Objetivo: prevenir infertilidade, dor pélvica crônica e gravidez ectópica. Não remover o DIU rotineiramente antes do tratamento.',
      },
      {
        diretriz: 'Ministério da Saúde — PCDT IST (2020/2022)',
        texto:
          'Esquemas ambulatorial (ceftriaxona/cefotaxima + doxiciclina + metronidazol) e hospitalar (ceftriaxona + doxiciclina + metronidazol; clindamicina + gentamicina; ampicilina/sulbactam + doxiciclina), por 14 dias. Doxiciclina contraindicada na gravidez; metronidazol opcional em casos leves a moderados.',
      },
    ],
  },
  {
    id: 'sangramento-uterino-anormal',
    nome: 'Sangramento uterino anormal (não gestante)',
    secao: 'Gineco-obstétricas',
    cid10: ['N93.9', 'N92.1'],
    sinonimos: ['SUA', 'PALM-COEIN', 'menorragia', 'metrorragia', 'ácido tranexâmico'],
    capitulo: 114,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 108; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 114',
    resumo:
      'Sangramento uterino anormal (SUA) na não gestante é a causa da maioria dos sangramentos vaginais no PS (~3% das queixas). A prioridade no DE não é o diagnóstico etiológico, mas determinar a estabilidade hemodinâmica: abordar como vítima potencialmente grave (ABCDE), pois a paciente instável comporta-se como choque hemorrágico. β-hCG é obrigatório em toda mulher em idade fértil para afastar gestação. Classificação etiológica FIGO PALM-COEIN. Sangramento agudo grave/instável exige ressuscitação imediata + ginecologia de urgência; estáveis podem ter alta com seguimento ambulatorial após afastar anemia grave.',
    fisiopatologia: [
      'Ciclo normal: frequência 24-38 dias, duração 2-7 dias, volume 5-80 mL; qualquer variação caracteriza SUA (termos como menorragia/metrorragia foram abandonados). Pode ser agudo, crônico ou crônico agudizado.',
      'Classificação FIGO PALM-COEIN. Causas ESTRUTURAIS (PALM): Pólipos, Adenomiose, Leiomiomas, Malignidade. Causas NÃO estruturais (COEIN): Coagulopatias, disfunção Ovulatória, Endometriais, Iatrogênicas, Não classificadas.',
      'Sangramento agudo gera mais instabilidade que o crônico (não houve tempo de redistribuição/hemodiluição). No crônico há restauração da volemia com plasma: Hb e CaO2 caem, podendo haver síndrome anêmica (taquicardia/taquipneia) sem sinais macro-hemodinâmicos de choque.',
      'Causas variam com a idade: na adolescência predominam anovulação e coagulopatias (causas estruturais incomuns); no menacma, complicações da gestação; na perimenopausa, anovulação; na pós-menopausa, atrofia endometrial — mas sempre investigar câncer de endométrio.',
      'Até 20% das mulheres com sangramento intenso desde a menarca têm coagulopatia subjacente, sendo a doença de von Willebrand a mais comum. Doses omitidas de anticoncepcional são causa frequente de sangramento.',
    ],
    exames: [
      {
        titulo: 'Sempre (paciente estável)',
        itens: [
          'β-hCG (qualitativo ou quantitativo) / teste imunológico de gravidez — OBRIGATÓRIO em toda mulher em idade fértil para afastar gestação',
          'Hemograma completo (anemia, plaquetopenia)',
          'Coagulograma: TAP e TTPa — solicitar se suspeita de coagulopatia por história/exame',
        ],
      },
      {
        titulo: 'Acrescentar se instabilidade hemodinâmica',
        itens: [
          'Tipagem sanguínea e prova cruzada',
          'Gasometria com lactato',
          'Função renal; Na+, K+, Ca2+',
          'Fibrinogênio',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'USG transvaginal — exame de 1ª linha; obrigatória se gestação confirmada/suspeita (tópica ou ectópica) e na suspeita de causa estrutural (PALM). Avalia útero, endométrio, miomas, cistos, massas anexiais',
          'Pode ser de emergência ou adiada para ambulatório conforme achados do exame físico',
          'TC apenas para dor abdominal/pélvica aguda e exclusão de causas não ginecológicas; RM para estudo de múltiplos miomas/adenomiose/estadiamento',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Gestação e suas complicações (sempre afastar com β-hCG) — causa mais comum de sangramento no menacma',
      'Causas estruturais uterinas (PALM): pólipos, adenomiose, leiomioma, hiperplasia/carcinoma de endométrio',
      'Coagulopatias (von Willebrand, deficiência de fator XI), uso de hormônios exógenos e fármacos que interferem na hemostasia',
      'Sangramento de origem NÃO uterina: vulva, vagina (lacerações de coito — laceração de fundo de saco pode levar a choque hemorrágico —, corpo estranho, ISTs), cérvix (cervicite, neoplasia), ovário/tuba (DIP)',
      'Sangramentos não ginecológicos: urinário e gastrointestinal (hematúria, hematoquezia)',
      'Pós-menopausa: sempre afastar câncer de endométrio (atrofia é a causa mais comum, mas é diagnóstico de exclusão)',
    ],
    conduta: [
      {
        titulo: 'Paciente INSTÁVEL / hemorragia grave',
        itens: [
          'Ressuscitação imediata + avaliação ginecológica de URGÊNCIA; tratar como choque hemorrágico',
          'Acesso venoso calibroso; cristaloide se depleção intravascular (uso limitado, preferir hemocomponentes)',
          'Transfusão de sangue se instável OU Hb < 7 g/dL; corrigir coagulopatias subjacentes; prevenir hipotermia',
          'Estrogênio conjugado EV em altas doses = terapia de escolha na hemorragia grave instável (CONTRAINDICADO se história de doença cardiovascular, cerebrovascular ou TEV). OBS: estrogênio EV indisponível no Brasil',
          'Na prática (BR): ácido tranexâmico EV + AINE EV é a medicação de escolha no paciente instável',
        ],
      },
      {
        titulo: 'Medicamentos hemostáticos (base do tratamento)',
        itens: [
          'Ácido tranexâmico: 500-1.000 mg VO ou EV a cada 6-8h; dose máxima 3,9 g/dia (superior a placebo, AINE e progesterona oral na redução do sangramento)',
          'AINE (vasoconstrição uterina + analgesia; reduz sangramento ~40%): cetoprofeno 100 mg VO/EV 12/12h OU naproxeno 500 mg VO 12/12h. Evitar uso > 5-7 dias (risco renal/gástrico); ineficaz/contraproducente na doença de von Willebrand',
        ],
      },
      {
        titulo: 'Terapia hormonal (estáveis ou manutenção)',
        itens: [
          'ACO combinado (30 mcg EE): 1 cp 3x/dia até parar o sangramento (mín. 2 dias), depois 1 cp/dia por 3-6 semanas',
          'Progestágeno isolado (preferir se contraindicação ao estrogênio): medroxiprogesterona 1 cp 6/6h até parar; ou noretisterona 1 cp 12/12h por 2-7 dias seguida de 1 cp/dia',
          'Megestrol 60-120 mg/dia até parar (mín. 2 dias), depois 20-40 mg/dia por 3-6 semanas',
          'Doença de von Willebrand: antifibrinolíticos, ACO, DIU de levonorgestrel 52 mg; DDAVP (estimula liberação de fator VIII e FvW)',
        ],
      },
      {
        titulo: 'Falha do tratamento clínico / medidas mecânicas e cirúrgicas',
        itens: [
          'Tamponamento com balão uterino (Bakri; ou sonda Foley/compressas se indisponível) — NÃO usar > 24h (risco de síndrome do choque tóxico). USP NÃO recomenda tamponamento vaginal de rotina (esconde perda e aumenta infecção)',
          'Curetagem (dilatação e curetagem): método cirúrgico mais rápido para estancar sangramento intenso, mas não definitivo — útil em instável com falha medicamentosa',
          'Embolização de artéria uterina; histeroscopia',
          'Histerectomia: último recurso em sangramento severo/recorrente ou potencialmente fatal sem resposta às demais medidas',
        ],
      },
      {
        titulo: 'Disposição',
        itens: [
          'Internar todo sangramento importante/não controlado para observação, transfusão e possível cirurgia, com avaliação da ginecologia',
          'Maioria recebe alta com encaminhamento ambulatorial à ginecologia após afastar anemia grave',
          'Encaminhar para amostragem endometrial se > 45 anos ou fatores de risco para câncer de endométrio (obesidade, nuliparidade, anovulação, tamoxifeno, infertilidade, história familiar)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'FIGO / FEBRASGO — PALM-COEIN',
        texto:
          'Classificação FIGO do SUA na não gestante (PALM = causas estruturais; COEIN = não estruturais) é o padrão; termos antigos (menorragia, metrorragia, oligomenorreia) devem ser abandonados.',
      },
      {
        diretriz:
          'ACOG Committee Opinion no. 557 (Management of acute AUB in nonpregnant reproductive-aged women)',
        texto:
          'Base do manejo do SUA agudo: estrogênio EV em altas doses é a 1ª escolha na hemorragia grave instável (contraindicado se doença cardiovascular/cerebrovascular ou TEV); hormônios são o pilar do tratamento.',
      },
      {
        diretriz: 'Cochrane 2018 (antifibrinolíticos)',
        texto:
          'Ácido tranexâmico superior a placebo, AINE e progesterona oral na redução do sangramento menstrual intenso; liberado pelo FDA em 2009 para esse uso. Dose 500-1.000 mg VO/EV 6-8/8h, máx. 3,9 g/dia.',
      },
      {
        diretriz: 'Cochrane 2013/2019 (AINEs)',
        texto:
          'AINEs reduzem o sangramento menstrual em ~40% por vasoconstrição uterina e redução de prostaglandinas, com benefício analgésico; sem diferença de eficácia entre eles.',
      },
    ],
  },
  {
    id: 'trauma-gestacao',
    nome: 'Trauma na gestação',
    secao: 'Gineco-obstétricas',
    sinonimos: [
      'trauma na gestante',
      'cesárea perimortem',
      'Kleihauer-Betke',
      'deslocamento uterino',
      'DPP traumático',
    ],
    capitulo: 115,
    fonte:
      'ABRAMEDE — Tratado de Medicina de Emergência (Manole, 2024), cap. 23; e Medicina de Emergência — Abordagem Prática (USP/HC-FMUSP, 19ª ed.), cap. 115',
    resumo:
      'Trauma é a principal causa de mortalidade materna não obstétrica. As alterações fisiológicas da gestação mascaram a hemorragia: a gestante tolera perda de até 30% da volemia (~2.000 mL) antes de exibir hipotensão, e a alteração da FC fetal pode ser o primeiro sinal de hemorragia materna. Princípio central: a melhor assistência ao feto é a melhor assistência à mãe — avalie e estabilize a MÃE PRIMEIRO (ABCDE/ATLS), depois o feto. A partir de ~20 semanas (fundo uterino na cicatriz umbilical), faça deslocamento uterino à esquerda para liberar a veia cava. Acima de 23-24 semanas (feto viável), monitorização fetal por cardiotocografia. Suspeite sempre de descolamento prematuro de placenta (DPP), a principal complicação traumática, mesmo após trauma leve.',
    fisiopatologia: [
      'Cardiovascular: ↑FC (15-20 bpm no 3º tri), ↑volume plasmático e débito cardíaco (até 45%), ↓PA no 2º tri (PAS 5-10 / PAD 10-15 mmHg). Hipotensão e taquicardia são tardias — perda de ~2.000 mL (até 30% da volemia) antes de descompensar. Anemia fisiológica por hemodiluição (Hb cai p/ 10-11 g/dL).',
      'Compressão aorto-cava: após 20 semanas o útero comprime a veia cava em supino, ↓retorno venoso 10-30%. Corrigir com decúbito lateral esquerdo a 20-30° OU deslocamento uterino manual à esquerda (mandatório no atendimento).',
      'Respiratório: via aérea edemaciada e difícil (sempre considerar via aérea difícil); ↓capacidade residual funcional e ↑consumo de O2 → dessatura rápido (menor tolerância à apneia). Elevação diafragmática ~4 cm e alargamento do tórax. Alcalose respiratória fisiológica (pCO2 ~30 mmHg, HCO3 18-21).',
      'Coagulação: estado de hipercoagulabilidade (↑fibrinogênio 400-600 mg/dL, ↑fatores) → alto risco tromboembólico. Fibrinogênio é o melhor preditor de coagulopatia/gravidade do choque.',
      'Gastrointestinal: hipotonia e relaxamento do esfíncter esofágico → alto risco de aspiração (estômago cheio).',
      'Útero-placentário: fluxo é proporcional à PA materna e SEM autorregulação — muito sensível a vasopressores e à hipovolemia; o feto pode ser sacrificado para manter a PA materna. DPP e ruptura uterina podem causar exsanguinação oculta sem sangramento externo.',
    ],
    exames: [
      {
        titulo: 'Imagem / POCUS',
        itens: [
          'E-FAST: exame de escolha para líquido livre, hemotórax e pneumotórax — não retardar por gestação.',
          'USG obstétrico: idade gestacional, localização placentária (excluir placenta prévia antes de toque/especular se >23 sem com sangramento), FC/ritmo fetal, líquido livre. BAIXA sensibilidade p/ DPP (50-80% dos DPP traumáticos não são vistos).',
          'Não evitar exames necessários por radiação: limite fetal ~50 mGy / 5 rad; TC de crânio, tórax e RX estão muito abaixo. RM é segura, mas NÃO usar gadolínio.',
          'BCF: normal 110-160 bpm; <120 bpm sugere sofrimento fetal e pode ser marcador precoce de hipovolemia materna.',
        ],
      },
      {
        titulo: 'Cardiotocografia (CTG)',
        itens: [
          'Mais sensível que a USG para DPP e bem-estar fetal. Realizar em toda gestante >20 semanas, após estabilização materna, idealmente em até 6 h da admissão.',
          'Monitorizar por no mínimo 4 h; liberar se contrações ausentes ou <1/15 min. Estender para 24 h se: sensibilidade/dor uterina, sangramento vaginal, >1 contração/15 min, RPMO, cinemática grave, taquicardia materna, traçado fetal anormal ou fibrinogênio <200 mg/dL.',
          'Taquissistolia (≥6 contrações/h) é preditor de DPP. Traçado normal + exame físico normal têm VPN de 100% p/ desfecho fetal adverso.',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'Gasometria, hemograma, coagulograma, TIPAGEM SANGUÍNEA (sempre, mesmo sem choque aparente), lactato e FIBRINOGÊNIO (melhor preditor; <200 mg/dL = VPP 100% p/ gravidade).',
          'Alvos: Hb >8 g/dL, plaquetas >50.000, fibrinogênio >200 mg/dL, TP/KTTP <1,5x controle.',
          'Teste de Kleihauer-Betke (KB): quantifica a hemoglobina fetal na circulação materna. ACOG recomenda em TODA gestante com trauma e >12 semanas — orienta a necessidade de dose ADICIONAL de imunoglobulina anti-D e prediz parto prematuro.',
          'Lembrar: leucocitose (até 20.000) e fosfatase alcalina elevada (2x) são fisiológicas na gestação.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Descolamento prematuro de placenta (DPP) — principal: dor abdominal aguda/lancinante, hipertonia/sensibilidade uterina, ≥3 contrações/h, sangramento (pode ser oculto). Presente em até 40% dos acidentes de carro graves e 3% dos traumas leves.',
      'Ruptura uterina — rara (<1%), grave: choque, contorno uterino irregular, partes fetais palpáveis, mudança abrupta da FC fetal; mortalidade fetal quase universal → cesárea de emergência.',
      'Trabalho de parto prematuro — risco 2x; contrações ocasionais ocorrem em 40% e resolvem em 90% sem dano.',
      'Ruptura prematura de membranas (teste de nitrazina / ferning — cuidado com falso-positivo por sangue no trauma).',
      'Hemorragia materno-fetal (oculta) — ocorre em 10-30% dos traumas com lesão placentária.',
      'Embolia por líquido amniótico e lesão fetal direta (raras); útero de Couvelaire (associado a CIVD, hipotensão, IRA).',
    ],
    conduta: [
      {
        titulo: 'A — Via aérea',
        itens: [
          'Considerar SEMPRE via aérea difícil: tubo menor (nº 6-7), videolaringoscópio e bougie disponíveis, material de via aérea cirúrgica à mão.',
          'Pré-oxigenação e oxigenação apneica otimizadas (dessatura rápido); posição em rampa/sniffing; alto risco de aspiração (Sellick opcional, sem atrapalhar a visão).',
          'ISR: indutores sem contraindicação absoluta — etomidato/propofol; preferir CETAMINA se instável/hipovolêmica. Bloqueadores (rocurônio 0,9-1,6 mg/kg ou succinilcolina) atravessam pouco a placenta.',
        ],
      },
      {
        titulo: 'B — Respiração',
        itens: [
          'Manter SatO2 >95% (PaO2 >70). Alvo de EtCO2 30-32 mmHg — evitar alcalose/hipocapnia (vasoconstrição uterina) e hipercapnia (acidose fetal). PaCO2 35-40 pode já indicar ventilação inadequada.',
          'Se drenar tórax: a punção/dreno deve ser 1-2 espaços ACIMA do habitual (acima do 4º EIC) pela elevação diafragmática.',
        ],
      },
      {
        titulo: 'C — Circulação e choque',
        itens: [
          'Deslocamento uterino à esquerda (manual ou coxim no quadril direito 30°) se >20 semanas — MANDATÓRIO.',
          '2 acessos calibrosos (14-16G) em MMSS (evitar MMII pela congestão pélvica). Cristaloide 20-30 mL/kg guiado por PA, FC, enchimento capilar, diurese, lactato e traçado fetal.',
          'EVITAR hipotensão permissiva clássica — deletéria ao feto (ressuscitar mais perto do normal, com CTG). Transfusão maciça 1:1:1 e O negativo se instável; ácido tranexâmico conforme protocolo de trauma.',
          'Vasopressores ↓perfusão útero-placentária — priorizar volume; se necessário na peri-intubação, fenilefrina/efedrina. Bicarbonato com cautela.',
          'Gestação NÃO contraindica laparotomia.',
        ],
      },
      {
        titulo: 'Imunoglobulina anti-D (Rh negativo)',
        itens: [
          'Toda gestante Rh negativo com trauma e risco de hemorragia materno-fetal (especialmente trauma abdominal contuso, com ou sem DPP) deve receber.',
          'Dose padrão 300 mcg IM (protege ~30 mL de sangue fetal). No 1º trimestre alguns serviços usam 50 mcg. Em trauma abdominal pode haver >30 mL fetal → dose adicional guiada pelo teste de Kleihauer-Betke.',
          'Janela: até 72 h do trauma (pode ser feita tardiamente, com menor eficácia).',
        ],
      },
      {
        titulo: 'Conduta obstétrica e DPP',
        itens: [
          'DPP com feto vivo e viável → parto IMEDIATO (evita morte fetal e consumo de fatores de coagulação/CIVD). DPP grave: descolamento geralmente >50%; 20% cursam com CIVD.',
          'Indicações de cesárea de emergência: feto viável (>23 sem) com perda do bem-estar fetal, ruptura uterina irreparável, hemorragia maciça/choque, instabilidade materna por limitação mecânica uterina, lesão toracolombar instável.',
          'Tocólise: se trabalho de parto prematuro com mãe estável, MgSO4 é o tocolítico de escolha (6 g IV em 20 min, depois 2 g/h, máx 48 h). Corticoide/MgSO4 para o feto se prematuridade provável — mas NUNCA postergar o parto necessário.',
        ],
      },
      {
        titulo: 'Cesárea perimortem (histerotomia ressuscitativa)',
        itens: [
          'É uma medida de REANIMAÇÃO MATERNA (alivia compressão aorto-cava e melhora o retorno da circulação). Indicada na PCR de gestante com útero ≥ cicatriz umbilical (>20 sem).',
          'Regra dos 4 minutos: iniciar até 4 min de PCR sem RCE, com nascimento por volta do 5º minuto — a sobrevida materna e fetal cai drasticamente após esse tempo. Sobrevida fetal ~70%.',
          'Realizar NO LOCAL da PCR, sem transporte ao centro cirúrgico; incisão vertical mediana; manter RCP durante todo o procedimento. Reanimação neonatal simultânea se feto viável (>24 sem).',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACLS 2025 (AHA) — PCR na gestante',
        texto:
          'O ACLS 2025 NÃO recomenda mais a lateralização rotineira do útero para descompressão aorto-cava — o foco passa a ser compressões torácicas de alta qualidade independentemente do posicionamento. (Obs.: o ATLS/ressuscitação no TRAUMA mantém o deslocamento uterino manual à esquerda na gestante que NÃO está em PCR, >20 sem.)',
      },
      {
        diretriz: 'ACLS 2025 (AHA) — tempo da cesárea perimortem',
        texto:
          "A recomendação de realizar a cesárea de emergência se não houver RCE em 4 minutos saiu do protocolo do ACLS: não há evidência definindo o tempo ideal e a indicação passa a ser individualizada. A 'regra dos 4 minutos' permanece como referência prática clássica e ainda é citada na literatura de trauma (ABRAMEDE).",
      },
      {
        diretriz: 'ACOG — Kleihauer-Betke',
        texto:
          'O ACOG recomenda o teste de Kleihauer-Betke em toda gestante vítima de trauma com >12 semanas para detectar hemorragia materno-fetal (frequentemente subclínica) e ajustar a dose de imunoglobulina anti-D.',
      },
      {
        diretriz: 'SOGC 2015 (Canadá) — monitorização',
        texto:
          'Monitorização cardiotocográfica por no mínimo 4 h, estendida a 24 h em pacientes de alto risco (dor/sensibilidade uterina, sangramento, >1 contração/15 min, RPMO, cinemática grave, taquicardia materna, traçado fetal anormal, fibrinogênio <200 mg/dL).',
      },
    ],
  },
  {
    id: 'pcr-acls',
    nome: 'Parada cardiorrespiratória (RCP / ACLS)',
    secao: 'Cardiovasculares',
    cid10: ['I46.9'],
    sinonimos: [
      'PCR',
      'parada cardíaca',
      'RCP',
      'reanimação cardiopulmonar',
      'ACLS',
      'BLS',
      'FV',
      'TV sem pulso',
      'AESP',
      'assistolia',
      'desfibrilação',
      'adrenalina',
      '5H5T',
    ],
    fonte:
      'AHA Guidelines for CPR & ECC 2020 (com foco em atualizações 2023) e ABRAMEDE — Suporte Avançado de Vida',
    resumo:
      'Cessação súbita da circulação e/ou respiração. A sobrevida depende da "corrente de sobrevivência": reconhecimento e acionamento precoces, RCP de alta qualidade, desfibrilação imediata dos ritmos chocáveis e cuidados pós-PCR. A prioridade é compressão torácica de qualidade com mínima interrupção e, nos ritmos chocáveis (FV/TV sem pulso), desfibrilação o mais rápido possível.',
    fisiopatologia: [
      'A interrupção do fluxo sanguíneo cessa a oferta de O₂ aos órgãos; o cérebro tolera apenas alguns minutos de isquemia antes de lesão irreversível.',
      'Ritmos chocáveis (FV e TV sem pulso) decorrem de instabilidade elétrica (mais comum a isquemia/IAM) e respondem à desfibrilação; ritmos não chocáveis (AESP e assistolia) costumam refletir uma causa de base (as 5H e 5T) e têm pior prognóstico.',
      'A RCP de qualidade gera ~20–30% do débito normal — suficiente para retardar a lesão até a restauração da circulação espontânea (RCE). Interrupções e compressões rasas reduzem drasticamente a pressão de perfusão coronariana.',
    ],
    exames: [
      {
        titulo: 'Durante a parada',
        itens: [
          'Monitor/pás: identificar ritmo (chocável × não chocável) é a decisão imediata',
          'Capnografia (EtCO₂): confirma posição do tubo, mede a qualidade da RCP (alvo > 10–20 mmHg) e sinaliza RCE (alta súbita do EtCO₂)',
          'POCUS na pausa do pulso: tamponamento, TEP (VD dilatado), hipovolemia, pneumotórax — não atrasar as compressões',
        ],
      },
      {
        titulo: 'Causas reversíveis — 5H e 5T',
        itens: [
          '5H: Hipovolemia, Hipóxia, H⁺ (acidose), Hipo/Hipercalemia, Hipotermia',
          '5T: Tensão no tórax (pneumotórax hipertensivo), Tamponamento, Toxinas, Trombose pulmonar (TEP), Trombose coronariana (IAM)',
          'Glicemia, gasometria com eletrólitos e lactato guiam a correção',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Síncope / pré-síncope (com pulso presente)',
      'Bradiarritmia/taquiarritmia grave com pulso',
      'Estados de baixo fluxo que simulam ausência de pulso (avaliar com POCUS)',
    ],
    conduta: [
      {
        titulo: 'BLS — RCP de alta qualidade',
        itens: [
          'Compressões: 100–120/min, profundidade 5–6 cm, retorno torácico completo, mínima interrupção (fração de compressão > 60%)',
          'Relação 30:2 sem via aérea avançada; com via aérea avançada, compressões contínuas + 1 ventilação a cada 6 s (10/min)',
          'Desfibrilar FV/TVSP assim que o DEA/desfibrilador chegar; revezar o compressor a cada 2 min',
        ],
      },
      {
        titulo: 'ACLS — ritmos chocáveis (FV / TV sem pulso)',
        itens: [
          'Choque imediato (bifásico 120–200 J) → retomar RCP por 2 min → checar ritmo',
          'Adrenalina 1 mg IV/IO a cada 3–5 min após o 2º choque',
          'Antiarrítmico após o 3º choque: amiodarona 300 mg (2ª dose 150 mg) ou lidocaína 1–1,5 mg/kg',
        ],
      },
      {
        titulo: 'ACLS — ritmos não chocáveis (AESP / assistolia)',
        itens: [
          'NÃO desfibrilar; RCP contínua + adrenalina 1 mg IV/IO o quanto antes, repetida a cada 3–5 min',
          'Buscar e tratar ativamente as causas reversíveis (5H/5T)',
          'Confirmar assistolia (checar derivação/ganho/contato dos eletrodos)',
        ],
      },
      {
        titulo: 'Pós-PCR (após RCE)',
        itens: [
          'ECG de 12 derivações: se IAMCSST → cateterismo/ICP de urgência',
          'Alvos: SatO₂ 92–98% (evitar hiperóxia), normocapnia, PAM ≥ 65 mmHg',
          'Controle direcionado de temperatura (32–37,5 °C) em coma pós-parada; tratar a causa de base',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AHA 2020 / atualização 2023',
        texto:
          'Reforço da adrenalina precoce nos ritmos não chocáveis. Controle direcionado de temperatura substitui a "hipotermia terapêutica" fixa (alvo 32–37,5 °C). Ênfase em capnografia para qualidade da RCP e detecção de RCE, e em recuperação/reabilitação após a alta.',
      },
    ],
  },
  {
    id: 'endocardite-infecciosa',
    nome: 'Endocardite infecciosa',
    secao: 'Cardiovasculares',
    cid10: ['I33.0'],
    sinonimos: [
      'endocardite',
      'EI',
      'vegetação',
      'Duke',
      'critérios de Duke',
      'hemocultura',
      'prótese valvar',
      'Staphylococcus aureus',
      'Streptococcus',
      'Osler',
      'Janeway',
    ],
    fonte: 'ESC 2023 (Endocardite Infecciosa) e ABRAMEDE; critérios de Duke modificados (2023)',
    resumo:
      'Infecção do endocárdio/valvas (nativas ou protéticas), em geral bacteriana. Suspeite em febre + sopro novo/agravado, fenômenos embólicos ou imunológicos, sobretudo em valvopatas, próteses, usuários de drogas IV e portadores de dispositivos. Diagnóstico pelos critérios de Duke (hemoculturas + ecocardiograma). A demora no antibiótico e na indicação cirúrgica aumenta a mortalidade.',
    fisiopatologia: [
      'Lesão/turbulência endotelial forma trombo de fibrina-plaquetas (endocardite trombótica não bacteriana); na bacteremia, microrganismos aderem e formam a vegetação.',
      'Agentes: S. aureus (o mais frequente, curso agudo), estreptococos do grupo viridans (subagudo, valva nativa), enterococos, estafilococos coagulase-negativos (prótese precoce); HACEK e fungos são menos comuns.',
      'Complicações: destruição valvar (insuficiência aguda e IC), embolia séptica (SNC, baço, rins, pulmão), abscesso perivalvar com bloqueio AV, e fenômenos imunomediados (glomerulonefrite).',
    ],
    exames: [
      {
        titulo: 'Critérios de Duke modificados',
        itens: [
          'Maiores: hemoculturas positivas (germe típico em ≥ 2 frascos, ou ≥ 3 frascos se atípico) + imagem positiva (eco com vegetação/abscesso/deiscência de prótese; PET-CT/TC em prótese)',
          'Menores: predisposição (valvopatia, droga IV), febre ≥ 38 °C, fenômenos vasculares (Janeway, embolia) e imunológicos (Osler, Roth, GN), microbiologia que não preenche critério maior',
          'Definida: 2 maiores, ou 1 maior + 3 menores, ou 5 menores',
        ],
      },
      {
        titulo: 'Exames-chave',
        itens: [
          'Hemoculturas: ≥ 3 conjuntos ANTES do antibiótico (Duke 2023 dispensa a exigência de sítios diferentes/intervalo; não atrasar em sepse)',
          'Ecocardiograma transtorácico inicial; transesofágico (ETE) se ETT negativo/inconclusivo, prótese ou alta suspeita',
          'Hemograma, PCR, função renal, EAS (hematúria); ECG seriado (PR longo sugere abscesso perivalvar)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Outras causas de febre + sopro (febre reumática, mixoma atrial)',
      'Bacteremia/sepse de outro foco',
      'Endocardite trombótica não bacteriana (neoplasia, LES — Libman-Sacks)',
      'Vasculites e doenças do colágeno',
    ],
    conduta: [
      {
        titulo: 'Antibioticoterapia',
        itens: [
          'Empírica após hemoculturas — valva nativa: ampicilina + (oxacilina/cefazolina) + gentamicina, ou vancomicina conforme risco de MRSA',
          'Prótese: vancomicina + gentamicina + rifampicina (cobrir estafilococo coagulase-negativo)',
          'Ajustar pelo antibiograma; duração de 4–6 semanas (IV), em geral mais longa na prótese',
        ],
      },
      {
        titulo: 'Cirurgia (precoce quando indicada)',
        itens: [
          'IC por disfunção valvar aguda (principal indicação)',
          'Infecção não controlada (abscesso, vegetação crescente, germe resistente/fúngico)',
          'Prevenção de embolia: vegetação > 10 mm com evento embólico, ou > 10 mm com outra indicação',
        ],
      },
      {
        titulo: 'Equipe e profilaxia',
        itens: [
          '"Endocarditis team" (cardiologia, cirurgia, infectologia) melhora desfecho',
          'Profilaxia antibiótica antes de procedimentos dentários invasivos só nos de ALTO risco (prótese, EI prévia, cardiopatia congênita cianótica)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC 2023',
        texto:
          'Incorpora TC cardíaca, PET-CT com FDG e SPECT na imagem diagnóstica (sobretudo prótese e dispositivos). Em casos selecionados, estáveis e com germe sensível, parte do tratamento pode ser feita com antibiótico ORAL após estabilização (estudo POET) e/ou em regime ambulatorial.',
      },
    ],
  },
  {
    id: 'miocardite-aguda',
    nome: 'Miocardite aguda',
    secao: 'Cardiovasculares',
    cid10: ['I40.9'],
    sinonimos: [
      'miocardite',
      'miopericardite',
      'troponina',
      'ressonância cardíaca',
      'Lake Louise',
      'cardiomiopatia inflamatória',
      'miocardite fulminante',
    ],
    fonte: 'ESC (Working Group on Myocardial and Pericardial Diseases) e ABRAMEDE',
    resumo:
      'Inflamação do miocárdio, em geral viral/pós-viral, com apresentação muito variável: dor torácica com troponina elevada e coronárias normais, IC aguda de início recente, arritmias ou morte súbita. A forma fulminante cursa com choque cardiogênico. A ressonância cardíaca (critérios de Lake Louise) é o exame não invasivo de referência.',
    fisiopatologia: [
      'Lesão miocárdica por agressão direta (vírus — antes enterovírus/adenovírus, hoje também parvovírus B19, HHV-6, SARS-CoV-2) e por resposta imune (autoimune/celular) que perpetua a inflamação.',
      'Pode haver edema, necrose de miócitos e disfunção sistólica; a inflamação que atinge o pericárdio caracteriza a miopericardite.',
      'Outras causas: fármacos e hipersensibilidade (inibidores de checkpoint imunológico), doenças sistêmicas (sarcoidose, células gigantes) e toxinas.',
    ],
    exames: [
      {
        titulo: 'Laboratório e ECG',
        itens: [
          'Troponina elevada (lesão miocárdica); BNP/NT-proBNP se IC; PCR/VHS',
          'ECG: alterações inespecíficas de ST-T, supra difuso (se miopericardite), arritmias e distúrbios de condução',
          'Marcadores virais têm baixo rendimento — não retardar a conduta',
        ],
      },
      {
        titulo: 'Imagem e referência',
        itens: [
          'Ecocardiograma: disfunção segmentar/global, derrame; afasta outras causas',
          'Coronariografia ou angio-TC para EXCLUIR síndrome coronariana (diferencial obrigatório quando há troponina elevada)',
          'Ressonância cardíaca (Lake Louise): edema + realce tardio não isquêmico confirma; biópsia endomiocárdica reservada a casos graves/refratários (suspeita de células gigantes/sarcoidose)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Síndrome coronariana aguda (IAM com coronárias normais — MINOCA)',
      'Takotsubo (cardiomiopatia de estresse)',
      'Pericardite isolada',
      'Sepse/choque de outra etiologia; miocardiopatias',
    ],
    conduta: [
      {
        titulo: 'Suporte (base do tratamento)',
        itens: [
          'Tratamento da IC conforme diretriz (IECA/BRA, betabloqueador, diurético quando estável)',
          'Monitorização de ritmo (risco de arritmia); restrição de exercício por 3–6 meses',
          'AINE são desencorajados na miocardite (podem piorar) — diferente da pericardite isolada',
        ],
      },
      {
        titulo: 'Formas graves / fulminante',
        itens: [
          'Choque cardiogênico: UTI, inotrópico/vasopressor e suporte circulatório mecânico precoce (BIA, Impella, ECMO) como ponte à recuperação',
          'Imunossupressão em etiologias específicas comprovadas (células gigantes, sarcoidose, autoimune); corticoide na miocardite por inibidor de checkpoint',
          'Transferência para centro com suporte avançado quando instável',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ESC — atualização dos critérios de Lake Louise (2018)',
        texto:
          'A RM cardíaca passou a combinar critério de edema (T2) com critério de lesão não isquêmica (realce tardio/T1/ECV), aumentando a acurácia diagnóstica. Miocardite por inibidores de checkpoint imunológico ganhou destaque pela alta letalidade e resposta a corticoide em altas doses.',
      },
    ],
  },
  {
    id: 'choque-cardiogenico',
    nome: 'Choque cardiogênico',
    secao: 'Cardiovasculares',
    cid10: ['R57.0'],
    sinonimos: [
      'choque cardiogênico',
      'SCAI',
      'estágios SCAI',
      'IAM com choque',
      'baixo débito',
      'inotrópico',
      'balão intra-aórtico',
      'ECMO',
      'Impella',
    ],
    fonte: 'SCAI (estadiamento do choque cardiogênico, 2019/2022), ESC e ABRAMEDE',
    resumo:
      'Hipoperfusão tecidual por falência primária da bomba cardíaca, apesar de volemia adequada. Causa mais comum: IAM (sobretudo de VE). Definição prática: PAS < 90 mmHg (ou necessidade de vasopressor) + sinais de hipoperfusão (oligúria, confusão, extremidades frias, lactato elevado). Mortalidade alta; o resultado depende de reperfusão precoce na causa isquêmica e de suporte hemodinâmico bem indicado.',
    fisiopatologia: [
      'A queda do débito cardíaco reduz a perfusão sistêmica e coronariana, gerando um ciclo vicioso: isquemia → pior contratilidade → mais hipotensão.',
      'A congestão retrógrada causa edema pulmonar (VE) ou congestão sistêmica/IC direita (VD — atenção ao IAM de VD, pré-carga dependente).',
      'Causas: IAM e suas complicações mecânicas (CIV, ruptura de músculo papilar/parede livre), miocardite fulminante, valvopatia aguda, arritmias, TEP maciço e descompensação de IC avançada.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico e gravidade',
        itens: [
          'Lactato seriado e SvcO₂ (perfusão); função renal e hepática (lesão de órgão-alvo)',
          'ECG e troponina (IAM como causa); ecocardiograma/POCUS: função de VE/VD, complicações mecânicas, volemia',
          'Estágios SCAI (A "em risco" → E "extremo"): orientam intensidade do suporte e prognóstico',
        ],
      },
      {
        titulo: 'Monitorização',
        itens: [
          'PA invasiva, débito urinário, monitor contínuo',
          'Cateter de artéria pulmonar (Swan-Ganz) em casos selecionados/refratários para guiar terapia',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Choque distributivo (séptico/anafilático — DC alto, extremidades quentes)',
      'Choque hipovolêmico/hemorrágico',
      'Choque obstrutivo (tamponamento, TEP, pneumotórax hipertensivo)',
      'Choque misto',
    ],
    conduta: [
      {
        titulo: 'Tratar a causa',
        itens: [
          'IAM: reperfusão de URGÊNCIA (ICP preferencial) — o fator que mais muda o prognóstico',
          'Complicações mecânicas, valvopatia aguda e tamponamento: correção cirúrgica/drenagem',
          'Arritmia como causa: cardioversão/controle; TEP maciço: trombólise/embolectomia',
        ],
      },
      {
        titulo: 'Suporte hemodinâmico',
        itens: [
          'Volume com cautela (evitar se congestão); no IAM de VD, otimizar pré-carga',
          'Vasopressor: noradrenalina é o de escolha; inotrópico (dobutamina) para baixo débito',
          'Suporte circulatório mecânico (Impella, ECMO veno-arterial; BIA selecionado) como ponte à recuperação/decisão em casos refratários',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'SCAI 2019/2022 e estudos de suporte mecânico',
        texto:
          'O estadiamento SCAI (A–E) padronizou a comunicação da gravidade e correlaciona-se com mortalidade. O balão intra-aórtico (BIA) NÃO reduziu mortalidade no IAM com choque (IABP-SHOCK II) e deixou de ser rotina. Em choque cardiogênico por IAM selecionado, o ECMO/Impella precoce vem sendo estudado, com benefício dependente de seleção criteriosa.',
      },
    ],
  },
  {
    id: 'coma-rebaixamento',
    nome: 'Coma / rebaixamento do nível de consciência',
    secao: 'Neurológicas',
    cid10: ['R40.2'],
    sinonimos: [
      'coma',
      'rebaixamento',
      'torpor',
      'estupor',
      'Glasgow',
      'ECG',
      'nível de consciência',
      'AEIOU-TIPS',
      'pupilas',
    ],
    fonte: 'ABRAMEDE e diretrizes de emergência neurológica',
    resumo:
      'Redução do nível de consciência por disfunção difusa dos hemisférios cerebrais ou lesão do sistema reticular ativador ascendente (tronco). É um sintoma, não um diagnóstico — a prioridade é estabilizar (ABC), corrigir causas imediatamente reversíveis (glicose, opioide, hipóxia) e investigar de forma estruturada. Avaliar profundidade pela escala de Glasgow e o tronco pelo padrão pupilar e reflexos.',
    fisiopatologia: [
      'A consciência depende do córtex (conteúdo) e do sistema reticular ativador ascendente no tronco (nível de alerta). O coma surge por lesão bilateral difusa do córtex ou por lesão focal do tronco/SARA.',
      'Causas estruturais (lesão com efeito de massa, herniação) tendem a dar sinais focais e assimetria; causas tóxico-metabólicas costumam ser simétricas e com pupilas preservadas.',
      'Mnemônico de causas — AEIOU-TIPS: Álcool, Epilepsia/Encefalopatia, Insulina (hipo/hiperglicemia), Opioides/Overdose, Uremia; Trauma/Temperatura, Infecção, Psiquiátrico/Porfiria, AVC (Stroke).',
    ],
    exames: [
      {
        titulo: 'À beira-leito (imediato)',
        itens: [
          'Glicemia capilar em TODO rebaixamento (hipoglicemia é causa reversível e frequente)',
          'Glasgow + padrão pupilar (tamanho/simetria/fotorreação) + reflexos de tronco; sinais focais',
          'Oximetria, sinais vitais, temperatura; pesquisar trauma e sinais meníngeos',
        ],
      },
      {
        titulo: 'Complementar',
        itens: [
          'Gasometria, eletrólitos (Na, Ca), função renal/hepática, amônia, TSH; rastreio toxicológico',
          'TC de crânio (lesão estrutural/HIC/sangramento); punção lombar se suspeita de infecção do SNC (após imagem)',
          'EEG se suspeita de estado de mal não convulsivo',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Causas tóxico-metabólicas (hipoglicemia, distúrbios de Na/Ca, uremia, encefalopatia hepática, intoxicações)',
      'Lesões estruturais (AVC de tronco, hemorragia, tumor, hidrocefalia, TCE)',
      'Estado de mal epiléptico não convulsivo',
      'Síndrome do encarceramento (locked-in) e mutismo acinético; pseudocoma psicogênico',
    ],
    conduta: [
      {
        titulo: 'Estabilização e "coma cocktail"',
        itens: [
          'ABC; proteger via aérea (IOT se Glasgow ≤ 8 ou incapaz de protegê-la)',
          'Glicose (tiamina ANTES da glicose no etilista/desnutrido); naloxona se suspeita de opioide',
          'Tratar hipóxia, hipotensão e hipertermia; controle de convulsão',
        ],
      },
      {
        titulo: 'Conforme a causa',
        itens: [
          'Sinais de herniação/HIC: medidas imediatas e neuroimagem urgente (ver Hipertensão intracraniana)',
          'Corrigir o distúrbio metabólico/tóxico identificado',
          'Acionar neurologia/neurocirurgia conforme o achado',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Boa prática em emergência',
        texto:
          'Glicemia capilar e oximetria são obrigatórias em todo rebaixamento, antes de exames sofisticados. Tiamina precede a glicose em etilista/desnutrido para evitar encefalopatia de Wernicke. O estado de mal não convulsivo é causa subdiagnosticada de coma e exige EEG.',
      },
    ],
  },
  {
    id: 'tce',
    nome: 'Traumatismo cranioencefálico (TCE)',
    secao: 'Neurológicas',
    cid10: ['S06.9'],
    sinonimos: [
      'TCE',
      'trauma de crânio',
      'traumatismo craniano',
      'hematoma extradural',
      'hematoma subdural',
      'lesão axonal difusa',
      'Glasgow',
      'PIC',
    ],
    fonte: 'Brain Trauma Foundation (4ª ed.) e ABRAMEDE / ATLS',
    resumo:
      'Lesão cerebral por trauma, classificada pela Glasgow em leve (13–15), moderado (9–12) e grave (≤ 8). O foco é prevenir a lesão secundária: combater hipóxia e hipotensão, que pioram muito o prognóstico. TC de crânio define a lesão estrutural; o TCE grave requer via aérea definitiva, neuroproteção e avaliação neurocirúrgica.',
    fisiopatologia: [
      'Lesão primária: dano mecânico no momento do trauma (contusão, laceração, lesão axonal difusa, hematomas).',
      'Lesão secundária: cascata de isquemia, edema e hipertensão intracraniana agravada por hipóxia, hipotensão, hiper/hipocapnia, hipertermia e hipoglicemia — é o alvo terapêutico.',
      'Hematoma extradural: tipicamente arterial (artéria meníngea média), lente biconvexa, com "intervalo lúcido". Subdural: venoso (veias-ponte), em crescente, comum no idoso/etilista.',
    ],
    exames: [
      {
        titulo: 'Indicação de TC e avaliação',
        itens: [
          'Glasgow seriada + pupilas + déficit focal; pesquisar sinais de fratura de base (Battle, guaxinim, otorragia, fístula liquórica)',
          'TC de crânio sem contraste: regras canadenses/New Orleans para TCE leve (Glasgow < 15 em 2 h, suspeita de fratura, vômitos, idade, anticoagulação)',
          'Atenção redobrada em uso de anticoagulante/antiagregante (sangramento tardio)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Rebaixamento por causa clínica que precedeu/causou o trauma (síncope, AVC, hipoglicemia, intoxicação)',
      'Hemorragia subaracnóidea espontânea',
      'Intoxicação concomitante (álcool) mascarando a gravidade',
    ],
    conduta: [
      {
        titulo: 'Neuroproteção (evitar lesão secundária)',
        itens: [
          'Via aérea definitiva se Glasgow ≤ 8; alvo SatO₂ ≥ 90% e PaCO₂ 35–45 mmHg (normocapnia)',
          'Evitar hipotensão: alvo PAS ≥ 110 mmHg (≥ 100 entre 50–69 anos); cabeceira a 30°, cabeça neutra',
          'Analgesia/sedação adequadas; tratar convulsão (profilaxia precoce reduz crises na 1ª semana)',
        ],
      },
      {
        titulo: 'Hipertensão intracraniana / cirurgia',
        itens: [
          'Sinais de herniação: salina hipertônica ou manitol; hiperventilação só como ponte temporária',
          'Hematoma com efeito de massa: drenagem neurocirúrgica de urgência',
          'Reverter anticoagulação; monitorização de PIC no TCE grave conforme protocolo',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Brain Trauma Foundation 2016 (4ª ed.)',
        texto:
          'Alvo de PAS por faixa etária para evitar hipotensão; corticoide é CONTRAINDICADO no TCE (aumenta mortalidade — estudo CRASH). Hiperventilação profilática deve ser evitada. O estudo CRASH-3 mostrou benefício do ácido tranexâmico no TCE leve/moderado quando administrado precocemente (≤ 3 h).',
      },
    ],
  },
  {
    id: 'hipertensao-intracraniana',
    nome: 'Hipertensão intracraniana',
    secao: 'Neurológicas',
    sinonimos: [
      'HIC',
      'hipertensão intracraniana',
      'PIC',
      'pressão intracraniana',
      'herniação',
      'Cushing',
      'edema cerebral',
      'manitol',
      'salina hipertônica',
    ],
    fonte: 'Diretrizes de neurointensivismo e Brain Trauma Foundation',
    resumo:
      'Elevação sustentada da pressão intracraniana (PIC > 20–22 mmHg), por aumento de qualquer componente do crânio (parênquima/edema, sangue, liquor) ou lesão expansiva. Reduz a pressão de perfusão cerebral (PPC = PAM − PIC) e pode evoluir para herniação e morte. É emergência: reconhecer (cefaleia, vômitos, rebaixamento, papiledema, tríade de Cushing) e tratar em paralelo à investigação.',
    fisiopatologia: [
      'Doutrina de Monro-Kellie: o crânio é rígido; o aumento de um componente (massa, edema, sangue, liquor) exige a redução de outro. Esgotada a compensação, pequenos aumentos de volume elevam muito a PIC.',
      'A queda da PPC gera isquemia; a herniação (uncal, central, tonsilar) comprime o tronco.',
      'Tríade de Cushing (resposta tardia a HIC grave): hipertensão, bradicardia e alteração do padrão respiratório.',
    ],
    exames: [
      {
        titulo: 'Reconhecimento',
        itens: [
          'Clínica: cefaleia, vômitos, rebaixamento progressivo, papiledema; midríase fixa unilateral sugere herniação uncal',
          'TC de crânio: lesão expansiva, desvio de linha média, apagamento de cisternas/sulcos, hidrocefalia',
          'POCUS da bainha do nervo óptico (> 5–6 mm sugere HIC); monitorização invasiva de PIC quando indicada',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Causas de cefaleia/rebaixamento sem HIC (enxaqueca, intoxicação, metabólico)',
      'Hipertensão intracraniana idiopática (pseudotumor cerebri) — quadro mais arrastado',
      'Crise hipertensiva com encefalopatia',
    ],
    conduta: [
      {
        titulo: 'Medidas gerais',
        itens: [
          'Cabeceira a 30°, cabeça em posição neutra (favorece drenagem venosa)',
          'Normóxia e normocapnia (PaCO₂ 35–45); evitar hipotensão; analgesia/sedação; tratar febre e convulsão',
          'Alvos: PIC < 22 mmHg e PPC ~60–70 mmHg',
        ],
      },
      {
        titulo: 'Terapia osmótica e escalonamento',
        itens: [
          'Salina hipertônica ou manitol 0,5–1 g/kg para reduzir o edema',
          'Hiperventilação (PaCO₂ ~30–35) APENAS como medida de resgate temporária na herniação iminente',
          'Drenagem liquórica (DVE) na hidrocefalia; craniectomia descompressiva / cirurgia da lesão de base em casos refratários',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Brain Trauma Foundation / neurointensivismo',
        texto:
          'Salina hipertônica vem ganhando espaço frente ao manitol (menos hipotensão/diurese excessiva). Hiperventilação profilática é desencorajada (vasoconstrição e isquemia); reservada à herniação iminente como ponte. Corticoide não tem papel no edema citotóxico do TCE/AVC (útil apenas no edema vasogênico tumoral).',
      },
    ],
  },
  {
    id: 'guillain-barre',
    nome: 'Síndrome de Guillain-Barré',
    secao: 'Neurológicas',
    cid10: ['G61.0'],
    sinonimos: [
      'Guillain-Barré',
      'SGB',
      'polirradiculoneurite',
      'paralisia ascendente',
      'AIDP',
      'dissociação albuminocitológica',
      'imunoglobulina',
      'plasmaférese',
    ],
    fonte: 'ABRAMEDE e diretrizes de neurologia (GBS)',
    resumo:
      'Polirradiculoneuropatia aguda, imunomediada, em geral pós-infecciosa (Campylobacter jejuni, vírus respiratórios, Zika). Cursa com fraqueza muscular ASCENDENTE, simétrica e progressiva, com arreflexia. O risco maior é a falência respiratória e a disautonomia. Diagnóstico clínico + líquor (dissociação albuminocitológica) + eletroneuromiografia; tratamento com imunoglobulina ou plasmaférese.',
    fisiopatologia: [
      'Resposta autoimune (mimetismo molecular) após infecção, atacando a mielina dos nervos periféricos (forma desmielinizante AIDP, a mais comum) ou o axônio (AMAN/AMSAN).',
      'A inflamação das raízes e nervos periféricos causa fraqueza, hipo/arreflexia e alterações sensitivas; pode acometer nervos cranianos (variante de Miller-Fisher: oftalmoplegia, ataxia, arreflexia).',
      'A disautonomia (arritmias, labilidade pressórica) e a fraqueza diafragmática são as principais ameaças à vida.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Líquor: dissociação albuminocitológica (proteína alta com celularidade normal) — pode ser normal na 1ª semana',
          'Eletroneuromiografia: padrão desmielinizante (ou axonal)',
          'Pesquisar gatilho infeccioso; anticorpos anti-gangliosídeo (anti-GQ1b em Miller-Fisher)',
        ],
      },
      {
        titulo: 'Monitorização (gravidade)',
        itens: [
          'Capacidade vital forçada seriada e força inspiratória (prever necessidade de ventilação)',
          'Monitorização cardíaca contínua (disautonomia)',
          'Escore de gravidade/progressão (ex.: Erasmus GBS)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Mielite/compressão medular aguda (nível sensitivo, esfíncteres)',
      'Miastenia gravis e botulismo',
      'Hipocalemia/distúrbios eletrolíticos; porfiria',
      'Paralisia por carrapato; intoxicações',
    ],
    conduta: [
      {
        titulo: 'Imunoterapia',
        itens: [
          'Imunoglobulina IV 0,4 g/kg/dia por 5 dias OU plasmaférese — eficácia equivalente (não combinar)',
          'Indicada nos que perdem a deambulação ou progridem rapidamente; quanto mais precoce, melhor',
          'Corticoide NÃO é eficaz (não usar isolado)',
        ],
      },
      {
        titulo: 'Suporte',
        itens: [
          'UTI e via aérea se capacidade vital em queda/insuficiência respiratória',
          'Manejo da disautonomia; profilaxia de TEV; fisioterapia e controle da dor',
          'Vigilância de progressão (pode piorar por até ~2–4 semanas)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Diretrizes de neurologia (GBS)',
        texto:
          'Imunoglobulina e plasmaférese têm eficácia semelhante; a escolha depende de disponibilidade e comorbidades. Não há benefício em combiná-las nem em repetir curso de rotina. Corticoide isolado não é recomendado. A monitorização respiratória seriada (capacidade vital) é o pilar para indicar ventilação antes da descompensação.',
      },
    ],
  },
  {
    id: 'crise-miastenica',
    nome: 'Crise miastênica',
    secao: 'Neurológicas',
    cid10: ['G70.0'],
    sinonimos: [
      'crise miastênica',
      'miastenia gravis',
      'MG',
      'anti-AChR',
      'anti-MuSK',
      'fadiga muscular',
      'crise colinérgica',
      'piridostigmina',
    ],
    fonte: 'ABRAMEDE e diretrizes de neurologia (miastenia gravis)',
    resumo:
      'Exacerbação grave da miastenia gravis com insuficiência respiratória ou incapacidade de proteger a via aérea, exigindo suporte ventilatório. Frequentemente desencadeada por infecção, cirurgia, gravidez ou fármacos. A fraqueza é flutuante e fatigável, pior ao esforço e no fim do dia. O tratamento é imunoglobulina ou plasmaférese + suporte e remoção do gatilho.',
    fisiopatologia: [
      'Doença autoimune com anticorpos contra o receptor de acetilcolina (anti-AChR) ou MuSK na junção neuromuscular, reduzindo a transmissão e gerando fraqueza fatigável.',
      'Acomete musculatura ocular (ptose, diplopia), bulbar (disfagia, disfonia) e respiratória; a crise é a falência da musculatura respiratória/bulbar.',
      'Gatilhos comuns: infecções, cirurgia/estresse, gestação e MEDICAMENTOS (aminoglicosídeos, macrolídeos, fluoroquinolonas, betabloqueador, magnésio, contraste).',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Capacidade vital forçada e força inspiratória seriadas (não confiar só na oximetria/gasometria, que caem tardiamente)',
          'Anticorpos (anti-AChR, anti-MuSK) e eletroneuromiografia (teste de estimulação repetitiva) — para diagnóstico, não para a crise',
          'Buscar e tratar o fator desencadeante (sobretudo infecção); rever medicações que pioram MG',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Crise colinérgica (excesso de anticolinesterásico: miose, sialorreia, fasciculações, cólicas)',
      'Síndrome de Guillain-Barré e botulismo',
      'Outras causas de insuficiência respiratória neuromuscular',
    ],
    conduta: [
      {
        titulo: 'Suporte respiratório',
        itens: [
          'UTI; VNI pode evitar intubação em casos selecionados; IOT se capacidade vital em queda/fadiga/aspiração',
          'Suspender temporariamente anticolinesterásico no intubado (reduz secreções)',
          'Remover o gatilho; tratar infecção',
        ],
      },
      {
        titulo: 'Imunoterapia',
        itens: [
          'Imunoglobulina IV ou plasmaférese (resposta rápida) — base do tratamento da crise',
          'Corticoide para controle de fundo (atenção: pode piorar transitoriamente no início — iniciar com cautela na crise)',
          'Ajuste da imunossupressão de manutenção pela neurologia',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Consenso internacional (MGFA) e diretrizes de neurologia',
        texto:
          'Imunoglobulina e plasmaférese são as terapias de escolha na crise, com eficácia comparável. Corticoide em alta dose pode causar piora transitória — iniciar com proteção em paciente já frágil. Reconhecer e diferenciar a crise colinérgica (raro com doses atuais) evita conduta equivocada.',
      },
    ],
  },
  {
    id: 'delirium',
    nome: 'Delirium',
    secao: 'Neurológicas',
    cid10: ['F05.9'],
    sinonimos: [
      'delirium',
      'estado confusional agudo',
      'confusão mental',
      'CAM',
      'encefalopatia aguda',
      'delirium hiperativo',
      'delirium hipoativo',
    ],
    fonte: 'ABRAMEDE e diretrizes de geriatria/medicina intensiva',
    resumo:
      'Distúrbio agudo e flutuante da atenção e da consciência, com alteração cognitiva, secundário a uma causa orgânica. É comum no idoso e no paciente crítico, e marca pior prognóstico. Subtipos: hiperativo (agitação), hipoativo (sonolência — o mais subdiagnosticado) e misto. A prioridade é identificar e tratar a causa de base; medidas não farmacológicas são a primeira linha.',
    fisiopatologia: [
      'Disfunção cerebral global por desequilíbrio de neurotransmissores (déficit colinérgico, excesso dopaminérgico) e neuroinflamação, desencadeada por fatores agudos sobre um cérebro vulnerável.',
      'Fatores predisponentes: idade avançada, demência, déficit sensorial, comorbidades. Precipitantes: infecção, fármacos (anticolinérgicos, benzodiazepínicos, opioides), distúrbios metabólicos, dor, retenção urinária/fecaloma, abstinência, privação de sono.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico (clínico) e investigação da causa',
        itens: [
          'CAM (Confusion Assessment Method): início agudo/flutuante + desatenção + (pensamento desorganizado OU alteração do nível de consciência)',
          'Buscar a causa: glicemia, eletrólitos, função renal/hepática, hemograma/PCR, EAS e urocultura, oximetria, ECG; rever a lista de medicamentos',
          'Neuroimagem e PL apenas se sinais focais, trauma, febre/meningismo ou sem causa aparente',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Demência (curso crônico, atenção relativamente preservada) — pode coexistir',
      'Depressão (no delirium hipoativo)',
      'Transtorno psiquiátrico primário/psicose',
      'Estado de mal não convulsivo; afasia',
    ],
    conduta: [
      {
        titulo: 'Tratar a causa + medidas não farmacológicas (1ª linha)',
        itens: [
          'Corrigir o precipitante (infecção, distúrbio metabólico, dor, retenção, abstinência)',
          'Reorientação, presença de familiar, ciclo claro/escuro, sono, mobilização precoce, óculos/aparelho auditivo',
          'Retirar fármacos deliriogênicos e cateteres/contenções desnecessários',
        ],
      },
      {
        titulo: 'Farmacológico (só se necessário)',
        itens: [
          'Reservar a agitação com risco ao paciente/equipe: antipsicótico em dose baixa (ex.: haloperidol), pelo menor tempo',
          'EVITAR benzodiazepínico (piora o delirium) — exceto na abstinência alcoólica/sedativos',
          'Cautela em idoso, Parkinson e demência por corpos de Lewy (sensibilidade a antipsicótico)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'PADIS 2018 (medicina intensiva)',
        texto:
          'Não há evidência de que antipsicóticos previnam ou encurtem o delirium — o foco é prevenção não farmacológica e tratamento da causa. Benzodiazepínicos devem ser evitados (exceto abstinência). Pacotes de prevenção (ABCDEF) reduzem a incidência na UTI.',
      },
    ],
  },
  {
    id: 'trombose-venosa-cerebral',
    nome: 'Trombose venosa cerebral',
    secao: 'Neurológicas',
    cid10: ['I67.6'],
    sinonimos: [
      'trombose venosa cerebral',
      'TVC',
      'trombose de seio venoso',
      'trombose de seios durais',
      'cefaleia',
      'puerpério',
      'trombofilia',
      'anticoagulação',
    ],
    fonte: 'AHA/ASA e ESO (trombose venosa cerebral)',
    resumo:
      'Trombose dos seios durais e/ou veias cerebrais, mais comum em mulheres jovens (gestação/puerpério, anticoncepcional, trombofilia). Apresentação muito variável: cefaleia (sintoma mais frequente, podendo ser o único), crises convulsivas, déficits focais, rebaixamento e sinais de hipertensão intracraniana. Diagnóstico por venografia (RM ou TC); tratamento é anticoagulação, mesmo na presença de infarto hemorrágico.',
    fisiopatologia: [
      'A obstrução da drenagem venosa eleva a pressão venosa e capilar, causando edema, infarto venoso (frequentemente com transformação hemorrágica) e hipertensão intracraniana por redução da absorção liquórica.',
      'Diferente do AVC arterial, as lesões não respeitam territórios arteriais e cruzam limites vasculares clássicos.',
      'Fatores de risco: estados pró-trombóticos (gravidez/puerpério, estrogênio, trombofilias, neoplasia), infecções de face/ouvido/seios e desidratação.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Venografia por RM (venoRM) ou venoTC — exames de escolha para confirmar',
          'TC sem contraste pode mostrar sinal do delta/corda ou infarto que não respeita território arterial (não exclui se normal)',
          'D-dímero pode ajudar, mas normal NÃO afasta; investigar trombofilia e gatilhos',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'AVC isquêmico arterial e hemorrágico',
      'Hemorragia subaracnóidea e outras cefaleias secundárias',
      'Hipertensão intracraniana idiopática; meningite/encefalite',
      'Enxaqueca com aura',
    ],
    conduta: [
      {
        titulo: 'Anticoagulação',
        itens: [
          'Heparina (HBPM ou HNF) na fase aguda, MESMO com infarto hemorrágico associado',
          'Depois, anticoagulação oral por 3–12 meses (provocada) ou indefinida (trombofilia grave/recorrência); DOACs são opção em casos selecionados',
          'Tratar o fator desencadeante (suspender estrogênio, tratar infecção/desidratação)',
        ],
      },
      {
        titulo: 'Complicações',
        itens: [
          'Convulsão: anticonvulsivante (sobretudo se já houve crise/lesão supratentorial)',
          'Hipertensão intracraniana: medidas gerais; acetazolamida/PL de alívio na perda visual por papiledema',
          'Deterioração refratária: trombólise/trombectomia endovascular ou craniectomia descompressiva em casos graves',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AHA/ASA e ESO; estudo RE-SPECT CVT',
        texto:
          'A anticoagulação é indicada mesmo com hemorragia associada. Dabigatrana mostrou eficácia/segurança comparáveis à varfarina (RE-SPECT CVT), apoiando DOAC em casos selecionados (exceto gestação/puerpério e síndrome antifosfolípide, onde se mantém varfarina/heparina).',
      },
    ],
  },

  // ════════════ Expansão PS crítico — Respiratórias ════════════
  {
    id: 'sdra',
    nome: 'Síndrome do desconforto respiratório agudo (SDRA)',
    secao: 'Respiratórias',
    cid10: ['J80'],
    sinonimos: [
      'sdra',
      'ards',
      'síndrome do desconforto respiratório agudo',
      'lesão pulmonar aguda',
      'edema pulmonar não cardiogênico',
    ],
    capitulo: 7,
    resumo:
      'Insuficiência respiratória hipoxêmica aguda por edema pulmonar não cardiogênico (lesão alvéolo-capilar inflamatória). Diagnóstico pelos critérios de Berlim. Pilar do tratamento é a ventilação protetora — VC 4–8 mL/kg de peso predito, Pplatô < 30 e driving pressure < 15 cmH₂O — além de tratar a causa de base. Na moderada-grave (P/F < 150, PROSEVA): posição prona > 12 h e bloqueio neuromuscular nas primeiras 48 h; na grave (P/F ≤ 100): também PEEP alta.',
    fisiopatologia: [
      'Lesão da membrana alvéolo-capilar (sepse, pneumonia, aspiração, pancreatite, trauma, transfusão) com aumento de permeabilidade e edema rico em proteína.',
      'Inundação alveolar e colapso → shunt intrapulmonar, hipoxemia refratária e queda de complacência.',
      'A própria ventilação pode amplificar a lesão (VILI) por volutrauma/barotrauma — daí a estratégia protetora.',
    ],
    exames: [
      {
        titulo: 'Critérios de Berlim (diagnóstico)',
        itens: [
          'Início ou piora respiratória < 1 semana',
          'Opacidades bilaterais em RX/TC (ou USG por operador treinado)',
          'Edema não explicado por IC/sobrecarga volêmica (ecocardiograma se dúvida)',
          'Gasometria com PEEP/CPAP ≥ 5 cmH₂O para gradar gravidade',
        ],
      },
      {
        titulo: 'Gravidade (PaO₂/FiO₂)',
        itens: [
          'Leve: P/F 200–300',
          'Moderada: P/F 100–200',
          'Grave: P/F ≤ 100',
          'Consenso 2023 (ATS): também aceita CNAF ≥ 30 L/min, SpO₂/FiO₂ ≤ 315 e USG pulmonar',
        ],
      },
      {
        titulo: 'Complementares',
        itens: [
          'Gasometria arterial seriada',
          'RX/TC de tórax e USG pulmonar (protocolo BLUE)',
          'Investigar foco: culturas, lactato, lipase, marcadores de sepse',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Edema agudo de pulmão cardiogênico (B3, congestão, BNP elevado, FE reduzida)',
      'Pneumonia/broncopneumonia multilobar',
      'Hemorragia alveolar difusa',
      'Pneumonite por hipersensibilidade / pneumopatia intersticial aguda',
      'Sobrecarga volêmica (TACO)',
    ],
    conduta: [
      {
        titulo: 'Ventilação protetora (base)',
        itens: [
          'VC 4–8 mL/kg de PESO PREDITO (não peso real); na moderada/grave 3–6 mL/kg',
          'Pplatô ≤ 30 cmH₂O e driving pressure (Pplatô − PEEP) < 15 cmH₂O',
          'Modo controlado (PCV/VCV) nas primeiras 48–72 h',
          'FiO₂ inicial 100%, titular para SatO₂ alvo ~92–96% (evitar hiperóxia)',
          'Hipercapnia permissiva tolerada se pH > 7,2',
        ],
      },
      {
        titulo: 'PEEP e oxigenação',
        itens: [
          'Titular PEEP por tabela PEEP × FiO₂',
          'SDRA moderada/grave: estratégia de PEEP alta (potencial redução de mortalidade)',
          'Considerar manobras de recrutamento alveolar',
        ],
      },
      {
        titulo: 'SDRA grave / refratária',
        itens: [
          'Posição prona > 12 h/dia na SDRA grave (P/F < 150)',
          'Bloqueio neuromuscular (cisatracúrio) nas primeiras 48 h se P/F < 150',
          'Evitar ventilação oscilatória de alta frequência na moderada/grave',
          'ECMO veno-venosa em hipoxemia refratária (centro de referência)',
          'Tratar a causa de base (antibiótico precoce na sepse, controle de foco)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Critérios de Berlim (2012) + consenso ATS 2023',
        texto:
          'Definição ampliada inclui CNAF ≥ 30 L/min, SpO₂/FiO₂ ≤ 315 e USG pulmonar; em locais de poucos recursos, PEEP não é obrigatória para o diagnóstico.',
      },
    ],
  },
  {
    id: 'irpa-vni',
    nome: 'Insuficiência respiratória aguda (abordagem e VNI)',
    secao: 'Respiratórias',
    cid10: ['J96.0'],
    sinonimos: [
      'insuficiência respiratória aguda',
      'irpa',
      'iresp',
      'vni',
      'ventilação não invasiva',
      'bipap',
      'cpap',
      'hipoxemia',
      'hipercapnia',
    ],
    capitulo: 6,
    resumo:
      'Síndrome de falência das trocas gasosas de instalação aguda. A gasometria classifica em tipo I (hipoxêmica, PaO₂ < 60) e tipo II (hipercápnica, PaCO₂ > 45 com pH < 7,35). Oferta de O₂ titulada (alvo SatO₂ 90–94%; 88–92% se risco de hipercapnia — evitar hiperóxia). VNI traz maior benefício em DPOC exacerbada com acidose e em EAP cardiogênico; nunca deve protelar a IOT quando indicada.',
    fisiopatologia: [
      'Hipoxemia (tipo I): principal mecanismo é distúrbio V/Q e shunt intrapulmonar; também difusão prejudicada, hipoventilação e baixa PiO₂.',
      'Hipercapnia (tipo II): hipoventilação alveolar e/ou aumento do espaço morto; DPOC é o protótipo (padrão rápido e superficial).',
      'Hiperóxia em retentor crônico piora a relação V/Q (reverte vasoconstrição hipóxica) e causa retenção de CO₂.',
    ],
    exames: [
      {
        titulo: 'Classificação (gasometria)',
        itens: [
          'Tipo I / hipoxêmica: PaO₂ < 60 mmHg',
          'Tipo II / hipercápnica: PaCO₂ > 45 mmHg com PaO₂ < 60',
          'Aguda × crônica: na crônica compensada o pH é normal (HCO₃⁻ elevado); na agudizada, pH < 7,35',
          'P/F < 200 = hipoxemia grave',
        ],
      },
      {
        titulo: 'Avaliação à beira-leito',
        itens: [
          'Oximetria contínua e gasometria arterial (não suspender O₂ para coletar)',
          'Sinais de fadiga: respiração paradoxal, musculatura acessória, asterixis/rebaixamento (carbonarcose)',
          'USG pulmonar (protocolo BLUE) para etiologia em < 3 min',
          'RX de tórax, ECG; angio-TC se suspeita de TEP',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'EAP cardiogênico × não cardiogênico (SDRA)',
      'Pneumonia, DPOC e asma exacerbadas',
      'TEP',
      'Pneumotórax / derrame pleural',
      'Depressão do SNC (drogas, AVC) e doença neuromuscular',
    ],
    conduta: [
      {
        titulo: 'Oxigenoterapia (alvos)',
        itens: [
          'Alvo SatO₂ 90–94% na maioria; 88–92% se risco de hipercapnia (DPOC, obesidade, cifoescoliose, neuromuscular)',
          'Não ofertar O₂ se SatO₂ ≥ 94%',
          'Interfaces: cateter nasal (0,5–5 L/min, +3–4% FiO₂/L), Venturi (FiO₂ 24–50% titulável), máscara com reservatório (FiO₂ 90–100%) na hipoxemia grave',
          'CNAF (até 60 L/min) na IRpA hipoxêmica — boa alternativa à VNI',
        ],
      },
      {
        titulo: 'VNI — indicações',
        itens: [
          'DPOC exacerbada com acidose respiratória (pH < 7,3 e PaCO₂ > 45): usar BiPAP — reduz mortalidade, IOT e internação',
          'EAP cardiogênico: CPAP ou BiPAP',
          'IRpA hipoxêmica selecionada',
          'CPAP corrige hipoxemia; BiPAP (IPAP + EPAP) auxilia a hipoventilação',
        ],
      },
      {
        titulo: 'VNI — contraindicações',
        itens: [
          'Indicação de IOT imediata (parada, instabilidade grave)',
          'Incapacidade de proteger via aérea / manejar secreções',
          'Rebaixamento (GCS < 10) — considerar trial na encefalopatia hipercápnica',
          'Trauma/cirurgia/deformidade facial',
          'Reavaliar em 1–2 h; falha (sem queda de PaCO₂/FR) indica IOT',
        ],
      },
      {
        titulo: 'Indicações de IOT/VM invasiva',
        itens: [
          'Hipoxemia persistente apesar de O₂/VNI',
          'Trabalho respiratório intenso / fadiga apesar de VNI',
          'Incapacidade de proteger via aérea (GCS ≤ 8)',
          'Gasping deve ser manejado como parada respiratória',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'RENOVATE (JAMA 2024) / BMJ 2018',
        texto:
          'CNAF e VNI tiveram desfecho (IOT/óbito) semelhante em vários perfis de IRpA; manter estratégia conservadora de O₂ (alvo ≤ 96%).',
      },
    ],
  },
  {
    id: 'hemoptise-macica',
    nome: 'Hemoptise maciça',
    secao: 'Respiratórias',
    cid10: ['R04.2'],
    sinonimos: [
      'hemoptise',
      'hemoptise maciça',
      'hemoptise ameaçadora à vida',
      'sangramento pulmonar',
      'expectoração de sangue',
    ],
    capitulo: 23,
    resumo:
      'Hemoptise maciça (~5% dos casos) é expectoração que excede 100–600 mL/24 h ou cursa com instabilidade hemodinâmica/respiratória. Risco maior é asfixia (não exsanguinação). Prioridade é o ABC com proteção da via aérea e decúbito sobre o lado sangrante. Origem em > 90% é a circulação brônquica (alta pressão). Conduta: estabilizar, localizar o sítio (angio-TC/broncoscopia) e tratar com embolização arterial.',
    fisiopatologia: [
      'Sangramento da árvore traqueobrônquica/pulmão; >90% origina-se das artérias brônquicas (sistêmicas, alta pressão).',
      'Causas: doenças inflamatórias (bronquiectasias), tuberculose, neoplasia, vasculites, coagulopatias e alterações da circulação pulmonar.',
      'A morte costuma ser por inundação alveolar e asfixia, não por choque hipovolêmico.',
    ],
    exames: [
      {
        titulo: 'Definição e diferenciação',
        itens: [
          'Maciça/ameaçadora: > 100–600 mL/24 h OU instabilidade hemodinâmica/respiratória',
          'Excluir epistaxe (rinoscopia/nasofibroscopia) e HDA (melena, dor abdominal, pH ácido do sangue)',
          'Sangue de via aérea: vermelho-vivo, espumoso, com tosse',
        ],
      },
      {
        titulo: 'Localização do sítio',
        itens: [
          'RX de tórax: primeiro exame (sensibilidade até 80% na maciça)',
          'Angio-TC de tórax: localiza e caracteriza; performance comparável à arteriografia, menos invasiva',
          'Broncoscopia precoce: localiza e permite terapia tópica (na maciça pode preceder a TC)',
          'USG point-of-care para identificar o lado/assimetria',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'Hemograma, coagulograma (TP/INR, plaquetas), tipagem e reserva de sangue',
          'Gasometria; função renal/eletrólitos',
          'ANCA se suspeita de vasculite; ecocardiograma se suspeita de estenose mitral',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Epistaxe posterior',
      'Hemorragia digestiva alta',
      'TEP',
      'Vasculites pulmonares (granulomatose com poliangeíte)',
      'Fístula aortobrônquica',
      'CIVD / discrasia por anticoagulantes',
      'Endocardite',
    ],
    conduta: [
      {
        titulo: 'ABC e proteção da via aérea',
        itens: [
          'Monitorização, dois acessos calibrosos, O₂ suplementar',
          'DECÚBITO LATERAL sobre o LADO SANGRANTE ("bleeding lung down") para proteger o pulmão sadio; se bilateral, Trendelenburg reverso/semissentado',
          'IOT precoce se hipoxemia/instabilidade — tubo de maior diâmetro; considerar via aérea difícil',
          'Cabeceira 30–45°; CNAF como ponte/oxigenação apneica',
          'Refratário: intubação seletiva do brônquio do pulmão SADIO (idealmente guiada por broncoscopia)',
        ],
      },
      {
        titulo: 'Hemostasia e reversão',
        itens: [
          'Ácido tranexâmico 1–2 g EV em ataque (não atrasar terapia específica)',
          'Reverter anticoagulação: AVK → CCP 25–50 UI/kg (ou PFC 10–15 mL/kg) + vitamina K 10 mg; DOAC → antídoto (idarucizumab/andexanet) ou CCP',
          'Transfundir plaquetas se < 50.000/µL; desmopressina 0,3 µg/kg na disfunção urêmica',
          'Choque: reposição parcimoniosa, hemocomponentes e hipotensão permissiva',
        ],
      },
      {
        titulo: 'Controle definitivo',
        itens: [
          'Broncoscopia: medidas tópicas (adrenalina) e tamponamento com balão',
          'Arteriografia com EMBOLIZAÇÃO da artéria brônquica — eficaz em ~85% (cuidado: artéria espinal anterior, risco de paraplegia)',
          'Cirurgia (lobectomia/pneumectomia) nos casos refratários',
          'Ácido tranexâmico inalatório 500 mg 8/8 h por 5 dias na hemoptise não maciça',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Medicina de Emergência USP (2025)',
        texto:
          'Ácido tranexâmico inalatório reduz ressangramento e tempo de controle na hemoptise não maciça; angio-TC pode preceder a broncoscopia na investigação.',
      },
    ],
  },

  // ════════════ Expansão PS crítico — Trauma e emergências ambientais ════════════
  {
    id: 'politrauma-atls',
    nome: 'Politrauma — abordagem ATLS',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T07'],
    sinonimos: [
      'politrauma',
      'politraumatizado',
      'atls',
      'trauma grave',
      'abcde do trauma',
      'atendimento inicial ao trauma',
    ],
    capitulo: 63,
    resumo:
      'Atendimento sistematizado em sequência ABCDE, priorizando lesões letais — cada lesão identificada é tratada antes de avançar. Choque hemorrágico é a principal causa de morte evitável: controle precoce do foco, reanimação hemostática 1:1:1, hipotensão permissiva e ácido tranexâmico se < 3 h. Combater a tríade letal (hipotermia, acidose, coagulopatia). O diagnóstico de lesões específicas não deve atrasar o tratamento.',
    fisiopatologia: [
      'Choque hemorrágico → hipoperfusão, acidose lática e coagulopatia induzida pelo trauma.',
      'Tríade letal: hipotermia + acidose + coagulopatia, que se retroalimentam e aumentam a mortalidade.',
      'Reposição cristaloide excessiva dilui fatores, agrava hipotermia e desloca coágulos (piora desfechos).',
    ],
    exames: [
      {
        titulo: 'Avaliação primária (ABCDE)',
        itens: [
          'eFAST na avaliação primária (sangramento intra-abdominal, pericárdico e torácico; sensível a ~100 mL)',
          'Gasometria com lactato e déficit de base (gravidade do choque)',
          'RX de tórax e pelve; TC se hemodinamicamente estável',
          'Hemograma, coagulograma, tipagem/prova cruzada, beta-hCG',
        ],
      },
      {
        titulo: 'Marcadores de gravidade',
        itens: [
          'GCS: TCE grave < 9, moderado 9–12, leve > 12',
          'Shock index (FC/PAS) ≥ 1,4 ou ABC score ≥ 2 → protocolo de transfusão maciça',
          'Tríade de Cushing (HAS + bradicardia + alteração respiratória) sugere HIC',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Choque hemorrágico (mais comum)',
      'Pneumotórax hipertensivo (descompressão imediata)',
      'Tamponamento cardíaco',
      'Choque neurogênico (trauma raquimedular)',
      'Choque obstrutivo / contusão miocárdica',
    ],
    conduta: [
      {
        titulo: 'A — Via aérea + restrição cervical',
        itens: [
          'Garantir via aérea pérvia; IOT (sequência rápida) se GCS ≤ 8 ou via aérea ameaçada — preparar via aérea cirúrgica',
          'Estabilização manual da coluna durante a IOT; restrição cervical por critérios (NEXUS para liberar)',
          'Atenção a inalação de fumaça/edema de glote — intervir precocemente',
        ],
      },
      {
        titulo: 'B — Ventilação',
        itens: [
          'Pneumotórax hipertensivo: descompressão imediata (cateter 14–16 G no 5º EIC linha axilar média ou toracostomia digital) + dreno',
          'O₂ suplementar; analgesia vigorosa no trauma de arcos costais/tórax instável',
          'Tratar pneumotórax aberto e hemotórax',
        ],
      },
      {
        titulo: 'C — Circulação e controle de hemorragia',
        itens: [
          'Comprimir sangramentos externos; estabilizar pelve (cinta pélvica)',
          'Cristaloide isotônico limitado a ≤ 1.000 mL; hipotensão permissiva com alvo PAS 80–90 mmHg (exceto TCE grave: PAM > 80)',
          'Choque III/IV: reanimação hemostática 1:1:1 (ou sangue total) precoce',
          'Ácido tranexâmico se < 3 h do trauma: 1 g EV em 10 min + 1 g em 8 h (não usar empiricamente em todos)',
          'Controle cirúrgico do sangramento NÃO deve ser postergado',
        ],
      },
      {
        titulo: 'D — Disfunção neurológica',
        itens: [
          'GCS, pupilas e déficit focal; TC de crânio em TCE moderado/grave e leve com alarme',
          'TXA pode ser considerado no TCE moderado',
          'Combater hipóxia e hipotensão (lesão secundária)',
        ],
      },
      {
        titulo: 'E — Exposição e tríade letal',
        itens: [
          'Expor totalmente, mobilizar em bloco, examinar o dorso; retirar roupas úmidas/contaminadas',
          'PREVENIR HIPOTERMIA: sala aquecida, mantas térmicas, fluidos aquecidos',
          'Corrigir acidose e coagulopatia; sondagem vesical (não sondar se suspeita de lesão uretral)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ATLS / CRASH-2',
        texto:
          'Ácido tranexâmico reduz mortalidade no choque hemorrágico se administrado em até 3 h; restrição racional de prancha/colar (trauma penetrante não requer restrição de coluna).',
      },
    ],
  },
  {
    id: 'queimaduras',
    nome: 'Queimaduras',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T30.0'],
    sinonimos: ['queimadura', 'paciente queimado', 'grande queimado'],
    fonte: 'ABRAMEDE 2024 (cap. atendimento inicial ao paciente queimado)',
    resumo:
      'Lesão de pele/tecidos por calor, eletricidade, químicos ou radiação. Avaliar como trauma (ABCDE). Prioridades: via aérea (risco de obstrução por edema na lesão inalatória → IOT precoce), ressuscitação volêmica guiada por SCQ e analgesia. A lesão pode progredir nas primeiras horas; reavaliar profundidade e perfusão.',
    fisiopatologia: [
      'Perda da barreira cutânea → hipovolemia (extravasamento por aumento de permeabilidade) e risco de infecção.',
      'Lesão inalatória (incêndio em ambiente fechado): citocinas → edema de via aérea, broncoespasmo e SARA; edema progride em até 6 h.',
      'Combustão libera CO (liga-se à Hb, bloqueia transporte de O₂) e cianeto (bloqueia respiração celular).',
      'Queimadura circunferencial gera efeito de garrote (membro) ou restrição ventilatória (tórax/pescoço).',
    ],
    exames: [
      {
        titulo: 'Avaliação clínica',
        itens: [
          'Profundidade: 1º grau (epiderme, eritema sem bolha — NÃO entra no cálculo); 2º grau (epiderme+derme, bolhas, doloroso); 3º grau (toda a derme, indolor, aspecto coriáceo).',
          'Extensão: Regra dos Nove de Wallace (cabeça 9%, cada MS 9%, cada MI 18%, tronco anterior 18%, posterior 18%, períneo 1%); palma da mão do paciente ≈ 1%. Lund-Browder é mais preciso, sobretudo em crianças.',
          'Sinais de lesão inalatória: queimadura de face/pescoço, cílios/vibrissas chamuscados, fuligem em orofaringe/escarro, disfonia, estridor.',
        ],
      },
      {
        titulo: 'Laboratório/imagem',
        itens: [
          'Carboxi-hemoglobina (oximetria comum não distingue COHb de O₂Hb), gasometria com lactato.',
          'CPK e função renal (rabdomiólise na queimadura elétrica/extensa), ECG e monitorização nas elétricas.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Choque hipovolêmico por trauma associado (sangramento) — hipotensão precoce não é típica só da queimadura',
      'Intoxicação por CO/cianeto (rebaixamento sem grande SCQ)',
      'Síndrome de Stevens-Johnson / NET (descolamento cutâneo não térmico)',
      'Lesão por escaldadura em abuso infantil',
    ],
    conduta: [
      {
        titulo: 'Via aérea e ventilação',
        itens: [
          'IOT precoce se: estridor/disfonia, queimadura extensa de face ou dentro da boca, edema importante, SCQ > 40–50%, rebaixamento — o edema pode tornar a IOT impossível em minutos.',
          'O₂ alto fluxo em máscara não reinalante (suspeita de CO/cianeto/inalação).',
          'Intoxicação por cianeto/CO grave: hidroxocobalamina 70 mg/kg IV (máx 5 g); O₂ hiperbárico se coma, pH < 7,25 ou isquemia (ideal < 6 h).',
        ],
      },
      {
        titulo: 'Ressuscitação volêmica (2º e 3º graus)',
        itens: [
          'Dois acessos calibrosos em pele não queimada se SCQ > 20% (adulto) ou > 10% (criança); Ringer lactato.',
          'Fórmula de Parkland: 2–4 mL × kg × %SCQ de Ringer lactato em 24 h — METADE nas primeiras 8 h (do momento da queimadura), metade nas 16 h seguintes. Brooke modificada (2 mL) reduz risco de hiperinfusão.',
          'Titular pelo débito urinário: alvo 0,5 mL/kg/h (adulto); 1 mL/kg/h em criança e 1–1,5 mL/kg/h na queimadura elétrica até clarear a urina. Evitar excesso (edema, síndrome compartimental).',
        ],
      },
      {
        titulo: 'Lesão e suporte',
        itens: [
          'Analgesia escalonada: dipirona ± AINE → opioide (morfina/fentanil) na dor intensa; quetamina nas trocas de curativo.',
          'Profilaxia antitetânica conforme estado vacinal. Curativo limpo; sulfadiazina de prata em lesões com infecção.',
          'Escarotomia se queimadura circunferencial com restrição ventilatória ou isquemia distal; fasciotomia se síndrome compartimental.',
        ],
      },
      {
        titulo: 'Critérios de transferência a centro de queimados',
        itens: [
          '2º/3º grau > 10% SCQ; qualquer 3º grau; queimadura de face, mãos, pés, períneo ou articulações; queimadura elétrica (incluindo raio) ou química; lesão inalatória; comorbidades graves; criança em serviço sem suporte pediátrico.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABLS / American Burn Association',
        texto:
          'Inicia-se RL antes do cálculo da SCQ (500 mL/h em > 14 anos) e ajusta-se pela diurese; tendência a fórmula com 2 mL/kg/%SCQ para evitar sobre-ressuscitação ("fluid creep").',
      },
    ],
  },
  {
    id: 'afogamento',
    nome: 'Afogamento',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T75.1'],
    sinonimos: ['afogamento', 'submersão', 'quase-afogamento'],
    fonte: 'ABRAMEDE 2024 (cap. afogamento — classificação de Szpilman)',
    resumo:
      'Aspiração de líquido não corporal por imersão/submersão das vias aéreas. A prioridade absoluta é a VENTILAÇÃO/oxigenação (não a circulação): iniciar 5 ventilações de resgate, idealmente ainda dentro d’água no inconsciente. Classificar em 6 graus orienta conduta e internação. Risco de edema pulmonar/SARA tardia.',
    fisiopatologia: [
      'Líquido nas vias aéreas → laringoespasmo e aspiração → lesão alveolocapilar com edema pulmonar e shunt, levando a hipoxemia.',
      'A hipóxia é o evento central; a PCR no afogamento é hipóxica (assistolia/AESP), por isso a ventilação precede as compressões.',
      'A hipotermia associada pode ser protetora ao cérebro (reduz ~5% o consumo de O₂ por 1 °C), justificando reanimação prolongada.',
      'Termos "afogamento seco" e "afogamento secundário" estão ABANDONADOS — não devem ser usados.',
    ],
    exames: [
      {
        titulo: 'Avaliação clínica (classificação)',
        itens: [
          'Grau 1: tosse, ausculta normal — sem hipoxemia.',
          'Grau 2: estertores localizados.',
          'Grau 3: edema agudo de pulmão SEM hipotensão.',
          'Grau 4: edema agudo de pulmão COM hipotensão.',
          'Grau 5: parada respiratória isolada.',
          'Grau 6: parada cardiorrespiratória.',
        ],
      },
      {
        titulo: 'Complementares',
        itens: [
          'Oximetria/gasometria, radiografia de tórax (pode subestimar nas primeiras horas).',
          'ECG, eletrólitos, função renal e lactato nos graus mais altos.',
          'Considerar trauma cervical apenas se mecanismo de risco (mergulho, queda) — incomum em praia.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Síncope/arritmia ou crise convulsiva precipitando a submersão',
      'PCR de causa cardíaca primária na água',
      'Trauma raquimedular cervical associado (mergulho)',
      'Intoxicação por álcool/drogas como fator precipitante',
    ],
    conduta: [
      {
        titulo: 'Resgate e suporte ventilatório (prioridade)',
        itens: [
          'Iniciar com 5 ventilações de resgate; no inconsciente, ventilar ainda dentro d’água quando seguro — quadruplica a chance de sobrevida sem sequela.',
          'NÃO comprimir o abdome nem tentar "drenar água" — atrasa a ventilação e causa aspiração.',
          'Grau 6 (PCR): RCP padrão (sequência ABC com ênfase em ventilação), BVM com O₂ 15 L/min, IOT; adrenalina IV — alta dose não é rotina.',
          'Grau 5 (parada respiratória): ventilação artificial imediata; após retorno respiratório, conduzir como grau 4.',
        ],
      },
      {
        titulo: 'Graus 3–4 (edema pulmonar)',
        itens: [
          'Grau 4 (com hipotensão): IOT em ~100% — VM com PEEP inicial 5 cmH₂O (titular 2–3), VC ≥ 5 mL/kg de peso ideal, FiO₂ para SatO₂ ≥ 92%; cristaloide rápido e droga vasoativa se hipotensão refratária.',
          'Grau 3 (sem hipotensão): O₂ 15 L/min em máscara; ~72% acabam precisando de IOT/VM.',
          'NÃO usar diurético/restrição hídrica para o edema; NÃO usar corticoide; antibiótico só após 48 h (ou se água muito contaminada).',
        ],
      },
      {
        titulo: 'Graus 1–2 e observação',
        itens: [
          'Grau 1: sem necessidade de O₂; pode receber alta após observação, se permanecer assintomático.',
          'Grau 2: O₂ por cânula nasal ~5 L/min; recuperação em 6–24 h com observação hospitalar.',
          'Observar mesmo o paciente pouco sintomático pelo risco de deterioração respiratória nas primeiras horas.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Cadeia de sobrevivência do afogamento (Szpilman/ILS)',
        texto:
          'A medida de maior impacto é a PREVENÇÃO; na assistência, o suporte ventilatório precoce em cena (ventilações de resgate) é o que mais muda o desfecho neurológico.',
      },
    ],
  },
  {
    id: 'disturbios-temperatura',
    nome: 'Distúrbios da temperatura (hipotermia e golpe de calor)',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T68', 'T67.0'],
    sinonimos: [
      'hipotermia acidental',
      'golpe de calor',
      'heat stroke',
      'intermação',
      'síndrome hipertérmica',
    ],
    fonte: 'USP 19ª ed. (cap. 17 síndromes hipertérmicas e cap. 18 hipotermia acidental)',
    resumo:
      'Dois extremos da termorregulação. HIPOTERMIA: temperatura central < 35 °C (medir retal/esofágica); manusear com cuidado (miocárdio irritável → FV) e reaquecer. GOLPE DE CALOR: temperatura central > 40 °C + disfunção do SNC; emergência com alta letalidade que exige resfriamento rápido (alvo < 39 °C).',
    fisiopatologia: [
      'Hipotermia: queda da taxa metabólica; fase de excitação (taquicardia/tremores) evolui para desaceleração (bradicardia, depressão do SNC, perda de tremores < 30–32 °C). Surge a onda de Osborn (J) e progressão bradicardia → FA → FV → assistolia.',
      'A coagulopatia e o desvio à esquerda da curva de oxi-Hb se resolvem com o reaquecimento.',
      'Golpe de calor: falha na dissipação de calor → lesão tecidual termodependente, com risco de rabdomiólise, CIVD, lesão renal/hepática e edema cerebral.',
      'Forma clássica (idoso, sem esforço, onda de calor) × forma por esforço (jovem, exercício extenuante).',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Hipotermia: temperatura CENTRAL (retal/esofágica) — termômetro comum não lê < 34 °C. Estágios: leve 32–35; moderada 28–32; grave < 28 °C.',
          'Golpe de calor (tríade): hipertermia > 40 °C + estado mental alterado + exposição ao calor.',
        ],
      },
      {
        titulo: 'Complementares',
        itens: [
          'Ambos: glicemia, eletrólitos, função renal, CPK (rabdomiólise), gasometria com lactato, coagulograma, ECG.',
          'Hipotermia: a gasometria a 37 °C superestima PO₂/PCO₂ e subestima o pH; investigar causa secundária (sepse, hipoglicemia, hipotireoidismo, intoxicação, AVC) se a consciência for incompatível com a temperatura.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hipotermia secundária: sepse, hipoglicemia, hipotireoidismo/insuf. adrenal, intoxicação por álcool/sedativos, AVC/TCE',
      'Golpe de calor × síndrome neuroléptica maligna × síndrome serotoninérgica × crise tireotóxica × sepse/meningite',
      'Hipertermia maligna (anestésicos)',
    ],
    conduta: [
      {
        titulo: 'Hipotermia — geral',
        itens: [
          'Manuseio MUITO suave (estímulo desencadeia FV); remover roupas molhadas, ambiente aquecido (~28 °C), monitorização e acesso calibroso.',
          'O₂ e fluidos AQUECIDOS (salina 40–42 °C) no hipotenso, seguidos de vasopressor.',
          '"Não está morto até estar quente e morto": manter RCP e protelar a decisão de óbito até reaquecer; na PCR, desfibrilar mas limitar tentativas e drogas com T < 30 °C.',
        ],
      },
      {
        titulo: 'Hipotermia — reaquecimento',
        itens: [
          'Passivo (cobertores, calor endógeno): escolha na LEVE.',
          'Ativo externo (mantas térmicas, ar aquecido): hipotermia MODERADA.',
          'Ativo interno (fluidos aquecidos → lavagem pleural/peritoneal → ECMO/circulação extracorpórea): GRAVE/refratária ou PCR — progredir do menos para o mais invasivo.',
        ],
      },
      {
        titulo: 'Golpe de calor — resfriamento',
        itens: [
          'Resfriamento IMEDIATO, alvo de temperatura central ~39 °C (evitar hipotermia/overshooting).',
          'Golpe de calor por ESFORÇO: imersão em água fria é o método de resfriamento mais rápido (padrão-ouro na literatura esportiva/exertional heat stroke).',
          'Forma clássica: evaporação (borrifar água ~15 °C + ventilador) e/ou gelo em axilas/pescoço/virilhas; trocar de método se a queda for lenta.',
          'Cristaloide 1–2 L se hipotensão; benzodiazepínico para tremor/agitação; antipiréticos NÃO funcionam (não há ponto de ajuste elevado). Tratar rabdomiólise e complicações.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Comission of Mountain Emergency Medicine (estadiamento clínico)',
        texto:
          'No pré-hospitalar a hipotermia pode ser estadiada pela clínica/nível de consciência (HT 1–4) quando não há termômetro central, estratificando o risco de PCR.',
      },
    ],
  },
  {
    id: 'lesoes-eletricidade',
    nome: 'Lesões por eletricidade (choque elétrico)',
    secao: 'Trauma e emergências ambientais',
    cid10: ['T75.4'],
    sinonimos: ['choque elétrico', 'queimadura elétrica', 'eletrocussão', 'lesão por raio'],
    fonte: 'ABRAMEDE 2024 (cap. queimaduras — queimadura elétrica)',
    resumo:
      'A lesão interna costuma ser MUITO maior que a aparente na pele (a corrente lesa músculo, vaso e nervo no trajeto). Principais ameaças à vida: arritmia/PCR, rabdomiólise com lesão renal e síndrome compartimental. Distinguir alta (≥ 1.000 V) de baixa tensão e corrente alternada de contínua. Avaliar como politrauma (ABCDE).',
    fisiopatologia: [
      'Calor pelo efeito Joule (proporcional à corrente, à resistência do tecido e ao tempo): ossos/pele resistem mais e geram mais calor; pele molhada tem baixa resistência (lesão de superfície pequena com dano interno extenso).',
      'Corrente ALTERNADA (rede elétrica) pode causar tetania muscular que "prende" a vítima à fonte, prolongando a exposição; corrente CONTÍNUA (raio, baterias) causa uma contração muscular única e violenta, podendo associar-se a trauma por queda/projeção.',
      'Passagem pelo coração → FV/assistolia e lesão miocárdica; pela musculatura → rabdomiólise → mioglobinúria → lesão renal aguda.',
      'Edema muscular sob fáscia íntegra → síndrome compartimental.',
    ],
    exames: [
      {
        titulo: 'Avaliação inicial',
        itens: [
          'Identificar pontos de entrada e saída (não predizem o trajeto com precisão).',
          'Monitorização cardíaca contínua e ECG em todos.',
          'Buscar trauma associado (queda/arremesso), lesão de via aérea e de membros.',
        ],
      },
      {
        titulo: 'Laboratório',
        itens: [
          'CPK, mioglobina e função renal (rabdomiólise); eletrólitos (K⁺) e gasometria com lactato.',
          'Exame urinário: urina escura (mioglobinúria) orienta a ressuscitação.',
          'Troponina/ECG seriado se sintomas cardíacos ou alteração no ECG inicial.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Queimadura térmica/química associada',
      'PCR de causa primariamente arrítmica',
      'Trauma contuso/raquimedular pelo arremesso (alta tensão/raio)',
      'Síndrome compartimental por outra causa (esmagamento)',
    ],
    conduta: [
      {
        titulo: 'Imediato',
        itens: [
          'Segurança da cena: desligar a fonte antes de tocar a vítima.',
          'ABCDE como politrauma; na PCR, RCP/desfibrilação (vítimas de eletrocussão têm bom prognóstico se reanimadas precocemente).',
          'Monitorização cardíaca — internar para telemetria se houver arritmia, alteração no ECG, perda de consciência ou alta tensão.',
        ],
      },
      {
        titulo: 'Volume e proteção renal',
        itens: [
          'Ressuscitação com Ringer lactato 4 mL × kg × %SCQ nas primeiras 24 h em TODA queimadura elétrica, MAS titular pelo débito urinário.',
          'Alvo de diurese 1–1,5 mL/kg/h até a urina clarear (rabdomiólise) — maior que o alvo da queimadura térmica.',
          'Considerar alcalinização urinária conforme mioglobinúria/protocolo institucional.',
        ],
      },
      {
        titulo: 'Lesões locais e complicações',
        itens: [
          'Vigilância ativa de síndrome compartimental → fasciotomia; escarotomia se queimadura circunferencial constritiva.',
          'Profilaxia antitetânica; analgesia escalonada.',
          'A extensão da lesão muscular profunda costuma exceder a lesão cutânea — manter alta suspeição e reavaliar.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABLS / American Burn Association',
        texto:
          'Toda queimadura elétrica (inclusive lesão por raio) é critério de transferência para centro de referência em queimados.',
      },
    ],
  },

  // ════════════ Expansão PS crítico — Psiquiátricas ════════════
  {
    id: 'agitacao-psicomotora',
    nome: 'Agitação psicomotora e contenção segura',
    secao: 'Psiquiátricas',
    cid10: ['R45.1'],
    sinonimos: [
      'agitação',
      'paciente agitado',
      'contenção física',
      'contenção química',
      'delirium agitado',
    ],
    fonte: 'USP (19ª ed., 2025), cap. 16 — Agitação psicomotora',
    resumo:
      'Agitação é sintoma, não diagnóstico — pode ser clínica, psiquiátrica, toxicológica ou traumática. Prioridade nº 1 é a segurança do paciente e da equipe. Cinco passos: categorizar (leve/moderada/grave) → não farmacológico → contenção física (ponte) → contenção química → diagnóstico etiológico. Sempre excluir os 4 Hs: Hipóxia, Hipoglicemia, Hipertermia, Hipovolemia.',
    fisiopatologia: [
      'Depende da etiologia: déficit de substrato (hipoglicemia, hipoxemia), disfunção de neurotransmissores (esquizofrenia), presença/retirada de droga ou toxina no SNC (intoxicação/abstinência) ou disfunção circulatória (sepse).',
      'Causa orgânica é mais provável quando início súbito, idade > 40 anos, sem história psiquiátrica, alucinações olfativas/táteis ou curso flutuante.',
    ],
    exames: [
      {
        titulo: 'Triagem imediata (1º minuto)',
        itens: [
          '4 Hs: Hipóxia, Hipoglicemia, Hipertermia, Hipovolemia',
          'Glicemia capilar em todos',
          'Sinais vitais + oximetria',
        ],
      },
      {
        titulo: 'Investigação se causa não psiquiátrica',
        itens: [
          'Eletrólitos (Na, Ca, P, Mg), função renal e hepática, função tireoidiana',
          'Gasometria arterial (acidose, hipercalemia)',
          'Rastreio infeccioso (hemograma, urina 1, Rx tórax, hemocultura ± liquor)',
          'ECG (QT antes de antipsicótico), rastreio toxicológico, TC de crânio na 1ª hora se indicado',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Delirium / causa clínica (sepse, metabólica, pós-ictal)',
      'Intoxicação (álcool, cocaína, simpaticomiméticos) ou abstinência',
      'Hipoglicemia e hipóxia',
      'Transtorno psiquiátrico primário (esquizofrenia, mania, transtorno de personalidade)',
      'TCE',
    ],
    conduta: [
      {
        titulo: 'Não farmacológico (sempre)',
        itens: [
          'Ambiente calmo, sem objetos perigosos; médico mais próximo da saída',
          'Abordagem verbal estruturada (SAVE: Suporte/Atenção, Validação, nomear Emoção)',
          'Equipe de segurança disponível',
        ],
      },
      {
        titulo: 'Contenção física (quando indicada)',
        itens: [
          'Só na agitação grave ou após falha do não farmacológico; pelo menor tempo possível, como PONTE até a contenção química',
          'Mínimo 5 pessoas (1 por membro + cabeça), supino com cabeceira a 30°, O₂ suplementar',
          'Monitorizar nível de consciência, sinais vitais, pele e perfusão dos membros contidos',
          'Complicações: rabdomiólise, distúrbio hidroeletrolítico, TEP, arritmia, asfixia',
        ],
      },
      {
        titulo: 'Contenção química (VO > IM > EV)',
        itens: [
          'Leve: lorazepam 1–2 mg VO ou diazepam 5–10 mg VO; 2ª linha haloperidol 2,5–5 mg VO ou risperidona 1–2 mg VO',
          'Moderada: midazolam 2–5 mg IM; 2ª linha haloperidol 5–10 mg IM',
          'Grave: cetamina 5 mg/kg IM; ou haloperidol 5–10 mg IM + prometazina 25–50 mg IM (mais rápido e com menos distonia que haloperidol isolado)',
          'Causa psiquiátrica conhecida (esquizofrenia/TB): preferir antipsicótico',
          'Abstinência alcoólica ou psicoestimulantes: preferir benzodiazepínico (ponderar depressão respiratória)',
          'Idoso, gestante, criança: evitar BZD, preferir antipsicótico atípico em baixa dose',
          'Evitar a combinação haloperidol + midazolam',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Diretrizes brasileiras de manejo da agitação psicomotora (ABP, 2019)',
        texto:
          'Midazolam 5 mg IM é superior a antipsicóticos no controle nos primeiros 15 min; haloperidol + prometazina superior a haloperidol isolado; cetamina como resgate na agitação grave de difícil sedação.',
      },
    ],
  },
  {
    id: 'abstinencia-alcoolica-dt',
    nome: 'Síndrome de abstinência alcoólica e delirium tremens',
    secao: 'Psiquiátricas',
    cid10: ['F10.3', 'F10.4'],
    sinonimos: ['SAA', 'delirium tremens', 'DT', 'abstinência de álcool', 'alucinose alcoólica'],
    fonte: 'USP (19ª ed., 2025), cap. 108 — Síndrome de abstinência alcoólica',
    resumo:
      'Síndrome de hiperexcitabilidade pela suspensão abrupta do álcool no etilista crônico. Diagnóstico: interrupção do uso + ≥ 2 sintomas (hiperatividade autonômica, tremor, insônia, náusea/vômito, alucinações, ansiedade, agitação, convulsão TCG). Benzodiazepínico é o esteio do tratamento, guiado pela CIWA-Ar. Tiamina ANTES da glicose. Delirium tremens (5% dos casos, 48–96 h após a última dose) é a forma mais grave e potencialmente fatal.',
    fisiopatologia: [
      'Uso crônico → down-regulation de receptores GABA-A e up-regulation de receptores NMDA (glutamato), adaptação aos efeitos depressores do álcool.',
      'Retirada abrupta → desequilíbrio excitatório/inibitório com hiperexcitabilidade e descarga adrenérgica (↑ noradrenalina e dopamina).',
    ],
    exames: [
      {
        titulo: 'Avaliação e gravidade',
        itens: [
          'Escala CIWA-Ar (leve < 15; moderada 16–20; grave > 20) para terapia guiada por sintomas',
          'Glicemia capilar obrigatória (excluir hipoglicemia)',
        ],
      },
      {
        titulo: 'Laboratório / rastreio',
        itens: [
          'Hemograma, eletrólitos com Mg e Ca, função renal e hepática, amilase/lipase',
          'ECG, Rx tórax, urina 1, beta-hCG; gasometria e CPK se moderado/grave',
          'TC de crânio se confusão, déficit focal, TCE, 1º episódio ou convulsões reentrantes',
          'Rastrear condição precipitante: infecção, trauma, SCA, pancreatite',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Delirium de outra causa (infecção, distúrbio metabólico)',
      'Encefalopatia de Wernicke (confusão + ataxia + oftalmoplegia)',
      'Hipoglicemia',
      'Abstinência de benzodiazepínico ou opioide',
      'Crise tireotóxica, sepse, meningite',
      'Psicose primária (na alucinose alcoólica o sensório está preservado)',
    ],
    conduta: [
      {
        titulo: 'Medidas gerais',
        itens: [
          'Ambiente calmo, reorientação; restrição mecânica evitada quando possível (frequente no DT)',
          'Hidratação vigorosa (SF ou Ringer-lactato), 1–2 L/dia, podendo chegar a 5 L/dia',
          'Tiamina 100–200 mg IM 1–2x/dia ANTES de qualquer glicose (prevenir Wernicke)',
          'Repor magnésio 1–2 g se hipomagnesemia; corrigir K e demais distúrbios',
        ],
      },
      {
        titulo: 'Benzodiazepínicos (esteio, guiado por CIWA-Ar)',
        itens: [
          'Leve/moderada VO: diazepam 5–10 mg VO 6/6–8/8 h com desmame; ou esquema baseado em sintomas',
          'Grave (CIWA > 20): diazepam 5–10 mg IV lento, repetir a cada 15–30 min; ou lorazepam 2–4 mg IV/IM a cada 15–20 min',
          'Front loading (CIWA > 19): diazepam 5–10 mg IV a cada 5–10 min até sedação leve',
          'Alvo: paciente calmo e levemente sedado, SEM rebaixamento (risco de aspiração)',
        ],
      },
      {
        titulo: 'Delirium tremens e refratários',
        itens: [
          'DT é emergência (mortalidade se não tratado); reposição volêmica + BZD em altas doses',
          'Se BZD insuficiente: midazolam IV contínuo (bolus 5 mg, depois ~2 mg/h) com monitorização respiratória',
          'Refratário: fenobarbital ou propofol (geralmente com IOT e VM)',
          'Antipsicótico (haloperidol 5 mg IM ou olanzapina 10 mg) só como adjuvante após 24–48 h em paciente muito alucinado — baixa o limiar convulsivo',
          'Convulsões: BZD; fenitoína é INEFICAZ na abstinência',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Terapia guiada por sintomas (JAMA, 1994; mantida)',
        texto:
          'Esquema baseado em CIWA-Ar reduz tempo de tratamento (mediana 9 h vs. 68 h) e dose total de BZD vs. dose fixa, sem aumentar convulsões ou DT.',
      },
    ],
  },
  {
    id: 'snm-serotoninergica',
    nome: 'Síndrome neuroléptica maligna e síndrome serotoninérgica',
    secao: 'Psiquiátricas',
    cid10: ['G21.0'],
    sinonimos: [
      'SNM',
      'síndrome neuroléptica maligna',
      'síndrome serotoninérgica',
      'toxicidade serotoninérgica',
    ],
    fonte: 'USP (19ª ed., 2025), cap. 17 — Febre e síndromes hipertérmicas',
    resumo:
      'Duas síndromes hipertérmicas iatrogênicas que se confundem. SNM: por antipsicóticos/antieméticos, instalação lenta (dias), com rigidez "cano de chumbo", hipertermia, ↑CPK e disautonomia. Síndrome serotoninérgica: por fármacos serotoninérgicos (ISRS, IRSN, tramadol, IMAO, linezolida), instalação rápida (< 24 h), com clônus, hiper-reflexia e mioclonias predominantes em membros inferiores. Em ambas: suspender o agente, resfriar e dar suporte; cada uma tem antídoto próprio.',
    fisiopatologia: [
      'SNM: bloqueio dopaminérgico (D2) central agudo por neurolépticos → hipertermia, rigidez e disautonomia.',
      'Síndrome serotoninérgica: excesso de atividade serotoninérgica no SNC, em geral por dois ou mais agentes serotoninérgicos; surge 2–24 h após a dose.',
    ],
    exames: [
      {
        titulo: 'SNM',
        itens: [
          'Clínico: febre + rigidez muscular + alteração do estado mental + instabilidade autonômica em paciente em uso de neuroléptico',
          'CPK tipicamente > 1.000 UI/L (pode chegar a 100.000), leucocitose com desvio à esquerda',
          'Rigidez generalizada "cano de chumbo"/roda dentada; instalação em 1–3 dias',
        ],
      },
      {
        titulo: 'Síndrome serotoninérgica (critérios de Hunter)',
        itens: [
          'Uso de droga serotoninérgica + um de: clônus espontâneo; clônus induzido + agitação/diaforese; clônus ocular + agitação/diaforese; tremor + hiper-reflexia; T > 38 °C + hipertonia + clônus',
          'Mioclonia e hiper-reflexia predominam em membros inferiores; mucosas secas, midríase',
          'Instalação rápida (< 24 h)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Entre as duas: SNM = rigidez "cano de chumbo", início lento, hiporreflexia, agente dopaminérgico; serotoninérgica = clônus/hiper-reflexia, início rápido, agente serotoninérgico',
      'Hipertermia maligna (anestésicos inalatórios/succinilcolina, rigidez de masseter)',
      'Heat stroke',
      'Sepse / meningoencefalite',
      'Crise tireotóxica',
      'Intoxicação anticolinérgica (pele seca, sem clônus) ou simpaticomimética',
    ],
    conduta: [
      {
        titulo: 'Síndrome neuroléptica maligna',
        itens: [
          'Suspender o neuroléptico (e outros psicotrópicos)',
          'Resfriamento externo + reposição volêmica vigorosa (proteger rim na rabdomiólise)',
          'Dantroleno (relaxante muscular direto): ~50 mg EV conforme necessidade, máx. 10 mg/kg/dia',
          'Bromocriptina 2,5–10 mg VO 3x/dia (agonista dopaminérgico)',
          'Benzodiazepínico (lorazepam 1–2 mg IM/EV) como adjuvante; amantadina 100–200 mg 2x/dia se não responsivo; ECT em refratários',
        ],
      },
      {
        titulo: 'Síndrome serotoninérgica',
        itens: [
          'Suspender TODOS os agentes serotoninérgicos',
          'Monitorização cardiopulmonar, O₂ (alvo SatO₂ > 92%), reposição volêmica',
          'Resfriamento externo; hipertermia > 41 °C → IOT, sedação e bloqueio neuromuscular',
          'Benzodiazepínico para agitação e relaxamento muscular: lorazepam 2–4 mg EV ou diazepam 5–10 mg EV',
          'Refratário: ciproeptadina 8–12 mg VO, depois 2 mg a cada 2 h (máx. 32 mg/24 h)',
          'Evitar butirofenonas (haloperidol, droperidol)',
          'Disautonomia: anti-hipertensivos de ação curta (nitroprussiato/esmolol) ou vasopressores diretos conforme PA',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Critérios de Hunter para toxicidade serotoninérgica',
        texto:
          'Clônus (espontâneo, induzido ou ocular) associado a agitação/diaforese é o achado central que distingue a síndrome serotoninérgica da SNM (rigidez "cano de chumbo" sem clônus).',
      },
    ],
  },
  {
    id: 'tentativa-suicidio',
    nome: 'Tentativa de suicídio e autointoxicação — abordagem na emergência',
    secao: 'Psiquiátricas',
    sinonimos: [
      'tentativa de autoextermínio',
      'autointoxicação',
      'overdose intencional',
      'comportamento suicida',
    ],
    fonte:
      'ABRAMEDE (2024), cap. — Tentativa de autoextermínio; USP (19ª ed.), cap. 102 e 104 (intoxicações)',
    resumo:
      'Dupla emergência: estabilizar a intoxicação/lesão (ABCDE + antídotos) E avaliar o risco psiquiátrico. A maioria tem transtorno mental de base; o período de até 3 meses após alta psiquiátrica é de altíssimo risco. Garantir ambiente seguro (remover objetos perigosos, vigilância), tratar o agente conforme a síndrome tóxica e fazer avaliação psiquiátrica antes da alta.',
    fisiopatologia: [
      'Ato impulsivo ou planejado, frequentemente associado a depressão, transtorno bipolar, psicose, uso de substâncias e estressores agudos.',
      'Na autointoxicação, a lesão depende do agente (hepatotoxicidade do paracetamol, cardiotoxicidade dos tricíclicos, depressão respiratória dos opioides).',
    ],
    exames: [
      {
        titulo: 'Avaliação clínica/toxicológica',
        itens: [
          'ABCDE; glicemia capilar, ECG (QRS e QTc), gasometria, lactato',
          'Identificar agente, dose, tempo e via; calcular ânion-gap e gap osmolar se álcoois tóxicos',
          'Níveis séricos de paracetamol e salicilato + rastreio em ingesta intencional; hemograma, função renal/hepática, coagulograma, CPK',
          'Reconhecer síndromes tóxicas (opioide: miose + bradipneia + rebaixamento; anticolinérgica: pele/mucosa seca, midríase, QRS/QT largo)',
        ],
      },
      {
        titulo: 'Avaliação de risco psiquiátrico',
        itens: [
          'Entrevista preferencialmente com o paciente sóbrio (o efeito da substância mascara o risco)',
          'Investigar intenção, planejamento, letalidade do método, tentativas prévias, suporte social',
          'Atenção a "overdose não intencional" e ferimentos em paciente com fatores de risco',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Intoxicação acidental vs. intencional',
      'Causa orgânica de alteração de consciência (TCE associado, hipoglicemia, sepse)',
      'Síndrome serotoninérgica em overdose de antidepressivos',
      'Coingesta múltipla (sempre considerar paracetamol oculto)',
    ],
    conduta: [
      {
        titulo: 'Estabilização e descontaminação',
        itens: [
          'ABCDE; IOT individualizada (não usar só Glasgow < 8); hipotensão → cristaloide 10–20 mL/kg, depois vasopressor/antídoto',
          'Carvão ativado 25–100 g (1 g/kg) se ingesta < 1–2 h, paciente alerta e via aérea protegida; contraindicado em corrosivos, cianeto, lítio, metais, álcoois',
          'Evitar flumazenil de rotina (precipita abstinência e convulsão)',
        ],
      },
      {
        titulo: 'Antídotos conforme agente',
        itens: [
          'Paracetamol: N-acetilcisteína — VO 140 mg/kg ataque + 70 mg/kg 4/4 h; ou EV 150 mg/kg em 1 h → 12,5 mg/kg/h 4 h → 6,25 mg/kg/h 16 h (ideal < 8 h, guiado pelo normograma de Rumack-Matthew)',
          'Opioide: naloxona (reverter bradipneia); ausência de resposta a 15 mg cumulativos sugere outra causa',
          'Tricíclicos/QRS largo > 100 ms: bicarbonato de sódio 8,4% 1–2 mEq/kg EV em bolus, repetir; manter infusão (150 mL NaHCO₃ + 1.000 mL SG5%) com alvo pH 7,5–7,55; convulsão → BZD; fenitoína contraindicada',
          'Organofosforado/carbamato: atropina; betabloqueador: glucagon; bloqueador de canal de cálcio: insulina alta dose + cálcio; metanol/etilenoglicol: fomepizol/etanol',
        ],
      },
      {
        titulo: 'Segurança e seguimento',
        itens: [
          'Remover objetos perigosos, vigilância contínua; contenção física/química só se risco iminente de autolesão',
          'Avaliação psiquiátrica completa classificando o risco; não dar alta sem reavaliação por psiquiatra se sintomas significativos',
          'Tratar a doença psiquiátrica de base e envolver família/rede de apoio; notificação compulsória da tentativa',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ABRAMEDE (2024) — fatores de risco',
        texto:
          'Risco até 200x maior nos 3 meses após alta de internação psiquiátrica; homens têm mortalidade ~3,8x maior por suicídio. Toda avaliação deve ser feita com o paciente idealmente sóbrio.',
      },
    ],
  },

  // ════════════ Expansão — Gastrointestinais e hepáticas (#91) ════════════
  {
    id: 'obstrucao-intestinal',
    nome: 'Obstrução intestinal',
    secao: 'Gastrointestinais',
    cid10: ['K56.6'],
    sinonimos: ['abdome agudo obstrutivo', 'íleo', 'suboclusão', 'oclusão intestinal'],
    fonte: 'ABRAMEDE 2024 — Dor abdominal aguda',
    resumo:
      'Interrupção do trânsito do delgado (≈75%) ou cólon (≈25%). Tétrade: dor em cólica, distensão, vômitos e parada de eliminação de gases/fezes. Mecânica (aderências, hérnia, tumor, volvo) × funcional (íleo adinâmico, Ogilvie). Base: jejum + SNG aberta + reposição volêmica; cirurgia se estrangulamento/isquemia/alça fechada ou falha do conservador.',
    fisiopatologia: [
      'Bloqueio luminal → dilatação proximal por gás e secreção, com aumento da pressão intraluminal, edema de parede e terceiro espaço (sequestro hidroeletrolítico).',
      'Mecânica: intraluminal (corpo estranho, fecaloma), parietal (tumor, estenose) ou extrínseca (aderências — 60–75% no delgado, hérnia, volvo, intussuscepção); cólon obstrui mais por câncer e volvo.',
      'Alça fechada (obstrução em 2 pontos) e estrangulamento comprometem a perfusão → isquemia, necrose e perfuração — emergência cirúrgica.',
      'Funcional (íleo paralítico): hipomotilidade sem barreira mecânica, por distúrbio metabólico, pós-operatório ou medicações; Ogilvie é pseudo-obstrução colônica no doente grave.',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Hemograma, eletrólitos (Na/K/Cl), função renal, gasometria — avaliar desidratação e distúrbios hidroeletrolíticos.',
          'Lactato: elevação sugere sofrimento de alça/estrangulamento (alerta para isquemia).',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'TC de abdome com contraste EV é o exame de escolha (S ≈ 87%, E ≈ 90%): zona de transição, nível e causa, edema mesentérico, líquido livre e sinais de isquemia (falta de realce da parede).',
          'Rx simples: níveis hidroaéreos, distensão central com pregas coniventes ("empilhamento de moedas", delgado) × distensão periférica com haustrações (cólon).',
          'Íleo adinâmico: distensão difusa de delgado e cólon com ar em ampola retal (diagnóstico de exclusão).',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Íleo paralítico/adinâmico e síndrome de Ogilvie (obstrução funcional).',
      'Isquemia mesentérica aguda (dor desproporcional ao exame).',
      'Hérnia encarcerada/estrangulada; diverticulite com estenose; neoplasia de cólon.',
      'Constipação grave/fecaloma; gastroenterite; pancreatite.',
    ],
    conduta: [
      {
        titulo: 'Suporte inicial (conservador)',
        itens: [
          'Jejum + sonda nasogástrica aberta para descompressão até queda do débito.',
          'Reposição volêmica com cristaloide (meta de euvolemia) e correção de Na/K e do equilíbrio acidobásico.',
          'Analgesia e antiemético; evitar procinéticos na obstrução mecânica (pioram a dor).',
          'Antibiótico apenas se suspeita de perfuração ou bacteremia.',
        ],
      },
      {
        titulo: 'Cirurgia (não retardar)',
        itens: [
          'Indicada em estrangulamento, isquemia de alça, obstrução em alça fechada/total, peritonite ou falha do tratamento não operatório.',
          'Sinais de alarme para estrangulamento: dor contínua e intensa, defesa/peritonite, febre, taquicardia, leucocitose e lactato elevado.',
          'Hérnia estrangulada: NÃO reduzir manualmente (risco de reduzir alça necrótica) — encaminhar para cirurgia.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'WSES (Bologna) — obstrução de delgado',
        texto:
          'Em obstrução de delgado por aderências sem sinais de estrangulamento, tentar manejo não operatório com SNG e contraste hidrossolúvel (gastrografina), com janela de até 72 h antes de indicar cirurgia.',
      },
    ],
  },
  {
    id: 'isquemia-mesenterica',
    nome: 'Isquemia mesentérica aguda',
    secao: 'Gastrointestinais',
    cid10: ['K55.0'],
    sinonimos: ['abdome agudo vascular', 'isquemia intestinal aguda', 'infarto mesentérico'],
    fonte: 'ABRAMEDE 2024 — Dor abdominal aguda (abdome agudo vascular)',
    resumo:
      'Interrupção abrupta do fluxo mesentérico → necrose intestinal. Marca clínica: dor intensa e súbita DESPROPORCIONAL ao exame físico. Tipos: embólica e trombótica arterial, venosa e não oclusiva (baixo fluxo). Angio-TC é o exame-chave; lactato eleva tardiamente. Conduta: ressuscitação, anticoagulação, revascularização e laparotomia para alças inviáveis. Alta letalidade — diagnóstico precoce salva.',
    fisiopatologia: [
      'Oclusiva arterial: embolia da artéria mesentérica superior (≈50%, fonte cardíaca — FA, IAM prévio) ou trombose sobre placa aterosclerótica.',
      'Oclusiva venosa: trombose da veia mesentérica (trombofilia, hipertensão portal, neoplasia) — instalação mais subaguda.',
      'Não oclusiva (NOMI): baixo fluxo esplâncnico em choque, desidratação grave ou vasoconstritores em altas doses.',
      'A hipoperfusão evolui de isquemia mucosa reversível → necrose transmural → perfuração e peritonite; complicação maior é a síndrome compartimental abdominal.',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Lactato: marcador de hipoperfusão, porém eleva-se TARDIAMENTE — lactato normal não exclui.',
          'Hemograma (leucocitose com desvio), gasometria com acidose metabólica, função renal, eletrólitos.',
          'Toque retal pode revelar sangue tipo "geleia de framboesa".',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'Angiotomografia de abdome total é o exame de escolha (S ≈ 93%, E ≈ 100%).',
          'Achados: redução/ausência de realce da parede intestinal, falha de enchimento arterial/venoso (trombo), gás na veia porta, pneumatose intestinal, hemorragia intramural, líquido livre.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pancreatite aguda, úlcera perfurada, aneurisma de aorta roto.',
      'Obstrução intestinal e cólica biliar.',
      'IAM de parede inferior, cetoacidose diabética (dor abdominal + acidose).',
    ],
    conduta: [
      {
        titulo: 'Suporte e medidas iniciais',
        itens: [
          'Ressuscitação volêmica com cristaloide ± hemocomponentes; corrigir acidose e distúrbios eletrolíticos.',
          'Sonda nasogástrica para descompressão; antibioticoterapia de amplo espectro (cobertura entérica).',
          'Se necessário vasopressor, preferir dobutamina/milrinone em baixa dose (poupar a perfusão mesentérica); evitar vasoconstritores potentes.',
        ],
      },
      {
        titulo: 'Terapia específica',
        itens: [
          'Oclusiva (arterial/venosa): anticoagulação plena — heparina não fracionada (alvo TTPa 40–60 s) se houver proposta cirúrgica; HBPM se manejo conservador.',
          'Revascularização (embolectomia, trombólise/stent endovascular ou bypass) conforme etiologia e viabilidade.',
          'NOMI: identificar e tratar a causa de baixo fluxo; cirurgia de controle de danos como adjuvante.',
        ],
      },
      {
        titulo: 'Cirurgia',
        itens: [
          'Laparotomia indicada na presença de peritonite: avaliar viabilidade e ressecar alças inviáveis, com frequente second-look.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'WSES 2017 — isquemia mesentérica aguda',
        texto:
          'Recomenda angio-TC precoce em todo paciente com suspeita (não retardar por dosagem de lactato) e abordagem multimodal precoce com revascularização para reduzir a alta mortalidade.',
      },
    ],
  },
  {
    id: 'diverticulite',
    nome: 'Diverticulite aguda',
    secao: 'Gastrointestinais',
    cid10: ['K57.9'],
    sinonimos: ['diverticulite', 'doença diverticular complicada'],
    capitulo: 76,
    resumo:
      'Inflamação de divertículo colônico, classicamente dor em fossa ilíaca esquerda + febre. TC é padrão-ouro e estratifica por Hinchey (modificada por Kaiser). Não complicada (Hinchey 0–1a): suporte ± antibiótico seletivo, podendo ser ambulatorial. Abscesso > 3–5 cm: drenagem percutânea. Perfuração com peritonite (Hinchey 3–4): cirurgia de urgência (Hartmann/anastomose).',
    fisiopatologia: [
      'Obstrução do divertículo por fecálito → abrasão da mucosa e bloqueio da drenagem → microperfuração e inflamação peridiverticular.',
      'Acomete sobretudo o cólon sigmoide; falsos divertículos (sem camada muscular).',
      'Evolução para complicações em ≈25%: abscesso, fístula, obstrução e perfuração com peritonite purulenta ou fecal.',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Hemograma (leucocitose) e PCR — PCR > 170 mg/L sugere doença complicada/perfuração; episódio leve provável com PCR < 170 mg/L.',
          'Modelo de Laméris (alta especificidade): dor só em QIE + PCR > 50 mg/L + ausência de vômitos.',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'TC de abdome com contraste é padrão-ouro (diagnóstico, exclusão de DDx e estadiamento): espessamento de parede > 4 mm, densificação da gordura pericólica, gás extraluminal, abscesso, líquido livre.',
          'USG útil em mulheres/jovens para DDx, mas limitada para abscesso e gás livre profundos.',
        ],
      },
      {
        titulo: 'Classificação de Hinchey (modificada por Kaiser)',
        itens: [
          '0: leve · 1a: inflamação/flegmão pericólico confinado · 1b: abscesso pericólico confinado.',
          '2: abscesso pélvico ou a distância · 3: peritonite purulenta generalizada · 4: peritonite fecal generalizada.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Apendicite (sobretudo se sigmoide redundante à direita), apendagite epiploica.',
      'Neoplasia de cólon (colonoscopia eletiva em 4–6 semanas após o episódio).',
      'Colite (isquêmica/infecciosa), DII; causas ginecológicas e urológicas (ITU, cólica nefrética).',
    ],
    conduta: [
      {
        titulo: 'Não complicada (Hinchey 0–1a)',
        itens: [
          'Casos selecionados (jovem, imunocompetente, sem sinais sistêmicos): manejo ambulatorial, antibiótico pode ser dispensável (a critério do serviço).',
          'Se optar por ATB VO 7–10 dias: ciprofloxacino 500 mg 12/12 h + metronidazol 500 mg 8/8 h; ou amoxicilina-clavulanato 875/125 mg 8/8 h.',
          'Não restringir dieta nem repouso absoluto; reavaliar em 2–7 dias.',
        ],
      },
      {
        titulo: 'Hospitalar',
        itens: [
          'Jejum/líquidos claros, hidratação cristaloide, correção hidroeletrolítica e analgesia escalonada.',
          'ATB EV (ex.: ciprofloxacino 400 mg 12/12 h + metronidazol 500 mg 8/8 h), transição para VO após 3–5 dias; duração total 10–14 dias.',
        ],
      },
      {
        titulo: 'Complicada',
        itens: [
          'Abscesso ≤ 3–5 cm: ATB + suporte e controle por imagem. Abscesso > 3–5 cm: drenagem percutânea guiada por imagem + ATB.',
          'Peritonite (Hinchey 3–4), perfuração, sepse ou instabilidade: cirurgia de urgência — Hartmann (ressecção + colostomia) nos graves, ou ressecção com anastomose primária nos estáveis.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'WSES 2020 — diverticulite aguda',
        texto:
          'Endossa manejo sem antibiótico na diverticulite não complicada de baixo risco e tratamento ambulatorial de pacientes selecionados; colonoscopia de seguimento após a fase aguda para excluir neoplasia.',
      },
    ],
  },
  {
    id: 'perfuracao-viscera-oca',
    nome: 'Perfuração de víscera oca (abdome agudo perfurativo)',
    secao: 'Gastrointestinais',
    cid10: ['K63.1'],
    sinonimos: [
      'abdome agudo perfurativo',
      'pneumoperitônio',
      'úlcera péptica perfurada',
      'víscera perfurada',
    ],
    fonte: 'ABRAMEDE 2024 — Dor abdominal aguda (abdome agudo perfurativo)',
    resumo:
      'Perfuração de víscera oca (estômago/duodeno, delgado, cólon, bexiga) → peritonite química e bacteriana com sepse. Dor súbita e intensa, abdome em tábua. Pneumoperitônio à Rx tórax ortostática (S 60–75%) ou TC (escolha). Conduta: ressuscitação volêmica, IBP em dose de ataque, ATB de amplo espectro e cirurgia de urgência.',
    fisiopatologia: [
      'Solução de continuidade da parede da víscera libera conteúdo entérico na cavidade → peritonite química (sucos digestivos) seguida de peritonite bacteriana e sepse.',
      'Causas por faixa etária: enterocolite necrosante (RN), apendicite (criança/adolescente), úlcera péptica e diverticulite (adulto), malignidade e abdome agudo vascular (idoso).',
      'Úlcera péptica perfurada: AINEs e H. pylori são os principais fatores; dor epigástrica súbita com irritação peritoneal.',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Hemograma, PCR, função renal, eletrólitos, lactato e gasometria (avaliar sepse/hipoperfusão).',
          'Amilase pode estar elevada (DDx com pancreatite); tipagem e provas cruzadas.',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'Rx de tórax ortostática (ou abdome em decúbito lateral E com raios horizontais): pneumoperitônio. Sensibilidade moderada (60–75%) — ausência não exclui.',
          'TC de abdome é o exame de escolha: detecta pneumoperitônio mínimo, líquido livre, espessamento de parede e densificação da gordura, localizando o ponto de perfuração.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pancreatite aguda (dor súbita e amilase elevada).',
      'Isquemia mesentérica aguda; obstrução intestinal complicada.',
      'Colecistite/colangite, IAM de parede inferior, ruptura de aneurisma de aorta.',
    ],
    conduta: [
      {
        titulo: 'Ressuscitação e medidas clínicas',
        itens: [
          'Ressuscitação volêmica vigorosa (sequestro para o terceiro espaço), meta de estabilidade hemodinâmica; considerar hemotransfusão.',
          'Inibidor de bomba de prótons em dose de ataque + manutenção (perfuração péptica); analgesia otimizada e antiemético.',
          'Sonda nasogástrica e jejum.',
        ],
      },
      {
        titulo: 'Antibioticoterapia',
        itens: [
          'ATB de amplo espectro com cobertura entérica (Gram-negativos e anaeróbios) precoce, pela contaminação peritoneal.',
        ],
      },
      {
        titulo: 'Cirurgia de urgência',
        itens: [
          'Encaminhamento imediato à cirurgia geral: rafia da perfuração (± patch de omento na úlcera) ou ressecção, e lavagem da cavidade.',
          'Suporte intensivo no pós-operatório para o controle da sepse.',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'WSES — peritonite intra-abdominal',
        texto:
          'Recomenda controle do foco (source control) cirúrgico precoce associado a antibioticoterapia empírica imediata e ressuscitação dirigida nos pacientes com peritonite difusa e sepse.',
      },
    ],
  },
  {
    id: 'insuficiencia-hepatica-aguda',
    nome: 'Insuficiência hepática aguda e encefalopatia hepática',
    secao: 'Gastrointestinais',
    cid10: ['K72.0'],
    sinonimos: ['Hepatite fulminante', 'Falência hepática aguda', 'IHA', 'encefalopatia hepática'],
    capitulo: 74,
    resumo:
      'IHA: lesão hepática grave com INR ≥ 1,5 + encefalopatia em paciente SEM hepatopatia prévia (≤ 26 semanas). Vigiar e tratar edema cerebral, hipoglicemia e coagulopatia; NAC mesmo em causa não-paracetamol; avaliar transplante (King’s College). Na encefalopatia hepática (cirrótico), a base é tratar o precipitante + lactulose.',
    fisiopatologia: [
      'IHA: necrose hepatocelular maciça → perda da função sintética (INR ↑, albumina ↓) e detoxificadora, com disfunção multiorgânica (hemodinâmica, renal, infecção).',
      'Edema cerebral/hipertensão intracraniana em 50–80% dos casos fulminantes (hiperamonemia → edema astrocitário); hipoglicemia por falência da gliconeogênese.',
      'Encefalopatia hepática: acúmulo de amônia → disfunção astrocitária e hiperatividade GABAérgica; quase sempre há fator precipitante (infecção/PBE, HDA, constipação, hipocalemia, diuréticos).',
    ],
    exames: [
      {
        titulo: 'Diagnóstico/gravidade',
        itens: [
          'IHA: INR ≥ 1,5 + qualquer grau de encefalopatia, sem hepatopatia prévia',
          'Transaminases muito elevadas (frequentemente > 40× LSN); queda > 50–60% em 24 h sugere falência iminente',
          'Fator V < 50% = pior prognóstico (independe de vitamina K)',
          'Encefalopatia: classificar por West-Haven (I–IV); amônia arterial apoia (não é sensível/específica)',
        ],
      },
      {
        titulo: 'Etiologia e suporte',
        itens: [
          'Nível sérico de paracetamol; sorologias virais (A, B, C, E); ceruloplasmina (Wilson); autoanticorpos',
          'Glicemia capilar seriada, gasometria/lactato, função renal, eletrólitos, bilirrubinas',
          'Paracentese diagnóstica se ascite (excluir PBE como precipitante); TC de crânio se sinais focais/convulsão/dúvida',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Sepse/encefalopatia séptica',
      'Hipoglicemia, distúrbios hidroeletrolíticos',
      'AVC, hemorragia/lesão intracraniana',
      'Encefalopatia de Wernicke',
      'Intoxicações (álcool, sedativos)',
      'Acute-on-chronic liver failure (ACLF — há hepatopatia prévia)',
    ],
    conduta: [
      {
        titulo: 'IHA — suporte e específico',
        itens: [
          'UTI; IOT se encefalopatia III/IV ou Glasgow < 8; manter PAM ≥ 50–60 mmHg com cristaloide balanceado, noradrenalina se preciso',
          'Corrigir glicemia (glicose EV), eletrólitos e coagulopatia; PFC 15 mL/kg só se sangramento ativo (não corrigir INR isolado)',
          'N-acetilcisteína EV (total 300 mg/kg): 150 mg/kg em 1 h → 50 mg/kg em 4 h → 100 mg/kg em 16 h — benéfica mesmo em IHA NÃO-paracetamol',
          'Profilaxia de úlcera de estresse; baixo limiar para antibiótico empírico (infecção em até 80%)',
        ],
      },
      {
        titulo: 'Edema cerebral e transplante',
        itens: [
          'Sinais de HIC: cabeceira elevada, manitol; monitorização de PIC em encefalopatia III/IV intubada',
          'Convulsão: fenitoína (preferencial)',
          'King’s College — paracetamol: pH < 7,30 OU os 3 juntos (INR > 6,5, creatinina > 3,4 mg/dL, encefalopatia III/IV)',
          'King’s College — não-paracetamol: INR > 6,5 OU 3 dos 5 (idade < 10 ou > 40 anos; etiologia não-A/não-B/medicamentosa; icterícia > 7 dias antes da encefalopatia; INR > 3,5; bilirrubina > 17,5 mg/dL)',
        ],
      },
      {
        titulo: 'Encefalopatia hepática (cirrótico)',
        itens: [
          'Tratar o fator precipitante (≈ 90% melhoram só com isso): suspender diuréticos, corrigir hipocalemia, tratar PBE/HDA/constipação',
          'Lactulose 20–40 mL VO a cada 4–8 h, alvo de 2–4 evacuações pastosas/dia; enema de lactulose se sem resposta/rebaixamento',
          'Sem resposta em 48 h: associar rifaximina 550 mg VO 12/12 h',
          'Tiamina parenteral antes de glicose se suspeita de Wernicke; profilaxia secundária com lactulose ± rifaximina',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AASLD — IHA',
        texto:
          'Definição com INR ≥ 1,5 + encefalopatia em ≤ 26 semanas sem hepatopatia prévia; NAC indicada inclusive em causas não-paracetamol.',
      },
      {
        diretriz: 'King’s College (transplante)',
        texto:
          'Critérios distintos para paracetamol e não-paracetamol orientam encaminhamento precoce ao transplante hepático.',
      },
    ],
  },
  {
    id: 'pbe',
    nome: 'Peritonite bacteriana espontânea (PBE)',
    secao: 'Gastrointestinais',
    cid10: ['K65.0'],
    sinonimos: ['Peritonite bacteriana espontânea', 'Ascite neutrocítica infectada'],
    capitulo: 72,
    resumo:
      'Infecção do líquido ascítico sem foco intra-abdominal cirúrgico, definida por PMN ≥ 250/mm³. Tratar com cefalosporina de 3ª geração + albumina (reduz síndrome hepatorrenal e mortalidade). Paracentese diagnóstica em TODO cirrótico com ascite admitido.',
    fisiopatologia: [
      'Translocação bacteriana intestinal em cirrose avançada (Child C) → colonização e infecção do líquido ascítico; germes: E. coli, K. pneumoniae (Gram-negativos) e, em menor parte, cocos Gram-positivos.',
      'Fatores de risco: proteína da ascite < 1 g/dL, PBE prévia (recorrência ≈ 70%/ano), hemorragia digestiva, ITU, Child C.',
      'Complica com lesão renal aguda/síndrome hepatorrenal e encefalopatia — daí o benefício da albumina e a urgência do tratamento (mortalidade aumenta ~3,3%/hora de atraso).',
    ],
    exames: [
      {
        titulo: 'Paracentese diagnóstica',
        itens: [
          'PMN ≥ 250/mm³ no líquido ascítico define PBE — independe de cultura',
          'Em punção hemorrágica: subtrair 1 PMN a cada 250 hemácias/mm³',
          'GASA (gradiente albumina soro-ascite) ≥ 1,1 g/dL confirma hipertensão portal; INR alargado NÃO contraindica a punção',
        ],
      },
      {
        titulo: 'Microbiologia e suporte',
        itens: [
          'Cultura do líquido em frascos de hemocultura (≥ 10 mL) + par de hemoculturas — coletar ANTES do antibiótico',
          'Função renal, eletrólitos, bilirrubinas, hemograma e coagulograma',
          'Diferenciar de peritonite secundária: ≥ 2 de glicose < 50 mg/dL, proteína > 1 g/dL, DHL > LSN, ou cultura polimicrobiana',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Peritonite bacteriana secundária (perfuração/abscesso)',
      'Bacterascite não neutrocítica (cultura+ com PMN < 250)',
      'Ascite neoplásica/carcinomatose',
      'Tuberculose peritoneal',
    ],
    conduta: [
      {
        titulo: 'Antibioticoterapia',
        itens: [
          'Iniciar imediatamente após a coleta de culturas — NÃO atrasar',
          'Ceftriaxona 1 g EV 12/12 h ou 2 g/dia, OU cefotaxima 2 g EV 6–8/8 h; duração 5–7 dias',
          'PBE nosocomial/associada a cuidados de saúde: ampliar espectro (ex.: piperacilina-tazobactam 4,5 g EV 8/8 h) conforme flora local',
          'Quinolona VO só em casos selecionados (sem vômito/choque/encefalopatia ≥ II, creatinina < 3) e se não estava em profilaxia com quinolona',
        ],
      },
      {
        titulo: 'Albumina e medidas associadas',
        itens: [
          'Albumina 1,5 g/kg EV no D1 + 1 g/kg EV no D3 — reduz síndrome hepatorrenal e mortalidade',
          'Indicada sobretudo se creatinina > 1 mg/dL, ureia > 60 ou bilirrubina total ≥ 4 mg/dL',
          'Suspender betabloqueador se PAM < 65 mmHg ou lesão renal aguda',
          'Paracentese de controle (48 h) se resposta ruim ou PBE nosocomial (esperado ↓ ≥ 25% dos PMN)',
        ],
      },
      {
        titulo: 'Profilaxia',
        itens: [
          'Pós-episódio de PBE: profilaxia indefinida (norfloxacino 400 mg/dia ou SMX-TMP)',
          'Hemorragia digestiva alta em cirrótico: ceftriaxona/norfloxacino por 7 dias',
          'Proteína da ascite < 1,5 g/dL com disfunção avançada: considerar profilaxia primária',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AASLD 2021 (manejo da ascite/PBE)',
        texto:
          'Manter betabloqueador não seletivo salvo hipotensão (PAM < 65) ou LRA; albumina obrigatória nos grupos de risco renal.',
      },
    ],
  },

  // ════════════ Expansão — Metabólicas/Eletrolíticas (#93) ════════════
  {
    id: 'coma-mixedematoso',
    nome: 'Coma mixedematoso',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E03.5'],
    sinonimos: ['Crise mixedematosa', 'Hipotireoidismo descompensado grave'],
    fonte: 'Tratado ABRAMEDE 2024 (Emergências tireoidianas)',
    resumo:
      'Descompensação extrema e rara do hipotireoidismo: hipotermia, bradicardia, rebaixamento do nível de consciência e hiponatremia, geralmente desencadeada por infecção/frio/suspensão da levotiroxina. Diagnóstico clínico — não aguardar exames. Tratar com levotiroxina IV + HIDROCORTISONA (antes do hormônio, para cobrir insuficiência adrenal). Letalidade alta (até ~60%).',
    fisiopatologia: [
      'Deficiência hormonal tireoidiana grave → hipometabolismo: queda do débito cardíaco, hipoventilação (retenção de CO₂), hipotermia e lentificação neurológica.',
      'Hiponatremia por redução do clearance de água livre; hipoglicemia; possível insuficiência adrenal associada — daí a necessidade de corticoide.',
      'Quase sempre há precipitante: infecção/sepse, exposição ao frio, IAM/AVC, sedativos/opioides, suspensão da reposição de levotiroxina.',
    ],
    exames: [
      {
        titulo: 'Confirmação e gravidade',
        itens: [
          'TSH ↑ com T4 livre (e T3) ↓ (hipotireoidismo primário); diagnóstico é CLÍNICO — não atrasar o tratamento',
          'Na⁺ (hiponatremia), glicemia (hipoglicemia), gasometria (acidose respiratória/hipercapnia)',
          'ECG: bradicardia, baixa voltagem, QT longo (risco de torsades); CPK e transaminases podem estar elevadas',
        ],
      },
      {
        titulo: 'Investigar precipitante/adrenal',
        itens: [
          'Hemograma, culturas, rastreio infeccioso (febre pode estar ausente)',
          'Cortisol basal antes do corticoide; cogitar insuficiência adrenal concomitante',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Sepse com hipotermia',
      'Hipotermia acidental primária',
      'Intoxicação por sedativos/opioides',
      'Insuficiência adrenal/crise addisoniana',
      'Hipoglicemia, hiponatremia de outra causa',
      'AVC, rebaixamento por causa neurológica',
    ],
    conduta: [
      {
        titulo: 'Suporte',
        itens: [
          'UTI; via aérea/ventilação mecânica precoce se hipoventilação/hipercapnia (causa frequente de óbito)',
          'Reaquecimento PASSIVO (cobertores, ambiente aquecido) — evitar reaquecimento ativo (vasodilatação → colapso)',
          'Hiponatremia/hipoglicemia: restrição hídrica ± salina; glicose 5–10% EV; vasopressores se hipotensão refratária',
        ],
      },
      {
        titulo: 'Hormônio + corticoide (ordem importa)',
        itens: [
          'HIDROCORTISONA 100 mg IV ANTES do hormônio tireoidiano (depois 100 mg IV 8/8 h) — repor T4 sem cobrir adrenal pode precipitar crise addisoniana',
          'Levotiroxina (T4) IV em dose de ataque 300–500 µg, manutenção 50–100 µg/dia IV/VO',
          'Pode-se associar liotironina (T3) 10–20 µg IV → 10 µg a cada 4–6 h em casos graves (conversão periférica reduzida)',
          'Tratar o precipitante (ex.: antibiótico empírico se infecção); monitorar cardíaco pelo risco arrítmico',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ATA — coma mixedematoso',
        texto:
          'Glicocorticoide deve preceder a reposição de hormônio tireoidiano; suporte ventilatório e correção de fatores precipitantes são determinantes do prognóstico.',
      },
    ],
  },
  {
    id: 'rabdomiolise',
    nome: 'Rabdomiólise',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['M62.8'],
    sinonimos: ['Síndrome de lise muscular', 'Mioglobinúria'],
    capitulo: 80,
    resumo:
      'Lise de músculo esquelético com liberação de conteúdo intracelular (CK, mioglobina, K⁺, fósforo). Suspeitar com CK > 5× o normal (geralmente > 1.000) e mioglobinúria. Risco de lesão renal aguda, hipercalemia e hipocalcemia. Base do tratamento: hidratação vigorosa com alvo de diurese 200–300 mL/h.',
    fisiopatologia: [
      'Dano ao sarcolema → influxo de cálcio e liberação de CK, mioglobina, potássio, fósforo e ácido úrico para a circulação.',
      'A mioglobina filtrada causa LRA por obstrução tubular (cilindros), vasoconstrição e toxicidade direta — favorecida por hipovolemia e urina ácida.',
      'Causas: trauma/esmagamento, imobilização prolongada, esforço extremo, convulsões/agitação, isquemia arterial, hipertermia, drogas (cocaína, álcool, estatinas), infecções.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'CK total > 5× o LSN (frequentemente > 1.000–5.000 U/L); pico em 24–72 h',
          'Urina I: dipstick positivo para sangue SEM hemácias ao sedimento = mioglobinúria; urina escura ("chá")',
          'Mioglobina sérica/urinária (eliminação rápida, pode normalizar antes da CK)',
        ],
      },
      {
        titulo: 'Complicações a monitorar',
        itens: [
          'Eletrólitos seriados: hipercalemia e hiperfosfatemia (precoces), hipocalcemia; hipocalemia e hipercalcemia tardias',
          'Função renal, ácido úrico; gasometria (acidose metabólica)',
          'ECG pela hipercalemia; vigiar síndrome compartimental',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hemoglobinúria (hemólise)',
      'Lesão renal aguda de outra etiologia',
      'IAM (CK-MB) / outras causas de CK elevada',
      'Síndrome compartimental',
      'Síndrome neuroléptica maligna / hipertermia maligna (com rabdomiólise secundária)',
    ],
    conduta: [
      {
        titulo: 'Hidratação (pilar)',
        itens: [
          'Reposição volêmica precoce e agressiva com cristaloide (ex.: SF 0,9% iniciando ~1–1,5 L/h e ajustar)',
          'ALVO de diurese 200–300 mL/h (≥ 50 mL/h no mínimo) até queda da CK e clareamento da mioglobinúria',
          'Monitorar balanço hídrico para evitar sobrecarga; débito urinário guia a infusão',
        ],
      },
      {
        titulo: 'Causa e complicações',
        itens: [
          'Remover/suspender o agente causal (ex.: estatina, drogas); descomprimir síndrome compartimental',
          'Hipercalemia: tratamento padrão (gluconato de cálcio se alterações no ECG, insulina+glicose etc.)',
          'Repor cálcio APENAS se hipocalcemia sintomática/hipercalemia grave (na recuperação o Ca pode subir)',
          'Diálise se LRA com hipercalemia refratária, acidose grave ou hipervolemia',
        ],
      },
      {
        titulo: 'Medidas controversas',
        itens: [
          'Alcalinização urinária (bicarbonato, alvo pH urinário > 6,5): benefício incerto — só com volemia/diurese estabelecidas e monitorando cálcio/pH',
          'Manitol: benefício duvidoso, apenas com diurese já estabelecida',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Manejo da rabdomiólise (LRA)',
        texto:
          'A fluidoterapia precoce e abundante guiada por débito urinário é a medida que mais previne LRA; bicarbonato e manitol não têm benefício consistente e são opcionais.',
      },
    ],
  },
  {
    id: 'crise-hipercalcemica',
    nome: 'Crise hipercalcêmica',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E83.5'],
    sinonimos: ['Hipercalcemia grave', 'Hipercalcemia sintomática'],
    capitulo: 88,
    resumo:
      'Cálcio total corrigido > 14 mg/dL (ou Ca iônico > 7 mg/dL) com disfunção de múltiplos órgãos, ou hipercalcemia sintomática. Paciente profundamente desidratado. Pilar: hidratação salina vigorosa + antirreabsortivo ósseo (bifosfonato), com calcitonina para efeito rápido. Causas dominantes: hiperparatireoidismo primário (ambulatório) e malignidade (no PS).',
    fisiopatologia: [
      'Influxo de cálcio do esqueleto (reabsorção óssea osteoclástica) + menor clearance renal; em 90% por hiperparatireoidismo ou malignidade.',
      'Na malignidade, ~80% por PTHrp (tumores escamosos, pulmão, mama, renal); restante por metástases osteolíticas/mieloma ou 1,25-vitamina D (linfomas).',
      'A hipercalcemia causa poliúria por diabetes insípido nefrogênico → desidratação → queda da TFG → alça viciosa que agrava a calcemia.',
      'Corrigir o cálcio pela albumina: Ca corrigido = Ca medido + [(4,0 − albumina) × 0,8]; preferir cálcio iônico se hipoalbuminemia/distúrbio acidobásico.',
    ],
    exames: [
      {
        titulo: 'Confirmação e repercussão',
        itens: [
          'Cálcio total + albumina (corrigir) ou cálcio iônico (padrão-ouro)',
          'Função renal e eletrólitos — atenção ao potássio',
          'ECG: encurtamento do intervalo QT; bradiarritmias, BAV; potencializa toxicidade da digoxina',
        ],
      },
      {
        titulo: 'Etiologia',
        itens: [
          'PTH: elevado → hiperparatireoidismo 1º/3º; suprimido → malignidade e demais causas',
          'PTHrp, 25-OH e 1,25-OH vitamina D conforme suspeita',
          'Fósforo (baixo em hiperpara/PTHrp), rastreio de neoplasia',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hiperparatireoidismo primário (adenoma) × hipercalcemia da malignidade',
      'Doenças granulomatosas (sarcoidose, TB) e linfoma (↑ 1,25-vitamina D)',
      'Hipercalcemia hipocalciúrica familiar (FECa < 1%), intoxicação por vitamina D/A, tireotoxicose, lítio, síndrome milk-álcali',
    ],
    conduta: [
      {
        titulo: 'Hidratação (1ª medida)',
        itens: [
          'Salina 0,9% vigorosa: bolus 1–2 L, depois 200–300 mL/h (4–6 L/dia), alvo débito urinário 100–150 mL/h',
          'Furosemida NÃO de rotina — só após reidratar, se hipervolemia/edema pulmonar (20–40 mg EV)',
          'Monitorar potássio e magnésio durante a diurese salina',
        ],
      },
      {
        titulo: 'Antirreabsortivos ósseos',
        itens: [
          'Bifosfonato é a droga de escolha: zoledronato 4 mg EV em 15 min (normaliza Ca em < 3 dias em 80–100%) — evitar se ClCr < 30 mL/min',
          'Alternativa: pamidronato 60–90 mg EV em 2–4 h',
          'Calcitonina 4–8 UI/kg IM/SC 8/8–12/12 h: início em horas, ponte até o bifosfonato; máx. 48–72 h (taquifilaxia), nunca isolada',
          'Denosumab 120 mg SC: refratários a bifosfonato ou DRC grave',
        ],
      },
      {
        titulo: 'Casos selecionados / refratários',
        itens: [
          'Corticoide (prednisona ~1 mg/kg/dia) em linfoma, mieloma, granulomatoses e intoxicação por vitamina D',
          'Hemodiálise com banho sem cálcio se arritmia/BAV ameaçador, refratariedade ou DRC',
          'Evitar tiazídico, lítio, depleção de volume e suplementos de cálcio',
        ],
      },
      {
        titulo: 'Disposição',
        itens: [
          'Internar se Ca > 12 mg/dL sintomático; UTI se Ca > 16 mg/dL ou estado mental alterado/arritmia',
          'Envolver oncologia precocemente na hipercalcemia da malignidade',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Endocrine Society 2023',
        texto:
          'Reposição salina (bolus 1–2 L + 200–500 mL/h) com bifosfonato; denosumab sugerido sobre o bifosfonato na hipercalcemia da malignidade, sendo preferencial quando há disfunção renal grave.',
      },
    ],
  },
  {
    id: 'disturbios-calcio',
    nome: 'Distúrbios do cálcio (hiper e hipocalcemia)',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E83.5'],
    sinonimos: ['Hipocalcemia', 'Hipercalcemia'],
    capitulo: 87,
    resumo:
      'Sempre corrigir o cálcio total pela albumina ou usar cálcio iônico (a fração ativa). Hipocalcemia (Ca total < 8,5 ou iônico < 4,4 mg/dL): hiperexcitabilidade neuromuscular — tetania, Trousseau/Chvostek, QT longo; tratar com gluconato de cálcio EV se sintomática. Hipercalcemia (Ca > 10,5 mg/dL): ver ficha de crise hipercalcêmica para o manejo agudo.',
    fisiopatologia: [
      'Cálcio regulado por PTH (↑ reabsorção óssea e tubular, fosfatúria), vitamina D (↑ absorção intestinal) e calcitonina.',
      'Ligação à albumina é pH-dependente: alcalemia ↑ ligação e ↓ cálcio iônico (sintomas de hipocalcemia com Ca total normal — ex.: alcalose respiratória); acidemia faz o inverso.',
      'Correção: Ca corrigido = Ca medido + [(4,0 − albumina) × 0,8]. Hipoalbuminemia falseia o cálcio total para baixo sem alterar o iônico.',
      'Hipocalcemia: hipoparatireoidismo (pós-tireoidectomia é a causa adulta mais comum), DRC, deficiência/resistência à vitamina D, hipomagnesemia, sepse, pancreatite, citrato (transfusão maciça), hiperfosfatemia/lise tumoral.',
    ],
    exames: [
      {
        titulo: 'Hipocalcemia',
        itens: [
          'Cálcio iônico confirma; dosar magnésio e fósforo',
          'PTH: baixo → hipoparatireoidismo; alto → pseudo-hipopara, deficiência de vitamina D, DRC',
          'ECG: QT longo (prolonga o segmento ST) — risco de arritmia',
          'Trousseau (espasmo carpopedal ao manguito > PAS por 3 min, mais específico) e Chvostek',
        ],
      },
      {
        titulo: 'Hipercalcemia',
        itens: [
          'Confirmar com 2ª dosagem; suspender fármacos associados (tiazídico, lítio, vitamina D)',
          'PTH, fósforo, função renal; ECG com QT curto',
          'Investigar malignidade/hiperparatireoidismo (ver ficha específica)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hipocalcemia × tétano, miotonias, hipertermia maligna, alcalose respiratória (hiperventilação)',
      'Convulsão, distúrbio extrapiramidal e IC aguda de outras causas',
      'Pseudo-hipocalcemia por hipoalbuminemia (principal causa artefatual)',
      'Hipercalcemia: hiperparatireoidismo × malignidade × granulomatoses (ver crise hipercalcêmica)',
    ],
    conduta: [
      {
        titulo: 'Hipocalcemia sintomática (tetania, QT longo, Ca corrigido < 7,5)',
        itens: [
          'Gluconato de cálcio 10% 10–20 mL (1–2 g = 100–200 mg de cálcio elementar) EV lento em 10–20 min, diluído em SG 5%/SF',
          'Cada mL de gluconato 10% = 9 mg de cálcio elementar; cloreto de cálcio = 27 mg/mL (cáustico, exige acesso central)',
          'Manter infusão lenta 0,5–1,5 mg/kg/h de cálcio elementar até estabilizar',
          'Monitorização ECG contínua — risco em digitalizados; corrigir SEMPRE o magnésio junto (2 g de sulfato de Mg em 100 mL em 10 min)',
        ],
      },
      {
        titulo: 'Hipocalcemia leve/assintomática',
        itens: [
          'Cálcio oral (carbonato/citrato), ~1.000 mg/dia; tratar a etiologia',
          'Repor vitamina D (calcitriol 0,25–0,5 µg 2×/dia tem início mais rápido na fase aguda)',
          'Na DRC: quelante de fósforo + calcitriol',
        ],
      },
      {
        titulo: 'Hipercalcemia',
        itens: [
          'Assintomática leve (Ca < 12): hidratação e orientação, evitar fatores agravantes',
          'Sintomática / Ca > 14: ver ficha "Crise hipercalcêmica" (salina + bifosfonato + calcitonina)',
        ],
      },
    ],
  },
  {
    id: 'disturbios-magnesio-fosforo',
    nome: 'Distúrbios do magnésio e do fósforo',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E83.4', 'E83.3'],
    sinonimos: ['Hipomagnesemia', 'Hipermagnesemia', 'Hipofosfatemia', 'Hiperfosfatemia'],
    fonte: 'ABRAMEDE 2024, cap. 121 (Distúrbios do cálcio, magnésio e fósforo)',
    resumo:
      'Hipomagnesemia: hiperexcitabilidade neuromuscular, arritmias/torsades e refratariedade na correção de potássio e cálcio — repor sulfato de magnésio EV e procurar a causa. Hipermagnesemia: típica da DRC, com hiporreflexia, BAV e parada — cálcio EV antagoniza e diálise resolve. Fósforo: hipofosfatemia grave (< 1 mg/dL) gera depleção de ATP multiorgânica (refeeding, etilismo); hiperfosfatemia na LRA/DRC e lise tumoral.',
    fisiopatologia: [
      'Magnésio é cofator essencial: a hipomagnesemia perpetua hipocalemia (perda renal de K) e hipocalcemia (↓ secreção e ação do PTH), além de Trousseau/Chvostek com cálcio normal.',
      'Causas de hipomagnesemia: diuréticos de alça/tiazídicos, IBP, aminoglicosídeos, anfotericina B, cisplatina, álcool, diarreia, refeeding.',
      'Hipermagnesemia quase sempre exige queda da função renal (DRC) ou aporte excessivo (laxantes/antiácidos com Mg, sulfato de Mg em pré-eclâmpsia).',
      'Hipofosfatemia: redistribuição para o intracelular na realimentação (insulina), CAD em tratamento, alcalose respiratória, etilismo; < 1 mg/dL → rabdomiólise, falência ventilatória, hemólise.',
      'Hiperfosfatemia: redução da excreção renal (LRA/DRC) ou liberação celular (lise tumoral, rabdomiólise) → quela o cálcio e causa hipocalcemia.',
    ],
    exames: [
      {
        titulo: 'Magnésio',
        itens: [
          'Magnésio sérico; dosar K, Ca e fósforo associados',
          'ECG: hipoMg → QT/QRS alargados, torsades; hiperMg → bradicardia, BAV, alargamento de QRS',
          'Hipermagnesemia: avaliar reflexos tendinosos (hiporreflexia é sinal precoce) e função renal',
        ],
      },
      {
        titulo: 'Fósforo',
        itens: [
          'Fósforo sérico; em hiperfosfatemia checar cálcio, K, ácido úrico e função renal (lise tumoral)',
          'Hipofosfatemia: rastrear refeeding, etilismo, CAD; CPK se suspeita de rabdomiólise',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Distúrbios eletrolíticos coexistentes — dosar o painel iônico completo (Mg, Ca, K, P)',
      'Hipomagnesemia como causa oculta de hipocalemia/hipocalcemia refratárias e de torsades',
      'Síndrome de lise tumoral (hiperfosfatemia + hipocalcemia + hipercalemia + ↑ ácido úrico)',
      'Síndrome de realimentação (hipofosfatemia + hipocalemia + hipomagnesemia + deficiência de tiamina)',
    ],
    conduta: [
      {
        titulo: 'Hipomagnesemia',
        itens: [
          'Sintomática/grave: sulfato de magnésio 1–2 g EV em 10–60 min; PCR ou torsades: bolus 1–2 g EV',
          'Manutenção 0,5–1 g/h até resolução (taxa > 1–2 g/h causa hiporreflexia, depressão respiratória, BAV)',
          'Repor Mg sempre que se repõe potássio EV; tratar mesmo com Mg "normal" se quadro sugestivo',
          'Leve/assintomática: óxido de magnésio 400 mg VO 2×/dia',
        ],
      },
      {
        titulo: 'Hipermagnesemia',
        itens: [
          'Suspender fonte de Mg; fluidos isotônicos ± furosemida (1 mg/kg) se função renal preservada',
          'Risco à vida: gluconato de cálcio 2 g (ou cloreto de cálcio 1 g) EV, repetir s/n — antagoniza diretamente',
          'Diálise (banho sem Mg) na DRC ou refratária',
        ],
      },
      {
        titulo: 'Hipofosfatemia',
        itens: [
          'Repor se < 2,0 mg/dL; tratamento imediato se < 1,0 mg/dL ou sintomática',
          'Leve/estável: fósforo oral 250–500 mg 2×/dia',
          'Grave: fosfato de potássio/sódio EV (ex.: ~1,3 mmol/kg de fósforo elementar, máx. 100 mmol, em 24 h); monitorar Ca, K e função renal',
          'Na CAD a reposição rotineira de fosfato não traz benefício comprovado',
        ],
      },
      {
        titulo: 'Hiperfosfatemia',
        itens: [
          'Tratar a causa de base; corrigir a hipocalcemia associada',
          'Função renal normal: SF + diurético de alça',
          'DRC/LRA: quelantes de fósforo + restrição dietética; hemodiálise precoce se grave',
        ],
      },
    ],
  },
  {
    id: 'disturbios-acido-base',
    nome: 'Distúrbios do equilíbrio ácido-base',
    secao: 'Metabólicas/Eletrolíticas',
    cid10: ['E87.2', 'E87.3'],
    sinonimos: [
      'Acidose metabólica',
      'Alcalose metabólica',
      'Acidose respiratória',
      'Alcalose respiratória',
      'Distúrbios acidobásicos',
      'ânion-gap',
    ],
    capitulo: 82,
    resumo:
      'Abordagem sistemática da gasometria: pH → distúrbio primário (HCO₃ vs pCO₂) → compensação esperada → ânion-gap → gap-gap. A gasometria pode estar "normal" e ainda esconder distúrbios mistos — o ânion-gap pode ser a única pista. Foco no tratamento da causa, não na correção isolada do pH; bicarbonato tem indicação restrita.',
    fisiopatologia: [
      'Homeostase do pH (7,35–7,45) pela tríade pulmão (pCO₂, segundos a minutos), rim (HCO₃, horas a dias) e tampões.',
      'Distúrbio metabólico primário (altera HCO₃) gera resposta respiratória compensatória na mesma direção; respiratório (altera pCO₂) gera resposta renal na mesma direção.',
      'Ânion-gap = Na − (Cl + HCO₃), normal 10 ± 2; corrigir +2,5 para cada 1 g/dL de albumina abaixo de 4,5 (hipoalbuminemia mascara AG alto).',
      'Na alcalose, o cálcio liga-se mais à albumina e o cálcio iônico cai — daí sintomas tipo hipocalcemia na alcalose respiratória.',
    ],
    exames: [
      {
        titulo: 'Roteiro de interpretação (passo a passo)',
        itens: [
          '1. História/exame + gasometria E eletrólitos simultâneos',
          '2. pH: acidemia (< 7,35) ou alcalemia (> 7,45)',
          '3. Distúrbio primário: metabólico (Δ HCO₃) ou respiratório (Δ pCO₂)',
          '4. Compensação esperada (ver abaixo); fora da faixa = distúrbio misto',
          '5. Calcular ânion-gap (corrigir pela albumina)',
          '6. Gap-gap (delta-delta) e gap osmolar se AG alto',
        ],
      },
      {
        titulo: 'Fórmulas de compensação',
        itens: [
          'Acidose metabólica — Winter: pCO₂ esperada = 1,5 × HCO₃ + 8 ± 2 (ou pCO₂ ≈ HCO₃ + 15)',
          'Alcalose metabólica: pCO₂ esperada = 0,7 × HCO₃ + 20',
          'Acidose respiratória: HCO₃ sobe 1 (aguda) / 4 (crônica) por 10 mmHg de Δ pCO₂',
          'Alcalose respiratória: HCO₃ cai 2 (aguda) / 5 (crônica) por 10 mmHg de Δ pCO₂',
        ],
      },
      {
        titulo: 'Delta-delta e gap osmolar',
        itens: [
          'ΔAG/ΔHCO₃: > 2 → alcalose metabólica associada; < 1 → acidose de AG normal associada; 1–2 → AG alto puro',
          'Gap osmolar = osm medida − [2×Na + glicose/18 + ureia/6]; > 10 sugere metanol/etilenoglicol',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Acidose metabólica de AG ALTO (GOLDMARK/MUDPILES): acidose láctica, cetoacidose (diabética/alcoólica/jejum), uremia, toxinas (metanol, etilenoglicol, salicilato, propilenoglicol)',
      'Acidose metabólica de AG NORMAL (hiperclorêmica): diarreia, acidose tubular renal (I/II/IV), excesso de SF 0,9%',
      'Alcalose metabólica: vômitos/SNG, diuréticos, hipocalemia, hiperaldosteronismo, síndrome milk-álcali',
      'Respiratórias: hipoventilação (acidose — DPOC, depressão do SNC) × hiperventilação (alcalose — dor, ansiedade, sepse, TEP, salicilato)',
    ],
    conduta: [
      {
        titulo: 'Princípio geral',
        itens: [
          'Tratar a CAUSA do distúrbio, não o pH; corrigir HCO₃ isoladamente raramente ajuda',
          'Bicarbonato pode causar hipervolemia, hipernatremia, queda do cálcio iônico e acidose intracelular paradoxal',
        ],
      },
      {
        titulo: 'Acidose metabólica',
        itens: [
          'Reverter a causa (volume/perfusão na láctica, insulina na CAD, antídoto/diálise nas toxinas)',
          'NaHCO₃ só em situações específicas: pH < 7,2 (sobretudo com LRA AKIN 2–3), acidose hiperclorêmica com pH < 7,2, intoxicação por metanol/etilenoglicol, ou pH < 6,9 (CAD)',
          'Infundir lento e diluído (ex.: 50 mL NaHCO₃ 8,4% + 950 mL SG 5%); alvo subir HCO₃ ~10 mEq/L / pH ~7,2, não normalizar',
        ],
      },
      {
        titulo: 'Alcalose metabólica',
        itens: [
          '1ª medida: repor déficit de volume (SF) e de potássio (alvo K ≥ 5)',
          'Se persistir: acetazolamida 250–500 mg (induz bicarbonatúria), útil na pós-hipercápnica com hipervolemia',
          'Tratar a causa de base (suspender diurético, tratar vômitos, controlar hiperaldosteronismo)',
        ],
      },
      {
        titulo: 'Distúrbios respiratórios',
        itens: [
          'Acidose respiratória: tratar a causa, suporte ventilatório (VNI/IOT); na crônica (DPOC) alvo SatO₂ 88–92% para não abolir o drive',
          'Alcalose respiratória: tratar a etiologia; lembrar salicilato e TEP como causas a excluir',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'BICAR-ICU (Lancet 2018)',
        texto:
          'Em pacientes críticos com acidemia grave (pH ≤ 7,2), o bicarbonato não reduziu mortalidade global, mas houve benefício no subgrupo com LRA AKIN 2–3 — um pH < 7,2 parece razoável para indicar reposição nessa população.',
      },
    ],
  },
  {
    id: 'colica-renal',
    nome: 'Cólica nefrética / litíase urinária',
    secao: 'Renais/Urológicas',
    cid10: ['N23', 'N20.0'],
    sinonimos: [
      'cólica renal',
      'litíase renal',
      'nefrolitíase',
      'urolitíase',
      'cálculo ureteral',
      'pedra no rim',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Diretriz AUA/EAU de litíase urinária',
    resumo:
      'Dor lombar/em flanco de início súbito, em cólica (vai-e-vem), tipicamente irradiando para a região inguinal, testículo/grande lábio, associada a inquietação, náuseas e disúria — causada por obstrução aguda do trato urinário por cálculo. Pico entre 30–60 anos, mais comum em homens. A maioria dos cálculos < 5 mm é eliminada espontaneamente; o objetivo na emergência é analgesia, confirmação diagnóstica e identificação das indicações de desobstrução urgente (febre/obstrução = urgência urológica).',
    fisiopatologia: [
      'O cálculo impactado eleva a pressão intraluminal a montante, distendendo ureter, pelve e cápsula renal — a dor decorre dessa distensão e do espasmo da musculatura lisa ureteral, não do "trauma" da pedra.',
      'A obstrução estimula a síntese de prostaglandinas, que aumentam o fluxo sanguíneo renal e a diurese (piorando a distensão) e sensibilizam terminações nociceptivas — base do efeito dos AINEs.',
      'Composição mais comum: oxalato de cálcio (~80%); seguem-se ácido úrico (radiotransparentes), estruvita (infecção por germes produtores de urease — Proteus) e cistina.',
      'Pontos de estreitamento e impactação: junção ureteropélvica, cruzamento dos vasos ilíacos e junção ureterovesical (mais comum).',
    ],
    exames: [
      {
        titulo: 'Laboratório',
        itens: [
          'Urina I (EAS): hematúria micro/macroscópica em ~85% (sua ausência NÃO exclui); leucocitúria/nitrito sugerem infecção associada',
          'Função renal (ureia/creatinina) — rim único, transplantado ou suspeita de LRA obstrutiva',
          'Hemograma e PCR se suspeita de pielonefrite/obstrução infectada; β-hCG em mulher em idade fértil (excluir gravidez ectópica)',
        ],
      },
      {
        titulo: 'Imagem',
        itens: [
          'TC de abdome SEM contraste (helicoidal): padrão-ouro — detecta cálculo, tamanho, localização e sinais de obstrução (hidronefrose, borramento perirrenal)',
          'USG (1ª linha em gestantes, jovens e dor recorrente já investigada): vê hidronefrose e cálculos em pelve/JUV; POCUS útil à beira-leito',
          'RX simples (abdome): só detecta cálculos radiopacos; baixa sensibilidade, uso limitado ao acompanhamento',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pielonefrite aguda (febre, dor à punho-percussão, piúria) — pode coexistir com obstrução',
      'Aneurisma de aorta abdominal roto/dissecção (essencial excluir em > 50 anos com "primeira cólica renal")',
      'Apendicite, diverticulite, isquemia mesentérica, cólica biliar',
      'Gravidez ectópica, torção/cisto ovariano, torção testicular',
      'Lombalgia musculoesquelética, herpes-zóster (fase pré-eruptiva)',
    ],
    conduta: [
      {
        titulo: 'Analgesia (foco do atendimento)',
        itens: [
          'AINE é 1ª linha quando função renal preservada: cetoprofeno 100 mg IV ou diclofenaco 75 mg IM — analgesia superior e menos vômitos que opioide',
          'Opioide se AINE contraindicado/insuficiente: morfina ou tramadol IV tituláveis',
          'Antiemético (metoclopramida/ondansetrona) e hidratação para conforto — hiperhidratar NÃO acelera a eliminação e pode piorar a dor',
          'Dipirona é opção adjuvante amplamente usada no Brasil',
        ],
      },
      {
        titulo: 'Terapia médica expulsiva e alta',
        itens: [
          'Cálculo distal ≤ 10 mm sem complicação: alta com tansulosina 0,4 mg/dia (alfabloqueador) por até 4 semanas + analgesia oral (AINE) e orientação para coar a urina',
          'Filtro/peneira para capturar o cálculo (análise da composição) e orientação de retorno',
          'Retorno imediato se: febre, dor incontrolável, vômitos persistentes, anúria',
        ],
      },
      {
        titulo: 'Indicações de internação / urologia urgente',
        itens: [
          'OBSTRUÇÃO + INFECÇÃO (febre, leucocitose, piúria): emergência — ATB de amplo espectro + desobstrução urgente (cateter duplo-J ou nefrostomia percutânea); risco de urossepse',
          'LRA obstrutiva, rim único/transplantado, obstrução bilateral',
          'Dor ou vômitos refratários ao tratamento; cálculo > 10 mm (baixa chance de eliminação espontânea)',
          'Programação eletiva (LECO/ureteroscopia) para cálculos que não eliminam',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AUA/EAU — litíase ureteral',
        texto:
          'A terapia médica expulsiva com alfabloqueador (tansulosina) tem maior benefício em cálculos distais > 5 mm; para cálculos < 5 mm o benefício é pequeno (alta taxa de eliminação espontânea). A combinação obstrução + infecção exige drenagem urgente — NÃO tentar manipular/remover o cálculo no sistema infectado antes de descomprimir.',
      },
    ],
  },
  {
    id: 'retencao-urinaria-aguda',
    nome: 'Retenção urinária aguda',
    secao: 'Renais/Urológicas',
    cid10: ['R33'],
    sinonimos: [
      'RUA',
      'bexigoma',
      'globo vesical',
      'retenção vesical',
      'anúria obstrutiva baixa',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Tratado de Medicina de Emergência ABRAMEDE (Manole, 1ª ed., 2024)',
    resumo:
      'Incapacidade súbita e dolorosa de esvaziar a bexiga apesar do desejo miccional, com bexiga palpável/percussível distendida (bexigoma). Causa mais comum no homem idoso é a hiperplasia prostática benigna; o tratamento imediato é a drenagem por cateterismo vesical. Distinga-a da anúria (ausência de produção de urina) — na retenção há urina, mas ela não sai.',
    fisiopatologia: [
      'Mecanismos: obstrução infravesical (HPB, estenose de uretra, cálculo/coágulo, neoplasia, fimose/parafimose), falência detrusora (bexiga neurogênica, fármacos) ou inflamatória/álgica.',
      'Fármacos precipitantes frequentes: anticolinérgicos, opioides, simpaticomiméticos (descongestionantes), antidepressivos tricíclicos, anti-histamínicos.',
      'A descompressão alivia a pressão retrógrada sobre ureteres e rins; obstrução prolongada pode causar LRA pós-renal e, após o alívio, diurese pós-obstrutiva (poliúria) por perda transitória da capacidade de concentração.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Diagnóstico é clínico (dor suprapúbica + bexigoma); USG/POCUS vesical confirma e estima o volume retido',
          'Função renal (creatinina/ureia) e eletrólitos — avaliar LRA pós-renal',
          'Urina I/urocultura (colher após sondagem) se suspeita de ITU; PSA NÃO deve ser dosado na fase aguda (elevado pela retenção/sondagem)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Anúria por causa pré-renal/renal (bexiga vazia — não há bexigoma)',
      'Dor abdominal aguda de outra etiologia com distensão (íleo, ascite)',
      'Causa obstrutiva específica a definir: HPB × estenose uretral × cálculo/coágulo × neoplasia × causa neurogênica (atenção a déficit neurológico → síndrome da cauda equina)',
    ],
    conduta: [
      {
        titulo: 'Drenagem imediata',
        itens: [
          'Cateterismo vesical de alívio/demora é o tratamento — sonda de Foley; lubrificar e usar técnica asséptica',
          'Se falha do cateterismo uretral (estenose, HPB volumosa, falso trajeto) ou contraindicação (suspeita de trauma uretral): cistostomia suprapúbica',
          'NÃO há necessidade de pinçamento intermitente — a descompressão pode ser completa de uma vez (a hematúria ex-vácuo e a hipotensão são raras e não justificam clampear)',
          'Registrar o volume drenado (resíduo) — orienta prognóstico e diurese pós-obstrutiva',
        ],
      },
      {
        titulo: 'Pós-drenagem',
        itens: [
          'Vigiar diurese pós-obstrutiva (> 200 mL/h): repor volume/eletrólitos conforme perdas, monitorar Na/K/creatinina',
          'Homem com HPB: iniciar alfabloqueador (tansulosina/doxazosina) e programar prova de retirada da sonda (TWOC) em ~3–7 dias',
          'Tratar causa precipitante (suspender fármaco culpado, tratar ITU/constipação), encaminhar à urologia',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Manejo da RUA por HPB',
        texto:
          'O início de alfabloqueador antes da retirada da sonda (trial without catheter) aumenta a chance de micção espontânea bem-sucedida. A descompressão rápida e completa é segura — a antiga recomendação de clampear a sonda para esvaziar lentamente foi abandonada.',
      },
    ],
  },
  {
    id: 'torcao-testicular',
    nome: 'Torção testicular',
    secao: 'Renais/Urológicas',
    cid10: ['N44'],
    sinonimos: [
      'torção do cordão espermático',
      'escroto agudo',
      'dor testicular aguda',
      'torção de testículo',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Diretriz AUA de escroto agudo',
    resumo:
      'Torção do cordão espermático que interrompe o fluxo sanguíneo do testículo — EMERGÊNCIA CIRÚRGICA tempo-dependente. Dor escrotal súbita e intensa, frequentemente com náuseas/vômitos, em adolescentes e adultos jovens (pico bimodal: neonatos e 12–18 anos). A viabilidade gonadal cai rapidamente após ~6 horas; na suspeita clínica forte, a exploração cirúrgica NÃO deve aguardar exames.',
    fisiopatologia: [
      'A rotação do cordão ocluí primeiro o retorno venoso (de menor pressão), gerando congestão e edema, e em seguida o fluxo arterial → isquemia e infarto testicular.',
      'Fator predisponente: deformidade "em badalo de sino" (bell-clapper) — fixação anômala da túnica vaginal que permite rotação livre do testículo; costuma ser bilateral (justifica orquidopexia contralateral).',
      'Janela de viabilidade: salvamento ~90–100% se destorcido em < 6 h, caindo para < 10% após 24 h.',
    ],
    exames: [
      {
        titulo: 'Exame físico (decisivo)',
        itens: [
          'Testículo elevado/horizontalizado, dor intensa, edema; REFLEXO CREMASTÉRICO ABOLIDO (sinal sensível) do lado afetado',
          'Sinal de Prehn negativo (a elevação do testículo NÃO alivia a dor — ao contrário da epididimite)',
          'Escore TWIST pode estratificar risco e dispensar imagem em casos de alta probabilidade',
        ],
      },
      {
        titulo: 'Imagem (NÃO deve atrasar a cirurgia)',
        itens: [
          'USG com Doppler colorido: ausência/redução de fluxo arterial intratesticular confirma — mas exame normal NÃO exclui em torção intermitente/parcial',
          'Na suspeita clínica forte, encaminhar à exploração cirúrgica imediata mesmo sem USG',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Epididimite/orquiepididimite (início mais gradual, febre, Prehn positivo, cremastérico presente, piúria)',
      'Torção de apêndice testicular (hidátide de Morgagni) — "ponto azul" no polo superior, dor mais localizada',
      'Hérnia inguinal encarcerada, hidrocele/varicocele complicada, trauma escrotal, púrpura de Henoch-Schönlein (em crianças)',
    ],
    conduta: [
      {
        titulo: 'Conduta de emergência',
        itens: [
          'Acionar a urologia IMEDIATAMENTE — exploração cirúrgica com distorção e ORQUIDOPEXIA bilateral é o tratamento definitivo; orquiectomia se inviável',
          'Analgesia e antiemético; jejum (paciente cirúrgico)',
          'Distorção manual à beira-leito pode ser tentada enquanto se prepara o centro cirúrgico: girar o testículo "abrindo o livro" (geralmente de medial para lateral); alívio da dor sugere sucesso — NÃO substitui a cirurgia (fixação ainda necessária)',
        ],
      },
      {
        titulo: 'Princípios',
        itens: [
          'Tempo é gônada: a decisão é clínica; USG normal em paciente de alto risco não afasta o diagnóstico',
          'Documentar horário de início dos sintomas (orienta prognóstico e conduta intraoperatória)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'AUA — escroto agudo pediátrico',
        texto:
          'O escore TWIST (edema duro, massa dura, ausência de reflexo cremastérico, náusea/vômito, testículo elevado) permite identificar pacientes de alto risco que devem ir direto à cirurgia, e de baixo risco que podem ser avaliados por USG — reduzindo atraso e exames desnecessários.',
      },
    ],
  },
  {
    id: 'artrite-septica',
    nome: 'Artrite séptica',
    secao: 'Reumatológicas',
    cid10: ['M00.9'],
    sinonimos: [
      'artrite infecciosa',
      'artrite bacteriana',
      'monoartrite aguda',
      'pioartrite',
      'articulação séptica',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Tratado de Medicina de Emergência ABRAMEDE (Manole, 1ª ed., 2024)',
    resumo:
      'Infecção do espaço articular, em geral bacteriana e de instalação aguda — urgência reumato-ortopédica por risco de destruição irreversível da cartilagem em poucos dias. Toda monoartrite aguda, quente e dolorosa deve ser considerada séptica até prova em contrário; o exame-chave é a ARTROCENTESE com análise do líquido sinovial, idealmente ANTES do antibiótico.',
    fisiopatologia: [
      'Via hematogênica é a mais comum (a sinovial é muito vascularizada e sem membrana basal limitante); também por inoculação direta (punção/cirurgia/trauma) ou contiguidade (osteomielite, celulite).',
      'Agente mais frequente: Staphylococcus aureus; em jovens sexualmente ativos considerar Neisseria gonorrhoeae (artrite gonocócica — quadro migratório, tenossinovite e dermatite).',
      'A resposta inflamatória libera enzimas proteolíticas e citocinas que degradam a cartilagem — daí a urgência da drenagem e do antibiótico.',
      'Fatores de risco: artrite reumatoide e outras artropatias, prótese articular, diabetes, imunossupressão, uso de drogas injetáveis, idade avançada.',
    ],
    exames: [
      {
        titulo: 'Artrocentese (exame decisivo)',
        itens: [
          'Líquido sinovial: contagem de células (séptica geralmente > 50.000/mm³ com predomínio de PMN > 75% — mas valores menores não excluem), Gram e CULTURA',
          'Pesquisa de CRISTAIS (urato/pirofosfato) para diferenciar de gota/pseudogota — atenção: a presença de cristais NÃO exclui infecção concomitante',
          'Glicose e lactato sinoviais podem auxiliar; sempre culturar antes do ATB quando possível',
        ],
      },
      {
        titulo: 'Complementares',
        itens: [
          'Hemoculturas (positivas em parte dos casos), hemograma, PCR/VHS (acompanhamento)',
          'RX da articulação (baseline; pode mostrar derrame/alterações tardias); USG guia a punção e detecta derrame',
          'Swabs uretral/cervical/retal/faríngeo se suspeita de gonococo',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Gota / pseudogota (artrite por cristais) — pode coexistir com infecção',
      'Artrite reativa, surto de artrite reumatoide ou outra artropatia inflamatória',
      'Hemartrose (anticoagulação/trauma), osteomielite/bursite/celulite periarticular',
      'Artrite viral, doença de Lyme, febre reumática',
    ],
    conduta: [
      {
        titulo: 'Drenagem + antibiótico',
        itens: [
          'DRENAGEM articular é essencial (artrocentese de repetição, lavagem artroscópica ou cirúrgica) — acionar ortopedia/reumatologia',
          'Antibiótico empírico IV após coleta das culturas, guiado pelo Gram e por fatores de risco: cobrir S. aureus — preferir vancomicina empírica 15–20 mg/kg 8/8–12/12 h (cobre MRSA), de-escalonando para oxacilina se MSSA confirmado ± cobertura para Gram-negativos (cefalosporina de 3ª/4ª geração) em idosos/imunossuprimidos',
          'Suspeita de gonococo: ceftriaxona',
          'Ajustar conforme cultura/antibiograma; duração habitual 2–4 semanas (IV → VO)',
        ],
      },
      {
        titulo: 'Suporte',
        itens: [
          'Analgesia, imobilização relativa para conforto e reabilitação precoce após controle da infecção',
          'Prótese articular infectada: manejo conjunto com ortopedia (retenção × revisão/remoção do componente)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Abordagem da monoartrite aguda',
        texto:
          'Nenhum parâmetro isolado do líquido sinovial confirma ou exclui artrite séptica: contagens < 50.000 não afastam e a presença de cristais não exclui coinfecção. Na suspeita clínica, iniciar antibiótico empírico após a artrocentese sem aguardar a cultura, mantendo drenagem articular.',
      },
    ],
  },
  {
    id: 'crise-gotosa',
    nome: 'Crise gotosa aguda',
    secao: 'Reumatológicas',
    cid10: ['M10.9'],
    sinonimos: [
      'gota',
      'artrite gotosa',
      'podagra',
      'crise de gota',
      'artrite por cristais de urato',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Diretrizes ACR/EULAR de gota',
    resumo:
      'Artrite inflamatória aguda por depósito de cristais de urato monossódico, deflagrada por hiperuricemia. Clássico: monoartrite súbita, exuberante e muito dolorosa da 1ª metatarsofalângica (podagra), com pico em 12–24 h. O tratamento da crise é ANTI-INFLAMATÓRIO; a terapia de redução do urato (alopurinol) trata a doença de base, não a crise.',
    fisiopatologia: [
      'A hiperuricemia (produção aumentada ou, mais comum, excreção renal reduzida) leva à precipitação de cristais de urato monossódico nas articulações e tecidos.',
      'Os cristais são fagocitados e ativam o inflamassoma NLRP3 → liberação de IL-1β, deflagrando intensa resposta inflamatória aguda (base do uso de colchicina e de bloqueadores de IL-1 em casos refratários).',
      'Gatilhos da crise: ingestão de álcool/carne vermelha/frutos do mar, desidratação, diuréticos, trauma, cirurgia, e flutuações do urato (inclusive o INÍCIO do alopurinol).',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Diagnóstico de certeza: cristais de urato (em forma de agulha, BIRREFRINGÊNCIA NEGATIVA) no líquido sinovial à microscopia com luz polarizada',
          'Ácido úrico sérico pode estar NORMAL durante a crise — um valor normal não exclui gota',
          'Artrocentese é recomendada quando há dúvida com artrite séptica (sempre afastar infecção na monoartrite)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Artrite SÉPTICA (prioridade afastar — pode coexistir)',
      'Pseudogota (pirofosfato de cálcio — cristais romboides, birrefringência positiva; acomete joelho/punho)',
      'Artrite reativa, surto de artrite psoriásica/reumatoide',
      'Celulite, bursite, trauma/fratura por estresse',
    ],
    conduta: [
      {
        titulo: 'Tratamento da crise (quanto mais precoce, melhor)',
        itens: [
          'Escolha entre AINE, colchicina ou corticoide conforme comorbidades — eficácia semelhante',
          'AINE em dose plena (ex.: naproxeno, indometacina) se função renal e risco GI/cardiovascular permitirem',
          'Colchicina em esquema de BAIXA dose: 1 mg seguido de 0,5 mg após 1 h (ajustar na DRC; cuidado com interações — estatinas, claritromicina)',
          'Corticoide (prednisona VO ~30–40 mg/dia em desmame, ou intra-articular se monoartrite) — ótima opção na DRC e em quem não tolera AINE/colchicina',
          'Crise poliarticular grave/refratária: associar classes ou considerar bloqueio de IL-1 (anacinra)',
        ],
      },
      {
        titulo: 'Terapia de redução do urato (alopurinol)',
        itens: [
          'NÃO iniciar alopurinol DURANTE a crise (pode prolongá-la) — começar após a resolução, com profilaxia anti-inflamatória (colchicina dose baixa)',
          'Se o paciente JÁ usa alopurinol/febuxostate, MANTER sem interromper durante a crise',
          'Alvo de urato < 6 mg/dL (ou < 5 mg/dL em gota tofácea), titulando a dose; orientar dieta/álcool e revisar diuréticos',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACR/EULAR — gota',
        texto:
          'Recomenda-se colchicina em baixa dose (1 mg + 0,5 mg após 1 h) em vez do esquema antigo de altas doses, igualmente eficaz e muito menos tóxica. Iniciar ou manter a terapia de redução do urato com profilaxia anti-inflamatória por ≥ 3–6 meses, com estratégia "treat-to-target" (urato < 6 mg/dL).',
      },
    ],
  },
  {
    id: 'sindromes-nefritica-nefrotica',
    nome: 'Síndromes nefrítica e nefrótica',
    secao: 'Renais/Urológicas',
    cid10: ['N04.9', 'N05.9'],
    sinonimos: [
      'glomerulonefrite',
      'síndrome nefrítica',
      'síndrome nefrótica',
      'proteinúria nefrótica',
      'hematúria glomerular',
      'GNRP',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Diretriz KDIGO de glomerulonefrites',
    resumo:
      'Duas apresentações clássicas da doença glomerular. SÍNDROME NEFRÍTICA = inflamação glomerular: hematúria (dismórfica/cilindros hemáticos), HAS, edema e graus variáveis de oligúria/queda da função renal. SÍNDROME NEFRÓTICA = lesão da barreira de filtração: proteinúria maciça (> 3,5 g/24h), hipoalbuminemia, edema importante e hiperlipidemia. Na emergência, o foco é reconhecer o padrão, tratar complicações (HAS/sobrecarga, infecção, trombose) e identificar a glomerulonefrite rapidamente progressiva (GNRP), que exige biópsia/imunossupressão urgentes.',
    fisiopatologia: [
      'Nefrítica: inflamação proliferativa do glomérulo reduz a superfície de filtração (queda da TFG, retenção de sódio/água → HAS e edema) e rompe a parede capilar (hematúria com hemácias dismórficas e cilindros hemáticos). Ex.: GN pós-estreptocócica, nefropatia por IgA, GN associada a vasculites.',
      'Nefrótica: dano aos podócitos/membrana basal aumenta a permeabilidade a proteínas → proteinúria maciça, hipoalbuminemia, queda da pressão oncótica (edema) e estímulo hepático compensatório (hiperlipidemia). Ex.: doença de lesões mínimas, GESF, nefropatia membranosa, diabetes.',
      'A perda urinária de proteínas reguladoras gera estado de HIPERCOAGULABILIDADE (perda de antitrombina) — risco de trombose venosa (inclusive de veia renal) e TEP — e maior suscetibilidade a infecções (perda de imunoglobulinas).',
    ],
    exames: [
      {
        titulo: 'Confirmar e quantificar',
        itens: [
          'Urina I com SEDIMENTO: hemácias dismórficas/cilindros hemáticos → glomerular (nefrítica); lipidúria/cilindros graxos → nefrótica',
          'Relação proteína/creatinina ou albumina/creatinina em amostra (substitui a urina de 24 h); proteinúria nefrótica = > 3,5 g/24h (ou RPC > 3,5)',
          'Função renal e eletrólitos (LRA?), albumina, perfil lipídico',
        ],
      },
      {
        titulo: 'Investigação etiológica',
        itens: [
          'Complemento (C3/C4 — baixo na pós-estrepto, lúpica, membranoproliferativa), FAN/anti-DNA, ANCA, anti-MBG, ASLO',
          'Sorologias (HIV, hepatites B e C), eletroforese de proteínas; glicemia (nefropatia diabética)',
          'BIÓPSIA RENAL define o diagnóstico na maioria dos adultos — urgente se suspeita de GNRP',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hematúria não glomerular (litíase, ITU, neoplasia urológica) — hemácias eumórficas, sem cilindros',
      'Edema de outras causas: insuficiência cardíaca, cirrose, desnutrição, edema medicamentoso',
      'LRA pré/pós-renal; microangiopatia trombótica (SHU/PTT) como causa de LRA com hematúria',
    ],
    conduta: [
      {
        titulo: 'Síndrome nefrítica',
        itens: [
          'Controle da volemia/HAS: restrição de sódio e diurético de alça; anti-hipertensivos conforme necessário',
          'Tratar causa específica; GN pós-estreptocócica costuma ser autolimitada com suporte',
          'GNRP (queda rápida da função + sedimento ativo, "crescentes"): EMERGÊNCIA — nefrologia urgente, biópsia e imunossupressão (pulso de corticoide ± ciclofosfamida/rituximabe; plasmaférese na anti-MBG/vasculite grave)',
        ],
      },
      {
        titulo: 'Síndrome nefrótica',
        itens: [
          'Edema: restrição de sal e diurético de alça (titular; cuidado com hipovolemia/LRA)',
          'Reduzir proteinúria: IECA/BRA (efeito antiproteinúrico) com controle pressórico',
          'Estatina para dislipidemia; profilaxia/tratamento de eventos tromboembólicos conforme risco (anticoagulação se trombose ou albumina muito baixa em membranosa)',
          'Tratar a glomerulopatia de base (corticoide/imunossupressor conforme histologia) — conduzido pela nefrologia',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'KDIGO — doenças glomerulares',
        texto:
          'A quantificação da proteinúria por relação proteína(ou albumina)/creatinina em amostra isolada substitui a coleta de 24 h na maioria das situações. Reconhecer precocemente a glomerulonefrite rapidamente progressiva é crucial: o atraso na biópsia e na imunossupressão piora o prognóstico renal.',
      },
    ],
  },
  {
    id: 'civd',
    nome: 'Coagulação intravascular disseminada (CIVD)',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['D65'],
    sinonimos: [
      'CIVD',
      'CID',
      'coagulopatia de consumo',
      'coagulação intravascular disseminada',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Diretriz ISTH de CIVD',
    resumo:
      'Síndrome adquirida, sempre SECUNDÁRIA a uma doença de base (sepse, trauma, neoplasia, complicações obstétricas), caracterizada por ativação sistêmica e descontrolada da coagulação. Gera microtromboses (disfunção orgânica) e, simultaneamente, consumo de plaquetas e fatores com hiperfibrinólise — daí o paradoxo de trombose + sangramento. O tratamento essencial é corrigir a CAUSA de base; o suporte hemoterápico é guiado por sangramento/procedimento, não pelo exame isolado.',
    fisiopatologia: [
      'A doença de base expõe fator tecidual à circulação (monócitos/endotélio lesado, células tumorais, líquido amniótico), deflagrando geração maciça e sistêmica de trombina.',
      'A trombina forma fibrina intravascular (microtromboses → isquemia de órgãos) e consome plaquetas e fatores de coagulação (fibrinogênio, V, VIII) — coagulopatia de consumo.',
      'A ativação secundária da fibrinólise (plasmina) degrada fibrina/fibrinogênio, elevando D-dímero e produtos de degradação, e contribui para o sangramento.',
      'Causas: sepse/infecção grave, trauma extenso/grande queimado, neoplasias (LMA-M3/promielocítica, adenocarcinomas), emergências obstétricas (descolamento, embolia amniótica, HELLP), reações transfusionais, picadas de serpentes.',
    ],
    exames: [
      {
        titulo: 'Laboratório (avaliação seriada)',
        itens: [
          'Plaquetas BAIXAS (e/ou em queda — a tendência importa mais que um valor único)',
          'TP e TTPa ALARGADOS; FIBRINOGÊNIO baixo (reagente de fase aguda — pode estar "normal" no início)',
          'D-dímero/produtos de degradação da fibrina ELEVADOS',
          'Esfregaço: esquizócitos (hemólise microangiopática); escore ISTH de CIVD (≥ 5 = CIVD manifesta)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Microangiopatias trombóticas (PTT/SHU) — plaquetopenia + esquizócitos, mas TP/TTPa e fibrinogênio NORMAIS (chave de diferenciação)',
      'Insuficiência hepática grave (também ↓ fatores e plaquetas; fator VIII ajuda — baixo na CIVD, normal/alto na hepatopatia)',
      'Deficiência de vitamina K / anticoagulação, plaquetopenia dilucional, HIT',
      'Síndrome HELLP / fígado gorduroso agudo da gravidez',
    ],
    conduta: [
      {
        titulo: 'Princípio central',
        itens: [
          'TRATAR A CAUSA DE BASE é o pilar — sem isso, nenhuma reposição controla a CIVD',
          'Não transfundir guiado apenas por exame: repor conforme SANGRAMENTO ativo ou procedimento invasivo planejado',
        ],
      },
      {
        titulo: 'Suporte hemoterápico (se sangramento/alto risco)',
        itens: [
          'Plaquetas se < 50.000 com sangramento (ou < 20.000–30.000 profilático em alto risco) — limiares da ISTH; a fonte USP adota < 10.000 profilático',
          'Plasma fresco congelado se TP/TTPa muito alargados com sangramento',
          'Crioprecipitado/fibrinogênio se fibrinogênio < 100–150 mg/dL com sangramento',
        ],
      },
      {
        titulo: 'Situações especiais',
        itens: [
          'CIVD com predomínio TROMBÓTICO (sem sangramento): considerar heparina em dose profilática/terapêutica conforme o caso',
          'Antifibrinolíticos (ácido tranexâmico) são geralmente CONTRAINDICADOS (risco de agravar microtromboses), salvo exceções como LPA/M3 com hiperfibrinólise sob orientação especializada',
          'LPA (leucemia promielocítica): iniciar ATRA precocemente — emergência hematológica',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ISTH — diagnóstico e manejo da CIVD',
        texto:
          'O diagnóstico usa um escore composto (plaquetas, TP, fibrinogênio, marcadores de fibrina/D-dímero) avaliado de forma seriada, e não um exame isolado. A reposição de hemocomponentes deve ser orientada pelo sangramento clínico ou por procedimento, não por valores laboratoriais por si só.',
      },
    ],
  },
  {
    id: 'microangiopatias-tromboticas',
    nome: 'Microangiopatias trombóticas (PTT / SHU)',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['M31.1', 'D59.3'],
    sinonimos: [
      'PTT',
      'SHU',
      'púrpura trombocitopênica trombótica',
      'síndrome hemolítico-urêmica',
      'microangiopatia trombótica',
      'MAT',
      'ADAMTS13',
    ],
    fonte:
      'Diretrizes ISTH/ASH de PTT/SHU (fonte primária dos valores) + Medicina de Emergência USP/HC-FMUSP, 19ª ed., 2025 (sem capítulo dedicado a PTT/SHU)',
    resumo:
      'Grupo de doenças com anemia hemolítica microangiopática (esquizócitos) + plaquetopenia de consumo por trombos de plaquetas na microcirculação. A PTT (deficiência de ADAMTS13) é EMERGÊNCIA hematológica com mortalidade altíssima se não tratada — a plasmaférese deve ser iniciada precocemente diante da suspeita. A SHU associa-se a lesão renal proeminente (típica pós-diarreia por E. coli O157:H7 produtora de toxina Shiga; atípica por desregulação do complemento). Diferencial-chave da CIVD: na MAT, TP/TTPa e fibrinogênio são NORMAIS.',
    fisiopatologia: [
      'PTT: deficiência (autoimune adquirida, mais comum, ou hereditária) da metaloprotease ADAMTS13 → acúmulo de multímeros ultragrandes de von Willebrand → agregação plaquetária e microtrombos ricos em plaquetas.',
      'SHU típica: toxina Shiga (E. coli O157:H7, Shigella) lesa o endotélio, sobretudo renal, ativando coagulação local.',
      'SHU atípica: ativação descontrolada da via alternativa do complemento por mutações/anticorpos, com lesão endotelial e MAT.',
      'A fragmentação mecânica das hemácias contra os trombos gera ESQUIZÓCITOS (hemólise intravascular: ↑ DHL, ↑ bilirrubina indireta, ↓ haptoglobina, Coombs direto NEGATIVO).',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Hemograma: anemia + plaquetopenia; ESFREGAÇO com esquizócitos (essencial)',
          'Hemólise: DHL ↑, bilirrubina indireta ↑, haptoglobina ↓, reticulócitos ↑, COOMBS DIRETO NEGATIVO',
          'Coagulação NORMAL (TP/TTPa/fibrinogênio) — diferencia de CIVD',
          'Função renal e EAS (proteinúria/hematúria — mais alterados na SHU); ADAMTS13 (atividade < 10% confirma PTT) — colher ANTES da plasmaférese, sem aguardar resultado para tratar',
          'Escore PLASMIC estima probabilidade de PTT à beira-leito',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'CIVD (coagulação alterada, fibrinogênio baixo)',
      'Outras MAT: HELLP/eclâmpsia, hipertensão maligna, MAT induzida por fármacos (quinino, calcineurínicos, quimioterápicos), MAT da malignidade, crise renal esclerodérmica',
      'Anemia hemolítica autoimune (Coombs positivo), HIT, sepse',
    ],
    conduta: [
      {
        titulo: 'PTT (emergência)',
        itens: [
          'PLASMAFÉRESE (troca plasmática) URGENTE é o tratamento que muda a mortalidade — iniciar diante da suspeita, sem esperar ADAMTS13; se indisponível de imediato, infundir plasma fresco congelado enquanto se organiza a aférese',
          'Corticoide em dose alta associado; rituximabe nos casos imunomediados',
          'Caplacizumabe (anti-vWF) reduz tempo de recuperação plaquetária onde disponível',
          'NÃO transfundir plaquetas profilaticamente (pode agravar a trombose) — reservar a sangramento grave/risco de vida',
        ],
      },
      {
        titulo: 'SHU',
        itens: [
          'SHU típica (pós-diarreica): suporte — hidratação, manejo da LRA (diálise se necessário), controle de DHE; antibiótico para a E. coli O157:H7 é controverso/desaconselhado (pode aumentar liberação de toxina)',
          'SHU atípica (complemento): ECULIZUMABE (anti-C5) é o tratamento de escolha — encaminhar à nefrologia/hematologia',
          'Plasmaférese pode ser usada empiricamente enquanto se diferencia de PTT',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ISTH/ASH — PTT',
        texto:
          'A suspeita de PTT (anemia hemolítica microangiopática + plaquetopenia sem outra causa, com coagulação normal) justifica iniciar a plasmaférese imediatamente — colher ADAMTS13 antes, mas não aguardar o resultado. Caplacizumabe associado à plasmaférese e à imunossupressão acelera a resposta e reduz recidivas/exacerbações.',
      },
    ],
  },
  {
    id: 'reacoes-transfusionais',
    nome: 'Reações transfusionais agudas',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['T80.9'],
    sinonimos: [
      'reação transfusional',
      'reação hemolítica aguda',
      'TRALI',
      'TACO',
      'reação febril não hemolítica',
      'reação alérgica transfusional',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Hemovigilância (ABO-Hemo/AABB)',
    resumo:
      'Eventos adversos que ocorrem durante ou nas primeiras horas após a transfusão de hemocomponentes. A primeira medida em QUALQUER reação aguda é PARAR a transfusão, manter o acesso com salina e reavaliar. O grande temor é a reação hemolítica aguda por incompatibilidade ABO (erro de identificação), potencialmente fatal. Outras: reação alérgica/urticariforme (a mais frequente, ~1–3%), febril não hemolítica, anafilática, sobrecarga circulatória (TACO) e lesão pulmonar aguda (TRALI).',
    fisiopatologia: [
      'Hemolítica aguda: anticorpos do receptor (anti-A/anti-B) contra hemácias do doador → hemólise intravascular, ativação de complemento e coagulação, com risco de choque, CIVD e LRA por hemoglobinúria. Quase sempre por ERRO de identificação do paciente/bolsa.',
      'Febril não hemolítica: citocinas acumuladas no hemocomponente ou anticorpos do receptor contra leucócitos do doador (reduzida pela leucorredução).',
      'Alérgica/anafilática: reação a proteínas plasmáticas do doador; anafilaxia grave clássica no deficiente de IgA com anti-IgA.',
      'TACO: sobrecarga de volume (cardiopata/idoso, transfusão rápida) → edema pulmonar hidrostático. TRALI: anticorpos anti-HLA/anti-neutrófilo do doador → edema pulmonar não cardiogênico nas primeiras 6 h.',
    ],
    exames: [
      {
        titulo: 'Diante da reação',
        itens: [
          'RECHECAR identificação do paciente × etiqueta da bolsa (à beira-leito) — passo imediato',
          'Reação hemolítica: Coombs direto, repetir tipagem/prova cruzada, hemólise (DHL, BI, haptoglobina), hemoglobina livre plasmática e urinária, função renal, coagulograma (CIVD)',
          'Notificar o serviço de hemoterapia/hemovigilância e enviar a bolsa + nova amostra do paciente',
          'TACO × TRALI: RX de tórax (edema), BNP, balanço hídrico, oximetria/gasometria',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Distinguir reação hemolítica aguda × febril não hemolítica × séptica (contaminação bacteriana do hemocomponente)',
      'TACO (sobrecarga, responde a diurético, BNP alto) × TRALI (edema não cardiogênico, primeiras 6 h, BNP normal)',
      'Reação alérgica/urticariforme × anafilaxia',
    ],
    conduta: [
      {
        titulo: 'Medidas imediatas (toda reação)',
        itens: [
          'PARAR a transfusão imediatamente; manter acesso com SF 0,9%',
          'Reavaliar sinais vitais e rechecar identificação paciente/bolsa',
          'Suporte conforme gravidade (ABCDE); comunicar a agência transfusional',
        ],
      },
      {
        titulo: 'Por tipo de reação',
        itens: [
          'Hemolítica aguda: suporte agressivo — hidratação para proteger o rim (manter diurese), tratar choque e CIVD; pode ser fatal. NÃO reiniciar a transfusão',
          'Febril não hemolítica: antitérmico (dipirona/paracetamol); excluir hemólise/sepse antes de atribuir',
          'Alérgica leve (urticária): anti-histamínico, pode-se retomar lentamente após melhora; anafilaxia: ADRENALINA IM, suporte, e NÃO retomar',
          'TACO: interromper, sentar o paciente, O2 e diurético; transfundir devagar e em alíquotas no futuro',
          'TRALI: suporte ventilatório (manejo tipo SDRA); diurético NÃO ajuda (não é sobrecarga)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'Hemovigilância — segurança transfusional',
        texto:
          'A principal causa de reação hemolítica fatal continua sendo o erro de identificação (paciente/amostra/bolsa) — a dupla checagem à beira-leito é a medida preventiva mais eficaz. A leucorredução universal reduz reações febris não hemolíticas e a aloimunização anti-HLA.',
      },
    ],
  },
  {
    id: 'reversao-anticoagulacao',
    nome: 'Reversão de anticoagulantes / sangramento maior',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['D68.3'],
    sinonimos: [
      'reversão de anticoagulação',
      'sangramento maior',
      'varfarina',
      'DOAC',
      'andexanet',
      'idarucizumabe',
      'complexo protrombínico',
      'vitamina K',
    ],
    fonte:
      'Medicina de Emergência: Abordagem Prática (USP/HC-FMUSP, 19ª ed., 2025) + Diretrizes ACC/ASH de reversão',
    resumo:
      'Conduta no paciente anticoagulado com sangramento maior (risco de vida, hemorragia em sítio crítico — SNC — ou queda significativa de Hb) ou que necessita de cirurgia/procedimento de emergência. As medidas gerais (suporte hemodinâmico, hemostasia local/cirúrgica, suspender o anticoagulante) precedem e acompanham os agentes específicos de reversão, que variam conforme a droga: varfarina, heparinas ou anticoagulantes orais diretos (DOACs).',
    fisiopatologia: [
      'Varfarina (antagonista da vitamina K): reduz fatores II, VII, IX, X — reversão com reposição de fatores (CCP) e regeneração endógena (vitamina K).',
      'DOACs: inibidores diretos da trombina (dabigatrana) ou do fator Xa (rivaroxabana, apixabana, edoxabana) — reversão com agentes específicos ou CCP.',
      'Heparinas: HNF é totalmente revertida pela protamina; HBPM é revertida apenas parcialmente.',
      'Definir SANGRAMENTO MAIOR: instabilidade hemodinâmica, sítio crítico (intracraniano, intraespinhal, intraocular, pericárdico, retroperitoneal, intramuscular com síndrome compartimental), ou queda de Hb ≥ 2 g/dL / necessidade de ≥ 2 concentrados de hemácias.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Qual o fármaco, dose e HORÁRIO da última tomada; função renal (depuração dos DOACs e da HBPM)',
          'TP/INR (varfarina), TTPa; hemograma seriado, tipagem/prova cruzada',
          'DOACs: TP/TTPa normais NÃO excluem efeito; dosagens específicas (anti-Xa calibrado, tempo de trombina/ecarina para dabigatrana) quando disponíveis',
          'Imagem do sítio de sangramento (TC de crânio se suspeita de HIC)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Sangramento maior × menor (orienta necessidade de reversão ativa)',
      'Coagulopatia por hepatopatia, CIVD ou plaquetopenia coexistentes',
      'Sangramento por antiagregantes plaquetários (manejo distinto — considerar plaquetas/desmopressina em casos selecionados)',
    ],
    conduta: [
      {
        titulo: 'Medidas gerais (sempre)',
        itens: [
          'Suspender o anticoagulante; suporte hemodinâmico (cristaloide, hemocomponentes conforme sangramento)',
          'Hemostasia local/mecânica, endoscópica, radiológica (embolização) ou cirúrgica',
          'Ácido tranexâmico pode ser adjuvante em sangramentos específicos',
        ],
      },
      {
        titulo: 'Varfarina',
        itens: [
          'Sangramento maior: CONCENTRADO DE COMPLEXO PROTROMBÍNICO (CCP 4 fatores), dose conforme INR/peso — reversão mais rápida e menos volume que o PFC + VITAMINA K 5–10 mg IV (lenta)',
          'CCP indisponível: plasma fresco congelado (PFC)',
          'INR elevado SEM sangramento: suspender ± vitamina K oral conforme o valor',
        ],
      },
      {
        titulo: 'DOACs e heparinas',
        itens: [
          'Dabigatrana: IDARUCIZUMABE (antídoto específico); na indisponibilidade, CCP/diálise (dabigatrana é dialisável)',
          'Inibidores do Xa (riva/apixabana): ANDEXANET ALFA (onde disponível) ou CCP 4 fatores',
          'Carvão ativado se ingestão do DOAC nas últimas ~2–4 h',
          'HNF: PROTAMINA (1 mg neutraliza ~100 UI de heparina); HBPM: protamina reverte parcialmente',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz: 'ACC / ASH — manejo do sangramento em anticoagulados',
        texto:
          'Para sangramento maior por varfarina, o complexo protrombínico de 4 fatores é preferível ao plasma fresco (reversão mais rápida, menor volume), sempre associado à vitamina K IV. Para DOACs, usar o antídoto específico quando disponível (idarucizumabe para dabigatrana; andexanet alfa para inibidores do fator Xa), com CCP como alternativa.',
      },
    ],
  },

  // ───────────────────── Crônicas (PCDT/diretrizes — lote piloto) ─────────────────────
  // ⚠️ REVISÃO MÉDICA + CONFIRMAÇÃO DE VERSÃO VIGENTE (CONITEC/gov.br) PENDENTES.
  {
    id: 'dm2',
    nome: 'Diabetes mellitus tipo 2',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E11.9'],
    sinonimos: ['DM2', 'diabetes tipo 2', 'hiperglicemia crônica', 'diabetes'],
    fonte:
      'PCDT Diabete Melito tipo 2 (Ministério da Saúde) e Diretriz da Sociedade Brasileira de Diabetes. ⚠️ Confirmar a VERSÃO VIGENTE na CONITEC/gov.br — revisão médica pendente',
    resumo:
      'Doença metabólica crônica de hiperglicemia por resistência à insulina associada a déficit secretório progressivo das células β. Diagnóstico (qualquer um, confirmado em 2ª dosagem se assintomático): glicemia de jejum ≥ 126 mg/dL; HbA1c ≥ 6,5%; glicemia 2 h no TOTG 75 g ≥ 200 mg/dL; ou glicemia aleatória ≥ 200 mg/dL com sintomas clássicos (poliúria, polidipsia, emagrecimento).',
    fisiopatologia: [
      'Resistência à insulina em músculo, fígado e tecido adiposo, com hiperinsulinemia compensatória inicial.',
      'Disfunção e perda progressiva da célula β pancreática → a secreção deixa de compensar a resistência e surge a hiperglicemia.',
      'Contribuem o aumento da produção hepática de glicose, o efeito incretínico reduzido e a lipotoxicidade/glicotoxicidade.',
      'A hiperglicemia crônica leva a complicações micro (retino, nefro, neuropatia) e macrovasculares (DAC, AVC, DAOP).',
    ],
    exames: [
      {
        titulo: 'Diagnóstico e controle',
        itens: [
          'Glicemia de jejum e HbA1c (controle a cada 3–6 meses)',
          'TOTG 75 g quando jejum/HbA1c discordantes ou limítrofes',
        ],
      },
      {
        titulo: 'Rastreio de complicações / risco',
        itens: [
          'Relação albumina/creatinina urinária + creatinina/TFG (nefropatia)',
          'Fundoscopia anual (retinopatia)',
          'Exame dos pés com monofilamento (neuropatia/pé diabético)',
          'Perfil lipídico e pressão arterial (risco cardiovascular)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'DM tipo 1 e LADA (autoimune; considerar em magros, jovens, cetose, anti-GAD+)',
      'Diabetes MODY (história familiar forte, início precoce)',
      'Diabetes secundário (corticoide, pancreatopatia, endocrinopatias como Cushing/acromegalia)',
      'Hiperglicemia de estresse (doença aguda) — reavaliar após a resolução',
    ],
    conduta: [
      {
        titulo: 'Base do tratamento',
        itens: [
          'Mudança de estilo de vida: dieta, perda ponderal e atividade física — sempre',
          'Metformina como 1ª linha (na ausência de contraindicação; cautela/contraindicada se TFG muito baixa)',
          'Meta de HbA1c em geral < 7% — individualizar (mais flexível em idosos/comorbidades; mais estrita em jovens)',
        ],
      },
      {
        titulo: 'Escolha conforme comorbidade',
        itens: [
          'Doença cardiovascular aterosclerótica / IC / doença renal: priorizar iSGLT2 e/ou agonista de GLP-1 (benefício CV e renal)',
          'Considerar insulina quando hiperglicemia acentuada/sintomática ou falha das demais classes',
          'Controle integrado: pressão arterial, estatina conforme risco, cessação do tabagismo',
        ],
      },
    ],
  },
  {
    id: 'has-cronica',
    nome: 'Hipertensão arterial sistêmica',
    secao: 'Cardiovasculares',
    cid10: ['I10'],
    sinonimos: ['HAS', 'hipertensão', 'pressão alta', 'hipertensão arterial'],
    fonte:
      'Diretrizes Brasileiras de Hipertensão Arterial (SBC) e protocolos do Ministério da Saúde. ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Elevação sustentada da pressão arterial, em geral PA ≥ 140/90 mmHg em consultório (confirmada em ≥ 2 medidas/consultas ou por MAPA/MRPA). Principal fator de risco modificável para doença cardiovascular, AVC e doença renal. A maioria é primária (essencial).',
    fisiopatologia: [
      'Interação de fatores genéticos e ambientais (sal, obesidade, sedentarismo, álcool) sobre o controle do volume e do tônus vascular.',
      'Ativação do sistema renina-angiotensina-aldosterona e do simpático, com disfunção endotelial e aumento da resistência vascular periférica.',
      'A sobrecarga pressórica crônica causa lesão de órgão-alvo: hipertrofia de VE, nefroesclerose, retinopatia e aterosclerose acelerada.',
    ],
    exames: [
      {
        titulo: 'Avaliação inicial (rotina)',
        itens: [
          'Confirmação por MAPA ou MRPA (afasta hipertensão do avental e mascarada)',
          'Creatinina/TFG, potássio, glicemia, perfil lipídico, ácido úrico',
          'Urina (EAS) e relação albumina/creatinina',
          'ECG de repouso (hipertrofia/sobrecarga de VE)',
        ],
      },
      {
        titulo: 'Quando investigar causa secundária',
        itens: [
          'Início < 30 ou > 55 anos, HAS resistente, hipocalemia espontânea, sopro abdominal, crises adrenérgicas',
          'Triagem dirigida: doença renovascular, hiperaldosteronismo, feocromocitoma, SAOS, coarctação',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'HAS do avental / hipertensão mascarada (definir por MAPA/MRPA)',
      'HAS secundária (renovascular, hiperaldosteronismo primário, feocromocitoma, SAOS, doença renal parenquimatosa)',
      'Hipertensão por substâncias (AINE, corticoide, descongestionantes, anticoncepcional, cocaína)',
    ],
    conduta: [
      {
        titulo: 'Não farmacológico (sempre)',
        itens: [
          'Restrição de sódio, dieta DASH, perda de peso, atividade física regular',
          'Redução do álcool e cessação do tabagismo',
        ],
      },
      {
        titulo: 'Farmacológico',
        itens: [
          'Classes de 1ª linha: diuréticos tiazídicos, IECA ou BRA, e bloqueadores de canal de cálcio',
          'Frequente necessidade de combinação (preferir dose fixa) para atingir a meta',
          'Meta usual < 140/90 mmHg; mais estrita (ex.: < 130/80) conforme risco/comorbidade individualizada',
        ],
      },
    ],
  },
  {
    id: 'hipotireoidismo',
    nome: 'Hipotireoidismo',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E03.9'],
    sinonimos: ['hipotireoidismo', 'TSH alto', 'tireoide baixa', 'levotiroxina', 'Hashimoto'],
    fonte:
      'PCDT/diretrizes de doenças da tireoide (Ministério da Saúde) e Sociedade Brasileira de Endocrinologia e Metabologia. ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Síndrome de produção/ação insuficiente de hormônios tireoidianos. Primário (mais comum): TSH elevado com T4 livre baixo (clínico) ou normal (subclínico). Causa mais frequente no adulto: tireoidite crônica autoimune (Hashimoto). Quadro insidioso: fadiga, ganho de peso, intolerância ao frio, constipação, pele seca, bradicardia.',
    fisiopatologia: [
      'Redução da síntese de T4/T3 → queda do feedback negativo → elevação do TSH hipofisário (no hipotireoidismo primário).',
      'Na tireoidite de Hashimoto, autoanticorpos (anti-TPO) levam à destruição progressiva do parênquima tireoidiano.',
      'Hipotireoidismo central (secundário/terciário) cursa com TSH baixo/inapropriadamente normal e T4 livre baixo.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'TSH (rastreio/confirmação) + T4 livre',
          'Anti-TPO (define etiologia autoimune)',
          'Repetir/confirmar antes de tratar formas subclínicas',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Hipotireoidismo subclínico (TSH alto, T4 livre normal)',
      'Hipotireoidismo central (TSH baixo/normal com T4 livre baixo — investigar hipófise)',
      'Síndrome do eutireoideo doente (doença não tireoidiana aguda — não tratar com base em alterações transitórias)',
    ],
    conduta: [
      {
        titulo: 'Reposição',
        itens: [
          'Levotiroxina (LT4) em jejum, dose ajustada por peso e idade; iniciar com cautela em idoso/coronariopata',
          'Reavaliar TSH em ~6–8 semanas após início/ajuste e titular',
          'Meta: TSH na faixa de referência (individualizar idoso e gestante — esta com metas e doses próprias)',
        ],
      },
    ],
  },
  {
    id: 'dislipidemia',
    nome: 'Dislipidemia',
    secao: 'Cardiovasculares',
    cid10: ['E78.5'],
    sinonimos: ['dislipidemia', 'colesterol alto', 'hipercolesterolemia', 'LDL', 'triglicerídeos', 'estatina'],
    fonte:
      'Atualização da Diretriz Brasileira de Dislipidemias (SBC) e protocolos do Ministério da Saúde. ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Alteração das lipoproteínas plasmáticas (↑ LDL, ↑ triglicerídeos e/ou ↓ HDL). Principal fator de risco modificável para aterosclerose e doença cardiovascular. A decisão e a meta de LDL são guiadas pelo RISCO CARDIOVASCULAR GLOBAL do paciente.',
    fisiopatologia: [
      'Partículas de LDL retidas no subendotélio sofrem oxidação e desencadeiam resposta inflamatória, formando a placa aterosclerótica.',
      'A progressão e a instabilização da placa levam aos eventos (IAM, AVC, doença arterial periférica).',
      'Pode ser primária (poligênica ou familiar) ou secundária (hipotireoidismo, DM, doença renal, colestase, álcool, fármacos).',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Perfil lipídico (colesterol total, LDL, HDL, triglicerídeos)',
          'Estratificação do risco cardiovascular global',
          'Rastrear causas secundárias: TSH, glicemia/HbA1c, função renal e hepática',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Dislipidemia secundária (hipotireoidismo, DM mal controlado, síndrome nefrótica, colestase, álcool, corticoide)',
      'Hipercolesterolemia familiar (LDL muito alto, história familiar, doença precoce — investigar)',
    ],
    conduta: [
      {
        titulo: 'Tratamento',
        itens: [
          'Mudança de estilo de vida sempre: dieta, atividade física, perda de peso, cessação do tabagismo',
          'Estatina como base; intensidade conforme o risco e a meta de LDL',
          'Ezetimiba (e iPCSK9 em casos selecionados) quando não atinge a meta com estatina',
          'Triglicerídeos muito elevados (ex.: > 500 mg/dL): foco em reduzir o risco de pancreatite (fibrato, controle de causas)',
        ],
      },
    ],
  },
  {
    id: 'drc',
    nome: 'Doença renal crônica',
    secao: 'Renais/Urológicas',
    cid10: ['N18.9'],
    sinonimos: ['DRC', 'insuficiência renal crônica', 'IRC', 'TFG reduzida', 'nefropatia crônica'],
    fonte:
      'Protocolos do Ministério da Saúde, Sociedade Brasileira de Nefrologia e KDIGO. ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Anormalidade de estrutura ou função renal presente por ≥ 3 meses — TFG < 60 mL/min/1,73 m² e/ou marcadores de lesão (sobretudo albuminúria). Estadiada por TFG (G1–G5) e albuminúria (A1–A3). Causas mais comuns no Brasil: diabetes e hipertensão.',
    fisiopatologia: [
      'A perda de néfrons gera hiperfiltração compensatória nos remanescentes, que a longo prazo acelera a glomeruloesclerose (progressão).',
      'A retenção de escórias, a desregulação hidroeletrolítica e a perda de funções endócrinas (eritropoetina, vitamina D) geram as complicações.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico e estadiamento',
        itens: [
          'Creatinina com TFG estimada (confirmar a cronicidade: repetir em ≥ 3 meses)',
          'Relação albumina/creatinina urinária e urina (EAS)',
          'Ultrassonografia renal (tamanho, obstrução, doença policística)',
        ],
      },
      {
        titulo: 'Complicações',
        itens: [
          'Anemia (hemograma, ferro), distúrbio mineral-ósseo (cálcio, fósforo, PTH)',
          'Acidose metabólica (bicarbonato) e potássio',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Lesão renal aguda (instalação aguda, potencialmente reversível — ver ficha de LRA)',
      'Agudização de DRC (DRC com piora aguda sobreposta)',
    ],
    conduta: [
      {
        titulo: 'Nefroproteção e manejo',
        itens: [
          'Tratar a causa-base: controle pressórico e glicêmico rigorosos',
          'IECA ou BRA quando há albuminúria; iSGLT2 (nefroproteção) conforme indicação',
          'Evitar nefrotóxicos (AINE, contraste sem preparo, aminoglicosídeos) e ajustar doses pela TFG',
          'Manejar anemia, distúrbio mineral-ósseo, acidose e potássio',
          'Encaminhar à nefrologia nos estágios avançados e preparar terapia renal substitutiva',
        ],
      },
    ],
  },
  {
    id: 'hipertireoidismo',
    nome: 'Hipertireoidismo e doença de Graves',
    secao: 'Metabólicas/Endócrinas',
    cid10: ['E05.0', 'E05.9'],
    sinonimos: ['hipertireoidismo', 'tireotoxicose', 'Graves', 'TSH baixo', 'bócio', 'TRAb'],
    fonte:
      'Diretrizes da Sociedade Brasileira de Endocrinologia e Metabologia e protocolos do Ministério da Saúde. ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Excesso de hormônios tireoidianos: TSH suprimido com T4 livre e/ou T3 elevados. Causa mais comum: doença de Graves (autoimune). Quadro: perda de peso, taquicardia/palpitações, tremor, intolerância ao calor, irritabilidade, podendo haver bócio e oftalmopatia (Graves).',
    fisiopatologia: [
      'Na doença de Graves, autoanticorpos (TRAb) estimulam o receptor de TSH → hiperfunção difusa da tireoide.',
      'Outras causas: autonomia nodular (bócio multinodular tóxico, adenoma tóxico) e tireoidites (liberação de hormônio pré-formado).',
    ],
    exames: [
      {
        titulo: 'Diagnóstico e etiologia',
        itens: [
          'TSH (suprimido) + T4 livre e T3',
          'TRAb (positivo na doença de Graves)',
          'Cintilografia / captação de iodo quando a etiologia é incerta (capta na Graves/nódulos; baixa nas tireoidites)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Tireoidites (subaguda, pós-parto, indolor) — captação baixa, costuma ser autolimitada',
      'Bócio multinodular tóxico e adenoma tóxico (autonomia nodular)',
      'Tireotoxicose factícia (uso exógeno de hormônio); excesso de iodo/amiodarona',
    ],
    conduta: [
      {
        titulo: 'Tratamento',
        itens: [
          'Betabloqueador para sintomas adrenérgicos (palpitações, tremor)',
          'Antitireoidiano: metimazol como 1ª escolha; propiltiouracila em situações específicas (ex.: 1º trimestre da gestação, crise tireotóxica)',
          'Terapia definitiva conforme o caso: radioiodo ou tireoidectomia',
          'Atenção à crise tireotóxica (emergência — ver ficha específica)',
        ],
      },
    ],
  },
  {
    id: 'depressao',
    nome: 'Transtorno depressivo',
    secao: 'Psiquiátricas',
    cid10: ['F32.9', 'F33.9'],
    sinonimos: ['depressão', 'transtorno depressivo', 'humor deprimido', 'anedonia', 'antidepressivo'],
    fonte:
      'Protocolos/linhas de cuidado em saúde mental do Ministério da Saúde e diretrizes da ABP. ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Humor deprimido e/ou anedonia por ≥ 2 semanas, associado a sintomas (sono, apetite, energia, concentração, culpa/desvalia, lentificação, ideação de morte) e prejuízo funcional. AVALIAR SEMPRE o risco de suicídio.',
    fisiopatologia: [
      'Origem multifatorial: predisposição genética, alterações de neurotransmissão monoaminérgica, desregulação do eixo HPA e fatores psicossociais/estressores.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Diagnóstico é clínico; aplicar avaliação estruturada do risco de suicídio',
          'Excluir causa orgânica/uso de substâncias: TSH, hemograma, B12, função renal e hepática conforme contexto',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Transtorno afetivo bipolar — INVESTIGAR episódios de mania/hipomania ANTES de iniciar antidepressivo (risco de viragem)',
      'Distimia (sintomas crônicos mais leves), reação ao luto/ajustamento',
      'Causas orgânicas (hipotireoidismo, anemia) e transtorno por uso de substância',
    ],
    conduta: [
      {
        titulo: 'Manejo',
        itens: [
          'Psicoterapia e/ou antidepressivo — ISRS costuma ser a 1ª linha',
          'Avaliar e manejar o risco de suicídio (rede de apoio, plano de segurança, encaminhamento conforme gravidade)',
          'Reavaliar a resposta em ~4–6 semanas; atenção à viragem maníaca',
          'Casos graves/refratários ou risco alto: encaminhamento especializado',
        ],
      },
    ],
  },
  {
    id: 'anemia-ferropriva',
    nome: 'Anemia ferropriva',
    secao: 'Hematológicas/Oncológicas',
    cid10: ['D50.9'],
    sinonimos: ['anemia ferropriva', 'deficiência de ferro', 'ferropenia', 'anemia microcítica', 'ferritina baixa'],
    fonte:
      'Protocolos do Ministério da Saúde e diretrizes de hematologia (ABHH). ⚠️ Confirmar a VERSÃO VIGENTE — revisão médica pendente',
    resumo:
      'Anemia mais comum no mundo; microcítica e hipocrômica por deficiência de ferro. Mais que tratar a anemia, é obrigatório INVESTIGAR A CAUSA — no adulto, sobretudo perda crônica (gastrointestinal ou menstrual).',
    fisiopatologia: [
      'Balanço negativo de ferro (perda e/ou baixa ingestão/absorção > oferta) depleta os estoques.',
      'Sem ferro suficiente, a eritropoese produz hemácias pequenas e pobres em hemoglobina.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Hemograma: VCM e HCM baixos, RDW aumentado',
          'Ferritina baixa (confirma); saturação de transferrina reduzida',
        ],
      },
      {
        titulo: 'Investigação da causa',
        itens: [
          'Pesquisa de perda gastrointestinal (sangue oculto; endoscopia/colonoscopia conforme idade e risco)',
          'Avaliar fluxo menstrual, dieta e má absorção (ex.: doença celíaca)',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Anemia de doença crônica/inflamação (ferritina normal ou alta)',
      'Talassemia (microcitose com ferro normal/alto, RDW frequentemente normal)',
      'Anemia sideroblástica',
    ],
    conduta: [
      {
        titulo: 'Tratamento',
        itens: [
          'Repor ferro: via oral é a 1ª linha; ferro parenteral em má absorção, intolerância ou necessidade de correção rápida',
          'TRATAR A CAUSA de base (a reposição isolada não resolve perda contínua)',
          'Reavaliar a resposta (reticulócitos em ~1 semana; hemoglobina em algumas semanas) e manter para repor estoques',
        ],
      },
    ],
  },
  {
    id: 'tuberculose',
    nome: 'Tuberculose',
    secao: 'Infecciosas',
    cid10: ['A15.0', 'A16.9'],
    sinonimos: ['tuberculose', 'TB', 'BK', 'tísica', 'bacilo de Koch', 'Mycobacterium tuberculosis'],
    fonte:
      'Manual de Recomendações para o Controle da Tuberculose no Brasil (PNCT / Ministério da Saúde). ⚠️ Confirmar a VERSÃO VIGENTE e o esquema/doses — revisão médica pendente',
    resumo:
      'Infecção por Mycobacterium tuberculosis; a forma pulmonar é a mais comum e transmissível (tosse ≥ 3 semanas, febre vespertina, sudorese noturna, emagrecimento). Doença de NOTIFICAÇÃO COMPULSÓRIA.',
    fisiopatologia: [
      'Inalação de bacilos → resposta imune granulomatosa que pode conter a infecção (latente) ou evoluir para doença ativa (primária ou por reativação).',
      'Imunossupressão (HIV, diabetes, desnutrição, idade) favorece a progressão para doença ativa.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico',
        itens: [
          'Teste rápido molecular (TRM-TB) e/ou baciloscopia do escarro',
          'Cultura com teste de sensibilidade (importante para resistência)',
          'Radiografia de tórax',
          'Testar HIV em TODOS os casos',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pneumonia bacteriana, micoses pulmonares (paracoccidioidomicose), neoplasia pulmonar',
      'Outras micobactérias; bronquiectasias infectadas',
    ],
    conduta: [
      {
        titulo: 'Tratamento e controle',
        itens: [
          'Esquema básico do adulto: 2 meses de RHZE (rifampicina, isoniazida, pirazinamida, etambutol) + 4 meses de RH — confirmar doses/duração vigentes no PNCT',
          'Tratamento diretamente observado (TDO) para favorecer a adesão',
          'Notificação compulsória e avaliação/rastreio dos contatos',
          'Manejo integrado com HIV quando coinfecção',
        ],
      },
    ],
  },

  // ───────────────────── Infecciosas (issue #92) ─────────────────────
  // ⚠️ Revisão médica pendente; esquemas/doses conforme guia/diretriz vigente.
  {
    id: 'fasciite-necrosante',
    nome: 'Fasciíte necrosante e infecções graves de partes moles',
    secao: 'Infecciosas',
    cid10: ['M72.6'],
    sinonimos: ['fasciíte necrosante', 'fasceíte', 'infecção necrosante de partes moles', 'gangrena de Fournier', 'mionecrose'],
    fonte: 'ABRAMEDE 2024 e Medicina de Emergência (USP/HC-FMUSP) — infecções de partes moles',
    resumo:
      'Infecção rapidamente progressiva da fáscia e do subcutâneo com necrose — EMERGÊNCIA CIRÚRGICA. Sinal de alerta: dor DESPROPORCIONAL ao achado cutâneo, com toxemia. Tipo I (polimicrobiana) e tipo II (Streptococcus do grupo A ± S. aureus); a forma de períneo/genital é a gangrena de Fournier. Alta letalidade quando o desbridamento atrasa.',
    fisiopatologia: [
      'Invasão e trombose dos vasos perfurantes da fáscia → isquemia e necrose que se disseminam rapidamente ao longo dos planos fasciais.',
      'Toxinas/superantígenos (sobretudo do Streptococcus) podem desencadear síndrome do choque tóxico associada.',
    ],
    exames: [
      {
        titulo: 'Avaliação (NÃO atrasar a cirurgia)',
        itens: [
          'Diagnóstico é eminentemente clínico-cirúrgico — a exploração cirúrgica confirma (fáscia necrótica, "água de lavado", ausência de sangramento).',
          'Laboratório de apoio: leucocitose, PCR e lactato elevados, CK alta, hiponatremia, lesão renal (escore LRINEC auxilia, mas NÃO exclui).',
          'Hemoculturas e cultura do tecido; imagem (TC/RM mostra gás/edema) apenas se não retardar a cirurgia.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Celulite/erisipela grave e abscesso de partes moles',
      'Gangrena gasosa por Clostridium (crepitação, mionecrose)',
      'Pioderma gangrenoso',
    ],
    conduta: [
      {
        titulo: 'Tratamento',
        itens: [
          'DESBRIDAMENTO CIRÚRGICO amplo e precoce — não adiar; revisões cirúrgicas seriadas ("second look").',
          'Antibiótico empírico de amplo espectro cobrindo Gram-positivos, Gram-negativos e anaeróbios + CLINDAMICINA (ação antitoxina).',
          'Ressuscitação e suporte de órgãos; considerar imunoglobulina (IGIV) no choque tóxico estreptocócico.',
        ],
      },
    ],
  },
  {
    id: 'malaria',
    nome: 'Malária',
    secao: 'Infecciosas',
    cid10: ['B54'],
    sinonimos: ['malária', 'plasmodium', 'falciparum', 'vivax', 'maleita', 'paludismo'],
    fonte:
      'Guia de Tratamento da Malária no Brasil (Ministério da Saúde) e Medicina de Emergência. ⚠️ Confirmar espécie/esquema/doses no Guia VIGENTE do MS — revisão médica pendente',
    resumo:
      'Doença febril aguda por Plasmodium (no Brasil, P. vivax é o mais comum, na Amazônia; P. falciparum é o de maior gravidade). Febre, calafrios e cefaleia — SEMPRE perguntar viagem/área endêmica. Doença de notificação compulsória. Malária grave (sobretudo falciparum) cursa com disfunção orgânica.',
    fisiopatologia: [
      'Após o ciclo hepático, o parasita infecta hemácias; o P. falciparum causa citoaderência e sequestro na microcirculação → malária cerebral, lesão renal, SARA e hipoglicemia.',
      'P. vivax e P. ovale têm formas hepáticas latentes (hipnozoítos) → recaídas.',
    ],
    exames: [
      {
        titulo: 'Diagnóstico e gravidade',
        itens: [
          'Gota espessa / esfregaço (padrão — identifica espécie e quantifica a parasitemia) e/ou teste rápido.',
          'Sinais de gravidade: alteração da consciência, hipoglicemia, acidose, parasitemia alta, anemia grave, lesão renal, icterícia, hipotensão.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Dengue, leptospirose, febre amarela, febre tifoide',
      'Sepse de outra origem; outras arboviroses',
    ],
    conduta: [
      {
        titulo: 'Tratamento (conforme o Guia do MS)',
        itens: [
          'Tratar por espécie e gravidade — vivax: cloroquina + primaquina (avaliar G6PD antes da primaquina).',
          'Falciparum não complicado: terapia combinada com artemisinina (ex.: artemeter-lumefantrina).',
          'Malária grave: artesunato intravenoso; suporte das disfunções (glicemia, volemia, função renal).',
          'Notificação compulsória. ⚠️ Confirmar esquemas e doses no Guia vigente do Ministério da Saúde.',
        ],
      },
    ],
  },
  {
    id: 'tetano',
    nome: 'Tétano',
    secao: 'Infecciosas',
    cid10: ['A35'],
    sinonimos: ['tétano', 'Clostridium tetani', 'trismo', 'opistótono', 'tetanospasmina', 'riso sardônico'],
    fonte: 'ABRAMEDE 2024 e protocolos do Ministério da Saúde — tétano acidental',
    resumo:
      'Doença causada pela toxina (tetanospasmina) do Clostridium tetani, que entra por ferimentos. Cursa com espasmos musculares — trismo, "riso sardônico", rigidez e opistótono — com CONSCIÊNCIA PRESERVADA. Prevenível por vacina; é de notificação compulsória.',
    fisiopatologia: [
      'A tetanospasmina ascende pelos nervos até o SNC e bloqueia a liberação de neurotransmissores inibitórios (GABA/glicina) → hiperatividade motora e disautonomia.',
      'O período de incubação mais curto e a porta de entrada próxima do SNC associam-se a quadros mais graves.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Diagnóstico é CLÍNICO (não depende de cultura).',
          'Avaliar a ferida (porta de entrada) e o estado vacinal.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Intoxicação por estricnina',
      'Distonia aguda por neurolépticos (responde a anticolinérgico)',
      'Hipocalcemia; causas locais de trismo (abscesso dentário/peritonsilar); meningite',
    ],
    conduta: [
      {
        titulo: 'Tratamento',
        itens: [
          'Neutralizar a toxina circulante: imunoglobulina antitetânica (IGHAT/SAT).',
          'Controlar os espasmos: benzodiazepínicos; casos graves exigem bloqueio neuromuscular + ventilação mecânica.',
          'Disautonomia: sulfato de magnésio e controle adrenérgico; ambiente calmo (reduzir estímulos).',
          'Tratar a ferida: desbridamento + metronidazol. Iniciar/atualizar a IMUNIZAÇÃO (a doença não confere imunidade).',
        ],
      },
    ],
  },
  {
    id: 'influenza-covid-graves',
    nome: 'Influenza e COVID-19 graves',
    secao: 'Infecciosas',
    cid10: ['J11', 'J10'],
    sinonimos: ['influenza', 'gripe', 'H1N1', 'COVID', 'COVID-19', 'SARS-CoV-2', 'SRAG', 'síndrome gripal'],
    fonte:
      'Protocolos do Ministério da Saúde para síndrome gripal/SRAG. ⚠️ Condutas mudam por atualização sazonal — confirmar a VERSÃO VIGENTE. COVID-19 = CID U07.1, que NÃO consta na versão 2008 do DATASUS — revisão médica pendente',
    resumo:
      'Infecções virais respiratórias (influenza e SARS-CoV-2) que podem evoluir para Síndrome Respiratória Aguda Grave (SRAG): dispneia, SpO₂ < 95%, desconforto respiratório ou piora de doença de base. SRAG é de notificação. Atenção aos grupos de risco (idoso, gestante/puérpera, comorbidades, imunossupressão).',
    fisiopatologia: [
      'A inflamação e a lesão alveolar comprometem a troca gasosa → hipoxemia, podendo evoluir para SDRA.',
      'Risco de pneumonia viral primária e de coinfecção/pneumonia bacteriana secundária.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Oximetria de pulso e avaliação do esforço respiratório (gatilhos de gravidade).',
          'Teste etiológico conforme disponibilidade (RT-PCR/antígeno para influenza e SARS-CoV-2).',
          'Radiografia/TC de tórax; gasometria arterial nos casos graves.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Pneumonia bacteriana adquirida na comunidade',
      'Tromboembolismo pulmonar; insuficiência cardíaca descompensada',
      'Outras viroses respiratórias',
    ],
    conduta: [
      {
        titulo: 'Manejo',
        itens: [
          'Oxigenoterapia e suporte ventilatório conforme a gravidade (ver SDRA e Insuficiência respiratória/VNI).',
          'Influenza: antiviral PRECOCE (oseltamivir) nos casos graves ou de risco.',
          'COVID-19: manejo conforme protocolo vigente; profilaxia de TEV no paciente internado.',
          'Tratar coinfecção bacteriana quando presente; isolamento respiratório; notificação de SRAG.',
        ],
      },
    ],
  },
  {
    id: 'choque-toxico',
    nome: 'Síndrome do choque tóxico',
    secao: 'Infecciosas',
    cid10: ['A48.3'],
    sinonimos: ['choque tóxico', 'TSS', 'síndrome do choque tóxico', 'superantígeno', 'estreptocócico', 'estafilocócico'],
    fonte: 'ABRAMEDE 2024 e Medicina de Emergência (USP/HC-FMUSP)',
    resumo:
      'Doença mediada por toxinas (superantígenos) de Staphylococcus aureus ou Streptococcus pyogenes: febre alta, hipotensão, exantema difuso (com descamação tardia) e disfunção multiorgânica de instalação rápida. Forma estafilocócica (clássica: tampão/ferida cirúrgica) e estreptocócica (em geral com foco invasivo de partes moles).',
    fisiopatologia: [
      'Superantígenos ativam linfócitos T em massa → tempestade de citocinas → vasodilatação, extravasamento capilar e choque distributivo com disfunção de órgãos.',
    ],
    exames: [
      {
        titulo: 'Avaliação',
        itens: [
          'Diagnóstico por critérios clínicos; identificar e culturas do foco (ferida, partes moles) + hemoculturas.',
          'Marcadores de disfunção orgânica: função renal e hepática, CK, lactato, coagulograma.',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Choque séptico de outras causas',
      'Doença de Kawasaki, escarlatina',
      'Necrólise epidérmica tóxica / Stevens-Johnson; leptospirose; dengue grave',
    ],
    conduta: [
      {
        titulo: 'Tratamento',
        itens: [
          'Ressuscitação do choque (volume e vasopressor) e suporte de órgãos.',
          'CONTROLE DO FOCO: remover tampão/corpo estranho, drenar/desbridar; cirurgia se fasciíte associada.',
          'Antibiótico cobrindo S. aureus e Streptococcus + CLINDAMICINA (ação antitoxina).',
          'Considerar imunoglobulina (IGIV) nos casos graves, sobretudo na forma estreptocócica.',
        ],
      },
    ],
  },
  {
    id: 'choque-hemorragico',
    nome: 'Choque hemorrágico',
    secao: 'Choque e anafilaxia',
    cid10: ['R57.1'],
    sinonimos: [
      'hemorragia maciça',
      'transfusão maciça',
      'trauma',
      'politrauma',
      'ressuscitação hemostática',
      'hipotensão permissiva',
      'ácido tranexâmico',
      'TXA',
      'coagulopatia do trauma',
    ],
    fonte:
      'Diretriz europeia de sangramento maciço no trauma, 6ª ed. (Rossaint/Spahn, Crit Care 2023; PMID 36859355) + CRASH-2 e sua análise de tempo (Lancet 2010/2011; PMID 20554319, 21439633). Confirme condutas e doses na fonte primária.',
    resumo:
      'Choque hipovolêmico por perda sanguínea aguda (o trauma é a causa mais comum) — principal causa de morte evitável no trauma. A coagulopatia induzida pelo trauma instala-se cedo e, com hipotermia e acidose, forma a "tríade letal". O tratamento é simultâneo: PARAR o sangramento (controle de dano) + ressuscitação hemostática (hemocomponentes em razão balanceada, ácido tranexâmico, fibrinogênio, cálcio) sob hipotensão permissiva até o controle da fonte.',
    fisiopatologia: [
      'A perda volêmica reduz pré-carga e débito cardíaco; a hipoperfusão tecidual gera metabolismo anaeróbico, acidose lática e disfunção orgânica progressiva.',
      'Coagulopatia induzida pelo trauma: hipoperfusão + lesão tecidual ativam a proteína C e a fibrinólise (hiperfibrinólise), consumindo fibrinogênio — daí o papel do ácido tranexâmico (antifibrinolítico) e da reposição precoce de fibrinogênio.',
      'Tríade letal: hipotermia + acidose + coagulopatia se retroalimentam; cristaloide em excesso e hipotermia agravam o sangramento (coagulopatia dilucional e por hipotermia).',
    ],
    exames: [
      {
        titulo: 'Avaliação inicial / gravidade',
        itens: [
          'POCUS (eFAST) para sangramento em cavidades; RX de tórax e de pelve no trauma',
          'Lactato e excesso de base (gravidade da hipoperfusão)',
          'Tipagem sanguínea e prova cruzada imediatas',
          'Hemograma (Hb seriada — pode estar normal no início), gasometria, cálcio iônico',
        ],
      },
      {
        titulo: 'Coagulação (monitorização precoce e repetida — Grade 1C)',
        itens: [
          'TP/INR, TTPa, fibrinogênio (Clauss) e plaquetas',
          'Viscoelastometria (ROTEM/TEG) quando disponível — guia a reposição de fibrinogênio e direciona a terapia',
        ],
      },
    ],
    diagnosticoDiferencial: [
      'Choque de outras etiologias (distributivo/séptico, cardiogênico, obstrutivo) — ver ficha "Choque"',
      'Hemorragia oculta: tórax, abdome, retroperitônio/pelve e ossos longos ("blood on the floor and four more")',
      'Choque neurogênico no trauma raquimedular (hipotensão com bradicardia, sem taquicardia)',
    ],
    conduta: [
      {
        titulo: 'Controle do sangramento (prioridade)',
        itens: [
          'Compressão/torniquete na hemorragia externa de extremidade; estabilização pélvica (cinta) na fratura de pelve',
          'Controle de dano: cirurgia/angioembolização precoce — NÃO retardar o controle da fonte',
          'Reverter anticoagulantes; corrigir hipotermia (aquecimento ativo, fluidos aquecidos)',
        ],
      },
      {
        titulo: 'Hipotensão permissiva (até controlar a fonte)',
        itens: [
          'Sem TCE: alvo PAS 80–90 mmHg / PAM 50–60 mmHg, com reposição volêmica restritiva (Grade 1B)',
          'TCE grave (ECG ≤ 8): manter PAM ≥ 80 mmHg (Grade 1C)',
          'Minimizar cristaloide — preferir hemocomponentes precocemente',
        ],
      },
      {
        titulo: 'Ácido tranexâmico (TXA) — o quanto antes, ≤ 3 h',
        itens: [
          '1 g IV em 10 min (ataque) + 1 g IV em infusão por 8 h (manutenção), se possível ainda no pré-hospitalar (Grade 1A)',
          'Dar em ≤ 3 h do trauma (ideal ≤ 1 h): após 3 h é ineficaz e aumenta a morte por sangramento (CRASH-2 timing: > 3 h RR 1,44)',
          'Não aguardar a viscoelastometria para iniciar (Grade 1B)',
        ],
      },
      {
        titulo: 'Ressuscitação hemostática (transfusão balanceada)',
        itens: [
          'Ativar o protocolo de transfusão maciça; razão de hemocomponentes entre 1:1:1 e 1:1:2 (plasma : plaquetas : concentrado de hemácias)',
          'Fibrinogênio (concentrado ou crioprecipitado) se fibrinogênio ≤ 1,5 g/L ou déficit funcional na viscoelastometria; dose inicial 3–4 g (Grade 1C)',
          'Cálcio: monitorar e manter o cálcio iônico normal, sobretudo na transfusão maciça; corrigir com cloreto de cálcio (Grade 1C)',
        ],
      },
      {
        titulo: 'Suporte',
        itens: [
          'Combater a tríade letal: aquecer, corrigir a acidose pela restauração da perfusão, repor fatores',
          'Reavaliação contínua (resposta à reposição, sangramento oculto, eFAST seriado)',
        ],
      },
    ],
    atualizacoes: [
      {
        diretriz:
          'Diretriz europeia (Crit Care 2023, 6ª ed.; PMID 36859355) + CRASH-2 (Lancet 2010; PMID 20554319) e análise de tempo (Lancet 2011; PMID 21439633)',
        texto:
          'TXA reduz a mortalidade no sangramento traumático quando dado ≤ 3 h (ideal ≤ 1 h): 1 g + 1 g (Grade 1A). Hipotensão permissiva (PAS 80–90 / PAM 50–60; TCE PAM ≥ 80); transfusão balanceada 1:1:1–1:1:2; fibrinogênio ≤ 1,5 g/L → 3–4 g; manter cálcio iônico normal.',
      },
    ],
  },
]
