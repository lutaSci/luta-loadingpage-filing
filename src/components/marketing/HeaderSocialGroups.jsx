import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import { HEADER_GROUP_CHANNELS } from '../../content/footerSocialChannels.js'
import facebookIcon from '../../assets/social/facebook.svg'
import whatsappIcon from '../../assets/social/whatsapp.svg'
import lineIcon from '../../assets/social/line.svg'

const icons = Object.freeze({
    facebook: facebookIcon,
    whatsapp: whatsappIcon,
    line: lineIcon,
})

const SESSION_KEY = 'luta-header-group-channel-v1'
const desktopQuery = '(min-width: 64rem)'
const getDesktopSnapshot = () => window.matchMedia(desktopQuery).matches
const getServerSnapshot = () => false

function subscribeDesktop(callback) {
    const media = window.matchMedia(desktopQuery)
    media.addEventListener('change', callback)
    return () => media.removeEventListener('change', callback)
}

function readStoredChannelId() {
    try {
        const stored = window.sessionStorage.getItem(SESSION_KEY)
        if (HEADER_GROUP_CHANNELS.some(channel => channel.id === stored)) return stored
    } catch {
        // sessionStorage may be blocked; fall back to the Facebook default.
    }
    return HEADER_GROUP_CHANNELS[0].id
}

function storeChannelId(channelId) {
    try {
        window.sessionStorage.setItem(SESSION_KEY, channelId)
    } catch {
        // Ignore persistence failures; the in-memory selection still works.
    }
}

function channelKindLabel(channel, social) {
    return channel.id === 'facebook' ? social.community : social.group
}

function channelAccessibleLabel(channel, social) {
    return `${social.join} ${channel.name} ${channelKindLabel(channel, social)}`
}

function GroupIconLink({ channel, label, newTabLabel, opensNewTab }) {
    return (
        <a
            className="luta-marketing-header-social-link"
            href={channel.group}
            target={opensNewTab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            aria-label={`${label}${opensNewTab ? ` · ${newTabLabel}` : ''}`}
        >
            <img src={icons[channel.id]} width="20" height="20" alt="" aria-hidden="true" />
        </a>
    )
}

export default function HeaderSocialGroups({ content }) {
    const social = content.footer.social
    const menuId = useId()
    const controlRef = useRef(null)
    const triggerRef = useRef(null)
    const itemRefs = useRef([])
    const [isOpen, setIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState(HEADER_GROUP_CHANNELS[0].id)
    const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getServerSnapshot)
    const selectedChannel = HEADER_GROUP_CHANNELS.find(channel => channel.id === selectedId)
        || HEADER_GROUP_CHANNELS[0]
    const selectedIndex = HEADER_GROUP_CHANNELS.findIndex(channel => channel.id === selectedChannel.id)

    useEffect(() => {
        setSelectedId(readStoredChannelId())
    }, [])

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

    const selectChannel = (channel) => {
        setSelectedId(channel.id)
        storeChannelId(channel.id)
        setIsOpen(false)
    }

    const openMenu = (focusIndex) => {
        setIsOpen(true)
        if (Number.isInteger(focusIndex)) {
            requestAnimationFrame(() => itemRefs.current[focusIndex]?.focus())
        }
    }

    const handleTriggerKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            openMenu(selectedIndex)
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu(HEADER_GROUP_CHANNELS.length - 1)
        }
    }

    const handleMenuKeyDown = (event) => {
        const activeIndex = itemRefs.current.indexOf(document.activeElement)
        let nextIndex = activeIndex

        if (event.key === 'ArrowDown') nextIndex = (activeIndex + 1) % HEADER_GROUP_CHANNELS.length
        else if (event.key === 'ArrowUp') {
            nextIndex = (activeIndex - 1 + HEADER_GROUP_CHANNELS.length) % HEADER_GROUP_CHANNELS.length
        } else if (event.key === 'Home') nextIndex = 0
        else if (event.key === 'End') nextIndex = HEADER_GROUP_CHANNELS.length - 1
        else if (event.key === 'Tab') {
            setIsOpen(false)
            return
        } else return

        event.preventDefault()
        itemRefs.current[nextIndex]?.focus()
    }

    if (isDesktop) {
        return (
            <nav
                className="luta-marketing-header-social"
                aria-label={social.groups}
                data-presentation="desktop"
            >
                {HEADER_GROUP_CHANNELS.map(channel => (
                    <GroupIconLink
                        key={channel.id}
                        channel={channel}
                        label={channelAccessibleLabel(channel, social)}
                        newTabLabel={social.newTab}
                        opensNewTab
                    />
                ))}
            </nav>
        )
    }

    return (
        <div
            className="luta-marketing-header-social"
            data-presentation="mobile"
            ref={controlRef}
        >
            <GroupIconLink
                channel={selectedChannel}
                label={channelAccessibleLabel(selectedChannel, social)}
                newTabLabel={social.newTab}
                opensNewTab={false}
            />
            <button
                ref={triggerRef}
                type="button"
                className="luta-marketing-header-social-switcher"
                aria-label={social.groups}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
                onKeyDown={handleTriggerKeyDown}
            >
                <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14">
                    <path
                        d="m4 6 4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.4"
                    />
                </svg>
            </button>
            {isOpen && (
                <div
                    id={menuId}
                    className="luta-marketing-header-social-menu"
                    role="menu"
                    aria-label={social.groups}
                    onKeyDown={handleMenuKeyDown}
                >
                    {HEADER_GROUP_CHANNELS.map((channel, index) => {
                        const isSelected = channel.id === selectedChannel.id
                        return (
                            <button
                                key={channel.id}
                                ref={element => { itemRefs.current[index] = element }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isSelected}
                                className="luta-marketing-header-social-option"
                                data-selected={isSelected ? 'true' : 'false'}
                                onClick={() => selectChannel(channel)}
                            >
                                <img
                                    src={icons[channel.id]}
                                    width="18"
                                    height="18"
                                    alt=""
                                    aria-hidden="true"
                                />
                                <span>{channel.name} {channelKindLabel(channel, social)}</span>
                                {isSelected && (
                                    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
                                        <path
                                            d="m3.5 8.25 2.75 2.75 6.25-6"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.5"
                                        />
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
