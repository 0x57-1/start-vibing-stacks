<script>
  window.addEventListener('load', () => {
    (function() {
      const treeView = document.querySelector('#hs-tree-view-to-destroy');
      const accordions = document.querySelectorAll('#hs-tree-view-to-destroy .hs-accordion');
      const destroy = document.querySelector('#hs-destroy-tree-view');
      const autoInit = document.querySelector('#hs-auto-init-tree-view');

      destroy.addEventListener('click', () => {
        const treeViewInstance = HSTreeView.getInstance(treeView, true);

        treeViewInstance.element.destroy();
        accordions.forEach((el) => {
          const accordionInstance = HSAccordion.getInstance(el, true);

          accordionInstance.element.destroy();
        });

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSTreeView.autoInit();
        HSAccordion.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
