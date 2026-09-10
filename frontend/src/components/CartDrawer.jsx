import { useState } from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import api, { imgUrl, fcfa } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function CartDrawer({ waNumber, onClose }) {
  const { items, setQty, remove, clear, total } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleCheckout = () => {
    if (!items.length) return;
    if (!name.trim() || !phone.trim()) {
      toast.error("Ajoutez votre nom et votre numéro de téléphone");
      return;
    }
    const lines = items
      .map((i) => `• ${i.name} — Taille ${i.size}${i.oos ? " (rupture, à confirmer)" : ""} × ${i.qty} = ${fcfa(i.price * i.qty)}`)
      .join("\n");
    const msg = `Bonjour Otaku.sn ! Je souhaite finaliser ma commande :

${lines}

Total : ${fcfa(total)}
Nom du client : ${name.trim()}
Téléphone : ${phone.trim()}
Adresse/Ville : ${address.trim() || "—"}
Livraison : partout au Sénégal (frais à ma charge)

Merci de confirmer la disponibilité et les frais de livraison !`;
    api.post("/stats/checkout").catch(() => {});
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Redirection vers WhatsApp…", { description: "Confirmez votre commande dans la discussion." });
  };

  const inputCls =
    "w-full bg-[#08090C] border border-[#222738] focus:border-[#FF3333] outline-none transition-colors px-3.5 py-2.5 text-sm text-white placeholder:text-[#575D6E]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70]"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        data-testid="cart-drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        data-lenis-prevent
        className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-[#0F1117] border-l border-[#222738] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#222738] shrink-0">
          <h3 className="font-display text-xl font-black uppercase text-white">
            Panier <span className="text-[#FF3333]">/ {items.length}</span>
          </h3>
          <button
            data-testid="cart-close-btn"
            onClick={onClose}
            aria-label="Fermer le panier"
            className="p-2 text-[#8F96A8] hover:text-[#FF3333] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 && (
            <div data-testid="cart-empty-state" className="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
              <span className="font-display font-black text-5xl text-outline">空</span>
              <p className="mono text-[11px] tracking-[0.25em] uppercase text-[#575D6E]">Panier vide</p>
              <p className="text-sm text-[#8F96A8]">Explorez le catalogue et ajoutez vos t-shirts.</p>
            </div>
          )}
          {items.map((i) => {
            const img = imgUrl(i.image);
            return (
              <div key={i.key} data-testid={`cart-item-${i.key}`} className="flex gap-3 border border-[#222738] bg-[#141721] p-3">
                <div className="w-16 shrink-0 aspect-[9/16] overflow-hidden bg-[#0F1117]">
                  {img && <img src={img} alt={i.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold uppercase text-white leading-tight truncate">{i.name}</p>
                  <p className="mono text-[11px] text-[#575D6E] mt-0.5">
                    Taille {i.size}
                    {i.oos && <span className="text-[#E5A93C]"> · rupture à confirmer</span>}
                  </p>
                  <p className="mono text-sm text-[#E5A93C] mt-1">{fcfa(i.price * i.qty)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-[#222738]">
                      <button
                        data-testid={`cart-qty-minus-${i.key}`}
                        onClick={() => setQty(i.key, i.qty - 1)}
                        className="p-1.5 text-[#8F96A8] hover:text-white transition-colors"
                        aria-label="Réduire"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="mono text-xs w-7 text-center text-white">{i.qty}</span>
                      <button
                        data-testid={`cart-qty-plus-${i.key}`}
                        onClick={() => setQty(i.key, i.qty + 1)}
                        className="p-1.5 text-[#8F96A8] hover:text-white transition-colors"
                        aria-label="Augmenter"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      data-testid={`cart-remove-${i.key}`}
                      onClick={() => remove(i.key)}
                      aria-label="Retirer l'article"
                      className="p-1.5 text-[#575D6E] hover:text-[#FF3333] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#222738] px-5 py-4 space-y-3 shrink-0">
            <div className="space-y-2">
              <input
                data-testid="cart-client-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom *"
                className={inputCls}
              />
              <input
                data-testid="cart-client-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Votre téléphone *"
                type="tel"
                className={inputCls}
              />
              <input
                data-testid="cart-client-address-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse / Ville (livraison)"
                className={inputCls}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="mono text-[11px] tracking-[0.25em] uppercase text-[#575D6E]">Total</span>
              <span data-testid="cart-total-price" className="font-display text-2xl font-black text-white">
                {fcfa(total)}
              </span>
            </div>
            <p className="mono text-[10px] leading-relaxed tracking-[0.08em] uppercase text-[#575D6E]">
              Livraison partout au Sénégal — frais à votre charge, confirmés sur WhatsApp
            </p>
            <button
              data-testid="cart-checkout-whatsapp-btn"
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1fb857] transition-colors text-[#08090C] font-display font-bold uppercase tracking-wide text-lg px-6 py-4"
            >
              <MessageCircle size={19} />
              Commander sur WhatsApp
            </button>
            <button
              data-testid="cart-clear-btn"
              onClick={clear}
              className="w-full mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] hover:text-[#FF3333] transition-colors py-1"
            >
              Vider le panier
            </button>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}
