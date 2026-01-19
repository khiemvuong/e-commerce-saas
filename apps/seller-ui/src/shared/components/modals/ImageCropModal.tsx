/**
 * Image Crop Modal Component
 * 
 * Interactive image cropping with zoom and pan controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropModalProps {
    imageFile: File;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
    targetWidth?: number;
    targetHeight?: number;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    imageFile,
    onCropComplete,
    onCancel,
    targetWidth = 765,
    targetHeight = 850,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const targetRatio = targetWidth / targetHeight;

    // Load image
    useEffect(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                // Calculate initial zoom to fit
                const imgRatio = img.width / img.height;
                let initialZoom = 1;
                if (imgRatio > targetRatio) {
                    // Image is wider - fit height
                    initialZoom = 354 / img.height;
                } else {
                    // Image is taller - fit width
                    initialZoom = 318 / img.width;
                }
                setZoom(initialZoom);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(imageFile);
    }, [imageFile, targetRatio]);

    // Draw canvas
    useEffect(() => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw the resized/positioned image first
        const scaledWidth = image.width * zoom;
        const scaledHeight = image.height * zoom;
        ctx.drawImage(
            image,
            position.x,
            position.y,
            scaledWidth,
            scaledHeight
        );

        // Crop area dimensions
        const cropWidth = 318; // Visual crop width (9:10 ratio)
        const cropHeight = 354; // Visual crop height
        const cropX = (canvas.width - cropWidth) / 2;
        const cropY = (canvas.height - cropHeight) / 2;

        // 2. Draw Dimmed Overlay with "Hole" (Transparency)
        // Using 'evenodd' rule: Rect inside Rect creates a hole
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height); // Outer full canvas
        ctx.rect(cropX, cropY, cropWidth, cropHeight); // Inner crop area
        ctx.fill('evenodd'); // Fills the outer part, leaves inner part transparent

        // 3. Draw Crop Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

        // 4. Draw Rule of Thirds Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed lines
        
        ctx.beginPath();
        // Vertical lines
        ctx.moveTo(cropX + cropWidth / 3, cropY);
        ctx.lineTo(cropX + cropWidth / 3, cropY + cropHeight);
        ctx.moveTo(cropX + (cropWidth * 2) / 3, cropY);
        ctx.lineTo(cropX + (cropWidth * 2) / 3, cropY + cropHeight);
        
        // Horizontal lines
        ctx.moveTo(cropX, cropY + cropHeight / 3);
        ctx.lineTo(cropX + cropWidth, cropY + cropHeight / 3);
        ctx.moveTo(cropX, cropY + (cropHeight * 2) / 3);
        ctx.lineTo(cropX + cropWidth, cropY + (cropHeight * 2) / 3);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset dash
    }, [image, zoom, position]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        // Change cursor to grabbing
        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
         // Change cursor back to move
         if (canvasRef.current) canvasRef.current.style.cursor = 'move';
    };


    const handleZoomChange = (newZoom: number) => {
        setZoom(Math.max(0.1, Math.min(5, newZoom)));
    };

    const handleCrop = async () => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const cropX = (canvas.width - 318) / 2;
        const cropY = (canvas.height - 354) / 2;

        // Create final canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) return;

        // Calculate source coordinates on the original image
        const sourceX = (cropX - position.x) / zoom;
        const sourceY = (cropY - position.y) / zoom;
        const sourceWidth = 318 / zoom;
        const sourceHeight = 354 / zoom;

        // Draw cropped area to final canvas
        finalCtx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
        );

        // Convert to blob then file - preserve original format
        const outputType = imageFile.type.startsWith('image/') ? imageFile.type : 'image/jpeg';
        const quality = outputType === 'image/jpeg' ? 0.92 : undefined;
        
        finalCanvas.toBlob((blob) => {
            if (!blob) return;
            const croppedFile = new File([blob], imageFile.name, {
                type: outputType,
            });
            onCropComplete(croppedFile);
        }, outputType, quality);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4">
            <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header - Sticky */}
                <div className="sticky top-0 bg-gray-900 z-10 flex justify-between items-center px-4 py-3 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white">Crop Image</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {/* Canvas */}
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={450}
                            height={500}
                            className="w-full cursor-move"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    </div>

                    {/* Zoom Control */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleZoomChange(zoom - 0.1)}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
                            title="Zoom Out"
                        >
                            <ZoomOut size={18} />
                        </button>
                        
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Zoom</span>
                                <span className="font-semibold">{Math.round(zoom * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
                                    [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full 
                                    [&::-webkit-slider-thumb]:bg-blue-500"
                            />
                        </div>
                        
                        <button
                            onClick={() => handleZoomChange(zoom + 0.1)}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
                            title="Zoom In"
                        >
                            <ZoomIn size={18} />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg 
                                text-white font-medium transition text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCrop}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg 
                                text-white font-medium transition flex items-center justify-center gap-1.5 text-sm"
                        >
                            <Check size={16} />
                            Crop & Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
