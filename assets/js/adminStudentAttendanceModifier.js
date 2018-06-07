let year;
let quarter;
getYearAndQuarter();
function getYearAndQuarter() {
    getConfig().then((config) => {
        year = config.defaultQuarter.quarter.year;
        quarter = config.defaultQuarter.quarter.quarter;
    });
}
/**
 * fhb datePicker
 */
$("#fhbDatePicker").datetimepicker({
    format: "DD/MM/YYYY",
    daysOfWeekDisabled: [1, 3, 5]
});
/**
 * cr datePicker
 */
$("#crDatePicker").datetimepicker({
    format: "DD/MM/YYYY",
    daysOfWeekDisabled: [1, 2, 3, 4, 5]
});
let fhbIndicator = true;
let crIndicator = true;
genTimePicker(1);
genTimePicker(2);
$(".nav-tabs > .nav-item:nth-child(2)").click(function () {
    if (fhbIndicator) {
        genTable(1);
    }
    fhbIndicator = false;
});
$(".nav-tabs > .nav-item:nth-child(3)").click(function () {
    if (crIndicator) {
        genTutor();
    }
    crIndicator = false;
});
async function genTutor() {
    let tutor = await $.post("post/v1/listTutor");
    tutor.sort(function (a, b) {
        return a.tutorID - b.tutorID
    });
    for (let i in tutor) {
        $("#crFilterPick").append(
            "<option value=" + tutor[i].tutorID + ">" + tutor[i].nicknameEn + "</option>"
        );
    }
    genTable(2);
}
/**
 * fhb datePicker change handler
 */
$("#fhbDatePicker").on("dp.change", function () {
    genTimePicker(1);
    genTable(1);
});
/**
 * cr datePicker change handler
 */
$("#crDatePicker").on("dp.change", function () {
    genTimePicker(2);
    genTable(2);
});
/**
 * genTimePicker
 * @param {number} type HB:1, CR:2
 */
function genTimePicker(type) {
    let pointer;
    let pickDate;
    if (type === 1) {
        pointer = $("#fhbTimePick");
        pickDate = $('#fhbDatePicker').data('DateTimePicker').date();
    } else {
        pointer = $("#crTimePick");
        pickDate = $('#crDatePicker').data('DateTimePicker').date();
    }
    pointer.empty();
    if (pickDate.day() === 2 || pickDate.day() === 4) {
        pointer.append(
            "<option value=" + 17 + ">17-19</option>"
        );
    } else {
        pointer.append(
            "<option value=" + 0 + ">All</option>" +
            "<option value=" + 8 + ">8-10</option>" +
            "<option value=" + 10 + ">10-12</option>" +
            "<option value=" + 13 + ">13-15</option>" +
            "<option value=" + 15 + ">15-17</option>"
        );
    }
}
/**
 * gen adtend table
 * @param {number} mainType HB:1, CR:2
 */
async function genTable(mainType) {
    let pickDate;
    if (mainType === 1) {
        $("#fhbAbsentTable").empty();
        $("#fhbPresentTable").empty();
        pickDate = $('#fhbDatePicker').data('DateTimePicker').date();
    } else {
        $("#crAbsentTable").empty();
        pickDate = $('#crDatePicker').data('DateTimePicker').date();
    }
    pickDate.hour(0);
    let allAdtend = await $.post("post/v1/listAttendance", {
        date: pickDate.valueOf()
    });
    for (let i = 0; i < allAdtend.length; i++) {
        let timestamp = moment(allAdtend[i].timestamp).format("ddd DD/MM/YY HH:mm");
        let t = moment(allAdtend[i].date).hour();
        let style = "";
        let remark;
        let nextRemark;
        let link;
        if (allAdtend[i].link !== undefined && allAdtend[i].link !== "") {
            link = "<span class='fas fa-fw fa-lg fa-folder-open' onclick='showAdtendPic(\"" + allAdtend[i].link + "\")'></span>";
        } else {
            link = "<span class='fas fa-fw fa-lg fa-plus-circle' onclick='showUploadModal(\"" + allAdtend[i]._id + "\")'></span>";
        }
        if (emergencyAbsent(allAdtend[i].timestamp, allAdtend[i].date)) {
            style = "table-warning";
        }
        switch (allAdtend[i].remark) {
            case "1":
                remark = "<span class='far fa-fw fa-lg fa-check-circle' style='color:orange'></span>"
                nextRemark = "next2";
                break;
            case "2":
                remark = "<span class='far fa-fw fa-lg fa-check-circle' style='color:green'></span>"
                nextRemark = "next0";
                break;
            default:
                remark = "<span class='far fa-fw fa-lg fa-times-circle' style='color:red'></span>"
                nextRemark = "next1";
                break;
        }
        if (allAdtend[i].type === 1) {
            let subj;
            let type;
            if (allAdtend[i].courseID === undefined) {
                subj = "FHB:" + allAdtend[i].hybridSubject;
                type = "FHB";
            } else {
                if (allAdtend[i].tutorName === "Hybrid") {
                    subj = "CR:" + allAdtend[i].courseName;
                    type = "HB";
                } else {
                    subj = "CR:" + allAdtend[i].courseName;
                    type = "CR";
                }
            }
            if (type !== "CR" && mainType === 1) {
                $("#fhbAbsentTable").append(
                    "<tr id='" + allAdtend[i]._id + "' class='fhbTableRow fhbRow" + t + " " + type + " " + style + "'>" +
                    "<td class='text-center'>" + timestamp + "</td>" +
                    "<td class='text-center' onclick='gotoStdProfile(\"" +
                    allAdtend[i].studentID + "\")'>" + allAdtend[i].nickname + " " + allAdtend[i].firstname + "</td>" +
                    "<td class='text-center'>" + subj + "</td>" +
                    "<td class='text-center'>HB</td>" +
                    "<td class='text-center'>" + allAdtend[i].reason + "</td>" +
                    "<td class='text-center'>" + link + "</td>" +
                    "<td class='text-center " + nextRemark + " rm" + allAdtend[i]._id +
                    "' onclick='setRemark(\"" + allAdtend[i]._id + "\")'>" + remark + "</td>" +
                    "<td class='text-center'><button class='btn btn-light col' onclick='removeAdtend(\"" +
                    allAdtend[i]._id + "\")'><span class='fas fa-fw fa-lg fa-trash' style='color:red'></span></button></td>" +
                    "</tr>"
                );
            } else if (type !== "FHB" && mainType === 2) {
                $("#crAbsentTable").append(
                    "<tr id='" + allAdtend[i]._id + "' class='crTableRow crRow" + t + " " + allAdtend[i].tutorID + " " + style + "'>" +
                    "<td class='text-center'>" + timestamp + "</td>" +
                    "<td class='text-center' onclick='gotoStdProfile(\"" +
                    allAdtend[i].studentID + "\")'>" + allAdtend[i].nickname + " " + allAdtend[i].firstname + "</td>" +
                    "<td class='text-center'>" + subj + "</td>" +
                    "<td class='text-center'>" + (allAdtend[i].tutorName !== "Hybrid" ? allAdtend[i].tutorName : "HB") + "</td>" +
                    "<td class='text-center'>" + allAdtend[i].reason + "</td>" +
                    "<td class='text-center'>" + link + "</td>" +
                    "<td class='text-center " + nextRemark + " rm" + allAdtend[i]._id +
                    "' onclick='setRemark(\"" + allAdtend[i]._id + "\")'>" + remark + "</td>" +
                    "<td class='text-center'><button class='btn btn-light col' onclick='removeAdtend(\"" +
                    allAdtend[i]._id + "\")'><span class='fas fa-fw fa-lg fa-trash' style='color:red'></span></button></td>" +
                    "</tr>"
                );
            }
        } else if (mainType === 1) {
            let subj;
            // let type;
            if (allAdtend[i].courseID === undefined) {
                subj = "FHB:" + allAdtend[i].subject;
                // type = "FHB";
            } else {
                if (allAdtend[i].tutorName === "Hybrid") {
                    subj = "CR:" + allAdtend[i].courseName;
                    // type = "HB";
                } else {
                    subj = "CR:" + allAdtend[i].courseName;
                    // type = "CR";
                }
            }
            $("#fhbPresentTable").append(
                "<tr id='" + allAdtend[i]._id + "' class='fhbTableRow fhbRow" + t + "'>" +
                "<td class='text-center'>" + timestamp + "</td>" +
                "<td class='text-center' onclick='gotoStdProfile(\"" +
                allAdtend[i].studentID + "\")'>" + allAdtend[i].nickname + " " + allAdtend[i].firstname + "</td>" +
                "<td class='text-center'>" + subj + "</td>" +
                "<td class='text-center'>" + ((allAdtend[i].reason !== null) ? allAdtend[i].reason : "") + "</td>" +
                "<td class='text-center " + nextRemark + " rm" + allAdtend[i]._id +
                "' onclick='setRemark(\"" + allAdtend[i]._id + "\")'>" + remark + "</td>" +
                "<td class='text-center'><button class='btn btn-light col' onclick='removeAdtend(\"" +
                allAdtend[i]._id + "\")'><span class='fas fa-fw fa-lg fa-trash' style='color:red'></span></button></td>" +
                "</tr>"
            );
        }
    }
    filterFhbTable(1);
    filterFhbTable(2);
}
/**
 * check emergency absent
 * @param {number} timestamp 
 * @param {number} date 
 */
