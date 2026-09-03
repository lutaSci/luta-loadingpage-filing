import assert from 'node:assert/strict'
import { test } from 'node:test'

import { registerToastHandler, toast } from '../src/lib/toast.js'

test('toast forwards to the active handler and unregisters without clearing a replacement', () => {
    const received = []
    const unregisterFirst = registerToastHandler((message, duration) => {
        received.push(['first', message, duration])
    })

    toast('first message', 1000)

    const unregisterSecond = registerToastHandler((message, duration) => {
        received.push(['second', message, duration])
    })
    unregisterFirst()
    toast('second message')
    unregisterSecond()
    toast('ignored message')

    assert.deepEqual(received, [
        ['first', 'first message', 1000],
        ['second', 'second message', 3500],
    ])
})
