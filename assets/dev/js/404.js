var inputReady = true;
var input = $('.a404-input');
input.focus();
$('.container').on('click', function (e) {
    input.focus();
});

input.on('keyup', function (e) {
    $('.new-output').text(input.val());
});

$('.four-oh-four-form').on('submit', function (e) {
    e.preventDefault();
    var val = $(this).children($('.a404-input')).val().toLowerCase();
    var href;

    window.location = '/' + val;
});