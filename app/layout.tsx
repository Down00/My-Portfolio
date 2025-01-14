import './globals.css'
import { Inter , Outfit, Montserrat } from 'next/font/google'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })
const outfit = Outfit({ subsets: ['latin'] })
const montserrat = Montserrat({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Portfolio',
  description: 'Welcome to my professional portfolio showcasing my work and skills',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>{children}</body>
    </html>
  )
}
