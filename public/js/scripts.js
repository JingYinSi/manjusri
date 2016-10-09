/**
 * Created by sony on 2016/9/25.
 */
$(function () {
    $('#post-comment').hide();
    $('#btn-comment').on('click', function (event) {
        event.preventDefault();
        $('#post-comment').show();
    });

    $('#btn-like').on('click', function (event) {
        event.preventDefault();
        var imgId = $(this).data('id');
        $.post('/images/' + imgId + '/like').done(function (data) {
            $('.likes-count').text(data.likes);
        });
    });

    $('#btn-delete').on('click', function (event) {
        event.preventDefault();
        var $this = $(this);
        var remove = confirm('Are you sure to delete this image?');
        if(remove){
            var imageId = $(this).data('id');
            $.ajax({
                url: '/images/' + imageId,
                type: 'DELETE',
            }).done(function (result) {
                if(result){
                    $this.removeClass('btn-danger').addClass('btn-success');
                    $this.find('i').removeClass('fa-times').addClass('fa-check');
                    $this.append('<span>Deleted</span>');
                }
            });
        }
    });
})