import config from "../configs/broker.js";
import { db } from "../configs/firebase.js";
import logger from "../logger.js";
import ShoonyaApi from "../shoonya_lib/RestApi.js";
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
        next();
    }).catch((error) => {
        // Todo: Add detailed error message
        console.error("Error getting documents: ", error);
        res.status(500).send("Internal Server Error");
    });
    next();
}
export async function GetPositions(req, res, next) {
    const { broker_id } = req.query;
    const brokerCollectionId = config.get(broker_id);
    if (!brokerCollectionId) {
        res.status(400).send("Invalid Broker ID");
        next();
        return;
    }
    const authData = await db.collection(brokerCollectionId).doc(req.uid).collection("details").doc("auth_data").get();
    console.log("AuthData: ", authData.data());
    if (authData == null) {
        res.status(400).send("Session expired. Login to broker account again.");
        next();
        return;
    }
    let ret = await api.get_positions("FA106925", "FA106925", "d8e2c04ec5484d029409d911d9b9579f90337c38890afa4f83375ff3c0a45829");
    console.log("Res: ", ret);
    let mtm = 0;
    let pnl = 0;
    for (let i = 0; i < ret.data.length; i++) {
        mtm += parseFloat(ret[i]['urmtom']);
        pnl += parseFloat(ret[i]['rpnl']);
    }
    let day_m2m = mtm + pnl;
    console.log(`${day_m2m} is your Daily MTM`);
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
    };
    let loginResponse = null;
    try {
        loginResponse = await api.login(authparams);
    }
    catch (err) {
        logger.error("Failed to login in shoonya", err, { "Request Id": req.headers["x-request-id"] });
        res.status(500).send("Login failed. Please check the information again.\n" + err.message);
        return next();
    }
    await db.collection(brokerCollectionId).doc(req.uid).collection("details").doc("auth_data").set({
        token: loginResponse.susertoken,
        account_id: loginResponse.actid,
        userid: loginResponse.uid
    }).then(() => {
        console.log("added auth data");
    }).catch((error) => {
        res.status(500).send("Internal Server Error");
        return next();
    });
    await db.collection(brokerCollectionId).doc(req.uid).collection("details").doc("credentials").set({
        userid: userid,
        password: password,
        api_secret: api_secret,
        vendor_code: vendor_code
    }).then(() => {
        res.status(200).send("Login Successful");
    }).catch((error) => {
        res.status(500).send("Internal Server Error");
    });
    next();
}
