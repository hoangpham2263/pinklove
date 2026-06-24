export type ContentSecurityPolicySettings = {
  enabled: boolean;
  reportOnly: boolean;
  defaultSrc: string;
  scriptSrc: string;
  styleSrc: string;
  imgSrc: string;
  connectSrc: string;
  fontSrc: string;
  frameSrc: string;
  frameAncestors: string;
};

export type StrictTransportSecuritySettings = {
  enabled: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
};

export type XFrameOptionsSettings = {
  enabled: boolean;
  value: "DENY" | "SAMEORIGIN";
};

export type ReferrerPolicySettings = {
  enabled: boolean;
  value: string;
};

export type PermissionsPolicySettings = {
  enabled: boolean;
  value: string;
};

export type SecurityHeadersSettings = {
  enabled: boolean;
  contentSecurityPolicy: ContentSecurityPolicySettings;
  strictTransportSecurity: StrictTransportSecuritySettings;
  xFrameOptions: XFrameOptionsSettings;
  xContentTypeOptions: boolean;
  referrerPolicy: ReferrerPolicySettings;
  permissionsPolicy: PermissionsPolicySettings;
};

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersSettings = {
  enabled: true,
  contentSecurityPolicy: {
    enabled: true,
    reportOnly: false,
    defaultSrc: "'self'",
    scriptSrc: "'self' 'unsafe-inline'",
    styleSrc: "'self' 'unsafe-inline'",
    imgSrc: "'self' data: blob: https:",
    connectSrc: "'self' https:",
    fontSrc: "'self' data:",
    frameSrc: "'self' https://sandbox-payment.pay2s.vn https://sandbox.vnpayment.vn https://*.vnpayment.vn",
    frameAncestors: "'none'",
  },
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: false,
    preload: false,
  },
  xFrameOptions: {
    enabled: true,
    value: "DENY",
  },
  xContentTypeOptions: true,
  referrerPolicy: {
    enabled: true,
    value: "strict-origin-when-cross-origin",
  },
  permissionsPolicy: {
    enabled: true,
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
};

function normalizeDirective(value: string, fallback: string) {
  return value.trim().replace(/\s+/g, " ") || fallback;
}

export function normalizeSecurityHeadersSettings(input: Partial<SecurityHeadersSettings> = {}): SecurityHeadersSettings {
  const cspInput: Partial<ContentSecurityPolicySettings> = input.contentSecurityPolicy ?? {};
  const hstsInput: Partial<StrictTransportSecuritySettings> = input.strictTransportSecurity ?? {};
  const xfoInput: Partial<XFrameOptionsSettings> = input.xFrameOptions ?? {};
  const referrerInput: Partial<ReferrerPolicySettings> = input.referrerPolicy ?? {};
  const permissionsInput: Partial<PermissionsPolicySettings> = input.permissionsPolicy ?? {};

  return {
    enabled: input.enabled ?? DEFAULT_SECURITY_HEADERS.enabled,
    contentSecurityPolicy: {
      enabled: cspInput.enabled ?? DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.enabled,
      reportOnly: cspInput.reportOnly ?? DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.reportOnly,
      defaultSrc: normalizeDirective(cspInput.defaultSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.defaultSrc),
      scriptSrc: normalizeDirective(cspInput.scriptSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.scriptSrc),
      styleSrc: normalizeDirective(cspInput.styleSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.styleSrc),
      imgSrc: normalizeDirective(cspInput.imgSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.imgSrc),
      connectSrc: normalizeDirective(cspInput.connectSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.connectSrc),
      fontSrc: normalizeDirective(cspInput.fontSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.fontSrc),
      frameSrc: normalizeDirective(cspInput.frameSrc ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.frameSrc),
      frameAncestors: normalizeDirective(cspInput.frameAncestors ?? "", DEFAULT_SECURITY_HEADERS.contentSecurityPolicy.frameAncestors),
    },
    strictTransportSecurity: {
      enabled: hstsInput.enabled ?? DEFAULT_SECURITY_HEADERS.strictTransportSecurity.enabled,
      maxAge: Math.max(0, Math.floor(Number(hstsInput.maxAge ?? DEFAULT_SECURITY_HEADERS.strictTransportSecurity.maxAge))),
      includeSubDomains: hstsInput.includeSubDomains ?? DEFAULT_SECURITY_HEADERS.strictTransportSecurity.includeSubDomains,
      preload: hstsInput.preload ?? DEFAULT_SECURITY_HEADERS.strictTransportSecurity.preload,
    },
    xFrameOptions: {
      enabled: xfoInput.enabled ?? DEFAULT_SECURITY_HEADERS.xFrameOptions.enabled,
      value: xfoInput.value === "SAMEORIGIN" ? "SAMEORIGIN" : "DENY",
    },
    xContentTypeOptions: input.xContentTypeOptions ?? DEFAULT_SECURITY_HEADERS.xContentTypeOptions,
    referrerPolicy: {
      enabled: referrerInput.enabled ?? DEFAULT_SECURITY_HEADERS.referrerPolicy.enabled,
      value: normalizeDirective(referrerInput.value ?? "", DEFAULT_SECURITY_HEADERS.referrerPolicy.value),
    },
    permissionsPolicy: {
      enabled: permissionsInput.enabled ?? DEFAULT_SECURITY_HEADERS.permissionsPolicy.enabled,
      value: normalizeDirective(permissionsInput.value ?? "", DEFAULT_SECURITY_HEADERS.permissionsPolicy.value),
    },
  };
}