function emergencyAbsent(timestamp, date) {
    let result = false;
    let aDay = 24 * 60 * 60 * 1000;
    let t = moment(date);
    t.hour(18).minute(0).second(0).millisecond(0);
    if (t.day() === 0) {
        if (t.valueOf() - moment(timestamp).valueOf() < 2 * aDay) result = true;
    } else {
        if (t.valueOf() - moment(timestamp).valueOf() < aDay) result = true;
    }
    return result;
}
/**
 * filter unwanted data
 * @param {number} mainType HB:1, CR:2
 */
function filterFhbTable(mainType) {
    let timePick;
    let type;
    if (mainType === 1) {
        timePick = $("#fhbTimePick").val();
        type = $("#fhbFilterPick").val();
    } else {
        timePick = $("#crTimePick").val();
        type = $("#crFilterPick").val();
    }
    if (mainType === 1) {
        if (timePick !== "0") {
            $(".fhbTableRow").hide();
            $(".fhbRow" + timePick).show();
        } else {
            $(".fhbTableRow").show();
        }
        switch (type) {
            case "FHB":
                $(".HB").hide();
                break;
            default:
                break;
        }
    } else {
        if (timePick !== "0") {
            let indexHour = ["8", "10", "13", "15"];
            if (type !== "0") {
                $(".crTableRow").hide();
                $("." + type).show();
            } else {
                $(".crTableRow").show();
            }
            for (let i = 0; i < 4; i++) {
                if (indexHour[i] !== timePick) {
                    $(".crRow" + indexHour[i]).hide();
                }
            }
        } else {
            if (type === "0") {
                $(".crTableRow").show();
            } else {
                $(".crTableRow").hide();
                $("." + type).show();
            }
        }
    }

}
$("#fhbTimePick").change(function () {
    filterFhbTable(1);
});
$("#fhbFilterPick").change(function () {
    filterFhbTable(1);
});
$("#crTimePick").change(function () {
    filterFhbTable(2);
});
$("#crFilterPick").change(function () {
    filterFhbTable(2);
});

/**
 * remove student adtendance
 * @param {string} adtendID
 */
function removeAdtend(adtendID) {
    if (confirm("ต้องการลบประวัตินี้?")) {
        $.post("post/v1/deleteAttendance", { attendanceID: adtendID }).then((cb) => {
            log(cb);
            $("#" + adtendID).remove();
        });
    }
}

/**
 * go to adminStudentProfile
 * @param {string} studentID 
 */
function gotoStdProfile(studentID) {
    writeCookie("monkeyWebAdminAllstudentSelectedUser", studentID);
    self.location = "/adminStudentprofile";
}
/**
 * set remark
 * @param {string} adtendID 
 */
function setRemark(adtendID) {
    let nextRemark;
    let that = $(".rm" + adtendID);
    if (that.hasClass("next0")) {
        $.post("post/v1/setAttendanceRemark", { attendanceID: adtendID, remark: "0" }).then((cb) => {
            log(cb);
            that.removeClass("next0").addClass("next1");
            that.html("<span class='far fa-fw fa-lg fa-times-circle' style='color:red'></span>");
        });
    } else if (that.hasClass("next1")) {
        $.post("post/v1/setAttendanceRemark", { attendanceID: adtendID, remark: "1" }).then((cb) => {
            log(cb);
            that.removeClass("next1").addClass("next2");
            that.html("<span class='far fa-fw fa-lg fa-check-circle' style='color:orange'></span>");
        });
    } else if (that.hasClass("next2")) {
        $.post("post/v1/setAttendanceRemark", { attendanceID: adtendID, remark: "2" }).then((cb) => {
            log(cb);
            that.removeClass("next2").addClass("next0");
            that.html("<span class='far fa-fw fa-lg fa-check-circle' style='color:green'></span>");
        });
    }
}
$(".remarkReset").click(function () {
    if (confirm("ต้องการ reset remark ทั้งหมด?")) {
        $.post("post/v1/resetAttendanceRemark").then((cb) => {
            log(cb);
            location.reload();
        });
    }
});

// check first time click activity
let activityIndicator = true;
// Start time for gen activity table
let acTime1 = moment();
let acTime2 = moment();
$(".nav-tabs > .nav-item:nth-child(5)").click(function () {
    if (activityIndicator) {
        genActivityTable(0);
    }
    activityIndicator = false;
});
/**
 * gen activity table
 * @param {number} number 
 */
