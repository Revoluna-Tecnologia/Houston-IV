'use client';

/**
 * useFileUpload Hook
 * Gerencia upload de arquivos para mensagens
 */

import { useState, useCallback } from 'react';
import { messagesService } from '../../services/comunicacao/messages-service';

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export interface UploadedFile {
  url: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  type: 'image' | 'video' | 'audio' | 'file';
}

export interface UseFileUploadReturn {
  isUploading: boolean;
  progress: number;
  error: Error | null;
  upload: (file: File) => Promise<UploadedFile>;
  uploadMultiple: (files: File[]) => Promise<UploadedFile[]>;
  validateFile: (file: File) => { valid: boolean; error?: string };
  getFileType: (mimeType: string) => 'image' | 'video' | 'audio' | 'file';
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const getFileType = useCallback((mimeType: string): 'image' | 'video' | 'audio' | 'file' => {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
    if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
    return 'file';
  }, []);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `Arquivo muito grande. Maximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    const allAllowedTypes = [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_AUDIO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ];

    if (!allAllowedTypes.includes(file.type)) {
      return { valid: false, error: `Tipo de arquivo nao permitido: ${file.type}` };
    }

    return { valid: true };
  }, []);

  const upload = useCallback(async (file: File): Promise<UploadedFile> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress (actual progress would need XMLHttpRequest or fetch with streams)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await messagesService.uploadMedia(file);

      clearInterval(progressInterval);
      setProgress(100);

      return {
        url: result.url,
        mimeType: result.mimeType,
        fileName: result.fileName,
        fileSize: file.size,
        type: getFileType(result.mimeType),
      };
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Upload failed');
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, getFileType]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];

    for (const file of files) {
      const result = await upload(file);
      results.push(result);
    }

    return results;
  }, [upload]);

  return {
    isUploading,
    progress,
    error,
    upload,
    uploadMultiple,
    validateFile,
    getFileType,
  };
}
