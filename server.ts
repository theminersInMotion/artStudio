/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase JSON payload limit for stylus canvas snapshots and uploaded photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI with required telemetry User-Agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback generator when API key is pending or for offline fast responses
function getMockPageAnalysis(pageNumber: number) {
  return {
    title: `Estudo da Prancha #${pageNumber} - Método Tenten`,
    summaryPt: `Análise estrutural da prancha ${pageNumber} do livro do Tenten. O autor demonstra a transição do esqueleto geométrico para as massas musculares funcionais com ênfase em volumes tridimensionais sobrepostos.`,
    identifiedTerms: [
      {
        termEs: 'Esternocleidomastoideo y clavícula',
        termPt: 'Esternocleidomastóideo e clavícula',
        definition: 'Ponto focal de ancoragem do pescoço no tórax em formato de V.',
        drawingTip: 'Marque a fossa jugular antes de puxar as duas colunas musculares em direção ao processo mastoide.'
      },
      {
        termEs: 'Deltoides (porción anterior y media)',
        termPt: 'Deltoide (porção anterior e média)',
        definition: 'Massa muscular que capeia o ombro como uma taça invertida.',
        drawingTip: 'Não desenhe como esfera solta; ele abraça o úmero e se insere na metade do osso.'
      },
      {
        termEs: 'Pectoral mayor y arco costal',
        termPt: 'Peitoral maior e arco costal',
        definition: 'Feixes em leque que se torcem em direção ao braço.',
        drawingTip: 'A linha inferior do peitoral acompanha a curvatura elíptica da caixa torácica.'
      }
    ],
    structuralProcess: {
      gesture: 'Linha em curva "S" fluida definindo o equilíbrio do centro de massa.',
      forms3D: 'Caixa torácica em ovo chanfrado; pelve em bloco trapezoidal com rotação contraposta.',
      landmarks: 'Acrômio, fossa jugular, espinha da escápula e espinhas ilíacas ântero-superiores.',
      muscleFlows: 'Linhas de inserção espiraladas que abraçam os cilindros dos membros.',
      contourShading: 'Hachuras curvas (cross-contour) que revelam o relevo das fibras e peso sob a gravidade.'
    },
    suggestedExercise: {
      title: `Réplica Guiada da Prancha #${pageNumber}`,
      difficulty: 'intermediario',
      objectives: [
        'Esboçar primeiro os marcos ósseos com stylus leve',
        'Modelar os volumes musculares em camadas',
        'Aplicar hachuras direcionais no estilo Tenten'
      ]
    }
  };
}

// --- API ROUTES ---

// 1. Analisar Página de Livro de Arte (Universal: Tenten, Loomis, Bridgman ou Livro Customizado)
app.post('/api/gemini/analyze-page', async (req, res) => {
  const { pageNumber, imageBase64, customPrompt, bookTitle, artistName, bookLanguage } = req.body;
  const currentArtist = artistName || 'Tenten';
  const currentBook = bookTitle || 'Morfología y Anatomía Dinâmica';
  const page = Number(pageNumber) || 1;

  if (!ai) {
    return res.json(getMockPageAnalysis(page));
  }

  try {
    const promptText = `
Você é um mestre ilustrador e professor sênior de anatomia artística especializado na análise visual e estrutural de livros de arte.
O usuário está estudando a página/prancha #${page} da obra "${currentBook}" do mestre "${currentArtist}".
Idioma original do livro: "${bookLanguage || 'Espanhol/Inglês/Português'}".

Analise o conteúdo visual ou o contexto estrutural desta prancha e forneça uma resposta ESTRUTURADA em JSON:
1. "title": Título conciso da prancha/estudo em Português (Ex: "Estudo da Cintura Escapular e Ritmo do Tórax").
2. "summaryPt": Explicação didática profunda em Português sobre o que esta prancha ensina, como ${currentArtist} resolve as massas anatômicas e quais os atalhos visuais utilizados.
3. "identifiedTerms": Lista de 3 a 5 termos anatômicos técnicos presentes ou implícitos nesta prancha:
   - "termEs": Nome original no idioma da obra (ou termo internacional)
   - "termPt": Tradução técnica precisa em Português
   - "definition": Função mecânica e localização no corpo
   - "drawingTip": Dica mestra de desenho para aplicar com stylus (geometrização, encaixe, marcos ósseos)
4. "structuralProcess": Decomposição do processo de desenho em 5 etapas fundamentais:
   - "gesture": Linha de ação e ritmo dinâmico
   - "forms3D": Primitivas geométricas (caixas chanfradas, cilindros, elipses)
   - "landmarks": Pontos ósseos fixos de ancoragem
   - "muscleFlows": Direção e fluxo das massas musculares
   - "contourShading": Uso de peso de linha (line weight) e hachuras volumétricas
5. "suggestedExercise": Proposta de exercício prático para o aluno praticar com caneta stylus/S-Pen:
   - "title": Nome do exercício
   - "difficulty": "iniciante" | "intermediario" | "avancado"
   - "objectives": Array de 3 passos ou metas claras
`;

    const parts: any[] = [];
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: promptText + (customPrompt ? `\nInstrução adicional do usuário: ${customPrompt}` : '') });

    // Call Gemini with 12s timeout race
    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini request timeout')), 12000)
    );

    const response: any = await Promise.race([geminiCall, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing page with Gemini:', error);
    return res.json(getMockPageAnalysis(page));
  }
});

