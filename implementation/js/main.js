// on page load...
$(function(){
    var allData = [];
    var parsedData = [];
    var metaData = {};
    var outputFiltering = {
        brush: {}
    };
    var filterEventHandler = d3.dispatch("toggleFilter", "selectGraph");
    var eventHandler = d3.dispatch("selectionChanged");
    var filterVis = {};
    var filterGroup = "personal";
    var selectedGraph;
    var selectedGraphNumber;
    var filterGroups = ["groupPersonal", "groupDiet"];
    var graphs = {
        lastId: 0
    };

    window.selectGraph = function(id, number) {
        number = parseInt(number);
        var graphSection, i, keys, graphNumber;
        
        if (selectedGraph === id) {
            console.log("already selected graph");
            return;
        }
        //console.log("selecting graph:" + id);
        selectedGraph = id;
        selectedGraphNumber = number;
        //// update visuals
        // remove previous active class
        keys = Object.keys(graphs);
        for (i = 0; i < keys.length; i++) {
            if (keys[i] !== 'lastId') {
                graphNumber = keys[i].split("graph");
                graphNumber = graphNumber[1];
                graphSection = document.getElementById("graphSection" + graphNumber);
                graphSection.className = "single-graph-container";
            }
        }
        
        // add active class
        graphSection = document.getElementById("graphSection" + number);
        graphSection.className += " active";
        
        // update filters
        filterEventHandler.selectGraph(id);
    };

    window.toggleFilter = function(id, show, group, changeGroup) {
        var groupTag, i;

        // changing group
        if (changeGroup) {
            filterGroup = changeGroup;

            for (i=0; i < filterGroups.length; i++) {
                groupTag = document.getElementById(filterGroups[i]);
                if (filterGroups[i] === id) {
                    groupTag.className = "filter-wrapper-active";
                }
                else {
                    groupTag.className = "filter-wrapper-inactive";
                }
            }

            return;
        }
        // don't care about onmouseout
        if (!show) {
            return;
        }
        // keep selected if we are hovering over different groups
        if (group !== filterGroup && !changeGroup) {
            return;
        }
        filterEventHandler.toggleFilter(id, show, changeGroup);
    };
    
    window.addNewGraph = function() {
        addGraph();
    };
    
    window.copyGraph = function(number) {
        var i, keys, filter, j, filterInput, newFilter;

        // copy the filtering from this graph to the newly added graph
        filter = outputFiltering.brush["graph" + number];
        keys = Object.keys(filter);
        
        newFilter = outputFiltering.brush["graph" + (graphs.lastId + 1)] = {};
        
        // filtering inputs
        for (i = 0; i < keys.length; i++) {
            filterInput = filter[keys[i]];
            newFilter[keys[i]] = [];
            // values of deselected items
            for (j = 0; j < filterInput.length; j++) {
                newFilter[keys[i]].push(filterInput[j]);
            }
        }
        debugger;
        addGraph();
    }
    
    window.deleteGraph = function(number) {
        number = parseInt(number);
        var graphSection, keys, i, graphNumber;
        keys = Object.keys(graphs);
        
        // if this is the only graph, it cannot be removed
        // note: keys also contains lastId
        if (keys.length < 3) {
            return;
        }
        
        graphSection = document.getElementById("graphSection" + number);
        // remove the element
        graphSection.parentNode.removeChild(graphSection);
        
        // remove from graph array
        delete graphs["graph" + number];
        
        // update the keys
        keys = Object.keys(graphs);
        
        // if this graph was selected, select a different graph
        debugger;
        if (selectedGraphNumber === number) {
            for (i = 0; i < keys.length; i++) {
                if (keys[i] !== 'lastId') {
                    graphNumber = keys[i].split("graph");
                    graphNumber = graphNumber[1];
                    selectGraph(keys[i], graphNumber);
                    break;
                }
            }
        }
    }
    
    /**
     * Add a graph to the view
     */
    function addGraph() {
        var id, filtering, 
            htmlAddition = "";
        // generate a new graph
        var graphsContainer = document.getElementById("graphsContainer");
        graphs.lastId += 1;

        // filtering.xAxisSet = "# days used marijuana or hashish/month";
        // filtering.excludeInRange = "0";
        // filtering.exclusionId = "graph1Exclusion";
        
        id = "graph" + graphs.lastId;
           
        filtering = {
            xAxisSet: "Age",
            id: id
        };
        
        htmlAddition += "<section id=\"graphSection" + graphs.lastId + "\" class=\"single-graph-container active\">";
        htmlAddition += "<header>";
        htmlAddition += "<h4 onclick=\"selectGraph('" + id + "', '" + graphs.lastId + "')\"><span id=\"" + id + "Name\" class=\"graph-name\">Graph " + graphs.lastId + "</span></h4>";      
        htmlAddition += "<div class=\"delete-graph\" onclick=\"deleteGraph('" + graphs.lastId + "')\"></div><div class=\"copy-graph\" onclick=\"copyGraph('" + graphs.lastId + "')\"></div><div class=\"add-graph\" onclick=\"addNewGraph()\"></div>";
        htmlAddition += "<h6 id=\"" + id + "Exclusion\"  onclick=\"selectGraph('" + id + "', '" + graphs.lastId + "')\"></h6>"; 
        htmlAddition += "</header>";
        htmlAddition += "<div class=\"graph-wrapper\" onclick=\"selectGraph('" + id + "', '" + graphs.lastId + "')\">";
        htmlAddition += "<h5>Count</h5>";
        htmlAddition += "<svg id=\"" + id + "\" width=\"340\" height=\"200\">";
        htmlAddition += "<g class=\"xAxis\"></g><g class=\"yAxis\"></g><g class=\"graph\"></g>";
        htmlAddition += "</svg>";
        htmlAddition += "</div>";
        htmlAddition += "<section class=\"x-axis-label\"><h5>" + filtering.xAxisSet + "</h5></section>";
        htmlAddition += "</section>";
        graphsContainer.innerHTML += htmlAddition;
        
        // bind graph in d3
        graphs[id] = new GraphVis(d3.select("#" + id), allData, metaData, eventHandler, filtering, outputFiltering);
        selectGraph(id, graphs.lastId);      
    }

    /**
     * Data is ready and visualization can begin.
     * Handle events of child classes
     * @return {[type]} [description]
     */
    function initializeVisualizations() {
        var i, keys, addGraphFilter;
        
        addGraphFilter = function(id, setName, group) {
            var idHash = "#" + id;
            filterVis[id] = new FilterVis(d3.select(idHash), allData, metaData, eventHandler, {set: setName, id: id, group: group, graph: selectedGraph}, outputFiltering);            
        };
              
        addGraph();
        
        // filter graphs        
        addGraphFilter("filterVisIncome", "Annual household income", "personal");
        addGraphFilter("filterVisAge", "Age", "personal");
        addGraphFilter("filterVisEducation", "Education", "personal");
        addGraphFilter("filterVisGender", "Gender", "personal");
        addGraphFilter("filterVisMarital", "Marital status", "personal");
        addGraphFilter("filterVisRace", "Race", "personal");
        
        addGraphFilter("filterVisGreen", "Dark green vegetables available at home", "diet");
        addGraphFilter("filterVisFruit", "Fruits available at home", "diet");
        addGraphFilter("filterVisMilk", "Fat-free/low fat milk available at home", "diet");
        addGraphFilter("filterVisSalt", "Salty snacks available at home", "diet");
        addGraphFilter("filterVisSoft", "Soft drinks available at home", "diet");
        addGraphFilter("filterVisStore", "Money spent at supermarket/grocery store", "diet");
        addGraphFilter("filterVisCarry", "Money spent on carryout/delivered foods", "diet");
        addGraphFilter("filterVisOut", "Money spent on eating out", "diet");
        
        // output graphs
        // filtering.xAxisSet = "Age";
        // var graphVis = new GraphVis(d3.select("graphVis1"), allData, metaData, eventHandler, filtering, outputFiltering);
        // filtering.xAxisSet = "# days used marijuana or hashish/month";
        // filtering.excludeInRange = "0";
        // filtering.exclusionId = "graph2Exclusion";
        // var graphVis2 = new GraphVis(d3.select("#graphVis2"), allData, metaData, eventHandler, filtering, outputFiltering);
        
        // Bind the eventHandler to the Objects
        eventHandler.on("selectionChanged.main", function () {
            graphs[selectedGraph].onSelectionChange();
        });

        filterEventHandler.on("toggleFilter.main", function (id, show) {
            //filterVis[id].onToggleFilter(id);
            keys = Object.keys(filterVis);
            for (i = 0; i < keys.length; i++) {
                filterVis[keys[i]].onToggleFilter(id, filterGroup);
            }  
        });
        
        filterEventHandler.on("selectGraph.main", function (id) {
            keys = Object.keys(filterVis);
            for (i = 0; i < keys.length; i++) {
                filterVis[keys[i]].selectGraph(id);
            }
            graphs[selectedGraph].onSelectionChange();
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
                allData[i]["Annual household income"] = "Don't know";
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
                allData[i]["Marital status"] = "No answer";
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

            // shorten
            if (allData[i]["Education"] === "9-11th Grade (Includes 12th grade with no diploma)") {
                allData[i]["Education"] = "9-11th Grade";
            }
            else if (allData[i]["Education"] === "College Graduate or above") {
                allData[i]["Education"] = "College Grad";
            } 
            else if (allData[i]["Education"] === "High School Grad/GED or Equivalent") {
                allData[i]["Education"] = "High School Grad";
            } 
            else if (allData[i]["Education"] === "Less Than 9th Grade") {
                allData[i]["Education"] = "< 9th Grade";
            } 
            else if (allData[i]["Education"] === "Some College or AA degree") {
                allData[i]["Education"] = "Some College";
            } 

            if (allData[i]["Marital status"] === "Living with partner") {
                allData[i]["Marital status"] = "With partner";
            } 

            if (allData[i]["Race"] === "Non-Hispanic Black") {
                allData[i]["Race"] = "Black";
            }
            else if (allData[i]["Race"] === "Non-Hispanic White") {
                allData[i]["Race"] = "White";
            }
            else if (allData[i]["Race"] === "Other Hispanic") {
                allData[i]["Race"] = "Hispanic";
            }    
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
