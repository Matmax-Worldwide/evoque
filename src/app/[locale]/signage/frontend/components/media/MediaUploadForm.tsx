// src/app/[locale]/signage/frontend/components/media/MediaUploadForm.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloudIcon, XIcon, FileIcon, ImagePlusIcon, Loader2 } from 'lucide-react'; // Added Loader2
import { toast } from 'sonner';

interface MediaUploadFormProps {
  onUpload: (formData: { name: string, type: string, file: File | null }) => Promise<void>;
  organizationId: string; // May not be directly used in form if parent handles it
  userId: string;       // May not be directly used in form
  onClose?: () => void; // Optional: to close a modal
}

const MediaUploadForm: React.FC<MediaUploadFormProps> = ({ onUpload, onClose }) => {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'IMAGE' | 'VIDEO' | 'AUDIO'>('IMAGE');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name); // Default name to filename
      if (selectedFile.type.startsWith('image/')) {
        setFileType('IMAGE');
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        setFileType('VIDEO');
        setPreview(null); // No easy video preview
      } else if (selectedFile.type.startsWith('audio/')) {
        setFileType('AUDIO');
        setPreview(null);
      } else {
        setFileType('IMAGE'); // Default to IMAGE if type is unknown or not visual
        setPreview(null);
        toast.warning("File type not fully recognized for preview, defaulting to IMAGE type.");
      }
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    try {
      await onUpload({
        name: fileName || file.name,
        type: fileType,
        file
      });
      // Parent component (MediaManagementPage) will show toast on success/failure from onUpload promise
      // and handle clearing/closing.
      // clearFile(); // Let parent decide if form should clear or modal should close
      // if(onClose) onClose();
    } catch (error) {
      // Error toast is handled by parent, or could be here if onUpload doesn't
      console.error("Upload submission error in form:", error);
      // toast.error("Upload failed in form."); // Avoid double toast if parent also toasts
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div>
        <Label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 ${isUploading ? 'opacity-50' : ''}`}>
          {preview && fileType === 'IMAGE' ? (
            <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
          ) : file ? (
             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileIcon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{file.name}</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(file.size / 1024)} KB</p>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImagePlusIcon className="w-10 h-10 mb-3 text-gray-400" /> {/* Changed icon */}
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Images, Videos, Audio files</p>
            </div>
          )}
          <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isUploading} />
        </Label>
        {file && (
            <Button variant="link" size="sm" onClick={clearFile} className="text-xs text-red-500 hover:text-red-700 mt-1 px-0" disabled={isUploading}>
                <XIcon className="w-3 h-3 mr-1"/> Clear selection
            </Button>
        )}
      </div>

      <div>
        <Label htmlFor="mediaName">Display Name</Label>
        <Input
          id="mediaName"
          type="text"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          placeholder="Defaults to filename"
          className="dark:bg-gray-700 dark:text-white"
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="mediaType">Media Type</Label>
        <Select
            value={fileType}
            onValueChange={(value: 'IMAGE' | 'VIDEO' | 'AUDIO') => setFileType(value)}
            disabled={isUploading || (!!file && (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')))}
        >
          <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white">
            <SelectValue placeholder="Select media type" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-700 dark:text-white">
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            {/* Add URL, WIDGET if needed and supported by backend enum */}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        {onClose && <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>}
        <Button type="submit" disabled={isUploading || !file} className="min-w-[100px]">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
        </Button>
      </div>
    </form>
  );
};

export default MediaUploadForm;
