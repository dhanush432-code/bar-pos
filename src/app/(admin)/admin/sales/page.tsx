// src/app/(admin)/admin/sales/page.tsx
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import { DollarSign, ShoppingBag, BarChart2 } from 'lucide-react';

interface DailySale {
  _id: string; // Date string like "2023-10-27"
  totalRevenue: number;
  totalItemsSold: number;
  numberOfSales: number;
}

interface TotalStats {
  totalRevenue: number;
  totalSales: number;
}

// This function runs on the server to perform database aggregations
async function getSalesData(): Promise<{ dailySales: DailySale[], totalStats: TotalStats }> {
  await dbConnect();

  // Aggregation for daily sales breakdown (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailySales: DailySale[] = await Sale.aggregate([
    { $match: { timestamp: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        totalRevenue: { $sum: "$totalAmount" },
        totalItemsSold: { $sum: { $sum: "$items.quantity" } },
        numberOfSales: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  // Aggregation for overall total stats
  const totalStatsArr = await Sale.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalSales: { $sum: 1 },
      },
    },
  ]);
  
  const totalStats = totalStatsArr[0] || { totalRevenue: 0, totalSales: 0 };
  
  return { dailySales, totalStats };
}

export default async function SalesReportPage() {
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
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">Items Sold</th>
              <th className="p-3 text-right"># of Sales</th>
            </tr>
          </thead>
          <tbody>
            {dailySales.length > 0 ? (
              dailySales.map((day) => (
                <tr key={day._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{new Date(day._id).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
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