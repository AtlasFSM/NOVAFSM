# ADR 003: RS256 JWT Authentication

## Status
Accepted

## Context
The platform needs stateless authentication that works across web and mobile clients, supports token refresh, and is verifiable by future microservices without sharing secrets.

## Decision
Use **RS256 asymmetric JWT**: access tokens signed with a private key, verified with a public key.

## Rationale
- Asymmetric signing allows any service to verify tokens without the private key
- Standard JWT is stateless — no database lookup per request
- Short-lived access tokens (15min) + long-lived refresh tokens (7d) balance security and UX
- Refresh token rotation prevents token reuse after compromise

## Consequences
- Private key must be securely stored in environment variables
- Public key can be freely distributed to verifying services
- Token revocation requires a denylist (Redis-based blacklist for logout)
