/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header.tsx';
import { TentenReader } from './components/TentenReader.tsx';
import { StylusDrawingCanvas } from './components/StylusDrawingCanvas.tsx';
import { PhotoSearchModal } from './components/PhotoSearchModal.tsx';
import { GlossaryView } from './components/GlossaryView.tsx';
import { ArtistCollections } from './components/ArtistCollections.tsx';
import { ExerciseStudio } from './components/ExerciseStudio.tsx';
import { WeeklyLessonsView } from './components/WeeklyLessonsView.tsx';
import { BookLibraryModal } from './components/BookLibraryModal.tsx';
import { AnatomicalTerm, Exercise, ArtBook } from './types/anatomy.ts';
import { CURATED_EXERCISES } from './data/tentenIndex.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reader');
  
  // Art Books Library State
  const [books, setBooks] = useState<ArtBook[]>([]);
  const [activeBook, setActiveBook] = useState<ArtBook | null>(null);
  const [isBookLibraryOpen, setIsBookLibraryOpen] = useState<boolean>(false);

  // Load available art books on startup
  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then((data: ArtBook[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          const initial = data.find(b => b.id === 'tenten') || data[0];
          setActiveBook(initial);
        }
      })
      .catch(err => console.error('Failed to load books:', err));
  }, []);

  // Navigation & Data Sharing State
  const [currentReaderPage, setCurrentReaderPage] = useState<number>(20);
  const [canvasReferenceImage, setCanvasReferenceImage] = useState<string | null>('/api/books/tenten/page/20');
  const [canvasReferencePage, setCanvasReferencePage] = useState<number>(20);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(CURATED_EXERCISES[0]);
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<AnatomicalTerm | null>(null);

  // Stylus / S-Pen Palm Rejection Mode
  const [isStylusModeActive, setIsStylusModeActive] = useState<boolean>(true);
  const [isCleanCanvasMode, setIsCleanCanvasMode] = useState<boolean>(false);

  // Cross-Navigation Handlers
  const handleOpenCanvasWithPage = (pageNumber: number, dataUrl?: string) => {
    setCanvasReferencePage(pageNumber);
    setCanvasReferenceImage(dataUrl || `/api/books/${activeBook?.id || 'tenten'}/page/${pageNumber}`);
    // Match appropriate exercise if available
    const matchedExercise = CURATED_EXERCISES.find(ex => ex.referencePage === pageNumber) || CURATED_EXERCISES[0];
    setActiveExercise(matchedExercise);
    setActiveTab('canvas');
  };

  const handleOpenCanvasWithImage = (imageUrl: string, customExercise?: Exercise) => {
    setCanvasReferenceImage(imageUrl);
    if (customExercise) {
      setActiveExercise(customExercise);
    }
    setActiveTab('canvas');
  };

  const handleOpenBookPage = (pageNumber: number) => {
    setCurrentReaderPage(pageNumber);
    setActiveTab('reader');
  };

  const handleSelectTerm = (term: AnatomicalTerm) => {
    setSelectedGlossaryTerm(term);
    setActiveTab('glossary');
  };

  const handleStartExercise = (exercise: Exercise) => {
    setActiveExercise(exercise);
    if (exercise.referencePage) {
      setCanvasReferencePage(exercise.referencePage);
      setCanvasReferenceImage(`/api/books/${activeBook?.id || 'tenten'}/page/${exercise.referencePage}`);
    }
    setActiveTab('canvas');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Universal Header with Navigation & Stylus Switch (Hidden when drawing in Clean Interface mode) */}
      {(!isCleanCanvasMode || activeTab !== 'canvas') && (
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => {
            setIsCleanCanvasMode(false);
            setActiveTab(tab);
          }}
          onSelectTerm={handleSelectTerm}
          isStylusActive={isStylusModeActive}
          onToggleStylusMode={() => setIsStylusModeActive(!isStylusModeActive)}
          activeBook={activeBook}
          onOpenLibrary={() => setIsBookLibraryOpen(true)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col min-h-0">
        
        {/* 0. Aulas Semanais (Week 1 a 10) com Upload ate 200MB */}
        {activeTab === 'weeklyLessons' && (
          <WeeklyLessonsView
            onOpenCanvasWithReference={handleOpenCanvasWithImage}
            onOpenBookPage={handleOpenBookPage}
          />
        )}

        {/* 1. Tenten Book Reader & AI Page Breakdown (Universal Art Books) */}
        {activeTab === 'reader' && (
          <TentenReader
            initialPage={currentReaderPage}
            activeBook={activeBook}
            allBooks={books}
            onSelectBook={(book) => {
              setActiveBook(book);
              setCurrentReaderPage(1);
            }}
            onOpenLibrary={() => setIsBookLibraryOpen(true)}
            onOpenCanvasWithReference={handleOpenCanvasWithPage}
          />
        )}

        {/* 2. Visual Photo Search & Translation */}
        {activeTab === 'photoSearch' && (
          <div className="flex-1 overflow-y-auto">
            <PhotoSearchModal
              onOpenBookPage={handleOpenBookPage}
              onOpenCanvasWithImage={handleOpenCanvasWithImage}
            />
          </div>
        )}

        {/* 3. Stylus Drawing Canvas for Tablet & S24 Ultra */}
        {activeTab === 'canvas' && (
          <StylusDrawingCanvas
            exercise={activeExercise}
            referenceImageUrl={canvasReferenceImage}
            referencePage={canvasReferencePage}
            isStylusModeActive={isStylusModeActive}
            onToggleStylusMode={() => setIsStylusModeActive(!isStylusModeActive)}
            isCleanInterface={isCleanCanvasMode}
            onToggleCleanInterface={setIsCleanCanvasMode}
          />
        )}

        {/* 4. Curated Exercise Studio */}
        {activeTab === 'exercises' && (
          <div className="flex-1 overflow-y-auto">
            <ExerciseStudio
              onStartExercise={handleStartExercise}
              onOpenBookPage={handleOpenBookPage}
            />
          </div>
        )}

        {/* 5. Spanish-Portuguese Anatomy Glossary */}
        {activeTab === 'glossary' && (
          <div className="flex-1 overflow-y-auto">
            <GlossaryView
              onOpenBookPage={handleOpenBookPage}
              selectedTerm={selectedGlossaryTerm}
            />
          </div>
        )}

        {/* 6. Other Artists & Custom Collections */}
        {activeTab === 'collections' && (
          <div className="flex-1 overflow-y-auto">
            <ArtistCollections
              onOpenCanvasWithReference={handleOpenCanvasWithImage}
            />
          </div>
        )}

      </main>

      {/* Art Books Library & PDF Upload Modal */}
      <BookLibraryModal
        isOpen={isBookLibraryOpen}
        onClose={() => setIsBookLibraryOpen(false)}
        books={books}
        activeBookId={activeBook?.id || 'tenten'}
        onSelectBook={(book) => {
          setActiveBook(book);
          setCurrentReaderPage(1);
          setCanvasReferencePage(1);
          setCanvasReferenceImage(`/api/books/${book.id}/page/1`);
          setActiveTab('reader');
        }}
        onBookUploaded={(uploadedBook) => {
          setBooks(prev => {
            const exists = prev.some(b => b.id === uploadedBook.id);
            if (exists) {
              return prev.map(b => b.id === uploadedBook.id ? uploadedBook : b);
            }
            return [uploadedBook, ...prev];
          });
          setActiveBook(uploadedBook);
          setCurrentReaderPage(1);
          setCanvasReferencePage(1);
          setCanvasReferenceImage(`/api/books/${uploadedBook.id}/page/1?t=${Date.now()}`);
          setActiveTab('reader');
        }}
        onBookDeleted={(deletedId) => {
          setBooks(prev => {
            const updated = prev.filter(b => b.id !== deletedId);
            if (activeBook?.id === deletedId) {
              setActiveBook(updated[0] || null);
            }
            return updated;
          });
        }}
      />

    </div>
  );
}
