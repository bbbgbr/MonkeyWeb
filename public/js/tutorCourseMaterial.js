$(document).ready(function(){
    $(".popup").click(function(){
        var courseID=$(this).data("course-id");
        var numberOfSub=$(this).data("number-of-sub");
        var courseName=$(this).data("course-name");
        var status=$(this).data("status");
        var outerModal=$("#submitModal");
        var modal=outerModal.find(".modal-content");
        var form=modal.find("form");

        modal.attr("class","modal-content");
        modal.find(".no,.accepted,.rejected,.pending").addClass("hidden");
        modal.find(".courseName").text(" "+courseName+"#"+numberOfSub+" ");
        form.removeClass("hidden");
        form.trigger("reset");
        form.find(".badge").text("0");
        form.find("li:not(.dropdown-header)").remove();
        form.find("[type=submit]").addClass("disabled");
        form.find("[name=courseID]").val(courseID);
        form.find("[name=numberOfSub]").val(numberOfSub);

        if(status=="no"){
            modal.addClass("grey");
            modal.find(".no").removeClass("hidden");
        }
        else if(status=="accepted"){
            modal.addClass("lightgreen");
            modal.find(".accepted").removeClass("hidden");
            modal.find("form").addClass("hidden");
        }
        else if(status=="rejected"){
            modal.addClass("red");
            modal.find(".rejected").removeClass("hidden");
        }
        else if(status=="pending"){
            modal.addClass("blue");
            modal.find(".pending").removeClass("hidden");
        }
        outerModal.modal();
    });
    $("[type=file]").change(function(event){
        var form=$(this).closest("form");
        var file=$(this).get(0).files;
        var dropdown=form.find(".dropdown-menu");
        dropdown.find("li:not(.dropdown-header)").remove();
        if(file.length){
            form.find(".badge").text(file.length);
            for(var i=0;i<file.length;i++){
                dropdown.append("<li><a>File#"+(i+1)+" : "+file[i].name+"</a></li>");
            }
            form.find("[type=submit]").removeClass("disabled");
        }
        else form.find("[type=submit]").addClass("disabled");
    });
    $("form").submit(function(event){
        event.preventDefault();
        var data=new FormData();
        var form=$(this);
        var file=form.find("[type=file]").get(0).files;

        var courseID=form.find("[name=courseID]").val();
        var numberOfSub=form.find("[name=numberOfSub]").val();
        for(var i=0;i<file.length;i++){
            data.append("file",file[i],file[i].name);
        }
        data.append("courseID",courseID);
        data.append("numberOfSub",numberOfSub);

        $("#submitModal").modal("hide");
        $("#loadingModal").modal({backdrop:"static"});

        $.ajax({
            url:$(this).attr("action"),
            type:"post",
            data:data,
            processData:false,
            contentType:false,
            success:function(data){
                if(data.err){
                    alert(JSON.stringify(data));
                }
                else location.reload();
            }
        });
    });
    $(".course-link").click(function(){
        var courseID=$(this).data("course-id");
        console.log(courseID);
        writeCookie("monkeyWebAdminAllcourseSelectedCourseID",courseID);
        self.location="/adminCoursedescription";
    });
});
