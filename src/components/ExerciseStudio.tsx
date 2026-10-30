/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  PenTool, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  ArrowRight, 
  Filter, 
  Plus, 
  BookOpen,
  Layers,
  ChevronRight,
  Flame,
  Award,
  Compass,
  Check
} from 'lucide-react';
import { Exercise } from '../types/anatomy.ts';
import { CURATED_EXERCISES } from '../data/tentenIndex.ts';

interface ExerciseStudioProps {
  onStartExercise: (exercise: Exercise) => void;
  onOpenBookPage: (pageNumber: number) => void;
}

export const ExerciseStudio: React.FC<ExerciseStudioProps> = ({
  onStartExercise,
  onOpenBookPage,
}) => {
  const [exercises] = useState<Exercise[]>(CURATED_EXERCISES);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeExercise, setActiveExercise] = useState<Exercise>(CURATED_EXERCISES[0]);

  // Categories list
  const categories = [
    { id: 'all', label: 'Todas as Áreas' },
    { id: 'Cabeça & Proporções', label: '1. Cabeça & Proporções' },
    { id: 'Torso & Cintura Escapular', label: '2. Torso & Cintura Escapular' },
    { id: 'Torso & Dinâmica', label: '3. Torso & Dinâmica' },
    { id: 'Braços & Membros Superiores', label: '4. Braços & Membros' },
    { id: 'Mãos & Dedos', label: '5. Mãos & Dedos' },
    { id: 'Pernas & Membros Inferiores', label: '6. Pernas & Joelhos' },
    { id: 'Luz, Sombra & Modelagem', label: '7. Luz & Sombra' },
    { id: 'Dinâmica & Escorço', label: '8. Escorço Extremo' },
    { id: 'Roupas & Dobras (Drapery)', label: '9. Dobras & Roupas' },
  ];

  const filteredExercises = exercises.filter(ex => {
    if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;
    if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100">
      
      {/* Header with Curriculum Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-zinc-100">
              Trilha Guiada de Desenho: Método Tenten do Início ao Fim
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            16 exercícios progressivos mapeados diretamente nas pranchas mestras do livro de 537 páginas: das proporções canônicas e caixas 3D até torções do torso, escorço dramático e física das dobras de roupas.
          </p>
        </div>

        {/* Stats summary badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-zinc-400">Currículo:</span>
            <strong className="text-orange-400">16 Módulos</strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Total Págs:</span>
            <strong className="text-emerald-400">537 Págs</strong>
          </div>
        </div>
      </div>

      {/* Category & Difficulty Filters */}
      <div className="space-y-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-950'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-zinc-500 font-semibold mr-1">Nível:</span>
          {['all', 'iniciante', 'intermediario', 'avancado'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedDifficulty(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all border ${
                selectedDifficulty === lvl
                  ? 'bg-zinc-700 text-white border-zinc-600 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {lvl === 'all' ? 'Todos os Níveis' : lvl === 'iniciante' ? 'Iniciante' : lvl === 'intermediario' ? 'Intermediário' : 'Avançado'}
            </button>
          ))}
          <span className="text-[11px] text-zinc-500 ml-auto font-mono">
            {filteredExercises.length} exercícios disponíveis
          </span>
        </div>
      </div>

      {/* Main Grid: Exercise List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Exercises List */}
        <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredExercises.map(ex => (
            <div
              key={ex.id}
              onClick={() => setActiveExercise(ex)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                activeExercise?.id === ex.id
                  ? 'bg-zinc-850 border-orange-500 shadow-lg ring-1 ring-orange-500/30'
                  : 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  ex.difficulty === 'iniciante'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : ex.difficulty === 'intermediario'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {ex.difficulty}
                </span>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                  <span className="text-orange-400 font-bold">Prancha #{ex.referencePage}</span>
                  <span>•</span>
                  <span>{ex.durationMinutes} min</span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-zinc-100 leading-snug">
                {ex.title}
              </h4>

              <p className="text-[11px] text-zinc-400 line-clamp-2">
                Foco: {ex.styleFocus}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px]">
                <span className="text-zinc-500 font-medium">
                  {ex.steps.length} etapas guiadas
                </span>
                <span className="text-orange-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Ver Prancha <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detailed Exercise View */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl">
          {activeExercise && (
            <div className="space-y-5">
              
              <div className="border-b border-zinc-800 pb-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {activeExercise.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {activeExercise.durationMinutes} minutos recomendados
                    </span>
                    {activeExercise.referencePage && (
                      <button
                        onClick={() => onOpenBookPage(activeExercise.referencePage!)}
                        className="text-orange-400 hover:underline flex items-center gap-1 font-medium bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700"
                        title="Abrir página no leitor do livro"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Prancha #{activeExercise.referencePage}
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-zinc-100">
                  {activeExercise.title}
                </h3>

                <p className="text-xs text-orange-300 font-medium bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20">
                  Princípio do Estilo: {activeExercise.styleFocus}
                </p>

                {/* Verified Reference Plate Preview Card */}
                {activeExercise.referencePage && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="relative group shrink-0">
                      <img 
                        src={`/api/pdf/page/${activeExercise.referencePage}`}
                        alt={`Prancha #${activeExercise.referencePage} do Tenten`}
                        className="w-24 h-32 object-contain rounded-lg border border-zinc-700 bg-white"
                        loading="eager"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono px-1 rounded text-orange-400 font-bold">
                        #{activeExercise.referencePage}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                        Prancha Original Verificada do Tenten
                      </span>
                      <p className="text-xs text-zinc-200 font-semibold">
                        Página #{activeExercise.referencePage} do Livro Oficial
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Esta prancha traz o passo a passo exato desenhado pelo autor com todas as linhas mestras, proporções e caixas volumétricas.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                        <button
                          onClick={() => onOpenBookPage(activeExercise.referencePage!)}
                          className="text-[11px] text-zinc-300 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors bg-zinc-800 hover:bg-zinc-750 px-2.5 py-1 rounded-lg border border-zinc-700"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                          <span>Ver Página Inteira no Leitor</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Objetivos Deste Estudo
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {activeExercise.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step by step guide */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Roteiro de Execução Passo a Passo (com Stylus / S24 Ultra)
                </h4>

                <div className="space-y-2.5">
                  {activeExercise.steps.map((st, i) => (
                    <div key={i} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {st.stepNumber}
                        </span>
                        <h5 className="text-xs font-bold text-zinc-200">
                          {st.title}
                        </h5>
                      </div>
                      <p className="text-xs text-zinc-300 pl-7 leading-relaxed">
                        {st.instruction}
                      </p>
                      <p className="text-[11px] text-orange-400/90 pl-7 italic">
                        💡 Dica do Tenten: {st.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Action */}
              <div className="pt-2">
                <button
                  onClick={() => onStartExercise(activeExercise)}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:brightness-110 text-white flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 active:scale-98 transition-all cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Praticar Este Exercício na Prancheta com Stylus / S24 Ultra</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
