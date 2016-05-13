$(document).ready(function() {
    setTimeout(function(){
        $('body').addClass('loaded');
    }, 3500); 
});

if (screen.width <= 800) {
    window.location = "http://m.liamwilt.com";
}
