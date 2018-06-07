let cookie = getCookieDict();
let ID = cookie.monkeyWebUser;
let year;
let quarter;
loadProfileImg();
genQuarterSelect();

// add event when change quarter
$("#quarterSelect").change(function () {
    genStudentData();
    genStudentTimeTable();
});

// add event when click Img for upload pic
// $("#profileImg").click(function () {
//     if (window.File && window.FileReader && window.FileList && window.Blob) {
//         $("#uploadPicModal").modal('show');
//     } else {
//         alert('กรุณาเปลี่ยน Browser');
//     }
// });

// crop
let options = {
    thumbBox: '.thumbBox',
    spinner: '.spinner',
    imgSrc: '#'
}
let cropper = $('.imageBox').cropbox(options);
$('#uploadPic').on('change', function () {
    let reader = new FileReader();
    reader.onload = function (e) {
        options.imgSrc = e.target.result;
        cropper = $('.imageBox').cropbox(options);
    }
    reader.readAsDataURL(this.files[0]);
    // this.files = [];
});
// $('#btnCrop').on('click', function () {
//     log("clicccccccck")
//     let img = cropper.getDataURL()
//     $('.cropped').append('<img src="' + img + '">');
// });
$('#btnZoomIn').on('click', function () {
    cropper.zoomIn();
});
$('#btnZoomOut').on('click', function () {
    cropper.zoomOut();
});

// Upload event
// $("#uploadPicButt").click(function () {
//     if (confirm("ยืนยันการ upload?")) {
//         uploadImg(cropper.getDataURL());
//     }
// });

// load profileImg function
async function loadProfileImg() {
    let config = await getConfig();
    let path = config.profilePicturePath.slice(config.profilePicturePath.search("MonkeyWebData") + 14) + ID;
    $.get(path + ".jpg").done(() => {
        $("#profileImg").attr("src", path + ".jpg");
    }).fail(() => {
        $.get(path + ".png").done(() => {
            $("#profileImg").attr("src", path + ".png");
        }).fail(() => {
            $.get(path + ".jpeg").done(() => {
                $("#profileImg").attr("src", path + ".jpeg");
            }).fail(() => {
                log("can't find picture");
            });
        });
    });
}

// gen quarter select func
async function genQuarterSelect() {
    let [allQ, config] = await Promise.all([listQuarter("public"), getConfig()]);
    let $quarterSelect = $("#quarterSelect");
    for (let i in allQ.quarter) {
        $quarterSelect.append(
            "<option value='" + allQ.quarter[i].quarterID + "'>" + allQ.quarter[i].name + "</option>"
        );
    }
    year = config.defaultQuarter.registration.year;
    quarter = config.defaultQuarter.registration.quarter;
    $quarterSelect.val(year + ((quarter >= 10) ? "" : "0") + quarter);
    genStudentData();
    genStudentTimeTable();
}

// gen student data func
async function genStudentData() {
    $("#studentProfileContent").empty();
    let studentInfo = await studentProfile(ID);
    let qValue = $("#quarterSelect").val();
    let str = "ยังไม่ได้ลงทะเบียน";
    for (let i in studentInfo.quarter) {
        if (studentInfo.quarter[i].year == qValue.slice(0, 4) && studentInfo.quarter[i].quarter == qValue.slice(4)) {
            /* switch (studentInfo.quarter[i].registrationState) {
                case "finished":
                    str = "ลงทะเบียนเรียบร้อย";
                    break;
                case "pending":
                    str = "รอการยืนยัน";
                    break;
                case "approved":
                    str = "ตารางถูกต้อง";
                    break;
                case "transferred":
                    str = "โอนเงินเรียบร้อย";
                    break;
                case "rejected":
                    str = "แก้ไขตาราง";
                    break;
                case "untransferred":
                    str = "ยังไม่โอนเงิน";
                    break;
                default:
                    break;
            } */
            str = studentInfo.quarter[i].registrationState;
        }
    }
    if ($(document).width() >= 768) {
        $("#studentProfileContent").append(
            "<h4>" + studentInfo.firstname + " (" + studentInfo.nickname + ") " + studentInfo.lastname + "</h4>" +
            "<h4>" + studentInfo.firstnameEn + " (" + studentInfo.nicknameEn + ") " + studentInfo.lastnameEn + "</h4>" +
            "<h4>" + "ID: " + ID + "</h4>" +
            "<h4>" + "ชั้น: " + (studentInfo.grade > 6 ? 'ม.' + (studentInfo.grade - 6) : 'ป.' + studentInfo.grade) + "</h4>" +
            "<h4><span class='fas fa-fw fa-lg fa-phone'></span> " + studentInfo.phone + "</h4>" +
            "<h4><span class='fas fa-fw fa-lg fa-envelope'></span> " + studentInfo.email + "</h4>" +
            "<h4>" + "สถานะ: " + str + "</h4>"
        );
    } else {
        $("#studentProfileContent").append(
            "<h6>" + studentInfo.firstname + " (" + studentInfo.nickname + ") " + studentInfo.lastname + "</h6>" +
            "<h6>" + studentInfo.firstnameEn + " (" + studentInfo.nicknameEn + ") " + studentInfo.lastnameEn + "</h6>" +
            "<h6>" + "ID: " + ID + "</h6>" +
            "<h6>" + "ชั้น: " + (studentInfo.grade > 6 ? 'ม.' + (studentInfo.grade - 6) : 'ป.' + studentInfo.grade) + "</h6>" +
            "<h6><span class='fas fa-fw fa-lg fa-phone'></span> " + studentInfo.phone + "</h6>" +
            "<h6><span class='fas fa-fw fa-lg fa-envelope'></span> " + studentInfo.email + "</h6>" +
            "<h6>" + "สถานะ: " + str + "</h6>"
        );
    }
}

