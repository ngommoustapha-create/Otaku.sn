import { Shirt, ShoppingBag, PenTool, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { scrollToId } from "@/components/Header";

export default function BottomBar({ onCart, onCustom, waNumber }) {
  const { count } = useCart();
  const itemCls =
    "flex flex-col items-center justify-center gap-1 py-2.5 text-[#8F96A8] active:text-white transition-colors";
  const labelCls = "mono text-[9px] uppercase tracking-[0.15em]";
  return (
    <nav
      data-testid="mobile-bottom-bar"
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0F1117]/95 backdrop-blur-xl border-t border-[#222738]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        <button data-testid="bottom-catalog-btn" onClick={() => scrollToId("catalogue")} className={itemCls}>
          <Shirt size={20} />
          <span className={labelCls}>Catalogue</span>
        </button>
        <button data-testid="bottom-cart-btn" onClick={onCart} className={`${itemCls} relative`}>
          <ShoppingBag size={20} />
          <span className={labelCls}>Panier</span>
          {count > 0 && (
            <span className="absolute top-1 right-1/2 translate-x-5 bg-[#FF3333] text-white mono text-[9px] min-w-4 h-4 px-1 flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
        <button data-testid="bottom-custom-order-btn" onClick={onCustom} className={itemCls}>
          <PenTool size={20} />
          <span className={labelCls}>Sur-mesure</span>
        </button>
        <a
          data-testid="bottom-whatsapp-link"
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour Otaku.sn ! J'ai une question.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${itemCls} text-[#25D366]`}
        >
          <MessageCircle size={20} />
          <span className={labelCls}>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
