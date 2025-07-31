'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '@/lib/auth';
import { Worker } from '@/types';
import PhotoUpload from '@/components/PhotoUpload';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckBadgeIcon,
  XMarkIcon,
  UserIcon,
  GlobeAltIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;
  
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    
    if (workerId) {
      loadWorker();
      loadWorkerPhotos();
    }
  }, [workerId, router]);

  const loadWorker = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://tadbeerx-api.vercel.app/api/workers/admin/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load worker');
      }

      const data = await response.json();
      setWorker(data.worker);
    } catch (err: any) {
      setError(err.message || 'Failed to load worker');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkerPhotos = async () => {
    try {
      const response = await fetch(`https://tadbeerx-api.vercel.app/api/media/workers/${workerId}/photos`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPhoto(data.photos.profilePhoto);
      }
    } catch (err) {
      console.warn('Could not load worker photos');
    }
  };

  const handlePhotoUploaded = (photo: any) => {
    setCurrentPhoto(photo);
  };

  const handlePhotoDeleted = () => {
    setCurrentPhoto(null);
  };

  const handleStatusUpdate = async (field: string, value: any) => {
    try {
      const response = await fetch(`https://tadbeerx-api.vercel.app/api/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update worker');
      }

      // Reload worker data
      await loadWorker();
    } catch (err: any) {
      setError(err.message || 'Failed to update worker');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Worker Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'Worker could not be loaded'}</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const personalInfo = worker.personalInfo || {};
  const professionalInfo = worker.professionalInfo || {};
  const visibility = worker.fieldVisibility || {};

  const getWorkerName = () => {
    const firstName = personalInfo.firstName || 'Worker';
    const lastName = personalInfo.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-md"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {getWorkerName()}
              </h1>
              {worker.approvalStatus === 'approved' && (
                <CheckBadgeIcon className="h-6 w-6 text-success-500 ml-2" />
              )}
            </div>
            <div className="flex space-x-3">
              <button className="btn-secondary">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <select
                          value={worker.status}
                          onChange={(e) => handleStatusUpdate('status', e.target.value)}
                          className="form-input text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="hired">Hired</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Approval Status</dt>
                      <dd className="mt-1">
                        <select
                          value={worker.approvalStatus}
                          onChange={(e) => handleStatusUpdate('approvalStatus', e.target.value)}
                          className="form-input text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Age</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {personalInfo.age || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Experience</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {professionalInfo.experience ? `${professionalInfo.experience} years` : 'Not specified'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Professional Info */}
              {professionalInfo.additionalInfo && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-700">{professionalInfo.additionalInfo}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Photo Upload */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                </div>
                <div className="px-6 py-4">
                  <PhotoUpload
                    workerId={workerId}
                    currentPhoto={currentPhoto}
                    onPhotoUploaded={handlePhotoUploaded}
                    onPhotoDeleted={handlePhotoDeleted}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Profile Views</dt>
                      <dd className="text-sm font-medium text-gray-900">{worker.viewCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Contact Requests</dt>
                      <dd className="text-sm font-medium text-gray-900">{worker.contactCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Profile Completion</dt>
                      <dd className="text-sm font-medium text-gray-900">{worker.profileCompletionScore}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Featured</dt>
                      <dd>
                        <button
                          onClick={() => handleStatusUpdate('featured', !worker.featured)}
                          className={`text-sm px-2 py-1 rounded ${
                            worker.featured 
                              ? 'bg-warning-100 text-warning-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {worker.featured ? 'Featured' : 'Not Featured'}
                        </button>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}