import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';
import { crudApi } from '@/lib/api/crud';
import { StatCard } from '@/components/StatCard';
import { Layout } from '@/components/Layout';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  
  const [stats, setStats] = useState({
    users: 0,
    bahanBaku: 0,
    resep: 0,
    produksi: 0,
    distribusi: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, bahanBaku, resep, produksi, distribusi] = await Promise.all([
          crudApi.list('users', 1, 1),
          crudApi.list('bahan-baku', 1, 1),
          crudApi.list('resep', 1, 1),
          crudApi.list('produksi', 1, 1),
          crudApi.list('distribusi', 1, 1),
        ]);

        setStats({
          users: users.total ?? 0,
          bahanBaku: bahanBaku.total ?? 0,
          resep: resep.total ?? 0,
          produksi: produksi.total ?? 0,
          distribusi: distribusi.total ?? 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      void loadStats();
    }
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">Mengarahkan ke halaman login...</p>
      </main>
    );
  }

  return (
    <Layout title="Dashboard" description="Ringkasan data sistem pencatatan dapur MBG">
      {/* Welcome Card */}
      <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-8 text-white shadow-lg">
        <div>
          <p className="text-green-100 text-sm font-medium">Selamat datang kembali,</p>
          <h2 className="text-3xl font-bold mb-2">{user.nama}</h2>
          <p className="text-green-100">Anda login sebagai <span className="font-semibold">{user.email}</span></p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Data</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={<span className="text-2xl">👤</span>}
              label="Total Users"
              value={stats.users}
              bgColor="bg-blue-50"
              iconBg="bg-blue-100"
            />
            <StatCard
              icon={<span className="text-2xl">🥕</span>}
              label="Bahan Baku"
              value={stats.bahanBaku}
              bgColor="bg-orange-50"
              iconBg="bg-orange-100"
            />
            <StatCard
              icon={<span className="text-2xl">📋</span>}
              label="Resep"
              value={stats.resep}
              bgColor="bg-purple-50"
              iconBg="bg-purple-100"
            />
            <StatCard
              icon={<span className="text-2xl">🍳</span>}
              label="Produksi"
              value={stats.produksi}
              bgColor="bg-yellow-50"
              iconBg="bg-yellow-100"
            />
            <StatCard
              icon={<span className="text-2xl">🚚</span>}
              label="Distribusi"
              value={stats.distribusi}
              bgColor="bg-green-50"
              iconBg="bg-green-100"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
