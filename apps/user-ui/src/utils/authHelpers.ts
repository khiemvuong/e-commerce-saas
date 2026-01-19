import toast from 'react-hot-toast';

/**
 * Hiển thị thông báo yêu cầu đăng nhập và hỏi người dùng có muốn chuyển đến trang đăng nhập không
 * @param router - Next.js router instance
 * @param message - Thông báo hiển thị cho người dùng
 */
export const requireLogin = (router: any, message: string = 'Vui lòng đăng nhập để sử dụng tính năng này') => {
    toast.error(message, {
        duration: 4000,
    });

    // Hiển thị confirm dialog sau khi toast xuất hiện
    setTimeout(() => {
        const shouldRedirect = window.confirm('Bạn có muốn chuyển đến trang đăng nhập không?');
        if (shouldRedirect) {
            router.push('/login');
        }
    }, 500);
};
