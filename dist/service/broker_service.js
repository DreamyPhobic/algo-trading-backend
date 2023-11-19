import config from "../configs/broker.js";
import { db } from "../configs/firebase.js";
import logger from "../logger.js";
import ShoonyaApi from "../shoonya_lib/RestApi.js";
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
export async function LoginToShoonya(req, res, next) {
    const { broker_id } = req.query;
    const brokerCollectionId = config.get(broker_id);
    if (!brokerCollectionId) {
        res.status(400).send("Invalid Broker ID");
        return;
    }
    const { userid, password, api_secret, vendor_code, authentication_code } = req.body;
    // Login to Shoonya account
    const api = new ShoonyaApi({});
    const authparams = {
        userid: userid,
        password: password,
        api_secret: api_secret,
        vendor_code: vendor_code,
        twoFA: String(authentication_code),
        imei: "abcd1234"
    };
    await api.login(authparams).then((data) => {
        // save the token on firebase
    }).catch(function (err) {
        logger.error("Failed to login in shoonya", err, { "Request Id": req.headers["x-request-id"] });
        res.status(500).send("Login failed. Please check the information again.");
        next();
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
