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
  { id: 'rules', containerId: 'rulesContent' },
  { id: 'effects', containerId: 'effectsContent' },
  { id: 'extensions', containerId: 'extensionsContent' },
];

const currentSearch = document.getElementById('siteSearch');
const searchStatus = document.getElementById('searchStatus');
const characterContent = document.getElementById('characterContent');
const sourcesContent = document.getElementById('sourcesContent');
const navButtons = Array.from(document.querySelectorAll('.site-nav button'));

const loadedDocs = {};

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
  } catch (error) {
    loadedDocs[file.id] = `<div class="error-message">${safeTitle(error.message)}</div>`;
  }
}

function renderDocEntry(file) {
  const title = safeTitle(file.title);
  const meta = `${file.type.toUpperCase()} file imported from archive`;
  const content = loadedDocs[file.id]
    ? `<div class="document-body">${loadedDocs[file.id]}</div>`
    : '<div class="loading-block">Loading...</div>';

  return `
    <article class="doc-entry" data-doc-id="${file.id}">
      <div class="doc-header">
        <div>
          <h3>${title}</h3>
          <div class="doc-meta">${meta}</div>
        </div>
        <div class="doc-actions">
          <button type="button" class="toggle-content" data-doc-id="${file.id}" aria-expanded="true">Hide content</button>
        </div>
      </div>
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
      return `
        <li>
          <button type="button" class="source-button" data-target="${file.category}">${safeTitle(file.title)}</button>
          — ${file.type.toUpperCase()}
        </li>
      `;
    })
    .join('');
}

function extractCharacterGuide() {
  const keywords = [/character/i, /creation/i, /attributes?/i, /race/i, /class/i, /background/i, /skills?/i, /ability/i, /equipment/i];
  const snippets = [];

  Object.values(loadedDocs).forEach((html) => {
    const text = html.replace(/<[^>]+>/g, ' ');
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

function updateActiveNav(sectionId) {
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === sectionId);
  });
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateActiveNav(sectionId);
  history.replaceState(null, '', `#${sectionId}`);
}

function applySearch(query) {
  const normalized = query.trim().toLowerCase();
  const docEntries = document.querySelectorAll('.doc-entry');
  let matchCount = 0;

  docEntries.forEach((entry) => {
    const text = entry.textContent.toLowerCase();
    const matches = normalized === '' || text.includes(normalized);
    entry.style.display = matches ? 'block' : 'none';
    if (matches) matchCount += 1;
  });

  searchStatus.textContent = normalized === ''
    ? 'Search across imported files.'
    : `Search results: ${matchCount} matching section${matchCount === 1 ? '' : 's'}`;
}

function handleButtonClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const targetSection = button.dataset.target;
  if (targetSection) {
    scrollToSection(targetSection);
    return;
  }

  const docId = button.dataset.docId;
  if (button.classList.contains('toggle-content') && docId) {
    const entry = document.querySelector(`.doc-entry[data-doc-id="${docId}"]`);
    if (!entry) return;
    const body = entry.querySelector('.doc-body');
    if (!body) return;

    const isVisible = body.style.display !== 'none';
    body.style.display = isVisible ? 'none' : 'block';
    button.textContent = isVisible ? 'Show content' : 'Hide content';
    button.setAttribute('aria-expanded', String(!isVisible));
  }
}

async function initializeWebsite() {
  if (currentSearch) {
    currentSearch.addEventListener('input', (event) => {
      applySearch(event.target.value);
    });
  }

  document.addEventListener('click', handleButtonClick);

  const loadPromises = files.map((file) => loadFile(file));
  await Promise.all(loadPromises);
  updateSectionContent();

  const hash = window.location.hash.slice(1);
  scrollToSection(hash || 'home');
}

window.addEventListener('DOMContentLoaded', initializeWebsite);
