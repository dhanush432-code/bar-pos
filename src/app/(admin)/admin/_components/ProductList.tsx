'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// --- CHANGE 1: Import the correct IProduct interface from your model ---
import { IProduct } from '@/models/Product'; 
import AddProductModal from '@/app/(admin)/admin/_components/AddProductModal';
import { PlusCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

interface ProductListProps {
  // --- CHANGE 2: The component now expects an array of IProduct ---
  initialProducts: IProduct[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleProductAdded = () => {
    router.refresh();
  };

  return (
    <div>
      <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={20} />
          Add New Product
        </button>
      </div>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={handleProductAdded}
      />

      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-600">Shortcode</th>
              <th className="text-left p-3 font-semibold text-gray-600">Product</th>
              <th className="text-left p-3 font-semibold text-gray-600">Unit</th>
              <th className="text-right p-3 font-semibold text-gray-600">Basic Rate (₹)</th>
              <th className="text-right p-3 font-semibold text-gray-600">Selling Rate (₹)</th>
              <th className="text-right p-3 font-semibold text-gray-600">Stock</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.map((product) => (
              <tr key={product._id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono">{product.shortcode || 'N/A'}</td>
                <td className="p-3 font-medium">{product.subProductName}</td>
                <td className="p-3">{product.productCategory}</td>
                <td className="text-right p-3">{`₹${product.basicRate.toFixed(2)}`}</td>
                <td className="text-right p-3 font-semibold">{`₹${product.sRate.toFixed(2)}`}</td>
                
                {/* --- CHANGE 3: Display the live 'stock' field instead of the old calculated 'totalStock' --- */}
                <td className="text-right p-3">{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {initialProducts.length === 0 && (
            <div className="text-center p-8 text-gray-500">
                No products found. Add a new product to get started.
            </div>
        )}
      </div>
    </div>
  );
}