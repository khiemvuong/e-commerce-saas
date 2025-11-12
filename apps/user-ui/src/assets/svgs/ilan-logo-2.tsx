import Image from "next/image";

interface IlanLogo2Props {
  size?: number;
  className?: string;
}

const IlanLogo2: React.FC<IlanLogo2Props> = ({ size = 24, className = "" }) => {
  return (
    <Image
      src="https://ik.imagekit.io/khiemvuong/logo%20(2).png?updatedAt=1762868084272"
      alt="Ilan Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};

export default IlanLogo2;
