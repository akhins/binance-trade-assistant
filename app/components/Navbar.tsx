'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, List, Shield, Settings, FileText } from 'lucide-react'

const navItems = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/trades', label: 'Trade\'ler', icon: List },
    { href: '/risk', label: 'Risk', icon: Shield },
    { href: '/reports', label: 'AI Raporlar', icon: FileText },
    { href: '/settings', label: 'Ayarlar', icon: Settings },
]

export default function Navbar() {
    const pathname = usePathname()

    return (
        <nav className="sticky top-0 z-50 glass border-b border-white/10">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white hover:text-primary-400 transition-colors">
                        <BarChart3 className="w-6 h-6" />
                        Binance Trade Asistanı
                    </Link>

                    <div className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        isActive
                                            ? 'bg-primary-600/30 text-primary-400'
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </nav>
    )
}
