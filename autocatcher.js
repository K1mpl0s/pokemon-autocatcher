const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const unirest = require('unirest');

/* global variables */
var token;
var prefix;
var groups;
var legends = false;
var groups = [];
var mewbot = false;
const legie = ['articuno', 'zapdos', 'moltres', 'mew', 'mewtwo', 'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'celebi', 'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys', 'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia', 'phione', 'manaphy', 'darkrai', 'shaymin', 'arceus', 'victini', 'cobalion', 'terrakion', 'virizion', 'tornadus', 'thundurus', 'reshiram', 'zekrom', 'landorus', 'kyurem', 'keldeo', 'meloetta', 'genesect', 'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa', 'volcanion', 'type: null', 'silvally', 'tapu koko', 'tapu lele', 'tapu bulu', 'tapu fini', 'cosmog', 'cosmoem', 'solgaleo', 'lunala', 'nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana', 'guzzlord', 'necrozma', 'magearna', 'marshadow', 'poipole', 'naganadel', 'stakataka', 'blacephalon', 'zeraora', 'meltan', 'melmetal'];
var hasCRC;
var crc;
var wCRC;
try {
    crc = require('crc');
    crc.crc32(Buffer.from('test')).toString('16');
    console.log('CRC installed correctly.');
    hasCRC = true;
    wCRC = 1;
} catch (err) {
    console.log('No CRC installed.');
    try {
        crc = require('node-crc');
        crc.crc32(Buffer.from('test')).toString('hex');
        console.log('node-CRC is installed correctly.');
        hasCRC = true;
        wCRC = 2;
    } catch (err) {
        console.log('No node-CRC installed.');
        hasCRC = false;
        process.exit();
    }
}

function loadConfig() {
    var file = fs.readFileSync('./config.txt', 'utf8');
    var spl = file.split('\n');
    spl.forEach(e => {
        if (e[0] == 't' && e.includes(':')) {
            if (!e.includes('replaceThisTextWithToken')) {
                token = e.split(':')[1].trim();
            } else {
                console.log('No token provided in config.');
                process.exit();
            }
        }
        if (e[0] == 'l' && e.includes(':')) {
            var bol = e.split(':')[1].trim();
            if (bol == 'true') legends = true;
            if (bol == 'false') legends = false;
        }
        if (e[0] == 'p' && e.includes(':')) prefix = e.split(':')[1].trim();
        if (e[0] == 'm' && e.includes(':')) {
            var bol = e.split(':')[1].trim();
            if (bol == 'true') mewbot = true;
            if (bol == 'false') mewbot = false;
        }
    });
    var ids = file.slice(file.indexOf('groups:') + 6, file.indexOf('/*')).split('\n');
    ids.forEach(e => {
        if (!e.includes('group id (replace this)')) {
            groups.push(e.trim());
        } else {
            console.log('No group ids provided in config.');
            process.exit();
        }
    });
}
loadConfig();

/*
Ready handler
*/
client.on('ready', () => {
    try {
        console.log('Node.js version: ' + process.version + '\nDiscord.js version: ' + Discord.version);
        init();
    } catch (error) {
        console.log('READY: ' + error);
    }
});

/*
Error handler
*/
client.on('error', () => {
    try {
        console.log('ERROR: ' + error);
    } catch (err) {
        console.log(err);
    }
});

function init() {
    if (client != undefined) {
        let gnum = client.guilds.size;
        let cnum = client.channels.array().length;
        let unum = client.users.array().length;
        console.log(gnum + ' guilds, ' + cnum + ' channels, ' + unum + ' members.');
    }
}

/*
Message event handler.
*/
client.on('message', message => {
    try {
        var args = message.content.split(' ');
        if (message.author.id == client.user.id) {
            if (args[0].toLowerCase() == prefix + 'legends') {
                legends ? legends = false : legends = true;
                console.log('Legends: ' + legends);
                message.delete();
            }
            if (args[0].toLowerCase() == prefix + 'mewbot') {
                mewbot ? mewbot = false : mewbot = true;
                console.log('Mewbot: ' + mewbot);
                message.delete();
            }
            if (args[0].toLowerCase() == prefix + 'spam') {
                if (args[1] != null && args[2] != null && args[3] != null) {
                    delete args[0];
                    var time = args[1];
                    delete args[1];
                    var between = args[2];
                    delete args[2];
                    var msg = args.join(' ');
                    var interval = setInterval(function () {
                        --time;
                        if (time != 1) {
                            message.channel.send(msg);
                        } else {
                            clearInterval();
                        }
                    }, between);
                } else {
                    console.log("Invalid syntax. (" + prefix + "spam <milliseconds> <milisec between each msg> <message>)");
                }
                message.delete();
            }
        }

        if (message.channel.type != 'dm' && groups.includes(message.guild.id)) {
            message.embeds.forEach((embed) => {
                if (embed.title === 'A wild pokémon has appeared!') {
                    var cmd = embed.description.slice(embed.description.indexOf('type ') + 4, embed.description.indexOf(' <pokémon>'));
                    client.channels.get(message.channel.id).startTyping();
                    if (embed.image != undefined) {
                        var request = unirest.get(embed.image.url);
                        request.end(function (res) {
                            if (fs.existsSync('./pokemon.json')) {
                                if (hasCRC) {
                                    if (wCRC == 1) var idef = crc.crc32(Buffer.from(res.body)).toString('16');
                                    if (wCRC == 2) var idef = crc.crc32(Buffer.from(res.body)).toString('hex');
                                    var json = JSON.parse(fs.readFileSync('./pokemon.json', 'utf8'));
                                    console.log(json[idef] + ' spawned in ' + message.guild.name + ' > ' + message.channel.name);
                                    if (!legends) {
                                        if (json[idef] != 'undefined' && json[idef] != undefined) message.channel.send(cmd + ' ' + json[idef]);
                                    }
                                    if (legends) {
                                        if (legie.includes(json[idef])) {
                                            if (json[idef] != 'undefined' && json[idef] != undefined) message.channel.send(cmd + ' ' + json[idef]);
                                        }
                                    }
                                    client.channels.get(message.channel.id).stopTyping();
                                }
                            }
                        });
                    }
                }
                if (embed.title === 'A wild Pokémon has Spawned, Say its name to catch it!' && mewbot) {
                    client.channels.get(message.channel.id).startTyping();
                    if (embed.image != undefined) {
                        var request = unirest.get(embed.image.url);
                        request.end(function (res) {
                            if (fs.existsSync('./mewbot.json')) {
                                if (hasCRC) {
                                    if (wCRC == 1) var idef = crc.crc32(Buffer.from(res.body)).toString('16');
                                    if (wCRC == 2) var idef = crc.crc32(Buffer.from(res.body)).toString('hex');
                                    var json = JSON.parse(fs.readFileSync('./mewbot.json', 'utf8'));
                                    console.log(json[idef] + ' spawned in ' + message.guild.name + ' > ' + message.channel.name + ' (mewbot)');
                                    if (!legends) {
                                        if (json[idef] != 'undefined' && json[idef] != undefined) message.channel.send(json[idef]);
                                    }
                                    if (legends) {
                                        if (legie.includes(json[idef])) {
                                            if (json[idef] != 'undefined' && json[idef] != undefined) message.channel.send(json[idef]);
                                        }
                                    }
                                    client.channels.get(message.channel.id).stopTyping();
                                }
                            }
                        });
                    }
                }
            });
        }

    } catch (err) {
        console.log('MESSAGE: ' + err);
    }
});

client.login(token);
