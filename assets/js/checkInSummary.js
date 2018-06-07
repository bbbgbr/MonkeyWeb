const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

genIntervalSelectOption();

/* function for genIntervalSelect */
function genIntervalSelectOption() {
    $.post("post/v1/listInterval").then((allInterval) => {
        let $intervalSelect = $("#interval-select");
        for (let i in allInterval) {
            let startTime = moment(allInterval[i].startDate);
            let endTime = moment(allInterval[i].endDate);
            $intervalSelect.append(
                "<option id=" + allInterval[i].intervalID + ">" + startTime.format("DD MMM YY") + " - " + endTime.format("DD MMM YY") + "</option>"
            );
        }
        genTableData();
    });
}

//add event to addInterval button
$("#addIntervalButt").click(function () {
    $("#addIntervalModal").modal('show');
});
$("#addIntervalStart").datetimepicker({
    format: "DD/MM/YYYY",
});
$("#addIntervalEnd").datetimepicker({
    format: "DD/MM/YYYY",
});
$("#addIntervalSubmitButt").click(function () {
    if ($("#addIntervalStart").val() === "") {
        alert("กรุณาใส่วันเริ่มต้น");
    } else if ($("#addIntervalEnd").val() === "") {
        alert("กรุณาใส่วันสิ้นสุด");
    } else {
        submitAddIntervalData();
    }
});

function submitAddIntervalData() {
    let startDate = $("#addIntervalStart").data('DateTimePicker').date().hour(0).minute(0).second(0).millisecond(0);
    let endDate = $("#addIntervalEnd").data('DateTimePicker').date().hour(23).minute(59).second(59).millisecond(0);
    if (startDate.valueOf() >= endDate.valueOf()) {
        alert("วันเริ่มต้นต้องอยู่ก่อนวันจบ");
    } else {
        $.post("post/v1/addCheckInterval", {
            startDate: startDate.valueOf(),
            endDate: endDate.valueOf()
        }).then((callbackData) => {
            log(callbackData);
            location.reload();
        });
    }
}

//add event to editInterval button
$("#editIntervalButt").click(function () {
    let $intervalSelect = $("#interval-select");
    let oldStartDate = moment($intervalSelect.val().slice(0, 9), "DD MMM YY");
    let oldEndDate = moment($intervalSelect.val().slice(12, 21), "DD MMM YY");
    $("#editIntervalStart").attr("placeholder", oldStartDate.format("DD/MM/YYYY"));
    $("#editIntervalEnd").attr("placeholder", oldEndDate.format("DD/MM/YYYY"));
    $("#editIntervalModal").modal('show');
});
$("#editIntervalStart").datetimepicker({
    format: "DD/MM/YYYY",
});
$("#editIntervalEnd").datetimepicker({
    format: "DD/MM/YYYY",
});
$("#editIntervalSubmitButt").click(function () {
    submitEditIntervalData();
});
$("#editIntervalRemoveButt").click(function () {
    if (confirm("ต้องการลบช่วงเวลานี้?")) {
        let intervalID = $("#interval-select option:selected").attr("id");
        $.post("post/v1/deleteInterval", { intervalID: intervalID }).then((cb) => {
            log("Complete to remove interval => " + cb);
            location.reload();
        });
    }
});

function submitEditIntervalData() {
    let $intervalSelect = $("#interval-select");
    let intervalID = $intervalSelect.find(":selected").attr("id");
    let body = { intervalID: intervalID };
    if ($("#editIntervalStart").val() !== "") body.startDate = $("#editIntervalStart").data('DateTimePicker').date().hour(0).minute(0).second(0).millisecond(0).valueOf();
    if ($("#editIntervalEnd").val() !== "") body.endDate = $("#editIntervalEnd").data('DateTimePicker').date().hour(23).minute(59).second(59).millisecond(0).valueOf();
    // if ($("#editIntervalMultiplier").val() !== "") body.multiplier = $("#editIntervalMultiplier").val();
    $.post("post/v1/editInterval", body).then((callbackData) => {
        log(callbackData);
        location.reload();
    });
}

//add event when change interval
$("#interval-select").change(function () {
    genTableData();
});

