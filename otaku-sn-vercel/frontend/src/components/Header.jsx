import { Link } from "react-router-dom";
import { ShoppingBag, Lock } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function Header({ onCart, onCustom }) {
  const { count } = useCart();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#08090C]/85 border-b border-[#222738]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          data-testid="header-brand-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2"
        >
          <img src="/logo.svg" alt="Logo Otaku.sn" className="w-7 h-7" />
          <span className="font-display text-2xl font-black tracking-tight text-white">
            OTAKU<span className="text-[#FF3333]">.SN</span>
          </span>
          <span className="mono text-[10px] text-[#575D6E] tracking-[0.25em]">[KLK]</span>
        </button>
        <nav className="hidden sm:flex items-center gap-7 mono text-[11px] uppercase tracking-[0.2em] text-[#8F96A8]">
          <button
            data-testid="nav-catalog-link"
            onClick={() => scrollToId("catalogue")}
            className="hover:text-white transition-colors"
          >
            Catalogue
          </button>
          <button
            data-testid="nav-custom-order"
            onClick={onCustom}
            className="hover:text-[#FF3333] transition-colors"
          >
            Sur-mesure
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/login"
            data-testid="header-admin-link"
            aria-label="Espace administrateur"
            className="p-2 text-[#575D6E] hover:text-white transition-colors"
          >
            <Lock size={17} />
          </Link>
          <button
            data-testid="header-cart-button"
            onClick={onCart}
            aria-label="Ouvrir le panier"
            className="relative flex items-center gap-2 border border-[#222738] hover:border-[#FF3333] transition-colors px-3.5 py-2 text-white"
          >
            <ShoppingBag size={17} />
            <span className="mono text-[11px] hidden sm:inline">PANIER</span>
            {count > 0 && (
              <span
                data-testid="cart-item-count-badge"
                className="absolute -top-2 -right-2 bg-[#FF3333] text-white mono text-[10px] font-semibold min-w-5 h-5 px-1 flex items-center justify-center"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
