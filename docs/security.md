# Security

## Trusted Proxy And Client IP

Auth rate-limit uses `getRequestIp()` from `web/src/lib/auth-rate-limit.ts`.
The app must not trust IP forwarding headers unless the deployment path makes
those headers trustworthy.

Configure `AUTH_TRUSTED_PROXY_MODE`:

- `none`: default. The app does not trust `cf-connecting-ip`,
  `x-forwarded-for`, or `x-real-ip`. IP rate-limit keys become `unknown`
  unless a trusted server/proxy layer is added.
- `reverse_proxy`: trust `x-forwarded-for` and `x-real-ip`. Use only when the
  app is reachable only through a reverse proxy you control, and that proxy
  strips any client-supplied forwarding headers before setting fresh values.
- `cloudflare`: trust `cf-connecting-ip`. Use only when production traffic
  reaches the app through Cloudflare and direct-to-origin traffic is blocked.

Do not enable `cloudflare` just because the header exists. Any direct client
can send a fake `cf-connecting-ip` header if the origin is reachable.

Do not enable `reverse_proxy` unless the proxy owns the header chain. For Nginx
or similar, clear inbound `X-Forwarded-For`, `X-Real-IP`, and
`CF-Connecting-IP` from untrusted clients, then set the headers from the actual
remote address.

The current runtime mode is visible in Admin > Configuration > Bảo mật đăng
nhập under `Trusted Proxy / IP Headers`.

## Auth Form CSRF

Login, register, admin login, and provider login POSTs require a short-lived
CSRF token. The server renders a hidden `csrfToken`, stores only a signed token
hash in an HttpOnly cookie, verifies with timing-safe comparison, and rotates
the cookie after a valid submission.

Production always enables CSRF protection. In non-production only, set
`AUTH_CSRF_DISABLED=true` to bypass checks while debugging. Use
`AUTH_CSRF_SECRET` for a dedicated signing secret; otherwise the app falls back
to `INTERNAL_API_SECRET`.

The current CSRF status is visible in Admin > Configuration > Bảo mật đăng nhập
under `Auth CSRF Protection`.

## Runtime Security Headers

Production responses passing through `web/src/proxy.ts` receive the runtime
security headers built by `web/src/lib/security-headers.ts`:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Set `SECURITY_HEADERS_FORCE=true` to test these headers outside production.
Admin > Configuration > Bảo mật đăng nhập includes a Security Headers section
for editing the stored config, previewing the exact header values, and warning
when important headers are disabled or CSP contains wildcard domains.
Runtime proxy reads this stored config through the protected
`/api/internal/security-headers` endpoint and caches it briefly; if the config
cannot be loaded, the proxy falls back to safe defaults.

Test checkout, payment gateways, Google OAuth, uploaded images, analytics, and
realtime connections after changing CSP allowlists. HSTS `includeSubDomains`
should stay off until every subdomain is confirmed to serve HTTPS.
