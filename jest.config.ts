/** @type {import('ts-jest').JestConfigWithTsJest} */
import type { Config } from "jest";
import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

const config: JestConfigWithTsJest = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/**/*.test.ts"],
  forceExit: true,
  // clearMocks: true,
  roots: ["<rootDir>"],
  modulePaths: ["./"],
  moduleNameMapper: pathsToModuleNameMapper(
    {
      "@/*": ["src/*"],
    }
  ),
};

export default config;
