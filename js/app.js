const weekMap = {"月":"げつ","火":"か","水":"すい","木":"もく","金":"きん","土":"ど","日":"にち"};
const today = new Date();
// ===== 毎朝自動リセット =====
const todayKey = today.toDateString();
const lastDate = localStorage.getItem("lastOpenDate");

if (lastDate !== todayKey) {
  // 昨日のチェック状態を削除
  if (lastDate) {
    localStorage.removeItem(lastDate);
  }
  localStorage.setItem("lastOpenDate", todayKey);
}
// ===== 日付が変わったら自動リロード =====
setInterval(() => {
  const nowKey = new Date().toDateString();
  const savedDate = localStorage.getItem("lastOpenDate");

  if (nowKey !== savedDate) {
    location.reload();
  }
}, 60000); // 1分ごとにチェック
const weekKanji = today.toLocaleDateString("ja-JP",{weekday:"short"});
const dateKey = today.toDateString();
const month = today.getMonth()+1;
const day = today.getDate();
document.getElementById("date").textContent =
`${month}がつ${day}にち ${weekMap[weekKanji]}ようび`;

let taskData = null;
let doneData = JSON.parse(localStorage.getItem(dateKey)) || {};
const labels={morning:"あさ",evening:"ゆうがた",night:"ねるまえ",lesson:"ならいごと"};

// taskData.json 自動読み込み
async function loadTaskData(){
  const saved = localStorage.getItem("taskData");
  if(saved){
    taskData = JSON.parse(saved);
  } else {
    const res = await fetch("data/taskData.json");
    taskData = await res.json();
    localStorage.setItem("taskData", JSON.stringify(taskData));
  }
  render();
  checkPageAuth();
  checkParentAuth();
}

function getTodayTasks() {
  const base = taskData.days[weekKanji];
  const common = taskData.common;
  let result = { morning: [], evening: [], night: [], lesson: [] };
  for (let k in result) result[k] = [...common[k], ...base[k]];
  return result;
}

function render(){
  const taskArea = document.getElementById("tasks");
  taskArea.innerHTML = "";
  let count=0,total=0;
  const data = getTodayTasks();

  ["morning","evening","night"].forEach(key=>{
    const sec=document.createElement("div");
    sec.className="section";
    sec.innerHTML=`<h2>${labels[key]}</h2>`;

    data[key].forEach(text=>{
      const id=key+text; total++;
      const div=document.createElement("div");
      div.className="task"; div.textContent=text;

      if(doneData[id]){div.classList.add("done");count++;}

      div.onclick = (e) => {
        const isDone = div.classList.toggle("done");
        doneData[id] = isDone;
        localStorage.setItem(dateKey, JSON.stringify(doneData));
        if (isDone) {
//          playRandomEffect(div);
          createStar(e.clientX, e.clientY);
        }
        render();
      };

      sec.appendChild(div);
    });
    taskArea.appendChild(sec);
  });

  taskArea.appendChild(document.createElement("hr"));

  const lessonSec=document.createElement("div");
  lessonSec.className="section lesson";
  lessonSec.style.gridColumn="1 / -1";
  lessonSec.innerHTML="<h2>ならいごと</h2>";

  const grid=document.createElement("div");
  grid.style.display="grid";
  grid.style.gridTemplateColumns="repeat(3,1fr)";
  grid.style.gap="10px";

  data.lesson.forEach(item=>{
    const wrap=document.createElement("div");
    const title=document.createElement("div");
    title.textContent=item.name;
    title.className="task parent";

    const subC=document.createElement("div");
    let allDone=true;

    item.subs.forEach(sub=>{
      const id="lesson-"+item.name+"-"+sub;
      const d=document.createElement("div");
      d.className="task subTask";
      d.textContent=sub;

      if(doneData[id]) d.classList.add("done");
      else allDone=false;

      d.onclick=()=>{
        const isDone = d.classList.toggle("done");
        doneData[id] = isDone;
        localStorage.setItem(dateKey, JSON.stringify(doneData));
        if (isDone) {
//          playRandomEffect(div);
          createStar(e.clientX, e.clientY);
        }
        render();
      };

      subC.appendChild(d);
    });

    if(allDone) title.classList.add("done");
    wrap.appendChild(title);
    wrap.appendChild(subC);
    grid.appendChild(wrap);
  });

  lessonSec.appendChild(grid);
  taskArea.appendChild(lessonSec);

  document.getElementById("counter").textContent=`できたよ: ${count}/${total}`;
}

