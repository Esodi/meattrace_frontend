import React from 'react';
import { MdCheckCircle, MdCancel, MdPending, MdEdit, MdCircle } from 'react-icons/md';
import './Timeline.css';

export interface TimelineEvent {
    id: string | number;
    title: string;
    description?: string;
    date: string | Date;
    status: 'completed' | 'pending' | 'failed' | 'info';
    icon?: React.ReactNode;
}

interface TimelineProps {
    events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
    // Sort events by date descending
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <MdCheckCircle className="timeline-icon success" />;
            case 'failed': return <MdCancel className="timeline-icon danger" />;
            case 'pending': return <MdPending className="timeline-icon warning" />;
            default: return <MdCircle className="timeline-icon info" />;
        }
    };

    return (
        <div className="timeline-container">
            {sortedEvents.map((event, index) => (
                <div key={event.id} className="timeline-item">
                    <div className="timeline-marker">
                        {event.icon || getStatusIcon(event.status)}
                        {index !== sortedEvents.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <span className="timeline-date">
                                {new Date(event.date).toLocaleString()}
                            </span>
                            <span className={`timeline-status status-${event.status}`}>
                                {event.status}
                            </span>
                        </div>
                        <h4 className="timeline-title">{event.title}</h4>
                        {event.description && (
                            <p className="timeline-description">{event.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
