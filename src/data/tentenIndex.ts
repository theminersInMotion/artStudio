/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChapterIndex, ArtistProfile, Exercise } from '../types/anatomy.ts';

export const TENTEN_PDF_PATH = '/assets/aistudio/Tenten-Anatomy-Esp-PDF_921d980a.pdf';
export const TENTEN_TOTAL_PAGES = 537;

export const TENTEN_CHAPTERS: ChapterIndex[] = [
  {
    id: 'cap1_cabeza',
    titlePt: 'Capítulo 1: Treinamento Especial da Cabeça & Proporções',
    titleEs: 'Capítulo 1: Entrenamiento Especial de la Cabeza',
    startPage: 18,
    endPage: 130,
    description: 'Cânones de proporção (9 a 2 cabeças), simplificação do crânio em cubos 3D, matriz de rotação, traços faciais (olhos, nariz trapezoide, boca, orelhas facetadas) e dinâmica do pescoço.',
    keyTerms: ['Proporción facial', 'Tres tribunales y cinco ojos', 'Cuboide facial', 'Matriz de cráneo', 'Nariz trapezoidal', 'Orejas en planos'],
    recommendedPages: [20, 21, 22, 24, 35, 60, 70, 85, 100, 120]
  },
  {
    id: 'cap2_torso',
    titlePt: 'Capítulo 2: Treinamento Especial do Torso (Tallo do Caracol)',
    titleEs: 'Capítulo 2: Entrenamiento Especial para el Tallo del Caracol / Torso',
    startPage: 131,
    endPage: 230,
    description: 'Construção da caixa torácica e pelve, deltoides masculino e feminino, cintura escapular, clavícula, músculos do abdômen, dorsal ancho, serrato anterior e torções dinâmicas.',
    keyTerms: ['Cavidad torácica', 'Pelvis', 'Esternocleidomastoideo', 'Trapecio', 'Deltoides', 'Pectoral mayor', 'Oblicuo externo', 'Dorsal ancho'],
    recommendedPages: [135, 140, 160, 175, 185, 200, 215, 225]
  },
  {
    id: 'cap3_brazos',
    titlePt: 'Capítulo 3: Treinamento Especial dos Braços & Membros Superiores',
    titleEs: 'Capítulo 3: Entrenamiento Especial de Brazos y Manos',
    startPage: 231,
    endPage: 290,
    description: 'Proporções do braço, rotação tridimensional sob perspectiva, inserções do bíceps e tríceps, mecânica do antebraço e cilindros de seção transversal.',
    keyTerms: ['Bíceps braquial', 'Tríceps', 'Braquiorradial', 'Olécranon', 'Sección transversal', 'Rotación del brazo'],
    recommendedPages: [235, 240, 252, 270, 280]
  },
  {
    id: 'cap4_piernas',
    titlePt: 'Capítulo 4: Treinamento Especial das Pernas & Joelhos',
    titleEs: 'Capítulo 4: Entrenamiento Especial de Piernas',
    startPage: 291,
    endPage: 380,
    description: 'Proporções da perna, curvatura do fêmur, caixa articular do joelho, sartório, vasto medial/lateral, panturrilhas e giros de 360 graus.',
    keyTerms: ['Cuádriceps femoral', 'Sartorio', 'Vasto medial', 'Rótula', 'Gemelos', 'Compensación muscular'],
    recommendedPages: [315, 330, 345, 360, 375]
  },
  {
    id: 'cap5_manos',
    titlePt: 'Capítulo 5: Treinamento Especial das Mãos & Dedos',
    titleEs: 'Capítulo 5: Entrenamiento Especial de Manos',
    startPage: 381,
    endPage: 410,
    description: 'Proporção áurea dos dedos, arco das articulações metacarpo-falângicas, caixa da palma e interação da mão segurando objetos em perspectiva.',
    keyTerms: ['Palma de la mano', 'Falanges', 'Eminencia tenar', 'Arco de nudillos', 'Agarre volumétrico'],
    recommendedPages: [300, 385, 395, 405]
  },
  {
    id: 'cap6_pies',
    titlePt: 'Capítulo 6: Treinamento Especial dos Pés & Apoio no Solo',
    titleEs: 'Capítulo 6: Entrenamiento Especial de los Pies',
    startPage: 411,
    endPage: 430,
    description: 'Estrutura da cunha do tarso e metatarso, maléolos interno e externo assimétricos, tendão de calcâneo e distribuição de peso no chão.',
    keyTerms: ['Maléolos', 'Calcáneo', 'Arco plantar', 'Tarso y metatarso', 'Punto de apoyo'],
    recommendedPages: [410, 418, 425]
  },
  {
    id: 'cap7_dinamico',
    titlePt: 'Capítulo 7: Treinamento Dinâmico Especial & Escorço de Corpo Inteiro',
    titleEs: 'Capítulo 7: Entrenamiento Dinámico Especial',
    startPage: 431,
    endPage: 460,
    description: 'Posição espacial do corpo, corpos normais vs exagerados, torção do núcleo e linha de ação contínua sob ângulos dramáticos de câmera.',
    keyTerms: ['Bloqueo espacial', 'Torsión del torso', 'Línea de acción', 'Escorzo dinámico', 'Compresión y estiramiento'],
    recommendedPages: [420, 435, 445, 455]
  },
  {
    id: 'cap8_luz_sombra',
    titlePt: 'Capítulo 8: Treinamento Especial de Luz e Sombra',
    titleEs: 'Capítulo 8: Entrenamiento Especial para la Luz y la Sombra',
    startPage: 461,
    endPage: 485,
    description: 'Três lados principais e cinco tons de valor tonal, planos angulares chanfrados, sombra própria vs projetada e modelagem volumétrica do corpo.',
    keyTerms: ['Tres lados y cinco tonos', 'Línea de corte de sombra (Terminator)', 'Oclusión ambiental', 'Plano reflectante'],
    recommendedPages: [465, 470, 476, 480]
  },
  {
    id: 'cap9_ropaje',
    titlePt: 'Capítulo 9: Treinamento Especial de Roupas & Dobras (Yifu / Drapery)',
    titleEs: 'Capítulo 9: Entrenamiento Especial para Yifu / Pliegues de Ropa',
    startPage: 486,
    endPage: 537,
    description: 'Física das dobras sob gravidade, dobras tubulares, espirais, dobras de bolso (bolsillo), 7 linhas de corte de roupas e vestidos sobre o manequim.',
    keyTerms: ['Pliegues de tela de bolsillo', 'Pliegue tubular', 'Pliegue en espiral', 'Punto de apoyo', 'Líneas de corte de ropa'],
    recommendedPages: [486, 492, 500, 510, 520, 525, 535]
  }
];

