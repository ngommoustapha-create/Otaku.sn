import { useState } from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Share2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { API, imgUrl, fcfa } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ProductModal({ product, onClose }) {
  const sizes = product.sizes?.length ? product.sizes : ["Unique"];
  const [size, setSize] = useState(sizes[0]);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const img = imgUrl(product.image);

  const handleAdd = () => {
    const oos = (product.out_of_stock_sizes || []).includes(size);
    add(product, size, qty, oos);
    toast.success("Ajouté au panier", {
      description: `${product.name} — Taille ${size} × ${qty}${oos ? " (taille en rupture — délai à confirmer)" : ""}`,
    });
    onClose();
  };

  const shareUrl = `${API}/share/${product.id}`;
  const shareText = `${product.name} — ${fcfa(product.price)} sur Otaku.sn\n${shareUrl}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien du produit copié !", { description: "Collez-le dans votre discussion WhatsApp." });
    } catch {
      toast.error("Copie impossible sur ce navigateur");
    }
  };

  return (
    <motion.div
      data-testid="product-detail-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 64, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        data-lenis-prevent
        className="relative z-10 w-full sm:max-w-3xl bg-[#0F1117] border border-[#222738] max-h-[92vh] overflow-y-auto grid sm:grid-cols-2"
      >
        <button
          data-testid="product-detail-close-btn"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-20 p-2 bg-[#08090C]/80 border border-[#222738] text-white hover:text-[#FF3333] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative h-52 sm:h-auto sm:min-h-[520px] overflow-hidden">
          {img ? (
            <img src={img} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#141721]">
              <span className="font-display font-black text-8xl text-outline">{product.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent" />
        </div>

        <div className="p-6 sm:p-8 flex flex-col">
          <p className="mono text-[11px] tracking-[0.25em] uppercase text-[#FF3333]">{product.category}</p>
          <h3 className="font-display text-3xl font-black uppercase leading-none text-white mt-2">
            {product.name}
          </h3>
          <div className="flex flex-wrap items-baseline gap-3 mt-3">
            <p className="mono text-xl text-[#E5A93C]">{fcfa(product.price)}</p>
            {product.old_price > product.price && (
              <>
                <p className="mono text-sm text-[#575D6E] line-through">{fcfa(product.old_price)}</p>
                <span className="mono text-[10px] tracking-[0.2em] uppercase bg-[#FF3333] text-white px-2 py-0.5">
                  Promo
                </span>
              </>
            )}
          </div>
          {product.description && (
            <p className="text-sm leading-relaxed text-[#8F96A8] mt-4">{product.description}</p>
          )}

          <div className="mt-6">
            <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] mb-2.5">Taille</p>
            <div data-testid="product-detail-size-selector" className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const oos = (product.out_of_stock_sizes || []).includes(s);
                return (
                  <button
                    key={s}
                    data-testid={`size-option-${s}`}
                    onClick={() => setSize(s)}
                    className={`relative mono text-sm px-4 py-2 border transition-colors ${
                      size === s
                        ? "border-[#FF3333] bg-[#FF3333] text-white"
                        : "border-[#222738] text-[#8F96A8] hover:border-[#8F96A8]"
                    } ${oos ? "opacity-70" : ""}`}
                  >
                    <span className={oos ? "line-through" : ""}>{s}</span>
                    {oos && (
                      <span className="absolute -top-2 -right-1 mono text-[8px] tracking-wide uppercase bg-[#E5A93C] text-[#08090C] px-1">
                        Rupture
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] mb-2.5">Quantité</p>
            <div className="flex items-center border border-[#222738] w-max">
              <button
                data-testid="qty-decrease-btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 text-[#8F96A8] hover:text-white transition-colors"
                aria-label="Réduire la quantité"
              >
                <Minus size={15} />
              </button>
              <span data-testid="qty-value" className="mono text-sm w-10 text-center text-white">{qty}</span>
              <button
                data-testid="qty-increase-btn"
                onClick={() => setQty((q) => q + 1)}
                className="p-2.5 text-[#8F96A8] hover:text-white transition-colors"
                aria-label="Augmenter la quantité"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 sm:-mx-8 mt-6 px-6 sm:px-8 pt-4 pb-5 bg-[#0F1117]/95 backdrop-blur border-t border-[#222738]">
            <button
              data-testid="product-detail-add-to-cart"
              onClick={handleAdd}
              disabled={!product.is_in_stock}
              className="w-full disabled:opacity-40"
            >
              <span className="flex items-center justify-center gap-3 w-full bg-[#FF3333] hover:bg-[#E62828] transition-colors text-white font-display font-bold uppercase tracking-wide text-lg px-6 py-4">
                <ShoppingBag size={18} />
                Ajouter — {fcfa(product.price * qty)}
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <a
                data-testid="product-share-whatsapp-btn"
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-[#25D366]/60 text-[#25D366] hover:bg-[#25D366] hover:text-[#08090C] transition-colors font-display font-bold uppercase px-4 py-3"
              >
                <Share2 size={16} /> Partager
              </a>
              <button
                data-testid="product-copy-link-btn"
                onClick={copyLink}
                className="flex items-center justify-center gap-2 border border-[#222738] text-[#8F96A8] hover:border-[#E5A93C] hover:text-[#E5A93C] transition-colors font-display font-bold uppercase px-4 py-3"
              >
                <Link2 size={16} /> Copier le lien
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
