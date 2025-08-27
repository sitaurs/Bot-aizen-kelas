// Creator Lexzyofficial //
//Creator Lexzykarket //
//sc ini free dilarang ada yg jual//
//jual? siap"hytam//
require('./config');

const fs = require('fs');
const axios = require('axios');
const chalk = require("chalk");
const jimp = require("jimp")
const util = require("util");
const moment = require("moment-timezone");
const path = require("path")
const os = require('os')
const fetch = require("node-fetch");
const crypto = require('crypto');
const { SnackVideo } = require('./lib/function/snackvideo')
const { pinterest, pinterest2, remini, mediafire, tiktokDl } = require('./lib/scraper');
const {
    spawn, 
    exec,
    webp2mp4File,
    execSync 
   } = require('child_process');
const { makeWASocket, makeCacheableSignalKeyStore, downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto, WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, PHONENUMBER_MCC, AnyMessageContent, useMultiFileAuthState, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header } = require('@whiskeysockets/baileys')

module.exports = Lexzy = async (Lexzy, m, chatUpdate, store) => {
    try {
        const body = (
            m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
            m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
            m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text : "");
        
        const sender = m.key.fromMe ? Lexzy.user.id.split(":")[0] + "@s.whatsapp.net" || Lexzy.user.id
: m.key.participant || m.key.remoteJid;
        
        const senderNumber = sender.split('@')[0];
        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefa = ["", "!", ".", ",", "🐤", "🗿"];

        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const contacts = JSON.parse(fs.readFileSync("./lib/database/contacts.json"))
        const premium = JSON.parse(fs.readFileSync("./lib/database/premium.json"))
        const premium2 = JSON.parse(fs.readFileSync("./lib/database/premium2.json"))
        const kontributor = JSON.parse(fs.readFileSync('./lib/database/owner.json'));
        const botNumber = await Lexzy.decodeJid(Lexzy.user.id);
        const dev = [botNumber, ...kontributor, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const command2 = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const prem = dev ? true : premium.includes(m.sender)
        const prem2 = dev ? true : premium2.includes(m.sender)
        const text = q = args.join(" ");
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const isMedia = /image|video|sticker|audio/.test(mime);
        const cmd = prefix + command

        const groupMetadata = isGroup ? await Lexzy.groupMetadata(m.chat).catch((e) => {}) : "";
        const groupOwner = isGroup ? groupMetadata.owner : "";
        const groupName = m.isGroup ? groupMetadata.subject : "";
        const participants = isGroup ? await groupMetadata.participants : "";
        const groupAdmins = isGroup ? await participants.filter((v) => v.admin !== null).map((v) => v.id) : "";
        const groupMembers = isGroup ? groupMetadata.participants : "";
        const isGroupAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
        const isBotGroupAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
        const {
            smsg,
            fetchJson, 
            sleep,
            formatSize,
            tanggal
            } = require('./lib/myfunction');
            
            
if (m.message) {
            console.log('\x1b[30m--------------------\x1b[0m');
            console.log(chalk.bgHex("#e74c3c").bold(`❏ Assistant Message`));
            console.log(
                chalk.bgHex("#18b8db").black(
                    `   ☯︎ Tanggal: ${new Date().toLocaleString()} \n` +
                    `   ☯︎ Pesan: ${m.body || m.mtype} \n` +
                    `   ☯︎ Pengirim: ${pushname} \n` +
                    `   ☯︎ JID: ${senderNumber}`
                )
            );
            
            if (m.isGroup) {
                console.log(
                    chalk.bgHex("#18b8db").black(
                        `   ☯︎ Grup: ${groupName} \n` +
                        `   ☯︎ GroupJid: ${m.chat}`
                    )
                );
            }
            console.log();
        }
        
        const reaction = async (jidss, emoji) => {
            Lexzy.sendMessage(jidss, {
                react: {
                    text: emoji,
                    key: m.key 
                } 
            })
        };

async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}
let resize = async (image, width, height) => {
    let oyy = await jimp.read(image)
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(jimp.MIME_JPEG)
    return kiyomasa
}
const createSerial = (size) => {
return crypto.randomBytes(size).toString('hex').slice(0, size)
} 
async function toCloudGood(filePath) {
 try {
 const form = new FormData();
 form.append("fileToUpload", fs.createReadStream(filePath));
 form.append("reqtype", "fileupload");

 const response = await axios.post("https://cloudgood.web.id/upload.php", form, {
 headers: {
 ...form.getHeaders(),
 "User-Agent": "Mozilla/5.0"
 },
 maxBodyLength: Infinity,
 maxContentLength: Infinity
 });

 return response.data;
 } catch (error) {
 return `Error Catbox: ${error.message}`;
 }
}

const qloc = {
  key: {
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    extendedTextMessage: {
      text: "𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 𝙂𝙖𝙣𝙩𝙚𝙣𝙜!!",
      contextInfo: {
        mentionedJid: [],
        stanzaId: "",
        participant: "",
        quotedMessage: {
          extendedTextMessage: {
            text: ""
          }
        },
        externalAdReply: {
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnail: "",
          thumbnailUrl: "",
          title: "WhatsApp",
          mediaUrl: "",
          sourceUrl: ""
        }
      }
    }
  }
};

const fc = {
  key: {
    participant: `0@s.whatsapp.net`,
    ...(botNumber ? { remoteJid: `status@broadcast` } : {})
  },
  message: {
    locationMessage: {
      degreesLatitude: -6.175392,
      degreesLongitude: 106.827153,
      name: "𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 𝙂𝙖𝙣𝙩𝙚𝙣𝙜!!",
      address: "",
      url: ""
    }
  }
}
const BububLexzy = () => {
let n = Lexzy.sendMessage(m.chat, { audio: { url: 'https://files.catbox.moe/bjj8yg.opus' },mimetype: 'audio/mp4',ptt: true},{ quoted: qloc });}

async function reply(teks) {
            Lexzy.sendMessage(m.chat, { 
                text: teks,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        showAdAttribution: true,
                        isForwarded: true,
                        containsAutoReply: true,
                        title: `𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 𝙂𝙖𝙣𝙩𝙚𝙣𝙜!!!`,
                        body: ``,
                        previewType: "VIDEO",
                        thumbnailUrl: "https://b.top4top.io/p_3279htla70.jpg",
                        thumbnail: ``,
                        sourceUrl: `https://whatsapp.com/channel/0029Vb9i9eODJ6Gunb5Q6K0X`
                    }
                }
            }, { quoted: qloc });
        }
    let example = (teks) => {
return `\n*Contoh Penggunaan :*\nketik *${cmd}* ${teks}\n`
} 
  
