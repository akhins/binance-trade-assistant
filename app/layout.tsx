import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Binance Trade Asistanı - Akıllı Risk Yönetimi',
    description: 'Trade performansınızı analiz edin, disiplininizi artırın, ve AI destekli önerilerle gelişin.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr" className="dark">
            <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`}>
                <Navbar />
                {children}
            </body>
        </html>
    )
}
