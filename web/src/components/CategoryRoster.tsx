"use client";

import { useEffect, useState } from "react";
import { sb } from "@/components/admin/supabase";

type Row = { id: number; category: string; label: string; crew: string; city: string; status: string; seed: number | null };

// One shared fetch for every roster on the page, refreshed every 30 s.
let cache: { at: number; rows: Promise<Row[]> } | null = null;
const loadRows = () => {
  if (!cache || Date.now() - cache.at > 25000) {
    cache = {
      at: Date.now(),
      rows: Promise.resolve(sb().from("kj_public_entries").select("id,category,label,crew,city,status,seed").eq("status", "active"))
        .then(({ data, error }) => (error ? [] : (data as Row[]))),
    };
  }
  return cache.rows;
};

/** Registered dancers for one category, synced from Supabase. Hidden until someone has entered. */
export function CategoryRoster({ slug, label, more }: { slug: string; label: string; more: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let live = true;
    const tick = () => loadRows().then((all) => live && setRows(all.filter((r) => r.category === slug)));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30000);
    return () => { live = false; clearTimeout(first); clearInterval(id); };
  }, [slug]);
  if (!rows?.length) return null;
  const shown = open ? rows : rows.slice(0, 8);
  return (
    <div className="border-t border-ink/15 py-3">
      <p className="label text-ink/50">{label} · {rows.length}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {shown.map((r) => <li key={r.id} title={[r.crew, r.city].filter(Boolean).join(" · ")} className="rounded-full bg-paper-2 px-2.5 py-0.5 text-sm">{r.label}</li>)}
      </ul>
      {rows.length > 8 && !open && <button onClick={() => setOpen(true)} className="label mt-2 underline">{more} ({rows.length - 8})</button>}
    </div>
  );
}
