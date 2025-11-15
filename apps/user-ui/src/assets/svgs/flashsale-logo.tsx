import Image from "next/image";

interface FlashsaleLogoProps {
  size?: number;
  className?: string;
}

const FlashsaleLogo: React.FC<FlashsaleLogoProps> = ({ size = 24, className = "" }) => {
  return (
    <Image
      src="https://ik.imagekit.io/khiemvuong/flashsale_logo.png?updatedAt=1763023140217"
      alt="FlashsaleLogo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};

export default FlashsaleLogo;
