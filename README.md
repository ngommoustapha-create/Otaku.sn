# Déploiement gratuit sur Vercel

Ce projet a été réorganisé pour tourner **entièrement sur Vercel** (frontend +
API), avec **MongoDB Atlas** comme seule base de données externe (gratuite).
Tu n'as besoin que de 3 comptes gratuits : GitHub, MongoDB Atlas, Vercel.

## 1. Mettre le code sur GitHub

1. Crée un compte sur github.com si tu n'en as pas.
2. Crée un nouveau dépôt (Repository), par exemple `otaku-sn`.
3. Mets tout le contenu de ce dossier dedans (upload direct sur github.com
   fonctionne si tu ne connais pas encore Git — bouton "Add file" > "Upload
   files").

## 2. Créer la base de données (MongoDB Atlas — gratuit)

1. Va sur https://www.mongodb.com/cloud/atlas/register et crée un compte.
2. Crée un cluster gratuit (option "M0 Free").
3. Dans "Database Access", crée un utilisateur avec mot de passe.
4. Dans "Network Access", ajoute `0.0.0.0/0` (autoriser depuis n'importe où).
5. Clique "Connect" > "Drivers", copie la chaîne de connexion. Elle
   ressemble à :
   `mongodb+srv://monuser:monmotdepasse@cluster0.xxxxx.mongodb.net/`

Garde cette chaîne de côté, tu en as besoin à l'étape suivante.

## 3. Déployer sur Vercel

1. Va sur https://vercel.com, crée un compte (tu peux te connecter avec
   GitHub directement).
2. "Add New..." > "Project", puis importe le dépôt GitHub créé à l'étape 1.
3. Dans les réglages du projet avant de déployer :
   - **Framework Preset** : `Other`
   - **Build Command** : `cd frontend && yarn install && yarn build`
   - **Output Directory** : `frontend/build`
   - **Install Command** : laisse vide ou mets `echo skip`
4. Dans "Environment Variables", ajoute (copie les valeurs depuis
   `backend/.env.example`, en les adaptant) :
   - `MONGO_URL` → la chaîne Atlas de l'étape 2
   - `DB_NAME` → `otaku_sn` (ou autre nom de ton choix)
   - `JWT_SECRET` → une valeur unique (voir le fichier `.env.example`)
   - `ADMIN_EMAIL` → l'email avec lequel tu te connecteras à l'admin
   - `ADMIN_PASSWORD` → le mot de passe de l'admin
   - `WHATSAPP_NUMBER` → ton numéro WhatsApp (format international sans le +)
   - `CORS_ORIGINS` → `*`
5. Clique "Deploy".

Une fois le déploiement terminé, Vercel te donne une URL du type
`https://otaku-sn.vercel.app`. Le site (catalogue + admin) est en ligne.

## 4. Dernière étape

Retourne dans les variables d'environnement Vercel et mets à jour
`FRONTEND_URL` avec l'URL réelle donnée par Vercel, puis relance un
déploiement ("Redeploy") pour que les liens de partage produit soient
corrects.

L'admin est accessible sur `https://ton-site.vercel.app/admin/login` avec
l'email/mot de passe définis à l'étape 3.

## Point d'attention : les images produits

Le bouton "uploader une image" dans l'admin dépend d'un service de stockage
externe (`EMERGENT_LLM_KEY`). Si tu ne renseignes pas cette clé, ce bouton
précis ne fonctionnera pas — mais tu peux toujours **coller directement une
URL d'image** dans le champ prévu pour un produit (par exemple un lien
d'image hébergée sur Imgur, Cloudinary, ou n'importe quel site), ce qui
fonctionne sans aucune configuration supplémentaire.

## Si quelque chose ne marche pas

Copie-colle le message d'erreur exact affiché par Vercel (onglet
"Deployments" > clique sur le déploiement en échec > "Build Logs") et
renvoie-le pour obtenir de l'aide sur ce point précis.
