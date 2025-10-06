import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Table, Select, Group, Paper, Title, Loader, Center, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedAction, setSelectedAction] = useState('');

    const logActions = [
        'user_signup',
        'user_login',
        'note_upload',
        'note_delete',
        'admin_role_change'
    ];

    useEffect(() => {
        const fetchLogs = async () => {
            if (!selectedDate) return;
            setLoading(true);
            try {
                const params = { day: selectedDate };
                if (selectedAction) {
                    params.action = selectedAction;
                }

                const response = await api.get('/admin/logs', { params });
                setLogs(response.data);
            } catch (error) {
                toast.error('Failed to fetch activity logs.');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [selectedDate, selectedAction]);

    const rows = logs.map(log => (
        <Table.Tr key={log.id}>
            <Table.Td>{log.timestamp}</Table.Td>
            <Table.Td>{log.username}</Table.Td>
            <Table.Td>{log.action}</Table.Td>
            <Table.Td>{log.details}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder shadow="md" p={30} mt="md" radius="md">
            <Title order={4} mb="md">Filter Activity Logs</Title>
            <Group grow mb="md">
                <DateInput
                    label="Select Date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    valueFormat="YYYY-MM-DD"
                />
                <Select
                    label="Filter by Action"
                    placeholder="All Actions"
                    value={selectedAction}
                    onChange={setSelectedAction}
                    data={[{ value: '', label: 'All Actions' }, ...logActions]}
                    clearable
                />
            </Group>

            {loading ? (
                <Center h={200}><Loader /></Center>
            ) : (
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Timestamp</Table.Th>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Action</Table.Th>
                            <Table.Th>Details</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.length > 0 ? rows : (
                            <Table.Tr>
                                <Table.Td colSpan={4}>
                                    <Text c="dimmed" ta="center">No activity for the selected filters.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            )}
        </Paper>
    );
}

export default ActivityLog;