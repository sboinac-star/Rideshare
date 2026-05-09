"use client";

import { useState } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "driver" | "passenger";
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  journeyId: string;
  driverName: string;
  passengerName: string;
  journey: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      journeyId: "journey1",
      driverName: "John Smith",
      passengerName: "Alice Johnson",
      journey: "Fayetteville → Bentonville",
      lastMessage: "Hi John, I'm interested in your ride tomorrow. What time do you leave?",
      lastMessageTime: "2 hours ago",
      unreadCount: 2,
      messages: [
        {
          id: "1",
          sender: "passenger",
          senderName: "Alice Johnson",
          content: "Hi John, I'm interested in your ride tomorrow. What time do you leave?",
          timestamp: "2 hours ago",
          read: false,
        },
        {
          id: "2",
          sender: "driver",
          senderName: "John Smith",
          content: "Hi Alice! I leave at 2:30 PM from the Fayetteville Square. How many seats do you need?",
          timestamp: "1 hour ago",
          read: false,
        },
        {
          id: "3",
          sender: "passenger",
          senderName: "Alice Johnson",
          content: "Just one seat please. What's your rate?",
          timestamp: "30 min ago",
          read: true,
        },
      ],
    },
    {
      id: "2",
      journeyId: "journey2",
      driverName: "Sarah Johnson",
      passengerName: "Bob Wilson",
      journey: "Rogers → Little Rock",
      lastMessage: "Thanks for the ride! Safe travels.",
      lastMessageTime: "1 day ago",
      unreadCount: 0,
      messages: [
        {
          id: "4",
          sender: "passenger",
          senderName: "Bob Wilson",
          content: "Hi Sarah, can you pick me up from the Rogers Walmart?",
          timestamp: "2 days ago",
          read: true,
        },
        {
          id: "5",
          sender: "driver",
          senderName: "Sarah Johnson",
          content: "Sure, Bob! I'll be there at 8:45 AM. We should arrive in Little Rock around 11:30 AM.",
          timestamp: "2 days ago",
          read: true,
        },
        {
          id: "6",
          sender: "passenger",
          senderName: "Bob Wilson",
          content: "Thanks for the ride! Safe travels.",
          timestamp: "1 day ago",
          read: true,
        },
      ],
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const message: Message = {
      id: String(Date.now()),
      sender: "driver", // In a real app, this would be based on logged-in user
      senderName: "You",
      content: newMessage,
      timestamp: "Just now",
      read: true,
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: newMessage,
      lastMessageTime: "Just now",
    };

    setConversations(conversations.map(conv =>
      conv.id === selectedConversation.id ? updatedConversation : conv
    ));

    setSelectedConversation(updatedConversation);
    setNewMessage("");
  };

  const markAsRead = (conversationId: string) => {
    setConversations(conversations.map(conv =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Browse Journeys
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    markAsRead(conversation.id);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {conversation.journey}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {conversation.passengerName}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="p-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.journey}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Chat with {selectedConversation.passengerName}
                  </p>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "driver" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender === "driver"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-6xl text-gray-300 mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}