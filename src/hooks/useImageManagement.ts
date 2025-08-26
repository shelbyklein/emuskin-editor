// Custom hook to manage image operations with local storage and blob URL lifecycle
import { useCallback, useRef, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { fileToDataURL } from '../utils/imageUtils';

interface UseImageManagementProps {
  uploadedImage: { file: File; url: string } | null;
  thumbstickImages: { [controlId: string]: string };
  thumbstickFiles: { [controlId: string]: File };
  onUploadedImageChange: (image: { file: File; url: string } | null) => void;
  onThumbstickImagesChange: (images: { [controlId: string]: string }) => void;
  onThumbstickFilesChange: (files: { [controlId: string]: File }) => void;
}

export function useImageManagement({
  uploadedImage,
  thumbstickImages,
  thumbstickFiles,
  onUploadedImageChange,
  onThumbstickImagesChange,
  onThumbstickFilesChange
}: UseImageManagementProps) {
  const { saveProjectImage, storeTemporaryImage, getOrientationData } = useProject();
  const { showSuccess, showError } = useToast();
  
  // Track blob URLs for cleanup
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Handle background image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    try {
      // Create blob URL for immediate display
      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(blobUrl);

      // Update local state immediately
      onUploadedImageChange({ file, url: blobUrl });

      // Save to project (which stores as dataURL)
      await saveProjectImage(file);
      
      showSuccess('Background image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload background image:', error);
      showError('Failed to upload background image');
    }
  }, [saveProjectImage, onUploadedImageChange, showSuccess, showError]);

  // Remove background image
  const removeBackgroundImage = useCallback(async () => {
    try {
      // Clean up blob URL
      if (uploadedImage?.url) {
        URL.revokeObjectURL(uploadedImage.url);
        blobUrlsRef.current.delete(uploadedImage.url);
      }

      // Clear from local state
      onUploadedImageChange(null);

      // Save empty image to project
      await saveProjectImage(null as any); // TODO: Fix this type issue

      showSuccess('Background image removed');
    } catch (error) {
      console.error('Failed to remove background image:', error);
      showError('Failed to remove background image');
    }
  }, [uploadedImage, onUploadedImageChange, saveProjectImage, showSuccess, showError]);

  // Handle thumbstick image upload
  const handleThumbstickImageUpload = useCallback(async (file: File, controlIndex: number, controlId: string) => {
    if (!file || !controlId) return;

    try {
      // Create blob URL for immediate display
      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(blobUrl);

      // Update local state
      const newImages = { ...thumbstickImages, [controlId]: blobUrl };
      const newFiles = { ...thumbstickFiles, [controlId]: file };
      
      onThumbstickImagesChange(newImages);
      onThumbstickFilesChange(newFiles);

      showSuccess('Thumbstick image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload thumbstick image:', error);
      showError('Failed to upload thumbstick image');
    }
  }, [thumbstickImages, thumbstickFiles, onThumbstickImagesChange, onThumbstickFilesChange, showSuccess, showError]);

  // Remove thumbstick image
  const removeThumbstickImage = useCallback((controlId: string) => {
    // Clean up blob URL
    const imageUrl = thumbstickImages[controlId];
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      blobUrlsRef.current.delete(imageUrl);
    }

    // Remove from local state
    const newImages = { ...thumbstickImages };
    const newFiles = { ...thumbstickFiles };
    delete newImages[controlId];
    delete newFiles[controlId];

    onThumbstickImagesChange(newImages);
    onThumbstickFilesChange(newFiles);

    showSuccess('Thumbstick image removed');
  }, [thumbstickImages, thumbstickFiles, onThumbstickImagesChange, onThumbstickFilesChange, showSuccess]);

  // Load stored image from project
  const loadStoredImage = useCallback(() => {
    const orientationData = getOrientationData();
    if (orientationData?.backgroundImage?.dataURL && !uploadedImage) {
      // Create blob from dataURL for display
      fetch(orientationData.backgroundImage.dataURL)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], orientationData.backgroundImage?.fileName || 'background.png');
          const blobUrl = URL.createObjectURL(blob);
          blobUrlsRef.current.add(blobUrl);
          onUploadedImageChange({ file, url: blobUrl });
        })
        .catch(error => {
          console.error('Failed to load stored image:', error);
        });
    }
  }, [getOrientationData, uploadedImage, onUploadedImageChange]);

  // Store temporary image (for testing/preview)
  const storeTemporary = useCallback(async (file: File): Promise<string> => {
    const blobUrl = await storeTemporaryImage(file);
    blobUrlsRef.current.add(blobUrl);
    return blobUrl;
  }, [storeTemporaryImage]);

  // Clean up specific blob URL
  const cleanupBlobUrl = useCallback((url: string) => {
    if (blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  }, []);

  return {
    // Image operations
    handleImageUpload,
    removeBackgroundImage,
    handleThumbstickImageUpload,
    removeThumbstickImage,
    loadStoredImage,
    storeTemporary,
    cleanupBlobUrl,

    // Utilities
    hasBackgroundImage: !!uploadedImage,
    backgroundImageUrl: uploadedImage?.url || null,
    getThumbstickImageUrl: (controlId: string) => thumbstickImages[controlId] || null
  };
}