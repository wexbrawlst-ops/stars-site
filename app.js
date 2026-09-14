import{initializeApp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import{getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,addDoc,onSnapshot,query,where,orderBy,limit,increment,runTransaction,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCgiJ2OLgRf9rep6enYQTohuHGf9PAT6xQ",authDomain:"stars-f6d41.firebaseapp.com",projectId:"stars-f6d41",storageBucket:"stars-f6d41.firebasestorage.app",messagingSenderId:"294339505512",appId:"1:294339505512:web:2c0a8cc124c91d5d6dbadd"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const ADMIN_EMAIL="brawlstarsk93k@gmail.com";
let u,amount,gift,unsubOrders,unsubPending,unsubApproved,unsubAdminTasks,unsubVip;
let tasksCache=[],subsByTask={},lastSpinMs=0,isVip=false;

// Тема оформления
if(localStorage.getItem("theme")==="light")document.body.classList.add("light");
$("themeToggle").onclick=()=>{
  document.body.classList.toggle("light");
  localStorage.setItem("theme",document.body.classList.contains("light")?"light":"dark");
};

// Счётчик посещений (публичный, не требует входа)
setDoc(doc(db,"stats","global"),{totalVisits:increment(1)},{merge:true}).catch(()=>{});
onSnapshot(doc(db,"stats","global"),s=>{
  const d=s.data()||{};
  $("visitCount").textContent=d.totalVisits||0;
  $("userCount").textContent=d.totalUsers||0;
});

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
      }catch(e){/*реферал не критичен — регистрация продолжается*/}
    }
    await setDoc(doc(db,"users",c.user.uid),{email:c.user.email,balance:0,createdAt:serverTimestamp(),referredBy,referralDocId,referralRewarded:false});
    await setDoc(doc(db,"stats","global"),{totalUsers:increment(1)},{merge:true});
  }catch(e){$("authMsg").textContent=e.message}
};
$("login").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value,$("pass").value)}catch(e){$("authMsg").textContent=e.message}};
$("logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,x=>{
  u=x;
  if(!x){$("auth").hidden=false;$("main").hidden=true;return}
  $("auth").hidden=true;$("main").hidden=false;
  $("refLink").value=location.origin+location.pathname+"?ref="+u.uid;
  onSnapshot(doc(db,"users",u.uid),s=>{
    const d=s.data()||{};
    $("bal").textContent=d.balance||0;
    $("adminBtn").hidden=u.email!==ADMIN_EMAIL;
    lastSpinMs=d.lastSpinAt?.toMillis()||0;
    updateSpinUI();
    $("refCount").textContent=d.referralCount||0;
    let vipUntilMs=d.vipUntil?.toMillis()||0;
    isVip=!!(d.vip&&vipUntilMs>Date.now());
    $("vipStatus").textContent=isVip?`✅ VIP активен до ${new Date(vipUntilMs).toLocaleDateString()}`:"VIP не активен";
  });
  listenTasks();
  listenMySubs();
  listenWithdrawals();
  listenMyReferrals();
  listenLeaderboard();
});

$("copyRef").onclick=()=>{
  navigator.clipboard.writeText($("refLink").value).then(()=>{$("refMsg").textContent="Ссылка скопирована!"});
};

$("buyVipBtn").onclick=async()=>{
  window.open("https://t.me/WexBob","_blank");
  try{
    await addDoc(collection(db,"viprequests"),{userId:u.uid,email:u.email,status:"pending",createdAt:serverTimestamp()});
    $("vipMsg").textContent="Заявка отправлена. Ожидайте подтверждения от администратора в ЛС.";
  }catch(e){$("vipMsg").textContent=e.message}
};

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

