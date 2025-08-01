'use client';

import { useState } from 'react';

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

export default function BlobTestPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      setError('Please select a file');
      setUploading(false);
      return;
    }

    try {
      console.log('🔄 Starting blob test upload...');
      
      const testFormData = new FormData();
      testFormData.append('file', file);

      const response = await fetch('/api/blob-test/upload', {
        method: 'POST',
        body: testFormData,
      });

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);

      setUploadedFiles(prev => [...prev, {
        url: result.url,
        filename: result.filename || file.name,
        size: result.size || file.size
      }]);

      // Reset form
      (e.target as HTMLFormElement).reset();

    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const response = await fetch('/api/blob-test/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setUploadedFiles(prev => prev.filter(file => file.url !== url));
      console.log('✅ File deleted successfully');

    } catch (err: any) {
      console.error('❌ Delete error:', err);
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Blob Storage Test</h1>

        {/* Upload Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Test File</h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                type="file"
                name="file"
                id="file"
                accept="image/*,video/*,.pdf,.txt,.doc,.docx"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files ({uploadedFiles.length})</h2>
          
          {uploadedFiles.length === 0 ? (
            <p className="text-gray-500">No files uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{file.filename}</h3>
                      <p className="text-sm text-gray-500">
                        Size: {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-sm text-gray-500 break-all">
                        URL: <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">{file.url}</a>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(file.url)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Test Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• This page tests direct blob storage upload/delete functionality</li>
            <li>• Files are uploaded to Vercel Blob Storage with public access</li>
            <li>• Check browser console and server logs for detailed debugging info</li>
            <li>• Successful uploads will show the file URL and allow viewing/deletion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}