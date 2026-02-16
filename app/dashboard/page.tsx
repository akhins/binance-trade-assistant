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
        <div className="min-h-screen p-6">
            <div className="container mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                        <p className="text-gray-400 mt-2">Trade performansınızın özeti</p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/settings'}
                        className="px-6 py-3 glass hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                        Ayarlar
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
        <div className="relative p-6 rounded-2xl glass hover:bg-white/10 transition-all card-hover">
            <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white opacity-80`}>
                {icon}
            </div>

            <div>
                <p className="text-gray-400 text-sm mb-2">{title}</p>
                <p className="text-3xl font-bold text-white mb-1">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                {change !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-medium">{Math.abs(change).toFixed(2)} USDT</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function PeriodCard({ title, pnl }: { title: string; pnl: number }) {
    const isProfit = pnl >= 0

    return (
        <div className="p-6 rounded-xl glass">
            <p className="text-gray-400 text-sm mb-2">{title}</p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{pnl.toFixed(2)} USDT
            </p>
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
            className="p-6 rounded-xl glass hover:bg-white/10 transition-all card-hover group"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-600/30 transition-all">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-1">{title}</h3>
                    <p className="text-sm text-gray-400">{description}</p>
                </div>
            </div>
        </a>
    )
}
