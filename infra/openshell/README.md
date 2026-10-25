# infra/openshell/ (goal S2)
`policy.yaml` sets egress for the agent sandbox: GitHub plus the Vercel API only; everything else is blocked and logged. The nft fallback keeps localhost, the LAN and established connections working.
