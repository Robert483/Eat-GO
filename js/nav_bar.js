$(document).ready(function(){
  // Construct the nav baar using jQuery.
  $("body").prepend('<div id="nav_bar"><div id="home"><a type="button" title="Home" href="home.html"><img src="https://material.io/tools/icons/static/icons/baseline-home-24px.svg"/></a></div><h1>Eat GO</h1><div id="account"><a href="sign_in.html"><img src="https://material.io/tools/icons/static/icons/baseline-account_circle-24px.svg"/><span>Login</span> <img id="log_out" src="https://material.io/tools/icons/static/icons/baseline-exit_to_app-24px.svg" title="Log Out"/></a></div></div>');
  
  // Watch for changes in authentication state.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in, so change the layout.
      if (!user.isAnonymous) {
        $("#log_out").css("display", "inline");
        $("#account > a").attr("href", "profile.html");
        $("#account > a > span").text("Hi, " + user.email.split("@")[0]);
      }
    } else {
      // User is signed out, so sign them in as an anonymous account.
      firebase.auth().signInAnonymously();
    }
  });
  
  // Log out click event.
  $("#log_out").click(function(event) {
    event.preventDefault();
    firebase.auth().signOut().then(function() {
      // Sign-out successful, so change the layout.
      $("#log_out").css("display", "none");
      $("#account > a").attr("href", "sign_in.html");
      $("#account > a > span").text("Login");
    }).catch(function(error) {
      // An error happened.
      alert("An error happened when signing out. Please try again later.");
    });
  });
});