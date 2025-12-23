import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to fit map bounds
const FitBounds = ({ routes }) => {
    const map = useMap();
    useEffect(() => {
        if (routes.length > 0 && routes[0].path.length > 0) {
            const bounds = L.latLngBounds(routes.flatMap(r => r.path));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [routes, map]);
    return null;
};

const RideMap = ({ src, dst }) => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we would geocode src/dst names to lat/lng first.
        // For this demo, we'll use fixed coordinates for Whitefield -> Kengeri if names match,
        // or fallback to generic ones.

        // Mock geocoding for demo purpose
        const srcCoords = { lat: 12.9698, lng: 77.7500 }; // Whitefield
        const dstCoords = { lat: 12.9177, lng: 77.4833 }; // Kengeri

        axios.get(`http://localhost:3000/api/getRoute?srcLat=${srcCoords.lat}&srcLng=${srcCoords.lng}&dstLat=${dstCoords.lat}&dstLng=${dstCoords.lng}`)
            .then(res => {
                setRoutes(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [src, dst]);

    if (loading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">Loading Map...</div>;

    return (
        <div className="h-96 w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
            <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {routes.map((route, idx) => (
                    <React.Fragment key={route.id}>
                        <Polyline
                            positions={route.path}
                            color={route.is_recommended ? '#16a34a' : '#9ca3af'}
                            weight={route.is_recommended ? 6 : 4}
                            opacity={route.is_recommended ? 1 : 0.6}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <h3 className="font-bold">{route.summary}</h3>
                                    <p>AQI: <span className={route.aqi_avg < 100 ? 'text-green-600' : 'text-red-600'}>{route.aqi_avg}</span></p>
                                    <p>Traffic: {route.traffic_level}%</p>
                                    {route.is_recommended && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1 inline-block">Recommended</span>}
                                </div>
                            </Popup>
                        </Polyline>
                    </React.Fragment>
                ))}

                <FitBounds routes={routes} />
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-[1000] text-sm">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-1 bg-green-600 rounded"></div>
                    <span>Eco-Friendly Route</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-gray-400 rounded"></div>
                    <span>Standard Route</span>
                </div>
            </div>
        </div>
    );
};

export default RideMap;
