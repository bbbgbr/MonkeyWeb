$('#taskDBNavigation').addClass('active');

function deleteTask(id) {
    $.post('/post/v1/deleteTask', {
        taskID: id
    }).then(result => {
        if (result.err) {
        } else {
            window.location.replace("/dev/taskdb");
        }
    });
}