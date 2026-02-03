# 📱 Guide de Configuration SMS Production

## 🎯 Objectif
Configurer l'envoi réel des SMS de validation pour les inscriptions sur BANKASS AWARDS.

## 🔧 Étapes de Configuration

### 1. **Créer un Compte Africa's Talking**

1. **Inscription** : Allez sur [https://www.africastalking.com/](https://www.africastalking.com/)
2. **Créez un compte** : Remplissez le formulaire d'inscription
3. **Vérification** : Vérifiez votre email et votre numéro de téléphone
4. **Dashboard** : Accédez à votre dashboard

### 2. **Obtenir les Clés API**

1. **Connectez-vous** à votre dashboard Africa's Talking
2. **Allez dans Settings** → **API Keys**
3. **Générez une clé API** : Copiez la clé générée
4. **Notez votre username** : C'est généralement votre email ou nom d'utilisateur

### 3. **Configurer les Variables d'Environnement**

Dans le fichier `.env.local`, remplacez les valeurs par défaut :

```bash
# Configuration SMS - Africa's Talking
AFRICASTALKING_API_KEY=atsk_1234567890abcdef1234567890abcdef
AFRICASTALKING_USERNAME=votre_username_africastalking
SMS_SENDER_ID=BANKASS
```

### 4. **Tester la Configuration**

#### **Mode Test (Sandbox)**
```bash
# Pour tester sans envoyer de vrais SMS
AFRICASTALKING_USERNAME=sandbox
```

#### **Mode Production**
```bash
# Pour envoyer de vrais SMS
AFRICASTALKING_USERNAME=votre_username_production
AFRICASTALKING_API_KEY=votre_cle_production
```

## 📋 Messages SMS Envoyés

### 📨 **Code de Validation**
```
BANKASS AWARDS - Votre code de validation est: 123456
```

### 🔐 **Mot de Passe**
```
Bienvenue sur BANKASS AWARDS! Votre mot de passe est: AbC12345
```

## 🌍 Pays Supportés

Africa's Talking supporte tous les pays africains, y compris :
- ✅ **Mali** (+223)
- ✅ **Sénégal** (+221)
- ✅ **Côte d'Ivoire** (+225)
- ✅ **Burkina Faso** (+226)
- ✅ **Niger** (+227)
- ✅ **Guinée** (+224)
- Et beaucoup plus...

## 💰 Coûts SMS

### **Tarifs Africa's Talking** (approximatifs)
- **Mali** : ~0.015$ par SMS
- **Sénégal** : ~0.015$ par SMS
- **Côte d'Ivoire** : ~0.015$ par SMS

### **Estimation pour 1000 inscriptions**
- **2 SMS par inscription** (code + mot de passe)
- **Coût total** : ~30$ pour 1000 utilisateurs

## 🔧 Configuration Alternative

### **Twilio (International)**
```typescript
// Dans lib/sms-service.ts
export const smsConfig: SMSConfig = {
  enabled: true,
  provider: "twilio",
  apiKey: process.env.TWILIO_API_KEY,
  senderId: process.env.TWILIO_PHONE_NUMBER
}
```

Variables d'environnement :
```bash
TWILIO_API_KEY=SK1234567890abcdef
TWILIO_PHONE_NUMBER=+1234567890
```

### **Orange SMS API (Mali)**
```typescript
export const smsConfig: SMSConfig = {
  enabled: true,
  provider: "orange",
  apiKey: process.env.ORANGE_SMS_API_KEY,
  senderId: "BANKASS"
}
```

## 🚀 Déploiement

### **1. Développement Local**
```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm run dev
```

### **2. Production (Vercel/Netlify)**
Dans les variables d'environnement de votre plateforme :
- `AFRICASTALKING_API_KEY`
- `AFRICASTALKING_USERNAME`
- `SMS_SENDER_ID`

## 🔍 Tests et Validation

### **Test 1 : Envoi de Code**
1. **Inscrivez-vous** avec un numéro malien
2. **Vérifiez** que vous recevez le SMS
3. **Validez** le code reçu

### **Test 2 : Envoi de Mot de Passe**
1. **Après validation du code**
2. **Vérifiez** que vous recevez le mot de passe
3. **Testez** la connexion

### **Test 3 : Gestion d'Erreurs**
1. **Numéro invalide** : Testez avec un numéro non malien
2. **API down** : Testez sans clé API
3. **Rate limiting** : Testez plusieurs envois rapides

## 📊 Monitoring

### **Logs SMS**
```typescript
// Les logs apparaissent dans la console
✅ SMS envoyé avec succès à +22376839294, MessageId: ATXid_123456
❌ Échec envoi SMS à +22376839294: InsufficientBalance
```

### **Métriques à Surveiller**
- **Taux de livraison** : % de SMS reçus
- **Temps de livraison** : Temps moyen d'envoi
- **Coûts** : Dépenses SMS mensuelles
- **Erreurs** : Types et fréquences des échecs

## 🛠️ Dépannage

### **Problèmes Communs**

#### **❌ "Clé API non configurée"**
```bash
# Solution : Ajouter la clé dans .env.local
AFRICASTALKING_API_KEY=votre_vraie_cle_api
```

#### **❌ "Échec envoi SMS"**
1. **Vérifiez la clé API**
2. **Vérifiez le username**
3. **Vérifiez le solde du compte**
4. **Vérifiez le format du numéro**

#### **❌ "Réponse API invalide"**
1. **Vérifiez la connexion internet**
2. **Vérifiez les headers de la requête**
3. **Contactez le support Africa's Talking**

### **Support Africa's Talking**
- **Email** : support@africastalking.com
- **Téléphone** : +254 719 085 000
- **Documentation** : https://build.at-labs.io/docs/sms%2Fsending

## 🔒 Sécurité

### **Protection des Clés**
- ❌ **Jamais** exposer les clés API dans le code client
- ✅ **Toujours** utiliser les variables d'environnement
- ✅ **Utiliser** des clés différentes pour dev/prod

### **Validation des Numéros**
- ✅ **Seulement** les numéros maliens acceptés
- ✅ **Format normalisé** : +223XXXXXXXX
- ✅ **Validation regex** stricte

## 📈 Scalabilité

### **Pour 10,000+ utilisateurs**
- **Budget SMS** : ~300$ par mois
- **Rate limiting** : Configuré dans le code
- **Monitoring** : Essentiel pour les performances

### **Optimisations**
- **Batch processing** : Pour les envois en masse
- **Queue system** : Pour gérer les pics
- **Fallback provider** : Twilio en backup

---

## 🎉 Conclusion

Votre système est maintenant prêt pour la production ! Les utilisateurs maliens recevront réellement les codes de validation et mots de passe par SMS, garantissant une expérience sécurisée et professionnelle.

**Prochaines étapes :**
1. Configurez votre compte Africa's Talking
2. Ajoutez les clés API dans `.env.local`
3. Testez avec un numéro réel
4. Déployez en production

🚀 **Bonne chance avec votre lancement !**
