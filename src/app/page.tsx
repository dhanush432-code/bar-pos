'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ScanLine, History, ShoppingCart, RefreshCw, ArrowRight, CornerDownLeft } from 'lucide-react';

// Interface for a transaction item
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

  // --- ROBUST FOCUSING SOLUTION ---
  // This useEffect hook is dedicated to keeping the input field focused.
  // It runs whenever the 'isLoading' state changes.
  useEffect(() => {
    // If we are NOT loading, it means we are ready for a new scan.
    // So, we focus the input field.
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading, mode]); // Also re-focus when mode changes

  const handleScanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || isLoading) return; // Prevent multiple submissions

    setIsLoading(true); // This will cause the input to blur temporarily
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
          setRecentTransactions(prev => [newItem, ...prev].slice(0, 50));
          toast.success(`Sold: ${newItem.productName}`, { id: toastId });
        } else {
          toast.error(result.message || 'Sale failed.', { id: toastId });
        }
      } else { // Return mode
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
      setIsLoading(false); // This will trigger the useEffect above to re-focus the input
    }
  };

  const filteredTransactions = recentTransactions.filter(tx => {
    if (mode === 'sale') {
      return !tx.isReturn;
    } else {
      return tx.isReturn;
    }
  });

  // Helper to re-focus if the user clicks away from the input
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target instanceof HTMLElement && e.target.closest('button, input'))) {
      inputRef.current?.focus();
    }
  };

  return (
    // The main container click handler is a good backup
    <div className="min-h-screen bg-slate-100 font-sans p-4 sm:p-6 lg:p-8" onClick={handleContainerClick}>
      <Toaster
        position="top-center"
        toastOptions={{
            success: { iconTheme: { primary: 'white', secondary: '#10b981' }, style: { background: '#10b981', color: 'white' }},
            error: { iconTheme: { primary: 'white', secondary: '#ef4444' }, style: { background: '#ef4444', color: 'white' }},
        }}
      />
      <div className="w-full mx-auto flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]">
        <header className="mb-6 text-center">
          <h1 className="text-5xl font-bold text-slate-800 tracking-tight">Instant POS</h1>
          <p className="text-slate-500 mt-2 text-lg">
            {mode === 'sale' ? 'Scan to make an instant sale.' : 'Scan a damaged item to process a return.'}
          </p>
        </header>

        <div className="relative flex p-1 bg-slate-200 rounded-full w-full max-w-sm mx-auto mb-8 shadow-inner">
            <span
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full shadow-md transition-all duration-300 ease-in-out ${mode === 'return' ? 'translate-x-full bg-red-500' : 'translate-x-0 bg-green-500'}`}
            />
            <button
                onClick={() => setMode('sale')}
                className={`relative z-10 flex-1 font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2 ${mode === 'sale' ? 'text-white' : 'text-slate-800'}`}
            >
                <ShoppingCart size={20} /> Sale
            </button>
            <button
                onClick={() => setMode('return')}
                className={`relative z-10 flex-1 font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2 ${mode === 'return' ? 'text-white' : 'text-slate-800'}`}
            >
                <RefreshCw size={20} /> Return
            </button>
        </div>

        <form onSubmit={handleScanSubmit} className="relative mb-6">
          <ScanLine
            className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${mode === 'sale' ? 'text-green-500' : 'text-red-500'}`}
            size={28}
          />
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={mode === 'sale' ? 'Scan item to sell...' : 'Scan item to return...'}
            className={`w-full pl-16 pr-6 py-5 text-xl bg-white border-2 rounded-xl transition-all duration-300 shadow-sm focus:ring-4 ${
              mode === 'sale'
                ? 'border-slate-300 focus:border-green-500 focus:ring-green-500/20'
                : 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            }`}
            disabled={isLoading}
            autoFocus // Good for initial load
          />
        </form>

        {/* ... rest of your JSX is fine, no changes needed below ... */}
        <div className="flex-grow bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
          <header className="sticky top-0 bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 p-4 z-10">
             <h2 className="text-xl font-semibold text-slate-700 flex items-center">
                <History className="mr-3 text-slate-500" size={22}/>
                {mode === 'sale' ? 'Recent Sales' : 'Recent Returns'}
             </h2>
          </header>

          <div className="flex-grow overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                <div className={`p-5 rounded-full mb-4 ${mode === 'sale' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                    {mode === 'sale' ? <ShoppingCart size={48} /> : <RefreshCw size={48} />}
                </div>
                <h3 className="text-xl font-semibold text-slate-700">No transactions yet</h3>
                <p>
                  {mode === 'sale' ? 'Scan an item to see the sale here.' : 'Scan an item to see the return here.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {filteredTransactions.map((tx) => (
                  <li
                    key={tx._id}
                    className={`flex justify-between items-center p-4 transition-colors ${tx.isReturn ? 'hover:bg-red-50' : 'hover:bg-green-50'}`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${tx.isReturn ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                           {tx.isReturn ? <CornerDownLeft size={20} /> : <ArrowRight size={20} />}
                        </div>
                        <div>
                            <p className={`font-semibold text-lg ${tx.isReturn ? 'text-red-800' : 'text-slate-800'}`}>{tx.productName}</p>
                            <p className={`text-sm ${tx.isReturn ? 'text-red-600' : 'text-slate-500'}`}>{tx.category}</p>
                        </div>
                    </div>
                    <div className='text-right'>
                       <p className={`text-xl font-bold ${tx.isReturn ? 'text-red-700' : 'text-green-700'}`}>
                          {tx.isReturn ? '-' : ''}₹{tx.sRate.toFixed(2)}
                       </p>
                       <p className="text-xs text-slate-400 mt-1">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}