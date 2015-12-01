/**
 * FilterVis object
 * @param {object} _parentElement reference to the parent
 * @param {object} _data          reference to the data
 * @param {object} _metaData      reference to the metadata
 */
function FilterVis(_parentElement, _data, _metaData, _eventHandler, _filtering, _filteringOutput) {
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.eventHandler = _eventHandler;
    self.displayData = [];
    self.filtering = _filtering;
    self.filteringOutput = _filteringOutput;
    self.showDetails = false;
    self.brush;
    self.selBrush;
    
    self.updateData();
    self.initializeVis();
}


/**
 * Called as initial setup of object.
 */
FilterVis.prototype.initializeVis = function () {
    var self = this;
    var selGraph, selBars,
        selOverlay, selOverlayBars;
    var dataValues;
    var brushMouseMove, brushDeselectAll,
        brushSelectionExists, getOutputFilteringSet,
        numOfTicks, i, tickSpan,
        brushCheckSelection,
        saveBrushExtent,
        yMax, yMin;
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
        .domain([yMin/2, yMax])
        .range(["#EEE", "#444"]);

    // setup axis
    self.xAxis = d3.svg.axis()
        .scale(self.iScale)
        .orient("bottom");

    // if not ordinal data
    if (self.filtering.set === "Age" ||
    self.filtering.set === "Money spent at supermarket/grocery store" ||
    self.filtering.set === "Money spent on carryout/delivered foods" ||
    self.filtering.set === "Money spent on eating out") {
        numOfTicks = 15;
        tickSpan = Math.floor(dataValues.length / numOfTicks);
        // CITE: mbostock (July 31, 2012) on Nov 24th, 2015 
        // SORUCE: http://bl.ocks.org/mbostock/3212294
        self.xAxis.tickValues(self.iScale.domain()
            .filter(function(d, i) {
                return !(i % tickSpan);
            })
        );
        // END CITE
        //self.xAxis.tickValues(tickValues);
    }

    // NOTE +/- 1 is for getting the graph off of the axis
    self.svg.select(".xAxis")
        .call(self.xAxis)
        .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (self.svgGraphHeight + 1 + self.svgMarginTop) + ")")
        .selectAll("text")
        .attr("transform", function(d) {
            return "rotate(30)";
        })
        .attr("x", 2)
        .attr("y", 3)
        .style("text-anchor", "start")
        .text(function (d) {
            return dataValues[d];
        });

    // heat map graph
    selGraph = self.svg.select(".graph-filter");

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
        .attr("y", 0)
        .attr("height", self.svgHeight)
        .attr("fill", function (d) {
            return self.colorScale(d.count);
        })
        .attr("transform", "translate(" + (self.svgMarginLeft) + "," + (self.svgMarginTop) + ")");

    // overlay if nothing is selected, overlay-filter-deselect if something is selected.
    selOverlay = self.svg.select(".overlay-filter");
    selOverlayBars = selOverlay.select("rect");

    selOverlayBars.attr("x", 0) 
        .attr("width", self.svgGraphWidth)
        .attr("y", 0)
        .attr("height", self.svgHeight)
        .attr("transform", "translate(" + (self.svgMarginLeft) + "," + (self.svgMarginTop) + ")");




    //// brushing
    /**
     * Returns whether or not the selection of the brush is significant enough to count as a selection.
     */
    brushSelectionExists = function() {
        var brushRange;
        var tolerance = 0.01;
        if (!self.brush) {
            return false;
        }

        brushRange = self.brush.extent();
        
        return Math.abs(brushRange[0] - brushRange[1]) >= tolerance;
    };

    /**
     * Prepares the outputfiltering object for holding the right deselected values.
     */
    getOutputFilteringSet = function () {
        var brushRange, i, j, 
            notSelected = [], 
            foundInSelected,
            selection = [],
            isInArray;

        isInArray = function (value, array) {
            var index;
            if (!array || !array.length) {
                return false;
            }
            for (index = 0; index < array.length; index++) {
                if (array[index] === value) {
                    return true;
                }
            }
            return false;
        };

        if (brushSelectionExists()) {         
            brushRange = self.brush.extent();
            selection = self.iScale.domain().filter(function (d) {
                // max value            
                if(!self.iScale(d+1)) {
                    return brushRange[1] > self.iScale(d);
                }
                return brushRange[0] < self.iScale(d+1) && brushRange[1] > self.iScale(d);
            });
            
            // find all values not selected so we can mark them for the output graph
            for (i=0; i < self.displayData.length; i++) {
                foundInSelected = false;
                if (!isInArray(i, selection)) {
                    notSelected.push(i);
                }
            }
        }
        else {
            // console.log("all selected");
            delete self.filteringOutput[self.filtering.set];
        }
        // remove any filtering if nothing is manually selected (i.e. the whole graph is selected)
        // otherwise add the filtering specified
        self.filteringOutput[self.filtering.set] = [];
        for (i=0; i < notSelected.length; i++) {
            self.filteringOutput[self.filtering.set].push(self.displayData[notSelected[i]].value);
        }
        //console.log(self.filteringOutput);
        if (!self.selectGraphBrushCallsCount) {
            self.eventHandler.selectionChanged();
        }
        else {
            self.selectGraphBrushCallsCount--;
        }
    };
    
    /**
     * Saves the brush extent to the output filtering, for when
     * a new graph is selected.
     */
    saveBrushExtent = function() {
        var brushRange = self.brush.extent();
        if (!self.filteringOutput.brush[self.filtering.graph]) {
            self.filteringOutput.brush[self.filtering.graph] = {};
        }

        self.filteringOutput.brush[self.filtering.graph][self.filtering.set] = brushRange;
    };

    /**
     * REFERENCE chrisbrich, Nov 30, 2012. Retrieved: Nov 19, 2015
     * SOURCE: http://bl.ocks.org/chrisbrich/4173587
     * Selects the data that is within selection.
     */
    brushMouseMove = function(args) {
        getOutputFilteringSet();
    };

    /**
     * Starts brushing by deselecting previous selections.
     */
    brushDeselectAll = function(args) {
        selOverlay.classed("overlay-filter", false);
        selOverlay.classed("overlay-filter-deselect", true);
        getOutputFilteringSet();
    };

    /**
     * Removes selection if needed.
     */
    brushCheckSelection = function(args) {
        selOverlay.classed("overlay-filter", !brushSelectionExists());
        selOverlay.classed("overlay-filter-deselect", brushSelectionExists());
        getOutputFilteringSet();
        saveBrushExtent();
    };

    self.brush = d3.svg.brush().x(self.iScale)
        .on("brush", brushMouseMove)
        .on("brushstart", brushDeselectAll)
        .on("brushend", brushCheckSelection);

    self.selBrush = self.svg.append("g").attr("class", "input-brush");
    
    self.selBrush
        .call(self.brush)
        .selectAll("rect")
        .attr("height", self.svgHeight)
        .attr("transform", "translate(" + (self.svgMarginLeft) + "," + (self.svgMarginTop) + ")");

    self.onToggleFilter();
};

