// on page load...
$(function(){
    var allData = [];
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

    // call this function after both files are loaded -- error should be "null" if no error
    function dataReady(error, _allData, _metaData) {
        if (error) {
            console.log("ERROR on data file retrieval: \n" + error.statusText);
            return;
        }

        allData = _allData;
        metaData = _metaData;

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
