import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getOrders, updateOrderStatus } from '@/services/orders'
import { CreateOrderSchema } from '@/types/orders'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || undefined
        const tableNumber = searchParams.get('tableNumber') ? parseInt(searchParams.get('tableNumber')!) : undefined

        const orders = await getOrders(status, tableNumber)
        return NextResponse.json(orders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const result = CreateOrderSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid order data', details: result.error.errors },
                { status: 400 }
            )
        }

        const order = await createOrder(result.data)
        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Order ID and status are required' },
                { status: 400 }
            )
        }

        await updateOrderStatus(id, status)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        )
    }
}
