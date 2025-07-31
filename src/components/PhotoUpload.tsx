'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getToken } from '@/lib/auth';

interface PhotoUploadProps {
  workerId: string;
  currentPhoto?: {
    id: string;
    filename: string;
    path: string;
    url: string;
  } | null;
  onPhotoUploaded?: (photo: any) => void;
  onPhotoDeleted?: () => void;
}

export default function PhotoUpload({
  workerId,
  currentPhoto,
  onPhotoUploaded,
  onPhotoDeleted,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`https://tadbeerx-api.vercel.app/api/media/workers/${workerId}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onPhotoUploaded?.(data.media);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!currentPhoto) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`https://tadbeerx-api.vercel.app/api/media/workers/${workerId}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      onPhotoDeleted?.();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Profile Photo</h3>
        {currentPhoto && (
          <button
            onClick={handleDeletePhoto}
            disabled={deleting}
            className="text-danger-600 hover:text-danger-700 text-sm flex items-center"
            title="Delete photo"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Photo Preview */}
        <div className="flex-shrink-0">
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              alt="Worker profile"
              className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="btn-primary text-sm"
          >
            {uploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              <>
                <PhotoIcon className="h-4 w-4 mr-2" />
                {currentPhoto ? 'Replace Photo' : 'Upload Photo'}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-1">
            Images: JPEG, PNG, WebP (200x200 to 1920x1920px, max 5MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-md p-3">
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}
    </div>
  );
}