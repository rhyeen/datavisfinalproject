/**
 * GraphVis object
 * @param {object} _parentElement reference to the parent
 * @param {object} _data          reference to the data
 * @param {object} _metaData      reference to the metadata
 */
function GraphVis(_parentElement, _data, _metaData, _eventHandler, _filtering, _filteringOutput) {
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.displayData = [];
    self.filtering = _filtering;
    self.filteringOutput = _filteringOutput;

    self.updateData();
    self.initializeVis();
}

/**
 * Called as initial setup of object.
 */
GraphVis.prototype.initializeVis = function () {
    var xMax, xMin, yMax, yMin;
    var selGraph, areaGenerator, dataValues, i, j, tempDisplayData, noCount = true;
    var ticks;
    // var xAxisG, yAxisG;
    var self = this;
    //console.log("initializing " + self.filtering.id);

    // old method doesn't allow updating once the reference is lost (a new graph is made)
    //self.svg = self.parentElement;
    self.svg = d3.select("#" + self.filtering.id);

    self.svgWidth = 330;
    self.svgHeight = 200;

    self.svgMarginTop = 5;
    self.svgMarginLeft = 45;
    self.svgMarginBottom = 20;
    if (self.filtering.xAxisSet === "# times had sex without condom/year" ||
        self.filtering.xAxisSet === "# times had vaginal or anal sex/year" ||
        self.filtering.xAxisSet === "Do you now smoke cigarettes" ||
        self.filtering.xAxisSet === "Gender" ||
        self.filtering.xAxisSet === "Marital status") {
        self.svgMarginBottom = 50;
    }
    if (self.filtering.xAxisSet === "Annual household income" ||
        self.filtering.xAxisSet === "Dark green vegetables available at home" ||
        self.filtering.xAxisSet === "Fat-free/low fat milk available at home" ||
        self.filtering.xAxisSet === "Fruits available at home" ||
        self.filtering.xAxisSet === "Salty snacks available at home" ||
        self.filtering.xAxisSet === "Soft drinks available at home" ||
        self.filtering.xAxisSet === "Education" ||
        self.filtering.xAxisSet === "Race") {
        self.svgMarginBottom = 63;
    }
    if (self.filtering.xAxisSet === "Do you bike" ||
        self.filtering.xAxisSet === "Ever been in rehabilitation program" ||
        self.filtering.xAxisSet === "Ever have 5 or more drinks every day?" ||
        self.filtering.xAxisSet === "Ever use any form of cocaine" ||
        self.filtering.xAxisSet === "Ever used heroin" ||
        self.filtering.xAxisSet === "Ever used marijuana or hashish" ||
        self.filtering.xAxisSet === "Ever used methamphetamine" ||
        self.filtering.xAxisSet === "Had at least 12 alcohol drinks/1 yr?" ||
        self.filtering.xAxisSet === "Had sex with new partner/year"  ||
        self.filtering.xAxisSet === "Smoked at least 100 cigarettes in life") {
        self.svgMarginBottom = 20;
    }
    if (self.filtering.xAxisSet === "Money spent at supermarket/grocery store" ||
        self.filtering.xAxisSet === "Money spent on carryout/delivered foods" ||
        self.filtering.xAxisSet === "Money spent on eating out") {
        self.svgMarginBottom = 30;
    }
    self.svgGraphWidth = self.svgWidth - self.svgMarginLeft;
    self.svgGraphHeight = self.svgHeight - self.svgMarginBottom - self.svgMarginTop;

    // check count of displayData for ordinal data
    if (self.displayData && self.displayData.length) {
        for (i = 0; i < self.displayData.length; i++) {
            if (self.displayData[i].count) {
                noCount = false;
                break;
            }
        }
    }

    // we have no data to display
    if (!self.displayData || self.displayData.length === 0 || noCount) {
        selGraph = self.svg.select(".graph")
            .attr("transform", "translate(" + self.svgMarginLeft + "," + (self.svgMarginTop)  + ")");     
        
        selGraph.selectAll("text").remove();
        selGraph.selectAll("rect").remove();
        
        selGraph.append("text")
            .attr("x", self.svgMarginTop + 40) 
            .attr("width", self.svgGraphWidth)
            .attr("y", self.svgMarginLeft + 10)
            .attr("height", self.svgGraphHeight)
            .text("No data for selection");
            
        self.svg.select(".xAxis")
            .attr("display", "none");
    
        self.svg.select(".yAxis")
            .attr("display", "none");
        return;
    }

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
    if (self.filtering.xAxisSet === "# days used marijuana or hashish/month" ||
        self.filtering.xAxisSet === "# days used methamphetamine/month" ||
        self.filtering.xAxisSet === "# of days used cocaine/month" ||
        self.filtering.xAxisSet === "# of days used heroin/month") {
        xMax = 30;
    }
    // yMin = d3.min(self.displayData, function (d) {
    //             return d.count;
    //         });
    yMin = 0;
  
    dataValues = self.displayData.map(function (d) {
        return d.value;
    }); 
       
    // odd exception: fix displayData
    if (self.filtering.xAxisSet === "How old when first had sex" ||
        self.filtering.xAxisSet === "Age") {
        tempDisplayData = [];
        i = 0;
        for (j = xMin; j <= xMax; j++) {
            if (self.displayData[i].value === j) {
                tempDisplayData.push(self.displayData[i]);
                i++;
            }
            else {
                tempDisplayData.push({value: j, count: 0});
            }
        }
        self.displayData = tempDisplayData;
    }

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
        
    self.iScale = d3.scale.ordinal()
        .domain(d3.range(0, dataValues.length))
        .rangeBands([0, self.svgGraphWidth], 0);
    
    // if we exclude the 0 value, make sure to show a xMin (1) tick at least
    ticks = self.xScale.ticks();
    // only have as many ticks as data values (if few data values)
    if (ticks.length > self.displayData.length) {
        ticks = self.xScale.ticks(self.displayData.length - 1);
    }
    if (self.filtering.xAxisSet === "# days used marijuana or hashish/month" ||
        self.filtering.xAxisSet === "# days used methamphetamine/month" ||
        self.filtering.xAxisSet === "# of days used cocaine/month" ||
        self.filtering.xAxisSet === "# of days used heroin/month") {
        ticks = self.xScale.ticks(10);
    }
    // if we have no ticks, then we only have 1 displayData value: add it
    if (ticks.length === 0) {
        ticks.push(self.displayData[0].value);
    }
    if (self.filtering.excludeInRange === "0") {
        ticks.push(xMin);
    }

    // setup axis
    if (self.filtering.xAxisSet === "# times had sex without condom/year" ||
        self.filtering.xAxisSet === "# times had vaginal or anal sex/year" ||
        self.filtering.xAxisSet === "Annual household income" ||
        self.filtering.xAxisSet === "Dark green vegetables available at home" ||
        self.filtering.xAxisSet === "Do you bike" ||
        self.filtering.xAxisSet === "Do you now smoke cigarettes" ||
        self.filtering.xAxisSet === "Education" ||
        self.filtering.xAxisSet === "Ever been in rehabilitation program" ||
        self.filtering.xAxisSet === "Ever have 5 or more drinks every day?" ||
        self.filtering.xAxisSet === "Ever use any form of cocaine" ||
        self.filtering.xAxisSet === "Ever used heroin" ||
        self.filtering.xAxisSet === "Ever used marijuana or hashish" ||
        self.filtering.xAxisSet === "Ever used methamphetamine" ||
        self.filtering.xAxisSet === "Fat-free/low fat milk available at home" ||
        self.filtering.xAxisSet === "Fruits available at home" ||
        self.filtering.xAxisSet === "Gender" ||
        self.filtering.xAxisSet === "Had at least 12 alcohol drinks/1 yr?" ||
        self.filtering.xAxisSet === "Had sex with new partner/year" ||
        self.filtering.xAxisSet === "Marital status" ||
        self.filtering.xAxisSet === "Race" ||
        self.filtering.xAxisSet === "Salty snacks available at home" ||
        self.filtering.xAxisSet === "Smoked at least 100 cigarettes in life" ||
        self.filtering.xAxisSet === "Soft drinks available at home") {
        self.xScale = d3.scale.ordinal()
            .domain(dataValues)
            .range([0, self.svgGraphWidth]);
            
        self.xAxis = d3.svg.axis()
            .scale(self.iScale)
            .orient("bottom");
            
        self.svg.select(".xAxis")
            .call(self.xAxis)
            .attr("display", null)
            .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (self.svgGraphHeight + 1 + self.svgMarginTop) + ")")
            .selectAll("text")
            .attr("transform", function(d) {
                return "rotate(-30)";
            })
            .attr("x", 2)
            .attr("y", 3)
            .style("text-anchor", "end")
            .text(function (d) {
                return dataValues[d];
            });
    }
    else if (self.filtering.xAxisSet === "Money spent at supermarket/grocery store" ||
        self.filtering.xAxisSet === "Money spent on carryout/delivered foods" ||
        self.filtering.xAxisSet === "Money spent on eating out") {
        self.xAxis = d3.svg.axis()
            .scale(self.xScale)
            .orient("bottom")
            .tickValues(ticks);
        
        // NOTE +/- 1 is for getting the graph off of the axis
        self.svg.select(".xAxis")
            .call(self.xAxis)
            .attr("display", null)
            .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (self.svgGraphHeight + 1 + self.svgMarginTop) + ")")
            .selectAll("text")
            .attr("transform", function(d) {
                return "rotate(-30)";
            })
            .attr("x", 0)
            .attr("y", 8)
            .style("text-anchor", "end");
    }
    else {
        self.xAxis = d3.svg.axis()
            .scale(self.xScale)
            .orient("bottom")
            .tickValues(ticks);
        
        // NOTE +/- 1 is for getting the graph off of the axis
        self.svg.select(".xAxis")
            .call(self.xAxis)
            .attr("display", null)
            .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (self.svgGraphHeight + 1 + self.svgMarginTop) + ")")
            .selectAll("text")
            .attr("transform", function(d) {
                return "rotate(0)";
            })
            .attr("x", 0)
            .attr("y", 8)
            .style("text-anchor", "middle");
    }
    
    self.yAxis = d3.svg.axis()
        .scale(self.invertedYScale)
        .orient("left");

    
    // NOTE +/- 1 is for getting the graph off of the axis
    self.svg.select(".yAxis")
        .call(self.yAxis)
        .attr("display", null)
        .attr("transform", "translate(" + (self.svgMarginLeft - 1) + "," + (1 + self.svgMarginTop) + ")");

    // setup graph

    selGraph = self.svg.select(".graph")
        .attr("transform", "translate(" + self.svgMarginLeft + "," + (self.svgMarginTop)  + ")");

    //selGraph.selectAll("path").remove();
    selGraph.selectAll("text").remove();

    selGraph = selGraph.selectAll("rect")
        .data(self.displayData);

    selGraph.enter()
        .append("rect");

    selGraph.exit()
        .remove();

    selGraph.selectAll("title").remove();
    
    selGraph.attr("x", function (d, i) {
        return i * (self.svgGraphWidth  / self.displayData.length);
    }) 
    .attr("width", function (d, i) {
        return self.svgGraphWidth  / self.displayData.length;
    })
    .attr("y", function (d) {
        return self.yScale(yMax) - self.yScale(d.count);
    })
    .attr("height", function (d) {
        return self.yScale(d.count);
    })
    .append("svg:title")
    .text(function (d) {
        return "Value: " + d.value + "\nCount: " + d.count;
    });
    
    if (self.filtering.xAxisSet === "# days used marijuana or hashish/month" ||
        self.filtering.xAxisSet === "# days used methamphetamine/month" ||
        self.filtering.xAxisSet === "# of days used cocaine/month" ||
        self.filtering.xAxisSet === "# of days used heroin/month" ||
        self.filtering.xAxisSet === "# sex partners five years older/year" ||
        self.filtering.xAxisSet === "# sex partners five years younger/year" ||
        self.filtering.xAxisSet === "Age started smoking cigarettes regularly" ||
        self.filtering.xAxisSet === "Avg # alcoholic drinks/day -past 12 mos" ||
        self.filtering.xAxisSet === "Avg # cigarettes/day during past 30 days" ||
        self.filtering.xAxisSet === "Day vigorous recreation / week" ||
        self.filtering.xAxisSet === "Days walk or bike / week" ||
        self.filtering.xAxisSet === "Money spent at supermarket/grocery store" ||
        self.filtering.xAxisSet === "Money spent on carryout/delivered foods" ||
        self.filtering.xAxisSet === "Money spent on eating out" ||
        self.filtering.xAxisSet === "Total number of sex partners/year") {
        selGraph.attr("x", function (d, i) {
            if (self.filtering.xAxisSet === "Days walk or bike / week" ||
                self.filtering.xAxisSet === "Day vigorous recreation / week" ||
                self.filtering.xAxisSet === "Money spent at supermarket/grocery store" ||
                self.filtering.xAxisSet === "Money spent on carryout/delivered foods" ||
                self.filtering.xAxisSet === "Money spent on eating out" ||
                self.filtering.xAxisSet === "Total number of sex partners/year") {
                return (d.value) * (self.svgGraphWidth  / (xMax + 1));
            }
            return (d.value - 1) * (self.svgGraphWidth  / xMax);
        }) 
        .attr("width", function (d, i) {
            if (self.filtering.xAxisSet === "Days walk or bike / week" ||
                self.filtering.xAxisSet === "Day vigorous recreation / week" ||
                self.filtering.xAxisSet === "Money spent at supermarket/grocery store" ||
                self.filtering.xAxisSet === "Money spent on carryout/delivered foods" ||
                self.filtering.xAxisSet === "Money spent on eating out" ||
                self.filtering.xAxisSet === "Total number of sex partners/year") {
                return self.svgGraphWidth  / (xMax + 1);
            }
            return self.svgGraphWidth  / xMax;
        });
    }

    // areaGenerator = d3.svg.area()
    // .x(function (d) {
    //     return self.xScale(d.value);
    // })
    // .y0(self.yScale(yMax))
    // .y1(function (d) {
    //     return self.yScale(yMax) - self.yScale(d.count);
    // });

    // selGraph.append("path")
    //     .attr("d", areaGenerator(self.displayData));
};


