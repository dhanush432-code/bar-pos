// src/app/(admin)/admin/unknown-barcodes/page.tsx
import dbConnect from '@/lib/mongodb';
import UnknownProduct, { IUnknownProduct } from '@/models/UnknownProduct';
import UnknownBarcodeClientPage from '@/app/(admin)/admin/_components/UnknownBarcodeClientPage';

async function getUnknownProducts(): Promise<IUnknownProduct[]> {
  await dbConnect();
  const products = await UnknownProduct.find({}).sort({ scannedAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function UnknownBarcodesPage() {
  const unknownProducts = await getUnknownProducts();
  return <UnknownBarcodeClientPage unknownProducts={unknownProducts} />;
}