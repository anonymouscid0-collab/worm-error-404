const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationCode(email, code) {
  const mailOptions = {
    from: `"WORM ERROR 404" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Code de vérification WORM ERROR 404',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #333;border-radius:10px;background:#0a0a0a;color:#fff;">
        <h2 style="color:#ff4444;text-align:center;">🐛 WORM ERROR 404</h2>
        <p>Bonjour,</p>
        <p>Voici ton code de vérification :</p>
        <div style="text-align:center;padding:20px;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#00ff88;">${code}</span>
        </div>
        <p style="color:#888;font-size:12px;">Ce code expire dans 10 minutes.</p>
        <p style="color:#888;font-size:12px;">Si tu n'as pas demandé ce code, ignore cet email.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

async function sendWelcome(email, name) {
  const mailOptions = {
    from: `"WORM ERROR 404" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Bienvenue sur WORM ERROR 404',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;background:#0a0a0a;color:#fff;">
        <h2 style="color:#ff4444;">🐛 Bienvenue ${name} !</h2>
        <p>Ton compte est vérifié. Tu as <strong>15 messages gratuits</strong> pour tester l'IA.</p>
        <p>Passe au plan Pro pour illimité.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationCode, sendWelcome };
