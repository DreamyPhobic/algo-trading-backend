import { Router } from 'express';
import { Login } from './user_service.js';
import { GetBrokerCredentials, LoginToShoonya } from './broker_service.js';
import { GetDailyGoalStrategyData, SaveDailyGoalStrategyData } from './strategy_service.js';
import jwt from "jsonwebtoken";
const router = Router();
router.post('/login', Login);
router.get('/logout');
router.get('/user');
router.get('/broker/credentials', verifyAccessToken, GetBrokerCredentials);
router.post('/broker/login', verifyAccessToken, LoginToShoonya);
router.get('/daily-strategy', verifyAccessToken, GetDailyGoalStrategyData);
router.post('/daily-strategy', verifyAccessToken, SaveDailyGoalStrategyData);
router.get('/get-positions', verifyAccessToken);
// function to verify access token and return user id
export async function verifyAccessToken(req, res, next) {
    const headerKey = process.env.X_ACCESS_TOKEN_HEADER;
    const accessToken = req.headers[headerKey];
    if (!accessToken) {
        req.uid = "";
        next();
    }
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, data) => {
        if (err) {
            res.status(401).send("Unauthorized");
        }
        req.uid = data.uid;
        next();
    });
}
export default router;