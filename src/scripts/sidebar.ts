import type { ProjectData } from './stamps';

let isOpen = false;
let sidebarEl: HTMLElement;
let overlayEl: HTMLElement;
let onCloseCallback: (() => void) | null = null;

export function initSidebar(onClose?: () => void) {
  sidebarEl = document.querySelector('.sidebar')!;
  overlayEl = document.querySelector('.overlay')!;
  onCloseCallback = onClose ?? null;

  const closeBtn = sidebarEl.querySelector('.sidebar__close-btn')!;
  closeBtn.addEventListener('click', closeSidebar);
  overlayEl.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeSidebar();
  });
}

export function openSidebar(project: ProjectData) {
  const colorBar = sidebarEl.querySelector('.sidebar__color-bar') as HTMLElement;
  colorBar.className = `sidebar__color-bar sidebar__color-bar--${project.color}`;

  // Eyebrow: full org name
  const eyebrow = sidebarEl.querySelector('.sidebar__eyebrow')!;
  eyebrow.textContent = project.org;

  // Title
  const title = sidebarEl.querySelector('.sidebar__title')!;
  title.textContent = project.title;

  // Dates
  const dates = sidebarEl.querySelector('.sidebar__dates')!;
  dates.textContent = project.dates;

  // Hero image
  const heroEl = sidebarEl.querySelector('.sidebar__hero')! as HTMLElement;
  if (project.image) {
    heroEl.innerHTML = `<img src="${project.image}" alt="" />`;
    heroEl.style.display = 'flex';
  } else {
    heroEl.innerHTML = '';
    heroEl.style.display = 'none';
  }

  // Description as quote
  const desc = sidebarEl.querySelector('.sidebar__description')!;
  desc.textContent = project.description;

  // Stats
  const statsEl = sidebarEl.querySelector('.sidebar__stats')!;
  const stats = project.stats ?? [];
  if (stats.length > 0) {
    statsEl.innerHTML = stats.map((s) =>
      `<div class="sidebar__stat"><span class="sidebar__stat-label">${s.label}</span><span class="sidebar__stat-value">${s.value}</span></div>`
    ).join('');
    statsEl.style.display = 'flex';
  } else {
    statsEl.innerHTML = '';
    statsEl.style.display = 'none';
  }

  // Section title + Bullets
  const sectionTitle = sidebarEl.querySelector('.sidebar__section-title')!;
  sectionTitle.textContent = 'My Role';

  const bulletsList = sidebarEl.querySelector('.sidebar__bullets')!;
  bulletsList.innerHTML = project.bullets
    .map((b) => `<li>${b}</li>`)
    .join('');

  // Body (full markdown content)
  const body = sidebarEl.querySelector('.sidebar__body')!;
  body.innerHTML = project.body;

  // Footer tags + date
  const tags = project.tags ?? [project.category];
  const footerTags = sidebarEl.querySelector('.sidebar__footer-tags')!;
  footerTags.innerHTML = tags.map((t) => `<span class="stamp__tag">${t}</span>`).join('');

  const footerDates = sidebarEl.querySelector('.sidebar__footer-dates')!;
  footerDates.textContent = project.dates;

  sidebarEl.classList.add('open');
  overlayEl.classList.add('open');
  isOpen = true;
  sidebarEl.scrollTop = 0;
}

export function closeSidebar() {
  sidebarEl.classList.remove('open');
  overlayEl.classList.remove('open');
  isOpen = false;
  onCloseCallback?.();
}

export function isSidebarOpen() {
  return isOpen;
}
