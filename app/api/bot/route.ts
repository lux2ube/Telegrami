import { Bot, webhookCallback, InlineKeyboard } from "grammy";

// 1. Force Vercel to treat this as dynamic (critical for bots)
export const dynamic = 'force-dynamic';

// 2. Security Check
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is unset");

const bot = new Bot(token);

// --- SETTINGS: Cashback Rates per Lot ($) ---
const RATES: Record<string, number> = {
    'GOLD (XAU)': 4.0,  
    'EURUSD': 2.5,
    'GBPUSD': 3.0, 
    'US30': 1.5,
    'NASDAQ': 1.5,
    'OIL': 3.0
};

// --- A. WELCOME MESSAGE ---
bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("💸 كم سأسترجع؟ (الأسعار)", "menu_rates").row()
        .text("🧮 حاسبة التوفير الذكية", "calc_start").row()
        .url("🔗 ربط حسابي فوراً", "https://www.bksheesh.com/register");

    await ctx.reply(
        "**يا هلا.. خلنا نكون واضحين.** 🤝\n\n" +
        "أنت تعرف إن منصات التداول تأخذ منك 'عمولة' أول ما تفتح الصفقة.\n" +
        "السؤال هو: **ليش تترك لهم هذا المبلغ وأنت تقدر ترجعه لجيبك؟**\n\n" +
        "أنا وظيفتي أجمع لك العمولات المستحقة وأحولها لك كاش.\n" +
        "👇 **اختر خدمتك:**",
        { parse_mode: "Markdown", reply_markup: keyboard }
    );
});

// --- B. CALCULATOR LOGIC (Step-by-Step) ---

// 1. Ask for Pair
bot.callbackQuery("calc_start", async (ctx) => {
    const keyboard = new InlineKeyboard();
    // Generate buttons from our RATES list
    Object.keys(RATES).forEach(pair => {
        keyboard.text(pair, `calc_pair_${pair}`).row();
    });
    keyboard.text("🔙 رجوع", "menu_main");

    await ctx.editMessageText("📉 **خطوة 1:** ما هو الزوج الذي تتداوله غالباً؟", {
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
});

// 2. Ask for Lot Size
bot.callbackQuery(/^calc_pair_(.+)$/, async (ctx) => {
    const pair = ctx.match[1]; 
    
    const keyboard = new InlineKeyboard()
        .text("1 Lot", `calc_res_${pair}_1`)
        .text("5 Lots", `calc_res_${pair}_5`)
        .text("10 Lots", `calc_res_${pair}_10`).row()
        .text("🔙 رجوع", "calc_start");

    await ctx.editMessageText(`⚖️ **خطوة 2:** اخترت *${pair}*.\nكم لوت تتداول تقريباً في اليوم؟`, {
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
});

// 3. Show Results (The Closing Hook)
bot.callbackQuery(/^calc_res_(.+)_(.+)$/, async (ctx) => {
    const pair = ctx.match[1];
    const lots = parseInt(ctx.match[2]);
    
    const rate = RATES[pair] || 2.0;
    const dailySaving = lots * rate;
    const monthlySaving = dailySaving * 22; // 22 working days

    const keyboard = new InlineKeyboard()
        .url("🔥 استرجع هذه الأموال الآن", "https://www.bksheesh.com/register")
        .row()
        .text("🔄 حساب عملية أخرى", "calc_start");

    await ctx.editMessageText(
        `💰 **تقرير التوفير الخاص بك:**\n\n` +
        `إذا كنت تتداول *${lots} لوت* على *${pair}*...\n\n` +
        `💵 ستستعيد يومياً: **$${dailySaving}**\n` +
        `🗓️ ستستعيد شهرياً: **$${monthlySaving}**\n\n` +
        `🛑 **أنت حالياً تخسر هذا المبلغ!**\nهذه أرباحك ومن حقك استعادتها. سجل حسابك الآن لنبدأ التحويل لمحفظتك.`,
        { parse_mode: "Markdown", reply_markup: keyboard }
    );
});

// --- C. RATES LIST ---
bot.callbackQuery("menu_rates", async (ctx) => {
    let msg = "📊 **قائمة الاسترداد النقدي (لكل 1 لوت):**\n\n";
    for (const [key, val] of Object.entries(RATES)) {
        msg += `🔹 ${key}:  **$${val}**\n`;
    }
    
    const keyboard = new InlineKeyboard()
        .url("🔗 ابدأ الاسترداد", "https://www.bksheesh.com/register")
        .row()
        .text("🔙 القائمة الرئيسية", "menu_main");

    await ctx.editMessageText(msg, { parse_mode: "Markdown", reply_markup: keyboard });
});

// --- D. BACK TO MAIN MENU ---
bot.callbackQuery("menu_main", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("💸 كم سأسترجع؟ (الأسعار)", "menu_rates").row()
        .text("🧮 حاسبة التوفير الذكية", "calc_start").row()
        .url("🔗 ربط حسابي فوراً", "https://www.bksheesh.com/register");
        
    await ctx.editMessageText(
        "**يا هلا.. خلنا نكون واضحين.** 🤝\n\n" +
        "اختر خدمتك من الأسفل:",
        { parse_mode: "Markdown", reply_markup: keyboard }
    );
});

// --- E. VERCEL CONNECTION ---
export const POST = webhookCallback(bot, "std/http");
