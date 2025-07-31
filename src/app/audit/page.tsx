'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated, getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues: any;
  newValues: any;
  metadata: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function AuditTrailPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    action: '',
    tableName: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    
    loadAuditLogs();
  }, [router, pagination.page, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      
      searchParams.set('page', pagination.page.toString());
      searchParams.set('limit', pagination.limit.toString());
      
      if (filters.action) searchParams.set('action', filters.action);
      if (filters.tableName) searchParams.set('tableName', filters.tableName);
      if (filters.search) searchParams.set('search', filters.search);
      if (filters.dateFrom) searchParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) searchParams.set('dateTo', filters.dateTo);

      const response = await fetch(`https://tadbeerx-api.vercel.app/api/audit?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load audit logs');
      }

      const data = await response.json();
      setAuditLogs(data.auditLogs);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-success-100 text-success-800';
      case 'update':
        return 'bg-warning-100 text-warning-800';
      case 'delete':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '+';
      case 'update':
        return '✎';
      case 'delete':
        return '×';
      default:
        return '?';
    }
  };

  const getUserName = (user: AuditLog['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email.split('@')[0];
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track all administrative actions and changes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="form-label">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="form-input"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Table</label>
                <select
                  value={filters.tableName}
                  onChange={(e) => handleFilterChange('tableName', e.target.value)}
                  className="form-input"
                >
                  <option value="">All Tables</option>
                  <option value="workers">Workers</option>
                  <option value="inquiries">Inquiries</option>
                  <option value="users">Users</option>
                  <option value="nationalities">Nationalities</option>
                  <option value="skills">Skills</option>
                  <option value="languages">Languages</option>
                </select>
              </div>

              <div>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilters({
                    action: '',
                    tableName: '',
                    search: '',
                    dateFrom: '',
                    dateTo: '',
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Audit Logs ({pagination.total} total)
            </h3>
          </div>

          {error ? (
            <div className="px-6 py-4">
              <div className="text-center py-12">
                <p className="text-danger-600">{error}</p>
                <button onClick={loadAuditLogs} className="btn-primary mt-4">
                  Try Again
                </button>
              </div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="px-6 py-4">
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No audit logs found</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {getUserName(log.user)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.action}d {log.tableName}
                          </span>
                          {log.recordId && (
                            <span className="text-xs text-gray-400 font-mono">
                              {log.recordId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      
                      {log.metadata && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            {JSON.stringify(log.metadata)}
                          </p>
                        </div>
                      )}
                      
                      {log.ipAddress && (
                        <div className="mt-1 text-xs text-gray-400">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}