let lastTxt = "";
if (mobilecheck()) {
    $(".form-label").addClass("sr-only");
} else {
    $(".form-label").removeClass("sr-only");
}
$("#hotLabel").hide();
$("#hwLabel").hide();
$("#skLabel").hide();
$("#testLabel").hide();
$("#DownloadAllButt").hide();

const genPreview = () => {
    let str = "";
    str += $("#subjSelect").val() + "-";
    str += $("#seriesSelect").val() + $("#difficultSelect").val();
    str += ($("#sheetNumSelect").val().length > 1) ? $("#sheetNumSelect").val() : "0" + $("#sheetNumSelect").val();
    str += $("#subSeriesSelect").val();
    str += "(rev" + $("#revInput").val() + ")";
    lastTxt = str;
    $("#previewInput").val(str);
};

// gen data preview
genPreview();
$("#subjSelect").change(function () {
    genPreview();
});
$("#seriesSelect").change(function () {
    genPreview();
});
$("#difficultSelect").change(function () {
    genPreview();
});
$("#sheetNumSelect").change(function () {
    genPreview();
});
$("#subSeriesSelect").change(function () {
    genPreview();
});
$("#revInput").change(function () {
    genPreview();
});

// Request QR from server
$("#generateButt").click(function () {
    requestQR();
});
async function requestQR() {
    let body = {};
    body.subject = $("#subjSelect").val().slice(0, 1);
    body.ageGroup = $("#subjSelect").val().slice(1);
    body.level = $("#seriesSelect").val();
    body.difficulty = $("#difficultSelect").val();
    body.number = ($("#sheetNumSelect").val().length > 1) ? $("#sheetNumSelect").val() : "0" + $("#sheetNumSelect").val();
    body.rev = $("#revInput").val().slice(0, 1);
    body.subRev = $("#revInput").val().slice(2);
    let optional = $("#subSeriesSelect").val();
    if (optional !== "") {
        if (optional.length > 1) {
            body.alternative = optional.slice(0, 1);
            body.supplement = optional.slice(1);
        } else {
            body.alternative = optional;
        }
    }
    let qr = await $.post("post/v1/requestQR", body);
    generateQR(qr)
}

// gen QR
function generateQR(qr) {
    $("#hotLabel").show();
    $("#hwLabel").show();
    $("#skLabel").show();
    $("#testLabel").show();
    $("#DownloadAllButt").show();
    $('#hotQR').empty();
    $('#hwQR').empty();
    $('#skQR').empty();
    $('#testQR').empty();
    // $('#hotQR').append("<img src='https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=" + qr.hot + "'>")
    // $('#hwQR').append("<img src='https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=" + qr.hw + "'>")
    // $('#skQR').append("<img src='https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=" + qr.skill + "'>")
    // $('#testQR').append("<img src='https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=" + qr.test + "'>")
    // $('#hotQR > img').hide();
    // $('#hwQR > img').hide();
    // $('#skQR > img').hide();
    // $('#testQR > img').hide();
    $('#hotQR').append("<canvas width='256' height='256'></canvas>");
    $('#hwQR').append("<canvas width='256' height='256'></canvas>");
    $('#skQR').append("<canvas width='256' height='256'></canvas>");
    $('#testQR').append("<canvas width='256' height='256'></canvas>");
    // setTimeout(function () {
    //     genCanvas("hotQR");
    //     genCanvas("hwQR");
    //     genCanvas("skQR");
    //     genCanvas("testQR");
    // }, 1000);
    genCanvas("hotQR", qr);
    genCanvas("hwQR", qr);
    genCanvas("skQR", qr);
    genCanvas("testQR", qr);
}
function genCanvas(id, qr) {
    let canvas = document.getElementById(id).getElementsByTagName("canvas")[0];
    let ctx = canvas.getContext("2d");
    let img = new Image;
    img.crossOrigin = "anonymous";
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
    };
    // let img = document.getElementById(id).getElementsByTagName("img")[0];
    switch (id.slice(0, -2)) {
        case 'hot':
            img.src = 'https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=' + qr.hot
            break;
        case 'hw':
            img.src = 'https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=' + qr.hw
            break;
        case 'sk':
            img.src = 'https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=' + qr.skill
            break;
        case 'test':
            img.src = 'https://chart.googleapis.com/chart?cht=qr&chs=256x256&chld=L|0&chl=' + qr.test
            break;
        default:
            break;
    }
}

// download QR
function downloadQR(id, text) {
    let canvas;
    canvas = document.getElementById(id).getElementsByTagName('canvas')[0];
    let dlImg = canvas.toDataURL();
    let aref = document.createElement('a');
    aref.href = dlImg;
    aref.download = text;
    document.body.appendChild(aref);
    aref.click();
}
$('#hotQR').click(function () {
    downloadQR(this.id, lastTxt + "hotkey");
});
$('#hwQR').click(function () {
    downloadQR(this.id, lastTxt + "homework");
});
$('#skQR').click(function () {
    downloadQR(this.id, lastTxt + "skill");
});
$('#testQR').click(function () {
    downloadQR(this.id, lastTxt + "test");
});

$("#DownloadAllButt").click(function () {
    downloadQR("hotQR", lastTxt + "hotkey");
    setTimeout(() => {
        downloadQR("hwQR", lastTxt + "homework");
    }, 50);
    setTimeout(() => {
        downloadQR("skQR", lastTxt + "skill");
    }, 100);
    setTimeout(() => {
        downloadQR("testQR", lastTxt + "test");
    }, 150);
});