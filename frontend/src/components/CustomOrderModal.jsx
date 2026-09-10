import { useState } from "react";
import { motion } from "framer-motion";
import { X, MessageCircle, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { API } from "@/lib/api";

const THEMES = ["Anime / Manga", "Spirituel / Religieux", "Texte / Citation", "Photo personnelle", "Autre idée"];
const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function CustomOrderModal({ waNumber, onClose }) {
  const [theme, setTheme] = useState(THEMES[0]);
  const [size, setSize] = useState("L");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const inputCls =
    "w-full bg-[#08090C] border border-[#222738] focus:border-[#FF3333] outline-none transition-colors px-3.5 py-2.5 text-sm text-white placeholder:text-[#575D6E]";

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Décrivez votre idée de t-shirt");
      return;
    }
    setSending(true);
    let imageLink = null;
    try {
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const { data } = await api.post("/uploads/reference", form);
        imageLink = `${API}/files/${data.path}`;
      }
    } catch {
      toast.error("L'image n'a pas pu être envoyée — le brief partira sans elle.");
    }
    const msg = `Bonjour Otaku.sn ! Je souhaite une commande personnalisée :

Thème : ${theme}
Taille : ${size}
Nom : ${name.trim() || "—"}

Description de l'idée :
${description.trim()}

Image de référence : ${imageLink || "Aucune"}

Merci de me confirmer le prix et le délai !`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
    setSending(false);
    toast.success("Brief envoyé vers WhatsApp !");
    onClose();
  };

  return (
    <motion.div
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
        className="relative z-10 w-full sm:max-w-lg bg-[#0F1117] border border-[#222738] max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#222738]">
          <h3 className="font-display text-xl font-black uppercase text-white">
            Commande <span className="text-[#E5A93C]">Sur-mesure</span>
          </h3>
          <button
            data-testid="custom-order-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 text-[#8F96A8] hover:text-[#FF3333] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div data-testid="custom-order-form" className="p-5 space-y-5">
          <div>
            <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] mb-2.5">Thème</p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  data-testid={`custom-theme-${t}`}
                  onClick={() => setTheme(t)}
                  className={`mono text-xs px-3.5 py-2 border transition-colors ${
                    theme === t
                      ? "border-[#E5A93C] bg-[#E5A93C]/15 text-[#E5A93C]"
                      : "border-[#222738] text-[#8F96A8] hover:border-[#8F96A8]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] mb-2.5">Taille</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  data-testid={`custom-size-${s}`}
                  onClick={() => setSize(s)}
                  className={`mono text-sm px-4 py-2 border transition-colors ${
                    size === s
                      ? "border-[#FF3333] bg-[#FF3333] text-white"
                      : "border-[#222738] text-[#8F96A8] hover:border-[#8F96A8]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <input
            data-testid="custom-order-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            className={inputCls}
          />
          <textarea
            data-testid="custom-order-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre idée : personnage, texte, couleurs, placement du visuel… *"
            rows={4}
            className={`${inputCls} resize-none`}
          />

          <label
            data-testid="custom-order-image-upload"
            className="flex items-center gap-3 border border-dashed border-[#222738] hover:border-[#E5A93C] transition-colors px-4 py-3.5 cursor-pointer text-[#8F96A8] hover:text-[#E5A93C]"
          >
            <ImagePlus size={18} />
            <span className="text-sm truncate">{file ? file.name : "Image de référence (optionnel)"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            data-testid="custom-order-submit-whatsapp-btn"
            onClick={handleSubmit}
            disabled={sending}
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1fb857] disabled:opacity-50 transition-colors text-[#08090C] font-display font-bold uppercase tracking-wide text-lg px-6 py-4"
          >
            {sending ? <Loader2 size={19} className="animate-spin" /> : <MessageCircle size={19} />}
            Envoyer le brief sur WhatsApp
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
