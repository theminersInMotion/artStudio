/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FolderHeart, 
  Plus, 
  Upload, 
  Sparkles, 
  PenTool, 
  User, 
  Tag, 
  BookOpen, 
  Trash2, 
  CheckCircle2, 
  ChevronRight,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { ArtistProfile, Collection, ReferenceItem, Exercise } from '../types/anatomy.ts';
import { INITIAL_ARTISTS } from '../data/tentenIndex.ts';

interface ArtistCollectionsProps {
  onOpenCanvasWithReference: (imageUrl: string, exercise?: Exercise) => void;
}

export const ArtistCollections: React.FC<ArtistCollectionsProps> = ({
  onOpenCanvasWithReference,
}) => {
  const [artists, setArtists] = useState<ArtistProfile[]>(INITIAL_ARTISTS);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('tenten');

  // Custom Collections
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: 'col_tronco_deltoide',
      title: 'Estudos de Ombros & Peitoral (Tenten)',
      description: 'Coleção de estudos focados na rotação da clavícula e encaixe do deltoide.',
      artistId: 'tenten',
      tags: ['#ombro', '#deltoide', '#clavicula'],
      createdAt: '2026-10-26',
      items: [
        {
          id: 'ref_1',
          title: 'Prancha 114: Deltoide e Cintura Escapular',
          type: 'pdf_page',
          pageNumber: 114,
          artistId: 'tenten',
          tags: ['#ombro', '#deltoide'],
          addedAt: '2026-10-26'
        },
        {
          id: 'ref_2',
          title: 'Prancha 146: Peitoral e Arco Costal',
          type: 'pdf_page',
          pageNumber: 146,
          artistId: 'tenten',
          tags: ['#torso', '#peitoral'],
          addedAt: '2026-10-26'
        }
      ]
    },
    {
      id: 'col_escorco_dinamico',
      title: 'Mestres do Escorço & Perspectiva 3D',
      description: 'Pranchas extremas com sobreposição de cilindros e ritmo de ação.',
      artistId: 'tenten',
      tags: ['#escorco', '#perspectiva', '#movimento'],
      createdAt: '2026-10-26',
      items: [
        {
          id: 'ref_3',
          title: 'Prancha 485: Braço Projetado para Frente',
          type: 'pdf_page',
          pageNumber: 485,
          artistId: 'tenten',
          tags: ['#escorco', '#braco'],
          addedAt: '2026-10-26'
        }
      ]
    }
  ]);

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');

  // Modals & Forms State
  const [showNewArtistModal, setShowNewArtistModal] = useState<boolean>(false);
  const [newArtistName, setNewArtistName] = useState<string>('');
  const [newArtistBio, setNewArtistBio] = useState<string>('');

  const [showNewCollectionModal, setShowNewCollectionModal] = useState<boolean>(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState<string>('');
  const [newCollectionDesc, setNewCollectionDesc] = useState<string>('');
  const [newCollectionTags, setNewCollectionTags] = useState<string>('');

  // AI Style Decomposition State
  const [isDecodingStyle, setIsDecodingStyle] = useState<boolean>(false);
  const [decodedArtistStyle, setDecodedArtistStyle] = useState<any | null>(null);

  const activeArtist = artists.find(a => a.id === selectedArtistId) || artists[0];
  const activeCollection = collections.find(c => c.id === selectedCollectionId) || collections[0];

  // Create New Artist Profile
  const handleAddArtist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim()) return;

    const newArtist: ArtistProfile = {
      id: 'artist_' + Date.now(),
      name: newArtistName.trim(),
      countryOrOrigin: 'Artista Convidado',
      description: newArtistBio.trim() || 'Estudo personalizado de referências e metodologia de desenho.',
      styleCharacteristics: [
        'Geometria volumétrica personalizada',
        'Pesquisa de ritmo e peso de linha',
        'Mapeamento anatômico de referências'
      ],
      isDefault: false,
      avatarColor: '#ec4899',
      referenceCount: 0
    };

    setArtists(prev => [...prev, newArtist]);
    setSelectedArtistId(newArtist.id);
    setNewArtistName('');
    setNewArtistBio('');
    setShowNewArtistModal(false);
  };

  // Create New Collection
  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionTitle.trim()) return;

    const newCol: Collection = {
      id: 'col_' + Date.now(),
      title: newCollectionTitle.trim(),
      description: newCollectionDesc.trim() || 'Coleção de estudos anatômicos.',
      artistId: selectedArtistId,
      tags: newCollectionTags.split(',').map(t => t.trim().startsWith('#') ? t.trim() : '#' + t.trim()).filter(Boolean),
      items: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCollections(prev => [newCol, ...prev]);
    setSelectedCollectionId(newCol.id);
    setNewCollectionTitle('');
    setNewCollectionDesc('');
    setNewCollectionTags('');
    setShowNewCollectionModal(false);
  };

  // Upload Reference Image to Active Collection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCollection) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newItem: ReferenceItem = {
        id: 'ref_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'uploaded_image',
        imageUrl: dataUrl,
        artistId: selectedArtistId,
        tags: ['#estudo', '#referencia'],
        addedAt: new Date().toISOString().split('T')[0]
      };

      setCollections(prev => prev.map(c => {
        if (c.id === activeCollection.id) {
          return { ...c, items: [newItem, ...c.items] };
        }
        return c;
      }));
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI to decode artist's process and generate exercises
  const handleDecodeArtistProcess = async () => {
    setIsDecodingStyle(true);
    setDecodedArtistStyle(null);

    try {
      const response = await fetch('/api/gemini/analyze-artist-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: activeArtist.name,
          notes: activeArtist.description,
        })
      });

      const data = await response.json();
      setDecodedArtistStyle(data);
    } catch (err) {
      console.error('Error decoding artist style:', err);
    } finally {
      setIsDecodingStyle(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-zinc-100">
              Coleções de Referências & Estudo de Outros Artistas
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Organize suas pranchas do Tenten e faça upload de referências de outros mestres (Bridgman, Kim Jung Gi, Loomis ou seus próprios mestres). A IA decodifica o processo de cada artista e gera exercícios para replicar o estilo com stylus!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewArtistModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Adicionar Novo Artista</span>
          </button>

          <button
            onClick={() => setShowNewCollectionModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-950"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Coleção</span>
          </button>
        </div>
      </div>

      {/* Artist Profile Bar */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {artists.map(art => (
          <button
            key={art.id}
            onClick={() => {
              setSelectedArtistId(art.id);
              setDecodedArtistStyle(null);
            }}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
              selectedArtistId === art.id
                ? 'bg-zinc-800 text-white border-purple-500 shadow-md ring-1 ring-purple-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ backgroundColor: art.avatarColor || '#f97316' }}
            >
              {art.name.charAt(0)}
            </div>
            <span>{art.name}</span>
            {art.isDefault && (
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400">
                Principal
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Artist Info & Style Breakdown Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100">
                {activeArtist.name}
              </h3>
              <span className="text-xs text-zinc-400">
                ({activeArtist.countryOrOrigin})
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              {activeArtist.description}
            </p>
          </div>

          <button
            onClick={handleDecodeArtistProcess}
            disabled={isDecodingStyle}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-purple-950 transition-all shrink-0 disabled:opacity-50"
          >
            {isDecodingStyle ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            )}
            <span>Decodificar Processo & Propor Exercícios com IA</span>
          </button>
        </div>

        {/* Style Characteristics Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeArtist.styleCharacteristics.map((char, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800">
              <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
              <span>{char}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Decoded Pipeline & Custom Exercises (if triggered) */}
      {decodedArtistStyle && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 to-zinc-900 border border-purple-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-zinc-100">
                Pipeline de Desenho Decodificado: {decodedArtistStyle.artistName}
              </h4>
            </div>
            <span className="text-[10px] uppercase font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-500/20">
              Método Prático
            </span>
          </div>

          {/* 4-Step Pipeline */}
          {decodedArtistStyle.drawingPipeline && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {decodedArtistStyle.drawingPipeline.map((step: any, idx: number) => (
                <div key={idx} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    Passo {step.step || idx + 1}
                  </span>
                  <h5 className="text-xs font-bold text-zinc-200">
                    {step.name}
                  </h5>
                  <p className="text-[11px] text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* AI Generated Exercises to replicate the style */}
          {decodedArtistStyle.customExercises && (
            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Exercícios Propostos para Replicar Este Estilo:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {decodedArtistStyle.customExercises.map((ex: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold uppercase">
                          {ex.difficulty}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {ex.durationMinutes} min
                        </span>
                      </div>
                      <h6 className="text-xs font-bold text-zinc-100">
                        {ex.title}
                      </h6>
                      <ul className="text-[11px] text-zinc-400 space-y-0.5 pt-1">
                        {ex.objectives?.map((obj: string, i: number) => (
                          <li key={i}>• {obj}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => onOpenCanvasWithReference('', {
                        id: 'custom_' + Date.now(),
                        title: ex.title,
                        difficulty: ex.difficulty,
                        category: 'Estudo de Estilo',
                        durationMinutes: ex.durationMinutes,
                        objectives: ex.objectives || [],
                        steps: [],
                        styleFocus: `Replicação do método de ${activeArtist.name}`,
                        artistId: activeArtist.id
                      })}
                      className="w-full mt-2 py-1.5 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Praticar com Stylus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collections Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Collections List */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Suas Coleções de Referências ({collections.length})
          </span>

          <div className="space-y-2">
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => setSelectedCollectionId(col.id)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-start justify-between group ${
                  activeCollection?.id === col.id
                    ? 'bg-zinc-800 border-purple-500 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850'
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-purple-300">
                    {col.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">
                    {col.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {col.tags.map((tg, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="text-[10px] text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 shrink-0 font-semibold">
                  {col.items.length} itens
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Items Inside Selected Collection */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-100">
                {activeCollection.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeCollection.description}
              </p>
            </div>

            {/* Upload Reference Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Upload de Referência</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Items Grid */}
          {activeCollection.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeCollection.items.map(item => (
                <div
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-1.5">
                    {item.imageUrl ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : item.pageNumber ? (
                      <div className="aspect-video rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-center p-2 text-zinc-400">
                        <div>
                          <BookOpen className="w-6 h-6 mx-auto text-orange-400 mb-1" />
                          <span className="text-xs font-bold text-zinc-200 block">
                            Prancha #{item.pageNumber}
                          </span>
                          <span className="text-[10px] text-zinc-500">Livro do Tenten</span>
                        </div>
                      </div>
                    ) : null}

                    <h5 className="text-xs font-semibold text-zinc-200 truncate">
                      {item.title}
                    </h5>

                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tg, i) => (
                        <span key={i} className="text-[9px] text-zinc-500">
                          {tg}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenCanvasWithReference(item.imageUrl || '')}
                    className="w-full py-1.5 px-2 bg-zinc-800 hover:bg-purple-600 hover:text-white text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors mt-2"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Estudar na Prancheta</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <FolderHeart className="w-10 h-10 mx-auto text-zinc-700" />
              <p className="text-xs font-medium text-zinc-400">
                Esta coleção ainda não possui referências salvas.
              </p>
              <p className="text-[11px] text-zinc-500">
                Faça upload de fotos ou adicione páginas do livro do Tenten para montar seu mural de aprendizado.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Modal: New Artist */}
      {showNewArtistModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddArtist}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                Cadastrar Novo Artista / Mestre
              </h3>
              <button 
                type="button" 
                onClick={() => setShowNewArtistModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Nome do Artista:</label>
                <input
                  type="text"
                  required
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  placeholder="Ex: Takehiko Inoue, Karl Kopinski, Glen Vilppu..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Estilo / Características Principais:</label>
                <textarea
                  rows={3}
                  value={newArtistBio}
                  onChange={(e) => setNewArtistBio(e.target.value)}
                  placeholder="Descreva o estilo (ex: dinamismo gestual, traço com nanquim e pincel japonês, anatomia realista com hachuras fortes)..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewArtistModal(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Salvar Artista
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Collection */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddCollection}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-purple-400" />
                Criar Nova Coleção Personalizada
              </h3>
              <button 
                type="button" 
                onClick={() => setShowNewCollectionModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Título da Coleção:</label>
                <input
                  type="text"
                  required
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  placeholder="Ex: Anatomia de Pernas e Pés, Mãos Dinâmicas..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Objetivo de Estudo:</label>
                <input
                  type="text"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  placeholder="Ex: Dominar os encaixes do gastrocnêmio e maléolos..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Tags (separadas por vírgula):</label>
                <input
                  type="text"
                  value={newCollectionTags}
                  onChange={(e) => setNewCollectionTags(e.target.value)}
                  placeholder="#pernas, #pes, #osso, #movimento"
                  className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewCollectionModal(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Criar Coleção
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
