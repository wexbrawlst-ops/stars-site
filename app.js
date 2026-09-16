import{initializeApp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import{getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,addDoc,onSnapshot,query,where,orderBy,limit,increment,runTransaction,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCgiJ2OLgRf9rep6enYQTohuHGf9PAT6xQ",authDomain:"stars-f6d41.firebaseapp.com",projectId:"stars-f6d41",storageBucket:"stars-f6d41.firebasestorage.app",messagingSenderId:"294339505512",appId:"1:294339505512:web:2c0a8cc124c91d5d6dbadd"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const ADMIN_EMAIL="brawlstarsk93k@gmail.com";
const COLOR_HEX={red:"#ff4444",blue:"#33b5ff",pink:"#ff69b4",purple:"#a64dff"};
const COLOR_NAMES_RU={red:"Красный",blue:"Голубой",pink:"Розовый",purple:"Фиолетовый"};
let u,amount,gift,unsubOrders,unsubPending,unsubApproved,unsubAdminTasks,unsubVip,unsubShop,unsubPromo,timeInterval;
let tasksCache=[],subsByTask={},lastSpinMs=0,isVip=false,myData={};

/* ---------- i18n ---------- */
const I18N={
ru:{appTitle:"⭐ Бесплатные звёзды",appTagline:"Выполняй задания и получай звёзды.",emailPh:"Email",passPh:"Пароль",loginBtn:"Войти",regBtn:"Регистрация",logoutBtn:"Выйти",
navTasks:"📋 Задания",navWithdraw:"🎁 Вывод",navPromo:"🎟 Промокод",navSpin:"🎰 Спин",navWithdrawals:"📊 Выводы",navReferrals:"🤝 Рефералы",navLeaderboard:"🏆 Топ",navVip:"👑 VIP",navShop:"🛍 Магазин",navProfile:"👤 Профиль",navSettings:"⚙️ Настройки",navAdmin:"🛠 Админ",
tasksHeader:"Задания",createOwnTask:"➕ Создать своё задание",customTaskPrice:"Своё задание стоит 15 ⭐ и будет активно 2 недели.",customTaskContact:"За покупкой — к @WexBob. Напишите ему, обговорим какое задание нужно, и я сам его выставлю.",writeWexBob:"Написать @WexBob",
backBtn:"← Главное меню",withdrawHeader:"🎁 Вывод",withdrawWarn:"Если звёзд недостаточно, вывести их нельзя.",withdrawChooseAmount:"Выберите сумму:",
promoHeader:"🎟 Промокод",promoPh:"Введите промокод",promoBtn:"Активировать",
spinHeader:"🎰 Free Spin",spinDesc:"Раз в 24 часа можно испытать удачу: 0 ⭐ (40%) / 1 ⭐ (50%) / 5 ⭐ (10%).",spinBtn:"Крутить",
withdrawalsHeader:"📊 Выводы",withdrawalsTotal:"Всего выводов подтверждено:",
referralsHeader:"🤝 Рефералы",referralsDesc:"Приглашай друзей (максимум 3 за всё время). Когда приглашённый выполнит 2 задания — тебе начислится 1 ⭐.",referralsInvited:"Приглашено:",copyRefBtn:"Скопировать ссылку",
leaderboardHeader:"🏆 Топ по выводам",
vipHeader:"👑 VIP-статус",vipList1:"Префикс VIP у ника в Топе по выводам",vipList2:"+5 ⭐ сразу при покупке",vipList3:"Более быстрая проверка заданий",vipPrice:"Цена: 50 ⭐ в месяц.",vipContact:"За покупкой — к @WexBob.",vipBuyBtn:"Купить VIP",
shopHeader:"🛍 Магазин",shopDesc:"Цвет ника — 15 ⭐ за цвет. Покупка через @WexBob, после — подтверждение в админ-панели.",
profileHeader:"👤 Профиль",profileTime:"Времени на сайте:",profileWithdrawn:"Всего выведено:",profilePrivateLabel:"Приватный профиль",
settingsHeader:"⚙️ Настройки",settingsUsernameLabel:"Ваш Telegram username (используется в заданиях):",saveBtn:"Сохранить",settingsThemeLabel:"Тема оформления:",settingsLangLabel:"Язык:",
adminHeader:"🛠 Админ-панель",adminCreate:"➕ Создать задание",adminMyTasks:"📋 Мои задания",adminPending:"✅ Проверка заданий",adminApproved:"💫 Забрать звёзды",adminOrders:"🎁 Заявки на вывод",adminVip:"👑 Выдача VIP",adminShop:"🎨 Заявки на цвет",
titlePh:"Название (например: Подпишись на канал X)",descPh:"Описание (необязательно)",linkPh:"Ссылка на Telegram-канал/пост",rewardPh:"Награда ⭐ (можно 0.1 или 0.5)",addTaskBtn:"Создать задание",
visitsLabel:"Посещений сайта:",usersLabel:"Зарегистрировано пользователей:",
doTask:"Выполнить",doneTask:"Выполнено",pendingTask:"На проверке",confirmBtn:"Подтвердить",declineBtn:"Отклонить",deleteBtn:"Удалить",acceptBtn:"Принять"},
en:{appTitle:"⭐ Free Stars",appTagline:"Complete tasks and earn stars.",emailPh:"Email",passPh:"Password",loginBtn:"Log in",regBtn:"Sign up",logoutBtn:"Log out",
navTasks:"📋 Tasks",navWithdraw:"🎁 Withdraw",navPromo:"🎟 Promo code",navSpin:"🎰 Spin",navWithdrawals:"📊 Withdrawals",navReferrals:"🤝 Referrals",navLeaderboard:"🏆 Leaderboard",navVip:"👑 VIP",navShop:"🛍 Shop",navProfile:"👤 Profile",navSettings:"⚙️ Settings",navAdmin:"🛠 Admin",
tasksHeader:"Tasks",createOwnTask:"➕ Create your own task",customTaskPrice:"A custom task costs 15 ⭐ and stays active for 2 weeks.",customTaskContact:"To buy, contact @WexBob. We'll discuss the task and I'll set it up myself.",writeWexBob:"Message @WexBob",
backBtn:"← Main menu",withdrawHeader:"🎁 Withdraw",withdrawWarn:"If you don't have enough stars, you can't withdraw.",withdrawChooseAmount:"Choose an amount:",
promoHeader:"🎟 Promo code",promoPh:"Enter promo code",promoBtn:"Activate",
spinHeader:"🎰 Free Spin",spinDesc:"Once every 24 hours try your luck: 0 ⭐ (40%) / 1 ⭐ (50%) / 5 ⭐ (10%).",spinBtn:"Spin",
withdrawalsHeader:"📊 Withdrawals",withdrawalsTotal:"Total confirmed withdrawals:",
referralsHeader:"🤝 Referrals",referralsDesc:"Invite friends (max 3 total). When an invited friend completes 2 tasks, you get 1 ⭐.",referralsInvited:"Invited:",copyRefBtn:"Copy link",
leaderboardHeader:"🏆 Withdrawal leaderboard",
vipHeader:"👑 VIP status",vipList1:"VIP prefix on the leaderboard",vipList2:"+5 ⭐ instantly on purchase",vipList3:"Faster task review",vipPrice:"Price: 50 ⭐ per month.",vipContact:"To buy, contact @WexBob.",vipBuyBtn:"Buy VIP",
shopHeader:"🛍 Shop",shopDesc:"Nickname color — 15 ⭐ each. Buy via @WexBob, then confirmed in the admin panel.",
profileHeader:"👤 Profile",profileTime:"Time on site:",profileWithdrawn:"Total withdrawn:",profilePrivateLabel:"Private profile",
settingsHeader:"⚙️ Settings",settingsUsernameLabel:"Your Telegram username (used for tasks):",saveBtn:"Save",settingsThemeLabel:"Theme:",settingsLangLabel:"Language:",
adminHeader:"🛠 Admin panel",adminCreate:"➕ Create task",adminMyTasks:"📋 My tasks",adminPending:"✅ Review tasks",adminApproved:"💫 Reclaim stars",adminOrders:"🎁 Withdrawal requests",adminVip:"👑 Grant VIP",adminShop:"🎨 Color requests",
titlePh:"Title (e.g.: Subscribe to channel X)",descPh:"Description (optional)",linkPh:"Telegram channel/post link",rewardPh:"Reward ⭐ (0.1 or 0.5 allowed)",addTaskBtn:"Create task",
visitsLabel:"Site visits:",usersLabel:"Registered users:",
doTask:"Complete",doneTask:"Done",pendingTask:"Reviewing",confirmBtn:"Confirm",declineBtn:"Decline",deleteBtn:"Delete",acceptBtn:"Accept"},
uz:{appTitle:"⭐ Bepul Stars",appTagline:"Vazifalarni bajaring va stars oling.",emailPh:"Email",passPh:"Parol",loginBtn:"Kirish",regBtn:"Ro'yxatdan o'tish",logoutBtn:"Chiqish",
navTasks:"📋 Vazifalar",navWithdraw:"🎁 Yechish",navPromo:"🎟 Promo kod",navSpin:"🎰 Spin",navWithdrawals:"📊 Yechimlar",navReferrals:"🤝 Referallar",navLeaderboard:"🏆 Reyting",navVip:"👑 VIP",navShop:"🛍 Do'kon",navProfile:"👤 Profil",navSettings:"⚙️ Sozlamalar",navAdmin:"🛠 Admin",
tasksHeader:"Vazifalar",createOwnTask:"➕ O'z vazifangizni yarating",customTaskPrice:"Shaxsiy vazifa narxi 15 ⭐, 2 hafta faol turadi.",customTaskContact:"Sotib olish uchun @WexBob ga yozing. Vazifani muhokama qilamiz va o'zim joylashtiraman.",writeWexBob:"@WexBob ga yozish",
backBtn:"← Bosh menyu",withdrawHeader:"🎁 Yechish",withdrawWarn:"Agar stars yetarli bo'lmasa, yechib bo'lmaydi.",withdrawChooseAmount:"Miqdorni tanlang:",
promoHeader:"🎟 Promo kod",promoPh:"Promo kodni kiriting",promoBtn:"Faollashtirish",
spinHeader:"🎰 Free Spin",spinDesc:"24 soatda bir marta omadingizni sinab ko'ring: 0 ⭐ (40%) / 1 ⭐ (50%) / 5 ⭐ (10%).",spinBtn:"Aylantirish",
withdrawalsHeader:"📊 Yechimlar",withdrawalsTotal:"Tasdiqlangan yechimlar soni:",
referralsHeader:"🤝 Referallar",referralsDesc:"Do'stlaringizni taklif qiling (jami 3 tagacha). Taklif qilingan do'st 2 ta vazifani bajarsa — sizga 1 ⭐ beriladi.",referralsInvited:"Taklif qilingan:",copyRefBtn:"Havolani nusxalash",
leaderboardHeader:"🏆 Yechimlar reytingi",
vipHeader:"👑 VIP status",vipList1:"Reytingda ism oldida VIP belgisi",vipList2:"Sotib olishda darhol +5 ⭐",vipList3:"Vazifalar tezroq tekshiriladi",vipPrice:"Narxi: oyiga 50 ⭐.",vipContact:"Sotib olish uchun @WexBob ga yozing.",vipBuyBtn:"VIP sotib olish",
shopHeader:"🛍 Do'kon",shopDesc:"Ism rangi — har biri 15 ⭐. @WexBob orqali sotib oling, so'ng admin panelda tasdiqlanadi.",
profileHeader:"👤 Profil",profileTime:"Saytda o'tkazilgan vaqt:",profileWithdrawn:"Jami yechilgan:",profilePrivateLabel:"Maxfiy profil",
settingsHeader:"⚙️ Sozlamalar",settingsUsernameLabel:"Telegram username (vazifalar uchun ishlatiladi):",saveBtn:"Saqlash",settingsThemeLabel:"Mavzu:",settingsLangLabel:"Til:",
adminHeader:"🛠 Admin panel",adminCreate:"➕ Vazifa yaratish",adminMyTasks:"📋 Mening vazifalarim",adminPending:"✅ Vazifalarni tekshirish",adminApproved:"💫 Starsni qaytarib olish",adminOrders:"🎁 Yechish so'rovlari",adminVip:"👑 VIP berish",adminShop:"🎨 Rang so'rovlari",
titlePh:"Nomi (masalan: X kanaliga obuna bo'ling)",descPh:"Tavsif (ixtiyoriy)",linkPh:"Telegram kanal/post havolasi",rewardPh:"Mukofot ⭐ (0.1 yoki 0.5 mumkin)",addTaskBtn:"Vazifa yaratish",
visitsLabel:"Sayt tashriflari:",usersLabel:"Ro'yxatdan o'tgan foydalanuvchilar:",
doTask:"Bajarish",doneTask:"Bajarildi",pendingTask:"Tekshirilmoqda",confirmBtn:"Tasdiqlash",declineBtn:"Rad etish",deleteBtn:"O'chirish",acceptBtn:"Qabul qilish"},
be:{appTitle:"⭐ Бясплатныя зоркі",appTagline:"Выконвай заданні і атрымлівай зоркі.",emailPh:"Email",passPh:"Пароль",loginBtn:"Увайсці",regBtn:"Рэгістрацыя",logoutBtn:"Выйсці",
navTasks:"📋 Заданні",navWithdraw:"🎁 Вывад",navPromo:"🎟 Промакод",navSpin:"🎰 Спін",navWithdrawals:"📊 Выводы",navReferrals:"🤝 Рэферал",navLeaderboard:"🏆 Топ",navVip:"👑 VIP",navShop:"🛍 Крама",navProfile:"👤 Профіль",navSettings:"⚙️ Налады",navAdmin:"🛠 Адмін",
tasksHeader:"Заданні",createOwnTask:"➕ Стварыць сваё заданне",customTaskPrice:"Сваё заданне каштуе 15 ⭐ і будзе актыўным 2 тыдні.",customTaskContact:"За куплю — да @WexBob. Абмяркуем заданне, і я сам яго выстаўлю.",writeWexBob:"Напісаць @WexBob",
backBtn:"← Галоўнае меню",withdrawHeader:"🎁 Вывад",withdrawWarn:"Калі зорак недастаткова, вывесці іх нельга.",withdrawChooseAmount:"Выберыце суму:",
promoHeader:"🎟 Промакод",promoPh:"Увядзіце промакод",promoBtn:"Актываваць",
spinHeader:"🎰 Free Spin",spinDesc:"Раз на 24 гадзіны можна паспрабаваць удачу: 0 ⭐ (40%) / 1 ⭐ (50%) / 5 ⭐ (10%).",spinBtn:"Круціць",
withdrawalsHeader:"📊 Выводы",withdrawalsTotal:"Усяго пацверджаных вывадаў:",
referralsHeader:"🤝 Рэфералы",referralsDesc:"Запрашай сяброў (максімум 3 за ўвесь час). Калі запрошаны выканае 2 заданні — табе налічыцца 1 ⭐.",referralsInvited:"Запрошана:",copyRefBtn:"Скапіяваць спасылку",
leaderboardHeader:"🏆 Топ па вывадах",
vipHeader:"👑 VIP-статус",vipList1:"Прэфікс VIP у ніку ў Топе",vipList2:"+5 ⭐ адразу пры куплі",vipList3:"Больш хуткая праверка заданняў",vipPrice:"Цана: 50 ⭐ у месяц.",vipContact:"За куплю — да @WexBob.",vipBuyBtn:"Купіць VIP",
shopHeader:"🛍 Крама",shopDesc:"Колер ніка — 15 ⭐ за колер. Купля праз @WexBob, пасля — пацвярджэнне ў адмін-панэлі.",
profileHeader:"👤 Профіль",profileTime:"Часу на сайце:",profileWithdrawn:"Усяго выведзена:",profilePrivateLabel:"Прыватны профіль",
settingsHeader:"⚙️ Налады",settingsUsernameLabel:"Ваш Telegram username (выкарыстоўваецца ў заданнях):",saveBtn:"Захаваць",settingsThemeLabel:"Тэма афармлення:",settingsLangLabel:"Мова:",
adminHeader:"🛠 Адмін-панэль",adminCreate:"➕ Стварыць заданне",adminMyTasks:"📋 Мае заданні",adminPending:"✅ Праверка заданняў",adminApproved:"💫 Забраць зоркі",adminOrders:"🎁 Заяўкі на вывад",adminVip:"👑 Выдача VIP",adminShop:"🎨 Заяўкі на колер",
titlePh:"Назва (напрыклад: Падпішыся на канал X)",descPh:"Апісанне (неабавязкова)",linkPh:"Спасылка на Telegram-канал/пост",rewardPh:"Узнагарода ⭐ (можна 0.1 ці 0.5)",addTaskBtn:"Стварыць заданне",
visitsLabel:"Наведванняў сайта:",usersLabel:"Зарэгістравана карыстальнікаў:",
doTask:"Выканаць",doneTask:"Выканана",pendingTask:"На праверцы",confirmBtn:"Пацвердзіць",declineBtn:"Адхіліць",deleteBtn:"Выдаліць",acceptBtn:"Прыняць"},
uk:{appTitle:"⭐ Безкоштовні зірки",appTagline:"Виконуй завдання та отримуй зірки.",emailPh:"Email",passPh:"Пароль",loginBtn:"Увійти",regBtn:"Реєстрація",logoutBtn:"Вийти",
navTasks:"📋 Завдання",navWithdraw:"🎁 Вивід",navPromo:"🎟 Промокод",navSpin:"🎰 Спін",navWithdrawals:"📊 Виводи",navReferrals:"🤝 Реферали",navLeaderboard:"🏆 Топ",navVip:"👑 VIP",navShop:"🛍 Магазин",navProfile:"👤 Профіль",navSettings:"⚙️ Налаштування",navAdmin:"🛠 Адмін",
tasksHeader:"Завдання",createOwnTask:"➕ Створити своє завдання",customTaskPrice:"Своє завдання коштує 15 ⭐ і буде активним 2 тижні.",customTaskContact:"За покупкою — до @WexBob. Обговоримо завдання, і я сам його виставлю.",writeWexBob:"Написати @WexBob",
backBtn:"← Головне меню",withdrawHeader:"🎁 Вивід",withdrawWarn:"Якщо зірок недостатньо, вивести їх не можна.",withdrawChooseAmount:"Оберіть суму:",
promoHeader:"🎟 Промокод",promoPh:"Введіть промокод",promoBtn:"Активувати",
spinHeader:"🎰 Free Spin",spinDesc:"Раз на 24 години можна випробувати удачу: 0 ⭐ (40%) / 1 ⭐ (50%) / 5 ⭐ (10%).",spinBtn:"Крутити",
withdrawalsHeader:"📊 Виводи",withdrawalsTotal:"Всього підтверджених виводів:",
referralsHeader:"🤝 Реферали",referralsDesc:"Запрошуй друзів (максимум 3 за весь час). Коли запрошений виконає 2 завдання — тобі нарахується 1 ⭐.",referralsInvited:"Запрошено:",copyRefBtn:"Скопіювати посилання",
leaderboardHeader:"🏆 Топ за виводами",
vipHeader:"👑 VIP-статус",vipList1:"Префікс VIP біля ніку в Топі",vipList2:"+5 ⭐ одразу при покупці",vipList3:"Швидша перевірка завдань",vipPrice:"Ціна: 50 ⭐ на місяць.",vipContact:"За покупкою — до @WexBob.",vipBuyBtn:"Купити VIP",
shopHeader:"🛍 Магазин",shopDesc:"Колір ніку — 15 ⭐ за колір. Покупка через @WexBob, потім підтвердження в адмін-панелі.",
profileHeader:"👤 Профіль",profileTime:"Часу на сайті:",profileWithdrawn:"Всього виведено:",profilePrivateLabel:"Приватний профіль",
settingsHeader:"⚙️ Налаштування",settingsUsernameLabel:"Ваш Telegram username (використовується у завданнях):",saveBtn:"Зберегти",settingsThemeLabel:"Тема оформлення:",settingsLangLabel:"Мова:",
adminHeader:"🛠 Адмін-панель",adminCreate:"➕ Створити завдання",adminMyTasks:"📋 Мої завдання",adminPending:"✅ Перевірка завдань",adminApproved:"💫 Забрати зірки",adminOrders:"🎁 Заявки на вивід",adminVip:"👑 Видача VIP",adminShop:"🎨 Заявки на колір",
titlePh:"Назва (наприклад: Підпишись на канал X)",descPh:"Опис (необов'язково)",linkPh:"Посилання на Telegram-канал/пост",rewardPh:"Нагорода ⭐ (можна 0.1 або 0.5)",addTaskBtn:"Створити завдання",
visitsLabel:"Відвідувань сайту:",usersLabel:"Зареєстровано користувачів:",
doTask:"Виконати",doneTask:"Виконано",pendingTask:"На перевірці",confirmBtn:"Підтвердити",declineBtn:"Відхилити",deleteBtn:"Видалити",acceptBtn:"Прийняти"}
};
let curLang=localStorage.getItem("lang")||"ru";
function t(key){return(I18N[curLang]&&I18N[curLang][key])||I18N.ru[key]||key}
function applyLang(){
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>el.placeholder=t(el.dataset.i18nPh));
  document.documentElement.lang=curLang;
}
applyLang();
$("langSelect").value=curLang;
$("langSelect").onchange=()=>{localStorage.setItem("lang",$("langSelect").value);location.reload()};

/* ---------- Тема оформления ---------- */
const THEMES=["dark","light","pink","white","orange","pastel","glass"];
function applyTheme(th){
  THEMES.forEach(x=>document.body.classList.remove(x));
  if(th!=="dark")document.body.classList.add(th);
  localStorage.setItem("theme",th);
}
applyTheme(localStorage.getItem("theme")||"dark");
document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>applyTheme(b.dataset.theme));

