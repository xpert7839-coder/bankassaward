# 🚀 Déploiement sur Render - Guide Complet

## ✅ **Pourquoi Render ?**

- ✅ **Support Next.js complet** : API routes + pages statiques
- ✅ **Domaine personnalisé gratuit** : bankassaward.org
- ✅ **Variables d'environnement faciles**
- ✅ **Pas de configuration complexe**
- ✅ **Déploiement automatique depuis GitHub**

---

## 📋 **Étapes de Déploiement**

### **1. Créer Compte Render**
1. Allez sur [render.com](https://render.com)
2. Sign up avec GitHub (gratuit)
3. Autorisez l'accès au repo `Kanaga-G/bkss-award`

### **2. Créer Web Service**
1. **Dashboard** → **New+** → **Web Service**
2. **Connect Repository** → `Kanaga-G/bkss-award`
3. **Configuration** :
   ```
   Name: BKSS Awards
   Environment: Node
   Region: Europe (Paris)
   Branch: main
   Build Command: npm run build
   Start Command: npm run start
   ```

### **3. Variables d'Environnement**
Dans **Environment** → **Add Environment Variable** :

```
DATABASE_URL=postgresql://postgres:l5OVhoXNjhPTjocp@db.ilfsbpuyvisyfztqrccg.supabase.co:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://ilfsbpuyvisyfztqrccg.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODc2NzIsImV4cCI6MjA4NTU2MzY3Mn0.-9B87ZcM9LLamB0sQjZM60Jz4Hlwg1npeFfIj-Bg_TA

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM

NODE_ENV=production
```

### **4. Déployer**
1. **Create Web Service**
2. Attendre le build (2-3 minutes)
3. Le site sera accessible sur `https://bkss-awards.onrender.com`

---

## 🌐 **Configuration Domaine Personnalisé**

### **1. Ajouter le Domaine**
1. **Settings** → **Custom Domains**
2. **Add Custom Domain** : `bankassaward.org`
3. Render vous donnera les enregistrements DNS

### **2. Configuration DNS**
Chez votre registrar (GoDaddy, Namecheap, etc.) :

```
Type: CNAME
Name: @
Value: bkss-awards.onrender.com
TTL: 300 (ou par défaut)
```

### **3. Validation**
- Attendez la propagation DNS (5-30 minutes)
- Testez : `https://bankassaward.org`

---

## 🎯 **Corrections Incluses**

### **✅ Modifications des Candidats**
- API améliorée avec logging détaillé
- Mapping explicite des champs
- Gestion d'erreurs améliorée

### **✅ Redirection Auth**
- Pages `/auth` et `/auth/register` créées
- Correction des liens 404

### **✅ Persistance Données**
- Page actuelle, thème, votes, leadership
- Statut des votes intelligent

### **✅ Prix Leadership**
- Affiche le nom du gagnant quand révélé
- Titre dynamique

---

## 🔧 **Si Problème**

### **Build échoue**
- Vérifiez les variables d'environnement
- Regardez les logs de build sur Render

### **API ne fonctionne pas**
- Vérifiez `DATABASE_URL` et clés Supabase
- Testez avec `https://bkss-awards.onrender.com/api/test-connection`

### **Domaine ne fonctionne pas**
- Attendez la propagation DNS
- Vérifiez l'enregistrement CNAME

---

## 📊 **Avantages Render vs Netlify/Vercel**

| Feature | Render | Netlify | Vercel |
|---------|--------|---------|--------|
| API Routes | ✅ | ❌ Complex | ✅ (limité) |
| Domaine Gratuit | ✅ | ✅ | ✅ |
| Variables Env | ✅ Facile | ✅ | ✅ |
| Next.js Complet | ✅ | ❌ Limité | ✅ |
| Build Simple | ✅ | ❌ Complexe | ✅ |

**Render est le meilleur choix pour votre application !** 🎯

---

## 🚀 **Lien Direct**

Une fois déployé :
- **URL temporaire** : `https://bkss-awards.onrender.com`
- **URL finale** : `https://bankassaward.org`

**Toutes les corrections sont déjà sur GitHub, prêtes pour le déploiement !** 🎉
