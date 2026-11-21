/**
 * Configuración de Jest. Las pruebas cubren la lógica de negocio (servicios y
 * cliente HTTP) que no depende de módulos nativos.
 */
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/api/**/*.ts",
    "!src/services/contenedor.ts",
    "!src/api/index.ts",
    "!src/api/sesion.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|react-native-svg|@react-navigation/.*))",
  ],
};
