import { Assignment, ButtonType } from "midi-mixer-plugin";
// No typescript types for this.
const LiveSplitClient = require('livesplit-client');

let settings: Record<string, any>
let client: any;
// Button to tell the light detecting that there has been a manual update that should take priority
let updated = false;

// buttons needed
// start timer
const startButton = new ButtonType("StartButton", {
    name: "Start/Split Button",
    active: false,
});
startButton.on("pressed", async () => {
    // Turn on when pressed or when timer is running
    startButton.active = true;
    updated = true;
    await client.startOrSplit();
});

// split
const splitButton = new ButtonType("SplitButton", {
    name: "Split Button",
    active: false,
});
splitButton.on("pressed", async () => {
    await client.split();
});

// reset timer
const resetButton = new ButtonType("ResetButton", {
    name: "Reset Button",
    active: true,
});
resetButton.on("pressed", async () => {
    await client.reset();
});

// skip split
const skipButton = new ButtonType("SkipButton", {
    name: "Skip Button",
    active: false,
});
skipButton.on("pressed", async () => {
    await client.skipSplit();
});

// pause/resume
const pauseButton = new ButtonType("PauseButton", {
    name: "Pause/Resume Button",
    active: false,
});
pauseButton.on("pressed", async () => {
    updated = true;
    if (pauseButton.active) {
        await client.resume();
    }
    else {
        await client.pause();
    }
    pauseButton.active = !pauseButton.active;
});

// unsplit
const unsplitButton = new ButtonType("UnssplitButton", {
    name: "Unsplit Button",
    active: false,
});
unsplitButton.on("pressed", async () => {
    await client.unsplit();
});

async function init() {
    settings = await $MM.getSettings();
    let ip: string = settings["livesplitip"];
    let port: string = settings["livesplitport"];

    if (!ip) {
        ip = "127.0.0.1";
    }
    if (!port) {
        port = "16834";
    }

    try {
        // Initialize client with LiveSplit Server's IP:PORT
        client = new LiveSplitClient(`${ip}:${port}`);

        // Connect to the server, Promise will be resolved when the connection will be succesfully established
        // Cannot seem to catch error thrown here either in try/catch or in a .catch((err) => {})
        await client.connect();

        client.on("disconnected", () => {
            console.log("Disconnected");
        })
    } catch (err) {
        console.error(err); // Something went wrong
        log.error(err);
        $MM.showNotification("Error connecting to LiveSplit server");
    }
}

init();

setInterval(async () => {
    let res = await client.getAll();
    if (updated == true) {
        updated = false;
        return;
    }
    // res.currentTimerPhase:
    // 'Running'
    // 'Paused'
    // 'NotRunning
    // Update button lights
    if (res.currentTimerPhase == "Running") {
        startButton.active = true;
        pauseButton.active = false;
        splitButton.active = true;
        skipButton.active = true;
        unsplitButton.active = true;
    }
    else if (res.currentTimerPhase == "Paused") {
        startButton.active = true;
        pauseButton.active = true;
        splitButton.active = false;
        skipButton.active = false;
        unsplitButton.active = false;
    }
    else {
        startButton.active = false;
        pauseButton.active = false;
        splitButton.active = false;
        skipButton.active = false;
        unsplitButton.active = false;
    }
}, 250)