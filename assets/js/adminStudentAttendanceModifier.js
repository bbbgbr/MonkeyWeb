const summerQ = 12;
const summerMonth = 9;
const summerYear = 2017;
const crYear = 2017;
const crQuarter = 4;
$(document).ready(function () {
    // for cr&fhb
    $("#datePicker").datetimepicker({
        format: "DD/MM/YYYY",
        daysOfWeekDisabled: [1, 3, 5],
        minDate: moment()
    });
    genCrTimePick();
    genCrTable();
    $("#datePicker").on("dp.change", function () {
        genCrTimePick();
        genCrTable();
    });
    $("#crTimePick").change(function () {
        genCrTable();
    });
    $("#filterPick").change(function () {
        filterTable();
    });
    // for summer
    genTableByName();
    $("#smByName").collapse("show");
    $("#aByName").click(function () {
        $("#smByWeek").collapse("hide");
        setTimeout(function () {
            $("#smByName").collapse("show");
        }, 500);
    });
    $("#aByWeek").click(function () {
        $("#smByName").collapse("hide");
        setTimeout(function () {
            $("#smByWeek").collapse("show");
        }, 500);
    });
    $("#weekSelect").change(function () {
        genTableByWeek();
        filterSmTable();
    })
    $("#typeSelect").change(function () {
        filterSmTable();
    })
});
// For cr&fhb
function genCrTimePick() {
    $("#crTimePick").empty();
    let pickDate = $('#datePicker').data('DateTimePicker').date();
    if (pickDate.day() == 2 || pickDate.day() == 4) {
        $("#crTimePick").append("<option>17-19</option>");
    } else {
        $("#crTimePick").append("<option>8-10</option>");
        $("#crTimePick").append("<option>10-12</option>");
        $("#crTimePick").append("<option>13-15</option>");
        $("#crTimePick").append("<option>15-17</option>");
    }
}
function genCrTable() {
    $("#crPresentTable").empty();
    $("#crAbsentTable").empty();
    let pickDate = $('#datePicker').data('DateTimePicker').date();
    let time = $("#crTimePick").val();
    time = time.slice(0, time.indexOf("-"));
    let dataDate = moment(0).year(pickDate.year()).month(pickDate.month()).date(pickDate.date()).hour(time).minute(0).second(0).millisecond(0);
    $.post("post/listStudentAttendanceModifierByDay", { day: dataDate.valueOf() }, (data) => {
        // log(data.absence);
        let promise1 = [];
        let promise2 = [];
        for (let i in data.absence) {
            promise1.push($.post("post/studentProfile", { studentID: data.absence[i].studentID }));
            promise2.push($.post("post/v1/listStudentHybrid", { studentID: data.absence[i].studentID, quarter: crQuarter, year: crYear }));
        }
        Promise.all([
            Promise.all(promise1),
            Promise.all(promise2)
        ]).then((dt) => {
            // log(dt[0]);
            // log(dt[1]);
            for (let i in data.absence) {
                if (data.absence[i].reason.slice(0, 3) == "add") {
                    $("#crPresentTable").append(
                        "<tr>" +
                        "<td class='text-center'>" + data.absence[i].studentID + "</td>" +
                        "<td class='text-center'>" + dt[0][i].nickname + " " + dt[0][i].firstname + "</td>" +
                        "<td class='text-center'>" + data.absence[i].reason.slice(3) + "</td>" +
                        "<td class='text-center'><button id='" + data.absence[i].modifierID + "' onClick='removeAttend(this.id);'><span class='glyphicon glyphicon-trash'></span></button></td>" +
                        "</tr>"
                    )
                } else {
                    // log("pending");
                    $("#crAbsentTable").append(
                        "<tr class='" + (emergencyCheck(dataDate, moment(data.absence[i].timestamp)) ? "warning" : "") + " row" + i + "'>" +
                        "<td class='text-center'>" + moment(data.absence[i].timestamp).format("DD/MM/YYYY") + "</td>" +
                        "<td class='text-center'>" + data.absence[i].studentID + "</td>" +
                        "<td class='text-center'>" + dt[0][i].nickname + " " + dt[0][i].firstname + "</td>" +
                        "<td class='text-center absentSubject" + i + "'></td>" +
                        "<td class='text-center absentTutor" + i + "'></td>" +
                        "<td class='text-center'>" + data.absence[i].reason + "</td>" +
                        "<td class='text-center'><button id='" + data.absence[i].modifierID + "' onClick='removeAttend(this.id);'><span class='glyphicon glyphicon-trash'></span></button></td>" +
                        "</tr>"
                    )
                    myFHB(dt[0][i].courseID, dt[1][i], dataDate, i);
                }
            }
        })
    })
}
function myFHB(cr, fhb, time, index) {
    let promise = [];
    for (let i in fhb) {
        if (moment(fhb[i].day).day() == time.day() && moment(fhb[i].day).hour() == time.hour()) {
            $(".row" + index).addClass("fhb");
            $(".absentTutor" + index).html("HB");
            $(".absentSubject" + index).html("FHB:" + fhb[i].subject);
            filterTable();
            return;
        }
    }
    for (let i in cr) {
        promise.push($.post("post/courseInfo", { courseID: cr[i] }));
    }
    Promise.all(promise).then((data) => {
        for (let i in data) {
            if (data[i].quarter == crQuarter) {
                if (moment(data[i].day).day() == time.day() && moment(data[i].day).hour() == time.hour()) {
                    if (data[i].tutor[0] == 99000) {
                        $(".row" + index).addClass("fhb");
                        $(".absentTutor" + index).html("HB");
                        $(".absentSubject" + index).html("CR:" + data[i].courseName);
                        filterTable();
                        return;
                    } else {
                        $(".row" + index).addClass("cr");
                        $.post("post/name", { userID: data[i].tutor[0] }).then((tutorName) => {
                            $(".absentTutor" + index).html(tutorName.nicknameEn);
                            $(".absentSubject" + index).html("CR:" + data[i].courseName);
                            filterTable();
                            return;
                        })
                    }
                }
            }
        }
    })
}
function filterTable() {
    let filter = $("#filterPick").val();
    switch (filter) {
        case "HB":
            $(".cr").hide();
            $(".fhb").show();
            break;
        case "CR":
            $(".fhb").hide();
            $(".cr").show();
            break;
        default:
            $(".fhb").show();
            $(".cr").show();
            break;
    }
}
function emergencyCheck(pickDate, timestamp) {
    let time = moment(0).year(pickDate.year()).month(pickDate.month()).date(pickDate.date()).hour(18);
    let aDayValue = 24 * 60 * 60 * 1000;
    if (pickDate.day() == 0) {
        if (time.valueOf() - timestamp.valueOf() < (2 * aDayValue)) return true;
        else return false;
    } else if (time.valueOf() - timestamp.valueOf() < aDayValue) {
        return true;
    } else return false;
}
// For remove attendance
function removeAttend(id) {
    if (confirm("ต้องการลบประวัติการลานี้?")) {
        $.post("post/removeStudentAttendanceModifier", { modifierID: id }).then(() => {
            genCrTable();
        })
    }
}
// For summer
function genTableByName() {
    let allStudent = [];
    $.post("post/allStudent").done((data) => {
        for (let i = 0; i < data.student.length; i++) {
            if (data.student[i].status === "active") {
                for (let j = 0; j < data.student[i].quarter.length; j++) {
                    if (data.student[i].quarter[j].quarter === summerQ) {
                        allStudent.push({
                            name: data.student[i].nickname + " " + data.student[i].firstname,
                            id: data.student[i].studentID
                        })
                    }
                }
            }
        }
        $('.typeahead').typeahead({
            source: allStudent,
            autoSelect: true
        });
        // add func when pick student
        $(".typeahead").change(function () {
            let picked = $('.typeahead').typeahead("getActive");
            $("#smAbsentBody").empty();
            $("#smPresentBody").empty();
            genPickedTable(picked.id);
        });
    })
}
function genPickedTable(ID) {
    let time = moment().date(8).month(9);
    $.post("post/listStudentAttendanceModifierByStudent", { studentID: ID, start: time.valueOf() }).done(function (data) {
        let oldAbsentDay = moment(0);
        for (let i = 0; i < data.modifier.length; i++) {
            if (data.modifier[i].reason === "เพิ่ม") {
                $("#smPresentBody").append(
                    "<tr>" +
                    "<td class='text-center'>" + moment(data.modifier[i].day).format("DD/MM/YYYY") + "</td>" +
                    "<td class='text-center'><button id='" + data.modifier[i].modifierID + "' onClick='removeAttend(this.id);'><span class='glyphicon glyphicon-trash'></span></button></td>" +
                    "</tr>"
                );
            } else if (data.modifier[i].reason === "ลา") {
                let bool = (moment(data.modifier[i].day).date() === oldAbsentDay.date() && moment(data.modifier[i].day).month() === oldAbsentDay.month() && moment(data.modifier[i].day).year() === oldAbsentDay.year());
                if (bool) {
                    if (moment(data.modifier[i].day).hour() === 8) {
                        $(".a:last").html("✓").attr("id", data.modifier[i].modifierID).attr("onClick", "removeAttend(this.id);");
                    }
                    if (moment(data.modifier[i].day).hour() === 10) {
                        $(".b:last").html("✓").attr("id", data.modifier[i].modifierID).attr("onClick", "removeAttend(this.id);");;
                    }
                    if (moment(data.modifier[i].day).hour() === 13) {
                        $(".c:last").html("✓").attr("id", data.modifier[i].modifierID).attr("onClick", "removeAttend(this.id);");;
                    }
                } else {
                    // log("present")
                    oldAbsentDay = moment(data.modifier[i].day);
                    $("#smAbsentBody").append("<tr></tr>");
                    $("#smAbsentBody tr:last-child").append(
                        "<td class='text-center'>" + moment(data.modifier[i].day).format("DD/MM/YYYY") + "</td>" +
                        "<td class='text-center a' id='" + data.modifier[i].modifierID + "' onClick='removeAttend(this.id);'>" + ((moment(data.modifier[i].day).hour() === 8) ? "✓" : "-") + "</td>" +
                        "<td class='text-center b' id='" + data.modifier[i].modifierID + "' onClick='removeAttend(this.id);'>" + ((moment(data.modifier[i].day).hour() === 10) ? "✓" : "-") + "</td>" +
                        "<td class='text-center c' id='" + data.modifier[i].modifierID + "' onClick='removeAttend(this.id);'>" + ((moment(data.modifier[i].day).hour() === 13) ? "✓" : "-") + "</td>"
                    );
                }
            }
        }
    })
}
function genTableByWeek() {
    $("#smWeekBody").empty();
    const startDay = parseInt($("#weekSelect").val());
    const time = [8, 10, 13, 15];
    let weekPromise = [];
    for (let i = startDay; i < startDay + 5; i++) {
        for (let j in time) {
            let day = moment(0).date(i).month(summerMonth).year(summerYear).hour(time[j]);
            weekPromise.push(
                $.post("post/listStudentAttendanceModifierByDay", { day: day.valueOf() }),
                day
            );
        }
    }
    Promise.all(weekPromise).then((data) => {
        for (let i = 0; i < data.length; i += 2) {
            for (let j in data[i].absence) {
                log(data[i].absence[j]);
                if (data[i].absence[j].reason == "ลา") {
                    $("#smWeekBody").append(
                        "<tr class='danger smAbsentRow'>" +
                        "<td class='text-center'>" + data[i].absence[j].studentID + "</td>" +
                        "<td id='name" + i + j + "'></td>" +
                        "<td class='text-center'>" + data[i + 1].format("DD/MM/YYYY") + "</td>" +
                        "<td class='text-center'>" + data[i + 1].format("HH:mm") + "</td>" +
                        "<td class='text-center'><button id='" + data[i].absence[j].modifierID + "' onClick='removeAttend(this.id);'><span class='glyphicon glyphicon-trash'></span></button></td>" +
                        "</tr>"
                    );
                } else if (data[i].absence[j].reason == "เพิ่ม") {
                    $("#smWeekBody").append(
                        "<tr class='success smPresentRow'>" +
                        "<td class='text-center'>" + data[i].absence[j].studentID + "</td>" +
                        "<td id='name" + i + j + "'></td>" +
                        "<td class='text-center'>" + data[i + 1].format("DD/MM/YYYY") + "</td>" +
                        "<td class='text-center'>" + data[i + 1].format("HH:mm") + "</td>" +
                        "<td class='text-center'><button id='" + data[i].absence[j].modifierID + "' onClick='removeAttend(this.id);'><span class='glyphicon glyphicon-trash'></span></button></td>" +
                        "</tr>"
                    );
                }
                weekDayGetName(i, j, data[i].absence[j].studentID);
            }
        }
    })
}
function weekDayGetName(i, j, ID) {
    let str = "name" + i + j;
    $.post("post/name", { userID: ID }).then((smName) => {
        let nameStr = smName.firstname + " (" + smName.nickname + ") " + smName.lastname;
        $("#" + str).html(nameStr);
    })
}
function filterSmTable() {
    let filter = $("#typeSelect").val();
    switch (filter) {
        case "1":
            $(".smPresentRow").hide();
            $(".smAbsentRow").show();
            break;
        case "2":
            $(".smPresentRow").show();
            $(".smAbsentRow").hide();
            break;
        default:
            $(".smPresentRow").show();
            $(".smAbsentRow").show();
            break;
    }
} 