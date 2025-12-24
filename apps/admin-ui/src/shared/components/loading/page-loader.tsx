import React from 'react';

interface PageLoaderProps {
  text?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ text = "Loading" }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
        {/* Bouncing dots with unique stagger effect */}
        <div className="flex items-end gap-3 h-16">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-4 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
              style={{
                animation: 'bounce 1.4s ease-in-out infinite',
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <p className="text-rose-500 font-bold tracking-wide">{text}</p>

        <style jsx>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: translateY(0) scale(1);
            }
            40% {
              transform: translateY(-20px) scale(1.1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PageLoader;
