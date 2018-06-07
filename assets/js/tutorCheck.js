const TOTAL_SLOT = 6;
var currentSlot = -1;
var slot = [-1, -1, -1, -1, -1, -1];
var tableInfo = [];
var checkInDate, checkOutDate;
var slotName = ['Hybrid', 'Admin', 'Sheet', 'Com', 'Reading', 'Course'];

async function checkIn() {
    let cookie = getCookieDict();
    var tutorName = await $.post("post/v1/userInfo", { userID: cookie.monkeyWebUser });
    try {
        var checkInResponse = await $.post('/post/v1/tutorCheckIn', {
            tutorID: cookie.monkeyWebUser
        });
        log(checkInResponse);
        if (checkInResponse.err) {
            if (checkInResponse.err.code === 11000) {
                $('#checkInResponse').empty();
                $('#checkInResponse').append(
                    '<div class="alert alert-warning" role="alert">' +
                    'Already Check In' +
                    '</div>'
                );
                $('#checkInModal').modal('show');
            }
        } else {
            var date = new Date(checkInResponse.timestamp);
            $('#checkInResponse').empty();
            $('#checkInResponse').append(
                '<div class="alert alert-success" role="alert">' +
                tutorName.firstname + ' ' + tutorName.nickname +
                '<br>' +
                'TimeStamp: ' + moment(date).format("DD/MM/YY HH:mm:ss") +
                '</div>'
            );
            let subPos = tutorName.subPosition;
            if (subPos === undefined) {
                if (tutorName.position.trim().toLowerCase() === "mel") {
                    await lineNotify("MonkeyTrainee", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckin:" + moment(date).format("DD/MM/YY HH:mm:ss"));
                } else {
                    await lineNotify("MonkeyStaff", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckin:" + moment(date).format("DD/MM/YY HH:mm:ss"));
                }
            } else if (subPos.trim().toLowerCase() === "trainee") {
                await lineNotify("MonkeyTrainee", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckin:" + moment(date).format("DD/MM/YY HH:mm:ss"));
            } else {
                await lineNotify("MonkeyStaff", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckin:" + moment(date).format("DD/MM/YY HH:mm:ss"));
            }
            $('#checkInModal').modal('show');
        }
    } catch (error) {
        switch (error.status) {
            case 401:
                $('#checkInResponse').empty();
                $('#checkInResponse').append(
                    '<div class="alert alert-danger" role="alert">' +
                    'Unauthorize network' +
                    '</div>'
                );
                $('#checkInModal').modal('show');
                break;
            default:
                break;
        }
    }
}

async function checkOut() {
    tableInfo = [];
    slot = [-1, -1, -1, -1, -1, -1];
    currentSlot = -1;
    let cookie = getCookieDict();
    var tutorName = await name(cookie.monkeyWebUser);
    try {
        var pendingResponse = await $.post('/post/v1/getPendingTutorCheckIn', {
            tutorID: cookie.monkeyWebUser
        });
        if (pendingResponse.err) { } else {
            checkInDate = new Date(pendingResponse.checkIn);
            checkOutDate = new Date();
            currentSlot = getSlot(checkInDate);
            $('#checkOutResponse').empty();
            $('#checkOutResponse').append(checkOutButton());
            $(".modal-btn").css({ "height": "15vh", "padding-top": "1.5vh" });
            $(".modal-btn").addClass("m-1");
            $('#checkOutModal').modal('show');
        }
    } catch (error) {
        switch (error.status) {
            case 401:
                $('#checkOutResponse').empty();
                $('#checkOutResponse').append(
                    '<div class="alert alert-danger" role="alert">' +
                    'Unauthorize network' +
                    '</div>'
                );
                $('#checkOutModal').modal('show');
                break;
            case 404:
                $('#checkOutResponse').empty();
                $('#checkOutResponse').append(
                    '<div class="alert alert-danger" role="alert">' +
                    'Check in history not found' +
                    '</div>'
                );
                $('#checkOutModal').modal('show');
                break;
            default:
                break;
        }
    }
}

async function checkOutSubmit() {
    let cookie = getCookieDict();
    var tutorName = await $.post("post/v1/userInfo", { userID: cookie.monkeyWebUser });
    try {
        var checkOutResponse = await $.post('/post/v1/tutorCheckOut', {
            tutorID: cookie.monkeyWebUser,
            slot0: slot[0],
            slot1: slot[1],
            slot2: slot[2],
            slot3: slot[3],
            slot4: slot[4],
            slot5: slot[5]
        });
        let subPos = tutorName.subPosition;
        if (subPos === undefined) {
            if (tutorName.position.trim().toLowerCase() === "mel") {
                await lineNotify("MonkeyTrainee", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckout:" + moment(checkOutDate).format("DD/MM/YY HH:mm:ss"));
            } else {
                await lineNotify("MonkeyStaff", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckout:" + moment(checkOutDate).format("DD/MM/YY HH:mm:ss"));
            }
        } else if (subPos.trim().toLowerCase() === "trainee") {
            await lineNotify("MonkeyTrainee", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckout:" + moment(checkOutDate).format("DD/MM/YY HH:mm:ss"));
        } else {
            await lineNotify("MonkeyStaff", "\n" + tutorName.firstname + ' ' + tutorName.nickname + "\nCheckout:" + moment(checkOutDate).format("DD/MM/YY HH:mm:ss"));
        }
        $('#checkOutSummaryModal').modal('hide');
    } catch (error) {
        $('#checkOutSummaryModal').modal('hide');
        switch (error.status) {
            case 401:
                $('#checkOutResponse').empty();
                $('#checkOutResponse').append(
                    '<div class="alert alert-danger" role="alert">' +
                    'Unauthorize network' +
                    '</div>'
                );
                $('#checkOutModal').modal('show');
                break;
            case 404:
                $('#checkOutResponse').empty();
                $('#checkOutResponse').append(
                    '<div class="alert alert-danger" role="alert">' +
                    'Check in history not found' +
                    '</div>'
                );
                $('#checkOutModal').modal('show');
                break;
            default:
                break;
        }
    }
}

function next(detail) {
    slot[currentSlot] = detail;
    tableInfo.push({
        time: getSlotLabel(),
        detail: slotName[detail]
    });
    log(slot);
    if (currentSlot < getSlot(checkOutDate)) {
        currentSlot++;
        $('#checkOutResponse').empty();
        $('#checkOutResponse').append(checkOutButton());
        $(".modal-btn").css({ "height": "15vh", "padding-top": "1.5vh" });
        $(".modal-btn").addClass("m-1");
    } else {
        $('#checkOutModal').modal('hide');
        $('#checkOutTable').empty();
        $('#checkOutTable').append(
            '<thead>' +
            '<td>Time</td>' +
            '<td>Detail</td>' +
            '</thead>');
        $(function () {
            $.each(tableInfo, function (i, item) {
                var $tr = $('<tr>').append(
                    $('<td>').text(item.time),
                    $('<td>').text(item.detail)
                ).appendTo('#checkOutTable');
            });
        });
        $('#checkOutSummaryModal').modal('show');
    }
}

function getSlot(date) {
    var hour = [10, 13, 15, 17, 19, 24];
    for (let i = 0; i < hour.length; i++) {
        if (date.getHours() < hour[i]) {
            return i;
        }
    }
    return -1;
}

function getSlotLabel() {
    var startHour = ['08', '10', '13', '15', '17', '19'];
    var endHour = ['10', '13', '15', '17', '19', '24'];
    if (currentSlot === getSlot(checkInDate) && currentSlot === getSlot(checkOutDate)) {
        return moment(checkInDate).format("HH:mm:ss") + ' - ' + moment(checkOutDate).format("HH:mm:ss");
    } else if (currentSlot === getSlot(checkInDate)) {
        return moment(checkInDate).format("HH:mm:ss") + ' - ' + endHour[currentSlot] + ':00:00';
    } else if (currentSlot === getSlot(checkOutDate)) {
        return startHour[currentSlot] + ':00:00' + ' - ' + moment(checkOutDate).format("HH:mm:ss");
    } else {
        return startHour[currentSlot] + ':00:00' + ' - ' + endHour[currentSlot] + ':00:00';
    }
}

function checkOutButton() {
    return '<div class="row" id="lable"><div class="col text-center">' +
        'Time: ' + getSlotLabel() +
        '</div></div>' +
        '<br>' +
        '<div class="row">' +
        '<button class="col btn btn-primary modal-btn" onclick="next(0)">' +
        'Hybrid' +
        '</button>' +
        '<button class="col btn btn-primary modal-btn" onclick="next(1)">' +
        'Admin' +
        '</button>' +
        '<button class="col btn btn-primary modal-btn" onclick="next(2)">' +
        'Sheet' +
        '</button>' +
        '</div>' +
        '<div class="row">' +
        '<button class="col btn btn-primary modal-btn" onclick="next(3)">' +
        'Com' +
        '</button>' +
        '<button class="col btn btn-primary modal-btn" onclick="next(4)">' +
        'Reading' +
        '</button>' +
        '<button class="col btn btn-primary modal-btn" onclick="next(5)">' +
        'Course' +
        '</button>' +
        '</div>';
}