'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Worker, Nationality, Skill, Language } from '@/types';
import Link from 'next/link';
import {
  UsersIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface WorkerWithRelations extends Worker {
  nationality?: Nationality;
  skills?: Skill[];
  languages?: Language[];
}

interface WorkerStats {
  total: number;
  available: number;
  pending: number;
  approved: number;
  featured: number;
}

export default function WorkersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerWithRelations[]>([]);
  const [stats, setStats] = useState<WorkerStats>({
    total: 0,
    available: 0,
    pending: 0,
    approved: 0,
    featured: 0,
  });
  const [referenceData, setReferenceData] = useState<{
    nationalities: Nationality[];
    skills: Skill[];
    languages: Language[];
  }>({ nationalities: [], skills: [], languages: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
    approvalStatus: [] as string[],
  });
  const [editingWorker, setEditingWorker] = useState<WorkerWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [router, pagination.page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersResponse, statsResponse, referenceResponse] = await Promise.all([
        api.getWorkers({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status.length > 0 ? filters.status : undefined,
          approvalStatus: filters.approvalStatus.length > 0 ? filters.approvalStatus : undefined,
          search: filters.search || undefined,
        }),
        api.getDashboardStats(),
        api.getReferenceData(),
      ]);

      setWorkers(workersResponse.workers);
      setPagination(workersResponse.pagination);
      setStats(statsResponse.workers);
      setReferenceData(referenceResponse);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (workerId: string, field: string, value: any) => {
    try {
      setActionLoading(`${workerId}-${field}`);
      await api.updateWorker(workerId, { [field]: value });
      await loadData();
    } catch (error) {
      console.error('Error updating worker:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (workerId: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    
    try {
      setActionLoading(`${workerId}-delete`);
      await api.deleteWorker(workerId);
      await loadData();
    } catch (error) {
      console.error('Error deleting worker:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (type: 'status' | 'approvalStatus', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSelectWorker = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(w => w.id));
    }
  };

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedWorkers.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedWorkers.length} worker(s)?`;
    if (!confirm(confirmMessage)) return;

    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedWorkers.map(workerId => {
          switch (action) {
            case 'approve':
              return api.updateWorker(workerId, { approvalStatus: 'approved' });
            case 'reject':
              return api.updateWorker(workerId, { approvalStatus: 'rejected' });
            case 'activate':
              return api.updateWorker(workerId, { status: 'available' });
            case 'deactivate':
              return api.updateWorker(workerId, { status: 'inactive' });
            case 'feature':
              return api.updateWorker(workerId, { featured: true });
            case 'unfeature':
              return api.updateWorker(workerId, { featured: false });
            case 'delete':
              return api.deleteWorker(workerId);
            default:
              return Promise.resolve();
          }
        })
      );
      
      setSelectedWorkers([]);
      await loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkerName = (worker: WorkerWithRelations) => {
    const { firstName, lastName } = worker.personalInfo || {};
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return 'Unnamed Worker';
  };

  const getNationalityName = (worker: WorkerWithRelations) => {
    if (!worker.personalInfo?.nationalityId) return 'Not specified';
    const nationality = referenceData.nationalities.find(n => n.id === worker.personalInfo.nationalityId);
    return nationality?.name || 'Unknown';
  };

  const getSkillNames = (worker: WorkerWithRelations) => {
    if (!worker.professionalInfo?.skillIds?.length) return 'No skills listed';
    const skillNames = worker.professionalInfo.skillIds
      .map(id => referenceData.skills.find(s => s.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3);
    const extra = worker.professionalInfo.skillIds.length - skillNames.length;
    return skillNames.join(', ') + (extra > 0 ? ` +${extra} more` : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage domestic worker profiles and applications
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Workers</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.available}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Featured</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.featured}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workers..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value=""
                onChange={(e) => e.target.value && handleFilterChange('status', e.target.value)}
              >
                <option value="">Filter by Status</option>
                <option value="available">Available</option>
                <option value="hired">Hired</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value=""
                onChange={(e) => e.target.value && handleFilterChange('approvalStatus', e.target.value)}
              >
                <option value="">Filter by Approval</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <Link
              href="/workers/add"
              className="btn-primary flex items-center whitespace-nowrap"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Worker
            </Link>
          </div>

          {/* Active Filters */}
          {(filters.status.length > 0 || filters.approvalStatus.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.status.map(status => (
                <span
                  key={status}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  Status: {status}
                  <button
                    onClick={() => handleFilterChange('status', status)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {filters.approvalStatus.map(status => (
                <span
                  key={status}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                >
                  Approval: {status}
                  <button
                    onClick={() => handleFilterChange('approvalStatus', status)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedWorkers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-700">
                  {selectedWorkers.length} worker(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkActionLoading}
                  className="btn-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkActionLoading}
                  className="btn-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActionLoading}
                  className="btn-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkActionLoading}
                  className="btn-sm bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('feature')}
                  disabled={bulkActionLoading}
                  className="btn-sm bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                  Feature
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="btn-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedWorkers([])}
                  className="btn-sm bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={workers.length > 0 && selectedWorkers.length === workers.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={() => handleSelectWorker(worker.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {getWorkerName(worker)}
                          {worker.featured && (
                            <StarIconSolid className="h-4 w-4 text-yellow-400 ml-2" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Score: {worker.profileCompletionScore}%
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getNationalityName(worker)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {getSkillNames(worker)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={worker.status}
                      onChange={(e) => handleStatusChange(worker.id, 'status', e.target.value)}
                      disabled={actionLoading === `${worker.id}-status`}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusBadgeClass(worker.status)}`}
                    >
                      <option value="available">Available</option>
                      <option value="hired">Hired</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={worker.approvalStatus}
                      onChange={(e) => handleStatusChange(worker.id, 'approvalStatus', e.target.value)}
                      disabled={actionLoading === `${worker.id}-approvalStatus`}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusBadgeClass(worker.approvalStatus)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusChange(worker.id, 'featured', !worker.featured)}
                        disabled={actionLoading === `${worker.id}-featured`}
                        className={`p-1 rounded ${worker.featured ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400 hover:text-yellow-600'}`}
                        title={worker.featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/workers/${worker.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit worker"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(worker.id)}
                        disabled={actionLoading === `${worker.id}-delete`}
                        className="text-red-600 hover:text-red-900"
                        title="Delete worker"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {workers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status.length > 0 || filters.approvalStatus.length > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first worker.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, pagination.page - 2);
                      const end = Math.min(pagination.pages, start + 4);
                      pageNum = start + i;
                      if (pageNum > end) return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}