async function genActivityTable(number) {
    acTime1.date(acTime1.date() - 4);
    if (number !== 0) {
        acTime2.date(acTime2.date() - 4);
    }
    let allAdtend = await $.post("post/v1/listAttendance", {
        startDate: acTime1.valueOf(),
        endDate: acTime2.valueOf()
    });
    // if (allAdtend.length === 0) {
    //     $("#loadMoreButt").hide();
    // }
    for (let i = 0; i < allAdtend.length; i++) {
        let style;
        let timestamp = moment(allAdtend[i].timestamp).format("ddd DD/MM/YY - HH:mm");
        let subj;
        let t = moment(allAdtend[i].date).format("ddd DD/MM/YY - HH:mm");
        let reason;
        let link;
        if (allAdtend[i].type === 1) {
            style = "table-danger";
            if (allAdtend[i].courseID === undefined) {
                subj = "FHB:" + allAdtend[i].hybridSubject
            } else {
                subj = "CR:" + allAdtend[i].courseName;
            }
            reason = allAdtend[i].reason;
        } else {
            style = "table-success";
            if (allAdtend[i].courseID === undefined) {
                subj = "FHB:" + allAdtend[i].subject;
            } else {
                subj = "CR:" + allAdtend[i].courseName;
            }
            if (allAdtend[i].reason !== null) {
                reason = allAdtend[i].reason;
            } else {
                reason = "-";
            }

        }
        if (allAdtend[i].link !== undefined && allAdtend[i].link !== "") {
            link = "<span class='fas fa-fw fa-lg fa-folder-open' onclick='showAdtendPic(\"" + allAdtend[i].link + "\")'></span>";
        } else {
            link = "<span class='fas fa-fw fa-lg fa-plus-circle' onclick='showUploadModal(\"" + allAdtend[i].attendanceID + "\")'></span>";
        }
        $("#acTableBody").append(
            "<tr class='" + style + "' id='" + allAdtend[i]._id + "'>" +
            "<td class='text-center'>" + timestamp + "</td>" +
            "<td class='text-center' onclick='gotoStdProfile(\"" +
            allAdtend[i].studentID + "\")'>" + allAdtend[i].nickname + " " + allAdtend[i].firstname + "</td>" +
            "<td class='text-center'>" + subj + "</td>" +
            "<td class='text-center'>" + t + "</td>" +
            "<td class='text-center'>" + reason + "</td>" +
            "<td class='text-center'>" + link + "</td>" +
            "<td class='text-center'>" + allAdtend[i].sender + "</td>" +
            "<td class='text-center'><button class='btn btn-light col' onclick='removeAdtend(\"" +
            allAdtend[i]._id + "\")'><span class='fas fa-fw fa-lg fa-trash' style='color:red'></span></button></td>" +
            "</tr>"
        );
    }
}
$("#loadMoreButt").click(function () {
    genActivityTable(1);
});

/**
 * show adtend pic
 * @param {string} picLink 
 */
function showAdtendPic(picLink) {
    $("#picSrc").attr("src", picLink);
    $("#picModal").modal("show");
}
var uploadID;
function showUploadModal(adtendID) {
    uploadID = adtendID;
    $("#picUploadModal").modal('show');
}
$("#uploadPicButt").click(function () {
    if (confirm("ต้องการเพิ่มหลักฐานการลา?")) {
        uploadAdtendPic();
    }
});
function uploadAdtendPic() {
    let ufile = $('#file-img');
    let ext = ufile.val().split('.').pop().toLowerCase();
    if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
        alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
    } else {
        let files = ufile.get(0).files;
        let formData = new FormData();
        let file = files[0];
        formData.append('files', file, file.name);
        formData.append("attendanceID[]", uploadID);
        $.ajax({
            url: "post/v1/uploadAttendanceDocument",
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                location.reload();
            }
        });
    }
}

// generate fhb room chart
let firstTimeGen = true;
var myChart;
generateChart();
/**
 * generate real-time chart
 * @param {number} type 1:Static,2:real,3:Compare
 */
