const el = HSScrollspy.getInstance('[data-hs-scrollspy="#scrollspy-example"]', true);
const collapse = HSCollapse.getInstance('[data-hs-collapse="#navbar-collapse-basic"]', true);

el.element.on('beforeScroll', (instance) => {
  return new Promise((res) => {
    if (collapse.element.el.classList.contains('open')) {
      collapse.element.hide();
      HSStaticMethods.afterTransition(collapse.element.content, () => res(true));
    } else {
      res(true);
    }
  });
});