const FONTSIZES=["text-sm","text-lg"];
function applyFontSize(sz){
  FONTSIZES.forEach(x=>document.body.classList.remove(x));
  if(sz==="sm")document.body.classList.add("text-sm");
  if(sz==="lg")document.body.classList.add("text-lg");
  localStorage.setItem("fontSize",sz);
}
applyFontSize(localStorage.getItem("fontSize")||"md");
document.querySelectorAll("[data-fontsize]").forEach(b=>b.onclick=()=>applyFontSize(b.dataset.fontsize));

function applyGlow(on){
  document.body.classList.toggle("glow",on);
  localStorage.setItem("glow",on?"1":"0");
}
let glowOn=localStorage.getItem("glow")!=="0";
applyGlow(glowOn);
$("glowToggle").checked=glowOn;
$("glowToggle").onchange=()=>applyGlow($("glowToggle").checked);

/* ---------- Счётчик посещений ---------- */
setDoc(doc(db,"stats","global"),{totalVisits:increment(1)},{merge:true}).catch(()=>{});
onSnapshot(doc(db,"stats","global"),s=>{
  const d=s.data()||{};
  $("visitCount").textContent=d.totalVisits||0;
  $("userCount").textContent=d.totalUsers||0;
});

function syncPublicProfile(uid,fields){setDoc(doc(db,"publicProfiles",uid),fields,{merge:true}).catch(()=>{})}
function formatDuration(ms){let mins=Math.floor(ms/60000),h=Math.floor(mins/60),m=mins%60;return h>0?`${h}ч ${m}м`:`${m}м`}

