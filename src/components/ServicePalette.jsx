import { useState } from 'react';
import { awsServices, serviceCategories } from '../data/awsServices';

const ServicePalette = () => {
    const [activeCategory, setActiveCategory] = useState('compute');
    const [hoveredService, setHoveredService] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleDragStart = (event, serviceType) => {
        event.dataTransfer.setData('application/reactflow', serviceType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const categoryList = Object.entries(serviceCategories).map(([id, cat]) => ({
        id,
        ...cat
    }));

    const filteredServices = Object.values(awsServices).filter((service) => {
        if (!searchQuery) return service.category === activeCategory;
        const query = searchQuery.toLowerCase();
        return (
            service.name.toLowerCase().includes(query) ||
            service.useCase?.toLowerCase().includes(query) ||
            service.whenToUse?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="service-palette">
            <div className="palette-header">
                <h2>AWS Services</h2>
                <input
                    type="text"
                    placeholder="🔍 Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-compact"
                />
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
                <div className="category-tabs">
                    {categoryList.map((category) => (
                        <button
                            key={category.id}
                            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                            style={{ '--cat-color': category.color }}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Services Grid */}
            <div className="services-grid">
                {filteredServices.map((service) => (
                    <div
                        key={service.id}
                        className={`service-tile ${hoveredService === service.id ? 'hovered' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, service.id)}
                        onMouseEnter={() => setHoveredService(service.id)}
                        onMouseLeave={() => setHoveredService(null)}
                        style={{ '--service-color': service.color }}
                    >
                        <span className="tile-icon">{service.icon}</span>
                        <span className="tile-name">{service.name}</span>

                        {/* Tooltip on hover */}
                        {hoveredService === service.id && (
                            <div className="service-tooltip">
                                <p className="tooltip-use"><strong>Use:</strong> {service.useCase}</p>
                                <p className="tooltip-when"><strong>When:</strong> {service.whenToUse}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="palette-footer">
                <p className="drag-hint">Drag services onto the canvas →</p>
            </div>
        </div>
    );
};

export default ServicePalette;
