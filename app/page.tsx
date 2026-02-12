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
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

                <div className="container mx-auto px-6 py-20">
                    <div className="text-center space-y-8 animate-fade-in">
                        {/* Logo/Title */}
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass">
                            <TrendingUp className="w-6 h-6 text-primary-400" />
                            <span className="text-sm font-medium text-gray-300">Binance Trade Asistanı</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-5xl md:text-7xl font-bold">
                            <span className="block text-white">Daha Çok Değil,</span>
                            <span className="block mt-2">
                                <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Daha İyi Trade
                                </span>
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            AI destekli risk yönetimi, otomatik trade analizi ve disiplin odaklı yaklaşımla
                            trading performansınızı ölçülebilir şekilde iyileştirin.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/dashboard"
                                className="group px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-105"
                            >
                                Dashboard'a Git
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/trades"
                                className="px-8 py-4 glass hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-300"
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
        <div className="group relative p-6 rounded-2xl glass hover:bg-white/10 transition-all duration-300 card-hover">
            <div className={`absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                {icon}
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{description}</p>
            </div>
        </div>
    )
}

function TrustCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
                <h4 className="font-semibold text-white mb-1">{title}</h4>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    )
}
