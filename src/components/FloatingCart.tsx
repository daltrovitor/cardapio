'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FiShoppingCart, FiX, FiPlus, FiMinus, FiTrash2, FiMessageSquare, FiArrowRight, FiInfo } from 'react-icons/fi'
import { useCart } from '@/contexts/CartContext'

interface FloatingCartProps {
    onCheckout?: () => void
    alertMessage?: string
}

export function FloatingCart({ onCheckout, alertMessage }: FloatingCartProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingNotes, setEditingNotes] = useState<string | null>(null)
    const { items, tableNumber, updateQuantity, updateNotes, removeItem, getTotal, getItemCount, clearCart } = useCart()

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const itemCount = getItemCount()
    const total = getTotal()

    if (itemCount === 0 && !isOpen) {
        return null
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-6 py-4 text-white rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 group"
                style={{
                    background: 'linear-gradient(to right, var(--menu-primary, #f59e0b), var(--menu-secondary, #ea580c))',
                    boxShadow: '0 10px 30px -10px var(--menu-primary, #f59e0b)'
                }}
            >
                <div className="relative">
                    <FiShoppingCart className="w-6 h-6" />
                    {itemCount > 0 && (
                        <span
                            className="absolute -top-2 -right-2 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                            style={{ backgroundColor: 'var(--menu-primary-contrast, #fff)', color: 'var(--menu-primary, #18181b)' }}
                        >
                            {itemCount}
                        </span>
                    )}
                </div>
                <div className="text-left">
                    <div className="text-sm font-medium opacity-90">Ver Pedido</div>
                    <div className="text-lg font-bold">{formatPrice(total)}</div>
                </div>
            </button>

            {/* Slide-over Panel */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsOpen(false)}
                />

                {/* Panel */}
                <div
                    className={`absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    style={{ backgroundColor: 'var(--menu-bg, #09090b)' }}
                >
                    {/* Header */}
                    <div
                        className="sticky top-0 z-10 backdrop-blur-lg border-b border-white/5 px-6 py-4"
                        style={{ backgroundColor: 'rgba(var(--menu-bg-rgb), 0.95)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white" style={{ color: 'var(--menu-text, #fff)' }}>Seu Pedido</h2>
                                {tableNumber && (
                                    <p className="text-sm opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Mesa {tableNumber}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--menu-text, #fff)' }}
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto p-6 pb-56">
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <FiShoppingCart className="w-16 h-16 opacity-30 mx-auto mb-4" style={{ color: 'var(--menu-text, #fff)' }} />
                                <p style={{ color: 'var(--menu-text, #fff)', opacity: 0.6 }}>Seu carrinho está vazio</p>
                                <p className="text-sm mt-1" style={{ color: 'var(--menu-text, #fff)', opacity: 0.4 }}>Adicione itens do cardápio</p>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {items.map((item) => (
                                    <li key={item.dishId} className="rounded-xl p-4" style={{ backgroundColor: 'var(--menu-hover-overlay)', border: '1px solid var(--menu-border-subtle)' }}>
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            {item.imageUrl && (
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.dishName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold truncate" style={{ color: 'var(--menu-text, #fff)' }}>{item.dishName}</h3>
                                                    <button
                                                        onClick={() => removeItem(item.dishId)}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                                                        aria-label="Remover item"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <p className="font-medium mt-1" style={{ color: 'var(--menu-primary, #f59e0b)' }}>
                                                    {formatPrice(item.unitPrice * item.quantity)}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                                                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                                                            style={{ color: 'var(--menu-text, #fff)' }}
                                                        >
                                                            <FiMinus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-medium" style={{ color: 'var(--menu-text, #fff)' }}>{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                                                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                                                            style={{ color: 'var(--menu-text, #fff)' }}
                                                        >
                                                            <FiPlus className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => setEditingNotes(editingNotes === item.dishId ? null : item.dishId)}
                                                        className={`p-2 rounded-lg transition-colors`}
                                                        style={{
                                                            color: item.notes ? 'var(--menu-accent, #fbbf24)' : 'var(--menu-text, #fff)',
                                                            backgroundColor: item.notes ? 'rgba(var(--menu-accent-rgb), 0.1)' : 'transparent',
                                                            opacity: item.notes ? 1 : 0.5
                                                        }}
                                                    >
                                                        <FiMessageSquare className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Notes Input */}
                                                {editingNotes === item.dishId && (
                                                    <div className="mt-3">
                                                        <input
                                                            type="text"
                                                            value={item.notes || ''}
                                                            onChange={(e) => updateNotes(item.dishId, e.target.value)}
                                                            placeholder="Ex: Sem cebola, bem passado..."
                                                            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none"
                                                            style={{ color: 'var(--menu-text, #fff)' }}
                                                        />
                                                    </div>
                                                )}

                                                {item.notes && editingNotes !== item.dishId && (
                                                    <p className="text-sm mt-2 italic opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>
                                                        Obs: {item.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-lg border-t border-white/5 p-6" style={{ backgroundColor: 'rgba(var(--menu-bg-rgb), 0.95)' }}>
                            {alertMessage && (
                                <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs" style={{ backgroundColor: 'rgba(var(--menu-accent-rgb), 0.1)', color: 'var(--menu-text, #fff)' }}>
                                    <FiInfo className="w-4 h-4" style={{ color: 'var(--menu-accent, #fbbf24)' }} />
                                    {alertMessage}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <span className="opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Total</span>
                                <span className="text-2xl font-bold" style={{ color: 'var(--menu-text, #fff)' }}>{formatPrice(total)}</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        clearCart()
                                        setIsOpen(false)
                                    }}
                                    className="px-4 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--menu-text, #fff)', opacity: 0.7 }}
                                >
                                    Limpar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        if (onCheckout) onCheckout()
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all shadow-lg"
                                    style={{
                                        background: 'linear-gradient(to right, var(--menu-primary, #f59e0b), var(--menu-secondary, #ea580c))',
                                        color: '#fff',
                                        boxShadow: '0 4px 20px -5px var(--menu-primary, #f59e0b)'
                                    }}
                                >
                                    Finalizar Pedido
                                    <FiArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
