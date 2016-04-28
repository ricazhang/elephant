function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
    }
    return isCompatible;
}

function processData(allText) {
    var recordNum = 7;
    var allTextLines = allText.split(/\r\n|\n/);
    var entries = allTextLines[0].split(',');
    var count = 0;
    
    var myDataRef = new Firebase('https://scorching-inferno-2990.firebaseio.com/elephantData');
    
    myDataRef.authWithCustomToken(localStorage.getItem("access_token"), function(error, result) {
        if (error) {
            console.log("Authentication Failed!", error);
        } else {
            console.log("Authenticated successfully with payload:", result.auth);
            console.log("Auth expires at:", new Date(result.expires * 1000));
        }
    });
    
    for (var i = 0; i < allTextLines.length; i++) {
        var row = allTextLines[i].split(',');
        var obj = {
            "name": row[0],
            "timestamp": row[4],
            "x": row[5],
            "y": row[6]
        };
        myDataRef.push(obj);
        count++;
    }
    
    return count;
}

$(document).ready(function() {
    
    if (!checkToken()) {
        var url = "http://ricazhang.github.io/elephant/login.html";
        if (window.location.href.indexOf("localhost:8000") > 0) {
            url = "http://localhost:8000/login.html";
        }    
        window.location = url;
    }
    
    
    function upload(evt) {
        if (!browserSupportFileUpload()) {
            $('#message').html('The File APIs are not fully supported in this browser!');
        } 
        
        else {
            var data = null;
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onloadend = function(event) {
                var csvData = event.target.result;
                numLines = processData(csvData);
                if (numLines > 0) {
                    $('#message').html('Imported -' + numLines + '- rows successfully!');
                    /*
                    for (var i = 0; i < data.length; i++) {
                        $('#byte_content').append(data[i]);
                        $('#byte_content').append('<br>');
                    }
                    */
                } else {
                    $('#message').html('No data to import!');
                }
            };
            reader.onerror = function() {
                $('#message').html('Unable to read ' + file.fileName);
            };
        }
    }
    
    document.getElementById('read-file-btn').addEventListener('change', upload, false);

}); 