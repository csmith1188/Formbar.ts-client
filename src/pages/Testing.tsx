import { Button, Masonry, Flex, Input } from "antd";
import { accessToken, formbarUrl } from "../socket";
import { useState } from "react";
import FormbarHeader from "../components/FormbarHeader";

const getFetchOptions = (method = "GET", body?: any) => {
    const opts: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return opts;
}

const testFuncs = [
    { name: 'Certs', func: certs, hasArgs: false, category: 'System', method: 'GET' },
    { name: 'Get Me', func: getMe, hasArgs: false, category: 'User', method: 'GET' },
    { name: 'Get User', func: getUser, hasArgs: true, category: 'User', method: 'GET' },
    { name: 'Get User Class', func: getUserClass, hasArgs: true, category: 'User', method: 'GET' },
    { name: 'Get User Classes', func: getUserClasses, hasArgs: true, category: 'User', method: 'GET' },
    { name: 'Delete User', func: deleteUser, hasArgs: true, category: 'User', method: 'DELETE' },
    { name: 'Change Perm (email|perm)', func: changePerm, hasArgs: true, category: 'User', method: 'PATCH' },
    { name: 'Ban User', func: banUser, hasArgs: true, category: 'User', method: 'PATCH' },
    { name: 'Unban User', func: unbanUser, hasArgs: true, category: 'User', method: 'PATCH' },
    { name: 'Verify User', func: verifyUser, hasArgs: true, category: 'User', method: 'PATCH' },

    // Class endpoints (from attachments)
    { name: 'Get Class', func: getClass, hasArgs: true, category: 'Class', method: 'GET' },
    { name: 'Get Class Active', func: getClassActive, hasArgs: true, category: 'Class', method: 'GET' },
    { name: 'Get Class Banned', func: getClassBanned, hasArgs: true, category: 'Class', method: 'GET' },
    { name: 'Get Class Links', func: getClassLinks, hasArgs: true, category: 'Class', method: 'GET' },
    { name: 'Get Class Permissions', func: getClassPermissions, hasArgs: true, category: 'Class', method: 'GET' },
    { name: 'Get Class Students', func: getClassStudents, hasArgs: true, category: 'Class', method: 'GET' },
    { name: 'Create Class', func: createClass, hasArgs: true, category: 'Class', method: 'POST' },
    { name: 'End Class', func: endClass, hasArgs: true, category: 'Class', method: 'POST' },
    { name: 'Join Class', func: joinClass, hasArgs: true, category: 'Class', method: 'POST' },
    { name: 'Leave Class', func: leaveClass, hasArgs: true, category: 'Class', method: 'POST' },
    { name: 'Start Class', func: startClass, hasArgs: true, category: 'Class', method: 'POST' },

    // Class - Polls
    { name: 'Get Class Polls', func: getClassPolls, hasArgs: true, category: 'Class - Polls', method: 'GET' },
    { name: 'Get Class Current Poll', func: getClassPollCurrent, hasArgs: true, category: 'Class - Polls', method: 'GET' },
    { name: 'Clear Class Poll', func: clearClassPolls, hasArgs: true, category: 'Class - Polls', method: 'POST' },
    { name: 'Create Class Poll', func: createClassPoll, hasArgs: true, category: 'Class - Polls', method: 'POST' },
    { name: 'End Class Poll', func: endClassPoll, hasArgs: true, category: 'Class - Polls', method: 'POST' },
    { name: 'Response to Poll', func: respondClassPoll, hasArgs: true, category: 'Class - Polls', method: 'POST' },

    // Class - Breaks
    { name: 'End Own Break', func: endOwnBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST' },
    { name: 'Request Break', func: requestBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST' },
    { name: 'Approve Break', func: approveBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST' },
    { name: 'Deny Break', func: denyBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST' },

    // Class - Help
    { name: 'Delete Help Request', func: deleteHelpRequest, hasArgs: true, category: 'Class - Help', method: 'DELETE' },
    { name: 'Request Help', func: requestClassHelp, hasArgs: true, category: 'Class - Help', method: 'POST' },

    // Room
    { name: 'Leave Room', func: leaveRoom, hasArgs: true, category: 'Room', method: 'DELETE' },
    { name: 'Get Room Tags', func: getRoomTags, hasArgs: false, category: 'Room', method: 'GET' },
    { name: 'Join Room By Code', func: joinRoomByCode, hasArgs: true, category: 'Room', method: 'POST' },
    { name: 'Set Room Tags', func: setRoomTags, hasArgs: true, category: 'Room', method: 'PUT' },

    // Room - Links
    { name: 'Remove Room Link', func: removeRoomLink, hasArgs: true, category: 'Room - Links', method: 'DELETE' },
    { name: 'Get Room Links', func: getRoomLinks, hasArgs: true, category: 'Room - Links', method: 'GET' },
    { name: 'Add Room Link', func: addRoomLink, hasArgs: true, category: 'Room - Links', method: 'POST' },
    { name: 'Update Room Link', func: updateRoomLink, hasArgs: true, category: 'Room - Links', method: 'PUT' },

    // Digipogs
    { name: 'Award Digipogs', func: awardDigipogs, hasArgs: true, category: 'Digipogs', method: 'POST' },
    { name: 'Transfer Digipogs', func: transferDigipogs, hasArgs: true, category: 'Digipogs', method: 'POST' },

    // IP Management
    { name: 'Remove IP', func: removeIP, hasArgs: true, category: 'IP', method: 'DELETE' },
    { name: 'Get IP List', func: getIPList, hasArgs: true, category: 'IP', method: 'GET' },
    { name: 'Toggle IP', func: toggleIP, hasArgs: true, category: 'IP', method: 'POST' },
    { name: 'Update IP', func: updateIP, hasArgs: true, category: 'IP', method: 'PUT' },

    // Manager
    { name: 'Get Manager', func: getManager, hasArgs: false, category: 'Manager', method: 'GET' },

    // Logs
    { name: 'Get Logs', func: getLogs, hasArgs: false, category: 'Logs', method: 'GET' },
    { name: 'Get Log File', func: getLogFile, hasArgs: true, category: 'Logs', method: 'GET' },

    // Student
    { name: 'Student Submit', func: studentSubmit, hasArgs: true, category: 'Student', method: 'POST' },

    // OAuth
    { name: 'OAuth Authorize', func: oauthAuthorize, hasArgs: false, category: 'OAuth', method: 'GET' },
    { name: 'OAuth Revoke', func: oauthRevoke, hasArgs: true, category: 'OAuth', method: 'POST' },
    { name: 'OAuth Token', func: oauthToken, hasArgs: true, category: 'OAuth', method: 'POST' },

    // Profile
    { name: 'Get Profile', func: getProfile, hasArgs: true, category: 'Profile', method: 'GET' },
    { name: 'Get Profile Transactions', func: getProfileTransactions, hasArgs: true, category: 'Profile', method: 'GET' },

    // Pools
    { name: 'Get User Pools', func: getUserPools, hasArgs: false, category: 'Pools', method: 'GET' },
]

function getButtonStyle(method?: string) {
    const map: Record<string, string> = {
        GET: 'blue',      // blue
        DELETE: 'red',   // red
        POST: 'green',     // green
        PATCH: 'cyan',    // teal
        PUT: 'orange',      // orange
    };
    const color = method ? map[method.toUpperCase()] || 'default' : 'default';
    return color;
}

export function Testing() {
    const [inputValue, setInputValue] = useState("");

    return (
        <div style={{ padding: '0 20px' }}>
            <FormbarHeader />
            <Flex style={{ height: 'calc(100vh - 60px)', overflow: 'auto' }} wrap gap={16} align="start">
                <h1>Testing Page</h1>
                <p>This page is for testing new features and components.</p>
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Argument (id, email, or 'email|perm')"/>
                {
                    // group tests by category
                    Object.entries(testFuncs.reduce<Record<string, any[]>>((acc, t) => {
                        const key = (t as any).category || 'Uncategorized';
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(t);
                        return acc;
                    }, {})).map(([category, tests]) => (
                        <div key={category} style={{ marginBottom: 12 }}>
                            <h3 style={{ margin: '6px 0' }}>{category}</h3>
                            <Flex vertical align="start" style={{ background: '#000a', padding: 8, borderRadius: 10 }} wrap gap={8}>
                                {tests.map((test: any) => (
                                    <Button
                                        key={test.name}
                                        onClick={() => test.hasArgs ? test.func(inputValue) : test.func()}
                                        style={{ margin: 4 }}
                                        type='default'
                                        variant="solid"
                                        color={getButtonStyle(test.method) as any}
                                    >{test.name}</Button>
                                ))}
                            </Flex>
                        </div>
                    ))
                }
            </Flex>
        </div>
    );
}

async function certs() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/certs`, getFetchOptions());
        const data = await res.json();
        console.log("Certs:", data);
    } catch (err) {
        console.error("Error fetching certs:", err);
    }
}

async function getMe() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/me`, getFetchOptions());
        const data = await res.json();
        console.log("Get Me:", data);
    } catch (err) {
        console.error("Error getting /me:", err);
    }
}

async function getUser(inputValue: string) {
    if (!inputValue) return console.warn('getUser requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}`, getFetchOptions());
        const data = await res.json();
        console.log("Get User:", data);
    } catch (err) {
        console.error("Error getting user:", err);
    }
}

async function getUserClass(inputValue: string) {
    if (!inputValue) return console.warn('getUserClass requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/class`, getFetchOptions());
        const data = await res.json();
        console.log("Get User Class:", data);
    } catch (err) {
        console.error("Error getting user class:", err);
    }
}

async function getUserClasses(inputValue: string) {
    if (!inputValue) return console.warn('getUserClasses requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/classes`, getFetchOptions());
        const data = await res.json();
        console.log("Get User Classes:", data);
    } catch (err) {
        console.error("Error getting user classes:", err);
    }
}

async function deleteUser(inputValue: string) {
    if (!inputValue) return console.warn('deleteUser requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}`, getFetchOptions('DELETE'));
        const data = await res.json();
        console.log("Delete User:", data);
    } catch (err) {
        console.error("Error deleting user:", err);
    }
}

// changePerm expects input like "email|permValue" or a JSON string like {"perm":...}
async function changePerm(inputValue: string) {
    if (!inputValue) return console.warn('changePerm requires input like "email|perm"');
    let email = inputValue;
    let body: any = {};
    if (inputValue.includes('|')) {
        const [e, p] = inputValue.split('|');
        email = e.trim();
        body = { perm: p.trim() };
    } else {
        try { body = JSON.parse(inputValue); }
        catch { body = { perm: inputValue }; }
    }

    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(email)}/perm`, getFetchOptions('PATCH', body));
        const data = await res.json();
        console.log("Change Perm:", data);
    } catch (err) {
        console.error("Error changing perm:", err);
    }
}

async function banUser(inputValue: string) {
    if (!inputValue) return console.warn('banUser requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/ban`, getFetchOptions('PATCH'));
        const data = await res.json();
        console.log("Ban User:", data);
    } catch (err) {
        console.error("Error banning user:", err);
    }
}

