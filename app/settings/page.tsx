'use client'

import { useState } from 'react'
import { Key, Database, CheckCircle2, AlertCircle, Loader } from 'lucide-react'

const USER_ID = 1

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('')
    const [apiSecret, setApiSecret] = useState('')
    const [loading, setLoading] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    async function handleConnect() {
        if (!apiKey || !apiSecret) {
            setMessage('Lütfen API Key ve Secret giriniz')
            setConnectionStatus('error')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const res = await fetch('/api/binance/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey,
                    apiSecret,
                    userId: USER_ID,
                    useTestnet: true, // MVP için testnet kullan
                }),
            })

            const data = await res.json()

            if (data.success) {
                setConnectionStatus('success')
                setMessage('Binance bağlantısı başarılı!')
                setApiKey('')
                setApiSecret('')
            } else {
                setConnectionStatus('error')
                setMessage(data.error || 'Bağlantı başarısız')
            }
        } catch (error) {
            setConnectionStatus('error')
            setMessage('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-6">
            <div className="container mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-white">Ayarlar</h1>
                    <p className="text-gray-400 mt-2">Binance bağlantısı ve uygulama ayarları</p>
                </div>

                {/* Binance Connection */}
                <div className="glass p-8 rounded-xl space-y-6">
                    <div className="flex items-center gap-3">
                        <Key className="w-6 h-6 text-primary-400" />
                        <h2 className="text-2xl font-semibold text-white">Binance API Bağlantısı</h2>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${connectionStatus === 'success'
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                            }`}>
                            {connectionStatus === 'success' ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <span>{message}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                API Key
                            </label>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                placeholder="Binance API anahtarınızı girin"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                API Secret
                            </label>
                            <input
                                type="password"
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                placeholder="Binance API secret'ınızı girin"
                            />
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Bağlanıyor...
                                </>
                            ) : (
                                "Binance'e Bağlan"
                            )}
                        </button>
                    </div>

                    {/* Security Info */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Güvenlik Bilgisi
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                            <li>• API anahtarlarınız AES 256-bit encryption ile şifrelenerek saklanır</li>
                            <li>• Şu an Binance Testnet kullanılıyor (gerçek para riski yok)</li>
                            <li>• Sadece "Read" ve "Trade" izinleri yeterlidir, "Withdraw" izni asla verilmemelidir</li>
                            <li>• API anahtarlarınızı hiçbir zaman başkalarıyla paylaşmayın</li>
                        </ul>
                    </div>
                </div>

                {/* Database Info */}
                <div className="glass p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary-400" />
                        Veri Yönetimi
                    </h2>

                    <div className="space-y-3">
                        <button className="w-full px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg font-medium transition-all">
                            Tüm Verileri Export Et (JSON)
                        </button>

                        <button className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg font-medium transition-all">
                            Tüm Verileri Sil
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                        Verileriniz sadece yerel veritabanında saklanır. İstediğiniz zaman export edip silebilirsiniz.
                    </p>
                </div>
            </div>
        </div>
    )
}
