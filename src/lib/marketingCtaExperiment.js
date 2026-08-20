export const MARKETING_CTA_COPY_EXPERIMENT_KEY = 'marketing_cta_copy_v1'
export const MARKETING_CTA_COPY_EXPERIMENT_STORAGE_KEY = 'luta-marketing-cta-copy-v1'

export const MARKETING_CTA_COPY_VARIANTS = Object.freeze({
    CONTROL: 'control_value',
    TREATMENT: 'treatment_platform',
})

const VALID_VARIANTS = new Set(Object.values(MARKETING_CTA_COPY_VARIANTS))
let memoryAssignment = null

function defaultStorage() {
    try {
        return globalThis.localStorage || null
    } catch {
        return null
    }
}

function readStoredAssignment(storage) {
    if (!storage) return null
    try {
        const value = storage.getItem(MARKETING_CTA_COPY_EXPERIMENT_STORAGE_KEY)
        return VALID_VARIANTS.has(value) ? value : null
    } catch {
        return null
    }
}

function writeStoredAssignment(storage, variant) {
    if (!storage) return
    try {
        storage.setItem(MARKETING_CTA_COPY_EXPERIMENT_STORAGE_KEY, variant)
    } catch {
        // The in-memory assignment still keeps this page load stable when
        // private browsing or storage policy blocks localStorage.
    }
}

function chooseVariant(randomValue) {
    return randomValue < 0.5
        ? MARKETING_CTA_COPY_VARIANTS.CONTROL
        : MARKETING_CTA_COPY_VARIANTS.TREATMENT
}

export function resolveMarketingCtaCopyExperiment({
    trafficPurpose,
    storage = defaultStorage(),
    random = Math.random,
} = {}) {
    if (trafficPurpose !== 'production') {
        return Object.freeze({
            eligible: false,
            experimentKey: null,
            experimentVariant: null,
            useValueCopy: true,
        })
    }

    const storedAssignment = readStoredAssignment(storage)
    const variant = storedAssignment
        || memoryAssignment
        || chooseVariant(random())

    memoryAssignment = variant
    if (!storedAssignment) writeStoredAssignment(storage, variant)

    return Object.freeze({
        eligible: true,
        experimentKey: MARKETING_CTA_COPY_EXPERIMENT_KEY,
        experimentVariant: variant,
        useValueCopy: variant === MARKETING_CTA_COPY_VARIANTS.CONTROL,
    })
}

export function marketingCtaExperimentProperties(experiment) {
    if (!experiment?.eligible) return Object.freeze({})
    return Object.freeze({
        experiment_key: experiment.experimentKey,
        experiment_variant: experiment.experimentVariant,
    })
}

export function resetMarketingCtaExperimentForTests() {
    memoryAssignment = null
}
