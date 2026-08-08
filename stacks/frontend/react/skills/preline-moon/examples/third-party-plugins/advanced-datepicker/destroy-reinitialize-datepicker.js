<script>
  window.addEventListener('load', () => requestAnimationFrame(() => {
    const destroyBtn = document.querySelector('#hs-destroy-datepicker');
    const reinitBtn = document.querySelector('#hs-reinit-datepicker');

    destroyBtn.addEventListener('click', () => {
      const { element } = HSDatepicker.getInstance('#hs-datepicker-temporary', true);

      element.destroy();

      destroyBtn.setAttribute('disabled', 'disabled');
      reinitBtn.removeAttribute('disabled');
    });

    reinitBtn.addEventListener('click', () => {
      HSDatepicker.autoInit();

      reinitBtn.setAttribute('disabled', 'disabled');
      destroyBtn.removeAttribute('disabled');
    });
  }));
</script>
