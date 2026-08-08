<script>
  window.addEventListener('load', () => {
    (function () {
      const { dataTable } = new HSDataTable('#hs-datatable-with-hidden-columns');
      const select = HSSelect.getInstance('#hs-datatable-with-hidden-columns-select', true);

      select.element.on('change', (indices) => {
        dataTable.columns().every(function (index) {
          const column = this;

          if (indices.includes(index.toString())) column.visible(false);
          else column.visible(true);
        });
      });
    })();
  });
</script>
