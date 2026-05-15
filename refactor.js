const fs = require('fs');
const path = require('path');

const pages = [
  "vendor/Upload.tsx",
  "buyer/Orders.tsx",
  "vendor/Products.tsx",
  "buyer/Notifications.tsx",
  "buyer/ProductDetail.tsx",
  "vendor/Notifications.tsx",
  "buyer/Marketplace.tsx",
  "admin/Products.tsx",
  "admin/AllUsers.tsx",
  "admin/Orders.tsx",
  "admin/Users.tsx",
  "admin/Dashboard.tsx"
];

const basePath = "/Users/abc/Downloads/MediSupply/artifacts/medi-supply/src/pages";

for (const p of pages) {
  const fullPath = path.join(basePath, p);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace AppHeader import
  content = content.replace(
    /import \{ AppHeader \} from "@\/components\/layout\/AppHeader";/g,
    'import { DashboardLayout } from "@/components/layout/DashboardLayout";'
  );

  // Replace structure:
  // <div className="min-h-screen bg-background">
  //   <AppHeader navItems={...Nav} />
  //   <div className="max-w-screen-xl mx-auto px-4 py-6"> OR similar
  
  // We can use a regex to replace the opening and closing wrapper
  // We want to match:
  // <div className="min-h-screen bg-background">
  //   <AppHeader navItems={VAR} />
  //   <div className="max-w-screen-xl mx-auto px-4 py-6">
  
  // Let's just find `<AppHeader navItems={var} />`
  // and the opening `<div className="min-h-screen bg-background">`
  
  const navMatch = content.match(/<AppHeader navItems=\{([a-zA-Z]+)\} \/>/);
  if (!navMatch) {
    console.log(`No AppHeader found in ${p}`);
    continue;
  }
  const navVar = navMatch[1];
  
  // Replace the exact opening pattern if possible
  content = content.replace(
    /<div className="min-h-screen bg-background">\s*<AppHeader navItems=\{([a-zA-Z]+)\} \/>/g,
    `<DashboardLayout navItems={$1}>`
  );
  
  // Also replace the closing div that corresponds to min-h-screen bg-background
  // The last `</div>` before the end of the file or return statement
  // Because these files end with `</div>\n  );\n}\n`, we can replace that.
  content = content.replace(
    /<\/div>\n\s*\);\n}\n?$/g,
    `</DashboardLayout>\n  );\n}\n`
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Refactored ${p}`);
}
