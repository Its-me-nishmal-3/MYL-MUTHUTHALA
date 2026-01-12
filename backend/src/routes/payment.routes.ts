import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import { io } from '../server';
import { paymentLimiter, statsLimiter } from '../middleware/rateLimiter';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'test_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret'
});

// Create Order (rate limited)
router.post('/create-order', paymentLimiter, async (req, res) => {
    try {
        const { quantity = 1, name, mobile, ward } = req.body;
        const amount = 350 * quantity;

        const options = {
            amount: amount * 100, // amount in paisa
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Save initial "Created" state
        const payment = new Payment({
            name,
            ward,
            amount,
            quantity,
            mobile,
            paymentId: 'pending',
            orderId: order.id,
            status: 'created'
        });
        await payment.save();

        // Emit Socket Update for Admin
        io.emit('payment_created', {
            amount: payment.amount,
            ward: ward,
            payment
        });

        res.json({ ...order, quantity });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Error creating order');
    }
});

// Verify Payment (rate limited)
router.post('/verify', paymentLimiter, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_key_secret')
            .update(body.toString())
            .digest('hex');

        const isValid = expectedSignature === razorpay_signature;

        if (isValid) {
            // Find and Update Payment
            const payment = await Payment.findOne({ orderId: razorpay_order_id });

            if (payment) {
                payment.paymentId = razorpay_payment_id;
                payment.status = 'success';
                await payment.save();

                // Emit Socket Update
                io.emit('payment_success', {
                    amount: payment.amount,
                    ward: payment.ward,
                    quantity: payment.quantity,
                    payment
                });

                res.json({ status: 'success', payment });
            } else {
                res.status(404).json({ status: 'error', message: 'Payment record not found' });
            }
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// Payment Failed Webhook/Endpoint (rate limited)
router.post('/payment-failed', paymentLimiter, async (req, res) => {
    try {
        const { order_id, reason, payment_id } = req.body;

        const payment = await Payment.findOne({ orderId: order_id });
        if (payment) {
            payment.status = 'failed';
            if (payment_id) payment.paymentId = payment_id;
            await payment.save();

            io.emit('payment_failed', { payment });

            res.json({ status: 'updated' });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        console.error('Error marking payment failed:', error);
        res.status(500).send('Error');
    }
});

// Get Stats (rate limited to prevent scraping)
router.get('/stats', statsLimiter, async (req, res) => {
    try {
        const totalAmount = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Sum quantity instead of countDocuments for total packs/participants
        const totalCount = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const wardStats = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: '$ward', total: { $sum: '$quantity' } } }
        ]);

        const wardWise: Record<string, number> = {};
        wardStats.forEach(stat => {
            wardWise[stat._id] = stat.total;
        });

        res.json({
            totalAmount: totalAmount[0]?.total || 0,
            totalCount: totalCount[0]?.total || 0,
            wardWise
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// Get History (Paginated, rate limited)
router.get('/history', statsLimiter, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const total = await Payment.countDocuments({ status: 'success' });

        const payments = await Payment.find({ status: 'success' })
            .select('name ward amount quantity paymentId createdAt status') // Exclude mobile, orderId
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            payments,
            hasMore: skip + payments.length < total,
            total
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Error fetching history' });
    }
});

export default router;
