'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import StableInput from './StableInput';
import { cn } from '@/lib/utils';
import { CmsTabs } from '@/components/cms/CmsTabs';
import { FileText, Palette, Settings, Eye, Monitor, PlayCircle, Image as ImageIcon } from 'lucide-react';
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling
} from '@/types/cms-styling';

interface SignageSectionProps extends ComponentStyleProps {
  title: string;
  subtitle: string;
  deviceCount?: number;
  playlistCount?: number;
  mediaCount?: number;
  showStats?: boolean;
  showDevicePreview?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  styling?: ComponentStyling;
  isEditing?: boolean;
  onUpdate?: (data: Partial<SignageSectionProps>) => void;
}

const SignageSection = React.memo(function SignageSection({
  title,
  subtitle,
  deviceCount = 0,
  playlistCount = 0,
  mediaCount = 0,
  showStats = true,
  showDevicePreview = true,
  ctaText = '',
  ctaUrl = '',
  styling = DEFAULT_STYLING,
  isEditing = false,
  onUpdate
}: SignageSectionProps) {
  // Local state for CMS editing
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [localDeviceCount, setLocalDeviceCount] = useState(deviceCount);
  const [localPlaylistCount, setLocalPlaylistCount] = useState(playlistCount);
  const [localMediaCount, setLocalMediaCount] = useState(mediaCount);
  const [localShowStats, setLocalShowStats] = useState(showStats);
  const [localShowDevicePreview, setLocalShowDevicePreview] = useState(showDevicePreview);
  const [localCtaText, setLocalCtaText] = useState(ctaText);
  const [localCtaUrl, setLocalCtaUrl] = useState(ctaUrl);
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);

  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (subtitle !== localSubtitle) setLocalSubtitle(subtitle);
      if (deviceCount !== localDeviceCount) setLocalDeviceCount(deviceCount);
      if (playlistCount !== localPlaylistCount) setLocalPlaylistCount(playlistCount);
      if (mediaCount !== localMediaCount) setLocalMediaCount(mediaCount);
      if (showStats !== localShowStats) setLocalShowStats(showStats);
      if (showDevicePreview !== localShowDevicePreview) setLocalShowDevicePreview(showDevicePreview);
      if (ctaText !== localCtaText) setLocalCtaText(ctaText);
      if (ctaUrl !== localCtaUrl) setLocalCtaUrl(ctaUrl);
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
    }
  }, [title, subtitle, deviceCount, playlistCount, mediaCount, showStats, showDevicePreview, ctaText, ctaUrl, styling,
      localTitle, localSubtitle, localDeviceCount, localPlaylistCount, localMediaCount, localShowStats, 
      localShowDevicePreview, localCtaText, localCtaUrl, localStyling]);

  // Optimized update function with debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleUpdateField = useCallback((field: string, value: string | number | boolean | ComponentStyling) => {
    if (onUpdate) {
      isEditingRef.current = true;
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<SignageSectionProps> = {
          [field]: value
        };
        
        onUpdate(updateData);
        
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate]);

  // Individual change handlers
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);

  const handleDeviceCountChange = useCallback((newValue: string) => {
    const count = parseInt(newValue) || 0;
    setLocalDeviceCount(count);
    handleUpdateField('deviceCount', count);
  }, [handleUpdateField]);

  const handlePlaylistCountChange = useCallback((newValue: string) => {
    const count = parseInt(newValue) || 0;
    setLocalPlaylistCount(count);
    handleUpdateField('playlistCount', count);
  }, [handleUpdateField]);

  const handleMediaCountChange = useCallback((newValue: string) => {
    const count = parseInt(newValue) || 0;
    setLocalMediaCount(count);
    handleUpdateField('mediaCount', count);
  }, [handleUpdateField]);

  const handleShowStatsChange = useCallback((newValue: boolean) => {
    setLocalShowStats(newValue);
    handleUpdateField('showStats', newValue);
  }, [handleUpdateField]);

  const handleShowDevicePreviewChange = useCallback((newValue: boolean) => {
    setLocalShowDevicePreview(newValue);
    handleUpdateField('showDevicePreview', newValue);
  }, [handleUpdateField]);

  const handleCtaTextChange = useCallback((newValue: string) => {
    setLocalCtaText(newValue);
    handleUpdateField('ctaText', newValue);
  }, [handleUpdateField]);

  const handleCtaUrlChange = useCallback((newValue: string) => {
    setLocalCtaUrl(newValue);
    handleUpdateField('ctaUrl', newValue);
  }, [handleUpdateField]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Device preview component
  const DevicePreview = () => (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-800 rounded-lg p-4 shadow-xl"
      >
        <div className="bg-black rounded aspect-video flex items-center justify-center text-white">
          <div className="text-center">
            <Monitor className="h-12 w-12 mx-auto mb-2 text-blue-400" />
            <p className="text-sm">Digital Display</p>
            <div className="mt-2 flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Online</span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
          <span>Device #001</span>
          <span>Playing: Playlist A</span>
        </div>
      </motion.div>
    </div>
  );

  // Stats component
  const StatsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Active Devices</p>
            <p className="text-3xl font-bold">{localDeviceCount}</p>
          </div>
          <Monitor className="h-8 w-8 opacity-60" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Playlists</p>
            <p className="text-3xl font-bold">{localPlaylistCount}</p>
          </div>
          <PlayCircle className="h-8 w-8 opacity-60" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Media Files</p>
            <p className="text-3xl font-bold">{localMediaCount}</p>
          </div>
          <ImageIcon className="h-8 w-8 opacity-60" />
        </div>
      </motion.div>
    </div>
  );

  // Render signage section content
  const renderSignageContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8"
      >
        <div>
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" 
            style={{ color: localStyling.textColor || '#ffffff' }}
            data-field-type="title" 
            data-component-type="Signage"
          >
            {localTitle}
          </h1>
          <p 
            className="text-xl opacity-90" 
            style={{ color: localStyling.textColor || '#ffffff' }}
            data-field-type="subtitle" 
            data-component-type="Signage"
          >
            {localSubtitle}
          </p>
        </div>

        {localShowStats && <StatsGrid />}

        {localCtaText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <a
              href={localCtaUrl || '#'}
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              data-field-type="ctaText"
              data-component-type="Signage"
            >
              {localCtaText}
            </a>
          </motion.div>
        )}
      </motion.div>

      {localShowDevicePreview && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
          data-field-type="showDevicePreview"
          data-component-type="Signage"
        >
          <DevicePreview />
        </motion.div>
      )}
    </div>
  );

  // Generate styles from styling
  const inlineStyles = generateStylesFromStyling(localStyling);

  return (
    <section 
      className={cn(
        "relative w-full overflow-hidden flex items-center",
        isEditing ? "min-h-[600px]" : "min-h-screen",
        "py-16 px-8"
      )}
      style={isEditing ? { 
        isolation: 'isolate',
        backgroundColor: '#1e293b' // Dark background for signage theme
      } : {
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        isolation: 'isolate',
        ...inlineStyles
      }}
    >
      <div className="w-full h-full relative z-10 flex items-center justify-center">
        {isEditing ? (
          <div className="w-full h-full p-6">
            <CmsTabs
              tabs={[
                {
                  id: "content",
                  label: "Content",
                  icon: <FileText className="w-4 h-4" />,
                  content: (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Content</h3>
                          
                          <StableInput
                            value={localTitle}
                            onChange={handleTitleChange}
                            placeholder="Section title..."
                            className="text-foreground font-bold text-xl"
                            label="Title"
                            debounceTime={300}
                            data-field-id="title"
                            data-component-type="Signage"
                          />
                          
                          <StableInput
                            value={localSubtitle}
                            onChange={handleSubtitleChange}
                            placeholder="Section subtitle..."
                            className="text-muted-foreground"
                            multiline={true}
                            label="Subtitle"
                            debounceTime={300}
                            data-field-id="subtitle"
                            data-component-type="Signage"
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                          
                          <StableInput
                            value={localDeviceCount.toString()}
                            onChange={handleDeviceCountChange}
                            placeholder="0"
                            label="Device Count"
                            type="number"
                            debounceTime={300}
                            data-field-id="deviceCount"
                            data-component-type="Signage"
                          />
                          
                          <StableInput
                            value={localPlaylistCount.toString()}
                            onChange={handlePlaylistCountChange}
                            placeholder="0"
                            label="Playlist Count"
                            type="number"
                            debounceTime={300}
                            data-field-id="playlistCount"
                            data-component-type="Signage"
                          />
                          
                          <StableInput
                            value={localMediaCount.toString()}
                            onChange={handleMediaCountChange}
                            placeholder="0"
                            label="Media Count"
                            type="number"
                            debounceTime={300}
                            data-field-id="mediaCount"
                            data-component-type="Signage"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700">Call to Action</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <StableInput
                            value={localCtaText}
                            onChange={handleCtaTextChange}
                            placeholder="Button text..."
                            label="CTA Text"
                            debounceTime={300}
                            data-field-id="ctaText"
                            data-component-type="Signage"
                          />
                          
                          <StableInput
                            value={localCtaUrl}
                            onChange={handleCtaUrlChange}
                            placeholder="Button URL..."
                            label="CTA URL"
                            debounceTime={300}
                            data-field-id="ctaUrl"
                            data-component-type="Signage"
                          />
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: "settings",
                  label: "Settings",
                  icon: <Settings className="w-4 h-4" />,
                  content: (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
                      
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="showStats"
                            checked={localShowStats}
                            onChange={(e) => handleShowStatsChange(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="showStats" className="text-sm font-medium text-gray-700">
                            Show statistics cards
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="showDevicePreview"
                            checked={localShowDevicePreview}
                            onChange={(e) => handleShowDevicePreviewChange(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="showDevicePreview" className="text-sm font-medium text-gray-700">
                            Show device preview
                          </label>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: "preview",
                  label: "Preview",
                  icon: <Eye className="w-4 h-4" />,
                  content: (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Signage Section Preview</h3>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <div className="p-4 bg-white border-b">
                          <h4 className="font-medium text-gray-900 mb-1">Live Preview</h4>
                          <p className="text-sm text-gray-600">This is how your signage section will appear to visitors</p>
                        </div>
                        
                        <div 
                          className="relative w-full overflow-hidden flex items-center min-h-[400px] p-8"
                          style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            color: '#ffffff'
                          }}
                        >
                          {renderSignageContent()}
                        </div>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </div>
        ) : (
          renderSignageContent()
        )}
      </div>
    </section>
  );
});

export default SignageSection; 