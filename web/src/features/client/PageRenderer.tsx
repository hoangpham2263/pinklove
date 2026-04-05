import { CmsPage } from"@/lib/cms";
import { CMS_TEMPLATES } from"./templates";

type PageRendererProps = {
 page: CmsPage;
};

export function PageRenderer({ page }: PageRendererProps) {
 // Lấy template key từ cấu hình trang, mặc định là 'default'
 let templateKey = page.template ||"default";
 
 // Logic tự động chọn theo slug nếu template là default (giống WordPress)
 if (templateKey ==="default") {
 if (page.slug ==="home") templateKey ="home";
 else if (page.slug ==="about-us" || page.slug ==="about") templateKey ="about";
 else if (page.slug ==="contact") templateKey ="contact";
 }

 // Lấy component từ registry, fallback về DefaultTemplate nếu không tìm thấy
 const templateConfig = CMS_TEMPLATES[templateKey] || CMS_TEMPLATES.default;
 const TemplateComponent = templateConfig.component;

 return <TemplateComponent page={page} />;
}
