import { db } from "../configs/firebase.js";
import logger from "../logger.js";
import ShoonyaApi from "../shoonya_lib/RestApi.js";
import { Order } from "../dto/order.js";
let api = new ShoonyaApi({});
async function GetAllDailyGoalSubscribedUsers() {
    try {
        var subscribers = [];
        let rawdata = await db.collection("daily_goal_strategy").get();
        rawdata.docs.forEach((doc) => {
            var sub = {
                userid: doc.id,
                trailing_stop_loss: doc.get("trailing_stop_loss"),
                target_profit: doc.get("target_profit"),
                stop_loss: doc.get("stop_loss"),
                broker_id: doc.get("broker_id"),
                origin: doc.get("origin") != undefined ? doc.get("origin") : 0
            };
            subscribers.push(sub);
        });
        return subscribers;
    }
    catch (err) {
        logger.error("Error in fetching all users subscribed to strategy.");
        throw err;
    }
}
export async function GetAuthData(userid) {
    try {
        var rawData = await db.collection("broker_1_shoonya").doc(userid).collection("details").doc("auth_data").get();
        var authData = {
            token: rawData.get("token"),
            account_id: rawData.get("account_id"),
            userid: rawData.get("userid"),
            username: rawData.get("username")
        };
        return authData;
    }
    catch (err) {
        logger.error("Error in fetching the auth data of user", err.message, { "uid": userid });
        throw err;
    }
}
export async function GetPositions(authdata, subscriber) {
    try {
        var response = await api.get_positions(authdata.userid, authdata.account_id, authdata.token);
        let positions = [];
        if (Array.isArray(response.data)) {
            response.data.forEach((data) => {
                var position = data;
                positions.push(position);
            });
        }
        return positions;
    }
    catch (err) {
        logger.error("Failed to fetch positions of user", { "uid": subscriber.userid, "authdata": authdata }, err.message);
    }
    return [];
}
async function ExitPosition(authdata, position, subscriber) {
    try {
        var order = new Order();
        order.uid = authdata.userid;
        order.actid = authdata.account_id;
        if (parseFloat(position.netqty) >= 0) {
            order.quantity = parseFloat(position.netqty);
            order.buy_or_sell = "S";
        }
        else {
            order.quantity = -parseFloat(position.netqty);
            order.buy_or_sell = "B";
        }
        order.product_type = position.prd;
        order.price_type = "MKT";
        order.price = parseFloat(position.lp);
        order.exchange = position.exch;
        order.tradingsymbol = position.tsym;
        order.remarks = "Order placed By My option RMS";
        order.retention = "DAY";
        let response = await api.place_order(order, authdata.token);
        if (response.data.stat === "Not_Ok") {
            throw Error(response.data.emsg);
        }
        else if (response.data.stat === "Ok") {
            logger.info("Order placed", { "uid": subscriber.userid, "authdata": authdata, "OrderId": response.data.norenordno });
        }
    }
    catch (err) {
        logger.error("Failed to exit position of user", { "uid": subscriber.userid, "position": position, "authdata": authdata }, err.message);
    }
}
async function CheckLimits(authdata, subscriber, positions) {
    let rpnl = 0;
    let urmtom = 0;
    for (let i = 0; i < positions.length; i++) {
        rpnl += parseFloat(positions[i].rpnl);
        urmtom += parseFloat(positions[i].urmtom);
    }
    let daypnl = rpnl + urmtom;
    if (daypnl >= subscriber.target_profit) {
        positions.map(async (position) => await ExitPosition(authdata, position, subscriber));
        removeDailyGoalSubscriberData(subscriber);
        return;
    }
    else if (daypnl <= subscriber.origin - subscriber.stop_loss) {
        positions.map(async (position) => await ExitPosition(authdata, position, subscriber));
        removeDailyGoalSubscriberData(subscriber);
        return;
    }
    if (subscriber.trailing_stop_loss != 0) {
        if (daypnl >= subscriber.origin + subscriber.trailing_stop_loss) {
            var times = Math.abs(daypnl / subscriber.trailing_stop_loss);
            subscriber.origin = times * subscriber.trailing_stop_loss;
            updateDailyGoalSubscriberData(subscriber);
        }
    }
}
async function updateDailyGoalSubscriberData(subscriber) {
    await db.collection("daily_goal_strategy").doc(subscriber.userid).set({
        trailing_stop_loss: subscriber.trailing_stop_loss,
        target_profit: subscriber.target_profit,
        stop_loss: subscriber.stop_loss,
        broker_id: subscriber.broker_id,
        origin: subscriber.origin
    });
}
async function removeDailyGoalSubscriberData(subscriber) {
    await db.collection("daily_goal_strategy").doc(subscriber.userid).delete();
}
async function executeStrategy(subscriber) {
    try {
        var authdata = await GetAuthData(subscriber.userid);
        var positions = await GetPositions(authdata, subscriber);
        await CheckLimits(authdata, subscriber, positions);
    }
    catch (err) {
        throw err;
    }
}
export async function DailyGoalStrategyExecution() {
    let subscribers = await GetAllDailyGoalSubscribedUsers();
    const promises = subscribers.map(subscriber => executeStrategy(subscriber));
    try {
        await Promise.all(promises);
        console.log('All operations X completed successfully.');
    }
    catch (error) {
        console.error('Error occurred while performing operations:', error);
    }
}
