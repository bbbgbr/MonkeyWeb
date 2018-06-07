// global param
let studentID;
let year;
let quarter;
let quarterName;
let timetable;
let startDate;
let endDate;
let mHbFound;
let pHbFound;
let mHbMax;
let pHbMax;

// datePicker
let initDate = moment();
initDate.date(initDate.date() - 1);
$("#absentDate").datetimepicker({
    format: "DD/MM/YYYY",
    daysOfWeekDisabled: [1, 3, 5],
    minDate: initDate
});

// main
let cookies = getCookieDict();
studentID = cookies.monkeyWebUser;

getYearAndQuarter();
async function getYearAndQuarter() {
    let [config, allQ] = await Promise.all([
        getConfig(),
        listQuarter('private')
    ]);
    year = config.defaultQuarter.quarter.year;
    quarter = config.defaultQuarter.quarter.quarter;
    for (let i in allQ.quarter) {
        if (allQ.quarter[i].year === year && allQ.quarter[i].quarter === quarter) {
            quarterName = allQ.quarter[i].name;
            startDate = allQ.quarter[i].startDate;
            endDate = allQ.quarter[i].endDate;
        }
    }
    genBanner();
    getTimetable();
}

function genBanner() {
    $("#pageBanner").html(quarterName);
    $("#tableLabel").html("(" + quarterName + ")");
}

async function getTimetable() {
    timetable = await $.post("post/v1/studentTimeTable", { year: year, quarter: quarter, studentID: studentID });
    getHistory();
    fillButton();
    showQuota();
}

function fillButton() {
    $(".selector").html("-").removeClass("cr hb btn-warning").addClass("btn-light disabled");
    $(".labelor").html("-");
    let pickDate = $('#absentDate').data('DateTimePicker').date();
    let cr = timetable.course;
    let hb = timetable.hybrid;
    if (pickDate.day() === 2 || pickDate.day() === 4) {
        $(".label-8").html("16-18");
        for (let i in hb) {
            let t = moment(hb[i].day);
            if (t.day() === pickDate.day()) {
                $(".btn-8").html("FHB:" + hb[i].subject).removeClass("disabled").addClass("hb").attr("id", hb[i].hybridID);
            }
        }
    } else {
        $(".label-8").html("8-10");
        $(".label-10").html("10-12");
        $(".label-13").html("13-15");
        $(".label-15").html("15-17");
        for (let i in cr) {
            let t = moment(cr[i].day);
            if (t.day() === pickDate.day()) {
                $(".btn-" + t.hour()).html("CR:" + cr[i].courseName).removeClass("disabled").addClass("cr").attr("id", cr[i].courseID);
            }
        }
        for (let i in hb) {
            let t = moment(hb[i].day);
            if (t.day() === pickDate.day()) {
                $(".btn-" + t.hour()).html("FHB:" + hb[i].subject).removeClass("disabled").addClass("hb").attr("id", hb[i].hybridID);
            }
        }
    }
}

async function getHistory() {
    $("#absentTableBody").empty();
    $("#presentTableBody").empty();
    let history = await $.post("post/v1/listAttendance", {
        studentID: studentID,
        studentStartDate: startDate,
        studentEndDate: endDate
    });
    for (let i = 0; i < history.length; i++) {
        let t = moment(history[i].date).format("DD/MM/YY - HH:mm");
        let tableTarget;
        if (history[i].type === 1) {
            tableTarget = $("#absentTableBody");
            if (history[i].courseID === undefined) {
                tableTarget.append(
                    "<tr>" +
                    "<td class='text-center'>" + t + "</td>" +
                    "<td class='text-center'>FHB:" + history[i].hybridSubject + "</td>" +
                    "<td class='text-center'>" + history[i].sender + "</td>" +
                    "</tr>"
                );
            } else {
                tableTarget.append(
                    "<tr>" +
                    "<td class='text-center'>" + t + "</td>" +
                    "<td class='text-center'>CR:" + history[i].courseName + "</td>" +
                    "<td class='text-center'>" + history[i].sender + "</td>" +
                    "</tr>"
                );
            }
        } else {
            tableTarget = $("#presentTableBody");
            if (history[i].courseID === undefined) {
                tableTarget.append(
                    "<tr>" +
                    "<td class='text-center'>" + t + "</td>" +
                    "<td class='text-center'>FHB:" + history[i].subject + "</td>" +
                    "<td class='text-center'>" + history[i].sender + "</td>" +
                    "</tr>"
                );
            }
        }
    }
}

