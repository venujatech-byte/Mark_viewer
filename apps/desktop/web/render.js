window.decorateMarkdown = function (preview) {
  const ids = new Set([...preview.querySelectorAll('[id]')].map(node => node.id));
  for (const heading of preview.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const base = heading.textContent.toLowerCase().trim().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s+/g, '-') || 'section';
    let id = base;
    let suffix = 1;
    while (ids.has(id)) id = `${base}-${suffix++}`;
    heading.id = id;
    ids.add(id);
  }
  for (const code of preview.querySelectorAll('pre code')) {
    const language = code.className.match(/\blanguage-([\w-]+)/)?.[1];
    if (language && window.hljs?.getLanguage(language)) {
      code.innerHTML = window.hljs.highlight(code.textContent, { language }).value;
    }
  }
};
