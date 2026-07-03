import React from "react";
import TopNavbar from "./TopNavbar";
import MagazineSidebar from "./MagazineSidebar";
import "./Navbar.css";

const Navbar = ({ variant }) => {
  if (variant === "vertical") {
    return <MagazineSidebar />;
  }
  
  return <TopNavbar />;
};

export default Navbar;