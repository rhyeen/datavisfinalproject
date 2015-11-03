/**
 * FilterVis object
 * @param {object} _parentElement reference to the parent
 * @param {object} _data          reference to the data
 * @param {object} _metaData      reference to the metadata
 */
function FilterVis(_parentElement, _data, _metaData) {
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.displayData = [];

    self.initializeVis();
}


/**
 * Called as initial setup of object.
 * @return {[type]} [description]
 */
FilterVis.prototype.initializeVis = function () {
    var self = this;

    self.svg = self.parentElement.select("svg");

    self.svgWidth = 700;
    self.svgHeight = 400;
};