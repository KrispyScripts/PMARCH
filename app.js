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
  { id: 'rules', title: 'Rules', containerId: 'rulesContent', description: 'Core rules, items, and mechanics imported from the rulebook sources.' },
  { id: 'effects', title: 'Effects', containerId: 'effectsContent', description: 'Effect listings and rules extracted for easy review.' },
  { id: 'extensions', title: 'Extensions & Expansions', containerId: 'extensionsContent', description: 'Community expansions and sheet-based modifiers pulled from the archives.' },
];

const currentSearch = document.getElementById('siteSearch');
const searchStatus = document.getElementById('searchStatus');
const rulesContent = document.getElementById('rulesContent');
const effectsContent = document.getElementById('effectsContent');
const extensionsContent = document.getElementById('extensionsContent');
const characterContent = document.getElementById('characterContent');
const sourcesContent = document.getElementById('sourcesContent');

const loadedDocs = {};
const rawSections = {};
const textCache = {};

function formatPath(path) {
  return encodeURI(path).replace(/%2F/g, '/');
}

function safeTitle(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadDocx(file) {
  const response = await fetch(formatPath(file.path));
  if (!response.ok) throw new Error(`Unable to load ${file.title}`);
  const arrayBuffer = await response.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '<p>[No readable text was extracted]</p>';
}

function buildXlsxHtml(workbook) {
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) return '<p>[No sheets found]</p>';

  return sheetNames
    .map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(sheet, { header: '', editable: false });
      return `<section class="sheet-block"><h4>${safeTitle(sheetName)}</h4>${html}</section>`;
    })
    .join('');
}

async function loadXlsx(file) {
  const response = await fetch(formatPath(file.path));
  if (!response.ok) throw new Error(`Unable to load ${file.title}`);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return buildXlsxHtml(workbook);
}

async function loadFile(file) {
  try {
    if (file.type === 'docx') {
      loadedDocs[file.id] = await loadDocx(file);
    } else if (file.type === 'xlsx') {
      loadedDocs[file.id] = await loadXlsx(file);
    }
    // Cache text content for searching
    const tmp = document.createElement('div');
    tmp.innerHTML = loadedDocs[file.id];
    textCache[file.id] = tmp.textContent.toLowerCase();
  } catch (error) {
    loadedDocs[file.id] = `<div class="error-message">${safeTitle(error.message)}</div>`;
    textCache[file.id] = '';
  }
}

function renderDocEntry(file) {
  const title = safeTitle(file.title);
  const meta = `${file.type.toUpperCase()} file imported from archive`;
  const content = loadedDocs[file.id] || '<div class="loading-block">Loading...</div>';

  return `
    <article class="doc-entry" data-doc-id="${file.id}" data-searchable="${textCache[file.id] || ''}">
      <h3>${title}</h3>
      <div class="doc-meta">${meta}</div>
      <div class="doc-body">${content}</div>
    </article>
  `;
}

function renderCategory(category) {
  const items = files.filter((file) => file.category === category.id);
  if (items.length === 0) {
    return '<div class="loading-block">No imported documents available for this category.</div>';
  }

  return items.map((file) => renderDocEntry(file)).join('');
}

function createSourcesList() {
  return files
    .map((file) => {
      return `<li><a href="#${file.category}">${safeTitle(file.title)}</a> — ${file.type.toUpperCase()}</li>`;
    })
    .join('');
}

function extractCharacterGuide() {
  const keywords = [/character/i, /creation/i, /attributes?/i, /race/i, /class/i, /background/i, /skills?/i, /ability/i, /equipment/i];
  const snippets = [];

  Object.entries(textCache).forEach(([id, text]) => {
    const lines = text.split(/\n|\r|\. |\? |! /).map((line) => line.trim()).filter(Boolean);

    lines.forEach((line) => {
      if (keywords.some((rx) => rx.test(line)) && snippets.length < 14) {
        snippets.push(`<p>${safeTitle(line)}</p>`);
      }
    });
  });

  if (snippets.length === 0) {
    return '<div class="loading-block">Character creation content is being indexed. Open the rules section to load more data.</div>';
  }

  return `
    <div class="guide-block">
      <p>Key character creation concepts and guidance extracted from the loaded documents.</p>
      ${snippets.join('')}
    </div>
  `;
}

function updateSectionContent() {
  categories.forEach((category) => {
    const container = document.getElementById(category.containerId);
    if (container) {
      container.innerHTML = renderCategory(category);
    }
  });

  if (characterContent) {
    characterContent.innerHTML = extractCharacterGuide();
  }

  if (sourcesContent) {
    sourcesContent.innerHTML = `<ul>${createSourcesList()}</ul>`;
  }
}

let searchTimeout;
function applySearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const normalized = query.trim().toLowerCase();
    const docEntries = document.querySelectorAll('.doc-entry');
    let matchCount = 0;

    docEntries.forEach((entry) => {
      const searchable = entry.getAttribute('data-searchable') || '';
      const matches = normalized === '' || searchable.includes(normalized);
      entry.style.display = matches ? 'block' : 'none';
      if (matches) matchCount += 1;
    });

    if (characterContent) {
      characterContent.style.display = 'block';
    }

    searchStatus.textContent = normalized === ''
      ? 'Search across imported files.'
      : `Search results: ${matchCount} matching section${matchCount === 1 ? '' : 's'}`;
  }, 300);
}

async function initializeWebsite() {
  // Show loading state
  searchStatus.textContent = 'Loading documents...';
  
  // Load files with request animation frame for smooth UI
  const filePromises = [];
  for (const file of files) {
    filePromises.push(
      new Promise((resolve) => {
        requestAnimationFrame(async () => {
          await loadFile(file);
          resolve();
        });
      })
    );
  }
  
  await Promise.all(filePromises);
  updateSectionContent();
  searchStatus.textContent = 'Search across imported files.';

  if (currentSearch) {
    currentSearch.addEventListener('input', (event) => {
      applySearch(event.target.value);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initializeWebsite();
});
