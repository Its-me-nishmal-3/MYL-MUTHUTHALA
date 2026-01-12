import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentRecord {
    _id?: string;
    name: string;
    ward: string;
    amount: number;
    paymentId: string;
    createdAt: string;
    local?: boolean;
}

const History: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const fetchHistory = async (pageNum: number, isLoadMore = false) => {
        try {
            if (isLoadMore) setIsFetchingMore(true);

            // Fetch from backend
            const res = await fetch(`https://myl-muthuthala.onrender.com/api/payment/history?page=${pageNum}&limit=10`);
            const data = await res.json();

            if (data.payments) {
                setHistory(prev => isLoadMore ? [...prev, ...data.payments] : data.payments);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchHistory(1);
    }, []);

    const handleScroll = () => {
        if (
            window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100 ||
            isFetchingMore ||
            !hasMore
        ) {
            return;
        }
        setPage(prev => {
            const nextPage = prev + 1;
            fetchHistory(nextPage, true);
            return nextPage;
        });
    };

    useEffect(() => {
        // Use page to avoid lint warning about unused variable if necessary, or just ignore. 
        // Actually, let's just log it for debugging or similar to use it.
        // console.log('Current page:', page); 
    }, [page]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetchingMore]);

    return (
        <div className="p-6 max-w-3xl mx-auto min-h-screen pb-24">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft />
                </button>
                <h1 className="text-2xl font-bold">Payment History</h1>
            </header>

            {loading ? (
                <div className="text-center text-gray-400 mt-20">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20">No payments found</div>
                    ) : (
                        <>
                            {history.map((item, i) => (
                                <motion.div
                                    key={item._id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="glass-panel p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-bold">{item.name}</h3>
                                        <p className="text-sm text-gray-400">{item.ward} • {new Date(item.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-1">{item.paymentId}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-bold text-lg">₹{item.amount}</p>
                                        <button
                                            onClick={() => navigate('/receipt', { state: { payment: item } })}
                                            className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center justify-end gap-1"
                                        >
                                            View Receipt
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {isFetchingMore && (
                                <div className="text-center text-gray-400 py-4">Loading more...</div>
                            )}

                            {!hasMore && history.length > 0 && (
                                <div className="text-center text-gray-500 py-4 text-sm">No more payments to load</div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
