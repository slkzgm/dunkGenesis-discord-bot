import config from './config.json' assert { type: "json" };
import {EmbedBuilder} from 'discord.js';

// Generate marketplace link
export const getMarketplaceLink = (marketplace, tokenId) => {
    switch (marketplace) {
        case 'BLUR':
            return `https://blur.io/asset/${config.collection.contractAddress}/${tokenId}`;
        case 'OPENSEA':
            return `https://opensea.io/assets/ethereum/${config.collection.contractAddress}/${tokenId}`;
        case 'X2Y2':
            return `https://x2y2.io/eth/${config.collection.contractAddress}/${tokenId}`;
        default:
            return `INVALID MARKETPLACE: ${marketplace}`;
    }
}

// Get server marketplace emoji
export const getMarketplaceEmoji = (marketplace) => {
    switch (marketplace) {
        case 'BLUR':
            return config.customEmojis.blur && config.customEmojis.blur !== ''
                ? config.customEmojis.blur : 'BLUR'
        case 'OPENSEA':
            return config.customEmojis.opensea && config.customEmojis.opensea !== ''
                ? config.customEmojis.opensea : 'OPENSEA'
        case 'X2Y2':
            return config.customEmojis.x2y2 && config.customEmojis.x2y2 !== ''
                ? config.customEmojis.x2y2 : 'X2Y2'
        default:
            return `INVALID MARKETPLACE: ${marketplace}`;
    }
}

export const createSaleEmbedMsg = (details) => {
    const dna = details.equippedVial.vialDNA ?
        details.equippedVial.vialDNA.toLowerCase() : 'base';
    return new EmbedBuilder()
        .setColor(config.embedMsgs.salesColor | 'Green')
        .setTitle(`${config.collection.name} #${details.tokenId} just sold!`)
        .setURL(getMarketplaceLink(details.marketplace, details.tokenId))
        .setAuthor({ name: config.author.name, iconURL: config.author.iconURL, url: config.author.url })
        .setThumbnail(`${config.collection.thumbnailBaseUrl}/${dna}.png`)
        .addFields(
            { name: 'Price', value: details.price, inline: true },
            { name: 'Marketplace', value: getMarketplaceEmoji(details.marketplace), inline: true },
        )
        .addFields({
            name: 'OG',
            value: details.claimDetails.og ? config.embedMsgs.ogText.available : config.embedMsgs.ogText.unavailable,
            inline: false
        }, {
            name: 'X',
            value: details.claimDetails.x.toString(),
            inline: true
        }, {
            name: 'VOID',
            value: details.claimDetails.v.toString(),
            inline: true
        }, {

            name: 'GHOST',
            value: details.claimDetails.ghost.toString(),
            inline: true
        })
        .addFields({
            name: 'Vial ID', value: details.equippedVial.vialId, inline: true
        })
        .addFields({
            name: 'Vial DNA', value: details.equippedVial.vialDNA ? details.equippedVial.vialDNA : 'BLANK', inline: true
        })
        .addFields(
            { name: 'Seller', value: details.seller, inline: false },
            { name: 'Buyer', value: details.buyer, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.footer.text, iconURL: config.footer.iconURL });
};

export const createListingEmbedMsg = (details) => {
    const dna = details.equippedVial.vialDNA ?
        details.equippedVial.vialDNA.toLowerCase() : 'base';
    return new EmbedBuilder()
        .setColor(config.embedMsgs.listingsColor | 'Blue')
        .setTitle(`${config.collection.name} #${details.tokenId} listed!`)
        .setURL(getMarketplaceLink(details.marketplace, details.tokenId))
        .setAuthor({ name: config.author.name, iconURL: config.author.iconURL, url: config.author.url })
        .setThumbnail(`${config.collection.thumbnailBaseUrl}/${dna}.png`)
        .addFields(
            { name: 'Price', value: details.price, inline: true },
            { name: 'Marketplace', value: getMarketplaceEmoji(details.marketplace), inline: true },
        )
        .addFields({
            name: 'OG',
            value: details.claimDetails.og ? config.embedMsgs.ogText.available : config.embedMsgs.ogText.unavailable,
            inline: false
        }, {
            name: 'X',
            value: details.claimDetails.x.toString(),
            inline: true
        }, {
            name: 'VOID',
            value: details.claimDetails.v.toString(),
            inline: true
        }, {
            name: 'GHOST',
            value: details.claimDetails.ghost.toString(),
            inline: true
        })
        .addFields({
            name: 'Vial ID', value: details.equippedVial.vialId, inline: true
        })
        .addFields({
            name: 'Vial DNA', value: details.equippedVial.vialDNA ? details.equippedVial.vialDNA : 'BLANK', inline: true
        })
        .addFields(
            { name: 'Offerer', value: details.seller, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: config.footer.text, iconURL: config.footer.iconURL });
};