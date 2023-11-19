import broker from "../configs/broker.js";
import { db } from "../configs/firebase.js";
import logger from "../logger.js";

export async function GetDailyGoalStrategyData(req, res, next) {
    const { broker_id } = req.query;
    db.collection("daily_goal_strategy").doc(req.uid).get().then((doc) => {
        if (!doc.exists) {
            res.status(404).send("strategy not found");
            return;
        }
        const data = doc.data();
        if (data.broker_id != broker_id) {
            res.status(400).send("strategy not found");
            return;
        }
        res.status(200).json(data);
    }).catch((error) => {
        logger.error("Error getting documents: ", error, {"Request Id": req.headers["x-request-id"]});
        res.status(500).send("Internal Server Error");
    });

    next()
}

export async function SaveDailyGoalStrategyData(req, res, next) {
    const { broker_id } = req.query;

    const { trailing_stop_loss, target_profit, stop_loss } = req.body;
    
    db.collection("daily_goal_strategy").doc(req.uid).set({
        trailing_stop_loss: trailing_stop_loss,
        target_profit: target_profit,
        stop_loss: stop_loss,
        broker_id: broker_id
    }).then(() => {
        res.status(200).send("strategy saved successfully");
    }).catch((error) => {
        logger.error("Error saving documents: ", error, {"Request Id": req.headers["x-request-id"]});
        res.status(500).send("Internal Server Error");
    })

    next()
}