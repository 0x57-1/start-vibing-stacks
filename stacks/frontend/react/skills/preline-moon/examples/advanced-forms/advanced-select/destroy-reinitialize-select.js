<script>
  window.addEventListener('load', () => requestAnimationFrame(() => {
    const destroyBtn = document.querySelector('#destroy');
    const reinitBtn = document.querySelector('#reinit');
    const selectEl = document.querySelector('#hs-select-temporary');
    const selectToggleIcon = document.querySelector('#hs-select-temporary-toggle-icon');
    const select = window.HSSelect.getInstance(selectEl);

    destroyBtn.addEventListener('click', () => {
      select.destroy();
      selectToggleIcon.style.display = 'none';

      reinitBtn.removeAttribute('disabled');
      destroyBtn.setAttribute('disabled', true);
    });

    reinitBtn.addEventListener('click', () => {
      new HSSelect(selectEl);
      selectToggleIcon.style.display = '';

      reinitBtn.setAttribute('disabled', true);
      destroyBtn.removeAttribute('disabled');
    });
  }));
</script>
