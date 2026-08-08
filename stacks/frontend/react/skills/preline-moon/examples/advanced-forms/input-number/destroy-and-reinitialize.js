<script>
  window.addEventListener('load', () => {
    (function() {
      const inputNumber = document.querySelector('#hs-input-number');
      const destroy = document.querySelector('#hs-destroy-input-number');
      const autoInit = document.querySelector('#hs-auto-init-input-number');

      destroy.addEventListener('click', () => {
        const {element} = HSInputNumber.getInstance(inputNumber, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSInputNumber.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
