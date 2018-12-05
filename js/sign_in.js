$(document).ready(function (){
  // Initialize the FirebaseUI Widget using Firebase.
  let ui = new firebaseui.auth.AuthUI(firebase.auth());
  let anonymousData = null;

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      if (!user.isAnonymous) {
        if (anonymousData != null) {
          // Delete anonymous data if upgraded from anonymous account.
          firebase.database().ref("cart/" + user.uid).update(anonymousData, function () {
            redirect();
          });
        } else {
          redirect();
        }
      } else {
        ui.start('#log_in', {
          callbacks: {
            signInFailure: function(error) {
              // Check for merge conflicts
              if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
                return Promise.resolve();
              }
              
              // Copy data from anonymous user to permanent user and delete anonymous user.
              firebase.database().ref("cart/" + user.uid).once('value').then(function (snapshot) {
                if (snapshot.exists()) {
                  anonymousData = snapshot.val();
                  firebase.database().ref("cart/" + user.uid).remove();
                }
              });
              
              // Finish sign-in after data is copied.
              return firebase.auth().signInWithCredential(error.credential);
            }
          },
          autoUpgradeAnonymousUsers: true,
          signInSuccessUrl: 'home.html',
          signInOptions: [
            firebase.auth.EmailAuthProvider.PROVIDER_ID
          ]
        });
      }
    } else {
      // User is signed out, so sign in with an anonymous account.
      firebase.auth().signInAnonymously();
    }
  });
});

// Redirect to previous page if same domain. Otherwise, to home page.
function redirect() {
  if (document.referrer.split('/')[2] === window.location.host) {
    history.go(-1);
  } else {
    window.location.href = "home.html";
  }
}