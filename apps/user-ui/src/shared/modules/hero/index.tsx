import React from 'react';

const Hero= () => {
  return (
    <section
      aria-label="Hero"
      className="bg-black text-white w-full min-h-[160px] py-10 px-6 relative overflow-hidden"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-16">
        {/* Left content block (independent) */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-4">
            {/* Apple logo - src empty for you to fill */}
            <img src="https://ik.imagekit.io/khiemvuong/1200px-Apple_gray_logo%201.png?updatedAt=1761726405724" alt="brand logo" className="w-6 h-6 object-contain" />
            <span className="text-sm text-gray-300">iPhone 14 Series</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight -tracking-tighter">
            Up to 10% <span className="block">off Voucher</span>
          </h1>

          <div className="flex items-center gap-8 mt-3">
            <a
              role="button"
              href="/products"
              className="group cursor-pointer bg-transparent border-none"
            >
              <span className="relative inline-block pb-5 text-sm uppercase tracking-[4px] pr-4 text-white">
                Shop Now
                {/* Underline animation */}
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white scale-x-0 origin-bottom-right transition-transform duration-250 ease-out group-hover:scale-x-100 group-hover:origin-bottom-left"></span>
              </span>
              <svg
                className="inline-block -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-active:scale-90"
                fill="currentColor"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path>
              </svg>
            </a>

            
          </div>
        </div>

        {/* Right visual block (independent) */}
        <div
          aria-hidden="true"
          className="w-[420px] max-w-[45%] flex items-center justify-center relative pointer-events-none"
        >
          {/* decorative highlight / gradient behind phone */}
          <div
            className="absolute -right-2 w-[340px] h-[160px] rounded-lg blur-[18px] transform translate-x-4"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,120,230,0.08), rgba(120,120,255,0.06))',
            }}
          />

          {/* Phone image - src empty for you to fill */}
          <img
            src="https://ik.imagekit.io/khiemvuong/hero_endframe__cvklg0xk3w6e_large%202.png?updatedAt=1761726370763"
            alt="product"
            className="w-[380px] h-auto object-contain z-10 transform translate-x-4"
            draggable={false}
          />
        </div>
      </div>

      {/* subtle bottom divider like screenshot (independent) */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 bottom-0 h-px bg-white/10"
      />
      {/* pagination dots (independent) */}
      <nav aria-label="hero pagination" className="flex gap-3 justify-center items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-100" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
      </nav>
    </section>
  );
};

export default Hero;