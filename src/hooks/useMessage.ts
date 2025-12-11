import { isNil } from "lodash";
import { ref } from "vue";
export function useMessage() {
  const timeoutId = ref<NodeJS.Timeout>();

  const messageServices = (content?: string, timeout?: number) => {
    const existingEl = document.querySelector(".custom-message");

    if (existingEl) {
      existingEl.remove();

      clearTimeout(timeoutId.value);
    }

    const el = document.createElement("div");

    el.className = "custom-message";

    el.innerHTML = `
              <div
              style="font-size:14px;
              background-color:rgba(40,40,56,50%); 
              width:auto;
              max-height:74px;
              padding: 16px;
              border-radius: 8px;
              color: #ffffff;
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              z-index:999;
              pointer-events: none;
              line-height: 21px;"
              >${isNil(content) ? "message" : content}</div>`;

    document.body.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, timeout ?? 3000);
  };

  return {
    messageServices,
  };
}
