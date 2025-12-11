class Timer {
  private static instance: Timer | null = null;

  private timerId: NodeJS.Timeout | null = null;

  public static getInstance(): Timer {
    if (!Timer.instance) {
      Timer.instance = new Timer();
    }

    return Timer.instance;
  }

  public start(callback: () => void, interval: number): void {
    this.timerId !== null && this.stop();

    this.timerId = setInterval(callback, interval);
  }

  public stop(): void {
    this.timerId && clearInterval(this.timerId);

    this.timerId = null;
  }
}

export default Timer.getInstance();
