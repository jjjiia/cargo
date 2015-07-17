var width = 1400,
    height = 900;

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);
var graticule = d3.geo.graticule();

$(function() {
	queue()
		.defer(d3.json, "world-50m.json")
		.defer(d3.json, "foreign_location_frequency.json")
		.defer(d3.json, "us_location_frequency.json")
		.defer(d3.json, "frequency_pairs.json")
		.defer(d3.json, "port_port.json")
		.await(dataDidLoad);
})

$("#topDifferences .hideTop").hide()

var global = {
	byD:{},
	byO:{},
	usPorts:null,
	foreignPorts:null
}


function dataDidLoad(error, worldmap,foreignPorts,usPorts,pairs,routes) {
	drawMap(worldmap,[width*3 / 4, height / 2])
	drawMap(worldmap,[width*3/4-width, height / 2])
	
	drawPorts(foreignPorts,"blue","foreign",routes,usPorts)
	drawPorts(usPorts,"red","us",routes,foreignPorts)
	
	
	//drawShape(worldmap,[width*3/4-width, height / 2])
	//pass in port locations, svg offset, color, class, frequency file)
	//drawMuseums(foreignPorts,[width*3 / 4, height / 2],"#555","right",foreignF)
	//drawMuseums(foreignPorts,[width*3 / 4-width, height / 2],"#555","left",foreignF)
	//
	//initAllRoutes(us,foreign,routes)
//	global.byD = makeRouteDictionaryByD(routes,global.byD)
//	global.byO = makeRouteDictionaryByO(routes,global.byO)
}
function drawMap(world,translate){  
	var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate(translate)
	.precision(0);

	var path = d3.geo.path()
    .projection(projection);
	
	svg.append("path")
	    .datum(graticule)
	    .attr("class", "graticule")
	    .attr("d", path);

  svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

//  svg.insert("path", ".graticule")
//      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
//      .attr("class", "boundary")
//      .attr("d", path);
}
function clean(string){
	string = string.split(",").join("")
	string = string.split(" ").join("")
	string = string.split(/[^\w\s]/gi).join('')
	return string
}
function jsonToArray(json){
	var array = []
	for(var i in json){
		var port = i
		var lat = parseFloat(json[i].location[0])
		var lng = parseFloat(json[i].location[1])
		var r = json[i].frequency
		array.push([port,lat,lng,r])
	}
	return array
}

