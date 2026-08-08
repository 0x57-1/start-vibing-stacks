<script>
  window.addEventListener('load', () => {
    (function() {
      const accordions = document.querySelectorAll('.hs-accordion-to-destroy');
      const destroy = document.querySelector('#hs-destroy-accordion');
      const autoInit = document.querySelector('#hs-auto-init-accordion');

      destroy.addEventListener('click', () => {
        accordions.forEach((el) => {
          const {element} = HSAccordion.getInstance(el, true);

          element.destroy();
        });

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSAccordion.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
