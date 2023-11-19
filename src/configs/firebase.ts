import { readJSONFile } from "../utils.js"
import admin from "firebase-admin";
import path from 'path';
const __dirname = path.resolve();
 

const filePath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = await readJSONFile(filePath);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); 

export default admin;
export { db }