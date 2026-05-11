import EntityCrudPage from '@/components/crud/EntityCrudPage';

export default function BahanBakuPage() {
  return (
    <EntityCrudPage 
      entity="bahan-baku" 
      title="Manajemen Bahan Baku"
      displayColumns={['nama_bahan', 'satuan', 'stok_saat_ini', 'stok_minimum', 'harga_satuan']}
      columnAliases={{
        nama_bahan: 'Nama Bahan',
        satuan: 'Satuan',
        stok_saat_ini: 'Stok Saat Ini',
        stok_minimum: 'Stok Minimum',
        harga_satuan: 'Harga Satuan',
      }}
    />
  );
}
