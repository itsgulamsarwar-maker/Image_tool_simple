
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Tool, ToolId } from '../types';
import { fileToBase64 } from '../utils';
import { Spinner } from './Spinner';
import { MaskingCanvas } from './MaskingCanvas';

interface ImageEditorProps {
  tool: Tool;
}

interface MaskingCanvasRef {
  getMaskAsBase64: () => Promise<string>;
  clearMask: () => void;
  undo: () => void;
  redo: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ tool }) => {
  const [originalImages, setOriginalImages] = useState<Array<{ id: number; dataUrl: string; file: File }>>([]);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: number; dataUrl: string; fileName: string }>>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskingCanvasRef = useRef<MaskingCanvasRef>(null);

  const isBatchMode = tool.id === ToolId.BackgroundRemover;
  const requiresMask = tool.requiresMask;
  const requiresPrompt = tool.id === ToolId.GenerativeFill;

  useEffect(() => {
    handleReset();
  }, [tool]);

  const handleReset = useCallback(() => {
    setOriginalImages([]);
    setGeneratedImages([]);
    setError(null);
    setPrompt('');
    setCanUndo(false);
    setCanRedo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (maskingCanvasRef.current) {
      maskingCanvasRef.current.clearMask();
    }
  }, []);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(file => file instanceof File && file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('No valid image files provided. Please use PNG, JPG, or WEBP.');
      return;
    }
    handleReset();
    setIsLoading(true);
    try {
      const filesToProcess = isBatchMode ? validFiles : [validFiles[0]];
      const imagePromises = filesToProcess.map(async (file, index) => {
        const { base64Data } = await fileToBase64(file);
        return { id: Date.now() + index, dataUrl: `data:${file.type};base64,${base64Data}`, file };
      });
      const newOriginalImages = await Promise.all(imagePromises);
      setOriginalImages(newOriginalImages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file(s).';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isBatchMode, handleReset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => processFiles(event.target.files);
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); processFiles(event.dataTransfer.files); };

  const handleGenerate = useCallback(async () => {
    if (originalImages.length === 0) return setError('Please upload at least one image.');
    if (requiresPrompt && !prompt) return setError('This tool requires a text description.');
    
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const processedImages: typeof generatedImages = [];

    try {
      for (const image of originalImages) {
        const mimeType = image.file.type;
        const base64Data = image.dataUrl.split(',')[1];
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const textPart = { text: `${tool.basePrompt}${prompt ? ` ${prompt}` : ''}` };
        const parts: any[] = [];

        if (requiresMask && maskingCanvasRef.current) {
          const maskDataUrl = await maskingCanvasRef.current.getMaskAsBase64();
          const maskBase64 = maskDataUrl.split(',')[1];
          const maskPart = { inlineData: { data: maskBase64, mimeType: 'image/png' } };
          parts.push(imagePart, maskPart, textPart);
        } else {
          parts.push(imagePart, textPart);
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: { responseModalities: [Modality.IMAGE] },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
          const { data: newImageData, mimeType: newImageMime } = firstPart.inlineData;
          const extension = newImageMime.split('/')[1] || 'png';
          processedImages.push({
            id: image.id,
            dataUrl: `data:${newImageMime};base64,${newImageData}`,
            fileName: `processed_${image.file.name.split('.').slice(0, -1).join('.')}.${extension}`,
          });
          setGeneratedImages(prev => [...prev, ...processedImages.slice(-1)]);
        } else {
          throw new Error(`Failed to process image: ${image.file.name}. No image data in response.`);
        }
        if (!isBatchMode) break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during generation.';
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImages, prompt, tool.basePrompt, requiresMask, isBatchMode, requiresPrompt]);

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleDownload = useCallback((dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDownloadAll = useCallback(() => {
    generatedImages.forEach((image, index) => {
      setTimeout(() => handleDownload(image.dataUrl, image.fileName), index * 250);
    });
  }, [generatedImages, handleDownload]);

  const isGenerateDisabled = isLoading || originalImages.length === 0 || (requiresPrompt && !prompt);

  const UploadPlaceholder = () => (
    <div
      onClick={triggerFileSelect}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full flex flex-col items-center justify-center text-center text-content-200 border-2 border-dashed rounded-lg cursor-pointer hover:border-brand-primary hover:bg-base-300/20 transition-colors ${isDragging ? 'border-brand-primary bg-base-300/20' : 'border-base-300'}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
      <p className="mt-2 font-medium">Click to upload or drag and drop</p>
      <p className="text-xs mt-1">PNG, JPG, or WEBP ({isBatchMode ? 'Multiple files' : 'Single file'})</p>
      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" multiple={isBatchMode} />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header>
        <h2 className="text-3xl font-bold text-content-100">{tool.name}</h2>
        <p className="text-content-200 mt-1">{tool.description}</p>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-6 min-h-0">
        {/* Main Content Area */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
          {/* Original Panel */}
          <div className="flex flex-col bg-base-200 rounded-lg p-4 border border-base-300">
            <h3 className="font-semibold mb-2 text-content-100">Original</h3>
            <div className="flex-1 bg-base-100 rounded-md flex items-center justify-center p-2 relative">
              {originalImages.length > 0 ? (
                requiresMask ? (
                  <MaskingCanvas
                    ref={maskingCanvasRef}
                    imageUrl={originalImages[0].dataUrl}
                    brushSize={brushSize}
                    onHistoryChange={(undoable, redoable) => { setCanUndo(undoable); setCanRedo(redoable); }}
                  />
                ) : (
                  <div className="w-full h-full overflow-y-auto"><div className={`grid gap-4 ${isBatchMode ? 'grid-cols-2' : 'grid-cols-1'}`}>{originalImages.map(img => (<div key={img.id} className="aspect-square bg-base-300 rounded-md overflow-hidden"><img src={img.dataUrl} alt="Original" className="w-full h-full object-contain" /></div>))}</div></div>
                )
              ) : <UploadPlaceholder />}
            </div>
          </div>
          {/* Generated Panel */}
          <div className="flex flex-col bg-base-200 rounded-lg p-4 border border-base-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-content-100">Generated</h3>
              {isBatchMode && generatedImages.length > 1 && !isLoading && <button onClick={handleDownloadAll} className="px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-brand-secondary flex items-center gap-2 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span>Download All</span></button>}
            </div>
            <div className="flex-1 bg-base-100 rounded-md flex items-center justify-center relative p-2">
              {isLoading && <Spinner text="Processing..." />}
              {!isLoading && generatedImages.length > 0 ? (
                <div className="w-full h-full overflow-y-auto"><div className={`grid gap-4 ${isBatchMode || generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{generatedImages.map(img => (<div key={img.id} className="aspect-square bg-base-300 rounded-md overflow-hidden flex flex-col"><div className="flex-1 relative bg-base-100"><img src={img.dataUrl} alt="Generated" className="absolute inset-0 w-full h-full object-contain" /></div><div className="p-2 bg-base-200 flex-shrink-0"><button onClick={() => handleDownload(img.dataUrl, img.fileName)} className="w-full px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-brand-secondary flex items-center justify-center gap-2 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span>Download</span></button></div></div>))}</div></div>
              ) : !isLoading && (<div className="text-center text-content-200"><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg><p className="mt-2 font-medium">Your results will appear here</p></div>)}
            </div>
          </div>
        </main>
        
        {/* Controls Sidebar */}
        <aside className="w-full lg:w-80 xl:w-96 bg-base-200 rounded-lg p-6 flex flex-col border border-base-300">
          <div className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-content-100 mb-2">Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to change or create..."
                className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition text-sm min-h-[80px] resize-y"
                disabled={isLoading || originalImages.length === 0}
              />
            </div>

            {requiresMask && originalImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-content-100 mb-2">Masking Tools</h4>
                <div className="space-y-4 bg-base-100 p-3 rounded-md border border-base-300">
                   <div>
                      <label htmlFor="brushSize" className="text-xs font-medium text-content-200">Brush Size</label>
                      <input id="brushSize" type="range" min="5" max="80" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer mt-1" />
                   </div>
                   <div className="flex items-center justify-between gap-2">
                     <div className="flex items-center gap-2">
                       <button onClick={() => maskingCanvasRef.current?.undo()} disabled={!canUndo} className="p-2 text-xs font-medium bg-base-300 rounded-md hover:bg-base-200 disabled:opacity-50" title="Undo"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                       <button onClick={() => maskingCanvasRef.current?.redo()} disabled={!canRedo} className="p-2 text-xs font-medium bg-base-300 rounded-md hover:bg-base-200 disabled:opacity-50" title="Redo"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
                     </div>
                     <button onClick={() => maskingCanvasRef.current?.clearMask()} className="px-3 py-1.5 text-xs font-medium bg-base-300 rounded-md hover:bg-base-200">Clear Mask</button>
                   </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-6 space-y-3">
             {error && <p className="text-red-400 text-center text-sm">{error}</p>}
             <button
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
              className="w-full px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-md hover:opacity-90 disabled:from-base-300 disabled:to-base-300 disabled:text-content-200 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm"
            >
              {isLoading ? 'Generating...' : `Generate${originalImages.length > 0 && isBatchMode ? ` (${originalImages.length})` : ''}`}
            </button>
            {originalImages.length > 0 && (
              <button onClick={handleReset} className="w-full py-2.5 text-content-200 text-sm font-medium rounded-md hover:bg-base-300 transition-colors">
                Clear & Start Over
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
