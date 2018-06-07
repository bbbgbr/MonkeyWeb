let year;
let quarter;
let timeTable;
getCourse();
async function getCourse() {
    let cookies = getCookieDict();
    let [config, allQ] = await Promise.all([getConfig(), listQuarter("public")]);
    year = config.defaultQuarter.registration.year;
    quarter = config.defaultQuarter.registration.quarter;
    for (let i in allQ.quarter) {
        if (allQ.quarter[i].year === year && allQ.quarter[i].quarter === quarter) {
            $("#absentHeader").html("แบบฟอร์มลา " + allQ.quarter[i].name);
            $("#presentHeader").html("แบบฟอร์มชดเชย " + allQ.quarter[i].name);
        }
    }
    let startT = moment(0).year(2018).month(2).date(12).hour(6);
    let endT = moment(0).year(2018).month(2).date(30).hour(23);
    let [stdTable, history] = await Promise.all([
        $.post("post/v1/studentTimeTable", { year: year, quarter: quarter, studentID: cookies.monkeyWebUser }),
        $.post("post/v1/listAttendance", { studentStartDate: startT.valueOf(), studentEndDate: endT.valueOf(), studentID: cookies.monkeyWebUser })
    ]);
    timeTable = stdTable;
    enableBtn(stdTable);
    fillHistory(history);
}
function enableBtn(table) {
    for (let i in table.course) {
        let t = moment(table.course[i].day);
        $(".btn-" + t.hour()).removeClass("disabled");
    }
}
function fillHistory(history) {
    for (let i in history) {
        if (history[i].type === 1) {
            if (history[i].reason === 'SummerAbsent') {
                let t = moment(history[i].date);
                $('#a' + t.format('DD-HH')).addClass('btn-danger AID' + history[i]._id).removeClass('btn-light');
            }
        } else if (history[i].type === 2) {
            for (let j in timeTable.course) {
                if (history[i].courseID === timeTable.course[j].courseID) {
                    let t = moment(history[i].date);
                    $('#p' + t.format('DD-HH')).addClass('btn-info AID' + history[i]._id).removeClass('btn-light');
                }
            }
        }
    }
}
$(".btn-a").click(function () {
    if ($(this).hasClass("btn-danger")) {
        if (confirm('ต้องการลบประวัติการลานี้?')) {
            let str = this.className.slice(this.className.indexOf('AID') + 3, this.className.indexOf('AID') + 27);
            removeHistory(str);
        }
    } else if ($(this).hasClass("btn-light")) {
        if (!$(this).hasClass('disabled')) {
            let t = moment(0).year(2018).month(2).date(parseInt(this.id.slice(1, 3))).hour(parseInt(this.id.slice(4)));
            let crName;
            let crID;
            for (let i in timeTable.course) {
                let newt = moment(timeTable.course[i].day);
                if (newt.hour() === t.hour()) {
                    crName = timeTable.course[i].courseName;
                    crID = timeTable.course[i].courseID;
                }
            }
            if (confirm('ต้องการลาคอร์ส ' + crName + '?')) {
                addAbsent(crID, t);
            }
        }
    }
});
$(".btn-p").click(function () {
    if ($(this).hasClass("btn-light")) {
        let t = moment(0).year(2018).month(2).date(parseInt(this.id.slice(1, 3))).hour(parseInt(this.id.slice(4)));
        // for (let i in timeTable.course) {
        //     $("#presentSubj").append(
        //         "<option value=" + t.date() + "-" + timeTable.course[i].courseID + ">" + timeTable.course[i].courseName + "</option>"
        //     );
        // }
        // $("#addPresentModal").modal('show');
        if ($(".btn-info").length >= $(".btn-danger").length) {
            alert('ไม่สามารถเพิ่มมากกว่าจำนวนที่ลาได้');
        } else {
            if (confirm('ยืนยันการชดเชย?')) {
                addPresent(timeTable.course[0].courseID, t);
            }
        }
    } else if ($(this).hasClass("btn-info")) {
        if (confirm('ต้องการลบประวัติการชดเชยนี้?')) {
            let str = this.className.slice(this.className.indexOf('AID') + 3, this.className.indexOf('AID') + 27);
            removeHistory(str);
        }
    }
});
async function removeHistory(id) {
    $("#waiting").modal('show');
    let cb = await $.post('post/v1/deleteAttendance', { attendanceID: id });
    log(cb);
    location.reload();
}
async function addAbsent(crID, time) {
    $("#waiting").modal('show');
    let body = {};
    let cookies = getCookieDict();
    body.userID = cookies.monkeyWebUser;
    body.reason = "SummerAbsent";
    body.sender = 'ผปค.';
    body.courseID = crID;
    body.date = time.valueOf();
    let cb = await $.post("post/v1/addStudentAbsent", body);
    log(cb);
    location.reload();
}
// $("#addPresentBtn").click(function () {
//     let str = $("#presentSubj").val();
//     let date = str.slice(0, str.indexOf('-'));
//     let id = str.slice(str.indexOf('-') + 1);
//     if (confirm('ยืนยันการชดเชย?')) {
//         addPresent(id, date);
//     }
// });
async function addPresent(crID, date) {
    $("#addPresentModal").modal('hide');
    $("#waiting").modal('show');
    let body = {};
    let cookies = getCookieDict();
    body.userID = cookies.monkeyWebUser;
    body.date = date.valueOf();
    body.courseID = crID;
    body.sender = 'ผปค.';
    let cb = await $.post('post/v1/addStudentPresent', body);
    log(cb);
    location.reload();
}