// src/app/(admin)/admin/products/page.tsx

import dbConnect from '@/lib/mongodb';
// --- CHANGE 1: Import the main Product model and its type ---
import Product, { IProduct } from '@/models/Product';
import ProductList from '@/app/(admin)/admin/_components/ProductList';

// --- CHANGE 2: The getProducts function is now much simpler and faster ---
// It no longer needs to do complex calculations. It just reads the data.
async function getProducts(): Promise<IProduct[]> {
  console.log("Attempting to fetch products from the master Product collection...");
  try {
    await dbConnect();
    console.log("Database connected.");

    // This is a simple, efficient query to get all products and their live stock.
    const products = await Product.find({}).sort({ subProductName: 1 }).lean();
    
    console.log(`Found ${products.length} products with live stock data.`);

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("ERROR FETCHING PRODUCTS:", error);
    return []; // Return an empty array on error
  }
}

// This part of the page remains the same, but now passes the correct data.
export default async function ProductsPage() {
  // 1. Fetch the live data from the Product model on the server.
  const products = await getProducts();

  // 2. Pass the correct data as a prop to the Client Component.
  // The prop will now be of type IProduct[]
  return <ProductList initialProducts={products} />;
}