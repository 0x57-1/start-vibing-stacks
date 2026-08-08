<script>
  window.addEventListener('load', () => {
    (function() {
      const textareaAutoHeight = document.querySelector('#hs-textarea-autoheight-to-destroy');
      const destroy = document.querySelector('#hs-destroy-textarea-autoheight');
      const autoInit = document.querySelector('#hs-auto-init-textarea-autoheight');

      destroy.addEventListener('click', () => {
        const {element} = HSTextareaAutoHeight.getInstance(textareaAutoHeight, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSTextareaAutoHeight.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
