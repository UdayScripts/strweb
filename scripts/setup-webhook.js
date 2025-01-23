require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

async function setupWebhook() {
  try {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      webHook: { port: process.env.PORT || 3000 }
    });

    // The URL where Vercel will forward Telegram updates to
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    
    // Delete any existing webhook
    await bot.deleteWebHook();
    
    // Set the webhook
    const result = await bot.setWebHook(webhookUrl);
    
    if (result) {
      console.log('✅ Webhook set successfully!');
      console.log(`Webhook URL: ${webhookUrl}`);
    } else {
      console.error('❌ Failed to set webhook');
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
  process.exit();
}

setupWebhook();
