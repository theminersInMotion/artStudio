/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Info,
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { ArtBook } from '../types/anatomy.ts';
import { savePdfToIndexedDb, deletePdfFromIndexedDb } from '../utils/pdfStorage.ts';

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
  const [targetBookId, setTargetBookId] = useState<string>('tenten');
  const [titleInput, setTitleInput] = useState<string>('');
  const [artistInput, setArtistInput] = useState<string>('');
  const [languageInput, setLanguageInput] = useState<string>('Español');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Deletion modal state
  const [deletingBook, setDeletingBook] = useState<ArtBook | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRestoringDefaults, setIsRestoringDefaults] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync inputs when targetBookId changes
  useEffect(() => {
    if (targetBookId === 'new') {
      if (!selectedFile) {
        setTitleInput('');
        setArtistInput('');
        setDescriptionInput('');
        setLanguageInput('Português');
      }
    } else {
      const target = books.find(b => b.id === targetBookId);
      if (target) {
        setTitleInput(target.title);
        setArtistInput(target.artist);
        setLanguageInput(target.language || 'Português');
        setDescriptionInput(target.description || '');
      }
    }
  }, [targetBookId, books]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    const lowerName = file.name.toLowerCase();
    // Smart auto-detection of target book
    if (lowerName.includes('tenten') || lowerName.includes('morfologia') || lowerName.includes('anatomia dinamica')) {
      setTargetBookId('tenten');
      const tentenBook = books.find(b => b.id === 'tenten');
      if (tentenBook) {
        setTitleInput(tentenBook.title);
        setArtistInput(tentenBook.artist);
        setLanguageInput(tentenBook.language || 'Español');
        setDescriptionInput(tentenBook.description || '');
      }
    } else if (lowerName.includes('loomis') || lowerName.includes('figure drawing')) {
      setTargetBookId('loomis');
      const loomisBook = books.find(b => b.id === 'loomis');
      if (loomisBook) {
        setTitleInput(loomisBook.title);
        setArtistInput(loomisBook.artist);
        setLanguageInput(loomisBook.language || 'Inglês');
        setDescriptionInput(loomisBook.description || '');
      }
    } else if (lowerName.includes('bridgman') || lowerName.includes('constructive')) {
      setTargetBookId('bridgman');
      const bridgmanBook = books.find(b => b.id === 'bridgman');
      if (bridgmanBook) {
        setTitleInput(bridgmanBook.title);
        setArtistInput(bridgmanBook.artist);
        setLanguageInput(bridgmanBook.language || 'Inglês');
        setDescriptionInput(bridgmanBook.description || '');
      }
    } else if (targetBookId === 'new') {
      // Autofill clean title from filename for new book
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitleInput(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
      if (!artistInput) setArtistInput('Artista Convidado');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleOpenUploadForBook = (book: ArtBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetBookId(book.id);
    setTitleInput(book.title);
    setArtistInput(book.artist);
    setLanguageInput(book.language || 'Português');
    setDescriptionInput(book.description || '');
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccessMsg(null);
    setActiveTab('upload');
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
    formData.append('targetBookId', targetBookId);
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
        // Cache PDF in browser IndexedDB for instant client rendering
        try {
          await savePdfToIndexedDb(data.book.id || targetBookId, selectedFile);
        } catch (e) {
          console.warn('Could not cache PDF in IndexedDB:', e);
        }

        onBookUploaded(data.book);
        setUploadSuccessMsg(data.message || `Livro "${data.book.title}" atualizado com sucesso!`);
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

  // Confirm delete or remove PDF
  const executeDeleteBook = async (action: 'deleted' | 'resetPdf') => {
    if (!deletingBook) return;
    setIsDeleting(true);

    try {
      // Remove from browser IndexedDB cache
      try {
        await deletePdfFromIndexedDb(deletingBook.id);
      } catch (e) {}

      const url = action === 'resetPdf' 
        ? `/api/books/${deletingBook.id}?action=resetPdf`
        : `/api/books/${deletingBook.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Falha ao remover o livro.');
      }

      const data = await res.json();

      if (action === 'resetPdf') {
        // Re-fetch or update book in state with hasPdfOnDisk = false
        const updatedBook: ArtBook = {
          ...deletingBook,
          hasPdfOnDisk: false,
          fileSize: undefined,
          filename: undefined
        };
        onBookUploaded(updatedBook);
      } else {
        onBookDeleted(deletingBook.id);
      }

      setDeletingBook(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Erro ao excluir livro: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setIsRestoringDefaults(true);
    try {
      const res = await fetch('/api/books/restore-defaults', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.books)) {
          data.books.forEach((b: ArtBook) => onBookUploaded(b));
        }
      }
    } catch (e) {
      console.error('Restore defaults error:', e);
    } finally {
      setIsRestoringDefaults(false);
    }
  };

  const selectedTargetBook = books.find(b => b.id === targetBookId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Biblioteca de Livros de Arte &amp; Anatomia
              </h2>
              <p className="text-xs text-zinc-400">
                Vincule o PDF original do Tenten ou adicione outros livros sem limite de tamanho
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Catálogo de Obras ({books.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              setUploadError(null);
              setUploadSuccessMsg(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            {targetBookId === 'tenten' 
              ? 'Carregar / Vincular PDF do Tenten' 
              : 'Upload / Vincular PDF'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'catalog' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map((book) => {
                  const isActive = book.id === activeBookId;
                  const isTenten = book.id === 'tenten';
                  return (
                    <div
                      key={book.id}
                      onClick={() => {
                        onSelectBook(book);
                        onClose();
                      }}
                      className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-orange-950/20 border-orange-500/80 ring-1 ring-orange-500/50 shadow-lg shadow-orange-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/50'
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
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/60 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                PDF Original Ativo {book.fileSize ? `(${book.fileSize})` : ''}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/60 text-[10px] text-amber-400 font-medium">
                                Pranchas Vetoriais (Sem PDF)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons (Upload & Delete) */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-800/80">
                        {/* Attach/Upload PDF button for this specific book */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenUploadForBook(book, e)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-orange-600/20 hover:border-orange-500/40 border border-zinc-700 text-zinc-300 hover:text-orange-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={book.hasPdfOnDisk ? 'Atualizar arquivo PDF deste livro' : 'Vincular arquivo PDF deste livro'}
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
                          <span>
                            {book.hasPdfOnDisk 
                              ? 'Atualizar PDF' 
                              : isTenten ? 'Carregar PDF do Tenten' : 'Vincular PDF'}
                          </span>
                        </button>

                        {/* Delete / Remove Book Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingBook(book);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors cursor-pointer"
                          title="Excluir livro ou remover arquivo PDF"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions: Quick Add New Book & Restore Defaults */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button 
                  onClick={() => {
                    setTargetBookId('new');
                    setSelectedFile(null);
                    setTitleInput('');
                    setArtistInput('');
                    setDescriptionInput('');
                    setActiveTab('upload');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-xl text-xs font-semibold text-zinc-300 hover:text-orange-300 transition-all bg-zinc-950/30 hover:bg-orange-950/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-orange-400" />
                  <span>Adicionar Outro Livro de Arte (Upload de Novo PDF)</span>
                </button>

                <button
                  onClick={handleRestoreDefaults}
                  disabled={isRestoringDefaults}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className={`w-3 h-3 ${isRestoringDefaults ? 'animate-spin' : ''}`} />
                  <span>Restaurar livros originais</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload Tab */
            <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-2xl mx-auto">
              
              {/* Destination Book Selector */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-zinc-200">
                  Onde você deseja adicionar este arquivo PDF?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={targetBookId}
                    onChange={(e) => setTargetBookId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-orange-400 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <optgroup label="Vincular a Livro Existente:">
                      {books.map(b => (
                        <option key={b.id} value={b.id} className="text-zinc-100">
                          {b.title} ({b.artist})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ou criar novo:">
                      <option value="new" className="text-emerald-400 font-bold">
                        + Criar Novo Livro na Biblioteca
                      </option>
                    </optgroup>
                  </select>

                  <div className="text-[11px] text-zinc-400 flex items-center bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                    {targetBookId === 'tenten' ? (
                      <span className="text-orange-300 font-medium">
                        ✨ Vincula diretamente ao livro oficial do <strong>Tenten</strong> sem duplicar!
                      </span>
                    ) : targetBookId === 'new' ? (
                      <span className="text-emerald-300 font-medium">
                        Cria um novo livro no seu catálogo permanente.
                      </span>
                    ) : (
                      <span>
                        Substitui/adiciona o PDF ao livro <strong>{selectedTargetBook?.title}</strong>.
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Pronto para envio
                    </p>
                    {targetBookId === 'tenten' && (
                      <div className="inline-block px-2.5 py-1 rounded bg-orange-950/80 border border-orange-700/60 text-xs text-orange-300 font-semibold mt-1">
                        ✓ Vinculando ao Livro do Tenten (Morfología y Anatomía)
                      </div>
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-xs text-orange-400 hover:underline mt-1 inline-block cursor-pointer"
                      >
                        Trocar arquivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-zinc-100">
                      {targetBookId === 'tenten'
                        ? 'Selecione ou solte aqui o arquivo PDF do Livro do Tenten'
                        : 'Arraste e solte o livro em PDF aqui'}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Qualquer tamanho (sem limite de MB) • Streaming direto para disco
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
                    placeholder="Ex: Morfología y Anatomía Dinámica"
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
                    placeholder="Ex: Tenten, Kim Jung Gi, Andrew Loomis..."
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Español">Espanhol (ES)</option>
                    <option value="Português">Português (PT)</option>
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
                    placeholder="Ex: Raciocínio estrutural 3D e anatomia dinâmica"
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
                  O arquivo PDF enviado é processado diretamente no servidor e fica no <code className="text-orange-400 font-mono">.gitignore</code>, permitindo que você suba arquivos pesados (200MB, 500MB+) sem travar o GitHub ou o Render.
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Voltar ao Catálogo
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando e Vinculando Páginas...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>
                        {targetBookId === 'tenten'
                          ? 'Vincular PDF ao Livro do Tenten'
                          : targetBookId === 'new'
                          ? 'Cadastrar Novo Livro'
                          : `Vincular PDF a "${selectedTargetBook?.artist || 'Livro'}"`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Book Deletion */}
      {deletingBook && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-950/80 border border-red-800/80 rounded-xl text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-zinc-100">
                  Gerenciar / Excluir Livro
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Obra: <strong className="text-zinc-200">{deletingBook.title}</strong> ({deletingBook.artist})
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-1.5">
              {deletingBook.hasPdfOnDisk ? (
                <p>
                  Este livro possui um arquivo PDF original carregado no servidor. O que você gostaria de fazer?
                </p>
              ) : (
                <p>
                  Tem certeza que deseja remover este livro do catálogo da sua biblioteca?
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {/* Option 1: If has PDF, allow resetting just the PDF */}
              {deletingBook.hasPdfOnDisk && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => executeDeleteBook('resetPdf')}
                  className="w-full py-2 px-3 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800 text-amber-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Remover apenas o arquivo PDF (voltar para pranchas vetoriais)</span>
                </button>
              )}

              {/* Option 2: Delete entire book from library */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => executeDeleteBook('deleted')}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Excluir livro completamente da biblioteca</span>
              </button>

              {/* Cancel button */}
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
