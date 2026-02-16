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
        <nav className="sticky top-0 z-50 glass-modern border-b border-white/20 backdrop-blur-2xl">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link 
                        href="/" 
                        className="group flex items-center gap-3 text-xl font-bold text-white hover:text-primary-400 transition-all duration-300"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <BarChart3 className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent group-hover:from-primary-400 group-hover:via-primary-300 group-hover:to-primary-400 transition-all">
                            Binance Trade Asistanı
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-primary-600/40 to-purple-600/40 text-white shadow-lg shadow-primary-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {isActive && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl blur-sm"></span>
                                    )}
                                    <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary-300' : 'group-hover:text-primary-400'} transition-colors`} />
                                    <span className="hidden sm:inline relative z-10">{item.label}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full"></span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </nav>
    )
}
