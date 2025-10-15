'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingBag, Filter, Calendar, Package, FileDown } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

// --- Import new libraries for downloads ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // CORRECTED IMPORT
import * as XLSX from 'xlsx';

// --- Type definitions remain the same ---
interface DailySale {
  _id: string; 
  totalRevenue: number;
  totalItemsSold: number;
  numberOfSales: number;
}

interface TotalStats {
  totalRevenue: number;
  totalSales: number;
}

interface ProductSale {
  productName: string;
  totalItemsSold: number;
  totalRevenue: number;
}

// --- API Response Type ---
interface SalesData {
  dailySales: DailySale[];
  totalStats: TotalStats;
  productWiseSales: ProductSale[];
  allProducts: string[];
}

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

const hoverEffect = {
    y: -5,
    transition: {
        duration: 0.3
    }
}


export default function SalesReportPage() {
  // --- State management for data and filters ---
  const [data, setData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  const currencySymbol = '₹';

  // --- Data fetching function ---
  const fetchSalesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (selectedProduct) params.append('product', selectedProduct);

    try {
      const res = await fetch(`/api/sales?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch sales data');
      }
      const result: SalesData = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedProduct]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalesData();
  };

  const { dailySales = [], totalStats = { totalRevenue: 0, totalSales: 0 }, productWiseSales = [], allProducts = [] } = data || {};

  // --- Download Handler ---
  const handleDownload = (format: 'pdf' | 'excel', dataType: 'daily' | 'product') => {
    const isDaily = dataType === 'daily';
    const dataToExport = isDaily ? dailySales : productWiseSales;
    const filename = isDaily ? 'daily_sales_report' : 'product_performance_report';
    
    const headers = isDaily
      ? [['Date', 'Revenue', 'Items Sold', '# of Sales']]
      : [['Product Name', 'Total Items Sold', 'Total Revenue']];

    const body = dataToExport.map(item => {
      if ('_id' in item) { // DailySale type guard
        return [
          new Date(item._id).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
          `${currencySymbol}${item.totalRevenue.toFixed(2)}`,
          item.totalItemsSold,
          item.numberOfSales
        ];
      }
      // ProductSale
      return [
        item.productName,
        item.totalItemsSold,
        `${currencySymbol}${item.totalRevenue.toFixed(2)}`
      ];
    });

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        body.map(row => 
            isDaily
            ? { Date: row[0], Revenue: row[1], 'Items Sold': row[2], '# of Sales': row[3] }
            : { 'Product Name': row[0], 'Total Items Sold': row[1], 'Total Revenue': row[2] }
        )
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${filename}.xlsx`);

    } else if (format === 'pdf') {
      const doc = new jsPDF();
      // CORRECTED FUNCTION CALL
      autoTable(doc, {
        head: headers,
        body: body,
        startY: 10,
      });
      doc.save(`${filename}.pdf`);
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Sales Dashboard</h1>
        </motion.div>

        {/* --- Stats Cards (Animated) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div variants={itemVariants} whileHover={hoverEffect} className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden cursor-pointer">
            <div className="relative z-10">
              <p className="text-sm font-medium text-pink-100">Total Revenue</p>
              <p className="text-3xl font-bold">{currencySymbol}{totalStats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <DollarSign className="absolute -right-4 -bottom-4 h-24 w-24 text-white/20" />
          </motion.div>
          <motion.div variants={itemVariants} whileHover={hoverEffect} className="bg-gradient-to-r from-cyan-400 to-sky-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden cursor-pointer">
            <div className="relative z-10">
              <p className="text-sm font-medium text-cyan-100">Total Sales Transactions</p>
              <p className="text-3xl font-bold">{totalStats.totalSales.toLocaleString('en-IN')}</p>
            </div>
            <ShoppingBag className="absolute -right-4 -bottom-4 h-24 w-24 text-white/20" />
          </motion.div>
        </div>

        {/* --- Filter Controls (Restored) --- */}
        <motion.div variants={itemVariants} whileHover={hoverEffect} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="relative">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
              <Calendar className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div className="relative">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
              <Calendar className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div className="relative">
              <label htmlFor="product" className="block text-sm font-medium text-gray-600 mb-1">Product</label>
              <Package className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
              >
                <option value="">All Products</option>
                {allProducts.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-transform transform hover:scale-105 shadow-md"
            >
              <Filter className="mr-2 h-4 w-4" />
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </button>
          </form>
        </motion.div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8 text-center">{error}</div>}

        {/* --- Daily Sales Table (with Download Buttons) --- */}
        <motion.div variants={itemVariants} whileHover={hoverEffect} className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-xl"></div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-700">Daily Sales Breakdown</h2>
                    <div className="flex gap-2">
                        <button onClick={() => handleDownload('pdf', 'daily')} disabled={dailySales.length === 0} className="flex items-center gap-2 text-sm bg-red-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition">
                            <FileDown size={16}/> PDF
                        </button>
                        <button onClick={() => handleDownload('excel', 'daily')} disabled={dailySales.length === 0} className="flex items-center gap-2 text-sm bg-green-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition">
                            <FileDown size={16}/> Excel
                        </button>
                    </div>
                </div>
                <div className="overflow-auto h-96">
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Items Sold</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider"># of Sales</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {!isLoading && dailySales.length > 0 ? (
                        dailySales.map((day) => (
                        <tr key={day._id} className="hover:bg-gray-50 transition">
                            <td className="p-4 font-medium text-gray-800">{new Date(day._id).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</td>
                            <td className="p-4 text-right text-green-600 font-semibold">{currencySymbol}{day.totalRevenue.toFixed(2)}</td>
                            <td className="p-4 text-right text-gray-700">{day.totalItemsSold}</td>
                            <td className="p-4 text-right text-gray-700">{day.numberOfSales}</td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan={4} className="text-center p-12 text-gray-500">
                            {isLoading ? "Loading data..." : "No sales data available for the selected filters."}
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </motion.div>
        
        {/* --- Product-wise Sales Table (with Download Buttons) --- */}
        <motion.div variants={itemVariants} whileHover={hoverEffect} className="bg-white rounded-xl shadow-lg border border-gray-200">
             <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-xl"></div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-700">Product Performance</h2>
                     <div className="flex gap-2">
                        <button onClick={() => handleDownload('pdf', 'product')} disabled={productWiseSales.length === 0} className="flex items-center gap-2 text-sm bg-red-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition">
                            <FileDown size={16}/> PDF
                        </button>
                        <button onClick={() => handleDownload('excel', 'product')} disabled={productWiseSales.length === 0} className="flex items-center gap-2 text-sm bg-green-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition">
                            <FileDown size={16}/> Excel
                        </button>
                    </div>
                </div>
                <div className="overflow-auto h-96">
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Items Sold</th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Revenue</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {!isLoading && productWiseSales.length > 0 ? (
                        productWiseSales.map((product) => (
                        <tr key={product.productName} className="hover:bg-gray-50 transition">
                            <td className="p-4 font-medium text-gray-800">{product.productName}</td>
                            <td className="p-4 text-right text-gray-700">{product.totalItemsSold.toLocaleString('en-IN')}</td>
                            <td className="p-4 text-right text-green-600 font-semibold">{currencySymbol}{product.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan={3} className="text-center p-12 text-gray-500">
                            {isLoading ? "Loading data..." : "No product-wise sales data available for the selected filters."}
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
}