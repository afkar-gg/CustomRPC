/*
 * RPC-only (token-based) runner
 *
 * Logs into Discord using your user token (selfbot library) and sets a Rich Presence activity.
 */

const { Client, RichPresence } = require("discord.js-selfbot-v13");
const fs = require("node:fs");
const path = require("node:path");

function loadConfig() {
    const configPath = path.join(__dirname, "config.json");
    const examplePath = path.join(__dirname, "config.example.json");
    const sourcePath = fs.existsSync(configPath) ? configPath : examplePath;

    if (!fs.existsSync(sourcePath)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    } catch (error) {
        console.error(`Failed to parse ${path.basename(sourcePath)}:`, error?.message || error);
        process.exit(1);
    }
}

const config = loadConfig();

const client = new Client();

const DEFAULT_RPC = {
    applicationId: "876078579698520065",
    type: "WATCHING",
    name: "Goonable Video",
    details: "Very Goonable Video",
    state: "About To Coem 🤑🤑",
    startTimestamp: 579600000,
    endTimestamp: null,
    status: "idle",
    largeImage: "goon",
    largeImageText: "Goonable Video",
    smallImage: null,
    smallImageText: null,
};

const imageAssetCache = new Map();
const DISCORD_MEDIA_HOSTS = new Set(["cdn.discordapp.com", "media.discordapp.net"]);
const STATUS_SET = new Set(["online", "idle", "dnd", "invisible"]);

function firstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

function normalizeTimestamp(value, fallbackValue) {
    if (value === null) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber)) return asNumber;

        const parsedDate = Date.parse(value);
        if (!Number.isNaN(parsedDate)) return parsedDate;
    }
    return fallbackValue;
}

function getRpcConfig() {
    const rpcConfig = typeof config.rpc === "object" && config.rpc ? config.rpc : {};
    const type =
        typeof rpcConfig.type === "string" && rpcConfig.type.trim()
            ? rpcConfig.type.trim().toUpperCase()
            : DEFAULT_RPC.type;

    const status =
        typeof rpcConfig.status === "string" && STATUS_SET.has(rpcConfig.status.toLowerCase())
            ? rpcConfig.status.toLowerCase()
            : DEFAULT_RPC.status;

    return {
        applicationId: String(rpcConfig.applicationId ?? DEFAULT_RPC.applicationId),
        type,
        name: firstNonEmptyString(rpcConfig.name, DEFAULT_RPC.name),
        details: firstNonEmptyString(rpcConfig.details, DEFAULT_RPC.details),
        state: firstNonEmptyString(rpcConfig.state, DEFAULT_RPC.state),
        startTimestamp: normalizeTimestamp(rpcConfig.startTimestamp, DEFAULT_RPC.startTimestamp),
        endTimestamp: normalizeTimestamp(rpcConfig.endTimestamp, DEFAULT_RPC.endTimestamp),
        status,
        // Vencord-style aliases:
        // imageBig/imageBigText, imageSmall/imageSmallText
        largeImage: firstNonEmptyString(
            rpcConfig.largeImage,
            rpcConfig.large_image,
            rpcConfig.imageBig,
            DEFAULT_RPC.largeImage,
        ),
        largeImageText: firstNonEmptyString(
            rpcConfig.largeImageText,
            rpcConfig.large_text,
            rpcConfig.imageBigText,
            DEFAULT_RPC.largeImageText,
        ),
        smallImage: firstNonEmptyString(rpcConfig.smallImage, rpcConfig.small_image, rpcConfig.imageSmall),
        smallImageText: firstNonEmptyString(
            rpcConfig.smallImageText,
            rpcConfig.small_text,
            rpcConfig.imageSmallText,
        ),
    };
}

async function resolveImageAsset(applicationId, image) {
    if (typeof image !== "string" || image.trim().length === 0) return null;

    const normalized = image.trim();
    let url;
    try {
        url = new URL(normalized);
    } catch {
        // Non-URL values are treated as normal asset keys/ids/mp: strings.
        return normalized;
    }

    if (!["http:", "https:"].includes(url.protocol)) return null;

    // Discord-hosted URLs are accepted directly by the RichPresence parser.
    if (DISCORD_MEDIA_HOSTS.has(url.hostname)) return normalized;

    // External URLs (e.g. Imgur) must be converted to external asset paths.
    const cacheKey = `${applicationId}::${normalized}`;
    if (imageAssetCache.has(cacheKey)) return imageAssetCache.get(cacheKey);

    const assets = await RichPresence.getExternal(client, applicationId, normalized);
    const externalPath = assets?.[0]?.external_asset_path || null;
    if (!externalPath) return null;

    imageAssetCache.set(cacheKey, externalPath);
    return externalPath;
}

async function resolveImageAssetSafe(label, applicationId, image) {
    try {
        return await resolveImageAsset(applicationId, image);
    } catch (error) {
        console.error(`Failed to resolve ${label}:`, error?.message || error);
        return null;
    }
}

async function setRpc() {
    const rpc = getRpcConfig();

    const activity = new RichPresence(client)
        .setApplicationId(rpc.applicationId)
        .setType(rpc.type)
        .setName(rpc.name)
        .setDetails(rpc.details)
        .setState(rpc.state);

    if (rpc.startTimestamp !== null) activity.setStartTimestamp(rpc.startTimestamp);
    if (rpc.endTimestamp !== null) activity.setEndTimestamp(rpc.endTimestamp);

    const [largeImageAsset, smallImageAsset] = await Promise.all([
        resolveImageAssetSafe("large image", rpc.applicationId, rpc.largeImage),
        resolveImageAssetSafe("small image", rpc.applicationId, rpc.smallImage),
    ]);

    if (largeImageAsset) activity.setAssetsLargeImage(largeImageAsset);
    if (rpc.largeImageText) activity.setAssetsLargeText(rpc.largeImageText);
    if (smallImageAsset) activity.setAssetsSmallImage(smallImageAsset);
    if (rpc.smallImageText) activity.setAssetsSmallText(rpc.smallImageText);

    client.user.setPresence({
        status: rpc.status,
        activities: [activity],
    });

    console.log(`RPC updated (status: ${rpc.status})`);
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username} (${client.user.id})`);
    setRpc().catch(error => {
        console.error("Failed to set RPC:", error?.message || error);
    });
    // Refresh periodically in case Discord clears it.
    setInterval(() => {
        setRpc().catch(error => {
            console.error("Failed to refresh RPC:", error?.message || error);
        });
    }, 15 * 60 * 1000);
});

const token = process.env.DISCORD_TOKEN || config.token;
if (!token) {
    console.error(
        "Missing token. Add it to config.json or set DISCORD_TOKEN. See README.md for setup steps.",
    );
    process.exit(1);
}

client.login(token);
