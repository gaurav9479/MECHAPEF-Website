const fs = require('fs');
const path = require('path');

const dir = 'Client/src/Pages/Admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip AdminLayout if it exists
  if (file === 'AdminLayout.jsx') return;

  // Ensure useAuth and useNavigate are imported
  if (!content.includes('useAuth')) {
    content = content.replace("import { Link } from 'react-router-dom';", "import { Link, useNavigate } from 'react-router-dom';\nimport { useAuth } from '../../context/AuthContext';");
  }

  // Add handleLogout if not exists
  if (!content.includes('handleLogout')) {
    // Find the first line of the component function
    const funcMatch = content.match(/const Admin\w+ = \(\) => {/);
    if (funcMatch) {
      const inject = `
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
`;
      content = content.replace(funcMatch[0], funcMatch[0] + inject);
    }
  }

  // Add the logout button to sidebar-bottom
  if (!content.includes('<button onClick={handleLogout} className="sidebar-logout"')) {
    // Replace the old logout button or just add it
    if (content.includes('<button className="sidebar-logout"')) {
      content = content.replace('<button className="sidebar-logout"><FaSignOutAlt /> Logout</button>', '<button onClick={handleLogout} className="sidebar-logout"><FaSignOutAlt /> Logout</button>');
    } else {
      // Find sidebar-bottom and append it
      content = content.replace(
        '<div className="sidebar-bottom">\n          <Link to="/" className="sidebar-link"><FaHome /> View Site</Link>',
        '<div className="sidebar-bottom">\n          <Link to="/" className="sidebar-link"><FaHome /> View Site</Link>\n          <button onClick={handleLogout} className="sidebar-logout"><FaSignOutAlt /> Logout</button>'
      );
    }
  }

  // Ensure FaSignOutAlt is imported
  if (!content.includes('FaSignOutAlt')) {
    content = content.replace("FaHome", "FaHome, FaSignOutAlt");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
});
