import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Ban, Activity } from 'lucide-react';
import axios from 'axios';

const EmissionTest = () => {
    const navigate = useNavigate();
    const [vehicleNo, setVehicleNo] = useState('KA 55 EA 9089');
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        let interval;
        if (isMonitoring) {
            interval = setInterval(async () => {
                try {
                    const response = await axios.post('http://localhost:3000/api/checkEmission', { vehicleNo });
                    setLogs(prev => [response.data, ...prev].slice(0, 5)); // Keep last 5 logs
                } catch (error) {
                    console.error("Error checking emission:", error);
                }
            }, 3000); // Check every 3 seconds
        }
        return () => clearInterval(interval);
    }, [isMonitoring, vehicleNo]);

    const toggleMonitoring = () => {
        setIsMonitoring(!isMonitoring);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
            >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </button>

            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Emission Test Center</h1>
                        <p className="text-blue-100 mt-1">Continuous IoT Monitoring</p>
                    </div>
                    {isMonitoring && (
                        <div className="flex items-center animate-pulse">
                            <Activity className="w-6 h-6 mr-2" />
                            <span className="font-mono text-sm">LIVE</span>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                            <input
                                type="text"
                                value={vehicleNo}
                                onChange={(e) => setVehicleNo(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Owner Details</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">Anil raj B M</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium">9113699158</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={toggleMonitoring}
                        className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-lg ${isMonitoring
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {isMonitoring ? 'STOP MONITORING' : 'START CONTINUOUS MONITORING'}
                    </button>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Live Sensor Logs</h3>
                        {logs.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                No data received yet. Start monitoring to see live updates.
                            </div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className={`p-4 rounded-xl border-l-4 shadow-sm transition-all ${log.status === 'Pass' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {log.status === 'Pass' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : log.isBlocked ? (
                                                <Ban className="w-5 h-5 text-red-600" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            )}
                                            <div>
                                                <span className="font-bold text-gray-800 mr-2">AQI: {log.aqi}</span>
                                                <span className={`text-sm ${log.status === 'Pass' ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                    {log.status === 'Pass' ? 'Normal' : log.action.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        {log.status !== 'Pass' && (
                                            <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-gray-500">
                                                {log.fineAmount > 0 ? `Fine: ₹${log.fineAmount}` : 'Warning Sent'}
                                            </span>
                                        )}
                                    </div>
                                    {log.status !== 'Pass' && (
                                        <p className="text-xs text-gray-500 mt-2 ml-8">
                                            {log.message}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmissionTest;
