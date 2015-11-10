/**
 * GraphVis object
 * @param {object} _parentElement reference to the parent
 * @param {object} _data          reference to the data
 * @param {object} _metaData      reference to the metadata
 */
function GraphVis(_parentElement, _data, _metaData, _eventHandler, _filtering) {
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.displayData = [];
    self.filtering = _filtering;

    self.updateData();
    self.initializeVis();
}

/**
 * Called as initial setup of object.
 */
GraphVis.prototype.initializeVis = function () {
    var xMax, xMin, yMax, yMin;
    var selGraph, areaGenerator;
    var ticks;
    // var xAxisG, yAxisG;
    var self = this;
    self.svg = self.parentElement;

    self.svgWidth = 330;
    self.svgHeight = 200;

    self.svgMarginTop = 3;
    self.svgMarginLeft = 40;
    self.svgMarginBottom = 20;
    self.svgGraphWidth = self.svgWidth - self.svgMarginLeft;
    self.svgGraphHeight = self.svgHeight - self.svgMarginBottom - self.svgMarginTop;

    // define the max/min of x and y
    xMax = d3.max(self.displayData, function (d) {
                return d.value;
            });
    xMin = d3.min(self.displayData, function (d) {
                return d.value;
            });
    yMax = d3.max(self.displayData, function (d) {
                return d.count;
            });
    // yMin = d3.min(self.displayData, function (d) {
    //             return d.count;
    //         });
    yMin = 0;

    // setup scales
    self.xScale = d3.scale.linear()
        .domain([xMin, xMax])
        .range([0, self.svgGraphWidth]);
    self.yScale = d3.scale.linear()
        .domain([yMin, yMax])
        .range([0, self.svgGraphHeight]);

    self.invertedYScale = d3.scale.linear()
        .domain([yMax, yMin])
        .range([0, self.svgGraphHeight]);

    // if we exclude the 0 value, make sure to show a xMin (1) tick at least
    ticks = self.xScale.ticks();
    if (self.filtering.excludeInRange === "0") {
        ticks.push(xMin);
    }

    // setup axis
    self.xAxis = d3.svg.axis()
                    .scale(self.xScale)
                    .orient("bottom")
                    .tickValues(ticks);
    self.yAxis = d3.svg.axis()
                    .scale(self.invertedYScale)
                    .orient("left");

    // NOTE +/- 1 is for getting the graph off of the axis
    self.svg.select(".xAxis")
        .call(self.xAxis)
        .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (self.svgGraphHeight + 1 + self.svgMarginTop) + ")");

    self.svg.select(".yAxis")
        .call(self.yAxis)
        .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (1 + self.svgMarginTop) + ")");



    // setup graph
    areaGenerator = d3.svg.area()
        .x(function (d) {
            return self.xScale(d.value);
        })
        .y0(self.yScale(yMax))
        .y1(function (d) {
            return self.yScale(yMax) - self.yScale(d.count);
        });

    selGraph = self.svg.select(".graph")
        .attr("transform", "translate(" + self.svgMarginLeft + "," + (self.svgMarginTop)  + ")");

    selGraph.selectAll("path").remove();


    selGraph.append("path")
        .attr("d", areaGenerator(self.displayData));

    //areaGenerator = ;
};

/**
 * Updates the display data.
 */
GraphVis.prototype.updateData = function () {
    var self = this;
    var i, j,
        objectKeys,
        ex,
        value,
        tempData = {};

    self.displayData = [];

    for (i = 0; i < self.data.length; i++) {
        if (!tempData[self.data[i][self.filtering.xAxisSet]]) {
            tempData[self.data[i][self.filtering.xAxisSet]] = 0;
        }
        tempData[self.data[i][self.filtering.xAxisSet]] += 1;
    }

    objectKeys = Object.keys(tempData);
    for (i = 0; i < objectKeys.length; i++) {
        value = objectKeys[i];
        // exclude cases that really scew the data.  We will display it separately
        if (self.filtering.excludeInRange && self.filtering.excludeInRange === value) {
            // set exclusion text, if any
            if (self.filtering.exclusionId) {
                ex = document.getElementById(self.filtering.exclusionId);
                ex.innerHTML = "*Excluding " + value + " with count of " + tempData[objectKeys[i]];
            }
           continue;
        }
        // some sets are continous
        if (self.filtering.xAxisSet === "Age" ||
            self.filtering.xAxisSet === "# days used marijuana or hashish/month") {
            value = parseInt(value);
        }
        self.displayData.push({
            value: value,
            count: tempData[objectKeys[i]]
        });
    }
};