import React, { useState, useEffect } from 'react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className=" fixed bottom-8 right-8 z-50 w-[50px] h-[50px] rounded-full bg-[rgb(20,20,20)] border-none font-semibold flex items-center justify-center shadow-[0px_0px_0px_4px_rgba(180,160,255,0.253)] cursor-pointer transition-all duration-300 overflow-hidden hover:w-[110px] hover:rounded-[50px] hover:bg-[rgb(181,160,255)] group"
          aria-label="Scroll to top"
        >
          <svg 
            className="w-3 transition-all duration-300 group-hover:translate-y-[-110%]" 
            viewBox="0 0 384 512"
          >
            <path 
              fill="white"
              d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" 
            />
          </svg>
          <span className="absolute bottom-[-20px] text-white text-[0px] opacity-0 group-hover:text-[13px] group-hover:opacity-100 group-hover:bottom-auto transition-all duration-300">
            Back to Top
          </span>
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
