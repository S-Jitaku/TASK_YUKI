const weekMap = {"月":"げつ","火":"か","水":"すい","木":"もく","金":"きん","土":"ど","日":"にち"};
const today = new Date();
const weekKanji = today.toLocaleDateString("ja-JP",{weekday:"short"});
const dateKey = today.toDateString();
const month = today.getMonth()+1;
const day = today.getDate();
document.getElementById("date").textContent =
`${month}がつ${day}にち ${weekMap[weekKanji]}ようび`;

let taskData = null;
let doneData = JSON.parse(localStorage.getItem(dateKey)) || {};
const labels={morning:"あさ",evening:"ゆうがた",night:"ねるまえ",lesson:"ならいごと"};
let isSchoolEnabled = true;

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

  if (isSchoolEnabled) {
    result.morning = [...result.morning, ...common.school.morning];
    result.evening = [...result.evening, ...common.school.evening];
    result.night = [...result.night, ...common.school.night];
  }
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

      div.onclick=()=>{
        div.classList.toggle("done");
        doneData[id]=div.classList.contains("done");
        localStorage.setItem(dateKey,JSON.stringify(doneData));
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
        d.classList.toggle("done");
        doneData[id]=d.classList.contains("done");
        localStorage.setItem(dateKey,JSON.stringify(doneData));
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

function importData(e){
  const r=new FileReader();
  r.onload=()=>{
    taskData=JSON.parse(r.result);
    localStorage.setItem("taskData",JSON.stringify(taskData));
    render();
  };
  r.readAsText(e.target.files[0]);
}

function closeParent(){
  parentPanel.style.display="none";
}

function toggleSchoolTasks(){
  isSchoolEnabled=schoolToggle.checked;
  render();
}

loadTaskData();
