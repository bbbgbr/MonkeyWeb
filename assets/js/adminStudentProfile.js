if ($(document).width() > 767) {
    $("#statusSidebar").addClass("position-fixed");
    $("#profileImg").css("max-height", "50vh");
    $("#recieptImg").css("max-height", "80vh");
}

let cookie = getCookieDict();
let ID = cookie.monkeyWebAdminAllstudentSelectedUser;
loadProfileImg();
genQuarterSelect();

// add event when change quarter
$("#quarterSelect").change(function () {
    writeCookie("monkeyWebSelectedQuarter", this.value);
    loadRecieptImg();
    genStudentData();
});

// add event when click butt in table
$(".selector").click(function () {
    if ($(this).html() !== "ADD SUBJ") {
        if ($(this).hasClass("cr")) removeCourse(this.id);
        else if ($(this).hasClass("hb")) removeHybrid(this.id);
        else if ($(this).hasClass("sk")) removeSkill(this.id);
    } else {
        addTimeTable(this.className);
    }
});

// add event when click addSubjButt
$("#addSubjButt").click(function () {
    addStudentTimeTable();
});

// add event when click Img for upload pic
let uploadImgType = 0;
$("#profileImg").click(function () {
    uploadImgType = 0;
    $("#uploadPicModal").modal('show');
});
$("#recieptImg").click(function () {
    uploadImgType = 1;
    $("#uploadPicModal").modal('show');
});
$("#uploadPicButt").click(function () {
    if (confirm("ยืนยันการ upload?")) {
        uploadImg(uploadImgType);
    }
});

// add event when click student info
$("#studentProfileContent").click(function () {
    $("#changeStudentInfoModal").modal('show');
});
$("#changeStudentInfoButt").click(function () {
    changeStudentInfo();
});

// add event when click view comment butt
$("#commentViewButt").click(function () {
    genCommentViewBody();
    $("#viewCommentModal").modal('show');
});

// add event when click add chat
$("#addChatBtn").click(function () {
    $("#addChatModal").modal("show");
});
$("#addNewChatButt").click(function () {
    addNewChat();
});

// add event when click download butt
$("#mathCoverDowload").click(function () {
    if (!($(this).hasClass('disabled'))) {
        genCover(0);
    }
});
$("#phyCoverDowload").click(function () {
    if (!($(this).hasClass('disabled'))) {
        genCover(1);
    }
});
$("#cheCoverDowload").click(function () {
    if (!($(this).hasClass('disabled'))) {
        genCover(2);
    }
});
$("#engCoverDowload").click(function () {
    if (!($(this).hasClass('disabled'))) {
        genCover(3);
    }
});
$("#smMathCoverDowload").click(function () {
    genSummerCover(1);
});
$("#smPhyCoverDowload").click(function () {
    genSummerCover(2);
});

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

// load reciept function
async function loadRecieptImg() {
    let config = await getConfig();
    let quarterName = $("#quarterSelect option:selected").text();
    let path = config.receiptPath.slice(config.receiptPath.search("MonkeyWebData") + 14) + quarterName + "/" + ID;
    $.get(path + ".jpg").done(() => {
        $("#recieptImg").attr("src", path + ".jpg");
    }).fail(() => {
        $.get(path + ".png").done(() => {
            $("#recieptImg").attr("src", path + ".png");
        }).fail(() => {
            $.get(path + ".jpeg").done(() => {
                $("#recieptImg").attr("src", path + ".jpeg");
            }).fail(() => {
                log("can't find picture");
                $("#recieptImg").attr("src", "images/nopic.png");
            });
        });
    });
}

// gen quater select function
async function genQuarterSelect() {
    let quarter = await listQuarter("private");
    for (let i in quarter.quarter) {
        $("#quarterSelect").append(
            "<option value=" + quarter.quarter[i].year + "-" + quarter.quarter[i].quarter + ">" + quarter.quarter[i].name + "</option>"
        );
    }
    let cookie = getCookieDict();
    if (cookie.monkeyWebSelectedQuarter === undefined) {
        let config = await getConfig();
        let str = config.defaultQuarter.quarter.year + "-" + config.defaultQuarter.quarter.quarter;
        $("#quarterSelect").val(str);
        writeCookie("monkeyWebSelectedQuarter", str);
    } else {
        $("#quarterSelect").val(cookie.monkeyWebSelectedQuarter);
    }
    genStudentData();
    loadRecieptImg();
    showChatData();
}

