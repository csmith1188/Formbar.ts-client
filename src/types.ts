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

export type UserData = {
    loggedIn: boolean,
    id: number,
    email: string,
    permissions: number,
    classPermissions: number,
    help: boolean,
    break: boolean | string,
    pogMeter: number,
    classId: number | null,
}

export type ClassData = {
    id: number,
    className: string,
    isActive: boolean,
    timer: {
        startTime: number,
        timeLeft: number,
        active: boolean,
        sound: boolean
    },
    poll: {
        status: boolean,
        responses: any[],
        allowTextResponses: boolean,
        prompt: string,
        weight: number,
        blind: boolean,
        excludedRespondents: any[],
        totalResponses: number,
        totalResponders: number,
        startTime?: number
    },
    permissions: {
        links: number,
        controlPoll: number,
        manageStudents: number,
        breakHelp: number,
        manageClass: number,
        auxiliary: number,
        userDefaults: number,
        seePoll: number,
        votePoll: number
    },
    key: string,
    tags: string[],
    settings: {
        mute: boolean,
        filter: any,
        sort: any,
        isExcluded: {
            guests: boolean,
            mods: boolean,
            teachers: boolean
        }
    },
    students: Student[]
};