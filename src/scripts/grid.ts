import type { ProjectData } from './stamps';
import { createStampElement } from './stamps';
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
  offsetX = isMobile ? -GAP_X / 2 : -(vw / 2 - TILE_W / 2);
  offsetY = -(GAP - 40);

  function cellKey(col: number, row: number) {
    return `${col},${row}`;
  }

  function mod(n: number, m: number) {
    return ((n % m) + m) % m;
  }

  function getProjectIndex(col: number, row: number): number {
    const c = mod(col, TILE_COLS);
    const r = mod(row, TILE_ROWS);
    return r * TILE_COLS + c;
  }

  function recycleElement(cell: Cell) {
    cell.el.style.visibility = 'hidden';
    pool.push(cell.el);
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
          const projIdx = getProjectIndex(col, row);
          const project = projects[projIdx];

          let el: HTMLElement;
          if (pool.length > 0) {
            el = pool.pop()!;
            const stamp = createStampElement(project);
            el.replaceWith(stamp);
            viewport.appendChild(stamp);
            el = stamp;
          } else {
            el = createStampElement(project);
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
      const projIdx = getProjectIndex(col, row);
      viewport.classList.add('sidebar-open');
      openSidebar(projects[projIdx]);
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

  // Initial render
  render();
}
