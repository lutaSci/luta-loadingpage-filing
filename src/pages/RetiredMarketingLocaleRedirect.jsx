import { Navigate, useLocation } from 'react-router-dom'

export default function RetiredMarketingLocaleRedirect() {
    const { search, hash } = useLocation()

    return <Navigate replace to={`/${search}${hash}`} />
}
