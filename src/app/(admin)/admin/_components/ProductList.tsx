// src/app/(admin)/admin/products/_components/ProductList.tsx (or similar path)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IProduct } from '@/models/Product'; 
import AddProductModal from '@/app/(admin)/admin/_components/AddProductModal';
import { PlusCircle, Edit } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

interface ProductListProps {
  initialProducts: IProduct[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the product being edited. Null means "Add Mode".
  const [productToEdit, setProductToEdit] = useState<IProduct | null>(null);
  const router = useRouter();

  const handleOpenAddModal = () => {
    setProductToEdit(null); // Ensure we're in "Add Mode"
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: IProduct) => {
    setProductToEdit(product); // Set the product to edit
    setIsModalOpen(true);
  };

  const handleActionComplete = () => {
    // This callback is used for both adding and updating.
    router.refresh();
  };

  return (
    <div>
      <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={20} />
          Add New Product
        </button>
      </div>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActionComplete={handleActionComplete}
        productData={productToEdit} // Pass the product data to the modal
      />

      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-600">Product</th>
              <th className="text-left p-3 font-semibold text-gray-600">Shortcode</th>
              <th className="text-right p-3 font-semibold text-gray-600">Selling Rate (₹)</th>
              <th className="text-right p-3 font-semibold text-gray-600">Stock</th>
              <th className="text-center p-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.map((product) => (
              <tr key={product._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                    <div className='font-medium'>{product.subProductName}</div>
                    <div className='text-sm text-gray-500'>{product.productCategory}</div>
                </td>
                <td className="p-3 font-mono">{product.shortcode || 'N/A'}</td>
                <td className="text-right p-3 font-semibold">{`₹${product.sRate.toFixed(2)}`}</td>
                <td className="text-right p-3">{product.stock}</td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleOpenEditModal(product)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit Product"
                  >
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {initialProducts.length === 0 && (
            <div className="text-center p-8 text-gray-500">
                No products found.
            </div>
        )}
      </div>
    </div>
  );
}