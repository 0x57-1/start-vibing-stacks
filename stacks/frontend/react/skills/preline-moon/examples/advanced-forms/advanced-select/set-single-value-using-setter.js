<script>
  window.addEventListener('load', () => requestAnimationFrame(() => {
    const setTo2 = document.querySelector('#set-to-2');
    const setTo3 = document.querySelector('#set-to-3');
    const resetValue = document.querySelector('#reset-single-value');
    const selectEl = document.querySelector('#hs-select-with-single-setter');
    const select = window.HSSelect.getInstance(selectEl);

    setTo2.addEventListener('click', () => {
      select.setValue('2');

      console.log(select.value);
    });

    setTo3.addEventListener('click', () => {
      select.setValue('3');

      console.log(select.value);
    });

    resetValue.addEventListener('click', () => {
      select.setValue('');

      console.log(select.value);
    });
  }));
</script>
