# WhatsApp Storyboard

A private, local-first dashboard I built to keep track of how I talk with my friends over WhatsApp : messages, calls, timing patterns, and the little stats that are otherwise easy to forget.

The goal is simple: take the data WhatsApp already lets me export, turn it into something visual, and look back at the history of conversations and calls day by day.

## Why I created this

WhatsApp gives you the raw conversation and call history, but it does not give you a useful long-term view of the relationship: how often you message, when you usually talk, how much time you spend on calls, which days are busiest, and how those patterns change over time.

I created this project as a personal **storyboard of my conversations with friends**. It is meant to make that history easier to explore rather than being a generic WhatsApp analytics service.

## What it shows

- Total messages and message activity over time
- Messaging clock: messages by hour of the day
- Weekly messaging rhythm
- Conversation share by participant
- Media, links and word-count style records
- Longest messages and active messaging streaks
- Total call time and average call duration
- Audio vs video call duration mix
- Calling clock: call duration by start hour
- Weekly call rhythm
- Incoming vs outgoing calls
- Longest and busiest call periods
- A calendar-style message activity heatmap with day-level hover details

## Privacy

This is intentionally a local-first project.

- Chat parsing happens in the browser.
- Call CSV parsing happens in the browser.
- No analytics backend is required.
- The dashboard does not send the chat or call data to a third-party analytics service.
- If the project is exposed through something like Cloudflare Tunnel, the web server is reachable over the internet, so only expose a folder you are comfortable serving.

**Important:** WhatsApp exports can contain very private conversations, names, phone numbers and metadata. Keep your exported files private and do not commit personal exports to Git.

## Export your WhatsApp chat

WhatsApp provides a built-in **Export chat** option. The official WhatsApp Help Center documents exporting a chat with or without media. WhatsApp Help Center : How to export your chat history https://faq.whatsapp.com/1180414079177245/

### Android

1. Open the WhatsApp chat you want to analyse.
2. Tap **More options (⋮) → More → Export chat**.
3. Choose **Without media** for the smallest and simplest export, or **Include media** if you also want the exported media package.
4. Save/share the resulting export somewhere accessible from your computer.

### iPhone

1. Open the WhatsApp chat.
2. Tap the contact/group name at the top.
3. Select **Export chat**.
4. Choose whether to include media.
5. Save/share the export to a location you can access from your computer.

For this dashboard, the important input is the exported **chat text file**. You do not need to include media just to generate the message analytics.

## Getting WhatsApp call data

WhatsApp does **not provide a normal “Export call history” feature**. Its Help Center says that call history can be viewed in the Calls tab, but it cannot be emailed or exported directly. WhatsApp Help Center : About call history on WhatsApp https://faq.whatsapp.com/743219147158705/

This project therefore uses a separate CSV for call analytics.

### High-level approach used by this project

For Android, the call data can be derived from the local WhatsApp database/backup rather than from the chat `.txt` export. At a high level:

1. Obtain a WhatsApp database/backup that contains the call history.
2. Open the relevant SQLite database locally.
3. Identify the call records from the call-log data, including fields such as timestamp, duration, direction, audio/video flag and call result.
4. Resolve the WhatsApp JID/contact identifier to a readable contact identifier using the relevant contact/JID information in the database.
5. Normalize those records into a CSV containing the fields expected by this dashboard.
6. Load that CSV alongside the exported chat file.

The extraction process is intentionally kept separate from the dashboard because WhatsApp database formats can change between versions and because accessing the local database is more involved than exporting a chat.

The dashboard expects the resulting CSV to contain:

```text
contact,date,time,timestamp_ms,duration_seconds,duration,direction,type,call_result,bytes_transferred
```

**Note:** WhatsApp's database/backup format and accessibility can vary by device, OS version and WhatsApp version. Do not upload a WhatsApp database to an online converter or third-party service just to generate this CSV; process it locally when possible.

## Input files

The dashboard expects two files:

1. A WhatsApp exported `.txt` chat file.
2. A `whatsapp_calls.csv` file containing call records.

The CSV is expected to contain these columns:

`contact,date,time,timestamp_ms,duration_seconds,duration,direction,type,call_result,bytes_transferred`

For calls, `date` + `time` are treated as the local call date/time so browser timezone conversion does not accidentally move calls into another day or hour.

## Run locally

From the project root:

### Windows

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### macOS / Linux

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Use your own data

### Option 1 : choose files in the browser

- Open the dashboard.
- Select the exported WhatsApp `.txt` file.
- Select `whatsapp_calls.csv`.
- Click **Build our story**.

### Option 2 : keep files in `data/`

Put the files here:

```text
data/chat.txt
data/whatsapp_calls.csv
```

Then use **Load files from `data/`**.

Replace the example files with your own exports when using the dashboard for personal data.

## Project structure

```text
whatsapp-dashboard-main/
├── index.html
├── favicon.svg
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── analytics.js
│   ├── calls.js
│   ├── charts.js
│   └── parser.js
└── data/
    ├── chat.txt
    └── whatsapp_calls.csv
```

## Personal use

This is a personal dashboard project created for exploring my own WhatsApp history with friends. If you reuse it, make sure you have the right to use any conversation data you put into it.
