import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(
  request: Request,
  // The parameter name now matches the file name
  { params }: { params: { shortcode: string } }
) {
  const { shortcode } = params; // This is now much clearer

  if (!shortcode) {
    return NextResponse.json({ message: 'Shortcode is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    
    // The query is now perfectly readable and consistent
    const product = await Product.findOne({ shortcode: shortcode });

    if (!product) {
      return NextResponse.json({ message: `Product with shortcode '${shortcode}' not found` }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("API Error fetching product by shortcode:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}