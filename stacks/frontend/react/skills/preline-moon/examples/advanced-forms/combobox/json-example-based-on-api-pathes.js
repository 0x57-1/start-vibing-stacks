<script>
  window.addEventListener('load', () => {
    (function() {
      const { element } = HSComboBox.getInstance('#hs-combobox-json-example-based-on-api-pathes', true);
      const getData = document.querySelector('#hs-log-combobox-json-example-based-on-api-pathes-current-data');

      getData.addEventListener('click', () => console.log(element.getCurrentData()));
    })();
  });
</script>
