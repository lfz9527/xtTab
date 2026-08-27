import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing'

export default defineConfig({
  test: {
    mockReset: true,
    restoreMocks: true,
    include: ['src/**/*.test.{ts,tsx}']
  },
  plugins: [WxtVitest()]
})
