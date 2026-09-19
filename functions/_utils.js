async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return saltB64 + '$' + hashB64;
}

async function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 2) return false;
  const salt = Uint8Array.from(atob(parts[0]), c => c.charCodeAt(0));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return hashB64 === parts[1];
}

function generateToken() {
  const arr = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function getUserFromRequest(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  const result = await env.DB.prepare('SELECT u.id, u.username, u.email, u.avatar, u.cover, u.bio, u.bio_status, u.bio_error, u.r_coins, u.created_at FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now")').bind(token).first();
  return result || null;
}

function getChinaTime() {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function checkEmailDomain(email) {
  email = email.toLowerCase().trim();
  const domain = email.substring(email.lastIndexOf('@') + 1);
  const tempDomains = [
    'gmeenramy.com','innaze.com','imgfx.art','svuntik.com','talmirexo.org','lunvira.pro',
    'tempmail.com','10minutemail.com','guerrillamail.com','throwawaymail.com','mailinator.com',
    'trashmail.com','yopmail.com','sharklasers.com','guerrillamailblock.com','pokemail.net',
    'spam4.me','grr.la','mailcatch.com','mailnesia.com','dispostable.com','maildrop.cc',
    'mintemail.com','temp-mail.org','emailondeck.com','fakeinbox.com','mail-temp.com',
    'tempmailaddress.com','moakt.com','mytrashmail.com','spamex.com','spamgourmet.com',
    'mailnull.com','pookmail.com','spamhole.com','spamoff.de','emailias.com','soodonims.com',
    'e4ward.com','mailinator.net','mailinator2.com','sogetthis.com','mailin8r.com','spam.la',
    'spam.su','mailspam.xyz','tempmail.plus','tempr.email','emailfake.com','fakemail.net',
    'freetempmail.com','getnada.com','mailsac.com','mail7.io','mailpoof.com','dropmail.me',
    '1secmail.com','1secmail.org','1secmail.net','chacuo.net','linshiyouxiang.net',
    'linshiyouxiang.com','24mail.chacuo.net','mail.bccto.me','bccto.me','996weiboyi.com',
    'weiboyi.com','qqfew.com','51zhaobiao.net','vczh.cf','vczh.me','vczh.tk','vczh.xyz',
    'vczh.top','vczh.site','vczh.fun','vczh.click','vczh.link','vczh.email','vczh.tech',
    'vczh.cloud','vczh.dev','vczh.app','vczh.blog','vczh.zone','vczh.work','vczh.live',
    'vczh.media','vczh.space','vczh.website','vczh.online','vczh.store','vczh.shop',
    'vczh.club','vczh.team','vczh.community','vczh.network','vczh.services','vczh.tools',
    'vczh.wiki','vczh.design','vczh.art','vczh.photo','vczh.gallery','vczh.movie',
    'vczh.video','vczh.music','vczh.game','vczh.play','vczh.stream','vczh.tube','vczh.fm',
    'vczh.radio','vczh.podcast','vczh.audio','vczh.book','vczh.read','vczh.news','vczh.press',
    'vczh.pub','internxt.com','simplelogin.io','anonaddy.me','mohmal.com','emailondeck.com',
    'mail.tm','mail.gw','harakirimail.com','jetable.org','kasmail.com','kaspop.com',
    'klzlk.com','landmail.co','laposte.net','letthemeatspam.com','lroid.com','m4ilweb.info',
    'mail-filter.com','mail-temporaire.fr','mail.mezimages.com','mail22.de','mail333.com',
    'mailbidon.com','mailbox80.com','mailbox81.com','mailbox82.com','mailbox83.com',
    'mailbox84.com','mailbox85.com','mailbox86.com','mailbox87.com','mailbox88.com',
    'mailbox89.com','mailbox90.com','mailbox91.com','mailbox92.com','mailbox93.com',
    'mailbox94.com','mailbox95.com','mailbox96.com','mailbox97.com','mailbox98.com',
    'mailbox99.com','mailcatch.com','mailde.de','maildrop.cf','maildrop.gq','maildrop.ml',
    'maildrop.tk','maildu.de','maileimer.de','mailexpire.com','mailforspam.com','mailfree.ga',
    'mailfree.gq','mailfree.ml','mailfree.tk','mailfs.com','mailguard.me','mailhazard.com',
    'mailismagic.com','mailit.za.com','mailmate.com','mailme.ir','mailmetrash.com',
    'mailmoat.com','mailnator.com','mailnull.com','mailorg.org','mailpick.biz','mailprox.com',
    'mailscrap.com','mailshell.com','mailsiphon.com','mailslapping.com','mailtemp.ga',
    'mailtemp.gq','mailtemp.ml','mailtemp.tk','mailtothis.com','mailtv.net','mailtv.tv',
    'mailzilla.com','mailzilla.org','makemenaughty.com','manpen.com','mbx.cc','mciek.com',
    'mega.zik.dj','merda.pl','metapoy.com','mezimages.com','mfsa.ru','mi5crew.org',
    'mierdamail.com','migmail.net','mintemail.com','misterpinball.de','mjukglass.nu',
    'mobi.web.id','moburl.com','mohmal.com','monaqasat.com','monmailpourmoi.com','mozej.com',
    'mrblocking.com','mt2009.com','mt2014.com','mt2015.com','mt2016.com','mt2017.com',
    'mt2018.com','mt2019.com','mt2020.com','mt2021.com','mt2022.com','mt2023.com',
    'mt2024.com','mt2025.com','mt2026.com','mt2027.com','mt2028.com','mt2029.com',
    'mt2030.com','muatbus.com','muboo.net','muevete.org','mugglenet.com','mvrht.com',
    'mycleaninbox.net','myemailboxy.com','myindmail.com','mymail-in.net','mymailo.com',
    'mynetstore.de','myopang.com','myspaceinc.com','myspaceinc.net','myspaceinc.org',
    'myspamless.com','mytemp.email','mytempmail.com','mytrashmail.com','nada.email',
    'nada.ltd','neomailbox.com','nervmich.net','nervtmich.net','netmails.com','netzidiot.de',
    'neverbox.com','nice-4u.com','nincsmail.com','no-spam.ws','noblepioneer.com','nomail.pw',
    'nomail2me.com','nomorespamemails.com','none.ws','noref.in','nospam.ze.tc','nospam4.us',
    'nospamfor.us','nospammail.net','notmailinator.com','nowmymail.com','ntlhelp.net',
    'nullbox.info','nurfuerspam.de','nus.edu.sg','nut.cc','nwyo.com','obfusko.com',
    'objectmail.com','obobbo.com','odaymail.com','olypmall.ru','one-time.email','oneoffmail.com',
    'online.ms','oopi.org','opayq.com','opentrash.com','ordinaryamerican.net','ornalt.com',
    'otherinbox.com','ourpreviewdomain.com','outlawspam.com','overtag.dk','owlpic.com',
    'oxopoha.com','ozyl.de','pancakemail.com','pcusers.otherinbox.com','pepbot.com',
    'pfui.ru','photo-impact.org','phpbb.za.pl','pii.at','pimpedupmyspace.com','pjjkp.com',
    'plexolan.de','poczta.onet.pl','politikerclub.de','pooo.org','poontang.com',
    'popescrew.com','popmail.pp.ua','porco.cx','pornobis.com','postonline.me','pravoslavie.ru',
    'premium-mail.fr','pressthematrix.com','privacy.net','privatdemail.net','privy-mail.com',
    'proxymail.eu','prtnx.com','psles.com','publik24.de','pulsept.org','punkass.com',
    'putthisinyourspamdatabase.com','pwrby.com','qasti.com','qbfree.us','qibox.com',
    'qik-mail.com','qmailo.com','qsl.ro','qtumail.com','quickinbox.com','quickmail.nl',
    'quirkymail.com','qwerty@box.com','r4nd0m.org','rabbit-mail.info','raetp9.com',
    'randomail.net','randomtext.com','rancidliar.com','rateplan.com','rawbit.com',
    'razemail.com','re-gmx.com','reality-concept.com','realtyx.biz','receiveee.com',
    'recipehome.net','recode.me','recyclemail.dk','redchan.it','redfeathercrow.com',
    'redmail.tech','refused.us','rejectmail.com','reliable-mail.com','remail.cf','remail.gq',
    'remail.ml','remail.tk','reptilegenetics.com','resged.com','retinapartments.com',
    'revolting.com','rf.gd','rhyta.com','richne.ws','rickcortese.com','riddermark.se',
    'rify.com','rilot.com','ripper.lv','risingsuntouch.com','rklips.com','rmqkr.net',
    'rnxdesign.com','robertspenguin.com','robot-x.biz','robertwimer.com','rock.com',
    'rocketmail.com','rohrpost.nrw.de','rollaround.us','romabernardes.com','rootfest.net',
    'rotanotal.com','rottengossip.com','rppkn.com','rtrtr.com','rudymail.com','ruffrey.com',
    'rukh.com','ruru.be','rustydoor.com','s0ny.net','sabrestlouis.com','safetymail.info',
    'sagrav.com','saintmail.com','salagula.com','sandelf.de','sanfinder.com','san.rr.com',
    'satisfactorymail.com','saveom.com','saynotospams.com','scatmail.com','schachnoob.de',
    'schafmail.de','scheissmail.de','schmeissweg.tk','schrott-email.de','schweiz.ch',
    'scottmail.com','scrappymail.com','scr.im','secmail.pw','secure-mail.biz','secureby.com',
    'seekapps.com','selfdestructingmail.com','sendfree.info','sendingspecialist.com',
    'sendspamhere.com','senserly.com','seznam.cz','shacknews.com','sharedmailbox.org',
    'sharklasers.com','shaw.ca','shhhu.com','shortmail.net','shotmail.ru','showme.spam.com',
    'shut.ws','shuffle.email','sify.com','sinnlos-mail.de','sions.com','sis.com.br',
    'skeefmail.com','skrx.tk','sky-inbox.com','slapsfromlastnight.com','slaskpost.se',
    'slave-auctions.net','slippery.email','slipry.net','slopsbox.com','slothmail.com',
    'slushmail.com','smashmail.com','smellfear.com','smellrear.com','smtp99.com',
    'snack-mail.com','snail-mail.org','snappermail.com','sneakemail.com','snkmail.com',
    'social-mail.org','socialfurry.org','sofort-mail.de','softpls.asia','sohu.com',
    'soisz.com','solar-impact.org','soldiertt.com','solutioneverything.com','solvemail.info',
    'songsoftay.com','soodmail.com','soodonims.com','soy.com','spam-be-gone.com',
    'spam.la','spam.su','spam4.me','spamail.de','spamarrest.com','spamavert.com',
    'spambob.net','spambog.com','spambog.ru','spambox.info','spambox.irishspringrealty.com',
    'spambox.us','spamcannon.com','spamcero.com','spamcon.org','spamcorptastic.com',
    'spamcowboy.com','spamcurb.com','spamday.com','spamdecoy.net','spamex.com','spamfighter.com',
    'spamfree.eu','spamfree24.com','spamfree24.de','spamfree24.eu','spamfree24.info',
    'spamfree24.net','spamfree24.org','spamgourmet.com','spamgourmet.net','spamgourmet.org',
    'spamherelots.com','spamhereplease.com','spamhole.com','spamify.com','spamininja.com',
    'spamkiller.ru','spamlaws.com','spamlesson.com','spammotel.com','spamobox.com',
    'spamoff.de','spamoffice.com','spamoid.com','spampark.com','spampeace.com',
    'spamprotect.info','spamslicer.com','spamsmash.com','spamstack.net','spamstop.info',
    'spamstopshere.com','spamsubscribe.com','spamthis.co.uk','spamthisplease.com',
    'spamtrap.com','spamtroll.net','spamwc.com','spamwood.com','spamzila.com','spamzilla.com',
    'spamzix.com','spanishmail.net','spartannation.com','spawg.com','speed.1s.fr',
    'speedgauge.net','spymac.com','spymutt.com','squizzy.com','sry.li','ss3.com.br',
    'stinkefinger.net','stinkymail.com','stop-my-spam.com','stopspam.com','store.fatcow.com',
    'stormpages.com','storiq.com','stpp.co.uk','strawberry-banana.com','streetwisemail.com',
    'stuck.io','stuffmail.de','stumpfwerk.com','sub-portal.com','suckmyd.com',
    'suckmyasshole.com','suckmydick.com','suckmypiss.com','sudanmail.com','suezstar.net',
    'supergreatmail.com','supermailer.jp','superrito.com','superstachel.de','suremail.info',
    'susi.ml','svenben.de','sweetxxx.de','swift10mail.com','swissmail.ch','syntheticerror.com',
    'syphon.tv','tagyourself.com','talkinator.com','tapchicuoihoi.com','taurus.cn',
    'tb-on-line.com','tdtvt.com','teapots.it','techgroup.me','teewars.org','telegmail.com',
    'teleworm.com','teleworm.us','tempalias.com','tempemail.biz','tempemail.com',
    'tempinbox.co.uk','tempinbox.com','tempmail.co','tempmail.de','tempmail.eu',
    'tempmail.it','tempmail.net','tempmail.org','tempmail.us','tempmail24.com',
    'tempmaildemo.com','tempmailer.com','tempmailer.de','tempmailo.com','tempomail.fr',
    'tempthe.net','tempymail.com','teranostra.com','test.com','test.de','test.email',
    'test123.com','testaddress.com','testanuj.com','testemail.com','testemailaddress.net',
    'testin.de','testimonialgenerator.com','testmail.top','testmail101.com','testovaci-email.cz',
    'testudine.com','thankyou2010.com','thc.lv','thecloud.net','thediamants.com',
    'thelightningfastemail.com','thelimestones.com','themeforest.net','themightymail.com',
    'thex.ro','thfdy.com','thinki.com','thisisnotmyrealemail.com','thismail.net',
    'thnikka.com','thrma.com','thrott.com','throwawayemailaddress.com','throwawaymail.com',
    'throwawaymails.com','throam.com','thrumylens.com','thzzz.com','ticket.com','tittbit.in',
    'tiv.cc','tmmail.com','todayindia.net','toiea.com','tokem.co','tomail.com','tonacios.com',
    'tonyonline.epizy.com','toomail.biz','top100golfclubs.com','top1mail.com','topemail.net',
    'topinfos.org','topmail.de','topmail.uk','topposting.org','toysnmail.com','tp-smtp.com',
    'tqosi.com','tracymcneal.com','trash2009.com','trash-email.com','trash-mail.at',
    'trash-mail.com','trash-mail.de','trash-mail.info','trash-mail.org','trash-me.com',
    'trash2010.com','trash2011.com','trash2012.com','trash2013.com','trash2014.com',
    'trash2015.com','trash2016.com','trash2017.com','trash2018.com','trash2019.com',
    'trash2020.com','trash2021.com','trash2022.com','trash2023.com','trash2024.com',
    'trash2025.com','trash2026.com','trash2027.com','trash2028.com','trash2029.com',
    'trash2030.com','trashbox.ru','trashcanmail.com','trashdev.com','trashemail.de',
    'trashmail.com','trashmail.de','trashmail.io','trashmail.me','trashmail.net',
    'trashmail.org','trashmail.ws','trashmailer.com','trashmails.com','trashymail.com',
    'trashymail.net','trashzilla.org','trbvm.com','trendymail.org','trialmail.de',
    'trillianpro.com','trbvo.com','truckmail.ml','trump.io','trunksof.com','tryalert.com',
    'tthost.com','tubbycat.com','tuckys.com','tunemail.com','turual.com','tvch1.com',
    'twinmail.de','twkly.com','twoweirdtricks.com','ty. Safermail.net','tyldd.com',
    'tylercity.net','tylerturkey.com','typhlosion.com','typemail.com','ua.fm','ubismail.net',
    'ucup.com','uggsrock.com','uk.to','ukr.net','ultimatefightingchampionship.com',
    'umail.net','unidalo.com','unimarketing.com','union-mail.com','unitrem.com',
    'upliftnow.com','uplipht.com','ups.zone','uptownchicks.com','urolook.com','us.af',
    'usa.com','usinternet.com','usmarty.com','uspehu.com','us.peggy.com','ussr.win',
    'v3.com','v961.com','vcfhq.com','vecino.com.ar','veijh.com','velnet.ee','ventura.com',
    'verizon.net','veryday.ch','vfemail.net','vfgdf.com','vheron.com','viditag.com',
    'viewcastmedia.com','vinernet.com','vipepe.com','vipmail.name','vipmail.pw','vipmail.ru',
    'virgilio.it','virtual-mail.com','virtualmail.com','visixion.com','visto.com',
    'vitelcom.com','vivaldi.net','vixxra.com','vja.com','vmail.com','vmailing.com',
    'vndy.com','vnguyen.com','vodkafan.com','voila.fr','vol-au-vent.com','volse.net',
    'vomoto.com','voodoo.com','vortic.com','votiput.com','voxelcore.com','vps30.com',
    'vps60.com','vps90.com','vree.com','vremonte.com','vudu.com','vui4.com','vui6.com',
    'vui8.com','vulkan-mail.com','w3internet.com','w3os.com','w4c.com','w99.com',
    'walkmail.net','wallm.com','walala.org','wam.dj','wannabuy.com','warriorforum.com',
    'washcaps.com','waste.org','watch-harry-potter.com','watchironman3.com','watchnewmoon.com',
    'wazabi.com','wbcmotor.com','weird.pw','weisdergeier.de','welikecookies.com',
    'wellnesscorner.info','welt.com','wemel.de','westn.com','wetrainbayarea.com',
    'wh4f.org','whatiaas.com','whatifanalytics.com','whatnyc.com','whats-the.biz',
    'whatsthebestphone.com','whatz.com','whereisnail.com','whiffles.com','whoplayed.com',
    'whyspam.me','wickmail.net','widget.com','widgil.com','wie-komme-ich-auf-die-1000.de',
    'wifen.com','wikipedia.org','wilesmail.com','willself.email','willstduemail.de',
    'wimsg.com','winemaven.info','wmail.info','wmail.net','wmpix.com','wnd.com.vn',
    'wolke7.com','wolfcloud.net','wolfsmail.com','women.com','woodside.com','woxide.com',
    'wp20.com','wp21.com','wp22.com','wp23.com','wp24.com','wp25.com','wp26.com',
    'wp27.com','wp28.com','wp29.com','wp30.com','wptv.com','wr777.com','writeme.com',
    'wronghead.com','wufoo.com','wunderland.com','wurmschwanz.de','wuzup.net','wuzupmail.com',
    'wvuv.com','wxnw.net','x247.com','x2js.com','x99.com','xagloo.com','xandxtv.com',
    'xcode.com','xcpy.com','xemail.com','xfmradio.net','xgs.net','xhamster.com','xhost.cc',
    'xindal.com','xire.net','xjoi.com','xl7.com','xmail.com','xmail.net','xmail.ru',
    'xmail.uk','xname.com','xoxy.net','xperiae10.com','xph.com','xrea.com','xren.com',
    'xrom.com','xsaq.com','xtom.com','xup.in','xvx.com','xxhamster.com','xxiol.com',
    'xxloc.com','xxooxx.net','xxrb.com','xxx.com','xxxwebdesign.com','xy9ce.com','xyr1.com',
    'xzs.com','y00.com','y7y6.com','yabai.com','yadayada.com','yahmail.com','yahoo.com',
    'yandex.com','yandex.ru','yepmail.com','yopmail.com','yopmail.fr','yopmail.net',
    'yopmail.org','youmail.com','yourdomain.com','yourstupid.com','ypmail.com','ymail.com',
    'z0d.com','z1p.biz','z3x.com','z5s.com','z8.ru','za.com','zapakmail.com','zaperz.com',
    'zappo.com','zard.com','zayom.com','zbb.com','zc4.com','zcin.com','zd-mail.com',
    'zdarma.to','zdnet.com','ze.cx','zealand.com','zepp.dk','zerobit.net','zerospam.com',
    'zetmail.com','zfym.com','zg.com','zh.ch','zhcx.com','zhen.com','zhibo.com','zhihu.com',
    'zhor.com','zibm.com','ziddu.com','zifreemail.com','zik.dj','zillatech.com','zipmail.com.br',
    'zipworld.com.au','zitan.com','zive.com','zj.com','zk8.com','zkc.com','zmail.com',
    'zmail.ru','zmhr.com','zomg.com','zoo.com','zoomin.com','zoos.net','zorpia.com',
    'zotemail.com','zowie.com','zxc.com','zxcv.com','zxcvbnm.com','zyg.com','zyon.com','zzz.com'
  ];

  for (const d of tempDomains) {
    if (domain === d || domain.endsWith('.' + d)) {
      return { valid: false, message: '不支持临时邮箱，请使用正规邮箱' };
    }
  }

  const publicDomains = [
    'gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','msn.com','outlook.jp',
    'yahoo.com','yahoo.co.jp','yahoo.co.kr','yahoo.com.hk','yahoo.com.tw','protonmail.com',
    'proton.me','pm.me','qq.com','vip.qq.com','foxmail.com','163.com','126.com','yeah.net',
    '139.com','wo.cn','189.cn','21cn.com','sina.com','sina.cn','sohu.com','tom.com','263.net',
    'aliyun.com','icloud.com','me.com','mac.com','aol.com','zoho.com','yandex.com','mail.ru',
    'gmx.com','gmx.net','web.de','freenet.de','t-online.de','posteo.de','mailbox.org','mail.de',
    'libero.it','virgilio.it','alice.it','tin.it','email.it','poste.it','laposte.net','free.fr',
    'orange.fr','sfr.fr','neuf.fr','wanadoo.fr','btinternet.com','bt.com','talktalk.co.uk',
    'sky.com','virginmedia.com','ntlworld.com','blueyonder.co.uk','vodafone.it','tim.it',
    'wind.it','tre.it','iliad.it','fastwebnet.it','tiscali.it','aliceadsl.it','pec.it',
    'legalmail.it','posta-certificata.it','pec.aruba.it','pec.telecomp.it','pec.registro.it',
    '1und1.de','ionos.de','arcor.de','kabelmail.de','gmx.co.uk','bluewin.ch','swissmail.ch',
    'hotmail.it','hotmail.fr','hotmail.de','hotmail.es','hotmail.co.uk','hotmail.com.br',
    'hotmail.com.au','hotmail.ca','hotmail.nl','hotmail.se','hotmail.no','hotmail.dk',
    'hotmail.fi','hotmail.be','hotmail.ch','hotmail.at','hotmail.ie','hotmail.co.nz',
    'hotmail.co.za','hotmail.com.mx','hotmail.com.ar','hotmail.com.tr','hotmail.com.sg',
    'rocketmail.com','yahoo.ca','yahoo.de','yahoo.fr','yahoo.es','yahoo.it','yahoo.co.in',
    'yahoo.com.sg','ymail.com','tutanota.com','tutanota.de','tutamail.com','tuta.io',
    'mailfence.com','posteo.net','posteo.org','posteo.com','mailbox.com','gmx.us','gmx.eu',
    'gmx.info','gmx.biz','web.com','freenet.com','t-online.com','1und1.com','ionos.com',
    'arcor.com','kabelmail.com','mail.com','email.com','inbox.com','inbox.ru','bk.ru',
    'list.ru','internet.ru','inbox.lv','inbox.lt','inbox.ee','mail.ee','mail.lv','mail.lt',
    'seznam.cz','seznam.sk','email.cz','email.sk','centrum.cz','centrum.sk','volny.cz',
    'volny.sk','atlas.cz','atlas.sk','quick.cz','quick.sk','posta.cz','posta.sk',
    'azet.sk','azet.cz','toplist.cz','toplist.sk','slovanet.sk','slovanet.cz','stonline.sk',
    'stonline.cz','sapo.pt','sapo.cv','clix.pt','clix.cv','clix.ao','mail.telepac.pt',
    'netcabo.pt','netcabo.cv','netcabo.ao','meo.pt','meo.cv','meo.ao','vodafone.pt',
    'nos.pt','nos.cv','nos.ao','optimus.pt','tmn.pt','orange.pt','zon.pt','ptmail.com',
    'ptmail.net','ptmail.org','mail.pt','mail.cv','mail.ao','email.pt','email.cv','email.ao',
    'correio.pt','correio.cv','correio.ao','ctt.pt','ctt.cv','ctt.ao','bol.com.br','bol.com',
    'uol.com.br','uol.com','ig.com.br','ig.com','zipmail.com.br','zipmail.com','pop.com.br',
    'pop.com','r7.com','r7.com.br','globo.com','globo.com.br','globomail.com','globomail.com.br',
    'oi.com.br','oi.com','tim.com.br','tim.com','vivo.com.br','vivo.com','claro.com.br',
    'claro.com','nextel.com.br','nextel.com','portugalmail.com','portugalmail.pt'
  ];

  let isPublic = false;
  for (const d of publicDomains) {
    if (domain === d || domain.endsWith('.' + d)) {
      isPublic = true;
      break;
    }
  }

  if (!isPublic) {
    return { valid: false, message: '不支持域名邮箱/企业邮箱，请使用公共邮箱（如Gmail、Outlook、QQ邮箱等）' };
  }

  return { valid: true };
}

async function sendEmailJS(toEmail, code) {
  const html = '<div style="font-family:Arial,sans-serif;padding:24px;background:#f5f5f5;">' +
    '<div style="background:#fff;border-radius:8px;padding:24px;max-width:400px;margin:0 auto;">' +
    '<h2 style="margin:0 0 16px;color:#333;font-size:20px;">验证码</h2>' +
    '<p style="margin:0 0 12px;color:#666;font-size:14px;">你的验证码是：</p>' +
    '<p style="margin:0 0 16px;font-size:32px;font-weight:bold;color:#1a73e8;letter-spacing:6px;">' + code + '</p>' +
    '<p style="margin:0;color:#999;font-size:12px;">10分钟内有效，请勿泄露给他人。</p>' +
    '</div></div>';
  const params = new URLSearchParams({
    apikey: '25267332D7D113C6C2A2A0EFEF4EAD3F7B8CD5AFC852F9F25AF616BD04B6778AEDD63454A6B9CA4E2C8D172094FB738B',
    from: 'longhei2026@theyuse.ccwu.cc',
    fromName: '创造工坊',
    to: toEmail,
    subject: '你的验证码',
    bodyHtml: html,
    isTransactional: 'true'
  });
  try {
    const resp = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await resp.json();
    return data.success === true;
  } catch (e) {
    return false;
  }
}

function moderateContent(text) {
  if (!text || !text.trim()) {
    return { passed: true, reason: '' };
  }
  const lower = text.toLowerCase();
  const bannedWords = [
    '操你妈','草你妈','傻逼','傻比','煞笔','脑残','智障','废物','垃圾','贱人',
    '婊子','妓女','鸡巴','屌','睾丸','阴道','阴茎','乳头','胸部','屁股','肛门',
    '色情','黄色','裸体','裸聊','约炮','一夜情','嫖娼','卖淫','自慰','手淫',
    '赌博','博彩','赌场','六合彩','时时彩','赌球','网赌','棋牌',
    '毒品','吸毒','贩毒','冰毒','海洛因','大麻','摇头丸','K粉',
    '枪支','军火','炸药','炸弹','雷管','管制刀具',
    '诈骗','骗子','传销','非法集资','洗钱',
    '自杀','自残','杀人','放火','爆炸',
    '反动','颠覆国家','分裂国家','台独','港独','疆独','藏独',
    '习近平','毛泽东','周恩来','邓小平','江泽民','胡锦涛','温家宝','李克强',
    '法轮功','法轮大法',
    '加微信','加QQ','私聊','联系方式','代刷','代练','外挂','辅助',
    'fuck','shit','bitch','asshole','porn','sex','nude','naked',
    '赌博','博彩','casino','betting','lottery'
  ];
  for (const word of bannedWords) {
    if (lower.includes(word.toLowerCase())) {
      return { passed: false, reason: '包含违规内容：' + word };
    }
  }
  if (text.length > 500) {
    return { passed: false, reason: '介绍不能超过500字' };
  }
  return { passed: true, reason: '' };
}

function validateRealName(name) {
  if (!name) return false;
  name = name.trim();
  if (name.length < 2 || name.length > 20) return false;
  return /^[一-龥·]{2,20}$/.test(name);
}

function validateIdCard(idCard) {
  if (!idCard) return false;
  idCard = String(idCard).trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(idCard)) return false;
  const province = parseInt(idCard.substring(0, 2), 10);
  if (province < 11 || province > 82) return false;
  const year = parseInt(idCard.substring(6, 10), 10);
  const month = parseInt(idCard.substring(10, 12), 10);
  const day = parseInt(idCard.substring(12, 14), 10);
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += parseInt(idCard[i], 10) * weights[i];
  return idCard[17] === codes[sum % 11];
}

function maskIdCard(idCard) {
  idCard = String(idCard).trim().toUpperCase();
  if (idCard.length !== 18) return '';
  return idCard.substring(0, 6) + '********' + idCard.substring(14);
}

async function getIdentityKey(env) {
  const secret = (env && env.IDENTITY_SECRET) || 'czgf-identity-secret-2026-please-change-in-pages-settings';
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptIdCard(idCard, env) {
  const key = await getIdentityKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(String(idCard).trim().toUpperCase()));
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  let bin = '';
  for (let i = 0; i < combined.length; i++) bin += String.fromCharCode(combined[i]);
  return btoa(bin);
}

async function decryptIdCard(encB64, env) {
  try {
    const key = await getIdentityKey(env);
    const bytes = Uint8Array.from(atob(encB64), c => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch (e) {
    return '';
  }
}

export { hashPassword, verifyPassword, generateToken, generateCode, jsonResponse, getUserFromRequest, getChinaTime, checkEmailDomain, sendEmailJS, moderateContent, validateRealName, validateIdCard, maskIdCard, encryptIdCard, decryptIdCard };
