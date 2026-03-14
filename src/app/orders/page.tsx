'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiClock, FiCheck, FiX, FiRefreshCw, FiUser } from 'react-icons/fi'
import type { Order, OrderStatus } from '@/types/orders'

const statusLabels: Record<OrderStatus, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
    pending: <FiClock className="w-4 h-4" />,
    preparing: <FiRefreshCw className="w-4 h-4 animate-spin" />,
    ready: <FiCheck className="w-4 h-4" />,
    delivered: <FiCheck className="w-4 h-4" />,
    cancelled: <FiX className="w-4 h-4" />
}

export default function CustomerOrdersPage() {
    const router = useRouter()
    const [tableNumber, setTableNumber] = useState<number | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [myOrderIds, setMyOrderIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedTable = localStorage.getItem('tableNumber')
        const savedMyOrders = JSON.parse(localStorage.getItem('myOrders') || '[]')

        if (!savedTable) {
            router.push('/')
            return
        }

        setTableNumber(parseInt(savedTable, 10))
        setMyOrderIds(savedMyOrders)
        fetchOrders()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchOrders, 30000)
        return () => clearInterval(interval)
    }, [router])

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders')
            if (response.ok) {
                const allOrders = await response.json()
                const savedTable = localStorage.getItem('tableNumber')
                if (savedTable) {
                    // Filter orders for current table AND check if NOT paid
                    const tableOrders = allOrders.filter(
                        (o: Order) => o.tableNumber === parseInt(savedTable, 10) && !o.paid
                    )
                    // Sort: My orders first, then by date desc
                    tableOrders.sort((a: Order, b: Order) => {
                        const myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]')
                        const aIsMine = myOrders.includes(a.id)
                        const bIsMine = myOrders.includes(b.id)
                        if (aIsMine && !bIsMine) return -1
                        if (!aIsMine && bIsMine) return 1
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })

                    setOrders(tableOrders)
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const isToday = date.toDateString() === today.toDateString()

        if (isToday) {
            return `Hoje às ${formatTime(dateString)}`
        }

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            case 'preparing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
        }
    }

    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
    const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

    // Calculate total for active orders (conta da mesa)
    const tableTotal = activeOrders.reduce((sum, order) => sum + order.total, 0)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--menu-bg, #09090b)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--menu-primary, #f59e0b)' }}></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--menu-bg, #09090b)' }}>
            {/* Header */}
            <header className="sticky top-0 z-30 backdrop-blur-lg" style={{ backgroundColor: 'var(--menu-bg, #09090b)', borderBottom: '1px solid var(--menu-border-subtle)' }}>
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/menu')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--menu-text, #fff)' }}
                        >
                            <FiArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: 'var(--menu-text, #fff)' }}>Meus Pedidos</h1>
                            <p className="text-sm opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Mesa {tableNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--menu-text, #fff)', backgroundColor: 'var(--menu-hover-overlay)' }}
                    >
                        <FiRefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Table Bill Summary */}
                {activeOrders.length > 0 && (
                    <section className="mb-8">
                        <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(var(--menu-primary-rgb), 0.2)', background: 'linear-gradient(to right, rgba(var(--menu-primary-rgb), 0.1), rgba(var(--menu-secondary-rgb), 0.1))' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold" style={{ color: 'var(--menu-text, #fff)' }}>Conta da Mesa</h2>
                                <span className="text-sm font-medium" style={{ color: 'var(--menu-accent, #fbbf24)' }}>{activeOrders.length} pedido(s)</span>
                            </div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--menu-primary), var(--menu-secondary))' }}>
                                {formatPrice(tableTotal)}
                            </div>
                            <p className="text-sm mt-2 opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>
                                Total de pedidos ativos na mesa
                            </p>
                        </div>
                    </section>
                )}

                {/* Active Orders */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--menu-text, #fff)' }}>
                        Pedidos Ativos ({activeOrders.length})
                    </h2>

                    {activeOrders.length === 0 ? (
                        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--menu-surface)', border: '1px solid var(--menu-border-subtle)' }}>
                            <p className="opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Nenhum pedido ativo</p>
                            <button
                                onClick={() => router.push('/menu')}
                                className="mt-4 px-4 py-2 text-white rounded-lg transition-colors"
                                style={{ backgroundColor: 'var(--menu-primary, #f59e0b)', color: 'var(--menu-primary-contrast, #fff)' }}
                            >
                                Fazer um Pedido
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {activeOrders.map(order => {
                                const isMyOrder = myOrderIds.includes(order.id)
                                return (
                                    <li key={order.id} className={`rounded-2xl overflow-hidden ${isMyOrder ? 'ring-1 ring-offset-1 ring-offset-transparent' : ''}`} style={{ backgroundColor: 'var(--menu-surface)', border: '1px solid var(--menu-border-subtle)', borderColor: isMyOrder ? 'var(--menu-primary)' : undefined }}>
                                        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--menu-border-subtle)' }}>
                                            <div>
                                                <span className="text-sm opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>{formatDate(order.createdAt)}</span>
                                                {order.customerName && (
                                                    <span className="text-sm ml-2 font-medium" style={{ color: isMyOrder ? 'var(--menu-primary)' : 'var(--menu-text, #fff)' }}>
                                                        • {order.customerName} {isMyOrder && '(Você)'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                                                {statusIcons[order.status]}
                                                {statusLabels[order.status]}
                                            </span>
                                        </div>

                                        <ul className="divide-y divide-white/5">
                                            {order.items?.map(item => (
                                                <li key={item.id} className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium" style={{ color: 'var(--menu-text, #fff)' }}>{item.quantity}x {item.dishName}</span>
                                                        {item.notes && (
                                                            <p className="text-sm italic opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>{item.notes}</p>
                                                        )}
                                                    </div>
                                                    <span className="opacity-80" style={{ color: 'var(--menu-text, #fff)' }}>{formatPrice(item.totalPrice)}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--menu-hover-overlay)' }}>
                                            <span className="opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Total</span>
                                            <span className="text-lg font-bold" style={{ color: 'var(--menu-primary, #f59e0b)' }}>{formatPrice(order.total)}</span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>

                {/* Completed Orders */}
                {completedOrders.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--menu-text, #fff)' }}>
                            Histórico ({completedOrders.length})
                        </h2>
                        <ul className="space-y-4">
                            {completedOrders.slice(0, 5).map(order => (
                                <li key={order.id} className="rounded-2xl p-4 opacity-70 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--menu-surface)', border: '1px solid var(--menu-border-subtle)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>{formatDate(order.createdAt)}</span>
                                            <p className="font-medium" style={{ color: 'var(--menu-text, #fff)' }}>{formatPrice(order.total)}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                                            {statusIcons[order.status]}
                                            {statusLabels[order.status]}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    )
}
