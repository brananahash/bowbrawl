import * as J from "jamango";
import { PlayerTrait, DrawTrait } from "../traits";
import { HitCommand, EnvironmentalDeathCommand } from "../commands";
import { onKill } from "./progression";

let fullScreenOverlay: HTMLElement!;
let textElement: HTMLElement!;
let arrowIndicators: HTMLElement[] = [];
let arrowLabel: HTMLElement!;
let leaderboardElement: HTMLElement!;
let killFeedElement: HTMLElement!;
let gameStartTime = 0;
let lastTimeAlive = 0;
let deathMessage: string = "";
let lastArrowCount = 3;
let arrowWobbleStartTimes: number[] = [0, 0, 0];
let isTabPressed = false;
let notificationElement: HTMLElement!;
let notificationText: string = "";
let notificationEndTime: number = 0;
let notificationCustomStyle: string = "";
let notificationStartTime: number = 0;

interface KillFeedEntry {
  killerName: string;
  victimName: string;
  startTime: number;
  endTime: number;
  isLocalPlayerKiller: boolean;
  isEnvironmental?: boolean;
}

let killFeedEntries: KillFeedEntry[] = [];

function addKillFeedEntry(entry: Omit<KillFeedEntry, "startTime" | "endTime">) {
  const currentTime = J.getWorldTime();
  killFeedEntries.push({
    ...entry,
    startTime: currentTime,
    endTime: currentTime + 5,
  });

  // Keep only the 10 most recent entries
  if (killFeedEntries.length > 10) {
    killFeedEntries.shift();
  }
}

export function setDeathMessage(message: string) {
  deathMessage = message;
}

export function showNotification(text: string, duration: number = 3, customStyle: string = "") {
  notificationText = text;
  const currentTime = J.getWorldTime();
  notificationStartTime = currentTime;
  notificationEndTime = currentTime + duration;
  notificationCustomStyle = customStyle;
}

