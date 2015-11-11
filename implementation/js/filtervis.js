/**
 * FilterVis object
 * @param {object} _parentElement reference to the parent
 * @param {object} _data          reference to the data
 * @param {object} _metaData      reference to the metadata
 */
function FilterVis(_parentElement, _data, _metaData, _eventHandler, _filtering) {
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
 * @return {[type]} [description]
 */
FilterVis.prototype.initializeVis = function () {
    var self = this;
    var selGraph, selBars;
    var dataValues;
    self.svg = self.parentElement;

    self.svgWidth = 400;
    self.svgHeight = 40;

    self.svgMarginTop = 0;
    self.svgMarginLeft = 5;
    self.svgMarginBottom = 0;
    self.svgGraphWidth = self.svgWidth - self.svgMarginLeft;
    self.svgGraphHeight = self.svgHeight - self.svgMarginBottom - self.svgMarginTop;

    yMax = d3.max(self.displayData, function (d) {
        return d.count;
    });

    yMin = d3.min(self.displayData, function (d) {
        return d.count;
    });

    dataValues = self.displayData.map(function (d) {
        return d.value;
    });

    //dataValues.sort();

    // setup scales
    self.xScale = d3.scale.ordinal()
        .domain(dataValues)
        .range([0, self.svgGraphWidth]);

    // setup scales
    self.iScale = d3.scale.ordinal()
        .domain(d3.range(0, dataValues.length))
        .rangeBands([0, self.svgGraphWidth], 0);

    self.colorScale = d3.scale.linear()
        .domain([yMin, yMax])
        .range(["#DDD", "#333"]);

    // setup axis
    self.xAxis = d3.svg.axis()
        .scale(self.iScale)
        .orient("bottom");

    // NOTE +/- 1 is for getting the graph off of the axis
    self.svg.select(".xAxis")
        .call(self.xAxis)
        .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (self.svgGraphHeight + 1 + self.svgMarginTop) + ")")
        .selectAll("text")
        .attr("transform", function(d) {
            return "rotate(45)";
        })
        .attr("x", 10)
        .attr("y", 3)
        .style("text-anchor", "start")
        .text(function (d) {
            return dataValues[d];
        });

    selGraph = self.svg.select(".graph");

    selBars = selGraph.selectAll("rect")
        .data(self.displayData);

    selBars.enter()
        .append("rect");

    selBars.exit()
        .remove();

    selBars.attr("x", function (d, i) {
            return self.iScale(i);
        }) 
        .attr("width", function (d, i) {
            return self.iScale(1);
        })
        .attr("y", function (d) {
            return 0;
        })
        .attr("height", function (d) {
            return self.svgHeight;
        })
        .attr("fill", function (d) {
            return self.colorScale(d.count);
        })
        .attr("transform", "translate(" + (self.svgMarginLeft) + "," + (self.svgMarginTop) + ")");
};

/**
 * Updates the display data.
 */
FilterVis.prototype.updateData = function () {
    var self = this;
    var i, j,
        objectKeys,
        ex,
        value,
        tempData = {};

    self.displayData = [];

    for (i = 0; i < self.data.length; i++) {
        if (!tempData[self.data[i][self.filtering.set]]) {
            tempData[self.data[i][self.filtering.set]] = 0;
        }
        tempData[self.data[i][self.filtering.set]] += 1;
    }

    objectKeys = Object.keys(tempData);
    for (i = 0; i < objectKeys.length; i++) {
        value = objectKeys[i];

        // some sets are continous
        if (self.filtering.set === "Age" ||
            self.filtering.set === "# days used marijuana or hashish/month") {
            value = parseInt(value);
        }
        self.displayData.push({
            value: value,
            count: tempData[objectKeys[i]]
        });
    }

    self.sortData();
};

/**
 * Since data is strings with an abstract value, we must sort them manually
 */
FilterVis.prototype.sortData = function () {
    var self = this;
    var i, lookup = {},
        tempData = [];

    // create a lookup object
    // CITE: Aaron Digulla, Sep 9 2011 retrieved on Nov 10 2015
    // SOURCE: http://stackoverflow.com/questions/7364150/find-object-by-id-in-array-of-javascript-objects
    for (i=0; i < self.displayData.length; i++) {
        lookup[self.displayData[i].value] = self.displayData[i];
    }

    if (self.filtering.set === "Annual household income") {
        tempData.push(lookup["null"]);
        tempData.push(lookup["$0 to $4,999"]);
        tempData.push(lookup["$5,000 to $9,999"]);
        tempData.push(lookup["$10,000 to $14,999"]);
        tempData.push(lookup["$15,000 to $19,999"]);
        tempData.push(lookup["$20,000 to $24,999"]);
        tempData.push(lookup["$25,000 to $34,999"]);
        tempData.push(lookup["$35,000 to $44,999"]);
        tempData.push(lookup["$45,000 to $54,999"]);
        tempData.push(lookup["$55,000 to $64,999"]);
        tempData.push(lookup["$65,000 to $74,999"]);
        tempData.push(lookup["$75,000 to $99,999"]);
        tempData.push(lookup["$100,000 and Over"]);
    }

    self.displayData = tempData;
};