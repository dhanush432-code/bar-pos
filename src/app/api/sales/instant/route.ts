// src/app/api/sales/instant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import  connectToDB  from '@/lib/mongodb'; // Using your connectToDB from other files
import Product from '@/models/Product';
import Sale from '@/models/Sale';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { barcode, paymentMethod, quantity } = body;

  if (!barcode || !paymentMethod || !quantity) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  await connectToDB();
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Find the product AND ensure it has enough stock in ONE atomic operation.
    // This command finds a product matching the barcode where the stock is >= the quantity.
    // If it finds one, it IMMEDIATELY and ATOMICALLY decrements the stock.
    const product = await Product.findOneAndUpdate(
      { shortcode: barcode, stock: { $gte: quantity } }, // The Query to find the document
      { $inc: { stock: -quantity } }, // The Update to apply
      { session, new: true } // Options: run in transaction, return the NEW updated document
    );

    // Step 2: Check if the operation was successful.
    // If 'product' is null, it means the query failed to find a match.
    // This handles BOTH "not found" and "out of stock" cases.
    if (!product) {
      // Check *why* it failed for a better error message.
      const productExists = await Product.findOne({ shortcode: barcode }).session(session);
      
      await session.abortTransaction();
      session.endSession();

      if (!productExists) {
        return NextResponse.json({ message: `Product with barcode '${barcode}' not found` }, { status: 404 });
      } else {
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
            sRate: product.sRate, // Corrected to sRate
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