/** Chat mount — mindig a body utolsó gyereke, a #root-on kívül. */
export function getChatMountNode(): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  let el = document.getElementById('piac-chat-mount');
  if (!el) {
    el = document.createElement('div');
    el.id = 'piac-chat-mount';
    el.setAttribute('data-piac-chat-mount', 'true');
    document.body.appendChild(el);
  } else if (el.parentElement !== document.body) {
    document.body.appendChild(el);
  } else {
    document.body.appendChild(el);
  }

  return el;
}

/** Mobil dock + dev sáv figyelembevétele. */
export function computeChatBottomPx(options: {
  path: string;
  devModeActive: boolean;
  isMobile: boolean;
}): number {
  const { path, devModeActive, isMobile } = options;
  const hideChrome = path === '/login' || path === '/register';
  const isHome = path === '/';
  const hasMobileDock = isMobile && !isHome && !hideChrome;

  let base = 20;
  if (hasMobileDock) base = 90;
  if (devModeActive) base += 72;
  return base;
}

export function pinChatToViewport(node: HTMLElement, bottomPx: number) {
  node.style.setProperty('position', 'fixed', 'important');
  node.style.setProperty('top', 'auto', 'important');
  node.style.setProperty('left', 'auto', 'important');
  node.style.setProperty('right', 'max(1rem, env(safe-area-inset-right, 0px))', 'important');
  node.style.setProperty(
    'bottom',
    `calc(${bottomPx}px + env(safe-area-inset-bottom, 0px))`,
    'important',
  );
  node.style.setProperty('transform', 'none', 'important');
  node.style.setProperty('z-index', '2147483647', 'important');
  node.style.setProperty('pointer-events', 'auto', 'important');
  node.style.setProperty('margin', '0', 'important');
}
