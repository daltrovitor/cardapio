'use client'

import { useState, useEffect } from 'react'
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiUsers,
    FiCheck,
    FiX,
    FiRefreshCw,
    FiDownload,
    FiCopy,
    FiAlertTriangle,
    FiDollarSign
} from 'react-icons/fi'
import { FaQrcode } from 'react-icons/fa'
import { useToast } from '@/components/Toast'
import { useMenuSettings } from '@/components/MenuThemeProvider'
import { Table } from '@/types/orders'

export default function AdminTablesPage() {
    const { settings } = useMenuSettings()
    const [tables, setTables] = useState<Table[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingTable, setEditingTable] = useState<Table | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTable, setNewTable] = useState({ number: 0, name: '', seats: 4 })
    const [qrModalTable, setQrModalTable] = useState<Table | null>(null)
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
    const [finalizeConfirmation, setFinalizeConfirmation] = useState<number | null>(null)
    const [tableTotals, setTableTotals] = useState<Record<number, number>>({})
    const [finalizing, setFinalizing] = useState<number | null>(null)
    const { success, error } = useToast()

    useEffect(() => {
        fetchTables()
        fetchTableTotals()

        // Refresh totals every 15 seconds
        const interval = setInterval(fetchTableTotals, 15000)
        return () => clearInterval(interval)
    }, [])

    const fetchTableTotals = async () => {
        try {
            const response = await fetch('/api/orders?status=unpaid')
            if (response.ok) {
                const orders = await response.json()
                const totals: Record<number, number> = {}

                orders.forEach((order: any) => {
                    totals[order.tableNumber] = (totals[order.tableNumber] || 0) + Number(order.total)
                })

                setTableTotals(totals)
            }
        } catch (e) {
            console.error('Error fetching table totals:', e)
        }
    }

    const handleFinalize = (tableNumber: number) => {
        setFinalizeConfirmation(tableNumber)
    }

    const executeFinalize = async () => {
        if (!finalizeConfirmation) return
        const tableNumber = finalizeConfirmation

        setFinalizing(tableNumber)
        try {
            const response = await fetch('/api/tables/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableNumber })
            })

            if (response.ok) {
                success(`Mesa ${tableNumber} finalizada com sucesso!`)
                await fetchTableTotals()
                await fetchTables() // Refresh status if needed
            } else {
                error('Erro ao finalizar mesa')
            }
        } catch (e) {
            console.error('Error finalizing table:', e)
            error('Erro ao finalizar mesa')
        } finally {
            setFinalizing(null)
            setFinalizeConfirmation(null)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const fetchTables = async () => {
        try {
            const response = await fetch('/api/tables')
            if (response.ok) {
                const data = await response.json()
                setTables(data)
            }
        } catch (err) {
            console.error('Error fetching tables:', err)
            error('Não foi possível carregar as mesas')
        } finally {
            setLoading(false)
        }
    }

    const generateQRCodeUrl = (tableNumber: number) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const tableUrl = `${baseUrl}/?table=${tableNumber}`
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tableUrl)}`
    }

    const getTableUrl = (tableNumber: number) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        return `${baseUrl}/?table=${tableNumber}`
    }

    const getNextTableNumber = () => {
        if (tables.length === 0) return 1
        return Math.max(...tables.map(t => t.number)) + 1
    }

    const handleCreateTable = async () => {
        setSaving(true)
        try {
            const tableNumber = newTable.number || getNextTableNumber()
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: tableNumber,
                    name: newTable.name || null,
                    seats: newTable.seats,
                    qrCode: getTableUrl(tableNumber),
                    isActive: true,
                    status: 'available'
                })
            })

            if (response.ok) {
                await fetchTables()
                setIsCreating(false)
                setNewTable({ number: 0, name: '', seats: 4 })
                success('Mesa criada com sucesso!')
            } else {
                error('Erro ao criar mesa')
            }
        } catch (err) {
            console.error('Error creating table:', err)
            error('Erro ao criar mesa')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateTable = async () => {
        if (!editingTable) return
        setSaving(true)
        try {
            const response = await fetch('/api/tables', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTable.id,
                    number: editingTable.number,
                    name: editingTable.name || null,
                    seats: editingTable.seats,
                    isActive: editingTable.isActive,
                    qrCode: getTableUrl(editingTable.number),
                    status: editingTable.status
                })
            })

            if (response.ok) {
                await fetchTables()
                setEditingTable(null)
                success('Mesa atualizada com sucesso!')
            } else {
                error('Erro ao atualizar mesa')
            }
        } catch (err) {
            console.error('Error updating table:', err)
            error('Erro ao atualizar mesa')
        } finally {
            setSaving(false)
        }
    }

    const executeDelete = async () => {
        if (!deleteConfirmation) return

        try {
            const response = await fetch(`/api/tables?id=${deleteConfirmation}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setTables(prev => prev.filter(t => t.id !== deleteConfirmation))
                success('Mesa excluída com sucesso')
            } else {
                error('Erro ao excluir mesa')
            }
        } catch (err) {
            console.error('Error deleting table:', err)
            error('Erro ao excluir mesa')
        } finally {
            setDeleteConfirmation(null)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        success('Link copiado para a área de transferência!')
    }

    const downloadQRCode = (tableNumber: number) => {
        const link = document.createElement('a')
        link.href = generateQRCodeUrl(tableNumber)
        link.download = `mesa-${tableNumber}-qrcode.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        success('Download iniciado')
    }

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'occupied': return 'Ocupada'
            case 'reserved': return 'Reservada'
            default: return 'Livre'
        }
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'occupied': return 'bg-red-500/20 text-red-400'
            case 'reserved': return 'bg-amber-500/20 text-amber-400'
            default: return 'bg-green-500/20 text-green-400'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                    style={{ borderColor: 'var(--menu-primary, #f59e0b)' }}
                ></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>Gerenciar Mesas</h1>
                    <p className="mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>Configure as mesas do seu restaurante</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchTables}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--menu-surface, #27272a)', color: settings?.primaryColor || '#f59e0b' }}
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        Atualizar
                    </button>
                    <button
                        onClick={() => {
                            setNewTable({ number: getNextTableNumber(), name: '', seats: 4 })
                            setIsCreating(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all"
                        style={{
                            background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                        }}
                    >
                        <FiPlus className="w-4 h-4" />
                        Nova Mesa
                    </button>
                </div>
            </div>

            {/* Create Table Form */}
            {isCreating && (
                <div
                    className="rounded-2xl p-6 animate-fade-in"
                    style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                >
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--menu-text)' }}>Nova Mesa</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Número da Mesa
                            </label>
                            <input
                                type="number"
                                value={newTable.number}
                                onChange={(e) => setNewTable(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Nome/Identificação (Opcional)
                            </label>
                            <input
                                type="text"
                                value={newTable.name}
                                onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Mesa VIP, Varanda..."
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Número de Lugares
                            </label>
                            <input
                                type="number"
                                value={newTable.seats}
                                onChange={(e) => setNewTable(prev => ({ ...prev, seats: parseInt(e.target.value) || 4 }))}
                                min={1}
                                max={20}
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleCreateTable}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                            style={{
                                background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                            }}
                        >
                            {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                            Salvar
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Table Form */}
            {editingTable && (
                <div className="rounded-2xl p-6 animate-fade-in" style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--menu-text)' }}>Editar Mesa {editingTable.number}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Número da Mesa
                            </label>
                            <input
                                type="number"
                                value={editingTable.number}
                                onChange={(e) => setEditingTable({ ...editingTable, number: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Nome/Identificação
                            </label>
                            <input
                                type="text"
                                value={editingTable.name || ''}
                                onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                                placeholder="Ex: Mesa VIP..."
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Lugares
                            </label>
                            <input
                                type="number"
                                value={editingTable.seats}
                                onChange={(e) => setEditingTable({ ...editingTable, seats: parseInt(e.target.value) || 4 })}
                                min={1}
                                max={20}
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--menu-text-secondary)' }}>
                                Status da Reserva
                            </label>
                            <select
                                value={editingTable.status || 'available'}
                                onChange={(e) => setEditingTable({ ...editingTable, status: e.target.value as any })}
                                className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-0"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)', outlineColor: settings?.primaryColor || '#f59e0b' }}
                            >
                                <option value="available" style={{ color: 'var(--card-text, #18181b)' }}>Livre</option>
                                <option value="occupied" style={{ color: 'var(--card-text, #18181b)' }}>Ocupada</option>
                                <option value="reserved" style={{ color: 'var(--card-text, #18181b)' }}>Reservada</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleUpdateTable}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                            style={{
                                background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                            }}
                        >
                            {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                            Salvar Alterações
                        </button>
                        <button
                            onClick={() => setEditingTable(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {tables.map(table => (
                    <div
                        key={table.id}
                        className={`rounded-2xl p-6 transition-all relative overflow-hidden ${table.isActive
                            ? 'hover:scale-[1.02]'
                            : 'opacity-50'
                            }`}
                        style={{
                            backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)'
                        }}
                    >
                        {!table.isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
                                <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-sm font-bold">INATIVA</span>
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>{table.number}</div>
                                {table.name && (
                                    <p className="text-sm mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>{table.name}</p>
                                )}
                            </div>

                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(table.status)}`}>
                                {getStatusLabel(table.status)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: settings?.textColor || '#71717a', opacity: 0.7 }}>
                            <FiUsers className="w-4 h-4" style={{ color: settings?.primaryColor || '#f59e0b' }} />
                            <span>{table.seats} lugares</span>
                        </div>

                        {/* Bill Total and Finalize */}
                        {tableTotals[table.number] > 0 && (
                            <div className="mb-6 p-4 rounded-xl shadow-inner" style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))', border: '1px solid var(--menu-border-subtle)' }}>
                                <p className="text-xs mb-1 uppercase tracking-wider font-bold" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>Total a Pagar</p>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>{formatPrice(tableTotals[table.number])}</span>
                                    <button
                                        onClick={() => handleFinalize(table.number)}
                                        disabled={finalizing === table.number}
                                        className="flex items-center gap-2 px-3 py-2 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        style={{ 
                                            background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                                        }}
                                    >
                                        {finalizing === table.number ? (
                                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <FiDollarSign className="w-4 h-4" />
                                        )}
                                        Finalizar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => setQrModalTable(table)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm hover:opacity-80"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))', color: settings?.textColor || '#ffffff' }}
                            >
                                <FaQrcode className="w-4 h-4" />
                                QR Code
                            </button>
                            <button
                                onClick={() => setEditingTable(table)}
                                className="p-2 rounded-lg transition-colors hover:opacity-80"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))', color: settings?.textColor || '#ffffff' }}
                            >
                                <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setDeleteConfirmation(table.id)}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-colors"
                                style={{ backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.05))' }}
                                title="Excluir Mesa"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {
                tables.length === 0 && !isCreating && (
                    <div
                        className="rounded-2xl p-12 text-center"
                        style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <FiUsers
                            className="w-12 h-12 mx-auto mb-4"
                            style={{ color: settings?.primaryColor || '#f59e0b', opacity: 0.4 }}
                        />
                        <p className="mb-4" style={{ color: settings?.textColor || '#71717a' }}>Nenhuma mesa cadastrada</p>
                        <button
                            onClick={() => {
                                setNewTable({ number: 1, name: '', seats: 4 })
                                setIsCreating(true)
                            }}
                            className="px-4 py-2 text-white rounded-lg transition-colors"
                            style={{ backgroundColor: settings?.primaryColor || '#f59e0b' }}
                        >
                            Adicionar Primeira Mesa
                        </button>
                    </div>
                )
            }

            {/* QR Code Modal */}
            {
                qrModalTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setQrModalTable(null)}
                        />
                        <div className="relative rounded-2xl p-8 max-w-md w-full animate-fade-in shadow-2xl overflow-hidden" 
                             style={{ 
                                 backgroundColor: settings?.cardBackgroundColor || '#18181b',
                                 border: '1px solid var(--menu-border-subtle)' 
                             }}>
                            
                            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-5" 
                                 style={{ backgroundColor: settings?.primaryColor || '#f59e0b' }} />
                                 
                            <button
                                onClick={() => setQrModalTable(null)}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                                style={{ color: settings?.textColor || '#ffffff' }}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                            
                            <div className="relative">
                                <h2 className="text-2xl font-bold mb-1" style={{ color: settings?.textColor || '#ffffff' }}>Mesa {qrModalTable.number}</h2>
                                <p className="text-sm opacity-60 mb-6" style={{ color: settings?.textColor || '#ffffff' }}>QR Code para acesso direto</p>
                                
                                <div className="bg-white rounded-2xl p-6 mb-6 shadow-inner ring-8 ring-white/5">
                                    <img
                                        src={generateQRCodeUrl(qrModalTable.number)}
                                        alt={`QR Code Mesa ${qrModalTable.number}`}
                                        className="w-full aspect-square"
                                    />
                                </div>
                                
                                <button
                                    onClick={() => downloadQRCode(qrModalTable.number)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]"
                                    style={{
                                        background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                                    }}
                                >
                                    <FiDownload className="w-5 h-5" />
                                    Baixar QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DELETE CONFIRMATION MODAL */}
            {
                deleteConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setDeleteConfirmation(null)}
                        />
                        <div className="relative rounded-2xl p-8 max-w-sm w-full animate-fade-in shadow-2xl overflow-hidden"
                            style={{ 
                                backgroundColor: settings?.cardBackgroundColor || '#18181b',
                                border: '1px solid rgba(239, 68, 68, 0.2)' 
                            }}>
                            
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/10" />

                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                                    <FiAlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3" style={{ color: settings?.textColor || '#ffffff' }}>Excluir Mesa?</h3>
                                <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--menu-text-secondary)' }}>
                                    Tem certeza que deseja excluir esta mesa? Esta ação não pode ser desfeita e removerá o histórico associado.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setDeleteConfirmation(null)}
                                        className="flex-1 px-4 py-3 font-medium transition-all rounded-xl border border-transparent hover:bg-white/5"
                                        style={{ color: settings?.textColor || '#ffffff', background: 'rgba(255,255,255,0.05)' }}
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={executeDelete}
                                        className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* FINALIZE CONFIRMATION MODAL */}
            {
                finalizeConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setFinalizeConfirmation(null)}
                        />
                        <div className="relative rounded-2xl p-8 max-w-sm w-full animate-fade-in shadow-2xl overflow-hidden"
                            style={{
                                backgroundColor: settings?.cardBackgroundColor || '#18181b',
                                border: '1px solid var(--menu-border-subtle)'
                            }}>
                            {/* Decorative background element */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10"
                                style={{ backgroundColor: settings?.primaryColor || '#f59e0b' }} />

                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform rotate-3"
                                    style={{
                                        background: `linear-gradient(135deg, ${settings?.primaryColor || '#f59e0b'}20, ${settings?.secondaryColor || '#ea580c'}20)`,
                                        border: '1px solid var(--menu-border-subtle)'
                                    }}>
                                    <FiDollarSign className="w-8 h-8" style={{ color: settings?.primaryColor || '#f59e0b' }} />
                                </div>

                                <h3 className="text-2xl font-bold mb-3" style={{ color: settings?.textColor || '#ffffff' }}>
                                    Finalizar Mesa {finalizeConfirmation}
                                </h3>

                                <div className="mb-6 p-4 rounded-xl w-full" style={{ backgroundColor: 'var(--menu-surface)' }}>
                                    <p className="text-sm opacity-60 mb-1" style={{ color: settings?.textColor || '#ffffff' }}>Total em aberto</p>
                                    <div className="text-3xl font-black bg-clip-text text-transparent"
                                        style={{ backgroundImage: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})` }}>
                                        {formatPrice(tableTotals[finalizeConfirmation] || 0)}
                                    </div>
                                </div>

                                <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--menu-text-secondary)' }}>
                                    Deseja confirmar o pagamento? Esta ação irá liberar a mesa e arquivar os pedidos atuais.
                                </p>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setFinalizeConfirmation(null)}
                                        className="flex-1 px-4 py-3 font-medium transition-all rounded-xl border border-transparent hover:bg-white/5"
                                        style={{ color: settings?.textColor || '#ffffff', background: 'rgba(255,255,255,0.05)' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeFinalize}
                                        disabled={finalizing !== null}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold text-white rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                        style={{
                                            background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`
                                        }}
                                    >
                                        {finalizing === finalizeConfirmation ? (
                                            <FiRefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <FiCheck className="w-5 h-5" />
                                                Confirmar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
