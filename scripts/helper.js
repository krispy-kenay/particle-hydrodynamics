window.onload = function() {
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'range' && input.oninput) {
            input.oninput();
        }
    }
};