async function unbanUser(inputValue: string) {
    if (!inputValue) return console.warn('unbanUser requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/unban`, getFetchOptions('PATCH'));
        const data = await res.json();
        console.log("Unban User:", data);
    } catch (err) {
        console.error("Error unbanning user:", err);
    }
}

async function verifyUser(inputValue: string) {
    if (!inputValue) return console.warn('verifyUser requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/verify`, getFetchOptions('PATCH'));
        const data = await res.json();
        console.log("Verify User:", data);
    } catch (err) {
        console.error("Error verifying user:", err);
    }
}

// --- Class endpoints ---
async function getClass(inputValue: string) {
    if (!inputValue) return console.warn('getClass requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}`, getFetchOptions());
        const data = await res.json();
        console.log("Get Class:", data);
    } catch (err) {
        console.error("Error getting class:", err);
    }
}

async function getClassActive(inputValue: string) {
    if (!inputValue) return console.warn('getClassActive requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/active`, getFetchOptions());
        const data = await res.json();
        console.log("Get Class Active:", data);
    } catch (err) {
        console.error("Error getting class active:", err);
    }
}

async function getClassBanned(inputValue: string) {
    if (!inputValue) return console.warn('getClassBanned requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/banned`, getFetchOptions());
        const data = await res.json();
        console.log("Get Class Banned:", data);
    } catch (err) {
        console.error("Error getting class banned:", err);
    }
}

