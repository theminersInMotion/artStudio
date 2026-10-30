/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap,
  BookOpen, 
  Camera, 
  PenTool, 
  BookMarked, 
  FolderHeart, 
  Search, 
  Sparkles,
  Layers,
  Smartphone,
  Download,
  Share2,
  Check,
  X,
  Tablet,
  Laptop
} from 'lucide-react';
import { AnatomicalTerm, ArtBook } from '../types/anatomy.ts';
import { ANATOMY_GLOSSARY } from '../data/anatomyGlossary.ts';
import { searchGlossaryTerms } from '../utils/anatomyLogic.ts';

export type ActiveTab = 'weeklyLessons' | 'reader' | 'photoSearch' | 'canvas' | 'exercises' | 'glossary' | 'collections';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onSelectTerm: (term: AnatomicalTerm) => void;
  isStylusActive: boolean;
  onToggleStylusMode: () => void;
  activeBook?: ArtBook | null;
  onOpenLibrary?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onSelectTerm,
  isStylusActive,
  onToggleStylusMode,
  activeBook,
  onOpenLibrary
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  // PWA Install & Share State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as app)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleCopyCleanUrl = () => {
    // Official permanent Google AI Studio link that never 404s
    const permanentAppUrl = 'https://ai.studio/apps/1315d7a8-7cf1-49a4-83bd-7b88f5049b73';
    navigator.clipboard.writeText(permanentAppUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
  };

  const searchResults = searchQuery.trim() 
    ? searchGlossaryTerms(ANATOMY_GLOSSARY, searchQuery).slice(0, 5) 
    : [];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md text-zinc-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onTabChange('reader')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <div className="hidden min-[420px]:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">AnatomiArt</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Tenten
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-none mt-0.5 hidden sm:block">
                  Tradução ES→PT & Estudo com Stylus
                </p>
              </div>
            </button>
          </div>

          {/* Quick Search Bar (Spanish / Portuguese) - Visible on tablet/desktop */}
          <div className="relative flex-1 max-w-xs sm:max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Buscar termo em Espanhol ou Português (ex: esternocleidomastoideo)..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            {/* Live Search Popup */}
            {showSearchResults && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1.5 z-50 overflow-hidden"
                onMouseLeave={() => setShowSearchResults(false)}
              >
                <div className="px-3 py-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  Termos Encontrados ({searchResults.length})
                </div>
                {searchResults.map(term => (
                  <button
                    key={term.id}
                    onClick={() => {
                      onSelectTerm(term);
                      setShowSearchResults(false);
                      setSearchQuery('');
                      onTabChange('glossary');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-zinc-800/80 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                          {term.termEs}
                        </span>
                        <span className="text-[10px] text-zinc-500">→</span>
                        <span className="text-xs font-medium text-zinc-200">
                          {term.termPt}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
                        {term.definitionPt}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-zinc-800 rounded">
                      Pág. {term.relevantPages[0] || '1'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions: Mobile Search Toggle, Share Link, Install App & Stylus Mode */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isMobileSearchOpen;
                setIsMobileSearchOpen(next);
                if (next) {
                  setTimeout(() => mobileSearchInputRef.current?.focus(), 150);
                }
              }}
              title="Buscar termos anatômicos (Espanhol / Português)"
              className={`sm:hidden flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                isMobileSearchOpen
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300 ring-1 ring-orange-500/50 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Search className="w-4 h-4 text-orange-400" />
            </button>

            {/* Library & Book Upload Modal Trigger */}
            <button
              onClick={onOpenLibrary}
              title="Biblioteca de Livros de Arte e Upload de PDF (sem limite de tamanho)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-zinc-900 border-zinc-700/80 hover:border-orange-500/80 text-zinc-200 hover:text-orange-300 hover:bg-zinc-850 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Biblioteca &amp; Upload</span>
            </button>

            {/* Share / Copy Direct App URL Button */}
            <button
              onClick={handleCopyCleanUrl}
              title="Copiar link direto do app para compartilhar"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                copiedLink 
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/40' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 hover:border-zinc-700'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
              <span className="hidden md:inline">{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>

            {/* Install as Native App Button (PWA) */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                title="Instalar como aplicativo no celular, tablet ou computador (PWA)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-orange-500/80 shadow-sm shadow-orange-950 active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-white animate-bounce" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Stylus / S-Pen Mode Indicator & Actions */}
            <button
              onClick={onToggleStylusMode}
              title={isStylusActive ? 'Modo Stylus / S-Pen Ativado (Rejeição de Palma Ativa)' : 'Ativar Modo Stylus / S-Pen'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isStylusActive
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 shadow-sm shadow-orange-950'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${isStylusActive ? 'text-orange-400 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {isStylusActive ? 'S-Pen Ativa' : 'Modo Stylus'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isStylusActive ? 'bg-orange-400 ring-2 ring-orange-500/30' : 'bg-zinc-600'}`} />
            </button>
          </div>

        </div>

        {/* Mobile Expandable Full-Width Search Bar & Live Results */}
        {isMobileSearchOpen && (
          <div className="sm:hidden pb-3 pt-1 border-t border-zinc-800/80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Buscar termo ES ou PT (ex: esternocleidomastoideo)..."
                className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-orange-500/60 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-lg"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                  title="Fechar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Live Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-2 bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl py-1 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-orange-400 uppercase tracking-wider border-b border-zinc-800 flex items-center justify-between">
                  <span>Termos Anatômicos Encontrados ({searchResults.length})</span>
                  <span className="text-zinc-500 font-normal">Toque p/ abrir</span>
                </div>
                {searchResults.map(term => (
                  <button
                    key={term.id}
                    type="button"
                    onClick={() => {
                      onSelectTerm(term);
                      setShowSearchResults(false);
                      setIsMobileSearchOpen(false);
                      setSearchQuery('');
                      onTabChange('glossary');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-zinc-800/90 active:bg-zinc-800 border-b border-zinc-800/50 last:border-0 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-orange-400">
                          {term.termEs}
                        </span>
                        <span className="text-[10px] text-zinc-500">→</span>
                        <span className="text-xs font-semibold text-zinc-200">
                          {term.termPt}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {term.definitionPt}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700/80 shrink-0 font-mono">
                      Pág. {term.relevantPages[0] || '1'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
              <div className="mt-2 p-3 text-center text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl">
                Nenhum termo encontrado para "{searchQuery}". Tente outro termo em espanhol ou português.
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 border-t border-zinc-800/80 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => onTabChange('weeklyLessons')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'weeklyLessons'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
            <span>Aulas Semanais (Week 1 - 10)</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800/50">
              Upload Livre
            </span>
          </button>
          <button
            onClick={() => onTabChange('reader')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'reader'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{activeBook ? `Livro: ${activeBook.artist}` : 'Leitor de Livros'}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-850 text-orange-400 border border-zinc-700 font-mono">
              {activeBook?.totalPages || 537}P
            </span>
          </button>

          <button
            onClick={() => onTabChange('photoSearch')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'photoSearch'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Buscar Termo por Foto</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              IA
            </span>
          </button>

          <button
            onClick={() => onTabChange('canvas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'canvas'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-orange-400" />
            <span>Prancheta de Desenho Stylus</span>
          </button>

          <button
            onClick={() => onTabChange('exercises')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'exercises'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Exercícios Guiados</span>
          </button>

          <button
            onClick={() => onTabChange('glossary')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'glossary'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dicionário ES → PT</span>
          </button>

          <button
            onClick={() => onTabChange('collections')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'collections'
                ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5 text-purple-400" />
            <span>Outros Artistas & Coleções</span>
          </button>
        </nav>

      </div>

      {/* PWA Install Guidance Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-zinc-100">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">
                    Como Usar como Aplicativo no seu Dispositivo
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Não é necessário GitHub nem loja de apps! Funciona direto pelo link como PWA.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct App Link Box */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Link Permanente do App (Sem Erro 404):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://ai.studio/apps/1315d7a8-7cf1-49a4-83bd-7b88f5049b73"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyCleanUrl}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                💡 Este link do Google AI Studio é permanente e abre diretamente o aplicativo para qualquer pessoa sem erro de página não encontrada.
              </p>
            </div>

            {/* Step-by-Step Device Instructions */}
            <div className="space-y-3 text-xs">
              
              {/* Android / Tablet / S24 Ultra */}
              <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <Tablet className="w-4 h-4" />
                  <span>No Tablet Android / Galaxy Tab / Celular (S-Pen):</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  1. Abra o link no <b>Google Chrome</b> ou <b>Samsung Internet</b>.<br />
                  2. Toque no menu de <b>três pontinhos (⋮)</b> no canto superior.<br />
                  3. Selecione <b>"Instalar aplicativo"</b> ou <b>"Adicionar à tela inicial"</b>.<br />
                  4. O app abrirá em tela cheia sem barras de navegador, perfeito para desenhar com a caneta Stylus!
                </p>
              </div>

              {/* iPad / iPhone */}
              <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>No iPad / iPhone (Apple Pencil / Safari):</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  1. Abra o link no navegador <b>Safari</b>.<br />
                  2. Toque no botão de <b>Compartilhar</b> (ícone do quadrado com a seta para cima <span className="font-mono">􀈂</span>).<br />
                  3. Role as opções e toque em <b>"Adicionar à Tela de Início"</b>.<br />
                  4. Toque em <b>Adicionar</b>. O ícone do AnatomiArt Studio aparecerá na sua tela de apps.
                </p>
              </div>

              {/* PC / Mac */}
              <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Laptop className="w-4 h-4" />
                  <span>No Computador (Windows / Mac - Chrome ou Edge):</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  1. Abra no Chrome ou Edge.<br />
                  2. Na barra de endereço, clique no ícone de <b>Instalar App</b> (ícone de computador com seta) ou no menu de 3 pontos &gt; "Instalar AnatomiArt Studio".
                </p>
              </div>

            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
            >
              Entendi, Fechar
            </button>

          </div>
        </div>
      )}

    </header>
  );
};