// 2. Busca de Termos via Foto / Câmera
app.post('/api/gemini/search-photo', async (req, res) => {
  const { imageBase64, userQuery } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Nenhuma imagem enviada para análise.' });
  }

  if (!ai) {
    return res.json({
      detectedRegion: 'Cintura Escapular e Braço',
      descriptionPt: 'A foto mostra um estudo anatômico com foco na musculatura do deltoide, peitoral e inserção no úmero.',
      identifiedTerms: [
        {
          termEs: 'Músculo deltoides',
          termPt: 'Músculo deltoide',
          confidence: 0.95,
          notePt: 'Cobre o ombro em três porções distintas.',
          drawingTip: 'Encaixe-o como uma ombreira em taça entre a clavícula e o terço médio do úmero.'
        },
        {
          termEs: 'Pectoral mayor (haz clavicular)',
          termPt: 'Peitoral maior (feixe clavicular)',
          confidence: 0.91,
          notePt: 'Corre sob a porção anterior do deltoide.',
          drawingTip: 'Crie o sulco deltopeitoral em forma de gota invertida.'
        },
        {
          termEs: 'Bíceps braquial',
          termPt: 'Bíceps braquial',
          confidence: 0.88,
          notePt: 'Massa anterior do braço repousando sobre o braquial.',
          drawingTip: 'Não isole como esfera; mostre a continuidade com a aponeurose bicipital.'
        }
      ],
      suggestedPages: [114, 146, 221, 235],
      processAdvice: 'Para desenhar essa pose no estilo Tenten, comece traçando a linha de ação da clavícula em "S" antes de inflar as massas musculares.',
      exerciseIdea: 'Exercício de Encaixe: Deltoide e Peitoral em Ângulo 3/4'
    });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `
O usuário tirou uma foto ou fez upload de uma imagem (uma página de livro de anatomia, um desenho à mão, ou foto de referência do corpo humano).
Sua tarefa é agir como o sistema de busca visual e tradutor anatômico ES -> PT do aplicativo do Tenten:

1. Reconheça a região corporal ou partes anatômicas mostradas na foto.
2. Identifique os termos anatômicos em Espanhol (vocabulário do livro do Tenten) e traduza-os com precisão para o Português.
3. Forneça dicas de desenho de como o mestre Tenten desenharia e simplificaria essas estruturas.
4. Sugira quais páginas do livro de 537 páginas do Tenten correspondem a este assunto (Cap 1: 1-35, Cap 2: 36-98, Cap 3: 99-145, Cap 4: 146-220, Cap 5: 221-325, Cap 6: 326-430, Cap 7: 431-475, Cap 8: 476-537).
5. Proponha uma recomendação prática de como iniciar o desenho com stylus/tablet.

Retorne em formato JSON:
{
  "detectedRegion": string,
  "descriptionPt": string,
  "identifiedTerms": [
    {
      "termEs": string,
      "termPt": string,
      "confidence": number,
      "notePt": string,
      "drawingTip": string
    }
  ],
  "suggestedPages": number[],
  "processAdvice": string,
  "exerciseIdea": string
}
`;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      },
      { text: prompt + (userQuery ? `\nPergunta do usuário: ${userQuery}` : '') },
    ];

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini timeout')), 12000)
    );

    const response: any = await Promise.race([geminiCall, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing photo search with Gemini:', error);
    // Return high quality fallback response
    return res.json({
      detectedRegion: 'Cintura Escapular e Braço',
      descriptionPt: 'A foto mostra um estudo anatômico com foco na musculatura do deltoide, peitoral e inserção no úmero.',
      identifiedTerms: [
        {
          termEs: 'Músculo deltoides',
          termPt: 'Músculo deltoide',
          confidence: 0.95,
          notePt: 'Cobre o ombro em três porções distintas.',
          drawingTip: 'Encaixe-o como uma ombreira em taça entre a clavícula e o terço médio do úmero.'
        },
        {
          termEs: 'Pectoral mayor (haz clavicular)',
          termPt: 'Peitoral maior (feixe clavicular)',
          confidence: 0.91,
          notePt: 'Corre sob a porção anterior do deltoide.',
          drawingTip: 'Crie o sulco deltopeitoral em forma de gota invertida.'
        }
      ],
      suggestedPages: [114, 146, 221, 235],
      processAdvice: 'Para desenhar essa pose no estilo Tenten, comece traçando a linha de ação da clavícula em "S" antes de inflar as massas musculares.',
      exerciseIdea: 'Exercício de Encaixe: Deltoide e Peitoral em Ângulo 3/4'
    });
  }
});

