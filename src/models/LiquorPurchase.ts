// src/models/LiquorPurchase.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

// Defines the structure for each item within a purchase
const LiquorPurchaseItemSchema = new Schema({
    // Store a direct copy of the product details at the time of purchase.
    // This is the "snapshot" approach.
    productCategory: { type: String, required: true },
    subProductName: { type: String, required: true },
    shortcode: String,
    basicRate: { type: Number, required: true },
    sRate: { type: Number, required: true },
    
    // Your existing fields for quantity and calculation
    caseQty: String,
    qty: { type: Number, required: true },
    amount: { type: Number, required: true },
    tax: Number,
    addval: Number,
    totalval: Number,
});

// Defines the structure for the overall purchase document
interface ILiquorPurchase extends Document {
    supplierName: string;
    invoiceNo: string;
    date: Date;
    purchaseAccount: string;
    godown: string;
    items: any[];
}

const LiquorPurchaseSchema = new Schema<ILiquorPurchase>({
    supplierName: { type: String, required: true },
    invoiceNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    purchaseAccount: String,
    godown: String,
    items: [LiquorPurchaseItemSchema], // Embed the item schema here
}, { timestamps: true });

const LiquorPurchase = models.LiquorPurchase || model<ILiquorPurchase>('LiquorPurchase', LiquorPurchaseSchema);

export default LiquorPurchase;