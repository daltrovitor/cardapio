'use client'

import { useState, useEffect } from 'react'
import {
    FiSave,
    FiRefreshCw,
    FiImage,
    FiType,
    FiDroplet,
    FiEye,
    FiCheck,
    FiLayout,
    FiPlus
} from 'react-icons/fi'
import type { MenuSettings } from '@/types/orders'
import { ImageUpload } from '@/components/ImageUpload'
import { useToast } from '@/components/Toast'
import { useMenuSettings } from '@/components/MenuThemeProvider'

const fontOptions = [
    { value: 'Inter', label: 'Inter (Moderno)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Outfit', label: 'Outfit' },
    { value: 'Playfair Display', label: 'Playfair Display (Elegante)' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Open Sans', label: 'Open Sans' }
]

const colorPresets = [
    { name: 'Âmbar Clássico', primary: '#f59e0b', secondary: '#ea580c', accent: '#fbbf24', bg: '#09090b', text: '#ffffff', cardBg: '#18181b', cardText: '#ffffff' },
    { name: 'Esmeralda', primary: '#10b981', secondary: '#059669', accent: '#34d399', bg: '#0a0a0a', text: '#ffffff', cardBg: '#18181b', cardText: '#ffffff' },
    { name: 'Oceano', primary: '#0ea5e9', secondary: '#0284c7', accent: '#38bdf8', bg: '#0c0c0c', text: '#ffffff', cardBg: '#18181b', cardText: '#ffffff' },
    { name: 'Rosa Elegante', primary: '#ec4899', secondary: '#db2777', accent: '#f472b6', bg: '#0d0d0d', text: '#ffffff', cardBg: '#18181b', cardText: '#ffffff' },
    { name: 'Roxo Royal', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa', bg: '#0a0a0a', text: '#ffffff', cardBg: '#18181b', cardText: '#ffffff' },
    { name: 'Vermelho Intenso', primary: '#ef4444', secondary: '#dc2626', accent: '#f87171', bg: '#0c0c0c', text: '#ffffff', cardBg: '#18181b', cardText: '#ffffff' },
    { name: 'Dourado Luxo', primary: '#d4af37', secondary: '#b8860b', accent: '#ffd700', bg: '#1a1a1a', text: '#ffffff', cardBg: '#27272a', cardText: '#ffffff' },
    { name: 'Minimalista Claro', primary: '#18181b', secondary: '#27272a', accent: '#f59e0b', bg: '#fafafa', text: '#18181b', cardBg: '#ffffff', cardText: '#18181b' }
]

// Component moved outside to prevent re-creation on render
const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (color: string) => void }) => (
    <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--card-text-secondary)' }}>
            {label}
        </label>
        <div className="flex gap-2">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-mono uppercase focus:outline-none"
                style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text, #ffffff)', border: '1px solid var(--menu-border-subtle, #3f3f46)' }}
                maxLength={7}
            />
        </div>
    </div >
)