// gen student info function
async function genStudentData() {
    let str = $("#quarterSelect").val();
    writeCookie("courseQuarter", str);
    let studentData = await studentProfile(ID);
    $("#studentProfileContent").empty();
    $("#studentProfileContent").append(
        "<h4>" + studentData.firstname + " (" + studentData.nickname + ") " + studentData.lastname + "</h4>" +
        "<h4>" + studentData.firstnameEn + " (" + studentData.nicknameEn + ") " + studentData.lastnameEn + "</h4>" +
        "<h4><span class='fas fa-fw fa-lg fa-graduation-cap'></span> " + (studentData.grade > 6 ? 'S' + (studentData.grade - 6) : 'P' + studentData.grade) +
        " <span class='far fa-fw fa-lg fa-id-card'></span> " + ID + "</h4>" +
        "<h5>Level: " + studentData.level + "</h5>" +
        "<h5><span class='far fa-fw fa-lg fa-envelope'></span> " + studentData.email + "</h5>" +
        "<h5><span class='fas fa-fw fa-lg fa-phone'></span> Student: " + studentData.phone + "</h5>" +
        "<h5><span class='fas fa-fw fa-lg fa-phone'></span> Parent: " + studentData.phoneParent + "</h5>"
    );
    if (parseInt(str.slice(5)) > 10) {
        $("#smCoverDowload").show();
        $("#mathCoverDowload").hide();
        $("#phyCoverDowload").hide();
        $("#cheCoverDowload").hide();
        $("#engCoverDowload").hide();
    } else {
        $("#smCoverDowload").hide();
        $("#mathCoverDowload").show();
        $("#phyCoverDowload").show();
        $("#cheCoverDowload").show();
        $("#engCoverDowload").show();
    }
    genStatusPanel(studentData.status, studentData.quarter);
    genStudentTable();
    genChangeInfoModal(studentData);
}
async function genStatusPanel(status, quarter) {
    let cookie = getCookieDict();
    let $statusButt = $("#statusButton");
    let $statusDropdown = $("#statusDropdown");
    let $statusSubButton = $("#statusSubButton");
    $statusButt.removeClass("btn-danger btn-success btn-secondary btn-dark");
    $statusDropdown.empty();
    $statusSubButton.empty();
    switch (status) {
        case "active":
            $statusButt.html("ACTIVE").addClass("btn-success");
            $statusSubButton.append(
                "<button class='col-12 btn btn-light subButt-unregistered' onclick=\"changeStudentState(\'unregistered\')\">UNREGISTER</button>" +
                "<button class='col-12 btn btn-light subButt-untransferred' onclick=\"changeStudentState(\'untransferred\')\">UNTRANSFER</button>" +
                "<button class='col-12 btn btn-light subButt-rejected' onclick=\"changeStudentState(\'rejected\');\">REJECT</button>" +
                "<button class='col-12 btn btn-light subButt-transferred' onclick=\"changeStudentState(\'transferred\')\">TRANSFER</button>" +
                "<button class='col-12 btn btn-light subButt-approved' onclick=\"changeStudentState(\'approved\')\">APPROVE</button>" +
                "<button class='col-12 btn btn-light subButt-pending' onclick=\"changeStudentState(\'pending\')\">PENDING</button>" +
                "<button class='col-12 btn btn-light subButt-finished' onclick=\"changeStudentState(\'finished\');\">FINISH</button>"
            );
            break;
        case "inactive":
            $statusButt.html("INACTIVE").addClass("btn-secondary");
            $statusSubButton.append(
                "<button class='col-12 btn btn-light'>Please login and fill profile data</button>"
            );
            break;
        case "dropped":
            $statusButt.html("DROP").addClass("btn-danger");
            $statusSubButton.append(
                "<button class='col-12 btn btn-danger'>PENDING</button>" +
                "<button class='col-12 btn btn-light' onclick=\"changeStudentStatus(\'active\')\">EDITED</button>" +
                "<button class='col-12 btn btn-light' onclick=\"changeStudentStatus(\'terminated\')\">TERMINATE</button>"
            );
            break;
        case "terminated":
            $statusButt.html("TERMINATE").addClass("btn-dark");
            $statusSubButton.append(
                "<button class='col-12 btn btn-light'>Please active again for regis</button>"
            );
            break;
        default:
            break;
    }
    $statusDropdown.append(
        "<a class='dropdown-item' onclick=\"changeStudentStatus(\'active\')\">ACTIVE</a>" +
        "<a class='dropdown-item' onclick=\"changeStudentStatus(\'dropped\')\">DROP</a>"
        // "<a class='dropdown-item' onclick=\"changeStudentStatus(\'terminated\')\">TERMINATE</a>"
    );
    let str = cookie.courseQuarter;
    if (quarter != undefined) {
        let iden = true;
        for (let i in quarter) {
            if (quarter[i].year == str.slice(0, 4) && quarter[i].quarter == str.slice(5)) {
                iden = false;
                $(".subButt-" + quarter[i].registrationState).removeClass("btn-light").addClass("btn-success");
            }
        }
        if (iden) {
            $(".subButt-unregistered").removeClass("btn-light").addClass("btn-success");
        }
    } else {
        let data = await studentProfile(ID);
        quarter = data.quarter;
        genStatusPanel(status, quarter);
    }
}
async function genStudentTable() {
    let fhbHasMath = false;
    let fhbHasPhy = false;
    let fhbHasChe = false;
    let fhbHasEng = false;
    let str = $("#quarterSelect").val();
    $(".selector").html("ADD SUBJ").removeClass("cr hb sk");
    if (parseInt(str.slice(5)) > 10) {
        $("#mainTable").collapse("hide");
        $("#summerTable").collapse("show");
    } else {
        $("#mainTable").collapse("show");
        $("#summerTable").collapse("hide");
    }
    let timeTable = await $.post("post/v1/studentTimeTable", { studentID: ID, year: str.slice(0, 4), quarter: str.slice(5) });
    for (let i in timeTable.course) {
        let time = moment(timeTable.course[i].day);
        let tutorName = (timeTable.course[i].tutorName == "Hybrid") ? "HB" : timeTable.course[i].tutorName;
        $(".btn" + time.day() + time.hour()).html("CR:" + timeTable.course[i].courseName + " - " + tutorName).addClass("cr").attr("id", timeTable.course[i].courseID);
        if (timeTable.course[i].tutorName == "Hybrid") {
            switch (timeTable.course[i].courseName.slice(0, 1)) {
                case "M":
                    fhbHasMath = true;
                    break;
                case "P":
                    fhbHasPhy = true;
                    break;
                case "C":
                    fhbHasChe = true;
                    break;
                case "E":
                    fhbHasEng = true;
                    break;
                default:
                    break;
            }

        }
        // if (timeTable.course[i].courseName.slice(0, 1) === "C") {
        //     fhbHasChe = true;
        // }
    }
    for (let i in timeTable.hybrid) {
        let time = moment(timeTable.hybrid[i].day);
        $(".btn" + time.day() + time.hour()).html("FHB:" + timeTable.hybrid[i].subject).addClass("hb").attr("id", timeTable.hybrid[i].hybridID);
        switch (timeTable.hybrid[i].subject) {
            case "M":
                fhbHasMath = true;
                break;
            case "P":
                fhbHasPhy = true;
                break;
            case "C":
                fhbHasChe = true;
                break;
            case "E":
                fhbHasEng = true;
                break;
            default:
                break;
        }
    }
    for (let i in timeTable.skill) {
        let time = moment(timeTable.skill[i].day);
        if (time.hour() == 9) time.hour(8);
        if (time.hour() == 11) time.hour(10);
        if (time.hour() == 14) time.hour(13);
        $(".btn" + time.day() + time.hour()).html("SKILL:" + timeTable.skill[i].subject).addClass("sk").attr("id", timeTable.skill[i].skillID);
    }
    genBarcode();
    genTableTemplate(fhbHasMath, fhbHasPhy, fhbHasChe, fhbHasEng);
}
function genChangeInfoModal(studentData) {
    $("#nicknameInput").attr("placeholder", studentData.nickname);
    $("#firstnameInput").attr("placeholder", studentData.firstname);
    $("#lastnameInput").attr("placeholder", studentData.lastname);
    $("#nicknameEInput").attr("placeholder", studentData.nicknameEn);
    $("#firstnameEInput").attr("placeholder", studentData.firstnameEn);
    $("#lastnameEInput").attr("placeholder", studentData.lastnameEn);
    $("#gradeInput").val(studentData.grade);
    $("#levelInput").attr("placeholder", studentData.level);
    $("#emailInput").attr("placeholder", studentData.email);
    $("#phoneInput").attr("placeholder", studentData.phone);
    $("#parentPhoneInput").attr("placeholder", studentData.phoneParent);
}

