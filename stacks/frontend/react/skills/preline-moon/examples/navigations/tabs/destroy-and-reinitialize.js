<script>
  window.addEventListener('load', () => {
    (function() {
      const tabs = document.querySelector('#hs-tabs');
      const destroy = document.querySelector('#hs-destroy-tabs');
      const autoInit = document.querySelector('#hs-auto-init-tabs');

      destroy.addEventListener('click', () => {
        const {element} = HSTabs.getInstance(tabs, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSTabs.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
