<script>
  window.addEventListener('load', () => {
    (function() {
      const scrollspy = document.querySelector('[data-hs-scrollspy="#hs-scrollspy-to-destroy"]');
      const destroy = document.querySelector('#hs-destroy-scrollspy');
      const autoInit = document.querySelector('#hs-auto-init-scrollspy');

      destroy.addEventListener('click', () => {
        const {element} = HSScrollspy.getInstance(scrollspy, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSScrollspy.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });

      setTimeout(() => {
        const scrollspyInstance = HSScrollspy.getInstance('[data-hs-scrollspy="#hs-scrollspy-to-destroy"]', true);
        const collapseInstance = HSCollapse.getInstance('[data-hs-collapse="#hs-scrollspy-to-destroy-collapse-heading"]', true);

        scrollspyInstance.element.on('beforeScroll', (instance) => {
          return new Promise((res) => {
            if (collapseInstance.element.el.classList.contains('open')) {
              collapseInstance.element.hide();
              HSStaticMethods.afterTransition(collapseInstance.element.content, () => res(true));
            } else {
              res(true);
            }
          });
        });
      });
    })();
  });
</script>
