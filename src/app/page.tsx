// src/app/pos/page.tsx
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ScanLine, History, ShoppingCart, RefreshCw } from 'lucide-react';

// Interface remains the same, `isReturn` is key
interface TransactionItem {
  _id: string; 
  productName: string;
  category: string;
  sRate: number;
  timestamp: string;
  isReturn?: boolean;
}

export default function POSPage() {
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [mode, setMode] = useState<'sale' | 'return'>('sale');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  // The handleScanSubmit function remains exactly the same.
  // It correctly adds sales and returns to the single master list.
  const handleScanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setIsLoading(true);
    const toastId = toast.loading(`Processing ${barcode}...`);
    
    try {
      if (mode === 'sale') {
        const res = await fetch('/api/sales/instant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode, paymentMethod: 'Cash', quantity: 1 }),
        });
        const result = await res.json();
        if (res.ok) {
          const newItem: TransactionItem = {
            _id: result.saleId,
            productName: result.product.displayName,
            category: result.product.category,
            sRate: result.product.sRate,
            timestamp: new Date().toISOString(),
          };
          setRecentTransactions(prev => [newItem, ...prev].slice(0, 50)); // Increase slice size to hold more history
          toast.success(`Sold: ${newItem.productName}`, { id: toastId });
        } else {
          toast.error(result.message || 'Sale failed.', { id: toastId });
        }
      } else {
        const res = await fetch('/api/returns/instant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode, quantity: 1, reason: 'Damaged' }),
        });
        const result = await res.json();
        if (res.ok) {
          const newItem: TransactionItem = {
            _id: result.returnId,
            productName: result.product.displayName,
            category: result.product.category,
            sRate: result.product.sRate,
            timestamp: new Date().toISOString(),
            isReturn: true,
          };
          setRecentTransactions(prev => [newItem, ...prev].slice(0, 50));
          toast.success(`Returned: ${newItem.productName}`, { id: toastId, icon: '↩️' });
        } else {
          toast.error(result.message || 'Return failed.', { id: toastId });
        }
      }
    } catch (error) {
      toast.error('Network error.', { id: toastId });
      console.error(error);
    } finally {
      setBarcode('');
      setIsLoading(false);
      inputRef.current?.focus(); 
    }
  };

  // --- NEW LOGIC: Filter transactions based on the current mode ---
  // This is "derived state". We compute it on every render.
  const filteredTransactions = recentTransactions.filter(tx => {
    if (mode === 'sale') {
      return !tx.isReturn; // Show items that are NOT returns
    } else { // mode === 'return'
      return tx.isReturn; // Show items that ARE returns
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
        <header className="mb-4">
          <h1 className="text-4xl font-bold text-gray-800">Instant POS</h1>
          <p className="text-gray-500">
            {mode === 'sale' ? 'Scan a barcode to instantly complete a sale.' : 'Scan a damaged item to process a return.'}
          </p>
        </header>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setMode('sale')}
            className={`flex-1 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'sale' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}
          >
            <ShoppingCart size={20} /> Sale Mode
          </button>
          <button
            onClick={() => setMode('return')}
            className={`flex-1 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'return' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}
          >
            <RefreshCw size={20} /> Return Mode
          </button>
        </div>
        
        <form onSubmit={handleScanSubmit} className="relative mb-6">
          <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={mode === 'sale' ? 'Scan Barcode to Sell...' : 'Scan Barcode to Return...'}
            className={`w-full pl-14 pr-4 py-4 text-lg border-2 rounded-lg transition focus:ring-2 ${mode === 'sale' ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-red-300 focus:ring-red-500 focus:border-red-500'}`}
            disabled={isLoading}
            autoFocus
          />
        </form>

        <div className="flex-grow bg-white rounded-lg shadow-md overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-gray-50 border-b p-4 z-10">
             <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                <History className="mr-2" size={22}/>
                {/* Title dynamically changes based on mode */}
                {mode === 'sale' ? 'Recent Sales' : 'Recent Returns'}
             </h2>
          </div>
          
          {/* --- CHANGE: Use the `filteredTransactions` array for rendering --- */}
          {filteredTransactions.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-center text-gray-500">
              <p>
                {/* Empty state message dynamically changes */}
                {mode === 'sale' ? 'No recent sales to show.' : 'No recent returns to show.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <li key={tx._id} className={`flex justify-between items-center p-4 ${tx.isReturn ? 'bg-red-50' : ''}`}>
                  <div>
                    <p className={`font-medium ${tx.isReturn ? 'text-red-800' : 'text-gray-800'}`}>{tx.productName}</p>
                    <p className={`text-sm ${tx.isReturn ? 'text-red-600' : 'text-gray-500'}`}>{tx.category}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className='text-right'>
                     <p className={`text-lg font-semibold ${tx.isReturn ? 'text-red-700' : 'text-gray-900'}`}>
                        {tx.isReturn ? '-' : ''}₹{tx.sRate.toFixed(2)}
                     </p>
                     {tx.isReturn && <p className='text-xs font-bold text-red-500 uppercase'>Returned</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}