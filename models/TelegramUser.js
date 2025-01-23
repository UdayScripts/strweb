const mongoose = require('mongoose');

const telegramUserSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
  firstName: String,
  lastName: String,
  isPremium: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  urlsCreated: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.models.TelegramUser || mongoose.model('TelegramUser', telegramUserSchema);
