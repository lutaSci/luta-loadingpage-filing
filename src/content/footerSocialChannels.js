// Shared across every landing locale and market. These are fixed outbound
// destinations: never append the current URL, attribution state or query string.
// Source: channel inventory supplied and approved in the 2026-09-12 footer task.
export const FOOTER_SOCIAL_CHANNELS = Object.freeze([
    Object.freeze({
        id: 'whatsapp',
        name: 'WhatsApp',
        group: 'https://chat.whatsapp.com/FavWsnZQHil05fzorZPH7p',
        contact: 'https://wa.me/601172576746',
    }),
    Object.freeze({
        id: 'line',
        name: 'LINE',
        group: 'https://line.me/ti/g/ujqWrmZ3LP',
        contact: 'https://line.me/ti/p/7JtyLgmLgH',
    }),
    Object.freeze({
        id: 'telegram',
        name: 'Telegram',
        group: 'https://t.me/+8FHKEoBPoF44NjJl',
        // A team contact URL has not been supplied; the group remains available.
    }),
    Object.freeze({
        id: 'facebook',
        name: 'Facebook',
        group: 'https://www.facebook.com/groups/1094638549990477/',
        page: 'https://www.facebook.com/LutaSutraReading/',
    }),
])

// Header quick entries: groups only, Facebook first as the mobile default.
// Telegram stays footer-only until product asks for it.
const HEADER_GROUP_IDS = Object.freeze(['facebook', 'whatsapp', 'line'])

export const HEADER_GROUP_CHANNELS = Object.freeze(
    HEADER_GROUP_IDS.map((id) => {
        const channel = FOOTER_SOCIAL_CHANNELS.find(entry => entry.id === id)
        if (!channel?.group) {
            throw new Error(`Missing group URL for header channel: ${id}`)
        }
        return Object.freeze({
            id: channel.id,
            name: channel.name,
            group: channel.group,
        })
    }),
)
