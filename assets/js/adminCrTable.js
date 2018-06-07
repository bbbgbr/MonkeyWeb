const studentLevel = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"];
function dateToDay(date) {
    if (quarter < 10) {
        switch (date) {
            case 176400000:
                return "sat8";
                break;
            case 183600000:
                return "sat10";
                break;
            case 194400000:
                return "sat13";
                break;
            case 201600000:
                return "sat15";
                break;
            case 262800000:
                return "sun8";
                break;
            case 270000000:
                return "sun10";
                break;
            case 280800000:
                return "sun13";
                break;
            case 288000000:
                return "sun15";
                break;
        }
    } else {
        let t = moment(date);
        switch (t.hour()) {
            case 8:
                return "sat8";
                break
            case 10:
                return "sat10";
                break
            case 13:
                return "sat13";
                break
        }
    }
}
let year;
let quarter;
getQuarter();
async function getQuarter() {
    let [allQ, config] = await Promise.all([
        listQuarter('private'),
        getConfig()
    ]);
    for (let i in allQ.quarter) {
        $("#quarter").append(
            "<option value='" + allQ.quarter[i].year + '-' + allQ.quarter[i].quarter + "'>" + allQ.quarter[i].name + "</option>"
        );
    }
    let cookies = getCookieDict();
    if (cookies.monkeyWebSelectedQuarter === undefined) {
        $("#quarter").val(config.defaultQuarter.registration.year + '-' + config.defaultQuarter.registration.quarter);
        writeCookie("monkeyWebSelectedQuarter", $("#quarter").val());
        year = config.defaultQuarter.registration.year;
        quarter = config.defaultQuarter.registration.quarter;
    } else {
        $("#quarter").val(cookies.monkeyWebSelectedQuarter);
        let str = $("#quarter").val();
        year = str.slice(0, 4);
        quarter = str.slice(5);
    }
}
$("#quarter").change(function () {
    writeCookie("monkeyWebSelectedQuarter", $("#quarter").val());
    let str = $("#quarter").val();
    year = str.slice(0, 4);
    quarter = str.slice(5);
    sendLevel();
});
function sendLevel() {
    let allLevel = [];
    $('#level').find(':checked').each(function () {
        allLevel.push($(this).val());
    });
    $("#tableLevel").empty().append("<td rowspan='2' style='background-color: black'></td>");
    $("#tableGroup").empty();
    $("#sat8").empty().append("<th width='70px' style='background-color: #cf95ff;text-align: center;vertical-align: middle'>8-10</th>");
    $("#sat10").empty().append("<th style='background-color: #cf95ff;text-align: center;vertical-align: middle'>10-12</th>");
    $("#sat13").empty().append("<th style='background-color: #cf95ff;text-align: center;vertical-align: middle'>13-15</th>");
    $("#sat15").empty().append("<th style='background-color: #cf95ff;text-align: center;vertical-align: middle'>15-17</th>");
    $("#sun8").empty().append("<th style='background-color: #ffd59a;text-align: center;vertical-align: middle'>8-10</th>");
    $("#sun10").empty().append("<th style='background-color: #ffd59a;text-align: center;vertical-align: middle'>10-12</th>");
    $("#sun13").empty().append("<th style='background-color: #ffd59a;text-align: center;vertical-align: middle'>13-15</th>");
    $("#sun15").empty().append("<th style='background-color: #ffd59a;text-align: center;vertical-align: middle'>15-17</th>");
    $("#spaceRow").empty().append("<td colspan='80'></td>");
    genTable(allLevel, 0);
}
function genTable(allLevel, i) {
    if (i >= allLevel.length) return;
    let position = allLevel[i] - 1;
    $.post("post/gradeCourse", { grade: allLevel[i], year: year, quarter: quarter }).then((allCr) => {
        $.post("post/listCourseSuggestion", { grade: allLevel[i], year: year, quarter: quarter }).then((suggCr) => {
            //init column
            for (let j = 0; j < suggCr.course.length; j++) {
                $("#sat8").append("<td style='text-align: center' id=" + allLevel[i] + 'sat8' + (j + 1) + "></td>");
                $("#sat10").append("<td style='text-align: center' id=" + allLevel[i] + 'sat10' + (j + 1) + "></td>");
                $("#sat13").append("<td style='text-align: center' id=" + allLevel[i] + 'sat13' + (j + 1) + "></td>");
                $("#sat15").append("<td style='text-align: center' id=" + allLevel[i] + 'sat15' + (j + 1) + "></td>");
                $("#sun8").append("<td style='text-align: center' id=" + allLevel[i] + 'sun8' + (j + 1) + "></td>");
                $("#sun10").append("<td style='text-align: center' id=" + allLevel[i] + 'sun10' + (j + 1) + "></td>");
                $("#sun13").append("<td style='text-align: center' id=" + allLevel[i] + 'sun13' + (j + 1) + "></td>");
                $("#sun15").append("<td style='text-align: center' id=" + allLevel[i] + 'sun15' + (j + 1) + "></td>");
            }
            //find course out course suggestion
            let crID = [];
            for (let j = 0; j < suggCr.course.length; j++) {
                crID = crID.concat(suggCr.course[j].courseID)
            }
            let outerCr = [];
            for (let j = 0; j < allCr.course.length; j++) {
                if (crID.indexOf(allCr.course[j].courseID) === -1) {
                    outerCr.push(allCr.course[j].courseID);
                }
            }
            //gen table
            $("#tableLevel").append("<th style='text-align: center;background-color:" + ((i % 2 === 0) ? "#bfffa5" : "#aeffff")
                + "' colspan=" + suggCr.course.length + ">" + studentLevel[position] + "</th>");
            genTableGroup(allLevel[i], suggCr, allCr, outerCr, 0);
            genTable(allLevel, i + 1);
        });
    });
}
function genTableGroup(level, suggCr, allCr, outerCr, i) {
    if (suggCr.course.length === 0) {
        $("#tableGroup").append("<td style='text-align: center'></td>");
        for (let j = 0; j < allCr.course.length; j++) {
            $.post("post/name", { userID: allCr.course[j].tutor[0] }).then((name) => {
                $("#" + level + dateToDay(allCr.course[j].day) + (i + 1)).append(allCr.course[j].courseName + "-" + name.nicknameEn + "<br>");
            })
        }
        return;
    } else if (i >= suggCr.course.length) return;
    $("#tableGroup").append("<th style='text-align: center'>" + suggCr.course[i].level + "</th>");
    for (let j = 0; j < allCr.course.length; j++) {
        if (suggCr.course[i].courseID.indexOf(allCr.course[j].courseID) >= 0) {
            $.post("post/name", { userID: allCr.course[j].tutor[0] }).then((name) => {
                $("#" + level + dateToDay(allCr.course[j].day) + (i + 1)).append(allCr.course[j].courseName + "-" + name.nicknameEn + "<br>");
            })
        }
        if (outerCr.indexOf(allCr.course[j].courseID) >= 0) {
            $.post("post/name", { userID: allCr.course[j].tutor[0] }).then((name) => {
                $("#" + level + dateToDay(allCr.course[j].day) + (i + 1)).append(allCr.course[j].courseName + "-" + name.nicknameEn + "<br>");
            })
        }
    }
    genTableGroup(level, suggCr, allCr, outerCr, i + 1)
}