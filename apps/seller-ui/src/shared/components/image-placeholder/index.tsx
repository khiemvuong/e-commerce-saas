// ...existing code...
import { Loader2, Pencil, WandSparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
const ImagePlaceHolder = (
  {
    size,
    small,
    onImageChange,
    onRemove,
    defaultImage = null,
    index = 0,
    setOpenImageModal,
    setSelectedImage,
    setSelectedImageIndex,
    isUploading = false,
    images,
  }: {
    size: string;
    small?: boolean;
    onImageChange: (file: File | null, index: number) => void;
    onRemove?: (index: number) => void;
    defaultImage?: string | null;
    setOpenImageModal: (openImageModal: boolean) => void;
    setSelectedImage: (selectedImage: string) => void;
    setSelectedImageIndex?: (index: number) => void;
    images: any;
    index?: number;
    isUploading?: boolean;
  }
) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);

  useEffect(() => {
    setImagePreview(defaultImage);
  }, [defaultImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      onImageChange(file, index);
    }
  };

  const handleRemove = () => {
    if (isUploading) return;
    setImagePreview(null);
    onRemove?.(index);
  };

  return (
    <div className={`relative ${small ? 'h-[180px]' : 'h-[450px]'} w-full bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col justify-center items-center overflow-hidden`}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      )}

      {imagePreview ? (
        <>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-3 right-3 p-2 rounded bg-red-600 text-white hover:bg-red-500 z-10 disabled:opacity-50"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedImageIndex?.(index);
              setOpenImageModal(true);
              setSelectedImage(images[index]?.file_url || imagePreview || '');
            }}
            disabled={isUploading}
            className="absolute top-3 right-[56px] p-2 rounded bg-blue-500 text-white z-10 disabled:opacity-50"
          >
            <WandSparkles size={16} />
          </button>
        </>
      ) : (
        <label
          htmlFor={`image-upload-${index}`}
          className={`absolute top-3 right-3 p-2 rounded bg-slate-700 text-white shadow cursor-pointer z-10 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Pencil size={16} />
        </label>
      )}

      {imagePreview ? (
        <img
          src={imagePreview}
          alt="uploaded"
          className="w-full h-full object-cover"
          width={800}
          height={600}
        />
      ) : (
        <>
          <p className={`text-gray-400 ${small ? 'text-xl' : 'text-4xl'} font-semibold`}>{size}</p>
          <p className={`text-gray-500 ${small ? 'text-sm' : 'text-lg'} font-semibold`}>Upload Image</p>
        </>
      )}
    </div>
  );
};

export default ImagePlaceHolder;
