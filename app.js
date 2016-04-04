var map;
var lines = {};
var elephantLocations = {}; // {name: [locations], name: [locations]}
var timestamps = [];
var colors = {}; // {name: color, name: color}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
};

/* get lat long distance formula http://www.movable-type.co.uk/scripts/latlong.html */
function getDistance(lat1, lon1, lat2, lon2) {
    var R = 6371000; // metres
    var phi1 = toRadians(lat1);
    var phi2 = toRadians(lat2);
    var deltaPhi = toRadians(lat2 - lat1);
    var deltaLambda = toRadians(lon2 - lon1);

    var a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d / 100; // km
}

/* color generator source: http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript */
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function formatDate(date) {
    var dateString = date.toLocaleDateString();
    var timeString = date.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
    return dateString + " " + timeString;
}

function loadElephantData() {
    $.getJSON("full-locations.json")
        .then(function(json) {
            $.each(json, function(index, jsonObject) {
                var name = jsonObject["name"];
                var timestamp = new Date(jsonObject["timestamp"]);
                if (!(name in elephantLocations)) {
                    elephantLocations[name] = new Array();
                }
                if (!($.inArray(timestamp, timestamps) > -1)) {
                    timestamps.push(timestamp);
                }

                var eleObject = {
                    "timestamp": timestamp,
                    "lat": parseFloat(jsonObject["x"]),
                    "lng": parseFloat(jsonObject["y"])
                };
                
                elephantLocations[name].push(eleObject);
            });
                        
            $('#slider-range').slider({
                range: true,
                min: 0,
                max: timestamps.length - 1,
                values: [0, timestamps.length - 1],
                slide: function(event, ui) {
                    $('#start-date').html(formatDate( timestamps[ui.values[0]] ));
                    $('#end-date').html(formatDate( timestamps[ui.values[1]]) );
                },
                change: function(event, ui) {
                    redrawMap(ui.values[0], ui.values[1]);
                }
            });
            $('#start-date').html(formatDate(timestamps[0]));
            $('#end-date').html(formatDate(timestamps[timestamps.length - 1]));
            
            //elephantLocationsTimeFilter = elephantLocations;
            $('#slider-range').slider("option", "max", timestamps.length);
            
            for (var name in elephantLocations) {
                elephantLocations[name].sort(function(a, b) {
                    if (a.timestamp > b.timestamp){
                        return 1;
                    } else if (a.timestamp < b.timestamp){
                        return -1;
                    } else {
                        return 0;
                    }
                });
                
            	$('<div>').attr({
            		id: name,
            	}).appendTo('#elephant-names');

            	$('<input>').attr({
				    type: 'checkbox',
				    id: name + "-input",
				    name: name,
				    class: "elephant-name-checkbox",
				    checked: true
				}).appendTo('#' + name);

				$('#' + name + "-input").click(function() {
					if($(this).is(":not(:checked)")) {
				        lines[this.name].setMap(null);
				    }
				    else {
				    	lines[this.name].setMap(map);
				    }
				})

				var label = $("<label>").text(name);
				label.attr({
				    for: name + "-input",
			    	id: name + "-label",
			    	text: name
				}).appendTo('#' + name);

                // calculate distance
                var locations = elephantLocations[name];
                //console.log(locations);
                var totalDistance = 0;
                for (var j = 0; j < locations.length - 1; j++) {
                    var dist = getDistance(locations[j]["lat"], locations[j]["lng"], locations[j + 1]["lat"], locations[j + 1]["lng"]);
                    totalDistance += dist;
                }

                $('#' + name + "-label").append('<span class="distance" id="' + name + '-distance"> walked ' + totalDistance.toFixed(2) + ' km</span>');
            }
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
        });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -0.5170211, lng: 9.525267},
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
        // do something only the first time the map is loaded
        for (var eleName in elephantLocations) {
            colors[eleName] = getRandomColor();
            var line = new google.maps.Polyline({
                path: elephantLocations[eleName],
                geodesic: true,
                strokeColor: colors[eleName],
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: map
            })
            lines[eleName] = line;
        }
    });

}

function clearMap() {
    for (var name in lines) {
        lines[name].setMap(null);
    }
    lines = {};
}

/* doesn't work */
function playMap() {
    clearMap();
    console.log("About to play map");
    
    for (var eleName in elephantLocations) {
        var line = new google.maps.Polyline({
            path: elephantLocations[eleName].slice(0, 10),
            geodesic: true,
            strokeColor: colors[eleName],
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: map
        })
        lines[eleName] = line;
        
        var points = elephantLocations[eleName].length;
        var step = 10;
                
        for (var i= 10; i < points; i++) {
            // using a closure to preserve i
            (function(i) {
                setTimeout(function() {
                    var currPath = lines[eleName].getPath();
                    var latlong = new google.maps.LatLng(
                        elephantLocations[eleName].slice(i, i+1)['lat'], 
                        elephantLocations[eleName].slice(i, i+1)['lng']
                    );
                    currPath.push(latlong);
                    lines[eleName].setPath(currPath);
                }, 500 * i);
            }(i));
        }
    }
}

function redrawMap(leftVal, rightVal) {
    clearMap();
    var leftDate = new Date(timestamps[leftVal]);
    var rightDate = new Date(timestamps[rightVal]);
    console.log(leftDate);
    console.log(rightDate);
    for (var eleName in elephantLocations) {
        var leftIndex = 0;
        var rightIndex = 0;
        for (var i = 0; i < elephantLocations[eleName].length; i++) {
            var currDate = new Date(elephantLocations[eleName][i]["timestamp"]);
            if (currDate < leftDate) {
                leftIndex = i;
            }
            if (currDate < rightDate) {
                rightIndex = i;
            }
        }
        leftIndex += 1;
        console.log("left: " + leftIndex + " right: " + rightIndex);
        console.log(elephantLocations[eleName][leftIndex]["timestamp"]);
        console.log(elephantLocations[eleName][rightIndex]["timestamp"]);
        var line = new google.maps.Polyline({
            path: elephantLocations[eleName].slice(leftIndex, rightIndex),
            geodesic: true,
            strokeColor: colors[eleName],
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: map
        })
        lines[eleName] = line;
        
        // calculate distance
        var locations = elephantLocations[eleName].slice(leftIndex, rightIndex);
        var totalDistance = 0;
        for (var j = 0; j < locations.length - 1; j++) {
            var dist = getDistance(locations[j]["lat"], locations[j]["lng"], locations[j + 1]["lat"], locations[j + 1]["lng"]);
            totalDistance += dist;
        }

        $('#' + eleName + "-distance").html(" " + totalDistance.toFixed(2) + ' km</span>');
    }
}

$('#play-map').click(function(e) {
    e.preventDefault();
    playMap();
});

$(function() {
    if (checkToken()) {
        loadElephantData();
        initMap();
    }
    
	$('#select-all-elephants').click(function(e) {
		e.preventDefault();
		$('.elephant-name-checkbox').each(function() {
			if($(this).is(":not(:checked)")) {
				$(this).trigger("click");
		    }
		})
	});
	$('#deselect-all-elephants').click(function(e) {
		e.preventDefault();
		$('.elephant-name-checkbox').each(function() {
			if($(this).is(":checked")) {
				$(this).trigger("click");
		    }
		})
	});
});