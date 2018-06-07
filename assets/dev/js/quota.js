$('#quotaDBNavigation').addClass('active');

function addQuota() {
    var studentID = document.getElementById('studentID');
    var subject = document.getElementById('subject');
    var quota = document.getElementById('quota');
    $.post('/post/v1/addQuota', {
        studentID: studentID.value,
        subject: subject.value,
        value: quota.value
    }).then(result => {
        studentID.value = '';
        subject.value = '';
        quota.value = '';
    });
}