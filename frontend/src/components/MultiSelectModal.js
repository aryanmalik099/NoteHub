import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Checkbox, ScrollArea, TextInput, Paper } from '@mantine/core';

function MultiSelectModal({ title, options, selected, onSave, onCancel }) {
    // State to hold the array of selected string IDs (e.g., ['1', '3', '7'])
    const [currentSelection, setCurrentSelection] = useState([]);
    // State for the search input
    const [searchTerm, setSearchTerm] = useState('');

    // Syncs the internal state with the props when the modal opens
    useEffect(() => {
        if (selected) {
            const selectedIds = selected.map(item => String(item.id));
            setCurrentSelection(selectedIds);
        }
    }, [selected]);

    const handleSave = () => {
        // Convert the string IDs back into the full option objects that the onSave handler expects
        const selectedOptions = options.filter(option => currentSelection.includes(option.value));
        onSave(selectedOptions);
    };

    // Filter options based on the search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Create a Checkbox component for each *filtered* option
    const checkboxOptions = filteredOptions.map((option) => (
        <Checkbox
            key={option.value}
            label={option.label}
            value={option.value}
            py="xs"
        />
    ));

    return (
        <Modal opened={true} onClose={onCancel} title={title} size="lg">
            {/* Search Input */}
            <TextInput
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                mb="md"
            />
            
            <Paper>
                {/* Scrollable area for the checkbox list */}
                <ScrollArea h={300}>
                    <Checkbox.Group
                        value={currentSelection}
                        onChange={setCurrentSelection}
                    >
                        <Group>
                            <div>{checkboxOptions}</div>
                        </Group>
                    </Checkbox.Group>
                </ScrollArea>
            </Paper>

            <Group justify="flex-end" mt="xl">
                <Button variant="default" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </Group>
        </Modal>
    );
}

export default MultiSelectModal;