import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        has_car: false,
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
            style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2574&auto=format&fit=crop')", // Nature/Leaf background
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

            <div className="relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                <h2 className="text-4xl font-extrabold mb-6 text-center text-white drop-shadow-md">
                    Join EcoRide
                </h2>
                <p className="text-center text-gray-200 mb-8">Start making a difference today</p>

                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-200">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200 outline-none"
                            placeholder="Choose a username"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-200">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200 outline-none"
                            placeholder="Create a password"
                            required
                        />
                    </div>
                    <div className="flex items-center bg-white/10 p-3 rounded-lg border border-white/20">
                        <input
                            type="checkbox"
                            name="has_car"
                            checked={formData.has_car}
                            onChange={handleChange}
                            className="w-5 h-5 text-green-500 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                        />
                        <label className="ml-3 text-sm font-medium text-white cursor-pointer select-none">
                            I have a car and can offer rides
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-[1.02] transition duration-200"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-300">
                    Already have an account? <Link to="/login" className="text-green-300 hover:text-green-200 font-semibold hover:underline">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