$("customTaskBtn").onclick=()=>{$("customTaskInfo").hidden=!$("customTaskInfo").hidden};

const refParam=new URLSearchParams(location.search).get("ref");
$("reg").onclick=async()=>{
  try{
    const c=await createUserWithEmailAndPassword(auth,$("email").value,$("pass").value);
    let referredBy=null,referralDocId=null;
    if(refParam&&refParam!==c.user.uid){
      try{
        await runTransaction(db,async t=>{
          let rud=doc(db,"users",refParam),rus=await t.get(rud);
          if(rus.exists()&&(rus.data().referralCount||0)<3){
            let rd=doc(collection(db,"referrals"));
            t.set(rd,{referrerId:refParam,referredId:c.user.uid,tasksCompleted:0,rewarded:false,createdAt:serverTimestamp()});
            t.update(rud,{referralCount:(rus.data().referralCount||0)+1});
            referredBy=refParam;referralDocId=rd.id;
          }
        });
      }catch(e){/*реферал не критичен*/}
    }
    await setDoc(doc(db,"users",c.user.uid),{email:c.user.email,balance:0,createdAt:serverTimestamp(),referredBy,referralDocId,referralRewarded:false});
    await setDoc(doc(db,"stats","global"),{totalUsers:increment(1)},{merge:true});
  }catch(e){$("authMsg").textContent=e.message}
};
$("login").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value,$("pass").value)}catch(e){$("authMsg").textContent=e.message}};
$("logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,x=>{
  u=x;
  if(!x){$("auth").hidden=false;$("main").hidden=true;if(timeInterval)clearInterval(timeInterval);return}
  $("auth").hidden=true;$("main").hidden=false;
  $("refLink").value=location.origin+location.pathname+"?ref="+u.uid;
  onSnapshot(doc(db,"users",u.uid),s=>{
    myData=s.data()||{};
    $("bal").textContent=myData.balance||0;
    $("adminBtn").hidden=u.email!==ADMIN_EMAIL;
    lastSpinMs=myData.lastSpinAt?.toMillis()||0;
    updateSpinUI();
    $("refCount").textContent=myData.referralCount||0;
    let vipUntilMs=myData.vipUntil?.toMillis()||0;
    isVip=!!(myData.vip&&vipUntilMs>Date.now());
    $("vipStatus").textContent=isVip?`✅ VIP активен до ${new Date(vipUntilMs).toLocaleDateString()}`:"VIP не активен";
    $("myUsername").value=myData.telegramUsername||"";
    $("profTime").textContent=formatDuration(myData.totalTimeMs||0);
    $("profWithdrawn").textContent=myData.totalWithdrawn||0;
    $("profPrivate").checked=!!myData.profilePrivate;
    renderColorPicker();
    $("glassThemeBtnWrap").hidden=!(myData.ownedThemes||[]).includes("glass");
    renderUserTasks();
  });
  listenTasks();
  listenMySubs();
  listenWithdrawals();
  listenMyReferrals();
  listenLeaderboard();
  if(timeInterval)clearInterval(timeInterval);
  timeInterval=setInterval(()=>{
    let nt=(myData.totalTimeMs||0)+60000;
    updateDoc(doc(db,"users",u.uid),{totalTimeMs:nt}).catch(()=>{});
    syncPublicProfile(u.uid,{totalTimeMs:nt});
  },60000);
});

