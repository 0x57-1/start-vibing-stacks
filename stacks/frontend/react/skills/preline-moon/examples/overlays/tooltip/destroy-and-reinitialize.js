<script>
  window.addEventListener('load', () => {
    (function() {
      const tooltips = document.querySelectorAll('#hs-tooltip .hs-tooltip');
      const destroy = document.querySelector('#hs-destroy-tooltip');
      const autoInit = document.querySelector('#hs-auto-init-tooltip');

      destroy.addEventListener('click', () => {
        tooltips.forEach((el) => {
          const {element} = HSTooltip.getInstance(el, true);

          element.destroy();
        });

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSTooltip.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
