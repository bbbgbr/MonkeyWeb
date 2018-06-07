async function verify(){
    if(!($('#usr').val()&&$('#pwd').val())) return alert('Please insert id and password')
    let id = parseInt($('#usr').val())
    let encryptPwd = CryptoJS.SHA3($('#pwd').val()).toString()
    try {
        console.log(id,encryptPwd)
        let v = await $.post('post/v1/verifyRegisUser',{
            id:id,
            pwd:encryptPwd
        })
        if(!v.verified) alert('Authorize failed')
        else {
            writeCookie('vid',id)
            writeCookie('vpw',encryptPwd)
            location.reload()
        }    
    } catch (error) {
        alert('An error occur')
    }
}

$(document).ready(function(){
    $('#btn').click(function(){
        verify()
    })
    $('#usr,#pwd').on('keydown',function(e){
        if(e.which == 13) $('#btn').click()
    })
})