$("copyRef").onclick=()=>{
  navigator.clipboard.writeText($("refLink").value).then(()=>{$("refMsg").textContent="OK!"});
};

$("saveUsername").onclick=async()=>{
  let v=$("myUsername").value.trim();
  if(!v)return;
  await updateDoc(doc(db,"users",u.uid),{telegramUsername:v});
  $("usernameMsg").textContent="✅";
};

$("profPrivate").onchange=()=>{
  let val=$("profPrivate").checked;
  updateDoc(doc(db,"users",u.uid),{profilePrivate:val});
  syncPublicProfile(u.uid,{profilePrivate:val});
};

$("buyVipBtn").onclick=async()=>{
  window.open("https://t.me/WexBob","_blank");
  try{
    await addDoc(collection(db,"viprequests"),{userId:u.uid,email:u.email,status:"pending",createdAt:serverTimestamp()});
    $("vipMsg").textContent="Заявка отправлена. Ожидайте подтверждения от администратора в ЛС.";
  }catch(e){$("vipMsg").textContent=e.message}
};

document.querySelectorAll("#shop [data-color]").forEach(b=>b.onclick=()=>{
  window.open("https://t.me/WexBob","_blank");
  addDoc(collection(db,"shoprequests"),{userId:u.uid,email:u.email,item:b.dataset.color,status:"pending",createdAt:serverTimestamp()})
    .then(()=>{$("shopMsg").textContent="Заявка отправлена!"})
    .catch(e=>{$("shopMsg").textContent=e.message});
});

