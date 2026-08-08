<script>
  window.addEventListener('load', () => {
    (function () {
      const personEl = document.querySelector('#hs-select-column-name');

      const minEl = document.querySelector('#hs-input-number-column-age-min');
      const maxEl = document.querySelector('#hs-input-number-column-age-max');

      const addressEl = document.querySelector('#hs-input-text-column-address');

      const { dataTable } = new HSDataTable('#hs-datatable-with-column-filter');

      dataTable.search.fixed('range', function (searchStr, data, index) {
        const person = personEl.value === 'all' ? '' : personEl.value;
        const name = data[1] || '';

        const min = parseInt(minEl.value, 10);
        const max = parseInt(maxEl.value, 10);
        const age = parseFloat(data[2]) || 0;

        const address = addressEl.value.toLowerCase();
        const city = data[3].toLowerCase() || '';

        if (
          (
            person === name ||
            person === ''
          ) &&
          (
            city.includes(address) ||
            address === ''
          ) &&
          (
            (isNaN(min) && isNaN(max)) ||
            (isNaN(min) && age <= max) ||
            (min <= age && isNaN(max)) ||
            (min <= age && age <= max)
          )
        ) return true;

        return false;
      });

      personEl.addEventListener('change', () => dataTable.draw());

      minEl.addEventListener('input', () => dataTable.draw());
      maxEl.addEventListener('input', () => dataTable.draw());

      addressEl.addEventListener('input', () => dataTable.draw());
    })();
  });
</script>
