'use client'

import { useState, useEffect } from 'react'
import { Key, Database, CheckCircle2, AlertCircle, Loader, RefreshCw, Brain, Bell } from 'lucide-react'

const USER_ID = 1

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('')
    const [apiSecret, setApiSecret] = useState('')
    const [loading, setLoading] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [autoSync, setAutoSync] = useState({ enabled: false, interval: 15, aiAnalysis: false })
    const [loadingSettings, setLoadingSettings] = useState(true)

    useEffect(() => {
        fetchAutoSyncSettings()
    }, [])

    async function fetchAutoSyncSettings() {
        try {
            const res = await fetch(`/api/binance/auto-sync?userId=${USER_ID}`)
            const data = await res.json()
            if (data) {
                setAutoSync({
                    enabled: data.enabled || false,
                    interval: data.interval || 15,
                    aiAnalysis: data.aiAnalysis || false,
                })
            }
        } catch (error) {
            console.error('Failed to fetch auto-sync settings:', error)
        } finally {
            setLoadingSettings(false)
        }
    }

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
                    // useTestnet parametresini .env ayarına bırakıyoruz (config.binance.network)
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

    async function updateAutoSyncSettings() {
        try {
            const res = await fetch('/api/settings/auto-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: USER_ID,
                    enabled: autoSync.enabled,
                    interval: autoSync.interval,
                    aiAnalysis: autoSync.aiAnalysis,
                }),
            })

            const data = await res.json()
            if (data.success) {
                setMessage('Otomatik senkronizasyon ayarları güncellendi!')
                setConnectionStatus('success')
            }
        } catch (error) {
            console.error('Failed to update auto-sync settings:', error)
        }
    }

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className="container mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Ayarlar
                    </h1>
                    <p className="text-lg text-gray-400">Binance bağlantısı ve uygulama ayarları</p>
                </div>

                {/* Binance Connection */}
                <div className="glass-modern p-8 rounded-2xl space-y-6 border-white/20 shadow-xl">
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
                            className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-[1.02] disabled:hover:scale-100"
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
                            <li>• <strong className="text-yellow-400">GERÇEK BINANCE MAINNET</strong> kullanılıyor - Gerçek para ile işlem yapıyorsunuz!</li>
                            <li>• Sadece "Read" ve "Trade" izinleri yeterlidir, <strong className="text-red-400">"Withdraw" izni ASLA verilmemelidir</strong></li>
                            <li>• API anahtarlarınızı hiçbir zaman başkalarıyla paylaşmayın</li>
                            <li>• IP kısıtlaması eklemeniz şiddetle tavsiye edilir</li>
                            <li>• Bu uygulama sizin adınıza işlem açmaz, sadece analiz yapar</li>
                        </ul>
                    </div>
                </div>

                {/* Auto Sync Settings */}
                <div className="glass-modern p-8 rounded-2xl space-y-6 border-white/20 shadow-xl">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-primary-400" />
                        <h2 className="text-2xl font-semibold text-white">Otomatik Senkronizasyon</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div>
                                <h3 className="font-semibold text-white mb-1">Otomatik Senkronizasyon</h3>
                                <p className="text-sm text-gray-400">Binance'ten otomatik olarak trade'leri çek</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoSync.enabled}
                                    onChange={(e) => {
                                        setAutoSync({ ...autoSync, enabled: e.target.checked })
                                        updateAutoSyncSettings()
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        {autoSync.enabled && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Senkronizasyon Aralığı (dakika)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="60"
                                        value={autoSync.interval}
                                        onChange={(e) => {
                                            const interval = parseInt(e.target.value)
                                            if (interval >= 5 && interval <= 60) {
                                                setAutoSync({ ...autoSync, interval })
                                                updateAutoSyncSettings()
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">5-60 dakika arası</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                    <div>
                                        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-primary-400" />
                                            Otomatik AI Analizi
                                        </h3>
                                        <p className="text-sm text-gray-400">Yeni trade'ler için otomatik AI analizi yap</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoSync.aiAnalysis}
                                            onChange={(e) => {
                                                setAutoSync({ ...autoSync, aiAnalysis: e.target.checked })
                                                updateAutoSyncSettings()
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Database Info */}
                <div className="glass-modern p-6 rounded-2xl border-white/20 shadow-xl">
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
