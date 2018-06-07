$("#bodyPane").hide();
let uniqueTask = [];
getData();
async function getData() {
    let allTutor = await $.post('post/v1/listTutor');
    let promise = [];
    for (let i in allTutor) {
        promise.push($.post('v2/workflow/listNode', { id: allTutor[i].tutorID }));
    }
    let allTask = await Promise.all(promise);
    for (let i in allTask) {
        uniqueTask = _.union(uniqueTask, allTask[i].nodes);
        uniqueTask = _.remove(uniqueTask, (e) => { return e.status !== 'note' && e.canDelete });
    }
    getTutorName();
    let allChild = _.uniqBy(uniqueTask, 'childOwner');
    allChild = _.orderBy(allChild, 'childOwnerName', 'asc');
    for (let i in allChild) {
        $("#filterSelect").append("<option value='" + allChild[i].childOwner + "'>" + allChild[i].childOwnerName + "</option>");
    }
}
async function getTutorName() {
    let promise = [];
    for (let i in uniqueTask) {
        promise.push(name(uniqueTask[i].owner));
    }
    let ownerName = await Promise.all(promise);
    for (let i in uniqueTask) {
        uniqueTask[i].owner = ownerName[i].nicknameEn;
    }
    genTable(1);
}
function genTable(type) {
    let task = uniqueTask;
    let filter = parseInt($("#filterSelect").val());
    if (filter !== 0) {
        task = task.filter((e) => { return e.childOwner === filter });
    }
    $("#taskCount").html(task.length + " task");
    switch (type) {
        case 2:
            task = _.orderBy(task, 'title', 'asc');
            break;
        case 3:
            task = _.orderBy(task, 'owner', 'asc');
            break;
        case 4:
            task = _.orderBy(task, 'childStatus', 'asc');
            break;
        case 5:
            task = _.orderBy(task, 'childOwnerName', 'asc');
            break;
        case 6:
            task = _.orderBy(task, 'duedate', 'asc');
            break;
        default:
            break;
    }
    let table = $("#tableBody");
    table.empty();
    for (let i in task) {
        let t;
        if (task[i].duedate !== null) {
            t = moment(task[i].duedate).format('DD/MM/YY');
        } else {
            t = 'None';
        }
        let state = ''
        switch (task[i].childStatus.toLowerCase()) {
            case 'inprogress':
                state = 'bg-warning'
                break;
            case 'complete':
                state = 'bg-success text-white'
                break;
            default:
                break;
        }
        table.append(
            "<tr class='" + state + "'>" +
            "<td class='text-center'>" + task[i].title + "</td>" +
            "<td class='text-center'>" + task[i].owner + "</td>" +
            "<td class='text-center'>" + task[i].childStatus + "</td>" +
            "<td class='text-center'>" + task[i].childOwnerName + "</td>" +
            "<td class='text-center'>" + t + "</td>" +
            "</tr>"
        )
    }
    $("#loaddingPane").hide();
    $("#bodyPane").show();
}

$("#filterSelect").change(function () {
    genTable(1);
});