<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Bubble Chart
    (function () {
      buildChart('#hs-bubble-chart', () => ({
        chart: {
          height: '100%',
          type: 'bubble',
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        series: [
          {data: [[5, 6, 70]]},
          {data: [[8, 4, 45]]},
          {data: [[10, 9, 90]]}
        ],
        dataLabels: {
          style: {
            fontSize: '20px',
            fontFamily: 'Inter, ui-sans-serif',
            fontWeight: '400',
          },
          formatter: (value) => value ? `${value}%` : ''
        },
        fill: {
          opacity: 1
        },
        legend: {
          show: false
        },
        stroke: {
          width: 5
        },
        plotOptions: {
          bubble: {
            zScaling: false,
            minBubbleRadius: 40
          }
        },
        grid: {
          show: false,
          padding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        },
        xaxis: {
          min: 0,
          max: 15,
          labels: {
            show: false
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          min: 0,
          max: 15,
          labels: {
            show: false
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
        colors: [varToColor('--chart-colors-chart-6'), varToColor('--chart-colors-chart-9'), varToColor('--chart-colors-primary')],
        markers: {
          strokeColors: varToColor('--chart-colors-background')
        },
        dataLabels: {
          style: {
            colors: [varToColor('--chart-colors-foreground-inverse'), varToColor('--chart-colors-foreground'), varToColor('--chart-colors-foreground-inverse')],
          },
        },
      }), () => ({
        colors: [varToColor('--chart-colors-chart-6-inverse'), varToColor('--chart-colors-chart-9-inverse'), varToColor('--chart-colors-primary-inverse')],
        markers: {
          strokeColors: varToColor('--chart-colors-background-inverse')
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