switch (command) {
 
    case "menu": {
        reaction(m.chat, "✈️")
        let wow =   `🜲 \`𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙏𝙄𝙊𝙉 𝘽𝙊𝙏\` 🜲
给 𝘽𝙤𝙩 : 𝘾𝙥𝙖𝙣𝙚𝙡 𝙓 𝙋𝙪𝙨𝙝𝙆𝙤𝙣𝙩𝙖𝙠
给 𝗬𝗼𝘂𝗿 𝗡𝗮𝗺𝗲 : *${pushname}*
给 𝗖𝗿𝗲𝗮𝘁𝗼𝗿 : 𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭
给 𝗡𝗮𝗺𝗲𝗕𝗼𝘁 : 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 𝗟𝗲𝘅𝘇𝘆
给 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 𝟯.𝟮
给 𝗠𝗼𝗱𝗲 : ${Lexzy.public ? `𝗣𝘂𝗯𝗹𝗶𝘅` : `𝗣𝗿𝗶𝘃𝗮𝘁`}
给 𝗣𝗿𝗲𝗳𝗶𝘅 : 𝗠𝘂𝗹𝘁𝗶
给 𝗧𝘆𝗽𝗲 : 𝗖𝗮𝘀𝗲

🜲 \`𝙎𝙞𝙢𝙥𝙡𝙚 𝙈𝙚𝙣𝙪\` 🜲
么 _X-All_
么 _PushKntk_
么 _Cpanelmenu_
么 _Script_
么 _Owner_`
Lexzy.sendMessage(m.chat, {         
            video: { url: "https://files.catbox.moe/mbh91c.mp4" },  
            caption: wow,   
            mimetype: 'video/mp4',      
            gifPlayback: true,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterName: "𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 ϟ",
                    newsletterJid: `120363416262862080@newsletter` 
                },
                isForwarded: true,
            }
        },{ quoted: qloc }
     ),
    await sleep(1000)
        Lexzy.sendMessage(m.chat, { 
           audio: { url: 'https://files.catbox.moe/ch6775.mp3' },
           mimetype: 'audio/mp4', 
           ptt: true 
       },{ quoted: qloc }
     ); 
  };
 break;
        
        case "x-all": {
        reaction(m.chat, "✈️")
let wow = `🜲 \`𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙏𝙄𝙊𝙉 𝘽𝙊𝙏\` 🜲
给 𝘽𝙤𝙩 : 𝘾𝙥𝙖𝙣𝙚𝙡 𝙓 𝙋𝙪𝙨𝙝𝙆𝙤𝙣𝙩𝙖𝙠
给 𝗬𝗼𝘂𝗿 𝗡𝗮𝗺𝗲 : *${pushname}*
给 𝗖𝗿𝗲𝗮𝘁𝗼𝗿 : 𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭
给 𝗡𝗮𝗺𝗲𝗕𝗼𝘁 : 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 𝗟𝗲𝘅𝘇𝘆
给 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 𝟯.𝟮
给 𝗠𝗼𝗱𝗲 : ${Lexzy.public ? `𝗣𝘂𝗯𝗹𝗶𝘅` : `𝗣𝗿𝗶𝘃𝗮𝘁`}
‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌
_*🜲 Owner Menu*_
么 _Test_
么 _Public_
么 _Self_
么 _AddPrem_
么 _AddOwner_
么 _AddPremUnli_
么 _DelOwner_
么 _DelPrem_
么 _DelPremUnli_

_*🜲 Group Menu*_
么 _Hidetag_
么 _kick_
么 _Open_
么 _Close_
么 _Promote_
么 _Demote_

_*🜲 Cpanel Menu*_
么 _1GB_
么 _2GB_
么 _3GB_
么 _4GB_
么 _5GB_
么 _6GB_
么 _7GB_
么 _8GB_
么 _9GB_
么 _10GB_
么 _Unli_
么 _Listserver_
么 _Delserver_
么 _ListUser_
么 _Deluser_
么 _Cadmin_
么 _Listadmin_
么 _Deladmin_

_*🜲 PushKontak Menu*_
么 _PushKontak_
么 _PushKontak2_
么 _SaveKontak_
么 _SaveKontak2_
么 _idgc_
么 _Listgc_
么 _Jpm_
么 _Jpm2_
么 _JpmHt_

_*🜲 Store Menu*_
么 _FormatJp_
么 _Nope_
么 _Done_

_*🜲 Tools Menu*_
么 _Tourl_
么 _Reactch_
么 _Play_
么 _Tiktok_
么 _Rvo_`
Lexzy.sendMessage(m.chat, {         
            image: { url: "https://b.top4top.io/p_3279htla70.jpg" },   
            caption: wow,   
            gifPlayback: true,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterName: "𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 ϟ",
                    newsletterJid: `120363416262862080@newsletter` 
                },
                isForwarded: true,
            }
        },{ quoted: qloc }
     ),
    await sleep(1000)
        Lexzy.sendMessage(m.chat, { 
           audio: { url: 'https://files.catbox.moe/ch6775.mp3' },
           mimetype: 'audio/mp4', 
           ptt: true 
       },{ quoted: qloc }
     ); 
  };
 break;
        case "cpanelmenu": {
        reaction(m.chat, "✈️")
let wow = `🜲 \`𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙏𝙄𝙊𝙉 𝘽𝙊𝙏\` 🜲
给 𝘽𝙤𝙩 : 𝘾𝙥𝙖𝙣𝙚𝙡 𝙓 𝙋𝙪𝙨𝙝𝙆𝙤𝙣𝙩𝙖𝙠
给 𝗬𝗼𝘂𝗿 𝗡𝗮𝗺𝗲 : *${pushname}*
给 𝗖𝗿𝗲𝗮𝘁𝗼𝗿 : 𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶
给 𝗡𝗮𝗺𝗲𝗕𝗼𝘁 : 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 𝗟𝗲𝘅𝘇𝘆
给 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 𝟯.𝟮
给 𝗠𝗼𝗱𝗲 : ${Lexzy.public ? `𝗣𝘂𝗯𝗹𝗶𝘅` : `𝗣𝗿𝗶𝘃𝗮𝘁`}
‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌
_*🜲 Cpanel Menu*_
么 _1GB_
么 _2GB_
么 _3GB_
么 _4GB_
么 _5GB_
么 _6GB_
么 _7GB_
么 _8GB_
么 _9GB_
么 _10GB_
么 _Unli_
么 _Listserver_
么 _Delserver_
么 _ListUser_
么 _Deluser_
么 _Cadmin_
么 _Listadmin_
么 _Deladmin_`
Lexzy.sendMessage(m.chat, {         
            image: { url: "https://b.top4top.io/p_3279htla70.jpg" },  
            caption: wow,   
            gifPlayback: true,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterName: "𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 ϟ",
                    newsletterJid: `120363416262862080@newsletter` 
                },
                isForwarded: true,
            }
        },{ quoted: qloc }
     ),
    await sleep(1000)
        Lexzy.sendMessage(m.chat, { 
           audio: { url: 'https://files.catbox.moe/ch6775.mp3' },
           mimetype: 'audio/mp4', 
           ptt: true 
       },{ quoted: qloc }
     ); 
  };
 break; 
        case "pushkntk": {
        reaction(m.chat, "✈️")
let wow = `🜲 \`𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙏𝙄𝙊𝙉 𝘽𝙊𝙏\` 🜲
给 𝘽𝙤𝙩 : 𝘾𝙥𝙖𝙣𝙚𝙡 𝙓 𝙋𝙪𝙨𝙝𝙆𝙤𝙣𝙩𝙖𝙠
给 𝗬𝗼𝘂𝗿 𝗡𝗮𝗺𝗲 : *${pushname}*
给 𝗖𝗿𝗲𝗮𝘁𝗼𝗿 : 𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶
给 𝗡𝗮𝗺𝗲𝗕𝗼𝘁 : 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 𝗟𝗲𝘅𝘇𝘆
给 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 𝟯.𝟮
给 𝗠𝗼𝗱𝗲 : ${Lexzy.public ? `𝗣𝘂𝗯𝗹𝗶𝘅` : `𝗣𝗿𝗶𝘃𝗮𝘁`}
‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌
_*🜲 PushKontak Menu*_
么 _PushKontak_
么 _PushKontak2_
么 _SaveKontak_
么 _SaveKontak2_
么 _idgc_
么 _Listgc_
么 _Jpm_
么 _Jpm2_
么 _JpmHt_`
Lexzy.sendMessage(m.chat, {         
            image: { url: "https://b.top4top.io/p_3279htla70.jpg" },  
            caption: wow,   
            gifPlayback: true,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterName: "𝐋𝐞𝐱𝐳𝐲 𝐦𝐚𝐫𝐤𝐞𝐭🥶 ϟ",
                    newsletterJid: `120363416262862080@newsletter` 
                },
                isForwarded: true,
            }
        },{ quoted: qloc }
     ),
    await sleep(1000)
        Lexzy.sendMessage(m.chat, { 
           audio: { url: 'https://files.catbox.moe/ch6775.mp3' },
           mimetype: 'audio/mp4', 
           ptt: true 
       },{ quoted: qloc }
     ); 
  };
 break;
        case 'tourl': {
const FormData = require("form-data");
const { fromBuffer } = require("file-type");
const fakeUserAgent = require("fake-useragent");
const { filesize } = require('filesize');
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        const createFormData = (content, fieldName, ext) => {
 const { mime } = fromBuffer(content) || {};
 const formData = new FormData();
 formData.append(fieldName, content, `${new Date()}.${ext}`);
 return formData;
};

const catbox = async (content) => {
 try {
 /*
 @ CatBox Uploader
 $ Create by Syaii
 */
 const { ext, mime } = (await fromBuffer(content)) || {};
 const formData = createFormData(content, "fileToUpload", ext);
 formData.append("reqtype", "fileupload");
 const response = await fetch("https://catbox.moe/user/api.php", {
 method: "POST",
 body: formData,
 headers: {
 "User-Agent": fakeUserAgent(),
 },
 });
 return await response.text();
 } catch (error) {
 throw false;
 }
 }
        if (!mime) return reply('reply media!')
        reply("Mohon Tunggu Sebentar...")
        let media = await q.download()
        let link = await catbox(media)
        let size = await fetch(link)
        size = await size.text()
        size = await filesize(size.length)
        let caption = `*SUCCES UPLOAD A FILE*

📊 *S I Z E :* ${size} Byte
🔗 *L I N K :* ${link} !
`
await Lexzy.sendMessage(m.chat,{image: {url: link}, caption: caption }, { quoted: qloc })
}
break 
        case "addprem": {
if (!dev) return BububLexzy()
if (!text && !m.quoted) return reply("6285###")
const input = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
const input2 = input.split("@")[0]
if (input2 === global.owner || premium.includes(input) || input === botNumber) return reply(`Nomor ${input2} sudah menjadi reseller!`)
premium.push(input)
await fs.writeFileSync("./lib/database/premium.json", JSON.stringify(premium, null, 2))
reply(`\`[!] Succesfully\` ✅`)
}
break
case "addpremunli": {
if (!dev) return BububLexzy()
if (!text && !m.quoted) return reply("6285###")
const input = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
const input2 = input.split("@")[0]
if (input2 === global.owner || premium2.includes(input) || input === botNumber) return reply(`Nomor ${input2} sudah menjadi reseller!`)
premium2.push(input)
await fs.writeFileSync("./lib/database/premium2.json", JSON.stringify(premium2, null, 2))
reply(`\`[!] Succesfully\` ✅`)
}
break
    case "addowner": {
if (!dev) return BububLexzy()
if (!text && !m.quoted) return reply("6285###")
const input = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
const input2 = input.split("@")[0]
if (input2 === global.owner || kontributor.includes(input) || input === botNumber) return reply(`Nomor ${input2} sudah menjadi owner!`)
kontributor.push(input)
await fs.writeFileSync("./lib/database/owner.json", JSON.stringify(kontributor, null, 2))
reply(`\`[!] Succesfully\` ✅`)
}
break
case 'delowner': {
if (!dev) return BububLexzy()
    if (!args[0]) return reply(`siapa yang mau di ${command}? gunakan nomor/tag, contoh : ${prefix}delprem @tag`)
    let users = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    const idExists = kontributor.includes(users)
    if (!idExists) return reply("bukan owner gw ini mah")
    let data = await Lexzy.onWhatsApp(users)
    if (data[0].exists) {
        let kontributor = JSON.parse(fs.readFileSync('./lib/database/owner.json'));
        kontributor.splice(kontributor.includes(users), 1)
        fs.writeFileSync('./lib/database/owner.json', JSON.stringify(kontributor))
        reply(`\`[!] Succesfully\` ✅`)
    } else {
        reply("not found")
    }
}
break 
case 'delprem': {
if (!dev) return BububLexzy()
    if (!args[0]) return reply(`siapa yang mau di ${command}? gunakan nomor/tag, contoh : ${prefix}delprem @tag`)
    let users = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    const idExists = premium.includes(users)
    if (!idExists) return reply("bukan user premium ini mah")
    let data = await Lexzy.onWhatsApp(users)
    if (data[0].exists) {
        let premium = JSON.parse(fs.readFileSync('./lib/database/premium.json'));
        premium.splice(premium.includes(users), 1)
        fs.writeFileSync('./lib/database/premium.json', JSON.stringify(premium))
        reply(`\`[!] Succesfully\` ✅`)
    } else {
        reply("not found")
    }
}
break 
case 'delpremunli': {
if (!dev) return BububLexzy()
    if (!args[0]) return reply(`siapa yang mau di ${command}? gunakan nomor/tag, contoh : ${prefix}delprem @tag`)
    let users = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    const idExists = premium2.includes(users)
    if (!idExists) return reply("bukan user premium ini mah")
    let data = await Lexzy.onWhatsApp(users)
    if (data[0].exists) {
        let premium2 = JSON.parse(fs.readFileSync('./lib/database/premium2.json'));
        premium2.splice(premium2.includes(users), 1)
        fs.writeFileSync('./lib/database/premium2.json', JSON.stringify(premium2))
        reply(`\`[!] Succesfully\` ✅`)
    } else {
        reply("not found")
    }
}
break
    case "test": {
        if (!dev) return
        if (!prem && !prem2) return
        reply (`
_\`Bot Assistant-Lexzy On\`_☑️
*_Status : ${Lexzy.public ? `Publix` : `Privat`}_*
> *_Creator By Lexzymarket_*
`)
    } break
     
