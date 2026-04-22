export type EmailTemplateVariables = Record<string, string | number | boolean | null | undefined>;

export type EmailShortcode = {
  key: string;
  token: string;
  label: string;
  sample: string;
};

export const EMAIL_SHORTCODES: EmailShortcode[] = [
  {
    key: "siteName",
    token: "{{siteName}}",
    label: "Site name",
    sample: "PinkLove",
  },
  {
    key: "customerName",
    token: "{{customerName}}",
    label: "Customer name",
    sample: "Minh Anh",
  },
  {
    key: "customerEmail",
    token: "{{customerEmail}}",
    label: "Customer email",
    sample: "minhanh@example.com",
  },
  {
    key: "orderNumber",
    token: "{{orderNumber}}",
    label: "Order number",
    sample: "PL-2026-0001",
  },
  {
    key: "orderTotal",
    token: "{{orderTotal}}",
    label: "Order total",
    sample: "1.500.000đ",
  },
  {
    key: "checkoutUrl",
    token: "{{checkoutUrl}}",
    label: "Checkout URL",
    sample: "https://pinklove.example/checkout",
  },
  {
    key: "supportEmail",
    token: "{{supportEmail}}",
    label: "Support email",
    sample: "support@pinklove.example",
  },
  {
    key: "currentDate",
    token: "{{currentDate}}",
    label: "Current date",
    sample: "21/04/2026",
  },
];

export const DEFAULT_EMAIL_TEMPLATE_VARIABLES = EMAIL_SHORTCODES.reduce<EmailTemplateVariables>(
  (variables, shortcode) => ({
    ...variables,
    [shortcode.key]: shortcode.sample,
  }),
  {}
);

export type RenderEmailTemplateInput = {
  subject: string;
  text?: string;
  html?: string;
};

export function renderEmailTemplate(value: string, variables: EmailTemplateVariables) {
  return value.replaceAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (token, key: string) => {
    const replacement = variables[key];
    if (replacement === null || replacement === undefined) {
      return token;
    }

    return String(replacement);
  });
}

export function renderEmailTemplateSet(input: RenderEmailTemplateInput, variables: EmailTemplateVariables) {
  return {
    subject: renderEmailTemplate(input.subject, variables),
    text: input.text ? renderEmailTemplate(input.text, variables) : undefined,
    html: input.html ? renderEmailTemplate(input.html, variables) : undefined,
  };
}
