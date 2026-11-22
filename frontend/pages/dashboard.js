(function () {

const API = "http://127.0.0.1:8000";

let liveMode = false;
let liveTimer = null;

const locations = ["Chennai","Mumbai","Pune","Bangalore","Hyderabad","Delhi","Coimbatore","Madurai","Trichy","Kolkata"];
const payments = ["UPI","Credit Card","Debit Card","Net Banking"];

function randomTransaction(fraud = false) {

    if (fraud) {
        return {
            amount: Math.floor(Math.random() * 100000) + 70000,
            hour: Math.floor(Math.random() * 5),
            frequency: Math.floor(Math.random() * 8) + 11,
            failed_attempts: Math.floor(Math.random() * 3) + 3,
            location: locations[Math.floor(Math.random() * locations.length)],
            device: "New",
            payment_method: payments[Math.floor(Math.random() * payments.length)]
        };
    }

    return {
        amount: Math.floor(Math.random() * 15000) + 1000,
        hour: Math.floor(Math.random() * 18) + 6,
        frequency: Math.floor(Math.random() * 5) + 1,
        failed_attempts: 0,
        location: locations[Math.floor(Math.random() * locations.length)],
        device: "Known",
        payment_method: payments[Math.floor(Math.random() * payments.length)]
    };
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/* Hide employee controls during LIVE AI mode */
function setEmployeeControls(show) {
    document.querySelectorAll(".action-grid").forEach(grid => {
        grid.style.display = show ? "" : "none";
    });
}

/* Hide customer verification box from investigation popup */
function hideCustomerVerificationBox() {
    document.querySelectorAll("*").forEach(el => {
        const text = el.textContent.trim();

        if (
            text === "CUSTOMER VERIFICATION" ||
            text === "CUSTOMER VERIFICATION ..."
        ) {
            el.style.display = "none";
        }
    });
}

/* Change START LIVE MODE into STOP LIVE MODE */
function updateLiveButton() {

    const buttons = document.querySelectorAll("button");

    buttons.forEach(button => {

        const text = button.textContent.trim();

        if (
            text === "START LIVE MODE" ||
            text === "STOP LIVE MODE"
        ) {
            button.textContent = liveMode
                ? "STOP LIVE MODE"
                : "START LIVE MODE";

            button.onclick = liveMode
                ? stopLive
                : startLive;
        }
    });
}

async function analyzeTransaction(transaction, simulation = false) {

    try {

        const response = await fetch(
            `${API}/api/transactions/analyze`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            return;
        }

        const result = data.analysis;
        const id = data.transaction_id;

        addTransaction(
            transaction,
            result,
            id,
            simulation
        );

        updateAI(transaction, result);
        updateBehaviour(transaction);
        addTimeline(data);

        /*
         LIVE MODE:
         AI decides automatically.
         No employee action.
        */
        setEmployeeControls(simulation);

        return data;

    } catch (error) {

        console.error(
            "AI analysis error:",
            error
        );
    }
}

function addTransaction(
    transaction,
    result,
    id,
    simulation
) {

    const list =
        document.getElementById("transactionList");

    if (!list) return;

    const item =
        document.createElement("div");

    item.className = "transaction";

    let cls = "low";

    if (result.risk_level === "CRITICAL")
        cls = "critical";

    else if (result.risk_level === "HIGH")
        cls = "high";

    else if (result.risk_level === "MEDIUM")
        cls = "medium";

    let status;

    if (result.risk_level === "LOW") {

        status = "APPROVED";

    } else if (
        result.risk_level === "HIGH" ||
        result.risk_level === "CRITICAL"
    ) {

        status = "AWAITING VERIFICATION";

    } else {

        status = "REVIEW REQUIRED";
    }

    item.innerHTML = `
        <div class="txleft">

            <div class="txicon">
                TX
            </div>

            <div>

                <div class="txid">
                    ${id}
                </div>

                <div class="meta">
                    ${transaction.location}
                    •
                    ${transaction.payment_method}
                    •
                    ${transaction.device}
                    Device
                </div>

            </div>

        </div>

        <div class="txright">

            <div class="amount">
                Rs. ${Number(
                    transaction.amount
                ).toLocaleString("en-IN")}
            </div>

            <div class="pill ${cls}">
                ${result.risk_level}
            </div>

        </div>

        <span class="transaction-status">
            ${status}
        </span>
    `;

    /*
       IMPORTANT:

       HIGH / CRITICAL
       ?
       Customer Verification page

       LOW / MEDIUM
       ?
       Investigation popup
    */

    if (
        result.risk_level === "HIGH" ||
        result.risk_level === "CRITICAL"
    ) {

        item.onclick = function () {

            window.open(
                `customer.html?transaction_id=${encodeURIComponent(id)}`,
                "_blank"
            );

        };

        item.style.cursor = "pointer";

    } else {

        item.onclick = function () {

            openInvestigation(
                id,
                transaction,
                result,
                simulation
            );

        };
    }

    list.prepend(item);
}

function openInvestigation(
    id,
    transaction,
    result,
    simulation
) {

    window.currentTransactionId = id;

    const drawer =
        document.getElementById(
            "investigationDrawer"
        );

    if (!drawer) return;

    setText(
        "investigationTitle",
        "TRANSACTION INVESTIGATION"
    );

    setText(
        "investigationId",
        id
    );

    setText(
        "investigationAmount",
        `Rs. ${Number(
            transaction.amount
        ).toLocaleString("en-IN")}`
    );

    setText(
        "investigationLocation",
        transaction.location
    );

    setText(
        "investigationDevice",
        transaction.device
    );

    setText(
        "investigationPayment",
        transaction.payment_method
    );

    setText(
        "investigationFrequency",
        transaction.frequency
    );

    setText(
        "investigationFailed",
        transaction.failed_attempts
    );

    setText(
        "investigationScore",
        result.risk_score + "/100"
    );

    setText(
        "investigationLevel",
        result.risk_level
    );

    setText(
        "investigationProbability",
        result.fraud_probability + "%"
    );

    const factors =
        document.getElementById(
            "riskIndicators"
        );

    if (factors) {

        factors.innerHTML = "";

        if (
            result.risk_factors &&
            result.risk_factors.length
        ) {

            result.risk_factors.forEach(
                factor => {

                    const p =
                        document.createElement(
                            "p"
                        );

                    p.textContent = factor;

                    factors.appendChild(p);
                }
            );

        } else {

            factors.innerHTML =
                "<p>No major risk indicators detected.</p>";
        }
    }

    /*
       Employee controls ONLY for simulations.
    */

    setEmployeeControls(simulation);

    /*
       Customer verification section
       is NEVER displayed here.
    */

    hideCustomerVerificationBox();

    drawer.classList.add("open");
}

function updateAI(transaction, result) {

    setText(
        "riskScore",
        result.risk_score
    );

    setText(
        "riskLevel",
        result.risk_level
    );

    setText(
        "fraudProbability",
        `${result.fraud_probability}%`
    );

    let action;

    if (result.risk_level === "LOW") {

        action = "APPROVED";

    } else if (
        result.risk_level === "HIGH" ||
        result.risk_level === "CRITICAL"
    ) {

        action = "AWAITING VERIFICATION";

    } else {

        action = "REVIEW REQUIRED";
    }

    setText(
        "recommendedAction",
        action
    );

    const factors =
        document.getElementById(
            "riskIndicators"
        );

    if (!factors) return;

    factors.innerHTML = "";

    if (
        result.risk_factors &&
        result.risk_factors.length
    ) {

        result.risk_factors.forEach(
            factor => {

                const p =
                    document.createElement(
                        "p"
                    );

                p.textContent = factor;

                factors.appendChild(p);
            }
        );

    } else {

        factors.innerHTML =
            "<p>No major risk indicators detected.</p>";
    }
}

function updateBehaviour(transaction) {

    setText(
        "currentTransaction",
        `Rs. ${Number(
            transaction.amount
        ).toLocaleString("en-IN")}`
    );

    setText(
        "currentDevice",
        transaction.device === "Known"
            ? "Known"
            : "New"
    );

    setText(
        "currentFrequency",
        transaction.frequency
    );
}

function addTimeline(data) {

    const timeline =
        document.getElementById(
            "timeline"
        );

    if (!timeline) return;

    const result =
        data.analysis;

    let decision;

    if (result.risk_level === "LOW") {

        decision = "APPROVED";

    } else if (
        result.risk_level === "HIGH" ||
        result.risk_level === "CRITICAL"
    ) {

        decision =
            "AWAITING VERIFICATION";

    } else {

        decision =
            "REVIEW REQUIRED";
    }

    const entry =
        document.createElement("div");

    entry.innerHTML = `
        <strong>
            Pre-authorization decision
        </strong>

        <span>
            ${decision}
        </span>

        <small>
            AI risk analysis completed
        </small>
    `;

    timeline.prepend(entry);
}

/* SIMULATE NORMAL */
async function simulateNormal() {

    await analyzeTransaction(
        randomTransaction(false),
        true
    );
}

/* SIMULATE FRAUD */
async function simulateFraud() {

    await analyzeTransaction(
        randomTransaction(true),
        true
    );
}

/* START LIVE */
function startLive() {

    if (liveMode) return;

    liveMode = true;

    setEmployeeControls(false);

    updateLiveButton();

    generateLiveTransaction();

    liveTimer =
        setInterval(
            generateLiveTransaction,
            7000
        );
}

/* STOP LIVE */
function stopLive() {

    liveMode = false;

    if (liveTimer) {

        clearInterval(
            liveTimer
        );

        liveTimer = null;
    }

    updateLiveButton();

    setEmployeeControls(false);
}

/* LIVE AI TRANSACTION */
async function generateLiveTransaction() {

    if (!liveMode) return;

    const transaction =
        Math.random() < 0.25
            ? randomTransaction(true)
            : randomTransaction(false);

    await analyzeTransaction(
        transaction,
        false
    );
}

/* Employee decision for simulations */
function decision(type) {

    if (!window.currentTransactionId)
        return;

    fetch(
        `${API}/api/transactions/decision`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                transaction_id:
                    window.currentTransactionId,
                decision: type
            })
        }
    )
    .then(response =>
        response.json()
    )
    .then(data => {

        console.log(
            "Employee decision:",
            data
        );

        if (
            typeof closeInvestigation ===
            "function"
        ) {

            closeInvestigation();
        }
    })
    .catch(error =>
        console.error(error)
    );
}

/* INITIALIZE */
document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* Hide employee controls initially */
        setEmployeeControls(false);

        /* Remove customer verification box */
        hideCustomerVerificationBox();

        /* Find simulation buttons */
        document
            .querySelectorAll("button")
            .forEach(button => {

                const text =
                    button.textContent.trim();

                if (
                    text ===
                    "SIMULATE NORMAL"
                ) {

                    button.onclick =
                        simulateNormal;
                }

                if (
                    text ===
                    "SIMULATE FRAUD"
                ) {

                    button.onclick =
                        simulateFraud;
                }

                if (
                    text ===
                    "START LIVE MODE" ||
                    text ===
                    "STOP LIVE MODE"
                ) {

                    button.onclick =
                        startLive;
                }
            });

        updateLiveButton();
    }
);

})();
