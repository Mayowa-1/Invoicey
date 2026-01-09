/**
 * Layout Component - Main application layout with navigation
 * 
 * Includes logout functionality for authenticated users
 */

import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/invoices', icon: FileText, label: 'Invoices' },
];

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
                <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-800">
                    <Logo />
                </div>
                <nav className="mt-6 px-3">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                        }`
                                    }
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                
                {/* User section with logout */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
                <Logo />
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white transition-transform duration-300 ease-in-out dark:bg-slate-900 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                    <Logo />
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="mt-6 px-3">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                        }`
                                    }
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                
                {/* Mobile user section with logout */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="pt-16 lg:pl-64 lg:pt-0">
                <div className="min-h-screen">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
