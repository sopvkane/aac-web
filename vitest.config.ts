import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: true,
    coverage: {
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.*",
        "src/setupTests.ts",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/types/**",
        "src/demo/**",
        "src/components/ui/input.tsx",
        "src/components/ui/select.tsx",
        "src/pages/ComposePage.tsx",
        "src/pages/SettingsPage.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 58,
        statements: 75,
      },
    },
  },
});