export const INITIAL_ARTISTS: ArtistProfile[] = [
  {
    id: 'tenten',
    name: 'Tenten',
    countryOrOrigin: 'Mestre da Anatomia Artística',
    description: 'Famoso pelo método de simplificação geométrica tridimensional rigorosa, caixas chanfradas, ritmo contínuo e hachuras que descrevem a curvatura anatômica.',
    styleCharacteristics: [
      'Construção por cilindros, caixas chanfradas e ovóides 3D',
      'Marcação explícita de marcos ósseos invariáveis',
      'Assimetrias anatômicas funcionais (vasto medial mais baixo, braquiorradial elevado)',
      'Hachuras volumétricas que abraçam a seção transversal das formas (cross-contour)',
      'Dinamismo gestual com forte compressão e estiramento (squash & stretch)'
    ],
    isDefault: true,
    avatarColor: '#f97316',
    referenceCount: 537
  },
  {
    id: 'bridgman',
    name: 'George Bridgman',
    countryOrOrigin: 'Anatomia Construtiva (EUA)',
    description: 'Pioneiro dos blocos angulares entrelaçados (wedging, interlocking and twisting forms), conectando torso e membros como peças de máquina esculpidas.',
    styleCharacteristics: [
      'Blocos pesados e encaixes de caixas entrelaçadas',
      'Ênfase na mecânica de alavancas e torções',
      'Planos anatômicos angulares sem curvas moles',
      'Transições rígidas entre ossos e massas carnosas'
    ],
    isDefault: false,
    avatarColor: '#3b82f6',
    referenceCount: 0
  },
  {
    id: 'kim_jung_gi',
    name: 'Kim Jung Gi',
    countryOrOrigin: 'Mestre da Perspectiva & Memória (Coreia)',
    description: 'Capacidade lendária de desenhar figuras em escorço e perspectiva de olho de peixe diretamente sem linhas guia preliminares, com anatomia estilizada e fluida.',
    styleCharacteristics: [
      'Perspectiva curvilínea e escorço extremo',
      'Fluidez de tinta e variações expressivas de espessura de traço',
      'Integração orgânica de anatomia, roupas e dobras',
      'Linha limpa e economia precisa de pincel'
    ],
    isDefault: false,
    avatarColor: '#8b5cf6',
    referenceCount: 0
  },
  {
    id: 'andrew_loomis',
    name: 'Andrew Loomis',
    countryOrOrigin: 'Ilustração Clássica (EUA)',
    description: 'Cânones ideais de 8 cabeças, método Loomis para cabeça e planos de luz e sombra acadêmicos.',
    styleCharacteristics: [
      'Método de esfera e planos para a cabeça',
      'Proporções elegantes de 8 a 8.5 cabeças',
      'Tratamento acadêmico de valores de luz e sombra',
      'Equilíbrio entre realismo e estilização heroica'
    ],
    isDefault: false,
    avatarColor: '#10b981',
    referenceCount: 0
  }
];

