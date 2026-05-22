import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useListMessageThreads,
  useListMessages,
  useSendMessage,
  useMarkMessagesRead,
  getListMessagesQueryKey,
  getListMessageThreadsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Send, MessageSquare, ShieldAlert, Circle, User } from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "User Verification", href: "/admin/users" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Stock Count", href: "/admin/stock-count" },
  { label: "All Users", href: "/admin/all-users" },
  { label: "Chats", href: "/admin/chats" },
];

export default function AdminChats() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll chat threads
  const { data: threads = [], isLoading: loadingThreads } = useListMessageThreads({
    query: {
      refetchInterval: 3000,
      queryKey: getListMessageThreadsQueryKey(),
    },
  });

  // Get active selected thread details
  const selectedThread = threads.find((t) => t.user.id === selectedUserId);

  // Poll messages for active user
  const { data: messages = [] } = useListMessages(
    selectedUserId ? { otherUserId: selectedUserId } : undefined,
    {
      query: {
        enabled: selectedUserId !== null,
        refetchInterval: 3000,
        queryKey: getListMessagesQueryKey(selectedUserId ? { otherUserId: selectedUserId } : undefined),
      },
    }
  );

  const sendMessageMutation = useSendMessage();
  const markMessagesReadMutation = useMarkMessagesRead();

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length || selectedUserId) {
      scrollToBottom();
    }
  }, [messages, selectedUserId]);

  // Mark selected user's messages as read
  useEffect(() => {
    if (selectedUserId) {
      const activeThread = threads.find((t) => t.user.id === selectedUserId);
      if (activeThread && activeThread.unreadCount > 0) {
        markMessagesReadMutation.mutate(
          { data: { senderId: selectedUserId } },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ otherUserId: selectedUserId }) });
              queryClient.invalidateQueries({ queryKey: getListMessageThreadsQueryKey() });
            },
          }
        );
      }
    }
  }, [selectedUserId, threads, messages]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !replyText.trim()) return;

    const content = replyText.trim();
    setReplyText("");

    sendMessageMutation.mutate(
      {
        data: {
          receiverId: selectedUserId,
          content,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ otherUserId: selectedUserId }) });
          queryClient.invalidateQueries({ queryKey: getListMessageThreadsQueryKey() });
          scrollToBottom();
        },
      }
    );
  };

  // Filter threads by user full name, company name, or email
  const filteredThreads = threads.filter((t) => {
    const search = searchText.toLowerCase();
    return (
      (t.user.fullName || "").toLowerCase().includes(search) ||
      (t.user.companyName || "").toLowerCase().includes(search) ||
      (t.user.email || "").toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout navItems={adminNav}>
      <div className="max-w-screen-xl mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="mb-4 shrink-0">
          <h1 className="text-xl font-bold">Admin Message Center</h1>
          <p className="text-sm text-muted-foreground">Manage communications with Buyers and Vendors</p>
        </div>

        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl shadow-sm flex overflow-hidden">
          {/* Thread List Sidebar */}
          <div className="w-80 md:w-96 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 bg-white shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search buyer or vendor..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-xs border border-gray-200 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 transition-all outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Threads Container */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {loadingThreads && threads.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading conversations...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No active conversations found</div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = selectedUserId === thread.user.id;
                  const isUnread = thread.unreadCount > 0;
                  return (
                    <button
                      key={thread.user.id}
                      onClick={() => setSelectedUserId(thread.user.id)}
                      className={`w-full text-left p-4 flex items-start space-x-3 transition-colors ${
                        isActive ? "bg-indigo-50/70" : "hover:bg-gray-100/60 bg-white"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-600">
                          <User size={18} />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-gray-900 truncate">
                            {thread.user.companyName || thread.user.fullName || thread.user.email}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            {new Date(thread.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p
                            className={`text-xs truncate ${
                              isUnread ? "text-gray-900 font-medium" : "text-gray-500"
                            }`}
                          >
                            {thread.lastMessage.content}
                          </p>
                          {isUnread && (
                            <span className="ml-2 bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-block text-[9px] mt-1 px-1.5 py-0.5 rounded-full border font-medium uppercase tracking-wider ${
                            thread.user.role === "buyer"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-teal-50 text-teal-700 border-teal-100"
                          }`}
                        >
                          {thread.user.role}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Conversation Panel */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedUserId && selectedThread ? (
              <>
                {/* Active Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 shadow-sm z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selectedThread.user.fullName || selectedThread.user.email}
                      </h3>
                      <p className="text-[10px] text-gray-400 flex items-center">
                        <span className="font-semibold text-gray-600 mr-1.5">
                          {selectedThread.user.companyName || "No Company"}
                        </span>
                        • {selectedThread.user.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${
                      selectedThread.user.role === "buyer"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-teal-50 text-teal-700 border-teal-200"
                    }`}
                  >
                    {selectedThread.user.role}
                  </span>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                  {messages.map((msg) => {
                    const isMe = msg.senderId !== selectedUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
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
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-gray-200 bg-white flex items-center space-x-3 shrink-0"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedThread.user.companyName || "user"}...`}
                    className="flex-1 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-xs border border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 transition-all outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendMessageMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-3 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center space-x-1.5 shrink-0"
                  >
                    <span className="text-xs font-semibold">Send</span>
                    <Send size={12} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
                  <MessageSquare size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">No Thread Selected</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select a vendor or buyer thread from the list to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
