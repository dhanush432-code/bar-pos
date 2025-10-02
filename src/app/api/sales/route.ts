// src/app/api/sales/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, totalAmount, paymentMethod } = await request.json();

    if (!items || items.length === 0 || !totalAmount || !paymentMethod) {
      return NextResponse.json({ message: 'Missing required sale data' }, { status: 400 });
    }

    await dbConnect();

    // 1. Decrement stock for each item in the sale
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (!updatedProduct || updatedProduct.stock < 0) {
        throw new Error(`Insufficient stock for product ${item.product}`);
      }
    }

    // 2. Create the sale record
    const newSale = new Sale({ items, totalAmount, paymentMethod });
    await newSale.save({ session });

    // 3. If all operations succeed, commit the transaction
    await session.commitTransaction();

    return NextResponse.json(newSale, { status: 201 });
  } catch (error) { // 'error' is 'unknown' here
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    console.error('Transaction Error:', error);

    // --- THIS IS THE FIX ---
    // Check if the error is an instance of the Error class
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Transaction failed', error: error.message }, { status: 500 });
    }
    
    // If it's not an Error instance, handle it as a generic error
    return NextResponse.json({ message: 'An unknown error occurred during the transaction' }, { status: 500 });

  } finally {
    // End the session
    session.endSession();
  }
}