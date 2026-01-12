import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Loader2, Share2 } from 'lucide-react';

const Receipt: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!state?.payment) {
            navigate('/');
        }
    }, [state, navigate]);

    if (!state?.payment) return null;

    const { payment } = state;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            // Original dimensions
            canvas.width = 2560;
            canvas.height = 3200;

            img.src = '/ricipt_thanks_with_name.jpg';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            if (ctx) {
                // Draw background
                ctx.drawImage(img, 0, 0, 2560, 3200);

                // Configure text
                // 3.9% height of 3200 is ~125px. Let's use ~80px font size for high res.
                ctx.font = 'bold 100px Arial, sans-serif';
                ctx.fillStyle = '#751d08';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                // Coordinates
                // Left: 11.13% -> 285px
                // Top: 26.9% -> 861px
                // Height: 125px. Center Y = 861 + (125/2) = ~923px
                const x = 285;
                const y = 923;

                ctx.fillText(payment.name.toUpperCase(), x, y);

                // Trigger download
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const link = document.createElement('a');
                link.download = `receipt - ${payment.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Error generating receipt:', error);
            alert('Failed to generate receipt image. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="relative w-full max-w-lg shadow-2xl rounded-lg overflow-hidden">
                {/* Display Container */}
                <div className="relative w-full">
                    <img
                        src="/ricipt_thanks_with_name.jpg"
                        alt="Receipt"
                        className="w-full h-auto block"
                    />

                    <div
                        className="absolute flex items-center overflow-hidden"
                        style={{
                            top: '26.9%',
                            left: '11.1%',
                            width: '45.3%',
                            height: '3.9%',
                            color: '#751d08',
                        }}
                    >
                        {/* Responsive text: Left aligned */}
                        <span className="font-bold text-[3.5vw] sm:text-[2.5vw] md:text-xl lg:text-2xl uppercase tracking-wide truncate w-full text-left leading-none pl-2">
                            {payment.name}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex gap-4 w-full max-w-xs justify-center">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg font-bold active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Generating...
                        </>
                    ) : (
                        <>
                            <Download size={20} /> Download
                        </>
                    )}
                </button>
                <button
                    onClick={async () => {
                        setIsDownloading(true);
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            canvas.width = 2560;
                            canvas.height = 3200;
                            img.src = '/ricipt_thanks_with_name.jpg';
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                            });
                            if (ctx) {
                                ctx.drawImage(img, 0, 0, 2560, 3200);
                                ctx.font = 'bold 100px Arial, sans-serif';
                                ctx.fillStyle = '#751d08';
                                ctx.textAlign = 'left';
                                ctx.textBaseline = 'middle';
                                const x = 285;
                                const y = 923;
                                ctx.fillText(payment.name.toUpperCase(), x, y);

                                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                                const blob = await (await fetch(dataUrl)).blob();
                                const file = new File([blob], `receipt-${payment.name.replace(/\s+/g, '-').toLowerCase()}.jpg`, { type: 'image/jpeg' });

                                if (navigator.share) {
                                    await navigator.share({
                                        files: [file],
                                        title: 'MYL MUTHUTHALA Receipt',
                                        text: `Payment Receipt for ${payment.name}`
                                    });
                                } else {
                                    alert("Sharing is not supported on this device.");
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setIsDownloading(false);
                        }
                    }}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-bold active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />} Share
                </button>
                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => navigate('/gen-poster')}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                        Generate Poster
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-gray-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Receipt;
