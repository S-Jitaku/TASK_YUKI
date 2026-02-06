let PAGE_PASSWORD = "";
let PARENT_PASSWORD = "";

async function loadPasswords(){
  const res = await fetch("config/password.json");
  const data = await res.json();
  PAGE_PASSWORD = data.pagePassword;
  PARENT_PASSWORD = data.parentPassword;
}

/* ===== ページ用ログイン ===== */

async function login(){
  if(!PAGE_PASSWORD) await loadPasswords();

  const input = document.getElementById("pagePassword").value;

  if(input === PAGE_PASSWORD){
    localStorage.setItem("pageAuth","true");
    document.getElementById("loginScreen").style.display="none";
    document.getElementById("mainContent").style.display="block";
  } else {
    document.getElementById("loginMsg").textContent="ちがいます";
  }
}

async function checkPageAuth(){
  if(!PAGE_PASSWORD) await loadPasswords();

  if(localStorage.getItem("pageAuth")==="true"){
    document.getElementById("loginScreen").style.display="none";
    document.getElementById("mainContent").style.display="block";
  } else {
    document.getElementById("loginScreen").style.display="flex";
    document.getElementById("mainContent").style.display="none";
  }
}

/* ===== おうちのひと用 ===== */

async function askPassword(){
  if(!PARENT_PASSWORD) await loadPasswords();

  const input = prompt("パスワードをいれてね");
  if(input === PARENT_PASSWORD){
    localStorage.setItem("parentAuth","true");
    document.getElementById("parentPanel").style.display="block";
    loadEditDay();
  } else {
    alert("ちがいます");
  }
}

function checkParentAuth(){
  if(localStorage.getItem("parentAuth")==="true"){
    document.getElementById("parentPanel").style.display="block";
    loadEditDay();
  }
}
