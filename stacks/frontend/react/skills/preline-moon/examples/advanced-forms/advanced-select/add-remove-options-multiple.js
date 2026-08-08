<script>
  window.addEventListener('load', () => requestAnimationFrame(() => {
    (function() {
      const addOptionBtn = document.querySelector('#multiple-add-option');
      const addOptionsBtn = document.querySelector('#multiple-add-options');
      const removeOptionBtn = document.querySelector('#multiple-remove-option');
      const removeOptionsBtn = document.querySelector('#multiple-remove-options');
      const select = window.HSSelect.getInstance('#hs-multiple-select-with-dynamic-options');

      addOptionBtn.addEventListener('click', () => {
        select.addOption({
          title: "Jannete Atkinson",
          val: "4",
          selected: true,
          options: {
            icon: `<img class="inline-block size-5 rounded-full" src="https://images.unsplash.com/photo-1531927557220-a9e23c1e4794?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Jannete Atkinson" />`
          }
        });
      });

      addOptionsBtn.addEventListener('click', () => {
        select.addOption([
          {
            title: "Kyle Peterson",
            val: "5",
            selected: true,
            options: {
              icon: `<img class="inline-block size-5 rounded-full" src="https://images.unsplash.com/photo-1514222709107-a180c68d72b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Kyle Peterson" />`
            }
          },
          {
            title: "Brad Cooper",
            val: "6",
            selected: true,
            options: {
              icon: `<img class="inline-block size-5 rounded-full" src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Brad Cooper" />`
            }
          },
          {
            title: "Linette Johnson",
            val: "7"
          }
        ]);
      });

      removeOptionBtn.addEventListener('click', () => {
        select.removeOption("4");
      });

      removeOptionsBtn.addEventListener('click', () => {
        select.removeOption(["5", "6", "7"]);
      });
    })()
  }));
</script>
