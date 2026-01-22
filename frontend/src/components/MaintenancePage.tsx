import React from 'react';
import { motion } from 'framer-motion';

const MaintenancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center font-sans">

            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-200/40 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-200/40 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-24 h-24 mx-auto bg-teal-50 rounded-full flex items-center justify-center shadow-xl border border-teal-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-green-600 drop-shadow-sm">
                    We'll Be Back Soon
                </h1>

                <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                    Our system is currently undergoing scheduled maintenance.
                    We should be back shortly. Thank you for your patience.
                </p>

                <div className="pt-8">
                    <div className="inline-block px-6 py-3 bg-white rounded-full shadow-lg border border-teal-100 text-teal-800 font-semibold animate-bounce">
                        Stay Tuned!
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 text-gray-400 text-sm">
                &copy; 2026 MYL MUTHUTHALA
            </div>
        </div>
    );
};

export default MaintenancePage;
