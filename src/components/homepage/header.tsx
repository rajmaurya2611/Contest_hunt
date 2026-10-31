
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer } from "antd";
import {
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const HeaderComponent: React.FC = () => {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Contests", to: "/contests" },
    { label: "Hackathons", to: "/hackathons" },
    { label: "Bug Bounties", to: "/bug-bounties" },
  ];

  const handleNavigation = () => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[#020202] shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 sm:px-8 md:px-12 lg:px-12">

          {/* Logo */}
          <Link
            to="/"
            onClick={handleNavigation}
            className="flex items-center gap-2"
          >
            <img
              src="/white contest-hunt.png"
              alt="ContestHunt Logo"
              className="h-8 w-8 object-contain"
            />

            <span className="text-2xl font-bold font-rubik text-white">
              Contest
              <span className="text-purple-500">
                Hunt
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 pr-12">
            {navItems.map((item) => {
              const isActive = pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavigation}
                  className={`px-3 py-2 text-sm relative transition-colors duration-200 ${
                    isActive
                      ? "text-white font-bold"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}

                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-[-4px] h-[2px] bg-purple-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden text-white hover:text-purple-400 transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          >
            <MenuOutlined style={{ fontSize: 24 }} />
          </button>
        </div>
      </header>

      {/* Dark Mobile Drawer */}
      <Drawer
        title={
          <span className="text-white text-xl font-bold font-rubik">
            Contest
            <span className="text-purple-500">
              Hunt
            </span>
          </span>
        }
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="min(320px, 85vw)"
        closable={false}
        extra={
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="text-white hover:text-purple-400 transition-colors"
            aria-label="Close navigation"
          >
            <CloseOutlined style={{ fontSize: 20 }} />
          </button>
        }
        style={{
          backgroundColor: "#020202",
          color: "#ffffff",
        }}
        styles={{
          header: {
            backgroundColor: "#020202",
            borderBottom: "1px solid #262626",
            padding: "20px 24px",
          },
          body: {
            backgroundColor: "#020202",
            padding: "24px 16px",
          },
          mask: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
      >
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive = pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleNavigation}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-purple-500/10 text-purple-400 border-l-[3px] border-purple-500"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-gray-800 pt-5 text-center">
          <p className="text-xs text-gray-500">
            Discover. Compete. Win.
          </p>
        </div>
      </Drawer>
    </>
  );
};

export default HeaderComponent;
