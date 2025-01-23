import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import connectDB from '@/lib/db';
import Url from '@/models/Url';
import TelegramUser from '@/models/TelegramUser';

// Initialize bot with webhook mode
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  webHook: { port: process.env.PORT || 3000 }
});

// Generate short code
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle bot commands
async function handleStart(msg: any) {
  const chatId = msg.chat.id;
  try {
    await connectDB();
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

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
}

async function handlePremium(msg: any) {
  const chatId = msg.chat.id;
  try {
    await connectDB();
    const user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    
    if (user?.isPremium) {
      await bot.sendMessage(chatId, '✨ You are already a premium user!');
      return;
    }

    const message = 'To get premium status:\n\n' +
      '1. Contact @YourAdminUsername\n' +
      '2. Send payment proof\n' +
      '3. Get unlimited URL shortening!\n\n' +
      'Premium benefits:\n' +
      '✓ Unlimited URL shortening\n' +
      '✓ URL click statistics\n' +
      '✓ Custom short codes (coming soon)';

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
}

async function handleStats(msg: any) {
  const chatId = msg.chat.id;
  try {
    await connectDB();
    const user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    if (!user) {
      await bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const urls = await Url.find({ createdBy: user.telegramId });
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

    const message = `📊 Your Statistics\n\n` +
      `URLs Created: ${user.urlsCreated}\n` +
      `Total Clicks: ${totalClicks}\n` +
      `Account Type: ${user.isPremium ? 'Premium ✨' : 'Free'}`;

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
}

async function handleShorten(msg: any, match: any) {
  const chatId = msg.chat.id;
  const originalUrl = match[1];

  try {
    await connectDB();
    const user = await TelegramUser.findOne({ telegramId: msg.from.id.toString() });
    
    if (!user) {
      await bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    if (!user.isPremium && user.urlsCreated >= 3) {
      await bot.sendMessage(
        chatId,
        '🔒 Free users can only create 3 short URLs.\n' +
        'Use /premium to upgrade and create unlimited URLs!'
      );
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      await bot.sendMessage(chatId, '❌ Please provide a valid URL');
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

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
  }
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    
    if (!update || !update.message) {
      return NextResponse.json({ status: 'ok' });
    }

    const msg = update.message;
    const text = msg.text || '';

    // Handle commands
    if (text.startsWith('/start')) {
      await handleStart(msg);
    } else if (text.startsWith('/premium')) {
      await handlePremium(msg);
    } else if (text.startsWith('/stats')) {
      await handleStats(msg);
    } else if (text.startsWith('/shorten ')) {
      const match = text.match(/^\/shorten (.+)$/);
      if (match) {
        await handleShorten(msg, match);
      }
    } else if (text.startsWith('/')) {
      await bot.sendMessage(msg.chat.id, '❌ Invalid command. Use /start to see available commands.');
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
