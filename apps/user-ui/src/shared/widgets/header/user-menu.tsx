import Link from "next/link";
import { User2Icon } from "lucide-react";

interface UserMenuProps {
    user: any;
}

const UserMenu = ({ user, isTransparent = false }: { user: any, isTransparent?: boolean }) => {
    if (user) {
        return (
            <Link
                href={"/profile?active=profile"}
                className={`flex items-center gap-2 md:gap-3 p-1 md:px-3 md:py-2 rounded-full transition ${
                    isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
            >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition overflow-hidden ${
                    isTransparent 
                        ? 'bg-white/10 border-white/20 hover:border-white' 
                        : 'bg-gray-100 border-gray-200 hover:border-[#C9A86C]'
                }`}>
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User2Icon size={18} className={isTransparent ? "text-white" : "text-gray-600"} />
                    )}
                </div>
                <div className="hidden md:flex flex-col">
                    <span className={`text-xs font-medium leading-tight ${
                        isTransparent ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                        Hello,
                    </span>
                    <span className={`text-sm font-Roboto font-bold leading-tight truncate max-w-[100px] ${
                        isTransparent ? 'text-white' : 'text-gray-800'
                    }`}>
                        {user?.name ? ` ${user.name}` : ","}
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <div className={`flex items-center gap-2 md:gap-3 p-1 md:px-3 md:py-2 rounded-full transition ${
            isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'
        }`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center ${
                isTransparent 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-gray-100 border-gray-200'
            }`}>
                <User2Icon size={18} className={isTransparent ? "text-white" : "text-gray-600"} />
            </div>
            <div className="hidden md:flex flex-col">
                <span className={`text-xs font-medium leading-tight ${
                    isTransparent ? 'text-gray-300' : 'text-gray-500'
                }`}>
                    Hello,
                </span>
                <Link
                    href="/login"
                    className={`text-sm font-bold transition hover:underline ${
                        isTransparent ? 'text-white' : 'text-[#C9A86C] hover:text-[#B8956A]'
                    }`}
                >
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default UserMenu;