case "public":{
                if (!dev) return reaction(m.chat, '🚫') 
                Lexzy.public = true
                reaction(m.chat, '☑️')
            }
            break
            case "self":{
                if (!dev) return reaction(m.chat, '🚫') 
                Lexzy.public = false
                reaction(m.chat, '☑️') 
            }
            break
    case 'script': case "sc": {
        var teks = `
┏──────────────────┈ 
┃ ｢ _\`CHANNEL Lexzymarket\`_ ｣
┣──────────────────┈ 
┣┉〣 ｢ _\`Lexzymarket\`_ ｣ 〣┉
┃ • *Sering G.a Cuyy*
┃ • *Nyesel Gk Follow*
┃ • *\`Link Downlad Pencet Bawah\`*
*└───────────────┈ ⳹*
`
Lexzy.sendMessage(m.chat, {
                text: teks,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        showAdAttribution: true,
                        isForwarded: true,
                        containsAutoReply: true,
                        title: `𝘾𝙝𝙖𝙣𝙣𝙚𝙡 𝙇𝙖𝙭𝙯𝙮 𝙈𝙖𝙧𝙠𝙚𝙩`,
                        body: ``,
                        previewType: "VIDEO",
                        thumbnailUrl: "https://whatsapp.com/channel/0029VbB2wFrI1rcovTbVQw16",
                        thumbnail: ``,
                        sourceUrl: `https://whatsapp.com/channel/0029VbB2wFrI1rcovTbVQw16`
                    }
                }
            }, { quoted: qloc });
}
break
      
