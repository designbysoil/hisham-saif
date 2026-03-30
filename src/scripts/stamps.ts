export interface StatData {
  value: string;
  label: string;
}

export interface ProjectData {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  color: string;
  org: string;
  role: string;
  dates: string;
  order: number;
  description: string;
  bullets: string[];
  body: string;
  tags?: string[];
  stats?: StatData[];
  image?: string;
  imageSrcset?: string;
  illoSize?: number;
}

export function createStampElement(project: ProjectData): HTMLElement {
  const el = document.createElement('div');
  el.className = `stamp stamp--${project.color}`;
  el.dataset.projectId = project.id;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `${project.title} — ${project.org}`);

  const tags = project.tags ?? [project.category];
  const tagsHtml = tags.map((t) => `<span class="stamp__tag">${t}</span>`).join('');

  const illoStyle = project.illoSize ? ` style="width:${project.illoSize}px;height:${project.illoSize}px"` : '';
  const srcsetAttr = project.imageSrcset ? ` srcset="${project.imageSrcset}" sizes="(max-width: 600px) 100vw, 400px"` : '';
  const imageHtml = project.image
    ? `<img class="stamp__illo" src="${project.image}" alt=""${srcsetAttr} loading="lazy"${illoStyle} />`
    : '';

  el.innerHTML = `
    <div class="stamp__top">
      <div class="stamp__org">${project.org}</div>
      <div class="stamp__title">${project.title}</div>
    </div>
    ${imageHtml}
    <div class="stamp__bottom">
      <div class="stamp__tags">${tagsHtml}</div>
      <div class="stamp__dates">${project.dates}</div>
    </div>
  `;

  return el;
}

export function createIntroElement(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'stamp stamp--intro';
  el.innerHTML = `
    <div class="stamp__intro-content">
      <div class="stamp__title"><span style="color:#444">Hi, I'm Hisham Saif</span><br><span style="color:#aaa">A media producer &amp; project manager, open to new opportunities. Drag to explore my work.</span></div>
      <div class="stamp__intro-links">
        <a class="stamp__intro-link" href="mailto:hisham.saif.doha@gmail.com">Contact</a>
        <a class="stamp__intro-link" href="https://www.linkedin.com/in/hisham-saif-379b40153/" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
  `;
  return el;
}
