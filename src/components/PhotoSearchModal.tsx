/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Search, 
  BookOpen, 
  PenTool, 
  CheckCircle2, 
  Loader2, 
  RotateCw,
  Image as ImageIcon,
  ArrowRight,
  Info
} from 'lucide-react';
import { AnatomicalTerm } from '../types/anatomy.ts';

interface PhotoSearchModalProps {
  onOpenBookPage: (pageNumber: number) => void;
  onOpenCanvasWithImage: (imageUrl: string) => void;
}

export const PhotoSearchModal: React.FC<PhotoSearchModalProps> = ({
  onOpenBookPage,
  onOpenCanvasWithImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-baked Sample References for 1-click test without camera
  const SAMPLE_PRESETS = [
    {
      title: 'Membros Superiores & Deltoide',
      desc: 'Braço, bíceps e inserção do ombro',
      url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Torso, Tórax & Abdômen',
      desc: 'Peitoral maior, serrátil e linha alba',
      url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Dorso & Escápula',
      desc: 'Trapézio, grande dorsal e romboides',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    }
  ];

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Câmera indisponível no navegador. Você pode fazer upload de foto ou usar os exemplos abaixo.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Snap photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      stopCamera();
      analyzeImage(dataUrl);
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Perform AI Visual Search
  const analyzeImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/gemini/search-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          userQuery: 'Identifique os músculos e ossos mostrados, traduza os termos de espanhol para português e recomende as páginas do livro do Tenten.'
        }),
      });

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Error analyzing photo:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-zinc-100">
              Busca Visual de Termos Anatômicos por Foto
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Aponte a câmera do seu tablet/S24 Ultra para qualquer desenho ou foto do corpo. A IA identifica as estruturas anatômicas, traduz do Espanhol para o Português e localiza a prancha correspondente do Tenten.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-950"
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Câmera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all border border-zinc-700"
            >
              <span>Fechar Câmera</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
          >
            <Upload className="w-4 h-4 text-orange-400" />
            <span>Upload de Foto</span>
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="p-3 bg-zinc-900 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Camera Live Viewfinder */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-video max-w-xl mx-auto shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 pointer-events-none rounded-2xl m-6 flex items-center justify-center">
            <span className="text-[11px] bg-black/70 px-2.5 py-1 rounded-full text-cyan-300">
              Enquadre a região anatômica
            </span>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={capturePhoto}
              className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-lg shadow-cyan-950 font-bold active:scale-95 transition-transform ring-4 ring-cyan-500/30"
              title="Tirar Foto"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Image Preview & Sample Presets / AI Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Image or Presets */}
        <div className="lg:col-span-5 space-y-4">
          
          {selectedImage ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Foto para busca visual"
                  className="w-full h-full object-contain"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-cyan-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold">Analisando anatomia e traduzindo...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => analyzeImage(selectedImage)}
                  disabled={isAnalyzing}
                  className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Reanalisar Foto
                </button>

                <button
                  onClick={() => onOpenCanvasWithImage(selectedImage)}
                  className="flex-1 py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Praticar na Prancheta
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-8 text-center bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  Tire uma foto ou arraste uma imagem aqui
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Suporta PNG, JPG ou fotos tiradas pelo celular/tablet
                </p>
              </div>
            </div>
          )}

          {/* Quick Presets for Demo */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Exemplos Rápidos para Testar Busca Visual:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(preset.url);
                    analyzeImage(preset.url);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-left flex items-center gap-3 transition-colors group"
                >
                  <img
                    src={preset.url}
                    alt={preset.title}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                      {preset.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {preset.desc}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: AI Visual Recognition & Translation Results */}
        <div className="lg:col-span-7">
          {analysisResult ? (
            <div className="space-y-4">
              
              {/* Region Overview Card */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-cyan-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Região Identificada
                    </span>
                  </div>
                  <span className="text-xs font-bold text-zinc-100 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                    {analysisResult.detectedRegion}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {analysisResult.descriptionPt}
                </p>

                {analysisResult.processAdvice && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
                    <span className="font-semibold text-orange-400">Abordagem do Tenten: </span>
                    {analysisResult.processAdvice}
                  </div>
                )}
              </div>

              {/* Identified Terms ES -> PT */}
              {analysisResult.identifiedTerms && analysisResult.identifiedTerms.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Termos Anatômicos Reconhecidos</span>
                    <span className="text-[11px] font-normal text-zinc-500">
                      Tradução Técnica Automática
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {analysisResult.identifiedTerms.map((term: any, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-400">
                              🇪🇸 {term.termEs}
                            </span>
                            <span className="text-zinc-600">→</span>
                            <span className="text-xs font-bold text-emerald-400">
                              🇧🇷 {term.termPt}
                            </span>
                          </div>
                          {term.confidence && (
                            <span className="text-[10px] font-mono text-zinc-500">
                              {Math.round(term.confidence * 100)}% conf.
                            </span>
                          )}
                        </div>

                        {term.notePt && (
                          <p className="text-[11px] text-zinc-400">
                            {term.notePt}
                          </p>
                        )}

                        {term.drawingTip && (
                          <div className="p-2 rounded-lg bg-orange-500/10 border-l-2 border-orange-500 text-[11px] text-orange-200">
                            <span className="font-semibold">Como desenhar:</span> {term.drawingTip}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Tenten Book Pages */}
              {analysisResult.suggestedPages && analysisResult.suggestedPages.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">
                      Pranchas Correspondentes no Livro do Tenten:
                    </span>
                    <BookOpen className="w-4 h-4 text-orange-400" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {analysisResult.suggestedPages.map((pg: number) => (
                      <button
                        key={pg}
                        onClick={() => onOpenBookPage(pg)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-orange-600 hover:text-white border border-zinc-700 text-xs font-semibold text-orange-400 flex items-center gap-1.5 transition-colors"
                      >
                        <span>Prancha #{pg}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Practice Button */}
              {selectedImage && (
                <button
                  onClick={() => onOpenCanvasWithImage(selectedImage)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:brightness-110 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-950 transition-all"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Praticar Esta Imagem na Prancheta com Stylus</span>
                </button>
              )}

            </div>
          ) : (
            <div className="h-full min-h-[300px] border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-zinc-900/30 text-zinc-500 space-y-3">
              <Search className="w-10 h-10 text-zinc-700" />
              <p className="text-xs font-medium text-zinc-400">
                Nenhuma foto selecionada ainda
              </p>
              <p className="text-[11px] max-w-sm text-zinc-500">
                Tire uma foto do seu caderno ou livro, ou escolha um dos exemplos rápidos à esquerda para ver a IA traduzindo termos anatômicos em tempo real.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
