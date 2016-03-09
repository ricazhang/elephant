'use strict';

var map;
var elephantNames = [];
var lines = {};
var elephants = {};

/* color generator source: http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript */
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/* sort by attribute source http://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value-in-javascript */
function compare(a,b) {
  if (a["timestamp"] < b["timestamp"])
    return -1;
  else if (a.last_nom > b.last_nom)
    return 1;
  else 
    return 0;
}

//objs.sort(compare);

function loadElephantData() {
    $.getJSON("locations.json")
        .then(function(json) {
            $.each(json, function(index, jsonObject) {
                var name = jsonObject["name"];
                if (elephantNames.indexOf(name) < 0) {
                    elephantNames.push(name);
                    elephants[name] = new Array();
                }
                var eleObject = {
                    "timestamp": new Date(jsonObject["timestamp"]),
                    "lat": parseFloat(jsonObject["x"]),
                    "lng": parseFloat(jsonObject["y"])
                };
                elephants[name].push(eleObject);
            });
            for (var i in elephantNames) {
            	$('<div>').attr({
            		id: elephantNames[i],
            	}).appendTo('#elephant-names');
            	$('<input>').attr({
				    type: 'checkbox',
				    id: elephantNames[i] + "-input",
				    name: elephantNames[i],
				    class: "elephant-name-checkbox",
				    checked: true
				}).appendTo('#' + elephantNames[i]);

				$('#' + elephantNames[i] + "-input").click(function() {
					if($(this).is(":not(:checked)")) {
				        lines[this.name].setMap(null);
				    }
				    else {
				    	lines[this.name].setMap(map);
				    }
				})

				var label = $("<label>").text(elephantNames[i]);
				label.attr({
				    for: elephantNames[i] + "-input",
			    	id: elephantNames[i] + "-label",
			    	text: elephantNames[i]
				}).appendTo('#' + elephantNames[i]);
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
        for (var eleName in elephants) {
            var line = new google.maps.Polyline({
                path: elephants[eleName],
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

function animateCircle(line) {
    var count = 0;
    window.setInterval(function() {
        count = (count + 1) % 200;

        var icons = line.get('icons');
        icons[0].offset = (count / 2) + '%';
        line.set('icons', icons);
    }, 20);
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