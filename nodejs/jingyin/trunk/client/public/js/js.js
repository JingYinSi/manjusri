/**
 * Created by zhangjian on 16/10/9.
 */
function parseLinksInHeader(linksInHeader) {
    var linkages = {}
    var links = linksInHeader.split(',');
    links.forEach(function (str) {
        var segs = str.split(';');
        var linkStr = $.trim(segs[0]);
        var relStr = $.trim(segs[1]);
        var rel = relStr.substr(5, relStr.length - 6);
        var link = linkStr.substr(1, linkStr.length - 2);
        linkages[rel] = link;
    });
    return linkages;
}

function requestDoTansaction(data) {
    var url = '/jingyin/rest/virtues/prepay';
    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        success: function (data, textStatus, request) {
            var linkages = parseLinksInHeader(request.getResponseHeader('link'));
            alert(linkages.pay);
            window.location = linkages.pay;
        }
    });
}

$(function() {
    $('.nav .nav_click').click(function () {
        $(this).find('dl').toggle();
    });

    $('.jian').click(function () {
        if (Number($('.val').html())>=2) {
            $('.val').html(Number($('.val').html())-1);
        }
    });
    $('.jian,.jia').mousedown(function () {
        $(this).css("background","#d9c879");
    });

    $('.jian,.jia').mouseup(function () {
        $(this).css("background","#fdf6d5");
    });
    $('.jia').click(function () {
        $('.val').html(Number($('.val').html())+1);
    });

    $('.btn').click(function () {
        $('.pop').show();
    });

    $('.pop dd').click(function () {
        $('.pop').hide();
    });

    $('.text1 .a4').focus(function () {
        $(this).hide();
        $('.text1 .a5').show();
        $('.text1 .a5').focus();
    });

    $('.text1 .a5').blur(function () {
        if ($(this).val()=='' || $(this).val()==undefined) {
            $(this).hide();
            $('.text1 .a4').show();
        }
    })

    $('.text2 .a2').focus(function () {
        $(this).hide();
        $('.text2 .a3').show();
        $('.text2 .a3').focus();
    });

    $('.text2 .a3').blur(function () {
        if ($(this).val()=='' || $(this).val()==undefined) {
            $(this).hide();
            $('.text2 .a2').show();
        }
    })

    $('.pop .a4').focus(function () {
        $(this).hide();
        $('.pop .a5').show();
        $('.pop .a5').focus();
    });

    $('.pop .a5').blur(function () {
        if ($(this).val()=='' || $(this).val()==undefined) {
            $(this).hide();
            $('.pop .a4').show();
        }
    })
})