async function getClassLinks(inputValue: string) {
    if (!inputValue) return console.warn('getClassLinks requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/links`, getFetchOptions());
        const data = await res.json();
        console.log("Get Class Links:", data);
    } catch (err) {
        console.error("Error getting class links:", err);
    }
}

async function getClassPermissions(inputValue: string) {
    if (!inputValue) return console.warn('getClassPermissions requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/permissions`, getFetchOptions());
        const data = await res.json();
        console.log("Get Class Permissions:", data);
    } catch (err) {
        console.error("Error getting class permissions:", err);
    }
}

async function getClassStudents(inputValue: string) {
    if (!inputValue) return console.warn('getClassStudents requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/students`, getFetchOptions());
        const data = await res.json();
        console.log("Get Class Students:", data);
    } catch (err) {
        console.error("Error getting class students:", err);
    }
}

async function createClass(inputValue: string) {
    if (!inputValue) return console.warn('createClass requires a body (JSON or class name)');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { name: inputValue }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/create`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log("Create Class:", data);
    } catch (err) {
        console.error("Error creating class:", err);
    }
}

async function endClass(inputValue: string) {
    if (!inputValue) return console.warn('endClass requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/end`, getFetchOptions('POST'));
        const data = await res.json();
        console.log("End Class:", data);
    } catch (err) {
        console.error("Error ending class:", err);
    }
}

