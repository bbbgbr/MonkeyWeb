const getDateName = (date) => {
    let dateName = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return dateName[date];
};
const getRoom = (roomNo) => {
    switch (roomNo) {
        case -1:
            return "-";
        case 0:
            return "HB";
        case 5:
            return "Glass";
        default:
            return roomNo;
    }
}
let userPosition = "";
let userName = "";
$(document).ready(function () {
    if ($(document).width() > 767) {
        $("#filterPanel").addClass("position-fixed");
    }
    let cookie = getCookieDict();
    name(cookie.monkeyWebUser).then(name => {
        userName = name.nicknameEn;
    });
    getConfig().then(config => {
        position(cookie.monkeyWebUser).then(pos => {
            let quarterStatus = "";
            switch (pos.position) {
                case "tutor":
                case "admin":
                    quarterStatus = "protected";
                    break;
                case "dev":
                case "mel":
                    quarterStatus = "private";
                    break;
            }
            userPosition = pos.position;
            listQuarter(quarterStatus).then(data => {
                for (let i = 0; i < data.quarter.length; i++) {
                    quarter.innerHTML += "<option value = '" + data.quarter[i].year + "-" + data.quarter[i].quarter + "'>" + data.quarter[i].name + "</option>";
                }
                if (cookie.monkeyWebSelectedQuarter === undefined) {
                    quarter.value = config.defaultQuarter.quarter.year + "-" + config.defaultQuarter.quarter.quarter;
                } else {
                    quarter.value = cookie.monkeyWebSelectedQuarter;
                }
                getAllCourseContent();
            })
        })
    })
});

function quarterChange() {
    var quarter = document.getElementById("quarter");
    writeCookie("monkeyWebSelectedQuarter", quarter.options[quarter.selectedIndex].value);
    getAllCourseContent();
}

function getAllCourseContent() {
    quarterVal = $("#quarter").val();
    allCourseV1(quarterVal.slice(0, 4), quarterVal.slice(5)).then(data => {
        let course = filterCourseData(data);
        log(course);
        generateCourseHtmlTable(course);
    })
}

function filterCourseData(data) {
    let subject = document.getElementById("subject");
    let grade = document.getElementById("grade");
    let name = document.getElementById("name");
    let time = document.getElementById("time");
    let quarter = document.getElementById("quarter");
    var checked = [];
    var level = $("input[name='options[]']:checked").each(function () {
        checked.push($(this).val());
    });
    let cookie = getCookieDict();
    if (userPosition === "tutor") {
        data = data.filter(data => data.tutorName.indexOf(userName) !== -1);
        return data;
    } else {
        if (subject.options[subject.selectedIndex].value !== "all") {
            data = data.filter(data => data.courseName.slice(0, 1) === subject.options[subject.selectedIndex].value);
        }
        if (grade.options[grade.selectedIndex].value !== "all") {
            data = data.filter(data => data.grade.indexOf(parseInt(grade.options[grade.selectedIndex].value)) !== -1);
        }
        if (name.options[name.selectedIndex].value !== "all") {
            data = data.filter(data => data.tutorName.indexOf(name.options[name.selectedIndex].value) !== -1);
        }
        if (time.options[time.selectedIndex].value !== "all") {
            data = data.filter(data => data.day === parseInt(time.options[time.selectedIndex].value));
        }
        data = data.filter(data => checked.indexOf(data.courseName.slice(data.courseName.length - 1, data.courseName.length)) !== -1);
        return data;
    }
}

function generateCourseHtmlTable(course) {
    let table = document.getElementById("allCourseTable");
    table.innerHTML = "";
    for (let i = 0; i < course.length; i++) {
        let time = new Date(course[i].day);
        let row = table.insertRow(i);
        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);
        let cell2 = row.insertCell(2);
        let cell3 = row.insertCell(3);
        let cell4 = row.insertCell(4);
        let cell5 = row.insertCell(5);
        let cell6 = row.insertCell(6);
        row.id = course[i].courseID;
        cell0.innerHTML = "<td>" + (i + 1) + "</td>";
        cell1.innerHTML = "<td>" + course[i].courseName + "</td>";
        cell2.innerHTML = "<td>" + getDateName(time.getDay()) + "</td>";
        cell3.innerHTML = "<td>" + time.getHours() + ":00 - " + (time.getHours() + 2) + ":00</td>";
        cell4.innerHTML = "<td>" + course[i].tutorName + "</td>";
        cell5.innerHTML = "<td>" + course[i].studentCount + "</td>";
        cell6.innerHTML = "<td>" + getRoom(course[i].room) + "</td>";
        let clickHandler = (row) => () => {
            writeCookie("monkeyWebAdminAllcourseSelectedCourseID", row.id);
            self.location = "/adminCoursedescription";
        };
        row.onclick = clickHandler(row);
        cell0.className += "text-center";
        cell1.className += "text-center";
        cell2.className += "text-center";
        cell3.className += "text-center";
        cell4.className += "text-center";
        cell5.className += "text-center";
        cell6.className += "text-center";
    }
}