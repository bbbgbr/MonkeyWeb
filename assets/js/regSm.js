let regisQ;
let grade;
let level;
getData();
async function getData() {
    let cookies = getCookieDict();
    let stdID = cookies.monkeyWebUser;
    let [config, stdProfile, allQ] = await Promise.all([getConfig(), studentProfile(stdID), listQuarter("public")]);
    regisQ = config.defaultQuarter.registration;
    for (let i in allQ.quarter) {
        if (allQ.quarter[i].year === regisQ.year && allQ.quarter[i].quarter === regisQ.quarter) {
            $("#regisHead").html("ลงทะเบียน " + allQ.quarter[i].name);
        }
    }
    grade = stdProfile.level.slice(0, -1);
    level = stdProfile.level.slice(-1);
    genButton();
}
async function genButton() {
    let [allCr, crSuggest] = await Promise.all([allCourseV1(regisQ.year, regisQ.quarter), $.post("post/listCourseSuggestion", {
        year: regisQ.year,
        quarter: regisQ.quarter,
        grade: grade
    })]);
    let gradeCR = allCr.filter(data => {
        for (let i in data.grade) {
            if (data.grade[i] === parseInt(grade)) return true;
        }
        return false;
    });
    let crIndex = [1, 1, 1];
    $(".selector").html("-").addClass("disabled");
    for (let i in gradeCR) {
        let t = moment(gradeCR[i].day);
        if (t.hour() === 8) {
            $(".select8-" + crIndex[0]).html(gradeCR[i].courseName + " - " + gradeCR[i].tutorName).removeClass("disabled").attr("id", gradeCR[i].courseID);
            crIndex[0] += 1;
        } else if (t.hour() === 10) {
            $(".select10-" + crIndex[1]).html(gradeCR[i].courseName + " - " + gradeCR[i].tutorName).removeClass("disabled").attr("id", gradeCR[i].courseID);
            crIndex[1] += 1;
        } else if (t.hour() === 13) {
            $(".select13-" + crIndex[2]).html(gradeCR[i].courseName + " - " + gradeCR[i].tutorName).removeClass("disabled").attr("id", gradeCR[i].courseID);
            crIndex[2] += 1;
        }
        if (gradeCR[i].description.length > 0 && gradeCR[i].description !== "-") {
            $("#crDescription").append("<p>" + gradeCR[i].courseName + ": " + gradeCR[i].description + "</p>");
        }
    }
    for (let i in crSuggest.course) {
        if (crSuggest.course[i].level === level) {
            for (let j in crSuggest.course[i].courseID) {
                $("#" + crSuggest.course[i].courseID[j]).addClass("suggestCr");
            }
        }
    }
}
$(".selector").click(function () {
    if (!$(this).hasClass("disabled")) {
        $(this).siblings().removeClass("btn-primary").addClass("btn-light");
        $(this).toggleClass("btn-primary btn-light");
        updateTotal();
    }
});
function updateTotal() {
    let crCount = $(".btn-primary").length;
    $("#total").html("รวมเป็นเงิน " + crCount * 4800 + " บาท");
}
$("#submitBtn").click(function () {
    if ($(".btn-primary").length <= 0) {
        alert("กรุณาเลือกวิชา");
    } else {
        if (confirm("กรุณาตรวจสอบข้อมูลอย่างละเอียด หากกด 'ยืนยัน' แล้วจะไม่สามารถแก้ไขได้")) {
            let crID = [];
            for (let i = 0; i < $(".btn-primary").length; i++) {
                crID.push($(".btn-primary")[i].id);
            }
            let cookies = getCookieDict();
            let stdID = cookies.monkeyWebUser;
            addStudentCourse(stdID, crID).then(cb => {
                log(cb);
                changeRegistrationState(stdID, "untransferred", { year: regisQ.year, quarter: regisQ.quarter }).then(() => {
                    self.location = "/";
                });
            });
        }
    }
});