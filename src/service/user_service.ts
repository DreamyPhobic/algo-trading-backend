import admin, { db } from "../configs/firebase.js";
import jwt from "jsonwebtoken";
import logger from "../logger.js";


export async function Login(req, res, next) {
    const {firebase_token, user} = req.body;
    await admin.auth().verifyIdToken(firebase_token).then((decodedToken) => {
        const uid = decodedToken.uid;
        db.collection("users").doc(uid).set({
            "email": user.email,
            "name": user.name,
            "profile_pic_url": user.profile_pic_url,
        }).then(() => {
            const jwtToken = jwt.sign({uid: uid}, process.env.JWT_SECRET, {expiresIn: "1d"})
            logger.info("User logged in: ", {uid: uid})
            res.status(200).send(jwtToken);
        }).catch((error) => {

            // Todo: Add detailed error message
            logger.error("Error adding document: ", error, {"Request Id": req.headers["x-request-id"]});
            res.status(500).send("Internal Server Error")
        });
    }).catch((error) => {
        // Todo: Add detailed error message
        logger.error("Error verifying firebase token: ", error, {"Request Id": req.headers["x-request-id"]});
        res.status(500).send("Internal Server Error")
    });
    next();
}



