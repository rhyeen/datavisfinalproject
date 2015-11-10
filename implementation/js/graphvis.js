/**
 * GraphVis object
 * @param {object} _parentElement reference to the parent
 * @param {object} _data          reference to the data
 * @param {object} _metaData      reference to the metadata
 */
function GraphVis(_parentElement, _data, _metaData) {
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.displayData = [];
    self.set = "Age";
    self.updateData();
    self.initializeVis();
}

/**
 * Called as initial setup of object.
 */
GraphVis.prototype.initializeVis = function () {
    var xMax, xMin, yMax, yMin;
    // var selectionX, selectionY;
    // var xAxisG, yAxisG;
    var self = this;

    self.svg = d3.select("#graphVis1");

    self.svgWidth = 340;
    self.svgHeight = 200;

    self.svgMarginLeft = 40;
    self.svgMarginLeft = 40;
    self.svgGraphWidth = self.svgWidth - self.svgMarginLeft;

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
    yMin = d3.min(self.displayData, function (d) {
                return d.count;
            });

    self.xScale = d3.scale.linear()
        .domain([xMin, xMax])
        .range([0, self.svgGraphWidth]);
    self.yScale = d3.scale.linear()
        .domain([yMin, yMax])
        .range([0, self.svgHeight]);

    self.xAxis = d3.svg.axis().scale(self.xScale);
    self.yAxis = d3.svg.axis().scale(self.yScale).orient("left");

    self.svg.select(".xAxis")
        .call(self.xAxis)
        .attr("transform", "translate(" + self.svgMarginLeft + ",0)");
    self.svg.select(".yAxis")
        .call(self.yAxis)
        .attr("transform", "translate(" + self.svgMarginLeft + ",0)");
};

/**
 * Updates the display data.
 */
GraphVis.prototype.updateData = function () {
    var self = this;
    var i, j,
        objectKeys,
        value,
        tempData = {};

    self.displayData = [];

    for (i = 0; i < self.data.length; i++) {
        if (!tempData[self.data[i][self.set]]) {
            tempData[self.data[i][self.set]] = 0;
        }
        tempData[self.data[i][self.set]] += 1;
    }

    objectKeys = Object.keys(tempData);
    for (i = 0; i < objectKeys.length; i++) {
        value = objectKeys[i];
        // some sets are continous
        if (self.set === "Age") {
            value = parseInt(value);
        }
        self.displayData.push({
            value: value,
            count: tempData[objectKeys[i]]
        });
    }
};