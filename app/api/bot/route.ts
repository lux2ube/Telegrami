import { Bot, webhookCallback, InlineKeyboard, Keyboard } from "grammy";

export const dynamic = 'force-dynamic';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is unset");

const bot = new Bot(token);

// --- CONFIG: Market Averages for Calculator ---
const RATES: Record<string, number> = {
    'الذهب (Gold)': 5.0,     // Average cashback for Gold
    'يورو دولار (EURUSD)': 3.0,
    'باوند دولار (GBPUSD)': 4.0,
    'مؤشرات (Indices)': 2.0,
    'نفط (Oil)': 3.0,
    'عملات رقمية (Crypto)': 10.0
};

// --- UI: Persistent Main Menu ---
const mainMenu = new Keyboard()
    .text("💰 العروض الحالية").text("🧮 احسب توفيرك").row()
    .text("🏦 دليل الوسطاء").text("⚖️ الشروط القانونية").row()
    .text("📞 تواصل معنا").resized();

// --- UI: Common Buttons ---
const regLink = "https://www.bksheesh.com/register";
const webLink = "https://www.bksheesh.com/brokers";

const actionMenu = new InlineKeyboard()
    .url("👤 فتح حساب كاش باك", regLink)
    .url("🌐 تصفح الموقع", webLink);

// --- 1. START COMMAND ---
bot.command("start", async (ctx) => {
    await ctx.reply(
        "👋 **أهلاً بك في خدمة Backsheesh**\n\n" +
        "نحن بوابتك لتقليل تكاليف التداول. بدلاً من دفع كامل السبريد للوسيط، نقوم باسترداد جزء منه وإعادته إلى محفظتك (Cashback).\n\n" +
        "✅ **خدمة مجانية 100%**\n" +
        "✅ **دفعات آلية** (يومية/أسبوعية)\n" +
        "✅ **تدعم أشهر الوسطاء** (FXTM, XM, Exness..)\n\n" +
        "👇 *اختر خدمة من القائمة:*",
        { parse_mode: "Markdown", reply_markup: mainMenu }
    );
});

// --- 2. BROKERS LIST (ENHANCED) ---
bot.hears(["🏦 دليل الوسطاء", "/brokers"], async (ctx) => {
    await ctx.reply(
        "🏦 **شركاء النجاح والعروض الحصرية**\n\n" +
        "تعاقدنا مع أفضل الوسطاء لنضمن لك أعلى عائد كاش باك:\n\n" +
        "💎 **الفئة الذهبية (الأعلى عائداً):**\n" +
        "• **FXTM:** استرداد **$15.00** / لوت (أسبوعي) 🔥\n" +
        "• **Valetax:** استرداد **$10.00** / لوت (يومي) ⚡\n" +
        "• **INFINOX:** استرداد **$6.00** / لوت (أسبوعي)\n\n" +
        "🌍 **شركاء عالميون (نسب تنافسية):**\n" +
        "• OneRoyal\n" +
        "• HeadWay\n" +
        "• Monaxa\n" +
        "• Litefinance\n" +
        "• TOPFX\n\n" +
        "💡 *ملاحظة: يمكنك ربط حسابك الحالي أو فتح حساب جديد.*",
        { parse_mode: "Markdown", reply_markup: actionMenu }
    );
});

// --- 3. CURRENT OFFERS (RATES) ---
bot.hears(["💰 العروض الحالية", "/rates"], async (ctx) => {
    await ctx.reply(
        "📊 **متوسط استرداد السبريد (Cashback Rates)**\n\n" +
        "هذه الأرقام تقديرية وتعتمد على نوع حسابك والوسيط:\n\n" +
        "🔸 **الذهب:** يصل إلى $5.00 / لوت\n" +
        "🔸 **أزواج العملات:** تصل إلى $4.00 / لوت\n" +
        "🔸 **الكريبتو:** يصل إلى $10.00 / لوت\n" +
        "🔸 **المؤشرات:** تصل إلى $2.00 / لوت\n\n" +
        "🔗 *لمعرفة النسبة الدقيقة لكل وسيط، قم بزيارة موقعنا.*",
        { parse_mode: "Markdown", reply_markup: actionMenu }
    );
});

