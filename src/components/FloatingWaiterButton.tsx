'use client'

import { useState } from 'react'
import { FiBell, FiX, FiCheck } from 'react-icons/fi'
import { useToast } from './Toast'

interface FloatingWaiterButtonProps {
    tableNumber: number
    primaryColor: string
    customerName?: string
}

export function FloatingWaiterButton({ tableNumber, primaryColor, customerName }: FloatingWaiterButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [calling, setCalling] = useState(false)
    const { success, error } = useToast()

    const handleCall = async (type: 'assistance' | 'bill') => {
        setCalling(true)
        try {
            const response = await fetch('/api/waiter-calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNumber,
                    type,
                    customerName
                })
            })

            if (response.ok) {
                success('Garçom chamado com sucesso!')
                setIsOpen(false)
            } else {
                throw new Error('Failed to call')
            }
        } catch (e) {
            error('Erro ao chamar garçom')
        } finally {
            setCalling(false)
        }
    }

    return (
        <>
            {/* Main Button - Left positioned to avoid conflict with Cart */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 left-4 z-50 p-4 rounded-full text-white shadow-lg shadow-black/30 transition-transform duration-200 active:scale-90 flex items-center justify-center transform hover:scale-105"
                style={{ backgroundColor: isOpen ? '#ef4444' : (primaryColor || '#f59e0b') }}
                aria-label="Chamar Garçom"
            >
                {isOpen ? <FiX className="w-6 h-6" /> : <FiBell className="w-6 h-6" />}
            </button>

            {/* Menu Options */}
            {isOpen && (
                <div className="fixed bottom-20 left-4 z-50 flex flex-col gap-3 animate-slide-up origin-bottom-left">
                    <button
                        onClick={() => handleCall('bill')}
                        disabled={calling}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl shadow-xl font-medium transition-colors"
                        style={{ backgroundColor: 'var(--card-bg, #fff)', color: 'var(--card-text, #18181b)', border: '1px solid var(--menu-border-subtle)' }}
                    >
                        <span>💳 Pedir a Conta</span>
                    </button>
                    <button
                        onClick={() => handleCall('assistance')}
                        disabled={calling}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl shadow-xl font-medium transition-colors"
                        style={{ backgroundColor: 'var(--card-bg, #fff)', color: 'var(--card-text, #18181b)', border: '1px solid var(--menu-border-subtle)' }}
                    >
                        <span>🙋 Chamar Ajuda</span>
                    </button>
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translateY(20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </>
    )
}
