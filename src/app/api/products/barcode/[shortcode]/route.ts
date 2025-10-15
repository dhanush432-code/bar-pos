import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortcode: string }> } // ✅ params is now a Promise
) {
  const { shortcode } = await context.params; // ✅ await required

  if (!shortcode) {
    return NextResponse.json({ message: 'Shortcode is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const product = await Product.findOne({ shortcode });

    if (!product) {
      return NextResponse.json(
        { message: `Product with shortcode '${shortcode}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('API Error fetching product by shortcode:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
