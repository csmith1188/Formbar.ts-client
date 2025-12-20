import { useClassData } from "../../main";
import { Table } from 'antd';
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
            key: permissionName,
            dataIndex: permissionName,
        };
        permissionOptions.forEach(option => {
            row[option.name] = permissionLevel <= option.permissionLevel ? "✔️" : "❌";
        });
        return row;
    });

	return (
		<Table columns={columns} dataSource={data} bordered pagination={false} style={{width:'100%'}} />
	);
}