function renderColorPicker(){
  let owned=myData.ownedColors||[];
  $("profColorPicker").innerHTML="";
  if(!owned.length){$("profColorPicker").innerHTML="<p>Цветов пока нет — загляните в 🛍 Магазин.</p>";return}
  let p=document.createElement("p");p.textContent="Доступные цвета:";$("profColorPicker").append(p);
  owned.forEach(c=>{
    let b=document.createElement("button");
    b.textContent=COLOR_NAMES_RU[c]||c;
    b.style.color=COLOR_HEX[c]||"";
    b.style.width="auto";b.style.display="inline-block";b.style.marginRight="6px";
    b.onclick=()=>{
      updateDoc(doc(db,"users",u.uid),{nickColor:c});
      syncPublicProfile(u.uid,{nickColor:c});
    };
    $("profColorPicker").append(b);
  });
}

function listenMyReferrals(){
  onSnapshot(query(collection(db,"referrals"),where("referrerId","==",u.uid)),s=>{
    $("refList").innerHTML="";
    let list=s.docs.map(x=>x.data());
    list.sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
    list.forEach(d=>{
      let e=document.createElement("div");e.className="sub";
      e.innerHTML=d.rewarded?`✅ Друг выполнил задания — начислена 1 ⭐`:`⏳ Прогресс друга: ${d.tasksCompleted||0}/2 заданий`;
      $("refList").append(e);
    });
  });
}

async function openProfileModal(uid,name){
  try{
    let s=await getDoc(doc(db,"publicProfiles",uid));
    let d=s.exists()?s.data():{};
    if(d.profilePrivate)return alert("Профиль этого пользователя скрыт.");
    alert(`Профиль ${name}\nВыведено: ${d.totalWithdrawn||0} ⭐\nВремя на сайте: ${formatDuration(d.totalTimeMs||0)}`);
  }catch(e){alert("Не удалось загрузить профиль.")}
}

function listenLeaderboard(){
  onSnapshot(collection(db,"withdrawals_public"),s=>{
    let totals={},vipNames=new Set(),colorByName={},userByName={};
    s.forEach(x=>{
      let d=x.data();
      totals[d.targetUsername]=(totals[d.targetUsername]||0)+(d.amount||0);
      if(d.vip)vipNames.add(d.targetUsername);
      if(d.nickColor)colorByName[d.targetUsername]=d.nickColor;
      if(d.userId)userByName[d.targetUsername]=d.userId;
    });
    let arr=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,20);
    $("leaderboardList").innerHTML="";
    arr.forEach(([name,total],i)=>{
      let e=document.createElement("div");e.className="sub";
      let color=COLOR_HEX[colorByName[name]]||null;
      let nameHtml=color?`<span style="color:${color}">${safe(name)}</span>`:safe(name);
      e.innerHTML=`${i+1}. <span class="profIcon">💀</span> ${vipNames.has(name)?'👑 VIP ':''}${nameHtml} — <b>${total}</b> ⭐`;
      let uid=userByName[name];
      if(uid)e.querySelector(".profIcon").onclick=()=>openProfileModal(uid,name);
      $("leaderboardList").append(e);
    });
  });
}

function listenTasks(){
  onSnapshot(query(collection(db,"tasks"),orderBy("createdAt","desc")),s=>{
    tasksCache=s.docs.map(x=>({id:x.id,...x.data()}));
    renderUserTasks();
  });
}
function listenMySubs(){
  onSnapshot(query(collection(db,"submissions"),where("userId","==",u.uid)),s=>{
    let list=s.docs.map(x=>({id:x.id,...x.data()}));
    list.sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
    subsByTask={};
    list.forEach(d=>{if(!(d.taskId in subsByTask))subsByTask[d.taskId]={status:d.status,id:d.id}});
    renderUserTasks();
  });
}
function renderUserTasks(){
  $("taskList").innerHTML="";
  let now=Date.now();
  tasksCache.forEach(d=>{
    let sub=subsByTask[d.id];
    let e=document.createElement("div");e.className="task";
    let label=t("doTask"),disabled=false;
    let expired=d.expiresAt&&d.expiresAt.toMillis()<now;
    let full=d.maxUses&&(d.usesCount||0)>=d.maxUses;
    if(sub&&sub.status==="approved"){label=t("doneTask");disabled=true}
    else if(sub&&sub.status==="pending"){label=t("pendingTask");disabled=true}
    else if(expired){label="Истекло";disabled=true}
    else if(full){label="Лимит исчерпан";disabled=true}
    let liked=(myData.likedTasks||[]).includes(d.id);
    let limitInfo=d.maxUses?` · ${d.usesCount||0}/${d.maxUses}`:"";
    e.innerHTML=`<span><b>${safe(d.title)}</b><br><small>${safe(d.description||"")} · +${d.reward} ⭐${limitInfo}</small><br><button class="likeBtn">${liked?"❤️":"🤍"} ${d.likesCount||0}</button></span><button class="doBtn" ${disabled?"disabled":""}>${label}</button>`;
    e.querySelector(".likeBtn").onclick=()=>toggleLike(d);
    if(!disabled)e.querySelector(".doBtn").onclick=()=>startTask(d);
    $("taskList").append(e);
  });
}
async function toggleLike(d){
  let liked=(myData.likedTasks||[]).includes(d.id);
  try{
    await runTransaction(db,async tr=>{
      let td=doc(db,"tasks",d.id),ud=doc(db,"users",u.uid);
      let[ts,us]=await Promise.all([tr.get(td),tr.get(ud)]);
      let likes=ts.data().likesCount||0,arr=us.data().likedTasks||[];
      if(liked){
        tr.update(td,{likesCount:Math.max(0,likes-1)});
        tr.update(ud,{likedTasks:arr.filter(x=>x!==d.id)});
      }else{
        tr.update(td,{likesCount:likes+1});
        tr.update(ud,{likedTasks:[...arr,d.id]});
      }
    });
  }catch(e){alert(e.message)}
}
async function startTask(d){
  let handle=myData.telegramUsername;
  if(!handle){
    handle=prompt("Введите ваш username в Telegram (без @ можно):");
    if(!handle||!handle.trim())return;
    handle=handle.trim();
    updateDoc(doc(db,"users",u.uid),{telegramUsername:handle}).catch(()=>{});
  }
  try{
    await runTransaction(db,async tr=>{
      let td=doc(db,"tasks",d.id),ts=await tr.get(td),tdata=ts.data()||{};
      if(tdata.expiresAt&&tdata.expiresAt.toMillis()<Date.now())throw Error("Срок задания истёк.");
      if(tdata.maxUses&&(tdata.usesCount||0)>=tdata.maxUses)throw Error("Достигнут лимит выполнений.");
      tr.update(td,{usesCount:(tdata.usesCount||0)+1});
      let sd=doc(collection(db,"submissions"));
      tr.set(sd,{taskId:d.id,title:d.title,reward:d.reward,link:d.link||"",telegramUsername:handle,userId:u.uid,status:"pending",vip:isVip,createdAt:serverTimestamp()});
    });
    if(d.link)window.open(d.link,"_blank");
  }catch(e){alert(e.message)}
}

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".page").forEach(x=>x.hidden=true);
  $(b.dataset.page).hidden=false;
});

