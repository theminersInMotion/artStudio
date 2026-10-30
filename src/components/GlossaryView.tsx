/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookMarked, 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { AnatomicalTerm, AnatomicalCategory, BodyRegion } from '../types/anatomy.ts';
import { ANATOMY_GLOSSARY, CATEGORY_LABELS, REGION_LABELS } from '../data/anatomyGlossary.ts';
import { searchGlossaryTerms } from '../utils/anatomyLogic.ts';

interface GlossaryViewProps {
  onOpenBookPage: (pageNumber: number) => void;
  selectedTerm?: AnatomicalTerm | null;
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({
  onOpenBookPage,
  selectedTerm: initialTerm,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<AnatomicalCategory | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | 'all'>('all');
  const [activeTerm, setActiveTerm] = useState<AnatomicalTerm | null>(
    initialTerm || ANATOMY_GLOSSARY[0]
  );

  const filteredTerms = searchGlossaryTerms(ANATOMY_GLOSSARY, query, {
    category: selectedCategory,
    region: selectedRegion,
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-zinc-100">
              Dicionário Anatômico Espanhol → Português
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tradução técnica dos termos do livro do Tenten com nomenclatura latina, origens/inserções e atalhos geométricos de desenho.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="px-2.5 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
            Total: <strong className="text-emerald-400">{ANATOMY_GLOSSARY.length}</strong> termos
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
        
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar termo em ES ou PT (ex: deltoides, bíceps, maléolo)..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="w-full py-2 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas as Categorias Anatômicas</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as any)}
            className="w-full py-2 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas as Regiões</option>
            {Object.entries(REGION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Content Grid: Terms List & Active Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Filtered List */}
        <div className="lg:col-span-5 space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
          {filteredTerms.length > 0 ? (
            filteredTerms.map((term) => (
              <button
                key={term.id}
                onClick={() => setActiveTerm(term)}
                className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between group ${
                  activeTerm?.id === term.id
                    ? 'bg-zinc-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-zinc-900/70 border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300">
                      🇪🇸 {term.termEs}
                    </span>
                    <span className="text-zinc-600 text-xs">→</span>
                    <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                      🇧🇷 {term.termPt}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {term.definitionPt}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-zinc-950 rounded">
                    Pág. {term.relevantPages[0]}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs">
              Nenhum termo encontrado com estes filtros.
            </div>
          )}
        </div>

        {/* Right: Detailed Card */}
        <div className="lg:col-span-7">
          {activeTerm ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl sticky top-24">
              
              {/* Card Title Header */}
              <div className="border-b border-zinc-800 pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {CATEGORY_LABELS[activeTerm.category] || activeTerm.category}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Região: <strong className="text-zinc-200">{REGION_LABELS[activeTerm.region]}</strong>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-zinc-400">Espanhol:</span>
                    <h3 className="text-lg font-bold text-orange-400">
                      {activeTerm.termEs}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-zinc-400">Português:</span>
                    <h3 className="text-lg font-bold text-emerald-400">
                      {activeTerm.termPt}
                    </h3>
                  </div>

                  <p className="text-xs font-mono text-zinc-500 italic">
                    Latim científico: {activeTerm.termLatin}
                  </p>
                </div>
              </div>

              {/* Definition */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Descrição Anatômica Funcional
                </h4>
                <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  {activeTerm.definitionPt}
                </p>
              </div>

              {/* Tenten's Drawing Shortcut */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Método & Dica de Desenho do Tenten:</span>
                </div>
                <p className="text-xs text-orange-200/90 leading-relaxed">
                  {activeTerm.drawingTips}
                </p>
              </div>

              {/* Origin & Insertion (if muscle) */}
              {activeTerm.originInsertion && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Origem & Inserção Artística
                  </h4>
                  <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {activeTerm.originInsertion}
                  </p>
                </div>
              )}

              {/* Relevant Pages in Tenten Book */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Pranchas no Livro do Tenten (537 Págs):
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeTerm.relevantPages.map((pg) => (
                    <button
                      key={pg}
                      onClick={() => onOpenBookPage(pg)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-orange-600 hover:text-white text-xs font-semibold text-orange-400 border border-zinc-700 flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ver Prancha #{pg}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              Selecione um termo para ver a tradução e dicas completas.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