//function for gen table
async function genTableData() {
    let multiplier;
    let doneTutorID;
    let $intervalSelect = $("#interval-select");
    let intervalID = $("#interval-select option:selected").attr("id");
    let startDate = moment($intervalSelect.val().slice(0, 9), "DD MMM YY").hour(0).minute(0).second(0).millisecond(0).valueOf();
    let endDate = moment($intervalSelect.val().slice(12, 21), "DD MMM YY").hour(23).minute(59).second(59).millisecond(0).valueOf();
    let [allInterval, allData] = await Promise.all([$.post("post/v1/listInterval"), $.post("post/v1/listAllCheckInHistory", {
        startDate: startDate,
        endDate: endDate
    })]);
    for (let i in allInterval) {
        if (allInterval[i].intervalID === intervalID) {
            multiplier = allInterval[i].multiplier;
            doneTutorID = allInterval[i].done;
        }
    }
    let $mainTableBody = $("#mainTableBody");
    $mainTableBody.empty();
    let $summaryTableBody = $("#summaryTableBody");
    $summaryTableBody.empty();
    let allStaff = [];
    let promise = [];
    for (let i in allData) {
        allStaff.push($.post("post/v1/userInfo", { userID: i }));
        promise.push($.post("post/v1/listExtra", { intervalID: intervalID, tutorID: i }));
    }
    let allStaffName = await Promise.all(allStaff);
    let allExtra = await Promise.all(promise);
    let index = 0;
    let sumWH = 0;
    let sumCredit = 0;
    let sumAmout = 0;
    let lastTotal = 0;
    for (let i in allData) {
        let displayMultiply = 100;
        if (multiplier !== undefined) {
            if (multiplier[i] !== undefined) {
                displayMultiply = multiplier[i];
            }
        }
        let extra = allExtra[index];
        let realExtra = 0;
        let reason = "";
        let reasonID = "";
        let subPos = "-";
        for (let j = 0; j < extra.length; j++) {
            realExtra = realExtra + extra[j].value;
            if (extra[j].reason.indexOf("FPGG") >= 0) {
                reason = extra[j].reason.slice(4);
                reasonID = extra[j].extraID;
            }
        }
        if (allStaffName[index].subPosition !== undefined) {
            subPos = allStaffName[index].subPosition;
        }
        sumWH = sumWH + parseFloat(allData[i].hourSum.toFixed(1));
        sumCredit = sumCredit + parseFloat(allData[i].totalSum.toFixed(1));
        sumAmout = sumAmout + parseInt((allData[i].totalSum * displayMultiply).toFixed(0));
        lastTotal = lastTotal + (parseInt((allData[i].totalSum * displayMultiply).toFixed(0)) + realExtra);
        $mainTableBody.append(
            "<tr>" +
            "<td class='text-center'>" + i + "</td>" +
            "<td class='text-center table-info' onclick='showTutorHistory(" + i + ")'>" + allStaffName[index].nickname + " " + allStaffName[index].firstname + "</td>" +
            "<td class='text-center table-primary' onclick='changeSubPos(" + i + ")'>" + subPos + "</td>" +
            "<td class='text-center table-info' onclick='manageFirstpage(\"" + reasonID + "\"," + i + ")'>" + reason + "</td>" +
            "<td class='text-center'>" + allData[i].hourSum.toFixed(1) + "</td>" +
            "<td class='text-center'>" + allData[i].totalSum.toFixed(1) + "</td>" +
            "<td class='text-center table-primary' onclick='callEditGainModal(" + i + ")'>" + displayMultiply + "</td>" +
            "<td id='" + "amout" + i + "' class='text-center'>" + (allData[i].totalSum * displayMultiply).toFixed(0) + "</td>" +
            "<td class='text-center'>" + realExtra + "</td>" +
            "<td id='" + "total" + i + "' class='text-center'>" + (parseInt((allData[i].totalSum * displayMultiply).toFixed(0)) + realExtra) + "</td>" +
            "</tr>"
        );
        let doneStatus = "<span class='fas fa-fw fa-lg fa-times' style='color:red' onclick='addIntervalDone(\"" + i + "\")'></span>";
        let doneClass = "";
        if (doneTutorID !== undefined) {
            if ($.inArray(parseInt(i), doneTutorID) > -1) {
                doneClass = "table-success";
                doneStatus = "<span class='fas fa-fw fa-lg fa-check' style='color:green' onclick='deleteIntervalDone(\"" + i + "\")'></span>"
            }
        }
        $summaryTableBody.append(
            "<tr class=" + doneClass + ">" +
            "<td class='text-center' onclick='showSummaryCover(" + i + ")'>" + allStaffName[index].nickname + " " + allStaffName[index].firstname + "</td>" +
            "<td class='text-center'>" + (parseInt((allData[i].totalSum * displayMultiply).toFixed(0)) + realExtra) + "</td>" +
            "<td class='text-center'>" + doneStatus + "</td>" +
            "</tr>"
        );
        index += 1;
    }
    $mainTableBody.append(
        "<tr>" +
        "<td class='text-center table-dark' colspan='4'>Total</td>" +
        "<td class='text-center'>" + sumWH.toFixed(1) + "</td>" +
        "<td class='text-center'>" + sumCredit.toFixed(1) + "</td>" +
        "<td class='text-center'>100</td>" +
        "<td class='text-center'>" + sumAmout + "</td>" +
        "<td class='text-center'>0</td>" +
        "<td class='text-center'>" + lastTotal + "</td>" +
        "</tr>"
    );
}

