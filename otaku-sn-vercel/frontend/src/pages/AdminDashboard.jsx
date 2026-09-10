import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2, Upload, X, Loader2, Store } from "lucide-react";
import api, { imgUrl, fcfa, formatApiErrorDetail } from "@/lib/api";

const CATEGORIES = ["Anime / Manga", "Autres"];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0],
  price: "",
  old_price: "",
  description: "",
  sizes: ["M", "L", "XL"],
  out_of_stock_sizes: [],
  image: "",
  is_featured: false,
  is_in_stock: true,
};

const inputCls =
  "w-full bg-[#08090C] border border-[#222738] focus:border-[#FF3333] outline-none transition-colors px-3.5 py-2.5 text-sm text-white placeholder:text-[#575D6E]";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [wa, setWa] = useState("");
  const [ig, setIg] = useState("");
  const [tt, setTt] = useState("");
  const [editor, setEditor] = useState(null); // { mode: 'new' } | { mode: 'edit', product }
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const [p, s, c] = await Promise.all([api.get("/products"), api.get("/admin/stats"), api.get("/config")]);
      setProducts(p.data);
      setStats(s.data);
      setWa(c.data.whatsapp_number);
      setIg(c.data.instagram_url || "");
      setTt(c.data.tiktok_url || "");
    } catch (e) {
      if (e.response?.status === 401) navigate("/admin/login");
    }
  };

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => {
        setMe(r.data);
        load();
      })
      .catch(() => navigate("/admin/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("otaku_admin_token");
    navigate("/admin/login");
  };

  const saveSettings = async () => {
    try {
      const { data } = await api.put("/admin/settings", {
        whatsapp_number: wa,
        instagram_url: ig,
        tiktok_url: tt,
      });
      setWa(data.whatsapp_number);
      setIg(data.instagram_url || "");
      setTt(data.tiktok_url || "");
      toast.success("Réglages enregistrés", { description: data.whatsapp_number });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const quickUpdate = async (product, patch) => {
    const { id, created_at, ...rest } = product;
    try {
      await api.put(`/admin/products/${id}`, { ...rest, ...patch });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      toast.success(patch.price !== undefined ? "Prix mis à jour" : "Stock mis à jour");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
      load();
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Supprimer « ${product.name} » définitivement ?`)) return;
    try {
      await api.delete(`/admin/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Produit supprimé");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setEditor({ mode: "new" });
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      old_price: product.old_price ? String(product.old_price) : "",
      description: product.description || "",
      sizes: product.sizes || [],
      out_of_stock_sizes: product.out_of_stock_sizes || [],
      image: product.image || "",
      is_featured: !!product.is_featured,
      is_in_stock: !!product.is_in_stock,
    });
    setFile(null);
    setEditor({ mode: "edit", product });
  };

  const toggleSize = (s) =>
    setForm((f) => {
      if (!f.sizes.includes(s)) return { ...f, sizes: [...f.sizes, s] };
      if (!f.out_of_stock_sizes.includes(s)) return { ...f, out_of_stock_sizes: [...f.out_of_stock_sizes, s] };
      return {
        ...f,
        sizes: f.sizes.filter((x) => x !== s),
        out_of_stock_sizes: f.out_of_stock_sizes.filter((x) => x !== s),
      };
    });

  const saveProduct = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Nom et prix sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      let image = form.image;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/upload", fd);
        image = data.path;
      }
      const payload = {
        ...form,
        name: form.name.trim(),
        price: parseInt(form.price, 10) || 0,
        old_price: form.old_price ? parseInt(form.old_price, 10) || null : null,
        image,
      };
      if (editor.mode === "new") {
        await api.post("/admin/products", payload);
        toast.success("Produit ajouté au catalogue");
      } else {
        await api.put(`/admin/products/${editor.product.id}`, payload);
        toast.success("Produit mis à jour");
      }
      setEditor(null);
      await load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF3333]" size={28} />
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: "Produits", value: stats.products_total },
        { label: "En stock", value: stats.in_stock },
        { label: "Ruptures", value: stats.out_of_stock },
        { label: "Clics WhatsApp", value: stats.checkout_clicks },
      ]
    : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08090C]/85 border-b border-[#222738]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <p className="font-display text-2xl font-black text-white">
            OTAKU<span className="text-[#FF3333]">.SN</span>{" "}
            <span className="mono text-[10px] tracking-[0.25em] text-[#575D6E] font-normal">ADMIN</span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              data-testid="admin-view-shop-link"
              to="/"
              className="p-2 text-[#8F96A8] hover:text-white transition-colors"
              aria-label="Voir la boutique"
            >
              <Store size={18} />
            </Link>
            <button
              data-testid="admin-logout-btn"
              onClick={logout}
              className="flex items-center gap-2 border border-[#222738] hover:border-[#FF3333] text-[#8F96A8] hover:text-[#FF3333] transition-colors px-3 py-2 mono text-[10px] tracking-[0.2em] uppercase"
            >
              <LogOut size={14} /> Sortir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-10">
        <section data-testid="admin-stats-section" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="border border-[#222738] bg-[#0F1117] p-4">
              <p className="font-display text-3xl font-black text-white">{s.value}</p>
              <p className="mono text-[10px] tracking-[0.2em] uppercase text-[#575D6E] mt-1">{s.label}</p>
            </div>
          ))}
        </section>

        <section data-testid="admin-settings-section" className="border border-[#222738] bg-[#0F1117] p-5 space-y-3">
          <h2 className="font-display text-xl font-bold uppercase text-white mb-1">Boutique & réseaux</h2>
          <p className="text-xs text-[#8F96A8]">
            Commandes envoyées vers ce numéro WhatsApp (format international sans « + »). Les liens Instagram et
            TikTok s'affichent en pied de page du site.
          </p>
          <input
            data-testid="admin-phone-input"
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            placeholder="Numéro WhatsApp — ex : 221781920947"
            className={`${inputCls} mono`}
          />
          <input
            data-testid="admin-instagram-input"
            value={ig}
            onChange={(e) => setIg(e.target.value)}
            placeholder="Lien Instagram — ex : https://instagram.com/otaku.sn"
            className={`${inputCls} mono`}
          />
          <input
            data-testid="admin-tiktok-input"
            value={tt}
            onChange={(e) => setTt(e.target.value)}
            placeholder="Lien TikTok — ex : https://tiktok.com/@otaku.sn"
            className={`${inputCls} mono`}
          />
          <button
            data-testid="admin-phone-save-btn"
            onClick={saveSettings}
            className="w-full bg-[#25D366] hover:bg-[#1fb857] transition-colors text-[#08090C] font-display font-bold uppercase px-5 py-3"
          >
            Sauver
          </button>
        </section>

        <section data-testid="admin-products-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold uppercase text-white">
              Produits <span className="text-[#FF3333]">/ {products.length}</span>
            </h2>
            <button
              data-testid="admin-add-product-btn"
              onClick={openNew}
              className="flex items-center gap-2 bg-[#FF3333] hover:bg-[#E62828] transition-colors text-white font-display font-bold uppercase px-4 py-2.5"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {products.map((p) => {
              const img = imgUrl(p.image);
              return (
                <div
                  key={p.id}
                  data-testid={`admin-product-row-${p.id}`}
                  className="flex flex-wrap items-center gap-3 border border-[#222738] bg-[#0F1117] p-3"
                >
                  <div className="w-12 aspect-[9/16] overflow-hidden bg-[#141721] shrink-0">
                    {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="font-display font-bold uppercase text-white leading-tight truncate">{p.name}</p>
                    <p className="mono text-[10px] tracking-[0.15em] uppercase text-[#575D6E]">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      data-testid={`admin-product-price-input-${p.id}`}
                      type="number"
                      defaultValue={p.price}
                      key={`${p.id}-${p.price}`}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v !== p.price) quickUpdate(p, { price: v });
                      }}
                      className="w-24 bg-[#08090C] border border-[#222738] focus:border-[#E5A93C] outline-none px-2 py-1.5 mono text-sm text-[#E5A93C]"
                    />
                    <span className="mono text-[10px] text-[#575D6E]">FCFA</span>
                  </div>
                  <button
                    data-testid={`admin-stock-toggle-${p.id}`}
                    onClick={() => quickUpdate(p, { is_in_stock: !p.is_in_stock })}
                    className={`mono text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                      p.is_in_stock
                        ? "border-[#25D366]/50 text-[#25D366]"
                        : "border-[#FF3333]/50 text-[#FF3333]"
                    }`}
                  >
                    {p.is_in_stock ? "En stock" : "Rupture"}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      data-testid={`admin-edit-product-${p.id}`}
                      onClick={() => openEdit(p)}
                      aria-label="Modifier"
                      className="p-2 text-[#8F96A8] hover:text-white transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      data-testid={`admin-delete-product-${p.id}`}
                      onClick={() => remove(p)}
                      aria-label="Supprimer"
                      className="p-2 text-[#8F96A8] hover:text-[#FF3333] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="border border-dashed border-[#222738] py-12 text-center text-sm text-[#8F96A8]">
                Aucun produit. Cliquez sur « Ajouter » pour créer le premier.
              </p>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {editor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditor(null)} />
            <motion.div
              initial={{ y: 64, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 64, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              data-lenis-prevent
              className="relative z-10 w-full sm:max-w-xl bg-[#0F1117] border border-[#222738] max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-[#222738]">
                <h3 className="font-display text-xl font-black uppercase text-white">
                  {editor.mode === "new" ? "Nouveau produit" : "Modifier le produit"}
                </h3>
                <button
                  data-testid="admin-editor-close-btn"
                  onClick={() => setEditor(null)}
                  aria-label="Fermer"
                  className="p-2 text-[#8F96A8] hover:text-[#FF3333] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <input
                  data-testid="admin-form-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom du t-shirt *"
                  className={inputCls}
                />
                <select
                  data-testid="admin-form-category-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={`${inputCls} mono`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    data-testid="admin-form-price-input"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Prix FCFA *"
                    className={`${inputCls} mono`}
                  />
                  <input
                    data-testid="admin-form-old-price-input"
                    type="number"
                    value={form.old_price}
                    onChange={(e) => setForm({ ...form, old_price: e.target.value })}
                    placeholder="Ancien prix (promo)"
                    className={`${inputCls} mono`}
                  />
                </div>
                <textarea
                  data-testid="admin-form-description-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description (matière, coupe, impression…)"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                <div>
                  <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] mb-2">Tailles</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((s) => {
                      const active = form.sizes.includes(s);
                      const oos = form.out_of_stock_sizes.includes(s);
                      return (
                        <button
                          key={s}
                          data-testid={`admin-form-size-${s}`}
                          onClick={() => toggleSize(s)}
                          className={`mono text-sm px-4 py-2 border transition-colors ${
                            oos
                              ? "border-[#E5A93C] text-[#E5A93C] line-through"
                              : active
                                ? "border-[#FF3333] bg-[#FF3333] text-white"
                                : "border-[#222738] text-[#8F96A8] hover:border-[#8F96A8]"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mono text-[10px] text-[#575D6E] mt-2">
                    Clic pour alterner : disponible → <span className="text-[#E5A93C]">rupture</span> → retiré
                  </p>
                </div>
                <div>
                  <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] mb-2">
                    Image (portrait 1080×1920 recommandé)
                  </p>
                  <div className="flex items-center gap-3">
                    {(file || form.image) && (
                      <div className="w-14 aspect-[9/16] overflow-hidden border border-[#222738] bg-[#141721] shrink-0">
                        <img
                          src={file ? URL.createObjectURL(file) : imgUrl(form.image)}
                          alt="Aperçu"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <button
                      data-testid="admin-form-image-upload-btn"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 border border-dashed border-[#222738] hover:border-[#E5A93C] text-[#8F96A8] hover:text-[#E5A93C] transition-colors px-4 py-3 text-sm"
                    >
                      <Upload size={16} />
                      {file ? file.name : form.image ? "Changer l'image" : "Choisir une image"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm text-[#8F96A8] cursor-pointer">
                  <input
                    data-testid="admin-form-featured-checkbox"
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="accent-[#FF3333] w-4 h-4"
                  />
                  Mettre en avant (haut du catalogue)
                </label>
                <button
                  data-testid="admin-save-product-btn"
                  onClick={saveProduct}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF3333] hover:bg-[#E62828] disabled:opacity-50 transition-colors text-white font-display font-bold uppercase tracking-wide text-lg py-3.5"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {editor.mode === "new" ? "Ajouter au catalogue" : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
