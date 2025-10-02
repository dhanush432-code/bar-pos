// app/api/unknown/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UnknownProduct from '@/models/UnknownProduct';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// POST: Log a new unknown barcode
export async function POST(request: Request) {
  try {
    const { barcode } = await request.json();
    if (!barcode) {
      return NextResponse.json({ message: 'Barcode is required' }, { status: 400 });
    }

    await dbConnect();

    // Find if it exists and increment count, otherwise create new
    const unknown = await UnknownProduct.findOneAndUpdate(
      { barcode },
      { $inc: { count: 1 }, $set: { scannedAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json(unknown, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: List all unknown barcodes (for admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const unknownProducts = await UnknownProduct.find().sort({ scannedAt: -1 });
    return NextResponse.json(unknownProducts);
  } catch (error) {
    console.error("Failed to fetch unknown products:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}