// gen cover template
async function genBarcode() {
    JsBarcode("#mathBarcode", ID + '1', {
        lineColor: "black",
        width: 3.4,
        height: 68,
        displayValue: false
    });
    JsBarcode("#phyBarcode", ID + '2', {
        lineColor: "black",
        width: 3.4,
        height: 68,
        displayValue: false
    });
    JsBarcode("#cheBarcode", ID + '3', {
        lineColor: "black",
        width: 3.4,
        height: 68,
        displayValue: false
    });
    JsBarcode("#engBarcode", ID + '4', {
        lineColor: "black",
        width: 3.4,
        height: 68,
        displayValue: false
    });
}
async function genTableTemplate(hasMath, hasPhy, hasChe, hasEng) {
    let studentData = await studentProfile(ID);
    let src = 'images/TableCover/';
    let state = (studentData.grade > 6) ? 'h' : 'j';
    // if (hasMath && hasPhy) {
    //     $("#tableTemplate").attr("src", "images/mp" + state + ".png");
    // } else if (hasMath) {
    //     $("#tableTemplate").attr("src", "images/m" + state + ".png");
    // } else if (hasPhy) {
    //     $("#tableTemplate").attr("src", "images/p" + state + ".png");
    // } else {
    //     $("#tableTemplate").attr("src", "images/mp" + state + ".png");
    // }
    if (hasMath) {
        src += 'm';
        $("#mathCoverDowload").removeClass("disabled");
    }
    if (hasPhy) {
        src += 'p';
        $("#phyCoverDowload").removeClass("disabled");
    }
    if (hasChe) {
        src += 'c';
        $("#cheCoverDowload").removeClass("disabled");
    }
    if (hasEng) {
        src += 'e';
        $("#engCoverDowload").removeClass("disabled");
    }
    src += state + '.png';
    $("#tableTemplate").attr("src", src);
}

/**
 * gen and download cover
 * @param {number} type 0:math 1:phy 2:chem 3:eng 4:reject 5:finished
 */
