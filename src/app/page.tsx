'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useCartStore } from '@/store/cartStore';
import toast, { Toaster } from 'react-hot-toast';
import { ScanLine, Trash2, Plus, Minus, ShoppingCart, CheckCircle } from 'lucide-react';
// Correctly import the IProduct interface from your model file
import { IProduct } from '@/models/Product';

export default function POSPage() {
  const currencySymbol = '₹';
  
  // The state variable for the input can still be called 'barcode' for clarity
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { items, addItem, increaseQuantity, decreaseQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-focus the input field whenever the cart is cleared or an item is added
  useEffect(() => {
    inputRef.current?.focus();
  }, [items.length]);

  const handleScan = async (e: FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setIsLoading(true);

    try {
      // The API endpoint should use the [shortcode] parameter we fixed
      const res = await fetch(`/api/products/${barcode}`);
      
      if (res.ok) {
        // Type the fetched product according to your IProduct interface
        const product: IProduct = await res.json();
        
        // Add the item to the cart (the stock check is removed as 'stock' is not in the model)
        addItem(product);
        
        // Display the correct product name from the model
        toast.success(`${product.subProductName} added to cart.`);

      } else if (res.status === 404) {
        toast.error('Unknown Product: Call Manager!');
        // Log the unknown barcode to a separate API if needed
        await fetch('/api/unknown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode }),
        });
      } else {
        toast.error('An error occurred while fetching the product.');
      }
    } catch (error) {
      toast.error('Network error. Please check your connection.');
      console.error("Scanning Error:", error);
    } finally {
      setBarcode('');
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    // Construct the sale data using the correct property names from the IProduct model
    const saleData = {
      items: items.map(item => ({
        productId: item._id,       // Use _id from the product document
        barcode: item.shortcode,   // Use 'shortcode' field
        product: item.subProductName, // Use 'subProductName' field
        quantity: item.quantity,
        sRate: item.sRate,
        total: item.sRate * item.quantity,
      })),
      totalAmount: getTotal(),
      paymentMethod: 'Cash', // Assuming cash payment
    };

    const toastId = toast.loading('Processing Sale...');
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (res.ok) {
        toast.success('Sale Finalized!', { id: toastId });
        clearCart();
      } else {
        const errorData = await res.json();
        toast.error(`Checkout failed: ${errorData.message || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Network error during checkout.', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">
      <Toaster position="top-center" />
      {/* Left Panel: Barcode Scanner & Cart */}
      <div className="w-full md:w-3/5 p-6 flex flex-col">
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
            placeholder="Scan Barcode and press Enter..."
            className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isLoading}
            autoFocus
          />
        </form>

        <div className="flex-grow bg-white rounded-lg shadow-md overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Product</th>
                <th className="p-4 font-semibold text-center text-gray-700">Quantity</th>
                <th className="p-4 font-semibold text-right text-gray-700">Price</th>
                <th className="p-4 font-semibold text-right text-gray-700">Total</th>
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
                  <tr key={item.shortcode || item.code} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {/* Display the correct product details */}
                      <p className="font-medium text-gray-800">{item.subProductName}</p>
                      <p className="text-sm text-gray-500">{item.productCategory}</p>
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {/* Pass the correct identifier ('shortcode') to store functions */}
                            <button onClick={() => item.shortcode && decreaseQuantity(item.shortcode)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><Minus size={16}/></button>
                            <span className="w-8 text-center font-medium text-lg">{item.quantity}</span>
                            <button onClick={() => item.shortcode && increaseQuantity(item.shortcode)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><Plus size={16}/></button>
                        </div>
                    </td>
                    <td className="p-4 text-right">{currencySymbol}{item.sRate.toFixed(2)}</td>
                    <td className="p-4 text-right font-semibold">{currencySymbol}{(item.sRate * item.quantity).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => item.shortcode && removeItem(item.shortcode)} className="text-red-500 hover:text-red-700 transition-colors">
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
      <div className="w-full md:w-2/5 bg-white p-8 shadow-lg flex flex-col justify-between">
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Order Summary</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {items.map(item => (
                <div key={item.shortcode || item.code} className="flex justify-between items-center text-gray-700">
                    <span>{item.subProductName} <span className="text-gray-500">x{item.quantity}</span></span>
                    <span className="font-medium">{currencySymbol}{(item.sRate * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            </div>
        </div>
        
        <div className="border-t pt-6 mt-4">
            <div className="flex justify-between items-center text-2xl font-bold mb-6">
                <span className="text-gray-800">Total</span>
                <span className="text-blue-600">{currencySymbol}{getTotal().toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-4">
                <button 
                  onClick={handleCheckout} 
                  disabled={items.length === 0 || isLoading}
                  className="w-full bg-green-500 text-white font-bold py-5 rounded-lg hover:bg-green-600 transition text-xl flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <CheckCircle size={24} />
                    Finalize Sale
                </button>
                <button 
                  onClick={clearCart} 
                  disabled={items.length === 0}
                  className="w-full bg-red-100 text-red-700 font-bold py-2 rounded-lg hover:bg-red-200 transition text-sm mt-2 disabled:bg-gray-200 disabled:text-gray-400"
                >
                    Clear Cart
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}