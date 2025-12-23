import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <h1 className="text-5xl font-bold text-primary mb-6">EcoRide Bangalore</h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-8">
                Join the movement for a cleaner Bangalore. Find carpools, check real-time pollution levels, and choose eco-friendly routes.
            </p>
            <div className="flex gap-4">
                <Link to="/app/find-ride" className="btn-primary text-lg px-8 py-3">Find a Ride</Link>
                <Link to="/app/map" className="btn-secondary text-lg px-8 py-3">View Live Map</Link>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                <div className="card">
                    <h3 className="text-xl font-bold mb-2 text-primary">Real-time AQI</h3>
                    <p>Live pollution monitoring from IoT sensors across the city.</p>
                </div>
                <div className="card">
                    <h3 className="text-xl font-bold mb-2 text-primary">Smart Routing</h3>
                    <p>Get route recommendations that minimize your carbon footprint.</p>
                </div>
                <div className="card">
                    <h3 className="text-xl font-bold mb-2 text-primary">Community</h3>
                    <p>Connect with verified drivers and riders to reduce traffic.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