async function showQuota() {
    let [mQuota, pQuota] = await Promise.all([
        $.post('post/v1/getStudentQuota', { studentID: studentID, subj: "M" }),
        $.post('post/v1/getStudentQuota', { studentID: studentID, subj: "P" })
    ]);
    mHbFound = mQuota.usedQuota;
    pHbFound = pQuota.usedQuota;
    mHbMax = mQuota.totalQuota;
    pHbMax = pQuota.totalQuota;
    $("#mQuota").html("โควต้าลา FHB:M " + (mQuota.totalQuota - mQuota.usedQuota) + "/" + mQuota.totalQuota);
    $("#pQuota").html("โควต้าลา FHB:P " + (pQuota.totalQuota - pQuota.usedQuota) + "/" + pQuota.totalQuota);
}

// add event when change pick date
$("#absentDate").on("dp.change", function () {
    fillButton();
});

// toggle button
$(".selector").click(function () {
    if (!$(this).hasClass("disabled")) {
        $(this).toggleClass("btn-light btn-warning");
    }
});

// function for check emergency absent
const checkEmer = () => {
    let result = false;
    let diff = 24 * 60 * 60 * 1000;
    let now = moment();
    now.hour(18).minute(0).second(0).millisecond(0);
    let pickDate = $('#absentDate').data('DateTimePicker').date();
    pickDate.hour(18).minute(0).second(0).millisecond(0);
    if (pickDate.day() === 0) {
        if (pickDate.valueOf() - now.valueOf() < 2 * diff) {
            result = true;
        }
    } else {
        if (pickDate.valueOf() - now.valueOf() < diff) {
            result = true;
        }
    }
    return result;
};

// add event when select reason
$("#reasonInput").change(function () {
    if ($("#reasonInput").val() === "ลากิจ") {
        $(".custom-file").hide();
    } else {
        $(".custom-file").show();
    }
});

// add event when select file
$("#customFile").change(function () {
    let val = this.value;
    let filename;
    if (val) {
        let startIndex = val.indexOf("\\") >= 0 ? val.lastIndexOf("\\") : val.lastIndexOf("/");
        filename = val.slice(startIndex + 1);
    }
    $(".custom-file-label").html(filename);
});

// add event when submit
$("#submitButt").click(function () {
    let pickHbM = 0;
    let pickHbP = 0;
    if ($(".btn-warning").length <= 0) {
        alert("กรุณาเลือกอย่างน้อย 1 วิชา");
    } else {
        for (let i = 0; i < $(".btn-warning").length; i++) {
            let thisButt = $($(".btn-warning")[i]);
            if (thisButt.html() === "FHB:M") {
                pickHbM += 1;
            } else if (thisButt.html() === "FHB:P") {
                pickHbP += 1;
            }
        }
        if ((pickHbM + mHbFound) > mHbMax) {
            alert("โควต้าลา FHB:M ไม่เพียงพอ");
        } else if ((pickHbP + pHbFound) > pHbMax) {
            alert("โควต้าลา FHB:P ไม่เพียงพอ");
        } else {
            if ($("#reasonInput").val() !== "ลากิจ") {
                if ($("#customFile").val()) {
                    let ufile = $("#customFile");
                    let ext = ufile.val().split('.').pop().toLowerCase();
                    if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
                        alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
                    } else if ($("#senderInput").val() === "") {
                        alert("กรุณาใส่ผู้แจ้ง");
                    } else {
                        let str = "ยืนยันการลา?";
                        if (checkEmer()) {
                            str = "ยืนยันการลาฉุกเฉิน?";
                        }
                        if (confirm(str)) {
                            sendData();
                        }
                    }
                } else {
                    alert("กรุณาอัพโหลดหลักฐานการลา");
                }
            } else if ($("#senderInput").val() === "") {
                alert("กรุณาใส่ผู้แจ้ง");
            } else {
                let str = "ยืนยันการลา?";
                if (checkEmer()) {
                    str = "ยืนยันการลาฉุกเฉิน?";
                }
                if (confirm(str)) {
                    sendData();
                }
            }
        }
    }
});

