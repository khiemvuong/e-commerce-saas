import * as React from 'react';
const Logo = (props: any) => (
<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -5 60 60"
    width={50}
    height={50}
    id="stripe"
    {...props}
>
    <g id="Layer_2">
        <g id="Layer_1-2">
            {/* center the rounded rect inside the 60x60 viewBox */}
            <rect
                x={10}
                y={10}
                width={40}
                height={40}
                rx={6.48}
                ry={6.48}
            />

            {/* original icon was authored in a 24x24 viewBox; scale and translate
                it so it's centered inside the 40x40 rounded rect. We translate to
                the rect center (30,30), scale by 1.5 (24 * 1.5 = 36 fits inside 40)
                and then translate by -12 to recentre the original 24x24 coords. */}
            <g transform="translate(30 30) scale(3) translate(-12 -12)">
                <path
                    d="M3 18H7M10 18H21M5 21H12M16 21H19M8.8 15C6.14903 15 4 12.9466 4 10.4137C4 8.31435 5.6 6.375 8 6C8.75283 4.27403 10.5346 3 12.6127 3C15.2747 3 17.4504 4.99072 17.6 7.5C19.0127 8.09561 20 9.55741 20 11.1402C20 13.2719 18.2091 15 16 15L8.8 15Z"
                    fill="#fff"
                    fillRule="evenodd"
                />
            </g>
        </g>
    </g>
</svg>
);

export default Logo;

