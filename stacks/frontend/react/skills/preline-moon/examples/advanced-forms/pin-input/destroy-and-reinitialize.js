<script>
  window.addEventListener('load', () => {
    (function() {
      const pinInput = document.querySelector('#hs-pin-input-to-destroy');
      const destroy = document.querySelector('#hs-destroy-pin-input');
      const autoInit = document.querySelector('#hs-auto-init-pin-input');

      destroy.addEventListener('click', () => {
        const {element} = HSPinInput.getInstance(pinInput, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSPinInput.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
