// models/Sale.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { IProduct } from './Product';

interface SaleItem {
  productId: mongoose.Schema.Types.ObjectId | IProduct;
  barcode: string;
  product: string;
  quantity: number;
  sRate: number;
  total: number;
}

export interface ISale extends Document {
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Other';
  timestamp: Date;
}

const SaleSchema: Schema = new Schema({
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    barcode: { type: String, required: true },
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    sRate: { type: Number, required: true },
    total: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Other'], required: true },
  timestamp: { type: Date, default: Date.now },
});

const Sale: Model<ISale> = models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
export default Sale;