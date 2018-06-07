/**
 * True on mobile, false on pc
 */
const mobilecheck = () => {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const allStudent = () => $.post("post/allStudent", {});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const allCourse = () => $.post("/post/allCourse", {
    quarter: "all"
});

const allCourseV1 = (year, quarter) => $.post("post/v1/allCourse", {
    year: year,
    quarter: quarter
});

const listStudentHybrid = (year, quarter, studentID) => $.post("post/v1/listStudentHybrid", {
    year: year,
    quarter: quarter,
    studentID: studentID
})

const listStudentSkill = (year, quarter, studentID) => $.post("post/v1/listStudentSkill", {
    year: year,
    quarter: quarter,
    studentID: studentID
})

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const studentProfile = (studentID) => $.post("post/studentProfile", {
    studentID: studentID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const courseInfo = (courseID) => $.post("post/courseInfo", {
    courseID: courseID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const name = (userID) => $.post("post/name", {
    userID: userID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const position = (userID) => $.post("/post/position", {
    userID: userID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const changeRegistrationState = (studentID, registrationState, quarter) => {
    if (quarter === undefined) {
        return $.post("post/changeRegistrationState", {
            studentID: studentID,
            registrationState: registrationState,
            quarter: quarter
        });
    } else {
        return $.post("post/changeRegistrationState", {
            studentID: studentID,
            registrationState: registrationState,
            year: quarter.year,
            quarter: quarter.quarter
        });
    }
}

// recipient: "MonkeyIT","Test","MonkeyAdmin","MonkeyStaff"
const lineNotify = (recipient, message) => $.post("post/lineNotify", {
    recipient: recipient,
    message: message
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const addSkillStudent = (skillID, studentID, subject) => $.post("post/v1/addSkillStudent", {
    skillID: skillID,
    studentID: studentID,
    subject: subject
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const addHybridStudent = (hybridID, studentID, subject) => $.post("post/v1/addHybridStudent", {
    hybridID: hybridID,
    studentID: studentID,
    subject: subject
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const addStudentCourse = (studentID, courseID) => $.post("post/addStudentCourse", {
    studentID: studentID,
    courseID: courseID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const removeStudentCourse = (studentID, courseID) => $.post("post/removeStudentCourse", {
    studentID: studentID,
    courseID: courseID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const removeHybridStudent = (studentID, hybridID) => $.post("post/v1/removeHybridStudent", {
    studentID: studentID,
    hybridID: hybridID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const removeSkillStudent = (studentID, skillID) => $.post("post/v1/removeSkillStudent", {
    studentID: studentID,
    skillID: skillID
});

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const registrationState = (studentID, quarter, year) => {
    if (quarter === undefined) {
        return $.post("post/registrationState", {
            studentID: studentID
        });
    } else {
        return $.post("post/registrationState", {
            studentID: studentID,
            quarter: quarter,
            year: year
        });
    }
}

//noinspection ES6ModulesDependencies,NodeModulesDependencies,JSUnresolvedFunction
const getConfig = () => $.post("post/getConfig", {});

const listQuarter = (status) => $.post("post/listQuarter", {
    status: status
});
const logMoment = (moment) => {
    log(moment.format("DD/MM/YYYY HH:mm:ss"));
}
/**
 * Use to log text to console
 * @param text text to be log in console
 */
function log(text) {
    "use strict";
    console.log(text);
}
/**
 * Add variable to document.cookie
 * @param key variable name to be added
 * @param value variable value
 */
function writeCookie(key, value) {
    "use strict";
    document.cookie = key + "=" + value;
    log("[writeCookie()] -> " + key + " wrote");
}

/**
 * Delete variable from document.cookie
 * @param key variable name to be deleted
 */
function deleteCookie(key) {
    "use strict";
    document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    log("[deleteCookie()] -> " + key + " deleted");
}

/**
 * Generate object of document.cookie
 * @return {object} object of document.cookie
 */
function getCookieDict() {
    "use strict";
    //noinspection SpellCheckingInspection
    let allcookies = document.cookie;
    let obj = {};
    //noinspection SpellCheckingInspection
    let cookiearray = allcookies.split('; ');
    for (let i = 0; i < cookiearray.length; i++) {
        obj[cookiearray[i].split('=')[0]] = cookiearray[i].split('=')[1];
    }
    return obj;
}

/**
 * Logout current user
 */
function logout() {
    "use strict";
    log("[Logout()] : redirection to login page");
    clearAllCookie();
    self.location = "/";
}

/**
 * Set student name to navigation bar
 */
/* function setStudentNavName() {
    "use strict";
    let cookie = getCookieDict();
    //noinspection JSUnresolvedVariable
    name(cookie.monkeyWebUser).then((data) => {
        if (data.err) {
            document.getElementById("navStudentName").innerHTML = " ";
            log("[setStudentNavName()] => Set student name in navigation bar to :  ");
        } else {
            document.getElementById("studentNavNameSmall").innerHTML = data.firstname;
            document.getElementById("studentNavNameLarge").innerHTML = data.firstname;
            log("[setStudentNavName()] => Set student name in navigation bar to : " + data.firstname);
        }
    });
} */

/**
 * Delete all cookies in browser
 */
function clearAllCookie() {
    log("[clearAllCookie()] is called");
    let cookieKeys = Object.keys(getCookieDict());
    for (let i = 0; i < cookieKeys.length; i++) {
        deleteCookie(cookieKeys[i]);
    }
}

/**
 * function for relocation with query object
 */
const relocate = (url, obj) => {
    let str = '/';
    str += url + '?';
    let n = 0;
    for (let i in obj) {
        if (n !== 0) str += '&';
        str += i + '=' + obj[i];
        n++;
    }
    self.location = str;
};

/**
 * Load registration page from status of student
 */
function loadRegistrationPage() {
    let cookie = getCookieDict();
    getConfig().then((cb) => {
        let regisQ = cb.defaultQuarter.registration;
        let regisYear = regisQ.year;
        let regisQuarter = regisQ.quarter;
        if (regisQuarter > 4) {
            registrationState(cookie.monkeyWebUser, "summer").then(data => {
                log(data);
                if (data.err) {
                    log("[loadSummerRegistrationPage()] : post/registrationState => " + data.err);
                } else {
                    log("[loadSummerRegistrationPage()] : post/registrationState =>");
                    log(data);
                    switch (data.registrationState) {

                        case "untransferred":
                            log("[loadSummerRegistrationPage()] : redirection to ");
                            self.location = "/summerReceipt";
                            break;
                        case "transferred":
                        case "approved":
                        case "pending":
                        case "finished":
                            log("[loadSummerRegistrationPage()] : redirection to studentProfile");
                            self.location = "/studentProfile";
                            break;
                        default:
                            log("[loadSummerRegistrationPage()] : redirection to registrationSummer");
                            self.location = "/registrationSummer";
                            break;
                    }
                }
            });
        } else {
            registrationState(cookie.monkeyWebUser, regisQuarter, regisYear).then((data) => {
                if (data.err) {
                    log("[loadRegistrationPage()] : post/registrationState => " + data.err);
                } else {
                    log("[loadRegistrationPage()] : post/registrationState =>");
                    log(data);
                    switch (data.registrationState) {
                        case "unregistered":
                        case "rejected":
                            log("[loadRegistrationPage()] : redirection to registrationCourse");
                            self.location = "/regisPage";
                            break;
                        case "untransferred":
                            log("[loadRegistrationPage()] : redirection to registrationReceipt");
                            self.location = "/registrationReceipt";
                            break;
                        case "pending":
                        case "approved":
                        case "transferred":
                        case "registered":
                            log("[loadRegistrationPage()] : redirection to studentProfile");
                            self.location = "/studentProfile";
                            break;
                        default:
                            break;
                    }
                }
            });
        }
    });

}