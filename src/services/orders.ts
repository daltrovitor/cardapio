import { getServiceSupabase } from '@/lib/supabase'
import type { Table, Order, OrderItem, MenuSettings, DailyReport, CreateOrderInput, DashboardStats } from '@/types/orders'

// ==================== TABLES ====================

export async function getTables(): Promise<Table[]> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('is_active', true)
        .order('number', { ascending: true })

    if (error) throw error

    return data.map(t => ({
        id: t.id,
        number: t.number,
        name: t.name,
        seats: t.seats,
        isActive: t.is_active,
        qrCode: t.qr_code,
        createdAt: t.created_at
    }))
}

export async function getTableByNumber(number: number): Promise<Table | null> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('number', number)
        .eq('is_active', true)
        .single()

    if (error) return null

    return {
        id: data.id,
        number: data.number,
        name: data.name,
        seats: data.seats,
        isActive: data.is_active,
        qrCode: data.qr_code,
        createdAt: data.created_at
    }
}

// ==================== ORDERS ====================

export async function createOrder(input: CreateOrderInput): Promise<Order> {
    const supabase = getServiceSupabase()

    // Calculate total
    const total = input.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    // Get table id if exists
    const table = await getTableByNumber(input.tableNumber)

    if (!table) {
        throw new Error(`Mesa ${input.tableNumber} não encontrada ou inativa.`)
    }

    // Create order
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            table_id: table.id,
            table_number: input.tableNumber,
            status: 'pending',
            total,
            notes: input.notes,
            customer_name: input.customerName,
            estimated_time: 30
        })
        .select()
        .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = input.items.map(item => ({
        order_id: orderData.id,
        dish_id: item.dishId,
        dish_name: item.dishName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        notes: item.notes
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) throw itemsError

    return {
        id: orderData.id,
        tableId: orderData.table_id,
        tableNumber: orderData.table_number,
        status: orderData.status,
        total: orderData.total,
        notes: orderData.notes,
        customerName: orderData.customer_name,
        estimatedTime: orderData.estimated_time,
        completedAt: orderData.completed_at,
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at
    }
}

export async function getOrders(status?: string): Promise<Order[]> {
    const supabase = getServiceSupabase()
    let query = supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .order('created_at', { ascending: false })

    if (status && status !== 'all') {
        if (status === 'unpaid') {
            query = query.eq('paid', false).neq('status', 'cancelled')
        } else {
            query = query.eq('status', status)
        }
    }

    const { data, error } = await query

    if (error) throw error

    return data.map(o => ({
        id: o.id,
        tableId: o.table_id,
        tableNumber: o.table_number,
        status: o.status,
        total: o.total,
        notes: o.notes,
        customerName: o.customer_name,
        estimatedTime: o.estimated_time,
        completedAt: o.completed_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        paid: o.paid,
        items: o.order_items?.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            dishId: item.dish_id,
            dishName: item.dish_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            notes: item.notes,
            createdAt: item.created_at
        }))
    }))
}

export async function getOrderById(id: string): Promise<Order | null> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('id', id)
        .single()

    if (error) return null

    return {
        id: data.id,
        tableId: data.table_id,
        tableNumber: data.table_number,
        status: data.status,
        total: data.total,
        notes: data.notes,
        customerName: data.customer_name,
        estimatedTime: data.estimated_time,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        paid: data.paid,
        items: data.order_items?.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            dishId: item.dish_id,
            dishName: item.dish_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            notes: item.notes,
            createdAt: item.created_at
        }))
    }
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
    const supabase = getServiceSupabase()

    const updateData: any = { status }

    if (status === 'delivered' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)

    if (error) throw error
}

export async function getOrdersByTable(tableNumber: number): Promise<Order[]> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .eq('table_number', tableNumber)
        .eq('paid', false)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(o => ({
        id: o.id,
        tableId: o.table_id,
        tableNumber: o.table_number,
        status: o.status,
        total: o.total,
        notes: o.notes,
        customerName: o.customer_name,
        estimatedTime: o.estimated_time,
        completedAt: o.completed_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        items: o.order_items?.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            dishId: item.dish_id,
            dishName: item.dish_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            notes: item.notes,
            createdAt: item.created_at
        }))
    }))
}

export async function finalizeTable(tableNumber: number): Promise<void> {
    const supabase = getServiceSupabase()

    // Fetch all unpaid orders for this table first
    const { data: unpaidOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('table_number', tableNumber)
        .eq('paid', false)

    if (fetchError) throw fetchError

    if (!unpaidOrders || unpaidOrders.length === 0) return

    const cancelledIds = unpaidOrders.filter(o => o.status === 'cancelled').map(o => o.id)
    const activeIds = unpaidOrders.filter(o => o.status !== 'cancelled').map(o => o.id)

    // Step 1: Mark active orders as paid and delivered
    if (activeIds.length > 0) {
        const { error: activeError } = await supabase
            .from('orders')
            .update({
                paid: true,
                status: 'delivered',
                completed_at: new Date().toISOString()
            })
            .in('id', activeIds)

        if (activeError) throw activeError
    }

    // Step 2: Mark cancelled orders as paid (so they disappear from customer history)
    if (cancelledIds.length > 0) {
        const { error: cancelledError } = await supabase
            .from('orders')
            .update({ paid: true })
            .in('id', cancelledIds)

        if (cancelledError) throw cancelledError
    }
}

// ==================== MENU SETTINGS ====================

export async function getMenuSettings(): Promise<MenuSettings | null> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
        .from('menu_settings')
        .select('*')
        .limit(1)
        .single()

    if (error) return null

    return {
        id: data.id,
        restaurantName: data.restaurant_name,
        logoUrl: data.logo_url,
        bannerUrl: data.banner_url,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        accentColor: data.accent_color,
        backgroundColor: data.background_color,
        textColor: data.text_color,
        fontFamily: data.font_family,
        showPrices: data.show_prices,
        showImages: data.show_images,
        currency: data.currency,
        welcomeMessage: data.welcome_message,
        footerText: data.footer_text,
        cardBackgroundColor: data.card_background_color || '#18181b',
        cardTextColor: data.card_text_color || '#ffffff',
        cardBorderRadius: data.card_border_radius || 'medium',
        cardSize: data.card_size || 'normal',
        createdAt: data.created_at,
        updatedAt: data.updated_at
    }
}

