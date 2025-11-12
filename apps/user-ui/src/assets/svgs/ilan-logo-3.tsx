import Image from "next/image";

interface IlanLogo3Props {
  size?: number;
  className?: string;
}

const IlanLogo3: React.FC<IlanLogo3Props> = ({ size = 24, className = "" }) => {
  return (
    <Image
      src="https://ik.imagekit.io/khiemvuong/logo_3.png?updatedAt=1762869289719"
      alt="Ilan Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};

export default IlanLogo3;
