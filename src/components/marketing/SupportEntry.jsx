import { CircleHelp } from 'lucide-react'

export default function SupportEntry({ label, onActivate }) {
    return (
        <button
            className="luta-marketing-support-entry"
            type="button"
            onClick={onActivate}
        >
            <CircleHelp aria-hidden="true" />
            <span>{label}</span>
        </button>
    )
}