export default function AdminDesignPage() {
    const { settings: globalSettings, loading, updateLocalSettings } = useMenuSettings()
    const [settings, setSettings] = useState<MenuSettings | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [fontLoaded, setFontLoaded] = useState(false)
    const { success, error } = useToast()

    useEffect(() => {
        if (globalSettings) {
            setSettings(globalSettings)
        }
    }, [globalSettings])

    // Load font dynamically when settings change
    useEffect(() => {
        if (settings?.fontFamily) {
            loadGoogleFont(settings.fontFamily)
        }
    }, [settings?.fontFamily])

    const loadGoogleFont = (fontName: string) => {
        const existingLink = document.querySelector(`link[data-font="${fontName}"]`)
        if (existingLink) {
            setFontLoaded(true)
            return
        }

        const link = document.createElement('link')
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
        link.rel = 'stylesheet'
        link.setAttribute('data-font', fontName)

        link.onload = () => {
            setFontLoaded(true)
        }

        document.head.appendChild(link)
    }

    const handleSave = async () => {
        if (!settings) return

        setSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        } catch (e) {
            console.error('Error saving settings:', e)
            error('Erro ao salvar configurações')
        } finally {
            setSaving(false)
        }
    }

    const applyPreset = (preset: typeof colorPresets[0]) => {
        if (!settings) return
        const newSettings = {
            ...settings,
            primaryColor: preset.primary,
            secondaryColor: preset.secondary,
            accentColor: preset.accent,
            backgroundColor: preset.bg,
            textColor: preset.text,
            cardBackgroundColor: preset.cardBg,
            cardTextColor: preset.cardText
        }
        setSettings(newSettings)
        updateLocalSettings(newSettings)
    }

    const updateSetting = (key: keyof MenuSettings, value: any) => {
        if (!settings) return
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        updateLocalSettings(newSettings)
    }

    if (loading) return null // Loading handled by layout

    if (!settings) return null

    const getBorderRadius = (size: string) => {
        switch (size) {
            case 'small': return '0.5rem'
            case 'medium': return '0.75rem'
            case 'large': return '1rem'
            case 'full': return '1.5rem'
            default: return '0.75rem'
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: settings?.textColor || '#ffffff' }}>Personalizar Design</h1>
                    <p className="mt-1" style={{ color: settings?.textColor || '#a1a1aa', opacity: 0.6 }}>Customize a aparência do seu cardápio</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all text-white"
                    style={{
                        background: saved
                            ? '#10b981' // emerald-500
                            : `linear-gradient(to right, ${settings.primaryColor || '#f59e0b'}, ${settings.secondaryColor || '#ea580c'})`
                    }}
                >
                    {saving ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : saved ? <FiCheck className="w-5 h-5" /> : <FiSave className="w-5 h-5" />}
                    {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Settings Column */}
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div
                        className="rounded-2xl p-6"
                        style={{ backgroundColor: settings?.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: settings?.cardTextColor || '#ffffffff' }}>
                            <FiType
                                className="w-5 h-5"
                                style={{ color: settings?.primaryColor || '#f59e0b' }}
                            />
                            Informações Básicas
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--card-text-secondary)' }}>
                                    Nome do Restaurante
                                </label>
                                <input
                                    type="text"
                                    value={settings.restaurantName}
                                    onChange={(e) => updateSetting('restaurantName', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                                    style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text, #ffffff)', border: `1px solid ${settings.primaryColor || 'var(--menu-border-subtle, #3f3f46)'}` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ImageUpload
                                    label="Logo"
                                    value={settings.logoUrl}
                                    onChange={(url) => updateSetting('logoUrl', url)}
                                />
                                <ImageUpload
                                    label="Banner (Abaixo do Nome)"
                                    value={settings.bannerUrl}
                                    onChange={(url) => updateSetting('bannerUrl', url)}
                                    aspectRatio="banner"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--card-text-secondary)' }}>
                                    Mensagem de Boas-vindas
                                </label>
                                <textarea
                                    value={settings.welcomeMessage || ''}
                                    onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors resize-none"
                                    style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text, #ffffff)', border: `1px solid ${settings.primaryColor || 'var(--menu-border-subtle, #3f3f46)'}` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Theme Colors - New Section */}
                    <div
                        className="rounded-2xl p-6"
                        style={{ backgroundColor: settings.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: settings.cardTextColor || '#ffffff' }}>
                            <FiDroplet
                                className="w-5 h-5"
                                style={{ color: settings.primaryColor || '#f59e0b' }}
                            />
                            Cores do Tema
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ColorInput label="Fundo da Página" value={settings.backgroundColor} onChange={(v) => updateSetting('backgroundColor', v)} />
                            <ColorInput label="Cor do Texto" value={settings.textColor} onChange={(v) => updateSetting('textColor', v)} />
                            <ColorInput label="Primária (Degradê A)" value={settings.primaryColor} onChange={(v) => updateSetting('primaryColor', v)} />
                            <ColorInput label="Secundária (Degradê B)" value={settings.secondaryColor} onChange={(v) => updateSetting('secondaryColor', v)} />
                        </div>
                    </div>

                    {/* Card Customization */}
                    <div
                        className="rounded-2xl p-6"
                        style={{ backgroundColor: settings.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: settings.cardTextColor || '#ffffff' }}>
                            <FiLayout
                                className="w-5 h-5"
                                style={{ color: settings.primaryColor || '#f59e0b' }}
                            />
                            Estilo dos Cards
                        </h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <ColorInput label="Fundo do Card" value={settings.cardBackgroundColor} onChange={(v) => updateSetting('cardBackgroundColor', v)} />
                                <ColorInput label="Texto do Card" value={settings.cardTextColor} onChange={(v) => updateSetting('cardTextColor', v)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--card-text-secondary)' }}>
                                        Arredondamento
                                    </label>
                                    <select
                                        value={settings.cardBorderRadius}
                                        onChange={(e) => updateSetting('cardBorderRadius', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                                        style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text, #ffffff)', border: `1px solid ${settings.primaryColor || 'var(--menu-border-subtle, #3f3f46)'}` }}
                                    >
                                        <option value="small">Pequeno</option>
                                        <option value="medium">Médio</option>
                                        <option value="large">Grande</option>
                                        <option value="full">Redondo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--card-text-secondary)' }}>
                                        Tamanho
                                    </label>
                                    <select
                                        value={settings.cardSize}
                                        onChange={(e) => updateSetting('cardSize', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                                        style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text, #ffffff)', border: `1px solid ${settings.primaryColor || 'var(--menu-border-subtle, #3f3f46)'}` }}
                                    >
                                        <option value="compact">Compacto</option>
                                        <option value="normal">Normal</option>
                                        <option value="large">Expandido</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Font Settings */}
                    <div
                        className="rounded-2xl p-6"
                        style={{ backgroundColor: settings.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: settings.cardTextColor || '#ffffff' }}>
                            <FiType
                                className="w-5 h-5"
                                style={{ color: settings.primaryColor || '#f59e0b' }}
                            />
                            Tipografia
                        </h2>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--card-text-secondary)' }}>
                                Fonte Principal
                            </label>
                            <select
                                value={settings.fontFamily}
                                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                                style={{ backgroundColor: 'var(--menu-surface)', color: 'var(--menu-text, #ffffff)', border: `1px solid ${settings.primaryColor || 'var(--menu-border-subtle, #3f3f46)'}` }}
                            >
                                {fontOptions.map(font => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Color Presets */}
                    <div
                        className="rounded-2xl p-6"
                        style={{ backgroundColor: settings.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: settings.cardTextColor || '#ffffff' }}>
                            <FiDroplet
                                className="w-5 h-5"
                                style={{ color: settings.primaryColor || '#f59e0b' }}
                            />
                            Temas Prontos
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {colorPresets.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    className="group p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 transition-all"
                                >
                                    <div className="flex gap-1 mb-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                                    </div>
                                    <p className="text-xs transition-colors truncate" style={{ color: 'var(--card-text-secondary)' }}>
                                        {preset.name}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <div
                        className="rounded-2xl p-6"
                        style={{ backgroundColor: settings.cardBackgroundColor || 'rgba(24, 24, 27, 0.5)' }}
                    >
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: settings.cardTextColor || '#ffffff' }}>
                            <FiEye
                                className="w-5 h-5"
                                style={{ color: settings.primaryColor || '#f59e0b' }}
                            />
                            Preview do Cardápio
                        </h2>

                        {/* Mock Preview */}
                        <div
                            className="rounded-xl overflow-hidden relative isolate h-[600px] overflow-y-auto custom-scrollbar"
                            style={{
                                backgroundColor: settings.backgroundColor,
                                fontFamily: settings.fontFamily
                            }}
                        >
                            {/* Header Preview */}
                            <div className="p-6 text-center relative z-10 w-full overflow-hidden">
                                <div className="text-4xl mb-4 flex justify-center">
                                    {settings.logoUrl ? (
                                        <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                                    ) : (
                                        <span>🍽️</span>
                                    )}
                                </div>
                                <h3
                                    className="text-2xl font-bold break-words bg-clip-text text-transparent"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, ${settings.primaryColor}, ${settings.secondaryColor})`
                                    }}
                                >
                                    {settings.restaurantName}
                                </h3>

                                {settings.bannerUrl && (
                                    <div className="mt-4 mb-2 rounded-xl overflow-hidden h-32 w-full">
                                        <img
                                            src={settings.bannerUrl}
                                            alt="Banner"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {settings.welcomeMessage && (
                                    <p className="mt-2 opacity-60" style={{ color: settings.textColor }}>
                                        {settings.welcomeMessage}
                                    </p>
                                )}
                            </div>

                            {/* Menu Item Preview */}
                            <div className="p-4 relative z-10">
                                <h4 className="font-bold text-lg mb-4 opacity-80" style={{ color: settings.textColor }}>Principais</h4>
                                <div className={`grid gap-4 ${settings.cardSize === 'compact' ? 'grid-cols-2' :
                                    settings.cardSize === 'large' ? 'grid-cols-1' :
                                        'grid-cols-1'
                                    }`}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="overflow-hidden transition-transform hover:scale-[1.02]"
                                            style={{
                                                backgroundColor: settings.cardBackgroundColor,
                                                borderRadius: getBorderRadius(settings.cardBorderRadius)
                                            }}
                                        >
                                            {settings.showImages && (
                                                <div
                                                    className={`flex items-center justify-center ${settings.cardSize === 'compact' ? 'h-20' : 'h-28'}`}
                                                    style={{
                                                        backgroundColor: settings.cardBackgroundColor === '#ffffff' ? '#3f3f46' : 'rgba(0,0,0,0.3)',
                                                        borderRadius: `${getBorderRadius(settings.cardBorderRadius)} ${getBorderRadius(settings.cardBorderRadius)} 0 0`
                                                    }}
                                                >
                                                    <FiImage className="w-8 h-8" style={{ color: settings.cardBackgroundColor === '#ffffff' ? '#71717a' : 'rgba(255,255,255,0.3)' }} />
                                                </div>
                                            )}
                                            <div style={{ padding: settings.cardSize === 'compact' ? '0.75rem' : settings.cardSize === 'large' ? '1.25rem' : '1rem' }}>
                                                <h4
                                                    className="font-medium text-sm line-clamp-1"
                                                    style={{ color: settings.cardTextColor }}
                                                >
                                                    Prato Exemplo {i}
                                                </h4>
                                                {settings.showPrices && (
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p
                                                            className="text-sm font-medium"
                                                            style={{ color: settings.cardTextColor, opacity: 0.7 }}
                                                        >
                                                            R$ {29 + i},90
                                                        </p>
                                                        <div
                                                            className="w-7 h-7 flex items-center justify-center rounded-md"
                                                            style={{
                                                                backgroundColor: settings.primaryColor,
                                                                color: 'var(--card-btn-text, #fff)'
                                                            }}
                                                        >
                                                            <FiPlus className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Preview */}
                                <div className="text-center py-8 mt-4">
                                    <p className="text-sm opacity-50" style={{ color: settings.textColor }}>
                                        {settings.footerText || `© ${new Date().getFullYear()} ${settings.restaurantName}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
