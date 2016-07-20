
//FIELDS NEEDED TO GET DIRECTIONS
/*
{
  origin: LatLng | String,
  destination: LatLng | String,
  travelMode: TravelMode,
  transitOptions: TransitOptions,
  unitSystem: UnitSystem,
  durationInTraffic: Boolean,
  waypoints[]: DirectionsWaypoint,
  optimizeWaypoints: Boolean,
  provideRouteAlternatives: Boolean,
  avoidHighways: Boolean,
  avoidTolls: Boolean,
  region: String
}

origin (required) specifies the start location from which to calculate directions. This value may either be specified as a String (e.g. "Chicago, IL") or as a LatLng value.
destination (required) specifies the end location to which to calculate directions. This value may either be specified as a String (e.g. "Chicago, IL") or as a LatLng value.
travelMode (required) specifies what mode of transport to use when calculating directions. Valid values are specified in Travel Modes below.
transitOptions (optional) specifies values that apply only to requests where travelMode is google.maps.TravelMode.TRANSIT. Valid values are described in Transit Options, below.
unitSystem (optional) specifies what unit system to use when displaying results. Valid values are specified in Unit Systems below.
durationInTraffic (optional) specifies whether the DirectionsLeg result should include a duration that takes into account current traffic conditions. This feature is only available for Google Maps API for Work customers. The time in current traffic will only be returned if traffic information is available in the requested area.
waypoints[] (optional) specifies an array of DirectionsWaypoints. Waypoints alter a route by routing it through the specified location(s). A waypoint is specified as an object literal with fields shown below:

location specifies the location of the waypoint, either as a LatLng or as a String which will be geocoded.
stopover is a boolean which indicates that the waypoint is a stop on the route, which has the effect of splitting the route into two routes.
(For more information on waypoints, see Using Waypoints in Routes below.)
optimizeWaypoints (optional) specifies that the route using the supplied waypoints may be optimized to provide the shortest possible route. If true, the Directions service will return the reordered waypoints in a waypoint_order field.(For more information, see Using Waypoints in Routes below.)
provideRouteAlternatives (optional) when set to true specifies that the Directions service may provide more than one route alternative in the response. Note that providing route alternatives may increase the response time from the server.
avoidHighways (optional) when set to true indicates that the calculated route(s) should avoid major highways, if possible.
avoidTolls (optional) when set to true indicates that the calculated route(s) should avoid toll roads, if possible.
region (optional) specifies the region code, specified as a ccTLD ("top-level domain") two-character value. (For more information see Region Biasing below.)

*/

//
//different vehicles need different slopes
//
//wheelchairs: (1/12)
//walking: 0.2
//bikes max: (0.4)
//bikes comfort: (0.2)
//driving: 0.2

var directionsDisplay;
var rendererOptions = {
  draggable: true,
  suppressMarkers: true
};
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var directionsService = new google.maps.DirectionsService(); //calls the Google Maps API
var map;
var start;
var end;
var elevationService = new google.maps.ElevationService();
var infowindow = new google.maps.InfoWindow();

var stepDisplay;
var markerArray = [];

var totalUp = 0;
var totalDown = 0;

var testPoint;

var routeOptions = [];
var currentRoute;


function initialize() {
 
  var e = document.getElementById("routeChosen");
  currentRoute = e.selectedIndex;

  

  //directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions); //displays directions
  var sanfransisco = new google.maps.LatLng(37.774929500000000000, -122.419415500000010000);
  var mapOptions = {
    zoom:7,
    center: sanfransisco
  }
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  directionsDisplay.setMap(map);



  stepDisplay = new google.maps.InfoWindow();


  document.getElementById("upward").innerHTML = "Upward Climb: " + totalUp;
  document.getElementById("downward").innerHTML = "Downward Climb: " + totalDown;

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    showSteps(directionsDisplay.getDirections());
    ////console.log(directionsDisplay.getDirections());
  });
}

