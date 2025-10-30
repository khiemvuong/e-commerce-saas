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
              href="#"
              className="text-sm text-white border-b border-white/25 pb-1 inline-flex items-center"
            >
              Shop Now&nbsp; →
            </a>

            {/* pagination dots (independent) */}
            <nav aria-label="hero pagination" className="flex gap-3 items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-100" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-40" />
            </nav>
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
    </section>
  );
};

export default Hero;