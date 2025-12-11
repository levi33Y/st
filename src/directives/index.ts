import { isNil } from "lodash";
import { Directive } from "vue";

const createSecurityIcon = () => {
  const iconElement = document.createElement("el-icon");

  iconElement.classList.add("v-security");

  iconElement.setAttribute("size", "20");

  iconElement.style.color = "#475AEC";

  iconElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="check">
    <path id="Union" d="M13.9895 4.91888L6.91842 11.9899L2.67578 7.74731L3.61859 6.8045L6.91842 10.1043L13.0467 3.97607L13.9895 4.91888Z" fill="#475AEC"/>
    </g>
    </svg>
  `;

  return iconElement;
};

export const CheckedDirective: Directive = {
  mounted: (el, binding) => {
    if (binding.value !== false) {
      el.classList.add("v-checked");

      const iconElement = createSecurityIcon();

      el._secuityIcon = iconElement;

      el.appendChild(iconElement);
    }
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) {
      return;
    }

    if (binding.value === false) {
      el.classList.remove("v-checked");

      el._secuityIcon.remove();

      el._secuityIcon = null;
    } else if (binding.value && isNil(el._secuityIcon)) {
      el.classList.add("v-checked");

      const iconElement = createSecurityIcon();

      el._secuityIcon = iconElement;

      el.appendChild(iconElement);
    }
  },
};
