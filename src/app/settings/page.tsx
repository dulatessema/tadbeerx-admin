'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, removeToken } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';
import {
  Cog6ToothIcon,
  UserIcon,
  GlobeAltIcon,
  BellIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your admin preferences and system configuration
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Profile Settings
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value="admin@tadbeerx.com"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact system administrator to change email
                </p>
              </div>
              
              <div>
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-input"
                  value="Administrator"
                  disabled
                />
              </div>
              
              <div className="pt-4">
                <button className="btn-primary">
                  Update Profile
                </button>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                System Settings
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Default Page Size</label>
                <select className="form-input">
                  <option value="10">10 items per page</option>
                  <option value="20" selected>20 items per page</option>
                  <option value="50">50 items per page</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Time Zone</label>
                <select className="form-input">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Dubai" selected>Asia/Dubai (UAE)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</option>
                </select>
              </div>
              
              <div className="pt-4">
                <button className="btn-primary">
                  Save Settings
                </button>
              </div>
            </div>
          </div>

          {/* Reference Data Management */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Reference Data
              </h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Manage nationalities, skills, and languages available in the system.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button className="btn-secondary text-sm">
                  Manage Nationalities
                </button>
                <button className="btn-secondary text-sm">
                  Manage Skills
                </button>
                <button className="btn-secondary text-sm">
                  Manage Languages
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Notification Preferences
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="form-label mb-0">New Inquiries</label>
                  <p className="text-sm text-gray-500">Get notified when new inquiries are submitted</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="form-label mb-0">Worker Registrations</label>
                  <p className="text-sm text-gray-500">Get notified when workers register</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="form-label mb-0">System Updates</label>
                  <p className="text-sm text-gray-500">Get notified about system maintenance</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="pt-4">
                <button className="btn-primary">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Security & Access
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Password</h4>
              <p className="text-sm text-gray-600 mb-4">
                Update your password to keep your account secure.
              </p>
              <button className="btn-secondary">
                Change Password
              </button>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Session Management</h4>
              <p className="text-sm text-gray-600 mb-4">
                Manage your active sessions and security settings.
              </p>
              <button className="btn-secondary">
                View Active Sessions
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">System Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="font-medium text-gray-900">Platform Version</dt>
              <dd className="text-gray-600">TadbeerX v1.0.0</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Last Updated</dt>
              <dd className="text-gray-600">July 28, 2025</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Environment</dt>
              <dd className="text-gray-600">Development</dd>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}