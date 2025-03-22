# file-drag-drop

A full-stack web application that allows users to organize items into folders with real-time synchronization across multiple sessions. Built with React, TypeScript, Node.js, MongoDB, and Socket.IO.

## Features

- **Item Management**: Add items with customizable icons and titles
- **Folder Organization**: Group items into folders with names
- **Drag and Drop**: Reorder items and folders using intuitive drag-and-drop functionality
- **Nested Organization**: Move items between folders or to the main page
- **Folder Toggle**: Expand or collapse folders to show or hide their contents
- **Persistence**: All changes are saved to the database and persist between sessions
- **Real-time Synchronization**: Changes made in one session are instantly reflected in all other open sessions

## Technology Stack

### Frontend

- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for better development experience
- **Material UI**: Component library for consistent and responsive design
- **react-beautiful-dnd**: Library for drag-and-drop functionality
- **Socket.IO Client**: Real-time communication with the backend
- **Axios**: HTTP client for API requests

### Backend

- **Node.js**: JavaScript runtime for the server
- **Express**: Web framework for handling HTTP requests
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB
- **Socket.IO**: Real-time bidirectional event-based communication
- **CORS**: Cross-Origin Resource Sharing middleware

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. Clone the repository and navigate to the backend directory:

```bash
git clone https://github.com/yourusername/file-drag-drop.git
cd file-drag-drop/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory with the following content:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/file-drag-drop
```

Note: Replace the MongoDB URI with your own if using MongoDB Atlas.

4. Start the backend server:

```bash
npm start
```

The server will run on http://localhost:5000.

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend development server:

```bash
npm start
```

The application will open in your browser at http://localhost:3000.

## Implementation Details

### Data Models

#### Item

```javascript
{
  _id: ObjectId,
  title: String,
  icon: String,
  folderId: ObjectId | null,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Folder

```javascript
{
  _id: ObjectId,
  name: String,
  isOpen: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| GET    | /api/items       | Get all items             |
| GET    | /api/folders     | Get all folders           |
| POST   | /api/items       | Create a new item         |
| POST   | /api/folders     | Create a new folder       |
| PUT    | /api/items/:id   | Update an item            |
| PUT    | /api/folders/:id | Update a folder           |
| PUT    | /api/reorder     | Reorder items and folders |

### Socket.IO Events

The application uses Socket.IO for real-time communication between the server and clients. Here are the events used:

#### Server to Client Events

- `itemAdded`: Emitted when a new item is added
- `folderAdded`: Emitted when a new folder is added
- `itemUpdated`: Emitted when an item is updated
- `folderUpdated`: Emitted when a folder is updated
- `reordered`: Emitted when items or folders are reordered

#### Client to Server Events

- `connection`: Established when a client connects
- `disconnect`: Triggered when a client disconnects

### Drag and Drop Implementation

The drag-and-drop functionality is implemented using the `react-beautiful-dnd` library. The implementation handles:

1. **Reordering items within the same container**: When an item is dragged and dropped within the same container (main page or folder), its order is updated.

2. **Moving items between containers**: When an item is dragged from one container to another (e.g., from the main page to a folder or vice versa), its `folderId` is updated.

3. **Reordering folders**: When a folder is dragged and dropped, its order is updated.

The drag-and-drop operations are optimized to:

- Prevent multiple simultaneous drags
- Disable state updates during drag operations
- Handle errors gracefully with automatic data refresh
- Provide visual feedback during drag operations

### Real-time Synchronization

Real-time synchronization is achieved using Socket.IO:

1. When a user makes a change (add, update, reorder), the change is first sent to the server via an HTTP request.
2. The server processes the request, updates the database, and emits a Socket.IO event to all connected clients.
3. All clients receive the event and update their state accordingly.

To prevent conflicts during drag operations, the application:

- Temporarily disables Socket.IO event handlers during drag operations
- Re-enables them once the drag operation is complete
- Refreshes data from the server if an update fails

## Usage Guide

### Adding Items and Folders

1. Click the "Add Item" button to create a new item:

   - Enter a title
   - Select an icon
   - Click "Add"

2. Click the "Add Folder" button to create a new folder:
   - Enter a name
   - Click "Add"

### Organizing Items

1. **Move an item to a folder**: Drag the item from the main page and drop it into a folder.
2. **Move an item out of a folder**: Drag the item from the folder and drop it onto the main page.
3. **Reorder items**: Drag and drop items within the same container to change their order.
4. **Reorder folders**: Drag and drop folders to change their order.

### Managing Folders

1. **Open/Close a folder**: Click the expand/collapse icon on a folder to toggle its state.
2. **View folder contents**: When a folder is open, its contents are displayed below the folder name.

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct.
- **Port Already in Use**: Change the PORT in the .env file if port 5000 is already in use.

### Frontend Issues

- **Socket.IO Connection Error**: Ensure the backend server is running and accessible.
- **Drag and Drop Issues**: If drag and drop operations fail, try refreshing the page.
- **"Unable to find draggable with id" Error**: This can occur during simultaneous drag operations or when state updates during a drag. The application includes safeguards to prevent this, but if it occurs, refresh the page.

## Performance Considerations

The application is optimized for performance in several ways:

1. **Efficient Database Queries**: Using MongoDB's bulk operations for batch updates.
2. **Optimized React Rendering**: Using memoization and careful state management.
3. **Throttled Socket.IO Events**: Preventing excessive state updates during drag operations.
4. **Error Recovery**: Automatic data refresh if updates fail.

## Security Considerations

While this is a demo application, in a production environment, you should consider:

1. **Authentication**: Implementing user authentication and authorization.
2. **Input Validation**: Adding more robust validation for user inputs.
3. **Rate Limiting**: Preventing abuse of the API endpoints.
4. **HTTPS**: Using HTTPS for all communications.

## Future Enhancements

Potential improvements for the application:

1. **User Authentication**: Add multi-user support with authentication.
2. **Item Deletion**: Add the ability to delete items and folders.
3. **Item Editing**: Allow users to edit existing items and folders.
4. **Search Functionality**: Add the ability to search for items and folders.
5. **Nested Folders**: Support for folders within folders.
6. **Drag Selection**: Allow selecting and dragging multiple items at once.
7. **Undo/Redo**: Add undo and redo functionality for user actions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) for the drag-and-drop functionality
- [Socket.IO](https://socket.io/) for real-time communication
- [Material UI](https://mui.com/) for the UI components
