// global param
let studentID;
let year;
let quarter;
let quarterName;
let startDate;
let endDate;
let timetable;
let room = {
    "sat8": {},
    "sat10": {},
    "sat13": {},
    "sat15": {},
    "sun8": {},
    "sun10": {},
    "sun13": {},
    "sun15": {},
    "tue17": {},
    "thu17": {},
};

// datePicker
let initDate = moment();
initDate.date(initDate.date() - 1);
$("#addDate").datetimepicker({
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
    getHistory();
}

function genBanner() {
    $("#pageBanner").html(quarterName);
    $("#tableLabel").html("(" + quarterName + ")");
}

async function getTimetable() {
    let [allTimetable, allRoom] = await Promise.all([
        $.post("post/v1/studentTimeTable", { year: year, quarter: quarter, studentID: studentID }),
        $.post("post/v1/allRoom")
    ]);
    timetable = allTimetable;
    for (let i in allRoom) {
        room[i] = allRoom[i].room0;
    }
    fillButton();
}

async function fillButton() {
    $("#subjInput").empty();
    $(".selector").removeClass("disabled btn-info").addClass("btn-light");
    $(".labelor").html("-");
    let pickDate = $('#addDate').data('DateTimePicker').date();
    if (pickDate.day() === 0 || pickDate.day() === 6) {
        $("#subjInput").append(
            "<option value='M'>FHB:M</option>" +
            "<option value='P'>FHB:P</option>"
        );
        $(".selector").html("กดเพื่อเพิ่ม");
        $(".label-8").html("8-10");
        $(".label-10").html("10-12");
        $(".label-13").html("13-15");
        $(".label-15").html("15-17");
        let cr = timetable.course;
        for (let i in cr) {
            let t = moment(cr[i].day);
            if (t.day() === pickDate.day()) {
                $(".btn-" + t.hour()).html("CR:" + cr[i].courseName).addClass("disabled");
            }
        }
        let hb = timetable.hybrid;
        for (let i in hb) {
            let t = moment(hb[i].day);
            if (t.day() === pickDate.day()) {
                $(".btn-" + t.hour()).html("FHB:" + hb[i].subject).addClass("disabled");
            }
        }
    } else {
        $("#subjInput").append(
            "<option value='M'>FHB:M</option>" +
            "<option value='P'>FHB:P</option>" +
            "<option value='C'>FHB:C</option>" +
            "<option value='E'>FHB:E</option>"
        );
        $(".selector").html("-");
        $(".btn-8").html("กดเพื่อเพิ่ม");
        $(".btn-10").addClass("disabled");
        $(".btn-13").addClass("disabled");
        $(".btn-15").addClass("disabled");
        $(".label-8").html("16-18");
        let hb = timetable.hybrid;
        for (let i in hb) {
            let t = moment(hb[i].day);
            if (t.day() === pickDate.day()) {
                $(".btn-8").html("FHB:" + hb[i].subject).addClass("disabled");
            }
        }
    }
    let attend = await $.post("post/v1/listAttendance", {
        date: pickDate.hour(6).valueOf()
    });
    let attendSum = {
        "sat8": 0,
        "sat10": 0,
        "sat13": 0,
        "sat15": 0,
        "sun8": 0,
        "sun10": 0,
        "sun13": 0,
        "sun15": 0,
        "tue17": 0,
        "thu17": 0,
    };
    for (let i in attend) {
        let t = moment(attend[i].date);
        let str = t.format("ddd") + t.hour() + "";
        str = str.toLowerCase();
        if (attend[i].courseID === undefined) {
            if (attend[i].type === 1) {
                attendSum[str] -= 1;
            } else {
                attendSum[str] += 1;
            }
        } else {
            let cr = room[str].course;
            for (let j in cr) {
                if (cr.courseID === attend[i].courseID) {
                    attendSum[str] -= 1;
                }
            }
        }
    }
    for (let i in room) {
        if (i.slice(0, 3) === pickDate.format("ddd").toLowerCase()) {
            let pointer = $(".btn-" + i.slice(3));
            if (room[i].studentCount + attendSum[i] >= room[i].maxStudent) {
                pointer.addClass("disabled").html("FULL");
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
        if (history[i].type === 2) {
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
        } else {
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
        }
    }
}

// add event when change pick date
$("#addDate").on("dp.change", function () {
    fillButton();
});

// toggle button
$(".selector").click(function () {
    if (!$(this).hasClass("disabled")) {
        if ($(this).hasClass("btn-light")) {
            $(".selector").removeClass("btn-info").addClass("btn-light");
            $(this).removeClass("btn-light").addClass("btn-info");
        } else {
            $(this).toggleClass("btn-light btn-info");
        }
    }
});

// add event when submit
$("#submitButt").click(function () {
    if ($(".btn-info").length <= 0) {
        alert("กรุณาเลือกเวลา");
    } else if ($("#senderInput").val() === "") {
        alert("กรุณาใส่ผู้แจ้ง");
    } else if (confirm("ยืนยันการเพิ่ม?")) {
        sendData();
    }
});

// round time function
const roundTime = (time, round) => {
    let result = moment(0);
    result.year(time.year()).month(time.month()).date(time.date()).hour(parseInt(round));
    return result.valueOf();
};

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
    $("#loadingModal").modal("show");
    let pickDate = $('#addDate').data('DateTimePicker').date();
    let notifyStr = "\n";
    let studentName = await name(studentID);
    notifyStr = notifyStr + studentName.nickname + " " + studentName.firstname + "\n";
    notifyStr = notifyStr + "ต้องการเพิ่ม: " + pickDate.format("ddd DD/MM/YY") + "\n";
    let timeStr;
    if (pickDate.day() === 2 || pickDate.day() === 4) {
        timeStr = 16;
    } else {
        timeStr = classHour($(".btn-info"));
    }
    notifyStr = notifyStr + "FHB:" + $("#subjInput").val() + " - " +
        timeStr + ":00";
    if (pickDate.day() === 2 || pickDate.day() === 4) {
        timeStr = 17;
    }
    let allHB = await $.post("post/v1/listHybridDayInQuarter", { year: year, quarter: quarter });
    let hybridID;
    for (let i in allHB) {
        let t = moment(allHB[i].day);
        // log(t.hour())
        if (t.day() === pickDate.day() && t.hour() === timeStr) {
            hybridID = allHB[i].hybridID;
        }
    }
    let body = {
        userID: studentID,
        date: roundTime(pickDate, timeStr),
        hybridID: hybridID,
        subject: $("#subjInput").val(),
        sender: $("#senderInput").val()
    };
    if ($("#reasonInput").val() !== "") {
        notifyStr = notifyStr + "\nเหตุผล: " + $("#reasonInput").val();
        body.reason = $("#reasonInput").val();
    }
    await $.post("post/v1/addStudentPresent", body);
    log("OK");
    await lineNotify("MonkeyAdmin", notifyStr);
    location.reload();
}