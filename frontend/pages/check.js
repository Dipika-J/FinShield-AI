

const API="http://127.0.0.1:8000/api/transactions/analyze";

let currentTransaction=null;
let currentResult=null;
let counter=10001;
let liveTimer=null;

function normalTransaction(){

return{
amount:Math.floor(Math.random()*7000)+3000,
hour:Math.floor(Math.random()*10)+9,
frequency:Math.floor(Math.random()*4)+1,
failed_attempts:0,
location:"Chennai",
device:"Known",
payment_method:"UPI"
};

}

function fraudTransaction(){

return{
amount:Math.floor(Math.random()*40000)+70000,
hour:Math.floor(Math.random()*5),
frequency:Math.floor(Math.random()*7)+9,
failed_attempts:Math.floor(Math.random()*3)+3,
location:"Mumbai",
device:"New",
payment_method:"UPI"
};

}

async function analyze(transaction){

currentTransaction=transaction;

addTimeline(
"Transaction received",
"Pre-authorization analysis initiated"
);

document.getElementById("riskScore").textContent="...";
document.getElementById("riskLevel").textContent="ANALYSING";
document.getElementById("fraudProbability").textContent="...";
document.getElementById("recommendation").textContent="ANALYSING";

try{

const response=await fetch(API,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(transaction)
});

const data=await response.json();

if(!response.ok){
throw new Error(data.detail||"Analysis failed");
}

currentResult=data.analysis;

updateAI(currentResult);
updateBehaviour(transaction);

counter++;

addTransaction(transaction,currentResult,"TXN-FS-"+counter);

addTimeline(
"AI risk analysis completed",
"Random Forest model generated risk assessment"
);

addTimeline(
"Pre-authorization decision",
currentResult.recommended_action+" recommended"
);

if(currentResult.risk_score>=60){

showAlert(
"Risk detected: "+
currentResult.risk_level+
" transaction. Recommended action: "+
currentResult.recommended_action
);

}

openInvestigation(
"TXN-FS-"+counter,
transaction,
currentResult
);

}catch(error){

console.error(error);

document.getElementById("riskLevel").textContent="ERROR";
document.getElementById("recommendation").textContent="ANALYSIS FAILED";

addTimeline(
"AI analysis error",
"Unable to connect to FinShield backend"
);

}

}

function updateAI(result){

document.getElementById("riskScore").textContent=result.risk_score;

document.getElementById("riskLevel").textContent=result.risk_level;

document.getElementById("fraudProbability").textContent=
result.fraud_probability+"%";

document.getElementById("recommendation").textContent=
result.recommended_action;

const box=document.getElementById("factors");

box.innerHTML="";

if(result.risk_factors.length===0){

box.innerHTML=
'<div class="factor">No major risk indicators detected.</div>';

}else{

result.risk_factors.forEach(f=>{

const item=document.createElement("div");

item.className="factor";
item.textContent=f;

box.appendChild(item);

});

}

}

function updateBehaviour(t){

document.getElementById("currentAmount").textContent=
"Rs. "+Number(t.amount).toLocaleString("en-IN");

document.getElementById("currentDevice").textContent=t.device;

document.getElementById("currentFrequency").textContent=t.frequency;

}

function addTransaction(t,r,id){

const list=document.getElementById("transactionList");

const item=document.createElement("div");

item.className="transaction";

let cls="low";

if(r.risk_level==="CRITICAL") cls="critical";
else if(r.risk_level==="HIGH") cls="high";
else if(r.risk_level==="MEDIUM") cls="medium";

item.innerHTML = `

<div class="txleft">

<div class="txicon">TX</div>

<div>

<div class="txid">${id}</div>

<div class="meta">
${t.location} • ${t.payment_method} • ${t.device} Device
</div>

</div>

</div>

<div class="txright">

<div class="amount">
Rs. ${Number(t.amount).toLocaleString("en-IN")}
</div>

<div class="pill ${cls}">
${r.risk_level}
</div>

</div>
<span class="transaction-status" id="status-${id}">PENDING</span>`;

item.onclick=()=>openInvestigation(id,t,r);

list.prepend(item);

}

function openInvestigation(id,t,r){

document.getElementById("investId").textContent=id;

document.getElementById("investMeta").textContent=
t.location+" • "+t.payment_method+" • "+t.device+" Device";

document.getElementById("investScore").textContent=
r.risk_score+"/100";

document.getElementById("investLevel").textContent=
r.risk_level;

document.getElementById("investAmount").textContent=
"Rs. "+Number(t.amount).toLocaleString("en-IN");

document.getElementById("investLocation").textContent=t.location;
document.getElementById("investDevice").textContent=t.device;
document.getElementById("investPayment").textContent=t.payment_method;
document.getElementById("investFrequency").textContent=t.frequency;
document.getElementById("investFailed").textContent=t.failed_attempts;
document.getElementById("investProbability").textContent=
r.fraud_probability+"%";

const factors=document.getElementById("investFactors");

factors.innerHTML="";

r.risk_factors.forEach(f=>{

const div=document.createElement("div");

div.className="factor";
div.textContent=f;

factors.appendChild(div);

});

document.getElementById("drawer").classList.add("open");
document.getElementById("overlay").style.display="block";

}

function closeInvestigation(){

document.getElementById("drawer").classList.remove("open");
document.getElementById("overlay").style.display="none";

}

function decision(action){
    if(!currentTransaction){
        showAlert("No transaction is currently awaiting a decision.");
        return;
    }

    const statusMap = {
        "APPROVE": "APPROVED",
        "VERIFY": "VERIFICATION REQUIRED",
        "HOLD": "HELD",
        "BLOCK": "BLOCKED"
    };

    const status = statusMap[action];

    addTimeline(
        "Employee decision: " + action,
        status + " — transaction decision recorded"
    );

    showAlert(
        action === "BLOCK"
        ? "Transaction BLOCKED by authorized employee."
        : "Transaction " + status
    );

    document.querySelectorAll(
        ".investigation-drawer, .investigation-panel, .drawer, .modal"
    ).forEach(function(el){
        el.style.display = "none";
        el.classList.remove("open");
        el.classList.remove("active");
    });

    document.querySelectorAll(
        ".overlay, .drawer-overlay, .modal-overlay"
    ).forEach(function(el){
        el.style.display = "none";
        el.classList.remove("open");
        el.classList.remove("active");
    });

    currentTransaction = null;
    currentResult = null;
}

function addTimeline(title,text){

const timeline=document.getElementById("timeline");

const e=document.createElement("div");

e.className="event";

e.innerHTML=`

<div class="event-dot"></div>

<div>
<strong>${title}</strong>
<span>${text}</span>
</div>

`;

timeline.prepend(e);

}

function showAlert(message){

const box=document.getElementById("alertBox");

document.getElementById("alertText").textContent=message;

box.classList.add("show");

setTimeout(()=>{
box.classList.remove("show");
},4500);

}

function simulateFraud(){

analyze(fraudTransaction());

}

function simulateNormal(){

analyze(normalTransaction());

}

function startLive(){

if(liveTimer){

clearInterval(liveTimer);
liveTimer=null;

document.getElementById("liveBtn").textContent="START LIVE MODE"; showAlert("Live simulation stopped.");

return;

}

document.getElementById("liveBtn").textContent="STOP LIVE MODE"; showAlert("Live transaction monitoring started.");

analyze(normalTransaction());

liveTimer=setInterval(()=>{

const isFraud=Math.random()<0.4;

analyze(
isFraud ? fraudTransaction() : normalTransaction()
);

},7000);

}