// function for show summary table
$("#summaryTableButt").click(function () {
    $("#summaryTableModal").modal('show');
});

// function for show summary cover
async function showSummaryCover(tutorID) {
    let intervalID = $("#interval-select option:selected").attr("id");
    let [userInfo, extra] = await Promise.all([$.post("post/v1/userInfo", { userID: tutorID }), $.post("post/v1/listExtra", { tutorID: tutorID, intervalID: intervalID })]);
    let extraStr = "";
    for (let i in extra) {
        if (extra[i].reason.indexOf("FPGG") < 0) {
            if (extra[i].value >= 0) {
                extraStr += "<h5 class='ml-4'>" + extra[i].reason + ": + " + numberWithCommas(extra[i].value) + "</h5>";
            } else {
                extraStr += "<h5 class='ml-4'>" + extra[i].reason + ": - " + numberWithCommas(extra[i].value) + "</h5>";
            }
        }
    }
    $("#summaryCoverTitle").html(userInfo.nickname + " " + userInfo.firstname);
    $("#summerCoverBody").empty();
    $("#summerCoverBody").append(
        "<h5>Sub position : " + userInfo.subPosition + "</h5>" +
        "<h5>Salary : " + numberWithCommas($("#amout" + tutorID).html()) + "</h5>" +
        extraStr +
        "<h5>Total : " + numberWithCommas($("#total" + tutorID).html()) + "</h5>"
    );
    $("#summaryTableModal").modal('hide');
    $("#summaryCoverModal").modal('show');
}
$("#summaryCoverCloseButt").click(function () {
    $("#summaryCoverModal").modal('hide');
});
$("#summaryCoverModal").on('hidden.bs.modal', function () {
    $("#summaryTableModal").modal('show');
});


//function for edit gain
function callEditGainModal(tutorID) {
    $("#editGainModalTitle").html("Edit " + tutorID + " gain");
    $("#editGainModal").modal('show');
}

$("#editGainSubmitButt").click(function () {
    editGain();
});

function editGain() {
    let intervalID = $("#interval-select option:selected").attr("id");
    let tutorID = $("#editGainModalTitle").html().slice(5, 10);
    if ($("#editGainValue").val() !== "") {
        $.post("post/v1/editInterval", {
            intervalID: intervalID,
            multiplier: { tutorID: tutorID, value: $("#editGainValue").val() }
        }).then((cb) => {
            log("Complete to edit multiplier => " + cb);
            genTableData();
            $("#editGainModal").modal('hide');
        });
    } else {
        alert("กรุณากรอกข้อมูล");
    }
}

// function for change sub position
function changeSubPos(tutorID) {
    writeCookie("tempttID", tutorID);
    $("#changeSunPosModal").modal('show');
}
$("#changeSubPosSubmitButt").click(function () {
    let cookies = getCookieDict();
    if ($("#changeSunPosInput").val() === "") {
        alert("กรุณาใส่ sub position");
    } else {
        if (confirm("ต้องการเปลี่ยน sub position?")) {
            $.post("post/v1/changeSubPosition", { userID: cookies.tempttID, subPosition: $("#changeSunPosInput").val() }).then((cb) => {
                log("Complete to change sub position = > " + cb);
                genTableData();
                $("#changeSunPosModal").modal('hide');
                deleteCookie("tempttID");
            });
        }
    }
});

