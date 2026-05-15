const files = [
  {
    id: 'rulebook',
    title: 'Project Moon TTRPG - Community Rulebook 3.x',
    path: 'Newest Material/Project Moon TTRPG - Community Rulebook 3.x.docx',
    type: 'docx',
    category: 'rules',
  },
  {
    id: 'effects',
    title: 'Effect List CR 3.2',
    path: 'Newest Material/Effect List CR 3.2.docx',
    type: 'docx',
    category: 'effects',
  },
  {
    id: 'items',
    title: 'Item List CR 3.x',
    path: 'Newest Material/Item List CR 3.x.docx',
    type: 'docx',
    category: 'rules',
  },
  {
    id: 'functional',
    title: 'Functional Part Repository',
    path: 'Newest Material/Functional Part Repository.docx',
    type: 'docx',
    category: 'rules',
  },
  {
    id: 'claw',
    title: 'CLAW (overCLAW) Spreadsheet',
    path: 'Newest Material/CLAW (overCLAW - Optimized, variated, enhanced and rebalanced Community-Led Additional Works).xlsx',
    type: 'xlsx',
    category: 'extensions',
  },
  {
    id: 'sheet',
    title: 'V1.5.0 PMTRPG Sheet',
    path: 'Newest Material/V1.5.0 PMTRPG Sheet - Ruleset_Effect List Stacker & Effect Searchers & Equipment Slot Amount & OverCLAW  & I PURGED ONE OF THE TWO DEMONS & gobalamogus.xlsx',
    type: 'xlsx',
    category: 'extensions',
  },
];

const categories = [
  { id: 'rules', title: 'Rules', containerId: 'rulesContent' },
  { id: 'effects', title: 'Effects', containerId: 'effectsContent' },
  { id: 'extensions', title: 'Extensions & Expansions', containerId: 'extensionsContent' },
];

const state = {
  loaded: {},
  textIndex: {},
};

const currentSearch = document.getElementById('siteSearch');
const searchStatus = document.getElementById('searchStatus');
const characterContent = document.getElementById('characterContent');
const sourcesContent = document.getElementById('sourcesContent');

function formatPath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'class') {
      element.className = value;
    } else if (key === 'text') {
      element.textContent = value;
    } else if (key === 'html') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  return element;
}

async function fetchArrayBuffer(file) {
  const response = await fetch(formatPath(file.path));
  if (!response.ok) {
    throw new Error(`Unable to load file: ${file.title}`);
  }
  return response.arrayBuffer();
}

async function parseDocx(file) {
  const arrayBuffer = await fetchArrayBuffer(file);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '<p>No readable document content was extracted.</p>';
}

function buildSheetHtml(workbook) {
  if (!workbook.SheetNames.length) {
    return '<p>No sheets found in this workbook.</p>';
  }

  return workbook.SheetNames
    .map((name) => {
      const sheet = workbook.Sheets[name];
      const html = XLSX.utils.sheet_to_html(sheet, { header: '', editable: false });
      return `<div class="sheet-block"><h3>${name}</h3>${html}</div>`;
    })
    .join('');
}

async function parseXlsx(file) {
  const arrayBuffer = await fetchArrayBuffer(file);
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return buildSheetHtml(workbook);
}

async function loadFile(file) {
  if (state.loaded[file.id]) {
    return state.loaded[file.id];
  }

  const loadingHtml = '<div class="loading-block">Loading document...</div>';
  try {
    const html = file.type === 'docx' ? await parseDocx(file) : await parseXlsx(file);
    state.loaded[file.id] = html;
    state.textIndex[file.id] = stripText(html);
    return html;
  } catch (error) {
    state.loaded[file.id] = `<div class="error-message">${error.message}</div>`;
    state.textIndex[file.id] = '';
    return state.loaded[file.id];
  }
}

function stripText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent.trim().toLowerCase();
}

function createFileCard(file) {
  const card = createElement('article', { class: 'file-card', 'data-file-id': file.id });
  const title = createElement('h3', { text: file.title });
  const meta = createElement('p', { class: 'preview-meta', text: `${file.type.toUpperCase()} · ${file.category}` });
  const actions = createElement('div', { class: 'file-actions' });
  const button = createElement('button', {
    class: 'view-button',
    type: 'button',
    'data-action': 'open',
    'data-file-id': file.id,
    text: 'Open document',
  });
  actions.appendChild(button);
  card.append(title, meta, actions);
  return card;
}

