var reportUri = "/public/Samples/Reports/Cascading_Report_2_Updated";
var dashboardUri = "/public/Samples/Dashboards/Filtered_Dashboard";
var dashboard;
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
		productTree = new VisualizeCascadingTree(visualizeObj, '#tree', product_hierarchy, reportUri, hull, true);

		// default rendering of report
		dashboard = visualizeObj.dashboard({
            resource: dashboardUri,
            container: "#container",
            params: {
                "Family": ["Food"],
                "Department": ["Produce"],
                "Category": ["Vegetables"],
                "Product": ["High Top Summer Squash", "High Top Onions", "Tell Tale Summer Squash", "Tri-State Shitake Mushrooms"]
            },
			success: function() { console.log(this.data()); },
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

function runDashboard() {
	var params = productTree.getSelectedAsParamsArray();
	var paramsObj = {
		        "Family": params.Product_Family,
                "Department": params.Product_Department,
                "Category": params.Product_Category,
                "Product": params.Product_Name

	}
	dashboard.params(paramsObj).run();
}
