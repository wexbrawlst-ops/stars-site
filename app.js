import{initializeApp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import{getFirestore,doc,setDoc,updateDoc,deleteDoc,collection,addDoc,onSnapshot,query,where,orderBy,runTransaction,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCgiJ2OLgRf9rep6enYQTohuHGf9PAT6xQ",authDomain:"stars-f6d41.firebaseapp.com",projectId:"stars-f6d41",storageBucket:"stars-f6d41.firebasestorage.app",messagingSenderId:"294339505512",appId:"1:294339505512:web:2c0a8cc124c91d5d6dbadd"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const ADMIN_EMAIL="brawlstarsk93k@gmail.com";
let u,amount,gift,unsubOrders,unsubPending,unsubApproved,unsubAdminTasks;
let tasksCache=[],subsByTask={};

$("reg").onclick=async()=>{try{const c=await createUserWithEmailAndPassword(auth,$("email").value,$("pass").value);await setDoc(doc(db,"users",c.user.uid),{email:c.user.email,balance:0,createdAt:serverTimestamp()})}catch(e){$("authMsg").textContent=e.message}};
$("login").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value,$("pass").value)}catch(e){$("authMsg").textContent=e.message}};
$("logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,x=>{
  u=x;
  if(!x){$("auth").hidden=false;$("main").hidden=true;return}
  $("auth").hidden=true;$("main").hidden=false;
  onSnapshot(doc(db,"users",u.uid),s=>{const d=s.data()||{};$("bal").textContent=d.balance||0;$("adminBtn").hidden=u.email!==ADMIN_EMAIL});
  listenTasks();
  listenMySubs();
});

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
  addDoc(collection(db,"submissions"),{taskId:d.id,title:d.title,reward:d.reward,link:d.link||"",telegramUsername:handle,userId:u.uid,status:"pending",createdAt:serverTimestamp()}).catch(e=>alert(e.message));
}

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".page").forEach(x=>x.hidden=true);
  $(b.dataset.page).hidden=false;
  if(b.dataset.page==="admin"){loadOrders();loadAdminTasks();loadPendingSubs();loadApprovedSubs()}
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
    list.sort((a,b)=>(a.createdAt?.toMillis()||0)-(b.createdAt?.toMillis()||0));
    $("pendingCount").textContent=list.length;
    $("pendingSubs").innerHTML="";
    list.forEach(d=>{
      let e=document.createElement("div");e.className="sub";
      e.innerHTML=`<b>${safe(d.title)}</b> · +${d.reward} ⭐<br>Telegram: <b>${safe(d.telegramUsername)}</b>${d.link?` · <a href="${safe(d.link)}" target="_blank">ссылка</a>`:""}<br><button class="ok">Подтвердить</button><button class="bad">Отклонить</button>`;
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
      t.update(sd,{status:"approved",approvedAt:serverTimestamp()});
      t.update(ud,{balance:(us.data().balance||0)+d.reward});
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
      if(b)b.onclick=()=>updateDoc(doc(db,"orders",x.id),{status:"approved",approvedAt:serverTimestamp()});
      $("orders").append(e);
    });
  });
}

function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
