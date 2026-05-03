/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          composite: false,
          noEmit: true,
          strict: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          module: 'CommonJS',
          moduleResolution: 'node',
          target: 'ES2020',
          skipLibCheck: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    'server/**/*.ts',
    '!server/index.ts',
    '!server/register.ts',
    '!server/destroy.ts',
    '!server/bootstrap.ts',
    '!server/middlewares/**',
    '!server/routes/**',
    '!server/config/**',
    '!server/content-types/**',
    '!server/services/index.ts',
    '!server/controllers/index.ts',
    '!server/**/__tests__/**',
  ],
  coverageThreshold: {
    global: { lines: 100 },
  },
};
