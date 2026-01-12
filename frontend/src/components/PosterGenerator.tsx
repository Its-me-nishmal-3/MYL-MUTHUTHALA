import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Download, Upload, ArrowLeft, Loader2, Check, X, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';

interface Point {
    x: number;
    y: number;
}

interface Area {
    width: number;
    height: number;
    x: number;
    y: number;
}

// Helper to create the cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(URL.createObjectURL(file));
            }
        }, 'image/png');
    });
};

const PosterGenerator: React.FC = () => {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [name, setName] = useState('');
    const [userImage, setUserImage] = useState<string | null>(null); // Final cropped image
    const [isGenerating, setIsGenerating] = useState(false);
    const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    // Cropping State
    const [tempImage, setTempImage] = useState<string | null>(null); // Raw upload
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Coordinates configuration
    // Based on User provided Map from the high-res (2560x3200) original
    // Photo: 1138,2085,345,1132 (x2, y2, x1, y1) -> x=345, y=1132, w=793, h=953
    // Name: 476,2173,1322,2247 -> x=476, y=2173, w=846, h=74
    const COORDS = {
        PHOTO: { x: 345, y: 1132, w: 793, h: 953 },
        NAME: { x: 70, y: 2190, w: 846, h: 74 },
        TEMPLATE_SRC: '/challange-frame.png'
    };

    // Load template image on mount
    useEffect(() => {
        const img = new Image();
        img.src = COORDS.TEMPLATE_SRC;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            console.log("Template image loaded:", img.naturalWidth, img.naturalHeight);
            setTemplateImage(img);
        };
        img.onerror = (err) => {
            console.error("Failed to load template image", err);
            // alert("Failed to load template image. Please check your internet connection or try again.");
        };
    }, []);

    // Draw canvas whenever dependencies change
    useEffect(() => {
        if (!templateImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match template
        canvas.width = templateImage.naturalWidth;
        canvas.height = templateImage.naturalHeight;

        // The coordinates are based on the high-res original (2560x3200).
        // The loaded template is smaller (819x1024).
        // We scale coordinates down to fit.
        const REFERENCE_WIDTH = 2560; // Confirmed via user logs
        const scale = canvas.width / REFERENCE_WIDTH;

        // console.log("Canvas Size:", canvas.width, canvas.height, "Scale Factor:", scale); 

        // 1. Draw Template
        ctx.drawImage(templateImage, 0, 0);

        // 2. Draw User Photo (PRE-CROPPED now)
        if (userImage) {
            // console.log("Loading user image...");
            const img = new Image();
            // Data URLs don't need crossOrigin, and sometimes it breaks them.
            // img.crossOrigin = 'anonymous'; 

            img.onload = () => {
                // console.log("User image loaded:", img.naturalWidth, img.naturalHeight);

                // Scale coordinates
                const x = COORDS.PHOTO.x * scale;
                const y = COORDS.PHOTO.y * scale;
                const w = COORDS.PHOTO.w * scale;
                const h = COORDS.PHOTO.h * scale;

                // Clip the area
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();

                // Since image is ALREADY cropped to aspect ratio, just draw it covering the area for safety
                // Or simply drawImage(img, x, y, w, h) if we trust the crop.
                // Let's stick to "cover" logic just in case tiny rounding errors occur.
                const imgRatio = img.naturalWidth / img.naturalHeight;
                const areaRatio = w / h;

                let drawW, drawH, drawX, drawY;

                if (imgRatio > areaRatio) {
                    // Image is wider than area
                    drawH = h;
                    drawW = h * imgRatio;
                    drawX = x - (drawW - w) / 2;
                    drawY = y;
                } else {
                    // Image is taller than area
                    drawW = w;
                    drawH = w / imgRatio;
                    drawX = x;
                    drawY = y - (drawH - h) / 2;
                }

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
                ctx.restore();

                // 3. Draw Name AFTER photo
                drawName(ctx, scale);
                setIsCanvasReady(true);
            };

            img.onerror = (e) => {
                console.error("Failed to load user image", e);
                drawName(ctx, scale);
                setIsCanvasReady(true);
            };

            img.src = userImage;
        } else {
            // No user image, just draw name
            drawName(ctx, scale);
            setIsCanvasReady(true);
        }

    }, [templateImage, userImage, name]);

    const drawName = (ctx: CanvasRenderingContext2D, scale: number) => {
        if (!name) return;

        const x = COORDS.NAME.x * scale;
        const y = COORDS.NAME.y * scale;
        const w = COORDS.NAME.w * scale;
        const h = COORDS.NAME.h * scale;

        ctx.save();
        // Scale font size as well.
        // Base size 80 seems appropriate for 2560px width.
        const fontSize = Math.round(40 * scale);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'start';
        ctx.textBaseline = 'middle';

        // Convert input to uppercase
        const text = name.toUpperCase();

        // Center point
        const centerX = x + w / 2;
        const centerY = y + h / 2;

        ctx.fillText(text, centerX, centerY);
        ctx.restore();
    };


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setTempImage(event.target.result as string);
                    setIsCropping(true); // Open cropper
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        if (!tempImage || !croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(
                tempImage,
                croppedAreaPixels
            );
            setUserImage(croppedImage);
            setIsCropping(false);
            setTempImage(null); // Clear temp
        } catch (e) {
            console.error(e);
            alert("Could not crop image");
        }
    }, [croppedAreaPixels, tempImage]);


    const handleShare = async () => {
        if (!canvasRef.current) return;
        setIsGenerating(true);

        try {
            const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `myl-muthuthala-poster-${name || 'participant'}.png`, { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: 'MYL MUTHUTHALA Dates Challenge',
                    text: 'Here is my poster for the MYL MUTHUTHALA Dates Challenge!'
                });
            } else {
                alert("Sharing is not supported on this device/browser. Please download instead.");
            }
        } catch (err) {
            console.error("Share failed", err);
            if ((err as any).name !== 'AbortError') {
                alert("Failed to share poster");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        setIsGenerating(true);

        try {
            // Create a temporary link
            const link = document.createElement('a');
            link.download = `myl-muthuthala-poster-${name || 'participant'}.png`;
            link.href = canvasRef.current.toDataURL('image/png', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download poster");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col items-center">

            {/* Cropper Modal */}
            {isCropping && tempImage && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="relative flex-1 w-full bg-gray-900">
                        <Cropper
                            image={tempImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={COORDS.PHOTO.w / COORDS.PHOTO.h}
                            onCropChange={setCrop}
                            onCropComplete={handleCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    {/* Controls */}
                    <div className="bg-gray-900 p-6 flex flex-col gap-4 border-t border-gray-800">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => {
                                    setZoom(Number(e.target.value));
                                }}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsCropping(false); setTempImage(null); }}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" /> Cancel
                            </button>
                            <button
                                onClick={showCroppedImage}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> Confirm Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <button
                onClick={() => navigate('/')}
                className="self-start text-gray-400 hover:text-white flex items-center gap-2 mb-6"
            >
                <ArrowLeft className="w-5 h-5" /> Back
            </button>

            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 text-center">
                Poster Generator
            </h1>

            {/* Inputs */}
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-4 space-y-4 mb-8 border border-gray-800">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:flex-1 bg-gray-800 rounded-xl overflow-hidden hover:ring-2 ring-emerald-500/50 transition-all cursor-pointer h-14 flex items-center justify-center border border-gray-700">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleImageUpload}
                            accept="image/*"
                        />
                        <div className="flex items-center gap-2 pointer-events-none">
                            <Upload className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-300">
                                {userImage ? 'Change Photo' : 'Upload Photo'}
                            </span>
                        </div>
                    </div>

                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full sm:flex-[2] bg-gray-800 border border-gray-700 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-14"
                        placeholder="Enter your name"
                    />
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="w-full max-w-sm relative rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900">
                {!templateImage && (
                    <div className="h-96 flex items-center justify-center text-gray-500 gap-2">
                        <Loader2 className="animate-spin" /> Loading Template...
                    </div>
                )}

                {/* 
                   Canvas serves as preview. 
                   Responsive CSS via class w-full.
                */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto block"
                />
            </div>

            <div className="mt-8 w-full max-w-sm gap-3 flex">
                <button
                    onClick={handleDownload}
                    disabled={!isCanvasReady || !userImage}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Download />}
                    {isGenerating ? 'Wait...' : 'Download'}
                </button>
                <button
                    onClick={handleShare}
                    disabled={!isCanvasReady || !userImage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Share2 />}
                    {isGenerating ? 'Wait...' : 'Share'}
                </button>
            </div>
        </div>
    );
};

export default PosterGenerator;
