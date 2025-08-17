const express = require("express");
const fs = require("fs");
const pino = require("pino");
const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { delay } = require("@whiskeysockets/baileys/lib/Utils");
const app = express();
const port = process.env.PORT || 8000;

const sessionsDir = "./sessions";
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

app.use(express.static("public"));
const logger = pino({ level: "silent" });
const pairingStatus = {};

app.get("/", (req, res) => {
  res.send("✅ DamiBOTZ Session Generator is running.");
});

// 🟢 Pairing Code Generator (6-part code)
app.get("/pair", async (req, res) => {
  const number = req.query.number;
  if (!number || !/^\d+$/.test(number)) return res.send("❌ Invalid number format.");

  const sessionFile = `${sessionsDir}/${number}.json`;
  const { state, saveState } = useSingleFileAuthState(sessionFile);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ['DamiBOTZ', 'Chrome', '1.0']
  });

  pairingStatus[number] = false;

  try {
    const code = await sock.requestPairingCode(number);
    pairingStatus[number] = true;
    console.log("🔑 Pairing Code:", code);
    res.send(code);
  } catch (err) {
    console.error("❌ Error getting pairing code:", err);
    res.send("❌ Failed to get pairing code. Try again.");
  }

  sock.ev.on("creds.update", saveState);
});

// 🟢 Session ID Generator
app.get("/getSession", (req, res) => {
  const number = req.query.number;
  const sessionFile = `${sessionsDir}/${number}.json`;

  if (!fs.existsSync(sessionFile)) {
    return res.send("❌ Session not ready. Please pair again.");
  }

  const sessionData = fs.readFileSync(sessionFile).toString("base64");
  const sessionID = `DamiBOTZ;;;${sessionData}`;

  const caption = `
✅ *Your DAMI-BOTZ Session is Ready!*

🔐 *Session ID:* 
\`\`\`${sessionID}\`\`\`

📢 *Join WhatsApp Channel:* 
https://whatsapp.com/channel/0029VazHPYwBqbr9HjXrc50m

👨‍💻 *GitHub Repo:* 
https://github.com/Nerdk-tech

👑 *Development by:* @DAMINĪ

🚀 *Dami-BOTZ is a fast, feature-rich and professional WhatsApp bot built with Baileys.*
`;

  res.send(caption);
});

app.listen(port, () => {
  console.log(`✅ damiBOTZ Session Generator running on port ${port}`);
});
