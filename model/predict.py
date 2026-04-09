import sys
import os
import joblib
import pandas as pd

# Get directory where predict.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "sugar_model.pkl")

# Load trained model
model = joblib.load(MODEL_PATH)

# Read input values from Node.js (command-line args)
observed_brix = float(sys.argv[1])
observed_pol = float(sys.argv[2])
temp = float(sys.argv[3])

# Convert to DataFrame to avoid sklearn warnings
sample = pd.DataFrame([[observed_brix, observed_pol, temp]],
                      columns=["observed brix", "observed polarity", "temp"])

# Predict
prediction = model.predict(sample)[0]

# Print result (Node.js will read this)
print(f"{prediction[0]:.2f},{prediction[1]:.2f},{prediction[2]:.2f}")