case "owner": {
        var teks = `
┏──────────────────┈ 
┃ ｢ _\`DEV ASSISTANT LEXZY\`_ ｣
┣──────────────────┈ 
┣┉〣 ｢ _\`Lexzymarket\`_ ｣ 〣┉
┃ • *Jangan Spam Owner*
┃ • *Jangan Telpon/Call Owner*
┃ • *Chat Langsung ke intinya aja*
┃ • *Kalo Ada Saran Fitur Chat Ae*
*└───────────────┈ ⳹*
`
Lexzy.sendMessage(m.chat, {
                text: teks,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        showAdAttribution: true,
                        isForwarded: true,
                        containsAutoReply: true,
                        title: `𝘾𝙤𝙣𝙩𝙖𝙘𝙩 𝙇𝙖𝙭𝙯𝙮 𝙈𝙖𝙧𝙠𝙚𝙩🥶`,
                        body: `CLICK DISINI UNTUK CHAT LEXZY!!`,
                        previewType: "VIDEO",
                        thumbnailUrl: "https://t.me/Lexzytesti",
                        thumbnail: ``,
                        sourceUrl: `https://t.me/Lexzytesti`
                    }
                }
            }, { quoted: qloc });
}
break

    case "nope": {
        let n = `_*All Payment BY Lexzy Market*_

*DANA* : ${global.dana}
*OVO* : ${global.ovo}
*GOVAY* : ${global.gopay}
\`< ! > WAJIB SS BUKTI TF\``
await Lexzy.sendMessage(m.chat, {  
            image: { url: global.qris },  
                caption: n ,
    }
 ), { quoted: qloc };
} break
        
    case "formatjp": {
        let jp = `
 *JASA POST [ BUKAN AKUN ADMIN ]*

SPEK:
AKUN:
LOGIN:
HARGA:
V2F/A2:
NO PENJUAL:

*SELALU GUNAKAN JASA ADMIN SETEMPAT AGAR TERHINDAR DARI PENIPUAN🙏🏻*`
    reply(jp)
    } break
      
    case "done": {
        let t = text.split(',');
        if (t.length < 2) return reply(example(`barang,nominal,payment`))
        let b = t[1];
        let n = t[2];
        let p = t[3];
     reply(`*TESTIMONIAL LEXZY MARKET*
PAY: *${p}*
BARANG : *${b}*
NOMINAL: *${n}*
TANGGAL TRANSAKSI: *${tanggal(Date.now())}*

NO RKBR & JP: 085930467004
NO REAL: 085930467004

\`TERIMAKASIH SUDAH MEMPERCAYAI SAYA LEXZYMARKET, MAAF YA BILA ADA KESALAHAN DALAM PELAYANAN KAMI\`

*YT: LEXZYMARKET*
*TELE: t.me/lexzytesti*
*IG: lexzymarket*
*SOSIAL MEDIA SAYA LAINNYA*
https://linktr.ee/lexzymarket `)
    } break
        
        case "hidetag": case "ht": case "z": {
if (!isGroup) return reply(messs.gb)
if (!dev) return BububLexzy()
if (!m.quoted && !text) return reply(example("teksnya/replyteks"))
var teks = m.quoted ? m.quoted.text : text
var member = await groupMetadata.participants.map(e => e.id)
Lexzy.sendMessage(m.chat, {text: teks, mentions: [...member]})
}
break 
        
       case "kick": case "piuu": case "door": {
if (!m.isGroup) return reply(messs.gb)
if (!dev && !isAdmins) return reply(mess.adm)
if (!isBotAdmins) return reply(mess.b)
if (text || m.quoted) {
const input = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : false
var onWa = await Lexzy.onWhatsApp(input.split("@")[0])
if (onWa.length < 1) return reply("Nomor tidak terdaftar di whatsapp")
const res = await Lexzy.groupParticipantsUpdate(m.chat, [input], 'remove')
await reply(`Berhasil mengeluarkan ${input.split("@")[0]} dari grup ini`)
} else {
return reply(example("@tag/reply\n\n*Command Lain :*\n.door\n.piuu\n.kick"))
}
}
break  
        
        case "demote":
case "promote": {
if (!m.isGroup) return reply(mess.gb)
if (!isBotAdmins) return reply(mess.b)
if (!isAdmins && dev) return reply(mess.adm)
if (m.quoted || text) {
var action
let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
if (/demote/.test(command)) action = "Demote"
if (/promote/.test(command)) action = "Promote"
await Lexzy.groupParticipantsUpdate(m.chat, [target], action.toLowerCase()).then(async () => {
await Lexzy.sendMessage(m.chat, {text: `Sukses ${action.toLowerCase()} @${target.split("@")[0]}`, mentions: [target]}, {quoted: m})
})
} else {
return reply(example("@tag/6285###"))
}
}
break
        
