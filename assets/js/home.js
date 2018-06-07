/**
 * For load slideshow on student home
 */
async function loadHomeCarousel() {
    let [config, allPic] = await Promise.all([getConfig(), $.post("post/v1/countAnnouncement")]);
    let path = config.studentSlideshowPath;
    path = path.slice(path.indexOf("MonkeyWebData") + 14);
    let pic;
    if (window.innerWidth > window.innerHeight) {
        pic = allPic.filter(data => { return data.slice(0, 1).indexOf('l') >= 0 });
    } else {
        pic = allPic.filter(data => { return data.slice(0, 1).indexOf('p') >= 0 });
    }
    pic.sort((a, b) => {
        return parseInt(a.slice(1, -4)) - parseInt(b.slice(1, -4));
    });
    for (let i in pic) {
        $(".galleria").append(
            "<img src='" + path + pic[i] + "'>"
        );
    }
    Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
    Galleria.run($(".galleria"), {
        extend: function () {
            this.setOptions('transition', 'fade');
            this.play(5000);
        }
    });
}
window.addEventListener("orientationchange", function () {
    location.reload();
}, false);

/**
 * For load slideshow on admin home
 */
async function loadAdminHomeCarousel() {
    let [config, allPic] = await Promise.all([getConfig(), $.post("post/v1/countAnnouncement")]);
    let path = config.studentSlideshowPath;
    path = path.slice(path.indexOf("MonkeyWebData") + 14);
    let cookie = getCookieDict();
    if (cookie.slideMode === undefined) {
        writeCookie("slideMode", "n");
        writeCookie("slideStyle", "classic");
        location.reload();
    } else {
        let pic = allPic.filter(data => { return data.slice(0, 1).indexOf(cookie.slideMode) >= 0 });
        pic.sort((a, b) => {
            return parseInt(a.slice(1, -4)) - parseInt(b.slice(1, -4));
        });
        for (let i in pic) {
            $(".galleria").append(
                "<img src='" + path + pic[i] + "'>"
            );
        }
        let Interval;
        switch (cookie.slideMode) {
            case "p":
                Interval = 5000;
                break;
            case "l":
                Interval = 5000;
                break;
            case "n":
                Interval = 10000;
                break;
            default:
                Interval = 10000;
                break;
        }
        Galleria.loadTheme('galleria/themes/' + cookie.slideStyle + '/galleria.' + cookie.slideStyle + '.min.js');
        Galleria.run($(".galleria"), {
            extend: function () {
                this.setOptions('transition', 'fade');
                this.play(Interval);
            }
        });
    }
}

// Add event to filter picture
$("#stdPtBtn").click(function () {
    writeCookie("slideMode", "p");
    location.reload();
});
$("#stdLcBtn").click(function () {
    writeCookie("slideMode", "l");
    location.reload();
});
$("#adminNwBtn").click(function () {
    writeCookie("slideMode", "n");
    location.reload();
});

// Add event to change slide style
$("body").on("dblclick", ".galleria-container", function () {
    let cookie = getCookieDict();
    if (cookie.slideStyle === "classic") {
        writeCookie("slideStyle", "fullscreen");
    } else {
        writeCookie("slideStyle", "classic");
    }
    location.reload();
});

// Func for upload slide
$("#uploadBtn").click(function () {
    $("#uploadModal").modal('show');
});
$("#slideFile").change(function () {
    $("#fileLabel").html(this.files.length + " files selected.");
});
$("#submitUploadBtn").click(function () {
    let ufile = $("#slideFile");
    let ext = ufile.val().split('.').pop().toLowerCase();
    if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
        alert('กรุณาอัพไฟล์ .jpg, .jpeg หรือ .png เท่านั้น');
    } else {
        let str = "Old files will be replace, continue?";
        if (confirm(str)) {
            let files = ufile.get(0).files;
            if (files.length > 0) {
                let formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];
                    formData.append('file[]', file, file.name);
                }
                $.ajax({
                    url: 'post/updateStudentSlideshow',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function () {
                        location.reload();
                    }
                });
            }
        }
    }
});