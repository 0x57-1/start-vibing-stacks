(function () {
  const nav = document.querySelector("[data-hs-blocks-bottom-nav]");
  const sidebarNav = document.querySelector("#docs-sidebar-nav");

  if (!nav || !sidebarNav) return;

  let attrProps = null;
  try {
    const attrValue = nav.getAttribute("data-hs-blocks-bottom-nav");
    if (attrValue) attrProps = JSON.parse(attrValue);
  } catch {}

  const attrPrevHref = attrProps?.prev?.href || "";
  const attrPrevLabel = attrProps?.prev?.label || "";
  const attrNextHref = attrProps?.next?.href || "";
  const attrNextLabel = attrProps?.next?.label || "";

  const normalizePathname = (pathname) =>
    pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
  const currentNorm = normalizePathname(window.location.pathname);

  const findActiveByUrl = (links) =>
    links.find((link) => {
      try {
        return (
          normalizePathname(
            new URL(link.getAttribute("href"), window.location.href).pathname
          ) === currentNorm
        );
      } catch {
        return false;
      }
    }) ?? null;

  const findActiveInList = (links) => {
    let active = findActiveByUrl(links);

    if (!active) {
      const activeKey = window?.HS_DOCS_SIDEBAR_ACTIVE_LINK;

      if (activeKey) {
        active =
          links.find((link) => {
            const href = link.getAttribute("href") || "";

            return href.includes(`/${activeKey}/`) || href.includes(activeKey);
          }) || null;
      }
    }

    return active;
  };

  const cleanLabel = (label) =>
    label
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const getLabel = (link) => {
    const titleEl = link.querySelector("[data-hs-sidebar-menu-title]");

    if (titleEl) return cleanLabel(titleEl.textContent);

    const clone = link.cloneNode(true);

    clone.querySelectorAll("span").forEach((el) => el.remove());

    return cleanLabel(clone.textContent);
  };

  const allSidebarLinks = Array.from(sidebarNav.querySelectorAll("a[href]"));

  const innerSidebarNav = document.querySelector("#docs-inner-sidebar-nav");
  const innerLinks = innerSidebarNav
    ? Array.from(innerSidebarNav.querySelectorAll("a[href]"))
    : [];

  let prevLink = null;
  let nextLink = null;

  if (innerLinks.length) {
    const activeInnerLink = findActiveInList(innerLinks);
    const activeInnerIndex = innerLinks.indexOf(activeInnerLink);

    if (activeInnerIndex !== -1) {
      prevLink = innerLinks[activeInnerIndex - 1] || null;
      nextLink = innerLinks[activeInnerIndex + 1] || null;

      if (!prevLink || !nextLink) {
        const activeSidebarLink = findActiveInList(allSidebarLinks);
        const activeSidebarIndex = allSidebarLinks.indexOf(activeSidebarLink);

        if (activeSidebarIndex !== -1) {
          if (!prevLink) prevLink = activeSidebarLink;
          if (!nextLink) nextLink = allSidebarLinks[activeSidebarIndex + 1] || null;
        }
      }
    }
  } else {
    if (!allSidebarLinks.length) {
      nav.remove();

      return;
    }

    const activeLink = findActiveInList(allSidebarLinks);
    const activeIndex = allSidebarLinks.indexOf(activeLink);

    if (activeIndex === -1) {
      nav.remove();

      return;
    }

    prevLink = allSidebarLinks[activeIndex - 1] || null;
    nextLink = allSidebarLinks[activeIndex + 1] || null;
  }

  const hasPrev = attrPrevHref || prevLink;
  const hasNext = attrNextHref || nextLink;

  if (!hasPrev && !hasNext) {
    nav.remove();

    return;
  }

  const prevAnchor = nav.querySelector("[data-hs-blocks-bottom-nav-prev]");
  const nextAnchor = nav.querySelector("[data-hs-blocks-bottom-nav-next]");
  const prevLabel = nav.querySelector("[data-hs-blocks-bottom-nav-prev-label]");
  const nextLabel = nav.querySelector("[data-hs-blocks-bottom-nav-next-label]");
  const prevPlaceholder = nav.querySelector("[data-hs-blocks-bottom-nav-prev-placeholder]");
  const nextPlaceholder = nav.querySelector("[data-hs-blocks-bottom-nav-next-placeholder]");

  if (hasPrev && prevAnchor && prevLabel) {
    prevAnchor.href = attrPrevHref || prevLink?.getAttribute("href") || "#";
    prevLabel.textContent = cleanLabel(attrPrevLabel || (prevLink ? getLabel(prevLink) : ""));
    prevAnchor.classList.remove("hidden");
    prevAnchor.classList.add("inline-flex");
    prevPlaceholder?.classList.add("hidden");
  } else {
    prevAnchor?.remove();
  }

  if (hasNext && nextAnchor && nextLabel) {
    nextAnchor.href = attrNextHref || nextLink?.getAttribute("href") || "#";
    nextLabel.textContent = cleanLabel(attrNextLabel || (nextLink ? getLabel(nextLink) : ""));
    nextAnchor.classList.remove("hidden");
    nextAnchor.classList.add("inline-flex");
    nextPlaceholder?.classList.add("hidden");
  } else {
    nextAnchor?.remove();
  }
})();
