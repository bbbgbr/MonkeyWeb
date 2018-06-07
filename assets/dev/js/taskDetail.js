$('#taskDBNavigation').addClass('active');

function deleteTask(id) {
    console.log('hello');
    console.log(id);
    $.post('/post/v1/deleteTask', {
        taskID: id
    }).then(result => {
        if (result.err) {
            console.log(result.err);
        } else {
            window.location.replace("/dev/taskdb");
        }
    });
}