case "open": {
if (!isGroup) return reply(mess.gb)
if (!isBotAdmins) return reply(mess.b)
if (!isAdmins && !dev) return reply(mess.adm)
await Lexzy.groupSettingUpdate(m.chat, 'not_announcement')
reply("Berhasil Mengganti Setelan Grup Menjadi Anggota Dapat Mengirim Pesan")
}
break
case "close": {
if (!isGroup) return reply(mess.gb)
if (!isBotAdmins) return reply(mess.b)
if (!isAdmins && !dev) return reply(mess.adm)
await Lexzy.groupSettingUpdate(m.chat, 'announcement')
reply("Berhasil Mengganti Setelan Grup Menjadi Hanya Admin Yang Dapat Mengirim Pesan")
}
break 
        case "play":{
                if (!text) return reply(example(`blue yung kai\n`))
                await reaction(m.chat, '🔍')
                let mbut = await fetchJson(`https://ochinpo-helper.hf.space/yt?query=${text}`)
                let ahh = mbut.result
                let crot = ahh.download.audio

                Lexzy.sendMessage(m.chat, {
                    audio: { url: crot },
                    mimetype: "audio/mpeg", 
                    ptt: true
                }, { quoted: qloc })
            }
            break
        
    case "tt": case "tiktok": { 
    if (!text) return reply(example(`link`));
    if (!text.includes('tiktok')) return reply(`Link Invalid!!`);
    reply("Please Wait..");
    
    // Menggunakan fetch untuk akses API TikTok milikmu
    fetch(`https://api.tiklydown.eu.org/api/download/v5?url=${encodeURIComponent(text)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) return reply('Gagal mengambil data dari API');
            
            // Mengambil URL video dan audio
        const title = `*Successfully Bg ${pushname}! ✅*`
            const videoUrl = data.result.play;
            const audioUrl = data.result.music;
            
            // Mengirim video dan audio
            Lexzy.sendMessage(m.chat, { caption: title, video: { url: videoUrl }}, { quoted: qloc });
            Lexzy.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mp4' }, { quoted: qloc });
        })
        .catch(err => reply(err.toString()));
}
break
        case "rvo": case "r": {
if (!m.quoted) return reply(
`*❌Syntax Error!!*
*Example:* Reply ViewOnce with caption ${prefix + command}`);
try {
let buffer = await m.quoted.download();
let type = m.quoted.mtype;
let sendOptions = { quoted: qloc };
if (type === "videoMessage") {
await Lexzy.sendMessage(m.chat, { video: buffer, caption: m.quoted.text || "" }, sendOptions);
} else if (type === "imageMessage") {
await Lexzy.sendMessage(m.chat, { image: buffer, caption: m.quoted.text || "" }, sendOptions);
} else if (type === "audioMessage") {
await Lexzy.sendMessage(m.chat, { 
audio: buffer, 
mimetype: "audio/mpeg", 
ptt: m.quoted.ptt || false 
}, sendOptions);
} else {
return reaction(m.chat, "❌")
}} catch (err) {
console.error(err)}}
break;
        case 'reactch': {
    if (!args[0] || !dev) {
        return reply(example("https://whatsapp.com/channel/xxxx halo dunia\n\n*NOTE!!* Jangan menghina Admin Ch okee"));
                       }
    if (!args[0].startsWith("https://whatsapp.com/channel/")) {
        return reply("Link tautan tidak valid.");
    }

    const hurufGaya = {
        a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖',
        h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝',
        o: '🅞', p: '🅟', q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤',
        v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩',
        '0': '⓿', '1': '➊', '2': '➋', '3': '➌', '4': '➍',
        '5': '➎', '6': '➏', '7': '➐', '8': '➑', '9': '➒'
    };

    const emojiInput = args.slice(1).join(' ').toLowerCase();
    const emoji = emojiInput.split('').map(c => {
        if (c === ' ') return '―';
        return hurufGaya[c] || c;
    }).join('');

    try {
        const link = args[0];
        const channelId = link.split('/')[4];
        const messageId = link.split('/')[5];

        const res = await Lexzy.newsletterMetadata("invite", channelId);
        await Lexzy.newsletterReactMessage(res.id, messageId, emoji);

        return reply(`Berhasil mengirim reaction *${emoji}*`);
    } catch (e) {
        console.error(e);
        return reply("Gagal mengirim reaction. Pastikan link dan emoji valid.");
    }
};
break

        case "cekidch": case "idch": {
    if (!text) return reply(example("linkchnya"))
    if (!text.includes("https://whatsapp.com/channel/")) return reply("Link tautan tidak valid")
    let result = text.split('https://whatsapp.com/channel/')[1]
    try {
        let res = await Lexzy.newsletterMetadata("invite", result)
        if (!res) return reply("Gagal mengambil metadata")
        let teks = `
${res.id}
        `
        return reply(teks)
    } catch (error) {
        console.error(error);
        return reply("Terjadi kesalahan saat mengambil metadata");
    }
}
break
        case "pushkontak": {
if (!dev) return BububLexzy()
if (!isGroup) return reply(mess.gb)
if (!text) return reply(example("pesannya"))
var teks = text
const halls = await groupMetadata.participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
reply(`Memproses Mengirim Pesan Ke *${halls.length}* Member Grup`)
for (let mem of halls) {
if (mem !== m.sender) {
contacts.push(mem)
await fs.writeFileSync('./lib/database/contacts.json', JSON.stringify(contacts))
await Lexzy.sendMessage(mem, {text: teks}, {quoted: qloc})
await sleep(global.delaypushkontak)
}}
try {
const uniqueContacts = [...new Set(contacts)]
const vcardContent = uniqueContacts.map((contact, index) => {
const vcard = [
"BEGIN:VCARD",
"VERSION:3.0",
`FN:WA[${createSerial(2)}] ${contact.split("@")[0]}`,
`TEL;type=CELL;type=VOICE;waid=${contact.split("@")[0]}:+${contact.split("@")[0]}`,
"END:VCARD",
"", ].join("\n")
return vcard }).join("")
fs.writeFileSync("./lib/database/contacts.vcf", vcardContent, "utf8")
} catch (err) {
reply(err.toString())
} finally {
if (m.chat !== m.sender) await reply(`Berhasil Mengirim Pesan Ke *${halls.length} Member Grup*, File Contact Berhasil Dikirim ke Private Chat`)
await Lexzy.sendMessage(m.sender, { document: fs.readFileSync("./lib/database/contacts.vcf"), fileName: "contacts.vcf", caption: "File Contact Berhasil Di Buat✅", mimetype: "text/vcard", }, { quoted: m })
contacts.splice(0, contacts.length)
await fs.writeFileSync("./lib/database/contacts.json", JSON.stringify(contacts))
await fs.writeFileSync("./lib/database/contacts.vcf", "")
}}
break
  case "pushkontak2": {
if (!dev) return BububLexzy()
if (!text) return reply("*Contoh Command :*\n.pushkontak2 idgc|jeda|pesan\n\n*Note :* Jeda 1 detik = 1000\nketik *.listgc* untuk melihat semua list id grup")
if (!text.split("|")) return reply("*Contoh Command :*\n.pushkontak2 idgc|jeda|pesan\n\n*Note :* Jeda 1 detik = 1000\nketik *.listgc* untuk melihat semua list id grup")
var idnya = text.split("|")[0]
var delay = Number(text.split("|")[1])
var teks = text.split("|")[2]
if (!idnya.endsWith("@g.us")) return reply("Format ID Grup Tidak Valid")
if (isNaN(delay)) return reply("Format Delay Tidak Valid")
if (!teks) return reply("*Contoh Command :*\n.pushkontak2 idgc|jeda|pesan\n\n*Note :* Jeda 1 detik = 1000\nketik *.listgc* untuk melihat semua list id grup")
var groupMetadataa
try {
groupMetadataa = await Lexzy.groupMetadata(`${idnya}`)
} catch (e) {
return reply("*ID Grup* tidak valid!")
}
const participants = await groupMetadataa.participants
const halls = await participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
reply(`Memproses Mengirim Pesan Ke *${halls.length}* Member Grup`)
for (let mem of halls) {
if (mem !== m.sender) {
contacts.push(mem)
await fs.writeFileSync('./lib/database/contacts.json', JSON.stringify(contacts))
await Lexzy.sendMessage(mem, {text: teks}, {quoted: qloc})
await sleep(Number(delay))
}}
try {
const uniqueContacts = [...new Set(contacts)]
const vcardContent = uniqueContacts.map((contact, index) => {
const vcard = [
"BEGIN:VCARD",
"VERSION:3.0",
`FN:WA[${createSerial(2)}] ${contact.split("@")[0]}`,
`TEL;type=CELL;type=VOICE;waid=${contact.split("@")[0]}:+${contact.split("@")[0]}`,
"END:VCARD",
"", ].join("\n")
return vcard }).join("")
fs.writeFileSync("./lib/database/contacts.vcf", vcardContent, "utf8")
} catch (err) {
reply(err.toString())
} finally {
if (m.chat !== m.sender) await reply(`Berhasil Mengirim Pesan Ke *${halls.length} Member Grup*, File Contact Berhasil Dikirim ke Private Chat`)
await Lexzy.sendMessage(m.sender, { document: fs.readFileSync("./lib/database/contacts.vcf"), fileName: "contacts.vcf", caption: "File Contact Berhasil Di Buat✅", mimetype: "text/vcard", }, { quoted: m })
contacts.splice(0, contacts.length)
await fs.writeFileSync("./lib/database/contacts.json", JSON.stringify(contacts))
await fs.writeFileSync("./lib/database/contacts.vcf", "")
}}
break
        case "savekontak": {
if (!dev) return BububLexzy()
if (!isGroup) return reply(mess.gb)
const halls = await groupMetadata.participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
for (let mem of halls) {
if (mem !== m.sender) {
contacts.push(mem)
fs.writeFileSync('./lib/database/contacts.json', JSON.stringify(contacts))
}}
try {
const uniqueContacts = [...new Set(contacts)]
const vcardContent = uniqueContacts.map((contact, index) => {
const vcard = [
"BEGIN:VCARD",
"VERSION:3.0",
`FN:WA[${createSerial(2)}] ${contact.split("@")[0]}`,
`TEL;type=CELL;type=VOICE;waid=${contact.split("@")[0]}:+${contact.split("@")[0]}`,
"END:VCARD",
"", ].join("\n")
return vcard }).join("")
fs.writeFileSync("./lib/database/contacts.vcf", vcardContent, "utf8")
} catch (err) {
reply(err.toString())
} finally {
if (m.chat !== m.sender) await reply(`File Kontak Berhasil Dikirim ke Private Chat`)
await Lexzy.sendMessage(m.sender, { document: fs.readFileSync("./lib/database/contacts.vcf"), fileName: "contacts.vcf", caption: "File Contact Berhasil Di Buat✅", mimetype: "text/vcard", }, { quoted: qloc })
contacts.splice(0, contacts.length)
await fs.writeFileSync("./lib/database/contacts.json", JSON.stringify(contacts))
await fs.writeFileSync("./lib/database/contacts.vcf", "")
}}
break
case "savekontak2": {
if (!dev) return BububLexzy()
if (!text) return reply(example("idgrupnya\n\nketik *.listgc* untuk melihat semua list id grup"))
var idnya = text
var groupMetadataa
try {
groupMetadataa = await Lexzy.groupMetadata(`${idnya}`)
} catch (e) {
return reply("*ID Grup* tidak valid!")
}
const participants = await groupMetadataa.participants
const halls = await participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
for (let mem of halls) {
if (mem !== m.sender) {
contacts.push(mem)
fs.writeFileSync('./lib/database/contacts.json', JSON.stringify(contacts))
}}
try {
const uniqueContacts = [...new Set(contacts)]
const vcardContent = uniqueContacts.map((contact, index) => {
const vcard = [
"BEGIN:VCARD",
"VERSION:3.0",
`FN:WA[${createSerial(2)}] ${contact.split("@")[0]}`,
`TEL;type=CELL;type=VOICE;waid=${contact.split("@")[0]}:+${contact.split("@")[0]}`,
"END:VCARD",
"", ].join("\n")
return vcard }).join("")
fs.writeFileSync("./lib/database/contacts.vcf", vcardContent, "utf8")
} catch (err) {
reply(err.toString())
} finally {
if (m.chat !== m.sender) await reply(`File Kontak Berhasil Dikirim ke Private Chat`)
await Lexzy.sendMessage(m.sender, { document: fs.readFileSync("./lib/database/contacts.vcf"), fileName: "contacts.vcf", caption: "File Contact Berhasil Di Buat✅", mimetype: "text/vcard", }, { quoted: m })
contacts.splice(0, contacts.length)
await fs.writeFileSync("./lib/database/contacts.json", JSON.stringify(contacts))
await fs.writeFileSync("./lib/database/contacts.vcf", "")
}}
break
        case "jpm": {
if (!dev) return BububLexzy()
if (!text && !m.quoted) return reply(example("teksnya atau replyteks"))
var teks = m.quoted ? m.quoted.text : text
let total = 0
let getGroups = await Lexzy.groupFetchAllParticipating()
let groups = Object.entries(getGroups).slice(0).map((entry) => entry[1])
let usergc = groups.map((v) => v.id)
reply(`Memproses Mengirim Pesan *Text* Ke *${usergc.length}* Grup`)
for (let jid of usergc) {
try {
await Lexzy.sendMessage(jid, {text: teks}, {quoted: qloc})
total += 1
} catch {}
await sleep(global.delayjpm)
}
reply(`Berhasil Mengirim Pesan Ke *${total} Grup*`)
}
break
case "jpm2": {
if (!dev) return BububLexzy()
if (!text) return reply(example("teksnya dengan balas/kirim foto"))
if (!/image/.test(mime)) return reply(example("teksnya dengan balas/kirim foto"))
let image = await Lexzy.downloadAndSaveMediaMessage(qmsg)
let total = 0
let getGroups = await Lexzy.groupFetchAllParticipating()
let groups = Object.entries(getGroups).slice(0).map((entry) => entry[1])
let usergc = groups.map((v) => v.id)
reply(`Memproses Mengirim Pesan *Teks & Foto* Ke *${usergc.length}* Grup`)
for (let jid of usergc) {
try {
Lexzy.sendMessage(jid, {image: await fs.readFileSync(image), caption: text, contextInfo: {forwardingScore: 1,
isForwarded: true}}, {quoted: qloc})
total += 1
} catch {}
await sleep(global.delayjpm)
}
await fs.unlinkSync(image)
reply(`Berhasil Mengirim Postingan Ke *${total} Grup*`)
}
break 
        case "jpmht": {
if (!dev) return BububLexzy()
if (!text && !m.quoted) return reply(example("teksnya atau replyteks"))
var teks = m.quoted ? m.quoted.text : text
let total = 0
let getGroups = await Lexzy.groupFetchAllParticipating()
let groups = Object.entries(getGroups).slice(0).map((entry) => entry[1])
let usergc = groups.map((v) => v.id)
reply(`Memproses Mengirim Pesan *Text* Ke *${usergc.length}* Grup`)
for (let jid of usergc) {
try {
await Lexzy.sendMessage(jid, {text: teks, mentions: getGroups[jid].participants.map(e => e.id)}, {quoted: qloc})
total += 1
} catch (e) {
console.log(e)
}
await sleep(global.delayjpm)
}
reply(`Berhasil Mengirim Pesan Ke *${total} Grup*`)
}
break
        case "idgc": {
if (!dev) return BububLexzy()
if (!isGroup) return reply(mess.gb)
reply(`${m.chat}`)
}
break 
        case"listgc": {
let gcall = Object.values(await Lexzy.groupFetchAllParticipating().catch(_=> null))
let listgc = `*｢ LIST ALL CHAT GRUP ｣*\n\n`
await gcall.forEach((u, i) => {
listgc += `*• Nama :* ${u.subject}\n*• ID :* ${u.id}\n*• Total Member :* ${u.participants.length} Member\n*• Status Grup :* ${u.announce == true ? "Tertutup" : "Terbuka"}\n*• Pembuat :* ${u.owner ? u.owner.split('@')[0] : 'Sudah keluar'}\n\n`
})
reply(listgc)
}
break
     
    case "listserver": case "listsrv": {
  if (!dev) return BububLexzy()
  let page = args[0] ? args[0] : '1';
  let f = await fetch(domain + "/api/application/servers?page=" + page, {
    "method": "GET",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apikey
    }
  });
  let res = await f.json();
  let servers = res.data;
  let sections = [];
  let messageText = "\n*乂 List Server Panel Pterodactyl 乂*\n\n";
  
  for (let server of servers) {
    let s = server.attributes;
    
    let f3 = await fetch(domain + "/api/client/servers/" + s.uuid.split`-`[0] + "/resources", {
      "method": "GET",
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + capikey
      }
    });
    
    let data = await f3.json();
    let status = data.attributes ? data.attributes.current_state : s.status;
    
    messageText += `- ID Server: *${s.id}*\n`;
    messageText += `- Nama Server: *${s.name}*\n`;
    messageText += `- Status: *${status}*\n`;
    messageText += `- Ram : *${s.limits.memory == 0 ? "Unlimited" : s.limits.memory.toString().length > 4 ? s.limits.memory.toString().split("").slice(0,2).join("") + "GB" : s.limits.memory.toString().length < 4 ? s.limits.memory.toString().charAt(1) + "GB" : s.limits.memory.toString().charAt(0) + "GB"}*
- CPU : *${s.limits.cpu == 0 ? "Unlimited" : s.limits.cpu.toString() + "%"}*
- Disk : *${s.limits.disk == 0 ? "Unlimited" : s.limits.disk.length > 3 ? s.limits.disk.toString().charAt(1) + "GB" : s.limits.disk.toString().charAt(0) + "GB"}*
- Created : ${s.created_at.split("T")[0]}\n\n`
  }
  
  messageText += `Halaman: ${res.meta.pagination.current_page}/${res.meta.pagination.total_pages}\n`;
  messageText += `Total Server: ${res.meta.pagination.count}`;
  
  await Lexzy.sendMessage(m.chat, { text: messageText }, { quoted: qloc });
  
  if (res.meta.pagination.current_page < res.meta.pagination.total_pages) {
    reply(`Gunakan perintah ${prefix}listsrv ${res.meta.pagination.current_page + 1} untuk melihat halaman selanjutnya.`);
  }        
}
break;
        
    case "delsrv": case "delserver": {
      if (!dev) return BububLexzy()
let srv = args[0]
if (!srv) return reply('ID nya mana?')
let f = await fetch(domain + "/api/application/servers/" + srv, {
"method": "DELETE",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey,
}
})
let res = f.ok ? {
errors: null
} : await f.json()
if (res.errors) return reply('*SERVER NOT FOUND*')
reply("_\`Successfully\`_ ☑️")
}
        break
    case "listuser": case "listusr": {
  if (!dev) return BububLexzy()
  let page = args[0] ? args[0] : '1';
  let f = await fetch(domain + "/api/application/users?page=" + page, {
    "method": "GET",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apikey
    }
  });
  let res = await f.json();
  let users = res.data;
  let messageText = "\n*List User Panel Pterodactyl*\n\n";
  
  for (let user of users) {
    let u = user.attributes;
    messageText += `- ID: *${u.id}* 
- Status: *${u.attributes?.user?.server_limit === null ? 'Inactive' : 'Active'}*\n`;
    messageText += `- *${u.username}*\n`;
    messageText += `- *${u.first_name} ${u.last_name}*\n\n`;
  }
  
  messageText += `Page: ${res.meta.pagination.current_page}/${res.meta.pagination.total_pages}\n`;
  messageText += `Total Users: ${res.meta.pagination.count}`;
  
  await Lexzy.sendMessage(m.chat, { text: messageText }, { quoted: qloc });
  
  if (res.meta.pagination.current_page < res.meta.pagination.total_pages) {
    reply(`Gunakan perintah ${prefix}listusr ${res.meta.pagination.current_page + 1} untuk melihat halaman selanjutnya.`);
  }
}
break;
        case "deluser": {
  if (!dev) return BububLexzy()
let usr = args[0]
if (!usr) return reply('ID nya mana?')
let f = await fetch(domain + "/api/application/users/" + usr, {
"method": "DELETE",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
}
})
let res = f.ok ? {
errors: null
} : await f.json()
if (res.errors) return reply('*USER NOT FOUND*')
reply("_\`Successfully\`_ ☑️")
} 
break 
        case "listadmin": {
if (!dev) return BububLexzy()
let cek = await fetch(domain + "/api/application/users?page=1", {
"method": "GET",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
}
})
let res2 = await cek.json();
let users = res2.data;
if (users.length < 1 ) return reply("Tidak ada admin panel")
var teks = " *乂 List admin panel pterodactyl*\n"
await users.forEach((i) => {
if (i.attributes.root_admin !== true) return
teks += `\n* ID : *${i.attributes.id}*
* Nama : *${i.attributes.first_name}*
* Created : ${i.attributes.created_at.split("T")[0]}\n`
})
await Lexzy.sendMessage(m.chat, { text: teks }, { quoted: qloc });
}
break 
        
        case "deladmin": {
if (!dev) return BububLexzy()
if (!args[0]) return reply("ID nya mana?") 
let cek = await fetch(domain + "/api/application/users?page=1", {
"method": "GET",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
}
})
let res2 = await cek.json();
let users = res2.data;
let getid = null
let idadmin = null
await users.forEach(async (e) => {
if (e.attributes.id == args[0] && e.attributes.root_admin == true) {
getid = e.attributes.username
idadmin = e.attributes.id
let delusr = await fetch(domain + `/api/application/users/${idadmin}`, {
"method": "DELETE",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
}
})
let res = delusr.ok ? {
errors: null
} : await delusr.json()
}
})
if (idadmin == null) return reply("Akun admin panel tidak ditemukan!")
reply("_\`Successfully\`_ ☑️")
}
break 
        case "cadmin": {
if (!dev) return BububLexzy()
let s = q.split(',')
let email = s[0];
let username = s[0]
let nomor = s[1]
if (s.length < 2) return reply(`*Format salah!*
Penggunaan:
${prefix + command} user,nomer`)
if (!username) return reply(`Ex : ${prefix+command} Username,@tag/nomor\n\nContoh :\n${prefix+command} example,@user`)
if (!nomor) return reply(`Ex : ${prefix+command} Username,@tag/nomor\n\nContoh :\n${prefix+command} example,@user`)
if (!text.split(",")) return reply(example("nama,6283XXX"))
var buyyer = text.split(",")[0].toLowerCase()
if (!buyyer) return reply(example("nama,6283XXX"))
var ceknya = text.split(",")[1]
if (!ceknya) return reply(example("nama,6283XXX"))
var client = text.split(",")[1].replace(/[^0-9]/g, '')+'@s.whatsapp.net'
var check = await Lexzy.onWhatsApp(ceknya)
if (!check[0].exists) return reply("Nomor Buyyer Tidak Valid!")
global.panel2 = [buyyer, client]
let password = username + crypto.randomBytes(2).toString('hex')
let nomornya = nomor.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
let f = await fetch(domain + "/api/application/users", {
"method": "POST",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
},
"body": JSON.stringify({
"email": username + "@Admin.KzX",
"username": username,
"first_name": username,
"last_name": "Admin",
"language": "en",
 "root_admin" : true,  
"password": password.toString()
})

})

let data = await f.json();

if (data.errors) return reply(JSON.stringify(data.errors[0], null, 2));

let user = data.attributes

let tks = `
TYPE: USER

ID: ${user.id}
USERNAME: ${user.username}
EMAIL: ${user.email}
NAME: ${user.first_name} ${user.last_name}
CREATED AT: ${user.created_at}
`
    const listMessage = {
        text: tks,
    }
    await Lexzy.sendMessage(m.chat, listMessage)
var teks = `*MAMPUS GW RIPP 😹😹🫵🏻 🫵🏻*
‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌ _Canda, Ada Paket Admin Panel_ 📦
* *👤Username :* ${user.username}
* *🔐Password :* ${password.toString()}
* *🔗Link Login :* ${global.domain} 

*Tutor bikin panel :* https://files.catbox.moe/91ig9h.mp4
*Tutor pasang sc bot cpanel :* https://files.catbox.moe/d7l684.mp4

*Note !!*
> dilarang membagikan panel free
> dilarang menyebarkan data panel
> dilarang menyebarkan link panel
> dilarang membuat akun admin panel
> dilarang run sc yang berbau ddos
> *Data Hanya Di kirim 1x Hilang? Salah Sendiri*
> *Garansi 7hari*

_*Sc Cpanel Free?*_ 
_Ketik: \`.Script\`_
`
Lexzy.sendMessage(global.panel2[1],{text: teks }, { quoted: qloc })
}

break; 
        case "1gb": case "2gb": case "3gb": case "4gb": case "5gb": case "6gb": case "7gb": case "8gb": case "9gbb": case "10gb": {
    if (!prem || !prem2) return reply(mess.prem)
if (global.apikey.length < 1) return reply("Apikey Tidak Ditemukan!")
if (!args[0]) return reply(example("nama,6283XXX"))
if (!text.split(",")) return reply(example("nama,6283XXX"))
var buyyer = text.split(",")[0].toLowerCase()
if (!buyyer) return reply(example("nama,6283XXX"))
var ceknya = text.split(",")[1]
if (!ceknya) return reply(example("nama,6283XXX"))
var client = text.split(",")[1].replace(/[^0-9]/g, '')+'@s.whatsapp.net'
var check = await Lexzy.onWhatsApp(ceknya)
if (!check[0].exists) return reply("Nomor Buyyer Tidak Valid!")
global.panel2 = [buyyer, client]
var ram
var disknya
var cpu
if (command == "1gb") {
ram = "1125"
disknya = "1125"
cpu = "40"
} else if (command == "2gb") {
ram = "2125"
disknya = "2125"
cpu = "60"
} else if (command == "3gb") {
ram = "3125"
disknya = "3125"
cpu = "80"
} else if (command == "4gb") {
ram = "4125"
disknya = "4125"
cpu = "100"
} else if (command == "5gb") {
ram = "5125"
disknya = "5125"
cpu = "120"
} else if (command == "6gb") {
ram = "6125"
disknya = "6125"
cpu = "140"
} else if (command == "7gb") {
ram = "7125"
disknya = "7125"
cpu = "160"
} else if (command == "8gb") {
ram = "8125"
disknya = "8125"
cpu = "180"
} else if (command == "9gb") {
ram = "9124"
disknya = "9125"
cpu = "200"
} else if (command == "10gb") {
ram = "10125"
disknya = "10125"
cpu = "220"
}
let username = global.panel2[0].toLowerCase()
let email = username+"@Lexzy.KzX"
let name = username
let password = username + crypto.randomBytes(2).toString('hex')
let f = await fetch(domain + "/api/application/users", {
"method": "POST",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
},
"body": JSON.stringify({
"email": email,
"username": username.toLowerCase(),
"first_name": name,
"last_name": "Server",
"language": "en",
"password": password
})
})
let data = await f.json();
if (data.errors) return reply(JSON.stringify(data.errors[0], null, 2))
let user = data.attributes
let desc = tanggal(Date.now())
let usr_id = user.id
let f1 = await fetch(domain + "/api/application/nests/5/eggs/" + egg, {
"method": "GET",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
}
})
let data2 = await f1.json();
let startup_cmd = data2.attributes.startup
let f2 = await fetch(domain + "/api/application/servers", {
"method": "POST",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey,
},
"body": JSON.stringify({
"name": name,
"description": desc,
"user": usr_id,
"egg": parseInt(egg),
"docker_image": "ghcr.io/parkervcp/yolks:nodejs_18",
"startup": startup_cmd,
"environment": {
"INST": "npm",
"USER_UPLOAD": "0",
"AUTO_UPDATE": "0",
"CMD_RUN": "npm start"
},
"limits": {
"memory": ram,
"swap": 0,
"disk": disknya,
"io": 500,
"cpu": cpu
},
"feature_limits": {
"databases": 5,
"backups": 5,
"allocations": 5
},
deploy: {
locations: [parseInt(loc)],
dedicated_ip: false,
port_range: [],
},
})
})
let result = await f2.json()
if (result.errors) return reply(JSON.stringify(result.errors[0], null, 2))
let server = result.attributes
await reply(`*Berhasil Membuat Akun Panel ✅*

* *User ID :* ${user.id}
* *Server ID :* ${server.id}
* *Nama :* ${name} Server
* *Ram :* ${ram == "10125" ? "10Gb" : ram.charAt(0) + "GB"}
* *CPU :* ${cpu == "220" ? "220%" : cpu+"%"}
* *Storage :* ${disknya == "10125" ? "10Gb" : disknya.charAt(0) + "GB"}
* *Created :* ${desc}
Data Akun Sudah Dikirim Ke Nomor ${global.panel2[1].split('@')[0]}`)
var teks = `*MAMPUSS GW RIPP 😹😹🫵🏻🫵🏻*
‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌ _Canda Mas/Mbak Nih Ada Paket Panel_ 📦
* *👤Username :* ${user.username}
* *🔐Password :* ${password.toString()}
* *🔗Link Login :* ${global.domain}

_*NOTE!!*_
> *Seller Hanya Memberi Data 1x, Hilang? Salah Sendiri*
> *Ambil Garansi Wajib Ss Trx*
> *Garansi 7 Hari*
> *Jangan Run/Menggunakan Sc Ddos*
> *Btw Semoga Langganan Yakk🥰*
`
Lexzy.sendMessage(global.panel2[1],{text: teks }, { quoted: qloc })
}