async function genCover(type) {
    let str = $("#quarterSelect").val();
    if ((type === 4 || type === 5) && parseInt(str.slice(5)) > 10) {
        if (type === 4) {
            genSmAppRej(1);
        } else {
            genSmAppRej(2);
        }
        return;
    }
    let [profile, timeTable, registedData, allQ] = await Promise.all([
        studentProfile(ID),
        $.post("post/v1/studentTimeTable", { studentID: ID, year: str.slice(0, 4), quarter: str.slice(5) }),
        $.post('/v2/student/getRegistrationQuarter', { studentID: ID }),
        listQuarter('private')
    ]);
    let coverCanvas;
    let barcode;
    switch (type) {
        case 0:
            coverCanvas = document.getElementById('mathCover');
            barcode = document.getElementById('mathBarcode');
            break;
        case 1:
            coverCanvas = document.getElementById('phyCover');
            barcode = document.getElementById('phyBarcode');
            break;
        case 2:
            coverCanvas = document.getElementById('cheCover');
            barcode = document.getElementById('cheBarcode');
            break;
        case 3:
            coverCanvas = document.getElementById('engCover');
            barcode = document.getElementById('engBarcode');
            break;
        default:
            coverCanvas = document.getElementById('mathCover');
            barcode = document.getElementById('mathBarcode');
            break;
    }
    let ctx = coverCanvas.getContext('2d');
    let template = document.getElementById('tableTemplate');
    ctx.drawImage(template, 0, 0, 1654, 1170);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 150px Cordia New";
    ctx.fillText((profile.grade > 6) ? 'S' + (profile.grade - 6) : 'P' + profile.grade, 117, 85);
    let profileImg = document.getElementById('profileImg');
    let picH = 184;
    let picW = profileImg.width * picH / profileImg.height;
    ctx.drawImage(profileImg, 204, 30, picW, picH);
    ctx.font = "bold 80px Cordia New";
    switch (type) {
        case 0:
            ctx.fillText('ID: ' + ID + '1', 1025, 63);
            break;
        case 1:
            ctx.fillText('ID: ' + ID + '2', 1025, 63);
            break;
        case 2:
            ctx.fillText('ID: ' + ID + '3', 1025, 63);
            break;
        case 3:
            ctx.fillText('ID: ' + ID + '4', 1025, 63);
            break;
        default:
            ctx.fillText('ID: ' + ID + '1', 1025, 63);
            break;
    }
    ctx.drawImage(barcode, 900, 115);
    ctx.fillText(profile.firstname + " (" + profile.nickname + ")", 600, 80);
    ctx.fillText(profile.lastname, 600, 170);
    let w = [1289, 1508, 835, 1064];
    let h = [383, 508, 633, 758, 875];
    let mw = [1335, 1416, 1498, 1580];
    let mh = [140, 220, 300, 380, 460];
    ctx.font = "bold 60px Cordia New";
    ctx.fillStyle = "#f442df";
    for (let i in timeTable.course) {
        ctx.fillText("CR: " + timeTable.course[i].courseName, w[dayIndex(timeTable.course[i].day)], h[hourIndex(timeTable.course[i].day)]);
        ctx.fillText((timeTable.course[i].tutorName == "Hybrid" ? "HB" : timeTable.course[i].tutorName), w[dayIndex(timeTable.course[i].day)], h[hourIndex(timeTable.course[i].day)] + 60);
        if (timeTable.course[i].tutorName == "Hybrid") {
            if (type == 0 && timeTable.course[i].courseName.slice(0, 1) == "M") {
                ctx.fillText("CR", mw[dayIndex(timeTable.course[i].day)], mh[hourIndex(timeTable.course[i].day)]);
            } else if (type == 1 && timeTable.course[i].courseName.slice(0, 1) == "P") {
                ctx.fillText("CR", mw[dayIndex(timeTable.course[i].day)], mh[hourIndex(timeTable.course[i].day)]);
            } else if (type == 2 && timeTable.course[i].courseName.slice(0, 1) == "C") {
                ctx.fillText("CR", mw[dayIndex(timeTable.course[i].day)], mh[hourIndex(timeTable.course[i].day)]);
            } else if (type == 3 && timeTable.course[i].courseName.slice(0, 1) == "E") {
                ctx.fillText("CR", mw[dayIndex(timeTable.course[i].day)], mh[hourIndex(timeTable.course[i].day)]);
            }
        }
    }
    for (let i in timeTable.hybrid) {
        ctx.fillStyle = "#242de2";
        ctx.fillText("FHB: " + timeTable.hybrid[i].subject, w[dayIndex(timeTable.hybrid[i].day)], h[hourIndex(timeTable.hybrid[i].day)]);
        ctx.fillText("HB", w[dayIndex(timeTable.hybrid[i].day)], h[hourIndex(timeTable.hybrid[i].day)] + 60);
        ctx.fillStyle = "black";
        if (type == 0 && timeTable.hybrid[i].subject == "M") {
            ctx.fillText("HB", mw[dayIndex(timeTable.hybrid[i].day)], mh[hourIndex(timeTable.hybrid[i].day)]);
        } else if (type == 1 && timeTable.hybrid[i].subject == "P") {
            ctx.fillText("HB", mw[dayIndex(timeTable.hybrid[i].day)], mh[hourIndex(timeTable.hybrid[i].day)]);
        } else if (type == 2 && timeTable.hybrid[i].subject == "C") {
            ctx.fillText("HB", mw[dayIndex(timeTable.hybrid[i].day)], mh[hourIndex(timeTable.hybrid[i].day)]);
        } else if (type == 3 && timeTable.hybrid[i].subject == "E") {
            ctx.fillText("HB", mw[dayIndex(timeTable.hybrid[i].day)], mh[hourIndex(timeTable.hybrid[i].day)]);
        }
    }
    ctx.font = "bold 50px Cordia New";
    ctx.fillStyle = "orange";
    for (let i in timeTable.skill) {
        let time = moment(timeTable.skill[i].day);
        if (timeTable.skill[i].subject == "ME") {
            ctx.fillText("SK: M " + time.format("H:00"), w[dayIndex(timeTable.skill[i].day)], h[hourIndex(timeTable.skill[i].day)]);
            ctx.fillText("SK: E " + time.format("H:30"), w[dayIndex(timeTable.skill[i].day)], h[hourIndex(timeTable.skill[i].day)] + 60);
        } else {
            if (time.hour() == 9 || time.hour() == 11 || time.hour() == 14 || time.hour() == 16) {
                ctx.fillText("SK: " + timeTable.skill[i].subject + " " + time.format("H:mm"), w[dayIndex(timeTable.skill[i].day)], h[hourIndex(timeTable.skill[i].day)] + 70);
            } else {
                ctx.fillText("SK: " + timeTable.skill[i].subject + " " + time.format("H:mm"), w[dayIndex(timeTable.skill[i].day)], h[hourIndex(timeTable.skill[i].day)]);
            }
        }
    }
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    let allRegisteredTemp = _.union(registedData.registration.course, registedData.registration.hybrid);
    let diff = 0;
    let quarterStr = '';
    for (let i in allQ.quarter) {
        let bool = i < allQ.quarter.length - 1;
        if (allRegisteredTemp.indexOf(allQ.quarter[i].quarterID) > -1) {
            if (allQ.quarter[i].quarter < 10) {
                ctx.font = "50px Cordia New";
                ctx.fillText(allQ.quarter[i].name + ((bool) ? ' / ' : ''), 35 + diff, 244);
            } else {
                ctx.font = "bold 50px Cordia New";
                ctx.fillText(allQ.quarter[i].name, 35 + diff, 244);
                ctx.font = "50px Cordia New";
                if (bool) {
                    ctx.fillText(' / ', 185 + diff, 244);
                    diff += 30;
                }
            }
            diff += 145;
        }
    }
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "bold 50px Cordia New";
    if (type == 4 || type == 5) {
        if (type == 4) {
            var appRejCanvas = document.getElementById('appRejCover1');
        } else {
            var appRejCanvas = document.getElementById('appRejCover2');
        }
        let ctx2 = appRejCanvas.getContext('2d');
        let receipt = document.getElementById('recieptImg');
        let picRcW = 1654;
        let picRcH = receipt.height * picRcW / receipt.width;
        ctx2.drawImage(receipt, 0, 0, picRcW, picRcH);
        let appRejTemplate = document.getElementById('mathCover');
        ctx2.globalAlpha = 0.5;
        ctx2.drawImage(appRejTemplate, 0, 0, 1654, 1170);
        ctx2.globalAlpha = 1;
        ctx2.font = "bold 400px Cordia New";
        ctx2.rotate(Math.PI / 6);
        if (type == 4) {
            ctx2.fillStyle = "red";
            ctx2.fillText("REJECT", 350, 200);
        } else if (type == 5) {
            ctx2.fillStyle = "green";
            ctx2.fillText("FINISHED", 350, 200);
        }
        downloadCanvas(type);
    } else {
        downloadCanvas(type);
    }
}
const dayIndex = (day) => {
    switch (moment(day).day()) {
        case 2:
            return 0;
        case 4:
            return 1;
        case 6:
            return 2;
        case 0:
            return 3;
    }
}
const hourIndex = (day) => {
    switch (moment(day).hour()) {
        case 8:
        case 9:
            return 0;
        case 10:
        case 11:
            return 1;
        case 13:
        case 14:
            return 2;
        case 15:
        case 16:
            return 3;
        case 17:
            return 4;
    }
}
async function genSummerCover(type) {
    let str = $("#quarterSelect").val();
    let startT = moment(0);
    startT.date(12).month(2).year(2018).hour(3);
    let endT = moment(0);
    endT.date(30).month(2).year(2018).hour(23);
    let [allQ, timeTable, stdName] = await Promise.all([
        listQuarter("private"),
        $.post("post/v1/studentTimeTable", { studentID: ID, year: str.slice(0, 4), quarter: str.slice(5) }),
        name(ID)
    ]);
    // attend.sort((a, b) => {
    //     return a.date - b.date;
    // });
    let thisQ;
    for (let i in allQ.quarter) {
        if (allQ.quarter[i].year === parseInt(str.slice(0, 4)) && allQ.quarter[i].quarter === parseInt(str.slice(5))) {
            thisQ = allQ.quarter[i]
        }
    }
    let coverCanvas = document.getElementById('smCover');
    let ctx = coverCanvas.getContext('2d');
    let template = document.getElementById('smTableTemplate');
    ctx.drawImage(template, 0, 0, 1241, 880);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 180px Cordia New";
    ctx.fillText(thisQ.name, 340, 88);
    ctx.font = "bold 85px Cordia New";
    if (type === 1) {
        ctx.fillText(ID + "1", 1070, 77);
    } else if (type === 2) {
        ctx.fillText(ID + "2", 1070, 77);
    }
    ctx.font = "bold 60px Cordia New";
    ctx.fillText(stdName.firstname + " (" + stdName.nickname + ")", 980, 172);
    ctx.font = "bold 150px Cordia New";
    let thisCr = timeTable.course;
    let hIndex = { 8: 350, 10: 530, 13: 710 };
    ctx.textAlign = "left";
    for (let i in thisCr) {
        let t = moment(thisCr[i].day);
        ctx.fillText(thisCr[i].courseName + " - " + thisCr[i].tutorName, 370, hIndex[t.hour()]);
    }
    // ctx.textAlign = "center";
    // ctx.font = "bold 65px Cordia New";
    // let temp = moment(0);
    // let index = -1;
    // let initH2 = 696;
    // for (let i in attend) {
    //     let initH = 696;
    //     let initW = { 8: 380, 10: 470, 13: 560 };
    //     if (attend[i].reason === 'SummerAbsent') {
    //         let t = moment(attend[i].date);
    //         if (temp.date() === t.date() && temp.month() === t.month() && temp.year() === t.year()) {
    //             ctx.fillText("✓", initW[t.hour()], initH + 69 * index);
    //         } else {
    //             index += 1;
    //             ctx.fillText(t.date(), 120, initH + 69 * index);
    //             ctx.fillText(t.month() + 1, 200, initH + 69 * index);
    //             ctx.fillText((t.year() + '').slice(2), 280, initH + 69 * index);
    //             ctx.fillText("✓", initW[t.hour()], initH + 69 * index);
    //         }
    //         temp = t;
    //     } else if (attend[i].type === 2) {
    //         let t = moment(attend[i].date);
    //         if (t.hour() === 15) {
    //             ctx.fillText(t.date(), 660, initH2);
    //             ctx.fillText(t.month() + 1, 750, initH2);
    //             ctx.fillText((t.year() + '').slice(2), 840, initH2);
    //             initH2 = initH2 + 69;
    //         }
    //     }
    // }
    if (type === 1) {
        downloadCanvas(6);
    } else if (type === 2) {
        downloadCanvas(7);
    }
}
async function genSmAppRej(type) {
    let str = $("#quarterSelect").val();
    let timeTable = await $.post("post/v1/studentTimeTable", { studentID: ID, year: str.slice(0, 4), quarter: str.slice(5) });
    let smAppRejCanvas = document.getElementById('smAppRejCover');
    let img = document.getElementById('recieptImg');
    smAppRejCanvas.width = img.width;
    smAppRejCanvas.height = img.height;
    let h = img.height;
    let w = img.width;
    let ctx = smAppRejCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    let template = document.getElementById('smReceiptTemplate');
    ctx.globalAlpha = 0.6;
    let templateH = (template.height / template.width) * w;
    ctx.drawImage(template, 0, 0, w, templateH);
    ctx.font = "bold 60px Cordia New";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let hIndex = { 8: 1 * templateH / 5, 10: 1.5 * templateH / 3, 13: 10 * templateH / 13 };
    let thisCr = timeTable.course;
    for (let i in thisCr) {
        let t = moment(thisCr[i].day);
        ctx.fillText(thisCr[i].courseName + " - " + thisCr[i].tutorName, w / 3, hIndex[t.hour()]);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.font = "bold 120px Cordia New";
    ctx.rotate(Math.PI / 6);
    let ray = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2));
    if (type === 1) {
        ctx.fillStyle = "red";
        ctx.fillText("REJECT", ray, 0);
    } else if (type === 2) {
        ctx.fillStyle = "green";
        ctx.fillText("FINISHED", ray, 0);
    }
    downloadCanvas(8);
}
function downloadCanvas(type) {
    let text = ""
    let canvas;
    switch (type) {
        case 0:
            canvas = document.getElementById('mathCover');
            text += ID + "1.png";
            break;
        case 1:
            canvas = document.getElementById('phyCover');
            text += ID + "2.png";
            break;
        case 2:
            canvas = document.getElementById('cheCover');
            text += ID + "3.png";
            break;
        case 3:
            canvas = document.getElementById('engCover');
            text += ID + "4.png";
            break;
        case 4:
            canvas = document.getElementById('appRejCover1');
            text += ID + ".png";
            break;
        case 5:
            canvas = document.getElementById('appRejCover2');
            text += ID + ".png";
            break;
        case 6:
            canvas = document.getElementById('smCover');
            text += ID + "1sm.png";
            break;
        case 7:
            canvas = document.getElementById('smCover');
            text += ID + "2sm.png";
            break;
        case 8:
            canvas = document.getElementById('smAppRejCover');
            text += ID + ".png";
            break;
        default:
            break;
    }
    let dlImg = canvas.toDataURL();
    let aref = document.createElement('a');
    aref.href = dlImg;
    aref.download = text;
    document.body.appendChild(aref);
    aref.click();
}

