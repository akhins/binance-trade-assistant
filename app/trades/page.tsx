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
        <div className="min-h-screen p-6">
            <div className="container mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Trade Listesi</h1>
                        <p className="text-gray-400 mt-2">Tüm işlemlerinizi görüntüleyin ve analiz edin</p>
                    </div>

                    <button
                        onClick={syncFromBinance}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                        <TrendingUp className="w-5 h-5" />
                        Binance'ten Senkronize Et
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex gap-2">
                        {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === status
                                        ? 'bg-primary-600 text-white'
                                        : 'glass text-gray-300 hover:bg-white/10'
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
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-white/5">
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
                                            className="hover:bg-white/5 transition-colors"
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
                                                    className="px-3 py-1 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg text-sm font-medium transition-all"
                                                >
                                                    Detay
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
