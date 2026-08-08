<script>
  window.addEventListener('load', () => {
    (function() {
      const layoutSplitter = document.querySelector('#hs-layout-splitter-to-destroy');
      const destroy = document.querySelector('#hs-destroy-layout-splitter');
      const autoInit = document.querySelector('#hs-auto-init-layout-splitter');

      destroy.addEventListener('click', () => {
        const {element} = HSLayoutSplitter.getInstance(layoutSplitter, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSLayoutSplitter.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
