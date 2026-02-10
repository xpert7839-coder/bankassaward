# 🌐 Configuration Variables Environnement Render

## 📋 Variables à Ajouter sur Render

Allez sur votre dashboard Render → Web Service → Environment

### **1. Database URL**
```
Nom: DATABASE_URL
Valeur: postgresql://postgres:l5OVhoXNjhPTjocp@db.ilfsbpuyvisyfztqrccg.supabase.co:5432/postgres
```

### **2. Supabase Public URL**
```
Nom: NEXT_PUBLIC_SUPABASE_URL
Valeur: https://ilfsbpuyvisyfztqrccg.supabase.co
```

### **3. Supabase Anonymous Key**
```
Nom: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODc2NzIsImV4cCI6MjA4NTU2MzY3Mn0.-9B87ZcM9LLamB0sQjZM60Jz4Hlwg1npeFfIj-Bg_TA
```

### **4. Supabase Service Role Key**
```
Nom: SUPABASE_SERVICE_ROLE_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXRodW1pbW5rZmRjb2tmbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzY3MiwiZXhwIjoyMDg1NTYzNjcyfQ.HqlD0qlhAMtM-Jj_gLuOewnG3xzVnfj83M4VjiLSwdM
```

### **5. Node Environment**
```
Nom: NODE_ENV
Valeur: production
```

## 🚀 Étapes Déploiement Render

1. **New+** → **Web Service**
2. **Connect Repository** → `Kanaga-G/bkss-award`
3. **Configuration**:
   - Name: `bkss-awards`
   - Environment: `Node`
   - Build Command: `npm run build`
   - Start Command: `npm run start`
4. **Advanced** → **Add Environment Variables** (copier les 5 variables ci-dessus)
5. **Create Web Service**

## 🌐 Configuration Domaine

1. **Settings** → **Custom Domains**
2. **Add Custom Domain**: `bankassaward.org`
3. **DNS Settings**: Render vous donnera un CNAME
4. Chez votre registrar:
   ```
   Type: CNAME
   Name: @
   Value: bkss-awards.onrender.com
   ```

## ✅ Vérification

Après déploiement:
1. Visitez `https://bankassaward.org`
2. Vérifiez la console (F12) → plus d'erreurs "Failed to fetch"
3. Testez les fonctionnalités (votes, admin, etc.)

---

**La connexion fonctionne localement, il faut juste configurer les variables sur Render !** 🎯