function createCategorySection(category) {
  const section = document.getElementById(category.containerId);
  section.innerHTML = '';
  const list = createElement('div', { class: 'file-list' });
  const filesInCategory = files.filter((file) => file.category === category.id);

  if (!filesInCategory.length) {
    list.appendChild(createElement('div', { class: 'empty-state', text: 'No files available for this category.' }));
    section.appendChild(list);
    return;
  }

  filesInCategory.forEach((file) => list.appendChild(createFileCard(file)));
  section.appendChild(list);
}

function renderSources() {
  const wrapper = createElement('div', { class: 'file-list' });
  files.forEach((file) => {
    const item = createElement('div', { class: 'file-card' });
    const title = createElement('h3', { text: file.title });
    const meta = createElement('p', { class: 'preview-meta', text: `Type: ${file.type.toUpperCase()} · Category: ${file.category}` });
    item.append(title, meta);
    wrapper.appendChild(item);
  });
  sourcesContent.innerHTML = '';
  sourcesContent.appendChild(wrapper);
}

function renderCharacterGuide() {
  const container = characterContent;
  container.innerHTML = '';
  const guide = createElement('div', { class: 'note-card' });
  const heading = createElement('h3', { text: 'Character creation highlights' });
  const text = createElement('p', {
    text: 'Load one or more documents, then search to surface character creation and player guidance from the imported files.',
  });
  guide.append(heading, text);
  container.appendChild(guide);
}

function setSearchStatus(message) {
  if (searchStatus) {
    searchStatus.textContent = message;
  }
}

function filterDocuments(query) {
  const normalized = query.trim().toLowerCase();
  const cards = document.querySelectorAll('.file-card[data-file-id]');
  let visibleCount = 0;

  cards.forEach((card) => {
    const fileId = card.getAttribute('data-file-id');
    const file = files.find((entry) => entry.id === fileId);
    const titleMatch = file.title.toLowerCase().includes(normalized);
    const textMatch = normalized === '' || (state.textIndex[fileId] && state.textIndex[fileId].includes(normalized));
    const visible = normalized === '' ? true : titleMatch || textMatch;
    card.style.display = visible ? 'grid' : 'none';
    if (visible) visibleCount += 1;
  });

  return visibleCount;
}

let searchTimer;
function onSearchInput(event) {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    const value = event.target.value;
    const count = filterDocuments(value);
    setSearchStatus(value.trim() === '' ? 'Search title or loaded text.' : `Found ${count} matching file${count === 1 ? '' : 's'}`);
  }, 200);
}

function createPreviewContainer(fileId) {
  const existing = document.querySelector(`.file-preview[data-file-id="${fileId}"]`);
  if (existing) {
    return existing;
  }

  const preview = createElement('div', { class: 'file-preview', 'data-file-id': fileId });
  preview.innerHTML = '<div class="loading-block">Document preview will appear here after opening.</div>';
  return preview;
}

async function openDocument(fileId) {
  const file = files.find((item) => item.id === fileId);
  if (!file) return;

  const card = document.querySelector(`.file-card[data-file-id="${fileId}"]`);
  if (!card) return;

  let preview = card.querySelector(`.file-preview[data-file-id="${fileId}"]`);
  if (!preview) {
    preview = createPreviewContainer(fileId);
    card.appendChild(preview);
  }

  preview.innerHTML = '<div class="loading-block">Loading document...</div>';
  const html = await loadFile(file);
  preview.innerHTML = `<div class="preview-content">${html}</div>`;
  setSearchStatus('Document loaded. Use search to filter within titles and loaded text.');
}

async function initialize() {
  if (!currentSearch || !searchStatus || !sourcesContent || !characterContent) {
    console.error('Initialization failed: expected DOM elements are missing.');
    return;
  }

  categories.forEach(createCategorySection);
  renderSources();
  renderCharacterGuide();
  setSearchStatus('Search title or loaded text. Use “Open document” to load a preview.');

  currentSearch.addEventListener('input', onSearchInput);

  document.body.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="open"]');
    if (!button) return;
    button.disabled = true;
    await openDocument(button.getAttribute('data-file-id'));
    button.disabled = false;
  });
}

window.addEventListener('DOMContentLoaded', initialize);
