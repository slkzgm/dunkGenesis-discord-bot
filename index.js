import dotenv from 'dotenv';
dotenv.config();
import WebSocket from 'ws';
import * as DiscordClient from './lib/discord/discordClient.js';
import { createSaleEmbedMsg, createListingEmbedMsg } from './lib/discord/utils.js';

// BLUR ACTIVITY WEBSOCKET \\
const BLUR_WS = process.env.BLUR_WEBSOCKET;

// UTILS
const parseBuffer = (buffer) => {
    const bufferString = buffer.toString();
    const code = parseInt(bufferString);
    const arr = bufferString.indexOf('[');
    const obj = bufferString.indexOf('{');
    const firstChar = (arr === -1 || obj === -1) ?
        Math.max(arr, obj)
        : Math.min(arr, obj);
    const parsed = JSON.parse(bufferString.slice(firstChar));

    return {
        code,
        event: parsed[1] ? parsed[0] : 'unknown',
        payload: parsed[1] ? parsed[1] : parsed
    }
}

// WEBSOCKET SUBSCRIPTION RETRY
const MAX_RETRIES = 20;
const RETRY_DELAY = 1000;

let subscriptionRetryCount = 0;
let retryTimeout;

async function subscribe(ws) {
    if (subscriptionRetryCount < MAX_RETRIES) {
        ws.send('4261["subscribe",["0xf661d58cfe893993b11d53d11148c4650590c692.feeds.activity.eventsCreated"]]');
        subscriptionRetryCount++;

        retryTimeout = setTimeout(async () => {
            console.log('Retrying subscription...')
            await subscribe(ws);
        }, RETRY_DELAY);
    } else {
        console.log("Maximum subscription retries amount has been reached.");
    }
}

async function handleSaleEvent(item) {
    const {tokenId, marketplace, price, fromAddress, toAddress, equippedVial, claimDetails} = item;

    try {
        const embedMsg = createSaleEmbedMsg({
            tokenId,
            marketplace,
            price,
            buyer: toAddress,
            seller: fromAddress,
            equippedVial,
            claimDetails
        });

        const {base, sales} = DiscordClient.getChannel();

        if (base) {
            base.send({embeds: [embedMsg]});
        }

        if (sales) {
            sales.send({embeds: [embedMsg]});
        }

    } catch (e) {
        console.error(e);
    }
}

async function handleOrderCreatedEvent(item) {
    const {tokenId, marketplace, price, fromAddress, toAddress, equippedVial, claimDetails} = item;

    try {
        const embedMsg = createListingEmbedMsg({
            tokenId,
            marketplace,
            price,
            buyer: toAddress,
            seller: fromAddress,
            equippedVial,
            claimDetails
        });

        const {base, listings, og} = DiscordClient.getChannel();

        if (base) {
            base.send({embeds: [embedMsg]});
        }

        if (listings) {
            listings.send({embeds: [embedMsg]});
        }

        if (ghost && claimDetails.ghost) {
            og.send({embeds: [embedMsg]});
        }
    } catch (e) {
        console.error(e);
    }
}

async function handleDunkEventCreated(payload) {
    payload.items.map(async (item) => {
        const {equippedVial, vialDNA, claimDetails} =
            await (await fetch(`https://slkzgm.com/dunk/${item.tokenId}`)).json();

        item.equippedVial = {
            vialId: equippedVial,
            vialDNA: vialDNA
        };
        item.claimDetails = claimDetails;

        switch (item.eventType) {
            case 'SALE':
                await handleSaleEvent(item);
                break;
            case 'ORDER_CREATED':
                await handleOrderCreatedEvent(item);
                break;
            default:
                console.error('UNKNOWN EVENT_TYPE');
                break;
        }
    });
}

async function handleFortyTwo(fortyTwoEvent) {
    switch (fortyTwoEvent.event) {
        case 'unknown':
            console.error('Unknown event code 42');
            break;
        case '0xf661d58cfe893993b11d53d11148c4650590c692.feeds.activity.eventsCreated':
            console.log('New event on Dunk collection:');
            await handleDunkEventCreated(fortyTwoEvent.payload);
            break;
    }
}

async function handleClose(code, reason) {
    console.log(`Websocket closed with code ${code} and reason: ${reason}`);

    console.log('Reconnecting...');
    setTimeout(() => {
        connect();
    }, 1000);
}
async function handleMessage(ws, data) {
    const event = parseBuffer(data);

    // check for subscription success
    if (event.event === 'subscribed') {
        console.log('Successfully subscribed!');
        clearTimeout(retryTimeout);
        subscriptionRetryCount = 0;
    }

    switch (event.code) {
        // PONG
        case 2:
            ws.send(3);
            break;
        // EVENT
        case 42:
            await handleFortyTwo(event);
            break;
        default:
            return;
    }
}
async function handleOpen(ws) {
    console.log('Connected');
    ws.send(40);
    console.log('Subscribing to the activity feed...');
    await subscribe(ws);
}
async function handleError(err) {
    console.error(err)
}

const connect = async () => {
    try {
        // handle websocket stream
        const ws = new WebSocket(BLUR_WS);

        ws.removeListener('error', handleError);
        ws.removeListener('open', handleOpen);
        ws.removeListener('message', handleMessage);
        ws.removeListener('close', handleClose);

        // prepare discord client
        if (!DiscordClient.isReady()) {
            console.log('Initiating discord client...');
            await DiscordClient.readyPromise();
            if (DiscordClient.isReady()) {
                console.log('Discord client is ready.');
            } else {
                console.log('Error initiating discord client.');
            }
        }

        ws.on('error', handleError);

        ws.on('open', async () => handleOpen(ws));

        ws.on('message', async (data) => handleMessage(ws, data))

        ws.on('close', handleClose);
    } catch (e) {console.log(JSON.stringify(e))}
}
//-------------------------\\

connect();