'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Calendar, DollarSign, Target, AlertTriangle, Loader } from 'lucide-react'
import type { Trade, TradeNote } from '@/lib/db/schema'

const USER_ID = 1

export default function TradeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const tradeId = parseInt(params.id as string)

    const [trade, setTrade] = useState<Trade | null>(null)
    const [note, setNote] = useState<TradeNote | null>(null)
    const [aiSummary, setAiSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)

    useEffect(() => {
        fetchTradeDetails()
    }, [tradeId])

    async function fetchTradeDetails() {
        try {
            setLoading(true)
            const res = await fetch(`/api/trades/${tradeId}?userId=${USER_ID}`)
            const data = await res.json()

            if (data.trade) {
                setTrade(data.trade)
                setNote(data.note)
                setAiSummary(data.aiSummary)
            }
        } catch (error) {
            console.error('Failed to fetch trade details:', error)
        } finally {
            setLoading(false)
        }
    }

    async function generateAISummary() {
        try {
            setAnalyzing(true)
            const res = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: USER_ID, tradeId }),
            })

            const data = await res.json()
            if (data.summary) {
                setAiSummary(data.summary)
            }
        } catch (error) {
            console.error('Failed to generate AI summary:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (!trade) {
        return (
            <div className="min-h-screen p-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold text-white mb-2">Trade Bulunamadı</h2>
                        <button
                            onClick={() => router.push('/trades')}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all"
                        >
                            Trade Listesine Dön
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const isProfit = trade.pnl >= 0

    return (
        <div className="min-h-screen p-6">
            <div className="container mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/trades')}
                        className="p-2 glass hover:bg-white/20 rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{trade.symbol}</h1>
                        <p className="text-gray-400 mt-1">
                            {new Date(trade.opened_at).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>

                {/* Trade Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass p-6 rounded-xl">
                        <p className="text-gray-400 text-sm mb-2">Yön</p>
                        <p className={`text-xl font-bold ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.side}
                        </p>
                    </div>
                    <div className="glass p-6 rounded-xl">
                        <p className="text-gray-400 text-sm mb-2">PnL</p>
                        <div className={`flex items-center gap-2 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            <p className="text-xl font-bold">
                                {isProfit ? '+' : ''}{trade.pnl.toFixed(2)} USDT ({trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage.toFixed(2)}%)
                            </p>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-xl">
                        <p className="text-gray-400 text-sm mb-2">Miktar</p>
                        <p className="text-xl font-bold text-white">{trade.quantity.toFixed(4)}</p>
                    </div>
                </div>

                {/* Price Info */}
                <div className="glass p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Fiyat Bilgileri</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Giriş Fiyatı</p>
                            <p className="text-lg font-semibold text-white">${trade.entry_price?.toFixed(2) || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Çıkış Fiyatı</p>
                            <p className="text-lg font-semibold text-white">${trade.exit_price?.toFixed(2) || '-'}</p>
                        </div>
                        {trade.stop_loss && (
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Stop Loss</p>
                                <p className="text-lg font-semibold text-white">${trade.stop_loss.toFixed(2)}</p>
                            </div>
                        )}
                        {trade.take_profit && (
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Take Profit</p>
                                <p className="text-lg font-semibold text-white">${trade.take_profit.toFixed(2)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Summary */}
                <div className="glass p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary-400" />
                            AI Analizi
                        </h2>
                        {!aiSummary && (
                            <button
                                onClick={generateAISummary}
                                disabled={analyzing}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Analiz Ediliyor...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-4 h-4" />
                                        Analiz Et
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {aiSummary ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Giriş Analizi</h3>
                                <p className="text-white">{aiSummary.entry}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Çıkış Analizi</h3>
                                <p className="text-white">{aiSummary.exit}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Sonuç</h3>
                                <p className="text-white">{aiSummary.result}</p>
                            </div>
                            {aiSummary.keyFactors && aiSummary.keyFactors.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Ana Faktörler</h3>
                                    <ul className="space-y-1">
                                        {aiSummary.keyFactors.map((factor: string, i: number) => (
                                            <li key={i} className="text-white flex items-start gap-2">
                                                <span className="text-primary-400 mt-1">•</span>
                                                <span>{factor}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {aiSummary.mistakes && aiSummary.mistakes.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-red-400 mb-2">Hatalar</h3>
                                    <ul className="space-y-1">
                                        {aiSummary.mistakes.map((mistake: string, i: number) => (
                                            <li key={i} className="text-white flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                                                <span>{mistake}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {aiSummary.whatWentWell && aiSummary.whatWentWell.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-green-400 mb-2">İyi Gidenler</h3>
                                    <ul className="space-y-1">
                                        {aiSummary.whatWentWell.map((item: string, i: number) => (
                                            <li key={i} className="text-white flex items-start gap-2">
                                                <TrendingUp className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 mb-4">Bu trade için henüz AI analizi yapılmadı</p>
                            <button
                                onClick={generateAISummary}
                                disabled={analyzing}
                                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                            >
                                {analyzing ? 'Analiz Ediliyor...' : 'AI Analizi Oluştur'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Trade Note */}
                {note && (
                    <div className="glass p-6 rounded-xl">
                        <h2 className="text-xl font-semibold text-white mb-4">Notlar</h2>
                        {note.note && <p className="text-white mb-4">{note.note}</p>}
                        <div className="flex flex-wrap gap-2">
                            {note.setup && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                                    Setup: {note.setup}
                                </span>
                            )}
                            {note.timeframe && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                                    Timeframe: {note.timeframe}
                                </span>
                            )}
                            {note.error_type && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                                    Hata: {note.error_type}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
