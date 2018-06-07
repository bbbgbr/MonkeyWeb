const getDateFullName = (date) => {
    let dateName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dateName[date];
};

let crCookie = getCookieDict().monkeyWebAdminAllcourseSelectedCourseID;
if (crCookie === undefined) {
    self.location = "/adminAllCourse";
} else {
    courseInfo(crCookie).then(crInfo => {
        $("#courseName").html(crInfo.courseName);
        name(crInfo.tutor[0]).then(name => {
            let str = "Tutor : " + name.nicknameEn + " (" + name.firstnameEn + ")";
            $("#tutorName").html(str);
        });
        let time = moment(crInfo.day);
        $("#day").html("Day: " + getDateFullName(time.day()));
        $("#time").html(time.hour() + ":00 - " + (time.hour() + 2) + ":00");
        $("#crDescription").html(crInfo.description);
        $("#courseID").html("CrID: " + crCookie);
        let promise = [];
        for (let i in crInfo.student) {
            promise.push($.post("post/studentProfile", { studentID: crInfo.student[i] }));
        }
        Promise.all(promise).then(stdName => {
            let index = 1;
            for (let i in stdName) {
                let grade = stdName[i].grade > 6 ? 'S' + (stdName[i].grade - 6) : 'P' + stdName[i].grade;
                if (stdName[i].status == "active") {
                    $("#allStudentInCourseTable").append(
                        "<tr class='std-row' id='" + crInfo.student[i] + "'>" +
                        "<td class='text-center'>" + index + "</td>" +
                        "<td class='text-center'>" + crInfo.student[i] + "</td>" +
                        "<td class='text-center'>" + grade + "</td>" +
                        "<td class='text-center'>" + stdName[i].nickname + "</td>" +
                        "<td class='text-center'>" + stdName[i].firstname + "</td>" +
                        "<td class='text-center'>" + stdName[i].lastname + "</td>" +
                        "</tr>"
                    )
                    index += 1;
                }
            }
        });
        $("#levelInput").attr("placeholder", crInfo.level);
        $("#desInput").attr("placeholder", crInfo.description);
        $("#dayInput").val(crInfo.day);
        $("#roomInput").val(crInfo.room);
        genTutorOption(crInfo.tutor[0]);
    });
}
$("#allStudentInCourseTable").on("click", ".std-row", function () {
    writeCookie("monkeyWebAdminAllstudentSelectedUser", this.id);
    self.location = "/adminStudentprofile";
})

// add event when click on cr name
$("#courseName").click(function () {
    $("#changeCrInfoModal").modal('show');
});
$("#changeCrInfoButt").click(function () {
    sendEditProfile()
});

// gen tutor option func
async function genTutorOption(tutorID) {
    let allUser = await $.post("debug/listUser");
    allUser.sort(function (a, b) {
        return a._id - b._id;
    });
    for (let i in allUser) {
        let str = allUser[i]._id + "";
        if (str.indexOf("990") >= 0) {
            $("#tutorInput").append(
                "<option value=" + allUser[i]._id + ">" + allUser[i]._id + " - " + allUser[i].nicknameEn + "</option>"
            );
        }
    }
    $("#tutorInput").val(tutorID);
}

// send edit profile function
async function sendEditProfile() {
    let editData = { courseID: crCookie };
    if ($("#levelInput").val() != "") {
        editData.level = $("#levelInput").val();
    }
    if ($("#desInput").val() != "") {
        editData.description = $("#desInput").val();
    }
    editData.day = $("#dayInput").val();
    editData.tutor = [$("#tutorInput").val()];
    editData.room = $("#roomInput").val();
    log(editData);
    await $.post("post/editCourse", editData);
    location.reload();
}