'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    FiShoppingBag,
    FiDollarSign,
    FiClock,
    FiChevronRight,
    FiPackage,
    FiList,
    FiPieChart,
    FiSettings,
    FiGrid,
    FiLayers,
    FiRefreshCw,
    FiAlertCircle,
    FiBell
} from 'react-icons/fi'
import { useMenuSettings } from '@/components/MenuThemeProvider'
import type { DashboardStats } from '@/types/orders'

export default function AdminDashboardPage() {
    const { settings } = useMenuSettings()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStats()
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/reports?type=stats')
            if (!response.ok) throw new Error('Failed to fetch stats')
            const data = await response.json()
            setStats(data)
            setError(null)
        } catch (e) {
            console.error('Error fetching stats:', e)
            setError('Erro ao carregar estatísticas')
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

    const quickActions = [
        {
            href: '/admin/orders',
            icon: FiPackage,
            label: 'Gerenciar Pedidos',
            description: 'Visualizar e atualizar status',
            color: 'from-amber-500 to-orange-600',
            badge: stats?.pendingOrders || 0
        },
        {
            href: '/admin/calls',
            icon: FiBell,
            label: 'Chamados',
            description: 'Atender solicitações de mesa',
            color: 'from-red-500 to-rose-600',
            badge: stats?.pendingWaiterCalls || 0
        },
        {
            href: '/admin/dishes',
            icon: FiList,
            label: 'Cardápio (Pratos)',
            description: 'Gerenciar pratos e categorias',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            href: '/admin/reports',
            icon: FiPieChart,
            label: 'Relatórios',
            description: 'Análise de vendas e pedidos',
            color: 'from-emerald-500 to-green-600'
        },
        {
            href: '/admin/design',
            icon: FiSettings,
            label: 'Personalizar Design',
            description: 'Cores, logo e estilo do cardápio',
            color: 'from-purple-500 to-pink-600'
        },
        {
            href: '/admin/tables',
            icon: FiGrid,
            label: 'Mesas',
            description: 'Gerenciar mesas do restaurante',
            color: 'from-cyan-500 to-blue-600'
        },
        {
            href: '/admin/categories',
            icon: FiLayers,
            label: 'Categorias',
            description: 'Organizar categorias do cardápio',
            color: 'from-rose-500 to-red-600'
        }
    ]

    return (
        <div className="space-y-12 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>Dashboard</h1>
                    <p className="mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>Visão geral do restaurante</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--menu-surface, #27272a)', color: settings?.primaryColor || '#f59e0b' }}
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 rounded-xl p-4 flex items-center gap-3">
                    <FiAlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                </div>
            )}

            {/* Stats Cards - Centralized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                    className="rounded-2xl p-6 shadow-sm"
                    style={{
                        backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${settings?.primaryColor}20` }}>
                            <FiShoppingBag className="w-6 h-6" style={{ color: settings?.primaryColor }} />
                        </div>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--menu-text-secondary)' }}>Pedidos Hoje</p>
                    <p className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>
                        {loading ? '...' : stats?.todayOrders || 0}
                    </p>
                </div>

                <div
                    className="rounded-2xl p-6 shadow-sm"
                    style={{
                        backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${settings?.secondaryColor}20` }}>
                            <FiDollarSign className="w-6 h-6" style={{ color: settings?.secondaryColor }} />
                        </div>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--menu-text-secondary)' }}>Faturamento Hoje</p>
                    <p className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>
                        {loading ? '...' : formatPrice(stats?.todayRevenue || 0)}
                    </p>
                </div>

                <div
                    className="rounded-2xl p-6 shadow-sm"
                    style={{
                        backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${settings?.primaryColor}20` }}>
                            <FiClock className="w-6 h-6" style={{ color: settings?.primaryColor }} />
                        </div>
                        {(stats?.pendingOrders || 0) > 0 && (
                            <span
                                className="text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse"
                                style={{ backgroundColor: settings?.primaryColor }}
                            >
                                FILA
                            </span>
                        )}
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--menu-text-secondary)' }}>Pedidos Pendentes</p>
                    <p className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>
                        {loading ? '...' : stats?.pendingOrders || 0}
                    </p>
                </div>

                <div
                    className="rounded-2xl p-6 shadow-sm"
                    style={{
                        backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${settings?.secondaryColor}20` }}>
                            <FiRefreshCw className="w-6 h-6" style={{ color: settings?.secondaryColor }} />
                        </div>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--menu-text-secondary)' }}>Em Preparação</p>
                    <p className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>
                        {loading ? '...' : stats?.preparingOrders || 0}
                    </p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: settings?.textColor || '#ffffff' }}>Acesso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group relative rounded-2xl p-6 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
                            style={{
                                backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                            }}
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            <div className="relative flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="p-3 rounded-xl shadow-lg"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                                        }}
                                    >
                                        <action.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold group-hover:text-amber-400 transition-colors" style={{ color: settings?.textColor || '#ffffff' }}>
                                            {action.label}
                                        </h3>
                                        <p className="text-sm mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>{action.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {action.badge !== undefined && action.badge > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                            {action.badge}
                                        </span>
                                    )}
                                    <FiChevronRight
                                        className="w-5 h-5 transition-all group-hover:translate-x-1"
                                        style={{ color: settings?.textColor || '#52525b', opacity: 0.5 }}
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Top Dishes - Centered */}
            {stats?.topDishes && stats.topDishes.length > 0 && (
                <div className="max-w-3xl mx-auto w-full">
                    <div
                        className="rounded-2xl p-8"
                        style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: settings?.textColor || '#ffffff' }}>🔥 Pratos Mais Pedidos Hoje</h2>
                        <ul className="space-y-4">
                            {stats.topDishes.map((dish, index) => (
                                <li
                                    key={dish.name}
                                    className="flex items-center justify-between p-4 rounded-xl transition-colors hover:opacity-80"
                                    style={{
                                        backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)',
                                        border: `1px solid ${settings?.textColor}20`,
                                        color: settings?.textColor || '#ffffff'
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span
                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                                            style={
                                                index === 0
                                                    ? { backgroundColor: settings?.primaryColor, color: '#ffffff' }
                                                    : index === 1
                                                        ? { backgroundColor: `${settings?.textColor}20`, color: settings?.textColor || '#ffffff' }
                                                        : index === 2
                                                            ? { backgroundColor: settings?.secondaryColor, color: '#ffffff' }
                                                            : { backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))', color: settings?.textColor || '#ffffff' }
                                            }
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-lg" style={{ color: settings?.textColor || '#ffffff' }}>{dish.name}</span>
                                    </div>
                                    <span className="font-medium" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.7 }}>{dish.count} pedidos</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
