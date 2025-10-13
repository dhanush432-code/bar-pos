// src/models/Return.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IReturn extends Document {
  productId: mongoose.Schema.Types.ObjectId;
  barcode: string;
  product: string;
  quantity: number;
  refundAmount: number;
  reason: string; // e.g., 'Damaged', 'Customer Choice'
  createdAt: Date;
}

const ReturnSchema: Schema<IReturn> = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  barcode: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  refundAmount: { type: Number, required: true }, // The amount refunded to the customer (sRate)
  reason: { type: String, default: 'Damaged' },
}, { timestamps: true });

const Return: Model<IReturn> = mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema);

export default Return;