break; 
        case "unli": {
    if (!prem2 && !dev) return reply("Maaf Kamu Belum Terdaftar Di Database Resseler Silahkan Untuk Menghubungi Owner")
if (global.apikey.length < 1) return reply("Apikey Tidak Ditemukan!")
if (!args[0]) return reply(example("nama,6283XXX"))
if (!text.split(",")) return reply(example("nama,6283XXX"))
var buyyer = text.split(",")[0].toLowerCase()
if (!buyyer) return reply(example("nama,6283XXX"))
var ceknya = text.split(",")[1]
if (!ceknya) return reply(example("nama,6283XXX"))
var client = text.split(",")[1].replace(/[^0-9]/g, '')+'@s.whatsapp.net'
var check = await Lexzy.onWhatsApp(ceknya)
if (!check[0].exists) return reply("Nomor Buyyer Tidak Valid!")
global.panel2 = [buyyer, client]
var ram
var disknya
var cpu
ram = "0"
disknya = "0"
cpu = "0"
let username = global.panel2[0].toLowerCase()
let email = username+"@Lexzy.KzX"
let name = username
let password = username + crypto.randomBytes(2).toString('hex')
let f = await fetch(domain + "/api/application/users", {
"method": "POST",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
},
"body": JSON.stringify({
"email": email,
"username": username.toLowerCase(),
"first_name": name,
"last_name": "Server",
"language": "en",
"password": password
})
})
let data = await f.json();
if (data.errors) return reply(JSON.stringify(data.errors[0], null, 2))
let user = data.attributes
let desc = tanggal(Date.now())
let usr_id = user.id
let f1 = await fetch(domain + "/api/application/nests/5/eggs/" + egg, {
"method": "GET",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey
}
})
let data2 = await f1.json();
let startup_cmd = data2.attributes.startup
let f2 = await fetch(domain + "/api/application/servers", {
"method": "POST",
"headers": {
"Accept": "application/json",
"Content-Type": "application/json",
"Authorization": "Bearer " + apikey,
},
"body": JSON.stringify({
"name": name,
"description": desc,
"user": usr_id,
"egg": parseInt(egg),
"docker_image": "ghcr.io/parkervcp/yolks:nodejs_18",
"startup": startup_cmd,
"environment": {
"INST": "npm",
"USER_UPLOAD": "0",
"AUTO_UPDATE": "0",
"CMD_RUN": "npm start"
},
"limits": {
"memory": ram,
"swap": 0,
"disk": disknya,
"io": 500,
"cpu": cpu
},
"feature_limits": {
"databases": 5,
"backups": 5,
"allocations": 5
},
deploy: {
locations: [parseInt(loc)],
dedicated_ip: false,
port_range: [],
},
})
})
let result = await f2.json()
if (result.errors) return reply(JSON.stringify(result.errors[0], null, 2))
let server = result.attributes
await reply(`*Berhasil Membuat Akun Panel ✅*

* *User ID :* ${user.id}
* *Server ID :* ${server.id}
* *Nama :* ${name} Server
* *Ram :* ${ram == "0" ? "UNLIMITED" : ram.charAt(0) + "GB"}
* *CPU :* ${cpu == "0" ? "UNLIMITED" : cpu+"%"}
* *Storage :* ${disknya == "0" ? "UNLIMITED" : disknya.charAt(0) + "GB"}
* *Created :* ${desc}
Data Akun Sudah Dikirim Ke Nomor ${global.panel2[1].split('@')[0]}`)
var teks = `*MAMPUSS GW RIPP 😹😹🫵🏻🫵🏻*
‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌ _Canda Mas/Mbak Nih Ada Paket Panel_ 📦
* *👤Username :* ${user.username}
* *🔐Password :* ${password.toString()}
* *🔗Link Login :* ${global.domain}

_*NOTE!!*_
> *Seller Hanya Memberi Data 1x, Hilang? Salah Sendiri*
> *Ambil Garansi Wajib Ss Trx*
> *Garansi 7 Hari*
> *Jangan Run/Menggunakan Sc Ddos*
> *Btw Semoga Langganan Yakk🥰*
`
Lexzy.sendMessage(global.panel2[1],{text: teks }, { quoted: qloc })
}

