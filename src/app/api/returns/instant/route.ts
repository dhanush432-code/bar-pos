// src/app/api/returns/instant/route.ts

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Return from '@/models/Return'; // Import the new Return model

export async function POST(request: Request) {
  const body = await request.json();
  const { barcode, quantity, reason } = body;

  if (!barcode || !quantity) {
    return NextResponse.json({ message: 'Missing required fields: barcode, quantity' }, { status: 400 });
  }

  await dbConnect();
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findOne({ shortcode: barcode }).session(session);

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: `Product with barcode '${barcode}' not found` }, { status: 404 });
    }

    // --- LOGIC REVERSED ---
    // 1. INCREMENT the product stock
    product.stock += quantity;
    await product.save({ session });

    const descriptiveProductName = product.subProductName || product.productCategory;

    // 2. Create the return record
    const newReturn = new Return({
      productId: product._id,
      barcode: product.shortcode,
      product: descriptiveProductName,
      quantity: quantity,
      refundAmount: product.sRate * quantity,
      reason: reason || 'Damaged',
    });
    
    await newReturn.save({ session });
    
    await session.commitTransaction();
    
    return NextResponse.json({ 
        message: 'Return successful', 
        returnId: newReturn._id,
        product: {
            displayName: descriptiveProductName,
            category: product.productCategory,
            shortcode: product.shortcode,
            sRate: product.sRate,
        }
    }, { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    console.error('Instant Return Transaction Error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  } finally {
    session.endSession();
  }
}