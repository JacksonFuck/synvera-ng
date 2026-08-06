/**
 * BULÁRIO RESUMIDO — monografias de medicamentos (modelo "bula profissional").
 * ⚠️ REVISÃO MÉDICA OBRIGATÓRIA antes de uso clínico.
 *
 * Conteúdo AUTORAL, resumido a partir das bulas profissionais da ANVISA e de
 * referências de farmacologia (Formulário Terapêutico Nacional/MS, RENAME,
 * literatura). NÃO é cópia de bases proprietárias — só a ESTRUTURA segue o
 * formato usual de monografia (classe, mecanismo, apresentações, uso clínico,
 * posologia, ajustes, contraindicações, efeitos adversos, advertências).
 *
 * As doses são ponto de partida; o prescritor confirma na bula vigente e ajusta
 * caso a caso. Os valores variam por apresentação, indicação, idade e função
 * renal/hepática.
 */

/** Bloco "título + itens" reutilizado (posologia por via/idade). */
export interface MonoGrupo {
  titulo: string
  itens: string[]
}

export interface Monografia {
  id: string
  /** Nome (princípio ativo): "Dipirona (metamizol)". */
  nome: string
  /** Princípio ativo / sinônimo para a busca. */
  principio?: string
  /** Termos alternativos para a busca (marcas, siglas). */
  sinonimos?: string[]
  /** Classe terapêutica. */
  classe: string
  /** Nomes comerciais comuns no Brasil. */
  nomesComerciais?: string[]
  /** Mecanismo de ação (resumo). */
  mecanismo?: string
  /** Apresentações disponíveis. */
  apresentacoes: string[]
  /** Indicações de uso clínico. */
  usoClinico: string[]
  /** Tipo de receituário exigido. */
  receituario?: string
  /** Posologia por via/idade. */
  posologia: MonoGrupo[]
  /** Ajuste de dose (renal/hepático/idoso). */
  ajusteDose?: string[]
  /** Contraindicações. */
  contraindicacoes: string[]
  /** Efeitos adversos relevantes. */
  efeitosAdversos: string[]
  /** Advertências e precauções. */
  advertencias?: string[]
  /** Uso na gestação e lactação. */
  gestacaoLactacao?: string
  /** Interações medicamentosas relevantes. */
  interacoes?: string[]
  /** Nº de registro ANVISA (deep-link para a bula oficial). Use os 9 primeiros dígitos. */
  numeroRegistro?: string
  /** Sobrescreve a linha de fonte. */
  fonte?: string
}

/** Ordem de exibição das classes (agrupamento da lista). */
export const BULARIO_CLASSES = [
  'Cardiovascular e anti-hipertensivos',
  'Antidiabéticos',
  'Hipolipemiantes',
  'Gastrointestinais',
  'Hormônios e tireoide',
  'Analgésicos e antitérmicos',
  'Anti-inflamatórios (AINE)',
  'Corticoides',
  'Antialérgicos',
  'Respiratórios',
  'Psiquiátricos e sistema nervoso',
  'Antibióticos',
  'Antifúngicos',
  'Antivirais',
  'Hematínicos e suplementos',
  'Hemostáticos e antifibrinolíticos',
] as const

