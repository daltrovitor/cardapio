'use client'

import { useState, useEffect, useRef } from 'react'
import { FiBell, FiCheck, FiClock, FiRefreshCw, FiDollarSign } from 'react-icons/fi'
import { playNotificationSound } from '@/utils/sound'
import { WaiterCall } from '@/types/orders'
import { useToast } from '@/components/Toast'

import { useMenuSettings } from '@/components/MenuThemeProvider'

export default function AdminCallsPage() {
    const { settings } = useMenuSettings()
    const [calls, setCalls] = useState<WaiterCall[]>([])
    const [loading, setLoading] = useState(true)
    const { success, error } = useToast()
    const prevCallCountRef = useRef(0)

    useEffect(() => {
        fetchCalls()
        const interval = setInterval(fetchCalls, 15000)
        return () => clearInterval(interval)
    }, [])

    const fetchCalls = async () => {
        try {
            // Fetch all calls (without filter) to handle pending and acknowledged
            const response = await fetch('/api/waiter-calls')

            if (!response.ok) {
                throw new Error('Failed to fetch calls')
            }

            const data = await response.json()

            if (Array.isArray(data)) {
                // Map snake_case from DB to camelCase and filter out COMPLETED calls
                const activeCalls: WaiterCall[] = data
                    .map((item: any) => ({
                        id: item.id,
                        tableNumber: item.table_number,
                        type: item.type,
                        status: item.status,
                        customerName: item.customer_name,
                        notes: item.notes,
                        createdAt: item.created_at,
                        acknowledgedAt: item.acknowledged_at,
                        completedAt: item.completed_at
                    }))
                    .filter(call => call.status !== 'completed')

                setCalls(activeCalls)
            } else {
                setCalls([])
            }
        } catch (e) {
            console.error('Error fetching waiter calls:', e)
        } finally {
            setLoading(false)
        }
    }

    // Play sound on new calls
    useEffect(() => {
        if (calls.length > prevCallCountRef.current) {
            playNotificationSound()
        }
        prevCallCountRef.current = calls.length
    }, [calls])

    const handleUpdateStatus = async (id: string, newStatus: 'acknowledged' | 'completed', tableNumber: number) => {
        try {
            const response = await fetch('/api/waiter-calls', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })

            if (response.ok) {
                if (newStatus === 'completed') {
                    // Remove from list if completed
                    setCalls(prev => prev.filter(call => call.id !== id))
                    success(`Chamado da Mesa ${tableNumber} finalizado`)
                } else {
                    // Update status in list if acknowledged
                    setCalls(prev => prev.map(call =>
                        call.id === id ? { ...call, status: newStatus } : call
                    ))
                    success(`Chamado da Mesa ${tableNumber} em atendimento`)
                }
            } else {
                throw new Error('Failed to update')
            }
        } catch (e) {
            error('Erro ao atualizar chamado')
        }
    }

    const formatTime = (isoString?: string) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const getCallTypeLabel = (type: string) => {
        switch (type) {
            case 'bill': return 'Conta'
            case 'assistance': return 'Ajuda'
            case 'order_ready': return 'Pedido Pronto'
            default: return 'Geral'
        }
    }

    if (loading && calls.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                    style={{ borderColor: settings?.primaryColor || '#f59e0b' }}
                ></div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: settings?.textColor || '#ffffff' }}>
                        <FiBell className={`w-8 h-8 ${calls.length > 0 ? 'text-red-500 animate-pulse' : ''}`} style={calls.length === 0 ? { color: settings?.textColor || '#ffffff', opacity: 0.7 } : {}} />
                        Chamados de Mesa
                        {calls.length > 0 && (
                            <span className="bg-red-500 text-white text-base font-bold px-3 py-1 rounded-full">
                                {calls.length}
                            </span>
                        )}
                    </h1>
                    <p className="mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>Gerencie as solicitações dos clientes em tempo real</p>
                </div>
                <button
                    onClick={fetchCalls}
                    className="p-3 rounded-xl transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text)' }}
                >
                    <FiRefreshCw className="w-5 h-5" />
                </button>
            </div>

            {calls.length === 0 ? (
                <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto" style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}>
                    <div className="p-6 rounded-full mb-6" style={{ backgroundColor: 'var(--menu-surface)' }}>
                        <FiBell className="w-12 h-12" style={{ color: 'var(--menu-text)' }} />
                    </div>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: settings?.textColor || '#ffffff' }}>Sem chamados pendentes</h2>
                    <p className="text-zinc-500">Tudo tranquilo! Todos os clientes foram atendidos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calls.map((call) => (
                        <div
                            key={call.id}
                            className={`rounded-2xl p-6 transition-all group flex flex-col ${call.status === 'acknowledged'
                                ? 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                                : ''
                                }`}
                            style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="px-4 py-2 rounded-xl flex flex-col items-center"
                                        style={call.status === 'acknowledged' ? {
                                            backgroundColor: `${settings?.primaryColor}1A`,
                                        } : {
                                            backgroundColor: 'var(--menu-surface)', // instead of zinc-800
                                        }}
                                    >
                                        <span
                                            className="text-xs uppercase font-bold tracking-wider"
                                            style={call.status === 'acknowledged' ? { color: settings?.primaryColor } : { color: '#9ca3af' }}
                                        >Mesa</span>
                                        <div className="text-2xl font-bold text-center" style={{ color: settings?.textColor || '#ffffff' }}>{call.tableNumber}</div>
                                    </div>
                                    <div>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-1`}
                                            style={call.type === 'assistance' ? {
                                                backgroundColor: `${settings?.primaryColor}33`,
                                                color: settings?.primaryColor
                                            } : call.type === 'bill' ? {
                                                backgroundColor: 'rgba(34, 197, 94, 0.2)', // green-500/20
                                                color: '#4ade80' // green-400
                                            } : {
                                                backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
                                                color: '#60a5fa' // blue-400
                                            }}
                                        >
                                            {getCallTypeLabel(call.type)}
                                        </span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <FiClock className="w-4 h-4" style={{ color: settings?.primaryColor || '#f59e0b', opacity: 0.8 }} />
                                            <span className="text-sm" style={{ color: settings?.textColor || '#71717a', opacity: 0.6 }}>
                                                {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {call.status !== 'completed' && (
                                    <button
                                        onClick={() => handleUpdateStatus(call.id, 'completed', call.tableNumber)}
                                        className="p-3 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--menu-surface)', color: settings?.primaryColor || '#4ade80' }}
                                        title="Concluir atendimento"
                                    >
                                        <FiCheck className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1">
                                {call.customerName && (
                                    <div className="mb-2">
                                        <p className="text-xs text-zinc-500 uppercase font-bold">Cliente</p>
                                        <p className="font-medium" style={{ color: settings?.textColor || '#ffffff' }}>{call.customerName}</p>
                                    </div>
                                )}
                                {call.notes && (
                                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))' }}>
                                        <p className="italic text-sm" style={{ color: settings?.textColor || '#d4d4d8', opacity: 0.8 }}>"{call.notes}"</p>
                                    </div>
                                )}
                                {call.status === 'acknowledged' && (
                                    <div className="mt-2 mb-4 text-amber-500 text-sm flex items-center gap-2 bg-amber-500/10 px-3 py-2 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                        Em atendimento
                                    </div>
                                )}
                            </div>

                            {call.status === 'pending' ? (
                                <button
                                    onClick={() => handleUpdateStatus(call.id, 'acknowledged', call.tableNumber)}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-all shadow-lg hover:opacity-90"
                                    style={{
                                        backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))',
                                        color: settings?.textColor || '#ffffff',
                                        border: `1px solid ${settings?.primaryColor}40`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = settings?.primaryColor || '#f59e0b'
                                        e.currentTarget.style.color = '#ffffff'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--menu-surface, rgba(0,0,0,0.05))'
                                        e.currentTarget.style.color = settings?.textColor || '#ffffff'
                                    }}
                                >
                                    <FiCheck className="w-5 h-5" />
                                    Aceitar Chamado
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpdateStatus(call.id, 'completed', call.tableNumber)}
                                    className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-all shadow-lg text-white ${call.type === 'bill'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'hover:opacity-90'
                                        }`}
                                    style={call.type !== 'bill' ? {
                                        backgroundColor: settings?.primaryColor || '#f59e0b',
                                        color: '#ffffff'
                                    } : undefined}
                                >
                                    {call.type === 'bill' ? <FiDollarSign className="w-5 h-5" /> : <FiCheck className="w-5 h-5" />}
                                    {call.type === 'bill' ? 'Conta Paga / Finalizar' : 'Finalizar Atendimento'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