document.querySelectorAll("[data-apage]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".apage").forEach(x=>x.hidden=true);
  $("admin-"+b.dataset.apage).hidden=false;
  if(b.dataset.apage==="mytasks")loadAdminTasks();
  if(b.dataset.apage==="pending")loadPendingSubs();
  if(b.dataset.apage==="approved")loadApprovedSubs();
  if(b.dataset.apage==="orders")loadOrders();
  if(b.dataset.apage==="vip")loadVipRequests();
  if(b.dataset.apage==="shop")loadShopRequests();
  if(b.dataset.apage==="promo")loadAdminPromos();
});

$("usePromo").onclick=async()=>{
  let code=$("promoCode").value.trim();
  let grantedColor=null;
  try{
    await runTransaction(db,async t=>{
      let ud=doc(db,"users",u.uid),pd=doc(db,"promocodes",code),rd=doc(db,"users",u.uid,"promos",code);
      let[us,ps,rs]=await Promise.all([t.get(ud),t.get(pd),t.get(rd)]);
      if(!ps.exists())throw Error("Промокод не найден.");
      let p=ps.data();
      if(rs.exists())throw Error("Уже использован.");
      if(p.maxUses!=null&&(p.usedCount||0)>=p.maxUses)throw Error("Промокод исчерпан.");
      let udata=us.data()||{};
      if(p.type==="stars"){
        t.update(ud,{balance:(udata.balance||0)+(p.amount||0)});
      }else if(p.type==="vip"){
        let until=new Date(Date.now()+30*24*60*60*1000);
        t.update(ud,{vip:true,vipUntil:until,balance:(udata.balance||0)+5});
      }else if(p.type==="color"){
        let owned=udata.ownedColors||[];
        if(!owned.includes(p.color))owned=[...owned,p.color];
        t.update(ud,{ownedColors:owned,nickColor:p.color});
        grantedColor=p.color;
      }else if(p.type==="theme"){
        let ownedT=udata.ownedThemes||[];
        if(!ownedT.includes("glass"))ownedT=[...ownedT,"glass"];
        t.update(ud,{ownedThemes:ownedT});
      }else{
        throw Error("Промокод не найден.");
      }
      t.update(pd,{usedCount:(p.usedCount||0)+1});
      t.set(rd,{at:serverTimestamp()});
    });
    if(grantedColor)syncPublicProfile(u.uid,{nickColor:grantedColor});
    $("promoMsg").textContent="Готово!";
  }catch(e){$("promoMsg").textContent=e.message}
};

$("withdraw").addEventListener("click",async e=>{
  let a=e.target.dataset.amount,g=e.target.dataset.g,p=e.target.dataset.p,m=e.target.dataset.m;
  if(a){
    amount=+a;
    if(+$("bal").textContent<amount)return $("flow").innerHTML='<p class="bad">Недостаточно звёзд.</p>';
    if(amount===50){
      gift="Тортик";
      $("flow").innerHTML='<input id="who" placeholder="@username"><button data-p="Анонимно">Анонимно</button><button data-p="Неанонимно">Неанонимно</button>';
    }else if(amount===25){
      $("flow").innerHTML='<h3>Выберите подарок:</h3><div class="gift"><button data-g="Роза">🌹 Роза</button><button data-g="Подарок">🎁 Подарок</button></div>';
    }else{
      $("flow").innerHTML='<h3>Выберите подарок:</h3><div class="gift"><button data-g="Мишка">🧸 Мишка</button><button data-g="Сердце">❤️ Сердце</button></div>';
    }
  }else if(g){
    gift=g;
    $("flow").innerHTML='<input id="who" placeholder="@username"><button data-p="Анонимно">Анонимно</button><button data-p="Неанонимно">Неанонимно</button>';
  }else if(p){
    let who=$("who").value.trim();
    if(!who)return alert("Введите username");
    $("flow").innerHTML='<h3>Надпись</h3><button data-m="">Без надписи</button><button data-m="Дефаю От Бомжей💀">Дефаю От Бомжей💀</button><button data-m="Крутой🤙">Крутой🤙</button><button data-m="Привет🧤">Привет🧤</button><button data-m="Пупсик🥺">Пупсик🥺</button>';
    window.orderData={who,p};
  }else if(m!==undefined){
    let{who,p}=window.orderData;
    try{
      await runTransaction(db,async t=>{
        let ud=doc(db,"users",u.uid),us=await t.get(ud),bal=us.data().balance||0;
        if(bal<amount)throw Error("Недостаточно звёзд.");
        t.update(ud,{balance:bal-amount});
        let od=doc(collection(db,"orders"));
        t.set(od,{userId:u.uid,amount,gift,targetUsername:who,privacy:p,message:m,status:"pending",createdAt:serverTimestamp()});
      });
      $("flow").innerHTML='<p class="ok">Заявка отправлена администратору.</p>';
    }catch(e){alert(e.message)}
  }
});

