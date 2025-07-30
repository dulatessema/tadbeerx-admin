'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';

interface Nationality {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Language {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

type ReferenceDataType = 'nationalities' | 'skills' | 'languages';

interface ModalData {
  type: ReferenceDataType;
  mode: 'create' | 'edit';
  item?: Nationality | Skill | Language;
}

export default function ReferenceDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReferenceDataType>('nationalities');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    loadReferenceData();
  }, [router]);

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [nationalitiesResponse, skillsResponse, languagesResponse] = await Promise.all([
        api.getNationalities(),
        api.getSkills(),
        api.getLanguages(),
      ]);
      
      setNationalities(nationalitiesResponse.nationalities || []);
      setSkills(skillsResponse.skills || []);
      setLanguages(languagesResponse.languages || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      setNationalities([]);
      setSkills([]);
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: ReferenceDataType, mode: 'create' | 'edit', item?: any) => {
    setModalData({ type, mode, item });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  const handleToggleActive = async (type: ReferenceDataType, id: string) => {
    try {
      let currentItem: any;
      
      if (type === 'nationalities') {
        currentItem = nationalities.find(item => item.id === id);
        if (currentItem) {
          await api.updateNationality(id, { active: !currentItem.active });
          setNationalities(prev => prev.map(item => 
            item.id === id ? { ...item, active: !item.active } : item
          ));
        }
      } else if (type === 'skills') {
        currentItem = skills.find(item => item.id === id);
        if (currentItem) {
          await api.updateSkill(id, { active: !currentItem.active });
          setSkills(prev => prev.map(item => 
            item.id === id ? { ...item, active: !item.active } : item
          ));
        }
      } else if (type === 'languages') {
        currentItem = languages.find(item => item.id === id);
        if (currentItem) {
          await api.updateLanguage(id, { active: !currentItem.active });
          setLanguages(prev => prev.map(item => 
            item.id === id ? { ...item, active: !item.active } : item
          ));
        }
      }
    } catch (error) {
      console.error('Failed to toggle active status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (type: ReferenceDataType, id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        if (type === 'nationalities') {
          await api.deleteNationality(id);
          setNationalities(prev => prev.filter(item => item.id !== id));
        } else if (type === 'skills') {
          await api.deleteSkill(id);
          setSkills(prev => prev.filter(item => item.id !== id));
        } else if (type === 'languages') {
          await api.deleteLanguage(id);
          setLanguages(prev => prev.filter(item => item.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentData = activeTab === 'nationalities' ? nationalities : 
                     activeTab === 'skills' ? skills : languages;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('nationalities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'nationalities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GlobeAltIcon className="h-5 w-5 inline mr-2" />
              Nationalities
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'skills'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <WrenchScrewdriverIcon className="h-5 w-5 inline mr-2" />
              Skills
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'languages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LanguageIcon className="h-5 w-5 inline mr-2" />
              Languages
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white shadow rounded-lg">
          {/* Header with Add Button */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'nationalities' ? 'Manage Nationalities' :
               activeTab === 'skills' ? 'Manage Skills' : 'Manage Languages'}
            </h3>
            <button
              onClick={() => openModal(activeTab, 'create')}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add {activeTab === 'nationalities' ? 'Nationality' :
                   activeTab === 'skills' ? 'Skill' : 'Language'}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {activeTab === 'skills' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    {activeTab === 'skills' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item as Skill).category}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(activeTab, 'edit', item)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(activeTab, item.id)}
                        className={`${item.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={item.active ? 'Deactivate' : 'Activate'}
                      >
                        {item.active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(activeTab, item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No {activeTab} found.</p>
              <button
                onClick={() => openModal(activeTab, 'create')}
                className="mt-4 btn-primary"
              >
                Add First {activeTab === 'nationalities' ? 'Nationality' :
                         activeTab === 'skills' ? 'Skill' : 'Language'}
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && modalData && (
          <ReferenceDataModal
            data={modalData}
            onClose={closeModal}
            onSave={() => {
              closeModal();
              loadReferenceData();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface ReferenceDataModalProps {
  data: ModalData;
  onClose: () => void;
  onSave: () => void;
}

function ReferenceDataModal({ data, onClose, onSave }: ReferenceDataModalProps) {
  const [formData, setFormData] = useState({
    name: data.item?.name || '',
    category: (data.item as Skill)?.category || '',
    displayOrder: data.item?.displayOrder || 0,
    active: data.item?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (data.mode === 'create') {
        if (data.type === 'nationalities') {
          await api.createNationality({ name: formData.name, displayOrder: formData.displayOrder });
        } else if (data.type === 'skills') {
          await api.createSkill({ name: formData.name, category: formData.category, displayOrder: formData.displayOrder });
        } else if (data.type === 'languages') {
          await api.createLanguage({ name: formData.name, displayOrder: formData.displayOrder });
        }
      } else {
        if (data.type === 'nationalities' && data.item) {
          await api.updateNationality(data.item.id, { 
            name: formData.name, 
            displayOrder: formData.displayOrder,
            active: formData.active
          });
        } else if (data.type === 'skills' && data.item) {
          await api.updateSkill(data.item.id, { 
            name: formData.name, 
            category: formData.category,
            displayOrder: formData.displayOrder,
            active: formData.active
          });
        } else if (data.type === 'languages' && data.item) {
          await api.updateLanguage(data.item.id, { 
            name: formData.name, 
            displayOrder: formData.displayOrder,
            active: formData.active
          });
        }
      }
      onSave();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {data.mode === 'create' ? 'Add' : 'Edit'} {
            data.type === 'nationalities' ? 'Nationality' :
            data.type === 'skills' ? 'Skill' : 'Language'
          }
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {data.type === 'skills' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select w-full"
                required
              >
                <option value="">Select Category</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Cooking">Cooking</option>
                <option value="Childcare">Childcare</option>
                <option value="Eldercare">Eldercare</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
              className="input w-full"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-primary-600"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {data.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}