async function joinClass(inputValue: string) {
    if (!inputValue) return console.warn('joinClass requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/join`, getFetchOptions('POST'));
        const data = await res.json();
        console.log("Join Class:", data);
    } catch (err) {
        console.error("Error joining class:", err);
    }
}

async function leaveClass(inputValue: string) {
    if (!inputValue) return console.warn('leaveClass requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/leave`, getFetchOptions('POST'));
        const data = await res.json();
        console.log("Leave Class:", data);
    } catch (err) {
        console.error("Error leaving class:", err);
    }
}

async function startClass(inputValue: string) {
    if (!inputValue) return console.warn('startClass requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/start`, getFetchOptions('POST'));
        const data = await res.json();
        console.log("Start Class:", data);
    } catch (err) {
        console.error("Error starting class:", err);
    }
}

// --- Class - Polls ---
async function getClassPolls(inputValue: string) {
    if (!inputValue) return console.warn('getClassPolls requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/polls`, getFetchOptions());
        const data = await res.json();
        console.log('Get Class Polls:', data);
    } catch (err) { console.error('Error getting class polls:', err); }
}

async function getClassPollCurrent(inputValue: string) {
    if (!inputValue) return console.warn('getClassPollCurrent requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/polls/current`, getFetchOptions());
        const data = await res.json();
        console.log('Get Class Current Poll:', data);
    } catch (err) { console.error('Error getting current poll:', err); }
}

async function clearClassPolls(inputValue: string) {
    if (!inputValue) return console.warn('clearClassPolls requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/polls/clear`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('Clear Class Polls:', data);
    } catch (err) { console.error('Error clearing polls:', err); }
}

async function createClassPoll(inputValue: string) {
    if (!inputValue) return console.warn('createClassPoll requires body or name');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { title: inputValue }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(body.classId || body.id || '')}/polls/create`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Create Class Poll:', data);
    } catch (err) { console.error('Error creating poll:', err); }
}

async function endClassPoll(inputValue: string) {
    if (!inputValue) return console.warn('endClassPoll requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/polls/end`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('End Class Poll:', data);
    } catch (err) { console.error('Error ending poll:', err); }
}

