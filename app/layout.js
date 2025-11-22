import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'WhoToConsult - Find the Right Medical Specialist',
  description: 'Free symptom checker to help you find the right medical specialist for your symptoms. Get expert guidance on which doctor to consult.',
  keywords: 'symptom checker, medical specialist, doctor finder, health consultation, medical advice',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
