<script>
  window.addEventListener('load', () => {
    (function() {
      const stepper = document.querySelector('#hs-stepper-to-destroy');
      const destroy = document.querySelector('#hs-destroy-stepper');
      const autoInit = document.querySelector('#hs-auto-init-stepper');

      destroy.addEventListener('click', () => {
        const {element} = HSStepper.getInstance(stepper, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSStepper.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
