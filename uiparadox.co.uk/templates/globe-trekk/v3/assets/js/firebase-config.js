// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyB0C_-dIZQDAJ_YMwq56WIshrOHgKBcF1o",
  authDomain: "panaroots-be9c4.firebaseapp.com",
  projectId: "panaroots-be9c4",
  storageBucket: "panaroots-be9c4.firebasestorage.app",
  messagingSenderId: "1020210965493",
  appId: "1:1020210965493:web:e84966bb45b0725f0a0ebc",
  measurementId: "G-F2L67HRQQF"
};

const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];

export const isFirebaseConfigured = requiredFields.every((field) => {
  const value = firebaseConfig[field];
  return typeof value === "string" && value.trim() !== "" && !value.startsWith("REPLACE_WITH_");
});
