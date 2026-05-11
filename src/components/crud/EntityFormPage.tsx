import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { crudApi } from '@/lib/api/crud';
import { createProduksiWithBahan } from '@/lib/api/produksi';
import { ColumnDefinition, EntityDefinition } from '@/types/crud';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/store/auth-store';

interface Props {
  entity: string;
  title: string;
  isEditing?: boolean;
  id?: string;
}

type FormState = Record<string, string>;

function humanizeLabel(fieldName: string): string {
  // Convert snake_case to Title Case
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function humanizeEnum(value: string): string {
  // Convert camelCase enum values to readable format
  // e.g., 'BuahBuahan' -> 'Buah-Buahan', 'SusuOlahan' -> 'Susu Olahan'
  return value
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const PRODUKSI_STATUS = ['Direncanakan', 'Berlangsung', 'Selesai', 'Dibatalkan'] as const;

const KATEGORI_OPTIONS = [
  'Karbohidrat',
  'Protein',
  'Sayuran',
  'BuahBuahan',
  'Bumbu',
  'MinyakLemak',
  'SusuOlahan',
  'Minuman',
  'Lainnya'
];

function getFieldHint(fieldName: string, dataType: string, isNullable: boolean): string {
  const hints: Record<string, string> = {
    // Users
    nama: 'Masukkan nama lengkap pengguna',
    email: 'Masukkan alamat email yang valid',
    password: 'Minimal 6 karakter',
    role: 'Pilih peran pengguna dalam sistem',
    is_active: 'Status aktif atau tidak aktif',
    
    // Bahan Baku
    nama_bahan: 'Masukkan nama bahan baku',
    satuan: 'Masukkan unit satuan (kg, liter, butir, dll)',
    stok: 'Masukkan jumlah stok',
    stok_saat_ini: 'Masukkan stok yang tersedia saat ini',
    stok_minimum: 'Masukkan jumlah minimum stok untuk reorder',
    harga_satuan: 'Masukkan harga per unit satuan dalam Rupiah',
    
    // Resep
    nama_menu: 'Masukkan nama menu/resep',
    jumlah_porsi: 'Masukkan jumlah porsi yang dihasilkan',
    estimasi_waktu_menit: 'Masukkan perkiraan waktu produksi dalam menit',
    deskripsi: 'Masukkan deskripsi atau catatan tambahan',
    
    // Produksi
    resep_id: 'Pilih resep yang akan diproduksi',
    tanggal_produksi: 'Masukkan tanggal produksi',
    jumlah_porsi_diproduksi: 'Masukkan jumlah porsi yang diproduksi',
    status: 'Pilih status produksi',
    
    // Distribusi
    tujuan: 'Masukkan tujuan distribusi',
    tanggal_distribusi: 'Masukkan tanggal distribusi',
  };
  
  const hint = hints[fieldName];
  if (hint) return hint;
  
  // Generic hints based on data type
  if (dataType.includes('numeric') || dataType.includes('integer')) {
    return 'Masukkan angka';
  }
  if (dataType.includes('varchar') || dataType.includes('text')) {
    return `Masukkan teks${isNullable ? ' (opsional)' : ''}`;
  }
  if (dataType.includes('date')) {
    return 'Masukkan tanggal';
  }
  if (dataType.includes('uuid')) {
    return 'Pilih dari daftar';
  }
  
  return `Masukkan nilai${isNullable ? ' (opsional)' : ''}`;
}

function isEditable(col: ColumnDefinition): boolean {
  const lower = col.name.toLowerCase();
  // Exclude system fields
  if (lower === 'is_active' || lower === 'created_by' || lower === 'stok_dikurangi') {
    return false;
  }
  return !col.isPrimaryKey && lower !== 'created_at' && lower !== 'updated_at';
}

function isEnumField(entity: string, fieldName: string): boolean {
  return entity === 'bahan-baku' && fieldName === 'kategori';
}

function getEnumValues(entity: string, fieldName: string): string[] {
  if (entity === 'bahan-baku' && fieldName === 'kategori') {
    return KATEGORI_OPTIONS;
  }
  return [];
}

export default function EntityFormPage({ entity, title, isEditing = false, id }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [meta, setMeta] = useState<EntityDefinition | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resepOptions, setResepOptions] = useState<{ id: string; namaMenu: string }[]>([]);
  const [kurangiStokSekarang, setKurangiStokSekarang] = useState(true);

  const editableColumns = useMemo(
    () => (meta?.columns ?? []).filter(isEditable),
    [meta]
  );

  // Load metadata and existing data if editing
  useEffect(() => {
    const load = async () => {
      try {
        const metaRes = await crudApi.getEntity(entity);
        setMeta(metaRes);

        if (entity === 'produksi') {
          try {
            const resepRes = await crudApi.list('resep', 1, 500, '');
            setResepOptions(
              resepRes.items.map((r: Record<string, unknown>) => ({
                id: String(r.id),
                namaMenu: String(r.nama_menu ?? r.id),
              }))
            );
          } catch {
            setResepOptions([]);
          }
        } else {
          setResepOptions([]);
        }

        if (isEditing && id) {
          const dataRes = await crudApi.getById(entity, id);
          const formData: FormState = {};
          metaRes.columns.filter(isEditable).forEach((col) => {
            let v = dataRes[col.name] == null ? '' : String(dataRes[col.name]);
            if (col.dataType.toLowerCase() === 'date' && v.includes('T')) {
              v = v.slice(0, 10);
            }
            formData[col.name] = v;
          });
          setForm(formData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, isEditing, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {};
      editableColumns.forEach((col) => {
        const v = (form[col.name] ?? '').trim();
        
        if (v.length === 0) return;
        
        // Handle enum fields with validation
        if (isEnumField(entity, col.name)) {
          const validEnumValues = getEnumValues(entity, col.name);
          if (validEnumValues.includes(v)) {
            payload[col.name] = v; // Send exact enum value
          }
        }
        // Convert numeric fields to numbers
        else if (col.dataType.includes('numeric') || col.dataType.includes('integer')) {
          payload[col.name] = parseFloat(v) || 0;
        }
        // Keep everything else as string
        else {
          payload[col.name] = v;
        }
      });

      // Add system fields only if they exist in the entity
      const hasIsActive = meta?.columns.some(c => c.name.toLowerCase() === 'is_active');
      const hasCreatedBy = meta?.columns.some(c => c.name.toLowerCase() === 'created_by');

      // Add is_active default only if it exists and we're creating
      if (!isEditing && hasIsActive) {
        payload.is_active = true;
      }

      // Add created_by on creation only if it exists
      if (!isEditing && hasCreatedBy && user?.id) {
        payload.created_by = user.id;
      }

      if (entity === 'produksi' && !isEditing) {
        const resepId = (form.resep_id ?? '').trim();
        if (!resepId) {
          throw new Error('Pilih menu / resep.');
        }
        const porsi = parseInt(String(form.jumlah_porsi_diproduksi ?? '').trim(), 10);
        if (!porsi || porsi <= 0) {
          throw new Error('Jumlah porsi diproduksi harus lebih dari 0.');
        }
        if (!user?.id) {
          throw new Error('Silakan login ulang untuk mencatat pembuat data.');
        }
        const res = await createProduksiWithBahan({
          resepId,
          jumlahPorsiDiproduksi: porsi,
          tanggalProduksi: (form.tanggal_produksi ?? '').trim() || undefined,
          catatan: (form.catatan ?? '').trim() || undefined,
          status: (form.status ?? '').trim() || 'Direncanakan',
          createdBy: user.id,
          kurangiStokSekarang,
        });
        setSuccess(res.message ?? 'Data berhasil ditambahkan');
      } else if (isEditing && id) {
        await crudApi.update(entity, id, payload);
        setSuccess('Data berhasil diperbarui');
      } else {
        await crudApi.create(entity, payload);
        setSuccess('Data berhasil ditambahkan');
      }

      setTimeout(() => {
        router.push(`/${entity}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title={title}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-gray-600 mt-4">Memuat formulir...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={title} description={isEditing ? 'Perbarui informasi data' : 'Isi formulir untuk menambah data baru'}>
      {/* Back Button */}
      <Link
        href={`/${entity}`}
        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar
      </Link>

      {/* Alerts */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-3">
          <span className="text-lg">✓</span>
          <p>{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6 md:p-8 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {editableColumns.map((col) => (
              <div key={col.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {entity === 'produksi' && col.name === 'resep_id'
                    ? 'Menu / Resep'
                    : humanizeLabel(col.name)}
                  {!col.isNullable && <span className="text-red-500">*</span>}
                </label>
                {entity === 'users' && col.name === 'role' ? (
                  <select
                    value={form[col.name] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [col.name]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="KepalaDapur">Kepala Dapur</option>
                  </select>
                ) : entity === 'produksi' && col.name === 'resep_id' ? (
                  <select
                    value={form[col.name] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [col.name]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih resep</option>
                    {resepOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.namaMenu}
                      </option>
                    ))}
                  </select>
                ) : entity === 'produksi' && col.name === 'status' ? (
                  <select
                    value={form[col.name] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [col.name]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih status</option>
                    {PRODUKSI_STATUS.map((st) => (
                      <option key={st} value={st}>
                        {humanizeEnum(st)}
                      </option>
                    ))}
                  </select>
                ) : entity === 'bahan-baku' && col.name === 'kategori' ? (
                  <select
                    value={form[col.name] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [col.name]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {KATEGORI_OPTIONS.map((kat) => (
                      <option key={kat} value={kat}>
                        {humanizeEnum(kat)}
                      </option>
                    ))}
                  </select>
                ) : col.dataType.toLowerCase() === 'date' ? (
                  <input
                    type="date"
                    value={form[col.name] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [col.name]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[col.name] ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, [col.name]: e.target.value }))}
                    placeholder={`Masukkan ${col.name.toLowerCase()}`}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {getFieldHint(col.name, col.dataType, col.isNullable)}
                </p>
              </div>
            ))}
          </div>

          {entity === 'produksi' && !isEditing && (
            <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kurangiStokSekarang}
                  onChange={(e) => setKurangiStokSekarang(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">
                  <span className="font-semibold">Selesai dan kurangi stok bahan sekarang</span>
                  <span className="block text-gray-600 mt-1">
                    Sistem mencatat pemakaian bahan dari komposisi resep (disesuaikan dengan porsi yang Anda
                    masukkan), lalu menandai sesi sebagai Selesai sehingga stok bahan baku berkurang di database.
                    Matikan opsi ini jika Anda hanya ingin merencanakan tanpa mengurangi stok; Anda dapat
                    mengubah status menjadi Selesai nanti dari halaman edit (setelah baris pemakaian bahan ada).
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  {isEditing ? '💾 Simpan Perubahan' : '✓ Simpan Data'}
                </>
              )}
            </button>
            <Link
              href={`/${entity}`}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}
