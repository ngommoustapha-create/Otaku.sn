"""
Point d'entrée pour Vercel (Python Serverless Function).

Vercel détecte automatiquement tout fichier .py dans le dossier /api
et cherche une variable nommée `app` (application ASGI). On réutilise
directement l'application FastAPI définie dans backend/server.py pour
ne pas dupliquer la logique métier.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from server import app  # noqa: E402,F401