export const BULARIO: Monografia[] = [
  // ───────────────────── Analgésicos e antitérmicos ─────────────────────
  {
    id: 'dipirona',
    nome: 'Dipirona (metamizol)',
    principio: 'metamizol',
    sinonimos: ['dipirona', 'metamizol', 'novalgina', 'analgésico', 'antitérmico', 'pirazolona'],
    classe: 'Analgésicos e antitérmicos',
    nomesComerciais: ['Novalgina®', 'Anador®', 'Dipirona genérica', 'Dorflex Uno®', 'Magnopyrol®'],
    mecanismo:
      'Analgésico e antitérmico não opioide (pirazolona). Inibe a síntese de prostaglandinas por bloqueio da COX (central e periférico) e dessensibiliza nociceptores pela via óxido nítrico–GMPc. Metabólito ativo: 4-N-metilaminoantipirina (MAA).',
    apresentacoes: [
      'Comprimido 500 mg e 1 g',
      'Solução oral (gotas) 500 mg/mL',
      'Solução oral 50 mg/mL',
      'Solução injetável 500 mg/mL (ampolas de 2 e 5 mL)',
      'Supositório 300 mg',
    ],
    usoClinico: ['Dor leve a moderada (incluindo cólica)', 'Febre'],
    receituario:
      'Solução injetável: receituário simples. Demais apresentações: venda sem prescrição.',
    posologia: [
      {
        titulo: 'Adulto — via oral',
        itens: [
          'Comprimido: 500 mg–1 g até 4×/dia',
          'Gotas (500 mg/mL): 20–40 gotas até 4×/dia',
          'Solução oral (50 mg/mL): 10–20 mL até 4×/dia',
        ],
      },
      {
        titulo: 'Adulto — via parenteral',
        itens: [
          'IV lenta (≤ 1 mL/min) ou IM: 1 g (2 mL da solução 500 mg/mL) até 4×/dia',
          'Diluir para infusão em SF 0,9%, SG 5% ou Ringer lactato',
          'Hipotensão é mais provável quanto mais rápida a injeção IV',
        ],
      },
      {
        titulo: 'Pediátrico',
        itens: [
          'Dose por peso conforme bula/apresentação (em geral 10–15 mg/kg/dose até 4×/dia)',
          'Respeitar os limites de idade/peso (ver contraindicações)',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência renal ou hepática: evitar doses altas e uso prolongado (eliminação reduzida)',
      'Idoso: usar a menor dose eficaz',
    ],
    contraindicacoes: [
      'Hipersensibilidade à dipirona/pirazolonas (ex.: fenazona) ou pirazolidinas (ex.: fenilbutazona)',
      'Agranulocitose prévia com o uso de qualquer dessas substâncias',
      'Disfunção da medula óssea / doença hematopoiética',
      'Broncoespasmo ou reação anafilactoide prévia a analgésicos (AAS, paracetamol, AINE)',
      'Porfiria hepática aguda intermitente',
      'Deficiência de G6PD (risco de hemólise)',
      'Gravidez e lactação',
      'Lactentes < 3 meses ou < 5 kg (VO/IM); < 11 meses ou < 9 kg (IV)',
    ],
    efeitosAdversos: [
      'Discrasias sanguíneas: agranulocitose, leucopenia, trombocitopenia, anemia aplástica (raras, porém graves)',
      'Reações anafiláticas/anafilactoides; síndrome de Kounis',
      'Reações hipotensivas isoladas (sobretudo após IV)',
      'Reações cutâneas, incluindo graves (SSJ/NET — raras)',
      'Relatos de lesão hepática aguda (hepatocelular)',
    ],
    advertencias: [
      'Orientar o paciente a suspender e procurar atendimento ao 1º sinal de agranulocitose (febre, dor de garganta, lesões em mucosas) ou de lesão hepática',
      'Pode reduzir a atenção/capacidade de reação (dirigir/operar máquinas)',
      'Algumas apresentações contêm açúcar, sorbitol ou lactose (atenção em diabetes/intolerâncias)',
    ],
    gestacaoLactacao:
      'Contraindicada na gestação (especialmente 1º e 3º trimestres) e durante a amamentação (os metabólitos passam ao leite — evitar amamentar por ~48 h após a dose).',
    interacoes: [
      'Pode reduzir o efeito do AAS sobre a agregação plaquetária',
      'Risco aditivo de mielotoxicidade com metotrexato',
      'Pode reduzir níveis de ciclosporina; cautela com clorpromazina (hipotermia grave) e com outros nefrotóxicos',
    ],
    numeroRegistro: '167730586',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'paracetamol',
    nome: 'Paracetamol (acetaminofeno)',
    principio: 'acetaminofeno',
    sinonimos: ['paracetamol', 'acetaminofeno', 'tylenol', 'analgésico', 'antitérmico'],
    classe: 'Analgésicos e antitérmicos',
    nomesComerciais: ['Tylenol®', 'Paracetamol genérico', 'Dôrico®'],
    mecanismo:
      'Analgésico e antitérmico não opioide. Ação predominantemente central, com inibição fraca da COX e modulação de vias serotoninérgicas; efeito anti-inflamatório periférico mínimo.',
    apresentacoes: [
      'Comprimido 500 mg e 750 mg',
      'Solução oral (gotas) 200 mg/mL',
      'Suspensão oral 32 mg/mL',
      'Comprimido 1 g',
    ],
    usoClinico: ['Dor leve a moderada', 'Febre'],
    receituario: 'Venda sem prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '500 mg–1 g VO de 6/6 h, conforme necessário',
          'Dose máxima: 4 g/dia (3 g/dia em hepatopatas/etilistas/idosos frágeis)',
        ],
      },
      {
        titulo: 'Pediátrico',
        itens: ['10–15 mg/kg/dose VO de 6/6 h (máx. 75 mg/kg/dia, sem exceder a dose do adulto)'],
      },
    ],
    ajusteDose: [
      'Hepatopatia / etilismo crônico / desnutrição: reduzir a dose máxima (risco de hepatotoxicidade)',
      'Insuficiência renal grave: aumentar o intervalo entre as doses',
    ],
    contraindicacoes: ['Hipersensibilidade ao paracetamol', 'Insuficiência hepática grave'],
    efeitosAdversos: [
      'Hepatotoxicidade dose-dependente (overdose) — principal risco',
      'Reações cutâneas (raras, incluindo graves)',
      'Discrasias sanguíneas (raras)',
    ],
    advertencias: [
      'Atenção à dose total somando associações (muitos produtos de gripe contêm paracetamol)',
      'Antídoto da intoxicação: N-acetilcisteína',
    ],
    gestacaoLactacao:
      'Considerado o analgésico/antitérmico de escolha na gestação e lactação, na menor dose eficaz.',
    interacoes: [
      'Uso crônico com varfarina pode aumentar o INR',
      'Indutores enzimáticos aumentam o risco de hepatotoxicidade',
    ],
    numeroRegistro: '102350764',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────────── Anti-inflamatórios (AINE) ─────────────────────
  {
    id: 'ibuprofeno',
    nome: 'Ibuprofeno',
    principio: 'ibuprofeno',
    sinonimos: ['ibuprofeno', 'advil', 'alivium', 'AINE', 'anti-inflamatório'],
    classe: 'Anti-inflamatórios (AINE)',
    nomesComerciais: ['Advil®', 'Alivium®', 'Ibuprofeno genérico'],
    mecanismo:
      'Anti-inflamatório não esteroidal (AINE) derivado do ácido propiônico. Inibe de forma não seletiva a COX-1 e a COX-2, reduzindo a síntese de prostaglandinas (efeito analgésico, antitérmico e anti-inflamatório).',
    apresentacoes: [
      'Comprimido/cápsula 200, 400 e 600 mg',
      'Suspensão oral 50 mg/mL e 100 mg/mL',
      'Gotas 50 mg/mL e 100 mg/mL',
    ],
    usoClinico: [
      'Dor leve a moderada',
      'Febre',
      'Processos inflamatórios (incl. musculoesqueléticos)',
    ],
    receituario: 'Venda sem prescrição (apresentações de menor concentração).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '200–600 mg VO de 6/6 a 8/8 h',
          'Dose máxima usual: 1,2–3,2 g/dia (menor dose eficaz, pelo menor tempo)',
        ],
      },
      {
        titulo: 'Pediátrico (> 6 meses)',
        itens: ['5–10 mg/kg/dose VO de 6/6 a 8/8 h (máx. 40 mg/kg/dia)'],
      },
    ],
    ajusteDose: [
      'Insuficiência renal: evitar (risco de piora da função renal)',
      'Idoso: maior risco de eventos GI e renais — menor dose/tempo',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao ibuprofeno ou a outros AINE/AAS (asma, urticária, angioedema induzidos por AINE)',
      'Úlcera péptica ativa / sangramento gastrointestinal',
      'Insuficiência cardíaca grave, renal ou hepática graves',
      'Terceiro trimestre da gestação',
      'Pós-operatório de cirurgia de revascularização miocárdica (ponte)',
    ],
    efeitosAdversos: [
      'Gastrointestinais: dispepsia, úlcera, sangramento',
      'Renais: retenção hídrica, edema, lesão renal aguda',
      'Cardiovasculares: hipertensão, aumento do risco trombótico (uso prolongado/alta dose)',
      'Reações de hipersensibilidade',
    ],
    advertencias: [
      'Usar a menor dose eficaz pelo menor tempo possível',
      'Cautela em hipertensos, cardiopatas, nefropatas e idosos; associar protetor gástrico em risco GI',
    ],
    gestacaoLactacao:
      'Evitar no 3º trimestre (fechamento precoce do canal arterial e oligoâmnio). Compatível com a lactação em doses usuais e curto prazo.',
    interacoes: [
      'Reduz o efeito anti-hipertensivo de IECA/BRA/diuréticos; "tríade nefrotóxica" (IECA/BRA + diurético + AINE)',
      'Aumenta o risco de sangramento com anticoagulantes/antiagregantes',
      'Eleva níveis de lítio e metotrexato',
    ],
    numeroRegistro: '167730088',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────────────────── Antibióticos ─────────────────────────────
  {
    id: 'amoxicilina',
    nome: 'Amoxicilina',
    principio: 'amoxicilina',
    sinonimos: ['amoxicilina', 'amoxil', 'penicilina', 'antibiótico', 'betalactâmico'],
    classe: 'Antibióticos',
    nomesComerciais: ['Amoxil®', 'Novocilin®', 'Amoxicilina genérica'],
    mecanismo:
      'Antibiótico betalactâmico (aminopenicilina). Inibe a síntese da parede celular bacteriana ao ligar-se às PBP, com ação bactericida. Sensível a betalactamases (associar clavulanato amplia o espectro).',
    apresentacoes: [
      'Cápsula/comprimido 500 mg',
      'Comprimido 875 mg',
      'Suspensão oral 250 mg/5 mL e 400 mg/5 mL',
    ],
    usoClinico: [
      'Infecções de vias aéreas (otite média, sinusite, faringoamigdalite estreptocócica)',
      'Pneumonia adquirida na comunidade (ambulatorial)',
      'Infecção urinária em situações selecionadas; profilaxia de endocardite',
    ],
    receituario:
      'Antibiótico — receituário de controle especial (RDC 471/2021): receita simples retida em 2 vias.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '500 mg VO de 8/8 h ou 875 mg de 12/12 h',
          'Infecções graves/pneumonia: até 1 g de 8/8 h',
          'Profilaxia de endocardite: 2 g VO dose única 30–60 min antes do procedimento',
        ],
      },
      {
        titulo: 'Pediátrico',
        itens: [
          '40–50 mg/kg/dia divididos de 8/8 h (até 90 mg/kg/dia em otite/pneumonia)',
          'Não exceder a dose do adulto',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência renal: ClCr 10–30 mL/min → 500 mg de 12/12 h; ClCr < 10 → 500 mg de 24/24 h',
      'Hemodiálise: dose após a sessão',
    ],
    contraindicacoes: [
      'Hipersensibilidade a penicilinas/betalactâmicos (anafilaxia prévia)',
      'Cautela em alergia a cefalosporinas (reação cruzada)',
    ],
    efeitosAdversos: [
      'Diarreia, náusea, candidíase',
      'Rash cutâneo (exantema; muito comum se houver mononucleose concomitante)',
      'Reações de hipersensibilidade (urticária, anafilaxia)',
      'Colite por C. difficile (uso prolongado)',
    ],
    advertencias: [
      'Confirmar história de alergia a penicilina antes de prescrever',
      'Completar o curso prescrito (evitar resistência); pode reduzir eficácia de contraceptivos orais (orientar método adicional)',
    ],
    gestacaoLactacao: 'Compatível com gestação e lactação (penicilina é classicamente segura).',
    interacoes: [
      'Alopurinol aumenta a chance de rash',
      'Pode reduzir a eficácia de anticoncepcionais orais',
      'Probenecida eleva os níveis séricos da amoxicilina',
    ],
    numeroRegistro: '105830880',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────── Cardiovascular e anti-hipertensivos ─────────────────
  {
    id: 'losartana',
    nome: 'Losartana',
    principio: 'losartana potássica',
    sinonimos: [
      'losartana',
      'losartan',
      'cozaar',
      'aradois',
      'BRA',
      'anti-hipertensivo',
      'pressão alta',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Cozaar®', 'Aradois®', 'Corus®', 'Losartana genérica'],
    mecanismo:
      'Bloqueador do receptor da angiotensina II (BRA/ARA-II): antagoniza o receptor AT1, causando vasodilatação e redução da aldosterona. Não eleva bradicinina, por isso quase não causa tosse (diferente dos IECA).',
    apresentacoes: ['Comprimido 25 mg, 50 mg e 100 mg'],
    usoClinico: [
      'Hipertensão arterial',
      'Nefropatia diabética / proteção renal',
      'Insuficiência cardíaca (intolerantes a IECA)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '50 mg/dia (faixa 25–100 mg/dia, 1–2×)',
          'Iniciar 25 mg em idoso ou depleção de volume',
        ],
      },
    ],
    ajusteDose: [
      'Hepatopatia: iniciar 25 mg',
      'Sem ajuste renal de rotina; cautela em estenose bilateral de artéria renal',
    ],
    contraindicacoes: [
      'Hipersensibilidade',
      'Gestação (contraindicado no 2º/3º trimestre; evitar em toda a gestação)',
      'Uso com alisquireno em diabéticos',
      'Estenose bilateral de artéria renal',
    ],
    efeitosAdversos: [
      'Tontura, hipotensão',
      'Hipercalemia',
      'Elevação de creatinia (LRA em situações de risco)',
      'Angioedema (raro)',
    ],
    advertencias: [
      'Monitorar potássio e função renal',
      'Risco de hipotensão em depleção de volume/diurético',
    ],
    gestacaoLactacao: 'Contraindicado na gestação (toxicidade fetal). Evitar na lactação.',
    interacoes: [
      'IECA/alisquireno (hipercalemia/LRA)',
      'AINE (reduz efeito, risco de LRA)',
      'Diuréticos poupadores de potássio',
      'Lítio',
    ],
    numeroRegistro: '151670044',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'anlodipino',
    nome: 'Anlodipino (besilato)',
    principio: 'besilato de anlodipino',
    sinonimos: [
      'anlodipino',
      'amlodipino',
      'norvasc',
      'BCC',
      'bloqueador de cálcio',
      'anti-hipertensivo',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Norvasc®', 'Pressat®', 'Anlo®', 'Anlodipino genérico'],
    mecanismo:
      'Bloqueador dos canais de cálcio diidropiridínico: relaxa a musculatura lisa arterial (vasodilatação periférica), reduzindo a resistência vascular e a pressão arterial.',
    apresentacoes: ['Comprimido 5 mg e 10 mg'],
    usoClinico: ['Hipertensão arterial', 'Angina estável e vasoespástica (Prinzmetal)'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['5 mg/dia, até 10 mg/dia', 'Iniciar 2,5 mg em idoso/hepatopata'],
      },
    ],
    ajusteDose: ['Hepatopatia: iniciar 2,5 mg', 'Sem ajuste renal'],
    contraindicacoes: [
      'Hipersensibilidade',
      'Choque cardiogênico',
      'Estenose aórtica grave',
      'Hipotensão grave',
    ],
    efeitosAdversos: [
      'Edema de membros inferiores (dose-dependente, principal)',
      'Cefaleia, rubor, palpitação',
      'Tontura',
    ],
    advertencias: [
      'O edema é por vasodilatação e NÃO responde a diurético',
      'Cautela na insuficiência cardíaca',
    ],
    gestacaoLactacao: 'Usar apenas se claramente necessário (dados limitados).',
    interacoes: ['Sinvastatina (limitar a 20 mg/dia)', 'Inibidores/indutores do CYP3A4'],
    numeroRegistro: '100470275',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'enalapril',
    nome: 'Enalapril (maleato)',
    principio: 'maleato de enalapril',
    sinonimos: ['enalapril', 'renitec', 'eupressin', 'IECA', 'anti-hipertensivo'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Renitec®', 'Eupressin®', 'Enalapril genérico'],
    mecanismo:
      'Inibidor da enzima conversora da angiotensina (IECA): reduz a formação de angiotensina II e a degradação de bradicinina, promovendo vasodilatação e redução da pós-carga.',
    apresentacoes: ['Comprimido 5 mg, 10 mg e 20 mg'],
    usoClinico: [
      'Hipertensão arterial',
      'Insuficiência cardíaca / disfunção de VE',
      'Nefroproteção',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['5–40 mg/dia (1–2×)', 'Iniciar 5 mg (2,5 mg se IC, idoso ou em uso de diurético)'],
      },
    ],
    ajusteDose: ['ClCr < 30: iniciar 2,5 mg', 'Cautela em estenose bilateral de artéria renal'],
    contraindicacoes: [
      'Angioedema prévio relacionado a IECA',
      'Gestação',
      'Uso com alisquireno em diabéticos',
      'Estenose bilateral de artéria renal',
    ],
    efeitosAdversos: [
      'Tosse seca (clássica)',
      'Hipercalemia',
      'Elevação de creatinina',
      'Hipotensão (especialmente na 1ª dose)',
      'Angioedema (raro, porém grave)',
    ],
    advertencias: ['Suspender imediatamente se angioedema', 'Monitorar potássio e função renal'],
    gestacaoLactacao: 'Contraindicado na gestação (toxicidade fetal).',
    interacoes: ['BRA/alisquireno', 'AINE', 'Diuréticos poupadores de potássio', 'Lítio'],
    numeroRegistro: '103700683',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'atenolol',
    nome: 'Atenolol',
    principio: 'atenolol',
    sinonimos: ['atenolol', 'atenol', 'ablok', 'betabloqueador', 'anti-hipertensivo'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Atenol®', 'Ablok®', 'Atenolol genérico'],
    mecanismo:
      'Betabloqueador cardiosseletivo (β1): reduz a frequência cardíaca, a contratilidade e a liberação de renina, diminuindo o consumo miocárdico de oxigênio e a pressão arterial.',
    apresentacoes: ['Comprimido 25 mg, 50 mg e 100 mg'],
    usoClinico: ['Hipertensão arterial', 'Angina', 'Pós-IAM', 'Controle de frequência / arritmias'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [{ titulo: 'Adulto', itens: ['25–100 mg/dia (1×)', 'Titular pela FC e PA'] }],
    ajusteDose: ['ClCr < 35: reduzir a dose (excreção renal)', 'Idoso: menor dose inicial'],
    contraindicacoes: [
      'Bradicardia significativa, BAV de 2º/3º grau',
      'Choque cardiogênico, IC descompensada',
      'Asma grave / broncoespasmo ativo',
    ],
    efeitosAdversos: [
      'Bradicardia, fadiga, extremidades frias',
      'Broncoespasmo',
      'Mascara sintomas de hipoglicemia',
      'Disfunção erétil, distúrbio do sono',
    ],
    advertencias: [
      'NÃO suspender abruptamente (efeito rebote: angina/HAS)',
      'Cautela em diabetes, DPOC/asma e doença arterial periférica',
    ],
    gestacaoLactacao:
      'Evitar (associado a restrição de crescimento fetal); usar só se benefício superar o risco.',
    interacoes: [
      'Verapamil/diltiazem (bradicardia/BAV)',
      'Clonidina (rebote ao suspender)',
      'Antiarrítmicos',
      'Hipoglicemiantes',
    ],
    numeroRegistro: '118190202',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'hidroclorotiazida',
    nome: 'Hidroclorotiazida',
    principio: 'hidroclorotiazida',
    sinonimos: [
      'hidroclorotiazida',
      'HCTZ',
      'clorana',
      'diurético',
      'tiazídico',
      'anti-hipertensivo',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Clorana®', 'Hidroclorotiazida genérica'],
    mecanismo:
      'Diurético tiazídico: inibe a reabsorção de sódio e cloro no túbulo contorcido distal, aumentando a diurese e reduzindo o volume e a pressão arterial.',
    apresentacoes: ['Comprimido 25 mg e 50 mg'],
    usoClinico: ['Hipertensão arterial', 'Edema'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [{ titulo: 'Adulto', itens: ['12,5–25 mg/dia (hipertensão), até 50 mg/dia'] }],
    ajusteDose: [
      'Pouco eficaz se ClCr < 30 (preferir diurético de alça)',
      'Cautela em hepatopatia',
    ],
    contraindicacoes: [
      'Anúria',
      'Hipersensibilidade a sulfonamidas',
      'Hipocalemia/hiponatremia graves',
    ],
    efeitosAdversos: [
      'Hipocalemia, hiponatremia, hipomagnesemia',
      'Hiperuricemia (precipita gota)',
      'Hiperglicemia, hipercalcemia, dislipidemia',
      'Fotossensibilidade',
    ],
    advertencias: ['Monitorar eletrólitos (sobretudo K e Na)', 'Risco de hiponatremia no idoso'],
    gestacaoLactacao: 'Evitar na gestação.',
    interacoes: [
      'Lítio (aumenta toxicidade)',
      'AINE (reduz efeito)',
      'Digoxina (hipocalemia potencializa toxicidade)',
      'Corticoides (espoliação de potássio)',
    ],
    numeroRegistro: '141070094',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'aas',
    nome: 'Ácido acetilsalicílico (AAS)',
    principio: 'ácido acetilsalicílico',
    sinonimos: [
      'AAS',
      'aspirina',
      'acido acetilsalicilico',
      'antiagregante',
      'AAS infantil',
      'cardioaspirina',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['AAS®', 'Aspirina Prevent®', 'Somalgin Cardio®', 'AAS genérico'],
    mecanismo:
      'Em dose baixa, inibe de forma irreversível a COX-1 plaquetária, reduzindo o tromboxano A2 e a agregação plaquetária (efeito que dura a vida da plaqueta, ~7–10 dias). Em dose alta, tem efeito analgésico/anti-inflamatório.',
    apresentacoes: [
      'Comprimido 81 mg / 100 mg (antiagregante)',
      'Comprimido 300 mg / 500 mg (analgésico)',
    ],
    usoClinico: [
      'Prevenção secundária cardiovascular (pós-IAM/AVC)',
      'Síndrome coronariana aguda',
      'Analgesia/antitérmico (dose alta)',
    ],
    receituario: 'Venda sem prescrição.',
    posologia: [
      { titulo: 'Antiagregante', itens: ['75–100 mg/dia'] },
      { titulo: 'Síndrome coronariana aguda', itens: ['Ataque 150–300 mg mastigável'] },
    ],
    ajusteDose: ['Cautela em doença renal crônica e hepatopatia'],
    contraindicacoes: [
      'Alergia a salicilatos/AINE',
      'Úlcera péptica ou sangramento ativo; discrasias hemorrágicas',
      'Crianças/adolescentes em quadro viral (risco de síndrome de Reye)',
      'Terceiro trimestre da gestação (dose plena)',
    ],
    efeitosAdversos: [
      'Dispepsia, sangramento gastrointestinal',
      'Aumento do risco hemorrágico',
      'Broncoespasmo em indivíduos sensíveis',
    ],
    advertencias: [
      'Risco hemorrágico (atenção ao uso com anticoagulantes/antiagregantes)',
      'Avaliar suspensão pré-operatória conforme o caso',
    ],
    gestacaoLactacao:
      'Evitar dose plena no 3º trimestre. Dose baixa pode ser indicada na profilaxia de pré-eclâmpsia, sob orientação.',
    interacoes: [
      'Anticoagulantes e outros antiagregantes (sangramento)',
      'AINE (reduzem a cardioproteção e somam risco GI)',
      'Metotrexato',
    ],
    numeroRegistro: '142590006',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────────────────── Antidiabéticos ─────────────────────────────
  {
    id: 'metformina',
    nome: 'Metformina (cloridrato)',
    principio: 'cloridrato de metformina',
    sinonimos: ['metformina', 'glifage', 'glucoformin', 'biguanida', 'diabetes', 'antidiabético'],
    classe: 'Antidiabéticos',
    nomesComerciais: ['Glifage®', 'Glifage XR®', 'Glucoformin®', 'Metformina genérica'],
    mecanismo:
      'Biguanida: reduz a produção hepática de glicose e aumenta a sensibilidade periférica à insulina. Não estimula a secreção de insulina, por isso não causa hipoglicemia isoladamente.',
    apresentacoes: ['Comprimido 500 mg, 850 mg e 1 g', 'Liberação prolongada (XR) 500/750/1000 mg'],
    usoClinico: [
      'Diabetes mellitus tipo 2 (1ª linha)',
      'Síndrome dos ovários policísticos',
      'Pré-diabetes (casos selecionados)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Iniciar 500 mg 1–2×/dia com as refeições',
          'Titular gradualmente até 2000–2550 mg/dia',
          'XR permite dose única diária e melhora a tolerância GI',
        ],
      },
    ],
    ajusteDose: [
      'Contraindicada se TFG < 30 mL/min',
      'TFG 30–45: não iniciar; se já em uso, reduzir e monitorar',
      'Suspender em contraste iodado, cirurgia ou doença aguda com risco de hipoperfusão',
    ],
    contraindicacoes: [
      'TFG < 30 mL/min',
      'Acidose metabólica / cetoacidose',
      'Insuficiência cardíaca descompensada ou hipóxia',
      'Insuficiência hepática grave, etilismo',
    ],
    efeitosAdversos: [
      'Intolerância GI (diarreia, náusea — comuns; melhoram com XR e dose junto às refeições)',
      'Gosto metálico',
      'Deficiência de vitamina B12 (uso prolongado)',
      'Acidose láctica (rara, porém grave)',
    ],
    advertencias: [
      'Suspender 48 h em exame com contraste iodado/cirurgia',
      'Risco de acidose láctica em hipóxia, sepse ou lesão renal aguda',
    ],
    gestacaoLactacao:
      'Pode ser usada, embora a insulina seja o padrão na gestação; geralmente compatível com a lactação.',
    interacoes: ['Contraste iodado', 'Álcool', 'Fármacos que pioram a função renal'],
    numeroRegistro: '118190206',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────────────────── Hipolipemiantes ─────────────────────────────
  {
    id: 'sinvastatina',
    nome: 'Sinvastatina',
    principio: 'sinvastatina',
    sinonimos: ['sinvastatina', 'simvastatina', 'zocor', 'sinvalip', 'estatina', 'colesterol'],
    classe: 'Hipolipemiantes',
    nomesComerciais: ['Zocor®', 'Sinvalip®', 'Sinvastatina genérica'],
    mecanismo:
      'Estatina: inibe a HMG-CoA redutase, reduzindo a síntese hepática de colesterol e aumentando a expressão de receptores de LDL — o que diminui o LDL circulante.',
    apresentacoes: ['Comprimido 10 mg, 20 mg e 40 mg'],
    usoClinico: ['Dislipidemia (redução de LDL)', 'Prevenção cardiovascular primária e secundária'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '10–40 mg à noite',
          'Máx. 40 mg/dia (a dose de 80 mg foi abandonada pelo risco de miopatia)',
        ],
      },
    ],
    ajusteDose: ['ClCr < 30: iniciar 5 mg com cautela', 'Doença hepática ativa: contraindicada'],
    contraindicacoes: [
      'Doença hepática ativa ou elevação persistente de transaminases',
      'Gestação e lactação',
      'Uso com inibidores potentes do CYP3A4',
    ],
    efeitosAdversos: [
      'Mialgia, elevação de CK',
      'Miopatia / rabdomiólise (rara)',
      'Elevação de transaminases',
      'Discreto aumento da glicemia',
    ],
    advertencias: [
      'Orientar a relatar dor/fraqueza muscular',
      'Evitar suco de toranja (grapefruit)',
      'Tomar à noite (maior síntese de colesterol)',
    ],
    gestacaoLactacao: 'Contraindicada na gestação e na lactação.',
    interacoes: [
      'Fibratos/genfibrozila',
      'Anlodipino (limitar sinvastatina a 20 mg)',
      'Amiodarona (limitar sinvastatina a 20 mg/dia)',
      'Verapamil/diltiazem/dronedarona (limitar sinvastatina a 10 mg/dia)',
      'Macrolídeos e antifúngicos azólicos (risco de miopatia)',
    ],
    numeroRegistro: '100470472',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────────────────── Gastrointestinais ─────────────────────────────
  {
    id: 'omeprazol',
    nome: 'Omeprazol',
    principio: 'omeprazol',
    sinonimos: [
      'omeprazol',
      'losec',
      'peprazol',
      'IBP',
      'inibidor de bomba de prótons',
      'gastrite',
      'refluxo',
    ],
    classe: 'Gastrointestinais',
    nomesComerciais: ['Losec®', 'Peprazol®', 'Omeprazol genérico'],
    mecanismo:
      'Inibidor da bomba de prótons (H+/K+-ATPase) das células parietais gástricas, reduzindo de forma acentuada e prolongada a secreção ácida.',
    apresentacoes: ['Cápsula 10 mg, 20 mg e 40 mg'],
    usoClinico: [
      'Doença do refluxo (DRGE)',
      'Úlcera péptica',
      'Erradicação de H. pylori (com antibióticos)',
      'Profilaxia de úlcera por AINE',
      'Dispepsia',
    ],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['20 mg/dia (DRGE/úlcera), até 40 mg/dia', 'Tomar 30–60 min antes do café da manhã'],
      },
    ],
    ajusteDose: ['Sem ajuste renal de rotina', 'Hepatopatia grave: reduzir a dose'],
    contraindicacoes: ['Hipersensibilidade', 'Uso concomitante com nelfinavir'],
    efeitosAdversos: [
      'Cefaleia, diarreia ou constipação',
      'Uso prolongado: deficiência de B12/magnésio/cálcio (risco de fraturas)',
      'Maior risco de infecção por C. difficile',
    ],
    advertencias: [
      'Usar pelo menor tempo necessário; reavaliar uso crônico',
      'Pode mascarar sintomas de câncer gástrico',
    ],
    gestacaoLactacao: 'Considerado seguro na gestação; compatível com a lactação.',
    interacoes: [
      'Clopidogrel (reduz a ativação — preferir pantoprazol)',
      'Reduz a absorção de fármacos pH-dependentes (atazanavir, itraconazol)',
      'Varfarina, metotrexato',
    ],
    numeroRegistro: '125680337',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ───────────────────────────── Hormônios e tireoide ─────────────────────────────
  {
    id: 'levotiroxina',
    nome: 'Levotiroxina (sódica)',
    principio: 'levotiroxina sódica',
    sinonimos: [
      'levotiroxina',
      'puran t4',
      'synthroid',
      'euthyrox',
      'T4',
      'hipotireoidismo',
      'tireoide',
    ],
    classe: 'Hormônios e tireoide',
    nomesComerciais: ['Puran T4®', 'Synthroid®', 'Euthyrox®', 'Levotiroxina genérica'],
    mecanismo:
      'Hormônio tireoidiano sintético (T4), convertido perifericamente em T3. Repõe a função tireoidiana, regulando o metabolismo basal.',
    apresentacoes: ['Comprimido 25, 50, 75, 88, 100, 112, 125, 150, 175 e 200 mcg'],
    usoClinico: ['Hipotireoidismo', 'Supressão de TSH (nódulo/câncer de tireoide)'],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Reposição plena: ~1,6 mcg/kg/dia',
          'Idoso/cardiopata: iniciar 12,5–25 mcg e titular',
          'Tomar em jejum, 30–60 min antes do café da manhã',
        ],
      },
    ],
    ajusteDose: [
      'Idoso e coronariopata: iniciar baixo (risco de isquemia/arritmia) e titular pelo TSH',
    ],
    contraindicacoes: [
      'Tireotoxicose não tratada',
      'Infarto agudo do miocárdio',
      'Insuficiência adrenal não corrigida',
    ],
    efeitosAdversos: [
      'Por excesso de dose: taquicardia, tremor, perda de peso, insônia, intolerância ao calor',
      'A longo prazo em excesso: fibrilação atrial e osteoporose',
    ],
    advertencias: [
      'Tomar longe de cálcio, ferro, IBP, soja e café (reduzem a absorção)',
      'Reavaliar o TSH em 6–8 semanas após ajuste',
      'Na gestação a necessidade aumenta — ajustar a dose',
    ],
    gestacaoLactacao:
      'Essencial e segura; a necessidade tende a aumentar na gestação (ajustar pela TSH). Compatível com a lactação.',
    interacoes: [
      'Cálcio, ferro, IBP, sucralfato, colestiramina (reduzem a absorção)',
      'Aumenta a necessidade de varfarina',
      'Estrogênio aumenta a necessidade de levotiroxina',
    ],
    numeroRegistro: '100890359',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Cardiovascular (diuréticos) ──
  {
    id: 'furosemida',
    nome: 'Furosemida',
    principio: 'furosemida',
    sinonimos: ['furosemida', 'lasix', 'diurético de alça', 'edema', 'congestão'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Lasix®', 'Furosemida genérica'],
    mecanismo:
      'Diurético de alça: inibe o cotransportador Na-K-2Cl no ramo ascendente da alça de Henle, promovendo diurese potente e rápida.',
    apresentacoes: ['Comprimido 40 mg', 'Solução injetável 10 mg/mL (ampola 2 mL)'],
    usoClinico: [
      'Edema (IC, renal, hepático)',
      'Congestão pulmonar / edema agudo de pulmão',
      'Hipertensão na doença renal crônica',
      'Hipercalemia (adjuvante)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'VO: 20–80 mg/dia (titular)',
          'IV no EAP: 0,5–1 mg/kg, lenta; repetir conforme resposta',
        ],
      },
    ],
    ajusteDose: [
      'Mantém eficácia na DRC com doses maiores (diferente das tiazidas)',
      'Infusão IV lenta para evitar ototoxicidade',
    ],
    contraindicacoes: [
      'Anúria',
      'Depleção de volume/eletrólitos grave',
      'Hipersensibilidade a sulfonamidas',
    ],
    efeitosAdversos: [
      'Hipocalemia, hiponatremia, hipomagnesemia',
      'Desidratação e hipotensão',
      'Hiperuricemia (gota), hiperglicemia',
      'Ototoxicidade (IV rápida / dose alta)',
    ],
    advertencias: [
      'Monitorar eletrólitos, volemia e função renal',
      'IV lenta (risco de ototoxicidade)',
    ],
    gestacaoLactacao: 'Usar apenas se claramente necessário.',
    interacoes: [
      'Aminoglicosídeos (ototoxicidade)',
      'Lítio (aumenta toxicidade)',
      'Digoxina (hipocalemia potencializa toxicidade)',
      'AINE (reduz efeito)',
    ],
    numeroRegistro: '103700277',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'espironolactona',
    nome: 'Espironolactona',
    principio: 'espironolactona',
    sinonimos: [
      'espironolactona',
      'aldactone',
      'poupador de potássio',
      'antagonista da aldosterona',
      'diurético',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Aldactone®', 'Espironolactona genérica'],
    mecanismo:
      'Antagonista da aldosterona (diurético poupador de potássio); também tem efeito antiandrogênico. Reduz a retenção de sódio e a excreção de potássio.',
    apresentacoes: ['Comprimido 25 mg, 50 mg e 100 mg'],
    usoClinico: [
      'Insuficiência cardíaca (reduz mortalidade)',
      'Hipertensão resistente / hiperaldosteronismo',
      'Cirrose com ascite',
      'Acne/hirsutismo (efeito antiandrogênico)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['IC: 25–50 mg/dia', 'Ascite/hiperaldosteronismo: 100–400 mg/dia'],
      },
    ],
    ajusteDose: ['Cautela/evitar na DRC avançada (risco de hipercalemia)'],
    contraindicacoes: [
      'Hipercalemia',
      'Lesão renal aguda / anúria',
      'Doença de Addison',
      'Uso com outros poupadores de potássio',
    ],
    efeitosAdversos: [
      'Hipercalemia (principal)',
      'Ginecomastia e disfunção sexual',
      'Irregularidade menstrual',
      'Lesão renal aguda',
    ],
    advertencias: [
      'Monitorar potássio e função renal (sobretudo com IECA/BRA)',
      'Risco de hipercalemia grave',
    ],
    gestacaoLactacao: 'Evitar (efeito antiandrogênico).',
    interacoes: ['IECA/BRA, suplementos de potássio (hipercalemia)', 'AINE', 'Lítio'],
    numeroRegistro: '121100419',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Hipolipemiantes ──
  {
    id: 'atorvastatina',
    nome: 'Atorvastatina (cálcica)',
    principio: 'atorvastatina cálcica',
    sinonimos: ['atorvastatina', 'lipitor', 'citalor', 'estatina', 'colesterol'],
    classe: 'Hipolipemiantes',
    nomesComerciais: ['Lipitor®', 'Citalor®', 'Atorvastatina genérica'],
    mecanismo:
      'Estatina de alta potência: inibe a HMG-CoA redutase, reduzindo o LDL. Meia-vida longa — pode ser tomada a qualquer hora do dia.',
    apresentacoes: ['Comprimido 10 mg, 20 mg, 40 mg e 80 mg'],
    usoClinico: ['Dislipidemia', 'Prevenção cardiovascular (incl. alto risco)'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [{ titulo: 'Adulto', itens: ['10–80 mg/dia, em qualquer horário'] }],
    ajusteDose: ['Sem ajuste renal', 'Doença hepática ativa: contraindicada'],
    contraindicacoes: ['Doença hepática ativa', 'Gestação e lactação'],
    efeitosAdversos: [
      'Mialgia, elevação de CK',
      'Elevação de transaminases',
      'Miopatia/rabdomiólise (rara)',
      'Discreto aumento da glicemia',
    ],
    advertencias: [
      'Orientar a relatar dor muscular',
      'Cautela com inibidores do CYP3A4 e fibratos',
      'Pode ser tomada a qualquer hora (≠ sinvastatina)',
    ],
    gestacaoLactacao: 'Contraindicada na gestação e na lactação.',
    interacoes: [
      'Inibidores do CYP3A4 (claritromicina, azólicos)',
      'Fibratos/genfibrozila',
      'Ciclosporina',
    ],
    numeroRegistro: '188300088',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'rosuvastatina',
    nome: 'Rosuvastatina (cálcica)',
    principio: 'rosuvastatina cálcica',
    sinonimos: ['rosuvastatina', 'crestor', 'estatina', 'colesterol'],
    classe: 'Hipolipemiantes',
    nomesComerciais: ['Crestor®', 'Rosuvastatina genérica'],
    mecanismo:
      'Estatina de alta potência (a maior redução de LDL por mg). Inibe a HMG-CoA redutase. Pode ser tomada a qualquer hora.',
    apresentacoes: ['Comprimido 5 mg, 10 mg, 20 mg e 40 mg'],
    usoClinico: ['Dislipidemia', 'Prevenção cardiovascular de alto risco'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['5–40 mg/dia (iniciar 5–10 mg)', 'A dose de 40 mg só para alto risco sem resposta'],
      },
    ],
    ajusteDose: ['ClCr < 30: máximo 10 mg/dia', 'Ascendência asiática: iniciar 5 mg'],
    contraindicacoes: [
      'Doença hepática ativa',
      'Gestação e lactação',
      'ClCr < 30 (para a dose de 40 mg)',
    ],
    efeitosAdversos: [
      'Mialgia, elevação de CK',
      'Proteinúria/hematúria (dose de 40 mg)',
      'Elevação de transaminases',
      'Miopatia (rara)',
    ],
    advertencias: ['Relatar dor muscular', 'Separar de antiácidos (reduzem absorção)'],
    gestacaoLactacao: 'Contraindicada na gestação e na lactação.',
    interacoes: ['Ciclosporina (limitar rosuvastatina a 5 mg/dia)', 'Genfibrozila — evitar; se necessário, máx 10 mg/dia', 'Antiácidos (separar a administração)', 'Varfarina'],
    numeroRegistro: '155840624',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Gastrointestinais ──
  {
    id: 'pantoprazol',
    nome: 'Pantoprazol (sódico)',
    principio: 'pantoprazol sódico',
    sinonimos: [
      'pantoprazol',
      'pantozol',
      'IBP',
      'inibidor de bomba de prótons',
      'refluxo',
      'gastrite',
    ],
    classe: 'Gastrointestinais',
    nomesComerciais: ['Pantozol®', 'Pantoprazol genérico'],
    mecanismo:
      'Inibidor da bomba de prótons (H+/K+-ATPase), reduzindo a secreção ácida gástrica. Menos interações via CYP que o omeprazol.',
    apresentacoes: ['Comprimido 20 mg e 40 mg', 'Pó para solução injetável 40 mg'],
    usoClinico: [
      'DRGE',
      'Úlcera péptica',
      'Erradicação de H. pylori (com antibióticos)',
      'Profilaxia de úlcera de estresse (IV em internados)',
    ],
    receituario: 'Venda sob prescrição.',
    posologia: [
      { titulo: 'Adulto', itens: ['20–40 mg/dia, antes do café', 'IV em pacientes internados'] },
    ],
    ajusteDose: ['Sem ajuste renal de rotina', 'Hepatopatia grave: reduzir'],
    contraindicacoes: ['Hipersensibilidade'],
    efeitosAdversos: [
      'Cefaleia, diarreia',
      'Uso prolongado: deficiência de B12/magnésio, fraturas',
      'Maior risco de C. difficile',
    ],
    advertencias: [
      'Preferível ao omeprazol em uso com clopidogrel (menor interação)',
      'Usar pelo menor tempo necessário',
    ],
    gestacaoLactacao: 'Considerado seguro na gestação.',
    interacoes: [
      'Reduz absorção de fármacos pH-dependentes',
      'Menor interação com clopidogrel que o omeprazol',
    ],
    numeroRegistro: '154230345',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Corticoides ──
  {
    id: 'prednisona',
    nome: 'Prednisona',
    principio: 'prednisona',
    sinonimos: ['prednisona', 'meticorten', 'corticoide', 'glicocorticoide', 'corticosteroide'],
    classe: 'Corticoides',
    nomesComerciais: ['Meticorten®', 'Prednisona genérica'],
    mecanismo:
      'Glicocorticoide sistêmico (pró-fármaco convertido em prednisolona no fígado): potente anti-inflamatório e imunossupressor.',
    apresentacoes: ['Comprimido 5 mg e 20 mg'],
    usoClinico: [
      'Doenças inflamatórias e autoimunes',
      'Reações alérgicas',
      'Exacerbação de asma/DPOC',
      'Imunossupressão',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Dose variável (5–60 mg/dia) conforme a indicação',
          'Cursos curtos: suspensão direta; uso prolongado: desmame gradual',
        ],
      },
    ],
    ajusteDose: ['Hepatopatia grave: preferir prednisolona (já ativa)'],
    contraindicacoes: ['Infecção fúngica sistêmica não tratada', 'Hipersensibilidade'],
    efeitosAdversos: [
      'Hiperglicemia, hipertensão, retenção hídrica, ganho de peso',
      'Osteoporose, imunossupressão (infecções)',
      'Insônia, alterações de humor',
      'Síndrome de Cushing iatrogênica e supressão adrenal (uso crônico)',
    ],
    advertencias: [
      'NÃO suspender abruptamente após uso prolongado (insuficiência adrenal)',
      'Pode descompensar diabetes e hipertensão',
      'Profilaxia gástrica/óssea no uso crônico',
    ],
    gestacaoLactacao: 'Usar se necessário, na menor dose eficaz.',
    interacoes: [
      'AINE (risco de úlcera)',
      'Hipoglicemiantes (reduz efeito)',
      'Diuréticos (hipocalemia)',
      'Vacinas vivas; indutores enzimáticos',
    ],
    numeroRegistro: '125680160',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'prednisolona',
    nome: 'Prednisolona',
    principio: 'prednisolona',
    sinonimos: ['prednisolona', 'prelone', 'predsim', 'corticoide', 'glicocorticoide'],
    classe: 'Corticoides',
    nomesComerciais: ['Prelone®', 'Predsim®', 'Prednisolona genérica'],
    mecanismo:
      'Glicocorticoide sistêmico já na forma ativa (não depende de conversão hepática). Útil em hepatopatas e em pediatria (apresentação líquida).',
    apresentacoes: ['Solução oral 1 mg/mL e 3 mg/mL', 'Comprimido'],
    usoClinico: [
      'Mesmas indicações da prednisona',
      'Preferida em crianças (líquida) e na hepatopatia',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      { titulo: 'Pediátrico', itens: ['1–2 mg/kg/dia (máx. conforme indicação)'] },
      { titulo: 'Adulto', itens: ['Dose variável conforme a indicação'] },
    ],
    ajusteDose: ['Já é a forma ativa — vantagem na insuficiência hepática'],
    contraindicacoes: ['Infecção fúngica sistêmica não tratada', 'Hipersensibilidade'],
    efeitosAdversos: [
      'Iguais aos dos glicocorticoides (ver Prednisona): hiperglicemia, HAS, imunossupressão, osteoporose, supressão adrenal',
    ],
    advertencias: [
      'NÃO suspender abruptamente após uso prolongado',
      'Descompensa diabetes/HAS; cautela em infecções',
    ],
    gestacaoLactacao: 'Usar se necessário, na menor dose eficaz.',
    interacoes: ['AINE, hipoglicemiantes, diuréticos, vacinas vivas, indutores enzimáticos'],
    numeroRegistro: '125680129',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antialérgicos ──
  {
    id: 'loratadina',
    nome: 'Loratadina',
    principio: 'loratadina',
    sinonimos: [
      'loratadina',
      'claritin',
      'histadin',
      'anti-histamínico',
      'antialérgico',
      'rinite',
      'urticária',
    ],
    classe: 'Antialérgicos',
    nomesComerciais: ['Claritin®', 'Histadin®', 'Loratadina genérica'],
    mecanismo:
      'Anti-histamínico H1 de 2ª geração (não sedativo): bloqueia perifericamente os receptores H1, com pouca passagem pela barreira hematoencefálica.',
    apresentacoes: ['Comprimido 10 mg', 'Xarope 1 mg/mL'],
    usoClinico: ['Rinite alérgica', 'Urticária'],
    receituario: 'Venda sem prescrição.',
    posologia: [
      { titulo: 'Adulto e > 30 kg', itens: ['10 mg/dia'] },
      { titulo: 'Criança 2–12 anos (< 30 kg)', itens: ['5 mg/dia'] },
    ],
    ajusteDose: ['Insuficiência hepática ou renal grave: administrar em dias alternados'],
    contraindicacoes: ['Hipersensibilidade'],
    efeitosAdversos: ['Cefaleia, sonolência (incomum), boca seca'],
    advertencias: [
      'Bem menos sedativa que os anti-histamínicos de 1ª geração',
      'Doses muito altas podem prolongar o QT',
    ],
    gestacaoLactacao: 'Pode ser usada (anti-histamínicos de 2ª geração são preferidos).',
    interacoes: ['Inibidores do CYP3A4/2D6 (cetoconazol, eritromicina) elevam os níveis'],
    numeroRegistro: '102351328',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Psiquiátricos e sistema nervoso ──
  {
    id: 'sertralina',
    nome: 'Sertralina (cloridrato)',
    principio: 'cloridrato de sertralina',
    sinonimos: [
      'sertralina',
      'zoloft',
      'tolrest',
      'ISRS',
      'antidepressivo',
      'depressão',
      'ansiedade',
    ],
    classe: 'Psiquiátricos e sistema nervoso',
    nomesComerciais: ['Zoloft®', 'Tolrest®', 'Sertralina genérica'],
    mecanismo:
      'Inibidor seletivo da recaptação de serotonina (ISRS): aumenta a serotonina na fenda sináptica.',
    apresentacoes: ['Comprimido 25 mg, 50 mg e 100 mg'],
    usoClinico: [
      'Depressão',
      'Transtorno de ansiedade generalizada, pânico, TOC, TEPT',
      'TPM/TDPM',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha; não é da Portaria 344/98).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Iniciar 50 mg/dia (25 mg no transtorno de pânico)',
          'Titular até 200 mg/dia conforme resposta',
        ],
      },
    ],
    ajusteDose: ['Insuficiência hepática: reduzir a dose', 'Sem ajuste renal'],
    contraindicacoes: ['Uso com IMAO (risco de síndrome serotoninérgica)', 'Uso com pimozida'],
    efeitosAdversos: [
      'Náusea, diarreia',
      'Insônia ou sonolência, cefaleia',
      'Disfunção sexual',
      'Hiponatremia (idoso); risco de ideação suicida no início (jovens)',
    ],
    advertencias: [
      'Efeito pleno em 2–4 semanas',
      'NÃO suspender abruptamente (síndrome de descontinuação)',
      'Monitorar ideação suicida em < 25 anos no início',
    ],
    gestacaoLactacao: 'Avaliar risco/benefício; relativamente seguro — cautela no 3º trimestre.',
    interacoes: [
      'IMAO e outros serotoninérgicos (tramadol, triptanos, linezolida)',
      'AINE/anticoagulantes (risco de sangramento)',
      'Varfarina',
    ],
    numeroRegistro: '105250062',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'fluoxetina',
    nome: 'Fluoxetina (cloridrato)',
    principio: 'cloridrato de fluoxetina',
    sinonimos: ['fluoxetina', 'prozac', 'daforin', 'ISRS', 'antidepressivo', 'depressão'],
    classe: 'Psiquiátricos e sistema nervoso',
    nomesComerciais: ['Prozac®', 'Daforin®', 'Fluoxetina genérica'],
    mecanismo:
      'Inibidor seletivo da recaptação de serotonina (ISRS) com meia-vida longa (metabólito ativo norfluoxetina).',
    apresentacoes: ['Cápsula 20 mg', 'Solução oral 20 mg/mL'],
    usoClinico: ['Depressão', 'TOC', 'Bulimia nervosa', 'Transtorno de pânico, TDPM'],
    receituario: 'Venda sob prescrição (tarja vermelha; não é da Portaria 344/98).',
    posologia: [
      { titulo: 'Adulto', itens: ['20 mg/dia pela manhã', 'Até 80 mg/dia conforme resposta'] },
    ],
    ajusteDose: ['Insuficiência hepática: reduzir a dose ou usar em dias alternados'],
    contraindicacoes: [
      'Uso com IMAO (respeitar washout longo pela meia-vida)',
      'Uso com pimozida/tioridazina',
    ],
    efeitosAdversos: [
      'Insônia, ativação/ansiedade inicial',
      'Náusea, anorexia',
      'Disfunção sexual',
      'Hiponatremia',
    ],
    advertencias: [
      'Meia-vida longa → washout de ~5 semanas antes de iniciar IMAO',
      'Ativação inicial; monitorar ideação suicida em jovens',
    ],
    gestacaoLactacao: 'Avaliar risco/benefício; usar com cautela.',
    interacoes: [
      'IMAO e outros serotoninérgicos',
      'Inibe o CYP2D6 (eleva tricíclicos, betabloqueadores; reduz tamoxifeno)',
      'Anticoagulantes/AINE (sangramento)',
    ],
    numeroRegistro: '125680283',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antibióticos ──
  {
    id: 'azitromicina',
    nome: 'Azitromicina',
    principio: 'azitromicina di-hidratada',
    sinonimos: ['azitromicina', 'zitromax', 'macrolídeo', 'antibiótico'],
    classe: 'Antibióticos',
    nomesComerciais: ['Zitromax®', 'Azitromicina genérica'],
    mecanismo:
      'Antibiótico macrolídeo: inibe a síntese proteica bacteriana (subunidade 50S). Tem meia-vida tecidual longa, permitindo tratamentos curtos.',
    apresentacoes: ['Comprimido 500 mg', 'Suspensão oral 200 mg/5 mL'],
    usoClinico: [
      'Infecções respiratórias',
      'IST (clamídia)',
      'Infecções de pele',
      'Germes atípicos',
    ],
    receituario:
      'Antibiótico — receituário de controle especial (RDC 471/2021): receita simples retida em 2 vias.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '500 mg/dia por 3 dias, ou 500 mg no 1º dia + 250 mg do 2º ao 5º dia',
          'Clamídia: 1 g em dose única',
        ],
      },
    ],
    ajusteDose: ['Cautela na hepatopatia', 'Sem ajuste renal de rotina'],
    contraindicacoes: [
      'Hipersensibilidade a macrolídeos',
      'Disfunção hepática/colestase prévia com macrolídeo',
    ],
    efeitosAdversos: [
      'Sintomas GI (diarreia, náusea)',
      'Prolongamento do intervalo QT',
      'Hepatotoxicidade (rara)',
    ],
    advertencias: [
      'Cautela em QT longo e uso de outros fármacos que prolongam o QT',
      'Pode agravar miastenia',
    ],
    gestacaoLactacao: 'Pode ser usada quando indicada.',
    interacoes: [
      'Outros fármacos que prolongam o QT',
      'Antiácidos (separar a administração)',
      'Varfarina',
    ],
    numeroRegistro: '154230167',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'cefalexina',
    nome: 'Cefalexina',
    principio: 'cefalexina monoidratada',
    sinonimos: ['cefalexina', 'keflex', 'cefalosporina', 'antibiótico', 'betalactâmico'],
    classe: 'Antibióticos',
    nomesComerciais: ['Keflex®', 'Cefalexina genérica'],
    mecanismo:
      'Cefalosporina de 1ª geração (betalactâmico): inibe a síntese da parede celular bacteriana (ação bactericida).',
    apresentacoes: ['Cápsula/comprimido 500 mg', 'Suspensão oral 250 mg/5 mL'],
    usoClinico: [
      'Infecções de pele e partes moles',
      'Infecção urinária',
      'Faringoamigdalite estreptocócica',
    ],
    receituario:
      'Antibiótico — receituário de controle especial (RDC 471/2021): receita simples retida em 2 vias.',
    posologia: [
      { titulo: 'Adulto', itens: ['500 mg de 6/6 h (faixa 1–4 g/dia)'] },
      { titulo: 'Pediátrico', itens: ['25–50 mg/kg/dia divididos de 6/6 h'] },
    ],
    ajusteDose: ['ClCr < 30: ajustar o intervalo das doses'],
    contraindicacoes: [
      'Alergia a cefalosporinas',
      'Cautela em alergia grave (anafilaxia) a penicilina (reação cruzada)',
    ],
    efeitosAdversos: ['Sintomas GI, rash, candidíase', 'Colite por C. difficile (rara)'],
    advertencias: [
      'Confirmar histórico de alergia a betalactâmicos',
      'Completar o curso prescrito',
    ],
    gestacaoLactacao: 'Compatível com gestação e lactação.',
    interacoes: ['Probenecida (eleva os níveis séricos)', 'Metformina'],
    numeroRegistro: '155620052',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },

  // ── Cardiovascular (IECA / betabloqueadores) ──
  {
    id: 'captopril',
    nome: 'Captopril',
    principio: 'captopril',
    sinonimos: ['captopril', 'capoten', 'IECA', 'anti-hipertensivo', 'urgência hipertensiva'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Capoten®', 'Captopril genérico'],
    mecanismo:
      'Inibidor da enzima conversora da angiotensina (IECA) de ação curta. Reduz a formação de angiotensina II e a degradação de bradicinina. Possui grupo tiol (sulfidrila).',
    apresentacoes: ['Comprimido 12,5 mg, 25 mg e 50 mg'],
    usoClinico: [
      'Hipertensão arterial',
      'Insuficiência cardíaca',
      'Pós-IAM',
      'Nefropatia diabética',
      'Urgência hipertensiva (VO)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '25 mg 2–3×/dia, até 150 mg/dia',
          'Urgência hipertensiva: 25 mg VO (a via sublingual não é recomendada — absorção errática e queda pressórica imprevisível)',
          'Tomar ~1 h antes das refeições (alimento reduz a absorção)',
        ],
      },
    ],
    ajusteDose: [
      'ClCr reduzido: diminuir a dose',
      'Cautela em estenose bilateral de artéria renal',
    ],
    contraindicacoes: [
      'Angioedema prévio relacionado a IECA',
      'Gestação',
      'Uso com alisquireno em diabéticos',
      'Estenose bilateral de artéria renal',
    ],
    efeitosAdversos: [
      'Tosse seca',
      'Hipercalemia, elevação de creatinina',
      'Hipotensão (1ª dose)',
      'Disgeusia (gosto metálico)',
      'Angioedema (raro, grave)',
    ],
    advertencias: ['Tomar com o estômago vazio', 'Monitorar potássio e função renal'],
    gestacaoLactacao: 'Contraindicado na gestação.',
    interacoes: [
      'AINE',
      'Diuréticos poupadores de potássio / suplementos de K',
      'BRA/alisquireno',
      'Lítio',
    ],
    numeroRegistro: '105830827',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'carvedilol',
    nome: 'Carvedilol',
    principio: 'carvedilol',
    sinonimos: ['carvedilol', 'coreg', 'divelol', 'betabloqueador', 'insuficiência cardíaca'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Coreg®', 'Divelol®', 'Carvedilol genérico'],
    mecanismo:
      'Betabloqueador não seletivo com bloqueio alfa-1 associado (vasodilatação). Reduz a mortalidade na insuficiência cardíaca.',
    apresentacoes: ['Comprimido 3,125 mg, 6,25 mg, 12,5 mg e 25 mg'],
    usoClinico: ['Insuficiência cardíaca (reduz mortalidade)', 'Hipertensão arterial', 'Pós-IAM'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto (IC)',
        itens: [
          'Iniciar 3,125 mg 12/12 h',
          'Dobrar a cada ~2 semanas até a dose-alvo (25 mg 12/12 h; 50 mg 12/12 h se > 85 kg)',
          'Tomar com alimento (reduz hipotensão)',
        ],
      },
    ],
    ajusteDose: ['Insuficiência hepática: contraindicado', 'Iniciar baixo e titular lentamente'],
    contraindicacoes: [
      'IC descompensada (classe IV)',
      'Asma / broncoespasmo',
      'BAV de 2º/3º grau, bradicardia',
      'Insuficiência hepática grave',
    ],
    efeitosAdversos: [
      'Tontura, hipotensão',
      'Bradicardia, fadiga',
      'Broncoespasmo',
      'Hiperglicemia / mascara hipoglicemia',
    ],
    advertencias: ['NÃO suspender abruptamente', 'Cautela em diabetes e DPOC/asma'],
    gestacaoLactacao: 'Evitar; usar só se benefício superar o risco.',
    interacoes: [
      'Verapamil/diltiazem (bradicardia/BAV)',
      'Antiarrítmicos',
      'Hipoglicemiantes',
      'Fluoxetina (inibe CYP2D6, eleva níveis)',
    ],
    numeroRegistro: '105730594',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'propranolol',
    nome: 'Propranolol (cloridrato)',
    principio: 'cloridrato de propranolol',
    sinonimos: [
      'propranolol',
      'inderal',
      'betabloqueador',
      'enxaqueca',
      'tremor',
      'hipertireoidismo',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Inderal®', 'Propranolol genérico'],
    mecanismo:
      'Betabloqueador não seletivo (β1 e β2). Reduz frequência e contratilidade cardíacas; bloqueia também receptores β2 (broncoconstrição).',
    apresentacoes: ['Comprimido 10 mg, 40 mg e 80 mg'],
    usoClinico: [
      'Hipertensão e arritmias',
      'Profilaxia de enxaqueca',
      'Tremor essencial',
      'Sintomas de hipertireoidismo',
      'Ansiedade de desempenho',
      'Profilaxia de sangramento por varizes esofágicas',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Dose conforme indicação (ex.: enxaqueca 40–160 mg/dia divididos)',
          'Titular pela FC/PA e resposta',
        ],
      },
    ],
    ajusteDose: ['Insuficiência hepática: reduzir (metabolismo hepático extenso)'],
    contraindicacoes: [
      'Asma (bloqueio β2)',
      'Bradicardia / BAV de 2º-3º grau',
      'IC descompensada',
      'Choque cardiogênico',
    ],
    efeitosAdversos: [
      'Bradicardia, fadiga, extremidades frias',
      'Broncoespasmo',
      'Mascara hipoglicemia',
      'Pesadelos / distúrbio do sono',
    ],
    advertencias: ['NÃO suspender abruptamente', 'CONTRAINDICADO na asma (β2)'],
    gestacaoLactacao: 'Usar apenas se necessário.',
    interacoes: [
      'Verapamil/diltiazem',
      'Hipoglicemiantes',
      'AINE',
      'Fármacos de metabolismo hepático',
    ],
    numeroRegistro: '105350200',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antidiabéticos (sulfonilureias) ──
  {
    id: 'glibenclamida',
    nome: 'Glibenclamida',
    principio: 'glibenclamida',
    sinonimos: ['glibenclamida', 'daonil', 'sulfonilureia', 'diabetes', 'hipoglicemiante oral'],
    classe: 'Antidiabéticos',
    nomesComerciais: ['Daonil®', 'Glibenclamida genérica'],
    mecanismo:
      'Sulfonilureia: estimula a secreção de insulina pelas células beta do pâncreas. Pode causar hipoglicemia (inclusive prolongada).',
    apresentacoes: ['Comprimido 5 mg'],
    usoClinico: ['Diabetes mellitus tipo 2 (quando a metformina é insuficiente)'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['Iniciar 5 mg/dia com o café da manhã', 'Até 20 mg/dia (dividido)'],
      },
    ],
    ajusteDose: [
      'Evitar em idosos e na doença renal (hipoglicemia prolongada)',
      'Cautela na hepatopatia',
    ],
    contraindicacoes: [
      'DM tipo 1, cetoacidose',
      'Gestação',
      'Alergia a sulfonamidas',
      'Insuficiência renal ou hepática graves',
    ],
    efeitosAdversos: ['Hipoglicemia (principal — pode ser grave/prolongada)', 'Ganho de peso'],
    advertencias: [
      'Alto risco de hipoglicemia grave em idoso/DRC — preferir outras opções',
      'Tomar junto à refeição',
    ],
    gestacaoLactacao: 'Evitar (preferir insulina).',
    interacoes: [
      'Betabloqueadores (mascaram hipoglicemia)',
      'Álcool',
      'AINE, fluconazol (aumentam o risco de hipoglicemia)',
    ],
    numeroRegistro: '118190390',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'gliclazida',
    nome: 'Gliclazida',
    principio: 'gliclazida',
    sinonimos: ['gliclazida', 'diamicron', 'sulfonilureia', 'diabetes'],
    classe: 'Antidiabéticos',
    nomesComerciais: ['Diamicron® MR', 'Gliclazida genérica'],
    mecanismo:
      'Sulfonilureia que estimula a secreção de insulina, com MENOR risco de hipoglicemia que a glibenclamida. A forma MR tem liberação modificada (dose única diária).',
    apresentacoes: ['Comprimido 30 mg e 60 mg (liberação modificada — MR)', 'Comprimido 80 mg'],
    usoClinico: ['Diabetes mellitus tipo 2'],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [{ titulo: 'Adulto', itens: ['MR: 30–120 mg/dia no café da manhã'] }],
    ajusteDose: ['Menor risco de hipoglicemia que a glibenclamida', 'Cautela na doença renal'],
    contraindicacoes: [
      'DM tipo 1, cetoacidose',
      'Gestação',
      'Alergia a sulfonamidas',
      'Insuficiência renal ou hepática graves',
    ],
    efeitosAdversos: ['Hipoglicemia (menor que glibenclamida)', 'Ganho de peso'],
    advertencias: [
      'Tomar no café da manhã',
      'Preferível à glibenclamida pelo menor risco de hipoglicemia',
    ],
    gestacaoLactacao: 'Evitar (preferir insulina).',
    interacoes: ['Betabloqueadores, álcool, AINE, antifúngicos azólicos (risco de hipoglicemia)'],
    numeroRegistro: '141070117',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Anti-inflamatórios (AINE) ──
  {
    id: 'diclofenaco',
    nome: 'Diclofenaco',
    principio: 'diclofenaco sódico/potássico',
    sinonimos: ['diclofenaco', 'voltaren', 'cataflam', 'AINE', 'anti-inflamatório'],
    classe: 'Anti-inflamatórios (AINE)',
    nomesComerciais: ['Voltaren®', 'Cataflam®', 'Diclofenaco genérico'],
    mecanismo:
      'Anti-inflamatório não esteroidal (AINE) potente — inibe a COX, reduzindo prostaglandinas. O sal potássico tem início mais rápido.',
    apresentacoes: [
      'Comprimido 50 mg (sódico/potássico)',
      'Solução injetável 75 mg/3 mL',
      'Gel tópico',
      'Supositório',
    ],
    usoClinico: ['Dor e inflamação musculoesquelética', 'Cólica', 'Dor pós-operatória'],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['50 mg VO de 8/8 a 12/12 h', 'IM 75 mg (curto prazo, dose única ou 2×/dia)'],
      },
    ],
    ajusteDose: ['Evitar na insuficiência renal', 'Menor dose pelo menor tempo'],
    contraindicacoes: [
      'Alergia a AINE/AAS',
      'Úlcera/sangramento gastrointestinal',
      'IC grave, doença renal',
      '3º trimestre da gestação',
      'Pós-revascularização miocárdica (ponte)',
    ],
    efeitosAdversos: [
      'GI (úlcera/sangramento)',
      'Renais (LRA, retenção)',
      'Aumento da PA e do risco cardiovascular (alto entre os AINE)',
      'Hepatotoxicidade',
    ],
    advertencias: [
      'Maior risco cardiovascular entre os AINE — cautela em cardiopatas',
      'Associar protetor gástrico em risco GI',
    ],
    gestacaoLactacao: 'Evitar no 3º trimestre.',
    interacoes: [
      'Anticoagulantes/antiagregantes (sangramento)',
      'IECA/BRA + diurético (tríade nefrotóxica)',
      'Lítio, metotrexato',
    ],
    numeroRegistro: '104971250',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'nimesulida',
    nome: 'Nimesulida',
    principio: 'nimesulida',
    sinonimos: ['nimesulida', 'nisulid', 'AINE', 'anti-inflamatório'],
    classe: 'Anti-inflamatórios (AINE)',
    nomesComerciais: ['Nisulid®', 'Nimesulida genérica'],
    mecanismo: 'Anti-inflamatório não esteroidal com inibição preferencial da COX-2.',
    apresentacoes: ['Comprimido 100 mg', 'Gotas 50 mg/mL', 'Suspensão / granulado'],
    usoClinico: ['Dor e inflamação (uso de curto prazo)'],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['100 mg de 12/12 h', 'Tratamento o mais curto possível (máx. ~15 dias)'],
      },
    ],
    ajusteDose: ['Contraindicada na insuficiência hepática'],
    contraindicacoes: [
      'Doença hepática (risco de hepatotoxicidade)',
      'Alergia a AINE',
      'Úlcera/sangramento GI',
      'Menores de 12 anos',
      '3º trimestre da gestação',
      'Insuficiência renal grave',
    ],
    efeitosAdversos: [
      'Hepatotoxicidade (alerta principal — restrita em vários países)',
      'GI, renais',
    ],
    advertencias: [
      'NÃO usar em menores de 12 anos',
      'Suspender ao sinal de lesão hepática; uso curto',
    ],
    gestacaoLactacao: 'Evitar.',
    interacoes: ['Anticoagulantes, outros AINE, IECA/BRA + diurético, lítio, metotrexato'],
    numeroRegistro: '135690699',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Corticoides ──
  {
    id: 'dexametasona',
    nome: 'Dexametasona',
    principio: 'dexametasona',
    sinonimos: ['dexametasona', 'decadron', 'corticoide', 'glicocorticoide', 'antiemético'],
    classe: 'Corticoides',
    nomesComerciais: ['Decadron®', 'Dexametasona genérica'],
    mecanismo:
      'Glicocorticoide sintético de alta potência e longa duração (≈25–30× o cortisol), praticamente sem efeito mineralocorticoide.',
    apresentacoes: [
      'Comprimido 0,5 mg, 0,75 mg e 4 mg',
      'Elixir',
      'Solução injetável 2 mg/mL e 4 mg/mL',
    ],
    usoClinico: [
      'Anti-inflamatório/imunossupressor potente',
      'Edema cerebral',
      'Antiemético (quimioterapia)',
      'Crupe',
      'COVID-19 grave (com O₂)',
      'Maturação pulmonar fetal',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Dose muito variável (0,5–16 mg/dia) conforme a indicação',
          'Equivalência: ~0,75 mg ≈ 5 mg de prednisona',
        ],
      },
    ],
    ajusteDose: ['Mesmas considerações dos glicocorticoides'],
    contraindicacoes: ['Infecção fúngica sistêmica não tratada', 'Hipersensibilidade'],
    efeitosAdversos: [
      'Hiperglicemia, hipertensão',
      'Imunossupressão (infecções)',
      'Osteoporose, miopatia',
      'Insônia, alterações de humor; supressão adrenal (uso prolongado)',
    ],
    advertencias: [
      'Alta potência e longa duração',
      'NÃO suspender abruptamente após uso prolongado',
    ],
    gestacaoLactacao:
      'Usada para maturação pulmonar fetal; demais usos conforme indicação, na menor dose.',
    interacoes: [
      'AINE (úlcera)',
      'Hipoglicemiantes (reduz efeito)',
      'Indutores enzimáticos',
      'Vacinas vivas',
    ],
    numeroRegistro: '103920236',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Gastrointestinais (antieméticos / procinéticos) ──
  {
    id: 'metoclopramida',
    nome: 'Metoclopramida (cloridrato)',
    principio: 'cloridrato de metoclopramida',
    sinonimos: ['metoclopramida', 'plasil', 'antiemético', 'procinético', 'náusea', 'vômito'],
    classe: 'Gastrointestinais',
    nomesComerciais: ['Plasil®', 'Metoclopramida genérica'],
    mecanismo:
      'Antagonista dopaminérgico D2 (central e periférico): efeito antiemético e procinético (acelera o esvaziamento gástrico).',
    apresentacoes: ['Comprimido 10 mg', 'Gotas 4 mg/mL', 'Solução injetável 5 mg/mL'],
    usoClinico: ['Náuseas e vômitos', 'Gastroparesia', 'Refluxo'],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['10 mg até 3×/dia, antes das refeições', 'IV/IM conforme necessidade'],
      },
    ],
    ajusteDose: ['Reduzir na insuficiência renal', 'Idoso: menor dose e tempo'],
    contraindicacoes: [
      'Obstrução/perfuração/hemorragia gastrointestinal',
      'Feocromocitoma',
      'Epilepsia',
      'Doença de Parkinson',
      'Uso com outros fármacos que causam sintomas extrapiramidais',
    ],
    efeitosAdversos: [
      'Sintomas extrapiramidais (distonia aguda — especialmente em jovens/altas doses)',
      'Sonolência, inquietação',
      'Discinesia tardia (uso prolongado)',
      'Hiperprolactinemia',
      'Prolongamento do QT (sobretudo EV/altas doses)',
    ],
    advertencias: ['Limitar o uso a ≤ 5 dias (risco neurológico)', 'Tratar a distonia aguda com biperideno (anticolinérgico)', 'Cuidado em jovens e idosos'],
    gestacaoLactacao: 'Pode ser usada quando indicada.',
    interacoes: [
      'Neurolépticos (somam sintomas extrapiramidais)',
      'Levodopa (antagonismo)',
      'Depressores do SNC',
    ],
    numeroRegistro: '105710165',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'bromoprida',
    nome: 'Bromoprida',
    principio: 'bromoprida',
    sinonimos: ['bromoprida', 'digesan', 'antiemético', 'procinético', 'náusea', 'vômito'],
    classe: 'Gastrointestinais',
    nomesComerciais: ['Digesan®', 'Bromoprida genérica'],
    mecanismo:
      'Antagonista dopaminérgico D2 (semelhante à metoclopramida): antiemético e procinético.',
    apresentacoes: ['Cápsula 10 mg', 'Gotas 4 mg/mL', 'Solução injetável'],
    usoClinico: ['Náuseas e vômitos', 'Dispepsia, refluxo'],
    receituario: 'Venda sob prescrição.',
    posologia: [{ titulo: 'Adulto', itens: ['10 mg até 3×/dia, antes das refeições'] }],
    ajusteDose: ['Cautela em idosos e na insuficiência renal'],
    contraindicacoes: [
      'Obstrução/perfuração/hemorragia gastrointestinal',
      'Feocromocitoma',
      'Epilepsia',
    ],
    efeitosAdversos: ['Sintomas extrapiramidais', 'Sonolência', 'Hiperprolactinemia'],
    advertencias: ['Risco extrapiramidal semelhante ao da metoclopramida — uso por curto período'],
    gestacaoLactacao: 'Usar se necessário.',
    interacoes: ['Neurolépticos, levodopa, depressores do SNC'],
    numeroRegistro: '104970095',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antialérgicos ──
  {
    id: 'desloratadina',
    nome: 'Desloratadina',
    principio: 'desloratadina',
    sinonimos: [
      'desloratadina',
      'desalex',
      'anti-histamínico',
      'antialérgico',
      'rinite',
      'urticária',
    ],
    classe: 'Antialérgicos',
    nomesComerciais: ['Desalex®', 'Desloratadina genérica'],
    mecanismo: 'Anti-histamínico H1 de 2ª geração (metabólito ativo da loratadina), não sedativo.',
    apresentacoes: ['Comprimido 5 mg', 'Xarope 0,5 mg/mL'],
    usoClinico: ['Rinite alérgica', 'Urticária'],
    receituario: 'Venda sob prescrição.',
    posologia: [
      { titulo: 'Adulto', itens: ['5 mg/dia'] },
      { titulo: 'Pediátrico', itens: ['Por idade/peso (xarope a partir de 6 meses)'] },
    ],
    ajusteDose: ['Cautela na insuficiência hepática ou renal grave'],
    contraindicacoes: ['Hipersensibilidade'],
    efeitosAdversos: ['Cefaleia, boca seca, fadiga (incomuns)'],
    advertencias: ['Não sedativo; bem tolerado'],
    gestacaoLactacao: 'Anti-histamínicos de 2ª geração são preferidos; usar se necessário.',
    interacoes: ['Poucas interações clinicamente relevantes'],
    numeroRegistro: '105730465',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Respiratórios ──
  {
    id: 'salbutamol',
    nome: 'Salbutamol (sulfato)',
    principio: 'sulfato de salbutamol',
    sinonimos: [
      'salbutamol',
      'albuterol',
      'aerolin',
      'broncodilatador',
      'asma',
      'bombinha',
      'SABA',
    ],
    classe: 'Respiratórios',
    nomesComerciais: ['Aerolin®', 'Salbutamol genérico'],
    mecanismo:
      'Agonista β2-adrenérgico de curta ação (SABA): relaxa a musculatura lisa brônquica, com broncodilatação rápida. Medicação de RESGATE.',
    apresentacoes: [
      'Aerossol 100 mcg/dose',
      'Solução para nebulização 5 mg/mL',
      'Comprimido/xarope',
      'Solução injetável',
    ],
    usoClinico: [
      'Crise/broncoespasmo (asma, DPOC)',
      'Alívio rápido de sintomas',
      'Broncoespasmo induzido por exercício',
    ],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Crise (inalatório)',
        itens: [
          '100–200 mcg (1–2 jatos) com espaçador, repetir conforme necessidade',
          'Nebulização: 2,5–5 mg',
        ],
      },
      { titulo: 'Uso', itens: ['Medicação de resgate (SOS), não de uso fixo isolado'] },
    ],
    ajusteDose: ['Cautela em cardiopatia, arritmias e hipertireoidismo'],
    contraindicacoes: ['Hipersensibilidade', 'Cautela relativa em taquiarritmias'],
    efeitosAdversos: [
      'Tremor, taquicardia/palpitação',
      'Cefaleia, nervosismo',
      'Hipocalemia (doses altas)',
    ],
    advertencias: [
      'Necessidade frequente indica mau controle da asma → intensificar o tratamento controlador',
      'Doses altas: taquicardia e hipocalemia',
    ],
    gestacaoLactacao: 'Pode ser usado (o controle da asma é prioritário na gestação).',
    interacoes: [
      'Betabloqueadores (antagonismo — evitar os não seletivos)',
      'Diuréticos/corticoides (somam hipocalemia)',
    ],
    numeroRegistro: '105710026',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Cardiovascular (antiagregante / anticoagulante) ──
  {
    id: 'clopidogrel',
    nome: 'Clopidogrel (bissulfato)',
    principio: 'bissulfato de clopidogrel',
    sinonimos: ['clopidogrel', 'plavix', 'iscover', 'antiagregante', 'antiplaquetário'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Plavix®', 'Iscover®', 'Clopidogrel genérico'],
    mecanismo:
      'Antiagregante plaquetário: pró-fármaco que, ativado no fígado, inibe irreversivelmente o receptor P2Y12 de ADP, bloqueando a agregação plaquetária.',
    apresentacoes: ['Comprimido 75 mg'],
    usoClinico: [
      'Síndrome coronariana aguda (com AAS)',
      'Pós-stent coronariano (dupla antiagregação)',
      'Doença arterial periférica / AVC isquêmico',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [{ titulo: 'Adulto', itens: ['75 mg/dia', 'Ataque na SCA: 300–600 mg'] }],
    ajusteDose: ['Sem ajuste renal de rotina'],
    contraindicacoes: [
      'Sangramento ativo (úlcera, hemorragia intracraniana)',
      'Hipersensibilidade',
    ],
    efeitosAdversos: ['Sangramento (principal)', 'Equimoses, dispepsia', 'Raramente PTT'],
    advertencias: [
      'Suspender ~5 dias antes de cirurgia eletiva',
      'Eficácia reduzida em metabolizadores lentos do CYP2C19',
    ],
    gestacaoLactacao: 'Usar apenas se claramente necessário.',
    interacoes: [
      'Omeprazol/esomeprazol (reduzem a ativação — preferir pantoprazol)',
      'Anticoagulantes e AINE (sangramento)',
    ],
    numeroRegistro: '100681134',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'varfarina',
    nome: 'Varfarina (sódica)',
    principio: 'varfarina sódica',
    sinonimos: ['varfarina', 'warfarin', 'marevan', 'coumadin', 'anticoagulante', 'INR'],
    classe: 'Cardiovascular e anti-hipertensivos',
    nomesComerciais: ['Marevan®', 'Coumadin®', 'Varfarina genérica'],
    mecanismo:
      'Anticoagulante oral antagonista da vitamina K: inibe a síntese dos fatores de coagulação dependentes de vitamina K (II, VII, IX, X). Início e ajuste lentos, monitorados pelo INR.',
    apresentacoes: ['Comprimido 1 mg, 2,5 mg e 5 mg'],
    usoClinico: [
      'Fibrilação atrial (prevenção de AVC)',
      'Tromboembolismo venoso (TVP/TEP)',
      'Próteses valvares mecânicas',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Dose individualizada pelo INR (alvo geralmente 2,0–3,0)',
          'Iniciar ~5 mg/dia e ajustar conforme INR',
        ],
      },
    ],
    ajusteDose: ['Idoso/hepatopata/desnutrido: doses menores', 'Ajuste guiado SEMPRE pelo INR'],
    contraindicacoes: [
      'Sangramento ativo',
      'Gestação (teratogênica)',
      'Risco alto de queda/aderência ruim',
      'Hipersensibilidade',
    ],
    efeitosAdversos: [
      'Sangramento (principal)',
      'Necrose cutânea (início, raro)',
      'Teratogenicidade',
    ],
    advertencias: [
      'Estreita janela terapêutica — monitorar INR; muitas interações alimentares (vitamina K) e medicamentosas',
      'Antídoto: vitamina K (± complexo protrombínico/plasma)',
    ],
    gestacaoLactacao: 'Contraindicada na gestação (usar heparina); compatível com a lactação.',
    interacoes: [
      'Inúmeras: antibióticos, antifúngicos azólicos, amiodarona, AINE/AAS, álcool',
      'Alimentos ricos em vitamina K (manter consumo estável)',
    ],
    numeroRegistro: '104971323',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Gastrointestinais (antiemético) ──
  {
    id: 'ondansetrona',
    nome: 'Ondansetrona (cloridrato)',
    principio: 'cloridrato de ondansetrona',
    sinonimos: ['ondansetrona', 'zofran', 'vonau', 'antiemético', 'náusea', 'vômito'],
    classe: 'Gastrointestinais',
    nomesComerciais: ['Zofran®', 'Vonau®', 'Ondansetrona genérica'],
    mecanismo:
      'Antiemético antagonista dos receptores 5-HT3 (serotonina), central e periférico. Não causa sintomas extrapiramidais (diferente da metoclopramida).',
    apresentacoes: [
      'Comprimido 4 mg e 8 mg',
      'Comprimido orodispersível (flash)',
      'Solução injetável 2 mg/mL',
    ],
    usoClinico: [
      'Náuseas e vômitos (pós-operatório, quimio/radioterapia)',
      'Vômitos na emergência (incl. gastroenterite)',
    ],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['4–8 mg VO/IV até 8/8 h (máx. 16 mg/dose EV — a dose única de 32 mg foi retirada por risco de QT)', 'IV lenta (bolus rápido aumenta o risco de QT)'],
      },
    ],
    ajusteDose: ['Hepatopatia grave: máx. 8 mg/dia'],
    contraindicacoes: [
      'Hipersensibilidade',
      'Uso com apomorfina',
      'Síndrome do QT longo congênita',
    ],
    efeitosAdversos: [
      'Cefaleia, constipação',
      'Prolongamento do intervalo QT (dose/IV dependente)',
    ],
    advertencias: ['Cautela com QT longo e distúrbios eletrolíticos', 'Administração IV lenta'],
    gestacaoLactacao: 'Usar com cautela; preferir no 2º/3º trimestre quando necessário.',
    interacoes: [
      'Fármacos que prolongam o QT',
      'Tramadol (reduz analgesia)',
      'Serotoninérgicos (síndrome serotoninérgica)',
    ],
    numeroRegistro: '143810290',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Respiratórios (corticoide inalatório) ──
  {
    id: 'budesonida',
    nome: 'Budesonida',
    principio: 'budesonida',
    sinonimos: ['budesonida', 'pulmicort', 'busonid', 'corticoide inalatório', 'asma', 'rinite'],
    classe: 'Respiratórios',
    nomesComerciais: ['Pulmicort®', 'Busonid®', 'Budesonida genérica'],
    mecanismo:
      'Corticoide inalatório/nasal: ação anti-inflamatória tópica nas vias aéreas, com baixa absorção sistêmica. É medicação CONTROLADORA (de manutenção), não de resgate.',
    apresentacoes: [
      'Aerossol/pó inalatório',
      'Suspensão para nebulização 0,25 e 0,5 mg/mL',
      'Spray nasal',
    ],
    usoClinico: ['Asma (controlador de manutenção)', 'DPOC (associada)', 'Rinite alérgica (nasal)'],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Inalatório: dose conforme gravidade da asma (controlador diário)',
          'Nebulização: 0,5–1 mg 1–2×/dia',
        ],
      },
    ],
    ajusteDose: ['Usar a menor dose eficaz de manutenção'],
    contraindicacoes: ['Hipersensibilidade', 'Infecção respiratória não tratada (cautela)'],
    efeitosAdversos: [
      'Candidíase oral e rouquidão (enxaguar a boca após o uso)',
      'Irritação da garganta',
      'Doses altas/prolongadas: efeitos sistêmicos de corticoide',
    ],
    advertencias: [
      'É controlador — NÃO usar como resgate (resgate = salbutamol)',
      'Enxaguar a boca após inalar (previne candidíase)',
    ],
    gestacaoLactacao:
      'Corticoide inalatório de escolha na gestação (controle da asma é prioritário).',
    interacoes: [
      'Inibidores potentes do CYP3A4 (ritonavir, cetoconazol) aumentam a exposição sistêmica',
    ],
    numeroRegistro: '102351180',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Psiquiátricos e sistema nervoso ──
  {
    id: 'escitalopram',
    nome: 'Escitalopram (oxalato)',
    principio: 'oxalato de escitalopram',
    sinonimos: ['escitalopram', 'lexapro', 'reconter', 'ISRS', 'antidepressivo', 'ansiedade'],
    classe: 'Psiquiátricos e sistema nervoso',
    nomesComerciais: ['Lexapro®', 'Reconter®', 'Escitalopram genérico'],
    mecanismo: 'Inibidor seletivo da recaptação de serotonina (ISRS), o mais seletivo da classe.',
    apresentacoes: ['Comprimido 10 mg, 15 mg e 20 mg', 'Solução oral 20 mg/mL'],
    usoClinico: ['Depressão', 'Transtorno de ansiedade generalizada, pânico, TOC'],
    receituario: 'Venda sob prescrição (tarja vermelha; não é da Portaria 344/98).',
    posologia: [
      { titulo: 'Adulto', itens: ['Iniciar 10 mg/dia', 'Até 20 mg/dia (idoso: máx. 10 mg)'] },
    ],
    ajusteDose: ['Idoso e hepatopata: máx. 10 mg/dia'],
    contraindicacoes: [
      'Uso com IMAO',
      'Síndrome do QT longo / uso com fármacos que prolongam o QT',
    ],
    efeitosAdversos: [
      'Náusea, cefaleia',
      'Insônia ou sonolência',
      'Disfunção sexual',
      'Prolongamento do QT (dose-dependente), hiponatremia',
    ],
    advertencias: [
      'Efeito pleno em 2–4 semanas; não suspender abruptamente',
      'Monitorar ideação suicida em < 25 anos',
    ],
    gestacaoLactacao: 'Avaliar risco/benefício; relativamente seguro.',
    interacoes: [
      'IMAO e serotoninérgicos',
      'Fármacos que prolongam o QT',
      'AINE/anticoagulantes (sangramento)',
    ],
    numeroRegistro: '105730649',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'amitriptilina',
    nome: 'Amitriptilina (cloridrato)',
    principio: 'cloridrato de amitriptilina',
    sinonimos: [
      'amitriptilina',
      'tryptanol',
      'amytril',
      'tricíclico',
      'antidepressivo',
      'dor neuropática',
      'enxaqueca',
    ],
    classe: 'Psiquiátricos e sistema nervoso',
    nomesComerciais: ['Tryptanol®', 'Amytril®', 'Amitriptilina genérica'],
    mecanismo:
      'Antidepressivo tricíclico: inibe a recaptação de noradrenalina e serotonina; tem efeitos anticolinérgicos, anti-histamínicos e bloqueio alfa-adrenérgico.',
    apresentacoes: ['Comprimido 25 mg e 75 mg'],
    usoClinico: [
      'Depressão',
      'Dor neuropática / dor crônica',
      'Profilaxia de enxaqueca',
      'Insônia (dose baixa)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Depressão: iniciar 25 mg à noite, titular até 75–150 mg/dia',
          'Dor/enxaqueca: 10–25 mg à noite',
        ],
      },
    ],
    ajusteDose: ['Idoso: doses baixas (efeitos anticolinérgicos e quedas)'],
    contraindicacoes: [
      'Pós-IAM recente, arritmias / bloqueios',
      'Uso com IMAO',
      'Glaucoma de ângulo fechado, retenção urinária',
      'Síndrome do QT longo',
    ],
    efeitosAdversos: [
      'Anticolinérgicos (boca seca, constipação, retenção urinária, visão turva)',
      'Sedação, ganho de peso',
      'Hipotensão ortostática',
      'Prolongamento do QT; cardiotoxicidade em overdose (grave)',
    ],
    advertencias: [
      'Alta letalidade em superdosagem (cardiotoxicidade) — cuidado em risco de suicídio',
      'Cautela em idoso e cardiopata',
    ],
    gestacaoLactacao: 'Usar apenas se o benefício superar o risco.',
    interacoes: [
      'IMAO e serotoninérgicos',
      'Outros fármacos que prolongam o QT',
      'Anticolinérgicos, depressores do SNC, álcool',
    ],
    numeroRegistro: '167730427',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'clonazepam',
    nome: 'Clonazepam',
    principio: 'clonazepam',
    sinonimos: ['clonazepam', 'rivotril', 'benzodiazepínico', 'ansiolítico', 'anticonvulsivante'],
    classe: 'Psiquiátricos e sistema nervoso',
    nomesComerciais: ['Rivotril®', 'Clonazepam genérico'],
    mecanismo:
      'Benzodiazepínico de ação longa: potencializa o GABA no receptor GABA-A, com efeito ansiolítico, anticonvulsivante, sedativo e relaxante muscular.',
    apresentacoes: ['Comprimido 0,5 mg e 2 mg', 'Solução oral (gotas) 2,5 mg/mL'],
    usoClinico: [
      'Transtornos de ansiedade / pânico',
      'Epilepsia (alguns tipos)',
      'Adjuvante em distúrbios do sono (uso restrito)',
    ],
    receituario:
      'Controlado — Portaria 344/98 (lista B1): RECEITA AZUL (notificação de receita B), retida.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: ['Dose individualizada (ex.: 0,5–2 mg/dia)', 'Usar pelo menor tempo possível'],
      },
    ],
    ajusteDose: ['Idoso: doses menores (quedas, sedação)', 'Hepatopatia: reduzir'],
    contraindicacoes: [
      'Insuficiência respiratória grave, apneia do sono',
      'Miastenia gravis',
      'Insuficiência hepática grave',
      'Glaucoma de ângulo fechado',
    ],
    efeitosAdversos: [
      'Sedação, sonolência, tontura',
      'Dependência e tolerância',
      'Comprometimento cognitivo/quedas (idoso)',
      'Depressão respiratória (com álcool/opioides)',
    ],
    advertencias: [
      'Risco de DEPENDÊNCIA — evitar uso prolongado; NÃO suspender abruptamente (convulsão/abstinência)',
      'Risco de depressão respiratória fatal com opioides/álcool',
    ],
    gestacaoLactacao: 'Evitar (risco fetal e de síndrome de abstinência neonatal).',
    interacoes: ['Opioides (depressão respiratória)', 'Álcool e outros depressores do SNC'],
    numeroRegistro: '154230175',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antibióticos ──
  {
    id: 'sulfametoxazol-trimetoprima',
    nome: 'Sulfametoxazol + Trimetoprima',
    principio: 'sulfametoxazol, trimetoprima',
    sinonimos: [
      'sulfametoxazol',
      'trimetoprima',
      'cotrimoxazol',
      'bactrim',
      'SMX-TMP',
      'antibiótico',
    ],
    classe: 'Antibióticos',
    nomesComerciais: ['Bactrim®', 'Bactrim F®', 'Cotrimoxazol genérico'],
    mecanismo:
      'Associação sinérgica que bloqueia duas etapas da síntese do folato bacteriano (sulfametoxazol + trimetoprima), com ação bactericida.',
    apresentacoes: ['Comprimido 400/80 mg e 800/160 mg (F)', 'Suspensão oral 200/40 mg/5 mL'],
    usoClinico: [
      'Infecção urinária',
      'Pneumonia por Pneumocystis (profilaxia/tratamento)',
      'Algumas infecções de pele (MRSA comunitário)',
    ],
    receituario:
      'Antibiótico — receituário de controle especial (RDC 471/2021): receita simples retida em 2 vias.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'ITU: 800/160 mg (1 cp F) de 12/12 h',
          'PCP: doses maiores baseadas na trimetoprima',
        ],
      },
    ],
    ajusteDose: ['Ajustar/evitar na insuficiência renal (ClCr < 15 contraindicado)'],
    contraindicacoes: [
      'Alergia a sulfonamidas',
      'Insuficiência renal/hepática graves',
      'Anemia megaloblástica por deficiência de folato',
      'Gestação a termo e lactentes < 2 meses',
    ],
    efeitosAdversos: [
      'Rash (incluindo reações graves — SSJ/NET)',
      'Hipercalemia, lesão renal',
      'Discrasias sanguíneas',
      'Hemólise na deficiência de G6PD',
      'Sintomas GI',
    ],
    advertencias: [
      'Suspender ao 1º sinal de rash/reação cutânea',
      'Monitorar potássio e função renal',
    ],
    gestacaoLactacao: 'Evitar no 1º trimestre e próximo ao termo.',
    interacoes: [
      'Varfarina (potencializa)',
      'Metotrexato',
      'IECA/BRA e poupadores de K (hipercalemia)',
      'Hipoglicemiantes',
    ],
    numeroRegistro: '103700315',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'ciprofloxacino',
    nome: 'Ciprofloxacino',
    principio: 'cloridrato de ciprofloxacino',
    sinonimos: ['ciprofloxacino', 'cipro', 'quinolona', 'fluoroquinolona', 'antibiótico'],
    classe: 'Antibióticos',
    nomesComerciais: ['Cipro®', 'Ciprofloxacino genérico'],
    mecanismo:
      'Fluoroquinolona: inibe a DNA-girase e a topoisomerase IV bacterianas (ação bactericida). Boa cobertura de Gram-negativos.',
    apresentacoes: ['Comprimido 250 mg e 500 mg', 'Solução injetável', 'Colírio/otológico'],
    usoClinico: [
      'Infecção urinária complicada / pielonefrite',
      'Infecções gastrointestinais e intra-abdominais (com metronidazol)',
      'Prostatite',
    ],
    receituario:
      'Antibiótico — receituário de controle especial (RDC 471/2021): receita simples retida em 2 vias.',
    posologia: [{ titulo: 'Adulto', itens: ['250–750 mg de 12/12 h, conforme a infecção'] }],
    ajusteDose: ['Ajustar na insuficiência renal'],
    contraindicacoes: [
      'Hipersensibilidade a quinolonas',
      'Cautela: crianças/adolescentes e gestantes (efeito sobre cartilagem)',
      'História de tendinopatia por quinolona',
    ],
    efeitosAdversos: [
      'Tendinite/ruptura de tendão (sobretudo idoso/corticoide)',
      'Prolongamento do QT',
      'Sintomas GI e neuropsiquiátricos',
      'Disglicemia; reduz limiar convulsivo',
      'Aneurisma/dissecção de aorta — risco aumentado (alerta FDA); evitar em idoso/HAS/aneurisma conhecido',
      'Neuropatia periférica (pode ser irreversível)',
    ],
    advertencias: [
      'Reservar para quando não houver alternativa (eventos adversos graves — FDA/ANVISA)',
      'Evitar laticínios/antiácidos junto (reduzem absorção)',
    ],
    gestacaoLactacao: 'Evitar; usar só se não houver alternativa.',
    interacoes: [
      'Antiácidos, cálcio, ferro, zinco (separar)',
      'Varfarina, teofilina',
      'Tizanidina — associação contraindicada (inibe CYP1A2, ↑ ~10× a exposição → hipotensão/sedação grave)',
      'Fármacos que prolongam o QT',
    ],
    numeroRegistro: '103850087',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'metronidazol',
    nome: 'Metronidazol',
    principio: 'metronidazol',
    sinonimos: ['metronidazol', 'flagyl', 'antibiótico', 'antiparasitário', 'anaeróbios'],
    classe: 'Antibióticos',
    nomesComerciais: ['Flagyl®', 'Metronidazol genérico'],
    mecanismo:
      'Nitroimidazol: gera radicais que danificam o DNA de bactérias anaeróbias e protozoários (ação bactericida/antiparasitária).',
    apresentacoes: [
      'Comprimido 250 mg e 400 mg',
      'Suspensão oral',
      'Solução injetável',
      'Gel vaginal',
    ],
    usoClinico: [
      'Infecções por anaeróbios (intra-abdominais, com outros ATB)',
      'Vaginose bacteriana e tricomoníase',
      'Giardíase, amebíase',
      'Colite por C. difficile (casos selecionados)',
    ],
    receituario:
      'Antibiótico — receituário de controle especial (RDC 471/2021): receita simples retida em 2 vias.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '250–500 mg de 8/8 h',
          'Tricomoníase: 2 g em dose única ou 500 mg 12/12 h por 7 dias',
        ],
      },
    ],
    ajusteDose: ['Hepatopatia grave: reduzir a dose'],
    contraindicacoes: ['Hipersensibilidade a nitroimidazóis', '1º trimestre da gestação (cautela)'],
    efeitosAdversos: [
      'Gosto metálico, náusea',
      'Urina escurecida (benigno)',
      'Neuropatia periférica (uso prolongado)',
      'Efeito dissulfiram-símile com álcool',
    ],
    advertencias: [
      'NÃO ingerir álcool durante e até 48–72 h após (efeito dissulfiram: náuseas, rubor, taquicardia)',
    ],
    gestacaoLactacao: 'Evitar no 1º trimestre; usar depois se necessário.',
    interacoes: ['Álcool (efeito dissulfiram)', 'Varfarina (potencializa)', 'Lítio'],
    numeroRegistro: '105710140',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA), RENAME e Formulário Terapêutico Nacional (MS).',
  },

  // ── Antifúngicos ──
  {
    id: 'fluconazol',
    nome: 'Fluconazol',
    principio: 'fluconazol',
    sinonimos: ['fluconazol', 'zoltec', 'antifúngico', 'azol', 'candidíase'],
    classe: 'Antifúngicos',
    nomesComerciais: ['Zoltec®', 'Fluconazol genérico'],
    mecanismo:
      'Antifúngico azólico: inibe a síntese do ergosterol da membrana fúngica (inibição da 14-alfa-desmetilase). Boa biodisponibilidade oral.',
    apresentacoes: ['Cápsula 150 mg', 'Comprimido 100/150/200 mg', 'Solução injetável'],
    usoClinico: [
      'Candidíase (vaginal, orofaríngea, sistêmica)',
      'Criptococose',
      'Profilaxia em imunossuprimidos',
    ],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          'Candidíase vaginal: 150 mg dose única',
          'Candidíase sistêmica/outras: 100–400 mg/dia',
        ],
      },
    ],
    ajusteDose: ['Ajustar na insuficiência renal (doses repetidas)'],
    contraindicacoes: [
      'Hipersensibilidade a azólicos',
      'Uso com fármacos que prolongam o QT (ex.: cisaprida)',
    ],
    efeitosAdversos: [
      'Sintomas GI, cefaleia',
      'Elevação de transaminases (hepatotoxicidade)',
      'Prolongamento do QT',
      'Rash (raramente grave)',
    ],
    advertencias: [
      'Inibidor enzimático potente (CYP2C9/3A4) — muitas interações',
      'Monitorar função hepática no uso prolongado',
    ],
    gestacaoLactacao:
      'Evitar doses altas/repetidas na gestação (dose única de 150 mg é de menor risco).',
    interacoes: [
      'Varfarina (potencializa)',
      'Estatinas (risco de miopatia)',
      'Fenitoína, sulfonilureias',
      'Fármacos que prolongam o QT',
    ],
    numeroRegistro: '105710084',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'nistatina',
    nome: 'Nistatina',
    principio: 'nistatina',
    sinonimos: ['nistatina', 'micostatin', 'antifúngico', 'candidíase', 'sapinho'],
    classe: 'Antifúngicos',
    nomesComerciais: ['Micostatin®', 'Nistatina genérica'],
    mecanismo:
      'Antifúngico poliênico: liga-se ao ergosterol e altera a permeabilidade da membrana fúngica. NÃO é absorvido — ação tópica/local (boca e trato GI).',
    apresentacoes: ['Suspensão oral 100.000 UI/mL', 'Creme/pomada', 'Drágea'],
    usoClinico: [
      'Candidíase oral ("sapinho")',
      'Candidíase do trato gastrointestinal',
      'Candidíase cutânea (tópico)',
    ],
    receituario: 'Venda sob prescrição.',
    posologia: [
      {
        titulo: 'Candidíase oral',
        itens: [
          'Bochechar e engolir 100.000–600.000 UI 4×/dia',
          'Manter em contato com a mucosa o maior tempo possível',
        ],
      },
    ],
    ajusteDose: ['Não necessária (ação local, sem absorção sistêmica)'],
    contraindicacoes: ['Hipersensibilidade'],
    efeitosAdversos: ['Bem tolerada', 'Náusea/diarreia em doses altas', 'Irritação local'],
    advertencias: [
      'Ação apenas local — não trata infecção fúngica sistêmica',
      'Manter o contato com a mucosa (não engolir imediatamente)',
    ],
    gestacaoLactacao: 'Segura (não há absorção sistêmica significativa).',
    interacoes: ['Praticamente nenhuma (sem absorção sistêmica)'],
    numeroRegistro: '138410079',
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ═══════════════════════ Lote 5 ═══════════════════════
  // ── Cardiovascular (anticoagulantes e diurético) ──
  {
    id: 'rivaroxabana',
    nome: 'Rivaroxabana',
    principio: 'rivaroxabana',
    sinonimos: [
      'rivaroxabana',
      'xarelto',
      'doac',
      'anticoagulante oral direto',
      'inibidor do fator xa',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    numeroRegistro: '125680363',
    nomesComerciais: ['Xarelto®', 'Rivaroxabana genérico'],
    mecanismo:
      'Anticoagulante oral direto (DOAC): inibidor seletivo e reversível do fator Xa, bloqueando a conversão de protrombina em trombina e a formação do coágulo. Não requer monitorização rotineira do INR.',
    apresentacoes: [
      'Comprimido revestido 2,5 mg',
      'Comprimido revestido 10 mg',
      'Comprimido revestido 15 mg',
      'Comprimido revestido 20 mg',
    ],
    usoClinico: [
      'Prevenção de AVC e embolia sistêmica na fibrilação atrial não valvar',
      'Tratamento e prevenção de recorrência de TVP e TEP',
      'Profilaxia de TEV em cirurgia ortopédica de quadril/joelho',
      'Doença arterial coronariana/periférica estável (2,5 mg 2×/dia com AAS)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Fibrilação atrial não valvar',
        itens: ['20 mg 1×/dia, com alimento', '15 mg 1×/dia se ClCr 15–50 mL/min'],
      },
      {
        titulo: 'TVP/TEP (tratamento)',
        itens: [
          '15 mg 12/12h por 21 dias',
          'Após 21 dias: 20 mg 1×/dia',
          'Prevenção de recorrência prolongada: 10–20 mg 1×/dia',
        ],
      },
      {
        titulo: 'Profilaxia em cirurgia ortopédica',
        itens: ['10 mg 1×/dia; iniciar 6–10 h após hemostasia'],
      },
      { titulo: 'Doença aterosclerótica (com AAS)', itens: ['2,5 mg 12/12h'] },
    ],
    ajusteDose: [
      'ClCr 15–50 mL/min (FA): reduzir para 15 mg/dia',
      'Na TVP/TEP a fase inicial (15 mg 12/12h por 21 dias) NÃO é reduzida por ClCr; cautela/evitar se ClCr < 30 mL/min',
      'ClCr < 15 mL/min: contraindicado (não recomendado)',
      'Doses de 15 e 20 mg devem ser tomadas com alimento para garantir absorção',
      'Insuficiência hepática Child-Pugh B/C com coagulopatia: contraindicado',
    ],
    contraindicacoes: [
      'Sangramento ativo clinicamente significativo',
      'Lesão ou condição com alto risco de sangramento maior',
      'ClCr < 15 mL/min',
      'Hepatopatia associada a coagulopatia',
      'Gestação e lactação',
      'Hipersensibilidade',
    ],
    efeitosAdversos: [
      'Sangramento (principal): epistaxe, hematúria, gengivorragia, hemorragia gastrointestinal',
      'Anemia',
      'Náusea, elevação de transaminases',
      'Raramente hemorragia intracraniana',
    ],
    advertencias: [
      'Não usar em prótese valvar mecânica nem em SAAF de alto risco',
      'Suspender 24 h antes de procedimentos com baixo risco e ≥ 48 h se alto risco hemorrágico',
      'Antídoto específico: andexanet alfa (quando disponível); CCP em sangramento grave',
      'Não tomar duas doses para compensar dose esquecida',
    ],
    gestacaoLactacao:
      'Contraindicada na gestação (risco hemorrágico fetal/materno e passagem placentária) e na lactação. Usar contracepção eficaz durante o tratamento.',
    interacoes: [
      'Inibidores potentes de CYP3A4 e P-gp (cetoconazol, itraconazol, ritonavir): aumentam exposição — evitar',
      'Indutores potentes (rifampicina, fenitoína, carbamazepina, erva-de-são-joão): reduzem eficácia',
      'AINE, AAS, outros antiagregantes e anticoagulantes: risco aumentado de sangramento',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'enoxaparina',
    nome: 'Enoxaparina (sódica)',
    principio: 'enoxaparina sódica',
    sinonimos: [
      'enoxaparina',
      'clexane',
      'heparina de baixo peso molecular',
      'hbpm',
      'anticoagulante',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    numeroRegistro: '100431016',
    nomesComerciais: ['Clexane®', 'Versa®', 'Enoxalow®', 'Heptron®', 'Enoxaparina genérica'],
    mecanismo:
      'Heparina de baixo peso molecular (HBPM): potencializa a antitrombina III, inibindo predominantemente o fator Xa (com menor efeito anti-IIa/trombina). Resposta anticoagulante mais previsível que a heparina não fracionada, dispensando monitorização de rotina.',
    apresentacoes: [
      'Seringa preenchida 20 mg/0,2 mL',
      'Seringa preenchida 40 mg/0,4 mL',
      'Seringa preenchida 60 mg/0,6 mL',
      'Seringa preenchida 80 mg/0,8 mL',
      'Seringa preenchida 100 mg/1 mL',
    ],
    usoClinico: [
      'Profilaxia de tromboembolismo venoso (TEV) em pacientes clínicos e cirúrgicos',
      'Tratamento de TVP e TEP',
      'Síndrome coronariana aguda (angina instável, IAM sem e com supra de ST)',
      'Ponte (bridging) de anticoagulação peri-procedimento',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Profilaxia de TEV',
        itens: ['40 mg SC 1×/dia (risco moderado/alto)', '20 mg SC 1×/dia (menor risco)'],
      },
      {
        titulo: 'Tratamento de TVP/TEP',
        itens: ['1 mg/kg SC 12/12h', 'ou 1,5 mg/kg SC 1×/dia (regime dose única diária)'],
      },
      {
        titulo: 'SCA',
        itens: [
          '1 mg/kg SC 12/12h (+ AAS)',
          'IAM com supra < 75 anos: bolus IV 30 mg + 1 mg/kg SC 12/12h (máx. 100 mg em cada uma das 2 primeiras doses SC)',
        ],
      },
    ],
    ajusteDose: [
      'ClCr < 30 mL/min: dose terapêutica reduzida para 1 mg/kg SC 1×/dia; profilaxia para 30 mg SC 1×/dia',
      'Idoso ≥ 75 anos no IAM com supra: omitir bolus IV e usar 0,75 mg/kg SC 12/12h (máx. 75 mg nas 2 primeiras doses)',
      'Obesidade/peso extremo: considerar monitorização do anti-Xa',
      'Não recomendada em ClCr < 15 mL/min (preferir HNF)',
    ],
    contraindicacoes: [
      'Sangramento ativo significativo',
      'História de trombocitopenia induzida por heparina (HIT/TIH)',
      'Hipersensibilidade à enoxaparina, heparina ou derivados suínos',
      'Endocardite infecciosa aguda (exceto com prótese valvar)',
      'Plaquetopenia grave',
    ],
    efeitosAdversos: [
      'Sangramento e hematomas (principal)',
      'Hematoma e dor no local da injeção',
      'Trombocitopenia (incluindo HIT)',
      'Elevação de transaminases',
      'Hipercalemia (inibição da aldosterona)',
      'Osteoporose no uso prolongado',
    ],
    advertencias: [
      'Risco de hematoma neuraxial em anestesia/punção raque ou peridural — respeitar intervalos de segurança',
      'Monitorar plaquetas durante o tratamento (vigiar HIT)',
      'Administração subcutânea profunda; não expelir a bolha de ar da seringa preenchida',
      'Antídoto parcial: protamina (reverte ~60% do efeito anti-Xa)',
      'Não administrar por via intramuscular',
    ],
    gestacaoLactacao:
      'Anticoagulante de escolha na gestação quando indicado (não atravessa a placenta); usar com acompanhamento. Compatível com a lactação.',
    interacoes: [
      'AAS, AINE, antiagregantes, outros anticoagulantes: aumentam risco de sangramento',
      'Trombolíticos: risco hemorrágico aditivo',
      'Corticosteroides sistêmicos: maior risco de sangramento gastrointestinal',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'clortalidona',
    nome: 'Clortalidona',
    principio: 'clortalidona',
    sinonimos: [
      'clortalidona',
      'higroton',
      'diurético tiazídico',
      'anti-hipertensivo',
      'tipo-tiazídico',
    ],
    classe: 'Cardiovascular e anti-hipertensivos',
    numeroRegistro: '103920047',
    nomesComerciais: ['Higroton®', 'Clortalil®', 'Clortalidona genérica'],
    mecanismo:
      'Diurético tipo-tiazídico (sulfonamida): inibe o cotransportador Na+/Cl– no túbulo contorcido distal, aumentando a excreção de sódio e água. Tem meia-vida longa e ação anti-hipertensiva sustentada (efeito vasodilatador a longo prazo).',
    apresentacoes: ['Comprimido 12,5 mg', 'Comprimido 25 mg', 'Comprimido 50 mg'],
    usoClinico: [
      'Hipertensão arterial sistêmica (1ª linha, isolada ou em associação)',
      'Edema (insuficiência cardíaca, doença renal/hepática)',
      'Coadjuvante na prevenção de nefrolitíase por hipercalciúria',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Hipertensão arterial',
        itens: [
          '12,5–25 mg 1×/dia, pela manhã',
          'Dose-alvo usual 12,5–25 mg/dia; raramente ultrapassar 25 mg/dia para HAS',
        ],
      },
      { titulo: 'Edema', itens: ['25–50 mg/dia, podendo ajustar conforme resposta'] },
    ],
    ajusteDose: [
      'Pouco eficaz como diurético se ClCr < 30 mL/min (perde efeito natriurético; preferir diurético de alça)',
      'Idoso: iniciar com 12,5 mg/dia pelo maior risco de hiponatremia/hipocalemia',
      'Insuficiência hepática: cautela (risco de precipitar encefalopatia por distúrbio eletrolítico)',
    ],
    contraindicacoes: [
      'Anúria',
      'Hipersensibilidade a clortalidona ou sulfonamidas',
      'Distúrbios eletrolíticos graves não corrigidos (hipocalemia, hiponatremia, hipercalcemia)',
      'Doença de Addison',
    ],
    efeitosAdversos: [
      'Hipocalemia e hiponatremia (principais)',
      'Hipomagnesemia, hipercalcemia',
      'Hiperuricemia (pode precipitar gota)',
      'Hiperglicemia e dislipidemia leve',
      'Hipotensão postural, tontura',
      'Disfunção erétil',
      'Raramente fotossensibilidade',
    ],
    advertencias: [
      'Monitorar eletrólitos (Na+, K+), função renal e ácido úrico, sobretudo no início e em idosos',
      'Risco de hipocalemia maior com associação a outros caliuréticos',
      'Atenção a hiponatremia sintomática (confusão, quedas) no idoso',
      'Pode reduzir a calciúria — útil na osteoporose, mas cuidado em hipercalcemia',
    ],
    gestacaoLactacao:
      'Não recomendada na gestação (risco de redução do volume plasmático, distúrbios eletrolíticos e plaquetopenia fetal); evitar na lactação (pode reduzir a produção de leite).',
    interacoes: [
      'Lítio: reduz a depuração e aumenta a toxicidade do lítio',
      'AINE: reduzem o efeito anti-hipertensivo e diurético',
      'Digoxina: hipocalemia potencializa toxicidade digitálica',
      'Outros anti-hipertensivos: efeito hipotensor aditivo',
      'Corticosteroides e anfotericina B: agravam a hipocalemia',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antidiabéticos ──
  {
    id: 'insulina-humana',
    nome: 'Insulina humana (NPH e Regular)',
    principio: 'insulina humana',
    sinonimos: ['insulina', 'nph', 'regular', 'basal', 'bolus'],
    classe: 'Antidiabéticos',
    numeroRegistro: '133480002',
    nomesComerciais: ['Humulin® N/R', 'Novolin® N/R', 'Insulina NPH/Regular (genérico)'],
    mecanismo:
      'Hormônio que reduz a glicemia: promove captação de glicose por músculo e tecido adiposo, inibe gliconeogênese e glicogenólise hepática. NPH (intermediária): início ~1–2 h, pico 4–8 h, duração 12–18 h. Regular (rápida): início ~30 min, pico 2–4 h, duração 5–8 h.',
    apresentacoes: [
      'Frasco-ampola 100 UI/mL (10 mL) — NPH e Regular',
      'Refil/caneta 100 UI/mL (3 mL)',
    ],
    usoClinico: [
      'Diabetes mellitus tipo 1 (esquema basal-bolus)',
      'Diabetes tipo 2 com falência de orais ou descompensado',
      'Diabetes gestacional/pré-existente na gravidez',
      'Cetoacidose diabética e estado hiperosmolar (Regular IV)',
      'Hiperglicemia hospitalar',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Basal-bolus (DM1)',
        itens: [
          'Dose total ~0,5–1,0 UI/kg/dia',
          'Cerca de 50% como basal (NPH 2x/dia) e 50% como bolus (Regular antes das refeições)',
          'Regular: aplicar ~30 min antes da refeição',
        ],
      },
      {
        titulo: 'DM2 (início)',
        itens: [
          'NPH ao deitar 10 UI ou 0,1–0,2 UI/kg, titulando pela glicemia de jejum',
          'Intensificar para 2x/dia ou basal-bolus conforme controle',
        ],
      },
      {
        titulo: 'Cetoacidose diabética',
        itens: [
          'Insulina Regular IV em bomba: 0,1 UI/kg/h (ou bolus 0,1 UI/kg + 0,1 UI/kg/h)',
          'NÃO iniciar a insulina se K⁺ < 3,3 mEq/L — repor potássio antes (risco de hipocalemia grave)',
          'Manter via IV até resolução da acidose e transição para SC',
        ],
      },
    ],
    ajusteDose: [
      'Reduzir dose na insuficiência renal/hepática (menor clearance, maior risco de hipoglicemia)',
      'Ajustar conforme glicemia, refeições e atividade física',
    ],
    contraindicacoes: ['Hipoglicemia', 'Hipersensibilidade à insulina humana ou aos excipientes'],
    efeitosAdversos: [
      'Hipoglicemia (principal e mais grave)',
      'Ganho de peso',
      'Lipodistrofia/lipo-hipertrofia no local de aplicação',
      'Reações locais (eritema, prurido)',
      'Hipocalemia (sobretudo IV)',
    ],
    advertencias: [
      'NPH é suspensão turva — homogeneizar suavemente antes do uso; NÃO aplicar IV',
      'Apenas a Regular (límpida) pode ser usada por via IV',
      'Rodízio dos locais de aplicação SC para evitar lipo-hipertrofia',
      'Conservar frascos/refis fechados sob refrigeração (2–8 °C); não congelar. Em uso, o frasco pode ficar em temperatura ambiente por ~28 dias; o refil/caneta conforme a bula (frequentemente ~14 dias)',
      'Reconhecer sinais de hipoglicemia (tremor, sudorese, confusão); orientar correção com glicose',
    ],
    gestacaoLactacao:
      'Insulina é o tratamento de escolha do diabetes na gestação e é compatível com a amamentação.',
    interacoes: [
      'Betabloqueadores podem mascarar sintomas de hipoglicemia',
      'Corticoides, tiazídicos e simpaticomiméticos elevam a glicemia (aumentam necessidade)',
      'Álcool e outros hipoglicemiantes potencializam a hipoglicemia',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'dapagliflozina',
    nome: 'Dapagliflozina',
    principio: 'dapagliflozina',
    sinonimos: ['dapagliflozina', 'forxiga', 'isglt2', 'glifozina'],
    classe: 'Antidiabéticos',
    numeroRegistro: '118190496',
    nomesComerciais: ['Forxiga®', 'Dapagliflozina (genérico)'],
    mecanismo:
      'Inibidor do cotransportador sódio-glicose tipo 2 (iSGLT2): reduz a reabsorção renal de glicose no túbulo proximal, aumentando a glicosúria. Efeito independente de insulina; promove natriurese leve, redução de peso e da pressão arterial.',
    apresentacoes: ['Comprimido revestido 5 mg', 'Comprimido revestido 10 mg'],
    usoClinico: [
      'Diabetes mellitus tipo 2 (mono ou associado)',
      'Insuficiência cardíaca (com ou sem diabetes)',
      'Doença renal crônica (nefroproteção)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '10 mg via oral 1x/dia, com ou sem alimento',
          'DM2: pode iniciar com 5 mg e aumentar para 10 mg',
          'IC e DRC: 10 mg/dia',
        ],
      },
    ],
    ajusteDose: [
      'Efeito hipoglicemiante reduzido com TFG baixa',
      'Não iniciar para controle glicêmico se TFG < 45 mL/min/1,73 m²',
      'SUSPENDER em jejum prolongado, cirurgia, doença aguda grave ou risco de cetoacidose',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao fármaco',
      'Diabetes mellitus tipo 1 (risco de cetoacidose)',
      'Cetoacidose diabética',
    ],
    efeitosAdversos: [
      'Infecções genitais por fungos (candidíase) — principal',
      'Infecção do trato urinário',
      'Depleção de volume/hipotensão',
      'Poliúria',
      'Cetoacidose euglicêmica (rara, mas grave)',
      'Gangrena de Fournier (muito rara)',
    ],
    advertencias: [
      'Risco de cetoacidose euglicêmica (glicemia pode estar normal ou pouco elevada) — orientar sinais de alerta',
      'Suspender temporariamente em situações de estresse metabólico/jejum/cirurgia',
      'Cautela em idosos, hipovolêmicos e em uso de diuréticos (risco de depleção volêmica)',
      'Higiene genital para reduzir candidíase',
    ],
    gestacaoLactacao:
      'Contraindicada na gestação (2º/3º trimestres) e na lactação; substituir por insulina.',
    interacoes: [
      'Diuréticos (depleção de volume e hipotensão)',
      'Insulina/sulfonilureias (risco de hipoglicemia — pode requerer redução de dose)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antibióticos ──
  {
    id: 'amoxicilina-clavulanato',
    nome: 'Amoxicilina + Clavulanato de potássio',
    principio: 'amoxicilina tri-hidratada + clavulanato de potássio',
    sinonimos: [
      'amoxicilina clavulanato',
      'amoxicilina com clavulanato',
      'clavulin',
      'amoxicilina ácido clavulânico',
      'penicilina',
      'antibiótico',
    ],
    classe: 'Antibióticos',
    numeroRegistro: '100431155',
    nomesComerciais: [
      'Clavulin®',
      'Sigma Clav®',
      'Novamox 2X®',
      'Amoxicilina + Clavulanato genérico',
    ],
    mecanismo:
      'Associação de penicilina de amplo espectro (amoxicilina, inibe a síntese da parede celular bacteriana ligando-se às PBP) com o ácido clavulânico, inibidor irreversível de beta-lactamases, que restaura a atividade contra cepas produtoras dessas enzimas.',
    apresentacoes: [
      'Comprimido 500 mg + 125 mg',
      'Comprimido 875 mg + 125 mg',
      'Suspensão oral 250 mg + 62,5 mg/5 mL',
      'Suspensão oral 400 mg + 57 mg/5 mL (BD)',
      'Pó para solução injetável 1.000 mg + 200 mg',
    ],
    usoClinico: [
      'Otite média aguda, sinusite e infecções de vias aéreas superiores',
      'Pneumonia adquirida na comunidade',
      'Infecções de pele e partes moles (incluindo mordeduras)',
      'Infecções urinárias e do trato geniturinário',
      'Infecções odontogênicas',
    ],
    receituario: 'Venda sob prescrição com retenção de receita (antimicrobiano — RDC 471/2021).',
    posologia: [
      {
        titulo: 'Adulto (oral)',
        itens: [
          '500/125 mg 8/8h',
          'ou 875/125 mg 12/12h',
          'Infecções graves: usar amoxicilina em alta dose com clavulanato fixo (ex.: 2.000/125 mg 12/12h) — NÃO administrar a apresentação 875/125 de 8/8h (excesso de clavulanato)',
        ],
      },
      {
        titulo: 'Pediátrico (oral)',
        itens: [
          'Baseado na amoxicilina: 25–45 mg/kg/dia divididos 12/12h',
          'Otite/infecções graves: 80–90 mg/kg/dia (formulação BD) 12/12h',
        ],
      },
      { titulo: 'Adulto (IV)', itens: ['1.000/200 mg 8/8h conforme gravidade'] },
    ],
    ajusteDose: [
      'ClCr 10–30 mL/min: 500/125 mg 12/12h (evitar a apresentação 875 mg)',
      'ClCr < 10 mL/min: 500/125 mg 1×/dia',
      'Hemodiálise: dose após a sessão',
      'Insuficiência hepática: usar com cautela e monitorar função hepática',
    ],
    contraindicacoes: [
      'Hipersensibilidade a penicilinas, cefalosporinas ou beta-lactâmicos',
      'Antecedente de icterícia/disfunção hepática associada a amoxicilina-clavulanato',
      'Mononucleose infecciosa (alto risco de exantema)',
    ],
    efeitosAdversos: [
      'Diarreia (frequente, atribuída ao clavulanato)',
      'Náusea, vômito, candidíase',
      'Exantema e reações de hipersensibilidade',
      'Hepatotoxicidade/colestase (mais com o componente clavulanato, geralmente reversível)',
      'Colite pseudomembranosa (C. difficile)',
      'Raramente anafilaxia',
    ],
    advertencias: [
      'Tomar no início das refeições para reduzir intolerância gastrointestinal e melhorar absorção do clavulanato',
      'Suspender e investigar diarreia grave/persistente (descartar C. difficile)',
      'Risco de reação cruzada com outros beta-lactâmicos',
      'Manter hidratação adequada (risco de cristalúria em altas doses)',
    ],
    gestacaoLactacao:
      'Pode ser usada na gestação quando indicada (penicilinas têm bom perfil de segurança). Compatível com a lactação, monitorando o lactente para diarreia ou candidíase.',
    interacoes: [
      'Alopurinol: aumenta o risco de exantema',
      'Metotrexato: amoxicilina reduz sua excreção, elevando a toxicidade',
      'Anticoagulantes orais (varfarina): pode prolongar o INR — monitorar',
      'Probenecida: reduz a excreção renal da amoxicilina (aumenta níveis séricos)',
      'Pode reduzir a eficácia de contraceptivos orais',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'nitrofurantoina',
    nome: 'Nitrofurantoína',
    principio: 'nitrofurantoína',
    sinonimos: ['nitrofurantoina', 'macrodantina', 'antisséptico urinário'],
    classe: 'Antibióticos',
    numeroRegistro: '103700579',
    nomesComerciais: ['Macrodantina®', 'Nitrofurantoína (genérico)'],
    mecanismo:
      'Antimicrobiano/antisséptico urinário: é reduzido por enzimas bacterianas a intermediários reativos que lesam DNA, ribossomos e vias metabólicas. Concentra-se na urina (boa atividade urinária, baixa concentração tecidual/sérica).',
    apresentacoes: ['Cápsula 100 mg (macrocristais)', 'Comprimido/cápsula 100 mg'],
    usoClinico: [
      'Infecção urinária baixa não complicada (cistite)',
      'Profilaxia de ITU de repetição',
    ],
    receituario:
      'Venda sob prescrição, com retenção da receita (antimicrobiano — tarja vermelha, RDC 471/2021).',
    posologia: [
      {
        titulo: 'Cistite (adulto)',
        itens: [
          'Macrocristais (Macrodantina®): 100 mg via oral 6/6 h por 5–7 dias',
          'Liberação prolongada (macrocristais-monoidratados): 100 mg 12/12 h por 5 dias',
          'Tomar com alimento para melhor tolerância e absorção',
        ],
      },
      { titulo: 'Profilaxia', itens: ['50–100 mg via oral à noite'] },
    ],
    ajusteDose: [
      'CONTRAINDICADA se ClCr < 30 mL/min (limiar atual; a bula clássica já restringia a < 60 mL/min) — eficácia urinária reduzida e risco de acúmulo',
      'Sem ajuste se função renal preservada',
    ],
    contraindicacoes: [
      'ClCr < 30 mL/min / insuficiência renal significativa',
      'Gestação a termo (≥ 38–42 semanas) e durante o trabalho de parto',
      'Recém-nascidos < 1 mês (risco de anemia hemolítica)',
      'Deficiência de G6PD',
      'Pielonefrite/ITU complicada com acometimento sistêmico',
    ],
    efeitosAdversos: [
      'Náusea, vômito e desconforto gástrico',
      'Coloração amarelo-acastanhada da urina',
      'Reação pulmonar aguda (pneumonite por hipersensibilidade)',
      'Toxicidade pulmonar e neuropatia periférica no uso prolongado',
      'Hepatotoxicidade (rara)',
      'Anemia hemolítica (sobretudo em deficiência de G6PD)',
    ],
    advertencias: [
      'Não indicada para pielonefrite ou infecção sistêmica (não atinge níveis teciduais/séricos adequados)',
      'Monitorar sintomas pulmonares e neurológicos no uso prolongado/profilático',
      'Tomar com alimento reduz intolerância gástrica',
    ],
    gestacaoLactacao:
      'Pode ser usada no início/meio da gestação se necessário, mas é CONTRAINDICADA próximo ao termo (risco de hemólise neonatal). Evitar na lactação de RN < 1 mês ou com deficiência de G6PD.',
    interacoes: [
      'Antiácidos com magnésio reduzem a absorção',
      'Probenecida e sulfimpirazona reduzem a excreção urinária (menor eficácia, maior toxicidade)',
      'Quinolonas — possível antagonismo (evitar associação)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Analgésico opioide ──
  {
    id: 'tramadol',
    nome: 'Tramadol (cloridrato)',
    principio: 'cloridrato de tramadol',
    sinonimos: ['tramadol', 'tramal', 'opioide fraco'],
    classe: 'Analgésicos e antitérmicos',
    numeroRegistro: '186100003',
    nomesComerciais: ['Tramal®', 'Sylador®', 'Tramadol (genérico)'],
    mecanismo:
      'Analgésico opioide de ação central (opioide fraco): agonista do receptor opioide µ e, simultaneamente, inibe a recaptação de serotonina e noradrenalina, modulando vias descendentes da dor.',
    apresentacoes: [
      'Cápsula/comprimido 50 mg',
      'Comprimido de liberação prolongada 100 mg',
      'Solução oral em gotas 100 mg/mL',
      'Solução injetável 50 mg/mL (1 mL e 2 mL)',
    ],
    usoClinico: [
      'Dor moderada a intensa, aguda ou crônica',
      'Dor pós-operatória',
      'Dor oncológica (degrau intermediário)',
    ],
    receituario: 'Receituário de controle especial (lista B1 — receita azul/B), em 2 vias.',
    posologia: [
      {
        titulo: 'Adulto (oral)',
        itens: [
          '50–100 mg via oral 6/6 h conforme a dor',
          'Dose máxima: 400 mg/dia',
          'Liberação prolongada: 100 mg 12/12 h',
        ],
      },
      {
        titulo: 'Adulto (parenteral)',
        itens: ['50–100 mg IV/IM/SC a cada 6 h', 'Máximo 400 mg/dia'],
      },
    ],
    ajusteDose: [
      'ClCr < 30 mL/min: aumentar o intervalo (ex.: 12/12 h) e reduzir dose máxima',
      'Insuficiência hepática: reduzir dose/espaçar intervalos',
      'Idosos (> 75 anos): reduzir dose, considerar intervalo maior e não exceder 300 mg/dia',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao tramadol ou a opioides',
      'Intoxicação aguda por álcool, hipnóticos, analgésicos ou psicotrópicos',
      'Uso atual ou recente (< 14 dias) de IMAO',
      'Epilepsia não controlada',
      'Insuficiência respiratória grave',
    ],
    efeitosAdversos: [
      'Náusea, vômito e tontura (muito comuns)',
      'Sonolência, cefaleia, boca seca',
      'Constipação',
      'Sudorese',
      'Convulsões (sobretudo em doses altas ou com fármacos pró-convulsivantes)',
      'Depressão respiratória (doses altas/associações)',
    ],
    advertencias: [
      'Risco de DEPENDÊNCIA física e psíquica e de síndrome de abstinência — evitar uso prolongado e suspensão abrupta',
      'Risco de CONVULSÃO, especialmente acima de 400 mg/dia ou com antidepressivos, neurolépticos e outros que reduzem o limiar convulsivo',
      'Risco de SÍNDROME SEROTONINÉRGICA com ISRS, IRSN, IMAO e triptanos',
      'Cautela com depressores do SNC (álcool, benzodiazepínicos, opioides) pelo risco de depressão respiratória',
      'Não dirigir/operar máquinas no início do tratamento',
    ],
    gestacaoLactacao:
      'Evitar na gestação (uso prolongado associa-se a síndrome de abstinência neonatal); não recomendado na lactação.',
    interacoes: [
      'ISRS/IRSN/IMAO e triptanos (síndrome serotoninérgica)',
      'Carbamazepina reduz o efeito analgésico',
      'Depressores do SNC e álcool (sedação e depressão respiratória)',
      'Antagonistas/agonistas-antagonistas opioides podem reduzir o efeito',
      'Varfarina (monitorar INR)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Anti-inflamatório (AINE) ──
  {
    id: 'cetoprofeno',
    nome: 'Cetoprofeno',
    principio: 'cetoprofeno',
    sinonimos: [
      'cetoprofeno',
      'ketoprofeno',
      'profenid',
      'aine',
      'anti-inflamatório',
      'analgésico',
    ],
    classe: 'Anti-inflamatórios (AINE)',
    numeroRegistro: '103700776',
    nomesComerciais: ['Profenid®', 'Bi-Profenid®', 'Cetoprofeno genérico'],
    mecanismo:
      'AINE derivado do ácido propiônico; inibe de forma não seletiva a ciclo-oxigenase (COX-1 e COX-2), reduzindo a síntese de prostaglandinas. Efeito analgésico, anti-inflamatório e antipirético.',
    apresentacoes: [
      'Comprimido/cápsula 50 mg e 100 mg',
      'Comprimido de liberação prolongada 150 mg e 200 mg',
      'Solução injetável 100 mg (IM/IV)',
      'Gel tópico 25 mg/g',
      'Supositório 100 mg',
    ],
    usoClinico: [
      'Dor aguda leve a moderada',
      'Processos inflamatórios musculoesqueléticos',
      'Dor pós-operatória',
      'Artrites e osteoartrite',
      'Dismenorreia',
      'Crises de gota',
    ],
    receituario: 'Venda sob prescrição médica (formas orais e injetável).',
    posologia: [
      {
        titulo: 'Adulto — via oral',
        itens: [
          '100 mg 12/12h',
          'Liberação prolongada: 150 mg 12/12h (apresentação dual, ex.: Bi-Profenid®) ou 200 mg 1×/dia',
          'Dose máxima 300 mg/dia',
        ],
      },
      {
        titulo: 'Adulto — IM/IV',
        itens: [
          '100 mg 1–2×/dia (máx. 200 mg/dia)',
          'IV em infusão lenta (20–30 min) diluído em soro; uso hospitalar por curto período',
        ],
      },
      {
        titulo: 'Pediatria',
        itens: [
          'Uso não recomendado de rotina; em geral evitar em < 15 anos por falta de padronização de dose',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência renal leve a moderada: usar menor dose eficaz pelo menor tempo; evitar na DRC avançada (TFG < 30 mL/min)',
      'Hepatopatia: reduzir dose e monitorar',
      'Idoso: iniciar com dose menor pelo maior risco GI, renal e cardiovascular',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao cetoprofeno ou a outros AINE/AAS',
      'Úlcera péptica ativa ou sangramento gastrointestinal',
      'Asma, urticária ou angioedema desencadeados por AINE/AAS',
      'Insuficiência renal grave',
      'Insuficiência hepática grave',
      'Insuficiência cardíaca grave',
      'Terceiro trimestre da gestação',
      'Diátese hemorrágica/sangramento ativo',
    ],
    efeitosAdversos: [
      'Dispepsia, epigastralgia, náusea, diarreia',
      'Úlcera e sangramento gastrointestinal',
      'Elevação de transaminases',
      'Retenção hídrica, edema, hipertensão',
      'Lesão renal aguda (sobretudo em desidratados/idosos)',
      'Tontura, cefaleia',
      'Reações de hipersensibilidade e fotossensibilidade (gel)',
    ],
    advertencias: [
      'Aumenta o risco de eventos cardiovasculares trombóticos (IAM, AVC), especialmente em uso prolongado e em altas doses',
      'Risco de hemorragia digestiva — associar protetor gástrico em pacientes de risco',
      'Evitar em desidratação, uso concomitante de IECA/BRA + diurético (tripla ameaça renal)',
      'Usar a menor dose eficaz pelo menor tempo possível',
    ],
    gestacaoLactacao:
      'Evitar no 1º e 2º trimestres (usar só se claramente necessário); contraindicado no 3º trimestre (fechamento precoce do canal arterial e disfunção renal fetal). Excretado em pequena quantidade no leite — evitar durante a amamentação.',
    interacoes: [
      'Anticoagulantes/antiplaquetários (varfarina, AAS): risco de sangramento',
      'Outros AINE/corticoides: maior toxicidade GI',
      'IECA/BRA e diuréticos: redução do efeito anti-hipertensivo e nefrotoxicidade',
      'Lítio e metotrexato: aumento dos níveis séricos e toxicidade',
      'Ciclosporina/tacrolimo: nefrotoxicidade aditiva',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antialérgico ──
  {
    id: 'cetirizina',
    nome: 'Cetirizina',
    principio: 'cloridrato de cetirizina',
    sinonimos: ['cetirizina', 'zyrtec', 'reactine', 'antialérgico', 'anti-histamínico'],
    classe: 'Antialérgicos',
    numeroRegistro: '103700518',
    nomesComerciais: ['Zyrtec®', 'Reactine®', 'Zetir®', 'Cetirizina genérica'],
    mecanismo:
      'Anti-histamínico H1 de 2ª geração (metabólito da hidroxizina); antagonista seletivo dos receptores H1 periféricos, com baixa penetração no SNC. Início de ação rápido e efeito de 24 h.',
    apresentacoes: ['Comprimido 10 mg', 'Solução oral/gotas 10 mg/mL', 'Xarope 1 mg/mL'],
    usoClinico: [
      'Rinite alérgica sazonal e perene',
      'Urticária crônica espontânea',
      'Conjuntivite alérgica',
      'Prurido associado a quadros alérgicos',
    ],
    receituario: 'Venda sem prescrição.',
    posologia: [
      { titulo: 'Adulto e > 12 anos', itens: ['10 mg 1×/dia (ou 5 mg 12/12h)'] },
      { titulo: 'Crianças 6–12 anos', itens: ['5 mg 12/12h ou 10 mg 1×/dia'] },
      { titulo: 'Crianças 2–6 anos', itens: ['2,5 mg 12/12h ou 5 mg 1×/dia'] },
      { titulo: 'Crianças 6–11 meses', itens: ['2,5 mg 1×/dia'] },
      {
        titulo: 'Crianças 12–23 meses',
        itens: ['2,5 mg 1×/dia, podendo aumentar para 2,5 mg 12/12h'],
      },
    ],
    ajusteDose: [
      'TFG 30–49 mL/min: 5 mg 1×/dia',
      'TFG 10–29 mL/min: 5 mg em dias alternados',
      'Hemodiálise / TFG < 10 mL/min: evitar',
      'Insuficiência hepática isolada: reduzir dose; se associada à renal, ajustar conforme função renal',
    ],
    contraindicacoes: [
      'Hipersensibilidade à cetirizina, à hidroxizina ou a derivados da piperazina',
      'Insuficiência renal terminal (TFG < 10 mL/min)',
    ],
    efeitosAdversos: [
      'Sonolência (mais frequente que loratadina/fexofenadina)',
      'Boca seca',
      'Cefaleia, fadiga',
      'Tontura',
      'Dor abdominal (em crianças)',
      'Raramente: prurido intenso na suspensão abrupta após uso prolongado',
    ],
    advertencias: [
      'Pode causar sonolência — cautela ao dirigir ou operar máquinas, sobretudo no início e com álcool',
      'Menos sedativa que anti-histamínicos de 1ª geração, porém mais sedativa que loratadina e fexofenadina',
      'Suspender 3 dias antes de testes alérgicos cutâneos',
    ],
    gestacaoLactacao:
      'Dados sugerem segurança razoável; usar apenas se necessário, preferindo após avaliação. Excretada no leite materno — evitar ou usar com cautela durante a amamentação.',
    interacoes: [
      'Álcool e depressores do SNC: potencialização da sedação',
      'Teofilina (altas doses): pode reduzir discretamente a depuração da cetirizina',
      'Baixo potencial de interação por não depender de forma relevante do CYP450',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Respiratório (antileucotrieno) ──
  {
    id: 'montelucaste',
    nome: 'Montelucaste',
    principio: 'montelucaste de sódio',
    sinonimos: ['montelucaste', 'montelukast', 'singulair', 'antileucotrieno', 'respiratório'],
    classe: 'Respiratórios',
    numeroRegistro: '109740335',
    nomesComerciais: ['Singulair®', 'Montelair®', 'Piemonte®', 'Montelucaste genérico'],
    mecanismo:
      'Antagonista seletivo do receptor de cisteinil-leucotrieno CysLT1. Bloqueia a ação dos leucotrienos (LTC4, LTD4, LTE4), reduzindo broncoconstrição, inflamação eosinofílica, edema e hipersecreção das vias aéreas.',
    apresentacoes: [
      'Comprimido revestido 10 mg',
      'Comprimido mastigável 4 mg e 5 mg',
      'Granulado/sachê 4 mg',
    ],
    usoClinico: [
      'Profilaxia e tratamento crônico da asma (terapia adicional ou alternativa)',
      'Broncoespasmo induzido por exercício',
      'Rinite alérgica sazonal e perene',
      'Asma com rinite alérgica concomitante',
    ],
    receituario: 'Venda sob prescrição médica.',
    posologia: [
      { titulo: 'Adulto e adolescentes ≥ 15 anos', itens: ['10 mg 1×/dia, à noite'] },
      { titulo: 'Crianças 6–14 anos', itens: ['5 mg (mastigável) 1×/dia, à noite'] },
      { titulo: 'Crianças 2–5 anos', itens: ['4 mg (mastigável ou granulado) 1×/dia, à noite'] },
      {
        titulo: 'Broncoespasmo induzido por exercício',
        itens: [
          'Dose habitual diária; não usar dose adicional antes do exercício se já em uso crônico',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência hepática leve a moderada: sem ajuste de rotina',
      'Insuficiência renal: sem ajuste necessário (eliminação predominantemente biliar)',
    ],
    contraindicacoes: ['Hipersensibilidade ao montelucaste ou aos componentes da fórmula'],
    efeitosAdversos: [
      'Cefaleia',
      'Dor abdominal, diarreia, náusea',
      'Infecções de vias aéreas superiores',
      'Eventos neuropsiquiátricos: alterações de humor, irritabilidade, ansiedade, insônia, pesadelos, depressão e ideação suicida',
      'Raramente: síndrome de Churg-Strauss (vasculite eosinofílica), em geral ao reduzir corticoide',
    ],
    advertencias: [
      'Alerta de segurança (ANVISA/FDA — tarja preta): risco de eventos neuropsiquiátricos graves, incluindo comportamento suicida; orientar paciente/cuidador a relatar mudanças de humor ou comportamento e reavaliar o uso',
      'Não indicado para o tratamento da crise aguda de asma/broncoespasmo — manter broncodilatador de resgate',
      'Não substitui corticoide inalatório quando este é indicado',
    ],
    gestacaoLactacao:
      'Pode ser usado na gestação se o benefício justificar; manter o controle da asma é prioritário. Provável excreção no leite — usar com cautela durante a amamentação.',
    interacoes: [
      'Indutores potentes do CYP (fenobarbital, fenitoína, rifampicina): podem reduzir os níveis de montelucaste',
      'Gemfibrozila: pode aumentar a exposição ao montelucaste',
      'Em geral, baixo potencial de interações clinicamente relevantes',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Hematínicos e suplementos ──
  {
    id: 'sulfato-ferroso',
    nome: 'Sulfato ferroso',
    principio: 'sulfato ferroso',
    sinonimos: [
      'sulfato ferroso',
      'ferro',
      'hematínico',
      'anemia ferropriva',
      'reposição de ferro',
    ],
    classe: 'Hematínicos e suplementos',
    numeroRegistro: '138410004',
    nomesComerciais: ['Sulfato Ferroso genérico', 'Neutrofer®', 'Combiron®'],
    mecanismo:
      'Sal de ferro (ferro ferroso, Fe²⁺) usado na reposição de ferro. O ferro absorvido é incorporado à hemoglobina, mioglobina e enzimas, restaurando a eritropoese deficiente na anemia por carência de ferro.',
    apresentacoes: [
      'Comprimido revestido 40 mg de ferro elementar (≈ 200 mg de sulfato ferroso seco)',
      'Solução oral/gotas 25 mg de Fe²⁺/mL',
      'Xarope 25 mg de Fe²⁺/5 mL',
    ],
    usoClinico: [
      'Tratamento da anemia ferropriva',
      'Profilaxia da deficiência de ferro na gestação e lactação',
      'Profilaxia na infância (lactentes e pré-escolares) e em prematuros',
      'Reposição em perdas crônicas (menstruação abundante, sangramento GI)',
    ],
    receituario:
      'Venda sem prescrição (suplemento); reposição terapêutica preferencialmente sob orientação.',
    posologia: [
      {
        titulo: 'Adulto — tratamento',
        itens: [
          '100–200 mg de ferro elementar/dia, divididos em 1–3 tomadas',
          'Tendência atual: dose única diária ou em dias alternados pode melhorar a absorção e a tolerância',
        ],
      },
      {
        titulo: 'Gestante — profilaxia',
        itens: ['40–60 mg de ferro elementar/dia, geralmente a partir do 2º trimestre'],
      },
      {
        titulo: 'Pediatria — tratamento',
        itens: ['3–6 mg de ferro elementar/kg/dia, divididos em 1–3 tomadas (máx. ~120 mg/dia)'],
      },
      {
        titulo: 'Pediatria — profilaxia',
        itens: ['1–2 mg de ferro elementar/kg/dia conforme idade/risco (lactentes e prematuros)'],
      },
      {
        titulo: 'Administração',
        itens: [
          'Preferir com o estômago vazio (1 h antes ou 2 h após refeições)',
          'Associar fonte de vitamina C (suco de laranja) melhora a absorção',
          'Manter o tratamento por 2–3 meses após a normalização da hemoglobina para repor os estoques',
        ],
      },
    ],
    ajusteDose: [
      'Intolerância GI: reduzir a dose, fracionar, tomar junto às refeições ou usar em dias alternados',
      'DRC com anemia: muitas vezes requer ferro endovenoso e/ou agente estimulador da eritropoese',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao sal de ferro',
      'Sobrecarga de ferro (hemocromatose, hemossiderose)',
      'Anemias não ferroprivas (ex.: hemolíticas, talassemia) sem deficiência de ferro comprovada',
      'Esofagite, estenose esofágica ou doença ulcerosa GI ativa (cautela)',
    ],
    efeitosAdversos: [
      'Constipação intestinal',
      'Náusea, epigastralgia, pirose',
      'Diarreia',
      'Fezes escuras/enegrecidas (esperado, sem significado patológico)',
      'Escurecimento dos dentes com a solução oral (diluir e usar canudo)',
      'Risco de toxicidade aguda grave em superdosagem, sobretudo em crianças',
    ],
    advertencias: [
      'A intoxicação acidental por ferro é uma causa importante de óbito por intoxicação em crianças — manter fora do alcance',
      'Distinguir as fezes escuras do ferro de melena (sangramento)',
      'Reavaliar a resposta com hemograma/ferritina; investigar a causa da ferropenia (perda crônica)',
    ],
    gestacaoLactacao:
      'Seguro e indicado na gestação e na lactação para tratamento e profilaxia da deficiência de ferro, nas doses recomendadas.',
    interacoes: [
      'Reduz a absorção de levotiroxina, quinolonas, tetraciclinas, bifosfonatos e levodopa — espaçar ≥ 2 h',
      'Antiácidos, inibidores de bomba de prótons, cálcio e laticínios reduzem a absorção do ferro',
      'Chá, café e alimentos ricos em fitatos/cálcio diminuem a absorção — espaçar das tomadas',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ═══════════════════════ Lote 6 ═══════════════════════
  // ── Cardiovascular (BCC, anticoagulante, digitálico) ──
  {
    id: 'nifedipino',
    nome: 'Nifedipino',
    principio: 'nifedipino',
    sinonimos: ['nifedipino', 'adalat', 'oros', 'bloqueador de cálcio', 'anti-hipertensivo'],
    classe: 'Cardiovascular e anti-hipertensivos',
    numeroRegistro: '109170034',
    nomesComerciais: ['Adalat® Retard', 'Adalat® Oros', 'Cardalin®', 'Nifedipino genérico'],
    mecanismo:
      'Bloqueador dos canais de cálcio diidropiridínico: inibe o influxo de cálcio na musculatura lisa vascular, promovendo vasodilatação arterial periférica e coronariana, com redução da resistência vascular sistêmica e da pós-carga.',
    apresentacoes: [
      'Comprimido de liberação prolongada (retard) 10 mg e 20 mg',
      'Comprimido OROS (liberação osmótica) 20 mg, 30 mg e 60 mg',
      'Cápsula de liberação rápida 10 mg (uso restrito)',
    ],
    usoClinico: [
      'Hipertensão arterial sistêmica',
      'Angina estável e angina vasoespástica (Prinzmetal)',
      'Fenômeno de Raynaud',
      'Hipertensão na gestação (formas retard/LP)',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto (retard / liberação prolongada)',
        itens: [
          'Retard: 20 mg 12/12h (10–40 mg 2x/dia)',
          'OROS: 30–60 mg 1x/dia, máximo 90 mg/dia',
          'Preferir SEMPRE formas retard/LP',
        ],
      },
      {
        titulo: 'Angina',
        itens: ['Mesma faixa de dose das formas LP', 'Titular conforme controle e tolerância'],
      },
      {
        titulo: 'Atenção',
        itens: [
          'NÃO usar cápsula de liberação rápida sublingual em emergência/urgência hipertensiva (risco de hipotensão abrupta, isquemia, AVC)',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência hepática: reduzir dose e titular com cautela',
      'Sem ajuste renal de rotina',
      'Idosos: iniciar com doses menores',
    ],
    contraindicacoes: [
      'Hipersensibilidade às diidropiridinas',
      'Choque cardiogênico',
      'Estenose aórtica grave',
      'Angina instável ou IAM (formas de liberação rápida)',
      'Hipotensão grave (PAS < 90 mmHg)',
    ],
    efeitosAdversos: [
      'Edema de membros inferiores (frequente, dose-dependente)',
      'Cefaleia',
      'Rubor facial (flushing)',
      'Taquicardia reflexa e palpitações',
      'Tontura',
      'Hipertrofia gengival (uso prolongado)',
    ],
    advertencias: [
      'Evitar suco de toranja (grapefruit) — aumenta níveis séricos',
      'Suspensão abrupta pode precipitar angina',
      'Edema de MMII não responde a diuréticos (é vasogênico)',
    ],
    gestacaoLactacao:
      'Nifedipino retard é opção aceita para HAS na gestação. Compatível com a amamentação.',
    interacoes: [
      'Suco de toranja e inibidores do CYP3A4 (cetoconazol, claritromicina): aumentam o efeito',
      'Betabloqueadores: potencializam hipotensão/depressão miocárdica',
      'Rifampicina (indutor CYP3A4): reduz o efeito',
      'Outros anti-hipertensivos: efeito hipotensor aditivo',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'apixabana',
    nome: 'Apixabana',
    principio: 'apixabana',
    sinonimos: ['apixabana', 'eliquis', 'doac', 'anticoagulante oral', 'inibidor do fator xa'],
    classe: 'Cardiovascular e anti-hipertensivos',
    numeroRegistro: '101180658',
    nomesComerciais: ['Eliquis®'],
    mecanismo:
      'Anticoagulante oral direto (DOAC): inibidor seletivo e reversível do fator Xa, bloqueando a geração de trombina e a formação do trombo. Não requer monitorização rotineira da coagulação.',
    apresentacoes: ['Comprimido revestido 2,5 mg', 'Comprimido revestido 5 mg'],
    usoClinico: [
      'Prevenção de AVC e embolia sistêmica na fibrilação atrial não valvar',
      'Tratamento de TVP e TEP',
      'Prevenção de recorrência de TVP/TEP',
      'Profilaxia de TEV após artroplastia de quadril ou joelho',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Fibrilação atrial não valvar',
        itens: [
          '5 mg 12/12h',
          'Reduzir para 2,5 mg 12/12h se ≥ 2 dos 3 critérios: idade ≥ 80 anos, peso ≤ 60 kg, creatinina ≥ 1,5 mg/dL',
        ],
      },
      {
        titulo: 'TVP / TEP (tratamento)',
        itens: ['10 mg 12/12h por 7 dias', 'Seguido de 5 mg 12/12h'],
      },
      { titulo: 'Prevenção de recorrência (após ≥ 6 meses)', itens: ['2,5 mg 12/12h'] },
      {
        titulo: 'Profilaxia de TEV (ortopedia)',
        itens: ['2,5 mg 12/12h, iniciar 12–24h após a cirurgia'],
      },
    ],
    ajusteDose: [
      'Ver critérios de redução para FA (idade/peso/creatinina)',
      'ClCr 15–29 mL/min: usar com cautela',
      'Evitar se ClCr < 15 mL/min ou em diálise (dados limitados)',
      'Insuficiência hepática grave (Child-Pugh C): contraindicado',
    ],
    contraindicacoes: [
      'Sangramento ativo clinicamente significativo',
      'Hipersensibilidade',
      'Prótese valvar mecânica',
      'Estenose mitral moderada a grave / FA valvar',
      'Hepatopatia com coagulopatia',
      'Gestação e lactação',
    ],
    efeitosAdversos: [
      'Sangramento (principal): hematomas, epistaxe, sangramento gastrointestinal e geniturinário',
      'Anemia',
      'Náusea',
      'Elevação de transaminases',
    ],
    advertencias: [
      'Suspender 24–48h antes de procedimentos conforme risco hemorrágico',
      'Antídoto específico: andexanet alfa (quando disponível); considerar complexo protrombínico',
      'Não realizar punção neuroaxial sem respeitar intervalo de segurança (risco de hematoma espinhal)',
      'Não trocar abruptamente por/de outro anticoagulante sem protocolo',
    ],
    gestacaoLactacao:
      'Contraindicado na gestação e na lactação (risco hemorrágico fetal/neonatal e excreção no leite).',
    interacoes: [
      'Inibidores potentes de CYP3A4 e da glicoproteína-P (cetoconazol, itraconazol, ritonavir): aumentam o sangramento',
      'Indutores potentes (rifampicina, fenitoína, carbamazepina): reduzem eficácia',
      'AAS, AINEs, outros anticoagulantes/antiagregantes: somam risco de sangramento',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'digoxina',
    nome: 'Digoxina',
    principio: 'digoxina',
    sinonimos: ['digoxina', 'digitálico', 'cardiotônico', 'lanoxin'],
    classe: 'Cardiovascular e anti-hipertensivos',
    numeroRegistro: '103700665',
    nomesComerciais: ['Digoxina® (genérico)', 'Lanoxin®'],
    mecanismo:
      'Glicosídeo digitálico: inibe a bomba Na+/K+-ATPase, aumentando o cálcio intracelular e a contratilidade miocárdica (efeito inotrópico positivo). Aumenta o tônus vagal, reduzindo a condução pelo nó atrioventricular (efeito cronotrópico/dromotrópico negativo).',
    apresentacoes: [
      'Comprimido 0,25 mg',
      'Elixir/solução oral 0,05 mg/mL',
      'Solução injetável 0,25 mg/mL',
    ],
    usoClinico: [
      'Insuficiência cardíaca com fração de ejeção reduzida (sintomática, como adjuvante)',
      'Controle de frequência ventricular na fibrilação/flutter atrial',
    ],
    receituario: 'Venda sob prescrição (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto (manutenção)',
        itens: [
          '0,125–0,25 mg/dia VO',
          'Idosos e DRC: 0,0625–0,125 mg/dia',
          'Nível sérico alvo: 0,5–0,9 ng/mL',
        ],
      },
      {
        titulo: 'Digitalização (quando indicada)',
        itens: [
          'Dose de ataque IV/VO conforme protocolo, fracionada',
          'Reavaliar com frequência e nível sérico',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência renal: reduzir dose e/ou espaçar (eliminação renal)',
      'Idosos: doses menores (massa magra e clearance reduzidos)',
      'Corrigir distúrbios eletrolíticos antes/durante o uso',
      'Índice terapêutico ESTREITO — monitorar nível sérico, ECG e função renal',
    ],
    contraindicacoes: [
      'Bloqueio atrioventricular de 2º ou 3º grau sem marca-passo',
      'Fibrilação atrial em pré-excitação (Wolff-Parkinson-White)',
      'Cardiomiopatia hipertrófica obstrutiva',
      'Toxicidade digitálica',
      'Taquicardia/fibrilação ventricular',
    ],
    efeitosAdversos: [
      'Náusea, vômito, anorexia (precoces na intoxicação)',
      'Distúrbios visuais: visão amarelada (xantopsia), halos',
      'Arritmias (extrassístoles, bloqueios, taquiarritmias)',
      'Confusão, fadiga, cefaleia',
      'Ginecomastia (uso crônico)',
    ],
    advertencias: [
      'Toxicidade favorecida por hipocalemia, hipomagnesemia, hipercalcemia e insuficiência renal',
      'Antídoto na intoxicação grave: fragmentos Fab antidigoxina',
      'Sinais de toxicidade exigem suspensão e dosagem do nível sérico',
      'Corrigir potássio e magnésio reduz risco de arritmias',
    ],
    gestacaoLactacao:
      'Pode ser usada na gestação quando necessário (experiência clínica favorável). Compatível com a amamentação.',
    interacoes: [
      'Amiodarona, verapamil, quinidina, propafenona: elevam o nível de digoxina (reduzir a dose)',
      'Diuréticos espoliadores de potássio (tiazídicos, de alça): hipocalemia aumenta toxicidade',
      'Betabloqueadores e verapamil: bradicardia/BAV aditivos',
      'Claritromicina: aumenta níveis séricos',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antibióticos ──
  {
    id: 'ceftriaxona',
    nome: 'Ceftriaxona (sódica)',
    principio: 'ceftriaxona sódica',
    sinonimos: ['ceftriaxona', 'rocefin', 'cefalosporina', 'antibiótico'],
    classe: 'Antibióticos',
    numeroRegistro: '174200016',
    nomesComerciais: ['Rocefin®', 'Triaxton®', 'Ceftriaxona genérica'],
    mecanismo:
      'Cefalosporina de 3ª geração: inibe a síntese da parede celular bacteriana ao se ligar às proteínas ligadoras de penicilina (PBPs). Amplo espectro contra Gram-negativos e boa penetração no líquor.',
    apresentacoes: ['Pó para solução injetável 250 mg, 500 mg e 1 g (IV/IM)'],
    usoClinico: [
      'Pneumonia comunitária',
      'Pielonefrite e infecções urinárias complicadas',
      'Meningite bacteriana',
      'Sepse / infecções de corrente sanguínea',
      'Gonorreia',
      'Infecções intra-abdominais e de pele/partes moles (em esquemas combinados)',
    ],
    receituario: 'Venda sob prescrição com retenção de receita (antimicrobiano — RDC 471/2021).',
    posologia: [
      {
        titulo: 'Adulto',
        itens: [
          '1–2 g IV/IM 1x/dia (ou fracionado 12/12h)',
          'Meningite: 2 g 12/12h IV',
          'Gonorreia não complicada: 500 mg IM dose única (1 g se peso ≥ 150 kg), associar tratamento para clamídia',
        ],
      },
      {
        titulo: 'Pediatria',
        itens: [
          '50–100 mg/kg/dia (máximo 2 g/dia, exceto meningite)',
          'Meningite: 100 mg/kg/dia (máximo 4 g/dia)',
        ],
      },
      {
        titulo: 'Diluição / administração',
        itens: [
          'Reconstituir conforme via (IM com lidocaína 1% reduz a dor; IV diluir e infundir em 30 min)',
          'O diluente com lidocaína NUNCA pode ser administrado por via IV (contraindicado em < 2 anos e em alérgicos a anestésico amida)',
          'NÃO administrar simultaneamente nem na mesma linha com soluções contendo cálcio (ex.: Ringer lactato)',
        ],
      },
    ],
    ajusteDose: [
      'Sem ajuste renal de rotina (eliminação biliar e renal)',
      'Insuficiência renal + hepática combinadas: não exceder 2 g/dia e monitorar',
      'Sem necessidade de ajuste em hemodiálise de rotina',
    ],
    contraindicacoes: [
      'Hipersensibilidade a cefalosporinas',
      'Reação anafilática prévia a penicilinas (alergia cruzada)',
      'Neonatos ≤ 28 dias que recebam (ou possam vir a receber) soluções IV com cálcio — contraindicada independentemente da linha ou do intervalo (precipitação ceftriaxona-cálcio fatal)',
      'Neonatos com hiperbilirrubinemia (deslocamento da bilirrubina)',
    ],
    efeitosAdversos: [
      'Reações no local da injeção (dor IM, flebite IV)',
      'Diarreia, náusea',
      'Rash cutâneo, reações de hipersensibilidade',
      'Colite por Clostridioides difficile',
      'Pseudolitíase biliar (lama biliar, geralmente reversível)',
      'Alterações hematológicas e elevação de transaminases',
    ],
    advertencias: [
      'NUNCA misturar com soluções contendo cálcio — precipitação ceftriaxona-cálcio, fatal em neonatos',
      'Risco de reação cruzada com penicilinas (investigar alergia)',
      'Uso prolongado: risco de superinfecção e colite por C. difficile',
      'Considerar reposição de vitamina K em pacientes de risco (raro)',
    ],
    gestacaoLactacao:
      'Pode ser usada na gestação quando necessário (amplamente utilizada). Compatível com a amamentação (excreção mínima no leite).',
    interacoes: [
      'Soluções/produtos contendo cálcio (Ringer lactato, nutrição parenteral): precipitação — não coadministrar',
      'Anticoagulantes orais: pode potencializar efeito (monitorar)',
      'Aminoglicosídeos: sinergia antimicrobiana, porém administrar separadamente (incompatibilidade física)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'clindamicina',
    nome: 'Clindamicina',
    principio: 'cloridrato/fosfato de clindamicina',
    sinonimos: ['clindamicina', 'dalacin', 'lincosamida'],
    classe: 'Antibióticos',
    nomesComerciais: ['Dalacin C®', 'Clindacin®'],
    mecanismo:
      'Antibiótico lincosamida: liga-se à subunidade ribossomal 50S e inibe a síntese proteica bacteriana. Ação predominantemente bacteriostática (bactericida em altas concentrações). Boa atividade contra cocos Gram-positivos e anaeróbios.',
    apresentacoes: [
      'Cápsula 150 mg e 300 mg',
      'Solução injetável 150 mg/mL (ampola 2 mL e 4 mL)',
      'Gel/solução tópica 1%',
      'Creme vaginal 2%',
    ],
    usoClinico: [
      'Infecções de pele e partes moles (incluindo por S. aureus, inclusive MRSA comunitário sensível)',
      'Infecções odontogênicas e orofaríngeas',
      'Infecções por anaeróbios (intra-abdominais, ginecológicas) em esquema combinado',
      'Pneumonia aspirativa e abscesso pulmonar',
      'Alternativa em alérgicos à penicilina',
      'Adjuvante (antitoxina) em infecções graves por Streptococcus/Clostridium',
    ],
    receituario:
      'Venda sob prescrição médica (antimicrobiano — retenção de receita conforme RDC de antimicrobianos).',
    posologia: [
      { titulo: 'Adulto — VO', itens: ['150–450 mg a cada 6 h (habitual 300 mg 6/6h)'] },
      {
        titulo: 'Adulto — IV/IM',
        itens: ['600–900 mg a cada 8 h', 'Infecções graves: até 2.700 mg/dia divididos'],
      },
      {
        titulo: 'Pediátrico',
        itens: [
          'VO: 8–25 mg/kg/dia divididos a cada 6–8 h',
          'IV/IM: 20–40 mg/kg/dia divididos a cada 6–8 h',
        ],
      },
    ],
    ajusteDose: [
      'Sem ajuste relevante na insuficiência renal',
      'Cautela na insuficiência hepática grave (metabolismo hepático)',
    ],
    contraindicacoes: [
      'Hipersensibilidade à clindamicina ou lincomicina',
      'História de colite associada a antibiótico',
    ],
    efeitosAdversos: [
      'Diarreia',
      'Colite por Clostridioides difficile / colite pseudomembranosa (risco característico, pode ser grave)',
      'Náuseas, dor abdominal, gosto metálico',
      'Elevação de transaminases',
      'Rash, reações de hipersensibilidade',
      'Dor/flebite no local da infusão',
    ],
    advertencias: [
      'Suspender e investigar diarreia importante ou com sangue durante/após o uso (C. difficile)',
      'Não usar antidiarreicos que reduzam o peristaltismo se houver suspeita de colite',
      'Infundir IV diluído e lentamente (evitar bólus rápido — risco de parada cardíaca)',
    ],
    gestacaoLactacao:
      'Pode ser usada na gestação quando necessário. É excretada no leite — usar com cautela na amamentação (monitorar diarreia/candidíase no lactente).',
    interacoes: [
      'Bloqueadores neuromusculares (potencializa o bloqueio)',
      'Antagonismo in vitro com macrolídeos (eritromicina) — evitar associação',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Antivirais ──
  {
    id: 'aciclovir',
    nome: 'Aciclovir',
    principio: 'aciclovir',
    sinonimos: ['aciclovir', 'acyclovir', 'zovirax', 'antiviral herpes'],
    classe: 'Antivirais',
    numeroRegistro: '155840323',
    nomesComerciais: ['Zovirax®', 'Aciclovir genérico'],
    mecanismo:
      'Análogo de nucleosídeo da guanosina: ativado por fosforilação pela timidina-quinase viral e inibe a DNA-polimerase viral, bloqueando a replicação do DNA. Atua sobre herpes-simples (HSV-1/2) e varicela-zóster (VZV).',
    apresentacoes: [
      'Comprimido 200 mg e 400 mg',
      'Suspensão oral 200 mg/5 mL',
      'Pó liofilizado para injeção 250 mg',
      'Creme 5%',
      'Pomada oftálmica 3%',
    ],
    usoClinico: [
      'Herpes simples cutâneo-mucoso e genital (tratamento e supressão de recorrências)',
      'Herpes labial',
      'Varicela e herpes-zóster',
      'Encefalite herpética (IV)',
      'Infecções herpéticas graves ou em imunossuprimidos (IV)',
    ],
    receituario: 'Venda sob prescrição médica (tarja vermelha).',
    posologia: [
      {
        titulo: 'Herpes simples — VO',
        itens: ['200 mg 5×/dia por 5–10 dias', 'ou 400 mg 8/8h', 'Supressão: 400 mg 12/12h'],
      },
      {
        titulo: 'Herpes-zóster — VO',
        itens: ['800 mg 5×/dia por 7 dias (iniciar nas primeiras 72 h)'],
      },
      {
        titulo: 'Infecção grave / encefalite — IV',
        itens: [
          '5–10 mg/kg a cada 8 h (10 mg/kg na encefalite/zóster do imunossuprimido) por 7–21 dias',
          'Infundir em ≥ 1 h, com boa hidratação',
        ],
      },
      {
        titulo: 'Pediátrico',
        itens: [
          'Varicela VO: 20 mg/kg/dose (máx 800 mg) 6/6h por 5 dias',
          'IV: dose conforme peso/superfície e gravidade',
        ],
      },
    ],
    ajusteDose: [
      'Ajuste renal importante conforme ClCr — reduzir dose e/ou aumentar intervalo (grades distintas para VO e IV)',
      'VO: ClCr 10–25 mL/min espaçar para 12/12h–24/24h; ClCr < 10 mL/min reduzir dose ~50% e administrar 24/24h',
      'IV alta dose (10 mg/kg): ClCr 25–50 → 8/8h; ClCr 10–25 → 12/12h; ClCr < 10 → metade da dose 24/24h',
      'Hemodiálise: dose após a sessão',
    ],
    contraindicacoes: ['Hipersensibilidade ao aciclovir ou valaciclovir'],
    efeitosAdversos: [
      'Náuseas, vômitos, diarreia, cefaleia',
      'Nefrotoxicidade por cristalúria (especialmente IV em bólus ou desidratado)',
      'Neurotoxicidade (confusão, alucinação, tremor, mioclonia), sobretudo em idoso e DRC',
      'Elevação de ureia/creatinina e transaminases',
      'Flebite no local da infusão',
    ],
    advertencias: [
      'Manter hidratação adequada e infusão lenta para evitar precipitação tubular e nefrotoxicidade',
      'Ajustar dose na disfunção renal e monitorar função renal',
      'Maior risco de neurotoxicidade no idoso e na doença renal crônica',
    ],
    gestacaoLactacao:
      'Pode ser usado na gestação quando o benefício justifica (experiência consolidada com HSV/VZV). É excretado no leite, mas considerado compatível com a amamentação nas doses usuais.',
    interacoes: [
      'Probenecida e cimetidina (reduzem a excreção renal, elevam níveis)',
      'Outros nefrotóxicos (efeito aditivo)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Psiquiátricos e sistema nervoso ──
  {
    id: 'diazepam',
    nome: 'Diazepam',
    principio: 'diazepam',
    sinonimos: ['diazepam', 'valium', 'benzodiazepínico'],
    classe: 'Psiquiátricos e sistema nervoso',
    numeroRegistro: '102980008',
    nomesComerciais: ['Valium®', 'Compaz®', 'Diazepam genérico'],
    mecanismo:
      'Benzodiazepínico de ação longa: potencializa a ação inibitória do GABA no receptor GABA-A, aumentando a frequência de abertura do canal de cloreto. Efeitos ansiolítico, anticonvulsivante, miorrelaxante e sedativo-hipnótico.',
    apresentacoes: ['Comprimido 5 mg e 10 mg', 'Solução injetável 5 mg/mL (ampola 2 mL)'],
    usoClinico: [
      'Ansiedade e agitação (curto prazo)',
      'Crise convulsiva e estado de mal epiléptico',
      'Abstinência alcoólica',
      'Espasmo e espasticidade muscular',
      'Sedação pré-procedimento e em medicação pré-anestésica',
    ],
    receituario: 'Receituário de controle especial (lista B1 — receita azul/B), em 2 vias.',
    posologia: [
      { titulo: 'Ansiedade — VO (adulto)', itens: ['2–10 mg 2–4×/dia conforme intensidade'] },
      {
        titulo: 'Crise convulsiva / estado de mal',
        itens: [
          '5–10 mg IV lento (≤ 5 mg/min), repetível a cada 10–15 min (máx ~30 mg)',
          'Via retal: 0,2–0,5 mg/kg quando sem acesso venoso',
        ],
      },
      {
        titulo: 'Abstinência alcoólica',
        itens: ['10 mg 6/6h–8/8h no início, com redução progressiva'],
      },
      {
        titulo: 'Idoso / debilitado',
        itens: ['Iniciar com 2–2,5 mg 1–2×/dia (maior sensibilidade)'],
      },
    ],
    ajusteDose: [
      'Reduzir dose no idoso e na insuficiência hepática (acúmulo de metabólitos ativos)',
      'Cautela na insuficiência renal',
    ],
    contraindicacoes: [
      'Hipersensibilidade a benzodiazepínicos',
      'Insuficiência respiratória grave',
      'Apneia do sono grave',
      'Miastenia gravis',
      'Insuficiência hepática grave',
      'Glaucoma de ângulo fechado agudo',
    ],
    efeitosAdversos: [
      'Sonolência, sedação, ataxia, tontura',
      'Depressão respiratória (sobretudo IV e associado a opioides/álcool)',
      'Confusão e quedas no idoso',
      'Amnésia anterógrada',
      'Dependência e síndrome de abstinência no uso prolongado',
      'Reação paradoxal (agitação)',
    ],
    advertencias: [
      'Risco de depressão respiratória e morte quando combinado a opioides, álcool ou outros depressores do SNC',
      'Cautela no idoso e no portador de DPOC',
      'Evitar suspensão abrupta após uso prolongado (desmame gradual)',
      'Pode prejudicar a direção e a operação de máquinas',
      'IV lento e com suporte ventilatório disponível',
    ],
    gestacaoLactacao:
      'Evitar na gestação (risco fetal; uso próximo ao parto pode causar hipotonia e depressão respiratória neonatal). É excretado no leite — não recomendado na amamentação.',
    interacoes: [
      'Opioides (depressão respiratória — associação de risco)',
      'Álcool e outros depressores do SNC',
      'Inibidores do CYP3A4 (cetoconazol, fluconazol — aumentam níveis)',
      'Cimetidina (reduz depuração)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'haloperidol',
    nome: 'Haloperidol',
    principio: 'haloperidol',
    sinonimos: ['haloperidol', 'haldol'],
    classe: 'Psiquiátricos e sistema nervoso',
    numeroRegistro: '104971208',
    nomesComerciais: ['Haldol®', 'Haldol Decanoato®'],
    mecanismo:
      'Antipsicótico típico (butirofenona): antagonista potente dos receptores dopaminérgicos D2, sobretudo na via mesolímbica; o bloqueio nigroestriatal explica os efeitos extrapiramidais.',
    apresentacoes: [
      'Comprimido 1 mg e 5 mg',
      'Solução oral (gotas) 2 mg/mL',
      'Solução injetável 5 mg/mL (IM/IV)',
      'Decanoato 50 mg/mL e 70,52 mg/mL (IM de depósito)',
    ],
    usoClinico: [
      'Esquizofrenia e outras psicoses',
      'Agitação psicomotora grave',
      'Delirium hiperativo refratário a medidas não farmacológicas',
      'Náusea e vômito (uso off-label, paliativos)',
      'Síndrome de Tourette/tiques graves',
    ],
    receituario: 'Venda sob prescrição com retenção de receita (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto — psicose (VO)',
        itens: [
          'Início 0,5–5 mg 2–3x/dia',
          'Manutenção: menor dose eficaz',
          'Idoso: iniciar 0,25–0,5 mg (frações < 1 mg pela solução oral 2 mg/mL — o comprimido é de 1 e 5 mg)',
        ],
      },
      {
        titulo: 'Agitação aguda (IM)',
        itens: [
          '2,5–5 mg IM, repetir conforme resposta',
          'Idoso/delirium: 0,5–1 mg',
          'Monitorar sinais vitais e nível de consciência',
        ],
      },
      {
        titulo: 'Decanoato (manutenção)',
        itens: ['Dose mensal ≈ 10–15x a dose oral diária, IM profundo', 'Ajustar a cada 4 semanas'],
      },
    ],
    ajusteDose: [
      'Idoso e debilitados: iniciar com metade da dose',
      'Insuficiência hepática: usar com cautela e doses menores',
      'Sem ajuste renal formal de rotina',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao haloperidol',
      'Estado comatoso ou depressão grave do SNC',
      'Doença de Parkinson e demência por corpos de Lewy',
      'QT longo conhecido, arritmias ventriculares, bradicardia significativa',
    ],
    efeitosAdversos: [
      'Sintomas extrapiramidais (parkinsonismo, acatisia, distonia aguda)',
      'Discinesia tardia (uso prolongado)',
      'Prolongamento do intervalo QT, torsades de pointes',
      'Síndrome neuroléptica maligna (rigidez, hipertermia, ↑ CPK, disautonomia)',
      'Sedação, hipotensão, hiperprolactinemia',
    ],
    advertencias: [
      'Idoso com demência: aumento do risco de morte e de eventos cerebrovasculares — evitar',
      'Distonia aguda: tratar com biperideno/prometazina',
      'Corrigir hipocalemia/hipomagnesemia antes do uso; monitorar ECG em dose alta ou IV',
      'Suspender se suspeita de síndrome neuroléptica maligna',
    ],
    gestacaoLactacao:
      'Usar apenas se o benefício justificar; recém-nascido exposto no 3º trimestre pode apresentar sintomas extrapiramidais/abstinência. Excretado no leite — evitar a amamentação.',
    interacoes: [
      'Outros prolongadores de QT (azitromicina, ondansetrona, metadona)',
      'Depressores do SNC e álcool (potencializa sedação)',
      'Levodopa/agonistas dopaminérgicos (antagonismo mútuo)',
      'Indutores enzimáticos (carbamazepina) reduzem níveis',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  {
    id: 'acido-valproico',
    nome: 'Ácido valproico (valproato de sódio / divalproato)',
    principio: 'ácido valproico',
    sinonimos: [
      'acido valproico',
      'valproato',
      'valproato de sodio',
      'divalproato',
      'divalproato de sodio',
      'depakene',
      'depakote',
    ],
    classe: 'Psiquiátricos e sistema nervoso',
    numeroRegistro: '105250018',
    nomesComerciais: ['Depakene®', 'Depakote®', 'Torval®'],
    mecanismo:
      'Anticonvulsivante de amplo espectro: aumenta a disponibilidade de GABA, bloqueia canais de sódio voltagem-dependentes e modula canais de cálcio tipo T, reduzindo a hiperexcitabilidade neuronal.',
    apresentacoes: [
      'Comprimido/cápsula 250 mg e 500 mg',
      'Comprimido de liberação prolongada (divalproato) 250 mg e 500 mg',
      'Xarope/solução oral 50 mg/mL',
      'Solução injetável 100 mg/mL',
    ],
    usoClinico: [
      'Epilepsia (crises generalizadas, ausências, mioclônicas e focais)',
      'Transtorno afetivo bipolar (mania aguda e manutenção)',
      'Profilaxia da enxaqueca',
      'Estado de mal epiléptico (formulação IV)',
    ],
    receituario: 'Venda sob prescrição com retenção de receita (tarja vermelha).',
    posologia: [
      {
        titulo: 'Adulto — epilepsia',
        itens: [
          'Início 10–15 mg/kg/dia, fracionado',
          'Aumentar 5–10 mg/kg/semana',
          'Manutenção 15–60 mg/kg/dia',
          'Nível sérico alvo 50–100 µg/mL',
        ],
      },
      {
        titulo: 'Transtorno bipolar (mania)',
        itens: ['Início 750 mg/dia ou 20–30 mg/kg/dia', 'Titular conforme resposta e nível sérico'],
      },
      { titulo: 'Profilaxia de enxaqueca', itens: ['250 mg 2x/dia, até 500–1000 mg/dia'] },
    ],
    ajusteDose: [
      'Insuficiência hepática: contraindicado se doença hepática significativa',
      'Idoso: iniciar com dose menor (clearance reduzido)',
      'Monitorar nível sérico, hemograma e transaminases',
    ],
    contraindicacoes: [
      'Doença hepática ativa ou disfunção hepática grave',
      'Distúrbios mitocondriais (mutações POLG) — risco de falência hepática fatal',
      'Porfiria',
      'Hipersensibilidade',
      'Gestação para profilaxia de enxaqueca/bipolar; e na epilepsia se houver alternativa',
    ],
    efeitosAdversos: [
      'Hepatotoxicidade (pode ser fatal, sobretudo em < 2 anos)',
      'Pancreatite',
      'Trombocitopenia e disfunção plaquetária',
      'Hiperamonemia (com ou sem encefalopatia)',
      'Ganho de peso, tremor, queda de cabelo, sedação, náusea',
    ],
    advertencias: [
      'TERATOGÊNICO: defeitos do tubo neural, malformações e déficit de neurodesenvolvimento — não usar em mulher em idade fértil sem contracepção eficaz',
      'Investigar hepatotoxicidade ao surgir mal-estar, vômitos, icterícia ou piora das crises',
      'Dosar amônia se letargia/confusão inexplicada',
      'Suplementar ácido fólico em mulheres em idade fértil',
    ],
    gestacaoLactacao:
      'Contraindicado na gestação sempre que houver alternativa — alto risco teratogênico e de déficit cognitivo. Lactação: excretado em baixas concentrações; pode ser compatível com monitorização do lactente.',
    interacoes: [
      'Lamotrigina (↑ nível e risco de rash grave — reduzir dose da lamotrigina)',
      'Carbapenêmicos (↓ acentuada do valproato — evitar)',
      'Carbamazepina/fenitoína/fenobarbital (interações bidirecionais nos níveis)',
      'AAS (desloca da albumina, ↑ fração livre)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Gastrointestinal (antiespasmódico) ──
  {
    id: 'butilescopolamina',
    nome: 'Butilescopolamina (brometo)',
    principio: 'brometo de escopolamina (butilbrometo de hioscina)',
    sinonimos: [
      'butilescopolamina',
      'hioscina',
      'butilbrometo de hioscina',
      'buscopan',
      'antiespasmódico',
    ],
    classe: 'Gastrointestinais',
    numeroRegistro: '103870080',
    nomesComerciais: ['Buscopan®', 'Buscofin®'],
    mecanismo:
      'Antiespasmódico anticolinérgico (antagonista muscarínico) de amônio quaternário: relaxa a musculatura lisa do trato gastrointestinal, biliar e geniturinário. Por ser quaternário, pouco atravessa a barreira hematoencefálica (efeitos centrais mínimos).',
    apresentacoes: [
      'Drágea/comprimido 10 mg',
      'Solução oral em gotas — em geral disponível como Buscopan® Composto (associação com dipirona)',
      'Solução injetável 20 mg/mL (ampola 1 mL)',
      'Associação com dipirona (comprimido e injetável)',
    ],
    usoClinico: [
      'Cólicas e espasmos do trato gastrointestinal',
      'Cólica biliar',
      'Cólica renal/ureteral e espasmos geniturinários',
      'Dismenorreia',
      'Espasmo em procedimentos endoscópicos/radiológicos',
    ],
    receituario:
      'Venda sob prescrição médica (apresentações injetáveis e associadas); formas orais isoladas de venda livre conforme registro.',
    posologia: [
      { titulo: 'Adulto — VO', itens: ['10–20 mg até 3–5×/dia (máx ~100 mg/dia)'] },
      {
        titulo: 'Adulto — IV/IM/SC',
        itens: ['20 mg, repetível após 30 min se necessário (máx ~100 mg/dia)', 'IV lento'],
      },
      {
        titulo: 'Pediátrico',
        itens: ['Conforme idade/peso e apresentação (uso restrito em lactentes)'],
      },
    ],
    ajusteDose: [
      'Sem ajuste específico bem estabelecido; usar com cautela em idosos (maior sensibilidade anticolinérgica)',
    ],
    contraindicacoes: [
      'Glaucoma de ângulo fechado',
      'Miastenia gravis',
      'Megacólon',
      'Uropatia obstrutiva / retenção urinária (ex.: hiperplasia prostática)',
      'Estenose mecânica do trato gastrointestinal',
      'Taquiarritmias',
      'Hipersensibilidade',
    ],
    efeitosAdversos: [
      'Boca seca',
      'Taquicardia/palpitação',
      'Retenção urinária',
      'Visão turva, midríase, fotofobia',
      'Constipação',
      'Rubor e diminuição da sudorese',
      'Reações de hipersensibilidade (raras, incluindo anafilaxia com a forma IV)',
    ],
    advertencias: [
      'A forma injetável pode causar taquicardia e hipotensão transitória; aplicar com cautela e monitorização em cardiopatas',
      'Investigar dor abdominal não esclarecida antes de mascarar com antiespasmódico',
      'Cautela em idosos e em ambiente quente (risco de hipertermia por redução da sudorese)',
    ],
    gestacaoLactacao:
      'Usar apenas se claramente necessário na gestação. Dados na lactação são limitados; uso pontual costuma ser considerado aceitável.',
    interacoes: [
      'Outros anticolinérgicos (antidepressivos tricíclicos, anti-histamínicos, antiparkinsonianos — efeito aditivo)',
      'Antagonismo com procinéticos (metoclopramida, domperidona)',
      'Betabloqueadores/antiarrítmicos (somatório de efeitos sobre frequência cardíaca)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Hematínicos e suplementos ──
  {
    id: 'acido-folico',
    nome: 'Ácido fólico',
    principio: 'ácido fólico',
    sinonimos: ['acido folico', 'folato', 'vitamina b9'],
    classe: 'Hematínicos e suplementos',
    numeroRegistro: '101550245',
    nomesComerciais: ['Folacin®', 'Endofolin®'],
    mecanismo:
      'Vitamina B9: após conversão em tetra-hidrofolato, atua como cofator na síntese de purinas, pirimidinas e na metilação de homocisteína, sendo essencial para a síntese de DNA e a eritropoese.',
    apresentacoes: ['Comprimido 0,2 mg, 0,4 mg, 2 mg e 5 mg', 'Solução oral (gotas) 0,2 mg/mL'],
    usoClinico: [
      'Anemia megaloblástica por deficiência de folato',
      'Suplementação na gestação para prevenção de defeitos do tubo neural',
      'Profilaxia em uso de antifolatos (metotrexato, sulfassalazina, fenitoína)',
      'Estados de demanda aumentada (anemias hemolíticas crônicas, diálise)',
    ],
    receituario: 'Venda sob prescrição; baixas dosagens isentas conforme apresentação.',
    posologia: [
      {
        titulo: 'Anemia por deficiência (adulto)',
        itens: ['5 mg/dia VO, até correção (geralmente 1–4 meses)'],
      },
      {
        titulo: 'Gestação — prevenção do tubo neural',
        itens: [
          'Risco habitual: 0,4 mg/dia, idealmente 1 mês antes da concepção até a 12ª semana',
          'Alto risco (antecedente, DM, anticonvulsivantes): 4–5 mg/dia',
        ],
      },
      {
        titulo: 'Uso de metotrexato',
        itens: ['5 mg 1x/semana (em dia diferente do MTX), conforme prescrição'],
      },
    ],
    ajusteDose: [
      'Sem ajuste renal ou hepático de rotina',
      'Hemodiálise: pode haver perda dialítica, considerar reposição',
    ],
    contraindicacoes: [
      'Hipersensibilidade ao ácido fólico',
      'Anemia macrocítica não investigada (excluir deficiência de B12 antes do uso isolado)',
    ],
    efeitosAdversos: [
      'Geralmente bem tolerado',
      'Raras reações alérgicas/cutâneas',
      'Náusea e flatulência em doses altas',
    ],
    advertencias: [
      'Pode MASCARAR deficiência de vitamina B12: corrige a anemia, mas permite a progressão do dano neurológico — investigar e repor B12 quando indicado',
      'Não corrige citopenias por toxicidade aguda do metotrexato (usar ácido folínico/leucovorina nesse cenário)',
    ],
    gestacaoLactacao: 'Indicado e recomendado na gestação. Compatível com a lactação.',
    interacoes: [
      'Fenitoína, fenobarbital, primidona (folato pode ↓ níveis do anticonvulsivante)',
      'Metotrexato, sulfassalazina e trimetoprima (antagonistas do folato)',
      'Sulfassalazina reduz a absorção de folato',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },

  // ── Analgésico opioide forte ──
  {
    id: 'morfina',
    nome: 'Morfina (sulfato)',
    principio: 'sulfato de morfina',
    sinonimos: ['morfina', 'sulfato de morfina', 'dimorf'],
    classe: 'Analgésicos e antitérmicos',
    numeroRegistro: '102980097',
    nomesComerciais: ['Dimorf®', 'Dimorf LC®', 'MST Continus®'],
    mecanismo:
      'Opioide forte: agonista dos receptores µ (mu) no SNC e periferia, modulando a transmissão nociceptiva ascendente e ativando vias inibitórias descendentes, com efeito analgésico, sedativo e depressor respiratório.',
    apresentacoes: [
      'Comprimido de liberação imediata 10 mg e 30 mg',
      'Cápsula/comprimido de liberação controlada 30 mg, 60 mg e 100 mg',
      'Solução oral 10 mg/mL',
      'Solução injetável 0,2 mg/mL, 1 mg/mL e 10 mg/mL (SC/IM/IV/peridural)',
    ],
    usoClinico: [
      'Dor intensa aguda e crônica',
      'Dor oncológica (degrau 3 da escada da OMS)',
      'Edema agudo de pulmão (reduz pré-carga e ansiedade)',
      'Dor do infarto agudo do miocárdio refratária a nitrato',
    ],
    receituario:
      'Notificação de Receita A (receita amarela — entorpecente, lista A1 da Portaria 344/98).',
    posologia: [
      {
        titulo: 'Adulto — VO liberação imediata',
        itens: [
          '5–10 mg a cada 4 horas e titular pela resposta',
          'Resgate: ~10% da dose total diária',
          'Converter para liberação controlada quando dose estável (12/12h)',
        ],
      },
      {
        titulo: 'Parenteral (IV/SC)',
        itens: [
          'IV: 1–3 mg em bólus lento, repetir e titular',
          'SC/IM: 5–10 mg a cada 4 horas',
          'Iniciar com doses menores no idoso e no virgem de opioide',
        ],
      },
      {
        titulo: 'EAP / dor do IAM',
        itens: ['2–4 mg IV lento, repetir conforme PA e padrão respiratório'],
      },
    ],
    ajusteDose: [
      'Insuficiência renal: acúmulo de metabólito ativo (M6G) — reduzir dose/aumentar intervalo',
      'Insuficiência hepática: reduzir dose',
      'Idoso e caquéticos: iniciar com doses menores',
    ],
    contraindicacoes: [
      'Hipersensibilidade',
      'Depressão respiratória sem suporte ventilatório',
      'Asma aguda grave/broncoespasmo',
      'Íleo paralítico e abdome agudo não diagnosticado',
      'Uso concomitante ou recente (14 dias) de IMAO',
    ],
    efeitosAdversos: [
      'Depressão respiratória (dose-dependente, principal risco)',
      'Constipação (não desenvolve tolerância — prescrever laxante)',
      'Sedação, náusea e vômito',
      'Prurido, retenção urinária, hipotensão, miose',
      'Tolerância e dependência física com uso prolongado',
    ],
    advertencias: [
      'Antídoto: naloxona em caso de depressão respiratória',
      'Risco aumentado com benzodiazepínicos/álcool/outros depressores do SNC',
      'Prescrever esquema laxante profilático de rotina',
      'Não triturar formulações de liberação controlada (risco de liberação maciça e overdose)',
    ],
    gestacaoLactacao:
      'Usar apenas se claramente necessário; uso próximo ao parto pode causar depressão respiratória e síndrome de abstinência no neonato. Excretado no leite — cautela na amamentação.',
    interacoes: [
      'Benzodiazepínicos e depressores do SNC (depressão respiratória/morte)',
      'IMAO (reações graves — contraindicado)',
      'Outros opioides agonistas-antagonistas (ex.: nalbufina) podem precipitar abstinência',
      'Gabapentinoides (potencializam sedação/depressão respiratória)',
    ],
    fonte:
      'Resumo autoral a partir da bula profissional (ANVISA) e do Formulário Terapêutico Nacional (MS).',
  },
  // ───────────────────── Hemostáticos e antifibrinolíticos ─────────────────────
  {
    id: 'acido-tranexamico',
    nome: 'Ácido tranexâmico',
    principio: 'ácido tranexâmico',
    sinonimos: ['ácido tranexâmico', 'tranexâmico', 'TXA', 'antifibrinolítico', 'transamin'],
    classe: 'Hemostáticos e antifibrinolíticos',
    numeroRegistro: '156510045',
    nomesComerciais: ['Transamin® (Zydus Nikkho)', 'ácido tranexâmico genérico'],
    mecanismo:
      'Antifibrinolítico. Análogo sintético da lisina que se liga reversivelmente aos sítios de lisina do plasminogênio, bloqueando sua conversão em plasmina e, assim, a degradação da fibrina (estabiliza o coágulo já formado). Não é pró-coagulante — apenas impede a fibrinólise.',
    apresentacoes: [
      'Solução injetável 50 mg/mL',
      'Comprimido 250 mg',
    ],
    usoClinico: [
      'Hemorragia traumática com sangramento ou risco de sangramento significativo (incluindo TCE leve-moderado), iniciado em ≤ 3 h do trauma',
      'Hemorragia pós-parto',
      'Prevenção/tratamento de sangramento por hiperfibrinólise em cirurgia (ortopédica, cardíaca)',
      'Menorragia e sangramentos mucosos (epistaxe, pós-extração dentária)',
    ],
    receituario: 'Receituário simples (apresentação injetável: uso hospitalar).',
    posologia: [
      {
        titulo: 'Trauma / hemorragia maciça (IV) — Grade 1A',
        itens: [
          'Ataque: 1 g IV em 10 min',
          'Manutenção: 1 g IV em infusão por 8 h',
          'Iniciar o quanto antes — idealmente ≤ 1 h e no máximo ≤ 3 h do trauma (após 3 h: ineficaz e potencialmente deletério)',
        ],
      },
      {
        titulo: 'Hemorragia pós-parto (IV)',
        itens: [
          '1 g IV o quanto antes após o diagnóstico',
          'Repetir 1 g se o sangramento persistir após 30 min ou recorrer em até 24 h',
        ],
      },
      {
        titulo: 'Indicações da bula (ANVISA) — fibrinólise/sangramento',
        itens: [
          'IV: 500–1000 mg por injeção EV lenta (máx. 50 mg/min), 2–3×/dia',
          'VO: 15–25 mg/kg (2–3 comprimidos de 250 mg), 2–3×/dia; máx. 3 g/dia (até 4,5 g/dia sob supervisão)',
          'Menorragia: 2–3 comprimidos 3–4×/dia por 3–4 dias, iniciando no começo do sangramento',
          'Crianças: 10 mg/kg/dose, 2–3×/dia',
        ],
      },
    ],
    ajusteDose: [
      'Insuficiência renal (excreção renal) — ajustar a dose VO pela creatinina sérica (bula): 120–150 µmol/L → 25 mg/kg 2×/dia; 250–500 µmol/L → 25 mg/kg 1×/dia; > 500 µmol/L → 12,5 mg/kg 1×/dia',
    ],
    contraindicacoes: [
      'Coagulação intravascular ativa',
      'Vasculopatia oclusiva aguda',
      'Hipersensibilidade ao ácido tranexâmico ou aos componentes da fórmula',
    ],
    efeitosAdversos: [
      'Náusea, vômito, diarreia (mais comuns por via oral)',
      'Hipotensão com infusão IV rápida',
      'Convulsões (sobretudo com doses elevadas, p. ex. cirurgia cardíaca)',
      'Eventos tromboembólicos (raros; NÃO aumentados na dose padrão do trauma nos grandes ensaios — CRASH-2/CRASH-3/WOMAN)',
      'Distúrbios visuais com uso prolongado',
    ],
    advertencias: [
      'Administração ESTRITAMENTE endovenosa e LENTA — velocidade máxima 50 mg/min (bula). A via IM pode causar rabdomiólise/mioglobinúria; a infusão IV rápida pode causar náusea, vômito e hipotensão.',
      'Atenção à velocidade no trauma: o esquema de 1 g em 10 min (≈ 100 mg/min) é mais rápido que o máximo da bula (50 mg/min) — risco de hipotensão; seguir o protocolo institucional.',
      'Janela de 3 h no trauma: após esse tempo o benefício se perde e há sinal de DANO (CRASH-2 timing — RR 1,44 para morte por sangramento se > 3 h). Registrar a hora do trauma.',
      'Não recomendado em hemorragia por CIVD, exceto se confirmadamente por distúrbio do sistema fibrinolítico, sob estrita supervisão (bula).',
      'Hematúria: risco de obstrução renal e das vias urinárias por coágulos — acompanhar (bula).',
      'Histórico ou fatores de risco para tromboembolismo: acompanhar de perto (bula). "Fibrinolytic shutdown" (sem hiperfibrinólise) pode associar-se a pior desfecho — considerar viscoelastometria.',
      'Uso prolongado (ex.: angioedema hereditário): avaliar periodicamente a visão de cores; descontinuar se houver alteração (bula).',
      'Ajustar a dose na insuficiência renal.',
    ],
    gestacaoLactacao:
      'Categoria de risco B. Atravessa a barreira placentária e a experiência clínica na gestação é limitada — usar com cautela e sob estrita supervisão; não recomendado no 1º trimestre (bula). Apenas ~1% da concentração plasmática é excretada no leite (efeitos improváveis no lactente) — usar sob orientação. Na hemorragia pós-parto, o uso é recomendado (ensaio WOMAN, PMID 28456509).',
    interacoes: [
      'Por via oral, não há casos de interação medicamentosa descritos na bula',
      'Pode ser utilizado durante a heparinoterapia (bula)',
    ],
    fonte:
      'Resumo autoral. Bula profissional do Transamin® (ácido tranexâmico) — Zydus Nikkho Farmacêutica Ltda., Reg. MS nº 1.5651.0045 (ANVISA): apresentações, contraindicações, posologia da bula, ajuste renal, gestação e advertências. Eficácia, dose e janela no trauma/HPP da literatura verificada: CRASH-2 (PMID 20554319) e timing (21439633), CRASH-3 (31623894), WOMAN (28456509), diretriz europeia 6ª ed. (36859355). O esquema 1 g + 1 g/8 h no trauma é baseado em evidência/diretriz (não consta dessa forma na bula). Revisão médica obrigatória.',
  },
]
