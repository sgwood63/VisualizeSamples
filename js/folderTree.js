var visualizeObj;
var folderTree;

$(function(){
    visualize({
        auth: {
            name: "joeuser",
            password: "joeuser",
            organization: "organization_1"
        }
    }, function (v) {
		visualizeObj = v;
		folderTree = new VisualizeFolderTree(visualizeObj, '#tree', '/public', ['folder', 'reportUnit', 'dashboard'], null, true, {
		  activate: function(event, data) {
			var selectedNode = data.node;
			if (selectedNode.data.resourceType == 'dashboard') {
				visualizeObj.dashboard({
						resource: selectedNode.key,
						container: "#container",
						error: handleError
				});
			} else if (selectedNode.data.resourceType == 'reportUnit') {
				visualizeObj.report({
						resource: selectedNode.key,
						container: "#container",
						error: handleError
				});
		    } /* else {
				alert(selectedNode);
			} */
		  }
		});
    }, function(err){
		// handle all initialization and authentication errors here
        alert(err.message);
	});
  //show error
});


function handleError(err){
	alert(err.message);
	console.log(err.message);
}
