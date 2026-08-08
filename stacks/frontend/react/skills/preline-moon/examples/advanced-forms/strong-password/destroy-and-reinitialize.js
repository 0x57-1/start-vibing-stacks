<script>
  window.addEventListener('load', () => {
    (function() {
      const strongPassword = document.querySelector('#hs-strong-password-to-destroy');
      const destroy = document.querySelector('#hs-destroy-strong-password');
      const autoInit = document.querySelector('#hs-auto-init-strong-password');

      destroy.addEventListener('click', () => {
        const {element} = HSStrongPassword.getInstance(strongPassword, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSStrongPassword.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