/*
function getElevationByClick(event) {

  var locations = [];

  // Retrieve the clicked location and push it on the array
  var clickedLocation = event.latLng;
  locations.push(clickedLocation);

  //event[0][latlng][A]
  //event[0][latlng][F]

  ////////console.log(clickedLocation)

  // Create a LocationElevationRequest object using the array's one value
  var positionalRequest = {
    'locations': [clickedLocation]
  }

  ////console.log(positionalRequest)

  // Initiate the location request
  elevationService.getElevationForLocations(positionalRequest, function(results, status) {
    if (status == google.maps.ElevationStatus.OK) {

      // Retrieve the first result
      if (results[0]) {

        // Open an info window indicating the elevation at the clicked position
        infowindow.setContent('The elevation at this point <br>is ' + results[0].elevation + ' meters.');
        infowindow.setPosition(clickedLocation);
        infowindow.open(map);
      } else {
        alert('No results found');
      }
    } else {
      alert('Elevation service failed due to: ' + status);
    }
  });
}
*/


function enterValues() {

    start = document.getElementById("start").value;
    

    if (start == null || start == "") {
        alert("Start must be filled out");
        return false;
    }
    end = document.getElementById("end").value;
    if (end == null || end == "") {
        alert("Destination must be filled out");
        return false;
    }
    //
    calcRoute(start, end, 0, null);
    startWaypoints(start, end)
}

function resetValues() {
  for (var i = 0, len = routeOptions.length; i < len; i++)  //clears all the routes
  {
    if (routeOptions[i].myRoute){
      routeOptions[i].myRoute.setMap(null);
      ////console.log(routeOptions.length)
    }
    
  }  
  
  if (start && end) {
    calcRoute(start, end, 0, null);
    currentRoute = 0
  } else {
    alert("Nothing to reset to!")
  }
}

var geocoder = new google.maps.Geocoder();
function getLongLat(myPoint1, myPoint2, callback){
  var location1;
  var location2;
  geocoder.geocode( { 'address': myPoint1}, function(results, status) {
     location1 = results[0].geometry.location;
    //alert(location1.lat() + '' + location1.lng());
    if (location1 && location2){
      callback(location1, location2);
    }
    
  });
  geocoder.geocode( { 'address': myPoint2}, function(results, status) {
     location2 = results[0].geometry.location;
    //alert(location2.lat() + '' + location2.lng());
    
    //////console.log(location1, location2)
    if (location1 && location2){
      callback(location1, location2);
    }
  });
  
  
}


function startWaypoints(start, end){
  getLongLat(start, end, getWaypoints); //getWaypoints is the callbackfunction
}

function getWaypoints (myStart, myEnd){
  ////console.log(myStart, myEnd);
  var latCenter = myStart.lat() + (myEnd.lat() - myStart.lat())/2;
  var longCenter = myStart.lng() + (myEnd.lng() - myStart.lng())/2;

  var latQuarter = myStart.lat() + (myEnd.lat() - myStart.lat())/4;
  var longQuarter = myStart.lng() + (myEnd.lng() - myStart.lng())/4;

  var changeLat = myEnd.lat() - myStart.lat();
  var changeLong = myEnd.lng() - myStart.lng();
  var slope = (changeLong) / (changeLat); //rise over run = changeLong over changeLat
  //change in x by one, means slope change for y
  //change in latitude by one, means slope change for longitude
  var perpSlope = -1 * (1/slope);
  //

  for (var i = -5; i <= 5; i++) 
  {
    
    var newPointLat = latCenter - (0.1)*i*(changeLat);
    var newPointLong = longCenter - (0.1)*i*(changeLat)*perpSlope;

    var newPointLat2 = latQuarter - (0.1)*i*(changeLat);
    var newPointLong2 = longQuarter - (0.1)*i*(changeLat)*perpSlope;

    var latlngPoint = new google.maps.LatLng(newPointLat,newPointLong)
    var latlngPoint2 = new google.maps.LatLng(newPointLat2,newPointLong2)
    ////console.log(latCenter, longCenter)
    ////console.log(newPointLat, newPointLong)

    //var myWaypoint = {"A":newPointLat, "F":newPointLat}};
    //////console.log(myWaypoint)
    //var myWaypoint = LatLng(lat:newPointLat, lng:newPointLong);

    for (var j = 1; j <= 2; j++) 
    {

      var waypts = [];

      
      ////console.log(latlngPoint)
      if (j === 2){
        //console.log("ayyy")
        waypts.push({
        location:latlngPoint2,
        stopover:false});
      }

      waypts.push({
        location:latlngPoint,
        stopover:false});

      ////console.log(waypts);

      var myrequest = {
          origin:start,
          destination:end,
          travelMode: google.maps.TravelMode.WALKING,
          waypoints: waypts
        };


      calcRoute(myStart, myEnd, null, myrequest);
    }
      
  }
  
  
}


