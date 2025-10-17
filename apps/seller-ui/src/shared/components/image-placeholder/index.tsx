import { Pencil, WandSparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const ImagePlaceHolder = (
    {
        size,
        small,
        onImageChange,
        onRemove,
        defaultImage = null,
        index = 0,
        setOpenImageModal,
    }: {
        size: string;
        small?: boolean;
        onImageChange: (file: File | null, index: number) => void;
        onRemove?: (index: number) => void;
        defaultImage?: string | null;
        setOpenImageModal: (openImageModal: boolean) => void;
        index?: number;
    }
) => {
    const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);

    // Đồng bộ imagePreview với defaultImage khi defaultImage thay đổi
    useEffect(() => {
        setImagePreview(defaultImage);
    }, [defaultImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            onImageChange(file, index);
        }
    };

    const handleRemove = () => {
        setImagePreview(null);
        onRemove?.(index);
    };

    return (
        <div className={`relative ${small ? "h-[180px]" : "h-[450px]"} w-full cursor-pointer bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col justify-center items-center`}>
            <input 
                type="file" 
                accept='image/*' 
                className="hidden" 
                id={`image-upload-${index}`} 
                onChange={handleFileChange} 
            />
            {imagePreview ? (
                <>
                    <button 
                        type="button" 
                        onClick={handleRemove}
                        className="absolute top-3 right-3 p-2 !rounded bg-red-600 shadow-lg text-white hover:bg-red-500 z-10"
                    >
                        <X size={16} />
                    </button>
                    <button 
                        type="button"
                        className='absolute top-3 right-[70px] p-2 !rounded bg-blue-500 shadow-lg cursor-pointer z-10'
                        onClick={() => setOpenImageModal(true)}
                    >
                        <WandSparkles size={16} color='white' />
                    </button>
                </>
            ) : (
                <label
                    htmlFor={`image-upload-${index}`}
                    className="absolute top-3 right-3 p-2 rounded bg-slate-700 shadow-lg cursor-pointer z-10"
                >
                    <Pencil size={16} color='white' />
                </label>
            )}

            {imagePreview ? (
                <Image
                    src={imagePreview}
                    alt="uploaded"
                    className="w-full h-full object-cover rounded-lg"
                    width={400}
                    height={300}
                />
            ) : (
                <>
                    <p className={`text-gray-400 ${small ? "text-xl" : "text-4xl"} font-semibold`}>{size}</p>
                    <p className={`text-gray-500 ${small ? "text-sm" : "text-lg"} font-semibold`}>Upload Image</p>
                </>
            )}
        </div>
    );
};

export default ImagePlaceHolder;