J.onGameStart(() => {
  gameStartTime = J.getWorldTime();
  J.uiElement!.innerHTML = `
    <div id="fullscreen-overlay"></div>
    <div id="text-element"></div>
    <div id="arrow-ui">
      <div id="notification-text"></div>
      <div id="arrow-container">
        <div class="arrow-indicator">I</div>
        <div class="arrow-indicator">I</div>
        <div class="arrow-indicator">I</div>
      </div>
      <div id="arrow-label">Ammo</div>
    </div>
    <div id="leaderboard"></div>
    <div id="kill-feed"></div>
  `;
  fullScreenOverlay = J.uiElement!.querySelector("#fullscreen-overlay")!;
  fullScreenOverlay.style.position = "fixed";
  fullScreenOverlay.style.top = "0";
  fullScreenOverlay.style.left = "0";
  fullScreenOverlay.style.width = "100%";
  fullScreenOverlay.style.height = "100%";
  fullScreenOverlay.style.pointerEvents = "none";
  fullScreenOverlay.style.willChange = "background-color";
  fullScreenOverlay.style.backfaceVisibility = "hidden";

  textElement = J.uiElement!.querySelector("#text-element")!;
  textElement.style.position = "fixed";
  textElement.style.top = "50%";
  textElement.style.left = "50%";
  textElement.style.transform = "translate(-50%, -50%)";
  textElement.style.color = "white";
  textElement.style.fontSize = "48px";
  textElement.style.fontWeight = "bold";
  textElement.style.pointerEvents = "none";
  textElement.style.textAlign = "center";
  textElement.style.fontFamily = "Quicksand, sans-serif";
  textElement.style.filter = "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))";
  textElement.style.whiteSpace = "nowrap";
  textElement.style.willChange = "opacity";
  textElement.style.backfaceVisibility = "hidden";
  textElement.style.webkitFontSmoothing = "antialiased";

  const arrowUI = J.uiElement!.querySelector("#arrow-ui")!;
  arrowUI.style.position = "fixed";
  arrowUI.style.bottom = "40px";
  arrowUI.style.left = "50%";
  arrowUI.style.transform = "translateX(-50%)";
  arrowUI.style.display = "flex";
  arrowUI.style.flexDirection = "column";
  arrowUI.style.alignItems = "center";
  arrowUI.style.gap = "4px";
  arrowUI.style.pointerEvents = "none";
  arrowUI.style.backfaceVisibility = "hidden";

  const arrowContainer = J.uiElement!.querySelector("#arrow-container")!;
  arrowContainer.style.display = "flex";
  arrowContainer.style.gap = "12px";

  arrowLabel = J.uiElement!.querySelector("#arrow-label")!;
  arrowLabel.style.color = "white";
  arrowLabel.style.fontSize = "20px";
  arrowLabel.style.fontFamily = "Quicksand, sans-serif";
  arrowLabel.style.fontWeight = "bold";
  arrowLabel.style.letterSpacing = "1px";
  arrowLabel.style.transition = "color 0.2s";
  arrowLabel.style.willChange = "transform, color, opacity";
  arrowLabel.style.backfaceVisibility = "hidden";
  arrowLabel.style.webkitFontSmoothing = "antialiased";

  arrowIndicators = Array.from(J.uiElement!.querySelectorAll(".arrow-indicator"));
  arrowIndicators.forEach((indicator: HTMLElement) => {
    indicator.style.color = "white";
    indicator.style.fontSize = "50px";
    indicator.style.fontWeight = "bold";
    indicator.style.fontFamily = "Quicksand, sans-serif";
    indicator.style.filter = "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))";
    indicator.style.willChange = "transform, opacity";
    indicator.style.backfaceVisibility = "hidden";
    indicator.style.webkitFontSmoothing = "antialiased";
  });

  leaderboardElement = J.uiElement!.querySelector("#leaderboard")!;
  leaderboardElement.style.position = "fixed";
  leaderboardElement.style.top = "20px";
  leaderboardElement.style.left = "20px";
  leaderboardElement.style.color = "white";
  leaderboardElement.style.fontFamily = "Quicksand, sans-serif";
  leaderboardElement.style.fontSize = "13px";
  leaderboardElement.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
  leaderboardElement.style.padding = "2px";
  leaderboardElement.style.borderRadius = "6px";
  leaderboardElement.style.pointerEvents = "none";
  leaderboardElement.style.backfaceVisibility = "hidden";
  leaderboardElement.style.webkitFontSmoothing = "antialiased";

  killFeedElement = J.uiElement!.querySelector("#kill-feed")!;
  killFeedElement.style.position = "fixed";
  killFeedElement.style.top = "75px";
  killFeedElement.style.right = "20px";
  killFeedElement.style.color = "white";
  killFeedElement.style.fontFamily = "Quicksand, sans-serif";
  killFeedElement.style.fontSize = "13px";
  killFeedElement.style.pointerEvents = "none";
  killFeedElement.style.textAlign = "right";
  killFeedElement.style.display = "flex";
  killFeedElement.style.flexDirection = "column";
  killFeedElement.style.alignItems = "flex-end";
  killFeedElement.style.backfaceVisibility = "hidden";
  killFeedElement.style.webkitFontSmoothing = "antialiased";

  notificationElement = J.uiElement!.querySelector("#notification-text")!;
  notificationElement.style.color = "white";
  notificationElement.style.fontSize = "20px";
  notificationElement.style.fontFamily = "Quicksand, sans-serif";
  notificationElement.style.fontWeight = "bold";
  notificationElement.style.filter = "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))";
  notificationElement.style.letterSpacing = "1px";
  notificationElement.style.textAlign = "center";
  notificationElement.style.opacity = "0";
  notificationElement.style.transition = "opacity 0.2s";
  notificationElement.style.willChange = "transform, opacity";
  notificationElement.style.backfaceVisibility = "hidden";
  notificationElement.style.webkitFontSmoothing = "antialiased";
});