function chooseShortest(routes, index){
  ////console.log("MADE IT 2")
  //console.log(routes)
  for (var i = 0, len = routes.length; i < len; i++) 
  {
    
    if (routes[i].weight < routes[currentRoute].weight){
      currentRoute = i;
    } 
      
  }
  ////console.log("Current Route is " + currentRoute);
  //showStepsAuto(routeOptions[currentRoute].myRoute);



  var localRoute = routeOptions[currentRoute].myRoute;
  ////console.log(currentRoute)
  ////console.log(routeOptions[currentRoute].myRoute)
  //showSteps(localRoute, localRoute.directions.routes[0].legs[0])
  showSteps(routeOptions[currentRoute].myRoute.getDirections())
}

function changeCurrentRoute(newRoute){
  var e = document.getElementById("routeChosen");
  newRoute = e.selectedIndex;

  currentRoute = newRoute;
  for (var i = 0, len = routeOptions.length; i < len; i++)  //clears all the routes
  {
    if (routeOptions[i].myRoute){
      routeOptions[i].myRoute.setMap(null);
      ////console.log(routeOptions.length)
    }
    
  }  
   
  if (routeOptions[currentRoute].specialRequest){
    calcRoute(start, end, null, routeOptions[currentRoute].specialRequest);
  }else{
    calcRoute(start, end, currentRoute, null);
  }
  //////console.log(myRoute.directions.routes[0].legs[0].steps);
  //routeOptions[i].myRoute = myRoute;
  
  
  showSteps(routeOptions[currentRoute].myRoute.getDirections())

  google.maps.event.addListener(routeOptions[currentRoute].myRoute, 'directions_changed', function() {
    showSteps(routeOptions[currentRoute].myRoute.getDirections());
    ////console.log(routeOptions[currentRoute].myRoute.getDirections());
  });

  document.getElementById("time").innerHTML = "Total Time: " + routeOptions[currentRoute].duration.text;
  




  ////console.log(routeOptions)
  ////console.log("Current Path weight: " + routeOptions[currentRoute].weight)

  //var localRoute = routeOptions[currentRoute].myRoute;
  //showSteps(localRoute, localRoute.directions.routes[currentRoute].legs[0])
}

