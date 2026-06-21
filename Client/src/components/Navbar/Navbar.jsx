import { FaCog } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        <FaCog className="logo-icon" />
        <div className="logo-text">
          <div className="logo-main">Mecha<span>PEF</span></div>
          <div className="logo-sub">MNNIT</div>
        </div>
      </div>

      <ul>
        <li className="active">Home</li>
        <li>About</li>
        <li>Events</li>
        <li>Gallery</li>
        <li>Our Team</li>
        <li>Our Sponsors</li>
      </ul>

      <button className="contact-btn">Contact Us</button>
    </nav>
  );
};

export default Navbar;