import { once } from 'events';
import process  from 'process';

const DEFAULT_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGUSR2'];

const noop = () => {
};

const loggerStub = {
    info: noop,
    error: noop,
};

/**
 * @typedef { import('./types').Service } Service
 * @typedef { import('./types').Logger } Logger
 * @typedef { import('./types').AppInitOption } AppInitOption
 */


/**
 * @param {Service[]} services
 * @param {Logger} logger
 * @return {Promise<number>}
 */
async function stopServices(services, logger = loggerStub) {
    let exitCode = 0;

    for (const service of services) {
        const serviceName = service?.constructor?.name || 'Unnamed';
        try {
            logger.info(`[INIT] Остановка сервиса "${serviceName}"`);
            // eslint-disable-next-line no-await-in-loop
            await service.stop?.();
            logger.info(`[INIT] Сервис остановлен "${serviceName}"`);
        } catch (error) {
            logger.error(`[INIT] Возникла ошибка при остановке сервиса "${serviceName}"`, { error });
            exitCode = 1;
        }
    }

    return exitCode;
}

/**
 * @param {Service[]} services
 * @param {Logger} logger
 * @return {Promise<Service[]>}
 */
async function startServices(services, logger = loggerStub) {
    const runningServices = [];

    for (const service of services) {
        const serviceName = service?.constructor?.name || 'Unnamed';
        try {
            logger.info(`[INIT] Запуск сервиса "${serviceName}"`);
            // eslint-disable-next-line no-await-in-loop
            await service.start?.();
            logger.info(`[INIT] Сервис запущен "${serviceName}"`);
            runningServices.push(service);
        } catch (error) {
            logger.error(`[INIT] Возникла ошибка при запуске сервиса "${serviceName}"`, { error });
        }
    }

    return runningServices;
}

/**
 * @param {Service[]} services
 * @param {AppInitOption} options
 * @return {Promise<void>}
 */
export default async function init(
    services,
    options = {},
) {
    const {
        signals = DEFAULT_SIGNALS,
        logger = loggerStub,
    } = options;

    let exitCode = 0;

    const runningServices = await startServices(services, logger);

    if (runningServices.length === services.length) {
        const [receivedSignal] = await Promise.race(signals.map((signal) => once(process, signal)));
        logger.info(`[INIT] Получен сигнал ${receivedSignal}. Завершение работы...`);
    } else {
        exitCode = 1;
    }

    exitCode = await stopServices([...runningServices].reverse(), logger) || exitCode;

    logger.info(`[INIT] Выход с кодом ${exitCode}`);
    process.exit(exitCode);
}
