// src/models/Product.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// This is the plain object type for use on the client-side (e.g., in Zustand)
export interface ProductType {
  _id: string;
  barcode: string;
  unit?: string;
  product: string;
  subProduct: string;
  basic?: number; // New field, optional
  sRate: number;  // Selling Rate
  stock: number;
}

// This is the Mongoose Document interface for use on the server-side
export interface IProduct extends ProductType {}

const ProductSchema: Schema = new Schema({
  // ESSENTIAL fields from the old model
  barcode: { type: String, unique: true, index: true, required: true },
  stock: { type: Number, default: 0, required: true },
  
  // Fields from your NEW model
  unit: { type: String, trim: true },
  product: { type: String, required: true, trim: true },
  subProduct: { type: String, required: true, trim: true },
  basic: { type: Number }, // New 'basic' rate field
  sRate: { type: Number, required: true }, // Selling Rate, making it required for a POS

}, { timestamps: true });

const Product: Model<IProduct> = models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;