// ===== 編集 =====

function loadEditDay(){
  const day=document.getElementById("editDay").value;
  const data=(day==="common")?taskData.common:taskData.days[day];

  morningBox.value=data.morning.join("\n");
  eveningBox.value=data.evening.join("\n");
  nightBox.value=data.night.join("\n");

  lessonEditContainer.innerHTML="";
  data.lesson.forEach(l=>addLessonRow(l.name,l.subs));
}

function saveTasks(){
  const day=document.getElementById("editDay").value;
  const t=(day==="common")?taskData.common:taskData.days[day];

  t.morning=morningBox.value.split("\n").filter(Boolean);
  t.evening=eveningBox.value.split("\n").filter(Boolean);
  t.night=nightBox.value.split("\n").filter(Boolean);

  t.lesson=[];
  document.querySelectorAll("#lessonEditContainer>div").forEach(r=>{
    const name=r.children[0].value.trim();
    const subs=r.children[1].value.split("\n").filter(Boolean);
    if(name) t.lesson.push({name,subs});
  });

  localStorage.setItem("taskData",JSON.stringify(taskData));
  render();
  alert("保存しました");
}

function addLessonRow(name="",subs=[]){
  const row=document.createElement("div");
  row.style.display="grid";
  row.style.gridTemplateColumns="1fr 2fr";
  row.style.gap="8px";

  const i=document.createElement("input");
  i.value=name;
  const t=document.createElement("textarea");
  t.value=subs.join("\n");

  row.appendChild(i);
  row.appendChild(t);
  lessonEditContainer.appendChild(row);
}

function exportData(){
  const b=new Blob([JSON.stringify(taskData,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b);
  a.download="taskData.json";
  a.click();
}

function closeParent(){
  parentPanel.style.display="none";
}

function resetToInitial() {
  if (!confirm("すべてのチェック状態と編集内容を消して、最初の状態に戻します。よろしいですか？")) {
    return;
  }

  // タスク定義を削除
  localStorage.removeItem("taskData");

  // 今日のチェック状態も削除
  localStorage.removeItem(dateKey);

  // 再読み込み
  location.reload();
}
function playRandomEffect(el) {
  const effects = ["effect-pop", "effect-spin", "effect-float"];
  const effect = effects[Math.floor(Math.random() * effects.length)];

  console.log("Applying effect:", effect);  // 追加したログで確認
  
  el.classList.add("effect", effect);

  setTimeout(() => {
    el.classList.remove("effect", effect);
  }, 600);

  // エフェクト後に星を表示
  setTimeout(() => {
    createStar(el.offsetLeft, el.offsetTop);  // エフェクトの位置に星を表示
  }, 600);  // エフェクトが終わった後に星を表示
}
function createStar(x, y) {
  // 5つの星を表示するためにループを使う
  for (let i = 0; i < 5; i++) {
    const star = document.createElement("div");
    star.textContent = "⭐";
    star.className = "star";

    // ランダムに星の位置をずらす
    const dx = (Math.random() - 0.5) * 200;
    const dy = -Math.random() * 200;

    star.style.left = x + dx + "px";  // ランダムにずらしたx座標
    star.style.top = y + dy + "px";   // ランダムにずらしたy座標
    star.style.setProperty("--x", dx + "px");
    star.style.setProperty("--y", dy + "px");

    // 星を画面に追加
    document.body.appendChild(star);

    // 1秒後に星を消す
    setTimeout(() => star.remove(), 1000);

    // 100msごとに星を表示
    setTimeout(() => {
      document.body.appendChild(star);
    }, i * 100);  // 100ms間隔で表示
  }
}
loadTaskData();
