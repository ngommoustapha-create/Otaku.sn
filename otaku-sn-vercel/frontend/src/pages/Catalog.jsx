import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PenTool, Instagram, Music2 } from "lucide-react";
import api from "@/lib/api";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import CustomOrderModal from "@/components/CustomOrderModal";
import BottomBar from "@/components/BottomBar";

const CATEGORIES = [
  { key: "Tous", testid: "nav-category-all" },
  { key: "Anime / Manga", testid: "nav-category-anime" },
  { key: "Autres", testid: "nav-category-autres" },
];

const CHAPTERS = [
  { n: "01", t: "Qualité lourde", d: "T-shirts 1000–1200 GSM, coupe boxy oversize, sérigraphie haute densité qui tient au lavage." },
  { n: "02", t: "Plusieurs univers", d: "Anime & manga d'abord, d'autres inspirations ensuite — et vos propres idées en sur-mesure." },
  { n: "03", t: "Commande WhatsApp", d: "Vous remplissez le panier, vous confirmez sur WhatsApp. Livraison partout au Sénégal, à votre charge." },
];

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Tous");
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [waNumber, setWaNumber] = useState("221781920947");
  const [socials, setSocials] = useState({ instagram: "", tiktok: "" });

  const { id: routeProductId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
    api
      .get("/config")
      .then((r) => {
        setWaNumber(r.data.whatsapp_number);
        setSocials({ instagram: r.data.instagram_url || "", tiktok: r.data.tiktok_url || "" });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (routeProductId && products.length) {
      const p = products.find((x) => x.id === routeProductId);
      if (p) setSelected(p);
    }
  }, [routeProductId, products]);

  const closeProduct = () => {
    setSelected(null);
    if (routeProductId) navigate("/", { replace: true });
  };

  const filtered = useMemo(
    () => (category === "Tous" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const openCustom = () => setCustomOpen(true);

  return (
    <div className="pb-20 sm:pb-0">
      <Header onCart={() => setCartOpen(true)} onCustom={openCustom} />
      <Hero onCustom={openCustom} />
      <Marquee />

      <section id="catalogue" data-testid="catalog-section" className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <p className="mono text-[11px] tracking-[0.3em] uppercase text-[#FF3333] mb-2">01 — Le catalogue</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white leading-none">
              Nos T-Shirts
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                data-testid={c.testid}
                onClick={() => setCategory(c.key)}
                className={`mono text-[11px] uppercase tracking-[0.15em] px-4 py-2 border transition-colors ${
                  category === c.key
                    ? "border-[#FF3333] bg-[#FF3333] text-white"
                    : "border-[#222738] text-[#8F96A8] hover:border-[#8F96A8] hover:text-white"
                }`}
              >
                {c.key}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div data-testid="catalog-empty-state" className="border border-dashed border-[#222738] py-20 text-center">
            <p className="font-display text-2xl font-bold uppercase text-[#575D6E]">Aucun produit pour le moment</p>
            <p className="text-sm text-[#8F96A8] mt-2">Revenez bientôt — de nouveaux drops arrivent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onView={setSelected} />
            ))}
          </div>
        )}
      </section>

      <section data-testid="manifesto-section" className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28">
        <p className="mono text-[11px] tracking-[0.3em] uppercase text-[#FF3333] mb-2">02 — Manifeste</p>
        <div className="border-t border-[#222738]">
          {CHAPTERS.map((c, i) => (
            <motion.div
              key={c.n}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-[auto_1fr] sm:grid-cols-[120px_1fr_2fr] gap-4 sm:gap-8 items-baseline py-7 border-b border-[#222738]"
            >
              <span className="font-display font-black text-4xl sm:text-5xl text-outline">{c.n}</span>
              <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-white">{c.t}</h3>
              <p className="col-span-2 sm:col-span-1 text-sm leading-relaxed text-[#8F96A8]">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section data-testid="custom-banner-section" className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden border border-[#222738] bg-[#0F1117] px-6 sm:px-12 py-14 sm:py-20 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 55% 60% at 50% 110%, rgba(229,169,60,0.14), transparent 70%)" }}
          />
          <p className="mono text-[11px] tracking-[0.3em] uppercase text-[#E5A93C] mb-4 relative">03 — Sur-mesure</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-[0.9] relative">
            Ton idée.
            <br />
            <span className="text-outline">Ton t-shirt.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#8F96A8] max-w-md mx-auto mt-5 relative">
            Décris ton visuel, joins une image de référence, et reçois un devis directement sur WhatsApp.
          </p>
          <button
            data-testid="custom-order-banner-btn"
            onClick={openCustom}
            className="relative mt-8 inline-flex items-center gap-3 bg-[#E5A93C] hover:bg-[#c9932f] transition-colors text-[#08090C] font-display font-bold uppercase tracking-wide text-lg px-8 py-4"
          >
            <PenTool size={18} />
            Lancer ma commande
          </button>
        </motion.div>
      </section>

      <footer data-testid="site-footer" className="border-t border-[#222738] bg-[#0F1117]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl font-black text-white">
              OTAKU<span className="text-[#FF3333]">.SN</span>
            </p>
            <p className="mono text-[10px] tracking-[0.25em] text-[#575D6E] mt-1 uppercase">
              Kaolack streetwear — 14.1524° N, 16.0726° W
            </p>
          </div>
          <div className="flex items-center gap-6 mono text-[10px] tracking-[0.2em] uppercase text-[#575D6E]">
            {socials.instagram && (
              <a
                data-testid="footer-instagram-link"
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Otaku.sn"
                className="hover:text-[#E5A93C] transition-colors"
              >
                <Instagram size={16} />
              </a>
            )}
            {socials.tiktok && (
              <a
                data-testid="footer-tiktok-link"
                href={socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok Otaku.sn"
                className="hover:text-[#E5A93C] transition-colors"
              >
                <Music2 size={16} />
              </a>
            )}
            <a
              data-testid="footer-whatsapp-link"
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour Otaku.sn !")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#25D366] transition-colors"
            >
              WhatsApp
            </a>
            <Link data-testid="footer-admin-link" to="/admin/login" className="hover:text-white transition-colors">
              Admin
            </Link>
            <span>© 2026 Otaku.sn</span>
          </div>
        </div>
      </footer>

      <BottomBar onCart={() => setCartOpen(true)} onCustom={openCustom} waNumber={waNumber} />

      <AnimatePresence>
        {selected && <ProductModal key="product" product={selected} onClose={closeProduct} />}
        {cartOpen && <CartDrawer key="cart" waNumber={waNumber} onClose={() => setCartOpen(false)} />}
        {customOpen && <CustomOrderModal key="custom" waNumber={waNumber} onClose={() => setCustomOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
