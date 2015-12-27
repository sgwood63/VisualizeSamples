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
	
	new VisualizeCascadingTree(visualizeObj, '#tree', product_hierarchy, reportUri, nodeInitializationFunction, bootstrap, treeOptions)
 */
function VisualizeCascadingTree(visualizeObj,
									divSelector,
									aHierarchyName,
									reportUri,
									nodeInitializationFunction,
									bootstrap,
									treeOptions) {
	//nodeSelectFunction,
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
	
	//console.log("initializing tree for div" + divSelector);
	
	this.visualizeObj = visualizeObj;
	this.divSelector = divSelector;
	this.topOfHierarchy = aHierarchyName;
	this.reportUri = reportUri;
	this.nodeInitializationFunction = nodeInitializationFunction;
	this.bootstrap = bootstrap;
	this.treeOptions = treeOptions;

	this.tree = null;
	this.hierarchy = null;
	this.singleSelectCount = 0;
	
	var context = this;
	this.inputControls = this.visualizeObj.inputControls({
		resource: this.reportUri,
		success: function(data) { context.topLevel(data); },
		error: this.handleError
	});

};

VisualizeCascadingTree.prototype = {
	topLevel: function(data) {
	  //console.log(data);
	  
	  var context = this;
	  var treeData = [];
	  
	  var topLevel = _.findWhere(data, {
		id: context.topOfHierarchy
	  });

	  if (topLevel === undefined) {
		  return treeData;
	  }
	  
	  // Get the hierarchy from the ICs
	  // We use the nominated top of the hierarchy to find the other levels
	  // So the top level should have no master dependencies
	  if (topLevel.masterDependencies.length != 0) {
		  throw hierarchy + " is not the top level";
	  }
	  
	  // Find the other levels
	  context.hierarchy = context.getInputControlHierarchy(data, topLevel);
	  //console.log(context.hierarchy);
	  _.each(context.hierarchy, function(iC) {
		if (iC.type == "singleSelect") {
			context.singleSelectCount++;
		}
	  });

  	  _.each(topLevel.state.options, function (option) {
		treeData.push( context.getChild(option, false) );
	  });

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

	  if (treeOptions.selectMode == undefined) {
		  // if all are single selects, do single select, otherwise multi-select
		  treeOptions.selectMode = context.singleSelectCount == context.hierarchy.length ? 1 : 3;
		  treeOptions.checkbox = true;
	  }
	  
	  if (treeOptions.select == undefined) {
		  treeOptions.select = function (event, data) {
			  context.handleSelect(event, data);
		  }
	  }
	  
	  if (treeOptions.lazyLoad == undefined) {
		  treeOptions.lazyLoad = function(event, data) {
			  var dfd = new $.Deferred();
			  data.result = dfd.promise();
			  var node = data.node;
			  var depth = context.nodeDepth(node);
			  var paramObj = context.inputControlParamsForHierarchy(node, depth);
	  
			  // call inputControls to get the children
			  context.inputControls.params(paramObj).run(
				function(inputControlsArray) {
					var newChildren = context.getChildren(inputControlsArray,
										node, 
										depth);
					dfd.resolve(newChildren);
				}
			  );
		  }
	  }
	  
	  context.treeOptions = treeOptions;
	  
	  context.tree = $(context.divSelector).fancytree( context.treeOptions );
	  
	},


	nodeDepth: function(node) {
	  var depth = -1;
	  var currNode = node;
	  /*
	  There is a root node to avoid with a null parent ie.
	  root
		Product Families
			Product Departments
			...
	  */
	  do {
		depth++;
		currNode = currNode.parent;
	  } while (currNode != null);
	  return depth;
	},

	inputControlParamsForHierarchy: function(node, depth) {
	  var paramObj = {};
	  var i;
	  var currNode = node;
	  for (i = depth - 1; i >= 0; i--) {
		paramObj[this.hierarchy[i].id] = [ currNode.key ];
		currNode = currNode.parent;
	  }
	  return paramObj;
	},

	getChildren: function(icArray, node, depth) {
		var context = this;
		/*
		We called with node values.
		We get the result in the IC from the next value in the hierarchy in
		the IC.
		*/
		var ic = _.findWhere(icArray, {
			id: this.hierarchy[depth].id
		});

		var children = [];
		if (ic === undefined) {
			return children;
		}
		var isBottomOfHierarchy = this.nodeIsBottomOfHierarchy(node, depth);
		_.each(ic.state.options, function (option) {
			children.push( context.getChild( option, ic, isBottomOfHierarchy) );
		});
		return children;
	},
	
	nodeIsBottomOfHierarchy: function(node, depth) {
		return depth >= (this.hierarchy.length - 1);
	},

	getChild: function(aResult, inputControl, isBottomOfHierarchy) {
		if (this.nodeInitializationFunction == null) {
			return { key: aResult.value,
					 title: aResult.label,
					 icon: false,
					 lazy: !isBottomOfHierarchy };
		} else {
			return this.nodeInitializationFunction.apply(this, [ aResult, inputControl, isBottomOfHierarchy ]);
		}
	},

	getSelectedAsParamsArray: function() {
		var selNodes = this.tree.fancytree("getTree").getSelectedNodes();
        // convert to parameter array
		var paramsHolder = {};
		var context = this;
        $.map(selNodes, function(node) {
			 var nodeDepth = context.nodeDepth(node);
			 var params = context.inputControlParamsForHierarchy(node, nodeDepth);
			 var i;
			 for (i = nodeDepth - 1; i >= 0; i--) {
				if (paramsHolder[context.hierarchy[i].id] == undefined) {
					paramsHolder[context.hierarchy[i].id] = [ ];
				}
				var paramValue = params[context.hierarchy[i].id][0];
				// If we don't find, add
				if (!_.contains(paramsHolder[context.hierarchy[i].id], paramValue)) {
					paramsHolder[context.hierarchy[i].id].push(paramValue);
				}
			  }
        });
		return paramsHolder;
	},
	
	getInputControlHierarchy: function(icData, topLevel) {
		
		/* from the ICs, find the IC below current that points to this IC
		   lower levels can depend on multiple higher levels - sigh!
		   ie.
		   level	Master dependencies
		   Level 0
		   Level 1: Level 0
		   Level 2: Levels 0,1
		   Level 3: Levels 0,1,2
		   
		   so use the level with the lowest # of master dependencies
		 */
		var hierarchyList = [ topLevel ];
		var level = topLevel;
		//console.log(level);
		var newLevel;
		 do {
			 newLevel = null;
			_.each(level.slaveDependencies, function (dependency) {
				var slaveLevel = _.findWhere(icData, {
					id: dependency
				});
				if (slaveLevel != undefined && 
					_.contains(slaveLevel.masterDependencies, level.id)) {
					if (newLevel == null || slaveLevel.masterDependencies == null ||
						slaveLevel.masterDependencies.length < newLevel.masterDependencies.length)
					newLevel = slaveLevel;
				}
			});
			if (newLevel != null) {
				hierarchyList.push(newLevel);
				level = newLevel;
			}
		 } while (newLevel != null);
		return hierarchyList;
	},
	
	/*
		We have the tree in a multi-select mode, but have to control
		other selections when the hierarchy has single selects ICs in it.
		
		if there is a single select in the hierarchy,
		we have to deselect other nodes that are not in the same hierarchy 
		as the selected node.
		
		eg Single, Multi, Single:
			select a node in a diff node at a SingleSelect level
			-> deselect other nodes at that level and below
		Single, Single, Multi
		
		A node is in the same hierarchy of another node when
		the nodes have an overlap of the nodes in the singleSelect 
		levels.
	 */
	 
	handleSelect: function(event, data) {
		 // check data event = click only, to avoid multiple updates
		   if (data.originalEvent != undefined && data.originalEvent.type == "click") {
			  var node = data.node;
			  var context = this;
			  var depth = this.nodeDepth(node);
			  var i;
			  // for all levels in the hierarchy at the same level as the selected node and above
			  for (i = depth - 1; i >= 0; i--) {
				  var ic = this.hierarchy[i];
				  if (ic.type == "singleSelect") {
					  // deselect other selected nodes at this level and their children
					  var childrenToDeselect = _.filter(node.parent.children,
									function(child) { return child.key != node.key; });
					  _.each(childrenToDeselect, function (aNode) {
							  context.processSubTree(aNode, function(child) {
								  child.setSelected(false);
							  });
						}
					  );
				  }
				  if (node.parent != null) {
					  node = node.parent;
				  }
			  }
		   }
	},
	
	/*
		Recursively process a node and its children
	 */
	processSubTree: function(aNode, process) {
		process.apply(this, [ aNode ]);
		var context = this;
		_.each(aNode.children, function(childNode) {
			context.processSubTree(childNode, process);
		});
	},
	
	//show error
    handleError: function(err){
        alert(err.message);
		console.log(err);
    }
}
