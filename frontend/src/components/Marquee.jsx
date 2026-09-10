const ITEMS = [
  "OTAKU.SN",
  "KAOLACK STREETWEAR",
  "T-SHIRTS 1000–1200 GSM",
  "ANIME × SACRÉ × SUR-MESURE",
  "LIVRAISON PARTOUT AU SÉNÉGAL",
  "COMMANDES WHATSAPP DIRECTES",
];

export default function Marquee() {
  const row = (key) => (
    <div key={key} className="flex shrink-0 items-center">
      {ITEMS.map((t, i) => (
        <span key={i} className="mono text-[11px] tracking-[0.3em] uppercase text-[#575D6E] px-6 whitespace-nowrap">
          {t} <span className="text-[#FF3333] pl-6">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div data-testid="manifesto-marquee" className="overflow-hidden border-y border-[#222738] bg-[#0F1117] py-3.5">
      <div className="animate-marquee flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
