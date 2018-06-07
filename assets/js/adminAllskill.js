if (mobilecheck()) {
    $(".option-container").removeClass('position-fixed');
}

$("#quarter-select").change(function () {
    writeCookie('monkeyWebSelectedQuarter', $("#quarter-select").val());
    location.reload();
});

function gotoSkillInfoPage(ID) {
    writeCookie('monkeySelectedSkill', ID);
    self.location = '/adminSkillInfo';
}

$("#subject").change(function () {
    if (this.value === "ME") {
        $(".Mskill").show();
        $(".Eskill").show();
    } else if (this.value === "M") {
        $(".Mskill").show();
        $(".Eskill").hide();
    } else if (this.value === "E") {
        $(".Mskill").hide();
        $(".Eskill").show();
    }
});

// $("#addBtn").click(async function () {
//     if (confirm("Are you sure to add new skill?")) {
//         let body = {};
//         body.year = $("#quarter-select").val().slice(0, 4);
//         body.quarter = $("#quarter-select").val().slice(5);
//     }
// });