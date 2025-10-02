// models/UnknownProduct.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IUnknownProduct extends Document {
  barcode: string;
  scannedAt: Date;
  count: number;
}

const UnknownProductSchema: Schema = new Schema({
  barcode: { type: String, required: true, unique: true },
  scannedAt: { type: Date, default: Date.now },
  count: { type: Number, default: 1 },
});

const UnknownProduct: Model<IUnknownProduct> = models.UnknownProduct || mongoose.model<IUnknownProduct>('UnknownProduct', UnknownProductSchema);
export default UnknownProduct;