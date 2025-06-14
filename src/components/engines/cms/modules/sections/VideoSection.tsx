'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { MediaItem } from '@/components/engines/cms/modules/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';
import MediaSelector from '@/components/engines/cms/ui/selectors/MediaSelector';
import ColorSelector from '@/components/engines/cms/ui/selectors/ColorSelector';
import TransparencySelector from '@/components/engines/cms/ui/selectors/TransparencySelector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useOptimizedVideo, useOptimizedImage } from '@/hooks/useOptimizedMedia';
import { videoPreloader } from '@/lib/video-preloader';
import { RichStableInput } from '@/components/engines/cms/modules/sections/RichStableInput';

interface VideoSectionProps {
  videoUrl?: string;
  posterUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsinline?: boolean;
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  contentPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  showPlayButton?: boolean;
  playButtonStyle?: 'default' | 'filled' | 'outline';
  playButtonSize?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  maxHeight?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  isEditing?: boolean;
  isMobilePreview?: boolean;
  onUpdate?: (data: Partial<VideoSectionProps>) => void;
}

const VideoSection = React.memo(function VideoSection({
  videoUrl: initialVideoUrl = '',
  posterUrl: initialPosterUrl = '',
  title: initialTitle = '',
  subtitle: initialSubtitle = '',
  description: initialDescription = '',
  autoplay: initialAutoplay = false,
  loop: initialLoop = false,
  muted: initialMuted = true,
  controls: initialControls = true,
  playsinline: initialPlaysinline = true,
  overlayEnabled: initialOverlayEnabled = false,
  overlayColor: initialOverlayColor = '#000000',
  overlayOpacity: initialOverlayOpacity = 50,
  textColor: initialTextColor = '#ffffff',
  textAlignment: initialTextAlignment = 'center',
  contentPosition: initialContentPosition = 'center',
  showPlayButton: initialShowPlayButton = true,
  playButtonStyle: initialPlayButtonStyle = 'filled',
  playButtonSize: initialPlayButtonSize = 'lg',
  fullHeight: initialFullHeight = true,
  maxHeight: initialMaxHeight = '100vh',
  objectFit: initialObjectFit = 'cover',
  isEditing = false,
  isMobilePreview = false,
  onUpdate
}: VideoSectionProps) {
  // Use optimized video hook for better performance
  const optimizedVideo = useOptimizedVideo(initialVideoUrl, {
    enableLazyLoading: false, // Disable lazy loading for instant display
    enablePreloading: true,
    quality: 'auto',
    rootMargin: '0px', // Load immediately when in viewport
    threshold: 0
  });

  // Use optimized image hook for poster
  const optimizedPoster = useOptimizedImage(initialPosterUrl, {
    enableLazyLoading: false, // Disable lazy loading for instant display
    enablePreloading: true,
    quality: 'high',
    enableWebP: true,
    enableAVIF: true
  });

  // Local state for CMS editing
  const [localVideoUrl, setLocalVideoUrl] = useState(initialVideoUrl);
  const [localPosterUrl, setLocalPosterUrl] = useState(initialPosterUrl);
  const [localTitle, setLocalTitle] = useState(initialTitle);
  const [localSubtitle, setLocalSubtitle] = useState(initialSubtitle);
  const [localDescription, setLocalDescription] = useState(initialDescription);
  const [localAutoplay, setLocalAutoplay] = useState(initialAutoplay);
  const [localLoop, setLocalLoop] = useState(initialLoop);
  const [localMuted, setLocalMuted] = useState(initialMuted);
  const [localControls, setLocalControls] = useState(initialControls);
  const [localPlaysinline, setLocalPlaysinline] = useState(initialPlaysinline);
  const [localOverlayEnabled, setLocalOverlayEnabled] = useState(initialOverlayEnabled);
  const [localOverlayColor, setLocalOverlayColor] = useState(initialOverlayColor);
  const [localOverlayOpacity, setLocalOverlayOpacity] = useState(initialOverlayOpacity);
  const [localTextColor, setLocalTextColor] = useState(initialTextColor);
  const [localTextAlignment, setLocalTextAlignment] = useState(initialTextAlignment);
  const [localContentPosition, setLocalContentPosition] = useState(initialContentPosition);
  const [localShowPlayButton, setLocalShowPlayButton] = useState(initialShowPlayButton);
  const [localPlayButtonStyle, setLocalPlayButtonStyle] = useState(initialPlayButtonStyle);
  const [localPlayButtonSize, setLocalPlayButtonSize] = useState(initialPlayButtonSize);
  const [localFullHeight, setLocalFullHeight] = useState(initialFullHeight);
  const [localMaxHeight, setLocalMaxHeight] = useState(initialMaxHeight);
  const [localObjectFit, setLocalObjectFit] = useState(initialObjectFit);

  // UI state
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [videoErrorMessage, setVideoErrorMessage] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingRef = useRef(false);
  const videoCache = useRef<Map<string, string>>(new Map());
  const videoBlobCache = useRef<Map<string, Blob>>(new Map());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get optimized URLs for rendering (fallback to original if not loaded)
  const videoSrc = optimizedVideo.src || localVideoUrl;
  const posterSrc = optimizedPoster.src || localPosterUrl;

  // Preload video when component mounts or URL changes
  useEffect(() => {
    if (localVideoUrl && !isEditing) {
      videoPreloader.preloadVideo(localVideoUrl, {
        preloadAmount: 3, // 3MB
        quality: 'auto'
      });
    }
  }, [localVideoUrl, isEditing]);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialVideoUrl !== localVideoUrl) setLocalVideoUrl(initialVideoUrl);
      if (initialPosterUrl !== localPosterUrl) setLocalPosterUrl(initialPosterUrl);
      if (initialTitle !== localTitle) setLocalTitle(initialTitle);
      if (initialSubtitle !== localSubtitle) setLocalSubtitle(initialSubtitle);
      if (initialDescription !== localDescription) setLocalDescription(initialDescription);
      if (initialAutoplay !== localAutoplay) setLocalAutoplay(initialAutoplay);
      if (initialLoop !== localLoop) setLocalLoop(initialLoop);
      if (initialMuted !== localMuted) setLocalMuted(initialMuted);
      if (initialControls !== localControls) setLocalControls(initialControls);
      if (initialPlaysinline !== localPlaysinline) setLocalPlaysinline(initialPlaysinline);
      if (initialOverlayEnabled !== localOverlayEnabled) setLocalOverlayEnabled(initialOverlayEnabled);
      if (initialOverlayColor !== localOverlayColor) setLocalOverlayColor(initialOverlayColor);
      if (initialOverlayOpacity !== localOverlayOpacity) setLocalOverlayOpacity(initialOverlayOpacity);
      if (initialTextColor !== localTextColor) setLocalTextColor(initialTextColor);
      if (initialTextAlignment !== localTextAlignment) setLocalTextAlignment(initialTextAlignment);
      if (initialContentPosition !== localContentPosition) setLocalContentPosition(initialContentPosition);
      if (initialShowPlayButton !== localShowPlayButton) setLocalShowPlayButton(initialShowPlayButton);
      if (initialPlayButtonStyle !== localPlayButtonStyle) setLocalPlayButtonStyle(initialPlayButtonStyle);
      if (initialPlayButtonSize !== localPlayButtonSize) setLocalPlayButtonSize(initialPlayButtonSize);
      if (initialFullHeight !== localFullHeight) setLocalFullHeight(initialFullHeight);
      if (initialMaxHeight !== localMaxHeight) setLocalMaxHeight(initialMaxHeight);
      if (initialObjectFit !== localObjectFit) setLocalObjectFit(initialObjectFit);
    }
  }, [
    initialVideoUrl, initialPosterUrl, initialTitle, initialSubtitle, initialDescription,
    initialAutoplay, initialLoop, initialMuted, initialControls, initialPlaysinline,
    initialOverlayEnabled, initialOverlayColor, initialOverlayOpacity, initialTextColor,
    initialTextAlignment, initialContentPosition, initialShowPlayButton, initialPlayButtonStyle,
    initialPlayButtonSize, initialFullHeight, initialMaxHeight, initialObjectFit,
    localVideoUrl, localPosterUrl, localTitle, localSubtitle, localDescription,
    localAutoplay, localLoop, localMuted, localControls, localPlaysinline,
    localOverlayEnabled, localOverlayColor, localOverlayOpacity, localTextColor,
    localTextAlignment, localContentPosition, localShowPlayButton, localPlayButtonStyle,
    localPlayButtonSize, localFullHeight, localMaxHeight, localObjectFit
  ]);

  // Optimized update function with debouncing
  const handleUpdateField = useCallback((field: string, value: string | number | boolean) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Log the update for debugging
      console.log(`🎬 VideoSection updating field: ${field} =`, value);
      
      // Set up a debounced update
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<VideoSectionProps> = {};
        
        // @ts-expect-error: Dynamic field assignment
        updateData[field] = value;
        
        console.log(`🎬 VideoSection sending update to CMS:`, updateData);
        
        try {
          onUpdate(updateData);
          console.log(`✅ VideoSection update sent successfully for field: ${field}`);
        } catch (error) {
          console.error(`❌ VideoSection update failed for field: ${field}`, error);
        }
        
        // Reset the editing ref after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 300);
      }, 300);
    } else {
      console.warn(`⚠️ VideoSection: onUpdate function not provided, cannot update field: ${field}`);
    }
  }, [onUpdate]);

  // Individual change handlers
  const handleVideoUrlChange = useCallback((newValue: string) => {
    setLocalVideoUrl(newValue);
    handleUpdateField('videoUrl', newValue);
    setShowVideoSelector(false);
  }, [handleUpdateField]);

  const handlePosterUrlChange = useCallback((newValue: string) => {
    setLocalPosterUrl(newValue);
    handleUpdateField('posterUrl', newValue);
    setShowPosterSelector(false);
  }, [handleUpdateField]);

  // Video control handlers
  const handleAutoplayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalAutoplay(newValue);
    handleUpdateField('autoplay', newValue);
  }, [handleUpdateField]);

  const handleLoopChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalLoop(newValue);
    handleUpdateField('loop', newValue);
  }, [handleUpdateField]);

  const handleMutedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalMuted(newValue);
    handleUpdateField('muted', newValue);
  }, [handleUpdateField]);

  const handleControlsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalControls(newValue);
    handleUpdateField('controls', newValue);
  }, [handleUpdateField]);

  const handlePlaysinlineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalPlaysinline(newValue);
    handleUpdateField('playsinline', newValue);
  }, [handleUpdateField]);

  // Overlay handlers
  const handleOverlayEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalOverlayEnabled(newValue);
    handleUpdateField('overlayEnabled', newValue);
  }, [handleUpdateField]);

  const handleOverlayColorChange = useCallback((color: string) => {
    setLocalOverlayColor(color);
    handleUpdateField('overlayColor', color);
  }, [handleUpdateField]);

  const handleOverlayOpacityChange = useCallback((opacity: number) => {
    setLocalOverlayOpacity(opacity);
    handleUpdateField('overlayOpacity', opacity);
  }, [handleUpdateField]);

  const handleTextColorChange = useCallback((color: string) => {
    setLocalTextColor(color);
    handleUpdateField('textColor', color);
  }, [handleUpdateField]);

  // Layout handlers
  const handleTextAlignmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'center' | 'right';
    setLocalTextAlignment(newValue);
    handleUpdateField('textAlignment', newValue);
  }, [handleUpdateField]);

  const handleContentPositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as typeof localContentPosition;
    setLocalContentPosition(newValue);
    handleUpdateField('contentPosition', newValue);
  }, [handleUpdateField]);

  const handleShowPlayButtonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalShowPlayButton(newValue);
    handleUpdateField('showPlayButton', newValue);
  }, [handleUpdateField]);

  const handlePlayButtonStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'default' | 'filled' | 'outline';
    setLocalPlayButtonStyle(newValue);
    handleUpdateField('playButtonStyle', newValue);
  }, [handleUpdateField]);

  const handlePlayButtonSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'sm' | 'md' | 'lg';
    setLocalPlayButtonSize(newValue);
    handleUpdateField('playButtonSize', newValue);
  }, [handleUpdateField]);

  const handleFullHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalFullHeight(newValue);
    handleUpdateField('fullHeight', newValue);
  }, [handleUpdateField]);

  const handleMaxHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalMaxHeight(newValue);
    handleUpdateField('maxHeight', newValue);
  }, [handleUpdateField]);

  const handleObjectFitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'cover' | 'contain' | 'fill';
    setLocalObjectFit(newValue);
    handleUpdateField('objectFit', newValue);
  }, [handleUpdateField]);

  // Media selection handlers
  const handleVideoSelection = (mediaItem: MediaItem) => {
    // For S3 files, use the API route instead of direct S3 URL
    let videoUrl = mediaItem.fileUrl;
    
    // Check if this is an S3 file and convert to API route
    if (mediaItem.s3Key) {
      videoUrl = `/api/media/download?key=${encodeURIComponent(mediaItem.s3Key)}&view=true`;
      console.log('Using S3 API route for video:', { s3Key: mediaItem.s3Key, apiUrl: videoUrl });
    } else {
      console.log('Using direct URL for video:', { fileUrl: videoUrl });
    }
    
    console.log('Selected video:', { mediaItem, finalVideoUrl: videoUrl });
    handleVideoUrlChange(videoUrl);
  };

  const handlePosterSelection = (mediaItem: MediaItem) => {
    // For S3 files, use the API route instead of direct S3 URL
    let posterUrl = mediaItem.fileUrl;
    
    // Check if this is an S3 file and convert to API route
    if (mediaItem.s3Key) {
      posterUrl = `/api/media/download?key=${encodeURIComponent(mediaItem.s3Key)}&view=true`;
      console.log('Using S3 API route for poster:', { s3Key: mediaItem.s3Key, apiUrl: posterUrl });
    } else {
      console.log('Using direct URL for poster:', { fileUrl: posterUrl });
    }
    
    console.log('Selected poster:', { mediaItem, finalPosterUrl: posterUrl });
    handlePosterUrlChange(posterUrl);
  };

  // Video play/pause handler
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Video event handlers with improved loading states
  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  
  const handleVideoLoadStart = () => {
    // Don't show loading for instant display - removed loading state updates
    setHasVideoError(false);
    setVideoErrorMessage('');
  };

  const handleVideoProgress = () => {
    // Always show as fully loaded for instant display - removed loading state updates
  };

  const handleVideoCanPlay = () => {
    // Removed loading state updates for instant display
    if (localAutoplay && !isEditing && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented by browser:', error);
      });
    }
  };

  const handleVideoLoadedData = () => {
    console.log('Video loaded successfully:', convertS3UrlToApiRoute(localVideoUrl));
    setHasVideoError(false);
    setVideoErrorMessage('');
    // Removed loading state updates for instant display
  };

  // Enhanced video format detection with codec support
  const getVideoFormatsAndCodecs = useCallback((url: string) => {
    if (!url) return [];
    
    const extension = url.split('.').pop()?.toLowerCase();
    const formats = [];
    
    switch (extension) {
      case 'mp4':
      case 'm4v':
        formats.push(
          { src: url, type: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"' },
          { src: url, type: 'video/mp4; codecs="avc1.4D401E,mp4a.40.2"' },
          { src: url, type: 'video/mp4; codecs="avc1.64001E,mp4a.40.2"' },
          { src: url, type: 'video/mp4' }
        );
        break;
      case 'webm':
        formats.push(
          { src: url, type: 'video/webm; codecs="vp9,opus"' },
          { src: url, type: 'video/webm; codecs="vp8,vorbis"' },
          { src: url, type: 'video/webm' }
        );
        break;
      case 'ogg':
      case 'ogv':
        formats.push(
          { src: url, type: 'video/ogg; codecs="theora,vorbis"' },
          { src: url, type: 'video/ogg' }
        );
        break;
      default:
        // For unknown formats, try multiple common codecs
        formats.push(
          { src: url, type: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"' },
          { src: url, type: 'video/mp4' },
          { src: url, type: 'video/webm; codecs="vp9,opus"' },
          { src: url, type: 'video/webm' }
        );
    }
    
    return formats;
  }, []);

  // Enhanced browser compatibility check
  const checkVideoSupport = useCallback(() => {
    const video = document.createElement('video');
    const support = {
      mp4: {
        basic: video.canPlayType('video/mp4') !== '',
        h264: video.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"') !== '',
        h264High: video.canPlayType('video/mp4; codecs="avc1.64001E,mp4a.40.2"') !== ''
      },
      webm: {
        basic: video.canPlayType('video/webm') !== '',
        vp8: video.canPlayType('video/webm; codecs="vp8,vorbis"') !== '',
        vp9: video.canPlayType('video/webm; codecs="vp9,opus"') !== ''
      },
      ogg: {
        basic: video.canPlayType('video/ogg') !== '',
        theora: video.canPlayType('video/ogg; codecs="theora,vorbis"') !== ''
      }
    };
    
    console.log('🎬 Browser video support:', support);
    return support;
  }, []);

  // Enhanced error handling with retry mechanism
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    
    console.log('🎬 Video error event:', {
      url: localVideoUrl,
      error: error ? {
        code: error.code,
        message: error.message
      } : 'No error object',
      networkState: video.networkState,
      readyState: video.readyState,
      currentSrc: video.currentSrc
    });
    
    // Check browser support when error occurs
    const support = checkVideoSupport();
    
    if (error && error.code) {
      let errorMessage = 'Video playback error';
      let shouldRetry = false;
      
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was cancelled';
          shouldRetry = true;
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading video';
          shouldRetry = true;
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video format error or file corrupted';
          console.warn('🎬 Decode error - trying different format/codec');
          shouldRetry = true;
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format not supported by this browser';
          console.warn('🎬 Format not supported:', {
            url: localVideoUrl,
            browserSupport: support
          });
          shouldRetry = true;
          break;
        default:
          errorMessage = 'Unknown video error';
          shouldRetry = true;
      }
      
      console.warn(`🎬 Video Error: ${errorMessage}`);
      
      // Try to recover by reloading with different settings
      if (shouldRetry && !hasVideoError) {
        console.log('🎬 Attempting video recovery...');
        setHasVideoError(false);
        
        setTimeout(() => {
          if (video && localVideoUrl) {
            // Try with different preload settings
            video.preload = 'metadata';
            video.load();
            
            // If still fails, try without crossOrigin
            setTimeout(() => {
              if (video.error) {
                video.crossOrigin = '';
                video.load();
              }
            }, 1000);
          }
        }, 500);
        
        return; // Don't set error state yet, give recovery a chance
      }
      
      setHasVideoError(true);
      setVideoErrorMessage(errorMessage);
    } else {
      console.log('🎬 Video error event without error details');
      setHasVideoError(true);
      setVideoErrorMessage('Video failed to load - trying recovery...');
      
      // Attempt recovery for unknown errors
      setTimeout(() => {
        if (video && localVideoUrl) {
          video.load();
        }
      }, 1000);
    }
  };

  // Utility function to convert hex to rgba
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  }, []);

  // Get content position classes
  const getContentPositionClasses = () => {
    const positions = {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      'center': 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-left': 'items-end justify-start',
      'bottom-center': 'items-end justify-center',
      'bottom-right': 'items-end justify-end'
    };
    return positions[localContentPosition] || positions.center;
  };

  // Get play button size classes
  const getPlayButtonSizeClasses = () => {
    const sizes = {
      'sm': 'w-12 h-12',
      'md': 'w-16 h-16',
      'lg': 'w-20 h-20'
    };
    return sizes[localPlayButtonSize] || sizes.lg;
  };

  // Get play button style classes
  const getPlayButtonStyleClasses = () => {
    const styles = {
      'default': 'bg-white/20 hover:bg-white/30 text-white',
      'filled': 'bg-white text-black hover:bg-gray-100',
      'outline': 'border-2 border-white text-white hover:bg-white/20'
    };
    return styles[localPlayButtonStyle] || styles.filled;
  };

  // Custom hook for video optimization
  const [isOptimized, setIsOptimized] = useState(false);
  
  const optimizeVideo = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!videoElement || isOptimized) return;
    
    try {
      // Set optimal buffer size
      if ('buffered' in videoElement) {
        // Force immediate buffer loading
        videoElement.load();
        
        // Monitor buffering progress
        const checkBuffer = () => {
          if (videoElement.buffered.length > 0) {
            const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
            if (bufferedEnd > 2) { // 2 seconds of buffer is enough for smooth playback
              setIsOptimized(true);
            }
          }
        };
        
        videoElement.addEventListener('progress', checkBuffer);
        videoElement.addEventListener('canplay', checkBuffer);
        
        // Cleanup
        return () => {
          videoElement.removeEventListener('progress', checkBuffer);
          videoElement.removeEventListener('canplay', checkBuffer);
        };
      }
    } catch (error) {
      console.warn('Video optimization failed:', error);
    }
  }, [isOptimized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Reset any pending state changes
      setIsOptimized(false);
    };
  }, []);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      videoCache.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      videoCache.current.clear();
      videoBlobCache.current.clear();
    };
  }, []);

  // Helper function to convert S3 URLs to API routes with caching
  const convertS3UrlToApiRoute = useCallback((url: string): string => {
    if (!url) return url;
    
    // Check cache first
    if (videoCache.current.has(url)) {
      return videoCache.current.get(url)!;
    }
    
    // Check if this is a direct S3 URL that needs to be converted
    const s3UrlPattern = /https:\/\/[^\/]+\.s3\.amazonaws\.com\/(.+)/;
    const match = url.match(s3UrlPattern);
    
    let processedUrl = url;
    if (match) {
      const s3Key = decodeURIComponent(match[1]);
      processedUrl = `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
      console.log('Converting S3 URL to API route:', { originalUrl: url, s3Key, apiUrl: processedUrl });
    }
    
    // Cache the result
    videoCache.current.set(url, processedUrl);
    
    return processedUrl;
  }, []);

  // Reset loading and error state when video URL changes
  useEffect(() => {
    if (localVideoUrl) {
      setHasVideoError(false);
      setVideoErrorMessage('');
    }
  }, [localVideoUrl]);

  // Advanced video preloading with intersection observer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create intersection observer for smart preloading
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && localVideoUrl && !isEditing) {
            // Start preloading when video section comes into view
            preloadVideo(localVideoUrl);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the video comes into view
        threshold: 0.1
      }
    );

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [localVideoUrl, isEditing]);

  // Attach intersection observer to video element
  useEffect(() => {
    if (videoRef.current && intersectionObserverRef.current) {
      intersectionObserverRef.current.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current && intersectionObserverRef.current) {
        intersectionObserverRef.current.unobserve(videoRef.current);
      }
    };
  }, []);

  // Advanced video preloading function
  const preloadVideo = useCallback(async (videoUrl: string) => {
    if (!videoUrl || videoBlobCache.current.has(videoUrl)) return;

    try {
      const processedUrl = convertS3UrlToApiRoute(videoUrl);
      
      // Use fetch with range requests for progressive loading
      const response = await fetch(processedUrl, {
        headers: {
          'Range': 'bytes=0-1048576', // Load first 1MB for instant playback
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        videoBlobCache.current.set(videoUrl, blob);
        
        // Create object URL for immediate use
        const objectUrl = URL.createObjectURL(blob);
        videoCache.current.set(videoUrl, objectUrl);
        
        console.log('Video chunk preloaded successfully:', videoUrl);
      }
    } catch (error) {
      console.warn('Video preload failed:', error);
    }
  }, [convertS3UrlToApiRoute]);

  // Enhanced video optimization with adaptive quality
  const optimizeVideoForFastLoading = useCallback((videoElement: HTMLVideoElement) => {
    if (!videoElement) return;

    // Set optimal loading attributes
    videoElement.preload = 'auto';
    videoElement.crossOrigin = 'anonymous';
    
    // Enable hardware acceleration
    videoElement.style.willChange = 'transform';
    videoElement.style.transform = 'translateZ(0)';
    
    // Optimize for mobile
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      videoElement.playsInline = true;
      videoElement.muted = true; // Required for autoplay on mobile
    }

    // Set buffer size for faster streaming
    if ('buffered' in videoElement) {
      videoElement.addEventListener('progress', () => {
        if (videoElement.buffered.length > 0) {
          const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
          const duration = videoElement.duration;
          if (duration > 0) {
            const progress = (bufferedEnd / duration) * 100;
            if (bufferedEnd > 5 || progress > 10) {
              setIsOptimized(true);
            }
          }
        }
      });
    }
  }, []);

  // Enhanced video loading with better compatibility
  const setupVideoElement = useCallback((video: HTMLVideoElement, url: string) => {
    if (!video || !url) return;
    
    // Reset error state
    setHasVideoError(false);
    setVideoErrorMessage('');
    
    // Enhanced video attributes for better compatibility
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    
    // Mobile optimizations
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      video.muted = true; // Required for autoplay on mobile
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x-webkit-airplay', 'allow');
    }
    
    // Hardware acceleration
    video.style.willChange = 'transform';
    video.style.transform = 'translateZ(0)';
    
    // Set video properties
    video.muted = localMuted;
    video.loop = localLoop;
    video.controls = localControls;
    
    // Enhanced loading strategy
    const processedUrl = convertS3UrlToApiRoute(url);
    
    // Clear any existing sources
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }
    
    // Add multiple source formats for better compatibility
    const formats = getVideoFormatsAndCodecs(processedUrl);
    
    formats.forEach(format => {
      const source = document.createElement('source');
      source.src = format.src;
      source.type = format.type;
      video.appendChild(source);
    });
    
    // Set poster if available
    if (localPosterUrl) {
      video.poster = convertS3UrlToApiRoute(localPosterUrl);
    }
    
    // Load the video
    video.load();
    
    console.log('🎬 Video setup complete:', {
      url: processedUrl,
      formats: formats.length,
      poster: video.poster,
      muted: video.muted,
      autoplay: localAutoplay
    });
    
  }, [localVideoUrl, localPosterUrl, localMuted, localLoop, localControls, convertS3UrlToApiRoute, getVideoFormatsAndCodecs]);

  // Enhanced video loading with immediate playback and pre-rendering support
  useEffect(() => {
    if (localVideoUrl && videoRef.current && !isEditing) {
      const video = videoRef.current;
      
      // Setup video with enhanced compatibility
      setupVideoElement(video, localVideoUrl);
      
      // Apply optimizations
      optimizeVideoForFastLoading(video);
      optimizeVideo(video);
      
      // Auto-play with enhanced error handling
      if (localAutoplay) {
        const attemptAutoplay = async () => {
          try {
            await video.play();
            console.log('🎬 Autoplay successful');
          } catch (error) {
            console.log('🎬 Autoplay prevented:', error);
            // Show play button as fallback
            setLocalShowPlayButton(true);
            
            // Try muted autoplay as fallback
            if (!video.muted) {
              video.muted = true;
              try {
                await video.play();
                console.log('🎬 Muted autoplay successful');
              } catch (mutedError) {
                console.log('🎬 Muted autoplay also failed:', mutedError);
              }
            }
          }
        };
        
        // Wait for video to be ready
        if (video.readyState >= 2) {
          attemptAutoplay();
        } else {
          video.addEventListener('canplay', attemptAutoplay, { once: true });
        }
      }
    }
  }, [localVideoUrl, localAutoplay, localMuted, localLoop, localPlaysinline, isEditing, setupVideoElement, optimizeVideoForFastLoading, optimizeVideo]);

  // Render video content with enhanced error handling and multiple source support
  const renderVideoContent = () => {
    // Use optimized URLs when available, fallback to converted S3 URLs
    const processedVideoUrl = videoSrc ? convertS3UrlToApiRoute(videoSrc) : convertS3UrlToApiRoute(localVideoUrl);
    const processedPosterUrl = posterSrc ? convertS3UrlToApiRoute(posterSrc) : convertS3UrlToApiRoute(localPosterUrl);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {processedVideoUrl ? (
          hasVideoError ? (
            // Enhanced error state with recovery options
            <motion.div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 text-red-800"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="text-center p-8 max-w-md">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Video Error
                </motion.h3>
                <motion.p 
                  className="text-sm opacity-80 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {videoErrorMessage}
                </motion.p>
                <div className="space-y-3">
                  <motion.button
                    onClick={() => {
                      setHasVideoError(false);
                      setVideoErrorMessage('');
                      if (videoRef.current && localVideoUrl) {
                        setupVideoElement(videoRef.current, localVideoUrl);
                      }
                    }}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium w-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Retry Video
                  </motion.button>
                  
                  {/* Fallback: Direct download link */}
                  <motion.a
                    href={processedVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    Download Video
                  </motion.a>
                </div>
                
                {/* Browser compatibility info */}
                <motion.div
                  className="mt-4 text-xs text-gray-600 bg-gray-100 p-3 rounded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Try updating your browser or use a different browser for better video support.
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // Enhanced video element with multiple sources
            <>
              <motion.video
                ref={videoRef}
                className="w-full h-full absolute inset-0 z-0"
                style={{ 
                  objectFit: localObjectFit,
                  backgroundColor: 'transparent',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
                autoPlay={localAutoplay && !isEditing}
                muted={localMuted}
                loop={localLoop}
                controls={localControls}
                playsInline={localPlaysinline}
                preload="auto"
                crossOrigin="anonymous"
                poster={processedPosterUrl}
                x-webkit-airplay="allow"
                webkit-playsinline="true"
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onError={handleVideoError}
                onLoadStart={handleVideoLoadStart}
                onProgress={handleVideoProgress}
                onLoadedData={handleVideoLoadedData}
                onCanPlay={handleVideoCanPlay}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                data-field-type="videoUrl"
                data-component-type="Video"
              >
                {/* Multiple source elements for better compatibility */}
                {getVideoFormatsAndCodecs(processedVideoUrl).map((format, index) => (
                  <source key={index} src={format.src} type={format.type} />
                ))}
                
                {/* Fallback content */}
                <div className="text-white text-center p-4 bg-black/50 rounded">
                  <p className="mb-2">Your browser does not support the video tag.</p>
                  <a 
                    href={processedVideoUrl} 
                    className="underline hover:text-blue-300 transition-colors" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Download the video file
                  </a>
                </div>
              </motion.video>
              
              {/* Overlay - shows immediately */}
              {localOverlayEnabled && (
                <motion.div 
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ 
                    backgroundColor: hexToRgba(localOverlayColor, localOverlayOpacity)
                  }}
                  initial={{ opacity: 1 }} // Start visible
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              
              {/* Content overlay - appears immediately with proper z-index */}
              <motion.div 
                className={`absolute inset-0 z-20 flex ${getContentPositionClasses()} ${isMobilePreview ? 'p-4' : 'p-6 sm:p-12'} pointer-events-none`}
                initial={{ opacity: 1, y: 0 }} // Start in final position
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div 
                  className={`${isMobilePreview ? 'max-w-full' : 'max-w-5xl'} w-full ${localTextAlignment === 'center' ? 'text-center' : localTextAlignment === 'left' ? 'text-left' : 'text-right'}`} 
                  style={{ color: localTextColor }}
                >
                  {/* Container with consistent spacing - no individual margins */}
                  <div className="space-y-3 sm:space-y-4">
                    {localTitle && (
                      <motion.div
                        initial={{ opacity: 1, y: 0, filter: "blur(0px)" }} // Start visible
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.5 }}
                        data-field-type="title"
                        data-component-type="Video"
                      >
                        <h1 
                          className={isMobilePreview 
                            ? "text-2xl font-black leading-tight tracking-tight drop-shadow-2xl" 
                            : "text-5xl sm:text-7xl lg:text-8xl font-black leading-none tracking-tight drop-shadow-2xl"
                          }
                          style={{ 
                            textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                            fontWeight: 900
                          }}
                          dangerouslySetInnerHTML={{ __html: localTitle }}
                        />
                      </motion.div>
                    )}
                    {localSubtitle && (
                      <motion.div
                        initial={{ opacity: 1, y: 0, filter: "blur(0px)" }} // Start visible
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        data-field-type="subtitle"
                        data-component-type="Video"
                      >
                        <h2 
                          className={isMobilePreview 
                            ? "text-lg font-bold opacity-95 leading-tight drop-shadow-lg" 
                            : "text-2xl sm:text-3xl lg:text-4xl font-bold opacity-95 leading-tight drop-shadow-lg"
                          }
                          style={{ 
                            textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
                            fontWeight: 700
                          }}
                          dangerouslySetInnerHTML={{ __html: localSubtitle }}
                        />
                      </motion.div>
                    )}
                    {localDescription && (
                      <motion.div
                        initial={{ opacity: 1, y: 0, filter: "blur(0px)" }} // Start visible
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        data-field-type="description"
                        data-component-type="Video"
                      >
                        <div 
                          className={isMobilePreview 
                            ? "text-sm font-medium opacity-90 leading-relaxed drop-shadow-md" 
                            : "text-lg sm:text-xl lg:text-2xl font-medium opacity-90 leading-relaxed drop-shadow-md"
                          }
                          style={{ 
                            textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
                            fontWeight: 500
                          }}
                          dangerouslySetInnerHTML={{ __html: localDescription }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Play button - shows immediately with highest z-index */}
              {localShowPlayButton && !localControls && (
                <motion.button
                  onClick={togglePlayPause}
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isMobilePreview ? 'w-12 h-12' : getPlayButtonSizeClasses()} ${getPlayButtonStyleClasses()} rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto z-30 backdrop-blur-sm shadow-2xl`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  initial={{ opacity: 1, scale: 1 }} // Start visible
                  animate={{ 
                    opacity: 1, 
                    scale: isHovered ? 1.1 : 1 
                  }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-1/2 h-1/2" />
                  ) : (
                    <PlayIcon className="w-1/2 h-1/2 ml-1" />
                  )}
                </motion.button>
              )}
            </>
          )
        ) : (
          // No video selected state
          <motion.div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center p-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-6"
              >
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                  <PlayIcon className="w-10 h-10 text-gray-400" />
                </div>
              </motion.div>
              <motion.h2 
                className="text-2xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                No Video Selected
              </motion.h2>
              <motion.p 
                className="text-lg opacity-75"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Please select a video in edit mode
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Content Tab Component
  const ContentTab = () => {
    // Estado local para los inputs
    const [localTitleState, setLocalTitleState] = useState(localTitle);
    const [localSubtitleState, setLocalSubtitleState] = useState(localSubtitle);
    const [localDescriptionState, setLocalDescriptionState] = useState(localDescription);
    
    // Actualizar estado local cuando cambian las props
    useEffect(() => {
      setLocalTitleState(localTitle);
      setLocalSubtitleState(localSubtitle);
      setLocalDescriptionState(localDescription);
    }, [localTitle, localSubtitle, localDescription]);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Content</h3>
            
            <div className="isolate" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Title
              </label>
              <RichStableInput
                value={localTitleState}
                onChange={(value) => {
                  setLocalTitleState(value);
                  setLocalTitle(value);
                  handleUpdateField('title', value);
                }}
                placeholder="Video title..."
                enableRichText={true}
                toolbar="basic"
                height="80px"
                data-field-id="title"
                data-component-type="Video"
                className="font-bold text-xl"
              />
            </div>
            
            <div className="isolate" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Subtitle
              </label>
              <RichStableInput
                value={localSubtitleState}
                onChange={(value) => {
                  setLocalSubtitleState(value);
                  setLocalSubtitle(value);
                  handleUpdateField('subtitle', value);
                }}
                placeholder="Video subtitle..."
                enableRichText={true}
                toolbar="basic"
                height="80px"
                data-field-id="subtitle"
                data-component-type="Video"
              />
            </div>
            
            <div className="isolate" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Description
              </label>
              <RichStableInput
                value={localDescriptionState}
                onChange={(value) => {
                  setLocalDescriptionState(value);
                  setLocalDescription(value);
                  handleUpdateField('description', value);
                }}
                placeholder="Enter video description..."
                enableRichText={true}
                toolbar="full"
                height="150px"
                data-field-id="description"
                data-component-type="Video"
                isTextArea={true}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Settings</h3>
            
            <div>
              <ColorSelector
                label="Text Color"
                value={localTextColor}
                onChange={handleTextColorChange}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="textAlignment" className="text-sm font-medium block mb-2">
                  Text Alignment
                </label>
                <select
                  id="textAlignment"
                  value={localTextAlignment}
                  onChange={handleTextAlignmentChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="contentPosition" className="text-sm font-medium block mb-2">
                  Content Position
                </label>
                <select
                  id="contentPosition"
                  value={localContentPosition}
                  onChange={handleContentPositionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="center-left">Center Left</option>
                  <option value="center">Center</option>
                  <option value="center-right">Center Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Video Tab Component
  const VideoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video File</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Video File</label>
            <div className="flex flex-col gap-2">
              <div className="border rounded-md h-32 w-full flex items-center justify-center overflow-hidden bg-gray-50">
                {localVideoUrl ? (
                  <video
                    src={localVideoUrl}
                    poster={localPosterUrl}
                    className="max-h-full max-w-full object-contain"
                    muted
                  />
                ) : (
                  <div className="text-gray-400 text-sm text-center">
                    No video<br/>selected
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowVideoSelector(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Select Video
                </button>
                {localVideoUrl && (
                  <button 
                    onClick={() => handleVideoUrlChange('')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Select a video file from your media library
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Poster Image (Optional)</label>
            <div className="flex flex-col gap-2">
              <div className="border rounded-md h-24 w-full flex items-center justify-center overflow-hidden bg-gray-50">
                {localPosterUrl ? (
                  <S3FilePreview
                    src={localPosterUrl}
                    alt="Video poster"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-sm text-center">
                    No poster<br/>selected
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowPosterSelector(true)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Select Poster
                </button>
                {localPosterUrl && (
                  <button 
                    onClick={() => handlePosterUrlChange('')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Image shown before video plays
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Settings</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoplay"
                checked={localAutoplay}
                onChange={handleAutoplayChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoplay" className="text-sm font-medium">
                Autoplay (starts automatically)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="loop"
                checked={localLoop}
                onChange={handleLoopChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="loop" className="text-sm font-medium">
                Loop (repeat continuously)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="muted"
                checked={localMuted}
                onChange={handleMutedChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="muted" className="text-sm font-medium">
                Muted (no sound by default)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="controls"
                checked={localControls}
                onChange={handleControlsChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="controls" className="text-sm font-medium">
                Show video controls
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="playsinline"
                checked={localPlaysinline}
                onChange={handlePlaysinlineChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="playsinline" className="text-sm font-medium">
                Play inline (mobile)
              </label>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-900">Play Button</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPlayButton"
                checked={localShowPlayButton}
                onChange={handleShowPlayButtonChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showPlayButton" className="text-sm font-medium">
                Show custom play button
              </label>
            </div>
            
            {localShowPlayButton && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-6">
                <div>
                  <label htmlFor="playButtonStyle" className="text-sm font-medium block mb-2">
                    Button Style
                  </label>
                  <select
                    id="playButtonStyle"
                    value={localPlayButtonStyle}
                    onChange={handlePlayButtonStyleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="playButtonSize" className="text-sm font-medium block mb-2">
                    Button Size
                  </label>
                  <select
                    id="playButtonSize"
                    value={localPlayButtonSize}
                    onChange={handlePlayButtonSizeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Styling Tab Component
  const StylingTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout & Appearance</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="fullHeight"
                checked={localFullHeight}
                onChange={handleFullHeightChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="fullHeight" className="text-sm font-medium">
                Full height (100vh)
              </label>
            </div>
            
            {!localFullHeight && (
              <div>
                <label htmlFor="maxHeight" className="text-sm font-medium block mb-2">
                  Max Height
                </label>
                <input
                  type="text"
                  id="maxHeight"
                  value={localMaxHeight}
                  onChange={handleMaxHeightChange}
                  placeholder="e.g., 500px, 50vh"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="objectFit" className="text-sm font-medium block mb-2">
                Video Fit
              </label>
              <select
                id="objectFit"
                value={localObjectFit}
                onChange={handleObjectFitChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cover">Cover (fill container)</option>
                <option value="contain">Contain (fit within container)</option>
                <option value="fill">Fill (stretch to fit)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overlay Settings</h3>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="overlayEnabled"
              checked={localOverlayEnabled}
              onChange={handleOverlayEnabledChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="overlayEnabled" className="text-sm font-medium">
              Enable overlay
            </label>
          </div>
          
          {localOverlayEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ColorSelector
                  label="Overlay Color"
                  value={localOverlayColor}
                  onChange={handleOverlayColorChange}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">
                  Overlay Opacity
                </label>
                <TransparencySelector
                  value={localOverlayOpacity}
                  onChange={handleOverlayOpacityChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Preview Tab Component
  const PreviewTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        <span className="text-sm text-gray-500">This is how your video section will look</span>
      </div>
      <div 
        className="border rounded-lg overflow-hidden bg-black relative"
        style={{ height: '400px' }}
      >
        {renderVideoContent()}
      </div>
    </div>
  );

  return (
    <>
      {/* Media selector modals */}
      {showVideoSelector && (
        <MediaSelector
          isOpen={showVideoSelector}
          onClose={() => setShowVideoSelector(false)}
          onSelect={handleVideoSelection}
          title="Select Video"
          initialType="video"
        />
      )}
      
      {showPosterSelector && (
        <MediaSelector
          isOpen={showPosterSelector}
          onClose={() => setShowPosterSelector(false)}
          onSelect={handlePosterSelection}
          title="Select Poster Image"
          initialType="image"
        />
      )}
      
      <section 
        className={cn(
          "relative w-full overflow-hidden flex items-center video-section",
          isEditing ? "min-h-[600px] h-auto py-8 bg-white" : "min-h-screen",
          localFullHeight && !isEditing ? "h-screen" : ""
        )}
        style={isEditing ? { 
          isolation: 'isolate',
          backgroundColor: '#ffffff' // Always white background in editor
        } : {
          height: localFullHeight ? '100vh' : localMaxHeight,
          minHeight: localFullHeight ? '100vh' : '400px',
          isolation: 'isolate'
        }}
      >
        {isEditing ? (
          <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
                <TabsTrigger 
                  value="content" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="video" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
                >
                  Media
                </TabsTrigger>
                <TabsTrigger 
                  value="styling" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
                >
                  Styles
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
                >
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Content Configuration</h3>
                  </div>
                  <div className="pl-6">
                    <ContentTab />
                  </div>
                </div>
              </TabsContent>

              {/* VIDEO TAB */}
              <TabsContent value="video" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Video Settings</h3>
                  </div>
                  <div className="pl-6">
                    <VideoTab />
                  </div>
                </div>
              </TabsContent>

              {/* STYLING TAB */}
              <TabsContent value="styling" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Visual Styling</h3>
                  </div>
                  <div className="pl-6">
                    <StylingTab />
                  </div>
                </div>
              </TabsContent>

              {/* PREVIEW TAB */}
              <TabsContent value="preview" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                  </div>
                  <div className="pl-6">
                    <PreviewTab />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {renderVideoContent()}
          </div>
        )}
      </section>
    </>
  );
});

export default VideoSection; 