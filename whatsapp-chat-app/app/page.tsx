"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Edit2, Trash2, Check, X, Users } from "lucide-react"

interface Message {
  id: string
  text: string
  timestamp: number
  sender: string
  isOwn: boolean
}

interface User {
  id: string
  name: string
  color: string
}

const DEMO_USERS: User[] = [
  { id: "1", name: "Palak", color: "bg-blue-500" },
  { id: "2", name: "Aanchal", color: "bg-purple-500" },
  { id: "3", name: "Kumkum", color: "bg-orange-500" },
  { id: "4", name: "Kittu", color: "bg-pink-500" },
]

const DEMO_MESSAGES: Message[] = [
  {
    id: "demo1",
    text: "Hey everyone! Welcome to the chat 👋",
    timestamp: Date.now() - 300000,
    sender: "Palak",
    isOwn: false,
  },
  {
    id: "demo2",
    text: "This is a demo WhatsApp-like chat with CRUD operations",
    timestamp: Date.now() - 240000,
    sender: "Aanchal",
    isOwn: false,
  },
  {
    id: "demo3",
    text: "You can send, edit, and delete messages in real-time!",
    timestamp: Date.now() - 180000,
    sender: "Kumkum",
    isOwn: false,
  },
]

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simulate other users sending messages occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance every 10 seconds
        const otherUsers = DEMO_USERS.filter((user) => user.id !== currentUser.id)
        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)]
        const demoMessages = [
          "That's awesome! 🎉",
          "Great work on this chat app!",
          "The edit and delete features are really cool",
          "Love the WhatsApp-like design",
          "This is working perfectly!",
          "Nice job with the real-time updates",
        ]
        const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)]

        const newMsg: Message = {
          id: Date.now().toString(),
          text: randomMessage,
          timestamp: Date.now(),
          sender: randomUser.name,
          isOwn: false,
        }

        setMessages((prev) => [...prev, newMsg])
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [currentUser.id])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: Date.now(),
      sender: currentUser.name,
      isOwn: true,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const startEdit = (message: Message) => {
    setEditingId(message.id)
    setEditText(message.text)
  }

  const saveEdit = () => {
    if (!editText.trim() || !editingId) return

    setMessages((prev) => prev.map((msg) => (msg.id === editingId ? { ...msg, text: editText.trim() } : msg)))

    setEditingId(null)
    setEditText("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      cancelEdit()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const switchUser = (user: User) => {
    setCurrentUser(user)
    // Update existing messages to reflect new perspective
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        isOwn: msg.sender === user.name,
      })),
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">WhatsApp Clone</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-300" />
            <span className="text-sm">Connected</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm opacity-90">Logged in as: {currentUser.name}</p>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">{messages.length} messages</span>
          </div>
        </div>
      </div>

      {/* User Switcher */}
      <div className="bg-white border-b p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Switch user:</span>
          <div className="flex gap-2">
            {DEMO_USERS.map((user) => (
              <Button
                key={user.id}
                size="sm"
                variant={currentUser.id === user.id ? "default" : "outline"}
                onClick={() => switchUser(user)}
                className="h-8"
              >
                <div className={`w-3 h-3 rounded-full ${user.color} mr-2`} />
                {user.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
              <div className="group relative max-w-xs lg:max-w-md">
                <Card className={`p-3 ${message.isOwn ? "bg-green-500 text-white" : "bg-white text-gray-800"}`}>
                  {!message.isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          DEMO_USERS.find((u) => u.name === message.sender)?.color || "bg-gray-400"
                        }`}
                      />
                      <p className="text-xs font-semibold opacity-70">{message.sender}</p>
                    </div>
                  )}

                  {editingId === message.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleEditKeyPress}
                        className="text-sm bg-white text-gray-800"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0 hover:bg-white/20">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          className="h-6 w-6 p-0 hover:bg-white/20"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm break-words">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                    </>
                  )}
                </Card>

                {/* Edit/Delete buttons - only show for own messages */}
                {message.isOwn && editingId !== message.id && (
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(message)} className="h-6 w-6 p-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMessage(message.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • You can edit and delete your own messages • Switch users to test different perspectives
        </div>
      </div>
    </div>
  )
}
