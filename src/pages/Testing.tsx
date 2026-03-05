import { Button, Flex, Input, Badge, Tooltip } from "antd";
import { accessToken, formbarUrl } from "../socket";
import { useState } from "react";
import FormbarHeader from "../components/FormbarHeader";
import { useUserData } from "../main";
import type { CurrentUserData } from "../types";

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

type TestEntry = {
    name: string;
    func: (...args: any[]) => any;
    hasArgs: boolean;
    category: string;
    method: string;
    testedWorks?: boolean | string;
    hint?: string;
    autoArg?: (u: CurrentUserData | null) => string;
    autoBody?: (u: CurrentUserData | null) => string;
};

const testFuncs: TestEntry[] = [
    { name: 'Clear Console', func: () => console.clear(), hasArgs: false, category: 'System', method: 'DELETE', testedWorks: true },
    { name: 'Certs', func: certs, hasArgs: false, category: 'System', method: 'GET', testedWorks: true },

    { name: 'Get Me', func: getMe, hasArgs: false, category: 'User', method: 'GET', testedWorks: true },
    { name: 'Get User', func: getUser, hasArgs: true, category: 'User', method: 'GET', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Get User Class', func: getUserClass, hasArgs: true, category: 'User', method: 'GET', testedWorks: "Only if class started", hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Get User Classes', func: getUserClasses, hasArgs: true, category: 'User', method: 'GET', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Delete User', func: deleteUser, hasArgs: true, category: 'User', method: 'DELETE', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Change Perm (email|perm)', func: changePerm, hasArgs: true, category: 'User', method: 'PATCH', testedWorks: true, hint: 'email|perm', autoArg: u => u ? `${u.email}|2` : '' },
    { name: 'Ban User', func: banUser, hasArgs: true, category: 'User', method: 'PATCH', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Unban User', func: unbanUser, hasArgs: true, category: 'User', method: 'PATCH', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Verify User', func: verifyUser, hasArgs: true, category: 'User', method: 'PATCH', hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Regenerate API Key', func: regenerateApiKey, hasArgs: true, category: 'User', method: 'PATCH', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Update PIN', func: updatePin, hasArgs: true, category: 'User', method: 'PATCH', testedWorks: true, hint: 'id|newPin|oldPin(optional)', autoArg: u => u ? `${u.id}|` : '' },
    { name: 'Request PIN Reset', func: requestPinReset, hasArgs: true, category: 'User', method: 'POST', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },
    { name: 'Reset PIN (Token)', func: resetPinWithToken, hasArgs: true, category: 'User', method: 'PATCH', testedWorks: true, hint: '{"pin":"1234","token":"..."}' },

    { name: 'Get Class', func: getClass, hasArgs: true, category: 'Class', method: 'GET', testedWorks: 'Only if class started', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Class Active', func: getClassActive, hasArgs: true, category: 'Class', method: 'GET', testedWorks: 'Only if class started', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Class Banned', func: getClassBanned, hasArgs: true, category: 'Class', method: 'GET', testedWorks: 'Only if class started', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Class Permissions', func: getClassPermissions, hasArgs: true, category: 'Class', method: 'GET', testedWorks: 'Only if class started', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Class Students', func: getClassStudents, hasArgs: true, category: 'Class', method: 'GET', testedWorks: 'Only if class started', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Create Class', func: createClass, hasArgs: true, category: 'Class', method: 'POST', testedWorks: true, hint: 'Class name or JSON', autoArg: _ => 'Test Class' },
    { name: 'End Class', func: endClass, hasArgs: true, category: 'Class', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Join Class', func: joinClass, hasArgs: true, category: 'Class', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Leave Class', func: leaveClass, hasArgs: true, category: 'Class', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Start Class', func: startClass, hasArgs: true, category: 'Class', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },

    { name: 'Get Class Polls', func: getClassPolls, hasArgs: true, category: 'Class - Polls', method: 'GET', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Class Current Poll', func: getClassPollCurrent, hasArgs: true, category: 'Class - Polls', method: 'GET', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Clear Class Poll', func: clearClassPolls, hasArgs: true, category: 'Class - Polls', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Create Class Poll', func: createClassPoll, hasArgs: true, category: 'Class - Polls', method: 'POST', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? ''), autoBody: _ => '{"prompt":"Test?","answers":[{"answer":"Yes"},{"answer":"No"}]}' },
    { name: 'End Class Poll', func: endClassPoll, hasArgs: true, category: 'Class - Polls', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Response to Poll', func: respondClassPoll, hasArgs: true, category: 'Class - Polls', method: 'POST', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? ''), autoBody: _ => '{"response":"Yes"}' },

    { name: 'End Own Break', func: endOwnBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST', hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Request Break', func: requestBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Approve Break', func: approveBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST', testedWorks: true, hint: 'classId|userId', autoArg: u => u ? `${u.activeClass ?? ''}|${u.id}` : '' },
    { name: 'Deny Break', func: denyBreak, hasArgs: true, category: 'Class - Breaks', method: 'POST', hint: 'classId|userId', autoArg: u => u ? `${u.activeClass ?? ''}|${u.id}` : '' },

    { name: 'Delete Help Request', func: deleteHelpRequest, hasArgs: true, category: 'Class - Help', method: 'DELETE', testedWorks: true, hint: 'classId|userId', autoArg: u => u ? `${u.activeClass ?? ''}|${u.id}` : '' },
    { name: 'Request Help', func: requestClassHelp, hasArgs: true, category: 'Class - Help', method: 'POST', testedWorks: true, hint: 'Class ID', autoArg: u => String(u?.activeClass ?? '') },

    { name: 'Leave Room', func: leaveRoom, hasArgs: true, category: 'Room', method: 'DELETE', testedWorks: true, hint: 'Room ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Room Tags', func: getRoomTags, hasArgs: false, category: 'Room', method: 'GET', testedWorks: true },
    { name: 'Join Room By Code', func: joinRoomByCode, hasArgs: true, category: 'Room', method: 'POST', hint: 'Room code' },
    { name: 'Set Room Tags', func: setRoomTags, hasArgs: true, category: 'Room', method: 'PUT', hint: 'tag1,tag2 or JSON' },

    { name: 'Remove Room Link', func: removeRoomLink, hasArgs: true, category: 'Room - Links', method: 'DELETE', hint: 'roomId or roomId|linkId', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Get Room Links', func: getRoomLinks, hasArgs: true, category: 'Room - Links', method: 'GET', testedWorks: true, hint: 'Room ID', autoArg: u => String(u?.activeClass ?? '') },
    { name: 'Add Room Link', func: addRoomLink, hasArgs: true, category: 'Room - Links', method: 'POST', hint: 'roomId|{"url":"...","label":"..."}', autoArg: u => String(u?.activeClass ?? ''), autoBody: _ => '{"url":"https://example.com","label":"Example"}' },
    { name: 'Update Room Link', func: updateRoomLink, hasArgs: true, category: 'Room - Links', method: 'PUT', hint: 'roomId|{"id":1,...}', autoArg: u => String(u?.activeClass ?? '') },

    { name: 'Award Digipogs', func: awardDigipogs, hasArgs: true, category: 'Digipogs', method: 'POST', hint: 'userId|amount or JSON', autoArg: u => u ? `${u.id}|1` : '' },
    { name: 'Transfer Digipogs', func: transferDigipogs, hasArgs: true, category: 'Digipogs', method: 'POST', hint: 'toUserId|amount or JSON', autoArg: u => u ? `${u.id}|1` : '' },

    { name: 'Remove IP', func: removeIP, hasArgs: true, category: 'IP', method: 'DELETE', hint: 'type|id' },
    { name: 'Get IP List', func: getIPList, hasArgs: true, category: 'IP', method: 'GET', testedWorks: true, hint: 'allowlist or denylist', autoArg: _ => 'allowlist' },
    { name: 'Toggle IP', func: toggleIP, hasArgs: true, category: 'IP', method: 'POST', hint: 'allowlist or denylist', autoArg: _ => 'allowlist' },
    { name: 'Update IP', func: updateIP, hasArgs: true, category: 'IP', method: 'PUT', hint: 'type|id|json' },

    { name: 'Get Manager', func: getManager, hasArgs: false, category: 'Manager', method: 'GET', testedWorks: true },

    { name: 'Get Logs', func: getLogs, hasArgs: false, category: 'Logs', method: 'GET', testedWorks: true },
    { name: 'Get Log File', func: getLogFile, hasArgs: true, category: 'Logs', method: 'GET', testedWorks: true, hint: 'Log filename', autoArg: _ => `app-${new Date().toISOString().slice(0, 10)}.ndjson` },

    { name: 'OAuth Authorize', func: oauthAuthorize, hasArgs: false, category: 'OAuth', method: 'GET' },
    { name: 'OAuth Revoke', func: oauthRevoke, hasArgs: true, category: 'OAuth', method: 'POST', hint: 'token or {"token":"..."}' },
    { name: 'OAuth Token', func: oauthToken, hasArgs: true, category: 'OAuth', method: 'POST', hint: '{"grant_type":"..."}' },

    { name: 'Get User Transactions', func: getUserTransactions, hasArgs: true, category: 'User', method: 'GET', testedWorks: true, hint: 'User ID', autoArg: u => String(u?.id ?? '') },

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
    const { userData } = useUserData();

    // Expanded test name (one expanded at a time)
    const [expanded, setExpanded] = useState<string | null>(null);

    // Per-test arg / body overrides (only committed when user types)
    const [testArgs, setTestArgs] = useState<Record<string, string>>({});
    const [testBodies, setTestBodies] = useState<Record<string, string>>({});

    // Per-test run state + result
    const [results, setResults] = useState<Record<string, { status: 'idle' | 'running' | 'ok' | 'error'; output?: string }>>({});
    const [autoRunning, setAutoRunning] = useState(false);

    // Get the effective arg for a test: override > autofill > ''
    const getArg = (test: TestEntry) =>
        testArgs[test.name] !== undefined ? testArgs[test.name] : (test.autoArg?.(userData) ?? '');
    const getBody = (test: TestEntry) =>
        testBodies[test.name] !== undefined ? testBodies[test.name] : (test.autoBody?.(userData) ?? '');

    const captureAndRun = async (test: TestEntry, arg: string, body: string) => {
        setResults(prev => ({ ...prev, [test.name]: { status: 'running' } }));
        const lines: string[] = [];
        let isError = false;

        const origLog = console.log;
        const origError = console.error;
        const origWarn = console.warn;
        const capture = (isErr: boolean, ...args: any[]) => {
            const val = args.length > 1 ? args[1] : args[0];
            lines.push(typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val));
            if (isErr) isError = true;
        };
        console.log = (...a) => { origLog(...a); capture(false, ...a); };
        console.error = (...a) => { origError(...a); capture(true, ...a); };
        console.warn = (...a) => { origWarn(...a); capture(true, ...a); };

        try {
            await (test.hasArgs ? test.func(arg, body) : test.func());
        } catch (e: any) {
            lines.push(String(e));
            isError = true;
        } finally {
            console.log = origLog;
            console.error = origError;
            console.warn = origWarn;
        }

        setResults(prev => ({
            ...prev,
            [test.name]: { status: isError ? 'error' : 'ok', output: lines.join('\n') || '(no output)' },
        }));
    };

    const handleButtonClick = (test: TestEntry) => {
        if (!test.hasArgs) {
            // No args → run immediately
            captureAndRun(test, '', '');
        } else {
            // Has args → toggle expand
            setExpanded(prev => prev === test.name ? null : test.name);
        }
    };

    const runExpanded = (test: TestEntry) => {
        captureAndRun(test, getArg(test), getBody(test));
    };

    const runAllNoArgs = async () => {
        if (autoRunning) return;
        setAutoRunning(true);
        for (const test of testFuncs.filter(t => !t.hasArgs)) {
            await captureAndRun(test, '', '');
        }
        setAutoRunning(false);
    };

    const groups = testFuncs.reduce<Record<string, TestEntry[]>>((acc, t) => {
        const key = t.category || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return (
        <div style={{ padding: '0 20px' }}>
            <FormbarHeader />
            <Flex style={{ height: 'calc(100vh - 60px)', overflow: 'auto' }} vertical gap={16}>
                {/* Header */}
                <Flex align="center" gap={16} style={{ marginTop: 16 }} wrap>
                    <h1 style={{ margin: 0 }}>Testing Page</h1>
                    <span style={{ opacity: 0.6 }}>
                        Working: {testFuncs.filter(t => t.testedWorks === true).length - 1}/{testFuncs.length - 1}
                    </span>
                    <Button type="primary" loading={autoRunning} onClick={runAllNoArgs}>
                        {autoRunning ? 'Running…' : '▶ Run All No-Arg Tests'}
                    </Button>
                    {userData && (
                        <span style={{ opacity: 0.5, fontSize: 12 }}>
                            Autofilling as <b>{userData.displayName}</b> (id: {userData.id}
                            {userData.activeClass ? `, class: ${userData.activeClass}` : ''})
                        </span>
                    )}
                </Flex>

                {/* Test groups */}
                {Object.entries(groups).map(([category, tests]) => (
                    <div key={category} style={{ marginBottom: 8 }}>
                        <h3 style={{ margin: '4px 0 6px' }}>{category}</h3>
                        <div style={{ background: '#000a', padding: 8, borderRadius: 10 }}>
                            {/* Compact button row */}
                            <Flex wrap gap={4} style={{ marginBottom: 4 }}>
                                {tests.map(test => {
                                    const result = results[test.name];
                                    const isExpanded = expanded === test.name;
                                    const statusColor = result?.status === 'ok' ? 'green' : result?.status === 'error' ? 'red' : undefined;
                                    return (
                                        <Tooltip
                                            key={test.name}
                                            title={
                                                typeof test.testedWorks === 'string'
                                                    ? test.testedWorks
                                                    : test.testedWorks === true ? 'Works' : 'Not tested / not working'
                                            }
                                            color={test.testedWorks === true ? 'green' : !test.testedWorks ? 'red' : 'orange'}
                                        >
                                            <Badge
                                                dot
                                                color={statusColor ?? (test.testedWorks === true ? 'green' : !test.testedWorks ? 'red' : 'orange')}
                                            >
                                                <Button
                                                    loading={result?.status === 'running'}
                                                    onClick={() => handleButtonClick(test)}
                                                    type="default"
                                                    variant="solid"
                                                    color={getButtonStyle(test.method) as any}
                                                    style={{
                                                        outline: isExpanded ? '2px solid #fff4' : undefined,
                                                    }}
                                                >
                                                    {test.name}
                                                </Button>
                                            </Badge>
                                        </Tooltip>
                                    );
                                })}
                            </Flex>

                            {/* Inline expansion for the currently opened test */}
                            {tests.filter(t => expanded === t.name).map(test => {
                                const result = results[test.name];
                                const hasBody = !!test.autoBody || !!testBodies[test.name];
                                return (
                                    <div
                                        key={test.name}
                                        style={{
                                            marginTop: 6,
                                            padding: '8px 10px',
                                            borderRadius: 8,
                                            background: '#fff08',
                                            border: '1px solid #fff2',
                                        }}
                                    >
                                        <Flex gap={8} align="center" wrap>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{test.name}</span>
                                            {test.hint && (
                                                <span style={{ opacity: 0.5, fontSize: 11 }}>({test.hint})</span>
                                            )}
                                        </Flex>
                                        <Flex gap={8} style={{ marginTop: 6 }} wrap>
                                            {test.hasArgs && (
                                                <Input
                                                    size="small"
                                                    style={{ flex: 2, minWidth: 200 }}
                                                    placeholder={test.hint ?? 'Argument'}
                                                    value={getArg(test)}
                                                    onChange={e => setTestArgs(prev => ({ ...prev, [test.name]: e.target.value }))}
                                                    allowClear
                                                />
                                            )}
                                            {(hasBody || test.hasArgs) && (
                                                <Input
                                                    size="small"
                                                    style={{ flex: 3, minWidth: 220 }}
                                                    placeholder="Body (JSON for POST/PUT, optional)"
                                                    value={getBody(test)}
                                                    onChange={e => setTestBodies(prev => ({ ...prev, [test.name]: e.target.value }))}
                                                    allowClear
                                                />
                                            )}
                                            <Button
                                                size="small"
                                                type="primary"
                                                loading={result?.status === 'running'}
                                                onClick={() => runExpanded(test)}
                                            >
                                                Run
                                            </Button>
                                        </Flex>
                                        {result && result.status !== 'running' && result.output && (
                                            <pre style={{
                                                marginTop: 6,
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                background: result.status === 'ok' ? '#0d2b0d' : '#2b0d0d',
                                                color: result.status === 'ok' ? '#7de87d' : '#e87d7d',
                                                fontSize: 11,
                                                maxHeight: 160,
                                                overflow: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all',
                                                margin: 0,
                                            }}>
                                                {result.output}
                                            </pre>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Inline result for no-arg tests */}
                            {tests.filter(t => !t.hasArgs).map(test => {
                                const result = results[test.name];
                                if (!result || result.status === 'running' || result.status === 'idle' || !result.output) return null;
                                return (
                                    <pre key={test.name} style={{
                                        marginTop: 4,
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        background: result.status === 'ok' ? '#0d2b0d' : '#2b0d0d',
                                        color: result.status === 'ok' ? '#7de87d' : '#e87d7d',
                                        fontSize: 11,
                                        maxHeight: 120,
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        margin: 0,
                                    }}>
                                        <span style={{ opacity: 0.5 }}>{test.name}: </span>{result.output}
                                    </pre>
                                );
                            })}
                        </div>
                    </div>
                ))}
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

async function regenerateApiKey(inputValue: string) {
    if (!inputValue) return console.warn('regenerateApiKey requires an id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/api/regenerate`, getFetchOptions('POST'));
        const data = await res.json();
        console.log("Regenerate API Key:", data);
    } catch (err) {
        console.error("Error regenerating API key:", err);
    }
}

// updatePin expects "id|newPin|oldPin(optional)" or JSON body with id,pin,oldPin
async function updatePin(inputValue: string) {
    if (!inputValue) return console.warn('updatePin requires "id|newPin|oldPin(optional)"');
    let id = "";
    let body: any = {};
    if (inputValue.includes('|')) {
        const [userId, newPin, oldPin] = inputValue.split('|').map(s => s.trim());
        id = userId;
        body = { pin: newPin, ...(oldPin ? { oldPin } : {}) };
    } else {
        try {
            const parsed = JSON.parse(inputValue);
            id = String(parsed.id || "");
            body = { pin: parsed.pin, ...(parsed.oldPin ? { oldPin: parsed.oldPin } : {}) };
        } catch {
            return console.warn('updatePin requires "id|newPin|oldPin(optional)" or JSON');
        }
    }
    if (!id || !body.pin) return console.warn('updatePin requires both id and pin');

    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(id)}/pin`, getFetchOptions('PATCH', body));
        const data = await res.json();
        console.log("Update PIN:", data);
    } catch (err) {
        console.error("Error updating PIN:", err);
    }
}

async function requestPinReset(inputValue: string) {
    if (!inputValue) return console.warn('requestPinReset requires a user id');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/pin/reset`, getFetchOptions('POST'));
        const data = await res.json();
        console.log("Request PIN Reset:", data);
    } catch (err) {
        console.error("Error requesting PIN reset:", err);
    }
}

// resetPinWithToken expects JSON: {"pin":"1234","token":"..."}
async function resetPinWithToken(inputValue: string) {
    if (!inputValue) return console.warn('resetPinWithToken requires JSON body');
    let body: any;
    try {
        body = JSON.parse(inputValue);
    } catch {
        return console.warn('resetPinWithToken requires JSON body like {"pin":"1234","token":"..."}');
    }

    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/pin/reset`, getFetchOptions('PATCH', body));
        const data = await res.json();
        console.log("Reset PIN (Token):", data);
    } catch (err) {
        console.error("Error resetting PIN:", err);
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

async function createClassPoll(inputValue: string, bodyValue: string) {
    if (!inputValue) return console.warn('createClassPoll requires body or name');
    let body: any;
    try { body = JSON.parse(bodyValue); } catch (err) { body = bodyValue; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/polls/create`, getFetchOptions('POST', body));
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

async function respondClassPoll(inputValue: string, bodyValue: string) {
    if (!inputValue) return console.warn('respondClassPoll requires body');
    let body: any;
    try { body = JSON.parse(bodyValue); } catch (err) { body = bodyValue; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/polls/response`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('Respond Class Poll:', data);
    } catch (err) { console.error('Error responding to poll:', err); }
}

// --- Class - Breaks ---
async function endOwnBreak(inputValue: string, bodyValue: string) {
    if (!inputValue) return console.warn('endOwnBreak requires an id');
    let body: any;
    try { body = JSON.parse(bodyValue); } catch (err) { body = bodyValue; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/break/end`, getFetchOptions('POST', body));
        const data = await res.json();
        console.log('End Own Break:', data);
    } catch (err) { console.error('Error ending own break:', err); }
}

async function requestBreak(inputValue: string, bodyValue: string) {
    if (!inputValue) return console.warn('requestBreak requires an id');
    let body: any;
    try { body = JSON.parse(bodyValue); } catch (err) { body = bodyValue; }
    try {
        const res = await fetch(`${formbarUrl}/api/v1/class/${encodeURIComponent(inputValue)}/break/request`, getFetchOptions('POST', body));
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

async function transferDigipogs(inputValue: string, bodyValue: string) {
    if (!inputValue && !bodyValue) return console.warn('transferDigipogs requires body JSON or "toUserId|amount"');
    let body: any;
    try { body = JSON.parse(bodyValue); } catch {
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

// --- Manager / Logs / Student / OAuth / User / Pools ---
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

async function getUserTransactions(inputValue: string) {
    if (!inputValue) return console.warn('getUserTransactions requires a userId');
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/${encodeURIComponent(inputValue)}/transactions`, getFetchOptions());
        const data = await res.json();
        console.log('Get User Transactions:', data);
    } catch (err) { console.error('Error getting user transactions:', err); }
}

async function getUserPools() {
    try {
        const res = await fetch(`${formbarUrl}/api/v1/user/pools`, getFetchOptions());
        const data = await res.json();
        console.log('Get User Pools:', data);
    } catch (err) { console.error('Error getting user pools:', err); }
}

