<script>
  window.addEventListener('load', () => {
    (function () {
      const runConfetti = document.querySelector('#hs-run-on-click-run-confetti');
      runConfetti.addEventListener('click', () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
      });
    })();
  });
</script>
