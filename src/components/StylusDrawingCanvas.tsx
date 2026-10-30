/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Eraser, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download, 
  Sparkles, 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw,
  Smartphone,
  Columns,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Move,
  Hand,
  Crop,
  SlidersHorizontal,
  RefreshCw,
  MousePointerClick,
  X,
  Scan
} from 'lucide-react';
import { calculateStylusStroke, getQuadraticMidPoint, computeExerciseScore } from '../utils/anatomyLogic.ts';
import { Exercise, ImageCropBox } from '../types/anatomy.ts';
import { CURATED_EXERCISES } from '../data/tentenIndex.ts';
import { InteractiveCropOverlay } from './InteractiveCropOverlay.tsx';
import { detectFiguresFromImage, DetectedFigure } from '../utils/figureDetection.ts';

interface StylusDrawingCanvasProps {
  exercise?: Exercise | null;
  referenceImageUrl?: string | null;
  referencePage?: number;
  isStylusModeActive: boolean;
  onToggleStylusMode: () => void;
  isCleanInterface?: boolean;
  onToggleCleanInterface?: (clean: boolean) => void;
}

type LayerType = 'sketch' | 'ink';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

export const StylusDrawingCanvas: React.FC<StylusDrawingCanvasProps> = ({
  exercise: initialExercise,
  referenceImageUrl,
  referencePage,
  isStylusModeActive,
  onToggleStylusMode,
  isCleanInterface: controlledClean,
  onToggleCleanInterface
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(
    initialExercise || CURATED_EXERCISES[0]
  );

  // Sync when initialExercise prop updates
  useEffect(() => {
    if (initialExercise) {
      setSelectedExercise(initialExercise);
    }
  }, [initialExercise]);

  // Always resolve a high-quality reference plate from the server if direct dataUrl not passed
  const effectiveRefUrl = referenceImageUrl || 
    (selectedExercise.referencePage ? `/api/pdf/page/${selectedExercise.referencePage}` : 
    (referencePage ? `/api/pdf/page/${referencePage}` : '/api/pdf/page/15'));

  // Canvas Mode & Layout
  const [layoutMode, setLayoutMode] = useState<'split' | 'overlay'>('split');
  const [activeLayer, setActiveLayer] = useState<LayerType>('ink');
  const [onionSkinOpacity, setOnionSkinOpacity] = useState<number>(0.35);
  const [showReference, setShowReference] = useState<boolean>(true);

  // Clean Interface State (Modo Limpo: full viewport focus)
  const [internalClean, setInternalClean] = useState<boolean>(false);
  const isCleanInterface = controlledClean !== undefined ? controlledClean : internalClean;
  const setIsCleanInterface = (val: boolean) => {
    setInternalClean(val);
    if (onToggleCleanInterface) onToggleCleanInterface(val);
  };

  // Layer Management & Opacity
  const [sketchOpacity, setSketchOpacity] = useState<number>(0.75);
  const [inkOpacity, setInkOpacity] = useState<number>(1.0);
  const [isSketchVisible, setIsSketchVisible] = useState<boolean>(true);
  const [isInkVisible, setIsInkVisible] = useState<boolean>(true);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);

  // Split View: Zoom, Pan & Illustration Isolate State
  const [splitZoom, setSplitZoom] = useState<number>(1.0);
  const [splitPan, setSplitPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSplitIsolateActive, setIsSplitIsolateActive] = useState<boolean>(false);
  const [isSplitDragging, setIsSplitDragging] = useState<boolean>(false);
  const splitDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Overlay View: Zoom, Pan, Isolate & Multiply Mode
  const [overlayZoom, setOverlayZoom] = useState<number>(1.0);
  const [overlayPan, setOverlayPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isOverlayIsolateActive, setIsOverlayIsolateActive] = useState<boolean>(false);
  const [isOverlayMultiply, setIsOverlayMultiply] = useState<boolean>(true);
  const [isOverlayMoveMode, setIsOverlayMoveMode] = useState<boolean>(false);
  const overlayDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Whole Canvas Pan (Mover o canvas todo com ícone de mão)
  const [isCanvasPanMode, setIsCanvasPanMode] = useState<boolean>(false);
  const [canvasPan, setCanvasPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasPanDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [selectedDetectedImageId, setSelectedDetectedImageId] = useState<string | null>(null);
  const [showCropBox, setShowCropBox] = useState<boolean>(true);
  const [customCrop, setCustomCrop] = useState<ImageCropBox | null>(null);
  const [detectedFigures, setDetectedFigures] = useState<DetectedFigure[]>([]);
  const [isDetectingFigures, setIsDetectingFigures] = useState<boolean>(false);

  const splitImageRef = useRef<HTMLImageElement | null>(null);
  const splitImageContainerRef = useRef<HTMLDivElement | null>(null);

  // Trigger automated or manual figure detection on reference image
  const triggerFigureDetection = useCallback(async () => {
    if (!splitImageRef.current) return;
    setIsDetectingFigures(true);
    try {
      const figures = await detectFiguresFromImage(splitImageRef.current);
      if (figures && figures.length > 0) {
        setDetectedFigures(figures);
        setSelectedDetectedImageId(figures[0].id);
        setCustomCrop(figures[0].cropBox);
        setShowCropBox(true);
      }
    } catch (err) {
      console.warn('Auto figure detection failed, keeping defaults', err);
    } finally {
      setIsDetectingFigures(false);
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    // If exercise has no pre-configured detected images, run detection once on image load
    if (!selectedExercise.detectedImages || selectedExercise.detectedImages.length === 0) {
      triggerFigureDetection();
    }
  }, [selectedExercise.id, triggerFigureDetection]);

  // Reset zoom & pan and selected sub-image when exercise changes
  useEffect(() => {
    setSplitZoom(1.0);
    setSplitPan({ x: 0, y: 0 });
    setOverlayZoom(1.0);
    setOverlayPan({ x: 0, y: 0 });
    setIsSplitIsolateActive(false);
    setIsOverlayIsolateActive(false);
    setIsOverlayMoveMode(false);
    setIsCanvasPanMode(false);
    setCanvasPan({ x: 0, y: 0 });
    setSelectedDetectedImageId(null);
    setCustomCrop(null);
    setDetectedFigures([]);
    setShowCropBox(true);
  }, [selectedExercise.id]);

  // Detected sub-drawings for current exercise (combining pre-configured and dynamic detected)
  const baseDetected = selectedExercise.detectedImages && selectedExercise.detectedImages.length > 0
    ? selectedExercise.detectedImages
    : selectedExercise.illustrationCrop
      ? [{ id: 'default_crop', label: 'Ilustração Principal', cropBox: selectedExercise.illustrationCrop }]
      : [];
  const detectedList = detectedFigures.length > 0 ? detectedFigures : baseDetected;

  const activeDetectedImage = detectedList.find(img => img.id === selectedDetectedImageId) || detectedList[0];

  // Illustration Crop coordinates for current exercise (uses customCrop if resized)
  const activeCrop: ImageCropBox = customCrop || activeDetectedImage?.cropBox || selectedExercise.illustrationCrop || {
    x: 20,
    y: 9,
    width: 60,
    height: 60,
  };

  // True aspect ratio considering the standard scanned page dimension (2131 x 2760)
  const PAGE_ASPECT_RATIO = 2131 / 2760; // ~0.7721
  const cropAspectRatio = Math.max(0.2, (activeCrop.width * PAGE_ASPECT_RATIO) / Math.max(1, activeCrop.height));

  // Brush / Tool State
  const [currentTool, setCurrentTool] = useState<'pen' | 'sketchPencil' | 'hatching' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [brushColor, setBrushColor] = useState<string>('#18181b'); // Dark ink
  const [pressureCurve, setPressureCurve] = useState<'sensitive' | 'linear' | 'firm'>('sensitive');
  const [detectedStylus, setDetectedStylus] = useState<boolean>(false);

  // Dash / Pontilhado Spacing State (0 = Linha Contínua, >0 = espaçamento do pontilhado em pixels)
  const [dashSpacing, setDashSpacing] = useState<number>(0);
  const lastNonZeroDashRef = useRef<number>(8);
  const lastMidPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokeDistanceRef = useRef<number>(0);
  const strokeMovedRef = useRef<boolean>(false);

  // Canvas References
  const sketchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<Point | null>(null);
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const redoHistoryRef = useRef<ImageData[]>([]);

  // Statistics & Timer
  const [strokesCount, setStrokesCount] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // AI Evaluation State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState<boolean>(false);

  // Palette Presets
  const PALETTE = [
    { name: 'Nanquim Tenten', color: '#18181b', type: 'ink' },
    { name: 'Grafite 2B', color: '#3f3f46', type: 'ink' },
    { name: 'Azul Estrutura', color: '#0284c7', type: 'sketch' },
    { name: 'Vermelho Anatômico', color: '#dc2626', type: 'sketch' },
    { name: 'Hachura Cinza', color: '#71717a', type: 'hatching' },
  ];

  // Initialize Canvas Dimensions
  useEffect(() => {
    const resizeCanvases = () => {
      const sketch = sketchCanvasRef.current;
      const ink = inkCanvasRef.current;
      if (!sketch || !ink) return;

      const container = sketch.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set internal pixel buffer
      const width = rect.width * dpr;
      const height = rect.height * dpr;

      // Preserve current contents if already initialized
      const sketchCtx = sketch.getContext('2d');
      const inkCtx = ink.getContext('2d');
      let sketchImg: ImageData | null = null;
      let inkImg: ImageData | null = null;

      if (sketch.width > 0 && sketch.height > 0 && sketchCtx) {
        try { sketchImg = sketchCtx.getImageData(0, 0, sketch.width, sketch.height); } catch {}
      }
      if (ink.width > 0 && ink.height > 0 && inkCtx) {
        try { inkImg = inkCtx.getImageData(0, 0, ink.width, ink.height); } catch {}
      }

      sketch.width = width;
      sketch.height = height;
      ink.width = width;
      ink.height = height;

      sketch.style.width = `${rect.width}px`;
      sketch.style.height = `${rect.height}px`;
      ink.style.width = `${rect.width}px`;
      ink.style.height = `${rect.height}px`;

      if (sketchCtx && sketchImg) {
        sketchCtx.putImageData(sketchImg, 0, 0);
      }
      if (inkCtx && inkImg) {
        inkCtx.putImageData(inkImg, 0, 0);
      }
    };

    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    return () => window.removeEventListener('resize', resizeCanvases);
  }, [layoutMode]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format Time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Switch Tool & Palette
  const handleSelectTool = (tool: 'pen' | 'sketchPencil' | 'hatching' | 'eraser') => {
    setCurrentTool(tool);
    if (tool === 'sketchPencil') {
      setActiveLayer('sketch');
      setBrushColor('#0284c7');
      setBrushSize(2.5);
    } else if (tool === 'pen') {
      setActiveLayer('ink');
      setBrushColor('#18181b');
      setBrushSize(4);
    } else if (tool === 'hatching') {
      setActiveLayer('ink');
      setBrushColor('#71717a');
      setBrushSize(2);
    }
  };

  // Get active canvas context
  const getActiveContext = useCallback(() => {
    const canvas = activeLayer === 'sketch' ? sketchCanvasRef.current : inkCanvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, [activeLayer]);

  // Save history state for undo
  const saveState = useCallback(() => {
    const canvas = inkCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      try {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        strokeHistoryRef.current.push(data);
        if (strokeHistoryRef.current.length > 20) {
          strokeHistoryRef.current.shift();
        }
        redoHistoryRef.current = [];
      } catch (e) {}
    }
  }, []);

  // Undo / Redo
  const handleUndo = () => {
    const canvas = inkCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || strokeHistoryRef.current.length === 0) return;

    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoHistoryRef.current.push(current);

    const prev = strokeHistoryRef.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  };

  const handleRedo = () => {
    const canvas = inkCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || redoHistoryRef.current.length === 0) return;

    const next = redoHistoryRef.current.pop();
    if (next) {
      const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokeHistoryRef.current.push(current);
      ctx.putImageData(next, 0, 0);
    }
  };

  const handleClearCanvas = () => {
    saveState();
    const sketchCtx = sketchCanvasRef.current?.getContext('2d');
    const inkCtx = inkCanvasRef.current?.getContext('2d');
    if (sketchCtx && sketchCanvasRef.current) {
      sketchCtx.clearRect(0, 0, sketchCanvasRef.current.width, sketchCanvasRef.current.height);
    }
    if (inkCtx && inkCanvasRef.current) {
      inkCtx.clearRect(0, 0, inkCanvasRef.current.width, inkCanvasRef.current.height);
    }
    setStrokesCount(0);
  };

  // Pointer Down (Stylus & Touch Handling with S-Pen Pressure Support)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // S-Pen / Stylus Check & Palm Rejection
    const isPen = e.pointerType === 'pen';
    if (isPen) {
      setDetectedStylus(true);
    }

    // Palm Rejection: If user enabled stylus mode and this is a finger touch, ignore it!
    if (isStylusModeActive && !isPen && e.pointerType === 'touch') {
      return;
    }

    // S-Pen Button Eraser: button 32 or 2 = secondary/stylus button pressed
    const isEraserButton = e.buttons === 32 || (e as any).button === 5;
    const effectiveTool = isEraserButton ? 'eraser' : currentTool;

    isDrawingRef.current = true;
    strokeMovedRef.current = false;
    saveState();

    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const pressure = e.pressure > 0 ? e.pressure : 0.5;

    lastPointRef.current = { x, y, pressure };
    lastMidPointRef.current = { x, y };
    strokeDistanceRef.current = 0;

    // In continuous line mode or eraser, render the initial contact point immediately
    if (dashSpacing === 0 || effectiveTool === 'eraser') {
      const ctx = getActiveContext();
      if (!ctx) return;

      const { strokeWidth, strokeOpacity } = calculateStylusStroke(brushSize * dpr, pressure, pressureCurve);

      ctx.save();
      if (effectiveTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * dpr * 3;
        ctx.setLineDash([]);
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = effectiveTool === 'sketchPencil' ? 0.65 : strokeOpacity;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([]);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    setStrokesCount(c => c + 1);
  };

  // Pointer Move (Smooth Bezier Curves + Dynamic Stylus Pressure + Dash Spacing Control)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const isPen = e.pointerType === 'pen';
    if (isStylusModeActive && !isPen && e.pointerType === 'touch') {
      return;
    }

    const isEraserButton = e.buttons === 32;
    const effectiveTool = isEraserButton ? 'eraser' : currentTool;

    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const currentX = (e.clientX - rect.left) * dpr;
    const currentY = (e.clientY - rect.top) * dpr;
    const pressure = e.pressure > 0 ? e.pressure : lastPointRef.current.pressure;

    const currentPoint: Point = { x: currentX, y: currentY, pressure };
    const midPoint = getQuadraticMidPoint(lastPointRef.current, currentPoint);

    const ctx = getActiveContext();
    if (!ctx) return;

    strokeMovedRef.current = true;
    const { strokeWidth, strokeOpacity } = calculateStylusStroke(brushSize * dpr, pressure, pressureCurve);

    ctx.save();
    if (effectiveTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * dpr * 3.5;
      ctx.setLineDash([]);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.globalAlpha = effectiveTool === 'sketchPencil' ? 0.6 : strokeOpacity;
      ctx.lineWidth = strokeWidth;

      if (dashSpacing === 0) {
        // Continuous solid line (no dash)
        ctx.setLineDash([]);
      } else {
        // Dashed stroke: dash length scaled with brush width, gap controlled by user slider
        const dashLength = Math.max(3, strokeWidth * 1.2);
        ctx.setLineDash([dashLength, dashSpacing * dpr]);
        ctx.lineDashOffset = -strokeDistanceRef.current;
      }
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const lastMid = lastMidPointRef.current || lastPointRef.current;
    const segmentLength = Math.hypot(midPoint.x - lastMid.x, midPoint.y - lastMid.y);

    ctx.beginPath();
    ctx.moveTo(lastMid.x, lastMid.y);
    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midPoint.x, midPoint.y);
    ctx.stroke();

    ctx.restore();

    strokeDistanceRef.current += segmentLength;
    lastMidPointRef.current = midPoint;
    lastPointRef.current = currentPoint;
  };

  // Pointer Up / Cancel
  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;

    // If user tapped in dashed mode without dragging, render single contact dot
    if (!strokeMovedRef.current && dashSpacing > 0 && lastPointRef.current) {
      const ctx = getActiveContext();
      if (ctx && currentTool !== 'eraser') {
        const dpr = window.devicePixelRatio || 1;
        const { strokeWidth, strokeOpacity } = calculateStylusStroke(
          brushSize * dpr,
          lastPointRef.current.pressure,
          pressureCurve
        );
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = currentTool === 'sketchPencil' ? 0.65 : strokeOpacity;
        ctx.beginPath();
        ctx.arc(lastPointRef.current.x, lastPointRef.current.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (strokeMovedRef.current && lastPointRef.current && lastMidPointRef.current) {
      // Complete stroke line to the final stylus contact endpoint
      const ctx = getActiveContext();
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const { strokeWidth, strokeOpacity } = calculateStylusStroke(
          brushSize * dpr,
          lastPointRef.current.pressure,
          pressureCurve
        );
        ctx.save();
        if (currentTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = brushSize * dpr * 3.5;
          ctx.setLineDash([]);
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = brushColor;
          ctx.globalAlpha = currentTool === 'sketchPencil' ? 0.6 : strokeOpacity;
          ctx.lineWidth = strokeWidth;

          if (dashSpacing === 0) {
            ctx.setLineDash([]);
          } else {
            const dashLength = Math.max(3, strokeWidth * 1.2);
            ctx.setLineDash([dashLength, dashSpacing * dpr]);
            ctx.lineDashOffset = -strokeDistanceRef.current;
          }
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastMidPointRef.current.x, lastMidPointRef.current.y);
        ctx.lineTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
    lastMidPointRef.current = null;
    strokeDistanceRef.current = 0;
    strokeMovedRef.current = false;
  };

  // Merge Canvases and Export / Submit for AI Evaluation
  const getMergedDrawingDataUrl = (): string | null => {
    const sketch = sketchCanvasRef.current;
    const ink = inkCanvasRef.current;
    if (!sketch || !ink) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = ink.width;
    exportCanvas.height = ink.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw Sketch Layer (if visible)
    if (isSketchVisible && sketchOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = sketchOpacity;
      ctx.drawImage(sketch, 0, 0);
      ctx.restore();
    }

    // Draw Ink Layer (if visible)
    if (isInkVisible && inkOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = inkOpacity;
      ctx.drawImage(ink, 0, 0);
      ctx.restore();
    }

    return exportCanvas.toDataURL('image/png');
  };

  const handleDownloadDrawing = () => {
    const dataUrl = getMergedDrawingDataUrl();
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `exercicio-tenten-${selectedExercise.id}-${Date.now()}.png`;
    a.click();
  };

  // Submit Drawing for Gemini AI Critique
  const handleSubmitForAiReview = async () => {
    const dataUrl = getMergedDrawingDataUrl();
    if (!dataUrl) return;

    setIsEvaluating(true);
    setShowEvaluationModal(true);

    try {
      const response = await fetch('/api/gemini/evaluate-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingBase64: dataUrl,
          exerciseTitle: selectedExercise.title,
          styleFocus: selectedExercise.styleFocus,
          referenceDescription: `Estudo da prancha ${selectedExercise.referencePage || 15} no estilo de anatomia do Tenten.`
        })
      });

      const data = await response.json();
      setEvaluationResult(data);
    } catch (err) {
      console.error('Error submitting drawing to AI:', err);
      // Fallback evaluation
      const local = computeExerciseScore({
        strokesCount,
        timeSpentSeconds: timerSeconds,
        targetDurationSeconds: selectedExercise.durationMinutes * 60,
        hasStructureLayer: true,
        hasInkLayer: true
      });
      setEvaluationResult({
        rating: local.score,
        anatomyAccuracy: local.score - 5,
        styleFidelity: local.score + 5,
        overallComment: 'Belo progresso anatômico! As camadas e o ritmo gestual demonstram compreensão dos volumes tridimensionais.',
        strengths: local.feedbackNotes,
        improvements: ['Reforce as hachuras de curvatura transversal.', 'Trabalhe o contraste das oclusões de sombra.'],
        drillsNext: 'Pratique a mesma pose variando o ângulo de visão em 45 graus.'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Split View Zoom & Pan Handlers
  const handleSplitZoomIn = () => {
    setSplitZoom(z => Math.min(4.0, Number((z + 0.25).toFixed(2))));
  };

  const handleSplitZoomOut = () => {
    setSplitZoom(z => Math.max(0.6, Number((z - 0.25).toFixed(2))));
  };

  const handleSplitReset = () => {
    setSplitZoom(1.0);
    setSplitPan({ x: 0, y: 0 });
  };

  const handleSplitPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('.group')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsSplitDragging(true);
    splitDragStartRef.current = {
      x: e.clientX - splitPan.x,
      y: e.clientY - splitPan.y,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleSplitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSplitDragging) return;
    setSplitPan({
      x: e.clientX - splitDragStartRef.current.x,
      y: e.clientY - splitDragStartRef.current.y,
    });
  };

  const handleSplitPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSplitDragging) {
      setIsSplitDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleSplitWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setSplitZoom(z => Math.max(0.6, Math.min(4.0, Number((z + delta).toFixed(2)))));
  };

  const handleSplitDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (splitZoom > 1.1) {
      handleSplitReset();
    } else {
      setSplitZoom(2.0);
    }
  };

  // Overlay View Zoom & Pan Handlers
  const handleOverlayZoomIn = () => {
    setOverlayZoom(z => Math.min(3.5, Number((z + 0.25).toFixed(2))));
  };

  const handleOverlayZoomOut = () => {
    setOverlayZoom(z => Math.max(0.6, Number((z - 0.25).toFixed(2))));
  };

  const handleOverlayReset = () => {
    setOverlayZoom(1.0);
    setOverlayPan({ x: 0, y: 0 });
  };

  const handleOverlayMoveDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If the click is on a button or control, do not start move drag or capture pointer
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    overlayDragStartRef.current = {
      x: e.clientX - overlayPan.x,
      y: e.clientY - overlayPan.y,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleOverlayMoveMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      setOverlayPan({
        x: e.clientX - overlayDragStartRef.current.x,
        y: e.clientY - overlayDragStartRef.current.y,
      });
    }
  };

  const handleOverlayMoveUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Whole Canvas Pan Event Handlers (Modo Mão: arrasta desenho + referência juntos)
  const handleCanvasPanDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If the click is on a button or control, ignore pan
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    canvasPanDragStartRef.current = {
      x: e.clientX - canvasPan.x,
      y: e.clientY - canvasPan.y,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleCanvasPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      setCanvasPan({
        x: e.clientX - canvasPanDragStartRef.current.x,
        y: e.clientY - canvasPanDragStartRef.current.y,
      });
    }
  };

  const handleCanvasPanUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className={`flex flex-col ${isCleanInterface ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[calc(100vh-7rem)]'} bg-zinc-950 text-zinc-100 overflow-hidden relative`}>
      
      {/* Clean Interface Restore Button (placed in corner where it NEVER collides with overlay or split controls) */}
      {isCleanInterface && (
        <div 
          className={`absolute top-3 ${
            layoutMode === 'overlay' && showReference 
              ? 'left-3' 
              : 'right-3'
          } z-40 pointer-events-auto select-none`}
        >
          <button
            type="button"
            onClick={() => setIsCleanInterface(false)}
            className="bg-zinc-900/95 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/90 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 group ring-1 ring-white/10"
            title="Voltar para a interface completa (exibir menus, exercícios e opções)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span>Voltar Interface</span>
          </button>
        </div>
      )}

      {/* Top Toolbar (Hidden in Clean Interface Mode) */}
      {!isCleanInterface && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
          
          {/* Exercise Selector & Steps */}
          <div className="flex items-center gap-2">
            <select
              value={selectedExercise.id}
              onChange={(e) => {
                const ex = CURATED_EXERCISES.find(item => item.id === e.target.value);
                if (ex) {
                  setSelectedExercise(ex);
                  setCurrentStepIndex(0);
                }
              }}
              className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-orange-500 font-semibold"
            >
              {CURATED_EXERCISES.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.durationMinutes} min)
                </option>
              ))}
            </select>

            {/* S-Pen / Stylus Status Badge */}
            <div 
              onClick={onToggleStylusMode}
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                isStylusModeActive 
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title="Clique para alternar Rejeição de Palma para S-Pen / Stylus"
            >
              <Smartphone className="w-3 h-3 text-orange-400" />
              <span>{isStylusModeActive ? 'S-Pen / Stylus (Rejeição Palma ON)' : 'Toque / Mouse'}</span>
            </div>
          </div>

          {/* Timer Control */}
          <div className="flex items-center gap-2 bg-zinc-800/90 px-2.5 py-1 rounded-lg border border-zinc-700">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-xs font-bold text-zinc-200">
              {formatTime(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 text-zinc-400 hover:text-zinc-100 rounded"
              title={isTimerRunning ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-100 rounded"
              title="Zerar Cronômetro"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Layout & Actions */}
          <div className="flex items-center gap-2">
            {/* Split vs Overlay Mode */}
            <div className="flex items-center bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
              <button
                onClick={() => setLayoutMode('split')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  layoutMode === 'split' ? 'bg-orange-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Lado a Lado: Referência e Desenho"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lado a Lado</span>
              </button>
              <button
                onClick={() => setLayoutMode('overlay')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  layoutMode === 'overlay' ? 'bg-orange-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Sobreposição / Pele de Cebola (Desenhar por Cima)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sobreposição</span>
              </button>
            </div>

            {/* Clean Interface Trigger Button */}
            <button
              onClick={() => setIsCleanInterface(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
              title="Interface Limpa: Oculta menus para foco total no desenho"
            >
              <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden md:inline">Interface Limpa</span>
            </button>

            {/* AI Review Button */}
            <button
              onClick={handleSubmitForAiReview}
              disabled={strokesCount === 0 || isEvaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {isEvaluating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              )}
              <span>Avaliar com IA</span>
            </button>
          </div>

        </div>
      )}

      {/* Step Guide Banner (Hidden in Clean Interface Mode) */}
      {!isCleanInterface && selectedExercise.steps && selectedExercise.steps.length > 0 && (
        <div className="bg-zinc-900/60 border-b border-zinc-800 px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs overflow-hidden">
            <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px] shrink-0">
              Passo {currentStepIndex + 1}/{selectedExercise.steps.length}
            </span>
            <span className="font-semibold text-zinc-200 truncate">
              {selectedExercise.steps[currentStepIndex].title}:
            </span>
            <span className="text-zinc-400 hidden sm:inline truncate">
              {selectedExercise.steps[currentStepIndex].instruction}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
              disabled={currentStepIndex === 0}
              className="px-2 py-0.5 rounded bg-zinc-800 text-xs text-zinc-400 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentStepIndex(i => Math.min(selectedExercise.steps.length - 1, i + 1))}
              disabled={currentStepIndex >= selectedExercise.steps.length - 1}
              className="px-2 py-0.5 rounded bg-orange-600 text-xs text-white disabled:opacity-40"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Column: Reference View (in Split Mode) */}
        {layoutMode === 'split' && showReference && (
          <div className="w-full md:w-1/2 lg:w-5/12 bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden select-none">
            
            {/* Split Reference Header Bar with Zoom & Isolate Controls */}
            <div className="p-2 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-1 text-xs text-zinc-400 bg-zinc-900/90">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-zinc-200 truncate text-[11px] sm:text-xs">
                  Prancha #{selectedExercise.referencePage || 15}
                </span>
                <span className="text-[10px] text-orange-400 hidden xl:inline truncate max-w-[140px]">
                  • {selectedExercise.styleFocus}
                </span>
              </div>

              {/* Action Buttons: Isolate Illustration & Zoom Controls */}
              <div className="flex items-center gap-1 shrink-0">
                
                {/* Isolate Illustration Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isSplitIsolateActive;
                    setIsSplitIsolateActive(next);
                    if (next) {
                      setSplitZoom(1.2);
                      setSplitPan({ x: 0, y: 0 });
                    } else {
                      setSplitZoom(1.0);
                      setSplitPan({ x: 0, y: 0 });
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer ${
                    isSplitIsolateActive
                      ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700 hover:border-zinc-600'
                  }`}
                  title={isSplitIsolateActive ? "Voltar para prancha completa" : "Isolar apenas a ilustração (remover texto e margens)"}
                >
                  <Crop className="w-3 h-3 text-orange-300" />
                  <span>{isSplitIsolateActive ? 'Prancha Completa' : 'Isolar Desenho 🎨'}</span>
                </button>

                {/* Adjust / Show Crop Box Toggle */}
                {!isSplitIsolateActive && (
                  <button
                    type="button"
                    onClick={() => setShowCropBox(!showCropBox)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer ${
                      showCropBox
                        ? 'bg-orange-950/70 text-orange-300 border-orange-500 ring-1 ring-orange-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                    }`}
                    title={showCropBox ? "Ocultar caixa de recorte para ver prancha limpa" : "Exibir caixa de recorte para redimensionar ou reposicionar"}
                  >
                    <Scan className="w-3 h-3 text-orange-400" />
                    <span>{showCropBox ? 'Ocultar Caixa ✕' : 'Ajustar Área ◱'}</span>
                  </button>
                )}

                {/* Auto Figure Detection Button */}
                <button
                  type="button"
                  onClick={triggerFigureDetection}
                  disabled={isDetectingFigures}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Escanear e detectar automaticamente as ilustrações e figuras desta prancha"
                >
                  {isDetectingFigures ? (
                    <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  )}
                  <span className="hidden sm:inline">{isDetectingFigures ? 'Detectando...' : 'Auto-Detectar'}</span>
                </button>

                <div className="h-4 w-px bg-zinc-700 mx-0.5" />

                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={handleSplitZoomOut}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                  title="Diminuir Zoom (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Current Zoom Level Badge */}
                <span 
                  onClick={handleSplitReset}
                  className="cursor-pointer font-mono text-[10px] font-bold text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 min-w-[38px] text-center hover:text-orange-400"
                  title="Clique para Redefinir Zoom para 100%"
                >
                  {Math.round(splitZoom * 100)}%
                </span>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={handleSplitZoomIn}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                  title="Aumentar Zoom (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {/* Fit / Reset */}
                <button
                  type="button"
                  onClick={handleSplitReset}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                  title="Ajustar à Tela (Reset)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

              </div>
            </div>

            {/* Sub-drawing / Detected Figures Bar */}
            {detectedList.length > 0 && (
              <div className="px-2.5 py-1.5 bg-zinc-900/95 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 shrink-0 flex items-center gap-1">
                  <span>Figuras ({detectedList.length}):</span>
                </span>
                
                {/* Full plate button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSplitIsolateActive(false);
                    setShowCropBox(false);
                    setSplitZoom(1.0);
                    setSplitPan({ x: 0, y: 0 });
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    !isSplitIsolateActive && !showCropBox
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Prancha Completa
                </button>

                {/* Detected figures chips */}
                {detectedList.map((det) => {
                  const isSelected = activeDetectedImage?.id === det.id;
                  return (
                    <button
                      key={det.id}
                      type="button"
                      onClick={() => {
                        setSelectedDetectedImageId(det.id);
                        setCustomCrop(det.cropBox);
                        setShowCropBox(true);
                        if (isSplitIsolateActive) {
                          setSplitZoom(1.2);
                          setSplitPan({ x: 0, y: 0 });
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected && (isSplitIsolateActive || showCropBox)
                          ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      }`}
                      title={`Selecionar e focar nesta figura: ${det.label}`}
                    >
                      <Crop className="w-2.5 h-2.5 text-orange-300" />
                      <span>{det.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Split Reference Interactive Canvas Container */}
            <div 
              className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center p-2 touch-none select-none"
              style={{
                cursor: isSplitDragging ? 'grabbing' : splitZoom > 1.05 || isSplitIsolateActive ? 'grab' : 'crosshair',
              }}
              onPointerDown={handleSplitPointerDown}
              onPointerMove={handleSplitPointerMove}
              onPointerUp={handleSplitPointerUp}
              onPointerCancel={handleSplitPointerUp}
              onWheel={handleSplitWheel}
              onDoubleClick={handleSplitDoubleClick}
            >
              
              {/* Notification & Close Pill when in Isolate Mode */}
              {isSplitIsolateActive && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-orange-950/95 border border-orange-500/80 text-orange-200 text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-[90%]">
                  <Crop className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">{activeDetectedImage?.label || 'Ilustração Isolada'}</span>
                  <div className="h-3 w-px bg-orange-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSplitIsolateActive(false);
                      setShowCropBox(false);
                      setSplitZoom(1.0);
                      setSplitPan({ x: 0, y: 0 });
                    }}
                    className="flex items-center gap-1 text-[10px] text-white bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded-full cursor-pointer transition-colors shadow-sm"
                    title="Fechar modo isolado e voltar para prancha inteira"
                  >
                    <X className="w-3 h-3 stroke-[3]" />
                    <span>Prancha Inteira</span>
                  </button>
                </div>
              )}

              {/* Viewport for the image */}
              <div
                className="relative flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(${splitZoom}) translate(${splitPan.x}px, ${splitPan.y}px)`,
                  transformOrigin: 'center center',
                }}
              >
                {isSplitIsolateActive ? (
                  /* Isolated Drawing (Cropped and Maximized with Accurate Page Ratio) */
                  <div
                    className="relative overflow-hidden rounded-xl shadow-2xl border border-zinc-700 bg-white"
                    style={{
                      width: cropAspectRatio >= 1 ? '92%' : `${Math.min(92, Math.round(92 * cropAspectRatio))}%`,
                      aspectRatio: `${cropAspectRatio}`,
                      maxHeight: '92%',
                    }}
                  >
                    <img
                      src={effectiveRefUrl}
                      alt={activeDetectedImage?.label || "Ilustração isolada do Tenten"}
                      className="absolute max-w-none pointer-events-none select-none"
                      style={{
                        width: `${100 * (100 / activeCrop.width)}%`,
                        height: `${100 * (100 / activeCrop.height)}%`,
                        left: `-${(activeCrop.x / activeCrop.width) * 100}%`,
                        top: `-${(activeCrop.y / activeCrop.height) * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  /* Full Plate View with Resizable Interactive Crop Box and X close button */
                  <div 
                    ref={splitImageContainerRef}
                    className="relative inline-flex items-center justify-center max-w-full max-h-full"
                  >
                    <img
                      ref={splitImageRef}
                      src={effectiveRefUrl}
                      onLoad={handleImageLoad}
                      crossOrigin="anonymous"
                      alt={`Prancha #${selectedExercise.referencePage || referencePage || 15} do Tenten`}
                      className="max-h-[calc(100vh-14rem)] max-w-full object-contain rounded-lg shadow-2xl border border-zinc-800 bg-white block"
                      draggable={false}
                    />

                    {/* Interactive Resizable Crop Overlay with Corner Close X Button */}
                    <InteractiveCropOverlay
                      cropBox={showCropBox ? activeCrop : null}
                      onChangeCropBox={(newBox) => setCustomCrop(newBox)}
                      onClose={() => setShowCropBox(false)}
                      onConfirmIsolate={() => {
                        setIsSplitIsolateActive(true);
                        setSplitZoom(1.2);
                        setSplitPan({ x: 0, y: 0 });
                      }}
                      containerRef={splitImageContainerRef}
                      label={activeDetectedImage?.label || 'Recorte Selecionado'}
                      isIsolatedView={isSplitIsolateActive}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Quick Zoom Presets Bar at bottom of split view */}
            <div className="p-1.5 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-400 px-3">
              <span className="flex items-center gap-1">
                <MousePointerClick className="w-3 h-3 text-orange-400" />
                <span>Clique na imagem p/ isolar ou arraste p/ mover</span>
              </span>
              <div className="flex items-center gap-1">
                {[1.0, 1.5, 2.0, 3.0].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setSplitZoom(level);
                      setSplitPan({ x: 0, y: 0 });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                      splitZoom === level
                        ? 'bg-orange-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {Math.round(level * 100)}%
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Right / Main Drawing Surface */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative overflow-hidden">
          
          {/* Overlay Floating Control Dock (Visible when in Overlay Mode) */}
          {layoutMode === 'overlay' && showReference && (
            <div className="absolute top-3 right-3 z-30 bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-2xl p-2 px-3 flex flex-wrap items-center gap-2 max-w-[calc(100vw-12rem)] backdrop-blur-md">
              
              {/* Opacity / Onion Skin Slider */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 border-r border-zinc-700/80 pr-2">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-medium text-zinc-400 hidden sm:inline">Pele de Cebola:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={onionSkinOpacity}
                  onChange={(e) => setOnionSkinOpacity(parseFloat(e.target.value))}
                  className="w-16 accent-orange-500 h-1 bg-zinc-700 rounded-lg cursor-pointer"
                  title="Ajustar opacidade da imagem sobreposta"
                />
                <span className="font-mono text-[10px] text-zinc-300 min-w-[28px]">
                  {Math.round(onionSkinOpacity * 100)}%
                </span>
              </div>

              {/* Isolate Drawing Mode in Overlay */}
              <button
                type="button"
                onClick={() => {
                  setIsOverlayIsolateActive(!isOverlayIsolateActive);
                  if (!isOverlayIsolateActive) {
                    setOverlayZoom(1.2);
                    setOverlayPan({ x: 0, y: 0 });
                  } else {
                    setOverlayZoom(1.0);
                    setOverlayPan({ x: 0, y: 0 });
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isOverlayIsolateActive
                    ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                }`}
                title={isOverlayIsolateActive ? "Exibir prancha completa no fundo" : "Isolar apenas o desenho sobreposto (sem textos)"}
              >
                <Crop className="w-3 h-3 text-orange-300" />
                <span>{isOverlayIsolateActive ? 'Prancha Inteira' : 'Apenas Desenho 🎨'}</span>
              </button>

              {/* Multi-drawing Selector in Overlay Mode (if isolated and multiple drawings exist) */}
              {isOverlayIsolateActive && detectedList.length > 1 && (
                <select
                  value={activeDetectedImage?.id || ''}
                  onChange={(e) => {
                    setSelectedDetectedImageId(e.target.value);
                    const found = detectedList.find(d => d.id === e.target.value);
                    if (found) {
                      setCustomCrop(found.cropBox);
                    }
                    setOverlayZoom(1.2);
                    setOverlayPan({ x: 0, y: 0 });
                  }}
                  className="bg-zinc-800 border border-zinc-700 text-orange-300 text-xs rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 max-w-[150px] truncate"
                  title="Selecionar qual desenho isolar"
                >
                  {detectedList.map(det => (
                    <option key={det.id} value={det.id}>
                      {det.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Multiply / Transparent White Paper Toggle */}
              <button
                type="button"
                onClick={() => setIsOverlayMultiply(!isOverlayMultiply)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isOverlayMultiply
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                }`}
                title="Modo Nanquim Puro: Remove o fundo branco do papel tornando-o 100% transparente para decalcar"
              >
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span className="hidden sm:inline">Nanquim Puro</span>
              </button>

              {/* Overlay Zoom Controls */}
              <div className="flex items-center gap-1 border-l border-zinc-700/80 pl-2">
                <button
                  type="button"
                  onClick={handleOverlayZoomOut}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 cursor-pointer"
                  title="Diminuir Zoom da Referência (-)"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span 
                  onClick={handleOverlayReset}
                  className="cursor-pointer font-mono text-[10px] text-zinc-300 px-1 hover:text-orange-400"
                  title="Clique para Redefinir"
                >
                  {Math.round(overlayZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleOverlayZoomIn}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 cursor-pointer"
                  title="Aumentar Zoom da Referência (+)"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleOverlayReset}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 cursor-pointer"
                  title="Redefinir Posição e Zoom da Referência"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

              {/* Move / Reposition Reference Overlay (Arrow icon only to save space) */}
              <button
                type="button"
                onClick={() => {
                  const next = !isOverlayMoveMode;
                  setIsOverlayMoveMode(next);
                  if (next) setIsCanvasPanMode(false);
                }}
                className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isOverlayMoveMode
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                }`}
                title={isOverlayMoveMode ? "Fixar referência e voltar ao desenho" : "Mover / Reposicionar apenas a Imagem de Referência (setas)"}
              >
                <Move className="w-3.5 h-3.5" />
              </button>

              {/* Move Entire Canvas (Hand icon) */}
              <button
                type="button"
                onClick={() => {
                  const next = !isCanvasPanMode;
                  setIsCanvasPanMode(next);
                  if (next) setIsOverlayMoveMode(false);
                }}
                className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isCanvasPanMode
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                }`}
                title={isCanvasPanMode ? "Fixar canvas e voltar ao desenho" : "Mover Canvas Todo (Pan com a mão)"}
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

            </div>
          )}

          {/* Drawing Canvas Container */}
          <div className="flex-1 relative bg-white overflow-hidden touch-none cursor-crosshair">
            
            {/* Transformed Surface Container for Whole Canvas Pan */}
            <div 
              className="absolute inset-0"
              style={{
                transform: `translate(${canvasPan.x}px, ${canvasPan.y}px)`,
                transition: isCanvasPanMode ? 'none' : 'transform 0.05s ease-out'
              }}
            >
              {/* Reference Underlay in Overlay / Onion Skin Mode */}
              {layoutMode === 'overlay' && effectiveRefUrl && showReference && (
                <div 
                  className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center"
                  style={{ 
                    opacity: onionSkinOpacity,
                    mixBlendMode: isOverlayMultiply ? 'multiply' : 'normal',
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${overlayZoom}) translate(${overlayPan.x}px, ${overlayPan.y}px)`,
                      transformOrigin: 'center center',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: isOverlayMoveMode ? 'none' : 'transform 0.1s ease-out',
                    }}
                  >
                    {isOverlayIsolateActive ? (
                      /* Isolated Drawing over the canvas with Accurate Page Ratio */
                      <div
                        className="relative overflow-hidden"
                        style={{
                          width: cropAspectRatio >= 1 ? '88%' : `${Math.min(88, Math.round(88 * cropAspectRatio))}%`,
                          aspectRatio: `${cropAspectRatio}`,
                          maxHeight: '88%',
                        }}
                      >
                        <img
                          src={effectiveRefUrl}
                          alt="Desenho isolado sobreposto"
                          className="absolute max-w-none pointer-events-none select-none"
                          style={{
                            width: `${100 * (100 / activeCrop.width)}%`,
                            height: `${100 * (100 / activeCrop.height)}%`,
                            left: `-${(activeCrop.x / activeCrop.width) * 100}%`,
                            top: `-${(activeCrop.y / activeCrop.height) * 100}%`,
                          }}
                        />
                      </div>
                    ) : (
                      /* Full plate underlay */
                      <img
                        src={effectiveRefUrl}
                        alt="Underlay de Referência"
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Structure / Sketch Layer (Light blue / red) with Opacity & Visibility */}
              <canvas
                ref={sketchCanvasRef}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  opacity: sketchOpacity,
                  display: isSketchVisible ? 'block' : 'none',
                }}
              />

              {/* Ink / Final Line Layer + Pointer Events Receiver with Opacity & Visibility */}
              <canvas
                ref={inkCanvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute inset-0 z-20 touch-none"
                style={{
                  touchAction: 'none',
                  opacity: inkOpacity,
                  display: isInkVisible ? 'block' : 'none',
                }}
              />
            </div>

            {/* Interactive Move Overlay Backdrop (Reference only) */}
            {isOverlayMoveMode && (
              <>
                <div
                  onPointerDown={handleOverlayMoveDown}
                  onPointerMove={handleOverlayMoveMove}
                  onPointerUp={handleOverlayMoveUp}
                  className="absolute inset-0 z-40 bg-black/20 cursor-move touch-none"
                  title="Arraste para mover a imagem de referência"
                />

                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none">
                  <div className="bg-zinc-900/95 border-2 border-orange-500 text-orange-200 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-3 backdrop-blur-md">
                    <Move className="w-4 h-4 animate-pulse text-orange-400 shrink-0" />
                    <span>Arraste na tela para alinhar a referência</span>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsOverlayMoveMode(false);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOverlayMoveMode(false);
                      }}
                      className="ml-2 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                    >
                      Concluir e Desenhar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Interactive Whole Canvas Pan Backdrop (when Hand tool active) */}
            {isCanvasPanMode && (
              <>
                <div
                  onPointerDown={handleCanvasPanDown}
                  onPointerMove={handleCanvasPanMove}
                  onPointerUp={handleCanvasPanUp}
                  className="absolute inset-0 z-40 bg-blue-950/20 cursor-grab active:cursor-grabbing touch-none"
                  title="Arraste para mover o canvas todo"
                />

                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none">
                  <div className="bg-zinc-900/95 border-2 border-blue-500 text-blue-200 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-3 backdrop-blur-md">
                    <Hand className="w-4 h-4 animate-pulse text-blue-400 shrink-0" />
                    <span>Modo Mão: Arraste para mover o canvas todo</span>
                    <button
                      type="button"
                      onPointerDown={(e) => { e.stopPropagation(); setIsCanvasPanMode(false); }}
                      onClick={(e) => { e.stopPropagation(); setIsCanvasPanMode(false); }}
                      className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                    >
                      Concluir e Desenhar
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => { e.stopPropagation(); setCanvasPan({ x: 0, y: 0 }); }}
                      onClick={(e) => { e.stopPropagation(); setCanvasPan({ x: 0, y: 0 }); }}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer shrink-0"
                      title="Centralizar Canvas"
                    >
                      Centralizar
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Floating Canvas Controls Dock */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1 sm:gap-1.5 max-w-[calc(100%-1rem)] overflow-x-auto no-scrollbar backdrop-blur-md">
            
            {/* Layer Toggles */}
            <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
              <button
                onClick={() => {
                  setActiveLayer('sketch');
                  setCurrentTool('sketchPencil');
                  setBrushColor('#0284c7');
                }}
                className={`px-1.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  activeLayer === 'sketch'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Camada de Esboço Estrutural (Lápis Azul)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="hidden sm:inline">Estrutura</span>
                <span className="sm:hidden">Esb</span>
              </button>

              <button
                onClick={() => {
                  setActiveLayer('ink');
                  setCurrentTool('pen');
                  setBrushColor('#18181b');
                }}
                className={`px-1.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  activeLayer === 'ink'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Camada de Tinta Final (Nanquim Tenten)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                <span className="hidden sm:inline">Tinta Final</span>
                <span className="sm:hidden">Tinta</span>
              </button>
            </div>

            {/* Layer & Opacity Control Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className={`px-1.5 py-1 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer ${
                  showLayerPanel 
                    ? 'bg-zinc-800 border-orange-500 text-orange-400 shadow-md' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
                title="Gerenciar Camadas e Opacidade"
              >
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden md:inline">Camadas</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {Math.round((activeLayer === 'sketch' ? sketchOpacity : inkOpacity) * 100)}%
                </span>
              </button>

              {/* Floating Layer Manager Popover */}
              {showLayerPanel && (
                <div 
                  className="absolute bottom-full mb-2 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 bg-zinc-950/95 border border-zinc-700/90 rounded-2xl shadow-2xl p-3 backdrop-blur-xl space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold text-zinc-100">Controle de Camadas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLayerPanel(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Ink / Tinta Final Layer Card */}
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeLayer === 'ink' ? 'bg-orange-950/20 border-orange-500/50' : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLayer('ink');
                          setCurrentTool('pen');
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-orange-400 text-left cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-100 border border-zinc-400" />
                        <span>Tinta Final (Nanquim)</span>
                        {activeLayer === 'ink' && (
                          <span className="text-[9px] bg-orange-600/30 text-orange-300 px-1 rounded font-normal">Ativa</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInkVisible(!isInkVisible)}
                        className={`p-1 rounded hover:bg-zinc-800 cursor-pointer ${isInkVisible ? 'text-zinc-300' : 'text-zinc-500'}`}
                        title={isInkVisible ? "Ocultar camada" : "Mostrar camada"}
                      >
                        {isInkVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">Opacidade:</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={inkOpacity}
                        onChange={(e) => setInkOpacity(parseFloat(e.target.value))}
                        className="flex-1 accent-orange-500 cursor-pointer h-1"
                      />
                      <span className="text-[10px] font-mono text-zinc-300 w-8 text-right">
                        {Math.round(inkOpacity * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Sketch / Estrutura Layer Card */}
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeLayer === 'sketch' ? 'bg-blue-950/25 border-blue-500/50' : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLayer('sketch');
                          setCurrentTool('sketchPencil');
                          setBrushColor('#0284c7');
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-blue-400 text-left cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-300" />
                        <span>Estrutura (Lápis Azul)</span>
                        {activeLayer === 'sketch' && (
                          <span className="text-[9px] bg-blue-600/30 text-blue-300 px-1 rounded font-normal">Ativa</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSketchVisible(!isSketchVisible)}
                        className={`p-1 rounded hover:bg-zinc-800 cursor-pointer ${isSketchVisible ? 'text-zinc-300' : 'text-zinc-500'}`}
                        title={isSketchVisible ? "Ocultar camada" : "Mostrar camada"}
                      >
                        {isSketchVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">Opacidade:</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={sketchOpacity}
                        onChange={(e) => setSketchOpacity(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-500 cursor-pointer h-1"
                      />
                      <span className="text-[10px] font-mono text-zinc-300 w-8 text-right">
                        {Math.round(sketchOpacity * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-400 italic text-center pt-1 border-t border-zinc-800/80">
                    Ajuste a transparência da estrutura azul enquanto aplica a tinta final
                  </div>
                </div>
              )}
            </div>

            {/* Quick Active Layer Opacity slider on dock */}
            <div className="hidden lg:flex items-center gap-1 px-1 border-l border-zinc-700">
              <span className="text-[10px] text-zinc-400">Opac. {activeLayer === 'sketch' ? 'Esb' : 'Tinta'}:</span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={activeLayer === 'sketch' ? sketchOpacity : inkOpacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (activeLayer === 'sketch') {
                    setSketchOpacity(val);
                  } else {
                    setInkOpacity(val);
                  }
                }}
                className="w-12 sm:w-16 accent-orange-500 cursor-pointer h-1"
                title={`Opacidade da camada ${activeLayer === 'sketch' ? 'Estrutura' : 'Tinta Final'}: ${Math.round((activeLayer === 'sketch' ? sketchOpacity : inkOpacity) * 100)}%`}
              />
              <span className="text-[10px] font-mono text-zinc-400 w-6 text-right">
                {Math.round((activeLayer === 'sketch' ? sketchOpacity : inkOpacity) * 100)}%
              </span>
            </div>

            <div className="h-5 w-px bg-zinc-700" />

            {/* Primary Tools */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleSelectTool('pen')}
                className={`p-1.5 rounded-lg transition-all ${
                  currentTool === 'pen' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title="Caneta Tinta Tenten (Sensível à Pressão)"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleSelectTool('hatching')}
                className={`p-1.5 rounded-lg transition-all ${
                  currentTool === 'hatching' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title="Pincel de Hachuras de Curvatura"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleSelectTool('eraser')}
                className={`p-1.5 rounded-lg transition-all ${
                  currentTool === 'eraser' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title="Borracha (ou use botão da S-Pen)"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Palette Colors */}
            <div className="hidden sm:flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
              {PALETTE.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setBrushColor(item.color);
                    if (currentTool === 'eraser') setCurrentTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full transition-transform border ${
                    brushColor === item.color ? 'scale-110 ring-2 ring-orange-500 border-white' : 'border-zinc-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: item.color }}
                  title={item.name}
                />
              ))}
            </div>

            {/* Brush Size Slider */}
            <div className="flex items-center gap-1 px-1 border-l border-zinc-700">
              <span className="text-[10px] text-zinc-400 hidden lg:inline">Tam:</span>
              <input
                type="range"
                min={1}
                max={25}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-12 sm:w-14 accent-orange-500 cursor-pointer h-1"
                title={`Tamanho: ${brushSize}px`}
              />
              <span className="text-[10px] font-mono text-zinc-400 w-3 text-center">{brushSize}</span>
            </div>

            {/* Dash / Pontilhado Spacing Slider (do pontilhado à linha contínua) */}
            <div className="flex items-center gap-1 px-1 border-l border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  if (dashSpacing === 0) {
                    setDashSpacing(lastNonZeroDashRef.current || 8);
                  } else {
                    lastNonZeroDashRef.current = dashSpacing;
                    setDashSpacing(0);
                  }
                }}
                className={`p-1 rounded-md border transition-all flex items-center justify-center cursor-pointer ${
                  dashSpacing > 0 
                    ? 'bg-orange-950/80 border-orange-500/60 text-orange-400 ring-1 ring-orange-500/30' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                }`}
                title={dashSpacing === 0 ? "Clique para ativar Pontilhado com espaçamento" : "Clique para voltar para Linha Contínua"}
              >
                {dashSpacing === 0 ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="3 3">
                    <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 hidden xl:inline">Traço:</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={dashSpacing}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDashSpacing(val);
                    if (val > 0) lastNonZeroDashRef.current = val;
                  }}
                  className="w-12 sm:w-16 accent-orange-500 cursor-pointer h-1"
                  title={dashSpacing === 0 ? "0 = Linha Contínua (sem interrupções)" : `Espaçamento do pontilhado: ${dashSpacing}px`}
                />
                <span 
                  onClick={() => {
                    if (dashSpacing === 0) {
                      setDashSpacing(lastNonZeroDashRef.current || 8);
                    } else {
                      lastNonZeroDashRef.current = dashSpacing;
                      setDashSpacing(0);
                    }
                  }}
                  className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded cursor-pointer min-w-[42px] text-center transition-colors ${
                    dashSpacing === 0 
                      ? 'text-zinc-300 bg-zinc-800 border border-zinc-700 hover:border-zinc-500' 
                      : 'text-orange-400 bg-orange-950/60 border border-orange-500/40 hover:border-orange-400'
                  }`}
                  title="Clique para alternar rapidamente entre Linha Contínua e Pontilhado"
                >
                  {dashSpacing === 0 ? 'Contínua' : `${dashSpacing}px`}
                </span>
              </div>
            </div>

            {/* Onion Skin Slider (if Overlay mode) */}
            {layoutMode === 'overlay' && (
              <div className="flex items-center gap-1 px-1 border-l border-zinc-700">
                <span className="text-[10px] text-zinc-400 hidden sm:inline">Ref:</span>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={onionSkinOpacity}
                  onChange={(e) => setOnionSkinOpacity(parseFloat(e.target.value))}
                  className="w-12 sm:w-14 accent-orange-500 cursor-pointer h-1"
                  title={`Opacidade da Referência: ${Math.round(onionSkinOpacity * 100)}%`}
                />
              </div>
            )}

            <div className="h-5 w-px bg-zinc-700" />

            {/* Undo / Redo / Clear / Export */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleUndo}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
                title="Desfazer (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleRedo}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
                title="Refazer (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClearCanvas}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
                title="Limpar Prancheta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDownloadDrawing}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
                title="Salvar Desenho PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-zinc-700" />

            {/* Clean Interface Toggle Button directly on Dock */}
            <button
              type="button"
              onClick={() => setIsCleanInterface(!isCleanInterface)}
              className={`px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isCleanInterface
                  ? 'bg-orange-600 border-orange-500 text-white shadow-sm ring-1 ring-orange-400/40'
                  : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isCleanInterface ? "Restaurar interface completa" : "Interface Limpa (Modo Foco / Sem Menus)"}
            >
              {isCleanInterface ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-semibold hidden md:inline">
                {isCleanInterface ? 'Restaurar' : 'Interface Limpa'}
              </span>
            </button>

          </div>

        </div>

      </div>

      {/* Evaluation Feedback Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Avaliação do Mestre Tenten (IA)
                </h3>
              </div>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1 bg-zinc-800 rounded"
              >
                Fechar
              </button>
            </div>

            {isEvaluating ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                <p className="text-sm font-semibold text-zinc-200">
                  Analisando economia de linhas, volume 3D e fidelidade anatômica...
                </p>
              </div>
            ) : evaluationResult ? (
              <div className="space-y-4">
                
                {/* Score Indicators */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-2xl font-black text-orange-400">
                      {evaluationResult.rating || 88}
                    </span>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                      Nota Geral
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-2xl font-black text-emerald-400">
                      {evaluationResult.anatomyAccuracy || 85}%
                    </span>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                      Anatomia
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-2xl font-black text-blue-400">
                      {evaluationResult.styleFidelity || 90}%
                    </span>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                      Estilo Tenten
                    </p>
                  </div>
                </div>

                {/* Overall Feedback */}
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {evaluationResult.overallComment}
                  </p>
                </div>

                {/* Strengths */}
                {evaluationResult.strengths && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Pontos Fortes do Seu Traço
                    </h5>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {evaluationResult.strengths.map((str: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {evaluationResult.improvements && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Dicas de Aperfeiçoamento
                    </h5>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {evaluationResult.improvements.map((imp: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Drills */}
                {evaluationResult.drillsNext && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-200">
                    <span className="font-bold">Próximo Passo: </span>
                    {evaluationResult.drillsNext}
                  </div>
                )}

                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                >
                  Continuar Desenhando
                </button>

              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
};
