import type { ProjectData } from './stamps';
import { createStampElement, createIntroElement } from './stamps';
import { openSidebar, isSidebarOpen } from './sidebar';

// Grid configuration — 4 columns, 2 rows per repeating tile
const TILE_COLS = 4;
const TILE_ROWS = 2;

function getStampDimensions() {
  // Use a temp element to resolve CSS calc() values
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--stamp-w);height:var(--stamp-h);';
  document.body.appendChild(probe);
  const w = probe.offsetWidth || 340;
  const h = probe.offsetHeight || 440;
  document.body.removeChild(probe);

  const style = getComputedStyle(document.documentElement);
  const gap = parseInt(style.getPropertyValue('--stamp-gap')) || 48;
  const gapXStr = style.getPropertyValue('--stamp-gap-x').trim();
  const gapX = gapXStr ? parseInt(gapXStr) : gap;
  return { w, h, gap, gapX };
}

interface Cell {
  col: number;
  row: number;
  el: HTMLElement;
}

export function initGrid(
  viewport: HTMLElement,
  projects: ProjectData[]
) {
  let { w: STAMP_W, h: STAMP_H, gap: GAP, gapX: GAP_X } = getStampDimensions();
  let CELL_W = STAMP_W + GAP_X;
  let CELL_H = STAMP_H + GAP;
  let TILE_W = TILE_COLS * CELL_W;
  let TILE_H = TILE_ROWS * CELL_H;

  // State
  let offsetX = 0;
  let offsetY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;
  let pointerDownTime = 0;
  let totalDragDist = 0;
  let animFrame = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastMoveTime = 0;

  // DOM pool
  const activeCells = new Map<string, Cell>();
  const pool: HTMLElement[] = [];

  // Start with top row fully visible
  const vw = viewport.offsetWidth;
  const isMobile = vw < 768;
  const vh = viewport.offsetHeight;
  offsetX = isMobile ? -(vw / 2 - STAMP_W / 2) : -(vw / 2 - TILE_W / 2);
  offsetY = isMobile ? -(vh / 2 - STAMP_H / 2) : -(GAP - 40);

  function cellKey(col: number, row: number) {
    return `${col},${row}`;
  }

  function mod(n: number, m: number) {
    return ((n % m) + m) % m;
  }

  // Remove intro from projects array — it lives at one fixed absolute position
  const introArrayIdx = projects.findIndex(p => p.id === '__intro__');
  const realProjects = projects.filter(p => p.id !== '__intro__');
  // Fixed absolute grid position for the intro card
  const INTRO_COL = isMobile ? 0 : 2;
  const INTRO_ROW = isMobile ? 0 : 1;

  function isIntroCell(col: number, row: number): boolean {
    return col === INTRO_COL && row === INTRO_ROW;
  }

  function getProjectIndex(col: number, row: number): number {
    const c = mod(col, TILE_COLS);
    const r = mod(row, TILE_ROWS);
    const slot = r * TILE_COLS + c;
    return slot % realProjects.length;
  }

  function recycleElement(cell: Cell) {
    cell.el.style.visibility = 'hidden';
    pool.push(cell.el);
  }

  // --- Home button ---
  const homeBtn = document.getElementById('home-btn');
  const homeOffsetX = offsetX;
  const homeOffsetY = offsetY;

  function isIntroVisible() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const introX = INTRO_COL * CELL_W - offsetX;
    const introY = INTRO_ROW * CELL_H - offsetY;
    // On mobile, show home button when card is partially off-screen
    if (isMobile) {
      const insetX = STAMP_W * 0.3;
      const insetY = STAMP_H * 0.3;
      return (
        introX + STAMP_W - insetX > 0 && introX + insetX < vw &&
        introY + STAMP_H - insetY > 0 && introY + insetY < vh
      );
    }
    return (
      introX + STAMP_W > 0 && introX < vw &&
      introY + STAMP_H > 0 && introY < vh
    );
  }

  function render() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const buffer = 1;

    const startCol = Math.floor(offsetX / CELL_W) - buffer;
    const endCol = Math.ceil((offsetX + vw) / CELL_W) + buffer;
    const startRow = Math.floor(offsetY / CELL_H) - buffer;
    const endRow = Math.ceil((offsetY + vh) / CELL_H) + buffer;

    const neededKeys = new Set<string>();

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const key = cellKey(col, row);
        neededKeys.add(key);

        if (!activeCells.has(key)) {
          const intro = isIntroCell(col, row);
          const projIdx = getProjectIndex(col, row);
          const project = realProjects[projIdx];

          let el: HTMLElement;
          const stamp = intro ? createIntroElement() : createStampElement(project);
          if (pool.length > 0) {
            el = pool.pop()!;
            el.replaceWith(stamp);
            viewport.appendChild(stamp);
            el = stamp;
          } else {
            el = stamp;
            viewport.appendChild(el);
          }

          el.style.position = 'absolute';
          el.style.visibility = 'visible';
          activeCells.set(key, { col, row, el });
        }

        const cell = activeCells.get(key)!;
        const x = col * CELL_W - offsetX;
        const y = row * CELL_H - offsetY;
        cell.el.style.transform = `translate(${x}px, ${y}px)`;
      }
    }

    // Recycle off-screen
    for (const [key, cell] of activeCells) {
      if (!neededKeys.has(key)) {
        recycleElement(cell);
        activeCells.delete(key);
      }
    }

    // Update home button visibility
    if (homeBtn) {
      if (isIntroVisible()) {
        homeBtn.classList.remove('visible');
      } else {
        homeBtn.classList.add('visible');
      }
    }
  }

  // --- Pointer Events ---
  viewport.addEventListener('pointerdown', (e) => {
    if (isSidebarOpen()) return;
    isDragging = true;
    viewport.classList.add('is-dragging');
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffsetX = offsetX;
    dragStartOffsetY = offsetY;
    pointerDownTime = Date.now();
    totalDragDist = 0;
    velocityX = 0;
    velocityY = 0;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastMoveTime = Date.now();
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    offsetX = dragStartOffsetX - dx;
    offsetY = dragStartOffsetY - dy;
    totalDragDist += Math.abs(e.clientX - lastPointerX) + Math.abs(e.clientY - lastPointerY);

    const now = Date.now();
    const dt = Math.max(now - lastMoveTime, 1);
    velocityX = (e.clientX - lastPointerX) / dt * 16;
    velocityY = (e.clientY - lastPointerY) / dt * 16;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastMoveTime = now;

    render();
  });

  viewport.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');
    viewport.releasePointerCapture(e.pointerId);

    const elapsed = Date.now() - pointerDownTime;
    const isClick = totalDragDist < 8 && elapsed < 300;

    if (isClick) {
      handleClick(e);
    } else {
      startMomentum();
    }

    // Hide drag hint after first interaction
    const hint = document.querySelector('.drag-hint');
    if (hint && totalDragDist > 20) hint.classList.add('hidden');
  });

  function handleClick(e: PointerEvent) {
    const clickX = e.clientX + offsetX;
    const clickY = e.clientY - viewport.getBoundingClientRect().top + offsetY;

    const col = Math.floor(clickX / CELL_W);
    const row = Math.floor(clickY / CELL_H);

    const localX = clickX - col * CELL_W;
    const localY = clickY - row * CELL_H;

    if (localX <= STAMP_W && localY <= STAMP_H) {
      if (isIntroCell(col, row)) return;
      const projIdx = getProjectIndex(col, row);
      viewport.classList.add('sidebar-open');
      openSidebar(realProjects[projIdx]);
    }
  }

  function startMomentum() {
    cancelAnimationFrame(animFrame);

    function step() {
      const decay = 0.94;
      velocityX *= decay;
      velocityY *= decay;

      if (Math.abs(velocityX) < 0.1 && Math.abs(velocityY) < 0.1) return;

      offsetX -= velocityX;
      offsetY -= velocityY;
      render();
      animFrame = requestAnimationFrame(step);
    }

    animFrame = requestAnimationFrame(step);
  }

  // --- Scroll wheel ---
  viewport.addEventListener('wheel', (e) => {
    if (isSidebarOpen()) return;
    e.preventDefault();
    offsetX += e.deltaX;
    offsetY += e.deltaY;
    render();

    const hint = document.querySelector('.drag-hint');
    if (hint) hint.classList.add('hidden');
  }, { passive: false });

  // --- Resize ---
  let resizeTimer: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      ({ w: STAMP_W, h: STAMP_H, gap: GAP, gapX: GAP_X } = getStampDimensions());
      CELL_W = STAMP_W + GAP_X;
      CELL_H = STAMP_H + GAP;
      TILE_W = TILE_COLS * CELL_W;
      TILE_H = TILE_ROWS * CELL_H;

      for (const [, cell] of activeCells) {
        cell.el.remove();
      }
      activeCells.clear();
      pool.length = 0;
      render();
    }, 150);
  });

  // --- Keyboard navigation ---
  document.addEventListener('keydown', (e) => {
    if (isSidebarOpen()) return;
    switch (e.key) {
      case 'ArrowLeft':  offsetX -= CELL_W; render(); break;
      case 'ArrowRight': offsetX += CELL_W; render(); break;
      case 'ArrowUp':    offsetY -= CELL_H; render(); break;
      case 'ArrowDown':  offsetY += CELL_H; render(); break;
    }
  });

  // --- Home button click: animate back to intro ---
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      cancelAnimationFrame(animFrame);
      velocityX = 0;
      velocityY = 0;

      const startX = offsetX;
      const startY = offsetY;
      const duration = 500;
      const startTime = performance.now();

      function easeOut(t: number) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animateHome(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const e = easeOut(t);

        offsetX = startX + (homeOffsetX - startX) * e;
        offsetY = startY + (homeOffsetY - startY) * e;
        render();

        if (t < 1) {
          animFrame = requestAnimationFrame(animateHome);
        }
      }

      animFrame = requestAnimationFrame(animateHome);
    });
  }

  // Initial render
  render();
}
