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
        <html lang="tr" className="dark scroll-smooth">
            <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 antialiased`}>
                <div className="fixed inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.05),transparent_50%)]"></div>
                </div>
                <Navbar />
                <main className="relative">
                    {children}
                </main>
            </body>
        </html>
    )
}
