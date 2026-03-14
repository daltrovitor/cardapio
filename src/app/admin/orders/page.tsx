'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    FiClock,
    FiCheck,
    FiX,
    FiRefreshCw,
    FiFilter,
    FiChevronDown,
    FiPlay,
    FiTruck,
    FiAlertCircle,
    FiMapPin
} from 'react-icons/fi'
import type { Order, OrderStatus } from '@/types/orders'

const statusLabels: Record<OrderStatus, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
}

const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    preparing: 'bg-blue-500/20 text-blue-400',
    ready: 'bg-green-500/20 text-green-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400'
}

const statusBgColors: Record<OrderStatus, string> = {
    pending: '',
    preparing: '',
    ready: '',
    delivered: '',
    cancelled: ''
}

import { useMenuSettings } from '@/components/MenuThemeProvider'
import { playNotificationSound } from '@/utils/sound'
import { useRef } from 'react'

export default function AdminOrdersPage() {
    const { settings } = useMenuSettings()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
    const prevPendingCountRef = useRef(0)

    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch(`/api/orders${filter !== 'all' ? `?status=${filter}` : ''}`)
            if (response.ok) {
                const data = await response.json()
                setOrders(data)
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }, [filter])

    // Play sound on new pending orders
    useEffect(() => {
        const pendingCount = orders.filter(o => o.status === 'pending').length
        if (pendingCount > prevPendingCountRef.current) {
            playNotificationSound()
        }
        prevPendingCountRef.current = pendingCount
    }, [orders])

    useEffect(() => {
        fetchOrders()
        // Auto-refresh every 15 seconds
        const interval = setInterval(fetchOrders, 15000)
        return () => clearInterval(interval)
    }, [fetchOrders])

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        setUpdatingOrders(prev => new Set(prev).add(orderId))
        try {
            const response = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
            })

            if (response.ok) {
                setOrders(prev => prev.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                ))
            }
        } catch (error) {
            console.error('Error updating order:', error)
        } finally {
            setUpdatingOrders(prev => {
                const next = new Set(prev)
                next.delete(orderId)
                return next
            })
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffSecs = Math.floor(diffMs / 1000)
        const diffMins = Math.floor(diffMs / 60000)

        // Se a diferença for negativa (timezone issues), mostra "Agora"
        if (diffMs < 0) return 'Agora'

        // Menos de 10 segundos
        if (diffSecs < 10) return 'Agora mesmo'

        // Menos de 1 minuto - mostrar segundos
        if (diffSecs < 60) return `${diffSecs} seg atrás`

        // 1 minuto
        if (diffMins === 1) return '1 min atrás'

        // Menos de 1 hora
        if (diffMins < 60) return `${diffMins} min atrás`

        // 1 hora
        if (diffMins < 120) return '1 hora atrás'

        // Menos de 24 horas
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} horas atrás`

        // Mais de 24 horas
        return date.toLocaleDateString('pt-BR')
    }

    const getNextStatusAction = (status: OrderStatus): { label: string; nextStatus: OrderStatus; icon: React.ReactNode; color: string } | null => {
        switch (status) {
            case 'pending':
                return { label: 'Iniciar Preparo', nextStatus: 'preparing', icon: <FiPlay />, color: 'bg-blue-600 hover:bg-blue-700' }
            case 'preparing':
                return { label: 'Marcar como Pronto', nextStatus: 'ready', icon: <FiCheck />, color: 'bg-green-600 hover:bg-green-700' }
            case 'ready':
                return { label: 'Marcar como Entregue', nextStatus: 'delivered', icon: <FiTruck />, color: 'bg-emerald-600 hover:bg-emerald-700' }
            default:
                return null
        }
    }

    const filterTabs = [
        { value: 'all', label: 'Todos', count: orders.length },
        { value: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending').length },
        { value: 'preparing', label: 'Preparando', count: orders.filter(o => o.status === 'preparing').length },
        { value: 'ready', label: 'Prontos', count: orders.filter(o => o.status === 'ready').length },
        { value: 'delivered', label: 'Entregues', count: orders.filter(o => o.status === 'delivered').length },
        { value: 'cancelled', label: 'Cancelados', count: orders.filter(o => o.status === 'cancelled').length }
    ]

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter)

    // Count pending orders for alert
    const pendingCount = orders.filter(o => o.status === 'pending').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>Gerenciar Pedidos</h1>
                    <p className="mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>Acompanhe e atualize o status dos pedidos</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--menu-surface, #27272a)', color: settings?.primaryColor || '#f59e0b' }}
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Pending Alert */}
            {pendingCount > 0 && (
                <div className="bg-yellow-500/10 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <FiAlertCircle className="w-6 h-6 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                        {pendingCount} pedido(s) aguardando confirmação!
                    </span>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {filterTabs.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all`}
                        style={filter === tab.value
                            ? { backgroundColor: settings?.primaryColor || '#f59e0b', color: 'var(--menu-primary-contrast, #ffffff)' }
                            : { backgroundColor: 'var(--menu-surface, rgba(24, 24, 27, 0.5))', color: 'var(--menu-text-secondary, #a1a1aa)' }
                        }
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs`} style={{
                                backgroundColor: filter === tab.value ? 'rgba(255, 255, 255, 0.2)' : 'var(--menu-overlay, rgba(255, 255, 255, 0.1))',
                                color: filter === tab.value ? 'var(--menu-primary-contrast, #ffffff)' : 'var(--menu-text, #ffffff)'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                        style={{ borderColor: settings?.primaryColor || '#f59e0b' }}
                    ></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div
                    className="rounded-2xl p-12 text-center"
                    style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                >
                    <FiClock
                        className="w-12 h-12 mx-auto mb-4"
                        style={{ color: settings?.primaryColor || '#f59e0b', opacity: 0.4 }}
                    />
                    <p style={{ color: settings?.textColor || '#71717a' }}>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOrders.map(order => {
                        const isUpdating = updatingOrders.has(order.id)
                        const nextAction = getNextStatusAction(order.status)

                        return (
                            <div
                                key={order.id}
                                className={`rounded-2xl overflow-hidden ${statusBgColors[order.status]} shadow-sm`}
                                style={{
                                    backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                                }}
                            >
                                {/* Order Header */}
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                            <FiMapPin className="w-5 h-5" style={{ color: 'var(--menu-text, #fff)', opacity: 0.6 }} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-bold" style={{ color: 'var(--menu-text, #fff)' }}>Mesa {order.tableNumber}</span>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${statusColors[order.status]}`}>
                                                    {statusLabels[order.status]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm mt-1" style={{ color: 'var(--menu-text, #fff)', opacity: 0.6 }}>
                                                <span>{formatTime(order.createdAt)}</span>
                                                {order.customerName && (
                                                    <span>• {order.customerName}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold" style={{ color: 'var(--menu-primary, #f59e0b)' }}>
                                            {formatPrice(order.total)}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-4">
                                    <ul className="space-y-2">
                                        {order.items?.map(item => (
                                            <li key={item.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--menu-text, #fff)', opacity: 0.8 }}>
                                                        {item.quantity}x
                                                    </span>
                                                    <span style={{ color: 'var(--menu-text, #fff)' }}>{item.dishName}</span>
                                                    {item.notes && (
                                                        <span className="italic opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>({item.notes})</span>
                                                    )}
                                                </div>
                                                <span className="opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>{formatPrice(item.totalPrice)}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {order.notes && (
                                        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                            <p className="text-sm" style={{ color: 'var(--menu-text, #fff)', opacity: 0.8 }}>
                                                <strong className="opacity-100">Observações:</strong> {order.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Order Actions */}
                                {(order.status !== 'delivered' && order.status !== 'cancelled') && (
                                    <div className="p-4 flex flex-wrap gap-3" style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}>
                                        {nextAction && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, nextAction.nextStatus)}
                                                disabled={isUpdating}
                                                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${nextAction.color}`}
                                            >
                                                {isUpdating ? (
                                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    nextAction.icon
                                                )}
                                                {nextAction.label}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                            disabled={isUpdating}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