function findRoutes(origin,routes,ports,pairs){
	var routes = routes[origin[0]]
	var lineStart = [origin[1],origin[2]]
	d3.selectAll(".routes").remove()
	d3.selectAll(".routesHighlight").remove()
	for(var i in routes){
		var lineEnd = ports[routes[i]]["location"]
		drawRoutes([{y:lineStart[0],x:lineStart[1]},{y:parseFloat(lineEnd[0]),x:parseFloat(lineEnd[1])}],origin[0],routes[i])
	}
}
function drawRoutes(data,port1,port2,pairs){
	var projectionR = d3.geo.mercator()
	  	.scale((width + 1) / 2 / Math.PI)
		.translate([width*3/4, height/2]);
	
	var projectionL = d3.geo.mercator()
	  	.scale((width + 1) / 2 / Math.PI)
		.translate([width*3/4-width, height/2]);
		
	var line = d3.svg.line()
		.interpolate("basis")
		.x(function(d){
			var x = projectionR([d.x,d.y])[0]			
			if(x > width){
				x = projectionL([d.x,d.y])[0]
			}
				return x			
		})
		.y(function(d){
			return projectionR([d.x,d.y])[1]})
	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  //.offset([-40, 40])
	svg.call(tip);
	
	svg.append("path")
		.attr("class","routes")
		.attr("d", line(data))
		.attr("stroke", "black")
		.attr("stroke-width",1)
		.attr("opacity",.5)
	
	svg.append("path")
		.attr("class","routesHighlight")
		.attr("d", line(data))
		.attr("stroke", "yellow")
		.attr("stroke-width",8)
		.attr("opacity",0)
		.on("mouseover",function(){
			d3.select(this).attr("opacity",.5)
//			console.log(port1,port2)
			tip.html([port1,port2])
				.style("left", (d3.event.pageX) + "px")     
			      .style("top", (d3.event.pageY - 28) + "px");  
			tip.show()
		})
		.on("mouseout",function(){
			d3.select(this).attr("opacity",0)
			tip.hide()
		})
		
	
}
function drawPorts(ports,color,group,routes,routePorts,pairs){
	var portArray = jsonToArray(ports)
	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([-40, 40])
	  
  	var projectionR = d3.geo.mercator()
      	.scale((width + 1) / 2 / Math.PI)
		.translate([width*3/4, height/2]);
		
  	var projectionL = d3.geo.mercator()
      	.scale((width + 1) / 2 / Math.PI)
		.translate([width*3/4-width, height/2]);
  	
	var rScale = d3.scale.linear().domain([0,500000]).range([2,10])
	svg.call(tip);
  	svg.selectAll("circle ."+group)
	  	.data(portArray)
	  	.enter()
	  	.append("circle")
		.attr("class",function(d){
			return clean(d[0])
		})
		.attr("class",group)
	  	.attr("cx",function(d){ 
			var cx = projectionR([d[2],d[1]])[0]
			if(cx > width){
				return projectionL([d[2],d[1]])[0]
			}else{
				return cx
			}
	  	})
	  	.attr("cy",function(d){ 
	  		return projectionR([d[2],d[1]])[1]
	  		})
	  	.attr("r",function(d){
			return 3
			return rScale(d[3])
	  	})
	  	.attr("fill",function(d){
	  		return color
	  	})
		.attr("opacity",.5)
	
	
  	svg.selectAll("circle ."+group)
	  	.data(portArray)
	  	.enter()
	  	.append("circle")
		.attr("class",function(d){
			return clean(d[0])+"hightlight"
		})
		.attr("class",group)
	  	.attr("cx",function(d){ 
			var cx = projectionR([d[2],d[1]])[0]
			if(cx > width){
				return projectionL([d[2],d[1]])[0]
			}else{
				return cx
			}
	  	})
	  	.attr("cy",function(d){ 
	  		return projectionR([d[2],d[1]])[1]
	  		})
	  	.attr("r",function(d){
			return 4
			return rScale(d[3])
	  	})
	  	.attr("fill",function(d){
	  		return color
	  	})
		.attr("opacity",0)
	  	.on("mouseover",function(d){
			d3.select(this).attr("opacity",.5)
	  		tip.html(d[0])		
			tip.show()		
	  	})
		.on("mouseout",function(){
			d3.select(this).attr("opacity",0)
			tip.hide()
		})
		.on("click",function(d){
			findRoutes(d,routes,routePorts)
		})
//	.on("mouseover",function(d){
//		var port1 = clean(d[2])
//			var tipText = []
//		
//		if(global.byD[port1]!=undefined){
//			var usPort = port1
//			
//			var routes = global.byD[port1]
//			var amount = routes.length
//			for(var i in routes){
//				var foreignPort = clean(routes[i])
//				//console.log(foreignPort)
//				//formatRouteData(foreignPort,usPort,global.usPorts,global.foreignPorts)
//				tipText.push("</br>"+routes[i])				
//			}
//				tip.html(function(){return d[2] +" receives cargo from "+ amount+ " international ports"})
//
//		}else{
//			var routes = global.byO[port1]
//			var foreignPort = port1	
//			var amount = routes.length
//				
//			for(var i in routes){
//				var usPort = clean(routes[i])
//				formatRouteData(foreignPort,usPort,global.usPorts,global.foreignPorts)
//				tipText.push("</br>"+routes[i])				
//			
//			}
//			tip.html(function(){return d[2]+" ships cargo to "+ amount+ " U.S. ports"})
//
//		}
//		
//			//console.log(sizeDict[clean(d[2])])
//		//d3.select("#descriptions").html(routes.splice(0,10))
//		tip.show()
//	})
//	.on("mouseout",function(){
//		d3.selectAll(".routes").remove()
//		tip.hide()
//	})
}



