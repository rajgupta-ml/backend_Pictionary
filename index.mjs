import {$connect, handleDisconnect, joinGroup, startGame, endGame, handleDrawing, handleGuess} from './actions.mjs';
import 'dotenv/config';

export const handler = async (event) => {
    try {
        if (!event.requestContext) {
            return {};
        }

        const meta = event.requestContext.connectionId;
        const routeKey = event.requestContext.routeKey;
        const payload = JSON.parse(event.body || '{}');
        switch (routeKey) {
            case '$connect':
                await $connect(meta);
                break;
            case "joinGroup":
                await joinGroup(meta, payload);
                break;
            case "startGame": 
                await startGame(meta);
                break;
            case "$disconnect":
                await handleDisconnect(meta);
                break;
            case "endGame":
                await endGame(meta);
                break;

            case "handleGuess":
                await handleGuess(meta, payload);
                break;

            case "handleDrawing":
                await handleDrawing(meta, payload);
                break;
            default:
                console.error('Unknown route key:', routeKey);
        }
    } catch (error) {
        console.error('Error handling request:', error);
    }

    return {};
};
