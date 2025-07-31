'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import MediaUpload from '@/components/MediaUpload';
import { Worker, Nationality, Skill, Language } from '@/types';
import {
  PencilIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface WorkerFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    age: number | '';
    nationalityId: string;
    phoneNumber: string;
    email: string;
  };
  professionalInfo: {
    skillIds: string[];
    languageIds: string[];
    experience: number | '';
    additionalInfo: string;
  };
  fieldVisibility: {
    personalInfo: {
      firstName: boolean;
      lastName: boolean;
      age: boolean;
      nationality: boolean;
      phone: boolean;
      email: boolean;
    };
    professionalInfo: {
      skills: boolean;
      languages: boolean;
      experience: boolean;
      additionalInfo: boolean;
    };
  };
  status: 'available' | 'hired' | 'inactive';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  featured: boolean;
}

export default function EditWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referenceData, setReferenceData] = useState<{
    nationalities: Nationality[];
    skills: Skill[];
    languages: Language[];
  }>({ nationalities: [], skills: [], languages: [] });
  const [workerMedia, setWorkerMedia] = useState<{
    slots: {
      image1Postcard?: any;
      image2?: any;
      image3?: any;
      video1?: any;
    };
  }>({ slots: {} });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    
    if (workerId) {
      loadWorkerData();
    }
  }, [router, workerId]);

  const loadWorkerData = async () => {
    try {
      const [workerResponse, referenceResponse, mediaResponse] = await Promise.all([
        api.getWorker(workerId),
        api.getReferenceData(),
        loadWorkerMedia(workerId)
      ]);

      const workerData = workerResponse.worker;
      setWorker(workerData);
      setReferenceData(referenceResponse);

      // Set form data from worker
      setFormData({
        personalInfo: {
          firstName: workerData.personalInfo?.firstName || '',
          lastName: workerData.personalInfo?.lastName || '',
          age: workerData.personalInfo?.age || '',
          nationalityId: workerData.personalInfo?.nationalityId || '',
          phoneNumber: workerData.personalInfo?.phoneNumber || '',
          email: workerData.personalInfo?.email || '',
        },
        professionalInfo: {
          skillIds: workerData.professionalInfo?.skillIds || [],
          languageIds: workerData.professionalInfo?.languageIds || [],
          experience: workerData.professionalInfo?.experience || '',
          additionalInfo: workerData.professionalInfo?.additionalInfo || '',
        },
        fieldVisibility: {
          personalInfo: {
            firstName: workerData.fieldVisibility?.personalInfo?.firstName ?? true,
            lastName: workerData.fieldVisibility?.personalInfo?.lastName ?? true,
            age: workerData.fieldVisibility?.personalInfo?.age ?? true,
            nationality: workerData.fieldVisibility?.personalInfo?.nationality ?? true,
            phone: workerData.fieldVisibility?.personalInfo?.phone ?? false,
            email: workerData.fieldVisibility?.personalInfo?.email ?? false,
          },
          professionalInfo: {
            skills: workerData.fieldVisibility?.professionalInfo?.skills ?? true,
            languages: workerData.fieldVisibility?.professionalInfo?.languages ?? true,
            experience: workerData.fieldVisibility?.professionalInfo?.experience ?? true,
            additionalInfo: workerData.fieldVisibility?.professionalInfo?.additionalInfo ?? true,
          },
        },
        status: workerData.status,
        approvalStatus: workerData.approvalStatus,
        featured: workerData.featured,
      });
    } catch (error: any) {
      console.error('Failed to load worker data:', error);
      setErrors({ load: error.message || 'Failed to load worker data' });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkerMedia = async (workerId: string) => {
    try {
      const response = await fetch(`https://tadbeerx-api.vercel.app/api/media/workers/${workerId}/slots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkerMedia({ slots: data.slots || {} });
        return data;
      }
    } catch (error) {
      console.error('Failed to load worker media:', error);
    }
    return { slots: {} };
  };

  const handleMediaUpdated = useCallback(() => {
    loadWorkerMedia(workerId);
  }, [workerId]);

  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};

    if (!formData.personalInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.personalInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.personalInfo.age && (formData.personalInfo.age < 18 || formData.personalInfo.age > 65)) {
      newErrors.age = 'Age must be between 18 and 65';
    }

    if (formData.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.professionalInfo.skillIds.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }

    if (formData.professionalInfo.experience && formData.professionalInfo.experience < 0) {
      newErrors.experience = 'Experience cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const submitData = {
        ...formData,
        personalInfo: {
          ...formData.personalInfo,
          age: formData.personalInfo.age || undefined,
        },
        professionalInfo: {
          ...formData.professionalInfo,
          experience: formData.professionalInfo.experience || undefined,
        },
      };

      await api.updateWorker(workerId, submitData);
      
      // Redirect to workers list with success message
      router.push('/workers?updated=true');
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to update worker. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      professionalInfo: {
        ...prev!.professionalInfo,
        skillIds: prev!.professionalInfo.skillIds.includes(skillId)
          ? prev!.professionalInfo.skillIds.filter(id => id !== skillId)
          : [...prev!.professionalInfo.skillIds, skillId],
      },
    }));
  };

  const handleLanguageToggle = (languageId: string) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      professionalInfo: {
        ...prev!.professionalInfo,
        languageIds: prev!.professionalInfo.languageIds.includes(languageId)
          ? prev!.professionalInfo.languageIds.filter(id => id !== languageId)
          : [...prev!.professionalInfo.languageIds, languageId],
      },
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (errors.load) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{errors.load}</p>
            <button onClick={() => router.back()} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!worker || !formData) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Worker not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="btn-secondary flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <PencilIcon className="h-8 w-8 mr-3 text-primary-600" />
              Edit Worker: {formData.personalInfo.firstName} {formData.personalInfo.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update worker profile and manage media
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3 mb-6">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          value={formData.personalInfo.firstName}
                          onChange={(e) => setFormData(prev => ({
                            ...prev!,
                            personalInfo: { ...prev!.personalInfo, firstName: e.target.value }
                          }))}
                          className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
                        />
                        {errors.firstName && <p className="form-error">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          value={formData.personalInfo.lastName}
                          onChange={(e) => setFormData(prev => ({
                            ...prev!,
                            personalInfo: { ...prev!.personalInfo, lastName: e.target.value }
                          }))}
                          className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
                        />
                        {errors.lastName && <p className="form-error">{errors.lastName}</p>}
                      </div>

                      <div>
                        <label className="form-label">Age</label>
                        <input
                          type="number"
                          min="18"
                          max="65"
                          value={formData.personalInfo.age}
                          onChange={(e) => setFormData(prev => ({
                            ...prev!,
                            personalInfo: { ...prev!.personalInfo, age: e.target.value ? parseInt(e.target.value) : '' }
                          }))}
                          className={`form-input ${errors.age ? 'border-red-500' : ''}`}
                        />
                        {errors.age && <p className="form-error">{errors.age}</p>}
                      </div>

                      <div>
                        <label className="form-label">Nationality</label>
                        <div className="flex flex-wrap gap-2">
                          {referenceData.nationalities.map(nationality => (
                            <button
                              key={nationality.id}
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev!,
                                personalInfo: { 
                                  ...prev!.personalInfo, 
                                  nationalityId: prev!.personalInfo.nationalityId === nationality.id ? '' : nationality.id 
                                }
                              }))}
                              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                                formData.personalInfo.nationalityId === nationality.id
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                              }`}
                            >
                              {nationality.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.personalInfo.phoneNumber}
                          onChange={(e) => setFormData(prev => ({
                            ...prev!,
                            personalInfo: { ...prev!.personalInfo, phoneNumber: e.target.value }
                          }))}
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          value={formData.personalInfo.email}
                          onChange={(e) => setFormData(prev => ({
                            ...prev!,
                            personalInfo: { ...prev!.personalInfo, email: e.target.value }
                          }))}
                          className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                      </div>
                    </div>
                  </div>

          {/* Professional Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3 mb-6">
              Professional Information
            </h3>
            
            <div>
                      <label className="form-label">Skills * <span className="text-xs text-gray-500">Select multiple</span></label>
                      <div className="flex flex-wrap gap-2">
                        {referenceData.skills.map(skill => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id)}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                              formData.professionalInfo.skillIds.includes(skill.id)
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                            }`}
                          >
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-xs opacity-75 ml-1">({skill.category})</span>
                          </button>
                        ))}
                      </div>
                      {errors.skills && <p className="form-error">{errors.skills}</p>}
                    </div>

                    <div>
                      <label className="form-label">Languages <span className="text-xs text-gray-500">Select multiple</span></label>
                      <div className="flex flex-wrap gap-2">
                        {referenceData.languages.map(language => (
                          <button
                            key={language.id}
                            type="button"
                            onClick={() => handleLanguageToggle(language.id)}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                              formData.professionalInfo.languageIds.includes(language.id)
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                            }`}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.professionalInfo.experience}
                        onChange={(e) => setFormData(prev => ({
                          ...prev!,
                          professionalInfo: { ...prev!.professionalInfo, experience: e.target.value ? parseInt(e.target.value) : '' }
                        }))}
                        className={`form-input ${errors.experience ? 'border-red-500' : ''}`}
                      />
                      {errors.experience && <p className="form-error">{errors.experience}</p>}
                    </div>

                    <div>
                      <label className="form-label">Additional Information</label>
                      <textarea
                        rows={4}
                        value={formData.professionalInfo.additionalInfo}
                        onChange={(e) => setFormData(prev => ({
                          ...prev!,
                          professionalInfo: { ...prev!.professionalInfo, additionalInfo: e.target.value }
                        }))}
                        className="form-input"
                      />
                    </div>

                    {/* Status Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Status</label>
                        <div className="flex gap-2">
                          {[
                            { value: 'available', label: 'Available', color: 'green' },
                            { value: 'hired', label: 'Hired', color: 'blue' },
                            { value: 'inactive', label: 'Inactive', color: 'gray' }
                          ].map(status => (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev!,
                                status: status.value as 'available' | 'hired' | 'inactive'
                              }))}
                              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                                formData.status === status.value
                                  ? status.color === 'green' 
                                      ? 'bg-green-600 text-white border-green-600'
                                      : status.color === 'blue'
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-gray-600 text-white border-gray-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                              }`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Approval Status</label>
                        <div className="flex gap-2">
                          {[
                            { value: 'pending', label: 'Pending', color: 'yellow' },
                            { value: 'approved', label: 'Approved', color: 'green' },
                            { value: 'rejected', label: 'Rejected', color: 'red' }
                          ].map(status => (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev!,
                                approvalStatus: status.value as 'pending' | 'approved' | 'rejected'
                              }))}
                              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                                formData.approvalStatus === status.value
                                  ? status.color === 'green' 
                                      ? 'bg-green-600 text-white border-green-600'
                                      : status.color === 'yellow'
                                      ? 'bg-yellow-600 text-white border-yellow-600'
                                      : 'bg-red-600 text-white border-red-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                              }`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">
                        Featured Worker
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev!,
                            featured: false
                          }))}
                          className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                            !formData.featured
                              ? 'bg-gray-600 text-white border-gray-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          Regular
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev!,
                            featured: true
                          }))}
                          className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                            formData.featured
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          Featured
                        </button>
                      </div>
                    </div>
                  </div>

          {/* Media Upload Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3 mb-6">
              Media Upload
            </h3>
            
            <MediaUpload
              workerId={workerId}
              mediaSlots={workerMedia.slots}
              onMediaUpdated={handleMediaUpdated}
            />
          </div>

          {/* Form Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating Worker...
                      </div>
                    ) : (
                      <>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Update Worker
                      </>
                    )}
                  </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}