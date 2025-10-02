// src/app/(admin)/admin/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Barcode, LineChart, LogOut } from 'lucide-react';
import SignOutButton from './_components/SignOutButton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <div className="mb-8">
          <Link href="/admin/products">
            <h2 className="text-2xl font-bold text-white hover:text-blue-300">Admin Panel</h2>
          </Link>
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-4">
              <Link href="/admin/products" className="flex items-center p-2 rounded hover:bg-gray-700">
                <Package className="mr-3" /> Products
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/admin/unknown-barcodes" className="flex items-center p-2 rounded hover:bg-gray-700">
                <Barcode className="mr-3" /> Unknown Barcodes
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/admin/sales" className="flex items-center p-2 rounded hover:bg-gray-700">
                <LineChart className="mr-3" /> Sales Reports
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}