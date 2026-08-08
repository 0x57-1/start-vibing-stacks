<script>
  window.addEventListener('load', () => {
    (function() {
      const overlay = document.querySelector('#hs-offcanvas-to-destroy');
      const destroy = document.querySelector('#hs-destroy-overlay');
      const autoInit = document.querySelector('#hs-auto-init-overlay');

      destroy.addEventListener('click', () => {
        const {element} = HSOverlay.getInstance(overlay, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSOverlay.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
