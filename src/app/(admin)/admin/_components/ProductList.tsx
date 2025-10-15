'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IProduct } from '@/models/Product';
import AddProductModal from '@/app/(admin)/admin/_components/AddProductModal';
import { PlusCircle, Edit, Search, Package, FileDown } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Import jsPDF and the autoTable function
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ProductListProps {
  initialProducts: IProduct[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<IProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: IProduct) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleActionComplete = () => {
    router.refresh();
  };

  const filteredProducts = initialProducts.filter(
    (product) =>
      product.subProductName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (product.shortcode &&
        product.shortcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- DOWNLOAD HANDLERS (with fix) ---

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Product List', 14, 16);

    // FIX: Call autoTable as a function and pass the doc instance
    autoTable(doc, {
      head: [['Product Name', 'Category', 'Shortcode', 'Price (₹)', 'Stock']],
      body: filteredProducts.map((p) => [
        p.subProductName,
        p.productCategory,
        p.shortcode || 'N/A',
        p.sRate.toFixed(2),
        p.stock,
      ]),
      startY: 20,
    });

    doc.save('products.pdf');
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredProducts.map((p) => ({
        'Product Name': p.subProductName,
        Category: p.productCategory,
        Shortcode: p.shortcode || 'N/A',
        'Selling Rate (₹)': p.sRate,
        Stock: p.stock,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'products.xlsx');
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
              Product Management
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              A comprehensive overview of your inventory.
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-4 mt-4 sm:mt-0">
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-2.5 border rounded-full w-64 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            {/* Download Buttons with new colors */}
            <button
              onClick={handleDownloadPDF}
              className="bg-red-600 text-white px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
            >
              <FileDown size={18} />
              Export PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              className="bg-green-600 text-white px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
            >
              <FileDown size={18} />
              Export Excel
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-lg"
            >
              <PlusCircle size={20} />
              <span className="font-semibold">Add New</span>
            </button>
          </div>
        </header>

        <AddProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onActionComplete={handleActionComplete}
          productData={productToEdit}
        />

        <div className="bg-white rounded-xl shadow-lg">
          <div className="space-y-2 p-4">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-gray-500 uppercase border-b">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">Shortcode</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Stock</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg hover:bg-indigo-50 transition-colors duration-200 group"
              >
                <div className="col-span-12 md:col-span-5">
                  <div className="font-bold text-gray-800">
                    {product.subProductName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.productCategory}
                  </div>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <span className="md:hidden text-xs text-gray-500">Shortcode: </span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded-md text-sm">
                    {product.shortcode || 'N/A'}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-2 text-left md:text-right">
                  <span className="md:hidden text-xs text-gray-500">Price: </span>
                  <span className="font-semibold">{`₹${product.sRate.toFixed(2)}`}</span>
                </div>
                <div className="col-span-6 md:col-span-2 text-left md:text-right">
                  <span className="md:hidden text-xs text-gray-500">Stock: </span>
                  <span
                    className={`font-bold ${
                      product.stock > 10 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {product.stock}
                  </span>
                </div>
                <div className="col-span-6 md:col-span-1 text-left md:text-center">
                  <button
                    onClick={() => handleOpenEditModal(product)}
                    className="text-gray-400 hover:text-indigo-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Product"
                  >
                    <Edit size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-gray-400" />
              <h3 className="mt-4 text-xl font-semibold text-gray-700">
                No products found
              </h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your search or add a new product.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}