async function respondClassPoll(inputValue: string) {
    if (!inputValue) return console.warn('respondClassPoll requires body');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { response: inputValue }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(body.classId || body.id || '')}/polls/response`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Respond Class Poll:', data);
    } catch (err) { console.error('Error responding to poll:', err); }
}

// --- Class - Breaks ---
async function endOwnBreak(inputValue: string) {
    if (!inputValue) return console.warn('endOwnBreak requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/break/end`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('End Own Break:', data);
    } catch (err) { console.error('Error ending own break:', err); }
}

async function requestBreak(inputValue: string) {
    if (!inputValue) return console.warn('requestBreak requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/break/request`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('Request Break:', data);
    } catch (err) { console.error('Error requesting break:', err); }
}

async function approveBreak(inputValue: string) {
    if (!inputValue) return console.warn('approveBreak requires "classId|userId"');
    const [classId, userId] = inputValue.split('|').map(s => s.trim());
    if (!classId || !userId) return console.warn('approveBreak requires "classId|userId"');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(classId)}/students/${encodeURIComponent(userId)}/break/approve`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('Approve Break:', data);
    } catch (err) { console.error('Error approving break:', err); }
}

async function denyBreak(inputValue: string) {
    if (!inputValue) return console.warn('denyBreak requires "classId|userId"');
    const [classId, userId] = inputValue.split('|').map(s => s.trim());
    if (!classId || !userId) return console.warn('denyBreak requires "classId|userId"');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(classId)}/students/${encodeURIComponent(userId)}/break/deny`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('Deny Break:', data);
    } catch (err) { console.error('Error denying break:', err); }
}

// --- Class - Help ---
async function deleteHelpRequest(inputValue: string) {
    if (!inputValue) return console.warn('deleteHelpRequest requires "classId|userId"');
    const [classId, userId] = inputValue.split('|').map(s => s.trim());
    if (!classId || !userId) return console.warn('deleteHelpRequest requires "classId|userId"');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(classId)}/students/${encodeURIComponent(userId)}/help`, getFetchOptions('DELETE'));
        const data = await res.json();
        console.log('Delete Help Request:', data);
    } catch (err) { console.error('Error deleting help request:', err); }
}

async function requestClassHelp(inputValue: string) {
    if (!inputValue) return console.warn('requestClassHelp requires an id or body');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { classId: inputValue }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(body.classId || body.id || '')}/help/request`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Request Class Help:', data);
    } catch (err) { console.error('Error requesting help:', err); }
}

// --- Room ---
async function leaveRoom(inputValue: string) {
    if (!inputValue) return console.warn('leaveRoom requires a room id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(inputValue)}/leave`, getFetchOptions('DELETE'));
        const data = await res.json();
        console.log('Leave Room:', data);
    } catch (err) { console.error('Error leaving room:', err); }
}

async function getRoomTags() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/tags`, getFetchOptions());
        const data = await res.json();
        console.log('Get Room Tags:', data);
    } catch (err) { console.error('Error getting room tags:', err); }
}

async function joinRoomByCode(inputValue: string) {
    if (!inputValue) return console.warn('joinRoomByCode requires a code or JSON with {code}');
    let code = inputValue;
    try {
        const parsed = JSON.parse(inputValue); if (parsed.code) code = parsed.code;
    } catch {}
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(code)}/join`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('Join Room By Code:', data);
    } catch (err) { console.error('Error joining room by code:', err); }
}

async function setRoomTags(inputValue: string) {
    if (!inputValue) return console.warn('setRoomTags requires a body (JSON) or comma-separated tags');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { tags: inputValue.split(',').map(s => s.trim()) }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/tags`, getFetchOptions('PUT', body));
        const data = await res.json();
        console.log('Set Room Tags:', data);
    } catch (err) { console.error('Error setting room tags:', err); }
}

// --- Room - Links ---
async function removeRoomLink(inputValue: string) {
    if (!inputValue) return console.warn('removeRoomLink requires "roomId|linkId" or roomId');
    if (inputValue.includes('|')) {
        const [roomId, linkId] = inputValue.split('|').map(s => s.trim());
        try {
            const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(roomId)}/links/${encodeURIComponent(linkId)}`, getFetchOptions('DELETE'));
            const data = await res.json();
            console.log('Remove Room Link (by id):', data);
        } catch (err) { console.error('Error removing room link:', err); }
    } else {
        try {
            const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(inputValue)}/links`, getFetchOptions('DELETE'));
            const data = await res.json();
            console.log('Remove Room Link:', data);
        } catch (err) { console.error('Error removing room link:', err); }
    }
}

async function getRoomLinks(inputValue: string) {
    if (!inputValue) return console.warn('getRoomLinks requires a room id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(inputValue)}/links`, getFetchOptions());
        const data = await res.json();
        console.log('Get Room Links:', data);
    } catch (err) { console.error('Error getting room links:', err); }
}

