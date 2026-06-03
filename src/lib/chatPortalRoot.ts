/** Chat mount — mindig a body utolsó gyereke, a #root-on kívül (filter/transform nélkül). */
export function ensureChatMount(): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  let el = document.getElementById('piac-chat-mount');
  if (!el) {
    el = document.createElement('div');
    el.id = 'piac-chat-mount';
    el.setAttribute('data-piac-chat-mount', 'true');
    document.body.appendChild(el);
  } else if (el.parentElement !== document.body || el !== document.body.lastElementChild) {
    document.body.appendChild(el);
  }

  return el;
}

/** @deprecated use ensureChatMount */
export function getChatMountNode(): HTMLElement | null {
  return ensureChatMount();
}

/** Mobil dock + dev sáv figyelembevétele (px). */
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

/** CSS változó szinkron — a mount fixed pozíciója ebből számolódik. */
export function syncChatViewportOffset(bottomPx: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--piac-chat-bottom', `${bottomPx}px`);
  ensureChatMount();
}

/** @deprecated scroll-listener helyett CSS var + body filter fix */
export function pinChatToViewport(_node: HTMLElement, bottomPx: number) {
  syncChatViewportOffset(bottomPx);
}
