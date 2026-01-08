import { useClassData } from "../../main";
import { Table, Typography } from 'antd';
const { Title } = Typography;
import type { TableProps } from 'antd';


const permissionOptions = [
    {
        name: "Guest",
        permissionLevel: 1,
    },
    {
        name: "Student",
        permissionLevel: 2,
    },
    {
        name: "Mod",
        permissionLevel: 3,
    },
    {
        name: "Teacher",
        permissionLevel: 4,
    },
];

const columns: TableProps['columns'] = [
    {
        title: '',
        rowScope: 'row',
        dataIndex: 'key',
    }
];

permissionOptions.forEach(option => {
    columns?.push({
        title: option.name,
        dataIndex: option.name,
    });
});

export default function PermissionsMenu() {
	const { classData } = useClassData();

    let sortedPermissions = classData?.permissions ? Object.entries(classData.permissions).sort((a, b) => a[0].localeCompare(b[0])) : [];

    const data = sortedPermissions.map(([permissionName, permissionLevel]) => {
        const row: any = {
            key: permissionToName(permissionName),
            dataIndex: permissionName,
        };
        permissionOptions.forEach(option => {
            row[option.name] = permissionLevel <= option.permissionLevel ? "✔️" : "❌";
        });
        return row;
    });

	return (
        <>
            <Title style={{marginBottom:'50px'}}>Permissions</Title>

		    <Table columns={columns} dataSource={data} bordered pagination={false} style={{ width:'80%', margin: '0 auto' }} />
        </>
	);
}

// Converts the internal permission name to a display name

function permissionToName(permissionName: string):string {
    let permissionNameChars = permissionName.split('');
    permissionNameChars[0] = permissionNameChars[0].toUpperCase();

    permissionNameChars.forEach((char, index) => {
        if (char === char.toUpperCase() && index !== 0) {
            permissionNameChars.splice(index, 0, ' ');
        }
    });

    permissionName = permissionNameChars.join('');
    return permissionName
}