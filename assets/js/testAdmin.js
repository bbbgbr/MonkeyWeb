// Navigation control function
const containClass = (element) => {
    if (element.className.indexOf("userNav") > -1) {
        return "user";
    } else if (element.className.indexOf("stdNav") > -1) {
        return "std";
    } else if (element.className.indexOf("crNav") > -1) {
        return "cr";
    } else if (element.className.indexOf("configNav") > -1) {
        return "config";
    } else if (element.className.indexOf("etcNav") > -1) {
        return "etc";
    }
};
$(".myContent").hide();
$(".navigationIcon").hide();
$(".myNav").click(function () {
    $("#navigation").slideUp();
    $(".navigationIcon").slideDown();
    $("." + containClass(this) + "Content").slideDown();
});
$("#globalBack").click(function () {
    $("#navigation").slideDown();
    $(".navigationIcon").slideUp();
    $(".myContent").slideUp();
});

// Content function
initGlobalData();
async function initGlobalData() {
    for (let i = 1; i < 13; i++) {
        let str = (i < 7) ? "P" + i : "S" + (i - 6);
        $(".gradeSelect").append(
            "<option value=" + i + ">" + str + "</option>"
        );
    }
    $(".subjectSelect").append(
        "<option value='M'>Math</option>" +
        "<option value='P'>Physic</option>" +
        "<option value='C'>Chemistry</option>" +
        "<option value='E'>English</option>" +
        "<option value='Sci'>Science</option>"
    );
    let [config, allQuarter, allTutor] = await Promise.all([getConfig(), listQuarter("private"), $.post("post/v1/listTutorJson")]);
    log(config);
    log(allQuarter);
    log(allTutor);
    // Init some data with config
    $("#setDefaultQYearInput").attr("placeholder", config.defaultQuarter.quarter.year);
    $("#setDefaultQQuarterInput").attr("placeholder", config.defaultQuarter.quarter.quarter);
    $("#setSummerQYearInput").attr("placeholder", config.defaultQuarter.summer.year);
    $("#setSummerQQuarterInput").attr("placeholder", config.defaultQuarter.summer.quarter);
    $("#setRegisQYearInput").attr("placeholder", config.defaultQuarter.registration.year);
    $("#setRegisQQuarterInput").attr("placeholder", config.defaultQuarter.registration.quarter);
    $("#allowRegisConfigOption").val((config.allowRegistration) ? "1" : "0");
    $("#configProfilePicPathInput").val(config.profilePicturePath);
    $("#configReceiptPathInput").val(config.receiptPath);
    $("#configSlideShowPathInput").val(config.studentSlideshowPath);
    $("#configStdCommentPathInput").val(config.studentCommentPicturePath);
    $("#configCrMaterialPathInput").val(config.courseMaterialPath);
    $("#configDocPathInput").val(config.documentPath);
    $("#configAttendDocPathInput").val(config.attendanceDocumentPath);
    $("#configCrPrice").val(config.coursePrice);
    $("#configNxtStd").val(config.nextStudentID);
    $("#configNxtTutor").val(config.nextTutorID);
    for (let i in allQuarter.quarter) {
        $(".quarterSelect").prepend(
            "<option value=" + allQuarter.quarter[i].year + "-" + allQuarter.quarter[i].quarter + ">" + allQuarter.quarter[i].name + "</option>"
        );
    }
    for (let i in allTutor.tutors) {
        $(".tutorSelect").append(
            "<option value=" + allTutor.tutors[i].tutorID + ">" + allTutor.tutors[i].nicknameEn + "</option>"
        );
    }
}
// student pane function
const addStudentGrade = () => {
    if ($("#upgradeSizeInput").val()) {
        if (confirm("Are you sure to upgrade all student by " + $("#upgradeSizeInput").val())) {
            $.post("post/addStudentGrade", { toAdd: $("#upgradeSizeInput").val() }).then(cb => {
                log(cb);
                alert("Complete to upgrade all student by " + $("#upgradeSizeInput").val());
            });
        }
    }
};
// course pane function
const listAllCourse = () => {
    let year = $("#allCourseQuarterSelect").val().slice(0, 4);
    let quarter = $("#allCourseQuarterSelect").val().slice(5);
    $.post("post/v1/allCourse", { year: year, quarter: quarter }).then(data => {
        $("#allCourseTableBody").empty();
        for (let i in data) {
            $("#allCourseTableBody").append(
                "<tr>" +
                "<td class='text-center'>" + data[i].courseID + "</td>" +
                "<td class='text-center'>" + data[i].courseName + "</td>" +
                "<td class='text-center'>" + moment(data[i].day).format("ddd H") + "</td>" +
                "<td class='text-center'>" + data[i].grade + "</td>" +
                "<td class='text-center'>" + data[i].room + "</td>" +
                "<td class='text-center'>" + data[i].studentCount + "</td>" +
                "<td class='text-center'>" + data[i].tutorName + "</td>" +
                "</tr>"
            );
        }
    })
};
const listGradeCourse = () => {
    let year = $("#gradeCourseQuarterSelect").val().slice(0, 4);
    let quarter = $("#gradeCourseQuarterSelect").val().slice(5);
    $.post("post/gradeCourse", { year: year, quarter: quarter, grade: $("#gradeCourseGradeSelect").val() }).then(cb => {
        $("#gradeCourseTableBody").empty();
        let data = cb.course;
        for (let i in data) {
            $("#gradeCourseTableBody").append(
                "<tr>" +
                "<td class='text-center'>" + data[i].courseID + "</td>" +
                "<td class='text-center'>" + data[i].courseName + "</td>" +
                "<td class='text-center'>" + moment(data[i].day).format("ddd H") + "</td>" +
                "<td class='text-center'>" + data[i].description + "</td>" +
                "<td class='text-center'>" + data[i].tutor + "</td>" +
                "</tr>"
            );
        }
    });
};
$("#crInfoQuarterSelect").change(function () {
    if (this.value !== "0") {
        $.post("post/v1/allCourse", { year: this.value.slice(0, 4), quarter: this.value.slice(5) }).then(data => {
            $("#crInfoCourseSelect").empty();
            for (let i in data) {
                $("#crInfoCourseSelect").append(
                    "<option value=" + data[i].courseID + ">" + data[i].courseName + "-" + data[i].tutorName + "</option>"
                );
            }
        });
    }
});
$("#crInfoCourseSelect").change(function () {
    if (this.value !== 0) {
        $.post("post/courseInfo", { courseID: this.value }).then(cb => {
            $("#crInfoOutput").empty();
            $("#crInfoOutput").append(
                "<p class='mb-1 mt-3'>Course name: " + cb.courseName + "</p>" +
                "<p class='mb-1'>Day: " + moment(cb.day).format("ddd H") + "</p>" +
                "<p class='mb-1'>Description: " + cb.description + "</p>" +
                "<p class='mb-1'>Level: " + cb.level + "</p>" +
                "<p class='mb-1'>Room: " + cb.room + "</p>" +
                "<p class='mb-1'>Student: " + cb.student + "</p>" +
                "<p class='mb-1'>Tutor: " + cb.tutor + "</p>"
            );
        });
    }
});
const addNewCourse = () => {
    if ($(".addCourseCheck:checked").length <= 0) {
        alert("Please select at least 1 grade!");
    } else if ($("#addCourseLevel").val().length <= 0) {
        alert("Please input course level!");
    } else {
        let year = $("#addCourseQuarterSelect").val().slice(0, 4);
        let quarter = $("#addCourseQuarterSelect").val().slice(5);
        let subj = $("#addCourseSubjectSelect").val();
        let grade = $(".addCourseCheck:checked").map(function () {
            return this.value;
        }).get();
        let level = $("#addCourseLevel").val();
        let day = $("#addCourseDaySelect").val();
        let tutor = $("#addCourseTutorSelect").val();
        let room = $("#addCourseRoomSelect").val();
        let description = $("#addCourseDescription").val();
        $.post("post/addCourse", {
            year: year,
            quarter: quarter,
            subject: subj,
            grade: grade,
            level: level,
            day: day,
            tutor: [tutor],
            description: description,
            room: room
        }).then(cb => {
            log("OK => " + cb);
            alert("Complete to add course.");
        });
    }
};
var container = document.getElementById('container');
var isTimerRunning = false;
var i = 0;
container.onclick = () => {
    i++;
    if (i === 5) {
        window.location = "/dev";
    }
    if (!isTimerRunning) {
        setTimeout(() => {
            i = 0;
            isTimerRunning = false;
        }, 1000);
    }
}
$("#editCourseQuarterSelect").change(function () {
    if (this.value !== "0") {
        let year = this.value.slice(0, 4);
        let quarter = this.value.slice(5);
        $.post("post/v1/allCourse", { year: year, quarter: quarter }).then(cb => {
            $("#editCourseSelect").empty();
            $("#editCourseSelect").append("<option value=0>Select Course</option>");
            for (let i in cb) {
                $("#editCourseSelect").append(
                    "<option value=" + cb[i].courseID + ">" + cb[i].courseName + " - " + cb[i].tutorName +
                    " (" + moment(cb[i].day).format("ddd H" + ")") + "</option>"
                );
            }
        });
    }
});
$("#editCourseSelect").change(function () {
    if (this.value !== "0") {
        let year = $("#editCourseQuarterSelect").val().slice(0, 4);
        let quarter = $("#editCourseQuarterSelect").val().slice(5);
        $.post("post/courseInfo", { year: year, quarter: quarter, courseID: this.value }).then(cb => {
            if (cb.courseName.slice(0, 1) === "S") {
                $("#editCourseSubjectSelect").val(cb.courseName.slice(0, 3));
            } else {
                $("#editCourseSubjectSelect").val(cb.courseName.slice(0, 1));
            }
            $(".editCourseCheck").prop('checked', false);
            for (let i in cb.grade) {
                $(".editCourseCheck:eq(" + (cb.grade[i] - 1) + ")").prop('checked', true);
            }
            $("#editCourseLevel").val(cb.courseName.slice(-1));
            $("#editCourseDaySelect").val(cb.day);
            $("#editCourseTutorSelect").val(cb.tutor[0]);
            $("#editCourseRoomSelect").val(cb.room);
            $("#editCourseDescription").val(cb.description);
        });
    }
});
const editCourse = () => {
    if ($(".editCourseCheck:checked").length <= 0) {
        alert("Please select at least 1 grade!");
    } else if (confirm("Are you sure to edit this course?")) {
        let courseID = $("#editCourseSelect").val();
        let subj = $("#editCourseSubjectSelect").val();
        let grade = $(".editCourseCheck:checked").map(function () {
            return this.value;
        }).get();
        let level = $("#editCourseLevel").val();
        let day = $("#editCourseDaySelect").val();
        let tutor = $("#editCourseTutorSelect").val();
        let room = $("#editCourseRoomSelect").val();
        let description = $("#editCourseDescription").val();
        $.post("post/editCourse", {
            courseID: courseID,
            subject: subj,
            grade: grade,
            level: level,
            day: day,
            tutor: [tutor],
            description: description,
            room: room
        }).then(cb => {
            log("OK => " + cb);
            alert("Complete to edit course.");
        });
    }
};
$("#removeCourseQuarterSelect").change(function () {
    if (this.value !== "0") {
        let year = this.value.slice(0, 4);
        let quarter = this.value.slice(5);
        $.post("post/v1/allCourse", { year: year, quarter: quarter }).then(cb => {
            $("#removeCourseSelect").empty();
            for (let i in cb) {
                $("#removeCourseSelect").append(
                    "<option value=" + cb[i].courseID + ">" + cb[i].courseName + " - " + cb[i].tutorName +
                    " (" + moment(cb[i].day).format("ddd H" + ")") + "</option>"
                );
            }
        });
    }
});
const removeCourse = () => {
    if ($("#removeCourseSelect").val() !== "0") {
        if (confirm("Are you sure to delete " + $("#removeCourseSelect").val())) {
            $.post("post/removeCourse", { courseID: $("#removeCourseSelect").val() }).then(cb => {
                log("OK => " + cb);
                alert("Complete to remove course.");
            });
        }
    }
};
$("#addCourseSuggestQuarterSelect").change(function () {
    if (this.value !== "0") {
        let year = this.value.slice(0, 4);
        let quarter = this.value.slice(5);
        $.post("post/v1/allCourse", { year: year, quarter: quarter }).then(cb => {
            $("#addCourseSuggestSelect").empty();
            for (let i in cb) {
                $("#addCourseSuggestSelect").append(
                    "<option value=" + cb[i].courseID + ">" + cb[i].courseName + " - " + cb[i].tutorName +
                    " (" + moment(cb[i].day).format("ddd H" + ")") + "</option>"
                );
            }
        });
    }
});
const addCourseSuggest = () => {
    if ($("#addCourseSuggestQuarterSelect").val() === "0" ||
        $("#addCourseSuggestSelect").val() === "0" ||
        $("#addCourseSuggestGradeSelect").val() === "0" ||
        $("#addCourseSuggestLevelInput").val().length <= 0) {
        alert("Incorrect input, please check again.");
    } else {
        let year = $("#addCourseSuggestQuarterSelect").val().slice(0, 4);
        let quarter = $("#addCourseSuggestQuarterSelect").val().slice(5);
        $.post("post/addCourseSuggestion", {
            year: year,
            quarter: quarter,
            grade: $("#addCourseSuggestGradeSelect").val(),
            level: $("#addCourseSuggestLevelInput").val(),
            courseID: [$("#addCourseSuggestSelect").val()]
        }).then(cb => {
            log("OK " + cb);
            alert("Cpmplete to add course suggestion.");
        });
    }
};
$("#removeCourseSuggestQuarterSelect").change(function () {
    if (this.value !== "0") {
        let year = this.value.slice(0, 4);
        let quarter = this.value.slice(5);
        $.post("post/v1/allCourse", { year: year, quarter: quarter }).then(cb => {
            $("#removeCourseSuggestSelect").empty();
            for (let i in cb) {
                $("#removeCourseSuggestSelect").append(
                    "<option value=" + cb[i].courseID + ">" + cb[i].courseName + " - " + cb[i].tutorName +
                    " (" + moment(cb[i].day).format("ddd H" + ")") + "</option>"
                );
            }
        });
    }
});
const removeCourseSuggest = () => {
    if ($("#removeCourseSuggestQuarterSelect").val() === "0" ||
        $("#removeCourseSuggestSelect").val() === "0" ||
        $("#removeCourseSuggestGradeSelect").val() === "0" ||
        $("#removeCourseSuggestLevelInput").val().length <= 0) {
        alert("Incorrect input, please check again.");
    } else {
        let year = $("#removeCourseSuggestQuarterSelect").val().slice(0, 4);
        let quarter = $("#removeCourseSuggestQuarterSelect").val().slice(5);
        $.post("post/removeCourseSuggestion", {
            year: year,
            quarter: quarter,
            grade: $("#removeCourseSuggestGradeSelect").val(),
            level: $("#removeCourseSuggestLevelInput").val(),
            courseID: [$("#removeCourseSuggestSelect").val()]
        }).then(cb => {
            log("OK " + cb);
            alert("Cpmplete to remove course suggestion.");
        });
    }
};
const listCourseSuggest = () => {
    if ($("#listCourseSuggestQuarterSelect").val() === "0" || $("#listCourseSuggestGradeSelect").val() === "0") {
        alert("Please select quarter & grade.");
    } else {
        let year = $("#listCourseSuggestQuarterSelect").val().slice(0, 4);
        let quarter = $("#listCourseSuggestQuarterSelect").val().slice(5);
        $.post("post/listCourseSuggestion", {
            year: year,
            quarter: quarter,
            grade: $("#listCourseSuggestGradeSelect").val()
        }).then(cb => {
            let data = cb.course;
            $("#listCourseSuggestTable").empty();
            $("#listCourseSuggestTable").append(
                "<thead><tr></tr></thead>" +
                "<tbody><tr></tr></tbody>"
            );
            let promise = [];
            for (let i in data) {
                for (let j in data[i].courseID) {
                    promise.push(courseInfo(data[i].courseID[j]));
                }
            }
            Promise.all(promise).then(cb2 => {
                for (let i in data) {
                    $("#listCourseSuggestTable thead tr").append(
                        "<th class='text-center'>" + data[i].level + "</th>"
                    );
                    $("#listCourseSuggestTable tbody tr").append(
                        "<td class='text-center' id='listCourseSuggestTableBody" + i + "'></td>"
                    );
                    for (let j in data[i].courseID) {
                        $("#listCourseSuggestTableBody" + i).html(
                            $("#listCourseSuggestTableBody" + i).html() + cb2[j].courseName + "<BR>"
                        );
                    }
                }
            });
        });
    }
};
// config pane function
const listAllQuarter = () => {
    listQuarter("private").then(cb => {
        let data = cb.quarter;
        $("#allQuarterTableBody").empty();
        for (let i in data) {
            $("#allQuarterTableBody").append(
                "<tr>" +
                "<td class='text-center'>" + data[i].quarterID + "</td>" +
                "<td class='text-center'>" + data[i].name + "</td>" +
                "<td class='text-center'>" + data[i].year + "</td>" +
                "<td class='text-center'>" + data[i].quarter + "</td>" +
                "<td class='text-center'>" + data[i].maxSeat + "</td>" +
                "<td class='text-center'>" + data[i].week + "</td>" +
                "<td class='text-center'>" + data[i].status + "</td>" +
                "</tr>"
            );
        }
    });
};
const addNewQuarter = () => {
    if ($("#addQuarterYearInput").val().length <= 0) {
        alert("Please input year.");
    } else if ($("#addQuarterQuarterInput").val().length <= 0) {
        alert("Please input quarter.");
    } else if ($("#addQuarterNameInput").val().length <= 0) {
        alert("Please input name.");
    } else {
        $.post("post/addQuarter", {
            year: $("#addQuarterYearInput").val(),
            quarter: $("#addQuarterQuarterInput").val(),
            name: $("#addQuarterNameInput").val(),
            status: "public"
        }).then(cb => {
            log("OK " + cb);
            alert("Complete to add quarter.");
        });
    }
};
const setDefaultQuarter = () => {
    let reqBody = {};
    if ($("#setDefaultQYearInput").val().length > 0 && $("#setDefaultQQuarterInput").val().length > 0) {
        reqBody.quarter = { year: $("#setDefaultQYearInput").val(), quarter: $("#setDefaultQQuarterInput").val() };
    }
    if ($("#setSummerQYearInput").val().length > 0 && $("#setSummerQQuarterInput").val().length > 0) {
        reqBody.summer = { year: $("#setSummerQYearInput").val(), quarter: $("#setSummerQQuarterInput").val() };
    }
    if ($("#setRegisQYearInput").val().length > 0 && $("#setRegisQQuarterInput").val().length > 0) {
        reqBody.registration = { year: $("#setRegisQYearInput").val(), quarter: $("#setRegisQQuarterInput").val() };
    }
    $.post("post/v1/editDefaultQuarter", reqBody).then(cb => {
        log(cb);
        alert("Complete to edit config.");
    });
};
const editDBConfig = () => {
    let reqBody = {};
    reqBody.allowRegistration = ($("#allowRegisConfigOption").val() === "0" ? false : true);
    reqBody.profilePicturePath = $("#configProfilePicPathInput").val();
    reqBody.receiptPath = $("#configReceiptPathInput").val();
    reqBody.studentSlideshowPath = $("#configSlideShowPathInput").val();
    reqBody.studentCommentPicturePath = $("#configStdCommentPathInput").val();
    reqBody.courseMaterialPath = $("#configCrMaterialPathInput").val();
    reqBody.documentPath = $("#configDocPathInput").val();
    reqBody.attendanceDocumentPath = $("#configAttendDocPathInput").val();
    reqBody.coursePrice = $("#configCrPrice").val();
    reqBody.nextStudentID = $("#configNxtStd").val();
    reqBody.nextTutorID = $("#configNxtTutor").val();
    $.post("post/v1/editConfig", reqBody).then(cb => {
        log(cb);
        alert("Complete to edit config.");
    });
};