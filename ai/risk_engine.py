import joblib
import pandas as pd

MODEL_PATH = "ai/models/fraud_model.pkl"

# Load trained Random Forest
bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
encoders = bundle["encoders"]
features = bundle["features"]


def calculate_risk(transaction):
    """
    Analyze one transaction using the trained Random Forest.
    """

    data = transaction.copy()

    # Convert categorical values using the SAME encoders
    for column in ["location", "device", "payment_method"]:
        value = data[column]

        if value in encoders[column].classes_:
            data[column] = encoders[column].transform([value])[0]
        else:
            # Unknown value -> use first known category
            data[column] = 0

    # Keep exactly the features used during training
    X = pd.DataFrame([data])[features]

    # Fraud probability
    probability = model.predict_proba(X)[0][1]

    # Convert probability to 0-100
    risk_score = round(probability * 100)

    # Risk level
    if risk_score >= 80:
        risk_level = "CRITICAL"
        action = "BLOCK"
    elif risk_score >= 60:
        risk_level = "HIGH"
        action = "HOLD"
    elif risk_score >= 30:
        risk_level = "MEDIUM"
        action = "VERIFY"
    else:
        risk_level = "LOW"
        action = "APPROVE"

    # Explainable factors
    factors = []

    if transaction["amount"] > 70000:
        factors.append("Unusually high transaction amount")

    if transaction["hour"] < 5:
        factors.append("Unusual transaction time")

    if transaction["frequency"] > 10:
        factors.append("High transaction frequency")

    if transaction["failed_attempts"] >= 3:
        factors.append("Multiple failed attempts")

    if transaction["device"] == "New":
        factors.append("New or unrecognized device")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "fraud_probability": round(probability * 100, 2),
        "risk_factors": factors,
        "recommended_action": action
    }


# Test transaction
if __name__ == "__main__":

    test_transaction = {
        "amount": 85000,
        "hour": 2,
        "frequency": 12,
        "failed_attempts": 4,
        "location": "Mumbai",
        "device": "New",
        "payment_method": "UPI"
    }

    result = calculate_risk(test_transaction)

    print("\n===== FINSHIELD AI RISK ANALYSIS =====")
    print("Risk Score:", result["risk_score"], "/ 100")
    print("Risk Level:", result["risk_level"])
    print("Fraud Probability:", result["fraud_probability"], "%")
    print("Recommended Action:", result["recommended_action"])

    print("\nRisk Factors:")

    for factor in result["risk_factors"]:
        print("-", factor)