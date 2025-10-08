import { DollarSign, ShoppingBag } from 'lucide-react';

// Define the types for the data we expect from the API
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

// This function now fetches data from our API endpoint
async function getSalesData(): Promise<{ dailySales: DailySale[], totalStats: TotalStats }> {
  try {
    // It's best practice to use an absolute URL for server-side fetches.
    // Make sure to create a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:3000
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales`, { 
      cache: 'no-store' // Ensures we always get the latest sales data
    });

    if (!res.ok) {
      throw new Error('Failed to fetch sales data');
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch sales from API:", error);
    // Return a default empty state to prevent the page from crashing
    return {
      dailySales: [],
      totalStats: { totalRevenue: 0, totalSales: 0 }
    };
  }
}


export default async function SalesReportPage() {
  // The page component calls the fetcher function, but its rendering logic remains the same.
  const { dailySales, totalStats } = await getSalesData();
  const currencySymbol = '₹';

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Sales Reports</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <DollarSign className="text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold">
              {currencySymbol}{totalStats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <ShoppingBag className="text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Sales Transactions</p>
            <p className="text-2xl font-bold">{totalStats.totalSales.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Daily Sales Table */}
      <h2 className="text-2xl font-bold mb-4">Daily Sales (Last 30 Days)</h2>
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-600">Date</th>
              <th className="p-3 text-right font-semibold text-gray-600">Revenue</th>
              <th className="p-3 text-right font-semibold text-gray-600">Items Sold</th>
              <th className="p-3 text-right font-semibold text-gray-600"># of Sales</th>
            </tr>
          </thead>
          <tbody>
            {dailySales.length > 0 ? (
              dailySales.map((day) => (
                <tr key={day._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{new Date(day._id).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</td>
                  <td className="p-3 text-right">{currencySymbol}{day.totalRevenue.toFixed(2)}</td>
                  <td className="p-3 text-right">{day.totalItemsSold}</td>
                  <td className="p-3 text-right">{day.numberOfSales}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center p-8 text-gray-500">
                  No sales data available for the last 30 days.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}