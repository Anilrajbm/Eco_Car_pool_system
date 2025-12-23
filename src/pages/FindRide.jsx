import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, ArrowRight, Users, Clock, PlusCircle, CheckCircle, MessageCircle } from 'lucide-react';
import RideMap from '../components/RideMap';
import Chat from '../components/Chat';

const FindRide = () => {
    const [locations, setLocations] = useState([]);
    const [rides, setRides] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [activeRide, setActiveRide] = useState(null); // Track joined/offered ride
    const navigate = useNavigate();

    // Offer Ride State
    const [showOfferForm, setShowOfferForm] = useState(false);
    const [offerData, setOfferData] = useState({ time: '', capacity: 3 });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);

        axios.get('http://localhost:3000/api/locations')
            .then(res => setLocations(res.data))
            .catch(err => console.error(err));
    }, []);

    const communityRoutes = [
        { id: 1, src: 'Whitefield', dst: 'Kengeri', time: '1h 45m' },
        { id: 2, src: 'BMS College Road (Demo Zone)', dst: 'Banashankari', time: '25m' },
        { id: 3, src: 'Electronic City', dst: 'Indiranagar', time: '55m' },
        { id: 4, src: 'Hebbal', dst: 'MG Road', time: '40m' },
        { id: 5, src: 'Yelahanka', dst: 'Malleshwaram', time: '45m' },
        { id: 6, src: 'Koramangala', dst: 'Whitefield', time: '50m' },
        { id: 7, src: 'Jayanagar', dst: 'Electronic City', time: '1h 10m' },
    ];

    const fetchRides = (srcId, dstId) => {
        setLoading(true);
        axios.get(`http://localhost:3000/api/community?src=${srcId}&dst=${dstId}`)
            .then(res => {
                setRides(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleRouteSelect = (route) => {
        setSelectedRoute(route);
        setShowOfferForm(false);
        setActiveRide(null);

        const srcLoc = locations.find(l => l.name === route.src);
        const dstLoc = locations.find(l => l.name === route.dst);

        if (srcLoc && dstLoc) {
            fetchRides(srcLoc.id, dstLoc.id);
        }
    };

    const handleNavigateToMap = () => {
        if (selectedRoute) {
            navigate('/app/map', { state: { src: selectedRoute.src, dst: selectedRoute.dst } });
        }
    };

    const handleOfferRide = (e) => {
        e.preventDefault();
        if (!user || !selectedRoute) return;

        const srcLoc = locations.find(l => l.name === selectedRoute.src);
        const dstLoc = locations.find(l => l.name === selectedRoute.dst);

        axios.post('http://localhost:3000/api/createRideOffer', {
            owner: user.username,
            src_id: srcLoc.id,
            dst_id: dstLoc.id,
            capacity: parseInt(offerData.capacity),
            time: offerData.time
        })
            .then(() => {
                setShowOfferForm(false);
                fetchRides(srcLoc.id, dstLoc.id); // Refresh list
                setActiveRide({ type: 'offered', route: selectedRoute });
                alert('Ride offered successfully!');
            })
            .catch(err => alert('Failed to offer ride'));
    };

    const handleJoinRide = (rideId) => {
        if (!user) return alert('Please login to join a ride');

        axios.post('http://localhost:3000/api/joinRide', {
            rideId,
            userId: user.id
        })
            .then(() => {
                alert('Joined ride successfully!');
                const srcLoc = locations.find(l => l.name === selectedRoute.src);
                const dstLoc = locations.find(l => l.name === selectedRoute.dst);
                fetchRides(srcLoc.id, dstLoc.id);
                setActiveRide({ type: 'joined', id: rideId, route: selectedRoute });
            })
            .catch(err => alert(err.response?.data?.error || 'Failed to join ride'));
    }; // Fixed join ride handler

    const [chatRideId, setChatRideId] = useState(null);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-primary flex items-center gap-2">
                <MapPin className="w-8 h-8" /> Find a Ride
            </h2>
            <p className="text-gray-600 mb-8">Select a popular route to find carpooling options or view the route map.</p>

            {/* Route Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {communityRoutes.map(route => (
                    <div
                        key={route.id}
                        onClick={() => handleRouteSelect(route)}
                        className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${selectedRoute?.id === route.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                <MapPin size={18} className="text-green-600" />
                                <span className="truncate">{route.src}</span>
                            </div>
                            <ArrowRight size={18} className="text-gray-400" />
                            <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                <MapPin size={18} className="text-red-500" />
                                <span className="truncate">{route.dst}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>Avg. Time: {route.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Results Section */}
            {selectedRoute && (
                <div className="animate-fade-in">
                    {/* Navigation Button to Map */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-blue-800 text-lg">Want to see the route details?</h3>
                            <p className="text-blue-600 text-sm">View real-time traffic, AQI, and eco-friendly paths for this route.</p>
                        </div>
                        <button
                            onClick={handleNavigateToMap}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-transform transform hover:scale-105 flex items-center gap-2"
                        >
                            <MapPin size={20} /> View Route on Map
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">
                            Available Rides: <span className="text-green-600">{selectedRoute.src}</span> to <span className="text-green-600">{selectedRoute.dst}</span>
                        </h3>
                        {user?.has_car && (
                            <button
                                onClick={() => setShowOfferForm(!showOfferForm)}
                                className="flex items-center gap-2 bg-primary hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <PlusCircle size={18} /> Offer a Ride
                            </button>
                        )}
                    </div>

                    {/* Offer Ride Form */}
                    {showOfferForm && (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-8 animate-slide-down">
                            <h4 className="font-bold text-lg mb-4 text-green-800">Offer a Ride on this Route</h4>
                            <form onSubmit={handleOfferRide} className="flex gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Departure Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={offerData.time}
                                        onChange={e => setOfferData({ ...offerData, time: e.target.value })}
                                        className="p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Available Seats</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="6"
                                        required
                                        value={offerData.capacity}
                                        onChange={e => setOfferData({ ...offerData, capacity: e.target.value })}
                                        className="p-2 border rounded-lg w-24 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                    Post Ride
                                </button>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading rides...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rides.length > 0 ? rides.map(ride => (
                                <div key={ride.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{ride.owner}</h3>
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle size={12} /> Verified
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="flex items-center gap-2"><Clock size={14} /> Departure: {ride.time}</p>
                                        <p className="flex items-center gap-2"><Users size={14} /> {ride.capacity} seats available</p>
                                    </div>
                                    {user?.username !== ride.owner && (
                                        <button
                                            onClick={() => handleJoinRide(ride.id)}
                                            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Request to Join
                                        </button>
                                    )}

                                    {(user?.username === ride.owner || (activeRide?.type === 'joined' && activeRide?.id === ride.id)) && (
                                        <button
                                            onClick={() => setChatRideId(ride.id)}
                                            className="mt-2 w-full border border-primary text-primary hover:bg-green-50 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle size={18} /> Open Chat
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <div className="col-span-2 bg-gray-50 p-8 rounded-xl text-center border border-dashed border-gray-300">
                                    <p className="text-gray-500">No active rides found for this route right now.</p>
                                    {user?.has_car && <p className="text-sm text-green-600 mt-2">You can be the first to offer one!</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Chat Modal/Overlay */}
            {chatRideId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-5xl">{/* Increased from max-w-md */}
                        <button
                            onClick={() => setChatRideId(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-200 font-bold"
                        >
                            Close
                        </button>
                        <Chat rideId={chatRideId} currentUser={user} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindRide;
