<script>
  window.addEventListener('load', () => {
    (function () {
      const copyContent = HSCopyMarkup.getInstance('#hs-copy-select-with-modal-content');
      if (copyContent) {
        copyContent.on('copy', (el) => {
          const select = el.querySelector('[data-hs-select]');

          new HSSelect(select);
        });
      }
    })();
  });
</script>
