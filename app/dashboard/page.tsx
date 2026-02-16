'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DashboardMetrics } from '@/lib/db/schema'

// For demo, using hardcoded userId=1. In production, get from auth.
const USER_ID = 1

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [riskStatus, setRiskStatus] = useState<any>(null)
    const [chartData, setChartData] = useState<any>(null)
    const [chartPeriod, setChartPeriod] = useState<'7d' | '14d' | '30d' | '90d'>('30d')

    useEffect(() => {
        fetchDashboardData()
        fetchRiskStatus()
        fetchChartData()
    }, [chartPeriod])

    async function fetchDashboardData() {
        try {
            const res = await fetch(`/api/analytics/dashboard?userId=${USER_ID}`)
            const data = await res.json()
            setMetrics(data.metrics)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchRiskStatus() {
        try {
            const res = await fetch(`/api/risk/check?userId=${USER_ID}`)
            const data = await res.json()
            setRiskStatus(data)
        } catch (error) {
            console.error('Failed to fetch risk status:', error)
        }
    }

    async function fetchChartData() {
        try {
            const res = await fetch(`/api/analytics/chart?userId=${USER_ID}&period=${chartPeriod}`)
            const data = await res.json()
            setChartData(data)
        } catch (error) {
            console.error('Failed to fetch chart data:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    const hasTrades = (metrics?.totalTrades || 0) > 0

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className="container mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-lg text-gray-400">Trade performansınızın özeti</p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/settings'}
                        className="group px-6 py-3 glass-modern hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/20 border-white/30 hover:border-primary-500/50"
                    >
                        <span className="flex items-center gap-2">
                            Ayarlar
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                    </button>
                </div>

                {/* Risk Status Alert */}
                {riskStatus && !riskStatus.canTrade && (
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-1">Disiplin Modu Aktif</h3>
                            <p className="text-gray-300">{riskStatus.reason}</p>
                        </div>
                    </div>
                )}

                {/* Warning Messages */}
                {riskStatus?.warnings && riskStatus.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <h4 className="font-semibold text-yellow-400">Uyarılar</h4>
                        </div>
                        <ul className="space-y-1">
                            {riskStatus.warnings.map((warning: string, i: number) => (
                                <li key={i} className="text-sm text-gray-300">{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {!hasTrades ? (
                    /* Empty State */
                    <div className="text-center py-20">
                        <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-white mb-2">Henüz Trade Yok</h2>
                        <p className="text-gray-400 mb-6">Binance hesabınızı bağlayarak başlayın</p>
                        <button
                            onClick={() => window.location.href = '/settings'}
                            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all"
                        >
                            Binance'i Bağla
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard
                                title="Toplam PnL"
                                value={`${metrics?.totalPnL.toFixed(2)} USDT`}
                                change={metrics?.totalPnL || 0}
                                icon={<DollarSign className="w-6 h-6" />}
                                gradient={metrics?.totalPnL && metrics.totalPnL >= 0 ? "from-green-500 to-emerald-500" : "from-red-500 to-rose-500"}
                            />

                            <MetricCard
                                title="Win Rate"
                                value={`${metrics?.winRate.toFixed(1)}%`}
                                subtitle={`${metrics?.totalTrades} trade`}
                                icon={<Target className="w-6 h-6" />}
                                gradient="from-blue-500 to-cyan-500"
                            />

                            <MetricCard
                                title="Profit Factor"
                                value={metrics?.profitFactor.toFixed(2) || '0.00'}
                                subtitle="Kazanç/Kayıp oranı"
                                icon={<TrendingUp className="w-6 h-6" />}
                                gradient="from-purple-500 to-pink-500"
                            />

                            <MetricCard
                                title="Expectancy"
                                value={`${metrics?.expectancy.toFixed(2)} USDT`}
                                subtitle="Trade başına ortalama"
                                icon={<Activity className="w-6 h-6" />}
                                gradient="from-orange-500 to-red-500"
                            />
                        </div>

                        {/* Period Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PeriodCard
                                title="Bugün"
                                pnl={metrics?.todayPnL || 0}
                            />
                            <PeriodCard
                                title="Bu Hafta"
                                pnl={metrics?.weekPnL || 0}
                            />
                            <PeriodCard
                                title="Bu Ay"
                                pnl={metrics?.monthPnL || 0}
                            />
                        </div>

                        {/* PnL Chart */}
                        {chartData && chartData.chartData && chartData.chartData.length > 0 && (
                            <div className="glass p-6 rounded-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold text-white">PnL Grafiği</h2>
                                    <div className="flex gap-2">
                                        {(['7d', '14d', '30d', '90d'] as const).map((period) => (
                                            <button
                                                key={period}
                                                onClick={() => setChartPeriod(period)}
                                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                                    chartPeriod === period
                                                        ? 'bg-primary-600 text-white'
                                                        : 'glass text-gray-300 hover:bg-white/10'
                                                }`}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData.chartData}>
                                        <defs>
                                            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                            }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="cumulativePnL"
                                            stroke="#0ea5e9"
                                            strokeWidth={2}
                                            fill="url(#colorPnL)"
                                            name="Kümülatif PnL"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Symbol Performance */}
                        {chartData && chartData.symbolPerformance && chartData.symbolPerformance.length > 0 && (
                            <div className="glass p-6 rounded-xl">
                                <h2 className="text-2xl font-semibold text-white mb-6">Sembol Performansı</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData.symbolPerformance}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="symbol" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                            }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="total_pnl" fill="#0ea5e9" name="Toplam PnL (USDT)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <QuickAction
                                title="Trade Listesi"
                                description="Tüm trade'lerinizi görüntüleyin"
                                href="/trades"
                                icon={<Activity className="w-6 h-6" />}
                            />
                            <QuickAction
                                title="Risk Kuralları"
                                description="Limit ve kurallarınızı yönetin"
                                href="/risk"
                                icon={<AlertTriangle className="w-6 h-6" />}
                            />
                            <QuickAction
                                title="AI Raporları"
                                description="Haftalık analiz ve öneriler"
                                href="/reports"
                                icon={<TrendingUp className="w-6 h-6" />}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function MetricCard({ title, value, change, subtitle, icon, gradient }: {
    title: string
    value: string
    change?: number
    subtitle?: string
    icon: React.ReactNode
    gradient: string
}) {
    return (
        <div className="group relative p-6 md:p-8 rounded-2xl glass-modern hover:bg-white/10 transition-all duration-500 card-hover overflow-hidden">
            {/* Gradient glow effect */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
            
            <div className={`absolute top-4 right-4 w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}>
                {icon}
            </div>

            <div className="relative z-10">
                <p className="text-gray-400 text-sm mb-3 font-medium">{title}</p>
                <p className="text-3xl md:text-4xl font-extrabold text-white mb-2">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
                {change !== undefined && (
                    <div className={`flex items-center gap-2 mt-3 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`p-1.5 rounded-lg ${change >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-semibold">{Math.abs(change).toFixed(2)} USDT</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function PeriodCard({ title, pnl }: { title: string; pnl: number }) {
    const isProfit = pnl >= 0

    return (
        <div className="group p-6 rounded-xl glass-modern hover:bg-white/10 transition-all duration-300 card-hover">
            <p className="text-gray-400 text-sm mb-3 font-medium">{title}</p>
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isProfit ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isProfit ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{pnl.toFixed(2)} USDT
                </p>
            </div>
        </div>
    )
}

function QuickAction({ title, description, href, icon }: {
    title: string
    description: string
    href: string
    icon: React.ReactNode
}) {
    return (
        <a
            href={href}
            className="group relative p-6 rounded-xl glass-modern hover:bg-white/10 transition-all duration-300 card-hover overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
            <div className="flex items-start gap-4 relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600/30 to-purple-600/30 flex items-center justify-center text-primary-400 group-hover:from-primary-500/40 group-hover:to-purple-500/40 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-primary-300 transition-colors">{title}</h3>
                    <p className="text-sm text-gray-400">{description}</p>
                </div>
            </div>
        </a>
    )
}
