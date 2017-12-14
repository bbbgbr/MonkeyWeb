genIntervalSelectOption();

/* function for genIntervalSelect */
function genIntervalSelectOption() {
    $.post("post/v1/listInterval").then((allInterval) => {
        let $intervalSelect = $("#interval-select");
        for (let i in allInterval) {
            let startTime = moment(allInterval[i].startDate);
            let endTime = moment(allInterval[i].endDate);
            if (allInterval[i].multiplier !== undefined) {
                $intervalSelect.append(
                    "<option id=" + allInterval[i].intervalID + ">" + startTime.format("DD MMM YY") + " - " + endTime.format("DD MMM YY") + " (" + allInterval[i].multiplier + ")" + "</option>"
                );
            } else {
                $intervalSelect.append(
                    "<option id=" + allInterval[i].intervalID + ">" + startTime.format("DD MMM YY") + " - " + endTime.format("DD MMM YY") + "</option>"
                );
            }
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

function submitEditIntervalData() {
    let $intervalSelect = $("#interval-select");
    let intervalID = $intervalSelect.find(":selected").attr("id");
    let body = {intervalID: intervalID};
    if ($("#editIntervalStart").val() !== "") body.startDate = $("#editIntervalStart").data('DateTimePicker').date().hour(0).minute(0).second(0).millisecond(0).valueOf();
    if ($("#editIntervalEnd").val() !== "") body.endDate = $("#editIntervalEnd").data('DateTimePicker').date().hour(23).minute(59).second(59).millisecond(0).valueOf();
    if ($("#editIntervalMultiplier").val() !== "") body.multiplier = $("#editIntervalMultiplier").val();
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
    let $intervalSelect = $("#interval-select");
    if ($intervalSelect.val().indexOf("(") >= 0) {
        multiplier = parseInt($intervalSelect.val().slice($intervalSelect.val().indexOf("(") + 1, $intervalSelect.val().indexOf(")")));
    } else {
        multiplier = 1;
    }
    let startDate = moment($intervalSelect.val().slice(0, 9), "DD MMM YY").hour(0).minute(0).second(0).millisecond(0).valueOf();
    let endDate = moment($intervalSelect.val().slice(12, 21), "DD MMM YY").hour(23).minute(59).second(59).millisecond(0).valueOf();
    let allData = await $.post("post/v1/listAllCheckInHistory", {startDate: startDate, endDate: endDate});
    let $mainTableBody = $("#mainTableBody");
    $mainTableBody.empty();
    let allStaff = [];
    for (let i in allData) {
        allStaff.push(name(i));
    }
    let allStaffName = await Promise.all(allStaff);
    let index = 0;
    for (let i in allData) {
        $mainTableBody.append(
            "<tr onclick='showTutorHistory(" + i + ")'>" +
            "<td class='text-center'>" + i + "</td>" +
            "<td class='text-center'>" + allStaffName[index].nickname + " " + allStaffName[index].firstname + "</td>" +
            "<td class='text-center'>" + allData[i].detail.totalSum.toFixed(0) + "</td>" +
            "<td class='text-center'>" + (allData[i].detail.totalSum * multiplier).toFixed(0) + "</td>" +
            "</tr>"
        );
        index += 1;
    }
}

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
        for (let i in historyData.detail) {
            let checkIn = moment(historyData.detail[i].checkIn);
            let checkOut = moment(historyData.detail[i].checkOut);
            $table.append(
                "<tr>" +
                "<td class='text-center'>" + checkIn.format("ddd") + "</td>" +
                "<td class='text-center'>" + checkIn.format("DD MMM YYYY") + "</td>" +
                "<td class='text-center' onclick='editCheckIO(\"" + historyData.detail[i].historyID + "\",\"" + historyData.detail[i].checkIn + "\")'>" + checkIn.format("HH:mm") + "</td>" +
                "<td class='text-center' onclick='editCheckIO(\"" + historyData.detail[i].historyID + "\",\"" + historyData.detail[i].checkIn + "\")'>" + checkOut.format("HH:mm") + "</td>" +
                "<td>" + detailButton(historyData.detail[i].detail, historyData.detail[i].historyID) + "</td>" +
                "<td>" + trashButton(tutorID + "", historyData.detail[i].historyID) + "</td>" +
                "</tr>"
            );
        }
        $title.html(tutorID);
        $modal.modal('show');
    });
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
    return "<button type='button' class='col btn btn-light' onclick='removeIOHistory(\"" + tutorID + "\",\"" + str + "\")'><span class='fa fa-lg fa-trash-o' style='color: red'></span></button>";
};

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
    })
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
        $.post("post/v1/deleteCheckOutHistory", {historyID: historyID}).then((cb) => {
            log("Complete to delete history=>" + cb);
            showTutorHistory(tutorID)
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