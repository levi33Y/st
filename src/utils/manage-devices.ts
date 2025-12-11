class ManageDevices {
  VIRTUAL_KEYWORDS: string[] = [
    "Virtual",
    "VB-Cable",
    "BlackHole",
    "Loopback",
    "WeMeet",
    "VB-Audio",
  ];

  VIRTUAL_CABLE_KEYWORDS: string[] = ["VB-Audio", "BlackHole"];

  WINDOWS_ADUIO_KEYS: string[] = ["Communications"];

  getDevices() {
    return navigator.mediaDevices.enumerateDevices();
  }

  getAudioDevices() {
    return this.getDevices().then((devices) =>
      devices.filter(
        (item) =>
          !this.VIRTUAL_KEYWORDS.some((keyword) =>
            item.label.includes(keyword),
          ) &&
          !this.WINDOWS_ADUIO_KEYS.some((keyword) =>
            item.label.includes(keyword),
          ),
      ),
    );
  }

  getAudioOutputDevices() {
    return this.getAudioDevices().then((devices) =>
      devices.filter((device) => device.kind === "audiooutput"),
    );
  }

  getAudioInputDevices() {
    return this.getAudioDevices().then((devices) =>
      devices.filter((device) => device.kind === "audioinput"),
    );
  }

  getAudioDefaultInputDevice() {
    return this.getAudioInputDevices().then((devices) => {
      const defaultGroupId = devices.find(
        (device) => device.deviceId === "default",
      )?.groupId as string;

      return devices.find(
        (item) =>
          item.deviceId !== "default" && item.groupId === defaultGroupId,
      );
    });
  }

  getAudioDefaultOutputDevice() {
    return this.getAudioOutputDevices().then((devices) => {
      const defaultGroupId = devices.find(
        (device) => device.deviceId === "default",
      )?.groupId as string;

      return devices.find(
        (item) =>
          item.deviceId !== "default" && item.groupId === defaultGroupId,
      );
    });
  }

  getAudioVirtualOutputDevice() {
    return this.getDevices().then((devices) => {
      const generic = devices
        ?.filter(
          (device) =>
            this.VIRTUAL_CABLE_KEYWORDS.some((keyword) =>
              device.label.includes(keyword),
            ) &&
            device.kind === "audiooutput" &&
            device.deviceId !== "default",
        )
        ?.at(0);

      const windows = devices
        ?.filter(
          (device) =>
            device.deviceId !== "default" &&
            device.label.includes("CABLE Output"),
        )
        ?.at(0);

      if (devices.some((item) => item.label.includes("VB-Audio"))) {
        return windows;
      } else {
        return generic;
      }
    });
  }
}

export default new ManageDevices();
