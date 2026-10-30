/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  BookOpen, 
  PenTool, 
  Maximize2, 
  RotateCcw,
  CheckCircle2,
  Info,
  Loader2,
  ExternalLink,
  HelpCircle,
  Volume2,
  Sliders,
  Eye,
  ArrowRight,
  Grid
} from 'lucide-react';
import { 
  TENTEN_PDF_PATH, 
  TENTEN_TOTAL_PAGES, 
  TENTEN_CHAPTERS 
} from '../data/tentenIndex.ts';
import { StylisticAnalysis, ArtBook } from '../types/anatomy.ts';

interface TentenReaderProps {
  initialPage?: number;
  activeBook?: ArtBook | null;
  allBooks?: ArtBook[];
  onSelectBook?: (book: ArtBook) => void;
  onOpenLibrary?: () => void;
  onOpenCanvasWithReference: (pageNumber: number, dataUrl?: string) => void;
}

type FitMode = 'fit-screen' | 'fit-width' | 'custom-zoom';

export const TentenReader: React.FC<TentenReaderProps> = ({
  initialPage = 20,
  activeBook,
  allBooks = [],
  onSelectBook,
  onOpenLibrary,
  onOpenCanvasWithReference
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const totalPages = activeBook?.totalPages || TENTEN_TOTAL_PAGES;
  const [fitMode, setFitMode] = useState<FitMode>('fit-screen');
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When active book changes, reset to page 1
  useEffect(() => {
    if (activeBook) {
      setCurrentPage(1);
      setPageAnalysis(null);
      setErrorMsg(null);
    }
  }, [activeBook?.id]);

  // PDF Source & Viewing Mode
  const [pdfSourceUrl, setPdfSourceUrl] = useState<string>(() => {
    return localStorage.getItem('anatomiart_pdf_url') || TENTEN_PDF_PATH;
  });
  const [viewMode, setViewMode] = useState<'canvas' | 'native'>('canvas');
  const [showSourceConfigModal, setShowSourceConfigModal] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [showThumbStrip, setShowThumbStrip] = useState<boolean>(true);

  // AI Page Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pageAnalysis, setPageAnalysis] = useState<any | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Current Chapter
  const currentChapter = TENTEN_CHAPTERS.find(
    ch => currentPage >= ch.startPage && currentPage <= ch.endPage
  ) || TENTEN_CHAPTERS[0];

  // Jump to specific page
  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    setPageAnalysis(null);
    setErrorMsg(null);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        handlePageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        handlePageChange(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Image URL for current page (universal art book endpoint)
  const pageSrc = `/api/books/${activeBook?.id || 'tenten'}/page/${currentPage}`;

  // Trigger Gemini AI Page Analysis
  const handleAnalyzePage = async () => {
    setIsAnalyzing(true);
    setShowAnalysisPanel(true);

    const artistName = activeBook?.artist || 'Tenten';
    const bookTitle = activeBook?.title || 'Morfología y Anatomía Dinámica';

    try {
      const response = await fetch('/api/gemini/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageNumber: currentPage,
          bookId: activeBook?.id || 'tenten',
          bookTitle: bookTitle,
          artistName: artistName,
          bookLanguage: activeBook?.language || 'Espanhol',
          customPrompt: `Analise a prancha #${currentPage} da obra "${bookTitle}" de ${artistName}. Destaque as massas musculares, marcos ósseos e o método construtivo para estudo com stylus.`
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const data = await response.json();
      setPageAnalysis(data);
    } catch (err: any) {
      console.error('Error analyzing page:', err);
      // Fallback didactic analysis
      setPageAnalysis({
        title: `Prancha #${currentPage} - ${artistName}`,
        summaryPt: `Estudo da prancha ${currentPage} de "${bookTitle}". O artista foca no raciocínio estrutural tridimensional antes de renderizar qualquer contorno externo.`,
        identifiedTerms: (activeBook?.id === 'tenten' ? currentChapter.keyTerms : ['Deltoide e Clavícula', 'Peitoral Maior', 'Trocanter Maior']).map(t => ({
          termEs: t,
          termPt: t,
          definition: `Termo anatômico e marco estrutural no método de ${artistName}.`,
          drawingTip: 'Simplifique primeiro os volumes em cubos e cilindros com traço leve antes do acabamento.'
        })),
        structuralProcess: {
          gesture: 'Linha de ação contínua estabelecendo o dinamismo da pose.',
          forms3D: 'Geometrização com caixas chanfradas e ovóides articulados.',
          landmarks: 'Marcos ósseos invariáveis (fossa jugular, clavícula, acrômio, patela).',
          muscleFlows: 'Inserções musculares que abraçam a estrutura óssea.',
          contourShading: 'Hachuras de curvatura (cross-contour) definindo planos e luz.'
        },
        suggestedExercise: {
          title: `Estudo Guiado da Prancha #${currentPage}`,
          difficulty: 'intermediario',
          objectives: [
            'Esboçar primeiro os marcos ósseos com stylus leve',
            'Modelar os volumes musculares em camadas',
            `Aplicar hachuras direcionais no estilo de ${artistName}`
          ]
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Direct practice action
  const handleOpenCanvas = () => {
    onOpenCanvasWithReference(currentPage, pageSrc);
  };

  // Calculate nearby thumbnail pages for filmstrip
  const thumbWindowSize = 5;
  const startThumb = Math.max(1, currentPage - thumbWindowSize);
  const endThumb = Math.min(totalPages, currentPage + thumbWindowSize);
  const nearbyPages = [];
  for (let p = startThumb; p <= endThumb; p++) {
    nearbyPages.push(p);
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      
      {/* Top Interactive Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-2.5 px-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        
        {/* Left: Active Book Selector & Chapter Jump */}
        <div className="flex items-center gap-2 max-w-full sm:max-w-md lg:max-w-xl">
          {/* Active Book Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-800/90 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <select
              value={activeBook?.id || 'tenten'}
              onChange={(e) => {
                const selected = allBooks.find(b => b.id === e.target.value);
                if (selected && onSelectBook) {
                  onSelectBook(selected);
                }
              }}
              className="bg-transparent text-zinc-100 font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
              title="Alternar Livro de Arte Ativo"
            >
              {allBooks.map(b => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-100">
                  {b.title} ({b.artist})
                </option>
              ))}
            </select>
            <button
              onClick={onOpenLibrary}
              className="text-[10px] font-bold text-orange-400 hover:text-orange-300 ml-1 px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-800/50 hover:bg-orange-900/60 transition-colors shrink-0"
              title="Abrir Biblioteca Completa & Fazer Upload de PDF"
            >
              + Upload
            </button>
          </div>

          {/* Chapter Selector (Tenten or custom quarters) */}
          {activeBook?.id === 'tenten' ? (
            <select
              value={currentChapter.id}
              onChange={(e) => {
                const ch = TENTEN_CHAPTERS.find(item => item.id === e.target.value);
                if (ch) handlePageChange(ch.startPage);
              }}
              className="bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs rounded-xl px-2 py-1 text-zinc-200 focus:outline-none focus:border-orange-500 font-medium truncate cursor-pointer transition-colors max-w-[140px] sm:max-w-[200px]"
              title="Pular para um Capítulo do Livro"
            >
              {TENTEN_CHAPTERS.map(ch => (
                <option key={ch.id} value={ch.id} className="bg-zinc-900">
                  {ch.titlePt} ({ch.startPage}-{ch.endPage})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              {activeBook?.artist || 'Mestre'} • {totalPages} páginas
            </span>
          )}

          {/* Quick jump to key plates of current chapter */}
          {activeBook?.id === 'tenten' && (
            <div className="hidden 2xl:flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mr-1">Pranchas:</span>
              {currentChapter.recommendedPages.map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                    currentPage === page 
                      ? 'bg-orange-600 text-white font-bold shadow-sm' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  #{page}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Fluid Navigation Controls & Quick Input */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 10)}
            disabled={currentPage <= 10}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Voltar 10 Páginas"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Página Anterior (Seta Esquerda)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 bg-zinc-850 px-2 py-1 rounded-xl border border-zinc-750 font-mono text-xs shadow-inner">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) handlePageChange(val);
              }}
              className="w-12 bg-transparent text-center text-orange-400 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 rounded"
              title="Digite o número da prancha e pressione Enter"
            />
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400 text-[11px]">{totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Próxima Página (Seta Direita)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => handlePageChange(currentPage + 10)}
            disabled={currentPage >= totalPages - 10}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Avançar 10 Páginas"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: View Mode, Zoom & Actions */}
        <div className="flex items-center gap-2">
          
          {/* Fit Mode Switcher */}
          <div className="flex items-center bg-zinc-800 p-0.5 rounded-xl border border-zinc-700 text-xs">
            <button
              onClick={() => {
                setFitMode('fit-screen');
                setZoomPercent(100);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                fitMode === 'fit-screen'
                  ? 'bg-orange-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Ajustar a Prancha Inteira na Tela (Sem corte)"
            >
              Ajustar à Tela
            </button>
            <button
              onClick={() => {
                setFitMode('fit-width');
                setZoomPercent(100);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                fitMode === 'fit-width'
                  ? 'bg-orange-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Ajustar à Largura (Para ler textos pequenos)"
            >
              Largura Total
            </button>
          </div>

          {/* Zoom In / Out Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-800 p-0.5 rounded-xl border border-zinc-700">
            <button
              onClick={() => {
                setFitMode('custom-zoom');
                setZoomPercent(z => Math.max(50, z - 20));
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-700"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium text-zinc-300 px-1 w-10 text-center">
              {fitMode === 'custom-zoom' ? `${zoomPercent}%` : 'Auto'}
            </span>
            <button
              onClick={() => {
                setFitMode('custom-zoom');
                setZoomPercent(z => Math.min(300, z + 20));
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-700"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Practice on Stylus Canvas Button */}
          <button
            onClick={handleOpenCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-950/40 active:scale-95"
            title="Transferir esta prancha para a prancheta de desenho com S-Pen / Stylus"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Praticar na Prancheta</span>
          </button>

          {/* AI Analysis Toggle */}
          <button
            onClick={() => {
              if (!showAnalysisPanel && !pageAnalysis) {
                handleAnalyzePage();
              } else {
                setShowAnalysisPanel(!showAnalysisPanel);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showAnalysisPanel
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
            }`}
            title="Consultar termos anatômicos em espanhol e tradução para português"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Analisar com IA</span>
          </button>
        </div>
      </div>

      {/* Main Reading Viewport & Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Main Book Reader Display */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-zinc-950/90 flex flex-col items-center justify-center p-2 sm:p-4 relative"
        >
          {isRenderingPage && (
            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="text-xs text-zinc-300 font-medium">Carregando prancha #{currentPage}...</span>
            </div>
          )}

          {errorMsg ? (
            <div className="max-w-md p-6 bg-zinc-900 border border-red-800/60 rounded-2xl text-center space-y-4 shadow-2xl">
              <p className="text-xs text-red-300 leading-relaxed font-medium">{errorMsg}</p>
              <button
                onClick={() => handlePageChange(currentPage)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Tentar Recarregar Prancha
              </button>
            </div>
          ) : (
            <>
              {/* Demonstration Study Mode Banner */}
              {activeBook && !activeBook.hasPdfOnDisk && (
                <div className="mb-2 px-3 py-1.5 bg-orange-950/50 border border-orange-800/60 rounded-xl flex items-center justify-between gap-3 text-xs text-orange-200 w-full max-w-4xl shrink-0 shadow-md">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Visualizando prancha de estudo estrutural. Deseja carregar o arquivo PDF completo de <strong>{activeBook.title}</strong> (sem limite de tamanho)?</span>
                  </div>
                  <button
                    onClick={onOpenLibrary}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-[11px] whitespace-nowrap transition-colors shrink-0 shadow-sm"
                  >
                    + Fazer Upload PDF
                  </button>
                </div>
              )}

              <div 
                className={`relative transition-all duration-150 flex items-center justify-center ${
                  fitMode === 'fit-screen'
                    ? 'h-full w-full max-h-[calc(100vh-14rem)] flex items-center justify-center'
                    : fitMode === 'fit-width'
                    ? 'w-full max-w-4xl'
                    : 'max-w-none'
                }`}
              >
                <img
                  ref={imageRef}
                  src={pageSrc}
                  alt={`Prancha #${currentPage} de ${activeBook?.title || 'Livro de Arte'}`}
                  onLoad={() => setIsRenderingPage(false)}
                  onError={() => {
                    setIsRenderingPage(false);
                    setErrorMsg(`Não foi possível carregar a prancha #${currentPage}. Tente outra página.`);
                  }}
                style={
                  fitMode === 'custom-zoom'
                    ? { width: `${zoomPercent}%`, maxWidth: 'none' }
                    : undefined
                }
                className={`rounded-lg shadow-2xl shadow-black border border-zinc-800/80 bg-white ${
                  fitMode === 'fit-screen'
                    ? 'max-h-[calc(100vh-12.5rem)] w-auto object-contain block mx-auto'
                    : fitMode === 'fit-width'
                    ? 'w-full h-auto object-contain block'
                    : 'block mx-auto'
                }`}
                loading="eager"
              />
            </div>
            </>
          )}
        </div>

        {/* AI Anatomical Consultation & Translation Drawer */}
        {showAnalysisPanel && (
          <aside className="w-full sm:w-96 lg:w-[420px] bg-zinc-900/95 border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden z-20 shadow-2xl">
            
            {/* Header of analysis drawer */}
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  Consulta & Tradução ES → PT
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700">
                  Prancha #{currentPage}
                </span>
                <button
                  onClick={() => setShowAnalysisPanel(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Chapter Info Banner */}
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  <span>{currentChapter.titlePt}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {currentChapter.description}
                </p>
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">
                    Termos em Espanhol Desta Seção:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentChapter.keyTerms.map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isAnalyzing && (
                <div className="p-6 text-center space-y-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                  <p className="text-xs font-medium text-zinc-300">
                    A IA está decodificando a prancha #{currentPage}...
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Identificando termos em Espanhol, traduzindo para Português e mapeando a construção tridimensional do Tenten.
                  </p>
                </div>
              )}

              {/* Analysis Result Display */}
              {pageAnalysis && !isAnalyzing && (
                <div className="space-y-4">
                  
                  {/* Summary Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <h3 className="text-xs font-bold text-orange-400">
                      {pageAnalysis.title || `Estudo da Prancha #${currentPage}`}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {pageAnalysis.summaryPt}
                    </p>
                  </div>

                  {/* Identified Terms with ES -> PT Translations */}
                  {pageAnalysis.identifiedTerms && pageAnalysis.identifiedTerms.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Termos Anatômicos (Espanhol → Português)
                      </h4>
                      <div className="space-y-2">
                        {pageAnalysis.identifiedTerms.map((term: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-400 italic">
                                {term.termEs}
                              </span>
                              <span className="font-bold text-emerald-400">
                                → {term.termPt}
                              </span>
                            </div>
                            {term.definition && (
                              <p className="text-[11px] text-zinc-400">
                                {term.definition}
                              </p>
                            )}
                            {term.drawingTip && (
                              <p className="text-[10px] text-orange-300/90 pt-1 italic">
                                💡 Dica Tenten: {term.drawingTip}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structural Pipeline */}
                  {pageAnalysis.structuralProcess && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Etapas de Construção do Tenten
                      </h4>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                        {pageAnalysis.structuralProcess.gesture && (
                          <div>
                            <span className="font-bold text-orange-400">1. Gesto: </span>
                            <span className="text-zinc-300">{pageAnalysis.structuralProcess.gesture}</span>
                          </div>
                        )}
                        {pageAnalysis.structuralProcess.forms3D && (
                          <div>
                            <span className="font-bold text-orange-400">2. Volumes 3D: </span>
                            <span className="text-zinc-300">{pageAnalysis.structuralProcess.forms3D}</span>
                          </div>
                        )}
                        {pageAnalysis.structuralProcess.landmarks && (
                          <div>
                            <span className="font-bold text-orange-400">3. Marcos Ósseos: </span>
                            <span className="text-zinc-300">{pageAnalysis.structuralProcess.landmarks}</span>
                          </div>
                        )}
                        {pageAnalysis.structuralProcess.muscleFlows && (
                          <div>
                            <span className="font-bold text-orange-400">4. Fluxos Musculares: </span>
                            <span className="text-zinc-300">{pageAnalysis.structuralProcess.muscleFlows}</span>
                          </div>
                        )}
                        {pageAnalysis.structuralProcess.contourShading && (
                          <div>
                            <span className="font-bold text-orange-400">5. Hachuras Volumétricas: </span>
                            <span className="text-zinc-300">{pageAnalysis.structuralProcess.contourShading}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA button to practice */}
                  <button
                    onClick={handleOpenCanvas}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition-all"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Praticar Esta Prancha no Tablet com Stylus</span>
                  </button>

                </div>
              )}

            </div>
          </aside>
        )}

      </div>

      {/* Bottom Scrubber & Visual Thumbnail Strip */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-2 shrink-0 flex flex-col gap-2">
        
        {/* Continuous Slider Scrubber */}
        <div className="flex items-center gap-3 px-2 sm:px-4">
          <span className="text-[10px] text-zinc-500 font-mono">Pág 1</span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Pág {totalPages}</span>

          <button
            onClick={() => setShowThumbStrip(!showThumbStrip)}
            className={`p-1 rounded text-xs transition-colors ${
              showThumbStrip ? 'text-orange-400 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Alternar fita de miniaturas"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filmstrip of nearby page thumbnails */}
        {showThumbStrip && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
            {nearbyPages.map(p => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`relative shrink-0 rounded-lg overflow-hidden border transition-all ${
                  currentPage === p
                    ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105 shadow-md shadow-orange-950'
                    : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600'
                }`}
                title={`Pular para Prancha #${p}`}
              >
                <img
                  src={`/api/books/${activeBook?.id || 'tenten'}/page/${p}`}
                  alt={`Miniatura Pág ${p}`}
                  className="w-12 h-16 object-cover bg-zinc-950"
                  loading="lazy"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-center">
                  <span className="text-[9px] font-mono text-zinc-200">#{p}</span>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
