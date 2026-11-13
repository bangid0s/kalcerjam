"use client";

import { useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";

export function Card({ title, aside, children, className = "", dark = false }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <section className={`${dark ? "rounded-2xl bg-ink text-paper" : "paper"} p-5 md:p-6 ${className}`}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="display text-2xl md:text-3xl">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Btn({ children, onClick, kind = "ink", disabled, type = "button", className = "" }: {
  children: ReactNode; onClick?: () => void; kind?: "ink" | "kj" | "ghost" | "danger"; disabled?: boolean; type?: "button" | "submit"; className?: string;
}) {
  const k = {
    ink: "bg-ink text-paper hover:bg-kj hover:text-ink",
    kj: "bg-kj text-ink hover:bg-ink hover:text-paper",
    ghost: "border-2 border-current hover:bg-ink hover:text-paper",
    danger: "bg-stamp text-white hover:bg-ink",
  }[kind];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${k} ${className}`}>
      {children}
    </button>
  );
}

export const inputCls = "w-full rounded-md border-2 border-ink bg-white px-3 py-2.5 text-ink placeholder:text-ink/40";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/55">{hint}</span>}
    </label>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "live" | "ink" }) {
  const t = { muted: "bg-ink/10 text-ink", ok: "bg-kj text-ink", warn: "bg-gold text-ink", live: "bg-stamp text-white", ink: "bg-ink text-paper" }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${t}`}>{children}</span>;
}

export function Notice({ kind, children, onClose }: { kind: "ok" | "err" | "info"; children: ReactNode; onClose?: () => void }) {
  const c = kind === "err" ? "bg-stamp text-white" : kind === "ok" ? "bg-kj text-ink" : "bg-ink/10 text-ink";
  return (
    <div role={kind === "err" ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm font-semibold ${c}`}>
      <span>{children}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">✕</button>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="paper px-4 py-3">
      <p className="label text-ink/60">{label}</p>
      <p className="display text-4xl">{value}</p>
    </div>
  );
}

/** QR code rendered locally (the token never leaves the browser). */
export function Qr({ value, size = 220, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" }).then((u) => live && setSrc(u));
    return () => { live = false; };
  }, [value, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={label} width={size} height={size} className="rounded-md bg-white" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-md bg-paper-2" aria-label={label} />
  );
}

/** Small "busy + message" helper for buttons that call Supabase. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg({ kind: "ok", text: ok });
      return true;
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : String(e) });
      return false;
    } finally {
      setBusy(false);
    }
  };
  const note = msg ? <Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice> : null;
  return { busy, run, note, setMsg };
}
