let cookie = getCookieDict();
let ID = "";
ID = cookie.monkeyWebUser;
let path = '';
let year = '';
let quarter = '';
let state = '';
initData();

$("#file-1").change(function () {
    uploadImg();
});

$("#submit").click(function () {
    if ($("#preview").attr("src") == "images/nopic.png") {
        alert("กรุณา Upload ใบโอน");
    } else {
        if (state == "pending") {
            self.location = "/studentProfile";
        } else {
            changeRegistrationState(ID, "transferred", { year: year, quarter: quarter }).then((data) => {
                self.location = "/studentProfile";
            });
        }
    }
});

async function initData() {
    let [config, allQ] = await Promise.all([getConfig(), listQuarter("public")]);
    for (let i in allQ.quarter) {
        year = config.defaultQuarter.registration.year;
        quarter = config.defaultQuarter.registration.quarter;
        if (allQ.quarter[i].year === year && allQ.quarter[i].quarter === quarter) {
            path = config.receiptPath.slice(config.receiptPath.search("MonkeyWebData") + 14) + allQ.quarter[i].name + "/" + ID;
        }
    }
    getState();
    loadPreview();
}
async function getState() {
    let stdInfo = await studentProfile(ID);
    for (let i in stdInfo.quarter) {
        if (stdInfo.quarter[i].year == year && stdInfo.quarter[i].quarter == quarter) {
            state = stdInfo.quarter[i].registrationState
        }
    }
}

function uploadImg() {
    let imgUrl = '';
    let ufile = $('#file-1');
    let ext = ufile.val().split('.').pop().toLowerCase();
    if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
        alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
    } else {
        let files = ufile.get(0).files;
        let formData = new FormData();
        let file = files[0];
        formData.append('file[]', file, file.name);
        imgUrl = 'post/submitReceipt'
        formData.append('studentID', ID);
        formData.append('year', year);
        formData.append('quarter', quarter);
        $.ajax({
            url: imgUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                loadPreview();
            }
        });
    }
}

async function loadPreview() {
    $.get(path + ".jpg").done(() => {
        $("#preview").attr("src", path + ".jpg");
    }).fail(() => {
        $.get(path + ".png").done(() => {
            $("#preview").attr("src", path + ".png");
        }).fail(() => {
            $.get(path + ".jpeg").done(() => {
                $("#preview").attr("src", path + ".jpeg");
            }).fail(() => {
                log("can't find picture");
                $("#preview").attr("src", "images/nopic.png");
            });
        });
    });
}