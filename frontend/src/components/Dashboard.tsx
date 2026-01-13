import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import PaymentModal from './PaymentModal';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Assets
import mainImage from '../assets/main__.jpeg';
import banner1 from '../assets/WhatsApp Image 2026-01-13 at 8.39.09 PM.jpeg';
import banner2 from '../assets/WhatsApp Image 2026-01-13 at 8.39.09 PM (1).jpeg';
import banner3 from '../assets/WhatsApp Image 2026-01-13 at 8.39.09 PM (2).jpeg';
import banner4 from '../assets/WhatsApp Image 2026-01-13 at 8.39.09 PM (3).jpeg';

const SOCKET_URL = 'https://myl-muthuthala.onrender.com';

const UNIT_NAMES = [
    'Vadakkumuri', 'Karakkuth', 'Muthuthala', 'Parakkad', 'Kozhikkottiri',
    'Perumudiyur', 'Yaram', 'Kodumunda', 'Thottinkara', 'Other'
];

const BANNERS = [banner1, banner2, banner3, banner4];

interface Stats {
    totalAmount: number;
    totalCount: number;
    wardWise: Record<string, number>;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalAmount: 0,
        totalCount: 0,
        wardWise: {}
    });
    const [showModal, setShowModal] = useState(false);
    const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(() => {
        const saved = localStorage.getItem('welcomeExpanded');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const toggleWelcome = () => {
        const newValue = !isWelcomeExpanded;
        setIsWelcomeExpanded(newValue);
        localStorage.setItem('welcomeExpanded', JSON.stringify(newValue));
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${SOCKET_URL}/api/payment/stats`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
        const newSocket = io(SOCKET_URL);
        newSocket.on('connect', () => console.log('Connected to socket'));
        newSocket.on('payment_success', (data: any) => {
            console.log('Payment success event:', data);
            fetchStats();
        });
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 text-gray-900 font-sans selection:bg-teal-200 pb-24 relative overflow-hidden">

            {/* Enhanced Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-200/40 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-200/40 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-teal-100/50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 space-y-8 pt-8">
                {/* Header */}
                <header className="flex justify-between items-center backdrop-blur-xl bg-white/80 p-4 md:p-5 rounded-2xl border border-teal-100 sticky top-4 z-50 shadow-xl">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-green-600 to-emerald-600 drop-shadow-lg">
                            MYL MUTHUTHALA
                        </h1>
                        <p className="text-gray-600 text-xs md:text-sm font-medium">EETHAPPAZHA BIG SALE 2026</p>
                    </div>
                    <div className="flex gap-3 md:gap-4 items-center">
                        <button
                            onClick={() => navigate('/install-app')}
                            className="flex flex-col items-center group"
                            title="Install App"
                        >
                            <span className="text-xs text-teal-600 font-semibold mb-0.5 group-hover:text-teal-700 transition-colors">Use as App</span>
                            <div className="bg-teal-50 p-1.5 rounded-lg hover:bg-teal-100 transition-all border border-teal-200 group-hover:scale-110 group-hover:border-teal-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 group-hover:text-teal-700"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/history')}
                            className="px-4 py-2 bg-teal-50 hover:bg-gradient-to-r hover:from-teal-100 hover:to-green-100 rounded-lg text-sm transition-all border border-teal-200 hover:border-teal-400 h-10 text-gray-700 font-medium"
                        >
                            History
                        </button>
                    </div>
                </header>

                {/* Main Stats - TOP PRIORITY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-white border border-teal-200 p-6 md:p-8 rounded-2xl relative overflow-hidden group hover:shadow-2xl hover:shadow-teal-300/30 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-teal-700 text-xs md:text-sm uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
                                Total Collected
                            </h3>
                            <p className="text-5xl md:text-6xl font-extrabold text-gray-900 drop-shadow-lg">
                                ₹{stats.totalAmount.toLocaleString()}
                            </p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 animate-pulse" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-gradient-to-br from-green-50 via-emerald-100/50 to-white border border-green-200 p-6 md:p-8 rounded-2xl relative overflow-hidden group hover:shadow-2xl hover:shadow-green-300/30 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-green-700 text-xs md:text-sm uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                                Total Packs
                            </h3>
                            <p className="text-5xl md:text-6xl font-extrabold text-gray-900 drop-shadow-lg">
                                {stats.totalCount}
                            </p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 animate-pulse" />
                    </motion.div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">

                    {/* Welcome Card */}
                    <div className="xl:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white/90 backdrop-blur-xl border border-teal-100 rounded-3xl p-6 md:p-8 overflow-hidden relative shadow-xl h-full"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-200/30 via-green-200/20 to-transparent blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-200/30 via-teal-200/20 to-transparent blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 font-malayalam leading-tight flex items-center gap-3">
                                        <span className="w-1.5 h-10 bg-gradient-to-b from-teal-600 to-green-600 rounded-full"></span>
                                        പ്രിയമുള്ളവരെ…
                                    </h2>
                                    <button
                                        onClick={toggleWelcome}
                                        className="p-2 rounded-lg bg-teal-50/50 hover:bg-teal-100/50 border border-teal-200 hover:border-teal-400 transition-all group"
                                        title={isWelcomeExpanded ? "Hide Message" : "Show Message"}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`text-teal-600 transition-transform duration-300 ${isWelcomeExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {isWelcomeExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-4 text-gray-700 leading-relaxed text-base md:text-lg font-malayalam">
                                                <p className="hover:text-gray-900 transition-colors">
                                                    നമ്മുടെ നാട്ടിലെ സാമൂഹിക സാംസ്‌കാരിക സേവന രംഗത്ത് സജീവമായി പ്രവർത്തിക്കുന്ന സംഘടനയാണ് മുസ്‌ലിം യൂത്ത് ലീഗ്.
                                                </p>
                                                <p className="hover:text-gray-600 transition-colors">
                                                    പൊതുജനങ്ങളുടെ അവകാശങ്ങൾ സംരക്ഷിക്കുന്നതിനും പുരോഗതിക്കും മാതൃകപരമായ ഇടപെടലുകളും സമരങ്ങളും നടത്തി മുസ്‌ലിം യൂത്ത് ലീഗ് മുതുതല പഞ്ചായത്ത്‌ കമ്മിറ്റി അതിന്റെ പ്രയാണം നടത്തികൊണ്ടിരിക്കുകയാണ്.
                                                </p>
                                                <p className="font-semibold text-teal-700 hover:text-teal-800 transition-colors bg-teal-50 border-l-4 border-teal-600 pl-4 py-2 rounded-r-lg">
                                                    തുടർന്നും ഇത്തരം പ്രവർത്തനങ്ങൾക്കും പ്രയത്നങ്ങൾക്കും ശക്തി പകരാൻ  മുസ്‌ലിം യൂത്ത് ലീഗിന്റെ ഈത്തപ്പഴം ബിഗ് സെയിലിൽ പങ്കാളികളാവണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു
                                                </p>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Image */}
                    <div className="xl:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative w-full rounded-3xl overflow-hidden shadow-xl border-4 border-teal-100 group h-full min-h-[400px]"
                        >
                            <img
                                src={mainImage}
                                alt="Main Program"
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.div>
                    </div>

                </div>

                {/* Banner Gallery */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 pl-2 border-l-4 border-teal-600">Gallery</h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
                        {BANNERS.map((banner, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="min-w-[280px] md:min-w-[350px] h-48 md:h-64 rounded-2xl overflow-hidden snap-center shadow-lg border border-teal-100 relative group"
                            >
                                <img
                                    src={banner}
                                    alt={`Banner ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Live Unit Stats - Professional Design */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-teal-100 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-teal-600 to-green-600 rounded-full" />
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Unit Wise Collection
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {UNIT_NAMES
                            .map(unitName => ({
                                name: unitName,
                                amount: stats.wardWise[unitName] || 0
                            }))
                            .sort((a, b) => b.amount - a.amount)
                            .map((ward, index) => {
                                const isActive = ward.amount > 0;
                                const isFirst = index === 0 && isActive;
                                const isSecond = index === 1 && isActive;
                                const isThird = index === 2 && isActive;

                                // Clean, minimal color scheme
                                const getBorderColor = () => {
                                    if (isFirst) return 'border-l-4 border-yellow-400';
                                    if (isSecond) return 'border-l-4 border-blue-400';
                                    if (isThird) return 'border-l-4 border-pink-400';
                                    if (isActive) return 'border-l-4 border-teal-400';
                                    return 'border-l-4 border-gray-200';
                                };

                                const getBgColor = () => {
                                    if (isFirst) return 'bg-yellow-50';
                                    if (isSecond) return 'bg-blue-50';
                                    if (isThird) return 'bg-pink-50';
                                    if (isActive) return 'bg-teal-50';
                                    return 'bg-white';
                                };

                                const getRankBadge = () => {
                                    if (isFirst) return { text: '#1', color: 'bg-yellow-400 text-gray-900' };
                                    if (isSecond) return { text: '#2', color: 'bg-blue-400 text-white' };
                                    if (isThird) return { text: '#3', color: 'bg-pink-400 text-white' };
                                    return null;
                                };

                                const getAmountColor = () => {
                                    if (isFirst) return 'text-yellow-600';
                                    if (isSecond) return 'text-blue-600';
                                    if (isThird) return 'text-pink-600';
                                    if (isActive) return 'text-teal-600';
                                    return 'text-gray-400';
                                };

                                const rankBadge = getRankBadge();

                                return (
                                    <motion.div
                                        key={ward.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03, duration: 0.3 }}
                                        onClick={() => ward.amount > 0 && navigate(`/history?unit=${encodeURIComponent(ward.name)}`)}
                                        className={`relative p-5 rounded-lg border ${getBorderColor()} ${getBgColor()} ${ward.amount > 0 ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : 'opacity-50'} transition-all duration-200`}
                                        title={ward.amount > 0 ? `Click to view ${ward.name} payments` : undefined}
                                    >
                                        {/* Rank Badge */}
                                        {rankBadge && (
                                            <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${rankBadge.color}`}>
                                                {rankBadge.text}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div>
                                            <p className="text-gray-600 text-xs uppercase tracking-wider mb-3 font-semibold">
                                                {ward.name}
                                            </p>
                                            <p className={`text-3xl font-bold ${getAmountColor()}`}>
                                                {ward.amount}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">packs</p>
                                        </div>


                                    </motion.div>
                                );
                            })}
                    </div>
                </div>

                {/* Floating Pay Button */}
                <div className="fixed bottom-8 left-0 w-full flex justify-center px-4 z-40 pointer-events-none">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal(true)}
                        className="pointer-events-auto bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold text-lg md:text-xl py-4 px-12 rounded-full shadow-2xl shadow-teal-500/40 hover:shadow-teal-500/60 border border-teal-400/30 backdrop-blur-sm flex items-center gap-2"
                    >
                        Pay Now ₹350
                    </motion.button>
                </div>

                {/* Footer Spacer */}
                <div className="h-24" />
            </div>

            <AnimatePresence>
                {showModal && <PaymentModal onClose={() => setShowModal(false)} />}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
