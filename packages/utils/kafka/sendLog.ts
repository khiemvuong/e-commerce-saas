import { kafka } from './index';

const producer = kafka.producer();

interface LogData {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    source: string;
    metadata?: Record<string, any>;
}

export async function sendLog(logData: LogData) {
    try {
        await producer.connect();
        await producer.send({
            topic: 'system-logs',
            messages: [
                {
                    value: JSON.stringify({
                        ...logData,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
    } catch (error) {
        console.error('Error sending log to Kafka:', error);
    } finally {
        await producer.disconnect();
    }
}
