import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { BaseModal } from "./components/BaseModal";
import { modalHeader } from "./components/ui/ModalHeader";
import {
  getBestHostInput,
  normalizeHostOrigin,
  setSavedHostOrigin,
} from "./LanHost";

@customElement("join-ip-modal")
export class JoinIpModal extends BaseModal {
  @query("#join-ip-target-input") private targetInput!: HTMLInputElement;

  @state() private targetAddress = "";

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
            Adresse du groupe (IP ou lien complet)
          </label>
          <input
            id="join-ip-target-input"
            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            .value=${this.targetAddress}
            @input=${(e: Event) => {
              this.targetAddress = (e.target as HTMLInputElement).value;
            }}
            placeholder="Ex: http://x.x.x.x:9000/game/abc123 ou x.x.x.x:9000"
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
    void this.populateDefaultTarget();
  }

  private async populateDefaultTarget() {
    this.targetAddress = await getBestHostInput();
  }

  private connectToHost = () => {
    const raw = this.targetAddress.trim();
    if (!raw) {
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

    const withProtocol =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : `http://${raw}`;

    try {
      const url = new URL(withProtocol);
      const origin = normalizeHostOrigin(url.origin);
      if (!origin) {
        throw new Error("invalid_origin");
      }
      setSavedHostOrigin(origin);

      const hasGamePath = /\/game\/[^/?#]+/.test(url.pathname);
      if (hasGamePath) {
        window.location.href = `${origin}${url.pathname}${url.search}${url.hash}`;
        return;
      }

      window.location.href = `${origin}/`;
    } catch {
      const origin = setSavedHostOrigin(raw);
      if (!origin) {
        window.dispatchEvent(
          new CustomEvent("show-message", {
            detail: {
              message: "Adresse de groupe invalide",
              color: "red",
              duration: 2500,
            },
          }),
        );
        return;
      }
      window.location.href = `${origin}/`;
    }
  };
}
