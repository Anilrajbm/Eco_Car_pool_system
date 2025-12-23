import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const containerStyle = {
    width: '100%',
    height: '600px'
};

const center = {
    lat: 12.9716,
    lng: 77.5946 // Bangalore Center
};

// API Key from Environment Variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

// Define libraries outside component to avoid re-renders
const LIBRARIES = ['places'];

const MapRoute = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES
    });

    const location = useLocation();
    const [map, setMap] = useState(null);
    const [routesData, setRoutesData] = useState([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [locationsList, setLocationsList] = useState([]);

    // Fetch locations to resolve names to coords
    useEffect(() => {
        axios.get('http://localhost:3000/api/locations')
            .then(res => setLocationsList(res.data))
            .catch(err => console.error("Error fetching locations:", err));
    }, []);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Fetch Routes from Backend (which has the Real-time Sensor Data)
    useEffect(() => {
        if (isLoaded && map && location.state && locationsList.length > 0) {
            const { src, dst } = location.state;
            const srcLoc = locationsList.find(l => l.name === src);
            const dstLoc = locationsList.find(l => l.name === dst);

            if (srcLoc && dstLoc) {
                console.log("📍 Fetching routes from:", srcLoc.name, "to", dstLoc.name);
                console.log("   Coordinates:", srcLoc.lat, srcLoc.lng, "→", dstLoc.lat, dstLoc.lng);

                // Call our backend to get routes with injected hardware data
                axios.get(`http://localhost:3000/api/getRoute?srcLat=${srcLoc.lat}&srcLng=${srcLoc.lng}&dstLat=${dstLoc.lat}&dstLng=${dstLoc.lng}`)
                    .then(res => {
                        console.log("✅ Routes received:", res.data.length, "routes");
                        console.log("   Route data:", res.data);

                        const routes = res.data.map((r, i) => ({
                            ...r,
                            // Ensure we have a consistent structure for the UI
                            trafficDensity: r.traffic_level > 50 ? 'High' : 'Low',
                            aqi: r.aqi_avg,
                            ecoScore: r.eco_score,
                            isRecommended: r.is_recommended
                        }));

                        console.log("   Processed routes:", routes);
                        setRoutesData(routes);

                        // Find recommended index
                        const recIndex = routes.findIndex(r => r.is_recommended);
                        setSelectedRouteIndex(recIndex >= 0 ? recIndex : 0);
                        console.log("   Recommended route index:", recIndex);

                        // Fit bounds to show all routes
                        if (routes.length > 0 && routes[0].path && routes[0].path.length > 0) {
                            console.log("   Fitting map bounds to routes");
                            const bounds = new window.google.maps.LatLngBounds();
                            routes.forEach(route => {
                                if (Array.isArray(route.path)) {
                                    route.path.forEach(point => bounds.extend(point));
                                } else {
                                    console.warn("   Route path is not an array:", route.path);
                                }
                            });
                            map.fitBounds(bounds);
                        } else {
                            console.warn("⚠️ No route paths found!");
                        }
                    })
                    .catch(err => {
                        console.error("❌ Error fetching routes:", err);
                        console.error("   Error details:", err.response?.data || err.message);
                    });
            } else {
                console.warn("⚠️ Could not find locations:", { src, dst, srcLoc, dstLoc });
            }
        }
    }, [isLoaded, map, location.state, locationsList]);

    if (!isLoaded) return <div className="p-10 text-center">Loading Google Maps...</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-primary">Eco-Friendly Route Planner</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 card p-0 overflow-hidden h-[600px]">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={12}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false
                        }}
                    >
                        {/* Render only the eco-recommended route */}
                        {routesData
                            .filter(route => route.isRecommended && Array.isArray(route.path) && route.path.length > 0)
                            .map((route, index) => (
                                <React.Fragment key={index}>
                                    <Polyline
                                        path={route.path}
                                        options={{
                                            strokeColor: "#10B981", // Green for eco-friendly
                                            strokeOpacity: 0.8,
                                            strokeWeight: 6,
                                            zIndex: 100,
                                            geodesic: true
                                        }}
                                    />
                                </React.Fragment>
                            ))}
                    </GoogleMap>
                </div>

                <div className="flex flex-col gap-4 h-[600px] overflow-y-auto">
                    <div className="card bg-green-50 border-green-200">
                        <h3 className="font-bold text-lg mb-2 text-green-800">🌱 Recommended Path</h3>
                        <p className="text-sm text-green-700">
                            Based on real-time sensor data, Route 1 has the best Air Quality and lowest traffic density.
                        </p>
                    </div>

                    {routesData.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <h3 className="font-bold text-lg">Available Routes</h3>
                            {routesData.map((route, index) => (
                                <div
                                    key={index}
                                    className={`card p-4 cursor-pointer border-2 transition-all ${index === selectedRouteIndex ? 'border-blue-500 shadow-md' : 'border-transparent'
                                        } ${route.isRecommended ? 'bg-green-50 border-green-500' : ''}`}
                                    onClick={() => setSelectedRouteIndex(index)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800">{route.summary || `Route ${index + 1}`}</h4>
                                        {route.isRecommended && <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded font-bold">Best Choice</span>}
                                    </div>
                                    <div className="mt-3 text-sm grid grid-cols-2 gap-y-2 gap-x-4">
                                        <p className="flex items-center gap-1">🕒 {route.duration}</p>
                                        <p className="flex items-center gap-1">📏 {route.distance}</p>
                                        <p className={`flex items-center gap-1 font-semibold ${route.aqi < 100 ? 'text-green-600' : 'text-red-500'}`}>
                                            🌫️ AQI: {route.aqi}
                                        </p>
                                        <p className="flex items-center gap-1">
                                            🚗 Traffic: <span className={route.trafficDensity === 'Low' ? 'text-green-600' : 'text-red-500'}>{route.trafficDensity}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 mt-10">
                            Select a route from the "Find Ride" page to see analysis.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapRoute;
