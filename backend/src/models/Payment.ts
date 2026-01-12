import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    name: string;
    ward: string;
    amount: number;
    quantity: number;
    mobile: string;
    paymentId: string;
    orderId: string;
    status: string;
    createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
    name: { type: String, required: true },
    ward: { type: String, required: true },
    amount: { type: Number, required: true, default: 350 },
    quantity: { type: Number, required: true, default: 1 },
    mobile: { type: String, required: true },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    status: { type: String, default: 'success' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
