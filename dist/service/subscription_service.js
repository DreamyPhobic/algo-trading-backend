import { db } from "../configs/firebase.js";
import logger from "../logger.js";
export async function GetAllSubscriptionPlans(req, res, next) {
    try {
        const plans = [];
        let rawData = await db.collection("subscriptions").get();
        rawData.forEach((doc) => {
            plans.push(doc.data());
        });
        res.status(200).json(plans);
    }
    catch (err) {
        logger.error("Error in fetching the list of subscription plans", err);
        res.status(500).send("Internal Server Error");
    }
    next();
}
export async function GetSubscription(req, res, next) {
    try {
        let rawData = await db.collection("subscribed").doc(req.uid).get();
        if (rawData.data() == null) {
            res.status(404).send();
            return next();
        }
        else {
            res.status(200).json(rawData.data());
        }
    }
    catch (err) {
        logger.error("Error in fetching the list of subscription plans", err);
        res.status(500).send("Internal Server Error");
    }
    next();
}
export async function RequestSubscription(req, res, next) {
    try {
        console.log("Query: ", req.body);
        const { transaction_id, type, time } = req.body;
        await db.collection("subscribed").doc(req.uid).set({
            "transaction_id": transaction_id,
            "type": type,
            "time": time
        });
        res.status(200).json("ok");
    }
    catch (err) {
        logger.error("Error in fetching the list of subscription plans", err);
        res.status(500).send("Internal Server Error");
    }
    next();
}
