import React from 'react';
import { Tool, ToolId } from './types';

const iconClass = "h-5 w-5 mr-3 text-content-200 group-hover:text-content-100 transition-colors";

export const TOOLS: Tool[] = [
  {
    id: ToolId.BackgroundRemover,
    name: 'Background Remover',
    description: 'Upload an image to automatically remove the background.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
      </svg>
    ),
    basePrompt: 'Remove the background from this image, making it transparent. The main subject should be perfectly preserved.',
  },
  {
    id: ToolId.ImageEnhancer,
    name: 'Image Enhancer',
    description: 'Improve the quality, sharpness, and clarity of your photos.',
     icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l4 4m0 0l4 4m-4-4v12m-4-4h.01M17 3l4 4M21 7v12m-4-4h.01" />
      </svg>
    ),
    basePrompt: 'Enhance this image. Improve its resolution, sharpness, and overall visual quality significantly.',
  },
  {
    id: ToolId.ImageRestoration,
    name: 'Image Restoration',
    description: 'Restore old, damaged photos to their former glory.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M5 5l14 14" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 20v-5h-5" />
      </svg>
    ),
    basePrompt: 'Restore this old photo. Fix scratches, tears, fading, and improve the colors and details to make it look new.',
  },
    {
    id: ToolId.ExpandImage,
    name: 'Expand Image',
    description: 'Increase the canvas size and let AI fill in the new areas.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v4m0 0h-4m4 0l-5-5" />
      </svg>
    ),
    basePrompt: 'Expand this image, filling the new areas intelligently and realistically to match the existing content.',
  },
  {
    id: ToolId.ObjectRemover,
    name: 'Object Remover',
    description: 'Remove unwanted objects, people, or text from images.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    basePrompt: 'Remove the object indicated by the mask from this image and realistically fill the void. If the user provides additional instructions, follow them.',
    requiresMask: true,
  },
  {
    id: ToolId.GenerativeFill,
    name: 'Generative Fill',
    description: 'Add, remove, or replace parts of an image with AI.',
     icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    basePrompt: 'Using the provided mask, modify this image based on the following instruction:',
    requiresMask: true,
  },
  {
    id: ToolId.PhotoColorize,
    name: 'Photo Colorize',
    description: 'Bring black and white photos to life by adding realistic color.',
    icon: (
       <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    basePrompt: 'Colorize this black and white photo with realistic and vibrant colors.',
  },
];