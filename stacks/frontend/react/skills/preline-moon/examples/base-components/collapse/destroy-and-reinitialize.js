<script>
  window.addEventListener('load', () => {
    (function() {
      const collapse = document.querySelector('#hs-collapse');
      const destroy = document.querySelector('#hs-destroy-collapse');
      const autoInit = document.querySelector('#hs-auto-init-collapse');

      destroy.addEventListener('click', () => {
        const {element} = HSCollapse.getInstance(collapse, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSCollapse.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
