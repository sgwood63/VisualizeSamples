/*
	Cascading input control using Javascript FancyTree control (JQuery based).
	Uses glyphs from Bootstrap, which can be overridden at the CSS level.
	
	Lazy loads cascading data.
	Has action function call at lowest level of tree
	
	depends on:
	
	<script src="js/jquery.min.js"></script>  
	<script src="js/jquery-ui-1.10.4.custom.min.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script src="js/jquery.fancytree-all.min.js"></script>
	<script src="js/underscore-min.js"></script>
	,
 */
function VisualizeFolderTree(visualizeObj,
	divSelector,
	startingUri,
	resourceTypes,
	nodeInitializationFunction,
	bootstrap,
	treeOptions) {
	this.glyph_opts = {
		map: {
		  doc: "glyphicon glyphicon-file",
		  docOpen: "glyphicon glyphicon-file",
		  checkbox: "glyphicon glyphicon-unchecked",
		  checkboxSelected: "glyphicon glyphicon-check",
		  checkboxUnknown: "glyphicon glyphicon-share",
		  dragHelper: "glyphicon glyphicon-play",
		  dropMarker: "glyphicon glyphicon-arrow-right",
		  error: "glyphicon glyphicon-warning-sign",
		  expanderClosed: "glyphicon glyphicon-plus-sign",
		  expanderLazy: "glyphicon glyphicon-plus-sign",  // glyphicon-expand
		  expanderOpen: "glyphicon glyphicon-minus-sign",  // glyphicon-collapse-down
		  folder: "glyphicon glyphicon-folder-close",
		  folderOpen: "glyphicon glyphicon-folder-open",
		  loading: "glyphicon glyphicon-refresh"
		}
	};

	
	this.visualizeObj = visualizeObj;
	this.divSelector = divSelector;
	this.startingUri = (startingUri == null ? '/' : startingUri);
	this.resourceTypes = resourceTypes;
	this.nodeInitializationFunction = nodeInitializationFunction;
	this.bootstrap = bootstrap;
	this.treeOptions = treeOptions;
	
	var context = this;
	var visualizeParams = {
		folderUri: context.startingUri,
		recursive: false,
		success: function(data) { context.topLevel(data); },
		error: context.handleError
	};
	if (context.resourceTypes != undefined && context.resourceTypes != null) {
		visualizeParams.types = context.resourceTypes;
	}
	visualizeObj.resourcesSearch(visualizeParams);
}
	
VisualizeFolderTree.prototype = {
	topLevel: function(results) {
		var context = this;
		var treeData = context.getFolderContents(results);

	  var treeOptions = {};
	  if (context.treeOptions != null) {
	    var x;
		for (x in context.treeOptions) {
			treeOptions[x] = context.treeOptions[x];
		}
	  }
	  
	  treeOptions.source = treeData;
	  if (context.bootstrap) {
		if (Array.isArray(treeOptions.extensions)) {
			if (!_.contains(treeOptions, "glyph")) {
				treeOptions.push("glyph");
			}
		} else {
			treeOptions.extensions = ["glyph"];
		}
		treeOptions.glyph = context.glyph_opts;
	  }
	  
	  if (treeOptions.lazyLoad == undefined) {
		treeOptions.lazyLoad = function(event, data) {
			var dfd = new $.Deferred();
			data.result = dfd.promise();
			var node = data.node;

			var visualizeParams = {
					folderUri: node.key,
					recursive: false,
					success: function(results) {
						dfd.resolve(context.getFolderContents(results));
					},
					error: context.handleError
			}
			if (context.resourceTypes != undefined && context.resourceTypes != null) {
				visualizeParams.types = context.resourceTypes;
			}
			context.visualizeObj.resourcesSearch(visualizeParams);
		};
	  }
	  context.treeOptions = treeOptions;
	  
	  context.tree = $(context.divSelector).fancytree( context.treeOptions );

	},

	getFolderContents: function(results) {
		var children = [];
		var context = this;
		$.each(results, function() {
			children.push( context.getChild(this) );
		});
		return children;
	},

	getChild: function(aResult) {
		if (this.nodeInitializationFunction == undefined || this.nodeInitializationFunction == null) {
			return { title: aResult.label, key: aResult.uri, resourceType: aResult.resourceType, folder: (aResult.resourceType == "folder"), lazy: (aResult.resourceType == "folder") };
		} else {
			return this.nodeInitializationFunction.apply(this, [ aResult ]);
		}
	},

	//show error
    handleError: function(err){
        alert(err.message);
		console.log(err.message);
    }
}
