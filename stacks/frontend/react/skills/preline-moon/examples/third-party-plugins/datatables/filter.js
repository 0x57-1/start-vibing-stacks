<script>
  window.addEventListener('load', () => {
    (function () {
      const minEl = document.querySelector('#hs-input-number-min-age');
      const maxEl = document.querySelector('#hs-input-number-max-age');
      const { dataTable } = new HSDataTable('#hs-datatable-filter');

      dataTable.search.fixed('range', function (searchStr, data, index) {
        const min = parseInt(minEl.value, 10);
        const max = parseInt(maxEl.value, 10);
        const age = parseFloat(data[2]) || 0;

        if (
          (isNaN(min) && isNaN(max)) ||
          (isNaN(min) && age <= max) ||
          (min <= age && isNaN(max)) ||
          (min <= age && age <= max)
        ) return true;

        return false;
      });

      minEl.addEventListener('input', () => dataTable.draw());
      maxEl.addEventListener('input', () => dataTable.draw());
    })();
  });
</script>