J.onGameTick((_, t) => {
  const id = J.getLocalPlayer();
  if (!id) return;

  const player = J.getTrait(id, PlayerTrait);
  if (!player) return;

  const gameStartFadeIn = Math.max(0, 1 - (t - gameStartTime) / 2);
  const respawnFadeInOut = player.respawnTime > 0 ? Math.max(0, 1 - Math.abs(player.respawnTime - t) / 1) : 0;
  const darkFadeAlpha = Math.max(gameStartFadeIn, respawnFadeInOut);

  const isAlive = J.getCharacterAlive(id);

  if (isAlive) {
    lastTimeAlive = t;
    fullScreenOverlay.style.backgroundColor = `rgba(0, 0, 0, ${darkFadeAlpha})`;
    textElement.innerHTML = "";

    // Detect arrow count changes and trigger wobble effect
    if (player.arrowCount !== lastArrowCount) {
      const changedIndex = Math.min(player.arrowCount, lastArrowCount);
      if (changedIndex >= 0 && changedIndex < arrowIndicators.length) {
        arrowWobbleStartTimes[changedIndex] = t;
      }
      lastArrowCount = player.arrowCount;
    }

    // Update arrow indicators opacity and wobble based on arrow count
    // Arrows are consumed from right to left
    for (let i = 0; i < arrowIndicators.length; i++) {
      if (i < player.arrowCount) {
        arrowIndicators[i].style.opacity = "1";
      } else {
        arrowIndicators[i].style.opacity = "0.3";
      }

      // Apply wobble effect
      const wobbleStart = arrowWobbleStartTimes[i];
      if (wobbleStart > 0) {
        const elapsed = t - wobbleStart;
        const duration = 0.4;

        if (elapsed < duration) {
          // Elastic easing out with overshoot
          const progress = elapsed / duration;
          const c4 = (2 * Math.PI) / 3;
          const scale = progress === 0
            ? 0
            : progress === 1
            ? 0
            : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4);

          arrowIndicators[i].style.transform = `scale(${1 + scale * 1.5})`;
        } else {
          arrowIndicators[i].style.transform = "scale(1)";
          arrowWobbleStartTimes[i] = 0;
        }
      } else {
        arrowIndicators[i].style.transform = "scale(1)";
      }
    }

    // Update arrow label based on arrow count and input
    const input = J.getCharacterInput(id);
    const isTryingToShoot = input && input.isPrimaryDown;

    if (player.arrowCount === 0 && isTryingToShoot) {
      arrowLabel.style.color = "#ff2222";
      arrowLabel.style.opacity = "1";
      const sineWave = Math.sin(t * 10);
      const squareSine = Math.sign(sineWave) * Math.pow(Math.abs(sineWave), 0.4);
      const pulsate = 1 + squareSine * 0.1;
      arrowLabel.style.transform = `scale(${pulsate})`;

    } else {
      arrowLabel.style.color = "white";
      arrowLabel.style.opacity = "0.3";
      arrowLabel.style.transform = "scale(1)";
    }
  } else {
    const deathElapsed = t - lastTimeAlive;
    const deathFade = Math.min(1, deathElapsed / 3);
    const redOpacity = 0.8 - deathFade * 0.6;

    const finalAlpha = Math.max(darkFadeAlpha, redOpacity);
    fullScreenOverlay.style.backgroundColor = darkFadeAlpha > 0
      ? `rgba(0, 0, 0, ${finalAlpha})`
      : `rgba(139, 0, 0, ${redOpacity})`;

    const textFadeStart = 1;
    const textOpacity = deathElapsed > textFadeStart ? Math.min(1, (deathElapsed - textFadeStart) / 1) : 0;
    const scaleProgress = Math.min(1, deathElapsed / 2.5);
    const easedProgress = scaleProgress * scaleProgress * (3 - 2 * scaleProgress);
    const scale = 1.5 - easedProgress * 0.5; // Start at 1.5x and shrink to 1x

    textElement.innerHTML = deathMessage;
    textElement.style.opacity = `${textOpacity}`;
    textElement.style.transform = `translate(-50%, -50%) scale(${scale})`;

    // Hide arrow UI when dead
    arrowIndicators.forEach(indicator => {
      indicator.style.opacity = "0";
    });
    arrowLabel.style.opacity = "0";
  }

  // Update notification text (only show when alive)
  if (isAlive && t < notificationEndTime) {
    notificationElement.innerHTML = notificationText;

    // Calculate wobble effect (first 0.4 seconds)
    const elapsed = t - notificationStartTime;
    const wobbleDuration = 0.4;
    let scale = 1;

    if (elapsed < wobbleDuration) {
      const progress = elapsed / wobbleDuration;
      const c4 = (2 * Math.PI) / 3;
      const wobble = progress === 0
        ? 0
        : progress === 1
        ? 0
        : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4);
      scale = 1 + wobble * 1.5;
    }

    // Reset base styles first, then apply custom styles
    notificationElement.style.cssText = `
      color: white;
      font-size: 20px;
      font-family: Quicksand, sans-serif;
      font-weight: bold;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9));
      letter-spacing: 1px;
      text-align: center;
      opacity: 1;
      transition: opacity 0.2s;
      transform: scale(${scale});
      ${notificationCustomStyle}
    `;
  } else {
    notificationElement.style.opacity = "0";
    notificationElement.innerHTML = "";
  }

  // Update leaderboard
  const allPlayers = J.getAllWithTraits([PlayerTrait]);
  const playerStats: Array<{ id: J.EntityId; name: string; kills: number; deaths: number; killStreak: number }> = [];

  for (const [playerId, playerTrait] of allPlayers) {
    if (playerTrait) {
      playerStats.push({
        id: playerId,
        name: playerTrait.name,
        kills: playerTrait.kills,
        deaths: playerTrait.deathCount,
        killStreak: playerTrait.killStreak,
      });
    }
  }

  playerStats.sort((a, b) => b.kills - a.kills);

  const topPlayers = isTabPressed ? playerStats.slice(0, 10) : playerStats.slice(0, 5);
  const totalPlayers = playerStats.length;

  let leaderboardHTML = '';
  topPlayers.forEach((player, index) => {
    const isLocalPlayer = player.id === id;
    const nameColor = isLocalPlayer ? '#FFD700' : 'white';
    const crown = index === 0 ? '👑 ' : '';

    const isLastRow = index === topPlayers.length - 1;
    const marginBottom = isLastRow ? '0' : '2px';

    const streakDisplay = player.killStreak >= 2 ? `🔥 ${player.killStreak}` : '';

    leaderboardHTML += `
      <div style="
        display: grid;
        grid-template-columns: 15px 120px 35px 35px 35px;
        gap: 4px;
        align-items: center;
        padding: 4px 6px;
        background-color: rgba(0, 0, 0, 0.3);
        margin-bottom: ${marginBottom};
        border-radius: 3px;
        font-weight: bold;
        color: ${nameColor};
        white-space: nowrap;
      ">
        <div style="text-align: center; white-space: nowrap;">${index + 1}</div>
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 120px;">${crown}${player.name.substring(0, 16)}</div>
        <div style="text-align: center; white-space: nowrap;">💀 ${player.deaths}</div>
        <div style="text-align: center; white-space: nowrap;">🏹 ${player.kills}</div>
        <div style="text-align: center; white-space: nowrap;">${streakDisplay}</div>
      </div>
    `;
  });

  // Add player count indicator below leaderboard (always show when not holding tab)
  if (!isTabPressed) {
    leaderboardHTML += `
      <div style="
        padding: 4px 6px;
        background-color: rgba(0, 0, 0, 0.3);
        margin-top: 2px;
        border-radius: 4px;
        font-weight: bold;
        color: white;
        text-align: center;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      ">
        <span style="
          background-color: rgba(255, 255, 255, 0.15);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        ">R</span>
        <span style="opacity: 0.8;">${totalPlayers} player${totalPlayers !== 1 ? 's' : ''}</span>
      </div>
    `;
  }

  leaderboardElement.innerHTML = leaderboardHTML;

  // Update kill feed - filter out expired entries
  killFeedEntries = killFeedEntries.filter(entry => t < entry.endTime);

  // Render kill feed
  let killFeedHTML = '';
  const localPlayerId = J.getLocalPlayer();
  for (const entry of killFeedEntries) {
    const elapsed = t - entry.startTime;
    const duration = entry.endTime - entry.startTime;
    const timeRemaining = entry.endTime - t;

    // Elastic wobble on appear (first 0.4 seconds)
    let scale = 1;
    const wobbleDuration = 0.4;
    if (elapsed < wobbleDuration) {
      const progress = elapsed / wobbleDuration;
      const c4 = (2 * Math.PI) / 3;
      const wobble = progress === 0
        ? 0
        : progress === 1
        ? 0
        : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4);
      scale = 1 + wobble * 1.5;
    }

    // Fade out in last 1 second
    let opacity = 1;
    if (timeRemaining < 1) {
      opacity = timeRemaining;
    }

    // Check if local player is the killer
    const isLocalPlayerKiller = entry.isLocalPlayerKiller;
    const bgColor = isLocalPlayerKiller
      ? `rgba(120, 120, 120, ${opacity})`
      : `rgba(0, 0, 0, ${0.4 * opacity})`;

    const marginBottom = '2px';

    // Different display for environmental deaths
    if (entry.isEnvironmental) {
      killFeedHTML += `
        <div style="
          display: inline-block;
          padding: 4px 8px;
          background-color: ${bgColor};
          margin-bottom: ${marginBottom};
          border-radius: 3px;
          font-weight: bold;
          opacity: ${opacity};
          transform: scale(${scale});
          transform-origin: center center;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        ">
          💀 <span style="color: #ff4444;">${entry.victimName}</span>
        </div>
      `;
    } else {
      killFeedHTML += `
        <div style="
          display: inline-block;
          padding: 4px 8px;
          background-color: ${bgColor};
          margin-bottom: ${marginBottom};
          border-radius: 3px;
          font-weight: bold;
          opacity: ${opacity};
          transform: scale(${scale});
          transform-origin: center center;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        ">
          <span style="color: #ff4444;">${entry.killerName}</span> 🏹 <span style="color: #ff4444;">${entry.victimName}</span>
        </div>
      `;
    }
  }

  killFeedElement.innerHTML = killFeedHTML;
});

