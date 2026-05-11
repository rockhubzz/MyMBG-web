import EntityCrudPage from '@/components/crud/EntityCrudPage';

export default function DistribusiPage() {
  return (
    <EntityCrudPage
      entity="distribusi"
      title="Manajemen Distribusi"
      displayColumns={[
        'sesi_produksi_id',
        'nama_penerima',
        'lokasi',
        'jumlah_porsi',
        'waktu_distribusi',
        'created_by',
      ]}
      columnAliases={{
        sesi_produksi_id: 'Sesi Produksi',
        nama_penerima: 'Penerima',
        lokasi: 'Lokasi',
        jumlah_porsi: 'Jumlah Porsi',
        waktu_distribusi: 'Waktu Distribusi',
        created_by: 'Dicatat Oleh',
      }}
    />
  );
}
