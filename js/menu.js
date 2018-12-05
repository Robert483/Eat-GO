// Order check-out button event.
var goToCart = function() {
  window.location.href = "payment.html";
};

$(document).ready(function (){
  let urlParams = new URLSearchParams(window.location.search);
  
  // Check if url has restaurant param to determine the menu. If not, go to 404 page.
  if (urlParams.get("restaurant") != null) {
    let i = 0;
    let resId = urlParams.get("restaurant");
    let dict = {};
    
    // Get the name of restaurant.
    firebase.database().ref("restaurant/" + resId + "/name").on("value", function (snapshot) {
      $("#res_name").text(snapshot.val());
    });
    
    // Watch for every menu child node when they are added.
    firebase.database().ref("menu/" + resId).on("child_added", function (snapshot) {
      // Check if the restaurant with given id has menu. If not, go to 404 page.
      if (snapshot.exists()) {
        dict[snapshot.key] = "#menu" + i;
        
        // Construct each menu.
        let elm = $("<div id='menu" + i + "' class='menu'> <h3>" + snapshot.key + "</h3> <div class='foodList'> " + createFood(snapshot.val(), dict[snapshot.key]) + "</div> </div> <div class='divider'></div>");
        $("#menu_container").append(elm);
        
        // Write to database when users change the quantity of the food.
        elm.find(".quantity > input").on("input", function (event) {
          let uid = firebase.auth().currentUser.uid;
          firebase.database().ref("cart/" + uid + "/" + $(this).parent().prev().find("summary").text()).set(parseInt($(this).val()));
        });
        
        // Check if url has element id to scroll to.
        if (window.location.hash != null && window.location.hash === dict[snapshot.key]) {
          $('html, body').animate({
              scrollTop: $(window.location.hash).offset().top
          }, 2000);
        }
        
        i++;
      } else {
        window.location.href = "404.html";
      }
    });
    
    // Watch for every menu child node when they are changed.
    firebase.database().ref("menu/" + resId).on("child_changed", function (snapshot) {
      let elm = $(dict[snapshot.key] + " .foodList").empty();
      elm.append(createFood(snapshot.val(), dict[snapshot.key]));
    });
    
    // Watch for every menu child node when they are removed.
    firebase.database().ref("menu/" + resId).on("child_removed", function (snapshot) {
      let elm = $(dict[snapshot.key]);
      elm.next().remove();
      elm.remove();
    });
  } else {
    window.location.href = "404.html";
  }
});

// Construct each food html string.
function createFood(data, selector) {
  let result = "";
  let keys = Object.keys(data);
  let uid = firebase.auth().currentUser.uid;
  
  for (let i in keys) {
    // Get the quantity of each food currently in the cart.
    firebase.database().ref("cart/" + uid + "/" + keys[i]).once("value").then(function (snapshot) {
      if (snapshot.exists()) {
        $(selector + " .food" + i).val(snapshot.val());
      }
    });
  
    result += "<div class='foodItem'> <div class='foodPhoto'> <img src='" + data[keys[i]].image + "'/> </div> <div class='foodName'> <details> <summary>" + keys[i] + "</summary> <p>" + data[keys[i]].ingredients + "</p> </details> </div> <div class='quantity'> <input class='food" + i + "' type='number' value='0' min='0'/> </div> </div> ";
  }
  
  return result;
}