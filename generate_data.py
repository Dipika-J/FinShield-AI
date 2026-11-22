import pandas as pd
import random
import os

random.seed(42)

data = []

locations = ["Chennai", "Mumbai", "Delhi", "Bangalore", "Hyderabad"]
devices = ["Known", "New"]
payment_methods = ["UPI", "Card", "NetBanking", "Wallet"]

for i in range(5000):

    amount = random.randint(100, 100000)
    hour = random.randint(0, 23)
    frequency = random.randint(1, 15)
    failed_attempts = random.randint(0, 5)

    location = random.choice(locations)
    device = random.choice(devices)
    payment_method = random.choice(payment_methods)

    suspicious = 0

    if amount > 70000:
        suspicious += 1
    if hour < 5:
        suspicious += 1
    if frequency > 10:
        suspicious += 1
    if failed_attempts >= 3:
        suspicious += 1
    if device == "New" and amount > 30000:
        suspicious += 1

    # Controlled fraud probability
    if suspicious >= 3:
        fraud = 1 if random.random() < 0.85 else 0
    elif suspicious == 2:
        fraud = 1 if random.random() < 0.55 else 0
    elif suspicious == 1:
        fraud = 1 if random.random() < 0.20 else 0
    else:
        fraud = 1 if random.random() < 0.03 else 0

    data.append([
        f"TXN{i+1:05d}",
        amount,
        hour,
        frequency,
        failed_attempts,
        location,
        device,
        payment_method,
        fraud
    ])

columns = [
    "transaction_id",
    "amount",
    "hour",
    "frequency",
    "failed_attempts",
    "location",
    "device",
    "payment_method",
    "is_fraud"
]

df = pd.DataFrame(data, columns=columns)

os.makedirs("data", exist_ok=True)
df.to_csv("data/transactions.csv", index=False)

print("Dataset created successfully!")
print("Total transactions:", len(df))
print("Fraud transactions:", df["is_fraud"].sum())
print("Normal transactions:", (df["is_fraud"] == 0).sum())
