import { subscribe } from "diagnostics_channel";
import config from "../configs/broker.js";
import { db } from "../configs/firebase.js";
import { DailyGoalSubscriber } from "../dto/daily_goal_subscriber.js";
import logger from "../logger.js";
import ShoonyaApi from "../shoonya_lib/RestApi.js";
import { GetAuthData, GetPositions } from "./strategy_execution_service.js";


// Login to Shoonya account
let api = new ShoonyaApi({});

export async function GetBrokerCredentials(req, res, next) {
    const { broker_id } = req.query;

    const brokerCollectionId = config.get(broker_id);
    if (!brokerCollectionId) {
        res.status(400).send("Invalid Broker ID");
        return;
    }

    await db.collection(brokerCollectionId).doc(req.uid).collection("details").doc("credentials").get().then((doc) => {
        if (!doc.exists) {
            res.status(404).send("Credentials not found");
        }
        const data = doc.data();
        res.status(200).send(JSON.stringify(data));
        next()
    }).catch((error) => {
        // Todo: Add detailed error message
        console.error("Error getting documents: ", error);
        res.status(500).send("Internal Server Error");
    });
    next()
    
}

export async function GetOverallPositions(req, res, next) {
    try {
        let authdata = await GetAuthData(req.uid);
        let subscriber = new DailyGoalSubscriber()
        subscriber.userid = req.uid
        let positions = await GetPositions(authdata, subscriber);

        let rpnl = 0;
        let urmtom = 0;
        for (let i=0; i<positions.length; i++) {
            rpnl += parseFloat(positions[i].rpnl)
            urmtom += parseFloat(positions[i].urmtom)
        }

        let daypnl = rpnl + urmtom;


        res.status(200).send({"current": daypnl})
        

    } catch(err) {
        logger.error("Failed to get overall m2m position", {"uid": req.uid})
    }

    next()

    
}

export async function LoginToShoonya(req, res, next) {
    let earlyExit = false;
    const { broker_id } = req.query;

    const brokerCollectionId = config.get(broker_id);
    if (!brokerCollectionId) {
        res.status(400).send("Invalid Broker ID");
        return;
    }

    const { userid, password, api_secret, vendor_code, authentication_code } = req.body;

    const authparams = {
        userid: userid,
        password: password,
        api_secret: api_secret,
        vendor_code: vendor_code,
        twoFA: String(authentication_code),
        imei: "abcd1234"
    }

    let loginResponse = null

    try {
        loginResponse = await api.login(authparams)

    } catch(err) {
        logger.error("Failed to login in shoonya", err, {"Request Id": req.headers["x-request-id"]});
        res.status(500).send("Login failed. Please check the information again.\n" + err.message)
        next()
        return
    }

    await db.collection(brokerCollectionId).doc(req.uid).collection("details").doc("auth_data").set(
        {
            token: loginResponse.data.susertoken,
            account_id: loginResponse.data.actid,
            userid: loginResponse.data.uid,
            username: loginResponse.data.uname
        }
    ).then(() => {
        console.log("added auth data")
    }).catch((error) => {
        res.status(500).send("Internal Server Error");
        return next()
    })

    await db.collection(brokerCollectionId).doc(req.uid).collection("details").doc("credentials").set(
        {
            userid: userid,
            password: password,
            api_secret: api_secret,
            vendor_code: vendor_code
        }, 
    ).then(() => {
        res.status(200).send("Login Successful");
    }).catch((error) => {

        res.status(500).send("Internal Server Error");
    }) 

    next()
}