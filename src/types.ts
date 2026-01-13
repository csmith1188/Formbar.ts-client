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
    help: {
        reason: string;
        time: number;
    };
    break: boolean | string;
    pogMeter: number;
    isGuest: boolean;
};

export type CurrentUserData = {
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

export type UserData = {
    displayName: string
    email: string
    id: number
    permissions: number
    verified: number
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

export type PollAnswer = {
    answer: string;
    color: string;
    responses: number;
    weight: number;
}

export type Transaction = {
    amount: number
    date: string
    from_user: number | null
    pool: number | null
    reason: string
    to_user: number | null
}

export enum Permissions {
    MANAGER = 5,
    TEACHER = 4,
    MOD = 3,
    STUDENT = 2,
    GUEST = 1,
    BANNED = 0
}

export const PermissionLevels: { [key: number]: string } = {
    [Permissions.BANNED]: "Banned",
    [Permissions.GUEST]: "Guest",
    [Permissions.STUDENT]: "Student",
    [Permissions.MOD]: "Mod",
    [Permissions.TEACHER]: "Teacher",
    [Permissions.MANAGER]: "Manager"
};