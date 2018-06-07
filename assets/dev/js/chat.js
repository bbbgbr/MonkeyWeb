$('#chatDBNavigation').addClass('active');

function sendMessage() {
    var studentID = document.getElementById('studentID');
    var message = document.getElementById('message');
    $.post('/post/v1/addChat', {
        msg: message.value,
        studentID: studentID.value
    }).then(result => {
        studentID.value = '';
        message.value = '';
    });
}

function redirectChat() {
    var studentID = document.getElementById('viewStudentID');
    window.location = '/dev/chatDetail?id=' + studentID.value;
}