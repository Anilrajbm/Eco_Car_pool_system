import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Car, Map as MapIcon, Activity, Users, ShieldAlert } from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-primary text-white shadow-lg">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                        <Car className="w-8 h-8" />
                        EcoRide Bangalore
                    </Link>
                    <div className="flex gap-6 items-center">
                        <Link to="/app/find-ride" className="flex items-center gap-1 hover:text-teal-200"><MapIcon size={18} /> Map & Routes</Link>

                        <Link to="/app/dashboard" className="flex items-center gap-1 hover:text-teal-200"><Activity size={18} /> Live Dashboard</Link>

                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
            <main className="flex-grow container mx-auto px-4 py-8">
                <Outlet />
            </main>
            <footer className="bg-gray-800 text-gray-400 py-6 text-center">
                <p>&copy; 2025 EcoRide Bangalore. Sustainable Urban Mobility.</p>
            </footer>
        </div>
    );
};

export default Layout;
