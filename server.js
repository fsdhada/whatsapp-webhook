require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

app.use(express.json());

// GET / – health / status
app.get('/', (req, res) => {
  res.send('WhatsApp Bot Running');
});

// GET /webhook – Meta webhook verification handshake
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[webhook] Verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('[webhook] Verification failed – token mismatch or bad mode');
  res.sendStatus(403);
});

// POST /webhook – receive incoming WhatsApp events
app.post('/webhook', (req, res) => {
  // Acknowledge immediately so Meta does not retry
  res.sendStatus(200);

  const body = req.body;
  console.log('[webhook] Payload received:\n', JSON.stringify(body, null, 2));

  if (body.object === 'whatsapp_business_account') {
    (body.entry || []).forEach(entry => {
      (entry.changes || []).forEach(change => {
        const value = change.value;
        (value.messages || []).forEach(async (message) => {

  console.log(
    `[webhook] Message from ${message.from} (type: ${message.type}):`
  );

  console.log("Message Text:", message.text?.body);

  try {

    await axios.post(
      "https://graph.facebook.com/v25.0/1262625736937425/messages",
      {
        messaging_product: "whatsapp",
        to: message.from,
        text: {
          body: "Hello! 👋 Thank you for contacting us."
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Reply sent successfully");

  } catch (error) {

    console.log("❌ Failed to send reply");

    console.log(
      error.response?.data || error.message
    );

  }

});
        (value.statuses || []).forEach(status => {
          console.log(
            `[webhook] Status update for message ${status.id}: ${status.status}`
          );
        });
      });
    });
  }
});

app.listen(PORT, () => {
  console.log(`[server] WhatsApp webhook server listening on port ${PORT}`);
  if (!VERIFY_TOKEN) console.warn('[server] WARNING: WHATSAPP_VERIFY_TOKEN is not set');
  if (!ACCESS_TOKEN) console.warn('[server] WARNING: WHATSAPP_ACCESS_TOKEN is not set');
});
