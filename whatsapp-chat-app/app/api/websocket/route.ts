import type { NextRequest } from "next/server"
import { upgradeWebSocket } from "next/server"

interface Message {
  id: string
  text: string
  timestamp: number
  sender: string
}

// In-memory storage for messages
let messages: Message[] = []
const clients = new Set<WebSocket>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 })
  }

  const { socket, response } = upgradeWebSocket(request)

  socket.onopen = () => {
    clients.add(socket)
    console.log("Client connected")

    // Send message history to new client
    socket.send(
      JSON.stringify({
        type: "history",
        messages,
      }),
    )
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "send":
          const newMessage = data.message
          messages.push(newMessage)

          // Broadcast to all clients
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "message",
                  message: newMessage,
                }),
              )
            }
          })
          break

        case "update":
          const messageIndex = messages.findIndex((msg) => msg.id === data.messageId)
          if (messageIndex !== -1) {
            messages[messageIndex].text = data.text

            // Broadcast update to all clients
            clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "update",
                    message: messages[messageIndex],
                  }),
                )
              }
            })
          }
          break

        case "delete":
          messages = messages.filter((msg) => msg.id !== data.messageId)

          // Broadcast deletion to all clients
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "delete",
                  messageId: data.messageId,
                }),
              )
            }
          })
          break
      }
    } catch (error) {
      console.error("Error processing message:", error)
    }
  }

  socket.onclose = () => {
    clients.delete(socket)
    console.log("Client disconnected")
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
    clients.delete(socket)
  }

  return response
}
