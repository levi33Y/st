import { Participant, Track } from "livekit-client";
import { SoundMeter } from "../webrtc/soundmeter";

export class ParticipantStream {
  id: string;

  name: string = "";

  nick: string = "";

  participant: Participant;

  isLocal: boolean;

  cameraStream: MediaStream | undefined;

  microphoneStream: MediaStream | undefined;

  isMuted: boolean = false;

  isSpeaking: boolean = false;

  isEnableAudioLevel: boolean = false;

  frequency: number = 0;

  frame: number = 0;

  soundMeter: SoundMeter | undefined;

  static audioContext = new AudioContext();

  private audioContextAnalysis: AudioContext | null = null;

  // api properties

  isActive: boolean = false;

  constructor(participant: Participant, isLocal = false) {
    this.id = participant.identity;

    this.participant = participant;

    this.isLocal = isLocal;

    this.updata(participant);

    this.updateNick(participant?.name);
  }

  updata(participant: Participant) {
    this.participant = participant;

    const cameraPub = this.participant?.getTrack?.(Track.Source.Camera);
    const micPub = this.participant?.getTrack?.(Track.Source.Microphone);

    const cameraEnabled =
      cameraPub && cameraPub?.isSubscribed && !cameraPub.isMuted;
    const micEnabled = micPub && micPub?.isSubscribed && !micPub.isMuted;

    if (cameraEnabled && cameraPub.videoTrack?.mediaStream) {
      this.cameraStream = cameraPub.videoTrack.mediaStream;
    } else {
      this.cameraStream = undefined;
    }

    /*    if (micEnabled && micPub.audioTrack?.mediaStream) {
      if (
        this.microphoneStream?.getAudioTracks()[0]?.getSettings()?.deviceId !==
        micPub?.audioTrack?.mediaStreamTrack?.getSettings()?.deviceId
      ) {
        this.microphoneStream = new MediaStream([
          micPub.audioTrack.mediaStreamTrack,
        ]);

        this.setFrequency();
      } else {
        !this.audioContextAnalysis && this.setFrequency();
      }
    }*/

    this.isMuted = !micEnabled;

    this.isSpeaking = this.participant.isSpeaking;

    this.name = this.participant.name ?? "";
  }

  updateFrequency(frequency: number = 0) {
    this.frequency = frequency;
  }

  updateNick(nick: string = "") {
    this.nick = nick;
  }

  awaken() {
    this.isActive = true;
  }

  sleep() {
    this.isActive = false;
  }

  getByteFrequency() {
    if (!this.isEnableAudioLevel) return;
    this.soundMeter?.getByteFrequencyData();
    const dataArray = this.soundMeter!.dataArray;
    let frequency = 0;
    let count = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i];
      if (value > 0) {
        frequency += value;
        count += 1;
      }
    }
    this.frequency = frequency === 0 ? 0 : frequency / count;
    this.frame = requestAnimationFrame(() => this.getByteFrequency());
  }

  enableAudioLevel() {
    this.soundMeter = new SoundMeter(
      ParticipantStream.audioContext,
      this.microphoneStream!,
    );
    this.getByteFrequency();
  }

  private setFrequency() {
    if (this.audioContextAnalysis) {
      this.cleanupAudioResources(this.audioContextAnalysis);
    }

    if (!this.microphoneStream) {
      return;
    }

    const stream = this.microphoneStream;
    const context = new AudioContext();
    this.audioContextAnalysis = context;

    let source: MediaStreamAudioSourceNode | undefined;
    let analyser: AnalyserNode | undefined;

    try {
      source = context.createMediaStreamSource(stream);
      analyser = context.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;

      const frequencyBinCount = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(frequencyBinCount);

      const loop = () => {
        if (!this.audioContextAnalysis || !source || !analyser) {
          this.audioContextAnalysis &&
            this.cleanupAudioResources(
              this.audioContextAnalysis,
              source,
              analyser,
            );

          return;
        }

        analyser?.getByteFrequencyData(dataArray);
        const totalFrequency = dataArray.reduce((sum, value) => sum + value, 0);
        this.frequency = totalFrequency / frequencyBinCount;

        requestAnimationFrame(loop);
      };

      loop();
    } catch (error) {
      this.cleanupAudioResources(context, source, analyser);
    }
  }

  private cleanupAudioResources(
    context?: AudioContext | null,
    source?: MediaStreamAudioSourceNode,
    analyser?: AnalyserNode,
  ) {
    if (!context) return;

    try {
      if (source) {
        source.disconnect();
      }
      if (analyser) {
        analyser.disconnect();
      }
      context.close().catch(console.error);
    } finally {
      this.audioContextAnalysis = null;
    }
  }

  disconnect() {
    this.isEnableAudioLevel = false;
    this.soundMeter?.stop();
    cancelAnimationFrame(this.frame);
    this.cleanupAudioResources(this.audioContextAnalysis);
  }
}
