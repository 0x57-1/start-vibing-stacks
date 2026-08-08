<script src="../../assets/vendor/lodash/lodash.min.js"></script>
<script src="../../assets/vendor/sortablejs/Sortable.min.js"></script>
<script>
  window.addEventListener('load', () => {
    (function () {
      const draggable = document.querySelectorAll('[data-hs-nested-draggable]');

      draggable.forEach((el) => {
        const options = {
          group: 'nested',
          animation: 150,
          fallbackOnBody: true,
          swapThreshold: 0.65,
          ghostClass: 'dragged',
          onEnd: (evt) => {
            const { item } = evt;

            if (item.classList.contains('hs-accordion')) {
              let existingInstance = HSAccordion.getInstance(item, true);
              let updatedInstance;

              existingInstance.element.update();
              updatedInstance = HSAccordion.getInstance(item, true);
              window.$hsAccordionCollection.map((el) => {
                if (
                  el.element.el !== existingInstance.element.el &&
                  el.element.group === existingInstance.element.group &&
                  el.element.el.closest('.hs-accordion-group') &&
                  el.element.el.classList.contains('active') &&
                  existingInstance.element.el.classList.contains('active')
                ) el.element.hide();

                return el;
              });
            }

            if (!!item.hasAttribute('data-hs-tree-view-item')) {
              const treeViewItem = HSTreeView.getInstance(item.closest('[data-hs-tree-view]'), true);

              treeViewItem.element.update();
            }
          },
        };
        const data = el.getAttribute('data-hs-nested-draggable');
        const dataOptions = data ? JSON.parse(data) : {};
        const sortable = new Sortable(el, _.merge(options, dataOptions));
      });
    })();
  });
</script>