GraphVis.prototype.changeAxisLabel = function (newAxisSet) {
    var ex;
    var self = this;
    self.filtering.xAxisSet = newAxisSet;
    if (newAxisSet === "# days used marijuana or hashish/month" ||
        newAxisSet === "# days used methamphetamine/month" ||
        newAxisSet === "# of days used cocaine/month" ||
        newAxisSet === "# of days used heroin/month" ||
        newAxisSet === "# sex partners five years older/year" ||
        newAxisSet === "# sex partners five years younger/year" ||
        newAxisSet === "Avg # alcoholic drinks/day -past 12 mos" ||
        newAxisSet === "Avg # cigarettes/day during past 30 days" ||
        newAxisSet === "Money spent on carryout/delivered foods") {
        self.filtering.excludeInRange = "0";
    }
    else if (newAxisSet === "Age started smoking cigarettes regularly" ||
    newAxisSet === "How old when first had sex") {
        self.filtering.excludeInRange = "Never";
    }
    else {
        self.filtering.excludeInRange = null;
    }
    
    // reset exclusion text
    ex = document.getElementById(self.filtering.id + "Exclusion");
    ex.innerHTML = "";
    self.updateData();
    self.initializeVis();
};

/**
 * Gets called by event handler and should update data based on filter.
 * @param selection
 */
