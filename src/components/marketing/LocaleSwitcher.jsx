import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useLanguage } from '../../contexts/LanguageContext.jsx'

const LANGUAGE_OPTIONS = Object.freeze([
    { value: 'zh', label: '简体中文', path: '/global/zh-cn' },
    { value: 'zhTW', label: '繁體中文', path: '/global/zh-tw' },
    { value: 'en', label: 'English', path: '/' },
    { value: 'ja', label: '日本語', path: '/' },
    { value: 'ko', label: '한국어', path: '/' },
])

export default function LocaleSwitcher({ content }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { changeLanguage } = useLanguage()
    const menuId = useId()
    const controlRef = useRef(null)
    const triggerRef = useRef(null)
    const itemRefs = useRef([])
    const [isOpen, setIsOpen] = useState(false)
    const currentValue = content.localeKey === 'zh-tw' ? 'zhTW' : 'zh'
    const currentOption = LANGUAGE_OPTIONS.find(option => option.value === currentValue)
    const selectedIndex = LANGUAGE_OPTIONS.findIndex(option => option.value === currentValue)

    useEffect(() => {
        if (!isOpen) return undefined

        const closeOnOutsidePress = (event) => {
            if (!controlRef.current?.contains(event.target)) setIsOpen(false)
        }

        const closeOnEscape = (event) => {
            if (event.key !== 'Escape') return
            setIsOpen(false)
            triggerRef.current?.focus()
        }

        document.addEventListener('pointerdown', closeOnOutsidePress)
        document.addEventListener('keydown', closeOnEscape)

        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [isOpen])

    const openMenu = (focusIndex) => {
        setIsOpen(true)
        if (Number.isInteger(focusIndex)) {
            requestAnimationFrame(() => itemRefs.current[focusIndex]?.focus())
        }
    }

    const selectLocale = (option) => {
        changeLanguage(option.value)
        setIsOpen(false)
        navigate(`${option.path}${location.search}${location.hash}`, {
            state: { preferredLanguage: option.value },
        })
    }

    const handleTriggerKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            openMenu(selectedIndex)
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu(LANGUAGE_OPTIONS.length - 1)
        }
    }

    const handleMenuKeyDown = (event) => {
        const activeIndex = itemRefs.current.indexOf(document.activeElement)
        let nextIndex = activeIndex

        if (event.key === 'ArrowDown') nextIndex = (activeIndex + 1) % LANGUAGE_OPTIONS.length
        else if (event.key === 'ArrowUp') nextIndex = (activeIndex - 1 + LANGUAGE_OPTIONS.length) % LANGUAGE_OPTIONS.length
        else if (event.key === 'Home') nextIndex = 0
        else if (event.key === 'End') nextIndex = LANGUAGE_OPTIONS.length - 1
        else if (event.key === 'Tab') {
            setIsOpen(false)
            return
        } else return

        event.preventDefault()
        itemRefs.current[nextIndex]?.focus()
    }

    return (
        <div className="luta-marketing-locale-control" ref={controlRef}>
            <button
                ref={triggerRef}
                type="button"
                className="luta-marketing-locale-switcher"
                aria-label={content.localeSwitcher.menuLabel}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
                onKeyDown={handleTriggerKeyDown}
            >
                <span>{currentOption.label}</span>
                <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
                    <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                </svg>
            </button>

            {isOpen && (
                <div
                    id={menuId}
                    className="luta-marketing-locale-menu"
                    role="menu"
                    aria-label={content.localeSwitcher.menuLabel}
                    onKeyDown={handleMenuKeyDown}
                >
                    {LANGUAGE_OPTIONS.map((option, index) => {
                        const isSelected = option.value === currentValue
                        return (
                            <button
                                key={option.value}
                                ref={element => { itemRefs.current[index] = element }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isSelected}
                                className="luta-marketing-locale-option"
                                data-selected={isSelected ? 'true' : 'false'}
                                onClick={() => selectLocale(option)}
                            >
                                <span>{option.label}</span>
                                {isSelected && (
                                    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
                                        <path d="m3.5 8.25 2.75 2.75 6.25-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                    </svg>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
