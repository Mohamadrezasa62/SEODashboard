import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // آدرس پروژه Next.js برای بارگذاری فایل‌های env و tsconfig
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // اصلاح شد: نام صحیح کلید testMatch است
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  // بخش transform حذف شد تا خود next/jest بهینه‌سازی‌ها را انجام دهد
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|recharts|@radix-ui)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}

export default createJestConfig(config)