'use strict';

function saveUserToFirebase() {
    var myDataRef = new Firebase('https://scorching-inferno-2990.firebaseio.com/users');
    
    myDataRef.authWithCustomToken(localStorage.getItem("access_token"), function(error, result) {
        if (error) {
            console.log("Authentication Failed!", error);
        } else {
            console.log("Authenticated successfully with payload:", result.auth);
            console.log("Auth expires at:", new Date(result.expires * 1000));
        }
    });
    
    var user = {
        "uid": localStorage.getItem("uid"),
        "email": localStorage.getItem("email"),
        "name": localStorage.getItem("name")
    }
    
    myDataRef.push(user);
}

var redirectToGoogleOAuth = function() {
    var ref = new Firebase("https://scorching-inferno-2990.firebaseio.com");
    ref.authWithOAuthPopup("google", function(error, authData) {
        if (error) {
            console.log("Login Failed!", error);
        } else {
            //console.log("Authenticated successfully with payload:", authData);
            //alert(JSON.stringify(authData));
            var token = authData.token;
            var uid = authData.auth.uid;
            var email = authData.google.email;
            var name = authData.google.displayName;
            console.log(authData.auth);
            if (token) {
                localStorage.setItem("access_token", token);
            }
            if (uid) {
                localStorage.setItem("uid", uid);
            }
            if (email) {
                localStorage.setItem("email", email);
            }
            if (name) {
                localStorage.setItem("name", name);
            }
            saveUserToFirebase();
            
            var MYREDIRECTURL = "http://ricazhang.github.io/elephant/";
            if (window.location.href.indexOf("localhost:8000") > 0) {
                MYREDIRECTURL = "http://localhost:8000";
            }
            window.location = MYREDIRECTURL;
        }
    }, { scope: "email" });

}

var checkToken = function() {
    console.log("Checking token");
    var token = localStorage.getItem("access_token");
    console.log(token);

    if (!token) {
        //if we don't have a token yet...
        console.log("We don't have a token.");
        //redirectToOAuth();
        //return true;
        var url = "http://ricazhang.github.io/elephant/login.html";
        if (window.location.href.indexOf("localhost:8000") > 0) {
            url = "http://localhost:8000/login.html";
        }    
        window.location = url;
    }
    else {
        /*we have a token. Let's do a simple (insecure) check to check validity. 
        The server will also need to do a check because this one can be forged by the client, 
        but this one can be used to get the client's netid at least.*/
        console.log("We have a token.");
        return true;
    }
}
