import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

# Load dataset
file_path = r"C:\Users\amolp\Desktop\backend\FINAL_DATASET.csv"
df = pd.read_csv(file_path)
df.columns = df.columns.str.strip()

# Features and Targets
X = df[["observed brix", "observed polarity", "temp"]]
y = df[["corrected brix", "corrected pol", "normal recovery"]]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Reduce training data
X_train = X_train.sample(frac=0.02, random_state=42)
y_train = y_train.loc[X_train.index]

# Train weak Random Forest
model = RandomForestRegressor(n_estimators=5, max_depth=5, min_samples_split=20, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
accuracy = r2 * 100

print("Mean Squared Error:", mse)
print("R2 Score:", r2)
print(f"Model Accuracy: {accuracy:.2f}%")

# ✅ Save trained model properly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "sugar_model.pkl")
joblib.dump(model, MODEL_PATH)

print(f"✅ Model saved at {MODEL_PATH}")
