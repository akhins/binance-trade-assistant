'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, TrendingUp, TrendingDown, FileText, Calendar } from 'lucide-react'
import type { Trade } from '@/lib/db/schema'

const USER_ID = 1

export default function TradesPage() {
    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('CLOSED')

    useEffect(() => {
        fetchTrades()
    }, [filterStatus])

    async function fetchTrades() {
        try {
            setLoading(true)
            const statusParam = filterStatus === 'ALL' ? '' : `&status=${filterStatus}`
            const res = await fetch(`/api/trades?userId=${USER_ID}${statusParam}`)
            const data = await res.json()
            setTrades(data.trades || [])
        } catch (error) {
            console.error('Failed to fetch trades:', error)
        } finally {
            setLoading(false)
        }
    }

    async function syncFromBinance() {
        try {
            const res = await fetch('/api/binance/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: USER_ID }),
            })
            const data = await res.json()

            if (data.success) {
                alert(`Senkronize edildi: ${data.synced} yeni trade`)
                fetchTrades()
            } else {
                alert('Hata: ' + data.error)
            }
        } catch (error) {
            console.error('Sync failed:', error)
            alert('Senkronizasyon başarısız')
        }
    }

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className="container mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Trade Listesi
                        </h1>
                        <p className="text-lg text-gray-400">Tüm işlemlerinizi görüntüleyin ve analiz edin</p>
                    </div>

                    <button
                        onClick={syncFromBinance}
                        className="group px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-105"
                    >
                        <TrendingUp className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Binance'ten Senkronize Et
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex gap-2">
                        {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                                    filterStatus === status
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/50'
                                        : 'glass-modern text-gray-300 hover:bg-white/10 hover:text-white border-white/20'
                                }`}
                            >
                                {status === 'ALL' ? 'Tümü' : status === 'OPEN' ? 'Açık' : 'Kapalı'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trades Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : trades.length === 0 ? (
                    <div className="text-center py-20 glass rounded-xl">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-white mb-2">Henüz Trade Yok</h2>
                        <p className="text-gray-400">Binance'ten senkronize etmeyi deneyin</p>
                    </div>
                ) : (
                    <div className="glass-modern rounded-xl overflow-hidden border-white/20 shadow-xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-white/10 to-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Tarih
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Sembol
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Yön
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Giriş
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Çıkış
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Miktar
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            PnL
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            %
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            İşlem
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {trades.map((trade) => (
                                        <tr
                                            key={trade.id}
                                            className="hover:bg-white/10 transition-all duration-300 border-b border-white/5 last:border-0 group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(trade.opened_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-white">{trade.symbol}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'BUY'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {trade.side}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                                ${trade.entry_price?.toFixed(2) || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                                ${trade.exit_price?.toFixed(2) || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                                {trade.quantity.toFixed(4)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className={`flex items-center justify-end gap-1 ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {trade.pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                    <span className="font-medium">${Math.abs(trade.pnl).toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${trade.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <a
                                                    href={`/trades/${trade.id}`}
                                                    className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-primary-600/20 to-primary-700/20 hover:from-primary-600/30 hover:to-primary-700/30 text-primary-400 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary-500/30"
                                                >
                                                    Detay
                                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
