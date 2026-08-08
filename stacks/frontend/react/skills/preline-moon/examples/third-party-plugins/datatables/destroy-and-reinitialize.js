<script>
  window.addEventListener('load', () => {
    (function() {
      const datatable = document.querySelector('#hs-datatable-to-destroy');
      const destroy = document.querySelector('#hs-destroy-datatable');
      const autoInit = document.querySelector('#hs-auto-init-datatable');

      destroy.addEventListener('click', () => {
        const {element} = HSDataTable.getInstance(datatable, true);

        element.destroy();

        destroy.setAttribute('disabled', 'disabled');
        autoInit.removeAttribute('disabled');
      });

      autoInit.addEventListener('click', () => {
        HSDataTable.autoInit();

        autoInit.setAttribute('disabled', 'disabled');
        destroy.removeAttribute('disabled');
      });
    })();
  });
</script>
