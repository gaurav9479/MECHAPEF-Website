import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">MECHAPEF</div>

      <ul>
        <li>Home</li>
        <li>About</li>
        <li>Domains</li>
        <li>Events</li>
        <li>Team</li>
      </ul>

      <button>Join Us</button>
    </nav>
  );
};

export default Navbar;