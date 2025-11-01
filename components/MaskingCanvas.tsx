import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

interface MaskingCanvasProps {
  imageUrl: string;
  brushSize: number;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

interface MaskingCanvasRef {
  getMaskAsBase64: () => Promise<string>;
  clearMask: () => void;
  undo: () => void;
  redo: () => void;
}

export const MaskingCanvas = forwardRef<MaskingCanvasRef, MaskingCanvasProps>(({ imageUrl, brushSize, onHistoryChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [cursor, setCursor] = useState('crosshair');

  // History management for undo/redo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Effect to create a custom SVG cursor that previews the brush size
  useEffect(() => {
    const safeBrushSize = Math.max(2, brushSize); // Ensure brush size is at least 2 for visibility
    const svg = `<svg width="${safeBrushSize}" height="${safeBrushSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${safeBrushSize/2}" cy="${safeBrushSize/2}" r="${safeBrushSize/2 - 1}" fill="rgba(255, 255, 255, 0.5)" stroke="black" stroke-width="1"/></svg>`;
    const newCursor = `url('data:image/svg+xml;base64,${btoa(svg)}') ${safeBrushSize / 2} ${safeBrushSize / 2}, crosshair`;
    setCursor(newCursor);
  }, [brushSize]);

  const updateHistoryState = useCallback(() => {
    onHistoryChange?.(
      historyIndexRef.current > 0,
      historyIndexRef.current < historyRef.current.length - 1
    );
  }, [onHistoryChange]);

  const saveState = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // If we are in the middle of history, new action truncates the "redo" history
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current.splice(historyIndexRef.current + 1);
    }
    
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndexRef.current++;
    updateHistoryState();
  }, [updateHistoryState]);

  const restoreState = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear canvas before restoring to prevent artifacts
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (historyIndexRef.current >= 0) {
      const stateToRestore = historyRef.current[historyIndexRef.current];
      ctx.putImageData(stateToRestore, 0, 0);
    }
    updateHistoryState();
  }, [updateHistoryState]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      restoreState();
    }
  }, [restoreState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      restoreState();
    }
  }, [restoreState]);

  const clearMask = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];
      historyIndexRef.current = -1;
      // Save the initial blank state
      saveState();
    }
  }, [saveState]);

  const drawImage = useCallback(() => {
    if (!imageRef.current || !containerRef.current || !imageCanvasRef.current || !drawingCanvasRef.current) return;

    const image = imageRef.current;
    const container = containerRef.current;
    const canvas = imageCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight;

    if (imageAspectRatio > containerAspectRatio) {
      drawWidth = containerWidth;
      drawHeight = containerWidth / imageAspectRatio;
    } else {
      drawHeight = containerHeight;
      drawWidth = containerHeight * imageAspectRatio;
    }
    
    const top = (containerHeight - drawHeight) / 2;
    const left = (containerWidth - drawWidth) / 2;
    
    canvas.style.top = `${top}px`;
    canvas.style.left = `${left}px`;
    drawingCanvas.style.top = `${top}px`;
    drawingCanvas.style.left = `${left}px`;

    canvas.width = drawWidth;
    canvas.height = drawHeight;
    drawingCanvas.width = drawWidth;
    drawingCanvas.height = drawHeight;

    ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
    
    // After drawing image, initialize the mask and its history
    clearMask();
  }, [clearMask]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      drawImage();
    };
  }, [imageUrl, drawImage]);

  useEffect(() => {
    const handleResize = () => drawImage();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawImage]);

  const getMousePos = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };
  
  const drawOnCanvas = (x: number, y: number) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    // Use a vibrant, opaque color for better visibility on all images
    ctx.strokeStyle = '#ef4444'; // red-500
    ctx.fillStyle = '#ef4444';

    if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    lastPointRef.current = { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    if(pos) {
       lastPointRef.current = pos;
       drawOnCanvas(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    if (pos) {
      drawOnCanvas(pos.x, pos.y);
    }
  };
  
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    saveState(); // Save state after drawing is complete
  };

  const getMaskAsBase64 = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const drawingCanvas = drawingCanvasRef.current;
      const originalImage = imageRef.current;

      if (!drawingCanvas || !originalImage) {
        return reject('Canvas or image not ready');
      }
      
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = originalImage.naturalWidth;
      maskCanvas.height = originalImage.naturalHeight;
      const maskCtx = maskCanvas.getContext('2d');

      if (!maskCtx) {
        return reject('Could not create mask context');
      }
      
      // The goal is to create a pure black-and-white mask from the user's red strokes.
      // The AI model requires the mask to have white areas for editing and black areas to be preserved.
      
      // Step 1: Draw the user's strokes (in red) from the drawing canvas onto our new mask canvas.
      // This scales the strokes to match the original image's dimensions.
      // The result is red strokes on a transparent background.
      maskCtx.drawImage(
        drawingCanvas, 
        0, 0, drawingCanvas.width, drawingCanvas.height, 
        0, 0, maskCanvas.width, maskCanvas.height
      );
      
      // Step 2: Use the 'source-in' composite operation. This operation keeps the destination pixels (our red strokes)
      // only where they overlap with the new shape being drawn. By drawing a solid white rectangle over the
      // whole canvas, we effectively replace all red pixels with white pixels.
      // The result is white strokes on a transparent background.
      maskCtx.globalCompositeOperation = 'source-in';
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      // Step 3: Use the 'destination-over' composite operation. This operation draws the new shape *behind*
      // the existing content. By drawing a solid black rectangle, we fill in all the transparent areas
      // behind our white strokes.
      // The result is a perfect black-and-white mask.
      maskCtx.globalCompositeOperation = 'destination-over';
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      resolve(maskCanvas.toDataURL('image/png'));
    });
  };

  useImperativeHandle(ref, () => ({
    getMaskAsBase64,
    clearMask,
    undo,
    redo,
  }));

  return (
    <div ref={containerRef} style={{ cursor }} className="w-full h-full relative flex items-center justify-center">
      <canvas ref={imageCanvasRef} className="absolute" />
      <canvas
        ref={drawingCanvasRef}
        className="absolute"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
});