function listenLeaderboard(){
  onSnapshot(collection(db,"withdrawals_public"),s=>{
    let totals={},vipNames=new Set();
    s.forEach(x=>{
      let d=x.data();
      totals[d.targetUsername]=(totals[d.targetUsername]||0)+(d.amount||0);
      if(d.vip)vipNames.add(d.targetUsername);
    });
    let arr=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,20);
    $("leaderboardList").innerHTML="";
    arr.forEach(([name,total],i)=>{
      let e=document.createElement("div");e.className="sub";
      e.innerHTML=`${i+1}. ${vipNames.has(name)?'👑 VIP ':''}${safe(name)} — <b>${total}</b> ⭐`;
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
  tasksCache.forEach(d=>{
    let sub=subsByTask[d.id];
    let e=document.createElement("div");e.className="task";
    let label="Выполнить",disabled=false;
    if(sub&&sub.status==="approved"){label="Выполнено";disabled=true}
    else if(sub&&sub.status==="pending"){label="На проверке";disabled=true}
    e.innerHTML=`<span><b>${safe(d.title)}</b><br><small>${safe(d.description||"")} · +${d.reward} ⭐</small></span><button ${disabled?"disabled":""}>${label}</button>`;
    if(!disabled)e.querySelector("button").onclick=()=>startTask(d);
    $("taskList").append(e);
  });
}
function startTask(d){
  let handle=prompt("Введите ваш username в Telegram (без @ можно):");
  if(!handle||!handle.trim())return;
  handle=handle.trim();
  if(d.link)window.open(d.link,"_blank");
  addDoc(collection(db,"submissions"),{taskId:d.id,title:d.title,reward:d.reward,link:d.link||"",telegramUsername:handle,userId:u.uid,status:"pending",vip:isVip,createdAt:serverTimestamp()}).catch(e=>alert(e.message));
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
});

$("usePromo").onclick=async()=>{
  let code=$("promoCode").value.trim();
  try{
    await runTransaction(db,async t=>{
      let ud=doc(db,"users",u.uid),pd=doc(db,"promocodes",code),rd=doc(db,"users",u.uid,"promos",code);
      let[us,ps,rs]=await Promise.all([t.get(ud),t.get(pd),t.get(rd)]);
      if(!ps.exists())throw Error("Промокод не найден.");
      let p=ps.data();
      if(p.type!=="stars")throw Error("Промокод не найден.");
      if(rs.exists())throw Error("Уже использован.");
      t.update(ud,{balance:(us.data().balance||0)+p.amount});
      t.set(rd,{at:serverTimestamp()});
    });
    $("promoMsg").textContent="Готово!";
  }catch(e){$("promoMsg").textContent=e.message}
};

$("withdraw").addEventListener("click",async e=>{
  let a=e.target.dataset.amount,g=e.target.dataset.g,p=e.target.dataset.p,m=e.target.dataset.m;
  if(a){
    amount=+a;
    if(+$("bal").textContent<amount)return $("flow").innerHTML='<p class="bad">Недостаточно звёзд.</p>';
    $("flow").innerHTML='<h3>Выберите подарок:</h3><div class="gift"><button data-g="Мишка">🧸 Мишка</button><button data-g="Сердце">❤️ Сердце</button></div>';
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

// Free Spin
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

// Публичная статистика выводов
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

$("addTask").onclick=async()=>{
  let title=$("tTitle").value.trim(),description=$("tDesc").value.trim(),link=$("tLink").value.trim(),reward=parseFloat($("tReward").value);
  if(!title||!link||!reward||reward<=0)return alert("Заполни название, ссылку и награду (больше 0)");
  await addDoc(collection(db,"tasks"),{title,description,link,reward,createdAt:serverTimestamp()});
  $("tTitle").value="";$("tDesc").value="";$("tLink").value="";$("tReward").value="";
};

function loadAdminTasks(){
  if(unsubAdminTasks)unsubAdminTasks();
  unsubAdminTasks=onSnapshot(query(collection(db,"tasks"),orderBy("createdAt","desc")),s=>{
    $("adminTasks").innerHTML="";
    s.forEach(x=>{
      let d=x.data(),e=document.createElement("div");e.className="sub";
      e.innerHTML=`<b>${safe(d.title)}</b> · +${d.reward} ⭐<br><small>${safe(d.link||"")}</small><br><button class="del">Удалить</button>`;
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
      e.innerHTML=`<b>${d.vip?"👑 ":""}${safe(d.title)}</b> · +${d.reward} ⭐<br>Telegram: <b>${safe(d.telegramUsername)}</b>${d.link?` · <a href="${safe(d.link)}" target="_blank">ссылка</a>`:""}<br><button class="ok">Подтвердить</button><button class="bad">Отклонить</button>`;
      e.querySelector(".ok").onclick=()=>approveSub(d);
      e.querySelector(".bad").onclick=()=>updateDoc(doc(db,"submissions",d.id),{status:"rejected",rejectedAt:serverTimestamp()});
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
      e.innerHTML=`${d.amount} ⭐ · ${safe(d.gift)} · ${safe(d.targetUsername)} · ${safe(d.privacy)} · ${safe(d.message||"Без надписи")}<br>Статус: ${safe(d.status)} ${d.status==="pending"?'<button>Подтвердить</button>':''}`;
      let b=e.querySelector("button");
      if(b)b.onclick=async()=>{
        let uSnap=await getDoc(doc(db,"users",d.userId));
        let ud2=uSnap.data()||{};
        let uVip=!!(ud2.vip&&(ud2.vipUntil?.toMillis()||0)>Date.now());
        await updateDoc(doc(db,"orders",x.id),{status:"approved",approvedAt:serverTimestamp()});
        await addDoc(collection(db,"withdrawals_public"),{gift:d.gift,amount:d.amount,targetUsername:d.targetUsername,approvedAt:serverTimestamp(),vip:uVip});
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
      e.innerHTML=`${safe(d.email)}<br><button class="ok">Принять</button><button class="bad">Отклонить</button>`;
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

function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}