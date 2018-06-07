$(document).ready(function () {
    // fix touch on iphone
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) {
        e.stopPropagation();
    });
    // for add student to search box
    var student = [];
    $.post("post/allStudent").then((data) => {
        for (let i = 0; i < data.student.length; i++) {
            if (data.student[i].status === "active") {
                student.push(data.student[i].nickname + " " + data.student[i].firstname + "(" + data.student[i].studentID + ")");
            }
        }
        $('.typeahead').typeahead({
            source: student,
        });
    });
    // for post comment
    $("#uploadButton").click(function () {
        $("#uploadModal").modal();
    });
    $("#postButton").click(function () {
        let comm = $('.typeahead').typeahead("getActive");
        let ufile = $('#file-1');
        let ext = ufile.val().split('.').pop().toLowerCase();
        if (comm !== undefined) {
            if (comm.length > 7) {
                let formData = new FormData();
                formData.append("studentID", comm.slice(-6, -1));
                formData.append("tutorID", tutor);
                formData.append("message", $('#comment').val());
                log(ext);
                if (ext === "") {
                    log("No Picture");
                    $.ajax({
                        url: 'post/addStudentComment',
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            location.reload();
                        }
                    });
                } else if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
                    alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
                } else {
                    let files = ufile.get(0).files;
                    if (files.length > 0) {
                        for (let i = 0; i < files.length; i++) {
                            let file = files[i];
                            formData.append('attachment', file, file.name);
                        }
                        $.ajax({
                            url: 'post/addStudentComment',
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
            } else alert("Please Select Correct Name")
        } else alert("Please Input Student Name");
    });
    // for show comment when load page
    let cookie = getCookieDict();
    let tutor = cookie.monkeyWebUser;
    let pos;
    writeCookie('commIndex', 0);
    cookie = getCookieDict();
    genPagination(1);
    $.post("post/position", { userID: tutor }).then((data) => {
        pos = data.position;
        writeCookie('pos', pos);
        showComment(pos, parseInt(cookie.commIndex));
    })
});
// for show comment
function showComment(pos, commIndex) {
    writeCookie('commIndex', commIndex);
    $.post('post/listStudentCommentByIndex', { start: commIndex, limit: 20 }).then((cm) => {
        // chk error on pagination overflow
        genPagination(commIndex / 20 + 1);
        $('#commentList').empty();
        // hide next button on last page
        if (cm.comment.length < 20) {
            $(".next").addClass("disabled");
        } else if (cm.comment.length === 20) {
            $.post('post/listStudentCommentByIndex', { start: commIndex + 20, limit: 1 }).then((ckcm) => {
                (ckcm.comment.length === 0) ? $(".next").addClass("disabled") : $(".next").removeClass("disabled");
            })
        } else $(".next").removeClass("disabled");
        // hide previous button on 1st page
        if (parseInt(commIndex) === 0) {
            $(".previous").addClass("disabled");
        } else $(".previous").removeClass("disabled");
        if (cm.comment.length === 0) {
            showComment(pos, commIndex - 20);
        }
        (pos !== "tutor") ? getNameAdmin(cm, 0) : getName(cm, 0);
    })
}
// tutor showComment method
function getName(cm, i) {
    // get tutor name
    $.post('post/name', { userID: cm.comment[i].tutorID }).then((tname) => {
        // get student name
        $.post('post/name', { userID: cm.comment[i].studentID }).then((sname) => {
            let day = moment(cm.comment[i].timestamp, "x").format("DD MMM");
            let str = "<h6>"
                + "<span class='fas fa-fw fa-thumbtack'" + (cm.comment[i].priority > 0 ? "style='color:red'" : "style='color:silver'") + "></span>"
                + "<span class='fas fa-fw fa-check-circle'" + (cm.comment[i].isCleared ? "style='color:green'" : "style='color:silver'") + "></span>"
                + tname.nickname + " -> " + sname.nickname + " " + sname.firstname + " (" + day + ") "
                + "</h6>"
            $('#commentList').append(str);
            $('#commentList').append("<p>" + cm.comment[i].message + "</p>");
            if (cm.comment[i].hasAttachment) {
                $.post('post/getConfig').then((config) => {
                    let path = config.studentCommentPicturePath;
                    path = path.slice(path.search("MonkeyWebData") + 14) + cm.comment[i].commentID;
                    $.get(path + ".jpg").done(function (result) {
                        $('#commentList').append("<div class='row'><div class='col-xl-4 col-10'><img src='" + path + ".jpg" + "' class='img-fluid rounded mb-3'></div></div>");
                        if (i < cm.comment.length - 1) getName(cm, i + 1);
                    }).fail(function () {
                        $.get(path + ".jpeg").done(function (result) {
                            $('#commentList').append("<div class='row'><div class='col-xl-4 col-10'><img src='" + path + ".jpeg" + "' class='img-fluid rounded mb-3'></div></div>");
                            if (i < cm.comment.length - 1) getName(cm, i + 1);
                        }).fail(function () {
                            $.get(path + ".png").done(function (result) {
                                $('#commentList').append("<div class='row'><div class='col-xl-4 col-10'><img src='" + path + ".png" + "' class='img-fluid rounded mb-3'></div></div>");
                                if (i < cm.comment.length - 1) getName(cm, i + 1);
                            }).fail(function () {
                                if (i < cm.comment.length - 1) getName(cm, i + 1);
                            });
                        });
                    });
                })
            }
            else if (i < cm.comment.length - 1) getName(cm, i + 1)
        })
    })
}
// admin showComment method
function getNameAdmin(cm, i) {
    //get tutor name
    $.post('post/name', { userID: cm.comment[i].tutorID }).then((tname) => {
        // get student name
        $.post('post/name', { userID: cm.comment[i].studentID }).then((sname) => {
            let day = moment(cm.comment[i].timestamp, "x").format("DD MMM");
            let str = "<h6>"
                + "<span class='fas fa-fw fa-thumbtack'" + (cm.comment[i].priority > 0 ? "style='color:red'" : "style='color:silver'") + "onClick='pin(\"" + cm.comment[i].commentID + "\"," + (cm.comment[i].priority > 0 ? 0 : 1) + ");'></span>"
                + "<span class='fas fa-fw fa-check-circle'" + (cm.comment[i].isCleared ? "style='color:green'" : "style='color:silver'") + "onClick='clearComm(\"" + cm.comment[i].commentID + "\"," + (cm.comment[i].isCleared ? 0 : 1) + ");'></span>"
                + tname.nickname + " -> " + sname.nickname + " " + sname.firstname + " (" + day + ") "
                + "<span class='fas fa-fw fa-trash' style='color:red' onClick='rmComm(\"" + cm.comment[i].commentID + "\");'></span>"
                + "</h6>"
            $('#commentList').append(str);
            $('#commentList').append("<p>" + cm.comment[i].message + "</p>");
            if (cm.comment[i].hasAttachment) {
                $.post('post/getConfig').then((config) => {
                    let path = config.studentCommentPicturePath;
                    path = path.slice(path.search("MonkeyWebData") + 14) + cm.comment[i].commentID;
                    $.get(path + ".jpg").done(function (result) {
                        $('#commentList').append("<div class='row'><div class='col-xl-4 col-10'><img src='" + path + ".jpg" + "' class='img-fluid rounded mb-3'></div></div>");
                        if (i < cm.comment.length - 1) getNameAdmin(cm, i + 1)
                    }).fail(function () {
                        $.get(path + ".jpeg").done(function (result) {
                            $('#commentList').append("<div class='row'><div class='col-xl-4 col-10'><img src='" + path + ".jpeg" + "' class='img-fluid rounded mb-3'></div></div>");
                            if (i < cm.comment.length - 1) getNameAdmin(cm, i + 1)
                        }).fail(function () {
                            $.get(path + ".png").done(function (result) {
                                $('#commentList').append("<div class='row'><div class='col-xl-4 col-10'><img src='" + path + ".png" + "' class='img-fluid rounded mb-3'></div></div>");
                                if (i < cm.comment.length - 1) getNameAdmin(cm, i + 1)
                            }).fail(function () {
                                if (i < cm.comment.length - 1) getNameAdmin(cm, i + 1)
                            });
                        });
                    });
                })
            }
            else if (i < cm.comment.length - 1) getNameAdmin(cm, i + 1)
        })
    })
}
// for clear/unclear comment
function clearComm(commID, val) {
    let cookie = getCookieDict();
    let pos = cookie.pos;
    log(commID + "," + val)
    $.post('post/clearStudentComment', { commentID: commID, isCleared: val }).then((data) => {
        showComment(pos, parseInt(cookie.commIndex));
    })
}
// for pin/unpin comment
function pin(commID, val) {
    let cookie = getCookieDict();
    let pos = cookie.pos;
    $.post('post/changeStudentCommentPriority', { commentID: commID, priority: val }).then((data) => {
        showComment(pos, parseInt(cookie.commIndex));
    })
}
// for remove comment
function rmComm(commID) {
    let cookie = getCookieDict();
    let pos = cookie.pos;
    if (confirm("ต้องการลบ comment นี้") === true) {
        $.post('post/removeStudentComment', { commentID: commID }).then((data) => {
            showComment(pos, parseInt(cookie.commIndex));
        })
    }
}
// for gen pagination
function genPagination(start) {
    $(".pagination").empty();
    let cookie = getCookieDict();
    let pos = cookie.pos;
    $(".pagination").append("<li class='page-item previous'><a class='page-link' onClick='commFirst()'>First</a></li>")
    $(".pagination").append("<li class='page-item previous'><a class='page-link' onClick='commPosition(0)'>Previous</a></li>")
    if (start <= 3) {
        for (let i = 1; i < 6; i++) {
            $(".pagination").append("<li class='page-item' id='page" + i + "'><a class='page-link' onClick=\"showComment('" + pos + "'," + ((i - 1) * 20) + ")\">" + i + "</a></li>");
        }
    } else {
        for (let i = start - 2; i < start + 3; i++) {
            $(".pagination").append("<li class='page-item' id='page" + i + "'><a class='page-link' onClick=\"showComment('" + pos + "'," + ((i - 1) * 20) + ")\">" + i + "</a></li>");
        }
    }
    $(".pagination").append("<li class='page-item next'><a class='page-link' onClick='commPosition(1)'>Next</a></li>")
    $(".pagination").append("<li class='page-item next'><a class='page-link' onClick='commLast()'>Last</a></li>")
    $("#page" + start).addClass("active");
}
// for first button
function commFirst() {
    let cookie = getCookieDict();
    let pos = cookie.pos;
    showComment(pos, 0);
}
// for last button
function commLast() {
    alert("This function can't use now")
}
// for next and previous button
function commPosition(type) {
    let cookie = getCookieDict();
    let commIndex;
    if (type > 0) {
        commIndex = parseInt(cookie.commIndex) + 20;
        // writeCookie('commIndex', commIndex);
    } else {
        commIndex = parseInt(cookie.commIndex) - 20;
        // writeCookie('commIndex', commIndex);
    }
    let pos = cookie.pos;
    showComment(pos, commIndex);
}