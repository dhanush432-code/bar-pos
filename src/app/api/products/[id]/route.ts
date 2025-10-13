// src/app/api/products/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } } // The folder name [id] matches the param name 'id'
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { 
      subProductName, 
      productCategory, 
      shortcode, 
      mrpRate, 
      basicRate, 
      sRate, 
      stock 
    } = body;

    await dbConnect();
    
    if (shortcode) {
      const existingProduct = await Product.findOne({ shortcode, _id: { $ne: id } });
      if (existingProduct) {
        return NextResponse.json({ message: `Barcode ${shortcode} is already in use.` }, { status: 409 });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { subProductName, productCategory, shortcode, mrpRate, basicRate, sRate, stock },
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}