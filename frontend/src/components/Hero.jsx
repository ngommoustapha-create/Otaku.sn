import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, PenTool } from "lucide-react";
import { scrollToId } from "@/components/Header";

const MaskedLine = ({ children, delay, className = "" }) => (
  <span className="block overflow-hidden py-0.5">
    <motion.span
      className={`block ${className}`}
      initial={{ y: "115%" }}
      animate={{ y: 0 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.span>
  </span>
);

export default function Hero({ onCustom }) {
  const { scrollY } = useScroll();
  const yKanji = useTransform(scrollY, [0, 700], [0, 180]);
  const fade = useTransform(scrollY, [0, 450], [1, 0]);

  return (
    <section data-testid="hero-section" className="relative min-h-[96vh] flex flex-col justify-center overflow-hidden px-5 sm:px-10 pt-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 45% at 70% 30%, rgba(255,51,51,0.12), transparent 65%)" }}
      />
      <motion.div
        aria-hidden="true"
        style={{ y: yKanji }}
        className="pointer-events-none select-none absolute -right-6 sm:right-4 top-24 font-display font-black leading-[0.8] text-outline text-[11rem] sm:text-[17rem]"
      >
        オタク
      </motion.div>

      <motion.div style={{ opacity: fade }} className="relative z-10 max-w-6xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mono text-[11px] tracking-[0.3em] uppercase text-[#FF3333] mb-6"
        >
          14.1524° N — 16.0726° W · Kaolack, Sénégal
        </motion.p>

        <h1 className="font-display font-black uppercase leading-[0.9] tracking-tight text-white text-5xl sm:text-6xl lg:text-7xl">
          <MaskedLine delay={0.35}>Streetwear</MaskedLine>
          <MaskedLine delay={0.5}>
            <span className="text-[#FF3333]">Anime</span> × Sacré
          </MaskedLine>
          <MaskedLine delay={0.65} className="text-outline" >
            Sur-mesure
          </MaskedLine>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7 }}
          className="mt-6 max-w-md text-sm sm:text-base leading-relaxed text-[#8F96A8]"
        >
          T-shirts 1000–1200 GSM imprimés à Kaolack. Univers manga et autres inspirations —
          ou votre propre idée. Livraison partout au Sénégal, confirmation directe sur WhatsApp.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <button
            data-testid="hero-explore-btn"
            onClick={() => scrollToId("catalogue")}
            className="group flex items-center gap-3 bg-[#FF3333] hover:bg-[#E62828] transition-colors text-white font-display font-bold uppercase tracking-wide text-lg px-7 py-3.5"
          >
            Explorer le catalogue
            <ArrowDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
          </button>
          <button
            data-testid="hero-custom-order-btn"
            onClick={onCustom}
            className="flex items-center gap-3 border border-[#222738] hover:border-[#E5A93C] text-[#F7F8F8] hover:text-[#E5A93C] transition-colors font-display font-bold uppercase tracking-wide text-lg px-7 py-3.5"
          >
            <PenTool size={17} />
            Commande sur-mesure
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 mono text-[10px] tracking-[0.3em] text-[#575D6E] uppercase animate-pulse-glow"
      >
        Défiler ↓
      </motion.div>
    </section>
  );
}