/* ---------- Free Spin ---------- */
function updateSpinUI(){
  let remaining=24*60*60*1000-(Date.now()-lastSpinMs);
  if(remaining>0){
    $("spinBtn").disabled=true;
    let hh=Math.floor(remaining/3600000),mm=Math.floor((remaining%3600000)/60000),ss=Math.floor((remaining%60000)/1000);
    $("spinMsg").textContent=`Следующий спин через ${hh}ч ${mm}м ${ss}с`;
  }else{
    $("spinBtn").disabled=false;
    if($("spinMsg").textContent.startsWith("Следующий"))$("spinMsg").textContent="";
  }
}
setInterval(updateSpinUI,1000);
$("spinBtn").onclick=async()=>{
  try{
    let result;
    await runTransaction(db,async t=>{
      let ud=doc(db,"users",u.uid),us=await t.get(ud),d=us.data()||{};
      let last=d.lastSpinAt?.toMillis()||0;
      if(Date.now()-last<24*60*60*1000)throw Error("Уже крутили сегодня.");
      let r=Math.random();
      result=r<0.4?0:(r<0.9?1:5);
      t.update(ud,{balance:(d.balance||0)+result,lastSpinAt:serverTimestamp()});
    });
    $("spinMsg").textContent=result===0?"Не повезло — выпало 0 ⭐. Попробуйте завтра!":`Ура! Выпало ${result} ⭐!`;
  }catch(e){$("spinMsg").textContent=e.message}
};

/* ---------- Публичная статистика выводов ---------- */
function listenWithdrawals(){
  onSnapshot(query(collection(db,"withdrawals_public"),orderBy("approvedAt","desc")),s=>{
    $("withdrawCount").textContent=s.size;
    $("withdrawList").innerHTML="";
    s.docs.slice(0,20).forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="sub";
      e.innerHTML=`${safe(d.targetUsername)} получил ${safe(d.gift)} · ${d.amount} ⭐`;
      $("withdrawList").append(e);
    });
  });
}

/* ---------- Админ ---------- */
$("addTask").onclick=async()=>{
  let title=$("tTitle").value.trim(),description=$("tDesc").value.trim(),link=$("tLink").value.trim(),reward=parseFloat($("tReward").value);
  if(!title||!link||!reward||reward<=0)return alert("Заполни название, ссылку и награду (больше 0)");
  let maxUses=$("tMaxUses").value?parseInt($("tMaxUses").value):null;
  let durVal=$("tDurationVal").value?parseFloat($("tDurationVal").value):null;
  let durUnit=$("tDurationUnit").value;
  let data={title,description,link,reward,likesCount:0,usesCount:0,createdAt:serverTimestamp()};
  if(maxUses)data.maxUses=maxUses;
  if(durVal){
    let ms=durUnit==="hours"?durVal*3600000:durVal*86400000;
    data.expiresAt=new Date(Date.now()+ms);
  }
  await addDoc(collection(db,"tasks"),data);
  $("tTitle").value="";$("tDesc").value="";$("tLink").value="";$("tReward").value="";$("tMaxUses").value="";$("tDurationVal").value="";
};

function loadAdminTasks(){
  if(unsubAdminTasks)unsubAdminTasks();
  unsubAdminTasks=onSnapshot(query(collection(db,"tasks"),orderBy("createdAt","desc")),s=>{
    $("adminTasks").innerHTML="";
    s.forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="sub";
      e.innerHTML=`<b>${safe(d.title)}</b> · +${d.reward} ⭐ · 🤍${d.likesCount||0}${d.maxUses?` · ${d.usesCount||0}/${d.maxUses}`:""}${d.expiresAt?` · до ${d.expiresAt.toDate().toLocaleString()}`:""}<br><small>${safe(d.link||"")}</small><br><button class="del">${t("deleteBtn")}</button>`;
      e.querySelector(".del").onclick=()=>{if(confirm("Удалить задание?"))deleteDoc(doc(db,"tasks",x.id))};
      $("adminTasks").append(e);
    });
  });
}

function loadPendingSubs(){
  if(unsubPending)unsubPending();
  unsubPending=onSnapshot(query(collection(db,"submissions"),where("status","==","pending")),s=>{
    let list=s.docs.map(x=>({id:x.id,...x.data()}));
    list.sort((a,b)=>(b.vip?1:0)-(a.vip?1:0)||(a.createdAt?.toMillis()||0)-(b.createdAt?.toMillis()||0));
    $("pendingCount").textContent=list.length;
    $("pendingSubs").innerHTML="";
    list.forEach(d=>{
      let e=document.createElement("div");e.className="sub";
      e.innerHTML=`<b>${d.vip?"👑 ":""}${safe(d.title)}</b> · +${d.reward} ⭐<br>Telegram: <b>${safe(d.telegramUsername)}</b>${d.link?` · <a href="${safe(d.link)}" target="_blank">ссылка</a>`:""}<br><button class="ok">${t("confirmBtn")}</button><button class="bad">${t("declineBtn")}</button>`;
      e.querySelector(".ok").onclick=()=>approveSub(d);
      e.querySelector(".bad").onclick=async()=>{
        await updateDoc(doc(db,"submissions",d.id),{status:"rejected",rejectedAt:serverTimestamp()});
        try{
          let td=doc(db,"tasks",d.taskId),ts=await getDoc(td);
          if(ts.exists())await updateDoc(td,{usesCount:Math.max(0,(ts.data().usesCount||0)-1)});
        }catch(err){}
      };
      $("pendingSubs").append(e);
    });
  });
}
async function approveSub(d){
  try{
    await runTransaction(db,async t=>{
      let sd=doc(db,"submissions",d.id),ud=doc(db,"users",d.userId);
      let[ss,us]=await Promise.all([t.get(sd),t.get(ud)]);
      if(ss.data().status!=="pending")throw Error("Уже обработано.");
      let udata=us.data()||{};
      let refDoc=null,refSnap=null,referrerDoc=null,referrerSnap=null,newCount=0,willReward=false;
      if(udata.referredBy&&udata.referralDocId&&!udata.referralRewarded){
        refDoc=doc(db,"referrals",udata.referralDocId);
        refSnap=await t.get(refDoc);
        if(refSnap.exists()&&!refSnap.data().rewarded){
          newCount=(refSnap.data().tasksCompleted||0)+1;
          if(newCount>=2){
            willReward=true;
            referrerDoc=doc(db,"users",refSnap.data().referrerId);
            referrerSnap=await t.get(referrerDoc);
          }
        }else{refDoc=null}
      }
      t.update(sd,{status:"approved",approvedAt:serverTimestamp()});
      t.update(ud,{balance:(udata.balance||0)+d.reward,...(willReward?{referralRewarded:true}:{})});
      if(refDoc)t.update(refDoc,{tasksCompleted:newCount,...(willReward?{rewarded:true}:{})});
      if(willReward&&referrerDoc)t.update(referrerDoc,{balance:(referrerSnap.data().balance||0)+1});
    });
  }catch(e){alert(e.message)}
}