// gen student time table func
async function genStudentTimeTable() {
    let qValue = $("#quarterSelect").val();
    if (parseInt(qValue.slice(4)) >= 10) {
        $("#mainTable").collapse('hide');
        $("#summerTable").collapse('show');
    } else {
        $("#summerTable").collapse('hide');
        $("#mainTable").collapse('show');
    }
    $(".selector").html("&nbsp;").removeClass("cr hb sk");
    let timeTable = await $.post("post/v1/studentTimeTable", { studentID: ID, year: qValue.slice(0, 4), quarter: qValue.slice(4) });
    for (let i in timeTable.course) {
        let time = moment(timeTable.course[i].day);
        $(".btn" + time.day() + "-" + time.hour()).addClass("cr").html(timeTable.course[i].courseName + " - " + timeTable.course[i].tutorName);
    }
    for (let i in timeTable.hybrid) {
        let time = moment(timeTable.hybrid[i].day);
        $(".btn" + time.day() + "-" + time.hour()).addClass("hb").html("FHB:" + timeTable.hybrid[i].subject);
    }
    for (let i in timeTable.skill) {
        let time = moment(timeTable.skill[i].day);
        switch (time.hour()) {
            case 8:
            case 9:
                $(".btn" + time.day() + "-8").addClass("sk").html("SK:" + timeTable.skill[i].subject + " - " + time.format("HH:mm"));
                break;
            case 10:
            case 11:
                $(".btn" + time.day() + "-10").addClass("sk").html("SK:" + timeTable.skill[i].subject + " - " + time.format("HH:mm"));
                break;
            case 13:
            case 14:
                $(".btn" + time.day() + "-13").addClass("sk").html("SK:" + timeTable.skill[i].subject + " - " + time.format("HH:mm"));
                break;
            case 15:
            case 16:
                $(".btn" + time.day() + "-15").addClass("sk").html("SK:" + timeTable.skill[i].subject + " - " + time.format("HH:mm"));
                break;
            default:
                $(".btn" + time.day() + "-" + time.hour()).addClass("sk").html("SK:" + timeTable.skill[i].subject + " - " + time.format("HH:mm"));
                break;
        }
    }
}

// upload image function
function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);
    // separate out the mime component
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to a typed array
    let ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
}
function uploadImg(URL) {
    let dataURL = URL;
    let blob = dataURItoBlob(dataURL);
    let formData = new FormData();
    formData.append('file[]', blob, 'file.png');
    imgUrl = 'post/updateProfilePicture';
    formData.append('userID', ID);
    $.ajax({
        url: imgUrl,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            location.reload();
        }
    });
    // let imgUrl = '';
    // let ufile = $('#file-img');
    // let ext = ufile.val().split('.').pop().toLowerCase();
    // if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
    //     alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
    // } else {
    //     let files = ufile.get(0).files;
    //     let formData = new FormData();
    //     let file = files[0];
    //     formData.append('file[]', blob);
    //     imgUrl = 'post/updateProfilePicture';
    //     formData.append('userID', ID);
    //     $.ajax({
    //         url: imgUrl,
    //         type: 'POST',
    //         data: formData,
    //         processData: false,
    //         contentType: false,
    //         success: function (data) {
    //             location.reload();
    //         }
    //     });
    // }
}