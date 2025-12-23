import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [sensorData, setSensorData] = useState([]);

    useEffect(() => {
        const fetchData = () => {
            axios.get('http://localhost:3000/api/sensor')
                .then(res => {
                    // Format data for chart
                    const formatted = res.data.map(d => ({
                        time: new Date(d.timestamp).toLocaleTimeString(),
                        aqi: d.aqi,
                        vehicles: d.vehicle_count
                    })).reverse();
                    setSensorData(formatted);
                })
                .catch(err => console.error(err));
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-primary">Live Environmental Dashboard</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <h3 className="text-xl font-bold mb-4">Air Quality Index (AQI)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="aqi" stroke="#F59E0B" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-xl font-bold mb-4">Traffic Density (Vehicle Count)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="vehicles" stroke="#0EA5E9" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
