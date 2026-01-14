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

// Helper function to send WhatsApp notification asynchronously
const sendWhatsAppNotification = async (name: string, quantity: number, amount: number, mobile: string) => {
    try {
        const url = new URL('https://wa-simple-otp.onrender.com/send-myl');
        url.searchParams.append('name', name);
        url.searchParams.append('quantity', quantity.toString());
        url.searchParams.append('amount', amount.toString());
        url.searchParams.append('mobile', `91${mobile}`);
        url.searchParams.append('caption', 'Thanks!');

        const response = await fetch(url.toString());
        if (!response.ok) {
            console.warn(`WhatsApp notification failed: ${response.status} ${response.statusText}`);
        } else {
            console.log(`WhatsApp notification sent successfully to ${mobile}`);
        }
    } catch (error) {
        // Don't throw, just log - this should never affect the payment flow
        console.warn('Failed to send WhatsApp notification:', error);
    }
};

// Create Order (rate limited)
router.post('/create-order', paymentLimiter, async (req, res) => {
    try {
        const { quantity = 1, name, mobile, ward } = req.body;
        const amount = 1 * quantity;

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

                // Send WhatsApp notification asynchronously after response is sent
                // This runs in the background and won't affect the payment flow
                setImmediate(() => {
                    sendWhatsAppNotification(
                        payment.name,
                        payment.quantity,
                        payment.amount,
                        payment.mobile
                    ).catch(err => {
                        // Already handled in the function, but extra safety
                        console.warn('WhatsApp notification error (async):', err);
                    });
                });
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

// Official Razorpay Webhook Endpoint
// IMPORTANT: Configure this URL in Razorpay Dashboard under Settings > Webhooks
// Add RAZORPAY_WEBHOOK_SECRET to your .env file
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // Step 1: Verify webhook signature
        const signature = req.headers['x-razorpay-signature'] as string;
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        // Convert raw body to string for signature verification
        const body = req.body.toString();

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('Invalid webhook signature received');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Parse the verified payload
        const payload = JSON.parse(body);
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;

        console.log(`Webhook received: ${event}`, {
            orderId: paymentEntity?.order_id || orderEntity?.id,
            paymentId: paymentEntity?.id
        });

        // Step 2: Handle different event types
        if (event === 'payment.captured') {
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            // Find payment record
            const payment = await Payment.findOne({ orderId });

            if (!payment) {
                console.warn(`Payment record not found for order: ${orderId}`);
                return res.status(200).json({ status: 'payment_not_found' });
            }

            // Step 3: Idempotency check
            if (payment.webhookProcessed) {
                console.log(`Webhook already processed for payment: ${paymentId}`);
                return res.status(200).json({ status: 'already_processed' });
            }

            // Update payment status
            payment.paymentId = paymentId;
            payment.status = 'success';
            payment.webhookProcessed = true;
            await payment.save();

            // Emit real-time update
            io.emit('payment_success', {
                amount: payment.amount,
                ward: payment.ward,
                quantity: payment.quantity,
                payment
            });

            console.log(`Payment captured successfully: ${paymentId}`);

            // Send WhatsApp notification asynchronously (non-blocking)
            setImmediate(() => {
                sendWhatsAppNotification(
                    payment.name,
                    payment.quantity,
                    payment.amount,
                    payment.mobile
                ).catch(err => {
                    console.warn('WhatsApp notification error (webhook):', err);
                });
            });

            return res.status(200).json({ status: 'success' });

        } else if (event === 'payment.failed') {
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            const payment = await Payment.findOne({ orderId });

            if (!payment) {
                console.warn(`Payment record not found for order: ${orderId}`);
                return res.status(200).json({ status: 'payment_not_found' });
            }

            // Check if already processed
            if (payment.webhookProcessed && payment.status === 'failed') {
                console.log(`Failed webhook already processed for payment: ${paymentId}`);
                return res.status(200).json({ status: 'already_processed' });
            }

            // Update payment status
            payment.paymentId = paymentId;
            payment.status = 'failed';
            payment.webhookProcessed = true;
            await payment.save();

            // Emit real-time update
            io.emit('payment_failed', { payment });

            console.log(`Payment failed: ${paymentId}`);

            return res.status(200).json({ status: 'failed_recorded' });

        } else {
            // Log other events but don't process them
            console.log(`Unhandled webhook event: ${event}`);
            return res.status(200).json({ status: 'event_ignored' });
        }

    } catch (error) {
        console.error('Webhook processing error:', error);
        // Always return 200 to prevent Razorpay from retrying on our internal errors
        return res.status(200).json({ error: 'internal_error' });
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
        const ward = req.query.ward as string | undefined;
        const skip = (page - 1) * limit;

        // Build query filter
        const filter: any = { status: 'success' };
        if (ward) {
            filter.ward = ward;
        }

        const total = await Payment.countDocuments(filter);

        const payments = await Payment.find(filter)
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
