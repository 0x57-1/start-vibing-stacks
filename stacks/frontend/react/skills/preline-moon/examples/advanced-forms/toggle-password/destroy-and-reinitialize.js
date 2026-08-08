<script>
  window.addEventListener('load', () => {
    (function() {
      const togglesPassword = document.querySelectorAll('#hs-toggle-password-to-destroy [data-hs-toggle-password]');
      const destroy = document.querySelector('#hs-destroy-toggle-password');
      const autoInit = document.querySelector('#hs-auto-init-toggle-password');

      destroy.addEventListener('click', () => {
        togglesPassword.forEach((el) => {
          const {element} = HSTogglePassword.getInstance(el, true);

          element.destroy();
        });

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSTogglePassword.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
