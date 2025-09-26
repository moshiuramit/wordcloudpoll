// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

// Path to JSON file
const dataFile = path.join(__dirname, "data.json");

// Load existing word list (or empty)
let wordList = [];
if (fs.existsSync(dataFile)) {
  try {
    const raw = fs.readFileSync(dataFile);
    wordList = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to load data.json, starting empty");
    wordList = [];
  }
}

// Save function
function saveWordList() {
  fs.writeFileSync(dataFile, JSON.stringify(wordList, null, 2));
}

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("✅ New WebSocket client connected");

  // Send current word list to new client
  ws.send(JSON.stringify({ type: "init", list: wordList }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    // Add new word to memory + save to file
    wordList.push([data.word, data.weight]);
    saveWordList();

    // Broadcast the new word
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({ type: "update", word: data.word, weight: data.weight })
        );
      }
    });
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});
