import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { HostLobbyModal } from "./HostLobbyModal";
import { JoinIpModal } from "./JoinIpModal";
import { SinglePlayerModal } from "./SinglePlayerModal";

type GameModeCard = {
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  accent: string;
  onClick: () => void;
};

@customElement("game-mode-selector")
export class GameModeSelector extends LitElement {
  createRenderRoot() {
    return this;
  }

  /**
   * Validates username input and shows error message if invalid.
   * Returns true if valid, false otherwise.
   */
  private validateUsername(): boolean {
    const usernameInput = document.querySelector("username-input") as any;
    if (usernameInput?.isValid?.() === false) {
      window.dispatchEvent(
        new CustomEvent("show-message", {
          detail: {
            message: usernameInput.validationError,
            color: "red",
            duration: 3000,
          },
        }),
      );
      return false;
    }
    return true;
  }

  // Kept for compatibility with Main.ts lifecycle calls.
  public stop() {}

  render() {
    const cards: GameModeCard[] = [
      {
        title: "Solo",
        subtitle: "Partie instantanée avec réglages complets et bots.",
        badge: "Rapide",
        image: "/images/GameplayScreenshot.png",
        accent: "255, 188, 90",
        onClick: this.openSinglePlayerModal,
      },
      {
        title: "Créer un groupe",
        subtitle: "Héberge depuis ton PC et invite tes amis en lien direct.",
        badge: "Host",
        image: "/images/TerrainMapFrontPage.png",
        accent: "24, 198, 160",
        onClick: this.openHostLobby,
      },
      {
        title: "Rejoindre un groupe",
        subtitle: "Colle le lien d'invitation et entre immédiatement en lobby.",
        badge: "Invite",
        image: "/images/EuropeBackground.webp",
        accent: "82, 168, 255",
        onClick: this.openJoinIpModal,
      },
    ];

    return html`
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mx-auto pb-4">
        ${cards.map((card) => this.renderActionCard(card))}
      </div>
    `;
  }

  private openSinglePlayerModal = () => {
    if (!this.validateUsername()) return;
    (
      document.querySelector("single-player-modal") as SinglePlayerModal
    )?.open();
  };

  private openHostLobby = () => {
    if (!this.validateUsername()) return;
    (document.querySelector("host-lobby-modal") as HostLobbyModal)?.open();
  };

  private openJoinIpModal = () => {
    (document.querySelector("join-ip-modal") as JoinIpModal)?.open();
  };

  private renderActionCard(card: GameModeCard) {
    return html`
      <button
        @click=${card.onClick}
        class="of-mode-card"
        style=${`--of-mode-accent: ${card.accent}; --of-mode-image: url('${card.image}');`}
      >
        <span class="of-mode-card__scrim"></span>
        <span class="of-mode-card__content">
          <span class="of-mode-card__badge">${card.badge}</span>
          <span class="of-mode-card__title">${card.title}</span>
          <span class="of-mode-card__subtitle">${card.subtitle}</span>
        </span>
      </button>
    `;
  }
}
