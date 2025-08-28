import React from 'react';
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer } from "antd";
import { MenuOutlined } from "@ant-design/icons";

/**
 * HeaderComponent
 * A transparent header with a logo on the left.
 */
const HeaderComponent: React.FC = () => {
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navItems = [
        { label: "Home", to: "/" },
        { label: "All Products", to: "/products" },
    ];

    const linkBase =
        "px-3 py-2 text-sm font-regular transition-colors duration-200 relative";

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-[#020202] shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 sm:px-8 md:px-12 lg:px-12">
                    {/* Logos */}
                    <div className="flex items-center space-x-4">
                        <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                            <h1 className='text-2xl font-bold font-rubik text-white'>Contest<span className='text-purple-500'>Hunt</span></h1>
                        </Link>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center space-x-4 pr-12">
                        {navItems.map((item) => {
                            const isActive = pathname === item.to;
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => window.scrollTo(0, 0)}
                                    className={`${linkBase} ${
                                        isActive
                                            ? "text-white font-bold"
                                            : "text-white hover:text-white-600"
                                    }`}
                                >
                                    {item.label}
                                    {isActive && <span className="absolute left-0 right-0 bottom-[-4px] h-[2px] bg-white"></span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-gray-700"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open navigation"
                    >
                        <MenuOutlined style={{ fontSize: 24 }} />
                    </button>
                </div>
            </header>

            {/* Mobile drawer */}
            <Drawer
                title="Menu"
                placement="right"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
            >
                <nav className="flex flex-col space-y-4 mt-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.to;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => {
                                    setDrawerOpen(false);
                                    window.scrollTo(0, 0);
                                }}
                                className={`${linkBase} ${
                                    isActive
                                        ? "text-blue-600 font-bold"
                                        : "text-gray-700 hover:text-blue-600"
                                }`}
                            >
                                {item.label}
                                {isActive && <span className="absolute left-0 right-0 bottom-[-4px] h-[2px] bg-blue-600"></span>}
                            </Link>
                        );
                    })}
                </nav>
            </Drawer>
        </>
    );
};

export default HeaderComponent;