// function for get hour from class name
const classHour = (button) => {
    let result = 0;
    if (button.hasClass("btn-8")) {
        result = 8;
    } else if (button.hasClass("btn-10")) {
        result = 10;
    } else if (button.hasClass("btn-13")) {
        result = 13;
    } else if (button.hasClass("btn-15")) {
        result = 15;
    }
    return result;
};

// function for send data to server
async function sendData() {
    $("#loadingModal").modal('show');
    let pickDate = $('#absentDate').data('DateTimePicker').date();
    let roundTime = moment(0);
    roundTime.year(pickDate.year()).month(pickDate.month()).date(pickDate.date());
    let notifyStr = "\n";
    let studentName = await name(studentID);
    notifyStr = notifyStr + studentName.nickname + " " + studentName.firstname + "\n";
    notifyStr = notifyStr + "ต้องการลา: " + pickDate.format("ddd DD/MM/YY") + "\n";
    let promise = [];
    for (let i = 0; i < $(".btn-warning").length; i++) {
        let thisButt = $($(".btn-warning")[i]);
        if (pickDate.day() === 0 || pickDate.day() === 6) {
            notifyStr = notifyStr + thisButt.html() + " - " + classHour(thisButt) + ":00\n";
        } else {
            notifyStr = notifyStr + thisButt.html() + " - 16:00\n";
        }
        if (thisButt.hasClass("cr")) {
            promise.push($.post("post/v1/addStudentAbsent", {
                userID: studentID,
                date: roundTime.hour(classHour(thisButt)).valueOf(),
                courseID: thisButt.attr("id"),
                reason: $("#reasonInput").val() + " " + $("#reasonOptionInput").val(),
                sender: $("#senderInput").val()
            }));
        } else {
            if (pickDate.day() === 0 || pickDate.day() === 6) {
                promise.push($.post("post/v1/addStudentAbsent", {
                    userID: studentID,
                    date: roundTime.hour(classHour(thisButt)).valueOf(),
                    hybridID: thisButt.attr("id"),
                    reason: $("#reasonInput").val() + " " + $("#reasonOptionInput").val(),
                    sender: $("#senderInput").val()
                }));
            } else {
                promise.push($.post("post/v1/addStudentAbsent", {
                    userID: studentID,
                    date: roundTime.hour(17).valueOf(),
                    hybridID: thisButt.attr("id"),
                    reason: $("#reasonInput").val() + " " + $("#reasonOptionInput").val(),
                    sender: $("#senderInput").val()
                }));
            }
        }
    }
    notifyStr = notifyStr + "เหตุผล:" + $("#reasonInput").val() + " " + $("#reasonOptionInput").val();
    let adtendID = await Promise.all(promise);
    // upload file
    if ($("#reasonInput").val() !== "ลากิจ") {
        let file = $("#customFile").get(0).files[0];
        let formData = new FormData();
        formData.append('files', file, file.name);
        for (let i in adtendID) {
            formData.append("attendanceID[]", adtendID[i]);
        }
        $.ajax({
            url: 'post/v1/uploadAttendanceDocument',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                lineNotify("MonkeyAdmin", notifyStr).then(() => {
                    location.reload();
                });
                log("upload");
            }
        });
    } else {
        await lineNotify("MonkeyAdmin", notifyStr);
        location.reload();
    }
}