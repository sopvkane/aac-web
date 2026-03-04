import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: true,
    exclude: ['tests/**'],
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
        "src/components/ui/dialog.tsx",
        "src/components/IconMappingSection.tsx",
        "src/components/ProfileHeaderButton.tsx",
        "src/auth/AuthContext.tsx",
        "src/hooks/useSpeechToText.ts",
        "src/api/auth.ts",
        "src/api/icons.ts",
        "src/pages/ComposePage.tsx",
        "src/pages/SettingsPage.tsx",
        "src/pages/SplashScreen.tsx",
        "src/pages/SpeakPage.tsx",
        "src/pages/ConversationPage.tsx",
        "src/pages/CaregiverDashboardPage.tsx",
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
