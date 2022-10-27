// COMP3322 - Assignment 1
// ZHU Ziyao - 3035772145

'use strict'


$(document).ready( () => {
    $.ajax({
        type: 'GET',
        url: '/load',
        success: (res) => {
            if (res !== '') { load(res); }
        },
        error: (res) => { console.error(res); }
    });
});

function login(ev) {
    ev.preventDefault();

    if (!$('#username_input > input').val() || !$('#password_input > input').val()) {
        alert('Please enter username and password');
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/login',
        data: $(ev.target).serialize(),
        success: (res) => {
            if (res === 'Login failure') { alert(res); }
            else { load(res); }
        },
        error: (res) => { console.error(res); }
    });
}

function logout() {
    $.ajax({
        type: 'GET',
        url: '/logout',
        complete: () => { location.reload(); }
    });
}

function get_album(userid, page) {
    $.ajax({
        url: '/getalbum',
        type: 'GET',
        data: $.param([
            { name: "userid", value: userid },
            { name: "pagenum", value: page }
        ]),
        success: (res) => {
            $('#album').html('');
            for (let item of res['page_contents']) {
                gen_item_div(item).appendTo('#album');
            }
            $('#views').show();
            disp_pagenation(userid, page);
        },
        error: (err) => { console.error(err); }

    });
}

function load(res) {
    $('#login_form').hide();
    $('.username').text(res.albums[0].name);
    $('#motd').show();

    localStorage.clear();
    for (let i=0; i<res.albums.length; i++) {
        let album = res.albums[i];
        localStorage.setItem(album['id'], album['total_pages']);
        gen_album_li(album, (i===0)).appendTo('#albums_ul');
    }

    $('#albums').show();
}

function turnto(dir) {
    get_album(( $('#pagenation').data('userid') ), ( $('#pagenation').data('current_page') + dir ));
}

function post_like(ev) {
    let item_id = ev.target.parentElement.parentElement.id;
    $.ajax({
        url: '/postlike',
        type: 'POST',
        data: 'photovideoid=' + item_id.slice(5),
        success: function (data) {
            $(`#${item_id} > .liked`).replaceWith(gen_liked_div(data['likedby']));
            ev.target.setAttribute('disabled', true);
        }
    });
}

function gen_album_li(album, my) {
    let album_li = $('<li>', {
        id: 'album_' + album['id'],
        onclick: `get_album("${album['id']}", 0)`
    });

    let profile = $('<div>', {class: 'profile'});
    $('<img>', {
        title: album['name'],
        src: album['profile'],
        alt: album['name']
    }).appendTo(profile);

    let text;
    if (my) {
        text = 'My album';
    } else {
        text = `${album['name']}'s album`;
    }
    let album_name = $('<div>', {
            class: "album_name",
            text: text
    });

    profile.appendTo(album_li);
    album_name.appendTo(album_li);

    return album_li;
}

function gen_item_div(item) {
    let item_div = $('<div>', {
        id: 'item_' + item['_id'].toString(),
        class: 'item'
    });
    let media_div = $('<div>', {class: 'media'});

    let tag = '<img>';
    let attributes = {
        src: item['url'],
        onclick: 'show_item(event)'
    }
    if (item['url'].slice(-3) === 'mp4') {
        tag = '<video>';
        attributes['autoplay'] = true;
        attributes['loop'] = true;
        attributes['muted'] = true;
    }

    let like_button = $('<button>', {
        class: 'like_button',
        onclick: 'post_like(event);',
        html: '&#x2665'
    })
    if ( item['likedby'].includes($('.username').text()) ) {
        like_button.prop('disabled', true);
    }

    $(tag, attributes).appendTo(media_div);
    like_button.appendTo(media_div);
    media_div.appendTo(item_div);
    gen_liked_div(item['likedby']).appendTo(item_div);

    return item_div;
}

function gen_liked_div(likedby) {
    let liked_div = $('<div>', {class: 'liked'})
    if (likedby.length === 0) {
        return liked_div;
    }

    liked_div.html(likedby.join(', ') + '<br>liked this photo!');
    return liked_div;
}

function disp_pagenation(userid, current_page) {
    let total_pages = localStorage.getItem(userid);
    $('#footer').text(`${current_page+1} / ${total_pages}`)
    $('#pagenation > button').prop('disabled', true);

    if (current_page !== 0) {
        $('#previous').prop('disabled', false);
    }
    if (current_page !== total_pages - 1) {
        $('#next').prop('disabled', false);
    }

    $('#pagenation')
        .data('current_page', current_page)
        .data('userid', userid)
}

