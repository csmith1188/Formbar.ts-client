export type CurrentUserData = {
    API: string;
    activeClass: number | null;
    break: boolean;
    classPermissions: number | null;
    displayName: string;
    email: string;
    help: boolean;
    id: number;
    isGuest: boolean;
    ownedPolls: any[]
    permissions: number;
    pogMeter: number;
    pollRes: { buttonRes: string; textRes: string; time: number | null };
    sharedPolls: any[];
    tags: any[];
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
    owner: number,
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

export type Class = {
    id: string;
    name: string;
    key: string;
    owner: string;
    isActive: boolean;
    students: Student[];
}

export type ClassInfo = {
    id: string;
    name: string;
    isActive: boolean;
}

export type Student = {
    id: string;
    email: string;
    displayName: string;
    permissions: number;
    digipogs: number;
    classPermissions: number;
};

export type Poll = {
    id: string;
    prompt: string;
    answers: any[];
    blind: boolean;
    allowTextResponses: boolean;
    allowMultipleResponses: boolean;
}