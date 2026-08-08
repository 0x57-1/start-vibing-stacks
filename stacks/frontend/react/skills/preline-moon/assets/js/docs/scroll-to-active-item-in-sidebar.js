const sidebarId = window.HS_SCROLL_TO_THE_ELEMENT_SIDEBAR_ID ?? "#docs-sidebar";
const sidebarNavId = window.HS_SCROLL_TO_THE_ELEMENT_SIDEBAR_NAV_ID ?? "#docs-sidebar-nav";
const delay = window.HS_SCROLL_TO_THE_ELEMENT_DELAY ?? null;

const secondarySidebarId = window.HS_SCROLL_TO_THE_ELEMENT_SECONDARY_SIDEBAR_ID ?? "#docs-on-this-page-sidebar";
const secondarySidebarNavElement = window.HS_SCROLL_TO_THE_ELEMENT_SECONDARY_SIDEBAR_NAV_ELEMENT ?? "[data-hs-docs-scrollspy-wrapper]";

function scrollToTheElement(element, container, compensation = 0, offsetTop = 0) {
  const elemTop = element?.offsetTop ?? 0;
  const style = window.getComputedStyle(container);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);
  const skeletonParent = container.closest(".hs-skeleton-parent");
  const skeleton = skeletonParent?.querySelector(".hs-skeleton") ?? null;

  if (container.offsetHeight > elemTop + paddingTop + paddingBottom + offsetTop) {
    skeleton?.remove();

    return false;
  }

  container.scrollTo({ top: elemTop - compensation, behavior: "instant" });

  if (skeleton) {
    const onScrollEnd = () => {
      skeleton.remove();

      container.removeEventListener("scrollend", onScrollEnd);

      clearTimeout(fallback);
    };
    const fallback = setTimeout(() => {
      skeleton.remove();

      container.removeEventListener("scrollend", onScrollEnd);
    }, 300);

    container.addEventListener("scrollend", onScrollEnd);
  }
}

function initScrollToTheElement({
  sidebarSelector,
  navSelector,
  activeLinkGlobal,
  navInsideSidebar = true,
  mobileOverlay = false,
}) {
  const sidebar = document.querySelector(sidebarSelector);
  if (!sidebar) return false;

  const nav = navInsideSidebar ? sidebar.querySelector(navSelector) : document.querySelector(navSelector);
  if (!nav) return false;

  const normalizePathname = (pathname) => pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
  const currentNorm = normalizePathname(window.location.pathname);

  let activeLink =
    Array.from(nav.querySelectorAll("a[href]")).find((link) => {
      try {
        return (normalizePathname(new URL(link.getAttribute("href"), window.location.href).pathname) === currentNorm);
      } catch {
        return false;
      }
    }) ?? null;

  if (!activeLink) {
    const url = window[activeLinkGlobal] ?? null;
    if (url) activeLink = nav.querySelector(`a[href*="${url}"]`) ?? null;
  }

  if (!activeLink) return false;

  scrollToTheElement(activeLink, nav, 20, 50);

  if (mobileOverlay) {
    sidebar.addEventListener("open.hs.overlay", () => {
      if (sidebar.hasAttribute("data-opened-once")) return false;

      sidebar.setAttribute("data-opened-once", "");

      scrollToTheElement(activeLink, nav, 20, 50);
    });
  }

  return true;
}

function unitedInitScrollToTheElement() {
  initScrollToTheElement({
    sidebarSelector: secondarySidebarId,
    navSelector: secondarySidebarNavElement,
    activeLinkGlobal: "HS_DOCS_SECONDARY_SIDEBAR_ACTIVE_LINK",
  });

  initScrollToTheElement({
    sidebarSelector: sidebarId,
    navSelector: sidebarNavId,
    activeLinkGlobal: "HS_DOCS_SIDEBAR_ACTIVE_LINK",
    navInsideSidebar: false,
    mobileOverlay: true,
  });
}

if (
  history.scrollRestoration &&
  window.HS_SCROLL_TO_THE_ELEMENT_SCROLL_RESTORATION === "manual"
) {
  history.scrollRestoration = "manual";
}

if (delay) setTimeout(unitedInitScrollToTheElement, delay);
else if (document.readyState !== "loading") unitedInitScrollToTheElement();
else document.addEventListener("DOMContentLoaded", unitedInitScrollToTheElement);
