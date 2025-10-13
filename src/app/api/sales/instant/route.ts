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
    const product = await Product.findOne({ shortcode: barcode }).session(session);

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: `Product with barcode '${barcode}' not found` }, { status: 404 });
    }

    if (product.stock < quantity) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: `Out of stock. Only ${product.stock} left.` }, { status: 409 });
    }

    product.stock -= quantity;
    await product.save({ session });

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
    
    await session.commitTransaction();
    
    return NextResponse.json({ 
        message: 'Sale successful', 
        saleId: newSale._id,
        product: {
            displayName: descriptiveProductName,
            // --- CHANGE [Backend]: Add the category to the response ---
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