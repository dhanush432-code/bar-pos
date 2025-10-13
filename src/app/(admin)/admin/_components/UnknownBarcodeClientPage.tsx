// src/app/(admin)/admin/unknown-barcodes/_components/UnknownBarcodeClientPage.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IUnknownProduct } from '@/models/UnknownProduct';
import AddProductModal from '@/app/(admin)/admin/_components/AddProductModal';
import { PlusCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Props {
  unknownProducts: IUnknownProduct[];
}

export default function UnknownBarcodeClientPage({ unknownProducts }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const router = useRouter();

  const handleOpenModal = (barcode: string) => {
    setSelectedBarcode(barcode);
    setIsModalOpen(true);
  };

  // Renamed for clarity to match the new modal prop
  const handleActionComplete = async () => {
    // This logic remains the same: delete the barcode from the unknown list after adding
    const toastId = toast.loading('Removing barcode from unknown list...');
    try {
      const res = await fetch(`/api/unknown/${selectedBarcode}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to remove barcode.');
      }
      toast.success('Barcode removed from list.', { id: toastId });
    } catch (error) {
      toast.error('Could not remove barcode from list.', { id: toastId });
    } finally {
      setSelectedBarcode('');
      router.refresh();
    }
  };

  return (
    <div>
      <Toaster />
      <h1 className="text-3xl font-bold mb-6">Unknown Barcode Logs</h1>
      
      {/* --- UPDATED MODAL INVOCATION --- */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActionComplete={handleActionComplete} // Use the new prop name
        productData={null}                     // Pass null to signify "Add Mode"
        initialBarcode={selectedBarcode}       // Pass the barcode to pre-fill the form
      />

      <div className="bg-white p-4 rounded-lg shadow-md">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Barcode</th>
              <th className="p-3 text-left">Last Scanned</th>
              <th className="p-3 text-center">Scan Count</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {unknownProducts.map((p) => (
              <tr key={p.barcode} className="hover:bg-gray-50">
                <td className="p-3 font-mono">{p.barcode}</td>
                <td className="p-3">{new Date(p.scannedAt).toLocaleString()}</td>
                <td className="p-3 text-center">{p.count}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleOpenModal(p.barcode)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-green-600"
                  >
                    <PlusCircle size={16} /> Add Product
                  </button>
                </td>
              </tr>
            ))}
             {unknownProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-8 text-gray-500">
                    No unknown barcodes have been logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}