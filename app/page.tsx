'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Shield, Brain, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Home() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="container mx-auto px-6 py-24 md:py-32">
                    <div className="text-center space-y-10 animate-fade-in">
                        {/* Logo/Title */}
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-modern border-primary-500/30 shadow-lg shadow-primary-500/10 float-animation">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-500/30 blur-lg rounded-full"></div>
                                <TrendingUp className="w-6 h-6 text-primary-400 relative z-10" />
                            </div>
                            <span className="text-sm font-semibold text-white">Binance Trade Asistanı</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-6xl md:text-8xl font-extrabold leading-tight">
                            <span className="block text-white mb-2">Daha Çok Değil,</span>
                            <span className="block">
                                <span className="bg-gradient-to-r from-primary-400 via-purple-400 via-pink-400 to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                    Daha İyi Trade
                                </span>
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            AI destekli risk yönetimi, otomatik trade analizi ve disiplin odaklı yaklaşımla
                            <span className="text-primary-400 font-semibold"> trading performansınızı</span> ölçülebilir şekilde iyileştirin.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <Link
                                href="/dashboard"
                                className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-105 overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                                <span className="relative z-10">Dashboard'a Git</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/trades"
                                className="group px-8 py-4 glass-modern hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300 border-white/30 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20"
                            >
                                Trade'leri Görüntüle
                            </Link>
                        </div>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
                        <FeatureCard
                            icon={<Shield className="w-8 h-8" />}
                            title="Risk Yönetimi"
                            description="Günlük/haftalık limit takibi ve disiplin modu ile kontrolü kaybetmeyin"
                            gradient="from-green-500 to-emerald-500"
                        />

                        <FeatureCard
                            icon={<BarChart3 className="w-8 h-8" />}
                            title="Detaylı Analiz"
                            description="Win rate, profit factor, drawdown ve daha fazla metrik"
                            gradient="from-blue-500 to-cyan-500"
                        />

                        <FeatureCard
                            icon={<Brain className="w-8 h-8" />}
                            title="AI Asistan"
                            description="Her trade'i analiz eder, haftalık rapor ve öneriler sunar"
                            gradient="from-purple-500 to-pink-500"
                        />

                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8" />}
                            title="Binance Entegrasyonu"
                            description="Otomatik trade senkronizasyonu ve gerçek zamanlı PnL hesaplama"
                            gradient="from-orange-500 to-red-500"
                        />
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-24 space-y-6">
                        <h3 className="text-2xl font-semibold text-center text-white">Neden Bu Asistan?</h3>

                        <div className="grid md:grid-cols-3 gap-6">
                            <TrustCard
                                title="Güvenlik Öncelikli"
                                description="API anahtarlarınız AES encryption ile güvenli saklanır"
                            />
                            <TrustCard
                                title="Karar Sizde"
                                description="Bot değil, asistan. Hiçbir zaman sizin adınıza işlem açmaz"
                            />
                            <TrustCard
                                title="Veri Sahipliği"
                                description="Tüm verilerinizi istediğiniz zaman export edebilir veya silebilirsiniz"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ icon, title, description, gradient }: {
    icon: React.ReactNode
    title: string
    description: string
    gradient: string
}) {
    return (
        <div className="group relative p-8 rounded-2xl glass-modern hover:bg-white/10 transition-all duration-500 card-hover overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="shimmer absolute inset-0"></div>
            </div>
            
            {/* Gradient glow */}
            <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
            
            <div className={`absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white shadow-2xl opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10`}>
                {icon}
            </div>

            <div className="mt-10 relative z-10">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function TrustCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="group flex items-start gap-4 p-6 rounded-xl glass-modern hover:bg-white/10 transition-all duration-300 card-hover">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CheckCircle2 className="w-7 h-7 text-green-400 flex-shrink-0 mt-1 relative z-10 group-hover:scale-110 transition-transform" />
            </div>
            <div>
                <h4 className="font-bold text-white mb-2 group-hover:text-green-300 transition-colors">{title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
