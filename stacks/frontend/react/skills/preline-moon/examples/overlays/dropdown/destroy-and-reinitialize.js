<script>
  window.addEventListener('load', () => {
    (function() {
      const dropdown = document.querySelector('#hs-dropdown-to-destroy');
      const destroy = document.querySelector('#hs-destroy-dropdown');
      const autoInit = document.querySelector('#hs-auto-init-dropdown');

      destroy.addEventListener('click', () => {
        const {element} = HSDropdown.getInstance(dropdown, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSDropdown.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
