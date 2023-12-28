import { Router } from 'express';
import { GetBroker, GetUser, Login, RefreshAccessToken, SetBroker } from './user_service.js';
import { GetBrokerCredentials, LoginToShoonya, GetOverallPositions } from './broker_service.js';
import { GetDailyGoalStrategyData, SaveDailyGoalStrategyData } from './strategy_service.js';
import jwt from "jsonwebtoken";
import { GetAllSubscriptionPlans, GetSubscription, RequestSubscription } from './subscription_service.js';
const router = Router();
router.post('/login', Login);
router.get('/getBroker', verifyAccessToken, GetBroker);
router.post('/setBroker', verifyAccessToken, SetBroker);
router.get('/verifyToken', verifyAccessToken, RefreshAccessToken);
router.get('/logout');
router.get('/user', verifyAccessToken, GetUser);
router.get('/broker/credentials', verifyAccessToken, GetBrokerCredentials);
router.post('/broker/login', verifyAccessToken, LoginToShoonya);
router.get('/daily-strategy', verifyAccessToken, GetDailyGoalStrategyData);
router.post('/daily-strategy', verifyAccessToken, SaveDailyGoalStrategyData);
router.get('/get-positions', verifyAccessToken, GetOverallPositions);
router.get('/getSubscriptionPlans', GetAllSubscriptionPlans);
router.get('/getSubscription', verifyAccessToken, GetSubscription);
router.post('/requestSubscription', verifyAccessToken, RequestSubscription);
router.get('/health', healthcheck);
// function to verify access token and return user id
export async function verifyAccessToken(req, res, next) {
    const headerKey = process.env.X_ACCESS_TOKEN_HEADER;
    const accessToken = req.headers[headerKey];
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, data) => {
        if (err) {
            return res.status(401).send("Unauthorized");
        }
        req.uid = data.uid;
        next();
    });
}
async function healthcheck(req, res, next) {
    res.status(200).send("OK");
}
export default router;