function buildCspValue(settings: ContentSecurityPolicySettings) {
  return [
    `default-src ${settings.defaultSrc}`,
    `script-src ${settings.scriptSrc}`,
    `style-src ${settings.styleSrc}`,
    `img-src ${settings.imgSrc}`,
    `connect-src ${settings.connectSrc}`,
    `font-src ${settings.fontSrc}`,
    `frame-src ${settings.frameSrc}`,
    `frame-ancestors ${settings.frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function buildHstsValue(settings: StrictTransportSecuritySettings) {
  return [
    `max-age=${settings.maxAge}`,
    settings.includeSubDomains ? "includeSubDomains" : "",
    settings.preload ? "preload" : "",
  ].filter(Boolean).join("; ");
}

export function buildSecurityHeaders(
  input: Partial<SecurityHeadersSettings> = {},
  options: { includeHsts?: boolean } = {}
) {
  const settings = normalizeSecurityHeadersSettings(input);
  const headers = new Map<string, string>();

  if (!settings.enabled) return headers;

  if (settings.contentSecurityPolicy.enabled) {
    headers.set(
      settings.contentSecurityPolicy.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
      buildCspValue(settings.contentSecurityPolicy)
    );
  }

  if (settings.strictTransportSecurity.enabled && options.includeHsts) {
    headers.set("Strict-Transport-Security", buildHstsValue(settings.strictTransportSecurity));
  }

  if (settings.xFrameOptions.enabled) {
    headers.set("X-Frame-Options", settings.xFrameOptions.value);
  }

  if (settings.xContentTypeOptions) {
    headers.set("X-Content-Type-Options", "nosniff");
  }

  if (settings.referrerPolicy.enabled) {
    headers.set("Referrer-Policy", settings.referrerPolicy.value);
  }

  if (settings.permissionsPolicy.enabled) {
    headers.set("Permissions-Policy", settings.permissionsPolicy.value);
  }

  return headers;
}

export function getSecurityHeaderWarnings(input: Partial<SecurityHeadersSettings> = {}) {
  const settings = normalizeSecurityHeadersSettings(input);
  const warnings: string[] = [];
  const cspDirectives = settings.contentSecurityPolicy;

  if (!settings.enabled) warnings.push("Security headers đang tắt toàn bộ.");
  if (!cspDirectives.enabled) warnings.push("Content-Security-Policy đang tắt.");
  if (!settings.strictTransportSecurity.enabled) warnings.push("Strict-Transport-Security đang tắt.");
  if (!settings.xFrameOptions.enabled && !cspDirectives.frameAncestors) {
    warnings.push("Clickjacking protection đang yếu vì thiếu cả X-Frame-Options và frame-ancestors.");
  }
  if (!settings.xContentTypeOptions) warnings.push("X-Content-Type-Options: nosniff đang tắt.");

  const directiveValues = [
    cspDirectives.defaultSrc,
    cspDirectives.scriptSrc,
    cspDirectives.styleSrc,
    cspDirectives.imgSrc,
    cspDirectives.connectSrc,
    cspDirectives.fontSrc,
    cspDirectives.frameSrc,
    cspDirectives.frameAncestors,
  ];
  if (directiveValues.some((value) => value.includes("*"))) {
    warnings.push("CSP đang có wildcard (*). Chỉ dùng khi đã xác nhận domain thật sự cần.");
  }
  if (cspDirectives.scriptSrc.includes("'unsafe-eval'")) {
    warnings.push("script-src có unsafe-eval, cần test kỹ và tránh bật ở production nếu không bắt buộc.");
  }
  if (settings.strictTransportSecurity.includeSubDomains) {
    warnings.push("HSTS includeSubDomains chỉ an toàn khi mọi subdomain đều chạy HTTPS.");
  }

  return warnings;
}
