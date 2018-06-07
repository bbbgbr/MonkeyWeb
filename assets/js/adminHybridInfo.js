let cookies = getCookieDict();
if (cookies.monkeySelectedHybrid === undefined) {
    self.location = "/adminAllHybrid";
} else {
    let subj = cookies.monkeySelectedHybrid.slice(0, 1).toUpperCase();
    let hbID = cookies.monkeySelectedHybrid.slice(1);
    $("#fhbSubj").html("FHB:" + subj);
    $("#hbID").html("hbID:" + hbID);
    getHBData(subj, hbID);
}
/**
 * get hybrid data
 * @param {string} subj 
 * @param {string} hbID 
 */
async function getHBData(subj, hbID) {
    let hbData = await $.post("post/v1/listHybridInfo", { hybridID: hbID });
    let time = moment(hbData.day);
    $("#day").html("Day:" + time.format("dddd"));
    $("#time").html(time.format("H:00") + " - " + (time.hour() + 2) + ":00");
    let student = hbData.student;
    student = student.filter(data => data.subject === subj);
    let promise = [];
    for (let i in student) {
        promise.push(studentProfile(student[i].studentID));
    }
    let studentName = await Promise.all(promise);
    let index = 1;
    for (let i in student) {
        if (studentName[i].status == "active") {
            let grade = (studentName[i].grade) > 6 ? 'S' + (studentName[i].grade - 6) : 'P' + studentName[i].grade;
            $("#allStudentInHybrid").append(
                "<tr onclick='relocatted(\"" + student[i].studentID + "\")'>" +
                "<td class='text-center'>" + index + "</td>" +
                "<td class='text-center'>" + student[i].studentID + "</td>" +
                "<td class='text-center'>" + grade + "</td>" +
                "<td class='text-center'>" + studentName[i].nickname + "</td>" +
                "<td class='text-center'>" + studentName[i].firstname + "</td>" +
                "<td class='text-center'>" + studentName[i].lastname + "</td>" +
                "</tr>"
            );
        }
        index += 1;
    }
}
/**
 * method for redirect to student profile page
 * @param {Number} stdID 
 */
function relocatted(stdID) {
    writeCookie("monkeyWebAdminAllstudentSelectedUser", stdID);
    self.location = "/adminStudentprofile";
}