J.net.listen(HitCommand, (data, senderId) => {
  const localPlayerId = J.getLocalPlayer();

  // Add to kill feed
  const killerTrait = J.getTrait(data.attackerId, PlayerTrait);
  const victimTrait = J.getTrait(data.victimId, PlayerTrait);
  const killerName = killerTrait?.name || "Unknown";
  const victimName = victimTrait?.name || "Unknown";

  addKillFeedEntry({
    killerName: killerName.substring(0, 16),
    victimName: victimName.substring(0, 16),
    isLocalPlayerKiller: data.attackerId === localPlayerId,
  });

  // Call progression system if local player got the kill
  if (data.attackerId === localPlayerId && data.victimId !== localPlayerId) {
    const killStreak = killerTrait?.killStreak || 1;
    onKill(victimName, killStreak);
  }

  if (data.victimId === localPlayerId) {
    const isSuicide = data.attackerId === localPlayerId;
    if (isSuicide) {
      setDeathMessage(`You 💀 died<br><span style="font-size: 32px;">you hit yourself</span>`);
    } else {
      setDeathMessage(`You 💀 died<br><span style="font-size: 24px;">killed by ${killerName.substring(0, 16)}.</span>`);
    }
  }
});

J.net.listen(EnvironmentalDeathCommand, (data, senderId) => {
  const localPlayerId = J.getLocalPlayer();
  const victimTrait = J.getTrait(data.victimId, PlayerTrait);
  const victimName = victimTrait?.name || "Unknown";

  addKillFeedEntry({
    killerName: "",
    victimName: victimName.substring(0, 16),
    isLocalPlayerKiller: false,
    isEnvironmental: true,
  });
});



document.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    isTabPressed = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "r" || event.key === "R") {
    isTabPressed = false;
  }
});
