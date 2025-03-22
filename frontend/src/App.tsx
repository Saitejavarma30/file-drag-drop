import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { io } from "socket.io-client";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Folder as FolderIcon,
  ExpandLess,
  ExpandMore,
  Image as ImageIcon,
  MusicNote as MusicIcon,
  Description as DocumentIcon,
  Code as CodeIcon,
  Movie as VideoIcon,
} from "@mui/icons-material";
import { Item, Folder } from "./types";

const API_URL = "http://localhost:5000/api";
const socket = io("http://localhost:5000");

const iconOptions = [
  { name: "Image", icon: <ImageIcon /> },
  { name: "Music", icon: <MusicIcon /> },
  { name: "Document", icon: <DocumentIcon /> },
  { name: "Code", icon: <CodeIcon /> },
  { name: "Video", icon: <VideoIcon /> },
];

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openFolderDialog, setOpenFolderDialog] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("Image");
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, foldersRes] = await Promise.all([
          axios.get(`${API_URL}/items`),
          axios.get(`${API_URL}/folders`),
        ]);
        setItems(itemsRes.data);
        setFolders(foldersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    socket.on("itemAdded", (newItem: Item) => {
      setItems((prevItems) => [...prevItems, newItem]);
    });

    socket.on("folderAdded", (newFolder: Folder) => {
      setFolders((prevFolders) => [...prevFolders, newFolder]);
    });

    socket.on("itemUpdated", (updatedItem: Item) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
    });

    socket.on("folderUpdated", (updatedFolder: Folder) => {
      setFolders((prevFolders) =>
        prevFolders.map((folder) =>
          folder._id === updatedFolder._id ? updatedFolder : folder
        )
      );
    });

    socket.on("reordered", (data: { items: Item[]; folders: Folder[] }) => {
      if (data.items) setItems(data.items);
      if (data.folders) setFolders(data.folders);
    });

    return () => {
      socket.off("itemAdded");
      socket.off("folderAdded");
      socket.off("itemUpdated");
      socket.off("folderUpdated");
      socket.off("reordered");
    };
  }, []);

  const handleAddItem = async () => {
    try {
      await axios.post(`${API_URL}/items`, {
        title: newItemTitle,
        icon: newItemIcon,
        folderId: null,
        order: items.length,
      });
      setNewItemTitle("");
      setNewItemIcon("Image");
      setOpenItemDialog(false);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleAddFolder = async () => {
    try {
      await axios.post(`${API_URL}/folders`, {
        name: newFolderName,
        isOpen: true,
        order: folders.length,
      });
      setNewFolderName("");
      setOpenFolderDialog(false);
    } catch (error) {
      console.error("Error adding folder:", error);
    }
  };

  const toggleFolder = async (folderId: string, isOpen: boolean) => {
    try {
      await axios.put(`${API_URL}/folders/${folderId}`, { isOpen: !isOpen });
    } catch (error) {
      console.error("Error toggling folder:", error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find((option) => option.name === iconName);
    return icon ? icon.icon : <DocumentIcon />;
  };

  const handleDragStart = (result: any) => {
    console.log("Drag start result:", result);
  };

  const handleDragEnd = async (result: any) => {
    console.log("Drag result:", result);
    const { source, destination, draggableId, type } = result;

    if (!destination) {
      console.log("Dropped outside list");
      return;
    }

    if (type === "ITEM") {
      console.log(
        `Moving item from ${source.droppableId} to ${destination.droppableId}`
      );

      const itemsCopy = [...items];

      const draggedItem = itemsCopy.find((item) => item._id === draggableId);
      if (!draggedItem) {
        console.error("Item not found:", draggableId);
        return;
      }

      const newFolderId =
        destination.droppableId === "UNGROUPED_ITEMS"
          ? null
          : destination.droppableId;
      if (source.droppableId === destination.droppableId) {
        const containerItems = itemsCopy.filter(
          (item) =>
            (source.droppableId === "UNGROUPED_ITEMS" &&
              item.folderId === null) ||
            item.folderId === source.droppableId
        );

        const [removed] = containerItems.splice(source.index, 1);
        containerItems.splice(destination.index, 0, removed);

        const updatedItems = itemsCopy.map((item) => {
          if (
            (source.droppableId === "UNGROUPED_ITEMS" &&
              item.folderId === null) ||
            item.folderId === source.droppableId
          ) {
            const index = containerItems.findIndex((i) => i._id === item._id);
            return { ...item, order: index };
          }
          return item;
        });

        setItems(updatedItems);

        try {
          await axios.put(`${API_URL}/reorder`, { items: updatedItems });
        } catch (error) {
          console.error("Error updating item order:", error);
        }
      } else {
        const updatedItem = {
          ...draggedItem,
          folderId: newFolderId,
        };

        const updatedItems = itemsCopy.map((item) =>
          item._id === draggableId ? updatedItem : item
        );

        setItems(updatedItems);
        try {
          await axios.put(`${API_URL}/items/${draggableId}`, {
            folderId: newFolderId,
          });
        } catch (error) {
          console.error("Error updating item:", error);
        }
      }
    }

    if (type === "FOLDER") {
      console.log(
        `Moving folder from index ${source.index} to ${destination.index}`
      );

      if (destination.droppableId === "FOLDERS_LIST") {
        const foldersCopy = [...folders];

        const [removed] = foldersCopy.splice(source.index, 1);

        foldersCopy.splice(destination.index, 0, removed);

        const updatedFolders = foldersCopy.map((folder, index) => ({
          ...folder,
          order: index,
        }));

        setFolders(updatedFolders);

        try {
          await axios.put(`${API_URL}/reorder`, { folders: updatedFolders });
        } catch (error) {
          console.error("Error updating folders:", error);
        }
      }
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Folder Management App
        </Typography>

        <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenItemDialog(true)}
          >
            Add Item
          </Button>
          <Button
            variant="contained"
            startIcon={<FolderIcon />}
            onClick={() => setOpenFolderDialog(true)}
          >
            Add Folder
          </Button>
        </Box>

        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="FOLDERS_LIST" type="FOLDER">
            {(provided) => (
              <Box
                sx={{ mb: 4 }}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <Typography variant="h6" gutterBottom>
                  Folders
                </Typography>
                <div
                  style={{
                    background: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "4px",
                    minHeight: "50px",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "white",
                      p: 1,
                      borderRadius: 1,
                      boxShadow: 1,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <FolderIcon sx={{ mr: 1 }} />
                      <Typography>Ungrouped Items</Typography>
                    </Box>

                    <Droppable droppableId="UNGROUPED_ITEMS" type="ITEM">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{
                            paddingLeft: "20px",
                            minHeight: "30px",
                          }}
                        >
                          {items
                            .filter((item) => item.folderId === null)
                            .sort((a, b) => a.order - b.order)
                            .map((item, index) => (
                              <Draggable
                                key={item._id}
                                draggableId={item._id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      padding: "8px",
                                      marginBottom: "8px",
                                      background: "#f9f9f9",
                                      borderRadius: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    {getIconComponent(item.icon)}
                                    <Typography sx={{ ml: 1 }}>
                                      {item.title}
                                    </Typography>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </Box>

                  {folders
                    .sort((a, b) => a.order - b.order)
                    .map((folder, index) => (
                      <Draggable
                        key={folder._id}
                        draggableId={folder._id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              marginBottom: "8px",
                              ...provided.draggableProps.style,
                            }}
                          >
                            <Box
                              sx={{
                                bgcolor: "white",
                                p: 1,
                                borderRadius: 1,
                                boxShadow: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: folder.isOpen ? 1 : 0,
                                }}
                              >
                                <FolderIcon sx={{ mr: 1 }} />
                                <Typography>{folder.name}</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <IconButton
                                  onClick={() =>
                                    toggleFolder(folder._id, folder.isOpen)
                                  }
                                  size="small"
                                >
                                  {folder.isOpen ? (
                                    <ExpandLess />
                                  ) : (
                                    <ExpandMore />
                                  )}
                                </IconButton>
                              </Box>

                              {folder.isOpen && (
                                <div style={{ paddingLeft: "20px" }}>
                                  <Droppable
                                    droppableId={folder._id}
                                    type="ITEM"
                                  >
                                    {(provided) => (
                                      <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{
                                          minHeight: "30px",
                                          marginBottom: "10px",
                                        }}
                                      >
                                        {items
                                          .filter(
                                            (item) =>
                                              item.folderId === folder._id
                                          )
                                          .sort((a, b) => a.order - b.order)
                                          .map((item, index) => (
                                            <Draggable
                                              key={item._id}
                                              draggableId={item._id}
                                              index={index}
                                            >
                                              {(provided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  style={{
                                                    padding: "8px",
                                                    marginBottom: "8px",
                                                    background: "#f0f0f0",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    boxShadow:
                                                      "0 1px 2px rgba(0,0,0,0.1)",
                                                    ...provided.draggableProps
                                                      .style,
                                                  }}
                                                >
                                                  {getIconComponent(item.icon)}
                                                  <Typography sx={{ ml: 1 }}>
                                                    {item.title}
                                                  </Typography>
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </div>
                              )}
                            </Box>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Title"
            fullWidth
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Icon"
            fullWidth
            value={newItemIcon}
            onChange={(e) => setNewItemIcon(e.target.value)}
            SelectProps={{
              native: true,
            }}
          >
            {iconOptions.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenItemDialog(false)}>Cancel</Button>
          <Button onClick={handleAddItem} disabled={!newItemTitle}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openFolderDialog}
        onClose={() => setOpenFolderDialog(false)}
      >
        <DialogTitle>Add New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleAddFolder} disabled={!newFolderName}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
