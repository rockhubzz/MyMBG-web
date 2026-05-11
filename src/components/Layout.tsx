import { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const ROLE_LABEL: Record<string, string> = {
  Admin: 'Administrator',
  KepalaDapur: 'Kepala Dapur',
  Staff: 'Staff Dapur',
};

export function Layout({ children, title, description }: LayoutProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    Cookies.remove('mbg-token');
    clearAuth();
    router.push('/login');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">Mengarahkan ke halaman login...</p>
      </main>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Users', href: '/users', icon: '👤' },
    { label: 'Bahan Baku', href: '/bahan-baku', icon: '🥕' },
    { label: 'Resep', href: '/resep', icon: '📋' },
    { label: 'Produksi', href: '/produksi', icon: '🍳' },
    { label: 'Distribusi', href: '/distribusi', icon: '🚚' },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 p-4 font-bold text-lg text-gray-800 border-b border-gray-200 hover:bg-gray-50 transition">
          <span className="text-2xl">🍱</span>
          <span>Dapur MBG Malang</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition border-l-4 ${
                isActive(item.href)
                  ? 'bg-green-50 border-green-600 text-green-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Dapur MBG</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200">
          <div className="px-8 h-16 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
              {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>

            {/* User Profile Popup */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                  {user.nama
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user.nama}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABEL[user.role] ?? user.role}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-600 transition ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800">{user.nama}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Edit Profil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Dapur MBG — Program Makan Bergizi Gratis</p>
        </footer>
      </div>
    </div>
  );
}
