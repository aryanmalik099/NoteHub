import React from 'react';

function MultiSelectModal({ options, selected, onSave, onCancel, title }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        const selectedOptions = options.filter(option => 
            e.target.elements[`option-${option.value}`].checked
        );
        onSave(selectedOptions);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="multi-select-list">
                        {options.map(option => {
                            const isChecked = selected.some(sel => sel.id === option.value);
                            return (
                                <div key={option.value} className="multi-select-item">
                                    <input
                                        type="checkbox"
                                        id={`option-${option.value}`}
                                        defaultChecked={isChecked}
                                    />
                                    <label htmlFor={`option-${option.value}`}>{option.label}</label>
                                </div>
                            );
                        })}
                    </div>
                    <div className="modal-actions">
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={onCancel}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MultiSelectModal;