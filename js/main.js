(() => {
  const ALL = 'Todos';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const top = document.querySelector('.top');
  const list = document.getElementById('list');
  const filtersEl = document.getElementById('filters');
  const searchEl = document.getElementById('search');
  const emptyEl = document.getElementById('empty');
  const themeBtn = document.getElementById('theme-toggle');

  let activeCategory = ALL;
  let query = '';
  const rows = [];

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const externalLink = (href, text, className = 'link') => {
    const a = el('a', className, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
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

  /* ---------- Linhas ---------- */
  const buildRow = (project, index) => {
    const row = el('li', 'row');
    row.style.setProperty('--delay', `${index * 70 + 300}ms`);
    row.dataset.search = [project.title, project.description, project.category, ...project.stack]
      .join(' ')
      .toLowerCase();

    const titleLink = externalLink(project.url, project.title, '');
    const title = el('h3', 'row-title');
    title.append(titleLink);

    const desc = el('p', 'row-desc', project.description);

    // Miniatura da tela do app: também leva ao site
    const middle = el('div', 'row-middle');
    middle.append(desc);
    if (project.thumb) {
      const thumbLink = externalLink(project.url, '', 'row-thumb');
      thumbLink.setAttribute('aria-label', `Abrir ${project.title}`);
      const img = el('img');
      img.src = project.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 1280;
      img.height = 800;
      thumbLink.append(img);
      middle.append(thumbLink);
    }

    const meta = el('p', 'row-meta');
    meta.append(el('span', '', project.category), document.createTextNode(' · '), el('span', '', project.stack.join(', ')));
    if (project.badge) meta.append(el('span', 'badge', project.badge));

    const linksWrap = el('div', 'row-links');
    linksWrap.append(externalLink(project.url, 'Abrir app', 'link link-strong'));

    const side = el('div', 'row-side');
    side.append(meta, linksWrap);

    row.append(title, middle, side);
    return row;
  };

  PROJECTS.forEach((project, index) => {
    const row = buildRow(project, index);
    list.append(row);
    rows.push({ row, project });
  });

  /* ---------- Filtros e busca ---------- */
  const categories = [ALL, ...new Set(PROJECTS.map((p) => p.category))];

  const filterButtons = categories.map((category) => {
    const count = category === ALL
      ? PROJECTS.length
      : PROJECTS.filter((p) => p.category === category).length;

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

    rows.forEach(({ row, project }) => {
      const matchCategory = activeCategory === ALL || project.category === activeCategory;
      const matchQuery = !q || row.dataset.search.includes(q);
      const show = matchCategory && matchQuery;

      // Ao reexibir, a animação de entrada roda de novo
      row.hidden = !show;
      if (show) visible += 1;
    });

    emptyEl.hidden = visible > 0;
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
    total: PROJECTS.length,
    categories: new Set(PROJECTS.map((p) => p.category)).size,
    tech: new Set(PROJECTS.flatMap((p) => p.stack)).size,
  };

  document.querySelectorAll('[data-stat]').forEach((node) => {
    countUp(node, figures[node.dataset.stat]);
  });

  /* ---------- Cabeçalho ---------- */
  const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
