import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ClientInfo } from "../../core/Schemas";
import { translateText } from "../Utils";

@customElement("group-lobby-roster")
export class GroupLobbyRoster extends LitElement {
  @property({ type: Array }) clients: ClientInfo[] = [];
  @property({ type: String }) lobbyCreatorClientID: string = "";
  @property({ type: String }) currentClientID: string = "";

  createRenderRoot() {
    return this;
  }

  private renderRoleTag(client: ClientInfo) {
    if (client.clientID === this.lobbyCreatorClientID) {
      return html`<span
        class="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-300 border border-blue-500/30"
      >
        ${translateText("host_modal.host_badge")}
      </span>`;
    }
    if (client.clientID === this.currentClientID) {
      return html`<span
        class="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/15"
      >
        Vous
      </span>`;
    }
    return html``;
  }

  private renderFlag(client: ClientInfo) {
    if (!client.flag) {
      return html`<img
        src="/flags/xx.svg"
        alt="flag"
        class="w-[5.5rem] h-auto rounded-lg border border-white/20 bg-black/20"
      />`;
    }

    if (client.flag.startsWith("!")) {
      return html`<div
        class="px-3 py-2 rounded-lg border border-white/15 bg-black/20 text-xs text-white/70 uppercase tracking-wider font-bold"
      >
        Drapeau perso
      </div>`;
    }

    return html`<img
      src=${`/flags/${encodeURIComponent(client.flag)}.svg`}
      alt=${client.flag}
      class="w-[5.5rem] h-auto rounded-lg border border-white/20 bg-black/20"
      @error=${(event: Event) => {
        const img = event.currentTarget as HTMLImageElement;
        if (!img.src.endsWith("/flags/xx.svg")) {
          img.src = "/flags/xx.svg";
        }
      }}
    />`;
  }

  render() {
    if (this.clients.length === 0) {
      return html`
        <div
          class="w-full min-h-[180px] rounded-xl border border-white/10 bg-black/20 flex items-center justify-center text-white/60 text-sm"
        >
          ${translateText("public_lobby.connecting")}
        </div>
      `;
    }

    return html`
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${this.clients.map(
          (client) => html`
            <div
              class="rounded-xl border border-white/10 bg-black/20 p-4 flex flex-col gap-3 items-center text-center"
            >
              <div class="flex flex-wrap justify-center items-center gap-2">
                <span class="text-sm font-bold text-white uppercase tracking-wider">
                  ${client.username}
                </span>
                ${this.renderRoleTag(client)}
              </div>
              ${this.renderFlag(client)}
            </div>
          `,
        )}
      </div>
    `;
  }
}
