<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Doughnut Chart
    (function () {
      buildChart('#hs-doughnut-chart', (mode) => ({
        chart: {
          height: 230,
          width: 230,
          type: 'donut',
          zoom: {
            enabled: false
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '76%'
            }
          }
        },
        series: [47, 23, 30],
        labels: ['Tailwind CSS', 'Preline UI', 'Others'],
        legend: {
          show: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          width: 5
        },
        grid: {
          padding: {
            top: -12,
            bottom: -11,
            left: -12,
            right: -12
          }
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          }
        },
        tooltip: {
          enabled: true,
          custom: function (props) {
            return buildTooltipForDonut(
              props,
              mode === 'dark' ? ['#fff', '#fff', '#000'] : ['#fff', '#fff', '#000']
            );
          }
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary-inverse'), varToColor('--chart-colors-chart-6'), varToColor('--chart-colors-chart-9')],
        stroke: {
          colors: varToColor('--chart-colors-background'),
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary-inverse'), varToColor('--chart-colors-chart-6-inverse'), varToColor('--chart-colors-chart-9-inverse')],
        stroke: {
          colors: varToColor('--chart-colors-background-inverse'),
        }
      }));
    })();
  });
</script>
