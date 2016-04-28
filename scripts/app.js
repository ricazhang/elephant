var map;
var lines = {};
var elephantLocations = {}; // {name: [locations], name: [locations]}
var timestamps = [];
var colors = {}; // {name: color, name: color}
var mostRecentInfoWindow;
var markers = [];

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

$('#final-location').click(function(e) {
    e.preventDefault();
    if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }
    else {
        for (name in elephantLocations) {
            createMarker(name);
        }
        console.log(markers.length);
    }
    
})

function createMarker(name) {
    var lastIndex = elephantLocations[name].length;
    var infowindow = new google.maps.InfoWindow({
        content: '<h3>' + name + '</h3>' 
        + '<p>Location: ' + elephantLocations[name][lastIndex - 1]["lat"] + ", " 
        + elephantLocations[name][lastIndex - 1]["lng"] + '</p>'
    });
    var marker = new google.maps.Marker({
        position: elephantLocations[name][lastIndex - 1],
        map: map,
        title: name,
        label: name
    });
    markers.push(marker);
    marker.addListener('click', function() {
        if (mostRecentInfoWindow) {
            mostRecentInfoWindow.close();
        }
        infowindow.open(map, marker);
        mostRecentInfoWindow = infowindow;
    });
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

function retrieveFirebaseData() {
    console.log("starting firebase");

    var myDataRef = new Firebase('https://scorching-inferno-2990.firebaseio.com/elephantData');
    
    myDataRef.authWithCustomToken(localStorage.getItem("access_token"), function(error, result) {
    if (error) {
        console.log("Authentication Failed!", error);
    } else {
        console.log("Authenticated successfully with payload:", result.auth);
        console.log("Auth expires at:", new Date(result.expires * 1000));
    }
    });
    
    return new Promise(function(resolve, reject) {
        myDataRef.once("value", function(snapshot) {
            snapshot.forEach(function(data) {
                //console.log(data.val().name + " : " + data.val().timestamp);
                
                var name = data.val().name;
                var timestamp = new Date(data.val().timestamp);
                if (!(name in elephantLocations)) {
                    elephantLocations[name] = new Array();
                }
                if (!($.inArray(timestamp, timestamps) > -1)) {
                    timestamps.push(timestamp);
                }

                var eleObject = {
                    "timestamp": timestamp,
                    "lat": parseFloat(data.val().y),
                    "lng": parseFloat(data.val().x)
                };
                
                elephantLocations[name].push(eleObject);
            });
            
            resolve("success");
        }, function(err) {
            reject("failed: " + err);
        });
    });
}

function loadElephantData() {
    retrieveFirebaseData()
        .then(function(response) {
            console.log(response);
                        
            timestamps = timestamps.sort(function(a, b) {
                if (a.getTime() > b.getTime()){
                    return 1;
                } else if (a.getTime() < b.getTime()){
                    return -1;
                } else {
                    return 0;
                }
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
                elephantLocations[name] = elephantLocations[name].sort(function(a, b) {
                    if (a.timestamp.getTime() > b.timestamp.getTime()){
                        return 1;
                    } else if (a.timestamp.getTime() < b.timestamp.getTime()){
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
        })
        .catch(function( rejection ) {
            console.log( rejection );
        });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -0.5170211, lng: 9.525267},
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });
    /*
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
    */

}

function clearMap() {
    for (var name in lines) {
        lines[name].setMap(null);
    }
    lines = {};
}

function playMap() {
    $('#play-map').prop("disabled", true);
    var playSpeed = $('#play-map-speed').val();
    playSpeed = parseInt(playSpeed);
    playRecursive(0, playSpeed);
}

function playRecursive(counter, playSpeed) {
    if (counter < timestamps.length){
        redrawMap(0, counter);
        counter += 200;
        setTimeout(function() { playRecursive(counter, playSpeed); }, playSpeed);
    }
    else {
        $('#play-map').prop("disabled", false);
    }
}

function redrawMap(leftVal, rightVal) {
    clearMap();
    var leftDate = new Date(timestamps[leftVal]);
    var rightDate = new Date(timestamps[rightVal]);
    //console.log(rightDate);
    for (var eleName in elephantLocations) {
        // only redraw if checked
        if ($('#' + eleName + "-input:checked").length > 0) {
            var leftIndex = 0;
            var rightIndex = 0;
            for (var i = 0; i < elephantLocations[eleName].length; i++) {
                var currDate = new Date(elephantLocations[eleName][i]["timestamp"]);
                if (currDate.getTime() < leftDate.getTime()) {
                    leftIndex = i;
                }
                if (currDate.getTime() < rightDate.getTime()) {
                    rightIndex = i;
                }
            }
            leftIndex += 1;
            //console.log("left: " + leftIndex + " right: " + rightIndex);
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
}

$('#play-map').click(function(e) {
    e.preventDefault();
    playMap();
});

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

$(function() {
    if (checkToken()) {
        loadElephantData();
        //initMap();
    }
    else {
        var url = "http://ricazhang.github.io/elephant/login.html";
        if (window.location.href.indexOf("localhost:8000") > 0) {
            url = "http://localhost:8000/login.html";
        }    
        window.location = url;
    }
});