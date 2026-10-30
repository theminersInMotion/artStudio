/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_FILE_SIZE_BYTES = 2048 * 1024 * 1024; // 2GB (Livre / Sem restrição arbitrária)

export const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'pdf',
  'gif',
  'bmp',
  'svg',
] as const;

export const ALLOWED_MIME_PREFIXES = [
  'image/',
  'application/pdf',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  category?: 'image' | 'pdf' | 'other';
  formattedSize?: string;
}

/**
 * Format bytes into human-readable representation (B, KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Extract lower-cased file extension without leading dot.
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase().trim();
}

/**
 * Determine high-level category of file.
 */
export function getFileCategory(filename: string, mimeType = ''): 'image' | 'pdf' | 'other' {
  const ext = getFileExtension(filename);
  const mime = mimeType.toLowerCase();

  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'pdf';
  }

  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'svg'];
  if (imageExts.includes(ext) || mime.startsWith('image/')) {
    return 'image';
  }

  return 'other';
}

/**
 * Validates file size (max 200MB) and format (jpg, webp, png, heic, pdf, etc.)
 */
export function validateFile(file: { name: string; size: number; type?: string }): FileValidationResult {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return {
      valid: false,
      error: 'Arquivo inválido ou vazio.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `O arquivo excede o limite máximo permitido de 200 MB (tamanho atual: ${formatBytes(file.size)}).`,
      formattedSize: formatBytes(file.size),
    };
  }

  const ext = getFileExtension(file.name);
  const mime = (file.type || '').toLowerCase();

  const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(ext as any);
  const isMimeAllowed = ALLOWED_MIME_PREFIXES.some(prefix => mime.startsWith(prefix));

  if (!isExtensionAllowed && !isMimeAllowed) {
    return {
      valid: false,
      error: `Formato de arquivo .${ext || 'desconhecido'} não suportado. Envie arquivos JPG, PNG, WEBP, HEIC ou PDF.`,
      formattedSize: formatBytes(file.size),
    };
  }

  return {
    valid: true,
    category: getFileCategory(file.name, file.type),
    formattedSize: formatBytes(file.size),
  };
}

export interface WeekLessonPlan {
  week: number;
  title: string;
  subTitle: string;
  description: string;
  focusAreas: string[];
  recommendedPages: string;
  totalSuggestedHours: number;
}

