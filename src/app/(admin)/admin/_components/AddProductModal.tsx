// src/app/(admin)/admin/_components/AddProductModal.tsx
'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import toast from 'react-hot-toast';
import { IProduct } from '@/models/Product';
import { X } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void; // Generic callback for add or update
  productData: IProduct | null; 
   initialBarcode?: string;// Pass product data for editing, or null for adding
}

export default function AddProductModal({ isOpen, onClose, onActionComplete, productData }: AddProductModalProps) {
  const isEditMode = Boolean(productData);

  // State for all form fields
  const [shortcode, setShortcode] = useState('');
  const [subProductName, setSubProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [mrpRate, setMrpRate] = useState('');
  const [basicRate, setBasicRate] = useState('');
  const [sRate, setSRate] = useState('');
  const [stock, setStock] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ref for the barcode input to auto-focus for scanning
  const shortcodeRef = useRef<HTMLInputElement>(null);

  // Effect to populate form when in edit mode or clear it for add mode
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && productData) {
        setShortcode(productData.shortcode || '');
        setSubProductName(productData.subProductName);
        setProductCategory(productData.productCategory);
        setMrpRate(String(productData.mrpRate));
        setBasicRate(String(productData.basicRate));
        setSRate(String(productData.sRate));
        setStock(String(productData.stock));
        
        // Auto-focus and select the barcode input for quick scanning
        setTimeout(() => {
          shortcodeRef.current?.focus();
          shortcodeRef.current?.select();
        }, 100);

      } else {
        // Clear form for Add mode
        setShortcode('');
        setSubProductName('');
        setProductCategory('');
        setMrpRate('');
        setBasicRate('');
        setSRate('');
        setStock('0');
      }
    }
  }, [isOpen, productData, isEditMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading(isEditMode ? 'Updating product...' : 'Adding product...');

    const payload = {
      shortcode,
      subProductName,
      productCategory,
      mrpRate: parseFloat(mrpRate),
      basicRate: parseFloat(basicRate),
      sRate: parseFloat(sRate),
      stock: parseInt(stock, 10),
    };

    try {
      const url = isEditMode ? `/api/products/${productData?._id}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Action failed.');
      }

      toast.success(`Product ${isEditMode ? 'updated' : 'added'} successfully!`, { id: toastId });
      onActionComplete();
      onClose();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Barcode (Shortcode)</label>
            <input 
              ref={shortcodeRef}
              type="text" 
              value={shortcode} 
              onChange={(e) => setShortcode(e.target.value)} 
              placeholder="Scan or enter barcode"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name *</label>
            <input 
              type="text" 
              value={subProductName} 
              onChange={(e) => setSubProductName(e.target.value)} 
              required 
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" 
            />
          </div>
           {/* ... other form fields are identical to previous step ... */}
           <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <input 
              type="text" 
              value={productCategory} 
              onChange={(e) => setProductCategory(e.target.value)} 
              required 
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">MRP Rate (₹) *</label>
              <input type="number" step="0.01" value={mrpRate} onChange={(e) => setMrpRate(e.target.value)} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Rate (₹) *</label>
              <input type="number" step="0.01" value={sRate} onChange={(e) => setSRate(e.target.value)} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Basic Rate (₹) *</label>
              <input type="number" step="0.01" value={basicRate} onChange={(e) => setBasicRate(e.target.value)} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock *</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}