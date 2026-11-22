async function analyzeTransaction() {

    document.getElementById("status").innerText =
        "AI analysing transaction...";

    const transaction = {
        amount: 85000,
        hour: 2,
        frequency: 12,
        failed_attempts: 4,
        location: "Mumbai",
        device: "New",
        payment_method: "UPI"
    };

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/api/transactions/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction)
            }
        );

        const data = await response.json();
        const analysis = data.analysis;

        document.getElementById("status").innerText =
            "Transaction analysed";

        document.getElementById("score").innerText =
            analysis.risk_score;

        document.getElementById("level").innerText =
            analysis.risk_level + " RISK";

        document.getElementById("factors").innerHTML =
            analysis.risk_factors
            .map(f => "? " + f)
            .join("<br>");

        document.getElementById("action").innerText =
            "RECOMMENDED ACTION: " +
            analysis.recommended_action;

    } catch (error) {

        document.getElementById("status").innerText =
            "Backend connection failed";

        console.error(error);
    }
}
