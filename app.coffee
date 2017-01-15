{VRComponent, VRLayer} = require "VRComponent"

vr = new VRComponent
	front:"images/Yokohama/front.jpg"
	left:"images/Yokohama/left.jpg"
	right:"images/Yokohama/right.jpg"
	back:"images/Yokohama/back.jpg"
	top:"images/Yokohama/top.jpg"
	bottom:"images/Yokohama/bottom.jpg"

#functions
changeVRLayerOpacity = (vrData, layer) ->
	heading = vrData.heading
	headingDifference =  Math.abs(layer.heading - heading)
	value = Utils.modulate(headingDifference, [0, 40], [0, 1])
	layer.opacity = 1 - value

#create crosshair
crosshair = new Layer
	backgroundColor: "white"
	distance:1200
	width:100
	height:100
	opacity: 0.75
crosshair.cornerRadius = crosshair.width/2
crosshair.center()

layersArray = []
for i in [0...11]
	layer = new VRLayer
		backgroundColor: Color.random()
		heading: 30 * i
		elevation: 0
		distance: Utils.randomNumber(400,1600)
	layersArray.push(layer)

# Handle Orientation Events
vr.on Events.OrientationDidChange, (data)->
	
	#data
	elevation = data.elevation	
	heading = data.heading
	tilt = data.tilt
	
	#match crosshair
	crosshair.elevation = elevation
	crosshair.heading = heading
	
	#distance from crosshair and heading
	for layer in layersArray
		changeVRLayerOpacity(data, layer)

# make sure the vr component fills the entire screen
for layer in layersArray
	vr.projectLayer(layer)

window.onresize = ->
	vr.size = Screen.size
	