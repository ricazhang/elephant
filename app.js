var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -0.705369, lng: 11.515727},
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  });

  google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
    // do something only the first time the map is loaded
    var marker = new google.maps.Marker({
      position: {lat: -0.705369, lng: 11.515727},
      map: map,
      title: 'David'
    });

    var lineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      strokeColor: '#393'
    };

    var elephantPath = [
      {lat: -0.705369, lng: 11.515727},
      {lat: -0.275891, lng: 11.455079},
      {lat: 0.415270, lng: 12.668468},
      {lat: -0.092899, lng: 12.535864},
    ];

    var elephantLine = new google.maps.Polyline({
      path: elephantPath,
      geodesic: true,
      icons: [{
        icon: lineSymbol,
        offset: '100%'
      }],
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    elephantLine.setMap(map);
    animateCircle(elephantLine);
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