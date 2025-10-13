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
    
    // Destructure all fields from the frontend form
    const { 
      subProductName, 
      productCategory, 
      shortcode, 
      mrpRate, 
      basicRate, 
      sRate, 
      stock 
    } = body;

    // Validation for required fields from the form
    if (
      !subProductName || 
      !productCategory || 
      mrpRate === undefined || 
      basicRate === undefined || 
      sRate === undefined || 
      stock === undefined
    ) {
      return NextResponse.json({ message: 'Missing required fields from form' }, { status: 400 });
    }

    await dbConnect();

    // --- AUTOMATIC CODE GENERATION LOGIC ---
    // 1. Find the product with the highest 'code' value.
    const lastProduct = await Product.findOne().sort({ code: -1 });
    // 2. Determine the new code. If no products exist, start at 100001.
    const newCode = lastProduct ? lastProduct.code + 1 : 100001;
    // --- END OF CODE GENERATION LOGIC ---

    // Duplicate check for `shortcode` (barcode) if it's provided.
    if (shortcode) {
      const existingByBarcode = await Product.findOne({ shortcode });
      if (existingByBarcode) {
        return NextResponse.json({ message: `Product with barcode ${shortcode} already exists` }, { status: 409 });
      }
    }

    // Create the new product with the auto-generated code
    const newProduct = new Product({
      code: newCode, // Use the generated code
      subProductName,
      productCategory,
      shortcode,
      mrpRate: Number(mrpRate),
      basicRate: Number(basicRate),
      sRate: Number(sRate),
      stock: Number(stock),
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