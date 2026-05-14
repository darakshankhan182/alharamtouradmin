'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  FileText, 
  UserCircle,
  LogOut,
  X,
  PlusIcon,
  ShoppingCartIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Logo from "../../images/logo/logo.webp"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inquiries', href: '/inquiries', icon: FileText },
  { name: 'Add New Inquiry', href: '/add-new-inquiry', icon: PlusIcon },
  { name: 'Vendors', href: '/vendors', icon: ShoppingCartIcon },
  { name: 'All Users', href: '/users', icon: Users },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        flex flex-col
        bg-white border-r border-gray-200
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen 
          ? 'translate-x-0 w-64' 
          : '-translate-x-full md:translate-x-0 md:w-20'
        }
      `}>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-gray-200">
            <div className="flex items-center">
              <Image src={Logo} alt='Logo' width={120} height={40} />
            </div>
            <button
              type="button"
              className="rounded-md text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Desktop logo */}
          <div className={`
            hidden md:flex items-center px-4 h-16 border-b border-gray-200
            transition-all duration-300
            ${sidebarOpen ? 'justify-start' : 'justify-center'}
          `}>
            {sidebarOpen ? (
              <Image 
                src={Logo} 
                alt='Logo' 
                width={120}
                height={40}
                className="transition-all duration-300"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center rounded-md px-3 py-2 text-sm font-medium
                    transition-colors duration-200
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${sidebarOpen ? 'justify-start' : 'justify-center'}
                  `}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon
                    className={`
                      flex-shrink-0
                      ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                      ${sidebarOpen ? 'mr-3 h-5 w-5' : 'h-6 w-6'}
                    `}
                  />
                  {sidebarOpen && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                logout();
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`
                w-full flex items-center rounded-md px-3 py-2 text-sm font-medium
                text-gray-700 hover:bg-gray-50 hover:text-gray-900
                transition-colors duration-200
                ${sidebarOpen ? 'justify-start' : 'justify-center'}
              `}
            >
              <LogOut
                className={`
                  flex-shrink-0 text-gray-400 group-hover:text-gray-500
                  ${sidebarOpen ? 'mr-3 h-5 w-5' : 'h-6 w-6'}
                `}
              />
              {sidebarOpen && (
                <span className="truncate">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};