"use client";
import { X, Filter } from "lucide-react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    onApply: () => void;
};

export default function MobileFilterDrawer({ isOpen, onClose, children, onApply }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-600" />
                        <h2 className="font-semibold text-lg text-gray-800">Bộ lọc</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
                    {children}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => {
                                onApply();
                                onClose();
                            }}
                            className="flex-1 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Floating Filter Button Component
export function FloatingFilterButton({ onClick, activeFiltersCount = 0 }: { onClick: () => void; activeFiltersCount?: number }) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed bottom-6 right-6 z-40 bg-black text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-800 transition active:scale-95"
        >
            <Filter size={18} />
            <span className="font-medium">Bộ lọc</span>
            {activeFiltersCount > 0 && (
                <span className="bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                </span>
            )}
        </button>
    );
}