var loop = 0;
function calcRoute(start, end, specRoute, myrequest)  //specRoute is only included if you want only one specific route displayed
{
    // First, remove any existing markers from the map.
  for (var i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }
     // Now, clear the array itself.
  markerArray = [];

  //var start = document.getElementById("start").value;
  //var end = document.getElementById("end").value;
  var request;
  if (myrequest){
    request = myrequest;
  }else{
    request = {
      origin:start,
      destination:end,
      travelMode: google.maps.TravelMode.WALKING,
      provideRouteAlternatives:false
    };
  }

  directionsService.route(
    request,
    function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          for (var i = 0, len = response.routes.length; i < len; i++) {
            if (loop < response.routes.length){ //adds options to the dropdown menu
              routeOptions[i] = []
              loop ++;
              //if (i > 0){
                var x = document.getElementById("routeChosen");

                
                //var option = document.createElement("option");
                x.options[i].text = "Route Choice " + String(i+1);
                x.options[i].value = i;
                
              //}
            }
          }

          if (specRoute){ //will only make directions for one

            routeOptions[specRoute].myRoute = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                routeIndex: parseInt(specRoute),
                draggable: true,
                suppressMarkers: true
            });
            routeOptions[newRoute].duration = response.routes[0].legs[0].duration;
            
            //////console.log(myRoute.directions.routes[0].legs[0].steps);
            //routeOptions[i].myRoute = myRoute;
            ////console.log(routeOptions[specRoute].myRoute)
            routeOptions[specRoute].weight = getElevationTotal(routeOptions[specRoute].myRoute, specRoute);
            

            google.maps.event.addListener(routeOptions[specRoute].myRoute, 'directions_changed', function() {
              showSteps(routeOptions[specRoute].myRoute.getDirections());
              ////console.log(routeOptions[specRoute].myRoute.getDirections());
                });
          } else if (myrequest){ //when looping through other possible paths with long/lat values
            
            var newRoute = null;
            console.log("hey")
            for (var i = 0, len = routeOptions.length; i < len; i++) 
            {
              if (routeOptions[i].specialRequest){
              if ((routeOptions[i].specialRequest.length === myrequest.length) && (routeOptions[i].specialRequest === myrequest))
              { //if this path has already been created and only needs to be drawn
                newRoute = i;
                //console.log("this request exists already...")
              } 
              }
            }
            if (newRoute === null){
              newRoute = routeOptions.length;
         
              routeOptions[newRoute] = []
              var x = document.getElementById("routeChosen");
              var option = document.createElement("option");
              option.text = "Route Choice " + (newRoute);
              option.value = newRoute;
              x.add(option);
            }
            ////console.log("Making path with waypoints");
            ////console.log("Route number: " + (newRoute+1));
            ////console.log(routeOptions.length)

            routeOptions[newRoute].myRoute = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                routeIndex: 0,
                draggable: true,
                suppressMarkers: true,
                optimizeWaypoints: true,
               
            });

            routeOptions[newRoute].duration = response.routes[0].legs[0].duration;
            
            ////console.log(routeOptions[newRoute].myRoute)
            routeOptions[newRoute].specialRequest = myrequest;
            //////console.log(myRoute.directions.routes[0].legs[0].steps);
            //routeOptions[i].myRoute = myRoute;
            routeOptions[newRoute].weight = getElevationTotal(routeOptions[newRoute].myRoute, newRoute);
            
            google.maps.event.addListener(routeOptions[currentRoute].myRoute, 'directions_changed', function() {
              showSteps(routeOptions[currentRoute].myRoute.getDirections());
              ////console.log(routeOptions[currentRoute].myRoute.getDirections());
              });
          } 
          
          else 
          { //this shows all possible routes
            for (var i = 0, len = response.routes.length; i < len; i++) {
                console.log("ay")
                
                routeOptions[i].myRoute = new google.maps.DirectionsRenderer({
                    map: map,
                    directions: response,
                    routeIndex: i,
                    draggable: true,
                    suppressMarkers: true
                });
                console.log(routeOptions[i].myRoute.directions.routes[0].legs[0].duration)
                //routeOptions[i].myRoute = myRoute;
                routeOptions[i].duration = routeOptions[i].myRoute.directions.routes[0].legs[0].duration;
                
                routeOptions[i].weight = getElevationTotal(routeOptions[i].myRoute, i);
                
                google.maps.event.addListener(routeOptions[currentRoute].myRoute, 'directions_changed', function() {
                  showSteps(routeOptions[currentRoute].myRoute.getDirections());
                  ////console.log(routeOptions[currentRoute].myRoute.getDirections());
                });


            }
          }
        } else {
            $("#error").append("Unable to retrieve your route<br />");
        }

    }
  );


} //ends calcRoute function

   // The request object (request) and a callback function (plotElevation) are passed as parameters to the method.
