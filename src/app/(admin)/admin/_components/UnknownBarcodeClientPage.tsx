'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IUnknownProduct } from '@/models/UnknownProduct';
import AddProductModal from '@/app/(admin)/admin/_components/AddProductModal';
import { PlusCircle, Barcode, HelpCircle, Hash } from 'lucide-react';
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

  const handleActionComplete = async () => {
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
    <div className="p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActionComplete={handleActionComplete}
        productData={null}
        initialBarcode={selectedBarcode}
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Unknown Barcode Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and add products for barcodes that weren't found in the database.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Last Scanned</th>
                <th scope="col" className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Scan Count</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unknownProducts.map((p) => (
                <tr key={p.barcode} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Barcode className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-mono text-gray-800">{p.barcode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(p.scannedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {p.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    <button
                      onClick={() => handleOpenModal(p.barcode)}
                      className="inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <PlusCircle size={14} /> Add Product
                    </button>
                  </td>
                </tr>
              ))}
              {unknownProducts.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="text-center py-12 px-6">
                      <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No Unknown Barcodes</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        It looks like all scanned barcodes are already in your product database.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}