import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Tool, ToolId } from '../types';
import { fileToBase64 } from '../utils';
import { Spinner } from './Spinner';

interface ImageEditorProps {
  tool: Tool;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ tool }) => {
  const [originalImages, setOriginalImages] = useState<Array<{ id: number; dataUrl: string; file: File }>>([]);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: number; dataUrl: string; fileName: string }>>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBatchMode = tool.id === ToolId.BackgroundRemover;

  // Reset state when tool changes
  useEffect(() => {
    handleReset();
  }, [tool]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setOriginalImages([]);
    setGeneratedImages([]);
    setError(null);
    setIsLoading(true);

    try {
      const filesToProcess = isBatchMode ? Array.from(files) : [files[0]];
      const imagePromises = filesToProcess.map(async (file, index) => {
        const { base64Data } = await fileToBase64(file);
        return {
          id: Date.now() + index,
          dataUrl: `data:${file.type};base64,${base64Data}`,
          file: file,
        };
      });
      const newOriginalImages = await Promise.all(imagePromises);
      setOriginalImages(newOriginalImages);
    } catch (err) {
      setError('Failed to read file(s).');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (originalImages.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const processedImages: typeof generatedImages = [];

    try {
      for (const image of originalImages) {
        const mimeType = image.file.type;
        const base64Data = image.dataUrl.split(',')[1];
        const fullPrompt = `${tool.basePrompt}${prompt ? ` User instruction: ${prompt}` : ''}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: fullPrompt }] },
          config: { responseModalities: [Modality.IMAGE] },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
          const newImageData = firstPart.inlineData.data;
          const newImageMime = firstPart.inlineData.mimeType;
          const extension = newImageMime.split('/')[1] || 'png';
          processedImages.push({
            id: image.id,
            dataUrl: `data:${newImageMime};base64,${newImageData}`,
            fileName: `processed_${image.file.name.split('.').slice(0, -1).join('.')}.${extension}`,
          });
          setGeneratedImages([...processedImages]);
        } else {
          console.error(`Failed to process image: ${image.file.name}. No image data in response.`);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during generation. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImages, prompt, tool.basePrompt]);

  const triggerFileSelect = () => fileInputRef.current?.click();
  
  const handleDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImages([]);
    setGeneratedImages([]);
    setError(null);
    setPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-content-100">{tool.name}</h2>
        <p className="text-content-200 mt-1">{tool.description}</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col bg-base-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-content-100">Original</h3>
          <div className="flex-1 bg-base-100 rounded-md flex items-center justify-center p-2">
            {originalImages.length > 0 ? (
              <div className="w-full h-full overflow-y-auto">
                <div className={`grid gap-4 ${isBatchMode ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                  {originalImages.map(img => (
                    <div key={img.id} className="aspect-square bg-base-300 rounded-md overflow-hidden">
                      <img src={img.dataUrl} alt="Original" className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-content-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V6a2 2 0 012-2h10a2 2 0 012 2v1.586a1 1 0 01-.293.707l-6.414 6.414A1 1 0 009.586 16H7z" /></svg>
                <p className="mt-2 font-medium">Upload your {isBatchMode ? 'images' : 'image'}</p>
                <p className="text-xs mt-1">PNG, JPG, or WEBP</p>
                <button onClick={triggerFileSelect} className="mt-4 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-md hover:bg-brand-secondary transition-colors">
                  Choose File(s)
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" multiple={isBatchMode} />
          </div>
        </div>
        
        {/* Output Panel */}
        <div className="flex flex-col bg-base-200 rounded-lg p-4">
           <h3 className="font-semibold mb-2 text-content-100">Generated</h3>
           <div className="flex-1 bg-base-100 rounded-md flex items-center justify-center relative p-2">
              {isLoading && <Spinner />}
              {!isLoading && generatedImages.length > 0 ? (
                <div className="w-full h-full overflow-y-auto">
                  <div className={`grid gap-4 ${isBatchMode || generatedImages.length > 1 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                    {generatedImages.map(img => (
                       <div key={img.id} className="group aspect-square bg-base-300 rounded-md overflow-hidden relative">
                          <img src={img.dataUrl} alt="Generated" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                            <button onClick={() => handleDownload(img.dataUrl, img.fileName)} className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-brand-secondary flex items-center gap-2" aria-label={`Download ${img.fileName}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </button>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              ) : (
                !isLoading && (
                  <div className="text-center text-content-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <p className="mt-2 font-medium">Your generated results will appear here</p>
                  </div>
                )
              )}
           </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
        {originalImages.length > 0 && (
          <button onClick={handleReset} className="w-full sm:w-auto px-5 py-2.5 bg-base-300 text-content-100 text-sm font-medium rounded-md hover:bg-base-200 transition-colors">
            Clear
          </button>
        )}
        <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add specific instructions (e.g., 'make the background a beach')..."
            className="flex-1 w-full px-4 py-2 bg-base-200 border border-base-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition text-sm"
            disabled={isLoading || originalImages.length === 0}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || originalImages.length === 0}
          className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
        >
          {isLoading ? 'Generating...' : `Generate${originalImages.length > 0 ? ` (${originalImages.length})` : ''}`}
        </button>
      </div>
      {error && <p className="text-red-400 mt-4 text-center sm:text-left text-sm">{error}</p>}
    </div>
  );
};