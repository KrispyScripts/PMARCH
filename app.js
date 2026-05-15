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
const viewer = document.getElementById('viewerContent');
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

function buildFileMenu() {
  files.forEach((file) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'file-link';
    button.textContent = file.title;
    button.addEventListener('click', () => showFile(file));
    fileList.appendChild(button);
  });
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

async function showFile(file) {
  currentTitle.textContent = file.title;
  viewer.innerHTML = '<div class="loading-screen">LOADING DOCUMENT...</div>';
  setStatus(`READING ${file.title.toUpperCase()}`);
  setType(`TYPE: ${file.type.toUpperCase()}`);

  try {
    let contentHtml = ''; 
    if (file.type === 'docx') {
      contentHtml = await loadDocx(file);
      viewer.innerHTML = `<div class="document-body">${contentHtml}</div>`;
    } else if (file.type === 'xlsx') {
      contentHtml = await loadXlsx(file);
      viewer.innerHTML = `<div class="document-body">${contentHtml}</div>`;
    } else {
      viewer.innerHTML = '<p class="error-message">Unsupported file type.</p>';
    }
    setStatus('READY. USE THE MENU TO OPEN OTHER MATERIALS.');
  } catch (error) {
    viewer.innerHTML = `<pre class="error-message">${safeText(error.message)}</pre>`;
    setStatus('FAILED TO LOAD FILE.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  buildFileMenu();
  if (files.length > 0) showFile(files[0]);
});
