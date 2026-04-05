import { CmsPage } from"@/lib/cms";
import { DefaultTemplate } from"./DefaultTemplate";
import { ContactTemplate } from"./ContactTemplate";
import { HomeTemplate } from"./HomeTemplate";
import { AboutTemplate } from"./AboutTemplate";

/**
 * Registry chứa tất cả các template cho trang CMS.
 * Để thêm template mới:
 * 1. Tạo component trong folder này.
 * 2. Khai báo nó vào object CMS_TEMPLATES dưới đây.
 */
export const CMS_TEMPLATES: Record<string, { label: string; component: React.ComponentType<{ page: CmsPage }> }> = {
 default: { label:"Default (Auto-select by slug)", component: DefaultTemplate },
 home: { label:"Home Page", component: HomeTemplate },
 about: { label:"About Us", component: AboutTemplate },
 contact: { label:"Contact Us", component: ContactTemplate },
};

export type TemplateKey = keyof typeof CMS_TEMPLATES;
