"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = "admin@wormerror404.dev";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const passwordHash = await bcryptjs_1.default.hash("ChangeMe123!", 12);
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: "CID (admin)",
                role: "ADMIN",
                plan: "PRO",
            },
        });
        console.log(`✔ Compte admin créé : ${adminEmail} / ChangeMe123! (à changer !)`);
    }
    else {
        console.log("✔ Compte admin déjà existant, aucune action.");
    }
    const defaultSettings = [
        { key: "site_name", value: "WORM ERROR // 404" },
        { key: "site_tagline", value: "L'intelligence artificielle pensée pour les développeurs." },
        { key: "free_message_limit", value: "15" },
        { key: "pro_price_usd", value: "10" },
        { key: "whatsapp_channel_url", value: "https://whatsapp.com/channel/0029Vb8jYDHIXnlp8x3PsY09" },
        { key: "telegram_username", value: "" },
    ];
    for (const setting of defaultSettings) {
        await prisma.siteSetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }
    console.log("✔ Paramètres du site initialisés.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map