async function generateChart(type) {
    let allRoom = await $.post("post/v1/allRoom");
    let allHbRoom = {};
    for (let i in allRoom) {
        allHbRoom[i] = allRoom[i].room0;
    }
    // static data
    let maxSeat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mhbStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let phbStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let chbStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ehbStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mcrStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pcrStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ccrStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ecrStatic = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let emptySeat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // realtime data
    let mhbReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let phbReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let chbReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ehbReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mcrReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let pcrReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ccrReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ecrReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let emptySeatReal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /**
     * change day str to num index
     * @param {string} dayStr 
     */
    const dayIndex = (dayStr) => {
        switch (dayStr) {
            case "tue17":
                return 0;
            case "thu17":
                return 1;
            case "sat8":
                return 2;
            case "sat10":
                return 3;
            case "sat13":
                return 4;
            case "sat15":
                return 5;
            case "sun8":
                return 6;
            case "sun10":
                return 7;
            case "sun13":
                return 8;
            case "sun15":
                return 9;
            default:
                break;
        }
    };
    for (let i in allHbRoom) {
        maxSeat[dayIndex(i)] = allHbRoom[i].maxStudent;
        mhbStatic[dayIndex(i)] = allHbRoom[i].hybrid[0].numMath;
        phbStatic[dayIndex(i)] = allHbRoom[i].hybrid[0].numPhysics;
        chbStatic[dayIndex(i)] = allHbRoom[i].hybrid[0].numChemistry;
        ehbStatic[dayIndex(i)] = allHbRoom[i].hybrid[0].numEnglish;
        mhbReal[dayIndex(i)] = allHbRoom[i].hybrid[0].numMath;
        phbReal[dayIndex(i)] = allHbRoom[i].hybrid[0].numPhysics;
        chbReal[dayIndex(i)] = allHbRoom[i].hybrid[0].numChemistry;
        ehbReal[dayIndex(i)] = allHbRoom[i].hybrid[0].numEnglish;
        if (allHbRoom[i].course !== undefined) {
            let cr = allHbRoom[i].course;
            for (let j in cr) {
                switch (cr[j].courseName.slice(0, 1)) {
                    case "M":
                        mcrStatic[dayIndex(i)] += cr[j].num;
                        mcrReal[dayIndex(i)] += cr[j].num;
                        break;
                    case "P":
                        pcrStatic[dayIndex(i)] += cr[j].num;
                        pcrReal[dayIndex(i)] += cr[j].num;
                        break;
                    case "C":
                        ccrStatic[dayIndex(i)] += cr[j].num;
                        ccrReal[dayIndex(i)] += cr[j].num;
                        break;
                    case "E":
                        ecrStatic[dayIndex(i)] += cr[j].num;
                        ecrReal[dayIndex(i)] += cr[j].num;
                        break;
                    default:
                        break;
                }
            }
        }
    }
    for (let i in emptySeat) {
        emptySeat[i] = maxSeat[i] - mhbStatic[i] - phbStatic[i] - mcrStatic[i] - pcrStatic[i] - ccrStatic[i] - ecrStatic[i];
    }
    /**
     * change zero to ''
     * @param {number[]} dataIn 
     */
    const cvZero = (dataIn) => {
        for (let i in dataIn) {
            if (dataIn[i] === 0) {
                dataIn[i] = '';
            } else if (dataIn[i] < 0) {
                dataIn[i] = dataIn[i] * (-1) / 100;
            }
        }
    };
    let now = moment();
    now.hour(0).minute(0).second(0).millisecond(0);
    let addition;
    switch (now.day()) {
        case 0:
            addition = [0, 2, 4, 6];
            break;
        case 1:
            addition = [6, 1, 3, 5];
            break;
        case 2:
            addition = [5, 0, 2, 4];
            break;
        case 3:
            addition = [4, 6, 1, 3];
            break;
        case 4:
            addition = [3, 5, 0, 2];
            break;
        case 5:
            addition = [2, 4, 6, 1];
            break;
        case 6:
            addition = [1, 3, 5, 0];
            break;
    }
    let sunDay = moment(now);
    sunDay.date(now.date() + addition[0]);
    let tueDay = moment(now);
    tueDay.date(now.date() + addition[1]);
    let thuDay = moment(now);
    thuDay.date(now.date() + addition[2]);
    let satDay = moment(now);
    satDay.date(now.date() + addition[3]);
    let promise = [
        $.post("post/v1/listAttendance", { date: sunDay.valueOf() }),
        $.post("post/v1/listAttendance", { date: tueDay.valueOf() }),
        $.post("post/v1/listAttendance", { date: thuDay.valueOf() }),
        $.post("post/v1/listAttendance", { date: satDay.valueOf() })
    ];
    let allAttend = await Promise.all(promise);
    for (let i in allAttend) {
        let attend = allAttend[i];
        for (let j in attend) {
            if (attend[j].type === 1) {
                let t = moment(attend[j].date).format("dddH").toLowerCase();
                if (t !== 'tue8' && t !== 'tue10' && t !== 'tue13' && t !== 'thu8' && t !== 'thu10' && t !== 'thu13') {
                    if (attend[j].courseID === undefined) {
                        if (attend[j].hybridSubject === "M") {
                            mhbReal[dayIndex(t)] -= 1;
                        } else if (attend[j].hybridSubject === "P") {
                            phbReal[dayIndex(t)] -= 1;
                        } else if (attend[j].hybridSubject === "C") {
                            chbReal[dayIndex(t)] -= 1;
                        } else if (attend[j].hybridSubject === "E") {
                            ehbReal[dayIndex(t)] -= 1;
                        }
                    } else {
                        if (attend[j].tutorID === 99000) {
                            for (let i in allHbRoom[t].course) {
                                if (allHbRoom[t].course[i].courseID === attend[j].courseID) {
                                    switch (attend[j].courseName.slice(0, 1)) {
                                        case "M":
                                            mcrReal[dayIndex(t)] -= 1;
                                            break;
                                        case "P":
                                            pcrReal[dayIndex(t)] -= 1;
                                            break;
                                        case "C":
                                            ccrReal[dayIndex(t)] -= 1;
                                            break;
                                        case "E":
                                            ecrReal[dayIndex(t)] -= 1;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (attend[j].type === 2) {
                let t = moment(attend[j].date).format("dddH").toLowerCase();
                switch (attend[j].subject) {
                    case "M":
                        mhbReal[dayIndex(t)] += 1;
                        break;
                    case "P":
                        phbReal[dayIndex(t)] += 1;
                        break;
                    case "C":
                        chbReal[dayIndex(t)] += 1;
                        break;
                    case "E":
                        ehbReal[dayIndex(t)] += 1;
                        break;
                    default:
                        break;
                }
            }
        }
    }
    for (let i in emptySeatReal) {
        emptySeatReal[i] = maxSeat[i] - mhbReal[i] - phbReal[i] - chbReal[i] - ehbReal[i] - mcrReal[i] - pcrReal[i] - ccrReal[i] - ecrReal[i];
    }
    cvZero(mhbStatic);
    cvZero(phbStatic);
    cvZero(chbStatic);
    cvZero(ehbStatic);
    cvZero(mcrStatic);
    cvZero(pcrStatic);
    cvZero(ccrStatic);
    cvZero(ecrStatic);
    cvZero(emptySeat);
    cvZero(mhbReal);
    cvZero(phbReal);
    cvZero(chbReal);
    cvZero(ehbReal);
    cvZero(mcrReal);
    cvZero(pcrReal);
    cvZero(ccrReal);
    cvZero(ecrReal);
    cvZero(emptySeatReal);
    let dataset = [];
    /**
     * add Dataset for chart
     * @param {string} label 
     * @param {number[]} data 
     * @param {number} stack 
     * @param {string} colorStr
     * @param {string} txtColor
     * @param {string} borderColor optional
     */
    const addDataSet = (label, data, stack, colorStr, txtColor, borderColor) => {
        if (borderColor !== undefined) {
            dataset.push({
                type: 'bar',
                label: label,
                stack: 'Stack ' + stack,
                data: data,
                backgroundColor: colorStr,
                borderColor: borderColor,
                borderWidth: 3,
                datalabels: {
                    color: txtColor,
                    font: {
                        style: 'bold',
                        size: 14
                    }
                }
            });
        } else {
            dataset.push({
                type: 'bar',
                label: label,
                stack: 'Stack ' + stack,
                data: data,
                backgroundColor: colorStr,
                borderColor: colorStr,
                borderWidth: 1,
                datalabels: {
                    color: txtColor,
                    font: {
                        style: 'bold',
                        size: 14
                    }
                }
            });
        }
    };
    /**
     * update all element in exist array
     * @param  oldArray 
     * @param  newArray 
     */
    const updateArray = (oldArray, newArray) => {
        oldArray.splice(0, oldArray.length);
        for (let i in newArray) {
            oldArray.push(newArray[i]);
        }
    };
    dataset.push({
        type: 'line',
        label: 'max',
        data: maxSeat,
        backgroundColor: 'rgba(0,0,0,0)',
        borderColor: 'black',
        borderDash: [15, 10],
        borderWidth: 3,
        pointBorderColor: 'rgba(0,0,0,0)',
        datalabels: {
            display: false
        }
    });
    if (firstTimeGen) {
        addDataSet("MHB(Static)", mhbStatic, 0, "rgb(255,153,0)", "white");
        addDataSet("PHB(Static)", phbStatic, 0, "rgb(212,0,255)", "white");
        addDataSet("CHB(Static)", chbStatic, 0, "#ff8af3", "white");
        addDataSet("EHB(Static)", ehbStatic, 0, "#bdbdbd", "white");
        addDataSet("Math(Static)", mcrStatic, 0, "rgba(0,0,0,0)", "rgb(255,153,0)", "rgb(255,153,0)");
        addDataSet("Phy(Static)", pcrStatic, 0, "rgba(0,0,0,0)", "rgb(212,0,255)", "rgb(212,0,255)");
        addDataSet("Che(Static)", ccrStatic, 0, "rgba(0,0,0,0)", "#ff8af3", "#ff8af3");
        addDataSet("Eng(Static)", ecrStatic, 0, "rgba(0,0,0,0)", "#bdbdbd", "#bdbdbd");
        dataset.push({
            type: 'bar',
            label: "Remaining",
            stack: 'Stack 0',
            data: emptySeat,
            backgroundColor: "rgba(0,0,0,0)",
            borderColor: "rgba(0,0,0,0)",
            borderWidth: 2,
            datalabels: {
                font: {
                    style: 'bold',
                    size: 16
                },
                color: "#6eb339",
                anchor: "start",
                align: "end",
                offset: 1,
                formatter: function (value, context) {
                    if (value === '') {
                        return '';
                    } else if (value < 1) {
                        return '( -' + value * 100 + ' )';
                    } else {
                        return '( ' + value + ' )';
                    }
                }
            }
        });
        addDataSet("MHB(Real)", mhbReal, 1, "#e64500", "white");
        addDataSet("PHB(Real)", phbReal, 1, "#8a00e0", "white");
        addDataSet("CHB(Real)", chbReal, 1, "#ff3dec", "white");
        addDataSet("EHB(Real)", ehbReal, 1, "#9e9e9e", "white");
        addDataSet("Math(Real)", mcrReal, 1, "rgba(0,0,0,0)", "#e64500", "#e64500");
        addDataSet("Phy(Real)", pcrReal, 1, "rgba(0,0,0,0)", "#8a00e0", "#8a00e0");
        addDataSet("Che(Real)", ccrReal, 1, "rgba(0,0,0,0)", "#ff3dec", "#ff3dec");
        addDataSet("Eng(Real)", ecrReal, 1, "rgba(0,0,0,0)", "#9e9e9e", "#9e9e9e");
        dataset.push({
            type: 'bar',
            label: "Remaining(Real)",
            stack: 'Stack 1',
            data: emptySeatReal,
            backgroundColor: "rgba(0,0,0,0)",
            borderColor: "rgba(0,0,0,0)",
            borderWidth: 2,
            datalabels: {
                font: {
                    style: 'bold',
                    size: 16
                },
                color: "#efec2d",
                anchor: "start",
                align: "end",
                offset: 1,
                formatter: function (value, context) {
                    if (value === '') {
                        return '';
                    } else if (value < 1) {
                        return '( -' + value * 100 + ' )';
                    } else {
                        return '( ' + value + ' )';
                    }
                }
            }
        });
        var ctx = document.getElementById("fhbChart").getContext('2d');
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [
                    'tue (' + tueDay.format('DD/MM') + ')',
                    'thu (' + thuDay.format('DD/MM') + ')',
                    'sat8 (' + satDay.format('DD/MM') + ')',
                    'sat10 (' + satDay.format('DD/MM') + ')',
                    'sat13 (' + satDay.format('DD/MM') + ')',
                    'sat15 (' + satDay.format('DD/MM') + ')',
                    'sun8 (' + sunDay.format('DD/MM') + ')',
                    'sun10 (' + sunDay.format('DD/MM') + ')',
                    'sun13 (' + sunDay.format('DD/MM') + ')',
                    'sun15 (' + sunDay.format('DD/MM') + ')'
                ],
                datasets: dataset
            },
            options: {
                title: {
                    display: true,
                    fontSize: 24,
                    text: "HB Student Chart"
                },
                tooltips: {
                    mode: 'point',
                    intersect: false
                },
                legend: {
                    position: 'bottom',
                    display: false
                },
                responsive: true,
                scales: {
                    xAxes: [{
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
        firstTimeGen = false;
    } else {
        switch (type) {
            case 1:
                addDataSet("MHB(Static)", mhbStatic, 0, "rgb(255,153,0)", "white");
                addDataSet("PHB(Static)", phbStatic, 0, "rgb(212,0,255)", "white");
                addDataSet("CHB(Static)", chbStatic, 0, "#ff8af3", "white");
                addDataSet("EHB(Static)", ehbStatic, 0, "#bdbdbd", "white");
                addDataSet("Math(Static)", mcrStatic, 0, "rgba(0,0,0,0)", "rgb(255,153,0)", "rgb(255,153,0)");
                addDataSet("Phy(Static)", pcrStatic, 0, "rgba(0,0,0,0)", "rgb(212,0,255)", "rgb(212,0,255)");
                addDataSet("Che(Static)", ccrStatic, 0, "rgba(0,0,0,0)", "#ff8af3", "#ff8af3");
                addDataSet("Eng(Static)", ecrStatic, 0, "rgba(0,0,0,0)", "#bdbdbd", "#bdbdbd");
                dataset.push({
                    type: 'bar',
                    label: "Remaining",
                    stack: 'Stack 0',
                    data: emptySeat,
                    backgroundColor: "rgba(0,0,0,0)",
                    borderColor: "rgba(0,0,0,0)",
                    borderWidth: 2,
                    datalabels: {
                        font: {
                            style: 'bold',
                            size: 16
                        },
                        color: "#6eb339",
                        anchor: "start",
                        align: "end",
                        offset: 1,
                        formatter: function (value, context) {
                            if (value === '') {
                                return '';
                            } else if (value < 1) {
                                return '( -' + value * 100 + ' )';
                            } else {
                                return '( ' + value + ' )';
                            }
                        }
                    }
                });
                updateArray(myChart.data.datasets, dataset);
                myChart.update();
                break;
            case 3:
                addDataSet("MHB(Static)", mhbStatic, 0, "rgb(255,153,0)", "white");
                addDataSet("PHB(Static)", phbStatic, 0, "rgb(212,0,255)", "white");
                addDataSet("CHB(Static)", chbStatic, 0, "#ff8af3", "white");
                addDataSet("EHB(Static)", ehbStatic, 0, "#bdbdbd", "white");
                addDataSet("Math(Static)", mcrStatic, 0, "rgba(0,0,0,0)", "rgb(255,153,0)", "rgb(255,153,0)");
                addDataSet("Phy(Static)", pcrStatic, 0, "rgba(0,0,0,0)", "rgb(212,0,255)", "rgb(212,0,255)");
                addDataSet("Che(Static)", ccrStatic, 0, "rgba(0,0,0,0)", "#ff8af3", "#ff8af3");
                addDataSet("Eng(Static)", ecrStatic, 0, "rgba(0,0,0,0)", "#bdbdbd", "#bdbdbd");
                dataset.push({
                    type: 'bar',
                    label: "Remaining",
                    stack: 'Stack 0',
                    data: emptySeat,
                    backgroundColor: "rgba(0,0,0,0)",
                    borderColor: "rgba(0,0,0,0)",
                    borderWidth: 2,
                    datalabels: {
                        font: {
                            style: 'bold',
                            size: 16
                        },
                        color: "#6eb339",
                        anchor: "start",
                        align: "end",
                        offset: 1,
                        formatter: function (value, context) {
                            if (value === '') {
                                return '';
                            } else if (value < 1) {
                                return '( -' + value * 100 + ' )';
                            } else {
                                return '( ' + value + ' )';
                            }
                        }
                    }
                });
            case 2:
                addDataSet("MHB(Real)", mhbReal, 1, "#e64500", "white");
                addDataSet("PHB(Real)", phbReal, 1, "#8a00e0", "white");
                addDataSet("CHB(Real)", chbReal, 1, "#ff3dec", "white");
                addDataSet("EHB(Real)", ehbReal, 1, "#9e9e9e", "white");
                addDataSet("Math(Real)", mcrReal, 1, "rgba(0,0,0,0)", "#e64500", "#e64500");
                addDataSet("Phy(Real)", pcrReal, 1, "rgba(0,0,0,0)", "#8a00e0", "#8a00e0");
                addDataSet("Che(Real)", ccrReal, 1, "rgba(0,0,0,0)", "#ff3dec", "#ff3dec");
                addDataSet("Eng(Real)", ecrReal, 1, "rgba(0,0,0,0)", "#9e9e9e", "#9e9e9e");
                dataset.push({
                    type: 'bar',
                    label: "Remaining(Real)",
                    stack: 'Stack 1',
                    data: emptySeatReal,
                    backgroundColor: "rgba(0,0,0,0)",
                    borderColor: "rgba(0,0,0,0)",
                    borderWidth: 2,
                    datalabels: {
                        font: {
                            style: 'bold',
                            size: 16
                        },
                        color: "#efec2d",
                        anchor: "start",
                        align: "end",
                        offset: 1,
                        formatter: function (value, context) {
                            if (value === '') {
                                return '';
                            } else if (value < 1) {
                                return '( -' + value * 100 + ' )';
                            } else {
                                return '( ' + value + ' )';
                            }
                        }
                    }
                });
                updateArray(myChart.data.datasets, dataset);
                myChart.update();
                break;
            default:
                break;
        }
    }
    fixWindowHeight();
}
$(window).resize(function () {
    fixWindowHeight();
});
function fixWindowHeight() {
    $("#chartContent > .chart-container").height($("#fhbChart").height());
}
$("#staticChartButt").click(function () {
    generateChart(1);
});
$("#realChartButt").click(function () {
    generateChart(2);
});
$("#compareChartButt").click(function () {
    generateChart(3);
});

// summer absent function
$("#smByDayCollapse").collapse('show');
$("#smByCrCollapse").collapse('hide');
$("#smByDayTab").click(function () {
    $("#smByDayCollapse").collapse('show');
    $("#smByCrCollapse").collapse('hide');
});
$("#smByCrTab").click(function () {
    $("#smByDayCollapse").collapse('hide');
    $("#smByCrCollapse").collapse('show');
});
$("#smDatePicker").datetimepicker({
    format: "DD/MM/YYYY",
    daysOfWeekDisabled: [0, 6],
    minDate: moment(0).year(2018).month(2).date(11).hour(23),
    maxDate: moment(0).year(2018).month(2).date(30).hour(19)
});
$("#smDatePicker").on("dp.change", function () {
    // log($('#smDatePicker').data('DateTimePicker').date());
    genSmTable();
});
$("#smTimePicker").change(function () {
    genSmTable();
});
$("#smFilter").change(function () {
    filterSmData();
});
$(".nav-tabs > .nav-item:nth-child(4)").click(function () {
    genSmTable();
    genSmCrSelectOption();
});
async function genSmTable() {
    let date = $('#smDatePicker').data('DateTimePicker').date();
    let time = $("#smTimePicker").val();
    if (parseInt(time) !== 0) {
        date.hour(parseInt(time));
    }
    let history = await $.post('post/v1/listAttendance', {
        date: date.valueOf()
    });
    let newHistory;
    if (parseInt(time) !== 0) {
        newHistory = history.filter((a) => {
            let t = moment(a.date);
            if (t.hour() === parseInt(time)) return true;
            else return false;
        });
    } else {
        newHistory = history;
    }
    $("#smAbsentTableBody").empty();
    $("#smPresentTableBody").empty();
    for (let i in newHistory) {
        let type = (newHistory[i].tutorID === 99000) ? 'HB' : 'CR';
        if (newHistory[i].type === 1) {
            if (newHistory[i].reason.toLowerCase() === "summerabsent") {
                $("#smAbsentTableBody").append(
                    "<tr id='" + newHistory[i]._id + "' class='smrow-" + type + "'>" +
                    "<td class='text-center'>" + newHistory[i].nickname + " " + newHistory[i].firstname + "</td>" +
                    "<td class='text-center'>" + newHistory[i].courseName + "</td>" +
                    "<td class='text-center'>" + newHistory[i].tutorName + "</td>" +
                    "<td class='text-center'><button class='col btn btn-light' onclick='removeAdtend(\"" + newHistory[i]._id + "\");'><span class='fa fa-lg fa-trash text-danger'></span></button></td>" +
                    "</tr>"
                );
            }
        } else if (newHistory[i].type === 2) {
            if (newHistory[i].courseID !== undefined) {
                $("#smPresentTableBody").append(
                    "<tr id='" + newHistory[i]._id + "' class='smrow-" + type + "'>" +
                    "<td class='text-center'>" + newHistory[i].nickname + " " + newHistory[i].firstname + "</td>" +
                    "<td class='text-center'><button class='col btn btn-light' onclick='removeAdtend(\"" + newHistory[i]._id + "\");'><span class='fa fa-lg fa-trash text-danger'></span></button></td>" +
                    "</tr>"
                );
            }
        }
    }
    filterSmData();
}
function filterSmData() {
    switch ($("#smFilter").val()) {
        case '2':
            $(".smrow-HB").hide();
            $(".smrow-CR").show();
            break;
        case '3':
            $(".smrow-HB").show();
            $(".smrow-CR").hide();
            break;
        default:
            $(".smrow-HB").show();
            $(".smrow-CR").show();
            break;
    }
}
async function genSmCrSelectOption() {
    let config = await getConfig();
    let smQ = config.defaultQuarter.summer;
    let allSmCr = await $.post("post/v1/allCourse", { year: smQ.year, quarter: smQ.quarter });
    $("#smCoursePicker").append("<option value='0'>Select course</option>")
    for (let i in allSmCr) {
        $("#smCoursePicker").append(
            "<option value=" + allSmCr[i].courseID + ">" + allSmCr[i].courseName + "-" + allSmCr[i].tutorName + "</option>"
        );
    }
}
$("#smCoursePicker").change(function () {
    if (this.value !== "0") {
        genSmByCrTable();
    }
});
async function genSmByCrTable() {
    let pointer = $("#smByCrTableBody");
    pointer.empty()
    let selectCr = $("#smCoursePicker").val();
    let crInfo = await courseInfo(selectCr);
    let promise = [];
    let startT = moment("2018/03/12", "YYYY/MM/DD").utcOffset(7);
    let endT = moment("2018/03/30 23", "YYYY/MM/DD HH").utcOffset(7);
    for (let i in crInfo.student) {
        promise.push($.post("post/v1/listAttendance", { studentStartDate: startT.valueOf(), studentEndDate: endT.valueOf(), studentID: crInfo.student[i] }));
    }
    let allAttend = await Promise.all(promise);
    for (let i in allAttend) {
        let name;
        let crNum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let j in allAttend[i]) {
            let t = moment(allAttend[i][j].date);
            if (allAttend[i][j].type === 2 && t.hour() === 15) {
                crNum[smDayToNo(t.date())] = 1;
            } else if (allAttend[i][j].type === 1 && allAttend[i][j].courseID === selectCr) {
                crNum[smDayToNo(t.date())] = -1;
            }
        }
        if (allAttend[i].length > 0) {
            name = allAttend[i][0].nickname + " " + allAttend[i][0].firstname;
            let str = "";
            for (let i in crNum) {
                if (crNum[i] === -1) {
                    str = str + "<td class='table-danger'></td>"
                } else if (crNum[i] === 0) {
                    str = str + "<td></td>"
                } else if (crNum[i] === 1) {
                    str = str + "<td class='table-success'></td>"
                }
            }
            pointer.append(
                "<tr>" +
                "<td>" + name + "</td>" +
                str +
                "</tr>"
            );
        }
    }
}
function smDayToNo(day) {
    if (day < 17) {
        return day - 12;
    } else if (day < 24) {
        return day - 14;
    } else {
        return day - 16;
    }
}

// Admin function
$("#addAttendDatePicker").datetimepicker({
    format: "DD/MM/YYYY",
    defaultDate: moment()
});
$("#addAttendTypeSelect").change(function () {
    if (this.value === '1') {
        $("#addAttendReasonContainer").show();
        $("#addAttendTimeContainer").hide();
        genAddAbsentSubj();
    } else if (this.value === '2') {
        $("#addAttendReasonContainer").show();
        $("#addAttendTimeContainer").show();
        genAddPresentSubj();
    }
});
$("#addStdTypeahead").change(function () {
    calStdQuota();
    if ($("#addAttendTypeSelect").val() === '1') {
        genAddAbsentSubj();
    } else {
        genAddPresentSubj();
    }
});
$("#addAttendDatePicker").on("dp.change", function () {
    if ($("#addAttendTypeSelect").val() === '1') {
        genAddAbsentSubj();
    } else {
        genAddPresentSubj();
    }
});
$("#addAttendQuarterSelect").change(function () {
    if ($("#addAttendTypeSelect").val() === '1') {
        genAddAbsentSubj();
    } else {
        genAddPresentSubj();
    }
});
initAddAttendData();
async function initAddAttendData() {
    $("#addAttendReasonContainer").show();
    $("#addAttendTimeContainer").hide();
    let allStd;
    let config;
    try {
        [allStd, config] = await Promise.all([allStudent(), getConfig()]);
        let stdForSearch = [];
        for (let i in allStd.student) {
            stdForSearch.push({
                name: allStd.student[i].nickname + " " + allStd.student[i].firstname + " (" + allStd.student[i].studentID + ")",
                id: allStd.student[i].studentID,
            });
        }
        $("#addStdTypeahead").typeahead({
            source: stdForSearch,
            autoSelect: true
        });
        $("#addAttendQuarterSelect").append(
            "<option value='" + config.defaultQuarter.quarter.year + "-" + config.defaultQuarter.quarter.quarter + "'>Default</option>" +
            "<option value='" + config.defaultQuarter.summer.year + "-" + config.defaultQuarter.summer.quarter + "'>Summer</option>"
        );
    } catch (error) {
        log("post/allStudent||post/getConfig is error.");
    }
}
async function genAddAbsentSubj() {
    let selectStd = $("#addStdTypeahead").typeahead("getActive");
    if (selectStd !== undefined) {
        let selectQ = $("#addAttendQuarterSelect").val();
        try {
            let timetable = await $.post("post/v1/studentTimeTable", { year: selectQ.slice(0, 4), quarter: selectQ.slice(5), studentID: selectStd.id });
            $("#addAttendSubjSelect").empty();
            let pickDate = $('#addAttendDatePicker').data('DateTimePicker').date();
            if (parseInt(selectQ.slice(5)) < 10) {
                for (let i in timetable.hybrid) {
                    let t = moment(timetable.hybrid[i].day);
                    if (t.day() === pickDate.day()) {
                        $("#addAttendSubjSelect").append(
                            "<option value='" + timetable.hybrid[i].hybridID + "'>FHB:" + timetable.hybrid[i].subject + " (" + t.format("HH:00") + ")" + "</option>"
                        );
                    }
                }
                for (let i in timetable.course) {
                    let t = moment(timetable.course[i].day);
                    if (t.day() === pickDate.day()) {
                        $("#addAttendSubjSelect").append(
                            "<option value='" + timetable.course[i].courseID + "'>" + timetable.course[i].courseName + "-" + timetable.course[i].tutorName + " (" + t.format("HH:00") + ")" + "</option>"
                        );
                    }
                }
            } else {
                for (let i in timetable.course) {
                    let t = moment(timetable.course[i].day);
                    if (pickDate.day() !== 0 && pickDate.day() !== 6) {
                        $("#addAttendSubjSelect").append(
                            "<option value='" + timetable.course[i].courseID + "'>" + timetable.course[i].courseName + "-" + timetable.course[i].tutorName + " (" + t.format("HH:00") + ")" + "</option>"
                        );
                    }
                }
            }
        } catch (error) {
            log("post/v1/studentTimeTable is error.");
        }
    }
}
async function genAddPresentSubj() {
    let selectStd = $("#addStdTypeahead").typeahead("getActive");
    if (selectStd !== undefined) {
        let pickDate = $('#addAttendDatePicker').data('DateTimePicker').date();
        let selectQ = $("#addAttendQuarterSelect").val();
        try {
            let timetable = await $.post("post/v1/studentTimeTable", { year: selectQ.slice(0, 4), quarter: selectQ.slice(5), studentID: selectStd.id });
            $("#addAttendSubjSelect").empty();
            if (parseInt(selectQ.slice(5)) < 10) {
                if (pickDate.day() === 0 || pickDate.day() === 2 || pickDate.day() === 4 || pickDate.day() === 6) {
                    $("#addAttendSubjSelect").append(
                        "<option value='0'>FHB:M</option>" +
                        "<option value='0'>FHB:P</option>"
                    );
                }
            }
            for (let i in timetable.course) {
                let t = moment(timetable.course[i].day);
                $("#addAttendSubjSelect").append(
                    "<option value='" + timetable.course[i].courseID + "'>" + timetable.course[i].courseName + "-" + timetable.course[i].tutorName + " (" + t.format("HH:00") + ")" + "</option>"
                );
            }
        } catch (error) {
            log("post/v1/studentTimeTable is error.");
        }
    }
}
$("#addAttendBtn").click(function () {
    if ($("#addAttendTypeSelect").val() === '1') {
        if ($("#addStdTypeahead").typeahead("getActive") === undefined) {
            alert("Please input student.");
        } else if ($("#addAttendSubjSelect").val() === null) {
            alert("Please input subject.");
        } else if ($("#addAttendReasonInput").val().length <= 0) {
            alert("Please input reason.");
        } else {
            if (confirm("Are you sure to add this absent?")) {
                addNewAbsentAttend();
            }
        }
    } else if ($("#addAttendTypeSelect").val() === '2') {
        if ($("#addStdTypeahead").typeahead("getActive") === undefined) {
            alert("Please input student.");
        } else if ($("#addAttendSubjSelect").val() === null) {
            alert("Please input subject.");
        } else {
            if (confirm("Are you sure to add this present?")) {
                addNewPresentAttend();
            }
        }
    }
});
async function addNewAbsentAttend() {
    $("#waitingModal").modal('show');
    let body = {};
    body.userID = $("#addStdTypeahead").typeahead("getActive").id;
    body.reason = $("#addAttendReasonInput").val();
    body.sender = "Admin";
    let pickdate = $('#addAttendDatePicker').data('DateTimePicker').date();
    let className = $("#addAttendSubjSelect option:selected").html();
    let classID = $("#addAttendSubjSelect").val();
    let hour = parseInt(className.slice(className.indexOf("(") + 1, -4));
    body.date = pickdate.hour(hour).valueOf();
    if (className.indexOf("FHB") >= 0) {
        body.hybridID = classID;
    } else {
        body.courseID = classID;
    }
    try {
        let cb = await $.post("post/v1/addStudentAbsent", body);
        log(cb);
        location.reload();
    } catch (error) {
        log("post/v1/addStudentAbsent is error.");
    }

}
async function addNewPresentAttend() {
    $("#waitingModal").modal('show');
    let body = {};
    let selectQ = $("#addAttendQuarterSelect").val();
    body.userID = $("#addStdTypeahead").typeahead("getActive").id;
    body.sender = "Admin";
    let pickdate = $('#addAttendDatePicker').data('DateTimePicker').date();
    let className = $("#addAttendSubjSelect option:selected").html();
    let classID = $("#addAttendSubjSelect").val();
    let hour = $("#addAttendTimeSelect").val();
    body.date = pickdate.hour(parseInt(hour)).valueOf();
    if ($("#addAttendReasonInput").val().length > 0) {
        body.reason = $("#addAttendReasonInput").val();
    }
    let sendData = true;
    if (className.indexOf("FHB") >= 0) {
        body.subject = className.slice(4, 5);
        try {
            let allHB = await $.post("post/v1/listHybridDayInQuarter", { year: selectQ.slice(0, 4), quarter: selectQ.slice(5) });
            for (let i in allHB) {
                let t = moment(allHB[i].day);
                if (t.day() === pickdate.day() && t.hour() === parseInt(hour)) {
                    body.hybridID = allHB[i].hybridID;
                }
            }
            if (body.hybridID === undefined) {
                alert("Please correct selected time.");
                sendData = false;
            }
        } catch (error) {
            log("post/v1/listHybridDayInQuarter is error.");
            sendData = false;
        }

    } else {
        body.courseID = classID;
    }
    if (sendData) {
        try {
            let cb = await $.post("post/v1/addStudentPresent", body);
            log(cb);
            location.reload();
        } catch (error) {
            log("post/v1/addStudentPresent is error.");
        }
    }
}
async function calStdQuota() {
    let selectStd = $("#addStdTypeahead").typeahead("getActive");
    let allQ = await listQuarter('private');
    if (selectStd !== undefined) {
        let selectQ = $("#addAttendQuarterSelect").val();
        let now = moment();
        let selectYear = parseInt(selectQ.slice(0, 4));
        let selectQuarter = parseInt(selectQ.slice(5));
        let startDate;
        let endDate;
        for (let i in allQ.quarter) {
            if (allQ.quarter[i].year === selectYear && allQ.quarter[i].quarter === selectQuarter) {
                startDate = allQ.quarter[i].startDate;
                endDate = allQ.quarter[i].endDate;
            }
        }
        try {
            let [timetable, quota, stdAttend] = await Promise.all([
                $.post("post/v1/studentTimeTable", { year: selectYear, quarter: selectQuarter, studentID: selectStd.id }),
                $.post("post/v1/listQuota", { studentID: selectStd.id }),
                $.post("post/v1/listAttendance", { studentStartDate: startDate, studentEndDate: endDate, studentID: selectStd.id })
            ]);
            let maxM = 0;
            let maxP = 0;
            let useM = 0;
            let useP = 0;
            for (let i in timetable.hybrid) {
                switch (timetable.hybrid[i].subject) {
                    case "M":
                        maxM += 2;
                        break;
                    case "P":
                        maxP += 2;
                        break;
                    default:
                        break;
                }
            }
            for (let i in stdAttend) {
                if (stdAttend[i].type === 1) {
                    switch (stdAttend[i].hybridSubject) {
                        case "M":
                            useM += 1;
                            break;
                        case "P":
                            useP += 1;
                            break;
                        default:
                            break;
                    }
                } else if (stdAttend[i].type === 2) {
                    switch (stdAttend[i].subject) {
                        case "M":
                            useM -= 1;
                            break;
                        case "P":
                            useP -= 1;
                            break;
                        default:
                            break;
                    }
                }
            }
            $("#addQuotaTableBody").empty();
            for (let i in quota.quotaCount) {
                switch (quota.quotaCount[i]._id) {
                    case "M":
                        useM -= quota.quotaCount[i].value;
                        break;
                    case "P":
                        useP -= quota.quotaCount[i].value;
                        break;
                    default:
                        break;
                }
                $("#addQuotaTableBody").append(
                    "<tr>" +
                    "<td class='text-center'>" + quota.quotaCount[i]._id + "</td>" +
                    "<td class='text-center'>" + quota.quotaCount[i].value + "</td>" +
                    "</tr>"
                );
            }
            $("#mathQuotaBtn").html("FHB:M " + (maxM - useM) + "/" + maxM);
            $("#phyQuotaBtn").html("FHB:P " + (maxP - useP) + "/" + maxP);
        } catch (error) {
            log("Request error.");
        }
    }
}
$("#mathQuotaBtn").click(function () {
    if ($(this).html().length > 5) {
        $("#addMQuotaModal").modal('show');
    }
});
$("#phyQuotaBtn").click(function () {
    if ($(this).html().length > 5) {
        $("#addPQuotaModal").modal('show');
    }
});
$("#addMQuotaBtn").click(function () {
    if ($("#addMQuotaInput").val().match(/^[-+]?[0-9]+$/)) {
        let selectStd = $("#addStdTypeahead").typeahead("getActive");
        let body = {};
        body.studentID = selectStd.id;
        body.subject = "M";
        body.value = $("#addMQuotaInput").val();
        $.post("post/v1/addQuota", body).then(cb => {
            log(cb);
            calStdQuota();
            $("#addMQuotaModal").modal('hide');
        }).catch((err) => {
            log("post/v1/addQuota is error.");
            $("#addMQuotaModal").modal('hide');
        });
    }
});
$("#addPQuotaBtn").click(function () {
    if ($("#addPQuotaInput").val().match(/^[-+]?[0-9]+$/)) {
        let selectStd = $("#addStdTypeahead").typeahead("getActive");
        let body = {};
        body.studentID = selectStd.id;
        body.subject = "P";
        body.value = $("#addPQuotaInput").val();
        $.post("post/v1/addQuota", body).then(cb => {
            log(cb);
            calStdQuota();
            $("#addPQuotaModal").modal('hide');
        }).catch((err) => {
            log("post/v1/addQuota is error.");
            $("#addPQuotaModal").modal('hide');
        });
    }
});