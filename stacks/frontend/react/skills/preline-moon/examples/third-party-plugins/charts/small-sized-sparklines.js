<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener("load", () => {
    // Apex Mix Charts Sparklines
    (function () {
      buildChart(
        "#hs-sparklines-area-chart",
        (mode) => ({
          series: [
            {
              name: "Sales",
              data: [21, 20, 24, 45, 47, 30, 30, 35, 35, 35, 40],
            },
          ],
          chart: {
            width: 100,
            height: 30,
            type: "area",
            sparkline: {
              enabled: true,
            },
          },
          stroke: {
            curve: "smooth",
            width: 0,
          },
          fill: {
            type: "solid",
          },
          xaxis: {
            type: "category",
            categories: [
              "25 January 2023",
              "26 January 2023",
              "27 January 2023",
              "28 January 2023",
              "29 January 2023",
              "30 January 2023",
              "31 January 2023",
              "1 February 2023",
              "2 February 2023",
              "3 February 2023",
              "4 February 2023",
            ],
            crosshairs: {
              show: false,
            },
          },
          yaxis: {
            labels: {
              show: false,
            },
            axisTicks: {
              show: false,
            },
            axisBorder: {
              show: false,
            },
          },
          markers: {
            hover: {
              size: 0,
            },
          },
          tooltip: {
            marker: {
              show: false,
            },
            fixed: {
              enabled: true,
              position: "bottomLeft",
              offsetX: 10,
              offsetY: -15,
            },
            custom: function (props) {
              const { categories } = props.ctx.opts.xaxis;
              const { dataPointIndex } = props;
              const title = categories[dataPointIndex].split(" ");
              const newTitle = `${title[0]} ${title[1]}`;

              return buildTooltip(props, {
                title: newTitle,
                mode,
                hasTextLabel: true,
                wrapperExtClasses: "min-w-28",
                titleExtClasses: "text-left",
                labelDivider: ":",
                labelExtClasses: "ms-2",
              });
            },
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary")],
          xaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-xaxis-labels"),
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-yaxis-labels"),
              },
            },
          },
          grid: {
            borderColor: varToColor("--chart-colors-grid-border"),
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary-inverse")],
          xaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-xaxis-labels-inverse"),
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-yaxis-labels-inverse"),
              },
            },
          },
          grid: {
            borderColor: varToColor("--chart-colors-grid-border-inverse"),
          },
        }),
      );
    })();

    (function () {
      buildChart(
        "#hs-sparklines-bar-chart",
        (mode) => ({
          series: [
            {
              name: "Sales",
              data: [21, 20, 24, 45, 47, 30, 30, -35, -45, 35, 40],
            },
          ],
          chart: {
            width: 100,
            height: 50,
            type: "bar",
            sparkline: {
              enabled: true,
            },
          },
          xaxis: {
            type: "category",
            categories: [
              "25 January 2023",
              "26 January 2023",
              "27 January 2023",
              "28 January 2023",
              "29 January 2023",
              "30 January 2023",
              "31 January 2023",
              "1 February 2023",
              "2 February 2023",
              "3 February 2023",
              "4 February 2023",
            ],
            crosshairs: {
              show: false,
            },
          },
          yaxis: {
            labels: {
              show: false,
            },
            axisTicks: {
              show: false,
            },
            axisBorder: {
              show: false,
            },
          },
          tooltip: {
            marker: {
              show: false,
            },
            fixed: {
              enabled: true,
              position: "bottomLeft",
              offsetX: 10,
              offsetY: -15,
            },
            custom: function (props) {
              const { categories } = props.ctx.opts.xaxis;
              const { dataPointIndex } = props;
              const title = categories[dataPointIndex].split(" ");
              const newTitle = `${title[0]} ${title[1]}`;

              return buildTooltip(props, {
                title: newTitle,
                mode,
                hasTextLabel: true,
                wrapperExtClasses: "min-w-28",
                titleExtClasses: "text-left",
                labelDivider: ":",
                labelExtClasses: "ms-2",
              });
            },
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary")],
          plotOptions: {
            bar: {
              colors: {
                ranges: [
                  {
                    from: -45,
                    to: 0,
                    color: varToColor("--chart-colors-bar-ranges"),
                  },
                ],
              },
            },
          },
          xaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-xaxis-labels"),
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-yaxis-labels"),
              },
            },
          },
          grid: {
            borderColor: varToColor("--chart-colors-grid-border"),
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary-inverse")],
          plotOptions: {
            bar: {
              colors: {
                ranges: [
                  {
                    from: -45,
                    to: 0,
                    color: varToColor("--chart-colors-bar-ranges-inverse"),
                  },
                ],
              },
            },
          },
          xaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-xaxis-labels-inverse"),
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                colors: varToColor("--chart-colors-yaxis-labels-inverse"),
              },
            },
          },
          grid: {
            borderColor: varToColor("--chart-colors-grid-border-inverse"),
          },
        }),
      );
    })();

    (function () {
      buildChart(
        "#hs-sparklines-pie-chart",
        () => ({
          chart: {
            width: 30,
            height: 30,
            type: "pie",
            sparkline: {
              enabled: true,
            },
          },
          series: [70, 18, 12],
          labels: ["Direct", "Organic search", "Referral"],
          plotOptions: {
            pie: {
              expandOnClick: false,
            },
          },
          stroke: {
            width: 0,
          },
          tooltip: {
            enabled: false,
          },
          states: {
            hover: {
              filter: {
                type: "none",
              },
            },
          },
        }),
        () => ({
          colors: [
            varToColor("--chart-colors-primary"),
            varToColor("--chart-colors-chart-6"),
            varToColor("--chart-colors-chart-9"),
          ],
          stroke: {
            colors: varToColor("--chart-colors-background"),
          },
        }),
        () => ({
          colors: [
            varToColor("--chart-colors-primary-inverse"),
            varToColor("--chart-colors-chart-6-inverse"),
            varToColor("--chart-colors-chart-9-inverse"),
          ],
          stroke: {
            colors: varToColor("--chart-colors-background-inverse"),
          },
        }),
      );
    })();

    (function () {
      buildChart(
        "#hs-sparklines-line-chart",
        (mode) => ({
          series: [
            {
              name: "Sales",
              data: [21, 20, 24, 45, 47, 30, 30, 35, 35, 35, 40],
            },
          ],
          chart: {
            width: 100,
            height: 30,
            type: "line",
            sparkline: {
              enabled: true,
            },
          },
          stroke: {
            curve: "smooth",
            width: 2,
          },
          xaxis: {
            type: "category",
            categories: [
              "25 January 2023",
              "26 January 2023",
              "27 January 2023",
              "28 January 2023",
              "29 January 2023",
              "30 January 2023",
              "31 January 2023",
              "1 February 2023",
              "2 February 2023",
              "3 February 2023",
              "4 February 2023",
            ],
            crosshairs: {
              show: false,
            },
          },
          yaxis: {
            labels: {
              show: false,
            },
            axisTicks: {
              show: false,
            },
            axisBorder: {
              show: false,
            },
          },
          markers: {
            hover: {
              size: 0,
            },
          },
          tooltip: {
            marker: {
              show: false,
            },
            fixed: {
              enabled: true,
              position: "bottomLeft",
              offsetX: 10,
              offsetY: -15,
            },
            custom: function (props) {
              const { categories } = props.ctx.opts.xaxis;
              const { dataPointIndex } = props;
              const title = categories[dataPointIndex].split(" ");
              const newTitle = `${title[0]} ${title[1]}`;

              return buildTooltip(props, {
                title: newTitle,
                mode,
                hasTextLabel: true,
                wrapperExtClasses: "min-w-28",
                titleExtClasses: "text-left",
                labelDivider: ":",
                labelExtClasses: "ms-2",
              });
            },
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary-inverse")],
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary-inverse")],
        }),
      );
    })();

    (function () {
      buildChart(
        "#hs-sparklines-candles-chart",
        (mode) => ({
          series: [
            {
              name: "Sales",
              data: [
                {
                  x: "25 January 2023",
                  y: [6598.86, 6598.88, 6570, 6587.16],
                },
                {
                  x: "26 January 2023",
                  y: [6588.86, 6600, 6580, 6593.4],
                },
                {
                  x: "27 January 2023",
                  y: [6593.99, 6598.89, 6585, 6587.81],
                },
                {
                  x: "28 January 2023",
                  y: [6587.81, 6592.73, 6567.14, 6578],
                },
                {
                  x: "29 January 2023",
                  y: [6578.35, 6581.72, 6567.39, 6579],
                },
                {
                  x: "30 January 2023",
                  y: [6579.38, 6580.92, 6566.77, 6575.96],
                },
                {
                  x: "31 January 2023",
                  y: [6575.96, 6589, 6571.77, 6588.92],
                },
                {
                  x: "1 February 2023",
                  y: [6588.92, 6594, 6577.55, 6589.22],
                },
                {
                  x: "2 February 2023",
                  y: [6589.3, 6598.89, 6589.1, 6596.08],
                },
                {
                  x: "3 February 2023",
                  y: [6597.5, 6600, 6588.39, 6596.25],
                },
                {
                  x: "4 February 2023",
                  y: [6598.03, 6600, 6588.73, 6595.97],
                },
              ],
            },
          ],
          chart: {
            width: 100,
            height: 50,
            type: "candlestick",
            sparkline: {
              enabled: true,
            },
          },
          xaxis: {
            type: "category",
            categories: [
              "25 January 2023",
              "26 January 2023",
              "27 January 2023",
              "28 January 2023",
              "29 January 2023",
              "30 January 2023",
              "31 January 2023",
              "1 February 2023",
              "2 February 2023",
              "3 February 2023",
              "4 February 2023",
            ],
            crosshairs: {
              show: false,
            },
          },
          yaxis: {
            labels: {
              show: false,
            },
            axisTicks: {
              show: false,
            },
            axisBorder: {
              show: false,
            },
          },
          tooltip: {
            marker: {
              show: false,
            },
            fixed: {
              enabled: true,
              position: "bottomLeft",
              offsetX: 10,
              offsetY: -15,
            },
            custom: function (props) {
              const { categories } = props.ctx.opts.xaxis;
              const { dataPointIndex } = props;
              const title = categories[dataPointIndex].split(" ");
              const newTitle = `${title[0]} ${title[1]}`;

              return buildTooltip(props, {
                title: newTitle,
                mode,
                hasTextLabel: true,
                wrapperExtClasses: "min-w-28",
                titleExtClasses: "text-left",
                labelDivider: ":",
                labelExtClasses: "ms-2",
              });
            },
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary")],
          plotOptions: {
            candlestick: {
              colors: {
                upward: varToColor("--chart-colors-candlestick-upward"),
                downward: varToColor("--chart-colors-candlestick-downward"),
              },
            },
          },
        }),
        () => ({
          colors: [varToColor("--chart-colors-primary-inverse")],
          plotOptions: {
            candlestick: {
              colors: {
                upward: varToColor("--chart-colors-candlestick-upward-dark"),
                downward: varToColor(
                  "--chart-colors-candlestick-downward-dark",
                ),
              },
            },
          },
        }),
      );
    })();
  });
</script>
