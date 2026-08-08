<script>
  window.addEventListener('load', () => {
    (function() {
      const combobox = document.querySelector('#hs-combobox-to-destroy');
      const destroy = document.querySelector('#hs-destroy-combobox');
      const autoInit = document.querySelector('#hs-auto-init-combobox');

      destroy.addEventListener('click', () => {
        const {element} = HSComboBox.getInstance(combobox, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSComboBox.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
