import admin, { db } from "../configs/firebase.js";
import jwt from "jsonwebtoken";
import logger from "../logger.js";
import { GetAuthData } from "./strategy_execution_service.js";
export async function Login(req, res, next) {
    const { firebase_token, user } = req.body;
    await admin.auth().verifyIdToken(firebase_token).then(async (decodedToken) => {
        const uid = decodedToken.uid;
        await db.collection("users").doc(uid).set({
            "email": user.email,
            "name": user.name,
            "profile_pic_url": user.profile_pic_url,
        }).then(() => {
            const jwtToken = jwt.sign({ uid: uid }, process.env.JWT_SECRET, { expiresIn: "1d" });
            logger.info("User logged in: ", { uid: uid });
            res.status(200).send(jwtToken);
        }).catch((error) => {
            // Todo: Add detailed error message
            logger.error("Error adding document: ", error, { "Request Id": req.headers["x-request-id"] });
            res.status(500).send("Internal Server Error");
        });
    }).catch((error) => {
        // Todo: Add detailed error message
        logger.error("Error verifying firebase token: ", error, { "Request Id": req.headers["x-request-id"] });
        res.status(500).send("Internal Server Error");
    });
    next();
}
export async function RefreshAccessToken(req, res, next) {
    const jwtToken = jwt.sign({ uid: req.uid }, process.env.JWT_SECRET, { expiresIn: "1d" });
    logger.info("User logged in: ", { uid: req.uid });
    res.status(200).send(jwtToken);
    next();
}
export async function GetUser(req, res, next) {
    try {
        let authdata = await GetAuthData(req.uid);
        let rawData = await db.collection("users").doc(req.uid).get();
        let user = {
            email: rawData.get("email"),
            name: authdata.username,
            profile_pic_url: rawData.get("profile_pic_url")
        };
        res.status(200).send(user);
    }
    catch (err) {
        res.status(500).send("Internal Server Error");
        logger.error("Failed to get user details", { "uid": req.uid });
    }
    next();
}
export async function GetBroker(req, res, next) {
    try {
        let rawData = await db.collection("broker_selections").doc(req.uid).get();
        if (rawData == null) {
            res.status(404).send();
            return next();
        }
        let brokerId = rawData.get("broker_id");
        if (brokerId == null || brokerId == "") {
            res.status(404).send();
            return next();
        }
        res.status(200).send(brokerId);
    }
    catch (err) {
        logger.error("Failed to get user selected broker", { "uid": req.uid, "Request Id": req.headers["x-request-id"], "Message": err });
        res.status(500).send("Internal Server Error");
    }
    next();
}
export async function SetBroker(req, res, next) {
    try {
        const { broker_id } = req.body;
        await db.collection("broker_selections").doc(req.uid).set({
            "broker_id": broker_id
        }).then(() => {
            res.status(200).send();
        }).catch((error) => {
            logger.error("Error adding document: ", { "uid": req.uid, "Request Id": req.headers["x-request-id"], "Message": error });
            res.status(500).send("Internal Server Error");
        });
    }
    catch (err) {
        logger.error("Failed to set user selected broker", { "uid": req.uid, "Request Id": req.headers["x-request-id"], "Message": err });
        res.status(500).send("Internal Server Error");
    }
    next();
}
