import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  // ... your existing config
  plugins: [
    // ... other plugins
    sentinelClient()
  ]
})