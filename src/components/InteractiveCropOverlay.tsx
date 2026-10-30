/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Crop, Move, ZoomIn, Check, RotateCcw } from 'lucide-react';
import { ImageCropBox } from '../types/anatomy.ts';

interface InteractiveCropOverlayProps {
  cropBox: ImageCropBox | null;
  onChangeCropBox: (box: ImageCropBox) => void;
  onClose: () => void;
  onConfirmIsolate?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  label?: string;
  isIsolatedView?: boolean;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export const InteractiveCropOverlay: React.FC<InteractiveCropOverlayProps> = ({
  cropBox,
  onChangeCropBox,
  onClose,
  onConfirmIsolate,
  containerRef,
  label = 'Área Selecionada',
  isIsolatedView = false,
}) => {
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startBox: ImageCropBox;
    containerRect: DOMRect;
  } | null>(null);

  // If in isolated view or no crop box, don't show the outline overlay
  if (isIsolatedView || !cropBox) return null;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: HandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startBox: { ...cropBox },
      containerRect: rect,
    };
    setActiveHandle(handle);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle || !dragStartRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const { pointerX, pointerY, startBox, containerRect } = dragStartRef.current;
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // Delta in percentages
    const deltaXPercent = ((e.clientX - pointerX) / containerRect.width) * 100;
    const deltaYPercent = ((e.clientY - pointerY) / containerRect.height) * 100;

    let newX = startBox.x;
    let newY = startBox.y;
    let newW = startBox.width;
    let newH = startBox.height;

    const minSize = 5; // minimum 5% width/height

    if (activeHandle === 'move') {
      newX = clamp(startBox.x + deltaXPercent, 0, 100 - startBox.width);
      newY = clamp(startBox.y + deltaYPercent, 0, 100 - startBox.height);
    } else {
      // Corner / edge resizing
      if (activeHandle.includes('e')) {
        newW = clamp(startBox.width + deltaXPercent, minSize, 100 - startBox.x);
      }
      if (activeHandle.includes('s')) {
        newH = clamp(startBox.height + deltaYPercent, minSize, 100 - startBox.y);
      }
      if (activeHandle.includes('w')) {
        const potentialW = startBox.width - deltaXPercent;
        if (potentialW >= minSize) {
          newX = clamp(startBox.x + deltaXPercent, 0, startBox.x + startBox.width - minSize);
          newW = startBox.x + startBox.width - newX;
        }
      }
      if (activeHandle.includes('n')) {
        const potentialH = startBox.height - deltaYPercent;
        if (potentialH >= minSize) {
          newY = clamp(startBox.y + deltaYPercent, 0, startBox.y + startBox.height - minSize);
          newH = startBox.y + startBox.height - newY;
        }
      }
    }

    onChangeCropBox({
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: Math.round(newW * 10) / 10,
      height: Math.round(newH * 10) / 10,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setActiveHandle(null);
    dragStartRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${cropBox.x}%`,
        top: `${cropBox.y}%`,
        width: `${cropBox.width}%`,
        height: `${cropBox.height}%`,
      }}
      className="group z-30 select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Crop Box Border & Fill */}
      <div
        className="w-full h-full border-2 border-orange-500 bg-orange-500/10 rounded-md relative shadow-lg cursor-move transition-colors"
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        title="Arraste para mover o recorte ou use as alças nos cantos para redimensionar"
      >
        {/* TOP-RIGHT CORNER CLOSE BUTTON (Requested by user: simple X in corner so it doesn't get in the way) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-3.5 -right-3.5 z-40 w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white ring-2 ring-black/40 transition-transform active:scale-90 cursor-pointer"
          title="Fechar e remover caixa de seleção (ocultar marcação para não atrapalhar o desenho)"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Floating Header Badge with Label & Action Button */}
        <div 
          className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 bg-zinc-950/95 text-orange-200 border border-orange-500/80 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xl flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md max-w-[90%] truncate cursor-default"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Crop className="w-3 h-3 text-orange-400 shrink-0" />
          <span className="truncate">{label}</span>
          {onConfirmIsolate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmIsolate();
              }}
              className="ml-1 px-1.5 py-0.2 bg-orange-600 hover:bg-orange-500 text-white rounded text-[9px] font-semibold transition-colors cursor-pointer"
              title="Isolar e dar zoom neste desenho"
            >
              Focar
            </button>
          )}
        </div>

        {/* Interior Rule-of-Thirds Grid Guide */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
          <div className="border-r border-b border-orange-400 border-dashed" />
          <div className="border-r border-b border-orange-400 border-dashed" />
          <div className="border-b border-orange-400 border-dashed" />
          <div className="border-r border-b border-orange-400 border-dashed" />
          <div className="border-r border-b border-orange-400 border-dashed" />
          <div className="border-b border-orange-400 border-dashed" />
          <div className="border-r border-orange-400 border-dashed" />
          <div className="border-r border-orange-400 border-dashed" />
          <div />
        </div>

        {/* 8 RESIZE HANDLES (Corners + Edges) */}
        {/* NW */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'nw')}
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Canto Noroeste"
        />
        {/* N */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'n')}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border border-orange-600 rounded-xs cursor-ns-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Borda Superior"
        />
        {/* NE */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'ne')}
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Canto Nordeste"
        />
        {/* E */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'e')}
          className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-4 bg-white border border-orange-600 rounded-xs cursor-ew-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Borda Direita"
        />
        {/* SE */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'se')}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Canto Sudeste"
        />
        {/* S */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 's')}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border border-orange-600 rounded-xs cursor-ns-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Borda Inferior"
        />
        {/* SW */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'sw')}
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Canto Sudoeste"
        />
        {/* W */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'w')}
          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-4 bg-white border border-orange-600 rounded-xs cursor-ew-resize shadow-md hover:scale-125 transition-transform"
          title="Redimensionar Borda Esquerda"
        />
      </div>
    </div>
  );
};
