// Get the geocoder service for converting latitude and longitude to an address and vice versa.
const searchProvider = new L.Control.Geocoder.Nominatim();

// Create a map.
const map = L.map('map', {
  zoom: 15
});

// Create delivery address marker.
const currentMarker = L.marker([ 0, 0 ], {
  draggable: true,
  zIndexOffset: 5,
  icon: L.icon({
    iconUrl: 'images/current.svg',
    iconSize: [ 20, 20 ],
    iconAnchor: [ 10, 10 ]
  })
});

// Create a path that show the route between two points.
const routing = L.Routing.control({
  show: false,
  fitSelectedRoutes: false,
  lineOptions: {
    addWaypoints: false
  },
  plan: new L.Routing.Plan([ [ 0, 0 ], [ 0, 0 ] ], {
    addWaypoints: false,
    draggableWaypoints: false,
    createMarker: function () {
      return false;
    }
  })
});

// Recommend button click event.
var recommend = function () {
  $("#pop_up").fadeIn(500);
};

// Event for the when users enter a search string to search for a location.
var changeLocation = function () {
  $("#search_field").blur();
  $("#loading").fadeIn(500);
  
  // Search a location based on a search text.
  searchProvider.geocode($("#search_field").val(), function (result) {
    if (result.length > 0) {
      // Found a location.
      let coordinate = [ result[0].center.lat, result[0].center.lng ];
      
      // Add delivery address marker.
      $("#search_field").val(result[0].name);
      map.setView(coordinate);
      currentMarker.setLatLng(coordinate);
      currentMarker.addTo(map);
      routing.spliceWaypoints(0, 1, currentMarker.getLatLng());
      routing.addTo(map);
    } else {
      $("#loading").fadeOut(500);
    }
  });

  return false;
}

