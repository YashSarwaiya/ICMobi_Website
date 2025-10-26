/* eslint-disable no-unused-vars */
import React from "react";
import "../styles/responsive.css";

/**
 * ResponsiveLayout - A wrapper component that handles responsive padding for sidebar
 * @param {boolean} hasSidebar - Whether the page has a sidebar
 * @param {React.ReactNode} children - Child components
 */
const ResponsiveLayout = ({ hasSidebar = false, children }) => {
  const layoutStyle = {
    paddingLeft: hasSidebar ? "250px" : "0",
    paddingTop: "100px",
    transition: "padding-left 0.3s ease",
    minHeight: "calc(100vh - 100px)",
  };

  // Media query for mobile
  const mobileStyle = {
    "@media (max-width: 768px)": {
      paddingLeft: "0",
      paddingTop: "90px",
    },
  };

  return (
    <div className="responsive-layout" style={layoutStyle}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;
