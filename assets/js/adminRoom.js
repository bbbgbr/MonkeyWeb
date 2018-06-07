genQuarterSelect();
/**
 * gen quarter select option
 */
async function genQuarterSelect() {
    let cookies = getCookieDict();
    let allQ = await listQuarter("private");
    for (let i in allQ.quarter) {
        $("#quarterSelect").append(
            "<option value='" + allQ.quarter[i].year + "-" + allQ.quarter[i].quarter + "'>" + allQ.quarter[i].name + "</option>"
        );
    }
    if (cookies.monkeyWebSelectedQuarter !== undefined) {
        $("#quarterSelect").val(cookies.monkeyWebSelectedQuarter);
        genRoom();
    } else {
        let config = await getConfig();
        $("#quarterSelect").val(config.defaultQuarter.quarter.year + "-" + config.defaultQuarter.quarter.quarter);
        genRoom();
    }
}
$("#quarterSelect").change(function () {
    writeCookie("monkeyWebSelectedQuarter", $("#quarterSelect").val());
    genRoom();
})

/**
 * generate room data
 */
async function genRoom() {
    /**
     * sort object by key
     * @param {Object} objIn 
     */
    const sortObject = (objIn) => {
        let out = {};
        Object.keys(objIn).sort().forEach(function (key) {
            out[key] = objIn[key];
        });
        return out;
    };
    let roomData = await $.post("post/v1/allRoom", {
        year: $("#quarterSelect").val().slice(0, 4), quarter: $("#quarterSelect").val().slice(5)
    });
    $(".tab-pane").empty();
    for (let i in roomData) {
        let allRoom = sortObject(roomData[i]);
        let pointer = $("#" + i);
        for (let j in allRoom) {
            let room = allRoom[j];
            let roomName = "";
            switch (j) {
                case 'room0':
                    roomName = "HB";
                    break;
                case 'room1':
                    roomName = "Room 1";
                    break;
                case 'room2':
                    roomName = "Room 2";
                    break;
                case 'room3':
                    roomName = "Room 3";
                    break;
                case 'room4':
                    roomName = "Room 4";
                    break;
                case 'room5':
                    roomName = "Glass";
                    break;
                default:
                    break;
            }
            pointer.append(
                "<div class='card'>" +
                "<div class='card-header' id='head" + i + j + "'>" +
                "<div class='row'>" +
                "<div class='col-10'><h4 class='pt-2' id='name" + i + j + "'>" + roomName + "</h4></div>" +
                "<div class='col-2'><h4 class='pt-2 float-right'>" + room.studentCount + "/" + room.maxStudent + "</h4></div>" +
                "</div>" +
                "</div>" +
                "<div class='collapse card-body p-0' id='body" + i + j + "'><table class='table table-hover m-0'><tbody id='" + i + j + "'></tbody></table></div>" +
                "</div>"
            );
            if (room.hybrid !== undefined) {
                for (let k in room.hybrid) {
                    if (room.hybrid[k].numMath !== undefined) {
                        $("#" + i + j).append(
                            "<tr class='table-warning hbRow' id='m" + room.hybrid[k].hybridID + "'>" +
                            "<td class='text-left'>FHB:M</td>" +
                            "<td class='text-right'>" + room.hybrid[k].numMath + "</td>" +
                            "</tr>"
                        );
                    }
                    if (room.hybrid[k].numPhysics !== undefined) {
                        $("#" + i + j).append(
                            "<tr class='table-primary hbRow' id='p" + room.hybrid[k].hybridID + "'>" +
                            "<td class='text-left'>FHB:P</td>" +
                            "<td class='text-right'>" + room.hybrid[k].numPhysics + "</td>" +
                            "</tr>"
                        );
                    }
                    if (room.hybrid[k].numChemistry !== undefined) {
                        $("#" + i + j).append(
                            "<tr class='table-info hbRow' id='c" + room.hybrid[k].hybridID + "'>" +
                            "<td class='text-left'>FHB:C</td>" +
                            "<td class='text-right'>" + room.hybrid[k].numChemistry + "</td>" +
                            "</tr>"
                        );
                    }
                    if (room.hybrid[k].numEnglish !== undefined) {
                        $("#" + i + j).append(
                            "<tr class='table-active hbRow' id='e" + room.hybrid[k].hybridID + "'>" +
                            "<td class='text-left'>FHB:E</td>" +
                            "<td class='text-right'>" + room.hybrid[k].numEnglish + "</td>" +
                            "</tr>"
                        );
                    }
                }
            }
            if (room.course !== undefined) {
                for (let k in room.course) {
                    if (room.course[k].tutor != "Hybrid") {
                        let tutorName = " - " + room.course[k].tutor;
                        let parentName = $("#name" + i + j).html();
                        if (parentName.indexOf("-") <= 0) {
                            $("#name" + i + j).html(parentName + tutorName);
                        }
                    }

                    $("#" + i + j).append(
                        "<tr class='crRow' id='" + room.course[k].courseID + "'>" +
                        "<td class='text-left'>CR:" + room.course[k].courseName + "</td>" +
                        "<td class='text-right'>" + room.course[k].num + "</td>" +
                        "</tr>"
                    );
                }
            }
        }
    }
}
$(".tab-pane").on("click", ".crRow", function (e) {
    writeCookie("monkeyWebAdminAllcourseSelectedCourseID", this.id);
    self.location = "/adminCoursedescription";
});
$(".tab-pane").on("click", ".hbRow", function (e) {
    writeCookie("monkeySelectedHybrid", this.id);
    self.location = "/adminHybridInfo";
});
$(".tab-pane").on("click", ".card-header", function (e) {
    let target = "body" + this.id.slice(4);
    $("#" + target).collapse('toggle');
});