export async function updateMenuSettings(settings: Partial<MenuSettings>): Promise<void> {
    const supabase = getServiceSupabase()

    const updateData: any = {}
    if (settings.restaurantName) updateData.restaurant_name = settings.restaurantName
    if (settings.logoUrl !== undefined) updateData.logo_url = settings.logoUrl
    if (settings.bannerUrl !== undefined) updateData.banner_url = settings.bannerUrl
    if (settings.primaryColor) updateData.primary_color = settings.primaryColor
    if (settings.secondaryColor) updateData.secondary_color = settings.secondaryColor
    if (settings.accentColor) updateData.accent_color = settings.accentColor
    if (settings.backgroundColor) updateData.background_color = settings.backgroundColor
    if (settings.textColor) updateData.text_color = settings.textColor
    if (settings.fontFamily) updateData.font_family = settings.fontFamily
    if (settings.showPrices !== undefined) updateData.show_prices = settings.showPrices
    if (settings.showImages !== undefined) updateData.show_images = settings.showImages
    if (settings.currency) updateData.currency = settings.currency
    if (settings.welcomeMessage !== undefined) updateData.welcome_message = settings.welcomeMessage
    if (settings.footerText !== undefined) updateData.footer_text = settings.footerText
    if (settings.cardBackgroundColor) updateData.card_background_color = settings.cardBackgroundColor
    if (settings.cardTextColor) updateData.card_text_color = settings.cardTextColor
    if (settings.cardBorderRadius) updateData.card_border_radius = settings.cardBorderRadius
    if (settings.cardSize) updateData.card_size = settings.cardSize

    const { error } = await supabase
        .from('menu_settings')
        .update(updateData)
        .eq('id', settings.id)

    if (error) throw error
}

// ==================== REPORTS ====================

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = getServiceSupabase()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's orders
    const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())

    if (ordersError) throw ordersError

    // Get active orders
    const { data: activeOrders, error: activeError } = await supabase
        .from('orders')
        .select('status')
        .in('status', ['pending', 'preparing'])

    if (activeError) throw activeError

    const pendingOrders = activeOrders.filter(o => o.status === 'pending').length
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing').length

    // Get pending waiter calls
    const { count: pendingCalls, error: callsError } = await supabase
        .from('waiter_calls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    if (callsError) throw callsError

    // Calculate today's revenue (only paid orders)
    const todayRevenue = todayOrders
        .filter(o => o.paid === true)
        .reduce((sum, o) => sum + Number(o.total), 0)

    // Get most ordered dishes today
    const { data: todayItems, error: itemsError } = await supabase
        .from('order_items')
        .select('dish_name, quantity')
        .in('order_id', todayOrders.map(o => o.id))

    if (itemsError) throw itemsError

    const dishCounts: Record<string, number> = {}
    todayItems.forEach(item => {
        dishCounts[item.dish_name] = (dishCounts[item.dish_name] || 0) + item.quantity
    })

    const topDishes = Object.entries(dishCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    return {
        todayOrders: todayOrders.filter(o => o.status !== 'cancelled').length,
        todayRevenue,
        pendingOrders,
        preparingOrders,
        averageOrderTime: 25,
        topDishes,
        pendingWaiterCalls: pendingCalls || 0
    }
}

export async function getReportsByDateRange(startDate: string, endDate: string): Promise<DailyReport[]> {
    const supabase = getServiceSupabase()

    // Append end of day to endDate to ensure we include all orders for that day
    const fullEndDate = `${endDate}T23:59:59.999Z`

    // Get orders in date range
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', fullEndDate)
        .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const reportsByDate: Record<string, DailyReport> = {}

    orders.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0]

        if (!reportsByDate[date]) {
            reportsByDate[date] = {
                id: date,
                reportDate: date,
                totalOrders: 0,
                totalRevenue: 0,
                cancelledOrders: 0,
                averageOrderValue: 0,
                createdAt: order.created_at
            }
        }

        if (order.status === 'cancelled') {
            reportsByDate[date].cancelledOrders++
        } else {
            reportsByDate[date].totalOrders++
            if (order.paid) {
                reportsByDate[date].totalRevenue += Number(order.total)
            }
        }
    })

    // Calculate averages
    Object.values(reportsByDate).forEach(report => {
        if (report.totalOrders > 0) {
            report.averageOrderValue = report.totalRevenue / report.totalOrders
        }
    })

    return Object.values(reportsByDate)
}
