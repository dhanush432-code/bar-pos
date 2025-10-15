// src/app/api/unknown/[barcode]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UnknownProduct from '@/models/UnknownProduct';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ barcode: string }> } // ✅ params is now a Promise
) {
  const { barcode } = await context.params; // ✅ await needed for Next.js 15+

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!barcode) {
      return NextResponse.json({ message: 'Barcode is required' }, { status: 400 });
    }

    await dbConnect();
    
    const result = await UnknownProduct.deleteOne({ barcode });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Unknown barcode not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Unknown barcode removed successfully' });
  } catch (error) {
    console.error('Failed to delete unknown barcode:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