/**
 * change student status
 * @param {string} status 
 */
function changeStudentStatus(status) {
    if (confirm("ต้องการเปลี่ยน status?")) {
        $.post("post/changeStatus", { userID: ID, status: status }).then(() => {
            log("OK:Change student status complete");
            genStatusPanel(status);
        });
    }
}

/**
 * change student state
 * @param {string} state 
 */
function changeStudentState(state) {
    let str = $("#quarterSelect").val();
    if (confirm("ต้องการเปลี่ยน state?")) {
        if (state == "rejected") {
            genCover(4);
        } else if (state == "finished") {
            genCover(5);
        }
        if ($($("#statusSubButton .btn-success")).html() == "UNREGISTER") {
            changeRegistrationState(ID, state, { year: str.slice(0, 4), quarter: str.slice(5) }).then(() => {
                log("OK:Change student state complete");
                genStatusPanel('active');
            });
        } else {
            $.post("post/v1/updateStudentRegistrationState", { studentID: ID, year: str.slice(0, 4), quarter: str.slice(5), registrationState: state, subRegistrationState: "-" }).then(() => {
                log("OK:Change student state complete");
                genStatusPanel('active');
            });
        }
    }
}

// add chat func
function addNewChat() {
    let reqBody = {};
    if ($("#chatMsg").val().length > 0) {
        reqBody.msg = $("#chatMsg").val();
        reqBody.studentID = ID;
        $.post("post/v1/addChat", reqBody).then(cb => {
            log(cb);
            showChatData();
            $("#chatMsg").val("");
            $("#addChatModal").modal('hide');
        });
    } else {
        alert("Please input some text.");
    }
}

