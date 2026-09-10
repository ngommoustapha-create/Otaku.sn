from dotenv import load_dotenv
load_dotenv()

import hashlib
import logging
import os
import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import jwt
import requests
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@otaku.sn").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Otaku@2026")
DEFAULT_WHATSAPP = os.environ.get("WHATSAPP_NUMBER", "221781920947")

APP_NAME = "otaku-sn"

CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")


def cloudinary_upload(data: bytes, folder: str) -> str:
    """Upload an image to Cloudinary (signed upload) and return its public URL."""
    if not (CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
        raise HTTPException(
            status_code=500,
            detail="Stockage d'images non configuré (variables CLOUDINARY_* manquantes).",
        )
    timestamp = str(int(datetime.now(timezone.utc).timestamp()))
    params_to_sign = f"folder={APP_NAME}/{folder}&timestamp={timestamp}"
    signature = hashlib.sha1((params_to_sign + CLOUDINARY_API_SECRET).encode()).hexdigest()
    resp = requests.post(
        f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload",
        data={
            "api_key": CLOUDINARY_API_KEY,
            "timestamp": timestamp,
            "signature": signature,
            "folder": f"{APP_NAME}/{folder}",
        },
        files={"file": data},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["secure_url"]


app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Auth ----------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Accès refusé")
    return user


class LoginIn(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def login(data: LoginIn, request: Request):
    email = data.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        if datetime.fromisoformat(attempt["locked_until"]) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        attempts = (attempt.get("attempts", 0) if attempt else 0) + 1
        update = {"identifier": identifier, "attempts": attempts}
        if attempts >= 5:
            update["attempts"] = 0
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    await db.login_attempts.delete_one({"identifier": identifier})
    return {"token": create_token(user["id"], email), "user": {"email": email, "role": user.get("role", "admin")}}


@api_router.get("/auth/me")
async def auth_me(admin: dict = Depends(get_current_admin)):
    return admin


# ---------- Products ----------

class ProductIn(BaseModel):
    name: str
    category: str
    price: int
    old_price: Optional[int] = None
    description: str = ""
    sizes: List[str] = []
    out_of_stock_sizes: List[str] = []
    image: str = ""
    is_in_stock: bool = True
    is_featured: bool = False


def serialize_product(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api_router.get("/products")
async def list_products(category: Optional[str] = None):
    query = {}
    if category and category != "Tous":
        query["category"] = category
    docs = await db.products.find(query, {"_id": 0}).sort([("is_featured", -1), ("created_at", -1)]).to_list(500)
    return docs


@api_router.post("/admin/products")
async def create_product(data: ProductIn, admin: dict = Depends(get_current_admin)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    return serialize_product(doc)


@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, data: ProductIn, admin: dict = Depends(get_current_admin)):
    result = await db.products.update_one({"id": product_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return {"ok": True}


# ---------- Uploads & files ----------

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


async def handle_upload(file: UploadFile, folder: str) -> dict:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Format d'image non supporté (jpg, png, webp, gif)")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image trop lourde (max 10 Mo)")
    url = cloudinary_upload(data, folder)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": url,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": url}


@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    return await handle_upload(file, "products")


@api_router.post("/uploads/reference")
async def reference_upload(file: UploadFile = File(...)):
    return await handle_upload(file, "references")


# ---------- Config & stats ----------

@api_router.get("/config")
async def get_config():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {}
    return {
        "whatsapp_number": settings.get("whatsapp_number", DEFAULT_WHATSAPP),
        "instagram_url": settings.get("instagram_url", ""),
        "tiktok_url": settings.get("tiktok_url", ""),
    }


class SettingsIn(BaseModel):
    whatsapp_number: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None


@api_router.put("/admin/settings")
async def update_settings(data: SettingsIn, admin: dict = Depends(get_current_admin)):
    update = {}
    if data.whatsapp_number is not None:
        number = "".join(ch for ch in data.whatsapp_number if ch.isdigit())
        if not number:
            raise HTTPException(status_code=400, detail="Numéro invalide")
        update["whatsapp_number"] = number
    if data.instagram_url is not None:
        update["instagram_url"] = data.instagram_url.strip()
    if data.tiktok_url is not None:
        update["tiktok_url"] = data.tiktok_url.strip()
    if update:
        await db.settings.update_one({"id": "global"}, {"$set": update}, upsert=True)
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {}
    return {
        "whatsapp_number": settings.get("whatsapp_number", DEFAULT_WHATSAPP),
        "instagram_url": settings.get("instagram_url", ""),
        "tiktok_url": settings.get("tiktok_url", ""),
    }


@api_router.post("/stats/checkout")
async def track_checkout():
    await db.stats.update_one({"id": "global"}, {"$inc": {"checkout_clicks": 1}}, upsert=True)
    return {"ok": True}


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    products = await db.products.find({}, {"_id": 0, "category": 1, "is_in_stock": 1}).to_list(1000)
    by_category = {}
    in_stock = 0
    for p in products:
        by_category[p["category"]] = by_category.get(p["category"], 0) + 1
        if p.get("is_in_stock"):
            in_stock += 1
    stats = await db.stats.find_one({"id": "global"}, {"_id": 0})
    return {
        "products_total": len(products),
        "in_stock": in_stock,
        "out_of_stock": len(products) - in_stock,
        "by_category": by_category,
        "checkout_clicks": (stats or {}).get("checkout_clicks", 0),
    }


def _esc(s: str) -> str:
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


@api_router.get("/share/{product_id}")
async def share_product(product_id: str, request: Request):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    base = (os.environ.get("FRONTEND_URL") or "").rstrip("/")
    if not base:
        proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        host = request.headers.get("host", request.url.hostname)
        base = f"{proto}://{host}".rstrip("/")
    product_url = f"{base}/produit/{product['id']}"
    image = product.get("image") or ""
    if image.startswith("http"):
        image_url = image
    elif image:
        image_url = f"{base}/api/files/{image}"
    else:
        image_url = f"{base}/og-cover.png"
    price_txt = f"{product['price']:,}".replace(",", " ")
    title = _esc(f"{product['name']} — {price_txt} FCFA | Otaku.sn")
    desc = _esc(f"{product.get('category', '')} · {(product.get('description') or '')[:140]}")
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Otaku.sn" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:image" content="{_esc(image_url)}" />
<meta property="og:url" content="{product_url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta http-equiv="refresh" content="0; url={product_url}" />
</head>
<body style="background:#08090C;color:#F7F8F8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
<p>Redirection vers <a style="color:#FF3333" href="{product_url}">Otaku.sn</a>&hellip;</p>
<script>window.location.replace({json.dumps(product_url)});</script>
</body>
</html>"""
    return Response(content=html, media_type="text/html")


@api_router.get("/")
async def root():
    return {"message": "Otaku.sn API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Seeding ----------

SEED_PRODUCTS = [
    {
        "id": "otk-001", "name": "Satoru Void Unleashed", "category": "Anime / Manga", "price": 12500,
        "image": "https://images.unsplash.com/photo-1589902860314-e910697dea18?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxhbmltZSUyMHN0cmVldHdlYXIlMjBtb2RlbCUyMHQtc2hpcnR8ZW58MHx8fHwxNzg4OTgyNzYzfDA&ixlib=rb-4.1.0&q=85",
        "description": "Coupe boxy oversize 240 GSM. Sérigraphie haute densité éclat bleu cobalt et manga art contemporain.",
        "sizes": ["M", "L", "XL", "XXL"], "is_featured": True, "is_in_stock": True,
    },
    {
        "id": "otk-002", "name": "Calligraphie Sabr & Tawakkul", "category": "Autres", "price": 13000,
        "image": "https://images.unsplash.com/photo-1691134231993-82747e5e66ce?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxhcmFiaWMlMjBjYWxsaWdyYXBoeSUyMHN0cmVldHdlYXIlMjBmYXNoaW9ufGVufDB8fHx8MTc4ODk4Mjc2M3ww&ixlib=rb-4.1.0&q=85",
        "description": "Calligraphie arabe monumentale réinterprétée en typographie urbaine streetwear. Tissu lourd délavé premium.",
        "sizes": ["S", "M", "L", "XL"], "is_featured": True, "is_in_stock": True,
    },
    {
        "id": "otk-003", "name": "Golgotha Faith Sanctum", "category": "Autres", "price": 12500,
        "image": "https://images.unsplash.com/photo-1759972524922-af7b51c5c8b6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxmYWl0aCUyMGNyb3NzJTIwZ3JhcGhpYyUyMHN0cmVldHdlYXIlMjBhcHBhcmVsfGVufDB8fHx8MTc4ODk4Mjc2M3ww&ixlib=rb-4.1.0&q=85",
        "description": "Illustration sacrée néo-gothique, croix cinétique et typographie de cathédrale moderne. Coton bio 260 GSM.",
        "sizes": ["M", "L", "XL"], "is_featured": True, "is_in_stock": True,
    },
    {
        "id": "otk-004", "name": "Shibuya Glitch Berserk", "category": "Anime / Manga", "price": 14000,
        "image": "https://images.unsplash.com/photo-1593726891090-b4c6bc09c819?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwyfHxhbmltZSUyMHN0cmVldHdlYXIlMjBtb2RlbCUyMHQtc2hpcnR8ZW58MHx8fHwxNzg4OTgyNzYzfDA&ixlib=rb-4.1.0&q=85",
        "description": "Inspiré de l'âge d'or du manga sombre. Impression thermique vintage résistante aux lavages fréquents.",
        "sizes": ["S", "M", "L", "XL", "XXL"], "is_featured": False, "is_in_stock": True,
    },
    {
        "id": "otk-005", "name": "Minimal Noor Monochrome", "category": "Autres", "price": 11500,
        "image": "https://images.unsplash.com/photo-1660725700674-ca1ee18acf84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxhcmFiaWMlMjBjYWxsaWdyYXBoeSUyMHN0cmVldHdlYXIlMjBmYXNoaW9ufGVufDB8fHx8MTc4ODk4Mjc2M3ww&ixlib=rb-4.1.0&q=85",
        "description": "Design épuré et percutant, broderie arabe discrète au torse et grande estampe géométrique au dos.",
        "sizes": ["M", "L", "XL"], "is_featured": False, "is_in_stock": True,
    },
    {
        "id": "otk-006", "name": "Tokyo Heartbreak Kanji", "category": "Anime / Manga", "price": 13500,
        "image": "https://images.unsplash.com/photo-1621446511130-0ed6519bfeb6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHw0fHxhbmltZSUyMHN0cmVldHdlYXIlMjBtb2RlbCUyMHQtc2hpcnR8ZW58MHx8fHwxNzg4OTgyNzYzfDA&ixlib=rb-4.1.0&q=85",
        "description": "Cyberpunk pastel et kanjis japonais en sérigraphie dégradée néon. Coupe unisexe tombé parfait.",
        "sizes": ["S", "M", "L", "XL"], "is_featured": False, "is_in_stock": True,
    },
]


async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin Otaku.sn",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin seeded")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
        logger.info("Admin password refreshed")


async def seed_products():
    if await db.products.count_documents({}) > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    for p in SEED_PRODUCTS:
        await db.products.insert_one({**p, "created_at": now})
    logger.info("Catalog seeded with %d products", len(SEED_PRODUCTS))


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_products()
    await db.settings.update_one(
        {"id": "global"}, {"$setOnInsert": {"id": "global", "whatsapp_number": DEFAULT_WHATSAPP}}, upsert=True
    )
    await db.stats.update_one({"id": "global"}, {"$setOnInsert": {"id": "global", "checkout_clicks": 0}}, upsert=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
