import ServicePalette from './components/ServicePalette';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <div className="header-left">
                    <h1>☁️ CloudCanvas Architect</h1>
                </div>
            </header>

            <main className="app-main">
                <aside className="sidebar-left">
                    <ServicePalette />
                </aside>

                <section className="canvas-section">
                    <div className="canvas-placeholder">
                        <p>🎨 Canvas</p>
                        <p>Drag services from the left panel!</p>
                    </div>
                </section>

                <aside className="sidebar-right">
                    <div className="cost-placeholder">
                        <h3>💰 Cost Panel</h3>
                    </div>
                </aside>
            </main>

            <footer className="app-footer">
                <p>Drag AWS services • Connect them • Get instant cost estimates</p>
            </footer>
        </div>
    );
}

export default App;
