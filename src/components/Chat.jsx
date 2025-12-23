import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageSquare } from 'lucide-react';
import VoiceSafety from './VoiceSafety';

const Chat = ({ rideId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = () => {
            axios.get(`http://localhost:3000/api/messages?rideId=${rideId}`)
                .then(res => {
                    setMessages(res.data);
                })
                .catch(err => console.error("Error fetching messages:", err));
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [rideId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        axios.post('http://localhost:3000/api/messages', {
            rideId,
            userId: currentUser.id,
            content: newMessage
        })
            .then(() => {
                setNewMessage('');
                // Optimistically add message or wait for poll
                // For simplicity, we wait for next poll or trigger immediate fetch if we wanted
                // But let's just append it locally for instant feedback
                const optimisticMsg = {
                    id: Date.now(),
                    user_id: currentUser.id,
                    username: currentUser.username,
                    content: newMessage,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, optimisticMsg]);
            })
            .catch(err => {
                console.error("Error sending message:", err);
                alert("Failed to send message. Is the backend server running and restarted?");
            });
    };

    return (
        <div className="flex gap-4 w-full">
            {/* Voice Safety Panel - Left Side */}
            <div className="w-80 flex-shrink-0">
                <VoiceSafety rideId={rideId} currentUser={currentUser} />
            </div>

            {/* Chat Panel - Right Side */}
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[500px]">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl flex items-center gap-2">
                    <MessageSquare className="text-primary" size={20} />
                    <h3 className="font-bold text-gray-800">Ride Chat</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.user_id === currentUser.id;
                            return (
                                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                        }`}>
                                        {!isMe && <p className="text-xs font-bold mb-1 text-primary">{msg.username}</p>}
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-xl flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-primary hover:bg-green-700 text-white p-2 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