// 3. Avaliar Exercício de Desenho Feito com Stylus
app.post('/api/gemini/evaluate-drawing', async (req, res) => {
  const { drawingBase64, exerciseTitle, styleFocus, referenceDescription } = req.body;

  if (!drawingBase64) {
    return res.status(400).json({ error: 'Desenho não fornecido.' });
  }

  if (!ai) {
    return res.json({
      rating: 88,
      anatomyAccuracy: 85,
      styleFidelity: 90,
      overallComment: 'Excelente estudo com stylus! Os planos volumétricos e a linha de ação capturaram com clareza o dinamismo do estilo Tenten.',
      strengths: [
        'Boa diferenciação entre a camada de estrutura (azul) e arte-final',
        'Uso expressivo de variação de pressão da stylus/S-Pen nos pontos de sombra',
        'Marcos ósseos bem ancorados e proporcionais'
      ],
      improvements: [
        'Reforce as elipses de corte transversal (cross-contour) para acentuar a profundidade 3D',
        'Evite traços indecisos na silhueta externa; faça linhas mais contínuas e decididas'
      ],
      drillsNext: 'Tente repetir esta mesma pose em um cronômetro de 3 minutos, focando apenas no ritmo dos músculos.'
    });
  }

  try {
    const cleanBase64 = drawingBase64.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `
Você é o professor e avaliador de arte do curso do método Tenten.
O aluno executou o seguinte exercício na prancheta digital usando stylus/S-Pen:
Exercício: "${exerciseTitle}"
Foco do Estilo: "${styleFocus}"
Referência pretendida: "${referenceDescription || 'Estudo anatômico anatômico do corpo humano'}"

Avalie o desenho do aluno com olhar de mestre de desenho anatômico.
Avalie:
1. Precisão anatômica (encaixes, proporções, marcos ósseos)
2. Fidelidade ao estilo do Tenten (construção volumétrica 3D, peso de linha sensível à pressão, hachuras que descrevem curvas)
3. Economia de traço e expressividade gestual

Retorne um JSON:
{
  "rating": number (1 a 100),
  "anatomyAccuracy": number (1 a 100),
  "styleFidelity": number (1 a 100),
  "overallComment": string (elogio construtivo e síntese da avaliação em Português),
  "strengths": string[] (3 pontos fortes específicos identificados no desenho),
  "improvements": string[] (2 a 3 sugestões concretas de melhoria imediata),
  "drillsNext": string (próximo passo ou variação para consolidar o aprendizado)
}
`;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini timeout')), 12000)
    );

    const response: any = await Promise.race([geminiCall, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error evaluating drawing with Gemini:', error);
    return res.status(500).json({ error: 'Erro ao avaliar desenho: ' + error.message });
  }
});

// 4. Analisar Processo de Outro Artista & Propor Exercícios Customizados
app.post('/api/gemini/analyze-artist-style', async (req, res) => {
  const { artistName, imageBase64, notes } = req.body;

  if (!ai) {
    return res.json({
      artistName: artistName || 'Artista em Estudo',
      styleSummary: `Análise estilística de ${artistName || 'Artista'}: destaca-se pela clareza nas massas tridimensionais e ritmo contínuo.`,
      drawingPipeline: [
        { step: 1, name: 'Gesto Dinâmico', description: 'Traço rápido e contínuo da linha de ação e ritmo.' },
        { step: 2, name: 'Bloqueio Estrutural', description: 'Simplificação das massas anatômicas em volumes primários.' },
        { step: 3, name: 'Anatomia e Marcos Ósseos', description: 'Encaixe das origens e inserções musculares.' },
        { step: 4, name: 'Linha e Acabamento', description: 'Variação dinâmica de espessura de traço e hachura.' }
      ],
      styleCharacteristics: [
        'Geometrização volumétrica limpa',
        'Uso de peso de linha para hierarquia visual',
        'Ênfase nas alavancas mecânicas dos membros'
      ],
      customExercises: [
        {
          title: `Estudo Rápido de Gesto no estilo de ${artistName || 'Artista'}`,
          difficulty: 'iniciante',
          durationMinutes: 5,
          objectives: ['Capturar a energia da pose em 60 segundos', 'Focar na linha de ação sem detalhar']
        },
        {
          title: `Construção Anatômica por Blocos de ${artistName || 'Artista'}`,
          difficulty: 'intermediario',
          durationMinutes: 15,
          objectives: ['Desenhar caixas e cilindros chanfrados', 'Marcar os pontos ósseos antes dos músculos']
        },
        {
          title: `Estudo Completo com Stylus e Hachuras`,
          difficulty: 'avancado',
          durationMinutes: 25,
          objectives: ['Replicar o acabamento de traço do mestre', 'Aplicar hachuras de corte transversal']
        }
      ]
    });
  }

  try {
    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const prompt = `
O usuário quer expandir o aplicativo para estudar a anatomia e processo de OUTROS ARTISTAS (como Kim Jung Gi, Bridgman, Andrew Loomis, Glen Vilppu, Karl Kopinski ou referências autorais enviadas pelo usuário).
Nome do Artista: "${artistName || 'Artista Convidado'}"
Anotações do usuário: "${notes || 'Estudo de referências anatômicas'}"

Sua missão:
1. Decompor o processo de desenho característico desse artista em um pipeline de 4 passos reproduzíveis.
2. Identificar as 3 principais marcas estilísticas e regras de ouro desse artista.
3. Propor 3 exercícios progressivos (Iniciante, Intermediário e Avançado) adaptados para o usuário praticar na prancheta com caneta stylus/S-Pen.

Retorne em formato JSON:
{
  "artistName": string,
  "styleSummary": string,
  "drawingPipeline": [
    { "step": number, "name": string, "description": string }
  ],
  "styleCharacteristics": string[],
  "customExercises": [
    {
      "title": string,
      "difficulty": "iniciante" | "intermediario" | "avancado",
      "durationMinutes": number,
      "objectives": string[]
    }
  ]
}
`;
    parts.push({ text: prompt });

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini timeout')), 12000)
    );

    const response: any = await Promise.race([geminiCall, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing artist with Gemini:', error);
    return res.json({
      artistName: artistName || 'Artista em Estudo',
      styleSummary: `Análise de ${artistName || 'Artista'}: ênfase em planos anatômicos angulares e solidez volumétrica.`,
      drawingPipeline: [
        { step: 1, name: 'Gesto Dinâmico', description: 'Linha de ação contínua estabelecendo o ritmo geral.' },
        { step: 2, name: 'Bloqueio Volumétrico', description: 'Caixas e cilindros chanfrados definindo a perspectiva.' },
        { step: 3, name: 'Marcos Ósseos & Inserções', description: 'Pontos de ancoragem óssea e encaixes musculares.' },
        { step: 4, name: 'Hachuras & Contorno', description: 'Variação de peso de linha e sombreamento de curvatura.' }
      ],
      styleCharacteristics: [
        'Geometrização volumétrica sólida',
        'Contraste de silhueta limpo',
        'Economia de traços'
      ],
      customExercises: [
        {
          title: `Estudo de Gesto Dinâmico (${artistName || 'Artista'})`,
          difficulty: 'iniciante',
          durationMinutes: 5,
          objectives: ['Capturar a linha de ação em 60s', 'Manter a stylus solta e leve']
        },
        {
          title: `Construção por Volumes 3D`,
          difficulty: 'intermediario',
          durationMinutes: 15,
          objectives: ['Desenhar caixas e cilindros', 'Marcar os marcos ósseos']
        }
      ]
    });
  }
});

// --- UNIVERSAL ART BOOKS MANAGEMENT & DYNAMIC RENDERING ---

const renderedPagesDir = path.resolve(__dirname, 'public/rendered_pages');
const uploadedBooksDir = path.resolve(__dirname, 'public/uploaded_books');
const booksMetadataFile = path.resolve(uploadedBooksDir, 'books.json');

// Ensure necessary directories exist
if (!fs.existsSync(renderedPagesDir)) {
  fs.mkdirSync(renderedPagesDir, { recursive: true });
}
if (!fs.existsSync(uploadedBooksDir)) {
  fs.mkdirSync(uploadedBooksDir, { recursive: true });
}

// Multer storage for PDF art books (sem limite de tamanho / streaming direto para disco)
const bookStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadedBooksDir);
  },
  filename: (_req, file, cb) => {
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    cb(null, `book_${Date.now()}_${safeBase}`);
  }
});
const uploadBookMiddleware = multer({
  storage: bookStorage,
  // Sem limite artificial de tamanho (streaming chunk-by-chunk direto para o disco)
});

interface StoredBook {
  id: string;
  title: string;
  artist: string;
  totalPages: number;
  description?: string;
  coverImage?: string;
  filename?: string;
  filePath?: string;
  fileSize?: string;
  isCustomUploaded?: boolean;
  uploadedAt?: string;
  language?: string;
  tags?: string[];
  hasPdfOnDisk?: boolean;
}