async function addRoomLink(inputValue: string) {
    if (!inputValue) return console.warn('addRoomLink requires "roomId|json" or JSON with classId');
    let body: any = {};
    let roomId = '';
    if (inputValue.includes('|')) {
        const [r, payload] = inputValue.split('|', 2);
        roomId = r.trim();
        try { body = JSON.parse(payload); } catch { body = { url: payload }; }
    } else {
        try { body = JSON.parse(inputValue); roomId = body.roomId || body.classId || ''; } catch { return console.warn('addRoomLink: provide roomId|json or valid JSON'); }
    }
    if (!roomId) return console.warn('addRoomLink requires roomId');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(roomId)}/links/add`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Add Room Link:', data);
    } catch (err) { console.error('Error adding room link:', err); }
}

async function updateRoomLink(inputValue: string) {
    if (!inputValue) return console.warn('updateRoomLink requires "roomId|json" or JSON with classId');
    let body: any = {};
    let roomId = '';
    if (inputValue.includes('|')) {
        const [r, payload] = inputValue.split('|', 2);
        roomId = r.trim();
        try { body = JSON.parse(payload); } catch { body = { data: payload }; }
    } else {
        try { body = JSON.parse(inputValue); roomId = body.roomId || body.classId || ''; } catch { return console.warn('updateRoomLink: provide roomId|json or valid JSON'); }
    }
    if (!roomId) return console.warn('updateRoomLink requires roomId');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/room/${encodeURIComponent(roomId)}/links`, getFetchOptions('PUT', body));
        const data = await res.json();
        console.log('Update Room Link:', data);
    } catch (err) { console.error('Error updating room link:', err); }
}

// --- Digipogs ---
async function awardDigipogs(inputValue: string) {
    if (!inputValue) return console.warn('awardDigipogs requires body JSON or "userId|amount"');
    let body: any;
    try { body = JSON.parse(inputValue); } catch {
        const [userId, amount] = inputValue.split('|').map(s => s.trim());
        body = { userId, amount: Number(amount) || 0 };
    }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/digipogs/award`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Award Digipogs:', data);
    } catch (err) { console.error('Error awarding digipogs:', err); }
}

async function transferDigipogs(inputValue: string) {
    if (!inputValue) return console.warn('transferDigipogs requires body JSON or "toUserId|amount"');
    let body: any;
    try { body = JSON.parse(inputValue); } catch {
        const [toUserId, amount] = inputValue.split('|').map(s => s.trim());
        body = { toUserId, amount: Number(amount) || 0 };
    }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/digipogs/transfer`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Transfer Digipogs:', data);
    } catch (err) { console.error('Error transferring digipogs:', err); }
}

// --- IP Management ---
async function removeIP(inputValue: string) {
    if (!inputValue) return console.warn('removeIP requires "type|id"');
    const [type, id] = inputValue.split('|').map(s => s.trim());
    if (!type || !id) return console.warn('removeIP requires "type|id"');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/ip/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, getFetchOptions('DELETE'));
        const data = await res.json();
        console.log('Remove IP:', data);
    } catch (err) { console.error('Error removing IP:', err); }
}