/**
 * Selects the graph that is being filtered
 */
FilterVis.prototype.selectGraph = function (id) {
    var self = this;
    self.filtering.graph = id;

    if (self.filteringOutput.brush[self.filtering.graph] &&
            self.filteringOutput.brush[self.filtering.graph][self.filtering.set] && 
            self.filteringOutput.brush[self.filtering.graph][self.filtering.set].length === 2) {
         self.brush.extent(self.filteringOutput.brush[self.filtering.graph][self.filtering.set]);
    }
    // new graph
    else {
        self.brush.clear();
    }
    // going to call the events 3 times, and 3 times, we want to ignore sending an onSelectionChanged
    self.selectGraphBrushCallsCount = 3;
    self.selBrush.call(self.brush);
    self.selBrush.call(self.brush.event);
    //self.selBrush.call(self.brush.event);
}

/**
 * Toggles the filtering graph
 */
FilterVis.prototype.onToggleFilter = function (id, group) {
    var self = this;

    if (id === self.filtering.id && group === self.filtering.group) {
        self.svg.select(".xAxis")
            .attr("display", null);
        self.svg
            .attr("height", 110);
    }
    else {
        self.svg.select(".xAxis")
            .attr("display", "none");
        self.svg
            .attr("height", 10);
    }

    //self.showDetails = !self.showDetails;
    //if (self.showDetails) {
    // if (!show) {
    //     self.svg.select(".xAxis")
    //         .attr("display", "none");
    //     self.svg
    //         .attr("height", 10);
    // }
    // else {
    //     self.svg.select(".xAxis")
    //         .attr("display", null);
    //     self.svg
    //         .attr("height", 110);
    // }
}

/**
 * Updates the display data.
 */
FilterVis.prototype.updateData = function () {
    var self = this;
    var i,
        objectKeys,
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
            self.filtering.set === "Money spent at supermarket/grocery store" ||
            self.filtering.set === "Money spent on carryout/delivered foods" ||
            self.filtering.set === "Money spent on eating out") {
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
        tempData.push(lookup["Don't know"]);
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
    else if (self.filtering.set === "Education") {
        tempData.push(lookup["< 9th Grade"]);
        tempData.push(lookup["9-11th Grade"]);
        tempData.push(lookup["High School Grad"]);
        tempData.push(lookup["Some College"]);
        tempData.push(lookup["College Grad"]);
    }
    else if (self.filtering.set === "Marital status") {
        tempData.push(lookup["No answer"]);
        tempData.push(lookup["Never married"]);
        tempData.push(lookup["With partner"]);
        tempData.push(lookup["Married"]);
        tempData.push(lookup["Divorced"]);
        tempData.push(lookup["Separated"]);
        tempData.push(lookup["Widowed"]);
    }
    else if (self.filtering.set === "Race") {
        tempData.push(lookup["Other"]);
        tempData.push(lookup["Black"]);
        tempData.push(lookup["White"]);
        tempData.push(lookup["Hispanic"]);
        tempData.push(lookup["Mexican American"]);
    }
    else if (self.filtering.set === "Dark green vegetables available at home" ||
        self.filtering.set === "Fruits available at home" ||
        self.filtering.set === "Fat-free/low fat milk available at home" ||
        self.filtering.set === "Salty snacks available at home" ||
        self.filtering.set === "Soft drinks available at home") {
        tempData.push(lookup["Never"]);
        tempData.push(lookup["Rarely"]);
        tempData.push(lookup["Sometimes"]);
        tempData.push(lookup["Most of the time"]);
        tempData.push(lookup["Always"]);
    }
    else {
        tempData = self.displayData;
    }

    self.displayData = tempData;
};