export const CURRICULUM_WEEKS: WeekLessonPlan[] = [
  {
    week: 1,
    title: 'Semana 1: Proporções e Estrutura Básica',
    subTitle: 'Módulos de 8 e 9 cabeças, linha de ação e blocagem primitiva',
    description: 'Compreensão das proporções heroicas e reais da figura humana (Tenten e Loomis). Construção de manequins simplificados, eixos de equilíbrio e alinhamento dos módulos corporais.',
    focusAreas: ['Cânone de 8 e 9 cabeças', 'Linha de ação (Line of Action)', 'Caixa torácica e bacia simplificadas', 'Pele de cebola para decalque de pranchas'],
    recommendedPages: 'Págs. 12 a 45 do Livro Tenten',
    totalSuggestedHours: 8,
  },
  {
    week: 2,
    title: 'Semana 2: Cabeça, Crânio e Proporções Faciais',
    subTitle: 'Método de esferas com cortes laterais, mandíbula e ângulos tridimensionais',
    description: 'Estruturação do crânio em perspectiva tridimensional. Aplicação do método dos 3 terços faciais, linha dos olhos, base do nariz e linhas guias para orelhas.',
    focusAreas: ['Construção esférica e planos do rosto', 'Terços faciais iguais', 'Perspectiva da cabeça (vista 3/4 e plongée)', 'Linha de implantação capilar e mandíbula'],
    recommendedPages: 'Págs. 46 a 95 do Livro Tenten',
    totalSuggestedHours: 10,
  },
  {
    week: 3,
    title: 'Semana 3: Caixa Torácica, Bacia e Coluna',
    subTitle: 'O motor do movimento: torção, flexão e ritmo do tronco',
    description: 'Estudo do torso e bacia como duas massas sólidas articuladas pela coluna vertebral. Contrapposto, ritmo e relações de inclinação oposta (ombros vs quadril).',
    focusAreas: ['Contrapposto clássico', 'Volume 3D da caixa torácica oval', 'Cristas ilíacas e orientação pélvica', 'Curvaturas fisiológicas da coluna'],
    recommendedPages: 'Págs. 96 a 140 do Livro Tenten',
    totalSuggestedHours: 8,
  },
  {
    week: 4,
    title: 'Semana 4: Braços, Ombros e Antebraços',
    subTitle: 'Deltóides, bíceps, tríceps e articulação do cotovelo em movimento',
    description: 'Anatomia e conexão dos membros superiores ao esqueleto axial. Compreensão da cintura escapular, clavículas, rotação do rádio e ulna (pronação/supinação).',
    focusAreas: ['Cintura escapular e deltóide', 'Bíceps e tríceps em contração vs extensão', 'Supinação e pronação do antebraço', 'Ponto ósseo do olécrano'],
    recommendedPages: 'Págs. 141 a 195 do Livro Tenten',
    totalSuggestedHours: 10,
  },
  {
    week: 5,
    title: 'Semana 5: Mãos e Dedos com Stylus',
    subTitle: 'Planos da palma, arco dos nós dos dedos e poses expressivas',
    description: 'Desmistificação do desenho das mãos através de caixas côncavas para a palma, arco de abertura dos metacarpos e blocagem das 3 falanges por dedo com proporção áurea.',
    focusAreas: ['Plano curvo da palma e tenar/hipotenar', 'Arco natural dos nós dos dedos', 'Eixo do polegar opositor', 'Simplificação gestual antes dos detalhes'],
    recommendedPages: 'Págs. 196 a 248 do Livro Tenten',
    totalSuggestedHours: 12,
  },
  {
    week: 6,
    title: 'Semana 6: Pernas, Joelhos e Pés',
    subTitle: 'Pilar de sustentação: fêmur inclinado, patela e arco plantar',
    description: 'Arquitetura dos membros inferiores focando na sustentação de peso e equilíbrio dinâmico. Curvatura do quadríceps, tendão patelar, gastrocnêmio e estrutura do pé.',
    focusAreas: ['Ângulo de convergência do fêmur', 'Complexo da patela e ligamentos', 'Curvatura e volume da panturrilha', 'Pés em perspectiva e triângulo de sustentação'],
    recommendedPages: 'Págs. 249 a 305 do Livro Tenten',
    totalSuggestedHours: 10,
  },
  {
    week: 7,
    title: 'Semana 7: Músculos do Tronco e Costas',
    subTitle: 'Peitorais, serrátil anterior, grande dorsal e trapézio',
    description: 'Mapeamento das massas musculares do tronco vistas de frente, perfil e costas. Intersecção muscular do serrátil com o oblíquo externo e a armadura das escápulas.',
    focusAreas: ['Inserções dos grandes peitorais', 'Serrátil anterior e gomos abdominais', 'Trapézio em formato de pipa', 'Grande dorsal e linhas da coluna posterior'],
    recommendedPages: 'Págs. 306 a 370 do Livro Tenten',
    totalSuggestedHours: 10,
  },
  {
    week: 8,
    title: 'Semana 8: Escorço (Foreshortening) e Perspectiva',
    subTitle: 'Sobreposição de cilindros no espaço e ilusão de profundidade',
    description: 'Técnicas avançadas para desenhar membros projetados na direção do observador. Aplicação de anéis transversais, elipses e sobreposição de formas tridimensionais.',
    focusAreas: ['Cilindros e caixas em perspectiva de 2 e 3 pontos', 'Elipses e anéis transversais (Cross-contour)', 'Compressão visual de membros', 'Evitando erros de membro encurtado sem volume'],
    recommendedPages: 'Págs. 371 a 430 do Livro Tenten',
    totalSuggestedHours: 12,
  },
  {
    week: 9,
    title: 'Semana 9: Roupas, Dobras e Caimento Anatômico',
    subTitle: 'Os 7 tipos de dobras e como o tecido reage ao corpo',
    description: 'Entendimento dos pontos de ancoragem e tensão do vestuário sobre a anatomia subjacente. Dobras tubulares, em espiral, sanfona, zigue-zague e pontos de caimento.',
    focusAreas: ['Pontos de apoio (ombros, cotovelos, joelhos)', 'Os 7 tipos clássicos de dobras', 'Diferença de peso de tecidos (malha, couro, seda)', 'Manter a sensação do corpo por baixo da roupa'],
    recommendedPages: 'Págs. 431 a 485 do Livro Tenten',
    totalSuggestedHours: 8,
  },
  {
    week: 10,
    title: 'Semana 10: Ilustração Completa e Prancha Final',
    subTitle: 'Pose dinâmica acabada, iluminação de forma e apresentação de portfólio',
    description: 'Integração de todo o conteúdo das 10 semanas em ilustrações completas. Construção desde a linha de ação gestual até o lineart refinado e valores de sombra.',
    focusAreas: ['Fluxo de trabalho completo: Gesto → Blocagem → Anatomia → Acabamento', 'Contraste de linhas e hierarquia visual', 'Autoavaliação e comparação de pranchas', 'Exportação de alta resolução'],
    recommendedPages: 'Págs. 486 a 537 do Livro Tenten',
    totalSuggestedHours: 14,
  },
];
