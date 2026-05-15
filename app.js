const files = [
  {
    id: 'rulebook',
    title: 'Project Moon TTRPG - Community Rulebook 3.x',
    path: 'Newest Material/Project Moon TTRPG - Community Rulebook 3.x.docx',
    type: 'docx',
  },
  {
    id: 'effects',
    title: 'Effect List CR 3.2',
    path: 'Newest Material/Effect List CR 3.2.docx',
    type: 'docx',
  },
  {
    id: 'items',
    title: 'Item List CR 3.x',
    path: 'Newest Material/Item List CR 3.x.docx',
    type: 'docx',
  },
  {
    id: 'functional',
    title: 'Functional Part Repository',
    path: 'Newest Material/Functional Part Repository.docx',
    type: 'docx',
  },
  {
    id: 'claw',
    title: 'CLAW (overCLAW) Spreadsheet',
    path: 'Newest Material/CLAW (overCLAW - Optimized, variated, enhanced and rebalanced Community-Led Additional Works).xlsx',
    type: 'xlsx',
  },
  {
    id: 'sheet',
    title: 'V1.5.0 PMTRPG Sheet',
    path: 'Newest Material/V1.5.0 PMTRPG Sheet - Ruleset_Effect List Stacker & Effect Searchers & Equipment Slot Amount & OverCLAW  & I PURGED ONE OF THE TWO DEMONS & gobalamogus.xlsx',
    type: 'xlsx',
  },
  {
    id: 'changelog',
    title: '3.x Update Changelog',
    path: 'Newest Material/3.x Update Changelog.docx',
    type: 'docx',
  },
];

const currentTitle = document.getElementById('viewerTitle');
const fileList = document.getElementById('fileList');
const sectionsContainer = document.getElementById('contentSections');
const statusLine = document.getElementById('statusLine');
const typeLine = document.getElementById('typeLine');

function formatPath(path) {
  return encodeURI(path).replace(/%2F/g, '/');
}

function setStatus(text) {
  statusLine.textContent = text;
}

function setType(text) {
  typeLine.textContent = text;
}

function safeText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadDocx(file) {
  const response = await fetch(formatPath(file.path));
  if (!response.ok) throw new Error(`Unable to load ${file.title}`);
  const arrayBuffer = await response.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '<p>[No readable text was extracted]</p>';
}

function buildXlsxHtml(workbook) {
  const sheets = workbook.SheetNames;
  if (sheets.length === 0) return '<p>[No sheets found]</p>';

  return sheets
    .map((name) => {
      const sheet = workbook.Sheets[name];
      const html = XLSX.utils.sheet_to_html(sheet, { header: '', editable: false });
      return `<section class="sheet-block"><h3>${safeText(name)}</h3>${html}</section>`;
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

function buildFileMenu() {
  files.forEach((file) => {
    const entry = document.createElement('a');
    entry.href = `#${file.id}`;
    entry.className = 'file-link';
    entry.textContent = file.title;
    entry.addEventListener('click', (event) => {
      event.preventDefault();
      navigateToFile(file);
    });
    fileList.appendChild(entry);
  });
}

function buildContentSections() {
  sectionsContainer.innerHTML = '';

  files.forEach((file) => {
    const section = document.createElement('section');
    section.id = file.id;
    section.className = 'document-section';
    section.innerHTML = `
      <div class="section-header">
        <div>
          <span class="section-label">${file.type.toUpperCase()}</span>
          <h3>${file.title}</h3>
        </div>
        <div class="section-status">NOT LOADED</div>
      </div>
      <div class="section-body">
        <div class="section-placeholder">Click the menu or anchor to load this document.</div>
      </div>
    `;
    sectionsContainer.appendChild(section);
  });
}

function getSectionElement(file) {
  return document.getElementById(file.id);
}

function updateSectionStatus(file, text) {
  const section = getSectionElement(file);
  if (!section) return;
  const status = section.querySelector('.section-status');
  if (status) status.textContent = text;
}

function updateViewerHeader(file) {
  currentTitle.textContent = file.title;
  setType(`TYPE: ${file.type.toUpperCase()}`);
}

async function loadSectionContent(file) {
  const section = getSectionElement(file);
  if (!section) return;
  const body = section.querySelector('.section-body');
  if (!body) return;

  if (section.dataset.loaded === 'true') return;

  updateSectionStatus(file, 'LOADING...');
  setStatus(`Loading ${file.title}`);
  updateViewerHeader(file);

  try {
    let contentHtml;
    if (file.type === 'docx') {
      contentHtml = await loadDocx(file);
    } else if (file.type === 'xlsx') {
      contentHtml = await loadXlsx(file);
    } else {
      contentHtml = '<p class="error-message">Unsupported file type.</p>';
    }

    body.innerHTML = `<div class="document-body">${contentHtml}</div>`;
    section.dataset.loaded = 'true';
    updateSectionStatus(file, 'LOADED');
    setStatus('Document loaded. Use the menu to jump to other sections.');
  } catch (error) {
    body.innerHTML = `<pre class="error-message">${safeText(error.message)}</pre>`;
    updateSectionStatus(file, 'FAILED');
    setStatus('Error loading document.');
  }
}

function navigateToFile(file) {
  loadSectionContent(file).then(() => {
    const section = getSectionElement(file);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.location.hash = file.id;
    }
  });
}

function resolveHash() {
  const hash = window.location.hash.slice(1);
  const file = files.find((entry) => entry.id === hash);
  if (file) {
    navigateToFile(file);
  } else if (files.length) {
    navigateToFile(files[0]);
  }
}

window.addEventListener('hashchange', resolveHash);
window.addEventListener('DOMContentLoaded', () => {
  buildFileMenu();
  buildContentSections();
  resolveHash();
});
