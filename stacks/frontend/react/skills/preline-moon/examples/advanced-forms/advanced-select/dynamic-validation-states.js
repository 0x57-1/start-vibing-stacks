<script>
  window.addEventListener('load', () => {
    const successBtn = document.querySelector('#trigger-success');
    const errorBtn = document.querySelector('#trigger-error');
    const clearBtn = document.querySelector('#trigger-clear');
    const validationTarget = document.querySelector('#validation-target');

    successBtn.addEventListener('click', () => {
      validationTarget.classList.remove('error');
      validationTarget.classList.add('success');
    });

    errorBtn.addEventListener('click', () => {
      validationTarget.classList.remove('success');
      validationTarget.classList.add('error');
    });

    clearBtn.addEventListener('click', () => {
      validationTarget.classList.remove('success', 'error');
    });
  });
</script>
