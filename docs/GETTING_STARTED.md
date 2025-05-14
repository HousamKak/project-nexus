# Getting Started with Project Nexus

Welcome to Project Nexus! This guide will help you get up and running with your visual portfolio operating system.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16.0.0 or higher)
- **npm** (version 8.0.0 or higher)
- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/project-nexus.git
cd project-nexus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm start
```

This will open Project Nexus in your default browser at `http://localhost:3000`.

## First Steps

### Creating Your First Project

1. **Click the + button** in the sidebar or press `Ctrl/Cmd + N`
2. **Fill in the project details**:
   - Project Name (required)
   - Description (optional)
   - Project Path (required)
   - Git URL (optional)
3. **Choose a color theme** for your project planet
4. **Click "Create Project"**

Your new project will appear as a planet in the galaxy view!

### Understanding the Galaxy View

The galaxy view is your main dashboard where projects are displayed as planets:

- **Inner ring**: Active projects (currently being worked on)
- **Middle ring**: Ongoing projects (in maintenance)
- **Outer ring**: Archived/completed projects

#### Navigation Controls

- **Scroll**: Zoom in/out
- **Click and drag**: Pan around the galaxy
- **Click a planet**: Select a project
- **Double-click a planet**: Enter project details

### Adding Files to a Project

There are several ways to add files:

1. **Drag and Drop**:
   - Simply drag files or folders onto the galaxy view
   - Drop them on a specific project planet

2. **Import from Git**:
   - If you provided a Git URL, click "Sync with Git"
   - Files will be automatically imported

3. **Manual Addition**:
   - Select a project
   - Click "Add Files" in the project panel

### Exploring Different Views

Project Nexus offers multiple views to visualize your work:

#### 1. Galaxy View (Default)
- Projects as planets in orbital rings
- Visual overview of all projects
- Quick access to project status

#### 2. Timeline View
- Chronological display of activities
- Filter by project, type, or date
- See patterns in your work habits

#### 3. File Constellation View
- Files displayed as interconnected stars
- Grouped by file type
- Visual representation of dependencies

#### 4. Grid View
- Traditional file/folder structure
- Familiar interface for detailed work
- Quick file operations

### Customizing Your Experience

#### Changing Themes

1. Click the theme toggle button in the navigation
2. Choose from available themes:
   - **Cosmic Dark**: Deep space with neon accents
   - **Terminal Green**: Retro matrix style
   - **Paper Light**: Clean, minimal design
   - **Cyberpunk**: High contrast with effects
   - **Nature**: Earthy, organic tones

#### Adjusting Settings

1. Click the settings icon (gear) in the navigation
2. Configure:
   - General preferences
   - Appearance options
   - Performance settings
   - Backup preferences

## Working with Projects

### Project Operations

- **Update Project**: Right-click on a planet and select "Properties"
- **Archive Project**: Move to outer ring when completed
- **Delete Project**: Right-click and select "Delete" (requires confirmation)
- **Clone Project**: Create a copy with a new name

### Activity Tracking

Project Nexus automatically tracks:
- File changes
- Commits (if Git integrated)
- Documentation updates
- Milestones reached

View these in the Timeline view for insights into your productivity.

### Search and Filter

Use the global search bar to find:
- Projects by name or description
- Files by name or content
- Activities by type or date

## Keyboard Shortcuts

Boost your productivity with these shortcuts:

- `Ctrl/Cmd + N`: New project
- `Ctrl/Cmd + S`: Save current work
- `Ctrl/Cmd + /`: Focus search
- `Alt + 1-4`: Switch between views
- `Escape`: Close modals/deselect
- `+/-`: Zoom in/out
- `Arrow keys`: Pan the view

## Data Management

### Backing Up Your Data

1. Go to Settings → Backup
2. Click "Export All Data"
3. Save the JSON file to a safe location

### Restoring from Backup

1. Go to Settings → Backup
2. Click "Import Data"
3. Select your backup JSON file
4. All projects and settings will be restored

### Storage Information

- All data is stored locally in your browser
- No external servers or cloud services used
- Your data remains private and secure

## Tips and Tricks

### Productivity Tips

1. **Use the Galaxy Heat Map**: Hotter (brighter) planets indicate recent activity
2. **Set Project Status**: Keep your galaxy organized with proper status settings
3. **Tag Projects**: Use tags for easy filtering and searching
4. **Regular Backups**: Export your data weekly for safety

### Visual Customization

1. **Adjust Planet Size**: Based on project importance or size
2. **Custom Colors**: Choose colors that represent project types
3. **Particle Effects**: Enable/disable based on performance needs
4. **Animation Speed**: Adjust in settings for your preference

### Performance Optimization

For large numbers of projects:

1. **Use Filters**: Hide inactive projects
2. **Adjust Render Quality**: Lower for better performance
3. **Disable Particles**: If experiencing lag
4. **Close Unused Views**: Focus on one view at a time

## Troubleshooting

### Common Issues

**Projects not appearing:**
- Refresh the page (F5)
- Check browser console for errors
- Ensure IndexedDB is enabled

**Performance issues:**
- Reduce particle effects
- Lower render quality
- Update graphics drivers
- Use a modern browser

**Import/Export problems:**
- Check file format (must be JSON)
- Ensure file isn't corrupted
- Try smaller exports first

### Getting Help

1. Check the [API Documentation](./API.md)
2. Review the [Architecture Guide](./Architecture.md)
3. Submit issues on GitHub
4. Contact support at projectnexus@example.com

## Advanced Usage

### Integration with Development Tools

Project Nexus can integrate with:
- Git repositories
- VS Code (via extension)
- CI/CD pipelines
- Project management tools

### Extending Project Nexus

Developers can:
- Create custom themes
- Build plugins
- Add visualizations
- Integrate APIs

See the [API Documentation](./API.md) for details.

## What's Next?

Now that you're up and running:

1. **Create a few projects** to populate your galaxy
2. **Explore different views** to find your preference
3. **Customize your theme** for the perfect look
4. **Set up regular backups** for data safety
5. **Learn keyboard shortcuts** for efficiency

Welcome to your new visual portfolio operating system. May your galaxy of projects shine bright!

---

## Quick Reference Card

### Essential Shortcuts
- `Ctrl/Cmd + N`: New project
- `Ctrl/Cmd + S`: Save
- `Escape`: Cancel/Close
- `Alt + 1-4`: Switch views

### Mouse Controls
- **Scroll**: Zoom
- **Drag**: Pan
- **Click**: Select
- **Double-click**: Open

### View Modes
1. Galaxy (Space view)
2. Timeline (Chronological)
3. Constellation (Files)
4. Grid (Traditional)

### Project States
- 🟢 Active (Inner ring)
- 🟡 Ongoing (Middle ring)
- 🔵 Archived (Outer ring)

Happy exploring! 🚀✨