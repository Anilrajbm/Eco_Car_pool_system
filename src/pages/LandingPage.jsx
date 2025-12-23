import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Activity } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

                {/* Carpool Option */}
                <div
                    onClick={() => navigate('/login')}
                    className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 group border-2 border-transparent hover:border-green-500"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                            <Car className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Carpool System</h2>
                        <p className="text-gray-600">
                            Join the community to share rides, reduce traffic, and save the environment.
                        </p>
                        <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold group-hover:bg-green-700 transition-colors">
                            Enter Carpool
                        </button>
                    </div>
                </div>

                {/* Emission Test Option */}
                <div
                    onClick={() => navigate('/emission-test')}
                    className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 group border-2 border-transparent hover:border-blue-500"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                            <Activity className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Car Emission Test</h2>
                        <p className="text-gray-600">
                            Check your vehicle's emission levels and ensure compliance with environmental standards.
                        </p>
                        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold group-hover:bg-blue-700 transition-colors">
                            Start Test
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LandingPage;
