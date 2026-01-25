import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const GroupNode = ({ data, selected }) => {
    // Container type styling
    const containerStyles = {
        vpc: {
            borderColor: '#232F3E',
            headerBg: 'linear-gradient(135deg, #232F3E 0%, #374151 100%)',
            bodyBg: 'rgba(35, 47, 62, 0.15)',
        },
        subnet_public: {
            borderColor: '#10B981',
            headerBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            bodyBg: 'rgba(16, 185, 129, 0.12)',
        },
        subnet_private: {
            borderColor: '#3B82F6',
            headerBg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            bodyBg: 'rgba(59, 130, 246, 0.12)',
        },
        availability_zone: {
            borderColor: '#8B5CF6',
            headerBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            bodyBg: 'rgba(139, 92, 246, 0.12)',
        },
        security_group: {
            borderColor: '#EF4444',
            headerBg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            bodyBg: 'rgba(239, 68, 68, 0.12)',
        },
        custom_group: {
            borderColor: '#64748B',
            headerBg: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
            bodyBg: 'rgba(100, 116, 139, 0.12)',
        },
    };

    const style = containerStyles[data.containerType] || containerStyles.custom_group;

    return (
        <div
            className={`group-node ${selected ? 'selected' : ''}`}
            style={{
                '--container-border': style.borderColor,
                '--container-bg': style.bodyBg,
                width: data.minWidth || 300,
                height: data.minHeight || 200,
            }}
        >
            {/* Connection handles - same as regular service nodes */}
            <Handle
                type="target"
                position={Position.Left}
                className="group-handle"
            />

            {/* Header */}
            <div
                className="group-node-header"
                style={{ background: style.headerBg }}
            >
                <span className="group-icon">{data.icon}</span>
                <span className="group-label">{data.label}</span>
                {data.config?.cidrBlock && (
                    <span className="group-cidr">{data.config.cidrBlock}</span>
                )}
            </div>

            {/* Content area - empty now, just provides visual height */}
            <div className="group-node-content" />

            {/* Source handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="group-handle"
            />
        </div>
    );
};

export default memo(GroupNode);
