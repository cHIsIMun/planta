// Menu no celular, busca nas seções (⌘K) e destaque do item atual em "Nesta página".

const menu = document.querySelector(".menu");
const side = document.querySelector(".side");
if (menu && side) {
  const set = (open) => {
    side.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  menu.addEventListener("click", () => set(!side.classList.contains("open")));
  side.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
}

// Busca: títulos de seções e subseções, sem diferenciar acentos.
const input = document.querySelector(".search input");
const sections = document.querySelector(".sections");
const results = document.querySelector(".results");
if (input && sections && results) {
  const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const entries = (window.PLANTA_INDICE || []).map((e) => ({ ...e, key: fold(`${e.t} ${e.s}`) }));
  const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const run = () => {
    const words = fold(input.value).split(/\s+/).filter(Boolean);
    sections.hidden = words.length > 0;
    results.hidden = words.length === 0;
    if (words.length === 0) return;
    const found = entries.filter((e) => words.every((w) => e.key.includes(w))).slice(0, 30);
    results.innerHTML = found.length
      ? found.map((e) => `<li><a href="${e.u}">${escape(e.t)}<small>${/^\d+$/.test(e.s) ? `Seção ${e.s}` : escape(e.s)}</small></a></li>`).join("")
      : `<li class="empty">Nada encontrado para “${escape(input.value)}”.</li>`;
  };
  input.addEventListener("input", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") results.querySelector("a")?.click();
    if (e.key === "Escape") { input.value = ""; run(); input.blur(); }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (menu && !side.classList.contains("open")) menu.click();
      input.focus();
      input.select();
    }
  });
}

// "Nesta página": marca a subseção visível.
const links = [...document.querySelectorAll(".toc a")];
if (links.length && "IntersectionObserver" in window) {
  const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const visible = new Set();
  const observer = new IntersectionObserver((items) => {
    for (const item of items) (item.isIntersecting ? visible.add : visible.delete).call(visible, item.target.id);
    const first = [...byId.keys()].find((id) => visible.has(id));
    if (first) links.forEach((a) => a.classList.toggle("on", a === byId.get(first)));
  }, { rootMargin: "-60px 0px -65% 0px" });
  for (const id of byId.keys()) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}
