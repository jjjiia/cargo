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
		.defer(d3.csv, "short.csv")
		.await(dataDidLoad);
})

$("#topDifferences .hideTop").hide()

var global = {
	byD:{},
	byO:{},
	usPorts:null,
	foreignPorts:null
}


function dataDidLoad(error, worldmap,foreignPorts,usPorts,pairs,routes,cargo) {
	drawMap(worldmap,[width*3 / 4, height / 2])
	drawMap(worldmap,[width*3/4-width, height / 2])
	
	drawPorts(foreignPorts,"blue","foreign",routes,usPorts)
	drawPorts(usPorts,"red","us",routes,foreignPorts)
		var line = 0
		setInterval(function() {
			line+=1
			var currentCargo = cargo[line]
			var cargoContent = cargo[line].contents
			console.log(currentCargo)
			drawCargo(currentCargo,usPorts,foreignPorts,cargoContent)
		},1000);
	
}
function drawCargo(line,usPorts,foreignPorts,content){
	var usPort = line.usPort.toLowerCase()
	var foreignPort = line.foreignPort.toLowerCase()
	var contents = line.contents
	var pieces = line.pieces

	var lineData = [{y:usPorts[usPort].location[0],x:usPorts[usPort].location[1]},{y:foreignPorts[foreignPort].location[0],x:foreignPorts[foreignPort].location[1]}]
	
	projectedData = []
	
var projectionR = d3.geo.mercator()
  	.scale((width + 1) / 2 / Math.PI)
	.translate([width*3/4, height/2]);

var projectionL = d3.geo.mercator()
  	.scale((width + 1) / 2 / Math.PI)
	.translate([width*3/4-width, height/2]);
	
	for(var i in lineData){
		var x = projectionR([lineData[i].x,lineData[i].y])[0]
		if(x > width){
			x = projectionL([lineData[i].x,lineData[i].y])[0]
		}
		var y = projectionR([lineData[i].x,lineData[i].y])[1]
		projectedData.push({x:x,y:y})
	}
	//projectedData.splice(1,0,{x:x,y:y-10})
	
	var xDif = projectedData[0].x - projectedData[1].x
	var yDif = projectedData[0].y - projectedData[1].y
	
	var distance =Math.sqrt( Math.pow(xDif, 2)+Math.pow(yDif, 2))
	var line = d3.svg.line()
		.interpolate("cardinal")
		//.interpolate("basis")
		.x(function(d){
			return d.x		
		})
		.y(function(d){
			return d.y
		})
	
		
	var path = svg.append("path")
		.attr("class","routes")
		.attr("d", line(projectedData))
		.attr("stroke", "blue")
		.attr("stroke-width",1)
		.attr("opacity",.5)
		.attr("fill","none")
		
	var label = svg.append("text")
		.text(content)
		.attr("class","contents")
		.attr("x",(projectedData[1].x+projectedData[0].x)/2+10)
		.attr("y",(projectedData[1].y+projectedData[0].y)/2+10)
		.attr("opacity",1)
		.attr("fill","blue")
		.attr("text-anchor","start")

		label.transition()
		.duration(2000)
		.attr("fill","red")


		label.transition().delay(1000).attr("opacity",0)
		.remove()
		
	path.attr("stroke-dasharray",distance+ " " + distance)
		.attr("stroke-dashoffset", -distance)
		.transition()
		//.delay(colorIndex*500)
	    .duration(2000)
		.attr("stroke","red")
	    .ease("linear")
	    .attr("stroke-dashoffset",distance)
		.remove()
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
			return 1
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
		.on("click",function(d){
			findRoutes(d,routes,routePorts)
		})
		.on("mouseout",function(){
			d3.select(this).attr("opacity",0)
			tip.hide()
		})


}