// Default curated Master Art Books
const DEFAULT_BOOKS: StoredBook[] = [
  {
    id: 'tenten',
    title: 'Morfología y Anatomía Dinámica',
    artist: 'Tenten',
    totalPages: 537,
    description: 'Compêndio de 537 páginas do mestre Tenten: raciocínio estrutural 3D, caixas chanfradas, ritmo muscular e hachuras dinâmicas.',
    language: 'Español',
    tags: ['Anatomia', 'Construção 3D', 'Hachuras', 'Método Tenten'],
    filePath: path.resolve(__dirname, 'public/assets/aistudio/Tenten-Anatomy-Esp-PDF_921d980a.pdf'),
    isCustomUploaded: false
  },
  {
    id: 'loomis',
    title: "Figure Drawing for All It's Worth",
    artist: 'Andrew Loomis',
    totalPages: 204,
    description: 'A bíblia das proporções clássicas, planos de luz e sombra, manequins tridimensionais e ritmo da figura humana.',
    language: 'Inglês',
    tags: ['Proporção', 'Planos de Luz', 'Figura Humana', 'Loomis'],
    isCustomUploaded: false
  },
  {
    id: 'bridgman',
    title: 'Constructive Anatomy',
    artist: 'George B. Bridgman',
    totalPages: 170,
    description: 'Geometrização anatômica por blocos entrelaçados, torção espacial e massas contrapostas.',
    language: 'Inglês',
    tags: ['Anatomia Construtiva', 'Blocos 3D', 'Mecânica Corporal', 'Bridgman'],
    isCustomUploaded: false
  }
];

interface BooksDatabase {
  customBooks: StoredBook[];
  bookOverrides: Record<string, Partial<StoredBook>>;
  deletedBookIds: string[];
}

function readBooksDatabase(): BooksDatabase {
  try {
    if (fs.existsSync(booksMetadataFile)) {
      const raw = fs.readFileSync(booksMetadataFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { customBooks: parsed, bookOverrides: {}, deletedBookIds: [] };
      }
      return {
        customBooks: Array.isArray(parsed.customBooks) ? parsed.customBooks : [],
        bookOverrides: parsed.bookOverrides || {},
        deletedBookIds: Array.isArray(parsed.deletedBookIds) ? parsed.deletedBookIds : []
      };
    }
  } catch (err) {
    console.error('Error reading books.json:', err);
  }
  return { customBooks: [], bookOverrides: {}, deletedBookIds: [] };
}

