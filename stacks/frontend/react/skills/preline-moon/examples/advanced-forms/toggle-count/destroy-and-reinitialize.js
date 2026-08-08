<script>
  window.addEventListener('load', () => {
    (function() {
      const toggleCounts = document.querySelectorAll('#hs-toggle-count [data-hs-toggle-count]');
      const destroy = document.querySelector('#hs-destroy-toggle-count');
      const autoInit = document.querySelector('#hs-auto-init-toggle-count');

      destroy.addEventListener('click', () => {
        toggleCounts.forEach((el) => {
          const {element} = HSToggleCount.getInstance(el, true);

          element.destroy();
        });

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSToggleCount.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