async function getIPList(inputValue: string) {
    if (!inputValue) return console.warn('getIPList requires a type');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/ip/${encodeURIComponent(inputValue)}`, getFetchOptions());
        const data = await res.json();
        console.log('Get IP List:', data);
    } catch (err) { console.error('Error getting IP list:', err); }
}

async function toggleIP(inputValue: string) {
    if (!inputValue) return console.warn('toggleIP requires a type or JSON');
    let type = inputValue;
    try { const p = JSON.parse(inputValue); if (p.type) type = p.type; } catch {}
    try {
        const res = await fetch(`${formbarUrl}/api/v1/ip/${encodeURIComponent(type)}/toggle`, getFetchOptions('POST'));
        const data = await res.json();
        console.log('Toggle IP:', data);
    } catch (err) { console.error('Error toggling IP:', err); }
}

async function updateIP(inputValue: string) {
    if (!inputValue) return console.warn('updateIP requires "type|id|json" or JSON with type and id');
    let type = '' as string;
    let id = '' as string;
    let body: any = {};
    if (inputValue.includes('|')) {
        const [t, i, payload] = inputValue.split('|', 3).map(s => s.trim());
        type = t; id = i;
        try { body = JSON.parse(payload); } catch { body = { data: payload }; }
    } else {
        try { const p = JSON.parse(inputValue); type = p.type; id = p.id; body = p; } catch { return console.warn('updateIP: provide type|id|json or JSON with type and id'); }
    }
    if (!type || !id) return console.warn('updateIP requires type and id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/ip/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, getFetchOptions('PUT', body));
        const data = await res.json();
        console.log('Update IP:', data);
    } catch (err) { console.error('Error updating IP:', err); }
}

// --- Manager / Logs / Student / OAuth / Profile / Pools ---
async function getManager() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/manager`, getFetchOptions());
        const data = await res.json();
        console.log('Get Manager:', data);
    } catch (err) { console.error('Error getting manager:', err); }
}

async function getLogs() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/logs`, getFetchOptions());
        const data = await res.json();
        console.log('Get Logs:', data);
    } catch (err) { console.error('Error getting logs:', err); }
}

async function getLogFile(inputValue: string) {
    if (!inputValue) return console.warn('getLogFile requires a log name');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/logs/${encodeURIComponent(inputValue)}`, getFetchOptions());
        const data = await res.text();
        console.log('Get Log File:', data);
    } catch (err) { console.error('Error getting log file:', err); }
}

async function studentSubmit(inputValue: string) {
    if (!inputValue) return console.warn('studentSubmit requires body');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { response: inputValue }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/student`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Student Submit:', data);
    } catch (err) { console.error('Error submitting student response:', err); }
}

async function oauthAuthorize() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/oauth/authorize`, getFetchOptions());
        const data = await res.json();
        console.log('OAuth Authorize:', data);
    } catch (err) { console.error('Error calling oauth authorize:', err); }
}

async function oauthRevoke(inputValue: string) {
    if (!inputValue) return console.warn('oauthRevoke requires body (token or json)');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { body = { token: inputValue }; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/oauth/revoke`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('OAuth Revoke:', data);
    } catch (err) { console.error('Error revoking oauth token:', err); }
}

async function oauthToken(inputValue: string) {
    if (!inputValue) return console.warn('oauthToken requires body');
    let body: any;
    try { body = JSON.parse(inputValue); } catch { return console.warn('oauthToken requires JSON body'); }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/oauth/token`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('OAuth Token:', data);
    } catch (err) { console.error('Error requesting oauth token:', err); }
}

async function getProfile(inputValue: string) {
    if (!inputValue) return console.warn('getProfile requires a userId');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/profile/${encodeURIComponent(inputValue)}`, getFetchOptions());
        const data = await res.json();
        console.log('Get Profile:', data);
    } catch (err) { console.error('Error getting profile:', err); }
}

async function getProfileTransactions(inputValue: string) {
    if (!inputValue) return console.warn('getProfileTransactions requires a userId');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/profile/transactions/${encodeURIComponent(inputValue)}`, getFetchOptions());
        const data = await res.json();
        console.log('Get Profile Transactions:', data);
    } catch (err) { console.error('Error getting profile transactions:', err); }
}

async function getUserPools() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/pools`, getFetchOptions());
        const data = await res.json();
        console.log('Get User Pools:', data);
    } catch (err) { console.error('Error getting user pools:', err); }
}

