'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { MenuSettings } from '@/types/orders'

interface MenuThemeContextType {
    settings: MenuSettings | null
    loading: boolean
    refreshSettings: () => Promise<void>
    updateLocalSettings: (newSettings: Partial<MenuSettings>) => void
}

const MenuThemeContext = createContext<MenuThemeContextType | undefined>(undefined)

interface MenuThemeProviderProps {
    children: ReactNode
    initialSettings?: MenuSettings | null
}

const SETTINGS_STORAGE_KEY = 'menu-settings-cache'

export function MenuThemeProvider({ children, initialSettings }: MenuThemeProviderProps) {
    // Initialize with initialSettings (server-side) or null.
    // We cannot read localStorage during initialization because it causes Hydration Mismatch.
    const [settings, setSettings] = useState<MenuSettings | null>(initialSettings || null)

    // Mount state to prevent hydration mismatch
    const [mounted, setMounted] = useState(false)

    // Initial load from localStorage
    useEffect(() => {
        setMounted(true)
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(SETTINGS_STORAGE_KEY)
            if (cached) {
                try {
                    setSettings(JSON.parse(cached))
                } catch (e) {
                    console.error('Error parsing settings cache', e)
                }
            }
        }
    }, [])

    const [loading, setLoading] = useState(!settings)

    const fetchSettings = useCallback(async () => {
        try {
            const response = await fetch('/api/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(data)
                // Salva no cache
                if (typeof window !== 'undefined') {
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data))
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    useEffect(() => {
        if (settings?.fontFamily) {
            loadGoogleFont(settings.fontFamily)
        }
    }, [settings?.fontFamily])

    const updateLocalSettings = useCallback((newSettings: Partial<MenuSettings>) => {
        setSettings(prev => {
            const updated = prev ? { ...prev, ...newSettings } : newSettings as MenuSettings
            if (typeof window !== 'undefined') {
                localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
            }
            return updated
        })
    }, [])

    const loadGoogleFont = (fontName: string) => {
        const existingLink = document.querySelector(`link[data-font="${fontName}"]`)
        if (existingLink) return

        const link = document.createElement('link')
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
        link.rel = 'stylesheet'
        link.setAttribute('data-font', fontName)
        document.head.appendChild(link)
    }

    const getBorderRadius = (size: string) => {
        switch (size) {
            case 'small': return '0.5rem'
            case 'medium': return '0.75rem'
            case 'large': return '1rem'
            case 'full': return '1.5rem'
            default: return '0.75rem'
        }
    }

    const getPadding = (size: string) => {
        switch (size) {
            case 'compact': return '0.75rem'
            case 'large': return '1.5rem'
            default: return '1rem'
        }
    }

    const getImageHeight = (size: string) => {
        switch (size) {
            case 'compact': return '80px'
            case 'large': return '128px'
            default: return '112px'
        }
    }

    // Calculate relative luminance to determine contrast color
    const getLuminance = (hex: string) => {
        const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0]
        const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const getContrastColor = (bgHex: string) => {
        return getLuminance(bgHex) > 0.35 ? '#18181b' : '#ffffff'
    }

    const primaryContrast = settings ? getContrastColor(settings.primaryColor) : '#ffffff'
    const bgContrast = settings ? getContrastColor(settings.backgroundColor) : '#ffffff'
    const cardBgContrast = settings ? getContrastColor(settings.cardBackgroundColor || '#ffffff') : '#18181b'
    const bgLuminance = settings ? getLuminance(settings.backgroundColor) : 0
    const cardBgLuminance = settings ? getLuminance(settings.cardBackgroundColor || '#ffffff') : 1

    // Compute a muted text color based on background
    const getMutedText = (textColor: string, bgLum: number) => {
        // If the background is light, use a semi-transparent dark color; if dark, use semi-transparent light
        return bgLum > 0.35
            ? `color-mix(in srgb, ${textColor} 55%, transparent)`
            : `color-mix(in srgb, ${textColor} 55%, transparent)`
    }

    // Determine button bg and text for cards
    const cardBtnBg = settings ? settings.primaryColor : '#18181b'
    const cardBtnText = settings ? getContrastColor(settings.primaryColor) : '#ffffff'

    // Price color: use primary if it contrasts well with cardBg, otherwise use card text
    const getPriceColor = () => {
        if (!settings) return '#666666'
        const primaryLum = getLuminance(settings.primaryColor)
        const cardLum = getLuminance(settings.cardBackgroundColor || '#ffffff')
        const contrast = Math.abs(primaryLum - cardLum)
        // If there's enough contrast between primary and card bg, use primary
        return contrast > 0.15 ? settings.primaryColor : (settings.cardTextColor || '#18181b')
    }

    const themeStyles = settings ? {
        '--menu-primary': settings.primaryColor,
        '--menu-secondary': settings.secondaryColor,
        '--menu-accent': settings.accentColor,
        '--menu-bg': settings.backgroundColor,
        '--menu-text': settings.textColor,
        '--menu-text-secondary': `color-mix(in srgb, ${settings.textColor} 60%, transparent)`,
        '--menu-text-muted': getMutedText(settings.textColor, bgLuminance),
        '--menu-font': settings.fontFamily,
        '--menu-primary-contrast': primaryContrast,
        '--menu-bg-contrast': bgContrast,
        '--card-bg': settings.cardBackgroundColor || '#ffffff',
        '--card-text': settings.cardTextColor || '#18181b',
        '--card-text-secondary': `color-mix(in srgb, ${settings.cardTextColor || '#18181b'} 60%, transparent)`,
        '--card-border': `color-mix(in srgb, ${settings.primaryColor} 25%, transparent)`,
        '--card-radius': getBorderRadius(settings.cardBorderRadius),
        '--card-padding': getPadding(settings.cardSize),
        '--card-image-height': getImageHeight(settings.cardSize),
        '--card-btn-bg': cardBtnBg,
        '--card-btn-text': cardBtnText,
        '--card-price-color': getPriceColor(),
        '--card-bg-contrast': cardBgContrast,
        '--menu-border-subtle': bgLuminance > 0.35 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)',
        '--menu-hover-overlay': bgLuminance > 0.35 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        '--menu-surface': bgLuminance > 0.35 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
        fontFamily: `${settings.fontFamily}, sans-serif`,
        color: settings.textColor,
    } as React.CSSProperties : {}

    return (
        <MenuThemeContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateLocalSettings }}>
            <div style={themeStyles}>
                <style jsx global>{`
                    body {
                        background-color: ${settings?.backgroundColor || '#09090b'} !important;
                        color: ${settings?.textColor || '#ffffff'};
                    }
                    ::selection {
                        background-color: ${settings?.primaryColor || '#f59e0b'};
                        color: #ffffff;
                    }
                `}</style>
                {children}
            </div>
        </MenuThemeContext.Provider>
    )
}

// Hook agora usa o Contexto
export function useMenuSettings() {
    const context = useContext(MenuThemeContext)
    if (context === undefined) {
        throw new Error('useMenuSettings must be used within a MenuThemeProvider')
    }
    return context
}

export default MenuThemeProvider
