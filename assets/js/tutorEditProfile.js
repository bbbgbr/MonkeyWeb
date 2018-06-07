$("#editEmail").click(function () {
    let cookie = getCookieDict();
    let tutorID = cookie.monkeyWebUser;
    if (confirm("Change Email to " + $('#tutorEmail').val())) {
        $.post('post/editTutor', { tutorID: tutorID, email: $('#tutorEmail').val() }).then(() => {
            location.reload();
        });
    }
});
$("#editPwd").click(function () {
    let cookie = getCookieDict();
    let tutorID = cookie.monkeyWebUser;
    let psd = CryptoJS.SHA3($('#tutorPwd').val()).toString()
    if (confirm("Change password to " + $('#tutorPwd').val())) {
        $.post('post/editTutor', { tutorID: tutorID, password: psd }).then(() => {
            location.reload();
        });
    }
});