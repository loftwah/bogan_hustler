/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { PluginOption } from 'vite'

export default defineConfig({
  plugins: [react() as unknown as PluginOption],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react']
        }
      }
    },
    testTimeout: 10000
  },
}) 