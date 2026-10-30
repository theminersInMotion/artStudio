/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Maximize2,
  PenTool,
  BookOpen,
  Clock,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Search,
  Filter,
  FileCheck,
} from "lucide-react";
import { CURRICULUM_WEEKS, validateFile, formatBytes, MAX_FILE_SIZE_BYTES, WeekLessonPlan } from "../utils/fileValidation.ts";
import { OFFICIAL_WEEK_MATERIALS, OfficialMaterial } from "../data/curriculumData.ts";
import { saveUpload, getUploads, deleteUpload, WeeklyUploadRecord } from "../utils/indexedDbStorage.ts";

interface WeeklyLessonsViewProps {
  onOpenCanvasWithReference: (imageUrl: string) => void;
  onOpenBookPage: (pageNumber: number) => void;
}

export const WeeklyLessonsView: React.FC<WeeklyLessonsViewProps> = ({
  onOpenCanvasWithReference,
  onOpenBookPage,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [userUploads, setUserUploads] = useState<WeeklyUploadRecord[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "official" | "uploads" | "images" | "pdfs">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Lightbox / Zoom Modal
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    url: string;
    category: "image" | "pdf" | "other";
    size?: string;
    isOfficial?: boolean;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load user uploads from IndexedDB
  const refreshUploads = async () => {
    setIsLoadingUploads(true);
    try {
      const records = await getUploads();
      setUserUploads(records);
    } catch (err) {
      console.error("Falha ao carregar uploads do IndexedDB:", err);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  useEffect(() => {
    refreshUploads();
  }, []);

  // Filter current week materials
  const currentWeekPlan: WeekLessonPlan =
    CURRICULUM_WEEKS.find((w) => w.week === selectedWeek) || CURRICULUM_WEEKS[0];

  const currentOfficialMaterials = OFFICIAL_WEEK_MATERIALS.filter(
    (m) => m.week === selectedWeek
  );

  const currentWeekUploads = userUploads.filter(
    (u) => u.week === selectedWeek
  );

  // Handle file uploads (supporting up to 200MB, JPG, WEBP, PNG, HEIC, PDF)
  const handleFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    setUploadSuccess(null);

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgressText(`Processando ${i + 1} de ${fileArray.length}: ${file.name} (${formatBytes(file.size)})...`);

      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`"${file.name}": ${validation.error}`);
        continue;
      }

      try {
        await saveUpload(selectedWeek, file, `Arquivo para Semana ${selectedWeek}`);
        successCount++;
      } catch (err: any) {
        errors.push(`Erro ao salvar "${file.name}": ${err?.message || "falha de armazenamento"}`);
      }
    }

    setIsUploading(false);
    setUploadProgressText("");

    if (errors.length > 0) {
      setUploadError(errors.join(" | "));
    }

    if (successCount > 0) {
      setUploadSuccess(`${successCount} arquivo(s) adicionado(s) com sucesso à Semana ${selectedWeek}!`);
      await refreshUploads();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteUpload = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente excluir este arquivo enviado?")) {
      try {
        await deleteUpload(id);
        setUserUploads((prev) => prev.filter((u) => u.id !== id));
        if (previewItem && previewItem.url.includes(id)) {
          setPreviewItem(null);
        }
      } catch (err) {
        console.error("Erro ao deletar:", err);
      }
    }
  };

  // Extract starting page number if recommendedPages has format "Págs. 12 a 45..."
  const getStartingPage = (pageStr: string): number => {
    const match = pageStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // Combined and filtered materials for active week
  const allMaterials = [
    ...currentOfficialMaterials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      imageUrl: m.imageUrl,
      category: m.category === "book_page" ? "pdf" : "image",
      isOfficial: true,
      size: m.category === "book_page" ? "Livro Tenten" : "Prancha HD",
      createdAt: 0,
    })),
    ...currentWeekUploads.map((u) => ({
      id: u.id,
      title: u.fileName,
      description: u.notes || "Upload pessoal do aluno",
      imageUrl: u.previewUrl || "",
      category: u.category,
      isOfficial: false,
      size: formatBytes(u.fileSize),
      createdAt: u.createdAt,
    })),
  ];

  const filteredMaterials = allMaterials.filter((item) => {
    // Category / Origin filter
    if (filterType === "official" && !item.isOfficial) return false;
    if (filterType === "uploads" && item.isOfficial) return false;
    if (filterType === "images" && item.category !== "image") return false;
    if (filterType === "pdfs" && item.category !== "pdf") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-100 overflow-y-auto">
      {/* Top Banner / Course Header */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border-b border-zinc-800/80 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  Módulo de Treinamento Intensivo
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Week 1 a Week 10
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  Upload até 200MB
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Aulas Semanais de Anatomia & Pranchas Práticas
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
                Guia progressivo do começo ao fim do método Tenten com 10 semanas de estudos estruturados.
                Visualize as pranchas originais em alta definição, faça upload de fotos, estudos ou apostilas de até 200 MB e envie direto para a prancheta de desenho com stylus.
              </p>
            </div>

            {/* Quick Stats & Upload Action */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-medium text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload de Arquivo (até 200MB)</span>
              </button>
            </div>
          </div>

          {/* Week Selection Carousel / Navigation Bar */}
          <div className="mt-5 pt-3 border-t border-zinc-800/60">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>Selecione a Semana de Estudo:</span>
              <span className="text-orange-400 font-normal normal-case">
                {currentWeekUploads.length > 0
                  ? `${currentWeekUploads.length} envio(s) seu(s) nesta semana`
                  : "Nenhum upload pessoal nesta semana"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 sm:gap-2">
              {CURRICULUM_WEEKS.map((w) => {
                const isCurrent = w.week === selectedWeek;
                const weekOfficialCount = OFFICIAL_WEEK_MATERIALS.filter((m) => m.week === w.week).length;
                const weekUserUploadCount = userUploads.filter((u) => u.week === w.week).length;
                const totalSheets = weekOfficialCount + weekUserUploadCount;

                return (
                  <button
                    key={w.week}
                    onClick={() => {
                      setSelectedWeek(w.week);
                      setUploadError(null);
                      setUploadSuccess(null);
                    }}
                    className={`p-2 rounded-xl text-left transition-all border relative flex flex-col justify-between ${
                      isCurrent
                        ? "bg-gradient-to-b from-orange-500/20 to-orange-500/5 border-orange-500 shadow-md shadow-orange-950/40 text-white ring-1 ring-orange-500/50"
                        : "bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold ${isCurrent ? "text-orange-400" : "text-zinc-200"}`}>
                        Week {w.week}
                      </span>
                      {weekUserUploadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" title="${weekUserUploadCount} arquivos enviados" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 leading-tight font-medium">
                      {w.title.replace(/^Semana \d+:\s*/, "")}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>{totalSheets} {totalSheets === 1 ? "item" : "itens"}</span>
                      {w.week === 1 && (
                        <span className="text-[8px] bg-orange-950/80 text-orange-400 px-1 rounded border border-orange-800/40">
                          12 Pranchas
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Active Week Hero Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500 text-white">
                  Semana {currentWeekPlan.week} de 10
                </span>
                <span className="text-xs font-semibold text-zinc-300">
                  {currentWeekPlan.subTitle}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentWeekPlan.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                {currentWeekPlan.description}
              </p>

              {/* Focus tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[11px] font-semibold text-zinc-400 mr-1">Tópicos:</span>
                {currentWeekPlan.focusAreas.map((topic, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800/90 border border-zinc-700/80 text-zinc-300"
                  >
                    ✓ {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 min-w-[260px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  Prática Sugerida:
                </span>
                <span className="font-semibold text-zinc-200">
                  ~{currentWeekPlan.totalSuggestedHours} horas / semana
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  No Livro Tenten:
                </span>
                <span className="font-semibold text-orange-400 text-[11px] truncate max-w-[140px]">
                  {currentWeekPlan.recommendedPages}
                </span>
              </div>

              <button
                onClick={() => onOpenBookPage(getStartingPage(currentWeekPlan.recommendedPages))}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                <span>Ler Capítulos no Livro Oficial</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload Zone (Supports up to 200MB, JPG, WEBP, PNG, HEIC, PDF) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? "border-orange-500 bg-orange-500/10 scale-[1.005]"
              : "border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-900/70"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />

          <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                Arraste suas pranchas ou clique para fazer upload
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Suporte nativo para imagens e documentos de <strong className="text-orange-400 font-medium">até 200 MB por arquivo</strong>.
              </p>
            </div>

            {/* Formats Pills */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">JPG</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">WEBP</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">PNG</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">HEIC / Apple</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">PDF (Apostilas)</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs font-semibold border border-zinc-600 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? "Enviando e indexando..." : "Selecionar Arquivos do Dispositivo"}
            </button>
          </div>

          {/* Loading / Uploading indicator */}
          {isUploading && (
            <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <span>{uploadProgressText || "Salvando no banco de dados local..."}</span>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "all"
                  ? "bg-orange-500 text-white font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Todos ({allMaterials.length})
            </button>
            <button
              onClick={() => setFilterType("official")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "official"
                  ? "bg-orange-500 text-white font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Pranchas do Autor ({currentOfficialMaterials.length})
            </button>
            <button
              onClick={() => setFilterType("uploads")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "uploads"
                  ? "bg-orange-500 text-white font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Meus Uploads ({currentWeekUploads.length})
            </button>
            <button
              onClick={() => setFilterType("images")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "images"
                  ? "bg-orange-500 text-white font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Apenas Imagens
            </button>
            <button
              onClick={() => setFilterType("pdfs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "pdfs"
                  ? "bg-orange-500 text-white font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              PDFs
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou tema..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Materials Grid */}
        <div>
          {filteredMaterials.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-300">
                Nenhum arquivo encontrado para este filtro na Semana {selectedWeek}
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Você pode fazer upload de novas pranchas em JPG, WEBP, PNG, HEIC ou apostilas em PDF usando a área de upload acima (arquivos de até 200MB).
              </p>
              <button
                onClick={() => {
                  setFilterType("all");
                  setSearchQuery("");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMaterials.map((item) => (
                <div
                  key={item.id}
                  className="group bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/60 rounded-xl overflow-hidden flex flex-col transition-all shadow-md hover:shadow-xl hover:shadow-orange-950/20"
                >
                  {/* Thumbnail / Preview Area */}
                  <div
                    onClick={() =>
                      setPreviewItem({
                        title: item.title,
                        url: item.imageUrl,
                        category: item.category as any,
                        size: item.size,
                        isOfficial: item.isOfficial,
                      })
                    }
                    className="relative aspect-[4/3] bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {item.category === "pdf" ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 p-4">
                        <FileText className="w-12 h-12 text-red-400" />
                        <span className="text-[11px] font-medium text-zinc-300 text-center line-clamp-2">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-500">Documento PDF</span>
                      </div>
                    ) : item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-zinc-700" />
                    )}

                    {/* Badge Overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {item.isOfficial ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/90 text-white shadow">
                          Oficial
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600/90 text-white shadow">
                          Meu Upload
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="p-1 rounded-md bg-zinc-900/80 text-zinc-200 backdrop-blur-sm hover:text-white" title="Expandir">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-950/80 text-zinc-400 border border-zinc-800">
                        {item.size}
                      </span>
                    </div>
                  </div>

                  {/* Card Details & Actions */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1 group-hover:text-orange-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                        {item.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                      {/* One click send to stylus drawing canvas! */}
                      {item.imageUrl && (
                        <button
                          onClick={() => onOpenCanvasWithReference(item.imageUrl)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 text-[11px] font-semibold border border-orange-500/30 transition-colors cursor-pointer"
                          title="Abrir diretamente na Prancheta de Desenho com S-Pen/Stylus"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>Desenhar com Stylus</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setPreviewItem({
                            title: item.title,
                            url: item.imageUrl,
                            category: item.category as any,
                            size: item.size,
                            isOfficial: item.isOfficial,
                          })
                        }
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Visualizar em Tela Cheia"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {!item.isOfficial && (
                        <button
                          onClick={(e) => handleDeleteUpload(item.id, e)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir arquivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox / Zoom Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="h-14 px-4 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                previewItem.isOfficial ? "bg-orange-500 text-white" : "bg-emerald-600 text-white"
              }`}>
                {previewItem.isOfficial ? "Oficial Tenten" : "Upload"}
              </span>
              <h3 className="text-sm font-semibold text-white truncate max-w-md">
                {previewItem.title}
              </h3>
              {previewItem.size && (
                <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                  ({previewItem.size})
                </span>
              )}
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center gap-2">
              {previewItem.category === "image" && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5 text-zinc-300 min-w-[42px] text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(300, z + 25))}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
                    title="Resetar Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {previewItem.url && (
                <button
                  onClick={() => {
                    const url = previewItem.url;
                    setPreviewItem(null);
                    onOpenCanvasWithReference(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desenhar na Prancheta</span>
                </button>
              )}

              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {previewItem.category === "pdf" ? (
              <iframe
                src={previewItem.url}
                className="w-full h-full max-w-5xl rounded-lg border border-zinc-800 bg-white"
                title="Visualizador de PDF"
              />
            ) : (
              <img
                src={previewItem.url}
                alt={previewItem.title}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-full max-h-full object-contain rounded select-none shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
