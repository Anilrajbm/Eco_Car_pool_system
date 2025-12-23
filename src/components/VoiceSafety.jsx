import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, AlertTriangle, Shield, Volume2 } from 'lucide-react';

const VoiceSafety = ({ rideId, currentUser }) => {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [sosTriggered, setSosTriggered] = useState(false);
    const [detectedKeywords, setDetectedKeywords] = useState([]);
    const [locationDisplay, setLocationDisplay] = useState(null);
    const locationRef = useRef(null); // Use ref to avoid stale state
    const recognitionRef = useRef(null);
    const sosTimeoutRef = useRef(null);

    const EMERGENCY_KEYWORDS = [
        'help', 'save me', 'saveme', 'stop', 'please no',
        'don\'t touch me', 'leave me', 'emergency',
        'help me', 'helpme', 'someone help', 'call police',
        'danger', 'scared', 'unsafe'
    ];

    // Continuously track location
    useEffect(() => {
        let watchId = null;

        if (isMonitoring && navigator.geolocation) {
            console.log("📍 Starting location tracking...");

            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    locationRef.current = coords; // Store in ref
                    setLocationDisplay(coords); // Update UI
                    console.log("✅ Location updated:", coords.latitude, coords.longitude);
                },
                (error) => {
                    console.error("❌ Location error:", error.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isMonitoring]);

    // Speech Recognition
    useEffect(() => {
        if (!isMonitoring) return;

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech Recognition not supported");
            setIsMonitoring(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            console.log("✅ Voice monitoring STARTED");
        };

        recognition.onend = () => {
            setIsListening(false);
            if (isMonitoring && !sosTriggered) {
                setTimeout(() => {
                    try { recognition.start(); }
                    catch (e) { }
                }, 100);
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') return;
            if (event.error === 'not-allowed') {
                alert("Microphone access denied");
                setIsMonitoring(false);
            }
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join(' ')
                .toLowerCase();

            console.log("🎤 Heard:", transcript);

            const foundKeywords = EMERGENCY_KEYWORDS.filter(kw =>
                transcript.includes(kw.toLowerCase())
            );

            if (foundKeywords.length > 0) {
                console.log("🚨 EMERGENCY:", foundKeywords);
                setDetectedKeywords(foundKeywords);
                triggerSOS(foundKeywords);
            }
        };

        recognitionRef.current = recognition;
        try { recognition.start(); }
        catch (e) { alert("Failed to start: " + e.message); setIsMonitoring(false); }

        return () => {
            if (recognition) {
                try { recognition.stop(); } catch (e) { }
            }
        };
    }, [isMonitoring, sosTriggered]);

    const triggerSOS = (keywords) => {
        if (sosTriggered) return;

        // Use ref to get current location (not stale state)
        const currentLocation = locationRef.current || { latitude: 12.9716, longitude: 77.5946 };

        console.log("🚨 Triggering SOS with location:", currentLocation);

        setSosTriggered(true);

        if (sosTimeoutRef.current) clearTimeout(sosTimeoutRef.current);

        const alertData = {
            rideId,
            userId: currentUser.id,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            keywordsDetected: keywords.join(', ')
        };

        console.log("🚨 SENDING SOS:", alertData);
        console.log("🗺️ Maps:", `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`);

        axios.post('http://localhost:3000/api/triggerSOS', alertData)
            .then(response => {
                console.log("✅ SOS sent:", response.data);
                sosTimeoutRef.current = setTimeout(() => {
                    setSosTriggered(false);
                    setDetectedKeywords([]);
                }, 30000);
            })
            .catch(error => {
                console.error("❌ SOS failed:", error);
                setSosTriggered(false);
            });
    };

    const startMonitoring = () => {
        setIsMonitoring(true);
        setSosTriggered(false);
        setDetectedKeywords([]);
    };

    const stopMonitoring = () => {
        setIsMonitoring(false);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
        if (sosTimeoutRef.current) clearTimeout(sosTimeoutRef.current);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`} />
                    <h3 className="font-bold text-gray-800">Voice Safety</h3>
                </div>
                {isListening && (
                    <div className="flex items-center gap-1 text-green-600 animate-pulse">
                        <Volume2 size={16} />
                        <span className="text-xs font-medium">Listening</span>
                    </div>
                )}
            </div>

            {sosTriggered && (
                <div className="mb-4 bg-red-100 border-2 border-red-500 rounded-lg p-3 animate-pulse">
                    <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                            <p className="font-bold text-sm">🚨 SOS ALERT TRIGGERED</p>
                            <p className="text-xs">Emergency services notified</p>
                            <p className="text-xs mt-1">Keywords: {detectedKeywords.join(', ')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                {isMonitoring ? (
                    <>
                        <p className="font-semibold text-green-700 mb-1">✓ Active Protection</p>
                        <p>Monitoring for emergency keywords. Say "help" to test.</p>
                        {locationDisplay && (
                            <p className="mt-1 text-green-600">📍 Location: {locationDisplay.latitude.toFixed(4)}, {locationDisplay.longitude.toFixed(4)}</p>
                        )}
                    </>
                ) : (
                    <>
                        <p className="font-semibold mb-1">Voice Safety Monitor</p>
                        <p>Enable emergency keyword detection during your ride.</p>
                    </>
                )}
            </div>

            <button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                disabled={sosTriggered}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${isMonitoring
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isMonitoring ? (
                    <>
                        <MicOff size={18} />
                        Stop Monitoring
                    </>
                ) : (
                    <>
                        <Mic size={18} />
                        Start Monitoring
                    </>
                )}
            </button>

            {isMonitoring && !sosTriggered && (
                <button
                    onClick={() => triggerSOS(['manual emergency button'])}
                    className="w-full mt-3 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2 animate-pulse"
                >
                    <AlertTriangle size={20} />
                    🚨 EMERGENCY BUTTON
                </button>
            )}

            {isMonitoring && (
                <div className="mt-3 text-xs text-gray-500">
                    <p className="font-semibold mb-1">Monitored Keywords:</p>
                    <p className="italic">help, saveme, stop, emergency, danger, etc.</p>
                    <p className="mt-2 text-red-600 font-semibold">Or click the Emergency Button above</p>
                </div>
            )}
        </div>
    );
};

export default VoiceSafety;