break; 
 case 'backup':
case 'bp':{
if (!dev) return 
const sessionPath = "./session";
if (fs.existsSync(sessionPath)) {
const files = fs.readdirSync(sessionPath);
files.forEach((file) => {
if (file !== "creds.json") {
const filePath = path.join(sessionPath, file); 
if (fs.lstatSync(filePath).isDirectory()) {
fs.rmSync(filePath, { recursive: true, force: true });
} else {  
fs.unlinkSync(filePath);
}
}
}
);
}
const ls = execSync("ls").toString().split("\n").filter(
(pe) =>           
pe != "node_modules" &&   
pe != "package-lock.json" &&  
pe != "yarn.lock" &&
pe != "tmp" &&
pe != ""
);
execSync(`zip -r backup.zip ${ls.join(" ")}`);
await Lexzy.sendMessage(m.chat, {
document: fs.readFileSync("./backup.zip"),   
fileName: "CPANEL X PUSH KONTAK LEXZY.zip",
mimetype: "application/zip",
caption: "Nahh Boss Lexzy File Lu",
}, { quoted: m });
execSync("rm -rf backup.zip");
}
break
            default:
                if (budy.startsWith('$')) {
                    if (!dev) return;
                    exec(budy.slice(2), (err, stdout) => {
                        if (err) return reply(err)
                        if (stdout) return reply(stdout);
                    });
                }
                
                if (budy.startsWith('>')) {
                    if (!dev) return;
                    try {
                        let evaled = await eval(budy.slice(2));
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        await reply(evaled);
                    } catch (err) {
                        reply(String(err));
                    }
                }
        
                if (budy.startsWith('<')) {
                    if (!dev) return
                    let kode = budy.trim().split(/ +/)[0]
                    let teks
                    try {
                        teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${q}})()`)
                    } catch (e) {
                        teks = e
                    } finally {
                        await reply(require('util').format(teks))
                    }
                }
        
        }
    } catch (err) {
        console.log(require("util").format(err));
    }
};

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
