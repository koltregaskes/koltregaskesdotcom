const grid = document.getElementById("grid");
const meta = document.getElementById("meta");
const buttons = [...document.querySelectorAll("button[data-filter]")];

let state = { items: [], filter: "all" };

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function render() {
  const items = state.filter === "all"
    ? state.items
    : state.items.filter(x => x.kind === state.filter);

  grid.innerHTML = items.map(item => {
    const title = escapeHtml(item.title);
    const summary = escapeHtml(item.summary || "");
    const tags = (item.tags || []).slice(0, 6).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");

    const primaryUrl = item.url || item.notionUrl || "#";
    const label = item.kind.toUpperCase();

    return `
      <article class="tile">
        <div class="tileTop">
          <span class="pill">${label}</span>
          <a class="link" href="${primaryUrl}" target="_blank" rel="noreferrer">Open</a>
        </div>
        <h3>${title}</h3>
        ${summary ? `<p class="muted">${summary}</p>` : ""}
        ${tags ? `<div class="tags">${tags}</div>` : ""}
      </article>
    `;
  }).join("");

  meta.textContent = `Showing ${items.length} of ${state.items.length}`;
}

function setFilter(f) {
  state.filter = f;
  buttons.forEach(b => b.classList.toggle("active", b.dataset.filter === f));
  render();
}

buttons.forEach(b => b.addEventListener("click", () => setFilter(b.dataset.filter)));

fetch("./data/notion.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    state.items = Array.isArray(data.items) ? data.items : [];
    meta.textContent = `Last build: ${data.updatedAt} | Items: ${data.count}`;
    render();
  })
  .catch(() => {
    meta.textContent = "No data yet. Run the workflow once.";
  });
