# NVIDIA NIM to OpenAI Proxy pour Janitor AI

Ce proxy permet d'utiliser NVIDIA NIM avec Janitor AI en émulant l'API OpenAI.

## 🚀 Déploiement sur Railway.com

### 1. Préparation

1. Créez un compte sur [Railway.com](https://railway.app)
2. Obtenez votre clé API NVIDIA depuis [NVIDIA NGC](https://build.nvidia.com)

### 2. Déploiement

**Option A : Depuis GitHub (recommandé)**

1. Créez un nouveau repository GitHub et uploadez ces fichiers :
   - `server.js`
   - `package.json`
   - `README.md`

2. Sur Railway :
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository
   - Railway détectera automatiquement qu'il s'agit d'un projet Node.js

**Option B : Depuis CLI Railway**

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

### 3. Configuration des variables d'environnement

Dans Railway, allez dans votre projet > Variables et ajoutez :

```
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
PORT=3000
```

**Important :** 
- `NVIDIA_API_KEY` : Votre clé API NVIDIA (obligatoire)
- `NVIDIA_BASE_URL` : L'URL de base de NVIDIA NIM (par défaut : https://integrate.api.nvidia.com/v1)
- `PORT` : Le port sera automatiquement défini par Railway

### 4. Obtenir votre URL

Une fois déployé, Railway vous donnera une URL comme :
```
https://votre-projet.up.railway.app
```

## 🎮 Configuration dans Janitor AI

1. Allez dans les paramètres de Janitor AI
2. Sélectionnez "OpenAI" comme fournisseur d'API
3. Entrez votre URL Railway comme URL de base :
   ```
   https://votre-projet.up.railway.app/v1
   ```
4. Pour la clé API, vous pouvez mettre n'importe quoi (comme "dummy-key") car l'authentification se fait via la variable d'environnement
5. Choisissez un modèle NVIDIA disponible comme :
   - `meta/llama-3.1-405b-instruct`
   - `meta/llama-3.1-70b-instruct`
   - `mistralai/mixtral-8x7b-instruct-v0.1`

## 🧪 Test de l'API

### Tester que le proxy fonctionne :

```bash
curl https://votre-projet.up.railway.app/
```

Réponse attendue :
```json
{
  "status": "ok",
  "message": "NVIDIA NIM to OpenAI Proxy is running"
}
```

### Tester les modèles disponibles :

```bash
curl https://votre-projet.up.railway.app/v1/models
```

### Tester une completion :

```bash
curl -X POST https://votre-projet.up.railway.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-key" \
  -d '{
    "model": "meta/llama-3.1-70b-instruct",
    "messages": [
      {"role": "user", "content": "Bonjour!"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

## 📝 Endpoints disponibles

- `GET /` - Status du proxy
- `GET /health` - Health check
- `GET /v1/models` - Liste des modèles disponibles
- `POST /v1/chat/completions` - Completions de chat (compatible OpenAI)
- `POST /v1/completions` - Completions legacy

## 🔧 Modèles NVIDIA NIM populaires

- `meta/llama-3.1-405b-instruct` - Le plus puissant
- `meta/llama-3.1-70b-instruct` - Bon équilibre
- `meta/llama-3.1-8b-instruct` - Plus rapide
- `mistralai/mixtral-8x7b-instruct-v0.1`
- `mistralai/mistral-7b-instruct-v0.3`

## 🐛 Dépannage

**Erreur 500 - NVIDIA_API_KEY not configured**
- Vérifiez que vous avez bien ajouté la variable d'environnement dans Railway

**Erreur 401 - Unauthorized**
- Votre clé API NVIDIA n'est pas valide ou a expiré

**Erreur 404 sur Janitor AI**
- Assurez-vous d'avoir ajouté `/v1` à la fin de votre URL dans Janitor AI

**Le proxy ne répond pas**
- Vérifiez les logs dans Railway
- Assurez-vous que le déploiement est terminé

## 📊 Logs

Pour voir les logs en temps réel sur Railway :
1. Allez dans votre projet
2. Cliquez sur l'onglet "Deployments"
3. Cliquez sur le déploiement actif
4. Les logs s'afficheront automatiquement

## 💡 Notes

- Ce proxy est compatible avec Janitor AI et tout autre service utilisant l'API OpenAI
- Le streaming est supporté
- Les requêtes sont loggées pour faciliter le débogage
- Railway offre un plan gratuit limité, consultez leurs tarifs pour une utilisation intensive
