// src/app/(admin)/admin/products/page.tsx
import dbConnect from '@/lib/mongodb';
import Product, { ProductType } from '@/models/Product';
import ProductList from '@/app/(admin)/admin/_components/ProductList'; // Import the new client component

// This function runs on the server to get the initial data.
async function getProducts(): Promise<ProductType[]> {
  console.log("Attempting to fetch products..."); // <-- Add this
  try {
    await dbConnect();
    console.log("Database connected."); // <-- Add this

    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    
    // <-- Add this to see if data is being found -->
    console.log(`Found ${products.length} products in the database.`);

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    // <-- Add this to catch any errors during the process -->
    console.error("ERROR FETCHING PRODUCTS:", error);
    return []; // Return an empty array on error
  }
}

// This page remains a Server Component.
export default async function ProductsPage() {
  // 1. Fetch data on the server.
  const products = await getProducts();

  // 2. Pass the data as a prop to the Client Component, which will handle all UI and interactions.
  return <ProductList initialProducts={products} />;
}