import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Explicit separate artifact. The normal website build never includes this page.
export default defineConfig({
    base: './',
    publicDir: false,
    build: {
        outDir: 'dist-singular-ios-pilot',
        rollupOptions: { input: fileURLToPath(new URL('./singular-ios-pilot.html', import.meta.url)) },
    },
})
