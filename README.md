# CustomRPC

Lightweight Node.js runner for Discord Rich Presence using a user token and `discord.js-selfbot-v13`.

## Important Notice
Using user-token selfbot tooling can violate Discord Terms of Service and can result in account action. Use at your own risk.

## Requirements
- Node.js 18+
- npm

## Setup
```bash
npm install
cp config.example.json config.json
```

Then edit `config.json` and set your token + RPC values.

## Run
```bash
npm start
```

## Configuration
The app reads:
1. `DISCORD_TOKEN` env var (first priority)
2. `config.json` (`token` field)
3. `config.example.json` (fallback for defaults only)

### `config` shape
```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "rpc": {
    "applicationId": "876078579698520065",
    "type": "WATCHING",
    "name": "Your Activity Name",
    "details": "Optional details",
    "state": "Optional state",
    "startTimestamp": null,
    "endTimestamp": null,
    "status": "idle",
    "imageBig": "goon",
    "imageBigText": "Large image hover text",
    "imageSmall": null,
    "imageSmallText": null
  }
}
```

### RPC fields
- `applicationId`: Discord application ID.
- `type`: activity type (`PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING`).
- `name`, `details`, `state`: activity text.
- `startTimestamp`, `endTimestamp`: unix ms, parseable date string, or `null`.
- `status`: one of `online`, `idle`, `dnd`, `invisible`.
- Images support both styles:
  - `largeImage` / `largeImageText` / `smallImage` / `smallImageText`
  - aliases: `imageBig` / `imageBigText` / `imageSmall` / `imageSmallText`

## Image Notes
- Discord CDN links (`cdn.discordapp.com`, `media.discordapp.net`) are used directly.
- External image URLs are converted to Discord external assets using `RichPresence.getExternal`.

## Troubleshooting
- `Missing token...`: set `DISCORD_TOKEN` or add `token` in `config.json`.
- Activity not updating: confirm `applicationId` and image assets are valid.
- External URL image fails: try a direct image URL or use a Discord-hosted link.

## Security
- Never commit real tokens.
- Keep `config.json` local and private.
- Rotate your token immediately if it was exposed.