var myElevation = 0;
//////////console.log(markerArray)

var myLocations = []
var myDirections = "";
  
//myElevation = getElevation


function showSteps(directionResult, myRoutz, myindex) {
// For each step, place a marker, and add the text to the marker's
// info window. Also attach the marker to an array so we
// can keep track of it and remove it when calculating new
// routes.
  myLocations = []
  var index = null;
  if (myindex === null){
    index = 0;
  }else{
    index = myindex;
  }
  var myRoute;
  if (myRoutz){
    myRoute = myRoutz;
    //console.log(myRoute)
  } else {
    
    myRoute = directionResult.routes[0].legs[0];
    
  }
  
  

 // myElevation = elevationService.getElevationAlongPath(myRoute, plotElevation)

  //////////console.log("HEYYYY" + myRoute.start_location); //first point
  for (var i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }
     // Now, clear the array itself.
  markerArray = [];

    
    for (var i = 0; i < myRoute.steps.length + 1; i++) {  //the last point is the end location
      myLocations[i] = []
      //////////console.log(myLocations[i]);
      var marker;
      if (i === myRoute.steps.length){
          marker = new google.maps.Marker({
            position: myRoute.end_location,
            map: map,
            animation: google.maps.Animation.DROP,
            label: String(i),
            draggable: true
          });

          attachInstructionText(marker,"End Destination");
           myLocations[i].directions = "<i> Arrive </i>";
          myLocations[i].slope = ""; //value is given in meters
          //slope is later divided by the height change of that path
          myLocations[i].distance = ""; //text is given in miles or feet
          myLocations[i].position = myRoute.end_location; //last point is the final destination


      }else {
          marker = new google.maps.Marker({
            position: myRoute.steps[i].start_location,
            map: map,
            fillColor: "#FF00FF", 
            cornercolor:"#0000FF",
            animation: google.maps.Animation.DROP,
            label: String(i),
            draggable: false
          });

          attachInstructionText(marker,"Point " + (i) + ": " + myRoute.steps[i].instructions);

           myLocations[i].directions = myRoute.steps[i].instructions;
          myLocations[i].slope = myRoute.steps[i].distance.value; //value is given in meters
          //slope is later divided by the height change of that path
          myLocations[i].distance = myRoute.steps[i].distance.text; //text is given in miles or feet
          myLocations[i].position = myRoute.steps[i].start_location;
          
      }

      //////console.log(marker)
      
      
      markerArray[i] = marker;
      //myDirections += "<br>"+myRoute.steps[i].instructions + " ( " + myRoute.steps[i].distance.text + " )";
      
     
    }
  

  //makes an array of just locations
  //
  //first point is the start position, last point is the end position
  //myLocations[0] = myRoute.start_location; //first point
  for (var i = 0; i < myRoute.steps.length -1; i++) {
      
       //start location returns A - lat, and F - lang
      //its i+1 because the first location is the start position
  }
  //myLocations[myLocations.length] = [];
  
  
  getElevation(myLocations);

  document.getElementById("distance").innerHTML = "Total Distance: " + myRoute.distance.text;

  document.getElementById("time").innerHTML = "Total Time: " + routeOptions[currentRoute].duration.text;

}

