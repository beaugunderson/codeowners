import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/codeowners.ts"],
  clean: true,
  format: "esm",
  dts: "src/codeowners.ts",
});
