import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { imgUrl, fcfa } from "@/lib/api";

const Corner = ({ className }) => (
  <span className={`pointer-events-none absolute w-3.5 h-3.5 border-[#FF3333] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 ${className}`} />
);

export default function ProductCard({ product, onView, index }) {
  const img = imgUrl(product.image);
  return (
    <motion.article
      data-testid={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      onClick={() => onView(product)}
      className="group relative border border-[#222738] bg-[#141721] cursor-pointer"
    >
      <Corner className="top-2 left-2 border-t border-l" />
      <Corner className="top-2 right-2 border-t border-r" />
      <Corner className="bottom-2 left-2 border-b border-l" />
      <Corner className="bottom-2 right-2 border-b border-r" />

      <div className="relative aspect-[9/16] overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-[#0F1117]">
            <span className="font-display font-black text-6xl text-outline">{product.name.charAt(0)}</span>
            <span className="mono text-[10px] tracking-[0.3em] text-[#575D6E] mt-3 uppercase">Otaku.sn</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
        <span className="absolute top-3 left-3 mono text-[10px] tracking-[0.2em] uppercase bg-[#08090C]/80 backdrop-blur border border-[#222738] px-2.5 py-1 text-[#E5A93C]">
          {product.category}
        </span>
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <span className="mono text-xs tracking-[0.3em] uppercase text-[#FF3333] border border-[#FF3333] px-4 py-2">
              Rupture de stock
            </span>
          </div>
        )}
        <button
          data-testid={`product-card-view-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onView(product);
          }}
          className="absolute bottom-3 left-3 mono text-[10px] tracking-[0.2em] uppercase text-white/80 hover:text-white border-b border-transparent hover:border-white transition-colors sm:opacity-0 sm:group-hover:opacity-100 duration-300"
        >
          Voir détails →
        </button>
      </div>

      <div className="p-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-lg font-bold uppercase leading-tight text-white truncate">
            {product.name}
          </h4>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="mono text-sm text-[#E5A93C]">{fcfa(product.price)}</p>
            {product.old_price > product.price && (
              <p className="mono text-[11px] text-[#575D6E] line-through">{fcfa(product.old_price)}</p>
            )}
          </div>
        </div>
        {product.is_in_stock && (
          <button
            data-testid={`product-card-add-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onView(product);
            }}
            aria-label={`Ajouter ${product.name} au panier`}
            className="shrink-0 flex items-center gap-1.5 bg-[#FF3333] hover:bg-[#E62828] transition-colors text-white font-display font-bold uppercase text-sm px-3.5 py-2"
          >
            <Plus size={15} />
            Panier
          </button>
        )}
      </div>
    </motion.article>
  );
}
