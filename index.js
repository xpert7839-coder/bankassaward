const nodemailer = require("nodemailer");

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "hogonstore1997@gmail.com",
    pass: "hthgssrilohaqpov",
  },
});

// Fonction pour générer un code de vérification à 6 chiffres
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Fonction pour récupérer l'email de l'utilisateur
async function getUserEmail() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Entrez l\'email de l\'utilisateur: ', (email) => {
      rl.close();
      resolve(email.trim());
    });
  });
}

// Fonction principale pour envoyer le code de vérification
async function sendVerificationCode() {
  try {
    // Récupérer l'email de l'utilisateur
    const userEmail = await getUserEmail();
    
    if (!userEmail) {
      console.error('❌ Erreur: Email non fourni');
      return;
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      console.error('❌ Erreur: Format d\'email invalide');
      return;
    }

    // Générer un code de vérification
    const verificationCode = generateVerificationCode();
    
    // Créer le contenu de l'email
    const mailOptions = {
      from: '"BANKASS AWARDS" <hogonstore1997@gmail.com>',
      to: userEmail,
      subject: "🔐 Code de Vérification - BANKASS AWARDS",
      text: `Votre code de vérification BANKASS AWARDS est: ${verificationCode}\n\nCe code expire dans 10 minutes.\nSi vous n'avez pas demandé ce code, ignorez cet email.`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BANKASS AWARDS - Code de vérification</title>

        <style>
            body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background-color: #f4f5f7;
            margin: 0;
            padding: 24px;
            color: #1f2937;
            }

            .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            overflow: hidden;
            }

            .header {
            padding: 28px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
            }

            .logo {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
            }

            .title {
            margin-top: 8px;
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            }

            .content {
            padding: 32px 28px;
            text-align: center;
            }

            .content p {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 20px;
            }

            .code-container {
            background-color: #f9fafb;
            border: 1px dashed #9ca3af;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            font-family: "Courier New", Courier, monospace;
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            user-select: all;
            }

            .info {
            text-align: left;
            background-color: #f9fafb;
            border-left: 4px solid #9ca3af;
            padding: 12px 14px;
            margin-top: 14px;
            font-size: 14px;
            color: #374151;
            }

            .info strong {
            color: #111827;
            }

            .footer {
            border-top: 1px solid #e5e7eb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            }
        </style>
        </head>

        <body>
        <div class="container">
            <div class="header">
            <div class="logo">BANKASS AWARDS</div>
            <div class="title">Code de vérification</div>
            </div>

            <div class="content">
            <p>
                Bonjour,<br>
                Veuillez utiliser le code ci-dessous pour finaliser votre connexion à
                <strong>BANKASS AWARDS</strong>.
            </p>

            <div class="code-container">
                ${verificationCode}
            </div>

            <div class="info">
                <strong>Expiration :</strong> Ce code est valide pendant <strong>10 minutes</strong>.
            </div>

            <div class="info">
                <strong>Sécurité :</strong> Ne communiquez jamais ce code à un tiers.
            </div>
            </div>

            <div class="footer">
            <p>
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
            </p>
            <p style="margin-top: 8px;">
                <strong>BANKASS AWARDS</strong><br>
                Célébrons l'excellence ensemble
            </p>
            </div>
        </div>
        </body>
        </html>
      `
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email envoyé avec succès !");
    console.log("📧 Destinataire:", userEmail);
    console.log("🔐 Code de vérification:", verificationCode);
    console.log("🆔 Message ID:", info.messageId);
    console.log("⏰ Expire dans: 10 minutes");
    
    // Afficher un résumé
    console.log("\n" + "=".repeat(50));
    console.log("📋 RÉCAPITULATIF DE L'ENVOI");
    console.log("=".repeat(50));
    console.log(`👤 Utilisateur: ${userEmail}`);
    console.log(`🔐 Code: ${verificationCode}`);
    console.log(`📧 Email ID: ${info.messageId}`);
    console.log(`⏰ Validité: 10 minutes`);
    console.log("=".repeat(50));

  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'email:", err.message);
    
    // Afficher des suggestions pour résoudre les problèmes courants
    console.log("\n💡 SUGGESTIONS DE DÉBOGAGE:");
    console.log("1. Vérifiez votre connexion internet");
    console.log("2. Vérifiez les identifiants Gmail");
    console.log("3. Activez 'Accès aux applications moins sécurisées' sur Gmail");
    console.log("4. Vérifiez que le pare-feu ne bloque pas le port 587");
  }
}

// Fonction pour tester la connexion au serveur SMTP
async function testSMTPConnection() {
  try {
    console.log("🔌 Test de connexion au serveur SMTP...");
    await transporter.verify();
    console.log("✅ Connexion SMTP réussie !");
    return true;
  } catch (err) {
    console.error("❌ Erreur de connexion SMTP:", err.message);
    return false;
  }
}

// Programme principal
async function main() {
  console.log("🏆 BANKASS AWARDS - SYSTÈME D'ENVOI DE CODE DE VÉRIFICATION");
  console.log("=".repeat(60));
  
  // Tester la connexion SMTP
  const smtpConnected = await testSMTPConnection();
  
  if (!smtpConnected) {
    console.log("\n❌ Impossible de continuer sans connexion SMTP valide.");
    process.exit(1);
  }
  
  // Envoyer le code de vérification
  await sendVerificationCode();
  
  console.log("\n🎉 Opération terminée !");
  process.exit(0);
}

// Gérer les erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('💥 Erreur non capturée:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Rejet non géré à:', promise, 'raison:', reason);
  process.exit(1);
});

// Lancer le programme
main();
