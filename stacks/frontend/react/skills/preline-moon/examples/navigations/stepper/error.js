        <script>
          (function () {
            window.addEventListener('load', () => {
              const errorStepper = HSStepper.getInstance('#error-stepper');
              let errorSuccessState = 1;

              errorStepper.on('beforeNext', (ind) => {
                if (ind === 2) {
                  errorStepper.setProcessedNavItem(ind);

                  setTimeout(() => {
                    errorStepper.unsetProcessedNavItem(ind);
                    errorStepper.enableButtons();

                    if (errorSuccessState) {
                      errorStepper.goToNext();
                    } else {
                      errorStepper.setErrorNavItem(ind);
                    }

                    errorSuccessState = !errorSuccessState;
                  }, 2000);
                }
              });
            });
          })();
        </script>
      </textarea>
      <script>
        encodeHtml('error-tab-js-code', document.querySelector('#error-tab-js-markup').value);
      </script>
    </div>
  </div>
</div>
<!-- End Component -->

<!-- Component -->
<div>

  <h2 id="success" class="scroll-mt-24">
    <a class="group relative text-lg font-semibold text-stone-800 dark:text-neutral-200 focus:outline-hidden" href="#success">
      <span class="absolute top-1 -inset-s-4 inline-block shrink-0 opacity-0 transition-all group-hover:opacity-100 group-hover:-inset-s-5 group-focus:opacity-100 group-focus:-inset-s-5 before:absolute before:top-0 before:inset-s-0 before:w-8 before:h-full">
        <svg class="shrink-0 size-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" x2="20" y1="9" y2="9" />
          <line x1="4" x2="20" y1="15" y2="15" />
          <line x1="10" x2="8" y1="3" y2="21" />
          <line x1="16" x2="14" y1="3" y2="21" />
        </svg>
      </span>
      Success state

    </a>
  </h2>

  <p class="mt-1 text-[15px] leading-relaxed text-stone-800 dark:text-neutral-200">Show a success state when a completed step should feel confirmed.</p>

  <div class="mt-5">
    <div id="success-clipboard" class="flex flex-col sm:flex-row justify-start">
      <div class="w-full flex flex-col sm:flex-row justify-start sm:justify-between sm:items-center gap-1.5 md:gap-2">
        <!-- Nav Tabs -->
        <div class="order-2 sm:order-1">
          <div class="inline-flex bg-stone-100 rounded-md p-1 dark:bg-neutral-800">
            <nav class="flex gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
              <button type="button" class="hs-tab-active:bg-white hs-tab-active:text-stone-800 hs-tab-active:shadow-sm hs-tab-active:hover:border-transparent hs-tab-active:focus:border-transparent text-[13px] text-stone-800 border border-transparent hover:border-stone-400 focus:outline-hidden focus:border-stone-400 font-medium rounded-sm px-2 py-1.5 dark:text-neutral-200 dark:hover:text-white dark:hover:border-neutral-500 dark:focus:text-white dark:focus:border-neutral-500 dark:hs-tab-active:bg-neutral-700 dark:hs-tab-active:text-neutral-200 dark:hs-tab-active:hover:border-transparent dark:hs-tab-active:focus:border-transparent active" id="success-tab-preview-item" aria-selected="true" data-hs-tab="#success-tab-preview" aria-controls="success-tab-preview" role="tab">
                Preview
              </button>
              <button type="button" class="hs-tab-active:bg-white hs-tab-active:text-stone-800 hs-tab-active:shadow-sm hs-tab-active:hover:border-transparent hs-tab-active:focus:border-transparent text-[13px] text-stone-800 border border-transparent hover:border-stone-400 focus:outline-hidden focus:border-stone-400 font-medium rounded-sm px-2 py-1.5 dark:text-neutral-200 dark:hover:text-white dark:hover:border-neutral-500 dark:focus:text-white dark:focus:border-neutral-500 dark:hs-tab-active:bg-neutral-700 dark:hs-tab-active:text-neutral-200 dark:hs-tab-active:hover:border-transparent dark:hs-tab-active:focus:border-transparent" id="success-tab-html-item" aria-selected="false" data-hs-tab="#success-tab-html" aria-controls="success-tab-html" role="tab">
                HTML
              </button>
            </nav>
          </div>
        </div>
        <!-- Nav Tabs -->

        <div class="hs-clipboard-panel relative disabled hs-disabled:pointer-events-none hs-disabled:opacity-50 order-1 sm:order-2 flex flex-wrap sm:flex-nowrap gap-1.5">
          <div class="flex items-center gap-1.5 border border-stone-200 p-0.5 rounded-md dark:border-neutral-700">
            <!-- Select -->
            <select id="success-theme-select" data-hs-select='{
    	        "placeholder": "Select theme...",
    	        "toggleTag": "<button type=\"button\" aria-expanded=\"false\"><span class=\"flex shrink-0 justify-center items-center me-2\" data-icon></span></button>",
    	        "toggleClasses": "hs-select-disabled:pointer-events-none hs-select-disabled:opacity-50 relative py-[7px] ps-2 pe-6 flex text-nowrap w-full cursor-pointer text-[13px] text-stone-800 hover:bg-stone-100 focus:outline-hidden focus:bg-stone-100 font-medium rounded-sm dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700",
    	        "dropdownClasses": "mt-2 z-50 w-52 max-h-72 p-1 space-y-0.5 bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden overflow-y-auto dark:bg-neutral-900 dark:border-neutral-700 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500",
    	        "optionClasses": "hs-selected:bg-stone-100 dark:bg-neutral-800 py-2 px-3 w-full text-sm text-stone-800 cursor-pointer hover:bg-stone-100 rounded-lg focus:outline-hidden focus:bg-stone-100 hs-select-disabled:pointer-events-none hs-select-disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800",
    	        "optionTemplate": "<div class=\"relative w-full pe-5 flex items-center\"><div class=\"flex shrink-0 justify-center items-center me-2\" data-icon></div><span data-title></span><span class=\"absolute top-1/2 -inset-e-1 -translate-y-1/2 hidden hs-selected:block\"><svg class=\"shrink-0 size-3.5\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"/></svg></span></div>",
    	        "optgroupClasses": "py-2 px-3 w-full text-nowrap text-[13px] text-stone-500 dark:text-neutral-500",
    	        "scrollToSelected": true,
    	        "extraMarkup": "<div class=\"absolute top-1/2 inset-e-1.5 -translate-y-1/2\"><svg class=\"shrink-0 size-3.5 text-stone-800 dark:text-neutral-200\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m7 15 5 5 5-5\"/><path d=\"m7 9 5-5 5 5\"/></svg></div>"
    	      }' data-hs-component-color-theme="#success-tab-preview" class="hidden">
              <optgroup label="Theme">
                <option selected value="default" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-blue-500\"></span>", "description": "Blue", "additionalClasses": [["[data-color-theme]", ["bg-blue-500"]]]}'>Default</option>

                <option value="harvest" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-amber-700\"></span>", "description": "Amber", "additionalClasses": [["[data-color-theme]", ["bg-amber-700"]]]}'>Harvest</option>

                <option value="retro" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-fuchsia-500\"></span>", "description": "Fuchsia", "additionalClasses": [["[data-color-theme]", ["bg-fuchsia-500"]]]}'>Retro</option>

                <option value="ocean" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-cyan-500\"></span>", "description": "cyan", "additionalClasses": [["[data-color-theme]", ["bg-cyan-500"]]]}'>Ocean</option>

                <option value="autumn" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-amber-500\"></span>", "description": "Amber", "additionalClasses": [["[data-color-theme]", ["bg-amber-500"]]]}'>Autumn</option>

                <option value="moon" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-black\"></span>", "description": "Blue", "additionalClasses": [["[data-color-theme]", ["bg-black"]]]}'>Moon</option>

                <option value="bubblegum" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-pink-500\"></span>", "description": "Pink", "additionalClasses": [["[data-color-theme]", ["bg-pink-500"]]]}'>Bubblegum</option>

                <option value="cashmere" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-preline-mauve-500\"></span>", "description": "Mauve", "additionalClasses": [["[data-color-theme]", ["bg-preline-mauve-500"]]]}'>Cashmere</option>

                <option value="olive" data-hs-select-option='{"icon": "<span class=\"size-4 rounded-sm bg-preline-avocado-500\"></span>", "description": "Avocado", "additionalClasses": [["[data-color-theme]", ["bg-preline-avocado-500"]]]}'>Olive</option>

              </optgroup>
            </select>
            <script>
    	        (function () {
    	          const selectId = 'success-theme-select';
    	          const savedTheme = localStorage.getItem('hs-clipboard-theme') || 'default';
    	          const select = document.getElementById(selectId);

    	          if (select) {
    	            select.value = savedTheme;
    	            const option = select.querySelector(`option[value="${savedTheme}"]`);
    	            if (option) option.selected = true;
    	          }
    	        })();
    	      </script>
            <!-- End Select -->
          </div>

          <div class="p-0.5 flex justify-center items-center gap-x-1 border border-stone-200 rounded-md dark:border-neutral-700">
            <!-- Clipboard -->
            <button type="button" class="js-clipboard py-[7px] px-2.5 flex justify-center items-center gap-2 rounded-sm font-medium text-stone-800 hover:bg-stone-100 focus:outline-hidden focus:bg-stone-100 text-[13px] dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:text-neutral-400" data-hs-clipboard-options='{
    	          "contentTarget": "#success-tab-html-code",
    	          "successText": "Copied",
    	          "toggleLight": "#success-toggle-light",
    	          "toggleJsx": "#success-jsx",
    	          "toggleUtility": "#success-utility",
    	          "themeSelect": "#success-theme-select"
    	        }'>
              <span class="hidden sm:block">
                <svg class="js-clipboard-default shrink-0 size-3 md:size-3.5 group-hover:rotate-6 transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
                <svg class="js-clipboard-success shrink-0 hidden size-3 md:size-3.5 rotate-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span class="js-clipboard-success-text">Copy</span>
            </button>
            <!-- End Clipboard -->

            <!-- Clipboard Dropdown -->
            <div class="relative before:absolute before:top-1/2 before:-inset-s-0.5 before:-translate-y-1/2 before:z-1 before:w-px before:h-4 before:bg-stone-200 before:dark:bg-neutral-700 dark:before:bg-neutral-700">
              <div class="hs-dropdown relative sm:[--placement:top-right] sm:[--strategy:absolute] [--auto-close:inside] inline-flex">
                <button type="button" class="hs-dropdown-toggle size-8.5 inline-flex justify-center items-center gap-2 rounded-sm font-medium text-stone-800 hover:bg-stone-100 focus:outline-hidden focus:bg-stone-100 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:text-neutral-400" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <svg class="js-clipboard-default shrink-0 size-3.5 group-hover:rotate-6 transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 7h-9" />
                    <path d="M14 17H5" />
                    <circle cx="17" cy="17" r="3" />
                    <circle cx="7" cy="7" r="3" />
                  </svg>
                </button>

                <!-- Dropdown -->
                <div class="hs-dropdown-menu hs-dropdown-open:opacity-100 w-60 transition-[opacity,margin] duration opacity-0 hidden z-20 bg-white border border-stone-200 rounded-xl shadow-xl dark:bg-neutral-800 dark:border-neutral-700" role="menu" aria-orientation="vertical">
                  <div class="py-1 px-4">
                    <!-- Switch/Toggle -->
                    <div class="flex justify-between items-center gap-x-2 py-3 first:border-t-0 border-t border-stone-200 dark:border-neutral-700">
                      <label for="success-utility" class="flex-1 text-sm text-stone-600 dark:text-neutral-400">Copy to clipboard with <span class="text-red-500">Tailwind Utility</span> classes</label>
                      <label for="success-utility" class="relative inline-block w-9 h-5 cursor-pointer">
                        <input type="checkbox" id="success-utility" class="peer sr-only" data-hs-theming-utility>
                        <span class="absolute inset-0 bg-stone-200 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-blue-600 dark:bg-neutral-700 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
                        <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></span>
                      </label>
                    </div>
                    <!-- End Switch/Toggle -->
                    <script>
    	                (function () {
    	                  const id = 'success-utility';
    	                  const value = localStorage.getItem('hs-clipboard-is-utility') || 'false';
    	                  const el = document.getElementById(id);

    	                  if (el) {
    	                    el.checked = value === 'true' ? true : false;
    	                  }
    	                })();
    	              </script>

                    <!-- Switch/Toggle -->
                    <div class="flex justify-between items-center gap-x-2 py-3 first:border-t-0 border-t border-stone-200 dark:border-neutral-700">
                      <label for="success-toggle-light" class="flex-1 text-sm text-stone-600 dark:text-neutral-400">Copy to clipboard with <span class="text-red-500">dark:</span> classes</label>
                      <label for="success-toggle-light" class="relative inline-block w-9 h-5 cursor-pointer">
                        <input type="checkbox" id="success-toggle-light" class="peer sr-only" data-hs-theming-utility-dark-classes disabled>
                        <span class="absolute inset-0 bg-stone-200 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-blue-600 dark:bg-neutral-700 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
                        <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></span>
                      </label>
                    </div>
                    <!-- End Switch/Toggle -->
                    <script>
    	                (function () {
    	                  const id = 'success-toggle-light';
    	                  const value = localStorage.getItem("hs-clipboard-has-dark") || "false";
    	                  const utilityValue = localStorage.getItem('hs-clipboard-is-utility') || 'false';
    	                  const el = document.getElementById(id);

    	                  if (el) {
    	                    el.disabled = utilityValue === "true" ? false : true;
    	                    el.checked = value === 'true' ? true : false;
    	                  }
    	                })();
    	              </script>

                    <!-- Switch/Toggle -->
                    <div class="flex justify-between items-center gap-x-2 py-3 first:border-t-0 border-t border-stone-200 dark:border-neutral-700">
                      <label for="success-jsx" class="flex-1 text-sm text-stone-600 dark:text-neutral-400">Copy to clipboard with React <span class="text-red-500">JSX</span> code</label>
                      <label for="success-jsx" class="relative inline-block w-9 h-5 cursor-pointer">
                        <input type="checkbox" id="success-jsx" class="peer sr-only" data-hs-theming-jsx>
                        <span class="absolute inset-0 bg-stone-200 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-blue-600 dark:bg-neutral-700 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
                        <span class="absolute top-1/2 inset-s-0.5 -translate-y-1/2 size-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></span>
                      </label>
                    </div>
                    <!-- End Switch/Toggle -->
                    <script>
    	                (function () {
    	                  const id = 'success-jsx';
    	                  const value = localStorage.getItem('hs-clipboard-is-jsx') || 'false';
    	                  const el = document.getElementById(id);

    	                  if (el) {
    	                    el.checked = value === 'true' ? true : false;
    	                  }
    	                })();
    	              </script>
                  </div>
                </div>
                <!-- End Dropdown -->
              </div>
            </div>
            <!-- End Clipboard Dropdown -->
          </div>

          <!-- Dark Mode Toggle -->
          <!-- <div class="p-0.5 flex justify-center items-center border border-stone-200 rounded-md dark:border-neutral-700" data-hs-component-dark-mode='{
    	      "target": "#success-tab-preview",
    	      "isMultiple": true
    	    }'>
    	      <label class="size-8.5 inline-flex justify-center items-center gap-2 rounded-sm font-medium text-stone-800 hover:bg-stone-100 focus-within:outline-hidden focus-within:bg-stone-100 text-sm dark:hover:bg-neutral-700 dark:focus-within:bg-neutral-700 dark:text-neutral-400 cursor-pointer" data-hs-component-dark-mode-option aria-pressed="false">
    	        <input type="radio" name="success-tab-preview-item-theme-mode" class="sr-only" data-hs-component-dark-mode-value="default">
    	        <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 3v1"></path><path d="M12 20v1"></path><path d="M3 12h1"></path><path d="M20 12h1"></path><path d="m18.364 5.636-.707.707"></path><path d="m6.343 17.657-.707.707"></path><path d="m5.636 5.636.707.707"></path><path d="m17.657 17.657.707.707"></path></svg>
    	      </label>
    	      <label class="size-8.5 inline-flex justify-center items-center gap-2 rounded-sm font-medium text-stone-800 hover:bg-stone-100 focus-within:outline-hidden focus-within:bg-stone-100 text-sm dark:hover:bg-neutral-700 dark:focus-within:bg-neutral-700 dark:text-neutral-400 cursor-pointer" data-hs-component-dark-mode-option aria-pressed="false">
    	        <input type="radio" name="success-tab-preview-item-theme-mode" class="sr-only" data-hs-component-dark-mode-value="dark">
    	        <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
    	      </label>
    	      <label class="size-8.5 inline-flex justify-center items-center gap-2 rounded-sm font-medium text-stone-800 hover:bg-stone-100 focus-within:outline-hidden focus-within:bg-stone-100 text-sm dark:hover:bg-neutral-700 dark:focus-within:bg-neutral-700 dark:text-neutral-400 cursor-pointer" data-hs-component-dark-mode-option aria-pressed="false">
    	        <input type="radio" name="success-tab-preview-item-theme-mode" class="sr-only" data-hs-component-dark-mode-value="auto">
    	        <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>
    	      </label>
    	    </div> -->
          <!-- End Dark Mode Toggle -->

          <span class="hidden in-[.disabled]:block absolute top-1/2 inset-s-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin size-4 border-3 border-current border-t-transparent rounded-[999px] text-primary" role="status" aria-label="loading">
            <span class="sr-only">Loading...</span>
          </span>
        </div>

      </div>
    </div>

    <div class="mt-2 p-2 bg-stone-100 rounded-xl dark:bg-neutral-800">
      <!-- Tab Content -->
      <div id="success-tab-preview" role="tabpanel" aria-labelledby="success-tab-preview-item">
        <textarea id="success-tab-preview-iframe-markup" class="hidden">
          <!DOCTYPE html>
          <html lang="en" dir="ltr" class="relative min-h-full h-full">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
              <title>Preline UI</title>
              <link rel="shortcut icon" href="../../favicon.ico">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
              <link rel="stylesheet" href="../../assets/css/main.min.css">
            </head>
            <body class="w-full max-w-2xl mx-auto mt-4 space-y-4"><!-- Stepper -->
          <div data-hs-stepper='{
            "isCompleted": true
          }' class="completed">
            <!-- Stepper Nav -->
            <ul class="relative flex flex-row gap-x-2">
              <!-- Item -->
              <li class="flex items-center gap-x-2 shrink basis-0 flex-1 group success" data-hs-stepper-nav-item='{
                "index": 1,
                "isCompleted": true
              }'>
                <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none">
                  <span class="size-7 flex justify-center items-center shrink-0 bg-surface font-medium text-surface-foreground rounded-full group-focus:bg-surface-focus hs-stepper-active:bg-primary-active hs-stepper-active:text-primary-foreground hs-stepper-success:bg-primary-active hs-stepper-success:text-primary-foreground hs-stepper-completed:bg-teal-500 hs-stepper-completed:group-focus:bg-teal-600">
                    <span class="hs-stepper-success:hidden hs-stepper-completed:hidden">1</span>
                    <svg class="hidden shrink-0 size-3 hs-stepper-success:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="ms-2 text-sm font-medium text-foreground group-focus:text-muted-foreground-1">
                    Step
                  </span>
                </span>
                <div class="w-full h-px flex-1 bg-surface-1 group-last:hidden hs-stepper-success:bg-primary-active hs-stepper-completed:bg-teal-600"></div>
              </li>
              <!-- End Item -->

              <!-- Item -->
              <li class="flex items-center gap-x-2 shrink basis-0 flex-1 group success" data-hs-stepper-nav-item='{
                "index": 2,
                "isCompleted": true
              }'>
                <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none">
                  <span class="size-7 flex justify-center items-center shrink-0 bg-surface font-medium text-surface-foreground rounded-full group-focus:bg-surface-focus hs-stepper-active:bg-primary-active hs-stepper-active:text-primary-foreground hs-stepper-success:bg-primary-active hs-stepper-success:text-primary-foreground hs-stepper-completed:bg-teal-500 hs-stepper-completed:group-focus:bg-teal-600">
                    <span class="hs-stepper-success:hidden hs-stepper-completed:hidden">2</span>
                    <svg class="hidden shrink-0 size-3 hs-stepper-success:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="ms-2 text-sm font-medium text-foreground group-focus:text-muted-foreground-1">
                    Step
                  </span>
                </span>
                <div class="w-full h-px flex-1 bg-surface-1 group-last:hidden hs-stepper-success:bg-primary-active hs-stepper-completed:bg-teal-600"></div>
              </li>
              <!-- End Item -->

              <!-- Item -->
              <li class="flex items-center gap-x-2 shrink basis-0 flex-1 group active success" data-hs-stepper-nav-item='{
                "index": 3,
                "isCompleted": true
              }'>
                <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none">
                  <span class="size-7 flex justify-center items-center shrink-0 bg-surface font-medium text-surface-foreground rounded-full group-focus:bg-surface-focus hs-stepper-active:bg-primary-active hs-stepper-active:text-primary-foreground hs-stepper-success:bg-primary-active hs-stepper-success:text-primary-foreground hs-stepper-completed:bg-teal-500 hs-stepper-completed:group-focus:bg-teal-600">
                    <span class="hs-stepper-success:hidden hs-stepper-completed:hidden">3</span>
                    <svg class="hidden shrink-0 size-3 hs-stepper-success:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span class="ms-2 text-sm font-medium text-foreground group-focus:text-muted-foreground-1">
                    Step
                  </span>
                </span>
                <div class="w-full h-px flex-1 bg-surface-1 group-last:hidden hs-stepper-success:bg-primary-active hs-stepper-completed:bg-teal-600"></div>
              </li>
              <!-- End Item -->
            </ul>
            <!-- End Stepper Nav -->

            <!-- Stepper Content -->
            <div class="mt-5 sm:mt-8">
              <!-- First Content -->
              <div data-hs-stepper-content-item='{
                "index": 1,
                "isCompleted": true
              }' style="display: none;">
                <div class="p-4 h-48 bg-muted flex justify-center items-center border border-dashed border-line-2 rounded-xl">
                  <h3 class="text-muted-foreground-1">
                    First content
                  </h3>
                </div>
              </div>
              <!-- End First Content -->

              <!-- Second Content -->
              <div data-hs-stepper-content-item='{
                "index": 2,
                "isCompleted": true
              }' style="display: none;">
                <div class="p-4 h-48 bg-muted flex justify-center items-center border border-dashed border-line-2 rounded-xl">
                  <h3 class="text-muted-foreground-1">
                    Second content
                  </h3>
                </div>
              </div>
              <!-- End Second Content -->

              <!-- Third Content -->
              <div data-hs-stepper-content-item='{
                "index": 3,
                "isCompleted": true
              }' style="display: none;">
                <div class="p-4 h-48 bg-muted flex justify-center items-center border border-dashed border-line-2 rounded-xl">
                  <h3 class="text-muted-foreground-1">
                    Third content
                  </h3>
                </div>
              </div>
              <!-- End Third Content -->

              <!-- Final Content -->
              <div data-hs-stepper-content-item='{
                "isFinal": true
              }'>
                <div class="p-4 h-48 bg-muted flex justify-center items-center border border-dashed border-line-2 rounded-xl">
                  <h3 class="text-muted-foreground-1">
                    Final content
                  </h3>
                </div>
              </div>
              <!-- End Final Content -->

              <div class="mt-5 flex justify-between items-center gap-x-2">
                <button type="button" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-stepper-back-btn style="display: none;">
                  <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
                <button type="button" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-stepper-next-btn style="display: none;">
                  Next
                  <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <button type="button" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none"  data-hs-stepper-finish-btn style="display: none;">
                  Finish
                </button>
                <button type="reset" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg bg-primary border border-primary-line text-primary-foreground hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus disabled:opacity-50 disabled:pointer-events-none" data-hs-stepper-reset-btn>
                  Reset
                </button>
              </div>
            </div>
            <!-- End Stepper Content -->
          </div>
          <!-- End Stepper -->
              <script src="../../assets/vendor/preline/dist/index.js?v=4.2.0"></script>
            </body>
          </html>
