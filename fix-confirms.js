const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = [
  "web/src/features/notifications/components/admin-notifications-table.tsx",
  "web/src/features/blog/admin/blog-post-editor-form.tsx",
  "web/src/features/blog/admin/blog-category-editor-form.tsx",
  "web/src/features/blog/admin/admin-blog-categories-table.tsx",
  "web/src/features/blog/admin/admin-blog-posts-table.tsx",
  "web/src/features/admin/components/users/user-management.tsx",
  "web/src/features/admin/components/internal-accounts/internal-accounts-manager.tsx",
  "web/src/features/admin/components/settings/seo-redirects-manager.tsx",
  "web/src/features/chat/components/chat-inbox-client.tsx",
  "web/src/features/ecommerce/admin/shipping-connections-table.tsx",
  "web/src/features/ecommerce/admin/payment-methods-table.tsx",
  "web/src/features/comments/admin/admin-comments-table.tsx",
  "web/src/features/offerings/admin/offering-category-editor-form.tsx",
  "web/src/features/offerings/admin/admin-offering-categories-table.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add import if not exists
  if (content.includes('confirm(') || content.includes('window.confirm(')) {
    if (!content.includes('useConfirm')) {
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport) + '\nimport { useConfirm } from "@/components/common/confirm-provider";' + content.slice(endOfLastImport);
      changed = true;
    }
    
    // Add useConfirm hook if not exists inside the component.
    // It's a bit tricky to insert the hook generically. We will assume the component has a specific pattern, 
    // but the easiest way is to let the developer do it manually or we do simple replacements.
    // Given the complexity of injecting hooks into React components, it's safer to do it manually.
  }
}
