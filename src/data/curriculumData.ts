/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OfficialMaterial {
  id: string;
  week: number;
  title: string;
  description: string;
  imageUrl: string;
  category: "worksheet" | "book_page" | "exercise_guide";
  targetExerciseType?: string;
  recommendedMinutes?: number;
}

export const OFFICIAL_WEEK_MATERIALS: OfficialMaterial[] = [
  // --- Semana 1 (12 Pranchas Oficiais do Autor) ---
  {
    id: "w1-sheet-01",
    week: 1,
    title: "W1 - Prancha de Aquecimento: Linhas e Traços",
    description: "Controle de pressão do Stylus, linhas paralelas, círculos e elipses de aquecimento motor.",
    imageUrl: "/assets/aistudio/week_1_g4g43g_01c1fae3.jpg",
    category: "worksheet",
    recommendedMinutes: 20,
  },
  {
    id: "w1-sheet-02",
    week: 1,
    title: "W1 - Blocagem Básica e Formas Primitivas",
    description: "Transformação do corpo humano em volumes geométricos (caixas, cilindros e esferas).",
    imageUrl: "/assets/aistudio/week_1_123____d4a5632c.jpg",
    category: "worksheet",
    recommendedMinutes: 30,
  },
  {
    id: "w1-sheet-03",
    week: 1,
    title: "W1 - Cânone de Proporções (8 e 9 Cabeças)",
    description: "Divisão métrica da altura humana em módulos cranianos e linhas divisórias essenciais.",
    imageUrl: "/assets/aistudio/week_1_______84f3345d.jpg",
    category: "worksheet",
    recommendedMinutes: 40,
  },
  {
    id: "w1-sheet-04",
    week: 1,
    title: "W1 - Módulos e Eixos de Alinhamento",
    description: "Orientação das clavículas, cristas ilíacas e joelhos com linhas guias verticais e horizontais.",
    imageUrl: "/assets/aistudio/week_1____fd282b71.jpg",
    category: "worksheet",
    recommendedMinutes: 35,
  },
  {
    id: "w1-sheet-05",
    week: 1,
    title: "W1 - Prancha de Anatomia Básica Tenten",
    description: "Visão frontal e posterior do manequim anatômico estruturado do autor Tenten.",
    imageUrl: "/assets/aistudio/week_1________27e3f12f.jpg",
    category: "worksheet",
    recommendedMinutes: 45,
  },
  {
    id: "w1-sheet-06",
    week: 1,
    title: "W1 - Construção do Torso e Coluna Vertebral",
    description: "Relação entre caixa torácica e bacia conectadas pela curva gestual da espinha.",
    imageUrl: "/assets/aistudio/week_1____27ceaa26.jpg",
    category: "worksheet",
    recommendedMinutes: 30,
  },
  {
    id: "w1-sheet-07",
    week: 1,
    title: "W1 - Prancha Prática iPad & Stylus #1",
    description: "Exercício guiado para desenhar sobre a camada da prancha com opacidade e rejeição de palma.",
    imageUrl: "/assets/aistudio/week_1__iPad________1_a4633da3.jpg",
    category: "exercise_guide",
    recommendedMinutes: 40,
  },
  {
    id: "w1-sheet-08",
    week: 1,
    title: "W1 - Prancha Prática iPad & Stylus #2",
    description: "Aplicação do traço limpo (lineart) e decalque de proporções sobre manequim.",
    imageUrl: "/assets/aistudio/week_1__iPad________2_f1e1bdcc.jpg",
    category: "exercise_guide",
    recommendedMinutes: 45,
  },
  {
    id: "w1-sheet-09",
    week: 1,
    title: "W1 - Estudo de Silhueta e Peso Corporal",
    description: "Identificação rápida do centro de gravidade (COG) e apoio nos calcanhares.",
    imageUrl: "/assets/aistudio/week_1__________02_eba1f55e.jpg",
    category: "worksheet",
    recommendedMinutes: 35,
  },
  {
    id: "w1-sheet-10",
    week: 1,
    title: "W1 - Dinâmica Corporal e Contrapposto",
    description: "Inclinações alternadas de ombro e pelve em poses estáticas e de peso apoiado.",
    imageUrl: "/assets/aistudio/week_1_______46deb7f5.jpg",
    category: "worksheet",
    recommendedMinutes: 40,
  },
  {
    id: "w1-sheet-11",
    week: 1,
    title: "W1 - Prancha Mestre de Alta Definição",
    description: "Comparativo detalhado de ângulos anatômicos desenhado por Tenten.",
    imageUrl: "/assets/aistudio/week_1______________d4e32a72.jpg",
    category: "worksheet",
    recommendedMinutes: 50,
  },
  {
    id: "w1-sheet-12",
    week: 1,
    title: "W1 - Guia de Prática Diária e Tarefa Semanal",
    description: "Checklist de fixação e série de repetições recomendada para a primeira semana.",
    imageUrl: "/assets/aistudio/week_1_________7fd50afe.jpg",
    category: "exercise_guide",
    recommendedMinutes: 30,
  },

  // --- Semanas 2 a 10 (Páginas Referenciais do Livro Tenten) ---
  {
    id: "w2-ref-01",
    week: 2,
    title: "W2 - Método Craniano & Cortes Laterais",
    description: "Proporções da cabeça, esferas tridimensionais e linha média.",
    imageUrl: "/api/pdf/page/48",
    category: "book_page",
    recommendedMinutes: 45,
  },
  {
    id: "w2-ref-02",
    week: 2,
    title: "W2 - Terços Faciais e Ângulos 3/4",
    description: "Construção da mandíbula, órbita ocular e inserção das orelhas.",
    imageUrl: "/api/pdf/page/72",
    category: "book_page",
    recommendedMinutes: 45,
  },
  {
    id: "w3-ref-01",
    week: 3,
    title: "W3 - Torso, Pelve e Eixos de Inclinação",
    description: "Volume tridimensional do tórax e mobilidade do quadril.",
    imageUrl: "/api/pdf/page/105",
    category: "book_page",
    recommendedMinutes: 40,
  },
  {
    id: "w4-ref-01",
    week: 4,
    title: "W4 - Membros Superiores e Articulações",
    description: "Braço, antebraço, cotovelo e mecânica de torção do rádio.",
    imageUrl: "/api/pdf/page/158",
    category: "book_page",
    recommendedMinutes: 50,
  },
  {
    id: "w5-ref-01",
    week: 5,
    title: "W5 - Arquitetura e Expressão das Mãos",
    description: "Estruturação dos nós dos dedos, palma curva e polegar.",
    imageUrl: "/api/pdf/page/210",
    category: "book_page",
    recommendedMinutes: 60,
  },
  {
    id: "w6-ref-01",
    week: 6,
    title: "W6 - Pernas, Joelhos e Pés",
    description: "Curvatura do fêmur, patela e estrutura da pisada.",
    imageUrl: "/api/pdf/page/265",
    category: "book_page",
    recommendedMinutes: 50,
  },
  {
    id: "w7-ref-01",
    week: 7,
    title: "W7 - Grupos Musculares do Tronco e Costas",
    description: "Peitorais, serrátil, abdômen e escápulas em tensão.",
    imageUrl: "/api/pdf/page/320",
    category: "book_page",
    recommendedMinutes: 50,
  },
  {
    id: "w8-ref-01",
    week: 8,
    title: "W8 - Escorço (Foreshortening) em Perspectiva",
    description: "Sobreposição de formas cônicas e anéis elípticos no espaço.",
    imageUrl: "/api/pdf/page/395",
    category: "book_page",
    recommendedMinutes: 60,
  },
  {
    id: "w9-ref-01",
    week: 9,
    title: "W9 - Caimento de Tecidos e Dobras Corporais",
    description: "Pontos de ancoragem e os tipos clássicos de dobras de vestuário.",
    imageUrl: "/api/pdf/page/450",
    category: "book_page",
    recommendedMinutes: 45,
  },
  {
    id: "w10-ref-01",
    week: 10,
    title: "W10 - Ilustração e Prancha Final Completa",
    description: "Composição anatômica acabada, ritmo corporal e acabamento de alto nível.",
    imageUrl: "/api/pdf/page/510",
    category: "book_page",
    recommendedMinutes: 90,
  },
];
