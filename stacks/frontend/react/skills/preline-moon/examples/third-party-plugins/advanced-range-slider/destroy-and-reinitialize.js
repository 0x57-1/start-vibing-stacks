<script>
  window.addEventListener('load', () => {
    (function () {
      const slider = document.querySelector('#hs-destroy-and-reinitialize');
      const destroy = document.querySelector('#hs-destroy-slider');
      const autoInit = document.querySelector('#hs-auto-init-slider');

      destroy.addEventListener('click', () => {
        const {element} = HSRangeSlider.getInstance(slider, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSRangeSlider.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
