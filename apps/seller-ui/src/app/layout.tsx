import './global.css';
import Providers from './providers'

import {Poppins, Roboto} from "next/font/google"
export const metadata = {
  title: 'Ilan Seller',
  description: 'Ilan E-commerce App',
}
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100','300','400','500','700','900'],
  variable: '--font-roboto'
})
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100','200','300','400','500','600','700','800','900'],
  variable: '--font-poppins'
})
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        <Providers>
        {children}
        </Providers>
        </body>
    </html>
  )
}
