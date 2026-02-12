'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle2, Settings } from 'lucide-react'
import type { RiskRule } from '@/lib/db/schema'

const USER_ID = 1

export default function RiskPage() {
    const [rules, setRules] = useState<RiskRule[]>([])
    const [loading, setLoading] = useState(true)
    const [riskStatus, setRiskStatus] = useState<any>(null)

    useEffect(() => {
        fetchRules()
        checkRiskStatus()
    }, [])

    async function fetchRules() {
        try {
            const res = await fetch(`/api/risk/rules?userId=${USER_ID}`)
            const data = await res.json()
            setRules(data.rules || [])
        } catch (error) {
            console.error('Failed to fetch rules:', error)
        } finally {
            setLoading(false)
        }
    }

    async function checkRiskStatus() {
        try {
            const res = await fetch(`/api/risk/check?userId=${USER_ID}`)
            const data = await res.json()
            setRiskStatus(data)
        } catch (error) {
            console.error('Failed to check risk:', error)
        }
    }

    async function updateRule(ruleId: number, limitValue?: number, isActive?: boolean) {
        try {
            const res = await fetch('/api/risk/rules', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: USER_ID, ruleId, limitValue, isActive }),
            })

            if (res.ok) {
                fetchRules()
                checkRiskStatus()
            }
        } catch (error) {
            console.error('Failed to update rule:', error)
        }
    }

    const getRuleLabel = (ruleType: string | undefined) => {
        if (!ruleType) return 'Bilinmeyen'
        const labels: Record<string, string> = {
            'DAILY_LOSS': 'Günlük Maksimum Kayıp',
            'WEEKLY_LOSS': 'Haftalık Maksimum Kayıp',
            'MAX_TRADES': 'Günlük Maksimum İşlem',
            'CONSECUTIVE_LOSSES': 'Maksimum Ardışık Kayıp',
        }
        return labels[ruleType] || ruleType
    }

    const getRuleUnit = (ruleType: string | undefined) => {
        if (!ruleType) return 'adet'
        return ruleType.includes('LOSS') ? 'USDT' : ruleType === 'MAX_TRADES' ? 'işlem' : 'adet'
    }

    return (
        <div className="min-h-screen p-6">
            <div className="container mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-10 h-10 text-primary-400" />
                        Risk Yönetimi
                    </h1>
                    <p className="text-gray-400 mt-2">Limitler ve kurallarınızı yönetin</p>
                </div>

                {/* Current Status */}
                <div className={`p-6 rounded-xl border ${riskStatus?.canTrade
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    <div className="flex items-start gap-4">
                        {riskStatus?.canTrade ? (
                            <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                            <h2 className={`text-2xl font-bold mb-2 ${riskStatus?.canTrade ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {riskStatus?.canTrade ? 'Trade Açabilirsiniz' : 'Disiplin Modu Aktif'}
                            </h2>
                            <p className="text-gray-300">
                                {riskStatus?.canTrade
                                    ? 'Tüm risk kuralları kontrol edildi, yeni pozisyon açabilirsiniz.'
                                    : riskStatus?.reason
                                }
                            </p>

                            {/* Violations */}
                            {riskStatus?.violations && riskStatus.violations.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {riskStatus.violations.map((v: any, i: number) => (
                                        v.violated && (
                                            <div key={i} className="text-sm text-gray-300 bg-black/20 p-3 rounded">
                                                <span className="font-semibold">{getRuleLabel(v.ruleType)}:</span> {v.description}
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rules List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">Risk Kuralları</h2>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rules.map((rule) => (
                                <div key={rule.id} className="glass p-6 rounded-xl">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {getRuleLabel(rule.rule_type)}
                                                </h3>
                                                <button
                                                    onClick={() => updateRule(rule.id, undefined, !rule.is_active)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${rule.is_active
                                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                                        }`}
                                                >
                                                    {rule.is_active ? 'Aktif' : 'Pasif'}
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="number"
                                                    value={rule.limit_value}
                                                    onChange={(e) => {
                                                        const newValue = parseFloat(e.target.value)
                                                        if (!isNaN(newValue)) {
                                                            updateRule(rule.id, newValue)
                                                        }
                                                    }}
                                                    className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                                <span className="text-gray-400">{getRuleUnit(rule.rule_type)}</span>
                                            </div>
                                        </div>

                                        <Settings className="w-5 h-5 text-gray-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Risk Yönetimi Nasıl Çalışır?
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>• <strong>Günlük/Haftalık Kayıp:</strong> Belirlenen limiti aşarsanız, yeni işlem açmanız engellenir</li>
                        <li>• <strong>Maksimum İşlem:</strong> Gün içinde açabileceğiniz maksimum trade sayısı</li>
                        <li>• <strong>Ardışık Kayıp:</strong> Üst üste belirlenen sayıda kayıp yaşarsanız uyarı alırsınız</li>
                        <li>• <strong>Disiplin Modu:</strong> Kuraldışı durumlarda otomatik olarak aktif olur ve sizi korur</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