export const CURATED_EXERCISES: Exercise[] = [
  {
    id: 'ex_1_canones_proporcao',
    title: 'Exercício 1: Cânone de Proporções do Tenten (9 a 2 Cabeças)',
    difficulty: 'iniciante',
    category: 'Cabeça & Proporções',
    durationMinutes: 10,
    referencePage: 20,
    objectives: [
      'Mapear a escala de 9 cabeças (heróica/modelo) até 2 cabeças (versão Q/chibi)',
      'Identificar os pontos de divisão no púbis, joelhos e tórax',
      'Compreender o papel da cabeça como módulo básico de medição'
    ],
    styleFocus: 'Divisão métrica precisa do corpo humano',
    artistId: 'tenten',
    illustrationCrop: { x: 21, y: 8.5, width: 58, height: 16.5 },
    detectedImages: [
      {
        id: 'canone_figuras',
        label: 'Cânone de 9 a 2 Cabeças (Figuras Completas)',
        cropBox: { x: 21, y: 8.5, width: 58, height: 16.5 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Traçar as Linhas de Nível',
        instruction: 'Trace as 9 linhas horizontais paralelas com a stylus em azul suave para definir os módulos da cabeça.',
        tip: 'Mantenha o traço leve; a cabeça #1 vai do topo do crânio até o queixo.'
      },
      {
        stepNumber: 2,
        title: 'Bloqueio do Tronco e Pelve',
        instruction: 'Encaixe a caixa torácica entre o módulo 2 e 3, e a pelve entre o módulo 4 e 5.',
        tip: 'A virilha fica exatamente no ponto médio da figura de 8 cabeças.'
      },
      {
        stepNumber: 3,
        title: 'Membros e Linha de Centro',
        instruction: 'Trace os eixos dos fêmures convergindo até os joelhos (módulo 6) e pés na base.',
        tip: 'Compare a figura esbelta com a figura chibi de 3 e 2 cabeças desenhada ao lado.'
      }
    ]
  },
  {
    id: 'ex_2_cubo_facial_perspectiva',
    title: 'Exercício 2: O Cubo Facial & Perspectiva da Cabeça',
    difficulty: 'iniciante',
    category: 'Cabeça & Proporções',
    durationMinutes: 12,
    referencePage: 24,
    objectives: [
      'Simplificar os traços faciais dentro de um cubo tridimensional',
      'Manter a proporção dos três terços da face mesmo rotacionada em 45°',
      'Traçar a linha dos olhos (B) e a base do nariz com convergência correta'
    ],
    styleFocus: 'Geometrização espacial da cabeça em 3D',
    artistId: 'tenten',
    illustrationCrop: { x: 21, y: 13, width: 58, height: 16 },
    detectedImages: [
      {
        id: 'cabecas_cubo',
        label: '4 Cabeças com Cubos em Perspectiva (Frente, 3/4, Perfil)',
        cropBox: { x: 21, y: 13, width: 58, height: 16 }
      },
      {
        id: 'cubos_perspectiva',
        label: 'Matriz dos 4 Cubos Tridimensionais',
        cropBox: { x: 21, y: 56.5, width: 58, height: 9.5 }
      },
      {
        id: 'planos_faciais',
        label: 'Planos Faciais da Cabeça & Caixas Chanfradas',
        cropBox: { x: 21, y: 73, width: 58, height: 12.5 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Desenhar o Cubo em Perspectiva',
        instruction: 'Desenhe uma caixa cúbica com 2 pontos de fuga suaves na direção da pose escolhida (frente, 3/4 ou perfil).',
        tip: 'Usar um cubo em vez de cilindro torna a rotação de 15°, 22.5° e 45° muito mais mensurável.'
      },
      {
        stepNumber: 2,
        title: 'Divisão em Três Cortes (A1, B, A2)',
        instruction: 'Divida a face frontal em três partes iguais: linha do cabelo, linha das sobrancelhas e base do queixo.',
        tip: 'A linha dos olhos B fica ligeiramente abaixo da linha das sobrancelhas.'
      },
      {
        stepNumber: 3,
        title: 'Encaixe dos Traços Faciais',
        instruction: 'Posicione os olhos, a projeção do nariz e a boca acompanhando os planos laterais e frontal da caixa.',
        tip: 'Observe como o nariz projeta para fora do plano do cubo enquanto a cavidade ocular afunda.'
      }
    ]
  },
  {
    id: 'ex_3_matriz_cranio_blocos',
    title: 'Exercício 3: Matriz de 28 Ângulos do Crânio em Blocos',
    difficulty: 'intermediario',
    category: 'Cabeça & Proporções',
    durationMinutes: 15,
    referencePage: 35,
    objectives: [
      'Resumir o crânio humano a blocos e esferas encaixadas',
      'Dominar a visão de cima (plongée) e de baixo (contra-plongée)',
      'Fixar a posição invariável do arco zigomático e maxilar'
    ],
    styleFocus: 'Perspectiva esférica e caixas chanfradas',
    artistId: 'tenten',
    illustrationCrop: { x: 21, y: 9, width: 58, height: 61.5 },
    detectedImages: [
      {
        id: 'cranio_completo',
        label: 'Matriz Completa de 28 Ângulos do Crânio',
        cropBox: { x: 21, y: 9, width: 58, height: 61.5 }
      },
      {
        id: 'cranio_blocos_sup',
        label: 'Crânio em Blocos Angulares (Superior)',
        cropBox: { x: 21, y: 9, width: 58, height: 29 }
      },
      {
        id: 'cranio_orbitas_inf',
        label: 'Crânio Anatômico com Órbitas e Maxilar (Inferior)',
        cropBox: { x: 21, y: 39.5, width: 58, height: 31 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Caixa Envolvente do Crânio',
        instruction: 'Escolha um dos ângulos da prancha #35 e desenhe a caixa delimitadora.',
        tip: 'O crânio visto de perfil é significativamente mais profundo do que largo.'
      },
      {
        stepNumber: 2,
        title: 'Divisão Craniana vs Mandíbula',
        instruction: 'Esculpa a calvária superior arredondada e o bloco angular da mandíbula.',
        tip: 'O ângulo da mandíbula se alinha com o lóbulo da orelha.'
      },
      {
        stepNumber: 3,
        title: 'Órbitas e Cavidade Nasal',
        instruction: 'Abra as duas cavidades orbitais em máscara de óculos e o triângulo nasal.',
        tip: 'Em plongée, a mandíbula fica encurtada; em contra-plongée, o queixo domina a silhueta.'
      }
    ]
  },
  {
    id: 'ex_4_nariz_trapezoide',
    title: 'Exercício 4: O Nariz Trapezoide Tridimensional',
    difficulty: 'iniciante',
    category: 'Cabeça & Proporções',
    durationMinutes: 10,
    referencePage: 60,
    objectives: [
      'Construir o nariz como um prisma trapezoidal 3D',
      'Diferenciar os 4 planos: ponte superior, laterais chanfradas e plano inferior',
      'Posicionar a ponta bulbosa e as asas nasais sobre a base'
    ],
    styleFocus: 'Planos geométricos nítidos antes do acabamento orgânico',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 68 },
    detectedImages: [
      {
        id: 'nariz_prisma',
        label: 'Prisma Trapezoidal e Variações do Nariz',
        cropBox: { x: 20, y: 9, width: 60, height: 68 }
      },
      {
        id: 'nariz_planos_sup',
        label: 'Construção por Planos Angulares (Superior)',
        cropBox: { x: 20, y: 9, width: 60, height: 32 }
      },
      {
        id: 'nariz_sombras_inf',
        label: 'Planos Inferiores e Narinas em Sombra (Inferior)',
        cropBox: { x: 20, y: 43, width: 60, height: 34 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'O Prisma Trapezoidal Base',
        instruction: 'Desenhe uma pirâmide trapezoidal truncada inclinada no ângulo do rosto.',
        tip: 'A base do trapézio é mais larga nas narinas e se afunila entre os olhos.'
      },
      {
        stepNumber: 2,
        title: 'Plano Inferior e Sombras de Oclusão',
        instruction: 'Desenhe o triângulo inferior onde ficam as duas aberturas das narinas.',
        tip: 'Em luz vinda de cima, todo este plano inferior fica em sombra escura.'
      },
      {
        stepNumber: 3,
        title: 'Esculpir as Cartilagens Orgânicas',
        instruction: 'Com traço final, arredonde levemente a ponta e una as asas nasais ao lábio superior.',
        tip: 'Evite desenhar o contorno preto completo dos dois lados da ponte; sugira com sombra.'
      }
    ]
  },
  {
    id: 'ex_5_orelha_planos_luz',
    title: 'Exercício 5: Geometrização da Orelha & Planos de Luz',
    difficulty: 'intermediario',
    category: 'Cabeça & Proporções',
    durationMinutes: 12,
    referencePage: 70,
    objectives: [
      'Simplificar a concha da orelha em planos angulares chanfrados',
      'Compreender o hélice, antélice, trago e lóbulo',
      'Aplicar o sombreamento característico do Tenten'
    ],
    styleFocus: 'Decomposição em facetas tridimensionais',
    artistId: 'tenten',
    illustrationCrop: { x: 21, y: 8, width: 58, height: 81 },
    detectedImages: [
      {
        id: 'orelha_completa',
        label: 'Prancha Completa de Facetas da Orelha',
        cropBox: { x: 21, y: 8, width: 58, height: 81 }
      },
      {
        id: 'orelha_facetas_sup',
        label: 'Decomposição em 5 Facetas Angulares (Superior)',
        cropBox: { x: 21, y: 8, width: 58, height: 38 }
      },
      {
        id: 'orelha_sombra_inf',
        label: 'Orelha com Volume, Concha e Sombreamento (Inferior)',
        cropBox: { x: 21, y: 48, width: 58, height: 41 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Forma Básica em "C" Angular',
        instruction: 'Trace a silhueta externa da orelha como um polígono facetado de 5 lados.',
        tip: 'A orelha inclina-se para trás acompanhando a linha do ramo da mandíbula.'
      },
      {
        stepNumber: 2,
        title: 'O Antélice em "Y"',
        instruction: 'Desenhe a bifurcação interna da cartilagem que sustenta a concha.',
        tip: 'O braço superior do "Y" é suave; o braço inferior cria um túnel para o conduto.'
      },
      {
        stepNumber: 3,
        title: 'Luz e Sombra nas Facetas',
        instruction: 'Defina os lados claros e escuros usando hachuras limpas.',
        tip: 'A profundidade da concha recebe a sombra de oclusão mais densa.'
      }
    ]
  },
  {
    id: 'ex_6_torso_gaiola_toracica',
    title: 'Exercício 6: Gaiola Torácica & Deltoides Masculino/Feminino',
    difficulty: 'intermediario',
    category: 'Torso & Cintura Escapular',
    durationMinutes: 15,
    referencePage: 140,
    objectives: [
      'Construir a caixa torácica em ovo chanfrado com abertura do arco costal',
      'Encaixar as dragona dos deltoides e os volumes dos seios femininos vs peitoral masculino',
      'Visualizar o suporte esquelético subjacente'
    ],
    styleFocus: 'Diferenciação morfológica e blocos 3D sobrepostos',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 57 },
    detectedImages: [
      {
        id: 'torso_comparativo',
        label: 'Gaiola Torácica e Deltoides (Masculino e Feminino)',
        cropBox: { x: 20, y: 9, width: 60, height: 57 }
      },
      {
        id: 'torso_masculino',
        label: 'Torso Masculino (Base Costal Aberta)',
        cropBox: { x: 20, y: 9, width: 29, height: 57 }
      },
      {
        id: 'torso_feminino',
        label: 'Torso Feminino (Arco Esguio e Deltoides)',
        cropBox: { x: 50, y: 9, width: 30, height: 57 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'O Suporte Torácico',
        instruction: 'Desenhe o bloco da caixa torácica com a fossa jugular e a quilha esternal.',
        tip: 'No suporte feminino o arco é mais esguio; no masculino a base costal é mais aberta.'
      },
      {
        stepNumber: 2,
        title: 'As Taças dos Deltoides',
        instruction: 'Adicione as duas semi-esferas dos deltoides abraçando as extremidades da clavícula.',
        tip: 'O ombro não flutua solto: ele forma uma ponte rígida com a escápula nas costas.'
      },
      {
        stepNumber: 3,
        title: 'Massas Peitorais sob Rotação',
        instruction: 'Modele o peitoral maior repousando sobre a curvatura elíptica das costelas.',
        tip: 'O peitoral feminino é sustentado pelos músculos peitorais mas cai pelo peso da gravidade em lágrima.'
      }
    ]
  },
  {
    id: 'ex_7_cintura_escapular_musculos',
    title: 'Exercício 7: Cintura Escapular & Inserções Musculares Coloridas',
    difficulty: 'intermediario',
    category: 'Torso & Cintura Escapular',
    durationMinutes: 18,
    referencePage: 160,
    objectives: [
      'Compreender o efeito mecânico de levantar os braços sobre a escápula e clavícula',
      'Mapear o trapézio, deltoide, peitoral e dorsal ancho coloridos',
      'Visualizar o movimento conjugado dos ossos e massas carnosas'
    ],
    styleFocus: 'Anatomia funcional em ação dinâmica',
    artistId: 'tenten',
    illustrationCrop: { x: 21, y: 10, width: 58, height: 36 },
    detectedImages: [
      {
        id: 'cintura_escapular_todos',
        label: 'Cintura Escapular & Inserções Musculares Coloridas',
        cropBox: { x: 21, y: 10, width: 58, height: 36 }
      },
      {
        id: 'escapula_elevacao',
        label: 'Mecanismo de Elevação dos Braços em "V"',
        cropBox: { x: 21, y: 48, width: 58, height: 34 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Alavanca da Clavícula e Escápula',
        instruction: 'Desenhe o esquema inferior da prancha #160 mostrando como a clavícula sobe em "V".',
        tip: 'Quando o braço sobe, a escápula gira para fora e para cima ao longo da caixa torácica.'
      },
      {
        stepNumber: 2,
        title: 'O Manto do Trapézio e Deltoide',
        instruction: 'Desenhe a dragona vermelha do deltoide e o diamante do trapézio cobrindo o dorso.',
        tip: 'O trapézio superior contrai e forma uma almofada visível ao lado do pescoço.'
      },
      {
        stepNumber: 3,
        title: 'Dorsal Ancho e Serráteis',
        instruction: 'Trace a asa do dorsal ancho subindo para se inserir no sulco bicipital do úmero.',
        tip: 'Cria o limite posterior da axila, crucial para a silhueta de força do Tenten.'
      }
    ]
  },
  {
    id: 'ex_8_torso_dinamica_torcao',
    title: 'Exercício 8: Dinâmica, Torção e Flexão do Torso (Contraposto)',
    difficulty: 'avancado',
    category: 'Torso & Dinâmica',
    durationMinutes: 20,
    referencePage: 200,
    objectives: [
      'Executar as torções dinâmicas do torso da prancha #200 (inclinar, dobrar e torcer)',
      'Aplicar o princípio de compressão (squash) de um lado e estiramento (stretch) do outro',
      'Manter a rotação contraposta entre a caixa torácica e a bacia pélvica'
    ],
    styleFocus: 'Ritmo orgânico com solidez estrutural',
    artistId: 'tenten',
    illustrationCrop: { x: 22, y: 9, width: 56, height: 55 },
    detectedImages: [
      {
        id: 'torso_torcao_matriz',
        label: 'Série de Torções e Inclinações do Torso (Contraposto)',
        cropBox: { x: 22, y: 9, width: 56, height: 55 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Linha Média da Coluna em "S"',
        instruction: 'Trace a linha de ação em curva rápida definindo a rotação do corpo.',
        tip: 'Se a caixa torácica inclina para a direita, a pelve compensa inclinando para a esquerda.'
      },
      {
        stepNumber: 2,
        title: 'Bloqueio das Duas Caixas (Tórax e Pelve)',
        instruction: 'Desenhe os dois blocos com elipses de seção transversal para evidenciar a torção.',
        tip: 'Observe a orientação das setas no modelo colorido da prancha #200.'
      },
      {
        stepNumber: 3,
        title: 'Dobras Musculares dos Oblíquos e Abdômen',
        instruction: 'No lado comprimido, marque as dobras carnosas sobre a crista ilíaca; no lado esticado, linha reta e tensa.',
        tip: 'Esta contraposição de linha reta vs linha curva é a chave estética do estilo do Tenten.'
      }
    ]
  },
  {
    id: 'ex_9_rotacao_braco_deformacao',
    title: 'Exercício 9: Rotação e Deformação Tridimensional do Braço',
    difficulty: 'avancado',
    category: 'Braços & Membros Superiores',
    durationMinutes: 18,
    referencePage: 240,
    objectives: [
      'Construir a série de rotações de braço da prancha #240',
      'Compreender como o bíceps e o braquiorradial giram sobre o úmero',
      'Desenhar braços musculosos e esguios a partir dos mesmos blocos mestres'
    ],
    styleFocus: 'Perspectiva mecânica e encaixes anatômicos',
    artistId: 'tenten',
    illustrationCrop: { x: 18, y: 9, width: 62, height: 57 },
    detectedImages: [
      {
        id: 'braco_rotacao_completo',
        label: 'Série de Rotações 3D do Braço e Antebraço',
        cropBox: { x: 18, y: 9, width: 62, height: 57 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'O Chassi de Cilindros Articulados',
        instruction: 'Desenhe o torso simplificado e os dois cilindros do braço e antebraço na perspectiva da prancha #240.',
        tip: 'Use a linha guia transversal que marca o plano do cotovelo.'
      },
      {
        stepNumber: 2,
        title: 'Encaixe do Deltoide e Bíceps',
        instruction: 'Adicione a massa em gota do bíceps e o feixe alongado do tríceps atrás.',
        tip: 'O bíceps fica mais curto e gordo na flexão, e esticado na extensão.'
      },
      {
        stepNumber: 3,
        title: 'A Torsão do Antebraço e Punho',
        instruction: 'Trace o braquiorradial espiralando da lateral externa do braço até o polegar.',
        tip: 'Na pronação, o rádio cruza sobre a ulna formando uma curva contínua.'
      }
    ]
  },
  {
    id: 'ex_10_secao_transversal_membros',
    title: 'Exercício 10: Cilindros de Seção Transversal (Cross-Contour)',
    difficulty: 'iniciante',
    category: 'Membros & Perspectiva',
    durationMinutes: 12,
    referencePage: 270,
    objectives: [
      'Praticar os cilindros em diferentes ângulos da prancha #270',
      'Usar elipses transversais para determinar as posições-chave dos músculos',
      'Dominar o escorço de membros apontados para o espectador'
    ],
    styleFocus: 'Volumetria 3D pura através de linhas de curvatura',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 71 },
    detectedImages: [
      {
        id: 'cilindros_secao',
        label: 'Cilindros de Seção Transversal (Cross-Contours)',
        cropBox: { x: 20, y: 9, width: 60, height: 71 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Matriz de Cilindros Rotacionados',
        instruction: 'Desenhe os cilindros em plongée e contra-plongée mostrados na prancha #270.',
        tip: 'Quanto mais o cilindro aponta para a câmera, mais redonda é a elipse da ponta.'
      },
      {
        stepNumber: 2,
        title: 'Elipses Intermediárias (Cross-Contours)',
        instruction: 'Corte o cilindro ao meio com elipses que abraçam a forma tridimensional.',
        tip: 'Essas elipses mostram onde o músculo atinge seu pico de volume máximo.'
      },
      {
        stepNumber: 3,
        title: 'Contorno Muscular Orgânico',
        instruction: 'Com base nas elipses, desenhe o relevo suave dos músculos da perna ou braço.',
        tip: 'O contorno externo agora tem peso e profundidade convincentes.'
      }
    ]
  },
  {
    id: 'ex_11_maos_perspectiva_objetos',
    title: 'Exercício 11: Mãos em Perspectiva & Segurando Objetos',
    difficulty: 'avancado',
    category: 'Mãos & Dedos',
    durationMinutes: 20,
    referencePage: 300,
    objectives: [
      'Replicar os estudos de mão da prancha #300 segurando xícaras e cilindros',
      'Estruturar a palma como uma cunha curvada e o polegar em oposição',
      'Aplicar o sombreamento em facetas dos nós dos dedos'
    ],
    styleFocus: 'Encaixe de volumes e expressão gestual das mãos',
    artistId: 'tenten',
    illustrationCrop: { x: 22, y: 9, width: 56, height: 57 },
    detectedImages: [
      {
        id: 'maos_objetos',
        label: 'Mãos Segurando Xícaras e Objetos Cilíndricos',
        cropBox: { x: 22, y: 9, width: 56, height: 57 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Caixa da Palma e o Arco dos Nós',
        instruction: 'Desenhe o bloco da palma arqueado em concha e marque o arco curvo das juntas.',
        tip: 'O dedo médio é o ponto mais alto do arco; as juntas não formam uma linha reta.'
      },
      {
        stepNumber: 2,
        title: 'O Cilindro do Objeto Seguro',
        instruction: 'Desenhe a xícara ou forma cilíndrica com elipses firmes antes de traçar os dedos.',
        tip: 'Desenhar o objeto primeiro garante que os dedos realmente se fechem ao redor dele sem flutuar.'
      },
      {
        stepNumber: 3,
        title: 'Falanges em Blocos e Unhas',
        instruction: 'Construa cada falange como um prisma retangular antes de suavizar as articulações.',
        tip: 'Destaque as sombras nas dobras das falanges com a S-Pen em pressão média.'
      }
    ]
  },
  {
    id: 'ex_12_perna_joelho_rotacao360',
    title: 'Exercício 12: Rotação de 360° da Perna Feminina & Mecânica do Joelho',
    difficulty: 'intermediario',
    category: 'Pernas & Membros Inferiores',
    durationMinutes: 18,
    referencePage: 360,
    objectives: [
      'Estudar as 8 rotações em círculo da pose em salto alto da prancha #360',
      'Compreender o encaixe da patela e a curva do bíceps femoral visto de costas',
      'Equilibrar a elegância estilizada com a estrutura muscular sólida'
    ],
    styleFocus: 'Giro orbital 360° de figura feminina no estilo Tenten',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 45 },
    detectedImages: [
      {
        id: 'perna_rotacao360',
        label: 'Giro Orbital 360° da Perna em Salto Alto',
        cropBox: { x: 20, y: 9, width: 60, height: 45 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'A Plataforma no Chão e o Eixo de Gravidade',
        instruction: 'Desenhe o losango da base no chão para ancorar a perspectiva dos pés.',
        tip: 'A pose com salto alto eleva o tornozelo e estica a curva da panturrilha.'
      },
      {
        stepNumber: 2,
        title: 'Curva Anterior da Coxa vs Glúteo',
        instruction: 'Desenhe o arco suave do fêmur na frente e a almofada do glúteo máximo atrás.',
        tip: 'O glúteo não termina em linha reta; ele se insere diagonalmente no trato iliotibial.'
      },
      {
        stepNumber: 3,
        title: 'Refinamento dos Músculos e Tendões',
        instruction: 'Adicione os tendões dos isquiotibiais atrás do joelho (fossa poplítea) e os gastrocnêmios.',
        tip: 'Tenten recomenda moderação: sugira os músculos com linhas limpas sem sobrecarregar a figura.'
      }
    ]
  },
  {
    id: 'ex_13_planos_luz_dobras_angulares',
    title: 'Exercício 13: Planos de Luz, Sombra e Guardanapo Dobrado',
    difficulty: 'intermediario',
    category: 'Luz, Sombra & Modelagem',
    durationMinutes: 15,
    referencePage: 420,
    objectives: [
      'Entender o experimento da prancha #420 do guardanapo dobrado sob luz direcional',
      'Calcular o ângulo de incidência (100°, 80°, 60°) e a mudança drástica de tom',
      'Aplicar o conceito aos planos chanfrados do corpo humano'
    ],
    styleFocus: 'Geometria de iluminação e valor tonal',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 78 },
    detectedImages: [
      {
        id: 'luz_guardanapo_corpo',
        label: 'Planos de Luz no Guardanapo e no Manequim',
        cropBox: { x: 20, y: 9, width: 60, height: 78 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'O Modelo do Papel Sanfonado',
        instruction: 'Desenhe os planos zig-zag do papel da prancha #420 com fonte de luz superior esquerda.',
        tip: 'Cada mudança de plano em ângulo gera um salto súbito no valor de cinza.'
      },
      {
        stepNumber: 2,
        title: 'Transferência para o Manequim Humano',
        instruction: 'Desenhe o manequim facetado ao lado e mapeie o peito, abdômen e coxas como planos equivalentes.',
        tip: 'O peito aponta para cima (luz direta); o abdômen aponta para baixo (sombra média).'
      },
      {
        stepNumber: 3,
        title: 'Hachuras de Valor Tonal',
        instruction: 'Preencha os planos sombreados com hachuras uniformes no estilo Tenten.',
        tip: 'Mantenha os tons consistentes: limite seu desenho a 3 valores (luz, meio-tom, sombra).'
      }
    ]
  },
  {
    id: 'ex_14_dinamica_escorco_extremo',
    title: 'Exercício 14: Escorço Extremo & Ritmo Gestual Heroico',
    difficulty: 'avancado',
    category: 'Dinâmica & Escorço',
    durationMinutes: 25,
    referencePage: 476,
    objectives: [
      'Executar a pose dinâmica da prancha #476 com perspectiva dramática',
      'Usar sobreposição de formas (T-junctions) para criar profundidade vertiginosa',
      'Finalizar com variação expressiva de pressão da stylus no nanquim'
    ],
    styleFocus: 'Dinamismo heroico e perspectiva forçada de câmera',
    artistId: 'tenten',
    illustrationCrop: { x: 18, y: 9, width: 62, height: 53 },
    detectedImages: [
      {
        id: 'escorco_heroico',
        label: 'Escorço Extremo & Perspectiva Heroica',
        cropBox: { x: 18, y: 9, width: 62, height: 53 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Linha de Ação em Chicote',
        instruction: 'Trace a linha mestra de energia que vai da cabeça até a ponta dos dedos do pé de apoio.',
        tip: 'Trace com stylus solta, usando o ombro e não apenas o pulso.'
      },
      {
        stepNumber: 2,
        title: 'Escorço dos Membros em Foco',
        instruction: 'Desenhe o membro mais próximo em escala multiplicada encobrindo o torso.',
        tip: 'A sensação de proximidade depende da sobreposição clara: o que está na frente corta o que está atrás.'
      },
      {
        stepNumber: 3,
        title: 'Arte Final com Peso de Linha',
        instruction: 'Reforce as linhas de oclusão e contato com pressão firme na caneta preta.',
        tip: 'Adicione hachuras cruzadas rápidas nas áreas de sombra sob o abdômen e axila.'
      }
    ]
  },
  {
    id: 'ex_15_pliegues_tela_bolsillo',
    title: 'Exercício 15: Dobras de Tecido de Bolso (Pliegues de Tela de Bolsillo)',
    difficulty: 'iniciante',
    category: 'Roupas & Dobras (Drapery)',
    durationMinutes: 15,
    referencePage: 492,
    objectives: [
      'Estudar os efeitos de ponto de apoio nas dobras de bolso mostradas na prancha #492',
      'Identificar o ponto primário de sustentação (pontos vermelhos) e o caimento em "U" / "V"',
      'Construir a espessura da barra do tecido e os planos internos e externos'
    ],
    styleFocus: 'Física do caimento de tecidos sob a gravidade',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 63 },
    detectedImages: [
      {
        id: 'dobras_bolso',
        label: 'Pliegues de Bolsillo & Pontos de Apoio',
        cropBox: { x: 20, y: 9, width: 60, height: 63 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Marcar os Dois Pontos de Apoio',
        instruction: 'Marque os dois círculos vermelhos no topo onde o tecido está pinçado.',
        tip: 'Entre dois pontos de apoio distantes, o tecido afunda formando catenárias elípticas.'
      },
      {
        stepNumber: 2,
        title: 'O Caimento Central em "V" e as Dobras Laterais',
        instruction: 'Puxe as linhas de tensão radiais descendo dos pontos de apoio em direção ao centro.',
        tip: 'Observe como as dobras se dobram para dentro e para fora criando relevo de acordeão.'
      },
      {
        stepNumber: 3,
        title: 'Desenho em 3/4 e Espessura da Borda',
        instruction: 'Desenhe o estudo inferior da prancha #492 mostrando o tecido visto de perfil angular.',
        tip: 'Nunca faça a barra do tecido com linha reta simples: faça uma fita que se torce e revela o forro.'
      }
    ]
  },
  {
    id: 'ex_16_ropa_cuerpo_7lineas_corte',
    title: 'Exercício 16: Roupa sobre o Corpo & As 7 Linhas de Corte do Tenten',
    difficulty: 'avancado',
    category: 'Roupas & Dobras (Drapery)',
    durationMinutes: 25,
    referencePage: 510,
    objectives: [
      'Analisar a pose de passarela e mapear o manequim anatômico subjacente',
      'Traçar as 7 linhas vermelhas de corte e os pontos azuis de compressão da força',
      'Desenhar trajes reais e belos que respeitam a anatomia tridimensional'
    ],
    styleFocus: 'Integração de moda, anatomia e física das dobras',
    artistId: 'tenten',
    illustrationCrop: { x: 20, y: 9, width: 60, height: 57 },
    detectedImages: [
      {
        id: 'roupa_7lineas',
        label: 'Manequim e as 7 Linhas de Corte de Roupas',
        cropBox: { x: 20, y: 9, width: 60, height: 57 }
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'O Manequim Anatômico Subjacente',
        instruction: 'Desenhe o corpo da modelo com cilindros e caixas antes de colocar qualquer tecido.',
        tip: 'Se a anatomia por baixo estiver torta, as roupas nunca parecerão críveis.'
      },
      {
        stepNumber: 2,
        title: 'As 7 Linhas de Corte (Vermelho)',
        instruction: 'Marque as 7 zonas de quebra: decote, cintura, punhos, quadril, joelhos e tornozelos.',
        tip: 'Estas linhas abraçam o corpo como elipses espaciais mostrando o volume do tecido.'
      },
      {
        stepNumber: 3,
        title: 'Vetores de Força e Dobras em Espiral (Azul)',
        instruction: 'Adicione as setas azuis de compressão saindo do botão da cintura e dos cotovelos.',
        tip: 'Finalize com nanquim marcando a textura do tecido e o movimento da passarela.'
      }
    ]
  }
];