// function for change done status
function addIntervalDone(tutorID) {
    let intervalID = $("#interval-select option:selected").attr("id");
    if (confirm("ต้องการเปลี่ยนสถานะเป็น done?")) {
        $.post("post/v1/addIntervalDone", { intervalID: intervalID, userID: tutorID }).then(cb => {
            log("Complete to add done => " + cb);
            genTableData();
        });
    }
}
function deleteIntervalDone(tutorID) {
    let intervalID = $("#interval-select option:selected").attr("id");
    if (confirm("ต้องการเปลี่ยนสถานะเป็น undone?")) {
        $.post("post/v1/deleteIntervalDone", { intervalID: intervalID, userID: tutorID }).then(cb => {
            log("Complete to delete done => " + cb);
            genTableData();
        });
    }
}

//function for manage firstpage reason
function manageFirstpage(extraID, tutorID) {
    writeCookie("tempFpID", extraID);
    writeCookie("tempttID", tutorID);
    $("#fpReasonModal").modal('show');
}

$("#fpReasonAddSubmitButt").click(function () {
    let intervalID = $("#interval-select option:selected").attr("id");
    let cookies = getCookieDict();
    if (cookies.tempFpID !== undefined) {
        if ($("#fpReasonAdd").val() === "") {
            alert("กรุณากรอกข้อมูล");
        } else {
            if (cookies.tempFpID !== "") {
                $.post("post/v1/removeExtra", { extraID: cookies.tempFpID }).then((cb) => {
                    log("Complete to remove extra => " + cb);
                    $.post("post/v1/addExtra", {
                        intervalID: intervalID,
                        tutorID: cookies.tempttID,
                        value: 0,
                        reason: "FPGG" + $("#fpReasonAdd").val()
                    }).then((cb2) => {
                        $("#fpReasonModal").modal('hide');
                        log("Complete to add extra => " + cb2);
                        deleteCookie("tempFpID");
                        deleteCookie("tempttID");
                        genTableData();
                    });
                });
            } else {
                $.post("post/v1/addExtra", {
                    intervalID: intervalID,
                    tutorID: cookies.tempttID,
                    value: 0,
                    reason: "FPGG" + $("#fpReasonAdd").val()
                }).then((cb2) => {
                    $("#fpReasonModal").modal('hide');
                    log("Complete to add extra => " + cb2);
                    deleteCookie("tempFpID");
                    deleteCookie("tempttID");
                    genTableData();
                });
            }
        }
    }
});
$("#fpReasonRmSubmitButt").click(function () {
    let cookies = getCookieDict();
    if (cookies.tempFpID !== "") {
        $.post("post/v1/removeExtra", { extraID: cookies.tempFpID }).then((cb) => {
            deleteCookie("tempFpID");
            $("#fpReasonModal").modal('hide');
            log("Complete to remove extra => " + cb);
            genTableData();
        });
    } else {
        alert("ไม่มีข้อมูลในเซลล์นี้");
    }
});

