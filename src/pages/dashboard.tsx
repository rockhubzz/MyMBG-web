import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';

const ROLE_LABEL: Record<string, string> = {
  Admin:       'Administrator',
  KepalaDapur: 'Kepala Dapur',
  Staff:       'Staff Dapur',
};

const ROLE_COLOR: Record<string, string> = {
  Admin:       'bg-purple-100 text-purple-700',
  KepalaDapur: 'bg-blue-100 text-blue-700',
  Staff:       'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  const handleLogout = () => {
    Cookies.remove('mbg-token');
    clearAuth();
    router.push('/login');
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">Mengarahkan ke halaman login...</p>
      </main>
    );
  }

  const initials = user.nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header strip */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-8 py-6 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold text-white">
              🍱
            </div>
            <div>
              <p className="text-green-200 text-xs font-medium tracking-widest uppercase">
                Sistem Pencatatan
              </p>
              <h1 className="text-white font-bold text-lg leading-tight">Dapur MBG</h1>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 text-center">

            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center text-green-700 text-xl font-bold mx-auto mb-4">
              {initials}
            </div>

            {/* Welcome text */}
            <p className="text-gray-500 text-sm mb-1">Selamat datang,</p>
            <h2 className="text-gray-800 text-2xl font-bold mb-3">{user.nama}</h2>

            {/* Role badge */}
            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-2 ${ROLE_COLOR[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABEL[user.role] ?? user.role}
            </span>

            <p className="text-gray-400 text-xs mb-8">{user.email}</p>

            {/* Quick nav cards */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { label: 'Bahan Baku',  icon: '🥕', href: '/bahan-baku' },
                { label: 'Resep',       icon: '📋', href: '/resep' },
                { label: 'Produksi',    icon: '🍳', href: '/produksi' },
                { label: 'Distribusi',  icon: '🚚', href: '/distribusi' },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-200 transition text-left"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 active:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Keluar
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          &copy; {new Date().getFullYear()} Dapur MBG — Program Makan Bergizi Gratis
        </p>
      </div>
    </main>
  );
}