// show chat data
async function showChatData() {
    let reqBody = {};
    reqBody.studentID = ID;
    reqBody.limit = 3;
    let chatData = await $.post("post/v1/listChat", reqBody);
    let cookie = getCookieDict();
    let myID = cookie.monkeyWebUser;
    let chats = chatData.chats;
    $("#chatButt").empty();
    for (let i in chats) {
        if (chats[i].sender._id === parseInt(myID)) {
            $("#chatButt").append("<row><p class='mb-0'><small><span class='fas fa-fw fa-user-secret'></span>&nbsp;me</small></p><button class='btn btn-primary col-10'>" + chats[i].msg + "</button></row>");
        } else {
            $("#chatButt").append("<row><p class='mb-0 float-right'><small>" + chats[i].sender.nicknameEn + "&nbsp;<span class='fas fa-fw fa-user'></span></small>&nbsp;</p><button class='btn btn-secondary col-10 offset-2'>" + chats[i].msg + "</button></row>");
        }
    }
}

// remove timeTable function
function removeCourse(crID) {
    if (confirm("ต้องการลบคอร์สนี้?")) {
        removeStudentCourse(ID, [crID]).then(() => {
            log("finish to remove cr " + crID);
            location.reload();
        })
    }
}
function removeHybrid(hbID) {
    if (confirm("ต้องการลบ FHB นี้?")) {
        removeHybridStudent(ID, hbID).then(() => {
            log("finish to remove fhb " + hbID);
            location.reload();
        })
    }
}
function removeSkill(skID) {
    if (confirm("ต้องการลบ skill นี้?")) {
        log("rm sk" + skID)
        removeSkillStudent(ID, skID).then(() => {
            log("finish to remove skill " + skID);
            location.reload();
        })
    }
}
async function removeAllTimeTable() {
    if (confirm("Are you sure to clear timetable?")) {
        let crPromise = [];
        let fhbPromise = [];
        let skPromise = [];
        if ($(".cr").length > 0) {
            for (let i = 0; i < $(".cr").length; i++) {
                crPromise.push($(".cr")[i].id);
            }
            await removeStudentCourse(ID, crPromise);
        }
        if ($(".hb").length > 0) {
            for (let i = 0; i < $(".hb").length; i++) {
                fhbPromise.push(removeHybridStudent(ID, $(".hb")[i].id));
            }
            await Promise.all(fhbPromise);
        }
        if ($(".sk").length > 0) {
            for (let i = 0; i < $(".sk").length; i++) {
                skPromise.push(removeSkillStudent(ID, $(".sk")[i].id));
            }
            await Promise.all(skPromise);
        }
        log("Finish to delete all data");
        genStudentData();
    }
}

