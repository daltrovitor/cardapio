'use client'

import { useState, useEffect, use } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DishSchema, type CreateDishInput, type Category } from '@/types/menu'
import { useAuth } from '@/contexts/AuthContext'
import { useMenuSettings } from '@/components/MenuThemeProvider'

import { FiSave, FiArrowLeft } from 'react-icons/fi'
import { FaUpload, FaSpinner } from 'react-icons/fa'
import Image from 'next/image'


export default function EditDishPage({ params }: { params: Promise<{ id: string }> }) {
    const { settings } = useMenuSettings()
    const { id } = use(params)
    const router = useRouter()
    const { user, loading } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm<CreateDishInput>({
        resolver: zodResolver(DishSchema)
    })

    useEffect(() => {
        const loadData = async () => {
            try {
                const [categoriesRes, dishRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch(`/api/dishes/${id}`)
                ])

                const categoriesData = await categoriesRes.json()
                const dishData = await dishRes.json()

                if (dishData.error) throw new Error(dishData.error)

                // Fix: Handle both array and object response for categories
                const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || [])
                setCategories(categoriesList)

                const dish = dishData.dish
                setValue('name', dish.name)
                setValue('description', dish.description || '')
                setValue('price', dish.price)
                setValue('categoryId', dish.categoryId)
                setValue('available', dish.available)

                if (dish.imageId) {
                    setCurrentImageUrl(dish.imageId)
                }
            } catch (error) {
                console.error(error)
                router.push('/admin/dishes')
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [id, router, setValue])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const url = URL.createObjectURL(file)
            setImagePreview(url)
        }
    }

    const onSubmit = async (data: CreateDishInput) => {
        if (!user) return
        setIsSubmitting(true)

        try {
            let imageUrl = currentImageUrl

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('dish-images')
                    .upload(filePath, imageFile)

                if (uploadError) throw new Error('Failed to upload image')

                const { data: { publicUrl } } = supabase.storage
                    .from('dish-images')
                    .getPublicUrl(filePath)

                imageUrl = publicUrl
            }

            const res = await fetch(`/api/dishes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    imageId: imageUrl
                })
            })

            if (!res.ok) throw new Error('Failed to update dish')

            router.push('/admin/dishes')
        } catch (error) {
            console.error(error)
            alert('Failed to update dish')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner
                    className="w-8 h-8 animate-spin"
                    style={{ color: settings?.primaryColor || '#f59e0b' }}
                />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <Link
                    href="/admin/dishes"
                    className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--menu-text, #fff)', opacity: 0.6 }}
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Voltar
                </Link>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--menu-text, #fff)' }}>Editar Prato</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
                <div className="card space-y-6 rounded-2xl p-6 border border-gray-700" style={{ backgroundColor: settings?.cardBackgroundColor || 'transparent' }}>
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: settings?.textColor || '#ffffff', opacity: 0.8 }}>
                            Imagem do Prato
                        </label>
                        <div className="flex items-start gap-4">
                            <div className="w-32 h-32 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--menu-hover-overlay, rgba(255,255,255,0.05))' }}>
                                {imagePreview || currentImageUrl ? (
                                    <img
                                        src={imagePreview || currentImageUrl!}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">🍽️</span>
                                )}
                            </div>
                            <label className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--menu-hover-overlay, rgba(0,0,0,0.05))', border: `1px solid ${settings?.textColor}20` }}>
                                <div className="flex flex-col items-center gap-2" style={{ color: settings?.textColor || '#ffffff', opacity: 0.6 }}>
                                    <FaUpload className="w-8 h-8" />
                                    <span className="text-sm">Clique para alterar</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: settings?.textColor || '#ffffff', opacity: 0.8 }}>
                            Nome *
                        </label>
                        <input
                            type="text"
                            {...register('name')}
                            className="w-full rounded-lg p-3 transition-colors focus:outline-none focus:ring-0"
                            style={{
                                backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))',
                                color: settings?.textColor || '#ffffff',
                                border: `1px solid ${settings?.textColor}30`,
                                outlineColor: settings?.primaryColor || '#f59e0b'
                            }}
                            placeholder="Ex: Filé Mignon ao Molho Madeira"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: settings?.textColor || '#ffffff', opacity: 0.8 }}>
                            Descrição *
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full rounded-lg p-3 transition-colors focus:outline-none focus:ring-0"
                            style={{
                                backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))',
                                color: settings?.textColor || '#ffffff',
                                border: `1px solid ${settings?.textColor}30`,
                                outlineColor: settings?.primaryColor || '#f59e0b'
                            }}
                            placeholder="Descreva os ingredientes e preparo do prato"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Price and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: settings?.textColor || '#ffffff', opacity: 0.8 }}>
                                Preço (R$) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('price')}
                                className="w-full rounded-lg p-3 transition-colors focus:outline-none focus:ring-0"
                                style={{
                                    backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))',
                                    color: settings?.textColor || '#ffffff',
                                    border: `1px solid ${settings?.textColor}30`,
                                    outlineColor: settings?.primaryColor || '#f59e0b'
                                }}
                                placeholder="0,00"
                            />
                            {errors.price && (
                                <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: settings?.textColor || '#ffffff', opacity: 0.8 }}>
                                Categoria *
                            </label>
                            <select
                                {...register('categoryId')}
                                className="w-full rounded-lg p-3 transition-colors focus:outline-none focus:ring-0"
                                style={{
                                    backgroundColor: 'var(--menu-surface, rgba(0,0,0,0.03))',
                                    color: settings?.textColor || '#ffffff',
                                    border: `1px solid ${settings?.textColor}30`,
                                    outlineColor: settings?.primaryColor || '#f59e0b'
                                }}
                            >
                                <option value="" style={{ color: 'var(--card-text, #18181b)' }}>Selecione...</option>
                                {categories.map(category => (
                                    <option key={category.$id} value={category.$id} style={{ color: 'var(--card-text, #18181b)' }}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.categoryId && (
                                <p className="mt-1 text-sm text-red-400">{errors.categoryId.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Available */}
                    <div className="flex items-center gap-3">
                        <label className="relative flex cursor-pointer items-center rounded-full p-2" htmlFor="available">
                            <input
                                type="checkbox"
                                {...register('available')}
                                id="available"
                                className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:opacity-0 before:transition-opacity focus:outline-none focus:ring-0"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: `2px solid ${settings?.primaryColor || '#f59e0b'}`,
                                }}
                            />
                            <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100 flex items-center justify-center w-full h-full rounded-md" style={{ backgroundColor: settings?.primaryColor }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                        </label>
                        <label htmlFor="available" style={{ color: settings?.textColor || '#ffffff', opacity: 0.8 }} className="cursor-pointer">
                            Prato disponível
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Link href="/admin" className="btn btn-secondary">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: `linear-gradient(to right, ${settings?.primaryColor || '#f59e0b'}, ${settings?.secondaryColor || '#ea580c'})`,
                                color: '#fff'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="w-5 h-5 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5" />
                                    Atualizar Prato
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
