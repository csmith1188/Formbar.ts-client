export type Student = {
    id: number;
    displayName: string;
    activeClass: string | null;
    permissions: number;
    classPermissions: number;
    tags: string[];
    pollRes: {
        buttonRes: string;
        textRes: string;
        time: number;
    };
    help: boolean;
    break: boolean | string;
    pogMeter: number;
    isGuest: boolean;
};