import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { BaseModal } from "./components/BaseModal";
import { modalHeader } from "./components/ui/ModalHeader";
import {
  extractGameId,
  getBestHostInput,
  setSavedHostOrigin,
} from "./LanHost";

@customElement("join-ip-modal")
export class JoinIpModal extends BaseModal {
  @query("#join-ip-host-input") private hostInput!: HTMLInputElement;
  @query("#join-ip-lobby-input") private lobbyInput!: HTMLInputElement;

  @state() private hostAddress = "";
  @state() private lobbyIdOrUrl = "";

  constructor() {
    super();
    this.id = "page-join-ip";
  }

  render() {
    const content = html`
      <div class="${this.modalContainerClass}">
        ${modalHeader({
          title: "Rejoindre un groupe",
          onBack: () => this.close(),
          ariaLabel: "Retour",
        })}
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 mr-1">
          <label class="block text-xs font-bold uppercase tracking-wider text-white/60">
            IP de l'hote ou hote:port
          </label>
          <input
            id="join-ip-host-input"
            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            .value=${this.hostAddress}
            @input=${(e: Event) => {
              this.hostAddress = (e.target as HTMLInputElement).value;
            }}
            placeholder="192.168.1.42:9000"
          />

          <label class="block text-xs font-bold uppercase tracking-wider text-white/60">
            ID du groupe (optionnel)
          </label>
          <input
            id="join-ip-lobby-input"
            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            .value=${this.lobbyIdOrUrl}
            @input=${(e: Event) => {
              this.lobbyIdOrUrl = (e.target as HTMLInputElement).value;
            }}
            placeholder="Colle un ID de groupe ou un lien"
          />
        </div>

        <div class="p-6 pt-4 border-t border-white/10 bg-black/20 shrink-0">
          <button
            class="w-full py-4 text-sm font-bold text-white uppercase tracking-widest bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 active:translate-y-0"
            @click=${this.connectToHost}
          >
            Rejoindre
          </button>
        </div>
      </div>
    `;

    if (this.inline) {
      return content;
    }

    return html`
      <o-modal
        title=""
        ?hideCloseButton=${true}
        ?inline=${this.inline}
        hideHeader
      >
        ${content}
      </o-modal>
    `;
  }

  protected onOpen(): void {
    void this.populateDefaultHost();
    this.lobbyIdOrUrl = "";
  }

  private async populateDefaultHost() {
    this.hostAddress = await getBestHostInput();
  }

  private connectToHost = () => {
    const origin = setSavedHostOrigin(this.hostAddress);
    if (!origin) {
      window.dispatchEvent(
        new CustomEvent("show-message", {
          detail: {
            message: "IP invalide",
            color: "red",
            duration: 2500,
          },
        }),
      );
      return;
    }

    const gameID = extractGameId(this.lobbyIdOrUrl);
    const target = gameID ? `${origin}/game/${gameID}` : `${origin}/`;
    window.location.href = target;
  };
}
