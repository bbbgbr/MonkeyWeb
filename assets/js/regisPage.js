// add cr table btn click event
$(".cr-select").click(function () {
    $(this).toggleClass('btn-light btn-success');
    if ($(this).hasClass('btn-success')) {
        $($(this).siblings()[0]).removeClass('btn-success');
        $($(this).siblings()[0]).addClass('btn-light');
    }
});
// add cr next btn click event
$("#gotoHBBtn").click(function () {
    let l = $("td .btn-success").length;
    if (l < 2) {
        alert('ต้องลงอย่างน้อย 2 คอร์ส');
    } else if (confirm('ไปยังหน้าลงทะเบียนFHB ?')) {
        let body = {};
        body.page = 2;
        body.cr = [];
        for (let i = 0; i < l; i++) {
            body.cr.push($("td .btn-success")[i].id);
        }
        relocate('regisPage', body);
    }
});
// add hb next btn click event
$("#gotoSkBtn").click(function () {
    if (confirm('ไปยังหน้าลงทะเบียนSkill ?')) {
        let current = window.location.href;
        let body = {};
        body.fhb = [];
        let l = $('.custom-select option:selected').length;
        for (let i = 0; i < l; i++) {
            let subj = $('.custom-select option:selected')[i].innerHTML.slice(-1);
            body.fhb.push($('.custom-select option:selected')[i].value + subj);
        }
        body.fhb = body.fhb.filter((a) => {
            if (a.slice(0, 1) === '0') return false;
            return true;
        });
        current = current.replace('page=2', 'page=3');
        log(body.fhb.length)
        if (body.fhb.length > 0) {
            for (let i in body) {
                current = current + '&' + i + '=' + body[i];
            }
        }
        self.location = current;
    }
});
// add sk next btn event
$("#gotoSubmitBtn").click(function () {
    if (confirm('ไปยังหน้ายืนยัน ?')) {
        let current = window.location.href;
        let body = {};
        body.sk = [];
        let l = $('.custom-select option:selected').length;
        for (let i = 0; i < l; i++) {
            let subj = $('.custom-select option:selected')[i].innerHTML.slice(0, 1);
            body.sk.push($('.custom-select option:selected')[i].value + subj);
        }
        body.sk = body.sk.filter((a) => {
            if (a.slice(0, 1) === '0') return false;
            return true;
        });
        current = current.replace('page=3', 'page=4');
        if (body.sk.length > 0) {
            for (let i in body) {
                current = current + '&' + i + '=' + body[i];
            }
        }
        self.location = current;
    }
});
// add submit next btn event
$("#submitBtn").click(function () {
    if (confirm('โปรดตรวจสอบข้อมูลอย่างละเอียดหาก "ยืนยัน" แล้วจะไม่สามารถแก้ไขได้')) {
        let current = window.location.href;
        let str;
        str = current.slice(current.indexOf('cr='));
        let cr;
        if (str.indexOf('&') > -1) {
            cr = str.slice(3, str.indexOf('&'));
        } else {
            cr = str.slice(3);
        }
        cr = cr.split(',');
        let fhb = [];
        if (str.indexOf('fhb=') > -1) {
            str = str.slice(str.indexOf('fhb=') + 1);
            if (str.indexOf('&') > -1) {
                fhb = str.slice(3, str.indexOf('&'));
            } else {
                fhb = str.slice(3);
            }
            fhb = fhb.split(',');
        }
        let sk = [];
        if (str.indexOf('sk=') > -1) {
            str = str.slice(str.indexOf('sk=') + 1);
            sk = str.slice(2);
            sk = sk.split(',');
        }
        sendStdTable(cr, fhb, sk);
    }
});
/**
 * func for send student timetable to server
 * @param {*} cr 
 * @param {*} fhb 
 * @param {*} sk 
 */
async function sendStdTable(cr, fhb, sk) {
    let cookie = getCookieDict();
    let ID = cookie.monkeyWebUser;
    let fhbPromise = [];
    for (let i in fhb) {
        fhbPromise.push($.post('post/v1/addHybridStudent', { hybridID: fhb[i].slice(0, -1), studentID: ID, subject: fhb[i].slice(-1) }));
    }
    let skPromise = [];
    for (let i in sk) {
        skPromise.push($.post('post/v1/addSkillStudent', { skillID: sk[i].slice(0, -1), studentID: ID, subject: sk[i].slice(-1) }));
    }
    try {
        let [cb1, cb2, cb3] = await Promise.all([
            $.post('post/addStudentCourse', { studentID: ID, courseID: cr }),
            fhbPromise,
            skPromise
        ]);
        log(cb1);
        log(cb2);
        log(cb3);
        changeStdState();
    } catch (error) {
        log(error);
        alert("มีปัญหาในการส่งข้อมูลกรุณาลองอีกครั้ง");
        sendStdTable(cr, fhb, sk);
    }
}
/**
 * func for change student state
 */
async function changeStdState() {
    let cookie = getCookieDict();
    let ID = cookie.monkeyWebUser;
    try {
        let config = await getConfig();
        let year = config.defaultQuarter.registration.year;
        let quarter = config.defaultQuarter.registration.quarter;
        let cb = await $.post("post/changeRegistrationState", { studentID: ID, registrationState: 'untransferred', year: year, quarter: quarter });
        self.location = '/registrationReceipt';
    } catch (error) {
        log(error);
        alert("มีปัญหาในการเปลี่ยนสถานะกรุณาลองอีกครั้ง");
        changeStdState();
    }
}