function initAllRoutes(us,foreign, routes,translate){
	usPorts = museumLocations(us)
	foreignPorts = museumLocations(foreign)
	

	
	for(var i in routes){
		var usPort = routes[i].destination
		var foreignPort = routes[i].origin
		if(usPort!="" && foreignPort!=""){
		formatRouteData(foreignPort,usPort,usPorts,foreignPorts)
			
		}
		
	}
}
function formatRouteData(foreignPort,usPort,usPorts,foreignPorts){
	var projectionLeft = d3.geo.mercator()
	    .scale((width + 1) / 2 / Math.PI)
	    .translate([width*3 / 4 - width, height / 2])

	var projectionRight = d3.geo.mercator()
	    .scale((width + 1) / 2 / Math.PI)
	    .translate([width*3 / 4, height / 2])
	
		var ports = {"destinationName":usPort,"originName":foreignPort}
	//console.log(usPorts[clean(usPort)])
	//console.log(clean(usPort))
	if(usPorts[clean(usPort)]!=undefined && foreignPorts[clean(foreignPort)]!=undefined)
	{
		var data = 
		{
			"destination":{
				"name":usPort,
				"lat":usPorts[clean(usPort)][0],
				"lng":usPorts[clean(usPort)][1]
			}, 
			"origin":{
				"name":foreignPort,
				"lat":foreignPorts[clean(foreignPort)][0],
				"lng":foreignPorts[clean(foreignPort)][1]
			}
		}
		//console.log(route)
		if(data.origin.lng > 100){
			originX = projectionLeft([parseFloat(data["origin"].lng),parseFloat(data["origin"].lat)])[0]
			originY = projectionLeft([parseFloat(data["origin"].lng),parseFloat(data["origin"].lat)])[1]
			destinationX = projectionRight([parseFloat(data["destination"].lng),parseFloat(data["destination"].lat)])[0]
			destinationY = projectionRight([parseFloat(data["destination"].lng),parseFloat(data["destination"].lat)])[1]
		}else{
			originX = projectionRight([parseFloat(data["origin"].lng),parseFloat(data["origin"].lat)])[0]
			originY = projectionRight([parseFloat(data["origin"].lng),parseFloat(data["origin"].lat)])[1]
			destinationX = projectionRight([parseFloat(data["destination"].lng),parseFloat(data["destination"].lat)])[0]
			destinationY = projectionRight([parseFloat(data["destination"].lng),parseFloat(data["destination"].lat)])[1]
		}
		var projectedData = [{x:originX,y:originY},{x:destinationX,y:destinationY}]
		//console.log(projectedData)
		drawRoutes(projectedData,ports,20)	}


}
/*function drawRoutes(data,ports,duration){
	var routeClass = clean(ports.destinationName)+"_"+clean(ports.originName)
	//console.log(routeClass)
	//var lineData = 	[{x:parseFloat(data["origin"].lat),y:parseFloat(data["origin"].lng)},{x:parseFloat(data["destination"].lat),y:parseFloat(data["destination"].lng)}]

	var line = d3.svg.line()
		.interpolate("basis")
		.x(function(d){
			//console.log([projection([d["y"],d["x"]])[0],projection([d["y"],d["x"]])[1]])
			return d.x})
		.y(function(d){return d.y})
	
	var path = svg.selectAll(".routes")
		.data(data)
		.enter()
		.append("path")
		//.attr("class",routeClass)
		.attr("class","routes")
		.attr("d", line(data))
		.attr("stroke", "black")
		.attr("stroke-width",3)
		.attr("opacity",.3)
		
		//	.style("stroke-dasharray", ("20, 3"))
	//	var totalLength = path.node().getTotalLength();
	//	if(totalLength>100){
	//	var dashLength = 50	
	//	}
	//	else{
	//	var dashLength = totalLength/20
	//	}

	//path.attr("stroke-dasharray",2+ " " + 5)
	//	.attr("stroke-dashoffset", 10)
	//	.transition()
	//	//.delay(colorIndex*500)
	//    .duration(5000000)
	//    .ease("linear")
	//    .attr("stroke-dashoffset", -100000)

}*/


