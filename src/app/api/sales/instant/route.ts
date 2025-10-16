// src/app/api/sales/instant/route.ts

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Sale from '@/models/Sale';

export async function POST(request: Request) {
  const body = await request.json();
  const { barcode, paymentMethod, quantity } = body;

  if (!barcode || !paymentMethod || !quantity) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  await dbConnect();
  
  const session = await mongoose.startSession();
  session.startTransaction();

 try {
    const { barcode, paymentMethod, quantity } = body; // Moved body parsing inside try block

    // Step 1: Find the product AND ensure it has enough stock in ONE atomic operation.
    const product = await Product.findOneAndUpdate(
      { shortcode: barcode, stock: { $gte: quantity } }, // Query
      { $inc: { stock: -quantity } }, // The update
      { session, new: true } // Options
    );

    // Step 2: Check if the operation was successful.
    if (!product) {
      // FIX: Removed .lean() to resolve TypeScript error
      const productExists = await Product.findOne({ shortcode: barcode }).session(session);
      
      await session.abortTransaction();
      session.endSession();

      if (!productExists) {
        return NextResponse.json({ message: `Product with barcode '${barcode}' not found` }, { status: 404 });
      } else {
        // Now TypeScript knows that productExists is a full Mongoose document with a .stock property
        return NextResponse.json({ message: `Out of stock. Only ${productExists.stock} left.` }, { status: 409 });
      }
    }

    // Step 3: If we get here, the stock was successfully decremented. Now, create the sale.
    const saleTotal = product.sRate * quantity;
    const descriptiveProductName = product.subProductName || product.productCategory;

    const newSale = new Sale({
      items: [{
        productId: product._id,
        barcode: product.shortcode,
        product: descriptiveProductName, 
        quantity: quantity,
        sRate: product.sRate,
        total: saleTotal,
      }],
      totalAmount: saleTotal,
      paymentMethod,
    });
    
    await newSale.save({ session });
    
    // Step 4: Commit the successful transaction.
    await session.commitTransaction();
    
    return NextResponse.json({ 
        message: 'Sale successful', 
        saleId: newSale._id,
        product: {
            displayName: descriptiveProductName,
            category: product.productCategory,
            shortcode: product.shortcode,
            sRate: product.sRate,
        }
    }, { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    console.error('Instant Sale Transaction Error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  } finally {
    session.endSession();
  }
}