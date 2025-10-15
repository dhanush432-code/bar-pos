import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import mongoose from 'mongoose';

// The GET handler is updated to process filter parameters from the URL.
export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const product = searchParams.get('product');

    // --- Build the core match query based on filters ---
    const matchQuery: any = {};
    
    // Date range filtering
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) {
        matchQuery.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to the end date to include the entire day
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        matchQuery.timestamp.$lte = endDateObj;
      }
    } else {
      // Default to the last 30 days if no dates are provided
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchQuery.timestamp = { $gte: thirtyDaysAgo };
    }
    
    // Product filtering
    if (product) {
      matchQuery['items.product'] = product;
    }

    // --- Daily Sales Aggregation (uses the dynamic match query) ---
    const dailySales = await Sale.aggregate([
      { $match: matchQuery },
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

    // --- Total Stats Aggregation (uses the dynamic match query) ---
    const totalStatsArr = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalSales: { $sum: 1 },
        },
      },
    ]);
    const totalStats = totalStatsArr[0] || { totalRevenue: 0, totalSales: 0 };
    
    // --- Product-wise Sales Aggregation (uses the dynamic match query) ---
    const productWiseSales = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      // If a product is selected, we need to match again after unwinding
      ...(product ? [{ $match: { 'items.product': product } }] : []),
      {
        $group: {
          _id: "$items.product",
          totalItemsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
        }
      },
      {
        $project: {
          _id: 0,
          productName: "$_id",
          totalItemsSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // --- NEW: Get a list of all unique product names for the filter dropdown ---
    const allProducts = await Sale.distinct("items.product");
    
    return NextResponse.json({ dailySales, totalStats, productWiseSales, allProducts });

  } catch (error) {
    console.error("Error fetching sales data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch sales data", error: errorMessage }, { status: 500 });
  }
}

// --- The POST Handler remains unchanged ---
export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, totalAmount, paymentMethod } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Sale data must include items.");
    }

    await dbConnect();

    for (const item of items) {
      const productInDB = await Product.findById(item.productId).session(session);

      if (!productInDB) {
        throw new Error(`Product "${item.product}" (ID: ${item.productId}) not found.`);
      }

      if (productInDB.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${productInDB.subProductName}. Available: ${productInDB.stock}, Requested: ${item.quantity}`);
      }

      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    const newSale = new Sale({ items, totalAmount, paymentMethod, timestamp: new Date() });
    await newSale.save({ session });

    await session.commitTransaction();

    return NextResponse.json({ message: "Sale successful and stock updated!", data: newSale }, { status: 201 });
  
  } catch (error) {
    await session.abortTransaction();
    console.error('Sale Transaction Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    const statusCode = errorMessage.includes("Insufficient stock") ? 400 : 500;
    
    return NextResponse.json({ message: errorMessage }, { status: statusCode });

  } finally {
    session.endSession();
  }
}