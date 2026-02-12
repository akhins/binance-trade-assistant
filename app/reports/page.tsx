'use client'

import { useState, useEffect } from 'react'
import { FileText, TrendingUp, Loader, RefreshCw } from 'lucide-react'

const USER_ID = 1

export default function ReportsPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchReport()
    }, [])

    async function fetchReport() {
        try {
            setLoading(true)
            setError('')
            const res = await fetch(`/api/ai/weekly-report?userId=${USER_ID}`)
            if (res.ok) {
                const data = await res.json()
                setReport(data.report)
            } else {
                setReport(null)
            }
        } catch (err) {
            setError('Rapor yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    async function generateReport() {
        try {
            setGenerating(true)
            setError('')
            const res = await fetch('/api/ai/weekly-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: USER_ID }),
            })
            const data = await res.json()

            if (res.ok) {
                setReport(data.report)
            } else {
                setError(data.error || 'Rapor oluşturulamadı')
            }
        } catch (err) {
            setError('Rapor oluşturulurken hata oluştu')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="min-h-screen p-6">
            <div className="container mx-auto max-w-4xl space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-10 h-10 text-primary-400" />
                        AI Haftalık Rapor
                    </h1>
                    <p className="text-gray-400 mt-2">AI destekli haftalık trade analizi ve öneriler</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="px-6 py-3 glass hover:bg-white/20 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Raporu Yükle
                    </button>
                    <button
                        onClick={generateReport}
                        disabled={generating}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {generating ? <Loader className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                        Yeni Rapor Oluştur
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {loading && !report ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : !report ? (
                    <div className="text-center py-20 glass rounded-xl">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-white mb-2">Henüz Rapor Yok</h2>
                        <p className="text-gray-400 mb-6">AI ile haftalık rapor oluşturmak için butona tıklayın</p>
                        <button
                            onClick={generateReport}
                            disabled={generating}
                            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all"
                        >
                            {generating ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
                        </button>
                    </div>
                ) : (
                    <div className="glass p-8 rounded-xl space-y-6">
                        <div className="prose prose-invert max-w-none">
                            {typeof report === 'string' ? (
                                <pre className="whitespace-pre-wrap text-gray-300">{report}</pre>
                            ) : (
                                <div className="space-y-4 text-gray-300">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(report, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
