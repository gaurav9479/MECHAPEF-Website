const fs = require('fs');
const path = require('path');

const dir = 'Client/src/Pages/Admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'AdminLayout.jsx');

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add the link if it doesn't exist
  if (!content.includes('/admin/management')) {
    // Find the end of the nav block
    content = content.replace(
      '<Link to="/admin/sponsors" className="sidebar-link"><FaHandshake /> Sponsors</Link>',
      '<Link to="/admin/sponsors" className="sidebar-link"><FaHandshake /> Sponsors</Link>\n          <Link to="/admin/management" className="sidebar-link"><FaCog /> Management</Link>'
    );
    
    // Ensure FaCog is imported from react-icons/fa
    if (!content.includes('FaCog')) {
      content = content.replace("FaSignOutAlt } from", "FaSignOutAlt, FaCog } from");
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added link to', file);
});
