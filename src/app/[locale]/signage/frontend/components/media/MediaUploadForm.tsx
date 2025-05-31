// src/app/[locale/signage/frontend/components/media/MediaUploadForm.tsx

import React, { useState } from 'react';

// Placeholder for UploadMediaInput type
// import { UploadMediaInput } from '../../../backend/graphql/types/media.types';

interface MediaUploadFormProps {
  // onUpload: (input: UploadMediaInput, file: File) => Promise<void>;
  onUpload: (formData: {name: string, type: string, file: File | null}) => Promise<void>;
  organizationId: string;
  userId: string; // Current user
}

const MediaUploadForm: React.FC<MediaUploadFormProps> = ({ onUpload, organizationId, userId }) => {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file.');
      return;
    }
    setIsUploading(true);
    try {
      // In a real app, the onUpload function would handle the GraphQL mutation
      // and actual file upload (e.g., to S3 via pre-signed URL).
      // The input to GraphQL mutation would be metadata.
      await onUpload({name: fileName || file.name, type: fileType, file});
      setFileName('');
      setFile(null);
      alert('Media uploaded successfully (simulated)!');
    } catch (error) {
      alert('Upload failed (simulated).');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Upload Media</h3>
      <div>
        <label htmlFor="mediaName">Name:</label>
        <input
          id="mediaName"
          type="text"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          placeholder="Defaults to filename"
        />
      </div>
      <div>
        <label htmlFor="mediaFile">File:</label>
        <input
          id="mediaFile"
          type="file"
          onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
          required
        />
      </div>
       <div>
        <label htmlFor="mediaType">Type:</label>
        <select value={fileType} onChange={e => setFileType(e.target.value as 'IMAGE' | 'VIDEO')}>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
        </select>
      </div>
      <button type="submit" disabled={isUploading || !file}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
};
export default MediaUploadForm;
