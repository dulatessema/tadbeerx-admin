'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';
import {
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  GlobeAltIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { 
    name: 'Workers', 
    href: '/workers', 
    icon: UsersIcon,
    submenu: [
      { name: 'All Workers', href: '/workers' },
      { name: 'Add Worker', href: '/workers/add' },
    ]
  },
  { name: 'Inquiries', href: '/inquiries', icon: ChatBubbleLeftRightIcon },
  { name: 'Reference Data', href: '/reference', icon: GlobeAltIcon },
  { name: 'Audit Trail', href: '/audit', icon: DocumentTextIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 flex z-40 md:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-primary-600">TadbeerX Admin</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                      pathname === item.href || (item.submenu && item.submenu.some((sub: any) => pathname === sub.href))
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                  {item.submenu && (pathname === item.href || item.submenu.some((sub: any) => pathname === sub.href)) && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.submenu.map((subItem: any) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={clsx(
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                            pathname === subItem.href
                              ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white shadow">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-primary-600">TadbeerX Admin</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                        pathname === item.href || (item.submenu && item.submenu.some((sub: any) => pathname === sub.href))
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="mr-3 h-6 w-6" />
                      {item.name}
                    </Link>
                    {item.submenu && (pathname === item.href || item.submenu.some((sub: any) => pathname === sub.href)) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem: any) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={clsx(
                              'group flex items-center px-3 py-2 text-xs font-medium rounded-md',
                              pathname === subItem.href
                                ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            )}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">admin@tadbeerx.com</p>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => item.href === pathname)?.name || 'Admin Dashboard'}
                </h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <BellIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">admin@tadbeerx.com</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}