// add timeTable function
async function addTimeTable(idenTime) {
    let str = $("#quarterSelect").val();
    let allSubj = await $.post("post/v1/listSubjectInQuarter", { year: str.slice(0, 4), quarter: str.slice(5) })
    $subjSelect = $("#subjSelect");
    $subjSelect.empty();
    for (let i in allSubj.hybrid) {
        let time = moment(allSubj.hybrid[i].day);
        if (idenTime.indexOf("btn" + time.day() + '' + time.hour()) >= 0) {
            $subjSelect.append("<option value=" + allSubj.hybrid[i].hybridID + ">FHB:M</option>");
            $subjSelect.append("<option value=" + allSubj.hybrid[i].hybridID + ">FHB:P</option>");
            $subjSelect.append("<option value=" + allSubj.hybrid[i].hybridID + ">FHB:C</option>");
            $subjSelect.append("<option value=" + allSubj.hybrid[i].hybridID + ">FHB:E</option>");
        }
    }
    for (let i in allSubj.course) {
        let time = moment(allSubj.course[i].day);
        if (idenTime.indexOf("btn" + time.day() + '' + time.hour()) >= 0) {
            $subjSelect.append("<option value=" + allSubj.course[i].courseID + ">" + allSubj.course[i].courseName + " - " + allSubj.course[i].tutorName + "</option>");
        }
    }
    for (let i in allSubj.skill) {
        let time = moment(allSubj.skill[i].day);
        let time2 = moment(allSubj.skill[i].day);
        if (time2.hour() == 9) time2.hour(8);
        if (time2.hour() == 11) time2.hour(10);
        if (time2.hour() == 14) time2.hour(13);
        if (idenTime.indexOf("btn" + time2.day() + '' + time2.hour()) >= 0) {
            $subjSelect.append("<option value=" + allSubj.skill[i].skillID + ">SKILL:M - " + time.format("HH:mm") + "</option>");
            $subjSelect.append("<option value=" + allSubj.skill[i].skillID + ">SKILL:E - " + time.format("HH:mm") + "</option>");
            $subjSelect.append("<option value=" + allSubj.skill[i].skillID + ">SKILL:ME - " + time.format("HH:mm") + "</option>");
        }
    }
    $("#addSubjModal").modal('show');
}
function addStudentTimeTable() {
    let subjID = $("#subjSelect").val();
    let subjSelectText = $("#subjSelect option:selected").text();
    if (subjSelectText.slice(0, 3) === "FHB") {
        if (confirm("ต้องการเพิ่ม " + subjSelectText)) {
            addHybridStudent(subjID, ID, subjSelectText.slice(4)).then(() => {
                log("finish to add " + subjSelectText);
                location.reload();
            });
        }
    } else if (subjSelectText.slice(0, 3) === "SKI") {
        if (confirm("ต้องการเพิ่ม " + subjSelectText)) {
            addSkillStudent(subjID, ID, subjSelectText.slice(6, subjSelectText.indexOf("-") - 1)).then(() => {
                log("finish to add " + subjSelectText);
                location.reload();
            })
        }
    } else {
        if (confirm("ต้องการเพิ่ม " + subjSelectText)) {
            addStudentCourse(ID, [subjID]).then(() => {
                log("finish to add CR:" + subjSelectText);
                location.reload();
            });
        }
    }
}

// upload image function
function uploadImg(type) {
    let str = $("#quarterSelect").val();
    let imgUrl = '';
    let ufile = $('#file-img');
    let ext = ufile.val().split('.').pop().toLowerCase();
    if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
        alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
    } else {
        let files = ufile.get(0).files;
        let formData = new FormData();
        let file = files[0];
        formData.append('file[]', file, file.name);
        if (type == 0) {
            imgUrl = 'post/updateProfilePicture';
            formData.append('userID', ID);
        } else if (type == 1) {
            imgUrl = 'post/submitReceipt'
            formData.append('studentID', ID);
            formData.append('year', str.slice(0, 4));
            formData.append('quarter', str.slice(5));
        }
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
    }
}

// change student info function
async function changeStudentInfo() {
    let studentInfo = {
        studentID: parseInt(ID)
    }
    if ($("#nicknameInput").val() != "") studentInfo.nickname = $("#nicknameInput").val();
    if ($("#firstnameInput").val() != "") studentInfo.firstname = $("#firstnameInput").val();
    if ($("#lastnameInput").val() != "") studentInfo.lastname = $("#lastnameInput").val();
    if ($("#nicknameEInput").val() != "") studentInfo.nicknameEn = $("#nicknameEInput").val();
    if ($("#firstnameEInput").val() != "") studentInfo.firstnameEn = $("#firstnameEInput").val();
    if ($("#lastnameEInput").val() != "") studentInfo.lastnameEn = $("#lastnameEInput").val();
    studentInfo.grade = parseInt($("#gradeInput").val());
    if ($("#levelInput").val() != "") studentInfo.level = $("#levelInput").val();
    if ($("#emailInput").val() != "") studentInfo.email = $("#emailInput").val();
    if ($("#phoneInput").val() != "") studentInfo.phone = $("#phoneInput").val();
    if ($("#parentPhoneInput").val() != "") studentInfo.phoneParent = $("#parentPhoneInput").val();
    await $.post("post/editStudent", studentInfo)
    log("Complete to change student info");
    location.reload();
}