function loadApprovedSubs(){
  if(unsubApproved)unsubApproved();
  unsubApproved=onSnapshot(query(collection(db,"submissions"),where("status","==","approved")),s=>{
    let list=s.docs.map(x=>({id:x.id,...x.data()}));
    list.sort((a,b)=>(b.approvedAt?.toMillis()||0)-(a.approvedAt?.toMillis()||0));
    $("approvedSubs").innerHTML="";
    let now=Date.now();
    list.forEach(d=>{
      let approvedMs=d.approvedAt?.toMillis()||0;
      let withinWeek=now-approvedMs<7*24*60*60*1000;
      let e=document.createElement("div");e.className="sub";
      e.innerHTML=`<b>${safe(d.title)}</b> · +${d.reward} ⭐<br>Telegram: <b>${safe(d.telegramUsername)}</b>${withinWeek?'<br><button class="bad">Отписался — забрать звёзды</button>':'<br><small>Срок отзыва истёк</small>'}`;
      let b=e.querySelector("button");
      if(b)b.onclick=()=>revokeSub(d);
      $("approvedSubs").append(e);
    });
  });
}
async function revokeSub(d){
  if(!confirm("Забрать "+d.reward+" ⭐ у пользователя за отписку?"))return;
  try{
    await runTransaction(db,async t=>{
      let sd=doc(db,"submissions",d.id),ud=doc(db,"users",d.userId);
      let[ss,us]=await Promise.all([t.get(sd),t.get(ud)]);
      if(ss.data().status!=="approved")throw Error("Уже обработано.");
      t.update(sd,{status:"revoked",revokedAt:serverTimestamp()});
      t.update(ud,{balance:Math.max(0,(us.data().balance||0)-d.reward)});
    });
  }catch(e){alert(e.message)}
}

function loadOrders(){
  if(unsubOrders)unsubOrders();
  unsubOrders=onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),s=>{
    $("orders").innerHTML="";
    s.forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="order";
      e.innerHTML=`${d.amount} ⭐ · ${safe(d.gift)} · ${safe(d.targetUsername)} · ${safe(d.privacy)} · ${safe(d.message||"Без надписи")}<br>Статус: ${safe(d.status)} ${d.status==="pending"?`<button>${t("confirmBtn")}</button>`:''}`;
      let b=e.querySelector("button");
      if(b)b.onclick=async()=>{
        let uSnap=await getDoc(doc(db,"users",d.userId));
        let ud2=uSnap.data()||{};
        let uVip=!!(ud2.vip&&(ud2.vipUntil?.toMillis()||0)>Date.now());
        let newTotal=(ud2.totalWithdrawn||0)+d.amount;
        await updateDoc(doc(db,"orders",x.id),{status:"approved",approvedAt:serverTimestamp()});
        await updateDoc(doc(db,"users",d.userId),{totalWithdrawn:newTotal});
        syncPublicProfile(d.userId,{totalWithdrawn:newTotal});
        await addDoc(collection(db,"withdrawals_public"),{gift:d.gift,amount:d.amount,targetUsername:d.targetUsername,approvedAt:serverTimestamp(),vip:uVip,userId:d.userId,nickColor:ud2.nickColor||null});
      };
      $("orders").append(e);
    });
  });
}

function loadVipRequests(){
  if(unsubVip)unsubVip();
  unsubVip=onSnapshot(query(collection(db,"viprequests"),where("status","==","pending")),s=>{
    $("vipRequests").innerHTML="";
    s.forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="sub";
      e.innerHTML=`${safe(d.email)}<br><button class="ok">${t("acceptBtn")}</button><button class="bad">${t("declineBtn")}</button>`;
      e.querySelector(".ok").onclick=()=>approveVip(x.id,d.userId);
      e.querySelector(".bad").onclick=()=>updateDoc(doc(db,"viprequests",x.id),{status:"declined",respondedAt:serverTimestamp()});
      $("vipRequests").append(e);
    });
  });
}
async function approveVip(reqId,userId){
  try{
    await runTransaction(db,async t=>{
      let ud=doc(db,"users",userId),us=await t.get(ud);
      let until=new Date(Date.now()+30*24*60*60*1000);
      t.update(ud,{vip:true,vipUntil:until,balance:(us.data().balance||0)+5});
      t.update(doc(db,"viprequests",reqId),{status:"approved",respondedAt:serverTimestamp()});
    });
  }catch(e){alert(e.message)}
}

function loadShopRequests(){
  if(unsubShop)unsubShop();
  unsubShop=onSnapshot(query(collection(db,"shoprequests"),where("status","==","pending")),s=>{
    $("shopRequests").innerHTML="";
    s.forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="sub";
      e.innerHTML=`${safe(d.email)} — <span style="color:${COLOR_HEX[d.item]||''}">${COLOR_NAMES_RU[d.item]||d.item}</span><br><button class="ok">${t("acceptBtn")}</button><button class="bad">${t("declineBtn")}</button>`;
      e.querySelector(".ok").onclick=()=>approveColor(x.id,d.userId,d.item);
      e.querySelector(".bad").onclick=()=>updateDoc(doc(db,"shoprequests",x.id),{status:"declined",respondedAt:serverTimestamp()});
      $("shopRequests").append(e);
    });
  });
}
async function approveColor(reqId,userId,item){
  try{
    await runTransaction(db,async t=>{
      let ud=doc(db,"users",userId),us=await t.get(ud);
      let owned=us.data().ownedColors||[];
      if(!owned.includes(item))owned=[...owned,item];
      t.update(ud,{ownedColors:owned,nickColor:item});
      t.update(doc(db,"shoprequests",reqId),{status:"approved",respondedAt:serverTimestamp()});
    });
    syncPublicProfile(userId,{nickColor:item});
  }catch(e){alert(e.message)}
}

$("addPromo").onclick=async()=>{
  let code=$("pCode").value.trim();
  let type=$("pType").value;
  let amount=parseFloat($("pAmount").value)||0;
  let color=$("pColor").value;
  let maxUses=$("pMaxUses").value?parseInt($("pMaxUses").value):null;
  if(!code)return alert("Введите код");
  if(type==="stars"&&(!amount||amount<=0))return alert("Укажите количество звёзд");
  let data={type,usedCount:0,createdAt:serverTimestamp()};
  if(type==="stars")data.amount=amount;
  if(type==="color")data.color=color;
  if(maxUses)data.maxUses=maxUses;
  try{
    await setDoc(doc(db,"promocodes",code),data);
    $("pCode").value="";$("pAmount").value="";$("pMaxUses").value="";
    alert("Промокод создан!");
  }catch(e){alert(e.message)}
};

function loadAdminPromos(){
  if(unsubPromo)unsubPromo();
  unsubPromo=onSnapshot(collection(db,"promocodes"),s=>{
    $("adminPromos").innerHTML="";
    s.forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="sub";
      let info=d.type==="stars"?`${d.amount} ⭐`:d.type==="vip"?"VIP 30 дней":d.type==="theme"?"Тема «Жидкое стекло»":`цвет: ${COLOR_NAMES_RU[d.color]||d.color}`;
      e.innerHTML=`<b>${safe(x.id)}</b> — ${info} · использован ${d.usedCount||0}${d.maxUses?"/"+d.maxUses:""} раз<br><button class="del">${t("deleteBtn")}</button>`;
      e.querySelector(".del").onclick=()=>{if(confirm("Удалить промокод?"))deleteDoc(doc(db,"promocodes",x.id))};
      $("adminPromos").append(e);
    });
  });
}

function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}