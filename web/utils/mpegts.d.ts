export interface Player {
    constructor(mediaDataSource: any, config?: any): Player;
    destroy(): void;
    on(event: string, listener: Function): void;
    off(event: string, listener: Function): void;
    attachMediaElement(mediaElement: HTMLMediaElement): void;
    detachMediaElement(): void;
    load(): void;
    unload(): void;
    play(): Promise<void>;
    pause(): void;
    type: string;
    buffered: TimeRanges;
    duration: number;
    volume: number;
    muted: boolean;
    currentTime: number;
    mediaInfo: Object;
    statisticsInfo: {
        currentSegmentIndex: number,
        decodedFrames: number,
        droppedFrames: number,
        hasRedirect: boolean
        loaderType: "fetch-stream-loader" | string
        playerType: "MSEPlayer" | string
        speed: number
        totalSegmentCount: number
        url: string
    }
}
