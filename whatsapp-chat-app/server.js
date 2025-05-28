const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { WebSocketServer } = require("ws")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = 3001

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Define Message object structure
const Message = {
  id: "",
  text: "",
  timestamp: 0,
  sender: "",
}

// In-memory storage for messages
let messages = []

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // WebSocket Server
  const wss = new WebSocketServer({
    server,
    path: "/api/websocket",
  })

  wss.on("connection", (ws) => {
    console.log("Client connected")

    // Send message history to new client
    ws.send(
      JSON.stringify({
        type: "history",
        messages,
      }),
    )

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString())

        switch (message.type) {
          case "send":
            const newMessage = message.message
            messages.push(newMessage)

            // Broadcast to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === 1) {
                // WebSocket.OPEN
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
            const messageIndex = messages.findIndex((msg) => msg.id === message.messageId)
            if (messageIndex !== -1) {
              messages[messageIndex].text = message.text

              // Broadcast update to all clients
              wss.clients.forEach((client) => {
                if (client.readyState === 1) {
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
            messages = messages.filter((msg) => msg.id !== message.messageId)

            // Broadcast deletion to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(
                  JSON.stringify({
                    type: "delete",
                    messageId: message.messageId,
                  }),
                )
              }
            })
            break
        }
      } catch (error) {
        console.error("Error processing message:", error)
      }
    })

    ws.on("close", () => {
      console.log("Client disconnected")
    })

    ws.on("error", (error) => {
      console.error("WebSocket error:", error)
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
