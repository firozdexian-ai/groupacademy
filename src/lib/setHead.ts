// Lightweight head injection helpers for SSR-friendly public pages.
export function setHead(opts: { title: string; description: string; image?: string; canonical?: string; jsonLd?: object | null; key?: string }) {
  const { title, description, image, canonical, jsonLd, key = "discovery" } = opts;
  document.title = title;
  const ensure = (sel: string, create: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = create(); document.head.appendChild(el); }
    return el;
  };
  const meta = (name: string, content: string, attr: "name" | "property" = "name") => {
    const el = ensure(`meta[${attr}="${name}"]`, () => { const m = document.createElement("meta"); m.setAttribute(attr, name); return m; });
    el.setAttribute("content", content);
  };
  meta("description", description);
  meta("og:title", title, "property");
  meta("og:description", description, "property");
  if (image) meta("og:image", image, "property");
  meta("twitter:card", image ? "summary_large_image" : "summary");
  if (canonical) {
    const link = ensure(`link[rel="canonical"]`, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
    link.setAttribute("href", canonical);
  }
  const id = `ld-${key}`;
  let s = document.getElementById(id) as HTMLScriptElement | null;
  if (jsonLd) {
    if (!s) { s = document.createElement("script"); s.id = id; s.type = "application/ld+json"; document.head.appendChild(s); }
    s.text = JSON.stringify(jsonLd);
  } else if (s) s.remove();
}
