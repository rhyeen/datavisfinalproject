// on page load...
$(function(){
    var allData = [];
    var parsedData = [];
    var metaData = {};

    /**
     * Data is ready and visualization can begin.
     * Handle events of child classes
     * @return {[type]} [description]
     */
    function initializeVisualizations() {
        var eventHandler = d3.dispatch("selectionChanged");

        // Instantiate all Vis Objects here
        var filterVis = new FilterVis(d3.select("#filterVis"), allData, metaData, eventHandler);
        var graphVis = new GraphVis(d3.select("#graphVis1"), allData, metaData, eventHandler);
        
        // Bind the eventHandler to the Vis Objects
        eventHandler.on("selectionChanged.main", function (start, end) {
            graphVis.onSelectionChange(start, end);
        });

    }

    /**
     * FOR DEBUGGING:
     * Parses the data to extract relevant information .
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
