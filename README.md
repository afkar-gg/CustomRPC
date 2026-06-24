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

Then edit `config.json`.

## Run
```bash
npm start
```

## Config File

![Config Example](https://i.imgur.com/example-config.png)

```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "rpc": {
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

## RPC Fields Explained
- `type`: Activity type. Valid values: `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING`.
- `name`: Main activity line (required by Discord presence).
- `details`: Secondary line under the activity name.
- `state`: Third line, usually status/context.
- `startTimestamp`: Start time shown as elapsed timer. Accepts:
  - unix milliseconds (`1738411200000`)
  - date string (`2026-02-12T15:00:00Z`)
  - `null` to disable timer
- `endTimestamp`: End time shown as countdown. Same accepted formats as `startTimestamp`.
- `status`: Online status. Valid values: `online`, `idle`, `dnd`, `invisible`.
- `imageBig` / `largeImage`: Large image key or URL.
- `imageBigText` / `largeImageText`: Hover text for large image.
- `imageSmall` / `smallImage`: Small image key or URL.
- `imageSmallText` / `smallImageText`: Hover text for small image.

## Guides

<details>
<summary>How to make timestamps</summary>

Use https://www.unixtimestamp.com/ to get a unix timestamp in milliseconds, then multiply by 1000.

For example, if you get `1738411200` from the site, use `1738411200000` in your config.

- Current time (start now):
  ```bash
  node -e "console.log(Date.now())"
  ```
- Start now, end in 1 hour:
  ```bash
  node -e "const now=Date.now(); console.log('start', now); console.log('end', now+60*60*1000)"
  ```
- ISO date string (auto parsed by code):
  - `2026-02-12T16:30:00Z`

Set either field to `null` if you don't want timers.

</details>

<details>
<summary>How to set images (big/small)</summary>

- For application assets:
  1. Open your Discord application.
  2. Go to **Rich Presence** -> **Art Assets**.
  3. Upload images.
  4. Use the uploaded asset key in `imageBig` / `imageSmall`.

- For URL images:
  - Discord CDN URLs are used directly.
  - External URLs are converted through Discord external assets when possible.

I'd Recommends to use external url via imgur or something 
</details>

## Troubleshooting
- `Missing token...`: put token in `config.json` or set `DISCORD_TOKEN`.
- Presence not updating: verify image keys/URLs and token validity.
- Timers look wrong: use unix milliseconds (not seconds).

## Security
- Never show real token to anyone.
- Keep `config.json` private.
- If a token was leaked, rotate/revoke it immediately.
