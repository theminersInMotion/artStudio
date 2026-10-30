/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  UploadCloud, 
  Trash2, 
  Plus, 
  Check, 
  Sparkles, 
  FileText, 
  Loader2, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { ArtBook } from '../types/anatomy.ts';

interface BookLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: ArtBook[];
  activeBookId: string;
  onSelectBook: (book: ArtBook) => void;
  onBookUploaded: (newBook: ArtBook) => void;
  onBookDeleted: (bookId: string) => void;
}

export const BookLibraryModal: React.FC<BookLibraryModalProps> = ({
  isOpen,
  onClose,
  books,
  activeBookId,
  onSelectBook,
  onBookUploaded,
  onBookDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload'>('catalog');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleInput, setTitleInput] = useState<string>('');
  const [artistInput, setArtistInput] = useState<string>('');
  const [languageInput, setLanguageInput] = useState<string>('Português');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    // Autofill clean title from filename
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!titleInput) {
      setTitleInput(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Selecione um arquivo PDF antes de enviar.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', titleInput || selectedFile.name.replace(/\.[^/.]+$/, ''));
    formData.append('artist', artistInput || 'Artista Convidado');
    formData.append('language', languageInput || 'Português');
    formData.append('description', descriptionInput || '');

    try {
      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha no upload do livro.');
      }

      const data = await res.json();
      if (data.book) {
        onBookUploaded(data.book);
        setUploadSuccessMsg(`Livro "${data.book.title}" carregado com sucesso (${data.book.totalPages} páginas)!`);
        setTimeout(() => {
          onSelectBook(data.book);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Erro ao carregar livro.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBook = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja remover este livro da sua biblioteca?')) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onBookDeleted(bookId);
      }
    } catch (err) {
      console.error('Delete book error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Biblioteca de Livros de Arte &amp; Anatomia
              </h2>
              <p className="text-xs text-zinc-400">
                Alterne entre mestres ou faça upload de qualquer livro/apostila em PDF (sem limite de tamanho)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'catalog'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Catálogo de Obras ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Adicionar Novo Livro (Upload PDF)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'catalog' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map((book) => {
                  const isActive = book.id === activeBookId;
                  return (
                    <div
                      key={book.id}
                      onClick={() => {
                        onSelectBook(book);
                        onClose();
                      }}
                      className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'bg-orange-950/20 border-orange-500/80 ring-1 ring-orange-500/50 shadow-lg shadow-orange-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex gap-3.5">
                        {/* Book Thumbnail / Cover */}
                        <div className="w-20 h-28 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 shadow-inner relative flex items-center justify-center">
                          <img
                            src={book.coverImage || `/api/books/${book.id}/page/1`}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails, fallback to styled icon
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center bg-zinc-900/40 pointer-events-none">
                            <span className="text-[10px] font-bold text-orange-400 leading-tight">
                              {book.artist}
                            </span>
                            <span className="text-[8px] text-zinc-400 mt-1 font-mono">
                              {book.totalPages} págs
                            </span>
                          </div>
                        </div>

                        {/* Info details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition-colors line-clamp-1">
                                {book.title}
                              </h3>
                              <p className="text-xs text-orange-400/90 font-medium">
                                {book.artist}
                              </p>
                            </div>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-600/30 text-orange-400 text-[10px] font-bold border border-orange-500/40 shrink-0">
                                Livro Ativo
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                            {book.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-300">
                              {book.totalPages} páginas
                            </span>
                            {book.language && (
                              <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-[10px] text-zinc-400">
                                {book.language}
                              </span>
                            )}
                            {book.hasPdfOnDisk ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-[10px] text-emerald-400 font-semibold">
                                PDF Integrado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/60 text-[10px] text-amber-400 font-medium">
                                Pranchas Interativas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete action for custom books */}
                      {book.isCustomUploaded && (
                        <button
                          onClick={(e) => handleDeleteBook(book.id, e)}
                          className="absolute bottom-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-75 hover:opacity-100"
                          title="Remover livro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick action card */}
              <div 
                onClick={() => setActiveTab('upload')}
                className="p-5 border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-xl text-center cursor-pointer transition-all bg-zinc-950/30 hover:bg-orange-950/10 group"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-zinc-800 group-hover:bg-orange-600/20 text-zinc-400 group-hover:text-orange-400 flex items-center justify-center transition-colors mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-orange-300">
                  Adicionar outro Livro de Arte ou Caderno de Estudos
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Carregue apostilas de Kim Jung Gi, Glen Vilppu, Karl Kopinski ou seus próprios sketches em PDF sem limite de tamanho.
                </p>
              </div>
            </div>
          ) : (
            /* Upload Tab */
            <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-2xl mx-auto">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500/70 bg-emerald-950/10'
                    : 'border-zinc-700 hover:border-orange-500 bg-zinc-950/40 hover:bg-zinc-900/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-zinc-100">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-400 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Pronto para upload
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-xs text-orange-400 hover:underline mt-1 inline-block"
                    >
                      Trocar arquivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-zinc-100">
                      Arraste e solte o livro em PDF aqui
                    </p>
                    <p className="text-xs text-zinc-400">
                      ou clique para selecionar do seu dispositivo (qualquer tamanho / sem limite)
                    </p>
                  </div>
                )}
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Título da Obra / Livro:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Anatomia Construtiva"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Autor / Artista:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kim Jung Gi, Andrew Loomis..."
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Idioma Original do Livro:
                  </label>
                  <select
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Português">Português</option>
                    <option value="Espanhol">Espanhol (ES)</option>
                    <option value="Inglês">Inglês (EN)</option>
                    <option value="Francês">Francês (FR)</option>
                    <option value="Japonês">Japonês / Coreano</option>
                    <option value="Outro">Outro Idioma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Descrição ou Foco:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Estudo de mãos, hachuras e perspectiva"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Informative Tip */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-start gap-2.5 text-xs text-zinc-400">
                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p>
                  Os livros carregados por upload são armazenados localmente e ficam automaticamente excluídos do Git (.gitignore), garantindo que seu repositório no GitHub e Render.com continuem leves e sem erros de limite de 100MB.
                </p>
              </div>

              {/* Feedback messages */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                  {uploadError}
                </div>
              )}
              {uploadSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {uploadSuccessMsg}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  Voltar ao Catálogo
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando Páginas do Livro...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Salvar e Abrir Livro</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