function attachInstructionText(marker, text) {
  google.maps.event.addListener(marker, 'click', function() {
    // Open an info window when the marker is clicked on,
    // containing the text of the step.
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}


function getElevationTotal(routes, index){// gets weight by adding elevatin change and distance traveled
  var weight = 0;
  var distance = 0;

  var locations = [];
  console.log("hi")
  //////console.log(routes.directions.routes[0].legs[0].steps.length)

  //routes.directions.routes[0].legs[0].steps

  // Retrieve the point coordinates and push it on the array
  for (var i = 0; i < routes.directions.routes[0].legs[0].steps.length; i++) {
    var clickedLocation = routes.directions.routes[0].legs[0].steps[i].start_location;
    locations.push(clickedLocation);
    //////console.log(clickedLocation)

  }

  // Create a LocationElevationRequest object using the array's one value
  var positionalRequest = {
    'locations': locations
  }

  // Initiate the location request
  ////console.log(positionalRequest)
  elevationService.getElevationForLocations(positionalRequest, function(results, status) {
    
    if (status == google.maps.ElevationStatus.OK) {

        
        // Retrieve the first result
        if (results[0]) {

          for (var i = 0; i < results.length; i++) {

            if (i < results.length -1){
                var difference = results[i].elevation - results[i+1].elevation;
                 
                 var mydistance = google.maps.geometry.spherical.computeDistanceBetween (results[i].location, results[i + 1].location);
                ////console.log(distance);

               
                difference = Math.round10(difference, -2);

                
                weight += Math.abs(difference);
                distance += mydistance;
                ////console.log(weight);
            } else {
                myDirections += "<br> Arrive ";

            }
        }


        ////console.log("Final Weight of " + index + " is: " + weight);
        
        routeOptions[index].weight = weight;

        var x = document.getElementById("routeChosen");
        x.options[index].text = (String(index+1) + ". # E: " + Math.round10(weight, -1) + " D: " + Math.round10(distance, -1));
        x.options[index].value = weight;



        //console.log("Does x exist?");
        //        console.log(x);

        //////console.log("Final pt 2: " + routeOptions[index].weight);
        //console.log("Route Options: ")
        //console.log(routeOptions);
        showSteps(routeOptions[index].myRoute.getDirections())
        //chooseShortest(routeOptions, index);


        var x = document.getElementById("routeChosen");
        //sortOptions(x)

        return weight;

      } else {
        alert('No results found');
      }
    } else {
      alert('Elevation service failed due to: ' + status);
    }
  });

}



function getElevation(routes) {
    ////////console.log("Getting Elevation")
    var locations = [];

    //var mytestlocation = {A:37.80005249583167, F:-122.40486145019531};
   
    ////////console.log(routes[0]);
  

  // Retrieve the clicked location and push it on the array
  for (var i = 0; i < routes.length; i++) {
    var clickedLocation = routes[i].position;
    locations.push(clickedLocation);
  }
  

  // Create a LocationElevationRequest object using the array's one value
  var positionalRequest = {
    'locations': locations
  }

  // Initiate the location request
  elevationService.getElevationForLocations(positionalRequest, function(results, status) {
    if (status == google.maps.ElevationStatus.OK) {

        ////////console.log(results)
        // Retrieve the first result
        if (results[0]) {

        // Open an info window indicating the elevation at the clicked position
            for (var i = 0; i < results.length; i++) {
                /*
                infowindow.setContent('The elevation at this point <br>is ' + results[i].elevation + ' meters.');
                infowindow.setPosition(locations[i]);
                infowindow.open(map);
                */
                ////////console.log("Point " + i + " is at " + locations[i] + " which is at " + results[i].elevation + ' meters.');
                routes[i].elevation = results[i].elevation
                
            }

        calculateDif(routes);
      } else {
        alert('No results found');
      }
    } else {
      alert('Elevation service failed due to: ' + status);
    }
  });

  
}



function calculateDif(routes) {
    totalUp = 0;
    totalDown = 0;
    myDirections = "";
    ////////console.log("got here")
    ////////console.log(elevations)
    for (var i = 0; i < routes.length; i++) {

        if (i < routes.length -1){
            var difference = routes[i].elevation - routes[i+1].elevation;

            routes[i].slope = Math.round10((difference/routes[i].slope), -2);

            difference = Math.round10(difference, -1);

            if (difference > 0){
                ////////console.log("Point " + i + " is " + Math.abs(difference) + " meters higher than point " + (i-1)); 
                totalUp += difference;
                myDirections += "<br>"+ (i+1) + ". ( ↑  " + Math.abs(difference) + "m ) " + routes[i].directions;
            } else if (difference < 0){
                 ////////console.log("Point " + i + " is " + Math.abs(difference) + " meters lower than point " + (i-1)); 
                totalDown += Math.abs(difference);
                myDirections += "<br>"+ (i+1) + ". ( ↓  " + Math.abs(difference) + "m ) " + routes[i].directions;
            } else if (difference === 0){
                ////////console.log("Point " + i + " has the same elevation as Point " + (i-1));
                myDirections += "<br>"+ (i+1) + ". ( - )" + routes[i].directions;
            }
        
            
            myDirections += "<i> ( Walk " + routes[i].distance + " ) </i> SLOPE: " + routes[i].slope;
        } else {
            myDirections += "<br> Arrive ";

        }
    }
    
    ////////console.log(totalUp);
    ////////console.log(totalDown);

    document.getElementById("upward").innerHTML = "Upward Climb: " + Math.round10(totalUp, -1) + " meters";
    document.getElementById("downward").innerHTML = "Downward Climb: " + Math.round10(totalDown, -1) + " meters";

    document.getElementById("steps").innerHTML = "Directions: <br>" + myDirections;

}




google.maps.event.addDomListener(window, 'load', initialize);

/*
{
  origin: "Chicago, IL",
  destination: "Los Angeles, CA",
  waypoints: [
    {
      location:"Joplin, MO",
      stopover:false
    },{
      location:"Oklahoma City, OK",
      stopover:true
    }],
  provideRouteAlternatives: false,
  travelMode: TravelMode.DRIVING,
  unitSystem: UnitSystem.IMPERIAL
}

google.maps.TravelMode.WALKING
*/


///
////////
//ROUNDING//
////////
///
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();



function swapArrayElements(array_object, index_a, index_b) {
    var temp = array_object[index_a];
    array_object[index_a] = array_object[index_b];
    array_object[index_b] = temp;
 }

function compareOptionValue(a,b) {
  /*
   * return >0 if a>b
   *         0 if a=b
   *        <0 if a<b
   */
   if (a>b){

   } //> 0 
   else if (a === b) {

   } // = 0
   else if (a < b){

   } //< 0

  // value comparison
  ////console.log(a.value!=b.value ? a.value<b.value ? -1 : 1 : 0)
  return a.value!=b.value ? a.value<b.value ? -1 : 1 : 0;
  // numerical comparison
//  return a.text - b.text;
 
}
 
function sortOptions(list) {
  var items = list.options.length;

  // create array and make copies of options in list
  var tmpArray = new Array(items);
  var tempRoutes = routeOptions;

  for ( i=0; i<items; i++ )
    tmpArray[i] = new Option(list.options[i].text,list.options[i].value);
  // sort options using given function
  tmpArray.sort(compareOptionValue);
  // make copies of sorted options back to list
  //console.log(routeOptions)
  //console.log(tempRoutes)

  for ( i=0; i<items; i++ )
  {
    var localRoute = null;
    for ( j=0; j<tempRoutes.length; j++ )
    {
      if (tempRoutes[j].weight === list.options[i].value)
      {
        
        
        //routeOptions[j] = tempRoutes[i];
        swapArrayElements(tempRoutes, j, i);
        swapArrayElements(routeOptions, j, i);
      }
    }
      
    list.options[i] = new Option(tmpArray[i].text,tmpArray[i].value);
    if (localRoute){
      //console.log("swapping route")
      //swapArrayElements(tempRoutes, i, localRoute);

    }
  }


    
   // 
}
$.ajax({
    type: "GET",
    url: "/fromLua",
    data: { id = "test"},
    dataType: "html",
    success: your function
});

