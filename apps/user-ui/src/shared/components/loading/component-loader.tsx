import React from 'react';

interface ComponentLoaderProps {
  text?: string;
}

const ComponentLoader: React.FC<ComponentLoaderProps> = ({ text = "Loading" }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      {/* Bouncing dots with unique stagger effect */}
      <div className="flex items-end gap-3 h-20">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-4 h-4 bg-black rounded-full"
            style={{
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: `${index * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <div className="mt-4">
        <span className="text-gray-700 font-medium tracking-wide">{text}</span>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-24px) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default ComponentLoader;
