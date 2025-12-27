import Link from "next/link";
import ProfileIcon from "../../../assets/svgs/profile-icon";

interface UserMenuProps {
    user: any;
}

const UserMenu = ({ user }: UserMenuProps) => {
    if (user) {
        return (
            <Link
                href={"/profile?active=profile"}
                className="flex items-center gap-2 md:gap-3 p-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition"
            >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 flex items-center justify-center bg-gray-100 hover:border-blue-500 transition overflow-hidden">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ProfileIcon size={18} className="text-gray-600" />
                    )}
                </div>
                <div className="hidden lg:flex flex-col">
                    <span className="text-xs text-gray-500 font-medium leading-tight">
                        Hello,
                    </span>
                    <span className="text-sm text-gray-800 font-Roboto font-bold leading-tight truncate max-w-[100px]">
                        {user?.name ? ` ${user.name}` : ","}
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-2 md:gap-3 p-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 flex items-center justify-center bg-gray-100">
                <ProfileIcon size={18} className="text-gray-600" />
            </div>
            <div className="hidden lg:flex flex-col">
                <span className="text-xs text-gray-500 font-medium leading-tight">
                    Hello,
                </span>
                <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:text-blue-800 font-bold transition"
                >
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default UserMenu;
