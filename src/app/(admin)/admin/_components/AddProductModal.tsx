// src/app/(admin)/admin/_components/AddProductModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  initialBarcode?: string;
}

export default function AddProductModal({ isOpen, onClose, onProductAdded, initialBarcode = '' }: AddProductModalProps) {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState('');
  const [subProduct, setSubProduct] = useState('');
  const [unit, setUnit] = useState('');
  const [sRate, setSRate] = useState('');
  const [stock, setStock] = useState('');
  const [basic, setBasic] = useState(''); // <-- ADD state for the new field

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialBarcode) {
      setBarcode(initialBarcode);
    }
    if (!isOpen) {
      setBarcode('');
      setProduct('');
      setSubProduct('');
      setUnit('');
      setSRate('');
      setStock('');
      setBasic(''); // <-- RESET the new field on close
    }
  }, [isOpen, initialBarcode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Adding new product...');

    // Add 'basic' to the data object sent to the API
    const productData = {
      barcode,
      product,
      subProduct,
      unit,
      sRate: parseFloat(sRate),
      stock: parseInt(stock, 10),
      basic: basic ? parseFloat(basic) : null, // Send basic rate or null
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        toast.success('Product added successfully!', { id: toastId });
        onProductAdded();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.message}`, { id: toastId });
      }
    } catch (error) {
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium">Barcode *</label><input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} required className="w-full mt-1 p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium">Product Name *</label><input type="text" value={product} onChange={(e) => setProduct(e.target.value)} required className="w-full mt-1 p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium">Sub Product (e.g., 30ml, Pint) *</label><input type="text" value={subProduct} onChange={(e) => setSubProduct(e.target.value)} required className="w-full mt-1 p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium">Unit (e.g., Bottle)</label><input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Bottle, Can, Shot" className="w-full mt-1 p-2 border rounded" /></div>
          
          {/* <-- MOVED selling rate and ADDED basic rate --> */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium">Basic Rate (₹)</label><input type="number" step="0.01" value={basic} onChange={(e) => setBasic(e.target.value)} className="w-full mt-1 p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium">Selling Rate (₹) *</label><input type="number" step="0.01" value={sRate} onChange={(e) => setSRate(e.target.value)} required className="w-full mt-1 p-2 border rounded" /></div>
          </div>
          <div><label className="block text-sm font-medium">Initial Stock *</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full mt-1 p-2 border rounded" /></div>

          <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button><button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">{isLoading ? 'Saving...' : 'Save Product'}</button></div>
        </form>
      </div>
    </div>
  );
}