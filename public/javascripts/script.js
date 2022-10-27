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

