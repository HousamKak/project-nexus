# Project Nexus 🌌

> A visual portfolio operating system where your digital creations come alive in an interactive cosmos

![Project Nexus Banner](public/assets/banner.png)

## 🚀 Overview

Project Nexus transforms your project management experience into an interactive galaxy where each project is a planet orbiting in its own ring. Navigate through your work like exploring space, with files as constellations and activities forming timelines across the cosmos.

### ✨ Key Features

- **Galaxy Dashboard**: Projects as planets in orbital rings
  - Active projects in inner orbit
  - Ongoing work in middle orbit
  - Archived projects in outer orbit
- **File Constellation**: Files organized as star clusters
- **Activity Timeline**: Visual chronological view of all activities
- **Multiple Views**: Galaxy, Timeline, Constellation, and Grid views
- **Theme System**: Customizable visual themes (Cosmic Dark, Terminal Green, etc.)
- **Offline Support**: Work without internet connection
- **Real-time Updates**: Smooth animations and transitions
- **Drag & Drop**: Easy file and project management

## 🛠️ Tech Stack

- **TypeScript**: Type-safe development
- **Canvas API**: Smooth 2D graphics rendering
- **IndexedDB**: Local data persistence
- **Service Workers**: Offline functionality
- **Webpack**: Module bundling
- **No Framework Dependencies**: Pure vanilla implementation

## 📦 Installation

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/project-nexus.git
cd project-nexus
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

The application will open at `http://localhost:3001`

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Project Structure

```
project-nexus/
├── src/
│   ├── types/          # TypeScript interfaces
│   ├── core/           # Core components
│   ├── utils/          # Utility functions
│   ├── themes/         # Theme configurations
│   ├── styles/         # CSS files
│   ├── app.ts          # Main application
│   └── index.html      # Entry HTML
├── tests/              # Test files
├── public/             # Static assets
├── dist/               # Build output
└── docs/               # Documentation
```

## 🎨 Themes

Project Nexus comes with multiple themes:

- **Cosmic Dark**: Deep space with neon accents
- **Terminal Green**: Retro matrix-style
- **Paper Light**: Clean, minimal white
- **Cyberpunk**: High contrast with glitch effects
- **Nature**: Earthy tones with organic shapes

### Creating Custom Themes

```typescript
import { createTheme } from './themes/base-theme';

export const myTheme = createTheme(
  'my-theme',
  'My Custom Theme',
  'A beautiful custom theme',
  {
    colors: {
      backgroundPrimary: '#0A0B0F',
      // ... other color overrides
    }
  }
);
```

## 🧩 Core Components

### GalaxyView

The main visualization component that renders projects as planets:

```typescript
const galaxy = new GalaxyView(canvas, theme);
galaxy.addProject(project);
galaxy.focusProject(projectId);
```

### StorageManager

Handles all data persistence using IndexedDB:

```typescript
const storage = new StorageManager();
await storage.saveProject(project);
const projects = await storage.getAllProjects();
```

### AnimationManager

Manages smooth animations throughout the app:

```typescript
const animator = new AnimationManager();
animator.animate('projectAdd', {
  duration: 1000,
  easing: 'easeOutElastic',
  onUpdate: (value) => console.log(value)
});
```

## 🎮 Controls

### Keyboard Shortcuts

- `Ctrl/Cmd + N`: New project
- `Ctrl/Cmd + S`: Save current work
- `Ctrl/Cmd + /`: Focus search
- `Alt + 1-4`: Switch views
- `Escape`: Close modals
- `+/-`: Zoom in/out
- `Arrow Keys`: Pan view

### Mouse Controls

- `Scroll`: Zoom
- `Click & Drag`: Pan
- `Click`: Select project
- `Double Click`: Enter project

## 🔐 Data Privacy

All data is stored locally in your browser using IndexedDB. No data is sent to external servers. You have full control over your project information.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by space visualization and sci-fi interfaces
- Built with love for developers who appreciate beautiful tools
- Special thanks to all contributors

## 🚧 Roadmap

- [ ] Git integration
- [ ] Cloud sync options
- [ ] Collaboration features
- [ ] AI-powered insights
- [ ] Mobile app
- [ ] Plugin system
- [ ] Export to various formats
- [ ] Advanced analytics

## 📧 Contact

Project Nexus Team - [projectnexus@example.com](mailto:projectnexus@example.com)

Project Link: [https://github.com/yourusername/project-nexus](https://github.com/yourusername/project-nexus)

---

Made with ❤️ by developers, for developers