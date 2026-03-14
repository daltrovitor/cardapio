'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MenuHeader } from '@/components/MenuHeader'
import { MenuCategoryOrder } from '@/components/MenuCategoryOrder'
import { FloatingCart } from '@/components/FloatingCart'
import { FloatingWaiterButton } from '@/components/FloatingWaiterButton'
import { FiArrowLeft, FiClipboard } from 'react-icons/fi'
import { MenuThemeProvider, useMenuSettings } from '@/components/MenuThemeProvider'

import type { Category, Dish } from '@/types/menu'
import type { Order } from '@/types/orders'

export default function MenuPage() {
    return (
        <MenuContent />
    )
}

function MenuContent() {
    const router = useRouter()
    const { settings, loading: settingsLoading } = useMenuSettings()
    const [tableNumber, setTableNumber] = useState<number | null>(null)
    const [customerName, setCustomerName] = useState<string>('')
    const [categories, setCategories] = useState<Category[]>([])
    const [dishes, setDishes] = useState<Dish[]>([])
    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)

    useEffect(() => {
        const savedTable = localStorage.getItem('tableNumber')
        const savedName = localStorage.getItem('customerName') || ''
        setCustomerName(savedName)

        if (!savedTable) {
            router.push('/')
            return
        }
        setTableNumber(parseInt(savedTable, 10))
        fetchMenuData()
        fetchActiveOrders(parseInt(savedTable, 10))
    }, [router])

    useEffect(() => {
        // Set first category as active initially
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].$id)
        }
    }, [categories])

    const fetchMenuData = async () => {
        try {
            const [categoriesRes, dishesRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/dishes')
            ])

            if (!categoriesRes.ok || !dishesRes.ok) {
                throw new Error('Failed to fetch menu data')
            }

            const categoriesData = await categoriesRes.json()
            const dishesData = await dishesRes.json()

            // Sort categories by order
            categoriesData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

            setCategories(categoriesData)
            setDishes(dishesData)
        } catch (e) {
            console.error('Failed to load menu:', e)
            setError('Não foi possível carregar o cardápio')
        } finally {
            setLoading(false)
        }
    }

    const fetchActiveOrders = async (table: number) => {
        try {
            const response = await fetch(`/api/orders?table=${table}`)
            if (response.ok) {
                const orders = await response.json()
                setActiveOrders(orders.filter((o: Order) =>
                    o.tableNumber === table &&
                    !['delivered', 'cancelled'].includes(o.status)
                ))
            }
        } catch (e) {
            console.error('Failed to fetch orders:', e)
        }
    }

    const handleCheckout = () => {
        router.push('/checkout')
    }

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId)
        const element = document.getElementById(categoryId)
        if (element) {
            const headerOffset = 100 // Adjust this value based on your sticky header height
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }


    // Inside MenuContent component:
    if (loading || settingsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--menu-bg)]">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                    style={{ borderColor: 'var(--menu-primary, #f59e0b)' }}
                ></div>
            </div>
        )
    }

    return (
        <MenuThemeProvider initialSettings={settings}>
            <div
                className="min-h-screen flex flex-col animate-fade-in"
                style={{
                    backgroundColor: 'var(--menu-bg, #09090b)',
                    color: 'var(--menu-text, #ffffff)'
                }}
            >
                {/* Banner Image */}
                {settings?.bannerUrl && (
                    <div className="w-full h-48 md:h-64 relative">
                        <img
                            src={settings.bannerUrl}
                            alt="Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--menu-bg)] to-transparent" />
                    </div>
                )}

                <div className={`${settings?.bannerUrl ? '-mt-20 relative z-10' : ''}`}>
                    <MenuHeader
                        restaurantName={settings?.restaurantName || "Sabores & Aromas"}
                        logoUrl={settings?.logoUrl}
                    />
                </div>

                {/* Table Info Bar */}
                <div className="sticky top-0 z-30 backdrop-blur-lg" style={{ borderBottom: '1px solid var(--menu-border-subtle)', backgroundColor: 'var(--menu-bg, #09090b)' }}>
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Trocar Mesa</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 rounded-full border border-[var(--menu-primary)]/30 bg-[var(--menu-primary)]/10">
                                <span className="font-semibold" style={{ color: 'var(--menu-primary)' }}>
                                    Mesa {tableNumber}
                                </span>
                            </div>

                            {activeOrders.length > 0 && (
                                <button
                                    onClick={() => router.push('/orders')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <FiClipboard className="w-4 h-4" />
                                    <span className="hidden sm:inline">{activeOrders.length} pedido(s) ativo(s)</span>
                                    <span className="sm:hidden">{activeOrders.length}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Categories (Sticky on Desktop) */}
                        <aside className="lg:col-span-1 hidden lg:block">
                            <div className="sticky top-24 space-y-1">
                                <h3 className="font-semibold text-lg mb-4 opacity-80 pl-4">Categorias</h3>
                                {categories.map(category => (
                                    <button
                                        key={category.$id}
                                        onClick={() => scrollToCategory(category.$id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeCategory === category.$id
                                            ? 'font-medium border-l-4'
                                            : 'opacity-70 hover:opacity-100'
                                            }`}
                                        style={activeCategory === category.$id ? {
                                            backgroundColor: 'color-mix(in srgb, var(--menu-primary) 10%, transparent)',
                                            color: 'var(--menu-primary)',
                                            borderLeftColor: 'var(--menu-primary)'
                                        } : {
                                            color: 'var(--menu-text, #fff)'
                                        }}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* Mobile Categories (Horizontal Scroll) */}
                        <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 flex gap-2 scrollbar-hide">
                            {categories.map(category => (
                                <button
                                    key={category.$id}
                                    onClick={() => scrollToCategory(category.$id)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full transition-colors`}
                                    style={activeCategory === category.$id ? {
                                        backgroundColor: 'var(--menu-primary)',
                                        color: 'var(--menu-primary-contrast, #fff)',
                                        borderColor: 'var(--menu-primary)'
                                    } : {
                                        backgroundColor: 'var(--menu-hover-overlay)',
                                        color: 'var(--menu-text, #fff)',
                                        border: '1px solid var(--menu-border-subtle)'
                                    }}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {/* Main Content (Dishes) */}
                        <main className="lg:col-span-3 space-y-12">
                            {error ? (
                                <div className="text-center py-20 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <h2 className="text-xl text-red-400 mb-2">Erro</h2>
                                    <p className="opacity-70">{error}</p>
                                </div>
                            ) : categories.length === 0 && dishes.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="text-6xl mb-6">🍽️</div>
                                    <h2 className="text-2xl font-bold mb-4">
                                        Cardápio em breve!
                                    </h2>
                                    <p className="opacity-60">
                                        Nosso cardápio está sendo preparado.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {categories.map(category => (
                                        <div key={category.$id} id={category.$id} className="scroll-mt-24">
                                            <MenuCategoryOrder
                                                category={category}
                                                dishes={dishes}
                                            />
                                        </div>
                                    ))}
                                </>
                            )}
                        </main>
                    </div>
                </div>

                <FloatingCart
                    onCheckout={handleCheckout}
                    alertMessage="Garçom será notificado ao finalizar!"
                />

                {tableNumber && (
                    <FloatingWaiterButton
                        tableNumber={tableNumber}
                        primaryColor={settings?.primaryColor || '#f59e0b'}
                        customerName={customerName}
                    />
                )}

                <footer className="py-8 mt-auto" style={{ borderTop: '1px solid var(--menu-border-subtle)', backgroundColor: 'var(--menu-bg)', opacity: 0.9 }}>
                    <div className="container mx-auto px-4 text-center opacity-70 text-sm">
                        <p>{settings?.footerText || `© ${new Date().getFullYear()} ${settings?.restaurantName || 'Sabores & Aromas'}. Todos os direitos reservados.`}</p>
                    </div>
                </footer>
            </div>
        </MenuThemeProvider>
    )
}
