export interface Service {
    start?(): Promise<void>
    stop?(): Promise<void>
}

export interface Logger {
    info(...args: any[]): void
    error(...args: any[]): void
}

export type AppInitOption = {
    signals?: string[],
    logger?: Logger
}
