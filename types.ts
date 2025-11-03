import type React from 'react';

export enum ToolId {
  LiveConversation = 'live-conversation',
  BackgroundRemover = 'background-remover',
  ImageEnhancer = 'image-enhancer',
  ImageRestoration = 'image-restoration',
  ObjectRemover = 'object-remover',
  GenerativeFill = 'generative-fill',
  PhotoColorize = 'photo-colorize',
  ExpandImage = 'expand-image',
}

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: React.ReactElement;
  basePrompt: string;
  requiresMask?: boolean;
}