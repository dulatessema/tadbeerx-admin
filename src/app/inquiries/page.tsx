'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, removeToken, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Inquiry } from '@/types';
import AdminLayout from '@/components/AdminLayout';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function InquiriesPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setAuthLoading(false);
    loadInquiries();
  }, [router, pagination.page, filters]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.getInquiries({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      
      setInquiries(response.inquiries);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getCurrentUserId = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.userId;
    } catch (error) {
      return null;
    }
  };

  const handleAssignInquiry = async (inquiryId: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        setError('Authentication error');
        return;
      }
      await api.assignInquiry(inquiryId, userId);
      await loadInquiries();
    } catch (err: any) {
      setError(err.message || 'Failed to assign inquiry');
    }
  };

  const handleRespondToInquiry = async (inquiryId: string) => {
    if (!responseMessage.trim()) return;
    
    try {
      await api.respondToInquiry(inquiryId, responseMessage);
      setResponseMessage('');
      setSelectedInquiry(null);
      await loadInquiries();
    } catch (err: any) {
      setError(err.message || 'Failed to respond to inquiry');
    }
  };

  const handleCloseInquiry = async (inquiryId: string) => {
    try {
      await api.closeInquiry(inquiryId);
      await loadInquiries();
    } catch (err: any) {
      setError(err.message || 'Failed to close inquiry');
    }
  };

  const handleMarkAsSpam = async (inquiryId: string) => {
    try {
      await api.markInquiryAsSpam(inquiryId);
      await loadInquiries();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as spam');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'badge-warning',
      in_progress: 'badge-primary',
      responded: 'badge-success',
      closed: 'badge-secondary',
      spam: 'badge-danger',
    };
    return styles[status as keyof typeof styles] || 'badge-secondary';
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      low: 'badge-secondary',
      medium: 'badge-warning',
      high: 'badge-danger',
    };
    return styles[urgency as keyof typeof styles] || 'badge-secondary';
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'whatsapp':
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      case 'phone':
        return <PhoneIcon className="h-4 w-4" />;
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (authLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inquiries Management</h1>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="form-label">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Search inquiries..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={filters.status[0] || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : [])}
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                  <option value="spam">Spam</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ search: '', status: [] });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-danger-600">{error}</p>
              <button onClick={loadInquiries} className="btn-primary mt-4">
                Try Again
              </button>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No inquiries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Worker</th>
                    <th>Contact Method</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Assigned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {inquiry.clientInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inquiry.clientInfo.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inquiry.clientInfo.phone}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">
                          {inquiry.worker ? 'Worker Profile' : 'Unknown'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          {getContactMethodIcon(inquiry.preferredContactMethod)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {inquiry.preferredContactMethod}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={clsx('badge', getUrgencyBadge(inquiry.urgency))}>
                          {inquiry.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={clsx('badge', getStatusBadge(inquiry.status))}>
                          {inquiry.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-900">
                          {format(new Date(inquiry.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <div className="text-xs text-gray-500">
                          {format(new Date(inquiry.createdAt), 'HH:mm')}
                        </div>
                      </td>
                      <td>
                        {inquiry.assignedUser ? (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {inquiry.assignedUser.email.split('@')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {inquiry.status === 'new' && (
                            <button
                              onClick={() => handleAssignInquiry(inquiry.id)}
                              className="text-primary-600 hover:text-primary-900 text-xs"
                              title="Assign to me"
                            >
                              <UserIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {inquiry.status === 'in_progress' && (
                            <button
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="text-success-600 hover:text-success-900 text-xs"
                              title="Respond"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {inquiry.status === 'responded' && (
                            <button
                              onClick={() => handleCloseInquiry(inquiry.id)}
                              className="text-gray-600 hover:text-gray-900 text-xs"
                              title="Close"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleMarkAsSpam(inquiry.id)}
                            className="text-danger-600 hover:text-danger-900 text-xs"
                            title="Mark as spam"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    {[...Array(pagination.pages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setPagination(prev => ({ ...prev, page: index + 1 }))}
                        className={clsx(
                          'relative inline-flex items-center px-4 py-2 text-sm font-semibold',
                          pagination.page === index + 1
                            ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Response Modal */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Respond to Inquiry
                  </h3>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Inquiry Details</h4>
                  <p><strong>Client:</strong> {selectedInquiry.clientInfo.name}</p>
                  <p><strong>Email:</strong> {selectedInquiry.clientInfo.email}</p>
                  <p><strong>Phone:</strong> {selectedInquiry.clientInfo.phone}</p>
                  {selectedInquiry.message && (
                    <p><strong>Message:</strong> {selectedInquiry.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Response Message</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Type your response..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRespondToInquiry(selectedInquiry.id)}
                    disabled={!responseMessage.trim()}
                    className="btn-primary"
                  >
                    Send Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}