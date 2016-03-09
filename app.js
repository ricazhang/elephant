'use strict';

var map;
var lines = {};
var elephantLocations = {}; // {name: [locations], name: [locations]}

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

function loadElephantData() {
    $.getJSON("full-locations.json")
        .then(function(json) {
            $.each(json, function(index, jsonObject) {
                var name = jsonObject["name"];
                if (!(name in elephantLocations)) {
                    elephantLocations[name] = new Array();
                }
                var eleObject = {
                    "timestamp": new Date(jsonObject["timestamp"]),
                    "lat": parseFloat(jsonObject["x"]),
                    "lng": parseFloat(jsonObject["y"])
                };
                elephantLocations[name].push(eleObject);
            });
            for (var name in elephantLocations) {
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

                $('#' + name + "-label").append('<span class="distance"> walked ' + totalDistance.toFixed(2) + ' km</span>');
            }
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
        });
}

loadElephantData();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -0.5170211, lng: 9.525267},
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
        // do something only the first time the map is loaded
        for (var eleName in elephantLocations) {
            var line = new google.maps.Polyline({
                path: elephantLocations[eleName],
                geodesic: true,
                strokeColor: getRandomColor(),
                strokeOpacity: 1.0,
                strokeWeight: 2
            })
            lines[eleName] = line;
            line.setMap(map);
        }
    });

}

$(function() {
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
	})
})