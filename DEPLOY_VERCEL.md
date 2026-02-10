# Déploiement Vercel avec Domaine Personnalisé

## 1. Prérequis
- Compte Vercel
- Domaine `bankassaward.org` acheté
- Git installé

## 2. Configuration
Le fichier `vercel.json` est déjà configuré avec votre domaine.

## 3. Déploiement

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Option B: Via GitHub (Recommandé)
1. Poussez les changements sur GitHub
2. Connectez Vercel à votre repository
3. Vercel déploiera automatiquement

## 4. Configuration du domaine

### Dans Vercel Dashboard:
1. Allez dans Project Settings > Domains
2. Ajoutez `bankassaward.org`
3. Vercel vous donnera les DNS à configurer

### Configuration DNS chez votre registrar:
```
Type: A
Name: @
Value: 76.76.19.61 (Vercel)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 5. Variables d'environnement
Dans Vercel Dashboard > Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://ilfsbpuyvisyfztqrccg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rxI5prOx2rcr8a1AgxW0Jw_LGREY4Zl
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 6. SSL Certificate
Vercel configure automatiquement un certificat SSL pour votre domaine.

## 7. Déploiement automatique
Chaque push sur `main` déclenchera un nouveau déploiement automatique.

## URL finale
https://bankassaward.org
