var reportUri = "/public/Samples/Reports/Cascading_Report_2_Updated";
var placeReportUri = "/public/Samples/Reports/Cascading_Customers";
var report;
var visualizeObj;

var product_hierarchy = "Product_Family";

var place_hierarchy = "Country_multi_select";

var productTree, placeTree;

$(function(){
    visualize({
        auth: {
            name: "jasperadmin",
            password: "jasperadmin",
            organization: "organization_1"
        }
    }, function (v) {
		visualizeObj = v;

		// new VisualizeCascadingTree(visualizeObj, '#tree', top input control name of hierarchy, reportUri, nodeInitializationFunction, bootstrap, treeOptions)
		productTree = new VisualizeCascadingTree(visualizeObj, '#tree', product_hierarchy, reportUri, null, true);

		placeTree = new VisualizeCascadingTree(visualizeObj, '#placeTree', place_hierarchy, placeReportUri, countryTreeNode, true);

		// default rendering of report
		report = visualizeObj.report({
            resource: reportUri,
            container: "#container",
            params: {
                "Product_Family": ["All"],
                "Product_Department": ["All"],
                "Product_Category": ["All"],
                "Product_Name": ["All"]
            },
			error: handleError
        });
    }, function(err){
		// handle all initialization and authentication errors here
        alert(err.message);
		console.log(err);
 	});
  //show error
    function handleError(err){
        alert(err.message);
		console.log(err);
    }
});

function runReport() {
	var params = productTree.getSelectedAsParamsArray();
	var placeParams = placeTree.getSelectedAsParamsArray();
	// I am converting a parameter name to suit the target report
	$.extend(params, { Country: placeParams.Country_multi_select } );
	report.params(params).run();
}

/*
	not used
 */
function runReport1(selectedParamsArray) {
	console.log(selectedParamsArray);
	report.params(selectedParamsArray).run();
}

/*
	not used
 */
function runReport2(selectedParamsArray) {
	// need to convert from the original report IC names to
	// the current report IC names
	var newICs = {};
	newICs.Country = selectedParamsArray["Country_multi_select"];
	console.log(newICs);
	report.params(newICs).run();
}

/*
	Label for this IC is Country | State | City.
	Just want to show the lowest value as title on node.
 */
function countryTreeNode(aResult, iC, isBottomOfHierarchy) {
	return { key: aResult.value,
					 title: aResult.value,
					 icon: false,
					 lazy: !isBottomOfHierarchy };
}
