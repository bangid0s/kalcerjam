import type { ReactNode } from "react";

/** 2026 logo (letters crop). `ink` turns it black for use on lime. */
export function Logo({ className = "", ink = false }: { className?: string; ink?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- transparent art, fixed size
    <img src="/brand/kj-letters.webp" alt="Kalcer Jam" width={900} height={375} className={`h-auto ${ink ? "brightness-0" : ""} ${className}`} />
  );
}

export function AnakKalcer({ className = "", ink = false }: { className?: string; ink?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- transparent art, fixed size
    <img src="/brand/anak-kalcer.webp" alt="Anak Kalcer" width={900} height={886} loading="lazy" className={`h-auto ${ink ? "brightness-0" : ""} ${className}`} />
  );
}

/** Endless scrolling strip of words. */
export function Ticker({ items, reverse = false, className = "" }: { items: string[]; reverse?: boolean; className?: string }) {
  const row = items.map((t, i) => (
    <span key={i} className="flex items-center gap-8 px-4">
      <span>{t}</span>
      <span aria-hidden className="h-[.35em] w-[.35em] bg-current" />
    </span>
  ));
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={items.join(", ")}>
      <div aria-hidden className={`display flex w-max ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
        {row}
        {row}
      </div>
    </div>
  );
}

/** Photo slot: real image if src is given, else a plain placeholder block. */
export function Photo({ src, alt, credit, className = "" }: { src?: string; alt: string; credit?: string; className?: string }) {
  return (
    <figure className={`relative overflow-hidden rounded-xl bg-paper-2 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center p-3">
          <span className="label text-center text-ink/40">{alt}</span>
        </div>
      )}
      {credit && <figcaption className="label absolute bottom-2 left-2 text-[.7rem] text-ink/60">{credit}</figcaption>}
    </figure>
  );
}

/** Page top: lime slab with the page title. */
export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="bg-kj pb-12 pt-32 text-ink md:pb-16 md:pt-40">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="label">{kicker}</p>
        <h1 className="display mt-3 break-words text-[clamp(3.5rem,12vw,10rem)]">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-lg md:text-xl">{children}</div>}
      </div>
    </header>
  );
}

/** Section label with a rule running to the edge. */
export function SectionTag({ children }: { children: ReactNode }) {
  return (
    <p className="label flex items-center gap-3">
      <span className="h-2.5 w-2.5 bg-kj ring-1 ring-ink" aria-hidden />
      {children}
      <span className="h-px flex-1 bg-ink/15" />
    </p>
  );
}
