(() => {
  const ALL = 'Todos';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const list = document.getElementById('list');
  const filtersEl = document.getElementById('filters');
  const searchEl = document.getElementById('search');
  const emptyEl = document.getElementById('empty');
  const showingEl = document.getElementById('sShowing');
  const themeBtn = document.getElementById('theme-toggle');

  let activeCategory = ALL;
  let query = '';

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ---------- Tema ---------- */
  // O botão mostra a ação, não o estado: "Tema escuro" troca para o escuro.
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    themeBtn.textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  };

  applyTheme(document.documentElement.dataset.theme || 'light');

  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  /* ---------- Cards ---------- */
  // Os cards são escritos no index.html; aqui só lemos os dados para busca e filtros.
  const rows = [...list.querySelectorAll('.row')].map((row) => {
    const text = (selector) => row.querySelector(selector).textContent;
    const category = row.dataset.cat;
    const stack = text('.row-meta').split(' · ').map((s) => s.trim());

    row.dataset.search = [text('.row-title'), text('.row-desc'), category, ...stack]
      .join(' ')
      .toLowerCase();

    return { row, category, stack };
  });

  /* ---------- Filtros e busca ---------- */
  const categories = [ALL, ...new Set(rows.map((r) => r.category))];

  const filterButtons = categories.map((category) => {
    const count = category === ALL
      ? rows.length
      : rows.filter((r) => r.category === category).length;

    const btn = el('button', 'filter');
    btn.type = 'button';
    btn.dataset.cat = category;
    btn.append(category, el('span', 'count', String(count)));
    filtersEl.append(btn);
    return btn;
  });

  const syncFilters = () => {
    filterButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.cat === activeCategory));
    });
  };

  const applyFilters = () => {
    const q = query.trim().toLowerCase();
    let visible = 0;

    rows.forEach(({ row, category }) => {
      const matchCategory = activeCategory === ALL || category === activeCategory;
      const matchQuery = !q || row.dataset.search.includes(q);
      const show = matchCategory && matchQuery;

      // Ao reexibir, a animação de entrada roda de novo
      row.hidden = !show;
      if (show) visible += 1;
    });

    emptyEl.hidden = visible > 0;
    showingEl.textContent = String(visible).padStart(2, '0');
  };

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    syncFilters();
    applyFilters();
  });

  searchEl.addEventListener('input', () => {
    query = searchEl.value;
    applyFilters();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchEl) {
      e.preventDefault();
      searchEl.focus();
    }
  });

  syncFilters();
  applyFilters();

  /* ---------- Números ---------- */
  const countUp = (node, target) => {
    if (reduceMotion) {
      node.textContent = target;
      return;
    }

    const duration = 1100;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const figures = {
    total: rows.length,
    categories: new Set(rows.map((r) => r.category)).size,
    tech: new Set(rows.flatMap((r) => r.stack)).size,
  };

  document.querySelectorAll('[data-stat]').forEach((node) => {
    countUp(node, figures[node.dataset.stat]);
  });
})();
