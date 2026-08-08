<script>
  window.addEventListener('load', () => {
    (function() {
      const copyMarkup = document.querySelector('#hs-copy-markup-to-destroy');
      const destroy = document.querySelector('#hs-destroy-copy-markup');
      const autoInit = document.querySelector('#hs-auto-init-copy-markup');

      destroy.addEventListener('click', () => {
        const {element} = HSCopyMarkup.getInstance(copyMarkup, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSCopyMarkup.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
