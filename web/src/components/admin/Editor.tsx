"use client";

import { useRef, useState } from "react";
import { MEDIA_BUCKET } from "@/lib/supabase-env";
import { sb } from "./supabase";

// Generic form for any JSON-shaped content section. Shapes it understands:
//   {en, id}        → two side-by-side text fields (English / Bahasa)
//   string          → text field (image picker for photo/image/logo keys, textarea for long copy)
//   number/boolean  → number input / toggle
//   array           → list with add, remove, move up/down
//   object          → labelled group of the above

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };
type Path = (string | number)[];

const isT = (v: Json): v is { en: string; id: string } =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 2 && typeof v.en === "string" && typeof v.id === "string";

const isImageKey = (k: string) => /(photo|image|logo)$/i.test(k);
const isLongKey = (k: string) => /(body|blurb|intro|description|paragraph|^a$|caption|note)/i.test(k);

const FIELD_HELP: Record<string, string> = {
  start: "Countdown target, ISO format with timezone, e.g. 2027-07-26T10:00:00+07:00",
  path: "Site path, e.g. /2027/rules",
  day: "Day number this category belongs to (matches the Event days)",
  size: "normal, tall or wide",
  venueMapUrl: "Google Maps → Share → Embed a map → copy the src URL",
  streamUrl: "YouTube embed URL, e.g. https://www.youtube.com/embed/VIDEO_ID",
  rsvpOpen: "When off, the RSVP form shows the 'closed' message instead of saving",
  showOnHome: "Show this tier's logos in the home page 'Backed by' strip",
  statusButtonUrl: "Leave empty to keep the button disabled",
  url: "Optional link",
};

export function humanize(key: string) {
  const s = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Empty copy of a value's shape, used as the template for a new list item. */
function blank(v: Json): Json {
  if (typeof v === "string") return "";
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return null;
}

function getAt(root: Json, path: Path): Json | undefined {
  let cur: Json | undefined = root;
  for (const p of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Obj)[p as string] ?? (Array.isArray(cur) ? (cur as Json[])[0] : undefined); // fall back to first item for array templates
  }
  return cur;
}

function setAt(root: Json, path: Path, value: Json): Json {
  if (!path.length) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy;
  }
  const obj = (root ?? {}) as Obj;
  return { ...obj, [head]: setAt(obj[head as string], rest, value) };
}

function summary(v: Json, i: number): string {
  if (typeof v === "string") return v || `Item ${i + 1}`;
  if (isT(v)) return v.en || v.id || `Item ${i + 1}`;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of ["name", "title", "q", "tier", "group", "label", "year", "code", "time", "date", "alt", "a"]) {
      const f = (v as Obj)[k];
      if (typeof f === "string" && f) return f;
      if (f && isT(f) && (f.en || f.id)) return f.en || f.id;
    }
  }
  return `Item ${i + 1}`;
}

const input = "w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-kj";

export function Editor({ value, defaults, onChange }: { value: Json; defaults: Json; onChange: (v: Json) => void }) {
  const set = (path: Path, v: Json) => onChange(setAt(value, path, v));
  return <Node k="" v={value} path={[]} set={set} defaults={defaults} depth={0} />;
}

