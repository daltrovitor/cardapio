'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiUsers, FiArrowRight, FiMapPin } from 'react-icons/fi'
import type { Table } from '@/types/orders'
import { useCart } from '@/contexts/CartContext'

interface TableSelectorProps {
    onSelect?: (table: Table) => void
    redirectTo?: string
    primaryColor?: string
    secondaryColor?: string
}

export function TableSelector({
    onSelect,
    redirectTo = '/menu',
    primaryColor = '#f59e0b',
    secondaryColor = '#ea580c'
}: TableSelectorProps) {
    const router = useRouter()
    const { setTableNumber: setCartTableNumber, setCustomerName: setCartCustomerName } = useCart()
    const [tables, setTables] = useState<Table[]>([])
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [loading, setLoading] = useState(true)
    const [customerName, setCustomerName] = useState('')

    useEffect(() => {
        fetchTables()
    }, [])

    const fetchTables = async () => {
        try {
            const response = await fetch('/api/tables')
            if (response.ok) {
                const data = await response.json()
                setTables(data.filter((t: Table) => t.isActive))
            }
        } catch (error) {
            console.error('Error fetching tables:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleContinue = () => {
        if (selectedTable) {
            // IMPORTANTE: Atualizar o CartContext PRIMEIRO (isso também atualiza localStorage)
            console.log(`[TableSelector] Selecionando mesa ${selectedTable.number}`)
            setCartTableNumber(selectedTable.number)
            setCartCustomerName(customerName)

            if (onSelect) {
                onSelect(selectedTable)
            }

            router.push(redirectTo)
        }
    }

    if (loading) {
        return (
            <div className="py-20 flex items-center justify-center">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                    style={{ borderColor: primaryColor }}
                ></div>
            </div>
        )
    }

    return (
        <div className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg"
                        style={{
                            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                            boxShadow: `0 10px 40px ${primaryColor}30`
                        }}
                    >
                        <FiMapPin className="w-10 h-10 text-white" />
                    </div>
                    <h1
                        className="text-4xl md:text-5xl font-bold mb-4"
                        style={{ color: primaryColor }}
                    >
                        Selecione sua Mesa
                    </h1>
                    <p style={{ color: 'var(--menu-text-muted, #71717a)' }} className="text-lg max-w-md mx-auto">
                        Escolha a mesa onde você está sentado para iniciar seu pedido
                    </p>
                </div>

                {/* Customer Name Input */}
                <div className="mb-8 max-w-md mx-auto">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-muted, #a1a1aa)' }}>
                        Seu nome (opcional)
                    </label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Digite seu nome..."
                        className="w-full px-4 py-3 border rounded-xl placeholder-current/50 focus:outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--menu-surface, rgba(24,24,27,0.5))',
                            borderColor: customerName ? primaryColor : 'var(--menu-border-subtle, #3f3f46)',
                            color: 'var(--menu-text, #fff)',
                            boxShadow: customerName ? `0 0 0 2px ${primaryColor}20` : undefined
                        }}
                    />
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {tables.map((table) => {
                        const isSelected = selectedTable?.id === table.id
                        return (
                            <button
                                key={table.id}
                                onClick={() => setSelectedTable(table)}
                                className="relative group p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105"
                                style={{
                                    borderColor: isSelected ? primaryColor : 'var(--menu-border-subtle, #3f3f46)',
                                    background: isSelected
                                        ? `linear-gradient(to bottom right, ${primaryColor}20, ${secondaryColor}20)`
                                        : 'var(--menu-surface, rgba(24,24,27,0.5))',
                                    boxShadow: isSelected ? `0 10px 40px ${primaryColor}20` : undefined
                                }}
                            >
                                {/* Glow effect for selected */}
                                {isSelected && (
                                    <div
                                        className="absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10"
                                        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                                    ></div>
                                )}

                                <div className="text-center">
                                    <div
                                        className="text-3xl font-bold mb-2 transition-colors"
                                        style={{ color: isSelected ? primaryColor : 'var(--menu-text, #fff)' }}
                                    >
                                        {table.number}
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-sm" style={{ color: 'var(--menu-text-muted, #71717a)' }}>
                                        <FiUsers className="w-4 h-4" />
                                        <span>{table.seats} lugares</span>
                                    </div>
                                </div>

                                {/* Checkmark for selected */}
                                {isSelected && (
                                    <div
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {tables.length === 0 && (
                    <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--menu-surface, rgba(24,24,27,0.5))', border: '1px solid var(--menu-border-subtle)' }}>
                        <FiMapPin className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--menu-text-muted, #52525b)' }} />
                        <p style={{ color: 'var(--menu-text-muted, #71717a)' }}>Nenhuma mesa disponível no momento</p>
                    </div>
                )}

                {/* Continue Button */}
                {tables.length > 0 && (
                    <div className="flex justify-center">
                        <button
                            onClick={handleContinue}
                            disabled={!selectedTable}
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: selectedTable
                                    ? `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                                    : '#27272a',
                                color: selectedTable ? '#ffffff' : '#71717a',
                                boxShadow: selectedTable ? `0 10px 40px ${primaryColor}30` : undefined,
                                transform: selectedTable ? 'scale(1)' : undefined
                            }}
                            onMouseEnter={(e) => {
                                if (selectedTable) {
                                    e.currentTarget.style.transform = 'scale(1.05)'
                                    e.currentTarget.style.boxShadow = `0 15px 50px ${primaryColor}50`
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedTable) {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = `0 10px 40px ${primaryColor}30`
                                }
                            }}
                        >
                            Continuar para o Cardápio
                            <FiArrowRight className={`w-5 h-5 transition-transform ${selectedTable ? 'group-hover:translate-x-1' : ''}`} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
