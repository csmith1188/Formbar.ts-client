type LogProps = {
    message: string;
    data?: any;
    level?: 'info' | 'warn' | 'error' | 'debug';
}

export default function Log({ message, data = {}, level = 'info' }: LogProps) {
    console.log(`[${level.toUpperCase()}]: ${message}`);
    if(Object.keys(data).length > 0) {
        console.log(data);
    }
    return null;
}