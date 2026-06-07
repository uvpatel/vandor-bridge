import { dash } from "@better-auth/infra";

export const auth = betterAuth({
  // ... your existing config
  plugins: [
    // ... other plugins
    dash()
  ]
})