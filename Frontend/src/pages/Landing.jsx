import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Landing.css';

const Landing = () => {
    const { user } = useAuth();

    const features = [
        {
            icon: '🎨',
            title: 'Drag & Drop Design',
            description: 'Visually design AWS architectures with an intuitive drag-and-drop canvas. No cloud expertise required.'
        },
        {
            icon: '💰',
            title: 'Real-Time Cost Estimation',
            description: 'Get instant monthly cost estimates as you build. Powered by AWS Price List API with live pricing data.'
        },
        {
            icon: '⚡',
            title: 'Smart Optimization',
            description: 'AI-powered recommendations identify cost savings opportunities and architecture improvements.'
        },
        {
            icon: '🌍',
            title: 'Multi-Region Support',
            description: 'Compare costs across 6 AWS regions. Design global architectures with regional pricing insights.'
        },
        {
            icon: '📋',
            title: 'Pre-Built Templates',
            description: '5 production-ready templates: 3-Tier Web, Serverless API, Data Pipeline, Microservices, and more.'
        },
        {
            icon: '🔗',
            title: 'Share & Export',
            description: 'Generate shareable URLs, export architectures as JSON, and collaborate with your team.'
        }
    ];

    const services = [
        { name: 'EC2', icon: '🖥️', category: 'Compute' },
        { name: 'Lambda', icon: 'λ', category: 'Compute' },
        { name: 'ECS Fargate', icon: '🐳', category: 'Compute' },
        { name: 'EKS', icon: '☸️', category: 'Compute' },
        { name: 'S3', icon: '🪣', category: 'Storage' },
        { name: 'RDS', icon: '🗄️', category: 'Database' },
        { name: 'DynamoDB', icon: '⚡', category: 'Database' },
        { name: 'Aurora', icon: '🌟', category: 'Database' },
        { name: 'ElastiCache', icon: '🔴', category: 'Database' },
        { name: 'CloudFront', icon: '🌐', category: 'Networking' },
        { name: 'API Gateway', icon: '🚪', category: 'Networking' },
        { name: 'ALB', icon: '⚖️', category: 'Networking' },
        { name: 'Route 53', icon: '🌍', category: 'Networking' },
        { name: 'SQS', icon: '📬', category: 'Messaging' },
        { name: 'SNS', icon: '📢', category: 'Messaging' },
        { name: 'EventBridge', icon: '🔔', category: 'Messaging' },
        { name: 'WAF', icon: '🛡️', category: 'Security' },
        { name: 'Cognito', icon: '👤', category: 'Security' },
        { name: 'Kinesis', icon: '🌊', category: 'Analytics' },
        { name: 'Redshift', icon: '🏗️', category: 'Analytics' },
    ];

    const templates = [
        { name: '3-Tier Web App', icon: '🏢', difficulty: 'Beginner' },
        { name: 'Serverless API', icon: '⚡', difficulty: 'Beginner' },
        { name: 'Data Pipeline', icon: '🌊', difficulty: 'Intermediate' },
        { name: 'Microservices', icon: '🐳', difficulty: 'Advanced' },
        { name: 'Static Website', icon: '🌐', difficulty: 'Beginner' },
    ];

    const pricingModels = [
        { name: 'On-Demand', discount: '0%', description: 'Pay as you go' },
        { name: 'Reserved 1-Year', discount: '30%', description: 'Commit for savings' },
        { name: 'Reserved 3-Year', discount: '50%', description: 'Maximum savings' },
        { name: 'Spot Instances', discount: '70%', description: 'For flexible workloads' },
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <span className="brand-icon">☁️</span>
                    <span className="brand-name">CloudCanvas</span>
                </div>
                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#services">Services</a>
                    <a href="#templates">Templates</a>
                    <a href="#pricing">Pricing</a>
                </div>
                <div className="nav-auth">
                    {user ? (
                        <Link to="/app" className="btn-nav btn-primary-nav">Go to App →</Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn-nav btn-ghost-nav">Sign In</Link>
                            <Link to="/signup" className="btn-nav btn-primary-nav">Get Started Free</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                    <div className="hero-grid"></div>
                    <div className="hero-shapes">
                        <div className="hero-shape shape-1"></div>
                        <div className="hero-shape shape-2"></div>
                        <div className="hero-shape shape-3"></div>
                    </div>
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span>🚀</span> AWS Architecture Made Visual
                    </div>
                    <h1 className="hero-title">
                        Design. Estimate. <span className="gradient-text">Deploy.</span>
                    </h1>
                    <p className="hero-subtitle">
                        The visual AWS architecture designer with real-time cost estimation.
                        Drag, drop, and instantly see how much your cloud infrastructure will cost.
                    </p>
                    <div className="hero-cta">
                        <Link to={user ? "/app" : "/signup"} className="btn-hero btn-hero-primary">
                            <span>Start Designing</span>
                            <span className="btn-arrow">→</span>
                        </Link>
                        <a href="#features" className="btn-hero btn-hero-secondary">
                            <span>Learn More</span>
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">35+</span>
                            <span className="stat-label">AWS Services</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">6</span>
                            <span className="stat-label">Regions</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">5</span>
                            <span className="stat-label">Templates</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">100%</span>
                            <span className="stat-label">Free</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <span className="section-badge">Features</span>
                    <h2>Everything you need to design cloud architecture</h2>
                    <p>Powerful tools that make AWS cost estimation a breeze</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div className="feature-card" key={index}>
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="services-section">
                <div className="section-header">
                    <span className="section-badge">AWS Services</span>
                    <h2>35+ Supported AWS Services</h2>
                    <p>From compute to analytics, we've got you covered</p>
                </div>
                <div className="services-showcase">
                    {services.map((service, index) => (
                        <div className="service-chip" key={index}>
                            <span className="chip-icon">{service.icon}</span>
                            <span className="chip-name">{service.name}</span>
                        </div>
                    ))}
                </div>
                <div className="services-categories">
                    <div className="category-item">
                        <span className="category-dot compute"></span>
                        <span>Compute</span>
                    </div>
                    <div className="category-item">
                        <span className="category-dot storage"></span>
                        <span>Storage</span>
                    </div>
                    <div className="category-item">
                        <span className="category-dot database"></span>
                        <span>Database</span>
                    </div>
                    <div className="category-item">
                        <span className="category-dot networking"></span>
                        <span>Networking</span>
                    </div>
                    <div className="category-item">
                        <span className="category-dot messaging"></span>
                        <span>Messaging</span>
                    </div>
                    <div className="category-item">
                        <span className="category-dot security"></span>
                        <span>Security</span>
                    </div>
                    <div className="category-item">
                        <span className="category-dot analytics"></span>
                        <span>Analytics</span>
                    </div>
                </div>
            </section>

            {/* Templates Section */}
            <section id="templates" className="templates-section">
                <div className="section-header">
                    <span className="section-badge">Templates</span>
                    <h2>Start with Pre-Built Architectures</h2>
                    <p>Production-ready templates to jumpstart your design</p>
                </div>
                <div className="templates-grid">
                    {templates.map((template, index) => (
                        <div className="template-card" key={index}>
                            <div className="template-icon">{template.icon}</div>
                            <h3>{template.name}</h3>
                            <span className={`difficulty-badge ${template.difficulty.toLowerCase()}`}>
                                {template.difficulty}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Models Section */}
            <section id="pricing" className="pricing-section">
                <div className="section-header">
                    <span className="section-badge">Pricing Models</span>
                    <h2>Compare AWS Pricing Options</h2>
                    <p>See how different commitment levels affect your costs</p>
                </div>
                <div className="pricing-grid">
                    {pricingModels.map((model, index) => (
                        <div className="pricing-card" key={index}>
                            <h3>{model.name}</h3>
                            <div className="pricing-discount">Up to {model.discount} off</div>
                            <p>{model.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Capabilities Section */}
            <section className="capabilities-section">
                <div className="section-header">
                    <span className="section-badge">Capabilities</span>
                    <h2>Built for Professionals</h2>
                    <p>Advanced features for serious cloud architects</p>
                </div>
                <div className="capabilities-grid">
                    <div className="capability-item">
                        <div className="capability-icon">↩️</div>
                        <div className="capability-text">
                            <h4>Undo / Redo</h4>
                            <p>Full history with Ctrl+Z/Ctrl+Y support</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">🌓</div>
                        <div className="capability-text">
                            <h4>Dark & Light Themes</h4>
                            <p>Comfortable viewing in any environment</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">💾</div>
                        <div className="capability-text">
                            <h4>Export / Import</h4>
                            <p>Save and load architectures as JSON</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">🔗</div>
                        <div className="capability-text">
                            <h4>Shareable URLs</h4>
                            <p>One-click sharing with encoded links</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">⚙️</div>
                        <div className="capability-text">
                            <h4>Service Configuration</h4>
                            <p>Customize every service parameter</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">📊</div>
                        <div className="capability-text">
                            <h4>Cost Analytics</h4>
                            <p>Detailed breakdown by service & category</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">🔌</div>
                        <div className="capability-text">
                            <h4>Connection Rules</h4>
                            <p>Smart validation of service connections</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <div className="capability-icon">📐</div>
                        <div className="capability-text">
                            <h4>VPC Costing</h4>
                            <p>NAT, Elastic IPs, and data transfer</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Design Your Architecture?</h2>
                    <p>Start building cost-effective AWS solutions in minutes</p>
                    <Link to={user ? "/app" : "/signup"} className="btn-cta">
                        Get Started Free →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="brand-icon">☁️</span>
                        <span className="brand-name">CloudCanvas</span>
                    </div>
                    <p className="footer-tagline">
                        Design. Estimate. Deploy.
                    </p>
                    <p className="footer-copyright">
                        © 2026 CloudCanvas Architect. Built with ❤️ for cloud architects.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
