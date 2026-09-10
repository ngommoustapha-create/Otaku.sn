import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import api, { formatApiErrorDetail } from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("otaku_admin_token", data.token);
      navigate("/admin");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-[#08090C] border border-[#222738] focus:border-[#FF3333] outline-none transition-colors px-4 py-3 text-sm text-white placeholder:text-[#575D6E]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(255,51,51,0.1), transparent 70%)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm border border-[#222738] bg-[#0F1117] p-8"
      >
        <p className="font-display text-3xl font-black text-white text-center">
          OTAKU<span className="text-[#FF3333]">.SN</span>
        </p>
        <p className="mono text-[10px] tracking-[0.3em] uppercase text-[#575D6E] text-center mt-1 mb-8">
          Espace administrateur
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            data-testid="admin-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputCls}
          />
          <input
            data-testid="admin-password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className={inputCls}
          />
          {error && (
            <p data-testid="admin-login-error" className="mono text-xs text-[#FF3333] border border-[#FF3333]/40 bg-[#FF3333]/10 px-3 py-2">
              {error}
            </p>
          )}
          <button
            data-testid="admin-login-button"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FF3333] hover:bg-[#E62828] disabled:opacity-50 transition-colors text-white font-display font-bold uppercase tracking-wide text-lg py-3.5"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Connexion
          </button>
        </form>
        <Link
          data-testid="admin-back-to-shop-link"
          to="/"
          className="mt-6 flex items-center justify-center gap-2 mono text-[10px] tracking-[0.25em] uppercase text-[#575D6E] hover:text-white transition-colors"
        >
          <ArrowLeft size={13} /> Retour à la boutique
        </Link>
      </motion.div>
    </div>
  );
}