//function for show independent summary
function showTutorHistory(tutorID) {
    let $modal = $("#tutorHistoryModal");
    let $title = $("#tutorHistoryModalTitle");
    let $table = $("#tutorHistoryModalTable");
    let $intervalSelect = $("#interval-select");
    let startDate = moment($intervalSelect.val().slice(0, 9), "DD MMM YY").hour(0).minute(0).second(0).millisecond(0).valueOf();
    let endDate = moment($intervalSelect.val().slice(12, 21), "DD MMM YY").hour(23).minute(59).second(59).millisecond(0).valueOf();
    $.post("post/v1/listCheckInHistory", {
        tutorID: tutorID,
        startDate: startDate,
        endDate: endDate
    }).then((historyData) => {
        $table.empty();
        let sumHour = 0;
        for (let i in historyData.detail) {
            let checkIn = moment(historyData.detail[i].checkIn);
            let checkOut = moment(historyData.detail[i].checkOut);
            let sum = 0;
            let diffHour = (checkOut.hour() - checkIn.hour()) + ((checkOut.minute() - checkIn.minute()) / 60);
            sum = historyData.detail[i].sum;
            sumHour = sumHour + diffHour;
            $table.append(
                "<tr class='" + ((diffHour < 0) ? "table-warning" : "") + "'>" +
                "<td class='text-center'>" + checkIn.format("ddd") + "</td>" +
                "<td class='text-center'>" + checkIn.format("DD MMM YYYY") + "</td>" +
                "<td class='text-center' onclick='editCheckIO(\"" + historyData.detail[i].historyID + "\",\"" + historyData.detail[i].checkIn + "\")'>" + checkIn.format("HH:mm") + "</td>" +
                "<td class='text-center' onclick='editCheckIO(\"" + historyData.detail[i].historyID + "\",\"" + historyData.detail[i].checkIn + "\")'>" + checkOut.format("HH:mm") + "</td>" +
                "<td>" + detailButton(historyData.detail[i].detail, historyData.detail[i].historyID) + "</td>" +
                "<td class='text-center'>" + diffHour.toFixed(1) + "</td>" +
                "<td class='text-center'>" + sum.toFixed(1) + "</td>" +
                "<td>" + trashButton(tutorID + "", historyData.detail[i].historyID) + "</td>" +
                "</tr>"
            );
        }
        $table.append(
            "<tr>" +
            "<td class='text-center table-dark' colspan='5'>Total</td>" +
            "<td class='text-center'>" + sumHour.toFixed(1) + "</td>" +
            "<td class='text-center'>" + historyData.totalSum.toFixed(1) + "</td>" +
            "<td class='text-center'> - </td>" +
            "</tr>"
        );
        $title.html(tutorID);
        $modal.modal('show');
    });
    showExtra(tutorID);
}

const detailButton = (detail, historyID) => {
    let str = "";
    str += "<button class='btn btn-light col-2 btn-" + buttonMinText(detail[0]) + "' onclick='editIOHistorySlot(\"" + historyID + "\",\"" + detail + "\"," + "0" + ")'>" + buttonMinText(detail[0]) + "</button>";
    str += "<button class='btn btn-light col-2 btn-" + buttonMinText(detail[1]) + "' onclick='editIOHistorySlot(\"" + historyID + "\",\"" + detail + "\"," + "1" + ")'>" + buttonMinText(detail[1]) + "</button>";
    str += "<button class='btn btn-light col-2 btn-" + buttonMinText(detail[2]) + "' onclick='editIOHistorySlot(\"" + historyID + "\",\"" + detail + "\"," + "2" + ")'>" + buttonMinText(detail[2]) + "</button>";
    str += "<button class='btn btn-light col-2 btn-" + buttonMinText(detail[3]) + "' onclick='editIOHistorySlot(\"" + historyID + "\",\"" + detail + "\"," + "3" + ")'>" + buttonMinText(detail[3]) + "</button>";
    str += "<button class='btn btn-light col-2 btn-" + buttonMinText(detail[4]) + "' onclick='editIOHistorySlot(\"" + historyID + "\",\"" + detail + "\"," + "4" + ")'>" + buttonMinText(detail[4]) + "</button>";
    str += "<button class='btn btn-light col-2 btn-" + buttonMinText(detail[5]) + "' onclick='editIOHistorySlot(\"" + historyID + "\",\"" + detail + "\"," + "5" + ")'>" + buttonMinText(detail[5]) + "</button>";
    return str;
};
const buttonMinText = (str) => {
    switch (str) {
        case "Hybrid":
            str = "HB";
            break;
        case "Reading":
            str = "Read";
            break;
        default:
            break;
    }
    return str;
};
const trashButton = (tutorID, str) => {
    return "<button type='button' class='col btn btn-light' onclick='removeIOHistory(\"" + tutorID + "\",\"" + str + "\")'><span class='fas fa-fw fa-lg fa-trash' style='color: red'></span></button>";
};

//function for extra
function addExtra() {
    $("#addExtraModal").modal('show');
}