function Node({ k, v, path, set, defaults, depth }: { k: string; v: Json; path: Path; set: (p: Path, v: Json) => void; defaults: Json; depth: number }) {
  const label = k ? humanize(k) : "";
  const help = FIELD_HELP[k];

  if (isT(v)) {
    const long = isLongKey(k) || v.en.length > 40 || v.id.length > 40;
    const Field = long ? "textarea" : "input";
    return (
      <div>
        {label && <FieldLabel label={label} help={help} />}
        <div className="grid gap-2 md:grid-cols-2">
          {(["en", "id"] as const).map((l) => (
            <label key={l} className="relative block">
              <span className="absolute right-2 top-2 rounded bg-ink/10 px-1.5 text-[10px] font-bold uppercase text-ink/60">{l === "en" ? "EN" : "ID"}</span>
              <Field value={v[l]} rows={long ? 3 : undefined} onChange={(e) => set(path, { ...v, [l]: e.target.value })} className={`${input} pr-10`} />
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (typeof v === "string") {
    if (isImageKey(k)) return <ImageField label={label} value={v} onChange={(nv) => set(path, nv)} />;
    const long = isLongKey(k) || v.length > 90;
    return (
      <label className="block">
        {label && <FieldLabel label={label} help={help} />}
        {long ? (
          <textarea value={v} rows={3} onChange={(e) => set(path, e.target.value)} className={input} />
        ) : (
          <input value={v} onChange={(e) => set(path, e.target.value)} className={input} />
        )}
      </label>
    );
  }

  if (typeof v === "number") {
    return (
      <label className="block">
        {label && <FieldLabel label={label} help={help} />}
        <input type="number" value={v} onChange={(e) => set(path, Number(e.target.value))} className={`${input} max-w-40`} />
      </label>
    );
  }

  if (typeof v === "boolean") {
    return (
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={v} onChange={(e) => set(path, e.target.checked)} className="mt-1 h-5 w-5 accent-ink" />
        <span><span className="font-semibold">{label}</span>{help && <span className="block text-xs text-ink/55">{help}</span>}</span>
      </label>
    );
  }

  if (Array.isArray(v)) return <ListNode k={k} v={v} path={path} set={set} defaults={defaults} depth={depth} />;

  if (v && typeof v === "object") {
    const fields = Object.entries(v);
    const body = (
      <div className="space-y-4">
        {fields.map(([ck, cv]) => (
          <Node key={ck} k={ck} v={cv} path={[...path, ck]} set={set} defaults={defaults} depth={depth + 1} />
        ))}
      </div>
    );
    if (!label) return body;
    return (
      <fieldset className="rounded-lg border border-ink/15 bg-paper/50 p-4">
        <legend className="px-1 text-sm font-bold">{label}</legend>
        {body}
      </fieldset>
    );
  }
  return null;
}

function ListNode({ k, v, path, set, defaults, depth }: { k: string; v: Json[]; path: Path; set: (p: Path, v: Json) => void; defaults: Json; depth: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const simple = v.every((x) => typeof x === "string" || isT(x));
  const template = (): Json => {
    const sample = v[0] ?? getAt(defaults, [...path, 0]);
    return sample === undefined ? "" : blank(sample);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= v.length) return;
    const copy = [...v];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    set(path, copy);
    if (open === i) setOpen(j);
  };
  const remove = (i: number) => {
    if (!confirm("Remove this item?")) return;
    set(path, v.filter((_, x) => x !== i));
    setOpen(null);
  };
  const add = () => {
    set(path, [...v, template()]);
    setOpen(v.length);
  };

  return (
    <div>
      {k && <FieldLabel label={`${humanize(k)} (${v.length})`} help={FIELD_HELP[k]} />}
      <ol className="space-y-2">
        {v.map((item, i) => (
          <li key={i} className="rounded-lg border border-ink/15 bg-white">
            <div className="flex items-center gap-1 px-2 py-1.5">
              {simple ? (
                <div className="flex-1 py-1 pl-1"><Node k="" v={item} path={[...path, i]} set={set} defaults={defaults} depth={depth + 1} /></div>
              ) : (
                <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex flex-1 items-center gap-2 truncate py-1.5 pl-1 text-left font-semibold">
                  <span className={`inline-block text-xs transition-transform ${open === i ? "rotate-90" : ""}`}>▶</span>
                  <span className="truncate">{summary(item, i)}</span>
                </button>
              )}
              <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</IconBtn>
              <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === v.length - 1}>↓</IconBtn>
              <IconBtn label="Remove" onClick={() => remove(i)} danger>✕</IconBtn>
            </div>
            {!simple && open === i && (
              <div className="border-t border-ink/10 p-4">
                <Node k="" v={item} path={[...path, i]} set={set} defaults={defaults} depth={depth + 1} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <button type="button" onClick={add} className="mt-2 rounded-md border border-dashed border-ink/40 px-3 py-1.5 text-sm font-semibold hover:border-ink hover:bg-kj">
        + Add {k ? humanize(k).replace(/s$/, "").toLowerCase() : "item"}
      </button>
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded text-sm disabled:opacity-25 ${danger ? "hover:bg-stamp hover:text-white" : "hover:bg-ink/10"}`}>
      {children}
    </button>
  );
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="mb-1 block">
      <span className="text-sm font-semibold">{label}</span>
      {help && <span className="block text-xs text-ink/55">{help}</span>}
    </span>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upload = async (file: File) => {
    setBusy(true);
    setErr("");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const name = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb().storage.from(MEDIA_BUCKET).upload(name, file, { cacheControl: "31536000", contentType: file.type });
    if (error) setErr(error.message);
    else onChange(sb().storage.from(MEDIA_BUCKET).getPublicUrl(name).data.publicUrl);
    setBusy(false);
  };
  return (
    <div>
      {label && <FieldLabel label={label} help="Upload an image (max 10 MB) or paste an image URL" />}
      <div className="flex items-start gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-ink/15 bg-paper-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-ink/40">No image</span>}
        </div>
        <div className="flex-1 space-y-2">
          <input value={value} placeholder="https://…" onChange={(e) => onChange(e.target.value)} className={input} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-paper hover:bg-ink-2 disabled:opacity-50">
              {busy ? "Uploading…" : "Upload image"}
            </button>
            {value && <button type="button" onClick={() => onChange("")} className="rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-ink/10">Clear</button>}
          </div>
          {err && <p className="text-sm text-stamp">{err}</p>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        </div>
      </div>
    </div>
  );
}

export type { Json };
