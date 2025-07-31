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
} from '@heroicons/react/24/outline';

interface Skill {
  id: string;
  name: string;
  category: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModalData {
  mode: 'create' | 'edit';
  item?: Skill;
}

export default function SkillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    loadSkills();
  }, [router]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await api.getSkills();
      setSkills(response.skills || []);
    } catch (error) {
      console.error('Failed to load skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: 'create' | 'edit', item?: Skill) => {
    setModalData({ mode, item });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const currentItem = skills.find(item => item.id === id);
      if (currentItem) {
        await api.updateSkill(id, { active: !currentItem.active });
        setSkills(prev => prev.map(item => 
          item.id === id ? { ...item, active: !item.active } : item
        ));
      }
    } catch (error) {
      console.error('Failed to toggle active status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      try {
        await api.deleteSkill(id);
        setSkills(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Failed to delete skill:', error);
        alert('Failed to delete skill. Please try again.');
      }
    }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skills</h1>
            <p className="text-gray-600">Manage worker skills and categories</p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Skill
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white shadow rounded-lg">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
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
                {skills.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
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
                        onClick={() => openModal('edit', item)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className={`${item.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={item.active ? 'Deactivate' : 'Activate'}
                      >
                        {item.active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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

          {skills.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No skills found.</p>
              <button
                onClick={() => openModal('create')}
                className="mt-4 btn-primary"
              >
                Add First Skill
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && modalData && (
          <SkillModal
            data={modalData}
            onClose={closeModal}
            onSave={() => {
              closeModal();
              loadSkills();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface SkillModalProps {
  data: ModalData;
  onClose: () => void;
  onSave: () => void;
}

function SkillModal({ data, onClose, onSave }: SkillModalProps) {
  const [formData, setFormData] = useState({
    name: data.item?.name || '',
    category: data.item?.category || '',
    displayOrder: data.item?.displayOrder || 0,
    active: data.item?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (data.mode === 'create') {
        await api.createSkill({ 
          name: formData.name, 
          category: formData.category,
          displayOrder: formData.displayOrder 
        });
      } else if (data.item) {
        await api.updateSkill(data.item.id, { 
          name: formData.name, 
          category: formData.category,
          displayOrder: formData.displayOrder,
          active: formData.active
        });
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
          {data.mode === 'create' ? 'Add' : 'Edit'} Skill
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
              <option value="Kitchen">Kitchen</option>
              <option value="Care">Care</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Other">Other</option>
            </select>
          </div>

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

          {data.mode === 'edit' && (
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
          )}

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