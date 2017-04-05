$(document).ready(function(){
    $(".clickShowDiv").click(function(){
        $(this).closest("li").css("left","-80px").find(".clickShowDiv").css("display","block");

    })
});