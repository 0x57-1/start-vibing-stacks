<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    (function () {
      buildChart('#hs-multiple-area-charts-compare-two-tooltip', (mode) => ({
        chart: {
          height: 300,
          type: 'area',
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        series: [
          {
            name: '2023',
            data: [18000, 51000, 60000, 38000, 88000, 50000, 40000, 52000, 88000, 80000, 60000, 70000]
          },
          {
            name: '2022',
            data: [27000, 38000, 60000, 77000, 40000, 50000, 49000, 29000, 42000, 27000, 42000, 50000]
          }
        ],
        legend: {
          show: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'straight',
          width: 2
        },
        grid: {
          strokeDashArray: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            type: 'vertical',
            shadeIntensity: 1,
            opacityFrom: 0.1,
            opacityTo: 0.8
          }
        },
        xaxis: {
          type: 'category',
          tickPlacement: 'on',
          categories: [
            '15 January',
            '15 February',
            '15 March',
            '15 April',
            '15 May',
            '15 June',
            '15 July',
            '15 August',
            '15 September',
            '15 October',
            '15 November',
            '15 December'
          ],
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
          crosshairs: {
            stroke: {
              dashArray: 0
            },
            dropShadow: {
              show: false
            }
          },
          tooltip: {
            enabled: false
          },
          labels: {
            style: {
              fontSize: '13px',
              fontFamily: 'Inter, ui-sans-serif',
              fontWeight: 400
            },
            formatter: (title) => {
              let t = title;

              if (t) {
                const newT = t.split(' ');
                t = `${newT[1].slice(0, 3)}`;
              }

              return t;
            }
          }
        },
        yaxis: {
          labels: {
            align: 'left',
            minWidth: 0,
            maxWidth: 140,
            style: {
              fontSize: '13px',
              fontFamily: 'Inter, ui-sans-serif',
              fontWeight: 400
            },
            formatter: (value) => value >= 1000 ? `${value / 1000}k` : value
          }
        },
        tooltip: {
          x: {
            format: 'MMMM yyyy'
          },
          y: {
            formatter: (value) => `$${value >= 1000 ? `${value / 1000}k` : value}`
          },
          custom: function (props) {
            return buildTooltipCompareTwo(props, {
              title: 'Revenue',
              mode,
              hasTextLabel: true,
              wrapperExtClasses: 'min-w-48'
            });
          }
        },
        responsive: [{
          breakpoint: 568,
          options: {
            chart: {
              height: 300
            },
            labels: {
              style: {
                colors: varToColor('--chart-colors-labels'),
                fontSize: '11px',
                fontFamily: 'Inter, ui-sans-serif',
                fontWeight: 400
              },
              offsetX: -2,
              formatter: (title) => title.slice(0, 3)
            },
            yaxis: {
              labels: {
                align: 'left',
                minWidth: 0,
                maxWidth: 140,
                style: {
                  colors: varToColor('--chart-colors-yaxis-labels'),
                  fontSize: '11px',
                  fontFamily: 'Inter, ui-sans-serif',
                  fontWeight: 400
                },
                formatter: (value) => value >= 1000 ? `${value / 1000}k` : value
              }
            },
          },
        }]
      }), () => ({
        colors: [varToColor('--chart-colors-primary-hex'), varToColor('--chart-colors-chart-5-hex')],
        fill: {
          gradient: {
            shadeIntensity: .1,
            opacityFrom: .5,
            opacityTo: 0,
            stops: [50, 100, 100, 100]
          }
        },
        xaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-xaxis-labels')
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-yaxis-labels')
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border')
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary-hex-inverse'), varToColor('--chart-colors-chart-5-hex-inverse')],
        fill: {
          gradient: {
            shadeIntensity: .1,
            opacityFrom: .5,
            opacityTo: 0,
            stops: [50, 100, 100, 100]
          }
        },
        xaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-xaxis-labels-inverse'),
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-yaxis-labels-inverse')
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border-inverse')
        }
      }));
    })();
  });
</script>
