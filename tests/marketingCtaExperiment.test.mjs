import assert from 'node:assert/strict'
import test from 'node:test'

import {
    MARKETING_CTA_COPY_EXPERIMENT_KEY,
    MARKETING_CTA_COPY_EXPERIMENT_STORAGE_KEY,
    MARKETING_CTA_COPY_VARIANTS,
    marketingCtaExperimentProperties,
    resetMarketingCtaExperimentForTests,
    resolveMarketingCtaCopyExperiment,
} from '../src/lib/marketingCtaExperiment.js'

function createStorage(initialValue = null) {
    const values = new Map()
    if (initialValue) {
        values.set(MARKETING_CTA_COPY_EXPERIMENT_STORAGE_KEY, initialValue)
    }
    return {
        getItem(key) {
            return values.get(key) ?? null
        },
        setItem(key, value) {
            values.set(key, value)
        },
    }
}

test.beforeEach(() => resetMarketingCtaExperimentForTests())

test('production traffic receives a stable 50/50 assignment', () => {
    const storage = createStorage()
    const first = resolveMarketingCtaCopyExperiment({
        trafficPurpose: 'production',
        storage,
        random: () => 0.8,
    })
    const replay = resolveMarketingCtaCopyExperiment({
        trafficPurpose: 'production',
        storage,
        random: () => 0.1,
    })

    assert.equal(first.experimentKey, MARKETING_CTA_COPY_EXPERIMENT_KEY)
    assert.equal(first.experimentVariant, MARKETING_CTA_COPY_VARIANTS.TREATMENT)
    assert.equal(first.useValueCopy, false)
    assert.deepEqual(replay, first)
})

test('control keeps the existing value-led CTA copy', () => {
    const experiment = resolveMarketingCtaCopyExperiment({
        trafficPurpose: 'production',
        storage: createStorage(),
        random: () => 0.2,
    })

    assert.equal(experiment.experimentVariant, MARKETING_CTA_COPY_VARIANTS.CONTROL)
    assert.equal(experiment.useValueCopy, true)
    assert.deepEqual(marketingCtaExperimentProperties(experiment), {
        experiment_key: MARKETING_CTA_COPY_EXPERIMENT_KEY,
        experiment_variant: MARKETING_CTA_COPY_VARIANTS.CONTROL,
    })
})

test('qa and smoke traffic remain on control copy and emit no experiment fields', () => {
    for (const trafficPurpose of ['qa', 'smoke', 'internal', 'development', 'unknown']) {
        const experiment = resolveMarketingCtaCopyExperiment({
            trafficPurpose,
            storage: createStorage(),
            random: () => 0.8,
        })
        assert.equal(experiment.eligible, false)
        assert.equal(experiment.useValueCopy, true)
        assert.deepEqual(marketingCtaExperimentProperties(experiment), {})
    }
})

test('an existing valid assignment wins over a new random draw', () => {
    const experiment = resolveMarketingCtaCopyExperiment({
        trafficPurpose: 'production',
        storage: createStorage(MARKETING_CTA_COPY_VARIANTS.CONTROL),
        random: () => 0.9,
    })

    assert.equal(experiment.experimentVariant, MARKETING_CTA_COPY_VARIANTS.CONTROL)
})
