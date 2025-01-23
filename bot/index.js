const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const Url = require('../models/Url');
const TelegramUser = require('../models/TelegramUser');
require('dotenv').config();

// Replace 'YOUR_BOT_TOKEN' with your actual bot token from BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Generate short code
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    let user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    
    if (!user) {
      user = await TelegramUser.create({
        telegramId: msg.from.id.toString(),
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      });
    }

    const message = `Welcome to URL Shortener Bot! 🚀\n\n` +
      `Commands:\n` +
      `/shorten <url> - Create a short URL\n` +
      `/stats - View your URL statistics\n` +
      `/premium - Get premium status\n\n` +
      `${user.isPremium ? '✨ You are a premium user!' : '🔒 Upgrade to premium to create unlimited short URLs!'}`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
});

// Command: /premium
bot.onText(/\/premium/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    
    if (user?.isPremium) {
      bot.sendMessage(chatId, '✨ You are already a premium user!');
      return;
    }

    // Here you can implement your premium subscription logic
    // For example, send payment instructions or integrate with a payment system
    const message = 'To get premium status:\n\n' +
      '1. Contact @YourAdminUsername\n' +
      '2. Send payment proof\n' +
      '3. Get unlimited URL shortening!\n\n' +
      'Premium benefits:\n' +
      '✓ Unlimited URL shortening\n' +
      '✓ URL click statistics\n' +
      '✓ Custom short codes (coming soon)';

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
});

// Command: /stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    if (!user) {
      bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const urls = await Url.find({ createdBy: user.telegramId });
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

    const message = `📊 Your Statistics\n\n` +
      `URLs Created: ${user.urlsCreated}\n` +
      `Total Clicks: ${totalClicks}\n` +
      `Account Type: ${user.isPremium ? 'Premium ✨' : 'Free'}`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
});

// Command: /shorten <url>
bot.onText(/\/shorten (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const originalUrl = match[1];

  try {
    const user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    
    if (!user) {
      bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    // Check if user is premium or hasn't exceeded free limit
    if (!user.isPremium && user.urlsCreated >= 3) {
      bot.sendMessage(
        chatId,
        '🔒 Free users can only create 3 short URLs.\n' +
        'Use /premium to upgrade and create unlimited URLs!'
      );
      return;
    }

    // Validate URL
    try {
      new URL(originalUrl);
    } catch {
      bot.sendMessage(chatId, '❌ Please provide a valid URL');
      return;
    }

    let shortCode = generateShortCode();
    while (await Url.findOne({ shortCode })) {
      shortCode = generateShortCode();
    }

    const url = await Url.create({
      originalUrl,
      shortCode,
      createdBy: user.telegramId,
    });

    user.urlsCreated += 1;
    await user.save();

    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${shortCode}`;
    const message = `✅ URL shortened successfully!\n\n` +
      `Original: ${originalUrl}\n` +
      `Short: ${shortUrl}\n\n` +
      `${user.isPremium ? '' : `${3 - user.urlsCreated} free URLs remaining`}`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
});

// Watch for premium status changes
TelegramUser.watch().on('change', async (change) => {
  if (change.operationType === 'update' && change.updateDescription.updatedFields.isPremium !== undefined) {
    const user = await TelegramUser.findOne({ _id: change.documentKey._id });
    if (user) {
      const message = user.isPremium
        ? '🎉 Congratulations! Your account has been upgraded to premium!\n\nYou can now create unlimited short URLs.'
        : '⚠️ Your premium status has been removed. You are now limited to creating 3 short URLs.';
      
      try {
        await bot.sendMessage(user.telegramId, message);
      } catch (error) {
        console.error('Failed to send premium status notification:', error);
      }
    }
  }
});

// Handle invalid commands
bot.on('message', (msg) => {
  if (msg.text.startsWith('/')) {
    const command = msg.text.split(' ')[0];
    if (!['/start', '/shorten', '/stats', '/premium'].includes(command)) {
      bot.sendMessage(msg.chat.id, '❌ Invalid command. Use /start to see available commands.');
    }
  }
});

console.log('Bot is running...');