$(document).ready(function () {
  // Hide recommendation popup when click outside of the popup.
  $("#pop_up").click(function (event) {
    $("#pop_up").fadeOut(500);
  });
  
  $("#pop_up > div").click(function (event) {
    event.stopPropagation();
  });
  
  // Add click events to each menu of the restaurant to redirect the user to the menu page.
  $("#res_menu").on("click", "> div", function (event) {
    window.location.href = "menu.html?restaurant=" + selectedMarker.id + "#" + $(this).attr("id");
  });
  
  // Add tiles service for map to display. Tiles are retrieved from Wikimedia.
  L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
    attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
    minZoom: 1,
    maxZoom: 19
  }).addTo(map);
  
  map.zoomControl.setPosition('bottomleft');
  
  // Change delivery address marker on mouse click. Change the route if neccessary.
  map.on("click", function (event) {
    currentMarker.setLatLng(event.latlng);
    currentMarker.addTo(map);
    routing.spliceWaypoints(0, 1, currentMarker.getLatLng());
    routing.addTo(map);
    
    // Convert latitude and longitude to an address string.
    searchProvider.reverse(event.latlng, map.getZoom(), function (result) {
      $("#search_field").val(result[0].name);
    });
  });
  
  map.on("moveend", function () {
    if ($("#loading").is(":visible")) {
      $("#loading").fadeOut(500);
    }
  });
  
  // Change search text on delivery address marker dragging.
  currentMarker.on("dragend", function (event) {
    // Convert latitude and longitude to an address string.
    searchProvider.reverse(currentMarker.getLatLng(), map.getZoom(), function (result) {
      $("#search_field").val(result[0].name);
      routing.spliceWaypoints(0, 1, currentMarker.getLatLng());
      routing.addTo(map);
    });
  });

  // Create current location control for the map.
  L.control.locate({
    position: "bottomleft",
    keepCurrentZoomLevel: true,
    showPopup: false,
    locateOptions: {
      setView: true
    }
  }).addTo(map);
  
  let urlParams = new URLSearchParams(window.location.search);
  let x = urlParams.get("x");
  let y = urlParams.get("y");
  
  // Check if params contain latitude and longitude.
  if (x != null && !isNaN(x) && y != null && !isNaN(y)) {
    let pos = [ parseFloat(x), parseFloat(y) ];
    map.setView(pos);
    currentMarker.setLatLng(pos);
    currentMarker.addTo(map);
    routing.spliceWaypoints(0, 1, currentMarker.getLatLng());
    routing.addTo(map);
  } else if (urlParams.get("search") != null) {
    // Params contain address search string.
    // Search a location based on a search text.
    searchProvider.geocode(urlParams.get("search"), function (result) {
      if (result.length > 0) {
        // Found a location. Add delivery address marker.
        let pos = [ result[0].center.lat, result[0].center.lng ];
        $("#search_field").val(result[0].name);
        map.setView(pos);
        currentMarker.setLatLng(pos);
        currentMarker.addTo(map);
        routing.spliceWaypoints(0, 1, currentMarker.getLatLng());
        routing.addTo(map);
      } else {
        // Cannout found any locations. Go to world map view.
        map.setView([ 0, 0 ], 1);
      }
    });
  } else {    
    // No params. Go to world map view.
    map.setView([ 0, 0 ], 1);
  }
  
  // Create a default icon for restaurant marker.
  let defaultIcon = L.icon({
    iconUrl: 'images/restaurant.svg',
    iconSize: [ 30, 30 ],
    iconAnchor: [ 15, 30 ],
    tooltipAnchor: [ 0, -15 ]
  });
  
  // Create a icon for restaurant marker when it's selected.
  let selectedIcon = L.icon({
    iconUrl: 'images/selected-restaurant.svg',
    iconSize: [ 30, 30 ],
    iconAnchor: [ 15, 30 ],
    tooltipAnchor: [ 0, -15 ]
  });
  
  let selectedMarker = null;
  let markers = {};
  
  // Watch for every restaurant location node when they are added.
  firebase.database().ref("restaurantMap").on("child_added", function (snapshot) {
    let data = snapshot.val();
    
    // Create a restaurant maker with tooltip to display rating.
    markers[snapshot.key] = L.marker([ data.lat, data.lng ], {
      zIndexOffset: 3,
      icon: defaultIcon
    }).bindTooltip(L.tooltip({
      direction: "top",
      permanent: true,
      className: "rating"
    })).setTooltipContent(createStars(data.rating)).addTo(map);
    
    // Add ID to the restaurant marker, which will be used when they got clicked.
    markers[snapshot.key].id = snapshot.key;
    markers[snapshot.key].on("click", function (event) {
      // Deselect current selected restaurant marker.
      if (selectedMarker != null) {
        selectedMarker.setIcon(defaultIcon);
      }
      
      selectedMarker = event.sourceTarget;
      selectedMarker.setIcon(selectedIcon);
      
      // Get and display the details of the restaurant with a given ID.
      firebase.database().ref("restaurant/" + selectedMarker.id).on("value", function (snapshot) {
        let data = snapshot.val();
        let keys = Object.keys(data.menu);
      
        $("#res_img").attr("src", data.image);
        $("#res_name").text(data.name);
        $("#res_address").text(data.address);
        $("#res_phone").text(data.phone);
        $("#res_hours").text(data.hours);
        $("#res_menu").empty();
        
        // Construct list of menu using jquery.
        for (let i in keys) {
          $("#res_menu").append("<div id='menu" + i + "'><div class='menuItem'> <div class='menuPhoto'> <img src='" + data.menu[keys[i]] + "'/> </div> <div class='menuName'>" + keys[i] + "</div> </div> </div>");
        }
        
        // Show left-pane, which contains the details.
        $("#res_container").css("display", "table-cell");
        
        // Change path to the delivery address.
        routing.spliceWaypoints(1, 1, selectedMarker.getLatLng());
        routing.addTo(map);
      });
    });
  });
  
  // Watch for every restaurant location node when they are changed.
  firebase.database().ref("restaurantMap").on("child_changed", function (snapshot) {
    let data = snapshot.val();
    markers[snapshot.key].setLatLng([ data.lat, data.lng ]).setTooltipContent(createStars(data.rating));
  });
  
  // Watch for every restaurant location node when they are removed.
  firebase.database().ref("restaurantMap").on("child_removed", function (snapshot) {
    markers[snapshot.key].remove();
    delete markers[snapshot.key];
  });
});

// Create a string of star based on a double. Use font-awesome to make it look good.
function createStars(rating) {
  let stars = "";
  
  while (rating > 1) {
    stars += "<i class='fas fa-star'></i>";
    rating -= 1.0;
  }
  
  if (rating > 0.75) {
    stars += "<i class='fas fa-star'></i>";
  } else if (rating > 0.25) {
    stars += "<i class='fas fa-star-half-alt'></i>";
  }
  
  return stars;
}