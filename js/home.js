// Redirect user after they enter an address to search for.
var searchWithString = function() {
  window.location.href = "locator.html?search=" + $("#search_field").val();
  return false;
};

// Search based on current location.
var searchWithCurrentLocation = function () {
  console.log("asdfsadf");
  if ("geolocation" in navigator){
    navigator.geolocation.getCurrentPosition(function(position){
      window.location.href = "locator.html?x=" + position.coords.latitude + "&y=" + position.coords.longitude;
    });
  }
}

// Change background to random one every 7s
var currentBckgndIndex = 0;
setInterval(function () {
  let bckgndIndex = Math.floor((Math.random() * 4));
  
  while (bckgndIndex == currentBckgndIndex) {
    bckgndIndex = Math.floor((Math.random() * 4));
  }
  
  // Construct url to the image
  currentBckgndIndex = bckgndIndex;
  bckgndIndex = "url('images/background" + bckgndIndex + ".jpg')";
  
  $("#search_container").css("background-image", bckgndIndex);
}, 7000);