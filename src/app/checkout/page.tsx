'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FiArrowLeft, FiCheck, FiClock, FiMessageSquare, FiUser, FiMapPin, FiBell } from 'react-icons/fi'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/components/Toast'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, tableNumber, customerName, setCustomerName, getTotal, clearCart, syncFromLocalStorage } = useCart()
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(false)
    const { success, error } = useToast()

    // Sincronizar do localStorage ao montar o componente
    useEffect(() => {
        syncFromLocalStorage()
    }, [syncFromLocalStorage])

    useEffect(() => {
        if (!tableNumber) {
            router.push('/')
            return
        }
        if (items.length === 0 && !orderSuccess) {
            router.push('/menu')
        }
    }, [tableNumber, items, orderSuccess, router])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const handleSubmitOrder = async () => {
        // Sincronizar novamente antes de enviar para garantir valor correto
        syncFromLocalStorage()

        // Verificar mesa do localStorage como fallback de segurança
        const currentTableNumber = tableNumber || parseInt(localStorage.getItem('tableNumber') || '0', 10)

        if (!currentTableNumber || items.length === 0) {
            error('Erro: Mesa não identificada. Volte e selecione novamente.')
            return
        }

        console.log(`[Checkout] Enviando pedido para Mesa ${currentTableNumber}`)

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNumber: currentTableNumber,
                    customerName: customerName || undefined,
                    notes: notes || undefined,
                    items: items.map(item => ({
                        dishId: item.dishId,
                        dishName: item.dishName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        notes: item.notes
                    }))
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create order')
            }

            const order = await response.json()

            // Save order ID to local storage for persistence
            const existingOrders = JSON.parse(localStorage.getItem('myOrders') || '[]')
            localStorage.setItem('myOrders', JSON.stringify([...existingOrders, order.id]))

            setOrderSuccess(true)
            clearCart()
            success('Pedido enviado e garçom notificado!')
        } catch (e: any) {
            console.error('Error submitting order:', e)
            error(e.message || 'Erro ao enviar pedido. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (orderSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--menu-bg, #09090b)' }}>
                <div className="max-w-md w-full text-center">
                    {/* Success Animation */}
                    <div className="relative mb-8">
                        <div
                            className="w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg animate-bounce"
                            style={{ background: 'linear-gradient(to right, var(--menu-primary), var(--menu-secondary))' }}
                        >
                            <FiCheck className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute inset-0 w-24 h-24 rounded-full mx-auto animate-ping opacity-20" style={{ backgroundColor: 'var(--menu-primary)' }}></div>
                    </div>

                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--menu-text, #fff)' }}>
                        Pedido Recebido!
                    </h1>
                    <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-full w-fit mx-auto" style={{ backgroundColor: 'rgba(var(--menu-accent-rgb), 0.1)', color: 'var(--menu-accent)' }}>
                        <FiBell className="w-5 h-5" />
                        <span className="font-medium">Garçom Notificado</span>
                    </div>

                    <p className="mb-8 opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>
                        Seu pedido foi enviado para a cozinha. Você pode continuar pedindo mais itens a qualquer momento.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/menu')}
                            className="w-full px-6 py-4 text-white font-semibold rounded-xl transition-all shadow-lg hover:brightness-110"
                            style={{ background: 'linear-gradient(to right, var(--menu-primary), var(--menu-secondary))' }}
                        >
                            Voltar ao Cardápio
                        </button>
                        <button
                            onClick={() => router.push('/orders')}
                            className="w-full px-6 py-4 border font-semibold rounded-xl transition-colors hover:bg-white/5"
                            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--menu-text, #fff)' }}
                        >
                            Acompanhar Pedidos
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const total = getTotal()

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--menu-bg, #09090b)' }}>
            {/* Header */}
            <header className="sticky top-0 z-30 backdrop-blur-lg" style={{ backgroundColor: 'var(--menu-bg, #09090b)', borderBottom: '1px solid var(--menu-border-subtle)' }}>
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.push('/menu')}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        style={{ color: 'var(--menu-text, #fff)' }}
                    >
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--menu-text, #fff)' }}>Finalizar Pedido</h1>
                        <p className="text-sm opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Mesa {tableNumber}</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Order Summary */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--menu-text, #fff)' }}>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(var(--menu-primary-rgb), 0.2)', color: 'var(--menu-primary)' }}>1</span>
                        Resumo do Pedido
                    </h2>
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--menu-border-subtle)', backgroundColor: 'var(--menu-surface)' }}>
                        <ul className="divide-y divide-white/10">
                            {items.map(item => (
                                <li key={item.dishId} className="p-4 flex gap-4">
                                    {item.imageUrl && (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.dishName}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium" style={{ color: 'var(--menu-text, #fff)' }}>{item.dishName}</h3>
                                                <p className="text-sm opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Qtd: {item.quantity}</p>
                                                {item.notes && (
                                                    <p className="text-sm italic mt-1 opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Obs: {item.notes}</p>
                                                )}
                                            </div>
                                            <span className="font-medium" style={{ color: 'var(--menu-primary)' }}>
                                                {formatPrice(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--menu-text, #fff)' }}>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(var(--menu-primary-rgb), 0.2)', color: 'var(--menu-primary)' }}>2</span>
                        Identificação (Opcional)
                    </h2>
                    <div className="rounded-2xl p-4" style={{ border: '1px solid var(--menu-border-subtle)', backgroundColor: 'var(--menu-surface)' }}>
                        <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--menu-text, #fff)' }} />
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Seu nome"
                                className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl placeholder-white/30 focus:outline-none focus:border-white/30"
                                style={{ color: 'var(--menu-text, #fff)' }}
                            />
                        </div>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--menu-text, #fff)' }}>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(var(--menu-primary-rgb), 0.2)', color: 'var(--menu-primary)' }}>3</span>
                        Observações Gerais (Opcional)
                    </h2>
                    <div className="rounded-2xl p-4" style={{ border: '1px solid var(--menu-border-subtle)', backgroundColor: 'var(--menu-surface)' }}>
                        <div className="relative">
                            <FiMessageSquare className="absolute left-4 top-4 opacity-50" style={{ color: 'var(--menu-text, #fff)' }} />
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ex: Alergia a frutos do mar, trazer talheres extras..."
                                rows={3}
                                className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                                style={{ color: 'var(--menu-text, #fff)' }}
                            />
                        </div>
                    </div>
                </section>

                {/* Total & Submit */}
                <section className="sticky bottom-0 py-6 -mx-4 px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]" style={{ backgroundColor: 'var(--menu-bg, #09090b)', borderTop: '1px solid var(--menu-border-subtle)' }}>
                    <div className="flex items-center justify-between mb-4 container mx-auto max-w-2xl px-0">
                        <span className="text-lg opacity-60" style={{ color: 'var(--menu-text, #fff)' }}>Total do Pedido</span>
                        <span className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--menu-primary), var(--menu-secondary))' }}>
                            {formatPrice(total)}
                        </span>
                    </div>

                    <button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting || items.length === 0}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white font-semibold text-lg rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed container mx-auto max-w-2xl hover:brightness-110"
                        style={{
                            background: 'linear-gradient(to right, var(--menu-primary), var(--menu-secondary))',
                            boxShadow: '0 4px 20px -5px var(--menu-primary)'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <FiCheck className="w-6 h-6" />
                                Confirmar Pedido
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs mt-3 opacity-50" style={{ color: 'var(--menu-text, #fff)' }}>
                        <FiBell className="inline mr-1" />
                        O garçom será notificado automaticamente ao confirmar.
                    </p>
                </section>
            </main>
        </div>
    )
}
