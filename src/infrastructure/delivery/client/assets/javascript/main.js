const MobileSidebar = (() => {
  let config = {
    sidebarSelector: '#sidebar',
    toggleSelector: '#toggleSidebar',
    overlaySelector: '.sidebar-drag-overlay',
    swipeThreshold: 50, // Минимальное расстояние свайпа в пикселях
    maxSwipeWidth: 100, // Максимальная анимация свайпа
    animationDuration: 300,
    touchAreaWidth: 30 // Ширина области активации свайпа от края
  };

  let state = {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    sidebarVisible: false,
    animationFrame: null
  };

  const elements = {
    sidebar: null,
    toggle: null,
    overlay: null
  };

  // Основные методы
  const init = () => {
    setupElements();
    setupEventListeners();
  };

  const setupElements = () => {
    elements.sidebar = document.querySelector(config.sidebarSelector);
    elements.toggle = document.querySelector(config.toggleSelector);
    elements.overlay = document.querySelector(config.overlaySelector);
  };

  const setupEventListeners = () => {
    // Десктопные события
    elements.toggle?.addEventListener('click', toggleSidebar);
    elements.overlay?.addEventListener('click', closeSidebar);

    // Мобильные touch-события
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    // Обработка закрытия по ESC
    elements.sidebar?.addEventListener('keydown', handleKeyDown);
  };

  const handleTouchStart = (e) => {
    if (!isMobile()) return;
    
    const touch = e.touches[0];
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.currentX = touch.clientX;
    
    // Активируем свайп только от левого края
    if (touch.clientX > config.touchAreaWidth && !state.sidebarVisible) return;

    state.isDragging = true;
    cancelAnimationFrame(state.animationFrame);
  };

  const handleTouchMove = (e) => {
    if (!state.isDragging || !isMobile()) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    // Игнорируем вертикальные скроллы
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      state.isDragging = false;
      return;
    }

    e.preventDefault();
    state.currentX = touch.clientX;
    state.animationFrame = requestAnimationFrame(updateSidebarPosition);
  };

  const handleTouchEnd = () => {
    if (!state.isDragging || !isMobile()) return;
    
    const delta = state.currentX - state.startX;
    const velocity = delta / (Date.now() - state.touchStartTime);
    
    // Определяем направление и силу жеста
    const shouldOpen = (delta > config.swipeThreshold) || velocity > 0.5;
    const shouldClose = (delta < -config.swipeThreshold) || velocity < -0.5;

    if (shouldOpen) openSidebar();
    else if (shouldClose) closeSidebar();
    else resetPosition();

    state.isDragging = false;
  };

  const updateSidebarPosition = () => {
    if (!state.isDragging) return;

    const delta = state.currentX - state.startX;
    let progress = 0;

    if (state.sidebarVisible) {
      progress = Math.min(1 - (delta / config.maxSwipeWidth), 1);
      elements.sidebar.style.transform = `translateX(${-100 * progress}%)`;
    } else {
      progress = Math.min(delta / config.maxSwipeWidth, 1);
      elements.sidebar.style.transform = `translateX(${-100 + (progress * 100)}%)`;
    }

    elements.overlay.style.opacity = progress * 0.4;
  };

  // Основные действия
  const toggleSidebar = () => {
    state.sidebarVisible ? closeSidebar() : openSidebar();
  };

  const openSidebar = () => {
    elements.sidebar.classList.add('show');
    elements.overlay.style.display = 'block';
    state.sidebarVisible = true;
    updateA11y();
    animateOverlay(0.4);
  };

  const closeSidebar = () => {
    elements.sidebar.classList.remove('show');
    state.sidebarVisible = false;
    updateA11y();
    animateOverlay(0);
  };

  const resetPosition = () => {
    elements.sidebar.style.transform = '';
    elements.overlay.style.opacity = '';
  };

  // Вспомогательные функции
  const animateOverlay = (targetOpacity) => {
    elements.overlay.style.transition = `opacity ${config.animationDuration}ms ease`;
    elements.overlay.style.opacity = targetOpacity;
    
    setTimeout(() => {
      elements.overlay.style.transition = '';
      if (targetOpacity === 0) elements.overlay.style.display = 'none';
    }, config.animationDuration);
  };

  const updateA11y = () => {
    elements.toggle.setAttribute('aria-expanded', state.sidebarVisible);
    elements.sidebar.setAttribute('aria-hidden', !state.sidebarVisible);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && state.sidebarVisible) closeSidebar();
  };

  const isMobile = () => window.innerWidth < 768;

  // Публичные методы
  return {
    init,
    destroy: () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      elements.toggle?.removeEventListener('click', toggleSidebar);
      elements.overlay?.removeEventListener('click', closeSidebar);
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => MobileSidebar.init());