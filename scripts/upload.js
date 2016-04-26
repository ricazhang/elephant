function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
    }
    return isCompatible;
}

function processData(allText) {
    var recordNum = 7;  // or however many elements there are in each row
    var allTextLines = allText.split(/\r\n|\n/);
    var entries = allTextLines[0].split(',');
    var lines = [];
    
    var headings = entries.splice(0, recordNum);
    while (entries.length > 0) {
        var tarr = [];
        var delim = " : ";
        for (var j = 0; j < recordNum; j++) {
            tarr.push(headings[j] + delim + entries.shift());
        }
        lines.push(tarr);
    }
    
    for (var i = 0; i < allTextLines.length; i++) {
        lines.push(allTextLines[i].split(','));
    }
    
    return lines;
    // alert(lines);
}


$(document).ready(function() {
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
                data = processData(csvData);
                //console.log(csvData);
                //data = $.csv.toArrays(csvData);
                if (data && data.length > 0) {
                    $('#message').html('Imported -' + data.length + '- rows successfully!');
                    
                    for (var i = 0; i < data.length; i++) {
                        $('#byte_content').append(data[i]);
                        $('#byte_content').append('<br>');
                    }
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