function showExtra(tutorID) {
    let intervalID = $("#interval-select option:selected").attr("id");
    $.post("post/v1/listExtra", { tutorID: tutorID, intervalID: intervalID }).then((allExtra) => {
        $("#independentExtra").empty();
        if (allExtra.length !== 0) {
            $("#independentExtra").append("<h4 onclick='addExtra()'>Extra</h4>");
            for (let i in allExtra) {
                if (allExtra[i].reason.indexOf("FPGG") < 0) {
                    $("#independentExtra").append(
                        "<h4>" + allExtra[i].reason + " : " + allExtra[i].value +
                        " <span class='fas fa-fw fa-lg fa-trash' style='color:red' onclick='removeExtra(\"" +
                        allExtra[i].extraID + "\")'></span></h4>"
                    );
                }
            }
        } else {
            $("#independentExtra").append("<button class='btn btn-light' onclick='addExtra()'>+ Add extra</button>");
        }
    });
}

function removeExtra(extraID) {
    if (confirm("ต้องการลบ Extra นี้?")) {
        let tutorID = $("#tutorHistoryModalTitle").html();
        $.post("post/v1/removeExtra", { extraID: extraID }).then((cb) => {
            log("Complete to remove extra => " + cb);
            showTutorHistory(tutorID);
            genTableData();
        });
    }
}

$("#addExtraSubmitButt").click(function () {
    if ($("#addExtraValue").val() === "") {
        alert("กรุณาใส่ตัวเลข");
    } else if ($("#addExtraReason").val() === "") {
        alert("กรุณาใส่เหตุผล");
    } else {
        let intervalID = $("#interval-select option:selected").attr("id");
        let tutorID = $("#tutorHistoryModalTitle").html();
        $.post("post/v1/addExtra", {
            intervalID: intervalID,
            tutorID: tutorID,
            value: $("#addExtraValue").val(),
            reason: $("#addExtraReason").val()
        }).then((cb) => {
            log("Complete to add extra => " + cb);
            $("#addExtraModal").modal('hide');
            showTutorHistory(tutorID);
            genTableData();
        });
    }
});
$("#addExtraModal").on('hidden.bs.modal', function () {
    $("body").addClass("modal-open");
});

//function for edit history
$("#editTutorHistoryIn").datetimepicker({
    format: "HH:mm",
});
$("#editTutorHistoryOut").datetimepicker({
    format: "HH:mm",
});

function editCheckIO(historyID, date) {
    writeCookie("tempHistoryID", historyID);
    writeCookie("tempHistoryDate", date);
    $("#editTutorHistoryIn").val("");
    $("#editTutorHistoryOut").val("");
    $("#checkIOTimeHistoryModal").modal('show');
}

$("#editTutorHistorySubmitButt").click(function () {
    editIOHistoryTime();
});

function editIOHistoryTime() {
    let tutorID = $("#tutorHistoryModalTitle").html();
    let cookies = getCookieDict();
    let body = {};
    if (cookies.tempHistoryID === undefined || cookies.tempHistoryDate === undefined) {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        $("#checkIOTimeHistoryModal").modal('hide');
    } else {
        body.historyID = cookies.tempHistoryID;
        let date = moment(parseInt(cookies.tempHistoryDate));
        let checkIn = $("#editTutorHistoryIn").val();
        let checkOut = $("#editTutorHistoryOut").val();
        if (checkIn === "" && checkOut === "") {
            alert("กรุณากรอกเวลาที่ต้องการแก้ไข");
        } else {
            if (checkIn !== "") {
                let editInHistory = $("#editTutorHistoryIn").data('DateTimePicker').date();
                body.checkIn = date.hour(editInHistory.hour()).minute(editInHistory.minute()).valueOf();
            }
            if (checkOut !== "") {
                let editOutHistory = $("#editTutorHistoryOut").data('DateTimePicker').date();
                body.checkOut = date.hour(editOutHistory.hour()).minute(editOutHistory.minute()).valueOf();
            }
            $.post("post/v1/editCheckOutHistory", body).then((cb) => {
                log("Edit history complete => " + cb);
                $("#checkIOTimeHistoryModal").modal('hide');
                showTutorHistory(tutorID);
                deleteCookie("tempHistoryID");
                deleteCookie("tempHistoryDate");
            });
        }
    }
}
$("#checkIOTimeHistoryModal").on('hidden.bs.modal', function () {
    $("body").addClass("modal-open");
});

function editIOHistorySlot(historyID, detail, index) {
    writeCookie("tempEditHistoryID", historyID);
    writeCookie("tempEditDetail", detail);
    writeCookie("tempEditIndex", index);
    $("#checkIOSlotModal").modal('show');
}

