if (mobilecheck()) {
    $(".option-container").removeClass('position-fixed');
}

$("#quarter-select").change(function () {
    writeCookie('monkeyWebSelectedQuarter', $("#quarter-select").val());
    location.reload();
});

function gotoHbInfoPage(ID) {
    writeCookie("monkeySelectedHybrid", ID);
    self.location = "/adminHybridInfo";
}

$("#subject").change(function () {
    switch (this.value) {
        case 'M':
            $('.Mhybrid').show();
            $('.Phybrid').hide();
            $('.Chybrid').hide();
            $('.Ehybrid').hide();
            break;
        case 'P':
            $('.Mhybrid').hide();
            $('.Phybrid').show();
            $('.Chybrid').hide();
            $('.Ehybrid').hide();
            break;
        case 'C':
            $('.Mhybrid').hide();
            $('.Phybrid').hide();
            $('.Chybrid').show();
            $('.Ehybrid').hide();
            break;
        case 'E':
            $('.Mhybrid').hide();
            $('.Phybrid').hide();
            $('.Chybrid').hide();
            $('.Ehybrid').show();
            break;
        default:
            $('.Mhybrid').show();
            $('.Phybrid').show();
            $('.Chybrid').show();
            $('.Ehybrid').show();
            break;
    }
});