import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useListMessages, useSendMessage, useMarkMessagesRead } from "@workspace/api-client-react";
import { getListMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // If user is not logged in or is an admin, do not render chat widget
  if (!user || user.role === "admin") {
    return null;
  }

  // Poll for messages with the admin
  const { data: messages = [] } = useListMessages(undefined, {
    query: {
      refetchInterval: 3000,
      enabled: !!user,
      queryKey: getListMessagesQueryKey(),
    },
  });

  const sendMessageMutation = useSendMessage();
  const markMessagesReadMutation = useMarkMessagesRead();

  // Calculate unread count (messages sent to me that are unread)
  const unreadCount = messages.filter((m) => m.receiverId === user.id && !m.read).length;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen || messages.length) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Mark messages as read when opening the widget
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markMessagesReadMutation.mutate(
        { data: {} },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
          },
        }
      );
    }
  }, [isOpen, unreadCount, messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText("");

    sendMessageMutation.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
          scrollToBottom();
        },
      }
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Panel */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[480px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 opacity-100 origin-bottom-right">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <div>
                <h3 className="font-semibold text-sm">MedSupply Support</h3>
                <p className="text-[10px] text-indigo-200">Typically replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                <MessageSquare size={32} className="text-gray-300" />
                <p className="text-xs">Have questions? Send a message to our support team.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs shadow-sm ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          isMe ? "text-indigo-200" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-gray-200 bg-white flex items-center space-x-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-100 hover:bg-gray-200/70 focus:bg-white text-xs border-0 focus:ring-2 focus:ring-indigo-600 rounded-xl px-4 py-2.5 transition-all outline-none"
              disabled={sendMessageMutation.isPending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2.5 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 relative"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