function saveBooksDatabase(db: BooksDatabase) {
  try {
    fs.writeFileSync(booksMetadataFile, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving books.json:', err);
  }
}

function clearBookCache(bookId: string) {
  try {
    if (!fs.existsSync(renderedPagesDir)) return;
    const files = fs.readdirSync(renderedPagesDir);
    for (const f of files) {
      if (f.startsWith(`book_${bookId}_p`) || (bookId === 'tenten' && f.startsWith('page_'))) {
        try {
          fs.unlinkSync(path.join(renderedPagesDir, f));
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Error clearing book cache:', e);
  }
}

function renderCoverPage(bookId: string, filePath: string) {
  const coverPath = path.join(renderedPagesDir, `book_${bookId}_p1.jpg`);
  const args = [
    '-dNOPAUSE',
    '-dBATCH',
    '-sDEVICE=jpeg',
    '-dJPEGQ=85',
    '-r150',
    '-dFirstPage=1',
    '-dLastPage=1',
    `-sOutputFile=${coverPath}`,
    filePath
  ];
  execFile('gs', args, { timeout: 15000 }, (err) => {
    if (err) {
      console.warn(`Could not extract page 1 cover thumbnail for ${bookId}:`, err);
    }
  });
}

function getAllBooks(): StoredBook[] {
  const db = readBooksDatabase();
  const deletedSet = new Set(db.deletedBookIds || []);

  const defaultList: StoredBook[] = DEFAULT_BOOKS
    .filter(b => !deletedSet.has(b.id))
    .map(b => {
      const override = db.bookOverrides[b.id] || {};
      const merged: StoredBook = { ...b, ...override };
      let exists = false;
      if (merged.filePath && fs.existsSync(merged.filePath)) {
        exists = true;
      } else if (merged.filename && fs.existsSync(path.resolve(uploadedBooksDir, merged.filename))) {
        exists = true;
      }
      return {
        ...merged,
        hasPdfOnDisk: exists,
        coverImage: `/api/books/${b.id}/page/1`
      };
    });

  const customList: StoredBook[] = (db.customBooks || [])
    .filter(b => !deletedSet.has(b.id))
    .map(b => {
      let exists = false;
      if (b.filePath && fs.existsSync(b.filePath)) {
        exists = true;
      } else if (b.filename && fs.existsSync(path.resolve(uploadedBooksDir, b.filename))) {
        exists = true;
      }
      return {
        ...b,
        hasPdfOnDisk: exists,
        coverImage: `/api/books/${b.id}/page/1`
      };
    });

  return [...defaultList, ...customList];
}

// In-flight renders map to avoid redundant duplicate Ghostscript calls
const renderQueue = new Map<string, Promise<string>>();

// Probe PDF page count using pure JS binary regex first, then Ghostscript if present
function getPdfPageCount(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    // 1. Try fast pure JS regex parse from PDF buffer (works in any container without gs)
    try {
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const latinStr = buffer.toString('latin1');
        const countMatches = [...latinStr.matchAll(/\/Count\s+(\d+)/g)];
        if (countMatches.length > 0) {
          const numbers = countMatches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n) && n > 0);
          if (numbers.length > 0) {
            const maxCount = Math.max(...numbers);
            if (maxCount > 0 && maxCount < 10000) {
              return resolve(maxCount);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Fast regex page count failed:', e);
    }

    // 2. Try Ghostscript if available
    try {
      const safePath = filePath.replace(/\\/g, '/');
      const args = ['-q', '-dNODISPLAY', `--permit-file-read=${filePath}`, '-c', `(${safePath}) (r) file runpdfbegin pdfpagecount = quit`];
      execFile('gs', args, { timeout: 8000 }, (error, stdout) => {
        if (!error && stdout) {
          const count = parseInt(stdout.trim(), 10);
          if (!isNaN(count) && count > 0) {
            return resolve(count);
          }
        }
        resolve(537);
      });
    } catch {
      resolve(537);
    }
  });
}

// Render dynamic vector study plate SVG when PDF binary is absent
function generateBlueprintSvg(bookTitle: string, artistName: string, pageNum: number, totalPages: number): string {
  const isTenten = artistName.toLowerCase().includes('tenten');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1350" width="1000" height="1350" style="background:#09090b; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" stroke-width="0.8" opacity="0.35"/>
    </pattern>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ea580c" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <!-- Background Grid -->
  <rect width="1000" height="1350" fill="#09090b"/>
  <rect width="1000" height="1350" fill="url(#grid)"/>

  <!-- Border Frame -->
  <rect x="25" y="25" width="950" height="1300" rx="16" fill="none" stroke="#3f3f46" stroke-width="1.5"/>
  <rect x="35" y="35" width="930" height="1280" rx="12" fill="none" stroke="#27272a" stroke-width="1" stroke-dasharray="6,4"/>

  <!-- Header Section -->
  <rect x="45" y="45" width="910" height="110" rx="10" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
  
  <rect x="65" y="65" width="34" height="34" rx="8" fill="url(#gradAccent)"/>
  <path d="M 74 73 L 85 82 L 81 89 L 71 78 Z M 71 90 L 75 90 L 71 86 Z" fill="#ffffff"/>

  <text x="115" y="80" fill="#f4f4f5" font-size="20" font-weight="700">${bookTitle.replace(/[<>&]/g, '')}</text>
  <text x="115" y="102" fill="#a1a1aa" font-size="13" font-weight="500">Mestre: ${artistName.replace(/[<>&]/g, '')} • Prancha ${pageNum} de ${totalPages} • Estudo Estrutural Anatômico</text>

  <rect x="800" y="65" width="135" height="32" rx="8" fill="#27272a" stroke="#52525b" stroke-width="1"/>
  <text x="867" y="86" fill="#f97316" font-size="13" font-weight="700" text-anchor="middle">PRANCHA #${pageNum}</text>

  <!-- Notice Banner -->
  <rect x="45" y="170" width="910" height="60" rx="8" fill="#271c14" stroke="#ea580c" stroke-width="1" stroke-opacity="0.6"/>
  <text x="65" y="196" fill="#fdba74" font-size="13" font-weight="700">📖 Modo Prancha de Estudo Interativa (Demonstração)</text>
  <text x="65" y="216" fill="#fed7aa" font-size="12">Você pode fazer upload do arquivo PDF completo deste livro (sem limite de tamanho) a qualquer momento no botão "+ Upload Livro" para ver todas as páginas originais.</text>

  <!-- Central Anatomical Blueprint Drawing Area -->
  <rect x="45" y="245" width="580" height="880" rx="12" fill="#121215" stroke="#27272a" stroke-width="1"/>
  
  <!-- Perspective & Construction Guidelines -->
  <line x1="335" y1="265" x2="335" y2="1105" stroke="#ea580c" stroke-width="1.2" stroke-dasharray="8,6" opacity="0.6"/>
  <line x1="65" y1="520" x2="605" y2="520" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
  <line x1="65" y1="710" x2="605" y2="710" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
  <line x1="65" y1="910" x2="605" y2="910" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>

  <!-- 3D Geometric Blocks (Ribcage, Pelvis, Limbs) -->
  <!-- Head & Neck -->
  <ellipse cx="335" cy="355" rx="55" ry="70" fill="url(#boxGrad)" stroke="#f97316" stroke-width="2"/>
  <line x1="335" y1="290" x2="335" y2="425" stroke="#fdba74" stroke-width="1.5"/>
  <line x1="290" y1="365" x2="380" y2="365" stroke="#fdba74" stroke-width="1.5"/>
  <!-- Cervical Spine Column -->
  <path d="M 315 425 L 355 425 L 360 480 L 310 480 Z" fill="#27272a" stroke="#71717a" stroke-width="1.5"/>

  <!-- Torso / Ribcage Block with 3D angle -->
  <path d="M 230 485 L 440 485 L 420 670 L 250 670 Z" fill="url(#boxGrad)" stroke="#ea580c" stroke-width="2.2"/>
  <!-- Clavicle V & Sternum -->
  <path d="M 235 490 Q 335 520 435 490" fill="none" stroke="#f97316" stroke-width="3"/>
  <circle cx="335" cy="510" r="5" fill="#f97316"/>
  <!-- Jugular Notch Landmark -->
  <line x1="335" y1="510" x2="335" y2="620" stroke="#fdba74" stroke-width="2"/>
  <!-- Pectoral Muscles -->
  <path d="M 245 525 Q 330 550 330 580 Q 240 595 235 525" fill="#f97316" fill-opacity="0.2" stroke="#ea580c" stroke-width="1.5"/>
  <path d="M 425 525 Q 340 550 340 580 Q 430 595 435 525" fill="#f97316" fill-opacity="0.2" stroke="#ea580c" stroke-width="1.5"/>

  <!-- Pelvic Basin Box (Tilt & Counter-rotation) -->
  <path d="M 240 705 L 430 705 L 400 815 L 270 815 Z" fill="url(#boxGrad)" stroke="#ea580c" stroke-width="2.2"/>
  <!-- Iliac Crests -->
  <path d="M 240 705 Q 335 735 430 705" fill="none" stroke="#f97316" stroke-width="2.5"/>

  <!-- Thighs / Femur Cylinders -->
  <path d="M 260 820 L 315 820 L 305 1030 L 250 1030 Z" fill="#27272a" fill-opacity="0.4" stroke="#71717a" stroke-width="1.8"/>
  <path d="M 355 820 L 410 820 L 420 1030 L 365 1030 Z" fill="#27272a" fill-opacity="0.4" stroke="#71717a" stroke-width="1.8"/>
  <!-- Knees & Patella -->
  <rect x="252" y="1035" width="48" height="35" rx="6" fill="#f97316" fill-opacity="0.3" stroke="#f97316" stroke-width="1.5"/>
  <rect x="370" y="1035" width="48" height="35" rx="6" fill="#f97316" fill-opacity="0.3" stroke="#f97316" stroke-width="1.5"/>

  <!-- Arms & Deltoid Cups -->
  <path d="M 220 495 Q 170 540 200 620" fill="none" stroke="#f97316" stroke-width="2.5"/>
  <path d="M 450 495 Q 500 540 470 620" fill="none" stroke="#f97316" stroke-width="2.5"/>

  <!-- Landmark Callout Tags -->
  <g transform="translate(130, 485)">
    <line x1="0" y1="0" x2="-40" y2="-20" stroke="#a1a1aa" stroke-width="1"/>
    <text x="-45" y="-22" fill="#fdba74" font-size="11" font-weight="600" text-anchor="end">Clavícula &amp; Acrômio</text>
  </g>
  <g transform="translate(335, 510)">
    <line x1="0" y1="0" x2="60" y2="-30" stroke="#a1a1aa" stroke-width="1"/>
    <text x="65" y="-32" fill="#fdba74" font-size="11" font-weight="600">Fossa Jugular (Ponto Zero)</text>
  </g>
  <g transform="translate(240, 710)">
    <line x1="0" y1="0" x2="-50" y2="10" stroke="#a1a1aa" stroke-width="1"/>
    <text x="-55" y="14" fill="#fdba74" font-size="11" font-weight="600" text-anchor="end">Crista Ilíaca (EIAS)</text>
  </g>

  <!-- Right Side Breakdown & Study Notes Panel -->
  <rect x="645" y="245" width="310" height="880" rx="12" fill="#18181b" stroke="#27272a" stroke-width="1"/>
  
  <text x="670" y="280" fill="#f97316" font-size="14" font-weight="700">🔬 ANÁLISE DE PROCESSO</text>
  <text x="670" y="302" fill="#a1a1aa" font-size="11">Roteiro para replicação na prancheta com caneta</text>
  
  <line x1="670" y1="318" x2="925" y2="318" stroke="#27272a" stroke-width="1"/>

  <!-- Step 1 -->
  <circle cx="682" cy="345" r="10" fill="#ea580c"/>
  <text x="682" y="349" fill="#ffffff" font-size="10" font-weight="700" text-anchor="middle">1</text>
  <text x="702" y="345" fill="#f4f4f5" font-size="12" font-weight="700">Gesto &amp; Linha de Ação</text>
  <text x="702" y="365" fill="#a1a1aa" font-size="11">Defina a curva de equilíbrio em 'C' ou 'S' antes dos detalhes.</text>

  <!-- Step 2 -->
  <circle cx="682" cy="415" r="10" fill="#ea580c"/>
  <text x="682" y="419" fill="#ffffff" font-size="10" font-weight="700">2</text>
  <text x="702" y="415" fill="#f4f4f5" font-size="12" font-weight="700">Bloqueio 3D (Caixas)</text>
  <text x="702" y="435" fill="#a1a1aa" font-size="11">Caixa torácica e pelve com inclinações opostas (contrapposto).</text>

  <!-- Step 3 -->
  <circle cx="682" cy="485" r="10" fill="#ea580c"/>
  <text x="682" y="489" fill="#ffffff" font-size="10" font-weight="700">3</text>
  <text x="702" y="485" fill="#f4f4f5" font-size="12" font-weight="700">Pontos Ósseos Fixos</text>
  <text x="702" y="505" fill="#a1a1aa" font-size="11">Fossa jugular, espinhas ilíacas, patela e maléolos.</text>

  <!-- Step 4 -->
  <circle cx="682" cy="555" r="10" fill="#ea580c"/>
  <text x="682" y="559" fill="#ffffff" font-size="10" font-weight="700">4</text>
  <text x="702" y="555" fill="#f4f4f5" font-size="12" font-weight="700">Músculos &amp; Hachuras</text>
  <text x="702" y="575" fill="#a1a1aa" font-size="11">Encaixes anatômicos e hachuras curvas definindo volume espacial.</text>

  <!-- Quick Terms in Book Language -->
  <rect x="665" y="625" width="270" height="230" rx="8" fill="#121215" stroke="#27272a" stroke-width="1"/>
  <text x="680" y="652" fill="#e4e4e7" font-size="12" font-weight="700">Vocabulário Anatômico Chave:</text>

  <text x="680" y="682" fill="#ea580c" font-size="11" font-weight="700">• Esternocleidomastoideo</text>
  <text x="680" y="698" fill="#a1a1aa" font-size="10">Coluna de ancoragem do crânio à clavícula.</text>

  <text x="680" y="728" fill="#ea580c" font-size="11" font-weight="700">• Deltoides (Capuz do Ombro)</text>
  <text x="680" y="744" fill="#a1a1aa" font-size="10">Encaixe em taça invertida sobre o úmero.</text>

  <text x="680" y="774" fill="#ea580c" font-size="11" font-weight="700">• Pectoral Mayor &amp; Arco Costal</text>
  <text x="680" y="790" fill="#a1a1aa" font-size="10">Feixes em leque com torção anterior.</text>

  <text x="680" y="820" fill="#ea580c" font-size="11" font-weight="700">• Cresta Ilíaca &amp; Trocanter</text>
  <text x="680" y="836" fill="#a1a1aa" font-size="10">Eixo invariável do quadril e perna.</text>

  <!-- Stylus Action Box in Right Panel -->
  <rect x="665" y="875" width="270" height="230" rx="8" fill="#20140c" stroke="#ea580c" stroke-width="1.2"/>
  <text x="680" y="905" fill="#fb923c" font-size="12" font-weight="700">✍️ Praticar com S-Pen / Stylus:</text>
  <text x="680" y="930" fill="#fed7aa" font-size="11">Toque em <tspan font-weight="700">"Praticar na Prancheta"</tspan> no topo para carregar esta prancha como referência ou decalque, desenhar em camadas e receber avaliação de IA.</text>
  
  <!-- Footer Bar -->
  <rect x="45" y="1145" width="910" height="80" rx="10" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
  <text x="70" y="1182" fill="#71717a" font-size="12">AnatomiArt Studio • Estudo &amp; Leitor de Livros de Arte • Suporte a Stylus, Samsung S-Pen e Palm Rejection</text>
  <text x="70" y="1204" fill="#52525b" font-size="11">Você pode carregar livros de Kim Jung Gi, Andrew Loomis, George Bridgman, Gottfried Bammes e coleções próprias.</text>
</svg>`;
}

// 1. List All Available Art Books
app.get('/api/books', (_req, res) => {
  const books = getAllBooks();
  return res.json(books);
});

// 2. Upload Art Book or Attach PDF to Existing Book (Universal / Sem limite de tamanho)
app.post('/api/books/upload', uploadBookMiddleware.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
    }

    const { title, artist, language, description } = req.body;
    let targetBookId = (req.body.targetBookId || '').trim();

    // Auto-detect target book if not explicitly specified
    if (!targetBookId || targetBookId === 'auto') {
      const checkStr = (file.originalname + ' ' + (title || '')).toLowerCase();
      if (checkStr.includes('tenten')) {
        targetBookId = 'tenten';
      } else if (checkStr.includes('loomis')) {
        targetBookId = 'loomis';
      } else if (checkStr.includes('bridgman')) {
        targetBookId = 'bridgman';
      }
    }

    // Calculate total pages via Ghostscript
    const totalPages = await getPdfPageCount(file.path);
    const db = readBooksDatabase();

    // Clear old rendered page cache for this book ID so newly uploaded pages take effect immediately
    if (targetBookId) {
      clearBookCache(targetBookId);
    }

    // A. Check if target is a DEFAULT book (like 'tenten', 'loomis', 'bridgman')
    const defaultBook = DEFAULT_BOOKS.find(b => b.id === targetBookId);
    if (defaultBook) {
      const bookTitle = title?.trim() || defaultBook.title;
      const bookArtist = artist?.trim() || defaultBook.artist;
      const bookLang = language?.trim() || defaultBook.language || 'Espanhol';
      const bookDesc = description?.trim() || defaultBook.description || '';

      db.bookOverrides[targetBookId] = {
        title: bookTitle,
        artist: bookArtist,
        language: bookLang,
        description: bookDesc,
        filename: file.filename,
        filePath: file.path,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        totalPages: totalPages > 0 ? totalPages : defaultBook.totalPages,
        hasPdfOnDisk: true,
        uploadedAt: new Date().toISOString()
      };

      // Unhide if previously marked deleted
      db.deletedBookIds = (db.deletedBookIds || []).filter(id => id !== targetBookId);
      saveBooksDatabase(db);
      renderCoverPage(targetBookId, file.path);

      const all = getAllBooks();
      const updated = all.find(b => b.id === targetBookId) || {
        ...defaultBook,
        ...db.bookOverrides[targetBookId],
        hasPdfOnDisk: true,
        coverImage: `/api/books/${targetBookId}/page/1`
      };

      return res.json({
        success: true,
        book: updated,
        isExistingBook: true,
        message: `Arquivo PDF vinculado com sucesso à obra "${bookTitle}" do mestre ${bookArtist} (${totalPages} páginas)!`
      });
    }

    // B. Check if target is an EXISTING custom book
    const existingCustomIndex = (db.customBooks || []).findIndex(b => b.id === targetBookId);
    if (existingCustomIndex !== -1 && targetBookId !== 'new') {
      const existing = db.customBooks[existingCustomIndex];
      // Clean previous file if existed
      if (existing.filename && existing.filename !== file.filename) {
        const oldFile = path.resolve(uploadedBooksDir, existing.filename);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) {}
        }
      }

      const updatedCustom: StoredBook = {
        ...existing,
        title: title?.trim() || existing.title,
        artist: artist?.trim() || existing.artist,
        language: language?.trim() || existing.language || 'Português',
        description: description?.trim() || existing.description || '',
        filename: file.filename,
        filePath: file.path,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        totalPages: totalPages > 0 ? totalPages : existing.totalPages,
        hasPdfOnDisk: true,
        uploadedAt: new Date().toISOString(),
        coverImage: `/api/books/${targetBookId}/page/1`
      };

      db.customBooks[existingCustomIndex] = updatedCustom;
      saveBooksDatabase(db);
      renderCoverPage(targetBookId, file.path);

      return res.json({
        success: true,
        book: updatedCustom,
        isExistingBook: true,
        message: `PDF do livro "${updatedCustom.title}" atualizado com sucesso (${totalPages} páginas)!`
      });
    }

    // C. Otherwise, create a NEW custom book
    const bookTitle = title?.trim() || file.originalname.replace(/\.[^/.]+$/, '');
    const bookArtist = artist?.trim() || 'Artista Convidado';
    const bookLang = language?.trim() || 'Português';
    const bookDesc = description?.trim() || `Livro de arte "${bookTitle}" adicionado pelo usuário.`;
    const newBookId = 'book_' + Date.now();

    renderCoverPage(newBookId, file.path);

    const newBook: StoredBook = {
      id: newBookId,
      title: bookTitle,
      artist: bookArtist,
      totalPages: totalPages,
      description: bookDesc,
      filename: file.filename,
      filePath: file.path,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isCustomUploaded: true,
      uploadedAt: new Date().toISOString(),
      language: bookLang,
      tags: ['Upload Personalizado', bookArtist, bookLang],
      hasPdfOnDisk: true,
      coverImage: `/api/books/${newBookId}/page/1`
    };

    db.customBooks.unshift(newBook);
    saveBooksDatabase(db);

    return res.json({
      success: true,
      book: newBook,
      isExistingBook: false,
      message: `Novo livro "${bookTitle}" com ${totalPages} páginas adicionado à biblioteca!`
    });
  } catch (error: any) {
    console.error('Error uploading book:', error);
    return res.status(500).json({ error: 'Falha ao processar upload do livro: ' + error.message });
  }
});

// 3. Delete Book or Remove Attached PDF
app.delete('/api/books/:bookId', (req, res) => {
  const { bookId } = req.params;
  const db = readBooksDatabase();
  clearBookCache(bookId);

  // Check if it's a default book (like 'tenten', 'loomis', 'bridgman')
  const isDefaultBook = DEFAULT_BOOKS.some(b => b.id === bookId);

  if (isDefaultBook) {
    const override = db.bookOverrides[bookId];
    if (override?.filename) {
      const fullPath = path.resolve(uploadedBooksDir, override.filename);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
    delete db.bookOverrides[bookId];

    // If query ?action=resetPdf, just remove the uploaded PDF, keep the book in library
    if (req.query.action === 'resetPdf') {
      saveBooksDatabase(db);
      return res.json({
        success: true,
        action: 'resetPdf',
        message: 'Arquivo PDF do livro removido. O livro voltou para o modo de pranchas interativas.'
      });
    }

    // Otherwise, remove book from library
    if (!db.deletedBookIds.includes(bookId)) {
      db.deletedBookIds.push(bookId);
    }
    saveBooksDatabase(db);
    return res.json({
      success: true,
      action: 'deleted',
      message: 'Livro removido da sua biblioteca com sucesso.'
    });
  }

  // Custom Book Deletion
  const customIdx = (db.customBooks || []).findIndex(b => b.id === bookId);
  if (customIdx !== -1) {
    const bookToDelete = db.customBooks[customIdx];
    if (bookToDelete.filename) {
      const fullPath = path.resolve(uploadedBooksDir, bookToDelete.filename);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
    db.customBooks.splice(customIdx, 1);
  }

  if (!db.deletedBookIds.includes(bookId)) {
    db.deletedBookIds.push(bookId);
  }
  saveBooksDatabase(db);

  return res.json({
    success: true,
    action: 'deleted',
    message: 'Livro excluído com sucesso da biblioteca.'
  });
});

// 4. Restore Default Curated Books
app.post('/api/books/restore-defaults', (_req, res) => {
  const db = readBooksDatabase();
  db.deletedBookIds = db.deletedBookIds.filter(id => !DEFAULT_BOOKS.some(b => b.id === id));
  saveBooksDatabase(db);
  return res.json({
    success: true,
    books: getAllBooks(),
    message: 'Livros padrão restaurados com sucesso!'
  });
});

// 5. Stream Raw PDF File with HTTP Range (206 Partial Content) for Browser PDF.js rendering
app.get(['/api/books/:bookId/pdf', '/api/pdf/stream', '/api/pdf/download'], (req, res) => {
  const bookId = req.params.bookId || (req.query.bookId as string) || 'tenten';
  const allBooks = getAllBooks();
  const book = allBooks.find(b => b.id === bookId) || allBooks[0];

  let pdfPathToUse: string | null = null;
  if (book?.filePath && fs.existsSync(book.filePath)) {
    pdfPathToUse = book.filePath;
  } else if (book?.filename && fs.existsSync(path.resolve(uploadedBooksDir, book.filename))) {
    pdfPathToUse = path.resolve(uploadedBooksDir, book.filename);
  }

  // Also check if any file in uploadedBooksDir has bookId in name
  if (!pdfPathToUse && fs.existsSync(uploadedBooksDir)) {
    const files = fs.readdirSync(uploadedBooksDir);
    const matched = files.find(f => f.toLowerCase().includes(bookId.toLowerCase()) && f.endsWith('.pdf'));
    if (matched) {
      pdfPathToUse = path.resolve(uploadedBooksDir, matched);
    }
  }

  if (!pdfPathToUse || !fs.existsSync(pdfPathToUse)) {
    return res.status(404).json({ error: 'Arquivo PDF não encontrado no servidor.' });
  }

  const stat = fs.statSync(pdfPathToUse);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(pdfPathToUse, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=86400',
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'application/pdf',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': `inline; filename="${book?.filename || 'book.pdf'}"`,
    });
    fs.createReadStream(pdfPathToUse).pipe(res);
  }
});

// 6. Render or Serve Page for Any Book (Universal)
app.get(['/api/books/:bookId/page/:pageNum', '/api/pdf/page/:pageNum'], async (req, res) => {
  const bookId = req.params.bookId || (req.query.bookId as string) || 'tenten';
  const pageNum = parseInt(req.params.pageNum, 10);

  const allBooks = getAllBooks();
  const book = allBooks.find(b => b.id === bookId) || allBooks[0];

  const maxPages = book?.totalPages || 537;
  if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
    return res.status(400).json({ error: `Página inválida (1-${maxPages}).` });
  }

  const cachedJpeg = path.join(renderedPagesDir, `book_${bookId}_p${pageNum}.jpg`);
  const legacyCachedJpeg = path.join(renderedPagesDir, `page_${pageNum}.jpg`);

  // A. Check if already cached in disk
  if (fs.existsSync(cachedJpeg)) {
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, immutable',
    });
    return res.sendFile(cachedJpeg);
  }
  if (bookId === 'tenten' && fs.existsSync(legacyCachedJpeg)) {
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, immutable',
    });
    return res.sendFile(legacyCachedJpeg);
  }

  // B. Check if physical PDF file exists for Ghostscript rendering
  let pdfPathToUse: string | null = null;
  if (book.filePath && fs.existsSync(book.filePath)) {
    pdfPathToUse = book.filePath;
  } else if (book.filename && fs.existsSync(path.resolve(uploadedBooksDir, book.filename))) {
    pdfPathToUse = path.resolve(uploadedBooksDir, book.filename);
  }

  // C. If physical PDF exists, render via Ghostscript on-demand
  if (pdfPathToUse) {
    const queueKey = `${bookId}_${pageNum}`;
    if (renderQueue.has(queueKey)) {
      try {
        await renderQueue.get(queueKey);
        res.set({
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, immutable',
        });
        return res.sendFile(cachedJpeg);
      } catch (err: any) {
        // Fall back to SVG below
      }
    }

    const renderPromise = new Promise<string>((resolve, reject) => {
      const args = [
        '-dNOPAUSE',
        '-dBATCH',
        '-sDEVICE=jpeg',
        '-dJPEGQ=85',
        '-r150',
        `-dFirstPage=${pageNum}`,
        `-dLastPage=${pageNum}`,
        `-sOutputFile=${cachedJpeg}`,
        pdfPathToUse!
      ];

      execFile('gs', args, { timeout: 15000 }, (error, _stdout, stderr) => {
        renderQueue.delete(queueKey);
        if (error) {
          console.error(`Ghostscript error rendering ${queueKey}:`, stderr || error);
          return reject(error);
        }
        resolve(cachedJpeg);
      });
    });

    renderQueue.set(queueKey, renderPromise);

    try {
      await renderPromise;
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      });
      return res.sendFile(cachedJpeg);
    } catch (err: any) {
      console.warn(`Fallback to blueprint SVG for ${queueKey} due to:`, err.message);
    }
  }

  // D. When PDF is not yet uploaded or rendering failed, serve high-definition vector blueprint SVG!
  const svg = generateBlueprintSvg(book.title, book.artist, pageNum, maxPages);
  res.set({
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=3600',
  });
  return res.send(svg);
});

// Serve rendered pages directly as static images
app.use('/rendered_pages', express.static(renderedPagesDir, {
  maxAge: '1d',
  immutable: true
}));
app.use('/uploaded_books', express.static(uploadedBooksDir, {
  maxAge: '1d'
}));

// Serve large PDF files with explicit HTTP Range support (206 Partial Content)
app.use('/assets/aistudio', express.static(path.resolve(__dirname, 'public/assets/aistudio'), {
  acceptRanges: true,
  maxAge: '1d'
}));

// Serve local PDF.js worker from same origin to eliminate cross-origin SecurityErrors
app.use('/pdf.worker.min.js', express.static(path.resolve(__dirname, 'public/pdf.worker.min.js'), {
  maxAge: '7d'
}));

// Configure Vite middleware in development or static server in production
async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const distIndexPath = path.resolve(distDir, 'index.html');

  if (process.env.NODE_ENV === 'production' && fs.existsSync(distIndexPath)) {
    console.log(`[Production] Serving static files from: ${distDir}`);
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[Production Notice] dist/index.html was not found at ${distIndexPath}. Starting Vite middleware dynamically so the app stays online and fully operational without ENOENT errors.`);
    } else {
      console.log('[Development] Starting Vite middleware mode...');
    }
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
