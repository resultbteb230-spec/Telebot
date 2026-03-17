const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const settings = require('./settings.json');

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

// ===== Random replies for empty prefix messages =====
const randomReplies = [
  "হ্যাঁ 😀, আমি এখানে আছি",
  "কেমন আছো?",
  "বলো জান কি করতে পারি তোমার জন্য",
  `তুমি বলেছো: "..."? কিউট!`,
  "I love you 💝",
  "ভালোবাসি তোমাকে 🤖",
  "Hi, I'm messenger Bot, I can help you.?🤖",
  "Use callad to contact admin!",
  "Hi, Don't disturb 🤖 🚘 Now I'm going to Feni, Bangladesh..bye",
  "Hi, 🤖 I can help you~~~~",
  "আমি এখন আমিনুল বসের সাথে বিজি আছি",
  "আমাকে আমাকে না ডেকে আমার বসকে ডাকো এই নেও LINK :- https://www.facebook.com/100071880593545",
  "Hmmm sona 🖤 meye hoile kule aso ar sele hoile kule new 🫂😘",
  "Yah This Bot creator : PRINCE RID((A.R))   link => https://www.facebook.com/100071880593545",
  "হা বলো, শুনছি আমি 🤸‍♂️🫂",
  "Ato daktasen kn bujhlam na 😡",
  "jan bal falaba,🙂",
  "ask amr mon vlo nei dakben na🙂",
  "Hmm jan ummah😘😘",
  "jang hanga korba 🙂🖤",
  "iss ato dako keno lojja lage to 🫦🙈",
  "suna tomare amar valo lage,🙈😽"
];

// ===== Command: /start =====
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "🤖 **Jan AI Bot**\n\nআমাকে প্রশ্ন করুন, আমি উত্তর দেওয়ার চেষ্টা করব।\n\n" +
    "`/jan <প্রশ্ন>` - প্রশ্ন করুন\n" +
    "`/jan teach <প্রশ্ন> - <উত্তর>` - নতুন কিছু শেখান (একাধিকের জন্য '|' ব্যবহার করুন)\n" +
    "`/jan count` - মোট প্রশ্ন-উত্তর সংখ্যা দেখুন\n\n" +
    "আমাকে ডাকতে 'jan', 'bby', 'bot' ইত্যাদি ব্যবহার করতে পারেন।",
    { parse_mode: 'Markdown' }
  );
});

// ===== Command: /jan ... =====
bot.onText(/\/jan(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1] ? match[1].trim() : '';

  if (!input) {
    // Just /jan without arguments: show help
    bot.sendMessage(
      chatId,
      "আমাকে কিছু জিজ্ঞাসা করুন অথবা /jan count /jan teach ব্যবহার করুন।",
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  // Split into command and args
  const parts = input.split(' ');
  const cmd = parts[0].toLowerCase();

  if (cmd === 'count') {
    const count = await fetchCount();
    bot.sendMessage(
      chatId,
      `📊 **জ্ঞানভাণ্ডার:**\n\n📌 মোট প্রশ্ন: ${count.questions}\n📌 মোট উত্তর: ${count.answers}\n\n💡 আমাকে আরও শেখানোর মাধ্যমে আমাকে আরও স্মার্ট বানান!`,
      { parse_mode: 'Markdown', reply_to_message_id: msg.message_id }
    );
    return;
  }

  if (cmd === 'teach') {
    const teachInput = parts.slice(1).join(' ').trim();
    if (!teachInput.includes(' - ')) {
      bot.sendMessage(
        chatId,
        "❌ সঠিক ফরম্যাট ব্যবহার করুন:\n/teach প্রশ্ন - উত্তর\n\nএকাধিক প্রশ্ন দিতে চাইলে '|' দিয়ে আলাদা করুন।",
        { reply_to_message_id: msg.message_id }
      );
      return;
    }
    const result = await teachMultiple(teachInput);
    bot.sendMessage(chatId, result, { reply_to_message_id: msg.message_id });
    return;
  }

  // Default: treat as a question
  const answer = await getAnswer(input);
  bot.sendMessage(chatId, answer, { reply_to_message_id: msg.message_id });
});

// ===== Handle normal messages (prefix detection and replies) =====
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const lowerText = text.toLowerCase().trim();

  // Ignore commands (already handled)
  if (text.startsWith('/')) return;

  // Prefixes that trigger the bot
  const prefixes = ['baby', 'bby', 'bot', 'jan', 'babu', 'janu'];
  const startsWithPrefix = prefixes.find(prefix => lowerText.startsWith(prefix));

  // Check if this message is a reply to one of our bot's messages
  const isReplyToBot = msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.from.is_bot;

  // If it's a reply to the bot, treat the whole message as a question
  if (isReplyToBot) {
    const answer = await getAnswer(text);
    bot.sendMessage(chatId, answer, { reply_to_message_id: msg.message_id });
    return;
  }

  // If it starts with a prefix, handle accordingly
  if (startsWithPrefix) {
    const question = text.slice(startsWithPrefix.length).trim();

    if (question.length > 0) {
      // Actual question after prefix
      const answer = await getAnswer(question);
      bot.sendMessage(chatId, answer, { reply_to_message_id: msg.message_id });
    } else {
      // No question, just prefix – send a random reply
      const randomReply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
      bot.sendMessage(chatId, randomReply, { reply_to_message_id: msg.message_id });
    }
    return;
  }

  // Otherwise, ignore (no action)
});

// ===== Error handling =====
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('Jan Telegram Bot is running...');
