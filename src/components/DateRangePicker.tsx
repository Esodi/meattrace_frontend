import React, { useState } from 'react';
import { MdCalendarToday, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import './DateRangePicker.css';

interface DateRangePickerProps {
    onDateChange: (startDate: Date | null, endDate: Date | null) => void;
    initialStartDate?: Date;
    initialEndDate?: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    onDateChange,
    initialStartDate,
    initialEndDate
}) => {
    const [startDate, setStartDate] = useState<string>(
        initialStartDate ? initialStartDate.toISOString().split('T')[0] : ''
    );
    const [endDate, setEndDate] = useState<string>(
        initialEndDate ? initialEndDate.toISOString().split('T')[0] : ''
    );
    const [preset, setPreset] = useState<string>('');

    const handlePresetChange = (presetValue: string) => {
        setPreset(presetValue);
        const today = new Date();
        let start: Date | null = null;
        let end: Date = today;

        switch (presetValue) {
            case '7d':
                start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'ytd':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            case 'custom':
                return; // Don't change dates for custom
            default:
                start = null;
                end = today;
        }

        if (start) {
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
            onDateChange(start, end);
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        setPreset('custom');
        const start = e.target.value ? new Date(e.target.value) : null;
        const end = endDate ? new Date(endDate) : null;
        onDateChange(start, end);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        setPreset('custom');
        const start = startDate ? new Date(startDate) : null;
        const end = e.target.value ? new Date(e.target.value) : null;
        onDateChange(start, end);
    };

    return (
        <div className="date-range-picker">
            <div className="date-range-presets">
                <button
                    className={`preset-btn ${preset === '7d' ? 'active' : ''}`}
                    onClick={() => handlePresetChange('7d')}
                >
                    7 Days
                </button>
                <button
                    className={`preset-btn ${preset === '30d' ? 'active' : ''}`}
                    onClick={() => handlePresetChange('30d')}
                >
                    30 Days
                </button>
                <button
                    className={`preset-btn ${preset === '90d' ? 'active' : ''}`}
                    onClick={() => handlePresetChange('90d')}
                >
                    90 Days
                </button>
                <button
                    className={`preset-btn ${preset === 'ytd' ? 'active' : ''}`}
                    onClick={() => handlePresetChange('ytd')}
                >
                    YTD
                </button>
            </div>
            <div className="date-range-inputs">
                <div className="date-input-group">
                    <MdCalendarToday className="date-icon" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        placeholder="Start Date"
                    />
                </div>
                <span className="date-separator">to</span>
                <div className="date-input-group">
                    <MdCalendarToday className="date-icon" />
                    <input
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        placeholder="End Date"
                    />
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;
