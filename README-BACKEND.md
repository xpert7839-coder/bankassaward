# Backend Node.js pour BKSS Award

Ce backend Node.js/Express remplace votre Supabase et est compatible avec Vercel.

## 🚀 Configuration

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de la base de données

Choisissez une option PostgreSQL:

**Option A: Railway (Recommandé)**
- Créez un compte sur [Railway](https://railway.app)
- Créez un nouveau projet PostgreSQL
- Copiez l'URL de connexion et mettez à jour `DATABASE_URL` dans `.env.local`

**Option B: Neon**
- Créez un compte sur [Neon](https://neon.tech)
- Créez une nouvelle base de données
- Mettez à jour `DATABASE_URL`

**Option C: Supabase (nouveau projet)**
- Créez un nouveau projet Supabase
- Utilisez la nouvelle URL de connexion

### 3. Variables d'environnement

Mettez à jour `.env.local`:
```env
JWT_SECRET=votre-clé-secrète-super-longue-et-complexe
DATABASE_URL=postgresql://votre-nouvelle-bdd
```

### 4. Migration des données

```bash
# Générer Prisma client
npm run db:generate

# Pousser le schéma
npm run db:push

# Migrer les données
node scripts/migrate-data.js
```

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### Catégories
- `GET /api/categories` - Lister toutes les catégories
- `POST /api/categories` - Créer une catégorie (admin)

### Candidats
- `GET /api/candidates` - Lister les candidats
- `POST /api/candidates` - Créer un candidat (admin)

### Votes
- `POST /api/votes` - Voter
- `GET /api/votes/user/:userId` - Voir les votes d'un utilisateur

### Admin
- `GET /api/admin/users` - Lister les utilisateurs (admin)
- `GET /api/admin/stats` - Statistiques (admin)

### Health Check
- `GET /api/health` - Vérifier le statut du serveur

## 🔐 Sécurité

- JWT pour l'authentification
- Middleware admin pour les routes protégées
- Validation des votes (un vote par utilisateur par catégorie)
- CORS configuré

## 🚀 Déploiement sur Vercel

1. Poussez votre code sur GitHub
2. Connectez votre repository à Vercel
3. Configurez les variables d'environnement dans Vercel
4. Déployez

Le backend sera automatiquement disponible via les API routes de Vercel.

## 🔄 Migration depuis Supabase

Le backend maintient la compatibilité avec votre frontend existant. Les endpoints sont similaires à ceux de Supabase:

| Ancien (Supabase) | Nouveau (Backend) |
|------------------|-------------------|
| `supabase.auth.signUp()` | `POST /api/auth/register` |
| `supabase.auth.signIn()` | `POST /api/auth/login` |
| `supabase.from('categories')` | `GET /api/categories` |
| `supabase.from('candidates')` | `GET /api/candidates` |

## 🛠️ Développement local

```bash
# Démarrer le serveur de développement
npm run dev

# Tester l'API
curl http://localhost:3000/api/health
```

## 📊 Structure de la base de données

La structure Prisma reste identique à votre schéma existant:
- Users (utilisateurs)
- Categories (catégories de vote)
- Candidates (candidats)
- Votes (votes des utilisateurs)
- Sessions (sessions d'authentification)
- AdminLogs (logs d'administration)
- AppSettings (paramètres de l'application)

## 🆘 Support

En cas de problème:
1. Vérifiez les logs de Vercel
2. Testez les endpoints avec Postman ou curl
3. Vérifiez la connexion à la base de données
4. Consultez les logs de Prisma avec `npx prisma studio`
