<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Pie Chart
    (function () {
      buildChart('#hs-pie-chart', () => ({
        chart: {
          height: '100%',
          type: 'pie',
          zoom: {
            enabled: false
          }
        },
        series: [70, 18, 12],
        labels: ['Direct', 'Organic search', 'Referral'],
        title: {
          show: false
        },
        dataLabels: {
          style: {
            fontSize: '20px',
            fontFamily: 'Inter, ui-sans-serif',
            fontWeight: '400',
          },
          dropShadow: {
            enabled: false
          },
          formatter: (value) => `${value.toFixed(1)} %`
        },
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -15
            }
          }
        },
        legend: {
          show: false
        },
        stroke: {
          width: 4
        },
        grid: {
          padding: {
            top: -10,
            bottom: -14,
            left: -9,
            right: -9
          }
        },
        tooltip: {
          enabled: false
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          }
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary'), varToColor('--chart-colors-chart-6'), varToColor('--chart-colors-chart-9')],
        stroke: {
          colors: varToColor('--chart-colors-background'),
        },
        dataLabels: {
          style: {
            colors: [varToColor('--chart-colors-foreground-inverse'), varToColor('--chart-colors-foreground-inverse'), varToColor('--chart-colors-foreground')],
          },
        },
      }), () => ({
        colors: [varToColor('--chart-colors-primary-inverse'), varToColor('--chart-colors-chart-6-inverse'), varToColor('--chart-colors-chart-9-inverse')],
        stroke: {
          colors: varToColor('--chart-colors-background-inverse'),
        },
        dataLabels: {
          style: {
            colors: [varToColor('--chart-colors-foreground-inverse'), varToColor('--chart-colors-foreground-inverse'), varToColor('--chart-colors-foreground-inverse')],
          },
        },
      }));
    })();
  });
</script>
