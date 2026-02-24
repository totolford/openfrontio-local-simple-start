import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { HostLobbyModal } from "./HostLobbyModal";
import { JoinIpModal } from "./JoinIpModal";
import { SinglePlayerModal } from "./SinglePlayerModal";

const CARD_BG = "bg-[color-mix(in_oklab,var(--frenchBlue)_70%,black)]";

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
    return html`
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mx-auto pb-4">
        ${this.renderActionCard("Solo", this.openSinglePlayerModal)}
        ${this.renderActionCard("Créer un groupe", this.openHostLobby)}
        ${this.renderActionCard("Rejoindre un groupe", this.openJoinIpModal)}
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

  private renderActionCard(title: string, onClick: () => void) {
    return html`
      <button
        @click=${onClick}
        class="flex items-center justify-center w-full h-20 md:h-24 rounded-xl ${CARD_BG} border-0 transition-transform hover:scale-[1.02] active:scale-[0.98] text-sm lg:text-base font-bold text-white uppercase tracking-wider text-center"
      >
        ${title}
      </button>
    `;
  }
}
