<script>
  (function () {
    window.addEventListener("load", () => {
      const overlay = HSOverlay.getInstance('#html-example-using-modal-popup-with-shortcut-call-trigger', true);
      const combobox = HSComboBox.getInstance('#html-example-using-modal-popup-with-shortcut-call-trigger [data-hs-combo-box]', true);

      window.addEventListener("keydown", function (evt) {
        if (evt.code === "Semicolon" && evt.shiftKey === true) {
          if (overlay.element && overlay.element.el.classList.contains('open')) return false;

          overlay.element.open();
          combobox.element.setCurrent();
        }
      });
    });
  })();
</script>
