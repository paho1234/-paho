export default function BannerPromo({ texto }: { texto: string }) {
  return (
    <div className="relative bg-ink text-paper overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-center gap-3 text-center">
        <span className="stamp w-9 h-9 text-[11px] text-amber border-amber bg-ink shrink-0">
          %
        </span>
        <p className="font-mono text-[11px] sm:text-xs uppercase tracking-wide">
          {texto}
        </p>
      </div>
      <div
        className="h-2"
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent 50%, #FAF6EF 50%), linear-gradient(225deg, transparent 50%, #FAF6EF 50%)",
          backgroundSize: "14px 14px",
          backgroundPosition: "bottom",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  );
}
