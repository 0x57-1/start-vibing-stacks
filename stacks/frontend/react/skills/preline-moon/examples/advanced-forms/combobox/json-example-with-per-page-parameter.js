<script>
  window.addEventListener('load', () => {
    (function() {
      const { element } = HSComboBox.getInstance('#hs-combobox-json-example-with-per-page-parameter', true);
      const getData = document.querySelector('#hs-log-combobox-json-example-with-per-page-parameter-current-data');

      getData.addEventListener('click', () => console.log(element.getCurrentData()));
    })();
  });
</script>
