//initiate canvas
var canvas = new fabric.Canvas('myCanvas');

$(document).ready(function() {
	canvasFunctions();
});

function canvasFunctions(){

	var tool='Select';
	var action='none';
	var color='black'
	var x0, y0;
	var selected = null;
	var mode = "add";
	var copiedObject;   //used for copying objects
	var copiedObjects = new Array();   //used for copying objects
	var cutted = false;   //used for cutting object
	var group;   //used for grouping
	var state = [];  //used for undo/redo - stores states
	var mods = 0;	//used for undo/redo - stores number of undos/states
	var savedCanvas;  //used to save the current canvas

	//set the mode
	$(".mode").click(function(){
		tool = $(this).attr('id');
		var currentTool = document.getElementById("currentTool");
		currentTool.textContent = "Current Mode: " + tool;
		canvas.isDrawingMode = false; //don't draw until "Freeline" is clicked
	});

	//set the action
	$(".action").click(function(){
		action = $(this).attr('id');
		var currentAction = document.getElementById("currentAction");
		currentAction.textContent = "Current Action: " + action;
		canvas.isDrawingMode = false;
	});

	//set the fill color
	$(".color").click(function(){
		color=$(this).attr('id');
		canvas.freeDrawingBrush.color=color;
		var currentColor = document.getElementById("currentColor");
		currentColor.textContent = "Current Colour: " + color;
	});

	//clear the canvas
	$("#Clear").click(function(){
		canvas.clear();
		mode = 'add';
	});

	$("#Delete").click(function(){
	    canvas.isDrawingMode = false;
	    deleteObjects();
	});

	$("#Copy").click(function(){
	    canvas.isDrawingMode = false;
	    copyObjects();
	});

	$("#Paste").click(function(){
	    canvas.isDrawingMode = false;
	    pasteObjects();
	});

	$("#Cut").click(function(){
	    canvas.isDrawingMode = false;
	    cutObjects();
	});

	$("#Group").click(function(){
	    canvas.isDrawingMode = false;
	    groupObjects();
	});

	$("#Ungroup").click(function(){
	    canvas.isDrawingMode = false;
	    ungroupObjects();
	});

	$("#Undo").click(function(){
	    canvas.isDrawingMode = false;
	    Undo();
	});

	$("#Redo").click(function(){
	    canvas.isDrawingMode = false;
	    Redo();
	});

	$("#Save").click(function(){
	    canvas.isDrawingMode = false;
	    saveCanvas();
	});

	$("#Load").click(function(){
	    canvas.isDrawingMode = false;
	    loadCanvas();
	});

	//mouse clicked downwards
	canvas.observe('mouse:down',function(options){
		var pointer = canvas.getPointer(options.e);
		x0 = pointer.x; //get initial starting point of x
		y0 = pointer.y; //get initial starting point of y
		canvas.isDrawingMode = false;
		switch(tool){
			case 'Freeline':{
				canvas.isDrawingMode = true; //this takes care of mouse movement as well
				canvas.freeDrawingBrush.width = 2;
				break;
			}
			case 'Straightline':{
				var coordinates = [x0, y0, x0, y0]; //set initial coordinates of straight line to the mouse point
				var line = new fabric.Line(coordinates, options = {
					strokeWidth: 3,
					stroke: color
				});
				canvas.add(line);
				updateModifications(true); //add modification into state array
				selected = line;
				break;
			}
			case 'Rectangle':{
				var rectangle = new fabric.Rect({
					top: y0, //set initial y0 of rectangle at y of mouse
					left: x0, //set initial x0 of rectangle at x of mouse
					fill: color
				});
				canvas.add(rectangle);
				updateModifications(true); //add modification into state array
				selected = rectangle;
				break;
			}
			case 'Square':{
				var square = new fabric.Rect({
					top: y0, //set initial y0 of rectangle at y of mouse
					left: x0, //set initial x0 of rectangle at x of mouse
					fill: color
				});
				canvas.add(square);
				updateModifications(true); //add modification into state array
				selected = square;
				break;
			}
			case 'Ellipse':{
				var ellipse = new fabric.Ellipse({
					originX: 'center', //set X point to start at the center
					originY: 'center', //set Y point to start at the center
					top: y0,
					left: x0,
					fill:color,
					rx: 0,
					ry: 0
				});
				canvas.add(ellipse);
				updateModifications(true); //add modification into state array
				selected = ellipse;
				break;
			}
			case 'Circle':{
				var circle = new fabric.Circle({
					originX: 'center', //set X point to start at the center
					originY: 'center', //set Y point to start at the center
					top: y0,
					left: x0,
					fill: color,
					radius: 0
				});
				canvas.add(circle);
				updateModifications(true); //add modification into state array
				selected = circle;
				break;
			}
			case 'Polygon':{
				if(mode == "add"){
					var polygon = new fabric.Polygon([{x: x0, y: y0}, {x: x0 + 0.5, y: y0 + 0.5}], {
			            fill: color,
			            selectable: false,
			        });
			        selected = polygon;
			        canvas.add(polygon);
			        updateModifications(true); //add modification into state array
			        mode = "edit";
			    }
			    else if(mode == "edit" && selected!==null && selected.type == "polygon"){
			    	var points = selected.get("points");
			    	points.push({x: x0 - selected.get("left"), y: y0 - selected.get("top")});
			    	selected.set({points: points});
			    	canvas.renderAll();
			    }
			}
		}
	});

	//when mouse is moving
	canvas.observe('mouse:move',function(options){
		var pointer = canvas.getPointer(options.e);
		var x2 = pointer.x; //get the current value of X
		var y2 = pointer.y; //get the current value of Y
		var changeInX = x2 - x0; //get the change in X relative to x0
		var changeInY = y2 - y0; //get the change in Y relative to y0
		switch(tool){
			case 'Straightline':{
				if(selected!==null){
					selected.set({
						x2: x2, //set the line's x2 to the current X value of the mouse
						y2: y2  //set the line's y2 to the current Y value of the mouse
					})
				}
				canvas.renderAll();
				break;
			}
			case 'Rectangle':{
				if(selected!==null){
					selected.set({
						width: changeInX, //set width of the rectangle to the change from the initial X
						height: changeInY //set the height of the rectangle to the change from the initial Y
					})
				}
				canvas.renderAll();
				break;
			}
			case 'Square':{
				if(Math.abs(changeInX) >= Math.abs(changeInY)){
					if(changeInX > 0){
						if(changeInY < 0)
							changeInY = -changeInX; //TOP RIGHT: Y gets value of -X
						else
							changeInY = changeInX; //BOTTOM RIGHT: Y gets value of X
					}
					else if(changeInX < 0){
						if(changeInY < 0)
							changeInY = changeInX; //TOP LEFT: Y gets value of X
						else
							changeInY = -changeInX; //BOTTOM LEFT: Y gets value of -X
					}
				}
				else if(Math.abs(changeInX) < Math.abs(changeInY)){
					if(changeInY > 0){
						if(changeInX < 0)
							changeInX = -changeInY; //BOTTOM LEFT: X gets value of -Y
						else
							changeInX = changeInY; //BOTTOM RIGHT: X gets value of Y
					}
					else if(changeInY < 0){
						if(changeInX < 0)
							changeInX = changeInY; //TOP LEFT: X gets value of Y
						else
							changeInX = -changeInY; //TOP RIGHT: X gets value of -Y
					}
				}

				if(selected!==null){
					selected.set({
						width: changeInX, //set width of the rectangle to the change from the initial X
						height: changeInY //set the height of the rectangle to the change from the initial Y
					})
				}
				canvas.renderAll();
				break;
			}
			case 'Ellipse':{
				if(selected!==null){
					selected.set({
						rx: Math.abs(changeInX),
						ry: Math.abs(changeInY)
					})
				}
				canvas.renderAll();
				break;
			}
			case 'Circle':{
				if(Math.abs(changeInX) >= Math.abs(changeInY))
					changeInY = changeInX;
				else if(Math.abs(changeInX) < Math.abs(changeInY))
					changeInX = changeInY;

				if(selected!==null){
					selected.set({
						radius: Math.abs(changeInX)
					})
				}
				canvas.renderAll();
				break;
			}
			case 'Polygon':{
				if (mode == "edit" && selected!==null){
					var points = selected.get("points");
					points[points.length - 1].x = pointer.x - selected.get("left");
        			points[points.length - 1].y = pointer.y - selected.get("top");
        			selected.set({
            			points: points
			        });
			        canvas.renderAll();
				}
			}
		}
	});

	//when mouse is released
	canvas.observe('mouse:up',function(e){
		// clear the selected object, clear initial start and end points.
		if(mode == 'add'){
			selected = null;
		}
		x0 = 0;
		y0 = 0;
	});

	//function to delete objects
	function deleteObjects(){
		var activeObject = canvas.getActiveObject(),
	    activeGroup = canvas.getActiveGroup();
	    if (activeObject) {
	        canvas.remove(activeObject);
	    }
	    else if (activeGroup) {
	        var objectsInGroup = activeGroup.getObjects();
	        canvas.discardActiveGroup();
	        objectsInGroup.forEach(function(object) {
	        	canvas.remove(object);
	        });
	    }
	}

	//copy the objects then remove them off the canvas
	function cutObjects(){
	    copiedObjects = new Array();
	    if(canvas.getActiveGroup()){
	        canvas.getActiveGroup().getObjects().forEach(function(o){
	            var object = fabric.util.object.clone(o);
	            copiedObjects.push(object);
	        });
	        canvas.remove(canvas.getActiveGroup().getObjects());              
	    }
	    else if(canvas.getActiveObject()){
	        var object = fabric.util.object.clone(canvas.getActiveObject());
	        copiedObject = object;
	        copiedObjects = new Array(); 
	    }

	    //remove objects off canvas
	    var activeObject = canvas.getActiveObject(),
	    activeGroup = canvas.getActiveGroup();
	    if (activeObject) {
	        canvas.remove(activeObject);
	    }
	    else if (activeGroup) {
	        var objectsInGroup = activeGroup.getObjects();
	        canvas.discardActiveGroup();
	        objectsInGroup.forEach(function(object) {
	        	canvas.remove(object);
	        });
	    }
	    cutted = true;
	}

	//store copied objects into array
	function copyObjects(){
	    copiedObjects = new Array();
	    if(canvas.getActiveGroup()){
	        canvas.getActiveGroup().getObjects().forEach(function(o){
	            var object = fabric.util.object.clone(o);
	            copiedObjects.push(object);
	        });             
	    }
	    else if(canvas.getActiveObject()){
	        var object = fabric.util.object.clone(canvas.getActiveObject());
	        copiedObject = object;
	        copiedObjects = new Array();
	        
	    }
	}

	//paste copied objects onto canvas
	function pasteObjects(){
		//"copied" so can paste the saved objects as many times
		if(cutted == false){
		    if(copiedObjects.length > 0){
		        for(var i in copiedObjects){
		        	copiedObjects[i]=fabric.util.object.clone(copiedObjects[i]);
					
		            copiedObjects[i].set("top", copiedObjects[i].top+100);
		            copiedObjects[i].set("left", copiedObjects[i].left+100);
		            
		            canvas.add(copiedObjects[i]);
		            canvas.item(canvas.size() - 1).hasControls = true;
		        }                
		    }
		    else if(copiedObject){
		    	copiedObject= fabric.util.object.clone(copiedObject);
				copiedObject.set("top", 150);
		    	copiedObject.set("left", 150);
		        canvas.add(copiedObject);
		        canvas.item(canvas.size() - 1).hasControls = true;
		    }
		}
		//"cutted" so can paste the saved objects only once
		else if(cutted == true){
			if(copiedObjects.length > 0){
		        for(var i in copiedObjects){
		        	copiedObjects[i]=fabric.util.object.clone(copiedObjects[i]);
					
		            copiedObjects[i].set("top", copiedObjects[i].top+100);
		            copiedObjects[i].set("left", copiedObjects[i].left+100);
		            
		            canvas.add(copiedObjects[i]);
		            canvas.item(canvas.size() - 1).hasControls = true;
		        }                
		    }
		    else if(copiedObject){
		    	copiedObject= fabric.util.object.clone(copiedObject);
				copiedObject.set("top", 150);
		    	copiedObject.set("left", 150);
		        canvas.add(copiedObject);
		        canvas.item(canvas.size() - 1).hasControls = true;
		    }
		    cutted = false;
		    copiedObjects = new Array();
		}
	    canvas.renderAll();  
	}

	//group objects
	function groupObjects(){
	    group = new fabric.Group([], {left: 250,top: 200});
	    if(canvas.getActiveGroup()){
	        canvas.getActiveGroup().getObjects().forEach(function(o){
	            group.addWithUpdate(o);
	            canvas.remove(o);
	        });             
	    }
	    canvas.add(group);
	}

	//ungroup objects
	function ungroupObjects(){
		var items = group._objects;
		group._restoreObjectsState();
		canvas.remove(group);
		for(var i = 0; i < items.length; i++) {
			canvas.add(items[i]);
		}
		canvas.renderAll();
	}

	//click esc to exit out of edit mode, deselect the object and turn tool back to Select
	fabric.util.addListener(window, 'keyup', function (e) {
	    if (e.keyCode === 27) {
	        if (mode === 'edit') {
	            mode = 'add';
	            selected.set({
	                selectable: true
	            });
	            selected._calcDimensions(false);
	            selected.setCoords();
	        } else {
	            mode = 'add';
	        }
	        selected = null;
	        tool = 'Select';
	        document.getElementById("currentTool").textContent = "Current Mode: " + tool;
	        canvas.isDrawingMode = false;
	    }
	})

	//when object is modified or added, push the modification/state into the state array
	canvas.on(
	    'object:modified', function () {
	    updateModifications(true);
	},
	    'object:added', function () {
	    updateModifications(true);
	});

	//push modification into state array
	function updateModifications(saveModification) {
	    if (saveModification === true) {
	        myjson = JSON.stringify(canvas);
	        state.push(myjson);
	    }
	}

	//load previous state
	function Undo() {
	    if (mods < state.length) {
	        canvas.clear().renderAll();
	        canvas.loadFromJSON(state[state.length - 1 - mods - 1]);
	        canvas.renderAll();
	        mods += 1;
	    }
	}

	//reload next state
	function Redo() {
	    if (mods > 0) {
	        canvas.clear().renderAll();
	        canvas.loadFromJSON(state[state.length - 1 - mods + 1]);
	        canvas.renderAll();
	        mods -= 1;
	    }
	}

	//save the current canvas
	function saveCanvas() {
		//var canvasName = prompt ("What would you like to name the canvas?");
	    var currentCanvas = JSON.stringify(canvas);
	    // savedCanvas.push({
	    // 	name: canvasName,
	    // 	canvas: currentCanvas
	    // });
	    savedCanvas = currentCanvas;
	    alert("Your current canvas has been saved!");
	}

	//load the saved canvas
	function loadCanvas() {
		canvas.loadFromJSON(savedCanvas);
		canvas.renderAll();
		alert("Your saved canvas has been loaded!");
	}
}