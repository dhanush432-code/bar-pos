// src/app/api/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
export async function GET(request: Request) {
  // 1. Check for an authenticated admin session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // 2. Fetch all products from the database, sorting by the newest first
    const products = await Product.find({}).sort({ createdAt: -1 });

    // 3. Return the list of products
    return NextResponse.json(products);

  } catch (error) {
    console.error('Failed to fetch products:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Destructure all fields, including the new 'basic' field
    const { barcode, product, subProduct, unit, sRate, stock, basic } = body;

    // Updated validation
    if (!barcode || !product || !subProduct || sRate === undefined || stock === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
      return NextResponse.json({ message: `Product with barcode ${barcode} already exists` }, { status: 409 });
    }

    // Create the new product with all fields
    const newProduct = new Product({
      barcode,
      product,
      subProduct,
      unit,
      sRate: Number(sRate),
      stock: Number(stock),
      basic: basic ? Number(basic) : undefined, // Add basic only if it exists
    });

    await newProduct.save();

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    console.error('Failed to create product:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  }
}