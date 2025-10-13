// app/(pos)/page.tsx
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useCartStore } from '@/store/cartStore';
import toast, { Toaster } from 'react-hot-toast';
import { ScanLine, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export default function POSPage() {
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { items, addItem, increaseQuantity, decreaseQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input field on component mount
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e: FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/products/${barcode}`);
      
      if (res.ok) {
        const product = await res.json();
        if (product.stock > 0) {
            addItem(product);
            toast.success(`${product.productCategory} added to cart.`);
        } else {
            toast.error(`${product.productCategory} is out of stock.`);
        }
      } else if (res.status === 404) {
        // Product not found, log it and notify manager
        toast.error('Unknown Product: Call Manager!');
        await fetch('/api/unknown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode }),
        });
      } else {
        toast.error('An error occurred.');
      }
    } catch (error) {
      toast.error('Network error. Check connection.');
      console.error(error);
    } finally {
      setBarcode('');
      setIsLoading(false);
    }
  };

  const handleCheckout = async (paymentMethod: 'Cash' | 'Card') => {
    if (items.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    const saleData = {
      items: items.map(item => ({
        productId: item._id,
        barcode: item.shortcode,
        product: `${item.productCategory} ${item.subProductName || ''}`.trim(),
        quantity: item.quantity,
        sRate: item.sRate,
        total: item.sRate * item.quantity,
      })),
      totalAmount: getTotal(),
      paymentMethod,
    };

    const toastId = toast.loading('Processing checkout...');
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (res.ok) {
        toast.success('Checkout successful!', { id: toastId });
        clearCart();
      } else {
        const errorData = await res.json();
        toast.error(`Checkout failed: ${errorData.message}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Network error during checkout.', { id: toastId });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Toaster />
      {/* Left Panel: Barcode Scanner & Cart */}
      <div className="w-3/5 p-6 flex flex-col">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Barcode POS</h1>
          <p className="text-gray-500">Scan product barcodes to add them to the cart.</p>
        </header>
        
        <form onSubmit={handleScan} className="relative mb-6">
          <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan Barcode..."
            className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isLoading}
            autoFocus
          />
        </form>

        <div className="flex-grow bg-white rounded-lg shadow-md overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold text-center">Quantity</th>
                <th className="p-4 font-semibold text-right">Price</th>
                <th className="p-4 font-semibold text-right">Total</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-500">
                    <ShoppingCart className="mx-auto mb-2" size={48} />
                    Cart is empty. Scan a product to begin.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.shortcode} className="border-b">
                    <td className="p-4">
                      <p className="font-medium">{item.productCategory}</p>
                      <p className="text-sm text-gray-500">{item.subProductName || item.shortcode}</p>
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {/* --- FIX: Add non-null assertion (!) --- */}
                            <button onClick={() => decreaseQuantity(item.shortcode!)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={16}/></button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            {/* --- FIX: Add non-null assertion (!) --- */}
                            <button onClick={() => increaseQuantity(item.shortcode!)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={16}/></button>
                        </div>
                    </td>
                    <td className="p-4 text-right">${item.sRate.toFixed(2)}</td>
                    <td className="p-4 text-right font-semibold">${(item.sRate * item.quantity).toFixed(2)}</td>
                    <td className="p-4 text-right">
                       {/* --- FIX: Add non-null assertion (!) --- */}
                      <button onClick={() => removeItem(item.shortcode!)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel: Checkout */}
      <div className="w-2/5 bg-white p-8 shadow-lg flex flex-col justify-between">
        <div>
            <h2 className="text-3xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4">
            {items.map(item => (
                <div key={item.shortcode} className="flex justify-between items-center text-gray-700">
                    <span>{item.productCategory} x{item.quantity}</span>
                    <span>${(item.sRate * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            </div>
        </div>
        
        <div className="border-t pt-6">
            <div className="flex justify-between items-center text-2xl font-bold mb-6">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleCheckout('Cash')} className="w-full bg-green-500 text-white font-bold py-4 rounded-lg hover:bg-green-600 transition text-lg">
                    Pay with Cash
                </button>
                <button onClick={() => handleCheckout('Card')} className="w-full bg-blue-500 text-white font-bold py-4 rounded-lg hover:bg-blue-600 transition text-lg">
                    Pay with Card
                </button>
            </div>
             <button onClick={clearCart} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition text-sm mt-4">
                    Clear Cart
            </button>
        </div>
      </div>
    </div>
  );
}