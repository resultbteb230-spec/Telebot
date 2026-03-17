const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const settings = require('./settings.json');

// ===== EXPRESS SERVER =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Jan Telegram Bot is Running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ===== TELEGRAM BOT =====
const token = settings.token;
const bot = new TelegramBot(token, { polling: true });

// API base URL
const API_BASE = 'https://jan-api-by-aminul-sordar.vercel.app';

// ===== Helper functions =====
async function fetchCount() {
  try {
    const res = await axios.get(`${API_BASE}/count`);
    return res.data;
  } catch (e) {
    console.error('fetchCount error:', e.message);
    return { questions: 0, answers: 0 };
  }
}

async function getAnswer(question) {
  try {
    const res = await axios.get(`${API_BASE}/answer/${encodeURIComponent(question)}`);
    return res.data.answer || "❌ আমি এখনো এটা শিখিনি, দয়া করে আমাকে শেখান! 👀";
  } catch (e) {
    console.error('getAnswer error:', e.message);
    return "❌ সার্ভার থেকে উত্তর পাওয়া যায়নি, পরে আবার চেষ্টা করুন!";
  }
}

async function teachMultiple(qaText) {
  try {
    const res = await axios.post(`${API_BASE}/teach`, { text: qaText });
    return res.data.message;
  } catch (e) {
    console.error('teachMultiple error:', e.message);
    return "❌ শেখানো ব্যর্থ হয়েছে! সার্ভার সমস্যা হতে পারে।";
  }
}

// ===== Random replies =====
const randomReplies = [
  "হ্যাঁ 😀, আমি এখানে আছি",
  "কেমন আছো?",
  "বলো জান কি করতে পারি তোমার জন্য",
  "I love you 💝",
  "ভালোবাসি তোমাকে 🤖"
];

// ===== /start =====
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "🤖 Jan AI Bot চালু হয়েছে!\n\n/jan <প্রশ্ন> ব্যবহার করুন"
  );
});

// ===== /jan =====
bot.onText(/\/jan(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1] ? match[1].trim() : '';

  if (!input) {
    bot.sendMessage(chatId, "কিছু লিখুন...");
    return;
  }

  const parts = input.split(' ');
  const cmd = parts[0].toLowerCase();

  if (cmd === 'count') {
    const count = await fetchCount();
    bot.sendMessage(chatId, `📊 প্রশ্ন: ${count.questions}\nউত্তর: ${count.answers}`);
    return;
  }

  if (cmd === 'teach') {
    const teachInput = parts.slice(1).join(' ');
    const result = await teachMultiple(teachInput);
    bot.sendMessage(chatId, result);
    return;
  }

  const answer = await getAnswer(input);
  bot.sendMessage(chatId, answer);
});

// ===== Normal message =====
bot.on('message', async (msg) => {
  const text = msg.text || '';
  if (text.startsWith('/')) return;

  if (text.toLowerCase().startsWith('jan')) {
    const question = text.slice(3).trim();

    if (question) {
      const answer = await getAnswer(question);
      bot.sendMessage(msg.chat.id, answer);
    } else {
      const randomReply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
      bot.sendMessage(msg.chat.id, randomReply);
    }
  }
});

// ===== Error =====
bot.on('polling_error', (error) => {
  console.error(error);
});

console.log('🤖 Jan Telegram Bot Running...');
