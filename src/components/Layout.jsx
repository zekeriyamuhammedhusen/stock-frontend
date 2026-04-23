    import React, { useEffect, useState } from 'react';
    import Navbar from './Navbar';
    import Sidebar from '../pages/Sidebar';

    function Layout({ children }) {
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);

        useEffect(() => {
            document.body.style.overflow = isSidebarOpen ? 'hidden' : '';

            return () => {
                document.body.style.overflow = '';
            };
        }, [isSidebarOpen]);

    return (
            <div className="min-h-screen bg-slate-100">
            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close menu overlay"
                    className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <Sidebar isMobileOpen={isSidebarOpen} onNavigate={() => setIsSidebarOpen(false)} />
            <div className="min-h-screen flex flex-col md:ml-64">
                <Navbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
                <main className="flex-1 px-4 py-6 pt-24 sm:px-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
    }

    export default Layout;