// on page load...
$(function(){
    var allData = [];
    var parsedData = [];
    var metaData = {};
    var filtering = {
        xAxisSet: "Age"
    };

    /**
     * Data is ready and visualization can begin.
     * Handle events of child classes
     * @return {[type]} [description]
     */
    function initializeVisualizations() {
        var eventHandler = d3.dispatch("selectionChanged");
        // Instantiate all Vis Objects here
        
        var filterVis = new FilterVis(d3.select("#filterVis"), allData, metaData, eventHandler);
        
        filtering.xAxisSet = "Age";
        var graphVis = new GraphVis(d3.select("#graphVis1"), allData, metaData, eventHandler, filtering);
        filtering.xAxisSet = "# days used marijuana or hashish/month";
        filtering.excludeInRange = "0";
        filtering.exclusionId = "graph2Exclusion";
        var graphVis2 = new GraphVis(d3.select("#graphVis2"), allData, metaData, eventHandler, filtering);
        
        // Bind the eventHandler to the Vis Objects
        eventHandler.on("selectionChanged.main", function (start, end) {
            graphVis.onSelectionChange(start, end);
        });

    }

    /**
     * If the given index of allData[i][key] === null, then instead = 0
     */
    function fromNullToZero(i, key) {
        if (!allData[i][key]) {
            allData[i][key] = 0;
        } 
    }

    /**
     * If the given index of allData[i][key] === null | "Refused" | "Dont know", then instead = "No"
     */
    function fromNullToNo(i, key) {
        if (!allData[i][key] ||
        allData[i][key] === "Refused" ||
        allData[i][key] === "Dont know") {
            allData[i][key] = "No";
        }
    }

    /**
     * Corrects values in allData to be ready for visualization
     */
    function normalizeData() {
        var i;

        for (i=0; i < allData.length; i++) {
            fromNullToZero(i, "# days used marijuana or hashish/month");
            fromNullToZero(i, "# days used methamphetamine/month");
            fromNullToZero(i, "# of days used cocaine/month");
            fromNullToZero(i, "# of days used heroin/month");
            fromNullToZero(i, "# sex partners five years older/year");
            fromNullToZero(i, "# sex partners five years younger/year");
            if (!allData[i]["# times had sex without condom/year"] ||
            allData[i]["# times had sex without condom/year"] === "Dont know" ||
            allData[i]["# times had sex without condom/year"] === "Refused") {
                allData[i]["# times had sex without condom/year"] = "No sex";
            }
            if (!allData[i]["# times had vaginal or anal sex/year"] ||
            allData[i]["# times had vaginal or anal sex/year"] === "Dont know" ||
            allData[i]["# times had vaginal or anal sex/year"] === "Refused") {
                allData[i]["# times had vaginal or anal sex/year"] = "Never";
            }
            if (allData[i]["Annual household income"] === "Dont know" ||
            allData[i]["Annual household income"] === "Over $20,000" ||
            allData[i]["Annual household income"] === "Under $20,000" ||
            allData[i]["Annual household income"] === "Refused") {
                allData[i]["Annual household income"] = null;
            }
            fromNullToZero(i, "Avg # alcoholic drinks/day -past 12 mos");
            fromNullToZero(i, "Avg # cigarettes/day during past 30 days");
            fromNullToZero(i, "Avg # alcoholic drinks/day -past 12 mos");
            fromNullToZero(i, "Avg # alcoholic drinks/day -past 12 mos");
            if (allData[i]["Dark green vegetables available at home"] === "Dont know" ||
            !allData[i]["Dark green vegetables available at home"] ||
            allData[i]["Dark green vegetables available at home"] === "Refused") {
                allData[i]["Dark green vegetables available at home"] = "Sometimes";
            }
            fromNullToZero(i, "Day vigorous recreation / week");
            fromNullToZero(i, "Days walk or bike / week");
            if (allData[i]["Do you bike"] === "Dont know") {
                allData[i]["Do you bike"] = "No";
            }
            if (!allData[i]["Do you now smoke cigarettes"]) {
                allData[i]["Do you now smoke cigarettes"] = "Not at all";
            }
            if (!allData[i]["Education"] ||
            allData[i]["Education"] === "Dont Know" ||
            allData[i]["Education"] === "Refused") {
                allData[i]["Education"] = "Less Than 9th Grade";
            }
            fromNullToNo(i, "Ever been in rehabilitation program");
            fromNullToNo(i, "Ever have 5 or more drinks every day?");
            fromNullToNo(i, "Ever use any form of cocaine");
            fromNullToNo(i, "Ever used heroin");
            fromNullToNo(i, "Ever used marijuana or hashish");
            fromNullToNo(i, "Ever used methamphetamine");    
            if (allData[i]["Fat-free/low fat milk available at home"] === "Dont know" ||
            !allData[i]["Fat-free/low fat milk available at home"] ||
            allData[i]["Fat-free/low fat milk available at home"] === "Refused") {
                allData[i]["Fat-free/low fat milk available at home"] = "Sometimes";
            } 
            if (allData[i]["Fruits available at home"] === "Dont know" ||
            !allData[i]["Fruits available at home"] ||
            allData[i]["Fruits available at home"] === "Refused") {
                allData[i]["Fruits available at home"] = "Sometimes";
            } 
            fromNullToNo(i, "Had at least 12 alcohol drinks/1 yr?"); 
            fromNullToNo(i, "Had sex with new partner/year");
            if (allData[i]["Marital status"] === "Dont know" ||
            !allData[i]["Marital status"] ||
            allData[i]["Marital status"] === "Refused") {
                allData[i]["Marital status"] = "No Answer";
            } 
            fromNullToZero(i, "Money spent at supermarket/grocery store");
            fromNullToZero(i, "Money spent on carryout/delivered foods");
            fromNullToZero(i, "Money spent on eating out");
            if (allData[i]["Salty snacks available at home"] === "Dont know" ||
            !allData[i]["Salty snacks available at home"] ||
            allData[i]["Salty snacks available at home"] === "Refused") {
                allData[i]["Salty snacks available at home"] = "Sometimes";
            }
            fromNullToNo(i, "Smoked at least 100 cigarettes in life");    
            if (allData[i]["Soft drinks available at home"] === "Dont know" ||
            !allData[i]["Soft drinks available at home"] ||
            allData[i]["Soft drinks available at home"] === "Refused") {
                allData[i]["Soft drinks available at home"] = "Sometimes";
            }
            fromNullToZero(i, "Total number of sex partners/year");

            // it's hard to decipher what NULL means...
            delete allData[i]["Tried to quit smoking"];           
        }
    }
    /**
     * FOR DEBUGGING:
     * Parses the data to extract relevant information.
     * @param  {object} data            the data to parse
     */
    function parseData(data, printToConsole) {
        var i, j, value, objectKeys;

        if (!data.length) {
            console.log("No data to parse.");
            return;
        }

        objectKeys = Object.keys(data[0]);

        if (!objectKeys.length) {
            console.log("No data keys to parse.");
            return;
        }

        for (i=0; i < objectKeys.length; i++) {
            // get each key
            parsedData[objectKeys[i]] = {};
            // check the keys value for duplicates
            for (j=0; j < data.length; j++) {
                value = data[j][objectKeys[i]];
                // if value is null, set it to something useful
                if (value === null) {
                    value = "NULL";
                }
                // if we've already tagged this value, increment its value
                if (parsedData[objectKeys[i]][value]) {
                    parsedData[objectKeys[i]][value] += 1;
                }
                // otherwise, add the tag
                else {
                    parsedData[objectKeys[i]][value] = 1;
                }
            }
        }

        if (printToConsole) {
            console.log(parsedData);
        }
    }

    /**
     * Callback once data is loaded
     * @param  {object} error     description of error
     * @param  {object} _allData  data retrieved
     * @param  {object} _metaData metadata - if any
     */
    function dataReady(error, _allData, _metaData) {
        if (error) {
            console.log("ERROR on data file retrieval: \n" + error.statusText);
            console.log(error);
            return;
        }

        allData = _allData;
        metaData = _metaData;

        normalizeData();
        parseData(allData, true);

        initializeVisualizations();
    }

    /**
     * Initialize data files (async) then call dataReady()
     */
    function initializeData() {
        queue()
            .defer(d3.json, 'data/data.json')
            .await(dataReady);
    }
    
    initializeData();
});
