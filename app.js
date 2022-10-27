// COMP3322 - Assignment 1
// ZHU Ziyao - 3035772145

'use strict'


const ITEM_PER_PAGE = 6;

const path = require('path');
const monk = require('monk');
const logger = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const db = monk('127.0.0.1:27017/album');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use( (req, _, next) => {
    req.user_list = db.get('userList');
    req.media_list = db.get('mediaList');
    next();
});


app.get('/load', async (req, res) => {
    if (req.cookies.user_id) {
        try {
            let user_docs = await req.user_list.find({_id: monk.id(req.cookies.user_id)});
            let albums = await load(user_docs, req);
            res.json({albums: albums});
        } catch (err) {
            console.error(err);
            res.send(err);
        }
    } else {
        res.send();
    }
});

app.post('/login', async (req, res) => {
    try {
        let user_docs = await req.user_list.find({username: req.body.username});
        if (user_docs.length !== 0 && user_docs[0]['password'] === req.body.password) {
            res.cookie('user_id', user_docs[0]['_id'], {maxAge: 30*60*1000});
            let albums = await load(user_docs, req);
            res.json({albums: albums});
        } else {
            res.send('Login failure');
        }
    } catch (err) {
        console.error(err);
        res.send(err);
    }
});

app.get('/logout', (_, res) => {
    res.clearCookie('user_id');
    res.send();
});

app.get('/getalbum', async (req, res) => {
    let target_id = req.query['userid'];
    if (target_id === '0') {
        target_id = req.cookies.user_id;
    }
    try {
        let media_docs = await req.media_list.find({userid: target_id}, {
            skip: parseInt(req.query['pagenum']) * ITEM_PER_PAGE,
            limit: ITEM_PER_PAGE
        });
        res.json({page_contents: media_docs});
    } catch (err) {
        console.error(err);
        res.send(err);
    }
});

app.post('/postlike', async (req, res) => {
    let username = (await req.user_list.find({_id: monk.id(req.cookies.user_id)}))[0]['username'];
    let media_id_obj = monk.id(req.body.photovideoid);
    let liked_list = (await req.media_list.find({_id: media_id_obj}))[0]['likedby'];
    if (! liked_list.includes(username)) {
        liked_list.push(username);
        req.media_list.update({_id: media_id_obj}, {$set: {likedby: liked_list}});
    }
    res.json({likedby: liked_list});
})


async function load(user_docs, req) {
    let album_docs = await Promise.all(user_docs[0]['friends'].map( async (friend) => {
        return ( await req.user_list.find({username: friend}) )[0];
    }));
    album_docs.unshift(user_docs[0]);

    let albums = await Promise.all(album_docs.map( async (album_doc) => {
        let userid = album_doc['_id'].toString();
        return {
            name: album_doc['username'],
            id: userid,
            total_pages: Math.ceil( (await req.media_list.count({userid: userid})) / ITEM_PER_PAGE ),
            profile: ( await req.media_list.find({userid: userid}, {limit: 1}) )[0]['url']
        };
    }))

    albums[0]['id'] = '0';

    return albums;
}


app.listen(8081);

