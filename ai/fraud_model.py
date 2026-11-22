import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
df = pd.read_csv("data/transactions.csv")

# Convert text columns to numbers
encoders = {}

for column in ["location", "device", "payment_method"]:
    encoder = LabelEncoder()
    df[column] = encoder.fit_transform(df[column])
    encoders[column] = encoder

# Features used by Random Forest
features = [
    "amount",
    "hour",
    "frequency",
    "failed_attempts",
    "location",
    "device",
    "payment_method"
]

X = df[features]
y = df["is_fraud"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# Random Forest
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)

# Test
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print("Random Forest training completed!")
print("Accuracy:", round(accuracy * 100, 2), "%")
print()
print(classification_report(y_test, predictions))

# Save model
os.makedirs("ai/models", exist_ok=True)

joblib.dump(
    {
        "model": model,
        "encoders": encoders,
        "features": features
    },
    "ai/models/fraud_model.pkl"
)

print("Model saved to: ai/models/fraud_model.pkl")
