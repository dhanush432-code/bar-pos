import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product'; // Assumes you have the updated Product model with a 'stock' field
import mongoose from 'mongoose';

// The GET handler for your sales reports page. This part is correct.
export async function GET(request: Request) {
  try {
    await dbConnect();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySales = await Sale.aggregate([
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
    
    return NextResponse.json({ dailySales, totalStats });

  } catch (error) {
    console.error("Error fetching sales data:", error);
    return NextResponse.json({ message: "Failed to fetch sales data" }, { status: 500 });
  }
}


// --- THIS IS THE CORRECTED POST HANDLER THAT REDUCES STOCK ---
export async function POST(request: Request) {
  // 1. Start a Transaction for data safety
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, totalAmount, paymentMethod } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Sale data must include items.");
    }

    await dbConnect();

    // 2. Loop through each item to validate and decrease stock
    for (const item of items) {
      const productInDB = await Product.findById(item.productId).session(session);

      if (!productInDB) {
        throw new Error(`Product "${item.product}" (ID: ${item.productId}) not found.`);
      }

      // 3. The Critical Stock Check: Ensure enough stock is available
      if (productInDB.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${productInDB.subProductName}. Available: ${productInDB.stock}, Requested: ${item.quantity}`);
      }

      // 4. Decrease the Stock: Use an atomic operation to subtract the sold quantity
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // 5. If all stock updates succeed, record the sale
    const newSale = new Sale({ items, totalAmount, paymentMethod, timestamp: new Date() });
    await newSale.save({ session });

    // 6. Commit the transaction to save all changes
    await session.commitTransaction();

    return NextResponse.json({ message: "Sale successful and stock updated!", data: newSale }, { status: 201 });
  
  } catch (error) {
    // 7. If any error occurs (like insufficient stock), roll back all changes
    await session.abortTransaction();
    console.error('Sale Transaction Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // Use a 400 status for client errors (like asking for too much stock)
    const statusCode = errorMessage.includes("Insufficient stock") ? 400 : 500;
    
    return NextResponse.json({ message: errorMessage }, { status: statusCode });

  } finally {
    // 8. Always end the session
    session.endSession();
  }
}