import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

interface MaskingCanvasProps {
  imageUrl: string;
  brushSize: number;
}

interface MaskingCanvasRef {
  getMaskAsBase64: () => Promise<string>;
  clearMask: () => void;
}

export const MaskingCanvas = forwardRef<MaskingCanvasRef, MaskingCanvasProps>(({ imageUrl, brushSize }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
  }, []);

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
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)'; // brand-primary with opacity
    ctx.fillStyle = 'rgba(139, 92, 246, 0.7)';

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
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearMask = () => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
      
      // 1. Draw the user's strokes (purple) onto the mask canvas, scaled to the original image dimensions.
      // This creates strokes on a transparent background.
      maskCtx.drawImage(
        drawingCanvas, 
        0, 0, drawingCanvas.width, drawingCanvas.height, 
        0, 0, maskCanvas.width, maskCanvas.height
      );
      
      // 2. Use 'source-in' to replace the colored strokes with solid white.
      // Now we have white strokes on a transparent background.
      maskCtx.globalCompositeOperation = 'source-in';
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      // 3. Use 'destination-over' to draw a black background *behind* the white strokes.
      // This fills the transparent areas with black, leaving the white strokes untouched.
      maskCtx.globalCompositeOperation = 'destination-over';
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      resolve(maskCanvas.toDataURL('image/png'));
    });
  };

  useImperativeHandle(ref, () => ({
    getMaskAsBase64,
    clearMask,
  }));

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair flex items-center justify-center">
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