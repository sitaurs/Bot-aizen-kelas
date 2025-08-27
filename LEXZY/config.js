
const fs = require('fs')
//~~~~~~~~~SETTING BOT~~~~~~~~~~//
global.owner = "6281358959349"
global.namaowner = "Moontrct"


//~~~~~~~~~SETTING PAIRING~~~~~~~~~~//
global.Qr = false
//GANTI TRUE JADI QR/SCAN
// FALSE JADI PAIRING KODE

//~~~~~~~~~SETTING PAYMENT~~~~~~~~~~//
global.dana = "08xxxx"
global.ovo = "08xxxx"
global.gopay = "08xxxx"
global.qris = "https://b.top4top.io/p_3279htla70.jpg"

//~~~~~~~~~SETTING DELAY~~~~~~~~~~//
global.delaypushkontak
global.delayjpm = "3000"

//~~~~~~~~~SETTING CPANEL~~~~~~~~~~//
global.egg = "15"
global.loc = "1"
global.domain = "https://panel.fahz.my.id" // DOMAIN
global.apikey = "ptla_V0UEIyGXTFthg6Yzak9sK73cXi5HyUZ9III4cliSBO6" // PTLA
global.capikey = "" // PTLC

//~~~~~~~~~ Settings reply ~~~~~~~~~//
global.mess = {
    owner: "    _*Khusus Admin superuser!!*_",
    prem: "   _*Khusus Yang Udah Di Akses Boss Gw!!*_",
    gb: "    _*Khusus Group Ya!!*_",
    adm: "    _*Khusus Admin!!*_",
    b: "    _*Bot Blum Jadi Admin!!*_"
}


let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
