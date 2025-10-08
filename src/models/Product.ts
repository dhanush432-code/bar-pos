// src/models/Product.ts

import mongoose, { Schema, model, models, Document } from 'mongoose';

// 1. Interface defining the structure of a product object
export interface IProduct {
   _id?: string;
  code: number;
  subProductName: string;
  productCategory: string;
  shortcode?: string; // Optional, as some rows might not have it
  mrpRate: number;
  basicRate: number;
  sRate: number;
   stock: number;
}

// 2. Mongoose Document Interface (for internal server use)
interface IProductDocument extends IProduct, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 3. The Mongoose Schema that matches your Excel columns
const productSchema = new Schema<IProductDocument>({
  code: { 
    type: Number, 
    required: true,
    unique: true, // Assuming the code is a unique identifier
    trim: true 
  },
  subProductName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  productCategory: { 
    type: String, 
    required: true, 
    trim: true 
  },
  shortcode: { 
    type: String, // Kept as string to handle varying formats like '53535'
    trim: true 
  },
  mrpRate: { 
    type: Number, 
    required: true 
  },
  basicRate: { 
    type: Number, 
    required: true 
  },
  sRate: { 
    type: Number, 
    required: true 
  },
   stock: {       // <-- Define the stock field in the schema
    type: Number,
    required: false,
    default: 0,
    min: 0 // Optional: prevent stock from ever going negative at the database level
  },
}, { timestamps: true });

// 4. Create and export the model, ensuring it works with Next.js hot-reloading
const Product = models.Product || model<IProductDocument>('Product', productSchema);

export default Product;