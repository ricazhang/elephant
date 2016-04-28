'use strict';

var getParameterByName = function(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[#&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var redirectToGoogleOAuth = function() {
    var RESPONSE_TYPE = "token";
    var CLIENT_ID = "362606552631-rqiisqh9qhjitejvp0c97vhoumeqehn6.apps.googleusercontent.com";
    var REDIRECT_URI = "http://ricazhang.github.io/elephant";
    if (window.location.href.indexOf("localhost:8000") > 0) {
        REDIRECT_URI = "http://localhost:8000";
    }
    var SCOPE = "email profile";
    var STATE = "/"
    
    var url = "https://accounts.google.com/o/oauth2/v2/auth?";
    url += "&response_type=" + encodeURIComponent(RESPONSE_TYPE);
    url += "&client_id=" + encodeURIComponent(CLIENT_ID);
    url += "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);
    url += "&scope=" + encodeURIComponent(SCOPE);
    //url += "&state=" + encodeURIComponent(STATE);
    //https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=elephants-of-gabon&redirect_uri=http://ricazhang.github.io/elephant&scope=email%20profile&
    window.location = url;
}

var redirectToOAuth = function() {
    var MYCLIENTID = "elephants-of-gabon";
    var MYREDIRECTURL = "http://ricazhang.github.io/elephant/";
    if (window.location.href.indexOf("localhost:8000") > 0) {
        MYREDIRECTURL = "http://localhost:8000";
    }
    var scope = "identity:netid:read";
    
    var url = "https://oauth.oit.duke.edu/oauth/authorize.php";//Double check if that's right
    url += "?response_type=token";
    url += "&client_id=" + encodeURIComponent(MYCLIENTID);
    url += "&redirect_uri=" + encodeURIComponent(MYREDIRECTURL);
    url += "&scope=" + encodeURIComponent(scope);
    url += "&state=" + encodeURIComponent(Math.random() + 1);
    //redirect the user to the login location
    window.location = url;
}
    
var checkToken = function() {
    console.log("Checking token");
    var token = getParameterByName('access_token');
    console.log(token);
    if (token) {
        localStorage.setItem("access_token", token);
    }

    if (!localStorage.getItem("access_token")) {
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
        var TOKEN = localStorage.getItem("access_token");
        var MYCLIENTID = "elephant";
        
        var req = new XMLHttpRequest();
        var params = "access_token=" + localStorage.getItem("access_token");
        req.open('GET','https://api.colab.duke.edu/identity/v1/');
        req.setRequestHeader('Authorization','Bearer ' + TOKEN);
        req.setRequestHeader("x-api-key", MYCLIENTID);

        req.addEventListener('load',function(result) {
            var json = JSON.parse(result.target.response);
            console.log("NET ID: " + json["netid"]);
            localStorage.setItem("netid", json["netid"]);
        });
        req.send(params);
        return true;
    }
}
