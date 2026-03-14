'use client'

import { DishCardOrder } from './DishCardOrder'
import type { Category, Dish } from '@/types/menu'

interface MenuCategoryOrderProps {
    category: Category
    dishes: Dish[]
    showPrices?: boolean
    showImages?: boolean
}

export function MenuCategoryOrder({
    category,
    dishes,
    showPrices = true,
    showImages = true
}: MenuCategoryOrderProps) {
    const categoryDishes = dishes.filter(dish => dish.categoryId === category.$id)

    if (categoryDishes.length === 0) {
        return null
    }

    return (
        <section className="mb-12">
            <div className="mb-6">
                <h2
                    className="text-2xl md:text-3xl font-bold mb-2"
                    style={{ color: 'var(--menu-text, #ffffff)' }}
                >
                    {category.name}
                </h2>
                {category.description && (
                    <p style={{ color: 'var(--menu-text-muted, #a1a1aa)' }}>{category.description}</p>
                )}
                <div
                    className="mt-3 h-1 w-20 rounded-full"
                    style={{
                        background: 'linear-gradient(to right, var(--menu-primary, #f59e0b), var(--menu-secondary, #ea580c))'
                    }}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {categoryDishes.map(dish => (
                    <DishCardOrder
                        key={dish.$id}
                        dish={dish}
                        showPrices={showPrices}
                        showImages={showImages}
                    />
                ))}
            </div>
        </section>
    )
}
