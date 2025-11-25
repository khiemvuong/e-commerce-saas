import Link from 'next/link'; 
import { ChevronRight } from 'lucide-react'; 

interface BreadCrumbsProps {
  title: string;
}

const BreadCrumbs = ({ title }: BreadCrumbsProps) => {
  return (
    <div className="w-full">
      {/* Hiển thị Title lớn */}
      <h2 className="text-2xl py-2 font-semibold font-poppins text-white">
        {title}
      </h2>

      {/* Thanh điều hướng */}
      <div className='flex items-center mb-4'>
        <Link href='/dashboard' className='hover:underline text-[#80Deea] cursor-pointer'>
            Dashboard
        </Link>
        <ChevronRight size={20} className='text-gray-200'/>
        <span className='text-white'>{title}</span>
      </div>
    </div>
  );
}

export default BreadCrumbs;