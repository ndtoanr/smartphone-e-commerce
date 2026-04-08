const fs = require('fs');
const files = [
    'd:/Smartphone/frontend/src/pages/ProductDetailPage.jsx',
    'd:/Smartphone/frontend/src/pages/admin/ProductManagementPage.jsx',
    'd:/Smartphone/frontend/src/pages/admin/DashboardPage.jsx',
    'd:/Smartphone/frontend/src/components/Layout/AdminLayout.jsx',
    'd:/Smartphone/frontend/src/components/FloatingWidget.jsx',
    'd:/Smartphone/frontend/src/pages/admin/CouponManagementPage.jsx'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/blue-([0-9]{2,3})/g, 'primary-$1');
    // For CouponManagementPage, replace purple as well if needed, but primary is fine.
    // Replace hover:bg-blue-*, text-blue-*, etc. This regex matches all of them.
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
