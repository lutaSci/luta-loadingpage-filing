import Install from './Install.jsx'
import RootHomepage from './RootHomepage.jsx'
import { useSmartLinkJourney } from '../contexts/SmartLinkJourneyContext.jsx'

export default function SmartLinkInstallEntry() {
    const { usesHomepageSurface } = useSmartLinkJourney()
    return usesHomepageSurface ? <RootHomepage /> : <Install />
}