$("#checkIOSlotModal .selector").click(function () {
    let cookies = getCookieDict();
    let historyID = cookies.tempEditHistoryID;
    let detail = cookies.tempEditDetail;
    let index = cookies.tempEditIndex;
    let body = {};
    body.historyID = historyID;
    let tutorID = $("#tutorHistoryModalTitle").html();
    let str = $(this).html();
    let newDetail = [0, 0, 0, 0, 0, 0];
    convertStrToIntArray(newDetail, detail, 0);
    newDetail[index] = getSlotValue(str);
    body.slot = newDetail;
    $.post("post/v1/editCheckOutHistory", body).then((cb) => {
        log("Edit history complete => " + cb);
        $("#checkIOSlotModal").modal('hide');
        showTutorHistory(tutorID);
        deleteCookie("tempEditHistoryID");
        deleteCookie("tempEditDetail");
        deleteCookie("tempEditIndex");
    });
});
$("#checkIOSlotModal").on('hidden.bs.modal', function () {
    $("body").addClass("modal-open");
});
const getSlotValue = (str) => {
    let type = -1;
    switch (str) {
        case "Hybrid":
            type = 0;
            break;
        case "Admin":
            type = 1;
            break;
        case "Sheet":
            type = 2;
            break;
        case "Com":
            type = 3;
            break;
        case "Reading":
            type = 4;
            break;
        case "Course":
            type = 5;
            break;
        default:
            type = -1;
            break;
    }
    return type;
};
const convertStrToIntArray = (array, str, index) => {
    if (index < 6) {
        array[index] = getSlotValue(str.slice(0, str.indexOf(",")));
        convertStrToIntArray(array, str.slice(str.indexOf(",") + 1), index + 1);
    }
};

//function for remove history
function removeIOHistory(tutorID, historyID) {
    let $table = $("#tutorHistoryModalTable");
    $table.modal('hide');
    if (confirm("ต้องการลบประวัตินี้?")) {
        $.post("post/v1/deleteCheckOutHistory", { historyID: historyID }).then((cb) => {
            log("Complete to delete history=>" + cb);
            showTutorHistory(tutorID);
        });
    }
}

//function for add history
$("#addTutorHistoryDate").datetimepicker({
    format: "DD/MM/YYYY",
});
$("#addTutorHistoryIn").datetimepicker({
    format: "HH:mm",
});
$("#addTutorHistoryOut").datetimepicker({
    format: "HH:mm",
});
$("#addHistoryButt").click(function () {
    $("#addHistoryModal").modal('show');
});
$("#addTutorHistorySubmitButt").click(function () {
    if ($("#addTutorHistoryDate").val() === "" || $("#addTutorHistoryIn").val() === "" || $("#addTutorHistoryOut") === "") {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    } else if (confirm("ต้องการเพิ่มประวัติ?")) {
        addIOHistory();
        $("#addHistoryModal").modal('hide');
    }
});
$("#addHistoryModal").on('hidden.bs.modal', function () {
    $("body").addClass("modal-open");
});

function addIOHistory() {
    let tutorID = $("#tutorHistoryModalTitle").html(); //param
    let date = $("#addTutorHistoryDate").data('DateTimePicker').date();
    let checkInTime = $("#addTutorHistoryIn").data('DateTimePicker').date();
    let checkOutTime = $("#addTutorHistoryOut").data('DateTimePicker').date();
    let checkIn = moment(0).date(date.date()).month(date.month()).year(date.year()).hour(checkInTime.hour()).minute(checkInTime.minute()); //param
    let checkOut = moment(0).date(date.date()).month(date.month()).year(date.year()).hour(checkOutTime.hour()).minute(checkOutTime.minute()); //param
    let slotData = [$("#addHistorySlot8").val(), $("#addHistorySlot10").val(), $("#addHistorySlot13").val(), $("#addHistorySlot15").val(), $("#addHistorySlot17").val(), $("#addHistorySlot19").val()];
    $.post("post/v1/addCheckOutHistory", {
        tutorID: tutorID,
        checkIn: checkIn.valueOf(),
        checkOut: checkOut.valueOf(),
        slot: slotData
    }).then((cb) => {
        log("Add new history => " + cb);
        showTutorHistory(tutorID);
    });
}