// gen comment view function
async function genCommentViewBody() {
    $commentContentBody = $("#commentContentBody");
    $commentContentBody.empty();
    let comment = await $.post("post/listStudentCommentByStudent", { studentID: ID });
    if (comment.comment.length == 0) {
        $commentContentBody.append("<h5>No comment</h5>");
    } else {
        let commentPromise = [];
        for (let i in comment.comment) {
            commentPromise.push(name(comment.comment[i].tutorID));
        }
        let tutorComment = await Promise.all(commentPromise);
        for (let i in tutorComment) {
            $commentContentBody.append(
                "<div id=" + comment.comment[i].commentID + ">" +
                "<h5>" +
                "<span class='fas fa-thumbtack' style=" + ((comment.comment[i].priority > 0) ? 'color:red' : 'color:silver') + " onclick=\"editComment(\'1\',\'" + comment.comment[i].commentID + "\',\'" + comment.comment[i].priority + "\');\"></span> " +
                "<span class='fas fa-check-circle' style=" + ((comment.comment[i].isCleared) ? 'color:green' : 'color:silver') + " onclick=\"editComment(\'2\',\'" + comment.comment[i].commentID + "\',\'" + comment.comment[i].isCleared + "\');\"></span> " +
                tutorComment[i].nickname + " (" + moment(comment.comment[i].timestamp).format('DD MMM') + ") " +
                "<span class='fas fa-trash' style='color:red' onclick=\"editComment(\'3\',\'" + comment.comment[i].commentID + "\','');\"></span>" +
                "</h5>" +
                "<p>" + comment.comment[i].message + "</p>" +
                "</div>"
            );
            if (comment.comment[i].hasAttachment) {
                let config = await getConfig();
                let path = config.studentCommentPicturePath.slice(config.receiptPath.search("MonkeyWebData") + 14) + "/" + comment.comment[i].commentID;
                $.get(path + ".jpg").done(() => {
                    $("#" + comment.comment[i].commentID).append(
                        "<img class='img-fluid col-12 col-md-6' src='" + path + ".jpg'>"
                    );
                }).fail(() => {
                    $.get(path + ".png").done(() => {
                        $("#" + comment.comment[i].commentID).append(
                            "<img class='img-fluid col-12 col-md-6' src='" + path + ".png'>"
                        );
                    }).fail(() => {
                        $.get(path + ".jpeg").done(() => {
                            $("#" + comment.comment[i].commentID).append(
                                "<img class='img-fluid col-12 col-md-6' src='" + path + ".jpeg'>"
                            );
                        }).fail(() => {
                            log("can't find picture");
                        });
                    });
                });
            }
        }
    }
}
function editComment(type, commentID, param) {
    switch (type) {
        case "1":
            $.post("post/changeStudentCommentPriority", { commentID: commentID, priority: (param > 0) ? 0 : 1 });
            break;
        case "2":
            $.post("post/clearStudentComment", { commentID: commentID, isCleared: (param == "true") ? false : true });
            break;
        case "3":
            if (confirm("ต้องการลบ comment นี้?")) {
                $.post("post/removeStudentComment", { commentID: commentID });
            }
            break;
        default:
            break;
    }
    genCommentViewBody();
}
$("#absentViewButt").click(function () {
    showStudentAbsentHistory();
});
async function showStudentAbsentHistory() {
    let str = $("#quarterSelect").val();
    let table = $("#absentHistoryTableBody");
    let [config, allQ] = await Promise.all([
        getConfig(),
        listQuarter('private')
    ]);
    let today = moment();
    let startDay;
    let endDay;
    for (let i in allQ.quarter) {
        if (allQ.quarter[i].year === config.defaultQuarter.quarter.year && allQ.quarter[i].quarter === config.defaultQuarter.quarter.quarter) {
            log(allQ.quarter[i]);
            startDay = moment(parseInt(allQ.quarter[i].startDate));
            endDay = moment(parseInt(allQ.quarter[i].endDate));
        }
    }
    let [history, mQuota, pQuota] = await Promise.all([
        $.post('post/v1/listAttendance', { studentStartDate: startDay.valueOf(), studentEndDate: endDay.valueOf(), studentID: ID }),
        $.post('post/v1/getStudentQuota', { studentID: ID, subj: 'M' }),
        $.post('post/v1/getStudentQuota', { studentID: ID, subj: 'P' })
    ]);
    table.empty();
    for (let i in history) {
        let t1 = moment(history[i].date);
        let t2 = moment(history[i].timestamp);
        table.append(
            "<tr class='" + ((history[i].type === 1) ? 'table-danger' : 'table-success') + "'>" +
            "<td class='text-center'>" + t1.format('ddd DD/MM/YY HH:00') + "</td>" +
            "<td class='text-center'>" + ((history[i].courseName === undefined) ? 'FHB:' + ((history[i].type === 1) ? history[i].hybridSubject : history[i].subject) : history[i].courseName) + "</td>" +
            "<td class='text-center'>" + ((history[i].type === 1) ? history[i].reason : "-") + "</td>" +
            "<td class='text-center'>" + t2.format('ddd DD/MM/YY HH:mm') + "</td>" +
            "</tr>"
        )
    }
    $("#absentHistoryMQuota").html((mQuota.totalQuota - mQuota.usedQuota) + "/" + mQuota.totalQuota);
    $("#absentHistoryPQuota").html((pQuota.totalQuota - pQuota.usedQuota) + "/" + pQuota.totalQuota);
    $("#viewAbsentModal").modal('show');
}