// --- 4. CALCULATOR LOGIC (SMART) ---
bot.hears(["🧮 احسب توفيرك", "/calc"], async (ctx) => {
    const keyboard = new InlineKeyboard();
    Object.keys(RATES).forEach(pair => {
        // Remove Arabic text for the button ID to be safe
        const cleanId = pair.split('(')[1]?.replace(')', '') || 'GENERIC';
        keyboard.text(pair, `calc_pair_${cleanId}`).row();
    });
    
    await ctx.reply("🧮 **حاسبة التوفير الذكية**\nاختر الأصل الذي تتداوله عادةً:", {
        reply_markup: keyboard
    });
});

// Step 2: Amount
bot.callbackQuery(/^calc_pair_(.+)$/, async (ctx) => {
    const pairId = ctx.match[1];
    const keyboard = new InlineKeyboard()
        .text("1 لوت يومياً", `calc_final_${pairId}_1`)
        .text("5 لوت يومياً", `calc_final_${pairId}_5`)
        .text("10 لوت يومياً", `calc_final_${pairId}_10`);

    await ctx.editMessageText(`📉 ممتاز. كم حجم تداولك اليومي التقديري؟`, {
        reply_markup: keyboard
    });
});

// Step 3: Result
bot.callbackQuery(/^calc_final_(.+)_(.+)$/, async (ctx) => {
    const pairId = ctx.match[1];
    const lots = parseInt(ctx.match[2]);
    
    // Logic to find rate
    let rate = 4.0; // Default
    if (pairId.includes("Gold")) rate = RATES['الذهب (Gold)'];
    if (pairId.includes("EUR")) rate = RATES['يورو دولار (EURUSD)'];
    if (pairId.includes("GBP")) rate = RATES['باوند دولار (GBPUSD)'];
    if (pairId.includes("Crypto")) rate = RATES['عملات رقمية (Crypto)'];

    const daily = (lots * rate).toFixed(2);
    const monthly = (lots * rate * 22).toFixed(2);

    await ctx.editMessageText(
        `💰 **تقرير استحقاقك المالي:**\n\n` +
        `بناءً على تداول ${lots} لوت...\n\n` +
        `💵 **أنت تضيع يومياً:** $${daily}\n` +
        `🗓️ **أنت تضيع شهرياً:** $${monthly}\n\n` +
        `🛑 **لماذا تترك هذا المبلغ للوسيط؟**\n` +
        `سجل الآن وسنقوم بتحويل هذا المبلغ إلى محفظتك تلقائياً.`,
        { parse_mode: "Markdown", reply_markup: actionMenu }
    );
});

// --- 5. LEGAL & SUPPORT (TRUST FACTORS) ---
bot.hears(["⚖️ الشروط القانونية", "/legal"], async (ctx) => {
    await ctx.reply(
        "⚖️ **الشفافية والامتثال**\n\n" +
        "1️⃣ **طبيعة العمل:** نحن نعمل كـ (Introducing Broker) ونشارك العمولة مع العميل.\n" +
        "2️⃣ **المخاطر:** التداول ينطوي على مخاطر. الكاش باك هو تخفيض للتكلفة وليس ضماناً للربح.\n" +
        "3️⃣ **البيانات:** نحن نلتزم بحماية خصوصية بياناتك وفق معايير التشفير العالمية.",
        { parse_mode: "Markdown" }
    );
});

bot.hears(["📞 تواصل معنا", "/help"], async (ctx) => {
    await ctx.reply(
        "📞 **نحن هنا لمساعدتك**\n\n" +
        "لديك استفسار حول وسيط معين أو طريقة السحب؟\n\n" +
        "📧 Email: support@bksheesh.com\n" +
        "🌐 Live Chat: متوفر على الموقع",
        { parse_mode: "Markdown" }
    );
});

// Fallback
bot.on("message", (ctx) => ctx.reply("القائمة الرئيسية:", { reply_markup: mainMenu }));

export const POST = webhookCallback(bot, "std/http");
