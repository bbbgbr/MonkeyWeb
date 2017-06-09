var availableCourse;
var pricepercourse = 6000;
$(document).ready(function () {
    var cookie = getCookieDict();
    if (cookie.regisCourse !== undefined) {
        deleteCookie("regisCourse")
    }
    if (typeof(cookie.name) !== 'string') {
        self.location = "registrationName"
    }
    cookie.name = JSON.parse(cookie.name);
    $('#nname').html(decodeURIComponent(cookie.name.nname));
    $('#name').html(decodeURIComponent(cookie.name.name));
    $('#sname').html(decodeURIComponent(cookie.name.sname));
    $('#grade').val(cookie.grade);
    if (parseInt($('#grade').val()) >= 10) {
        $('#info1,#info3').hide()
    }
    else {
        $('#info2,#info4').hide()
    }
    genTable();
    document.getElementById('show_price').innerHTML = 0;
    availableCourse = {
        sat81: false,
        sat82: false,
        sat101: false,
        sat102: false,
        sat131: false,
        sat132: false,
        sat151: false,
        sat152: false,
        sun81: false,
        sun82: false,
        sun101: false,
        sun102: false,
        sun131: false,
        sun132: false,
        sun151: false,
        sun152: false
    };
    var grade = $('#grade').val();
    if (grade !== "0") {
        //add SAT for high school student
        if (parseInt(grade) >= 10) {
            $.post("post/gradeCourse", {grade: 13}, function (arrayCourse) {
                updateAvaiCr(arrayCourse)
            });
        }
        $.post("post/gradeCourse", {grade: parseInt(grade)}, function (arrayCourse) {
            updateAvaiCr(arrayCourse);
            updateTable(availableCourse);
        });
    }
});
function updateAvaiCr(arrayCourse) {
    for (let i = 0; i < arrayCourse.course.length; i++) {
        arrayCourse.course[i].day = new Date(arrayCourse.course[i].day);
        if (arrayCourse.course[i].day.getDay() === 6) {
            if (arrayCourse.course[i].day.getHours() === 8) {
                if (availableCourse.sat81 === false) {
                    availableCourse.sat81 = arrayCourse.course[i]
                }
                else if (availableCourse.sat82 === false) {
                    availableCourse.sat82 = arrayCourse.course[i]
                }
            }
            if (arrayCourse.course[i].day.getHours() === 10) {
                if (availableCourse.sat101 === false) {
                    availableCourse.sat101 = arrayCourse.course[i]
                }
                else if (availableCourse.sat102 === false) {
                    availableCourse.sat102 = arrayCourse.course[i]
                }
            }
            if (arrayCourse.course[i].day.getHours() === 13) {
                if (availableCourse.sat131 === false) {
                    availableCourse.sat131 = arrayCourse.course[i]
                }
                else if (availableCourse.sat132 === false) {
                    availableCourse.sat132 = arrayCourse.course[i]
                }
            }
            if (arrayCourse.course[i].day.getHours() === 15) {
                if (availableCourse.sat151 === false) {
                    availableCourse.sat151 = arrayCourse.course[i]
                }
                else if (availableCourse.sat152 === false) {
                    availableCourse.sat152 = arrayCourse.course[i]
                }
            }
        }
        if (arrayCourse.course[i].day.getDay() === 0) {
            if (arrayCourse.course[i].day.getHours() === 8) {
                if (availableCourse.sun81 === false) {
                    availableCourse.sun81 = arrayCourse.course[i]
                }
                else if (availableCourse.sun82 === false) {
                    availableCourse.sun82 = arrayCourse.course[i]
                }
            }
            if (arrayCourse.course[i].day.getHours() === 10) {
                if (availableCourse.sun101 === false) {
                    availableCourse.sun101 = arrayCourse.course[i]
                }
                else if (availableCourse.sun102 === false) {
                    availableCourse.sun102 = arrayCourse.course[i]
                }
            }
            if (arrayCourse.course[i].day.getHours() === 13) {
                if (availableCourse.sun131 === false) {
                    availableCourse.sun131 = arrayCourse.course[i]
                }
                else if (availableCourse.sun132 === false) {
                    availableCourse.sun132 = arrayCourse.course[i]
                }
            }
            if (arrayCourse.course[i].day.getHours() === 15) {
                if (availableCourse.sun151 === false) {
                    availableCourse.sun151 = arrayCourse.course[i]
                }
                else if (availableCourse.sun152 === false) {
                    availableCourse.sun152 = arrayCourse.course[i]
                }
            }
        }
    }
}
function updateTable(course) { /* update table after gen to change from blank to recieved data */
    for (let i in course) {
        if (course[i] !== false) {
            var temp = document.getElementsByClassName("btn-" + i.slice(0, 3) + " " + i.slice(3, i.length - 1) + "." + i[i.length - 1]);
            console.log(temp);
            for (let j = 0; j < temp.length; j++) {
                var rep = temp[j].className;
                rep = rep.replace(/btn-basic disabled/g, "btn btn-default");
                temp[j].className = rep;
                temp[j].innerHTML = course[i].courseName;
            }
        }
    }
}
function genTable() { /* gen blank table at first */
    var satTable = document.getElementsByClassName("btn-sat");
    var sunTable = document.getElementsByClassName("btn-sun");
    var i;
    var raw;
    for (i = 0; i < satTable.length; i++) {
        raw = satTable[i].className.split(' ');
        satTable[i].className = raw[0] + ' ' + raw[1] + ' btn btn-basic disabled ' + raw[raw.length - 1];
        satTable[i].innerHTML = "&nbsp;"
    }
    for (i = 0; i < sunTable.length; i++) {
        raw = sunTable[i].className.split(' ');
        sunTable[i].className = raw[0] + ' ' + raw[1] + ' btn btn-basic disabled ' + raw[raw.length - 1];
        sunTable[i].innerHTML = "&nbsp;"
    }
}
function calculate(btn) { /* run after click btn in HTML to switch between select and non-select */
    var all_same = document.getElementsByClassName(btn.className.split(' ')[0] + ' ' + btn.className.split(' ')[1]);
    for (let i = 0; i < all_same.length; i++) {
        var raw = all_same[i].className;
        var check = all_same[i].className.split(' ')[0] + ' ' + all_same[i].className.split(' ')[1];
        if (raw.indexOf("btn-default") !== -1) {
            raw = raw.replace(/btn-default/g, "btn-success");
            all_same[i].className = raw;
            if (check[check.length - 1] === '1') {
                var temp = document.getElementsByClassName(check.slice(0, check.length - 1) + '2');
                for (let j = 0; j < temp.length; j++) {
                    if (temp[j].className.indexOf("btn-success") !== -1) {
                        deselect(temp[j])
                    }
                }
            }
            else if (check[check.length - 1] === '2') {
                var temp = document.getElementsByClassName(check.slice(0, check.length - 1) + '1');
                for (let j = 0; j < temp.length; j++) {
                    if (temp[j].className.indexOf("btn-success") !== -1) {
                        deselect(temp[j])
                    }
                }
            }
        }
        else if (raw.indexOf("btn-success") !== -1) {
            raw = raw.replace(/btn-success/g, "btn-default");
            all_same[i].className = raw;
        }
    }
    var temp = btn.className.split(' ');
    var dayHour = temp[0].slice(temp[0].length - 3, temp[0].length) + temp[1];
    dayHour = dayHour.replace('.', '');
    if (availableCourse[dayHour] !== false) {
        if (btn.className.indexOf("btn-success") !== -1) {
            availableCourse[dayHour]["select"] = true
        }
        else {
            availableCourse[dayHour]["select"] = false
        }
    }
    document.getElementById('show_price').innerHTML = document.getElementsByClassName('btn-success').length * pricepercourse / 2;
    nextCheck();
}
function deselect(btn) {     /* sub function to deselect duo btn if both is selected */
    var all_same = document.getElementsByClassName(btn.className.split(' ')[0] + ' ' + btn.className.split(' ')[1]);
    for (let i = 0; i < all_same.length; i++) {
        var raw = all_same[i].className;
        if (raw.indexOf("btn-default") !== -1) {
            raw = raw.replace(/btn-default/g, "btn-success");
            all_same[i].className = raw;
        }
        else if (raw.indexOf("btn-success") !== -1) {
            raw = raw.replace(/btn-success/g, "btn-default");
            all_same[i].className = raw;
        }
    }
}
function nextCheck() { /* check next btn */
    var check = false;
    for (let i in availableCourse) {
        if (availableCourse[i] !== false) {
            if (availableCourse[i].select === true && availableCourse[i].tutor.nicknameEng !== "Hybrid") {
                check = true;
            }
        }
    }
    if (parseInt($('#grade').val())) {
        check = true
    }
    if (check && document.getElementsByClassName('btn-success').length * pricepercourse / 2 >= 2*pricepercourse) {
        document.getElementById("next").className = "btn btn-default";
    }
    else {
        document.getElementById("next").className = "btn btn-basic disabled";
    }
}
function next(gg) {
    if (gg.className.indexOf("disabled") === -1) {
        writeCookie('courseFee',document.getElementsByClassName('btn-success').length * pricepercourse / 2)
        writeCookie("regisCourse", JSON.stringify(availableCourse));
        self.location = "registrationHybrid";
    }
}
function back() {
    self.location = "registrationName";
}