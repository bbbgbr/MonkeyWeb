$('#chatDBNavigation').addClass('active');

function deleteChat(id) {
    $.post('/post/v1/deleteChat', {
        chatID: id
    }).then(result => {
        if (result.err) {
        } else {
            window.location.reload();
        }
    });
}