'use client';

import { useState, useRef, memo } from 'react';
import { 
  PhotoIcon, 
  TrashIcon, 
  VideoCameraIcon,
  PlayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getToken } from '@/lib/auth';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  filename: string;
  originalName: string;
  path: string;
  url: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  uploadedAt: string;
  uploadedBy: string;
  order: number;
}

interface MediaSlots {
  image1Postcard?: MediaItem | null;
  image2?: MediaItem | null;
  image3?: MediaItem | null;
  videoThumbnail?: MediaItem | null;
  video1?: MediaItem | null;
}

interface MediaUploadProps {
  workerId: string;
  mediaSlots?: MediaSlots;
  onMediaUpdated?: () => void;
}

const defaultSlots: MediaSlots = {};

const MediaUpload = memo(function MediaUpload({
  workerId,
  mediaSlots = defaultSlots,
  onMediaUpdated,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSlot, setCurrentSlot] = useState<keyof MediaSlots | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentSlot) return;

    // Prevent multiple uploads
    if (uploading) {
      return;
    }

    // Validate file type based on slot
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (currentSlot === 'video1' && !isVideo) {
      setError('Video slot requires a video file');
      return;
    }
    
    if (currentSlot !== 'video1' && !isImage) {
      setError('Image slots require image files');
      return;
    }

    // Validate file size
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB for video, 5MB for image
    if (file.size > maxSize) {
      setError(`File size must be less than ${isVideo ? '100MB' : '5MB'}`);
      return;
    }

    await uploadMedia(file, currentSlot);
  };

  const uploadMedia = async (file: File, slotType: keyof MediaSlots) => {
    console.log('🚀 MediaUpload.uploadMedia - Starting upload');
    console.log('📋 Upload parameters:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      slotType,
      workerId
    });

    setUploading(slotType);
    setError(null);

    try {
      console.log('🔐 Getting authentication token');
      const token = getToken();
      if (!token) {
        console.error('❌ No authentication token found');
        throw new Error('No authentication token found. Please log in to the admin panel first.');
      }
      console.log('✅ Authentication token retrieved');

      console.log('📦 Creating FormData');
      const formData = new FormData();
      formData.append('media', file);
      formData.append('slotType', slotType);
      
      // Log FormData contents for debugging
      console.log('📋 FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const uploadUrl = `http://localhost:3000/api/media/workers/${workerId}/slots`;
      console.log('📤 Making upload request to:', uploadUrl);
      console.log('🔐 Using Authorization header:', `Bearer ${token.substring(0, 20)}...`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📨 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      if (!response.ok) {
        console.error('❌ Upload request failed with status:', response.status);
        let errorMessage = `HTTP ${response.status}`;
        
        if (response.status === 401) {
          console.error('❌ Authentication failed (401)');
          errorMessage = 'Authentication failed. Please log in again.';
          // Optionally redirect to login
          // window.location.href = '/login';
        } else {
          try {
            console.log('📄 Attempting to parse error response');
            const errorData = await response.json();
            console.log('📋 Error response data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.warn('⚠️ Could not parse error response as JSON:', e);
            // If can't parse JSON, use status message
          }
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Upload request successful, parsing response');
      const result = await response.json();
      console.log('📋 Upload result:', result);

      console.log('🔄 Calling onMediaUpdated callback');
      // Call the callback to refresh data
      if (onMediaUpdated) {
        onMediaUpdated();
      } else {
        console.warn('⚠️ No onMediaUpdated callback provided');
      }

      console.log('🎉 Upload completed successfully!');
    } catch (err: any) {
      console.error('💥 Upload failed:', err);
      console.error('📋 Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Upload failed');
    } finally {
      console.log('🧹 Cleaning up upload state');
      setUploading(null);
      setCurrentSlot(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        console.log('✅ File input reset');
      }
    }
  };

  const handleDeleteMedia = async (slotType: keyof MediaSlots) => {
    const media = mediaSlots[slotType];
    if (!media) return;
    
    setDeleting(media.id);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/media/workers/${workerId}/slots/${slotType}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      onMediaUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadClick = (slotType: keyof MediaSlots) => {
    // Prevent multiple clicks while uploading
    if (uploading) {
      return;
    }
    
    setCurrentSlot(slotType);
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMediaSlot = (
    slotType: keyof MediaSlots,
    title: string,
    description: string,
    acceptTypes: string
  ) => {
    const media = mediaSlots[slotType];
    const isVideo = slotType === 'video1';
    
    // Debug logging for media URLs
    if (media) {
      console.log(`🖼️ ${slotType} media:`, {
        url: media.url,
        filename: media.filename,
        type: media.type
      });
    }
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          {media && (
            <button
              type="button"
              onClick={() => handleDeleteMedia(slotType)}
              disabled={deleting === media.id}
              className="text-red-600 hover:text-red-700 text-sm flex items-center"
              title="Delete media"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              {deleting === media.id ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Media Preview */}
          <div className="flex-shrink-0">
            {media ? (
              <div className="relative">
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={title}
                    className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200"
                    onLoad={() => console.log(`✅ Image loaded successfully: ${media.url}`)}
                    onError={(e) => {
                      console.error(`❌ Image failed to load: ${media.url}`);
                      console.error('Error details:', e);
                    }}
                  />
                ) : (
                  <div className="relative h-20 w-20 rounded-lg border-2 border-gray-200 overflow-hidden">
                    {media.thumbnailUrl ? (
                      <img
                        src={media.thumbnailUrl}
                        alt="Video thumbnail"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                        <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-1">
                        <PlayIcon className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-20 w-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                {isVideo ? (
                  <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                ) : (
                  <PhotoIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <button
              type="button"
              onClick={() => handleUploadClick(slotType)}
              disabled={uploading === slotType}
              className="btn-primary text-sm mb-2"
            >
              {uploading === slotType ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  {isVideo ? (
                    <VideoCameraIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <PhotoIcon className="h-4 w-4 mr-2" />
                  )}
                  {media ? 'Replace' : 'Upload'} {isVideo ? 'Video' : 'Image'}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500">
              {acceptTypes}
            </p>

            {media && (
              <div className="text-xs text-gray-500 mt-1">
                <p>{media.originalName}</p>
                <p>{formatFileSize(media.size)}</p>
                {media.duration && <p>Duration: {formatDuration(media.duration)}</p>}
                {media.width && media.height && <p>{media.width}×{media.height}px</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!!uploading}
      />

      {/* Header */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-medium text-gray-900">Worker Media</h3>
        <p className="text-sm text-gray-500">Upload exactly 5 media files: 4 images and 1 video</p>
      </div>

      {/* Media Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderMediaSlot(
          'image1Postcard',
          'Image 1 - Postcard',
          'Main profile image (postcard style)',
          'JPEG, PNG, WebP (400×600px recommended, max 5MB)'
        )}

        {renderMediaSlot(
          'image2',
          'Image 2',
          'Additional profile image',
          'JPEG, PNG, WebP (400×600px recommended, max 5MB)'
        )}

        {renderMediaSlot(
          'image3',
          'Image 3',
          'Additional profile image',
          'JPEG, PNG, WebP (400×600px recommended, max 5MB)'
        )}

        {renderMediaSlot(
          'videoThumbnail',
          'Image 4 - Video Thumbnail',
          'Custom thumbnail for video (user-generated)',
          'JPEG, PNG, WebP (400×600px recommended, max 5MB)'
        )}

        {renderMediaSlot(
          'video1',
          'Video 1',
          'Profile introduction video',
          'MP4, WebM, MOV (max 100MB, 5min duration)'
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
});

export default MediaUpload;