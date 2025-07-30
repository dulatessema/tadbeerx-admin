'use client';

import { useState, useEffect } from 'react';
import { Worker, Nationality, Skill, Language } from '@/types';
import { api } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MediaUpload from './MediaUpload';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: Worker | null;
  onSave: () => void;
  nationalities: Nationality[];
  skills: Skill[];
  languages: Language[];
}

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

const initialFormData: WorkerFormData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    age: '',
    nationalityId: '',
    phoneNumber: '',
    email: '',
  },
  professionalInfo: {
    skillIds: [],
    languageIds: [],
    experience: '',
    additionalInfo: '',
  },
  fieldVisibility: {
    personalInfo: {
      firstName: true,
      lastName: true,
      age: true,
      nationality: true,
      phone: false,
      email: false,
    },
    professionalInfo: {
      skills: true,
      languages: true,
      experience: true,
      additionalInfo: true,
    },
  },
  status: 'available',
  approvalStatus: 'pending',
  featured: false,
};

export default function WorkerModal({
  isOpen,
  onClose,
  worker,
  onSave,
  nationalities,
  skills,
  languages,
}: WorkerModalProps) {
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [workerMedia, setWorkerMedia] = useState<{
    slots: {
      image1Postcard?: any;
      image2?: any;
      image3?: any;
      video1?: any;
    };
  }>({ slots: {} });

  const loadWorkerMedia = async (workerId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/media/workers/${workerId}/slots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkerMedia({ slots: data.slots || {} });
      }
    } catch (error) {
      console.error('Failed to load worker media:', error);
    }
  };

  useEffect(() => {
    if (worker) {
      setFormData({
        personalInfo: {
          firstName: worker.personalInfo?.firstName || '',
          lastName: worker.personalInfo?.lastName || '',
          age: worker.personalInfo?.age || '',
          nationalityId: worker.personalInfo?.nationalityId || '',
          phoneNumber: worker.personalInfo?.phoneNumber || '',
          email: worker.personalInfo?.email || '',
        },
        professionalInfo: {
          skillIds: worker.professionalInfo?.skillIds || [],
          languageIds: worker.professionalInfo?.languageIds || [],
          experience: worker.professionalInfo?.experience || '',
          additionalInfo: worker.professionalInfo?.additionalInfo || '',
        },
        fieldVisibility: {
          personalInfo: {
            firstName: worker.fieldVisibility?.personalInfo?.firstName ?? true,
            lastName: worker.fieldVisibility?.personalInfo?.lastName ?? true,
            age: worker.fieldVisibility?.personalInfo?.age ?? true,
            nationality: worker.fieldVisibility?.personalInfo?.nationality ?? true,
            phone: worker.fieldVisibility?.personalInfo?.phone ?? false,
            email: worker.fieldVisibility?.personalInfo?.email ?? false,
          },
          professionalInfo: {
            skills: worker.fieldVisibility?.professionalInfo?.skills ?? true,
            languages: worker.fieldVisibility?.professionalInfo?.languages ?? true,
            experience: worker.fieldVisibility?.professionalInfo?.experience ?? true,
            additionalInfo: worker.fieldVisibility?.professionalInfo?.additionalInfo ?? true,
          },
        },
        status: worker.status,
        approvalStatus: worker.approvalStatus,
        featured: worker.featured,
      });
      
      // Load media for existing worker
      loadWorkerMedia(worker.id);
    } else {
      setFormData(initialFormData);
      setWorkerMedia({ slots: {} });
    }
    setErrors({});
  }, [worker, isOpen]);

  const validateForm = (): boolean => {
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

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

      if (worker) {
        await api.updateWorker(worker.id, submitData);
      } else {
        await api.createWorker(submitData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving worker:', error);
      setErrors({ submit: 'Failed to save worker. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        skillIds: prev.professionalInfo.skillIds.includes(skillId)
          ? prev.professionalInfo.skillIds.filter(id => id !== skillId)
          : [...prev.professionalInfo.skillIds, skillId],
      },
    }));
  };

  const handleLanguageToggle = (languageId: string) => {
    setFormData(prev => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        languageIds: prev.professionalInfo.languageIds.includes(languageId)
          ? prev.professionalInfo.languageIds.filter(id => id !== languageId)
          : [...prev.professionalInfo.languageIds, languageId],
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {worker ? 'Edit Worker' : 'Add New Worker'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {errors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Personal Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                      }))}
                      className={`w-full border rounded-md px-3 py-2 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                      }))}
                      className={`w-full border rounded-md px-3 py-2 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="65"
                      value={formData.personalInfo.age}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, age: e.target.value ? parseInt(e.target.value) : '' }
                      }))}
                      className={`w-full border rounded-md px-3 py-2 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <select
                      value={formData.personalInfo.nationalityId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, nationalityId: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Nationality</option>
                      {nationalities.map(nationality => (
                        <option key={nationality.id} value={nationality.id}>
                          {nationality.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.personalInfo.phoneNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phoneNumber: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className={`w-full border rounded-md px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Professional Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills *
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {skills.map(skill => (
                        <label key={skill.id} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            checked={formData.professionalInfo.skillIds.includes(skill.id)}
                            onChange={() => handleSkillToggle(skill.id)}
                            className="mr-2"
                          />
                          <span className="text-sm">{skill.name}</span>
                          <span className="text-xs text-gray-500 ml-1">({skill.category})</span>
                        </label>
                      ))}
                    </div>
                    {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {languages.map(language => (
                        <label key={language.id} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            checked={formData.professionalInfo.languageIds.includes(language.id)}
                            onChange={() => handleLanguageToggle(language.id)}
                            className="mr-2"
                          />
                          <span className="text-sm">{language.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.professionalInfo.experience}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        professionalInfo: { ...prev.professionalInfo, experience: e.target.value ? parseInt(e.target.value) : '' }
                      }))}
                      className={`w-full border rounded-md px-3 py-2 ${errors.experience ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Information
                    </label>
                    <textarea
                      rows={3}
                      value={formData.professionalInfo.additionalInfo}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        professionalInfo: { ...prev.professionalInfo, additionalInfo: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Any additional information about the worker..."
                    />
                  </div>

                  {/* Status Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          status: e.target.value as 'available' | 'hired' | 'inactive'
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="available">Available</option>
                        <option value="hired">Hired</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Approval Status
                      </label>
                      <select
                        value={formData.approvalStatus}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          approvalStatus: e.target.value as 'pending' | 'approved' | 'rejected'
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          featured: e.target.checked
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Featured Worker</span>
                    </label>
                  </div>
                </div>

                {/* Media Upload - Only show for existing workers */}
                {worker && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Media</h4>
                    <MediaUpload
                      workerId={worker.id}
                      mediaSlots={workerMedia.slots}
                      onMediaUpdated={() => loadWorkerMedia(worker.id)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : (worker ? 'Update Worker' : 'Create Worker')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}