document.addEventListener("DOMContentLoaded", () => {
  const skeletons = document.querySelectorAll('.hs-skeleton:not(.--not-code-block)');

  skeletons.forEach((el) => {
    const parent = el.closest('.hs-skeleton-parent');
    const root = el?.closest('.hs-panel-root') || null;
    const loading = root?.querySelector('.hs-clipboard-panel') || null;
    const themeSelector = loading?.querySelector('[data-hs-select]') || null;
    const iframe = parent?.querySelector('iframe[src]');
    let isIframeLoaded = false;
    let isSelectLoaded = !themeSelector;

    if (!iframe) {
      el.remove();
      return;
    }

    const remove = () => el.remove();
    const removeLoading = () => {
      if (!root || !loading || !isIframeLoaded || !isSelectLoaded) return false;

      loading.classList.remove('disabled');
    };
    const fallback = setTimeout(remove, 10000);
    const onLoad = () => {
      isIframeLoaded = true;

      clearTimeout(fallback);
      remove();
      removeLoading();
    };

    if (themeSelector) {
      themeSelector.addEventListener('load.hs.select', () => {
        isSelectLoaded = true;
        removeLoading();
      }, { once: true });
    }

    try {
      if (iframe.contentDocument?.readyState === 'complete') {
        isIframeLoaded = true;

        clearTimeout(fallback);
        remove();
        removeLoading();

        return;
      }
    } catch { }

    iframe.addEventListener('load', onLoad, { once: true });
  });
});