GraphVis.prototype.onSelectionChange = function () {
    var self = this;
    //console.log(self.filteringOutput);
    self.updateData();
    self.initializeVis();
};
/**
 * Updates the display data.
 */
GraphVis.prototype.updateData = function () {
    var self = this;
    var i, j,
        objectKeys, foKeys,
        ex,
        value,
        isInArray,
        isSelected,
        tempData = {};

    self.displayData = [];

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

    // get keys for output filtering to determine what needs to be filtered
    if (self.filteringOutput) {
        foKeys = Object.keys(self.filteringOutput);
    }
    //console.log(self.filteringOutput);
    for (i = 0; i < self.data.length; i++) {
        isSelected = true;
        if (foKeys) {
            for (j = 0; j < foKeys.length; j++) {
                if (isInArray(self.data[i][foKeys[j]], self.filteringOutput[foKeys[j]])) {
                    isSelected = false;
                    break;
                }
            }
        }
        if (isSelected) {
            if (!tempData[self.data[i][self.filtering.xAxisSet]]) {
                tempData[self.data[i][self.filtering.xAxisSet]] = 0;
            }
            tempData[self.data[i][self.filtering.xAxisSet]] += 1;
        }
    }

    objectKeys = Object.keys(tempData);
    for (i = 0; i < objectKeys.length; i++) {
        value = objectKeys[i];
        // exclude cases that really scew the data.  We will display it separately
        if (self.filtering.excludeInRange && self.filtering.excludeInRange === value) {
            // set exclusion text, if any
            ex = document.getElementById(self.filtering.id + "Exclusion");
            ex.innerHTML = "*Excluding " + value + " with count of " + tempData[objectKeys[i]];
           continue;
        }
        // some sets are continous
        if (self.filtering.xAxisSet === "Age" ||
            self.filtering.xAxisSet === "# days used marijuana or hashish/month" ||
            self.filtering.xAxisSet === "# days used methamphetamine/month" ||
            self.filtering.xAxisSet === "# of days used cocaine/month" ||
            self.filtering.xAxisSet === "# of days used heroin/month" ||
            self.filtering.xAxisSet === "# sex partners five years older/year" ||
            self.filtering.xAxisSet === "# sex partners five years younger/year" ||
            self.filtering.xAxisSet === "Age started smoking cigarettes regularly" ||
            self.filtering.xAxisSet === "Avg # alcoholic drinks/day -past 12 mos" ||
            self.filtering.xAxisSet === "Avg # cigarettes/day during past 30 days" ||
            self.filtering.xAxisSet === "Day vigorous recreation / week" ||
            self.filtering.xAxisSet === "Days walk or bike / week" ||
            self.filtering.xAxisSet === "How old when first had sex" ||
            self.filtering.xAxisSet === "Money spent at supermarket/grocery store" ||
            self.filtering.xAxisSet === "Money spent on carryout/delivered foods" ||
            self.filtering.xAxisSet === "Money spent on eating out" ||
            self.filtering.xAxisSet === "Total number of sex partners/year") {
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
GraphVis.prototype.sortData = function () {
    var self = this;
    var i, lookup = {},
        tempData = [];

    // create a lookup object
    // CITE: Aaron Digulla, Sep 9 2011 retrieved on Nov 10 2015
    // SOURCE: http://stackoverflow.com/questions/7364150/find-object-by-id-in-array-of-javascript-objects
    for (i=0; i < self.displayData.length; i++) {
        lookup[self.displayData[i].value] = self.displayData[i];
    }
    
    function addLookupValue(value) {
        if (lookup[value]) {
            tempData.push(lookup[value]);
        }
        else {
            tempData.push({value: value, count: 0});
        }
    }

    if (self.filtering.xAxisSet === "Annual household income") {
        addLookupValue("Don't know");
        addLookupValue("$0 to $4,999");
        addLookupValue("$5,000 to $9,999");
        addLookupValue("$10,000 to $14,999");
        addLookupValue("$15,000 to $19,999");
        addLookupValue("$20,000 to $24,999");
        addLookupValue("$25,000 to $34,999");
        addLookupValue("$35,000 to $44,999");
        addLookupValue("$45,000 to $54,999");
        addLookupValue("$55,000 to $64,999");
        addLookupValue("$65,000 to $74,999");
        addLookupValue("$75,000 to $99,999");
        addLookupValue("$100,000 and Over");
    }
    else if (self.filtering.xAxisSet === "Education") {
        addLookupValue("< 9th Grade");
        addLookupValue("9-11th Grade");
        addLookupValue("High School Grad");
        addLookupValue("Some College");
        addLookupValue("College Grad");
    }
    else if (self.filtering.xAxisSet === "Marital status") {
        addLookupValue("No answer");
        addLookupValue("Never married");
        addLookupValue("With partner");
        addLookupValue("Married");
        addLookupValue("Divorced");
        addLookupValue("Separated");
        addLookupValue("Widowed");
    }
    else if (self.filtering.xAxisSet === "Race") {
        addLookupValue("Other");
        addLookupValue("Black");
        addLookupValue("White");
        addLookupValue("Hispanic");
        addLookupValue("Mexican American");
    }
    else if (self.filtering.xAxisSet === "Dark green vegetables available at home" ||
        self.filtering.xAxisSet === "Fruits available at home" ||
        self.filtering.xAxisSet === "Fat-free/low fat milk available at home" ||
        self.filtering.xAxisSet === "Salty snacks available at home" ||
        self.filtering.xAxisSet === "Soft drinks available at home") {
        addLookupValue("Never");
        addLookupValue("Rarely");
        addLookupValue("Sometimes");
        addLookupValue("Most of the time");
        addLookupValue("Always");
    }
    else if (self.filtering.xAxisSet === "# times had sex without condom/year") {
        addLookupValue("No sex");        
        addLookupValue("Never");
        addLookupValue("< Half the time");
        addLookupValue("Half the time");        
        addLookupValue("> Half the time");
        addLookupValue("Always");
    }
    else if (self.filtering.xAxisSet === "# times had vaginal or anal sex/year") {
        addLookupValue("Never");        
        addLookupValue("Once");
        addLookupValue("2-11 times");
        addLookupValue("12-51 times");        
        addLookupValue("52-103 times");
        addLookupValue("104-364 times");
        addLookupValue("365+ times");
    }
    else if (self.filtering.xAxisSet === "Do you bike" ||
        self.filtering.xAxisSet === "Ever been in rehabilitation program" ||
        self.filtering.xAxisSet === "Ever have 5 or more drinks every day?" ||
        self.filtering.xAxisSet === "Ever use any form of cocaine" ||
        self.filtering.xAxisSet === "Ever used heroin" ||
        self.filtering.xAxisSet === "Ever used marijuana or hashish" ||
        self.filtering.xAxisSet === "Ever used methamphetamine" ||
        self.filtering.xAxisSet === "Had at least 12 alcohol drinks/1 yr?" ||
        self.filtering.xAxisSet === "Had sex with new partner/year" ||
        self.filtering.xAxisSet === "Smoked at least 100 cigarettes in life") {
        addLookupValue("No");        
        addLookupValue("Yes");
    }
    else if (self.filtering.xAxisSet === "Do you now smoke cigarettes") {
        addLookupValue("Not at all");        
        addLookupValue("Some days");
        addLookupValue("Every day");
    }
    else {
        tempData = self.displayData;
    }

    self.displayData = tempData;
};