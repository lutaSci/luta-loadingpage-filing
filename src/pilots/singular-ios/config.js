// Trusted code configuration, never supplied by a query parameter or localStorage.
// Leave these prerequisites unset until Singular supplies account-specific facts.
export const pilotConfig = Object.freeze({
    entitlementConfirmed: false,
    nativeReadConfirmed: false,
    webProductId: '',
    baseLink: '',
    pageOrigin: '',
    supportEvidence: '',
})
