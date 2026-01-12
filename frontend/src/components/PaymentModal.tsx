import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentModalProps {
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [ward, setWard] = useState('SELECT YOUR WARD');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePayment = async () => {
        if (!name) return alert('Please enter your name');
        if (!mobile || mobile.length < 10) return alert('Please enter a valid mobile number');
        if (ward === 'SELECT YOUR WARD') return alert('Please select your ward');
        setLoading(true);

        try {
            // 1. Create Order (Sends user details to save as "Created")
            const res = await fetch('https://myl-muthuthala.onrender.com/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity, name, mobile, ward })
            });
            const order = await res.json();

            // 2. Open Razorpay
            const options = {
                key: "rzp_live_S0sherYlhwj0be",
                amount: order.amount,
                currency: "INR",
                name: "MYL MUTHUTHALA ഈത്തപ്പഴ ചലഞ്ച്",
                description: `MYL MUTHUTHALA dates challenge 2026`,
                order_id: order.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch('https://myl-muthuthala.onrender.com/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyData.status === 'success') {
                            onClose();
                            navigate('/receipt', { state: { payment: verifyData.payment } });
                        } else {
                            alert('Payment verification failed');
                        }
                    } catch (verifyError) {
                        console.error('Verification Error:', verifyError);
                        alert('Payment verification failed during server check');
                    }
                },
                prefill: {
                    name: name,
                    contact: mobile
                },
                theme: {
                    color: "#10b981"
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                // Report failure to backend
                fetch('https://myl-muthuthala.onrender.com/api/payment/payment-failed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: response.error.metadata.order_id,
                        payment_id: response.error.metadata.payment_id,
                        reason: response.error.description
                    })
                });

                alert(response.error.description);
                setLoading(false);
            });
            rzp1.open();
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Something went wrong initiating the payment');
            setLoading(false);
        }
    };

    const incrementQty = () => setQuantity(q => q + 1);
    const decrementQty = () => setQuantity(q => q > 1 ? q - 1 : 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Make Payment
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="glass-input w-full"
                            placeholder="Enter your name"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Mobile Number</label>
                        <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setMobile(val);
                            }}
                            className="glass-input w-full"
                            placeholder="Enter 10-digit mobile number"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Select Unit</label>
                        <select
                            value={ward}
                            onChange={(e) => setWard(e.target.value)}
                            className="glass-input w-full bg-[#1e293b] text-white"
                        >
                            <option value="SELECT YOUR WARD" disabled>
                                SELECT YOUR WARD
                            </option>

                            {[
                                'ATTASSERY', 'AMBALAMPADAM', 'THOTTARA', 'KARIPAMANNA',
                                'PEZHUMATTA', 'KULUKKILIYAD', 'KARIMPUZHA', 'POMBRA',
                                'KOOTTILAKKADAV', 'KOLLAMKODE', 'VAKKADAPURAM', 'OTHERS'
                            ].map((unit, i) => (
                                <option key={i} value={unit} className="bg-[#1e293b] text-white">
                                    {unit}
                                </option>
                            ))}
                        </select>

                    </div>

                    {/* Quantity Selector */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Number of Packs</label>
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-fit">
                            <button
                                onClick={decrementQty}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                            >
                                <Minus size={20} />
                            </button>
                            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                            <button
                                onClick={incrementQty}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
                            <span>Total Amount ({quantity} x ₹350)</span>
                            <span className="text-xl font-bold text-white">₹{350 * quantity}</span>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : `Pay ₹${350 * quantity}`}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
