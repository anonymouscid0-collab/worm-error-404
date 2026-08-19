const { Telegraf, Markup } = require('telegraf');

class WormTelegramBotV3 {
  constructor(token) {
    if (!token) throw new Error('TOKEN Telegram requis');
    this.bot = new Telegraf(token);
    this.adminUsername = (process.env.ADMIN_TELEGRAM_USERNAME || 'Cid_404lost').replace('@', '');
    this.setupHandlers();
  }

  setupHandlers() {
    // Commandes principales
    this.bot.command('start', (ctx) => this.sendMainMenu(ctx));
    this.bot.command('help', (ctx) => this.sendHelp(ctx));
    this.bot.command('plans', (ctx) => this.sendPlansMenu(ctx));
    this.bot.command('mykey', (ctx) => this.sendApiKeyMenu(ctx));
    this.bot.command('admin', (ctx) => this.sendAdminPanel(ctx));

    // Actions des boutons (Callbacks)
    this.bot.action('menu_start', (ctx) => this.sendMainMenu(ctx, true));
    this.bot.action('menu_plans', (ctx) => this.sendPlansMenu(ctx, true));
    this.bot.action('menu_api', (ctx) => this.sendApiKeyMenu(ctx, true));
    this.bot.action('menu_help', (ctx) => this.sendHelp(ctx, true));

    // Paiements Telegram Stars (XTR)
    this.bot.action('buy_pro_stars', (ctx) => this.sendStarsInvoice(ctx, 'Pro Plan - Worm Error 404', 'Accès Illimité IA Senior + Vitesse Max', 250, 'pro_plan_monthly'));
    this.bot.action('buy_dev_stars', (ctx) => this.sendStarsInvoice(ctx, 'Developer API Pass', 'Génération Clé API + Accès Webhooks', 500, 'dev_api_pass'));

    // Traitement paiement Stars
    this.bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));
    this.bot.on('successful_payment', (ctx) => {
      ctx.reply('🎉 <b>Paiement Réussi !</b>\n\nVotre compte a été crédité avec succès.', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Retour au Menu', 'menu_start')]])
      });
    });

    // Écouteur des messages Texte (IA Senior Engine)
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith('/')) return;

      await ctx.sendChatAction('typing');
      ctx.reply('⚙️ <b>[WORM OMEGA V3]</b>\n\n<i>Processing request with Senior Full-Stack Engine...</i>', { parse_mode: 'HTML' });
    });
  }

  // Menu Principal avec Boutons Inline Stylés
  async sendMainMenu(ctx, isEdit = false) {
    const text = `🌐 <b>WORM ERROR // OMEGA V3</b>\n` +
                 `<i>Next-Gen AI Full-Stack Developer Ecosystem</i>\n\n` +
                 `Welcome! Select an option below to control your instance:`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💎 Plans & Upgrades', 'menu_plans'), Markup.button.callback('🔑 Developer API Key', 'menu_api')],
      [Markup.button.url('👤 Contact Admin (Cid)', `https://t.me/${this.adminUsername}`)],
      [Markup.button.callback('❓ Commands & Help', 'menu_help')]
    ]);

    if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  // Menu des Tarifs
  async sendPlansMenu(ctx, isEdit = false) {
    const text = `💎 <b>PRICING & MEMBERSHIP PLANS</b>\n\n` +
                 `1️⃣ <b>FREE PLAN</b>\n• 15 messages / day\n• Standard Engine\n• Price: <b>Free</b>\n\n` +
                 `2️⃣ <b>PRO PLAN (Unlimited)</b>\n• Unlimited Queries\n• Senior Full-Stack AI Logic\n• Priority Speed\n• Price: <b>250 ⭐ Telegram Stars / mo</b>\n\n` +
                 `3️⃣ <b>DEVELOPER PASS (API Key)</b>\n• Personal API Key Generation\n• Access to Webhooks & Endpoints\n• Price: <b>500 ⭐ Telegram Stars / mo</b>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⭐ Upgrade to PRO (250 Stars)', 'buy_pro_stars')],
      [Markup.button.callback('⚡ Get DEV PASS (500 Stars)', 'buy_dev_stars')],
      [Markup.button.callback('⬅️ Main Menu', 'menu_start')]
    ]);

    if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  // Clés API pour Développeurs
  async sendApiKeyMenu(ctx, isEdit = false) {
    const text = `🔑 <b>DEVELOPER API ACCESS</b>\n\n` +
                 `To build applications using the Worm Error 404 API, you need an active Developer Pass.\n\n` +
                 `<b>Status:</b> ❌ No Active Key\n\n` +
                 `If you purchased a key manually or need support, contact @${this.adminUsername}.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Buy API Pass (500 Stars)', 'buy_dev_stars')],
      [Markup.button.url('💬 Contact Admin', `https://t.me/${this.adminUsername}`)],
      [Markup.button.callback('⬅️ Main Menu', 'menu_start')]
    ]);

    if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  // Factures Telegram Stars
  sendStarsInvoice(ctx, title, description, amountStars, payload) {
    return ctx.replyWithInvoice({
      title: title,
      description: description,
      payload: payload,
      provider_token: "",
      currency: "XTR",
      prices: [{ label: title, amount: amountStars }]
    });
  }

  // Aide
  async sendHelp(ctx, isEdit = false) {
    const text = `❓ <b>WORM ERROR 404 HELP CENTER</b>\n\n` +
                 `• Send any coding question, bug report, or logic request directly.\n` +
                 `• Default responses are delivered in <b>English</b> with Senior Developer formatting.\n` +
                 `• Write in <b>French</b> if you prefer French responses.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Main Menu', 'menu_start')]
    ]);

    if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  // Panneau d'Administration pour Cid
  async sendAdminPanel(ctx) {
    const username = ctx.from ? ctx.from.username : null;
    if (username !== this.adminUsername) {
      return ctx.reply(`❌ Access Denied. Only @${this.adminUsername} can access the administrative panel.`);
    }

    const text = `👑 <b>ADMINISTRATOR PANEL</b>\n\n` +
                 `Welcome Creator @${this.adminUsername}.\n` +
                 `Use this panel to manage keys, users, and grants.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➕ Generate Client Key', 'admin_gen')],
      [Markup.button.callback('🎁 Grant Pro Plan', 'admin_pro')],
      [Markup.button.callback('⬅️ Main Menu', 'menu_start')]
    ]);

    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  start() {
    this.bot.launch();
    console.log('🤖 Bot Telegram V3 (Style Pro & Stars) en ligne !');
  }
}

module.exports = WormTelegramBotV3;
